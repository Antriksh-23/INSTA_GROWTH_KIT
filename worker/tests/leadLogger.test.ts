import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appendLead,
  base64UrlEncode,
  getGoogleAccessToken,
  pemToPkcs8Der,
  resetTokenCache,
  stringToBase64Url,
} from '../src/leadLogger';
import { leadRowToArray, type Env, type LeadRow } from '../src/types';
import { createMockEnv, MockKVNamespace } from './helpers/mockKv';

describe('Sub-Phase 4B — leadLogger & Google Sheets Append Tests', () => {
  let mockKv: MockKVNamespace;
  let mockEnv: Env;

  const sampleLeadRow: LeadRow = {
    timestamp: '2026-11-12T10:00:00.000Z',
    username: 'rohit_lifts',
    userId: 'user_101',
    commentText: 'PRICE please',
    intent: 'price_request',
    replySent: 'Yes',
    followUpQuestion: '',
    needsOwner: false,
    status: 'open',
  };

  const sampleHandoffLeadRow: LeadRow = {
    timestamp: '2026-11-12T10:05:00.000Z',
    username: 'priya_fitness',
    userId: 'user_102',
    commentText: '',
    intent: 'question',
    replySent: 'Yes',
    followUpQuestion: 'Can I get a 50% discount coupon code?',
    needsOwner: true,
    status: 'open',
  };

  beforeEach(() => {
    mockKv = new MockKVNamespace();
    resetTokenCache();
    mockEnv = createMockEnv({
      REPLY_STORE: mockKv as unknown as KVNamespace,
      LEAD_SHEET_ID: 'mock-sheet-12345',
      GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({
        client_email: 'test-sa@project.iam.gserviceaccount.com',
        private_key:
          '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCi9eidjJkb2HAn\n1cM7rFmml8nVaS22pRqGjRbZiQtw/LO15CXoxPr6bQnz6PYA5rPI/LlgX5I0HvZt\nMCT/TZ1hFxdMCeWyBcqp1zdLJ+8O6zSXRczYzQWIXNGKXahJ+XHJpVvE0hn2afF/\njyllth3ewN54YRwW0SgSRkjUq0Zxo78lScZ1UCPF4PHOI9vWNRU6/kG9oOzY1u3t\nz5yJZ9U+/GlN/ZS3+n95OgqNo82I1wuS80A6pa8lYvki4hN2gqIyqZQZOdPC9quw\nd6SrasO3NkfZ6TomuTc99dqD78mXNiO+GsgVeyntLJZzR726DmIxJaMtvuQOlJZg\n7eF20Mr/AgMBAAECggEAJdOYAc4rkiOc8Ro0/cqFat6r+o42DsHnVNk2NxuRHNKD\nspJ5XD0xFuUtnMD0LYRfsiU7sIuup8uSHwlAZUSyZeGSxlM7zqV6hA8RZjAoVRmy\ntPR+VsrMYHlPKGOSF03AJHLuSNMONL0l0hq8nL/30geJ/H5qIz+8ofVPnZH+QY1G\nkFLZ0sX4Tfl+dY87YLbGBiCI2aEyi0UeylSfzbjHrFVlsKGbn4SwHgQg7IlmOadQ\n4bUl7zrkKrQXd4V/bVwXbbPr+Kt0FXCVZ29oC39HAaLhbErltAdkqCbJajViZftK\nWQeODGr3v1ClATacFP8nZ/fiLGzcsCxH4tFo8Y9nyQKBgQDP899bUphl3fmnl1Js\nK5m+zOpDCNBgrYo7yOEEQ935xApM+QusgFqYREi4Geg8b31EVlrHmBajsfuxjygH\nl2vARcVX59oRtF/f1DBAxtujFE5JWA0Htsh8V3RZd5jrYsBK9OdWnGxpVQ0+xdNX\nTlIXt4AtKed04VEnN5hfwRIn1wKBgQDInNCsSL6j3XTeAepND10NXQNk7UXN0RbC\noN1+uppZzuJKrSdZcbO/85GyS3C8SbKWvuNQA3vt91DcifmxFdkmzpHMhwGGHdMA\niFngWzWzt4Or5Pb/AL73PMbk8wQjcExo+2JtLHjPR9HcGgDk8T87uSBHmxoQW3uW\n0vMVCJNxGQKBgFI8cf7OWgAm2TzCZdDrKSDALoAV8znYRws/dGTYZecI9L3d2xT7\nqVf/4PYVILcNq+8ja0D1TzarAwsDvuPJqM3fiZwqzx0jRKriYbasLV1/gToV/Qko\n6n3po9RhrHKhmcPKt9WThHffL568Yshq66H/akvx/1tEY3Br1vE/C+v/AoGBAKHD\nwYiLCB6+fnReev40e0ZBUHFb2sPB7GZ4rOJ5uejdKCArS+WWB+mqkDuDFZ7eloFz\n33wvswkKOkv7fjpLcdUXEP4phxMMjY6KZF7DbaRDQIulj33ErjhS69bGFvo0nYix\n3IZILAqI0TJ4TWxPFDwmZV8YNIYoHppZ8+VsCuhRAoGAUy+/VR4Z+/88mxgvPLZU\nQ0zejEsnWblK/p5vhhEGO4Rbk3hm0r9VXf022xSvLa6LVl/7q0Lgw+KN3ytIFHLO\n5uCiBnbE4S8C+w0XTvfBcPJ5qkOEkBuMOZGi6Z74EpgUq/i309jy9nNlu/4KMekK\nXhx9ZmtK77t1kwdprGAy6OQ=\n-----END PRIVATE KEY-----\n',
      }),
    });
  });

  // ── 1. 9-Column Schema Validation ────────────────────────────────────
  it('should transform LeadRow into exactly 9 columns matching the architecture', () => {
    const arrayOutput = leadRowToArray(sampleLeadRow);
    expect(arrayOutput).toHaveLength(9);
    expect(arrayOutput).toEqual([
      '2026-11-12T10:00:00.000Z', // Timestamp
      'rohit_lifts',              // Username
      'user_101',                // User ID
      'PRICE please',            // Comment
      'price_request',           // Intent
      'Yes',                     // Reply Sent
      '',                        // Follow-up
      false,                     // Needs Owner
      'open',                    // Status
    ]);
  });

  it('should properly format Needs Owner as TRUE for handoff inquiries', () => {
    const arrayOutput = leadRowToArray(sampleHandoffLeadRow);
    expect(arrayOutput).toHaveLength(9);
    expect(arrayOutput[7]).toBe(true);
    expect(arrayOutput[6]).toBe('Can I get a 50% discount coupon code?');
  });

  // ── 2. WebCrypto Helper Functions ────────────────────────────────────
  it('should encode base64url and strings without padding or special characters', () => {
    const encoded = stringToBase64Url('{"alg":"RS256"}');
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });

  it('should convert PKCS#8 PEM to Uint8Array Der bytes correctly', () => {
    const pem = '-----BEGIN PRIVATE KEY-----\nMIIBVAIBADANBgkqhkiG9w0BAQEFAASCAT4wggE6AgEAAkEA\n-----END PRIVATE KEY-----';
    const der = pemToPkcs8Der(pem);
    expect(der).toBeInstanceOf(Uint8Array);
    expect(der.length).toBeGreaterThan(0);
  });

  // ── 3. Append to Sheet & Mock API ────────────────────────────────────
  it('should successfully exchange token and append row to Google Sheets endpoint', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('oauth2.googleapis.com/token')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: 'mock-google-token-xyz', expires_in: 3600 }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      if (url.includes('sheets.googleapis.com')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              updates: {
                spreadsheetId: 'mock-sheet-12345',
                updatedRange: 'Leads!A2:I2',
                updatedRows: 1,
                updatedColumns: 9,
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    const result = await appendLead(sampleLeadRow, mockEnv, {
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(result.success).toBe(true);
    expect(result.appended).toBe(true);

    // Verify 2 calls: 1 token exchange + 1 spreadsheet append
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const appendCall = mockFetch.mock.calls[1];
    expect(appendCall[0]).toContain(
      'sheets.googleapis.com/v4/spreadsheets/mock-sheet-12345/values/Leads!A1:I1:append?valueInputOption=USER_ENTERED',
    );
    expect(appendCall[1]?.headers).toMatchObject({
      Authorization: 'Bearer mock-google-token-xyz',
      'Content-Type': 'application/json',
    });

    const bodyObj = JSON.parse(appendCall[1]?.body as string);
    expect(bodyObj.values[0]).toHaveLength(9);
    expect(bodyObj.values[0][1]).toBe('rohit_lifts');
  });

  // ── 4. Token Caching ─────────────────────────────────────────────────
  it('should reuse cached access token across multiple append calls', async () => {
    let tokenCallCount = 0;
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('oauth2.googleapis.com/token')) {
        tokenCallCount++;
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: 'cached-token-123', expires_in: 3600 }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ updates: { updatedRows: 1 } }), { status: 200 }));
    });

    await appendLead(sampleLeadRow, mockEnv, { fetchFn: mockFetch as unknown as typeof fetch });
    await appendLead(sampleHandoffLeadRow, mockEnv, { fetchFn: mockFetch as unknown as typeof fetch });

    // Token call should only happen once because token is cached for 1 hour
    expect(tokenCallCount).toBe(1);
  });

  // ── 5. Deduplication Guard ───────────────────────────────────────────
  it('should prevent duplicate lead rows from being appended twice', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('oauth2.googleapis.com/token')) {
        return Promise.resolve(new Response(JSON.stringify({ access_token: 'mock-token' }), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify({ updates: { updatedRows: 1 } }), { status: 200 }));
    });

    // 1st append -> should append
    const res1 = await appendLead(sampleLeadRow, mockEnv, {
      fetchFn: mockFetch as unknown as typeof fetch,
    });
    expect(res1.appended).toBe(true);

    // 2nd append with exact same user and comment -> should be skipped by dedup guard
    const res2 = await appendLead(sampleLeadRow, mockEnv, {
      fetchFn: mockFetch as unknown as typeof fetch,
    });
    expect(res2.appended).toBe(false);
    expect(res2.reason).toBe('duplicate');

    // Only 1 append call made to Google Sheets (plus 1 token call)
    const sheetCalls = mockFetch.mock.calls.filter((c) =>
      (c[0] as string).includes('sheets.googleapis.com'),
    );
    expect(sheetCalls).toHaveLength(1);
  });

  // ── 6. Error & Missing Config Handling ───────────────────────────────
  it('should gracefully handle missing LEAD_SHEET_ID without crashing', async () => {
    const missingSheetEnv = { ...mockEnv, LEAD_SHEET_ID: '' };
    const res = await appendLead(sampleLeadRow, missingSheetEnv);
    expect(res.success).toBe(false);
    expect(res.appended).toBe(false);
    expect(res.reason).toBe('missing_sheet_id');
  });

  it('should gracefully handle missing GOOGLE_SERVICE_ACCOUNT_JSON', async () => {
    const missingCredsEnv = { ...mockEnv, GOOGLE_SERVICE_ACCOUNT_JSON: '{}' };
    const res = await appendLead(sampleLeadRow, missingCredsEnv);
    expect(res.success).toBe(false);
    expect(res.appended).toBe(false);
    expect(res.reason).toBe('missing_credentials');
  });
});
