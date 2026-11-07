/**
 * commentFetcher — Fetches new comments from the target Reel.
 *
 * Uses a cursor stored in KV to avoid reprocessing old comments.
 */

import type { Comment, Env } from './types';

export async function fetchNewComments(env: Env): Promise<Comment[]> {
  // TODO: Implement in Phase 3B
  return [];
}
