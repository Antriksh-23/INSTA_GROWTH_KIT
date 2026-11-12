/**
 * leadLogger — Appends customer leads and interaction records to Google Sheets.
 *
 * Implements:
 * - 9-column standard lead schema:
 *   [Timestamp, Username, User ID, Comment, Intent, Reply Sent, Follow-up, Needs Owner, Status]
 * - Edge-compatible Google Service Account OAuth2 JWT authentication using Web Crypto API.
 * - In-memory access token caching with expiration to optimize API calls.
 * - Deduplication guard via Cloudflare KV store (REPLY_STORE).
 */

import { leadRowToArray, type Env, type LeadRow } from './types';

export interface LeadLoggerOptions {
  fetchFn?: typeof fetch;
  skipDedup?: boolean;
}

export interface LeadLoggerResult {
  success: boolean;
  appended: boolean;
  row: LeadRow;
  reason?: string;
}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

// In-memory token cache for worker lifecycle
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Base64URL encoder compatible with Cloudflare Workers and Node.js Web Crypto.
 */
export function base64UrlEncode(buffer: Uint8Array | ArrayBuffer): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Encodes a string to Base64URL.
 */
export function stringToBase64Url(str: string): string {
  const encoder = new TextEncoder();
  return base64UrlEncode(encoder.encode(str));
}

/**
 * Converts a PEM encoded PKCS#8 private key to a binary DER Uint8Array.
 */
export function pemToPkcs8Der(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates a signed Google OAuth2 service account JWT using Web Crypto API.
 */
export async function createGoogleJwt(
  clientEmail: string,
  privateKeyPem: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: nowSeconds + 3600,
    iat: nowSeconds,
  };

  const encodedHeader = stringToBase64Url(JSON.stringify(header));
  const encodedClaims = stringToBase64Url(JSON.stringify(claims));
  const unsignedPayload = `${encodedHeader}.${encodedClaims}`;

  const derKey = pemToPkcs8Der(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    derKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedPayload),
  );

  const encodedSignature = base64UrlEncode(signatureBuffer);
  return `${unsignedPayload}.${encodedSignature}`;
}

/**
 * Retrieves a valid Google OAuth2 Bearer access token for the service account.
 */
export async function getGoogleAccessToken(
  serviceAccountJson: string,
  options?: { fetchFn?: typeof fetch; forceRefresh?: boolean },
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if valid for at least 5 more minutes
  if (!options?.forceRefresh && cachedAccessToken && tokenExpiresAt > now + 300) {
    return cachedAccessToken;
  }

  let creds: ServiceAccountKey;
  try {
    creds = JSON.parse(serviceAccountJson) as ServiceAccountKey;
  } catch (err) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: unable to parse JSON');
  }

  if (!creds.client_email || !creds.private_key) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: client_email or private_key missing');
  }

  const jwt = await createGoogleJwt(creds.client_email, creds.private_key, now);
  const tokenUrl = creds.token_uri || 'https://oauth2.googleapis.com/token';
  const runFetch = options?.fetchFn ?? fetch;

  const res = await runFetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google OAuth2 token exchange failed (HTTP ${res.status}): ${errorText}`);
  }

  const tokenData = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!tokenData.access_token) {
    throw new Error('Google OAuth2 response did not contain access_token');
  }

  cachedAccessToken = tokenData.access_token;
  tokenExpiresAt = now + (tokenData.expires_in || 3600);

  return cachedAccessToken;
}

/**
 * Resets the in-memory token cache (useful for testing).
 */
export function resetTokenCache(): void {
  cachedAccessToken = null;
  tokenExpiresAt = 0;
}

/**
 * Appends a lead row to Google Sheets with 9 columns.
 * Enforces deduplication using KV store if available.
 */
export async function appendLead(
  row: LeadRow,
  env: Env,
  options?: LeadLoggerOptions,
): Promise<LeadLoggerResult> {
  // Validate that required env vars exist
  if (!env.LEAD_SHEET_ID) {
    console.warn('[LeadLogger] LEAD_SHEET_ID is missing; skipping append.');
    return { success: false, appended: false, row, reason: 'missing_sheet_id' };
  }

  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON || env.GOOGLE_SERVICE_ACCOUNT_JSON === '{}') {
    console.warn('[LeadLogger] GOOGLE_SERVICE_ACCOUNT_JSON is missing; skipping append.');
    return { success: false, appended: false, row, reason: 'missing_credentials' };
  }

  // ── Deduplication Guard ──────────────────────────────────────────────
  if (!options?.skipDedup && env.REPLY_STORE) {
    const interactionKey = row.followUpQuestion
      ? `lead_followup:${row.userId}:${row.followUpQuestion.trim().toLowerCase()}`
      : `lead_comment:${row.userId}:${row.commentText.trim().toLowerCase()}`;

    try {
      const existing = await env.REPLY_STORE.get(interactionKey);
      if (existing) {
        console.log(`[LeadLogger] Duplicate lead detected (${interactionKey}), skipping.`);
        return { success: true, appended: false, row, reason: 'duplicate' };
      }
      // Record in KV with 30-day TTL (2,592,000 seconds)
      await env.REPLY_STORE.put(interactionKey, row.timestamp, { expirationTtl: 2592000 });
    } catch (kvErr) {
      console.warn('[LeadLogger] Non-fatal KV dedup error:', kvErr);
    }
  }

  // ── Google Sheets API Append ─────────────────────────────────────────
  const runFetch = options?.fetchFn ?? fetch;
  const accessToken = await getGoogleAccessToken(env.GOOGLE_SERVICE_ACCOUNT_JSON, {
    fetchFn: runFetch,
  });

  const rowValues = leadRowToArray(row);
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${env.LEAD_SHEET_ID}/values/Leads!A1:I1:append?valueInputOption=USER_ENTERED`;

  const response = await runFetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to append row to Google Sheets (HTTP ${response.status}): ${errorBody}`);
  }

  console.log(`[LeadLogger] Successfully appended lead row to sheet for @${row.username}`);
  return { success: true, appended: true, row };
}
