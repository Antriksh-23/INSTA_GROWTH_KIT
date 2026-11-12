/**
 * commentFetcher — Fetches new comments from the target Reel.
 *
 * Uses a cursor stored in KV (REPLY_STORE) to track the watermark
 * and avoid reprocessing old comments.
 */

import type { Comment, Env } from './types';
import { getComments, type ClientOptions } from './instagramClient';

export const CURSOR_KV_KEY = 'comment_cursor';

export interface CommentFetcherOptions {
  clientOptions?: ClientOptions;
  commentsGetter?: (mediaId: string, env: Env) => Promise<Comment[]>;
}

/**
 * Fetches new comments on the Reel specified by env.MEDIA_ID.
 * Advances the watermark cursor in KV.
 */
export async function fetchNewComments(
  env: Env,
  options?: CommentFetcherOptions,
): Promise<Comment[]> {
  const mediaId = env.MEDIA_ID;
  if (!mediaId) {
    throw new Error('MEDIA_ID is not configured in environment.');
  }

  // 1. Retrieve the existing cursor/watermark from KV
  const lastCursor = await env.REPLY_STORE.get(CURSOR_KV_KEY);

  // 2. Fetch comments using injected getter or default instagramClient
  const fetcher = options?.commentsGetter ?? ((m, e) => getComments(m, e, options?.clientOptions));
  const comments = await fetcher(mediaId, env);

  if (!comments || comments.length === 0) {
    return [];
  }

  // 3. Sort comments in chronological order (oldest first)
  const sorted = [...comments].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  let newComments: Comment[] = [];

  if (lastCursor) {
    const cursorTime = new Date(lastCursor).getTime();
    newComments = sorted.filter((c) => new Date(c.timestamp).getTime() > cursorTime);
  } else {
    // First run: return all fetched comments
    newComments = sorted;
  }

  // 4. If there are new comments, advance cursor to the newest comment's timestamp
  if (newComments.length > 0) {
    const latestTimestamp = newComments[newComments.length - 1].timestamp;
    await env.REPLY_STORE.put(CURSOR_KV_KEY, latestTimestamp);
  }

  return newComments;
}
