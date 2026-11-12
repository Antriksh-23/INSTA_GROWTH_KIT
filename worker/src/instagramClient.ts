/**
 * instagramClient — Thin wrapper around Meta Graph API calls.
 *
 * Implements:
 * - getComments(mediaId, env, options)
 * - sendPrivateReply(commentId, message, env, options)
 * - sendDM(userId, message, env, options)
 * - getConversations(userId, env, options)
 *
 * Handles HTTP 429 rate-limiting with exponential backoff (max 3 retries).
 */

import type { Comment, Env } from './types';

export const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

export interface ClientOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  fetchFn?: typeof fetch;
  sleepFn?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a fetch request with automatic exponential backoff on HTTP 429 (rate-limit).
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options?: ClientOptions,
): Promise<Response> {
  const maxRetries = options?.maxRetries ?? 3;
  const initialDelay = options?.initialDelayMs ?? 500;
  const runFetch = options?.fetchFn ?? fetch;
  const sleep = options?.sleepFn ?? defaultSleep;

  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await runFetch(url, init);
    lastResponse = response;

    if (response.status === 429) {
      if (attempt < maxRetries) {
        // Exponential backoff: initialDelay * 2^attempt
        const delay = initialDelay * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      throw new Error(`Meta API rate limit exceeded (HTTP 429) after ${maxRetries} retries.`);
    }

    return response;
  }

  return lastResponse!;
}

/**
 * Fetches comments for a specific Media ID.
 */
export async function getComments(
  mediaId: string,
  env: Env,
  options?: ClientOptions,
): Promise<Comment[]> {
  if (!mediaId) {
    throw new Error('Media ID is required to fetch comments.');
  }
  if (!env.INSTAGRAM_ACCESS_TOKEN) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN is missing in environment.');
  }

  const endpoint = `${GRAPH_API_BASE}/${mediaId}/comments?fields=id,from,text,timestamp&access_token=${encodeURIComponent(
    env.INSTAGRAM_ACCESS_TOKEN,
  )}`;

  const response = await fetchWithRetry(
    endpoint,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    },
    options,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch comments (HTTP ${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    data?: Array<{
      id: string;
      from?: { id: string; username: string };
      text?: string;
      timestamp?: string;
    }>;
  };

  const rawList = data.data || [];
  return rawList.map((c) => ({
    id: c.id,
    comment_id: c.id,
    from_id: c.from?.id || '',
    from_username: c.from?.username || '',
    text: c.text || '',
    timestamp: c.timestamp || new Date().toISOString(),
  }));
}

/**
 * Sends a single private reply to an eligible comment on a Reel.
 * Uses Meta Graph API POST /{comment-id}/private_replies
 */
export async function sendPrivateReply(
  commentId: string,
  message: string,
  env: Env,
  options?: ClientOptions,
): Promise<void> {
  if (!commentId) {
    throw new Error('commentId is required to send a private reply.');
  }
  if (!message) {
    throw new Error('message is required to send a private reply.');
  }
  if (!env.INSTAGRAM_ACCESS_TOKEN) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN is missing in environment.');
  }

  const endpoint = `${GRAPH_API_BASE}/${commentId}/private_replies`;

  const response = await fetchWithRetry(
    endpoint,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.INSTAGRAM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    },
    options,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send private reply (HTTP ${response.status}): ${errorText}`);
  }
}

/**
 * Sends a direct message to a user via Messenger / Instagram Messaging API.
 * Uses Meta Graph API POST /me/messages
 */
export async function sendDM(
  userId: string,
  message: string,
  env: Env,
  options?: ClientOptions,
): Promise<void> {
  if (!userId) {
    throw new Error('userId is required to send a DM.');
  }
  if (!message) {
    throw new Error('message is required to send a DM.');
  }
  if (!env.INSTAGRAM_ACCESS_TOKEN) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN is missing in environment.');
  }

  const endpoint = `${GRAPH_API_BASE}/me/messages`;

  const response = await fetchWithRetry(
    endpoint,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.INSTAGRAM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: userId },
        message: { text: message },
      }),
    },
    options,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send DM (HTTP ${response.status}): ${errorText}`);
  }
}

/**
 * Fetches recent conversations for a user / page.
 */
export async function getConversations(
  userId: string,
  env: Env,
  options?: ClientOptions,
): Promise<any[]> {
  if (!env.INSTAGRAM_ACCESS_TOKEN) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN is missing in environment.');
  }

  const endpoint = `${GRAPH_API_BASE}/me/conversations?access_token=${encodeURIComponent(
    env.INSTAGRAM_ACCESS_TOKEN,
  )}`;

  const response = await fetchWithRetry(
    endpoint,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    },
    options,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get conversations (HTTP ${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { data?: any[] };
  return data.data || [];
}
