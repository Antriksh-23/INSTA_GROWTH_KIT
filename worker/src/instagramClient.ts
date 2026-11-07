/**
 * instagramClient — Thin wrapper around Meta Graph API calls.
 *
 * Handles rate-limit errors (HTTP 429) with exponential backoff.
 */

import type { Comment, Env } from './types';

export async function getComments(
  mediaId: string,
  env: Env,
): Promise<Comment[]> {
  // TODO: Implement in Phase 3A
  return [];
}

export async function sendPrivateReply(
  commentId: string,
  message: string,
  env: Env,
): Promise<void> {
  // TODO: Implement in Phase 3A
}

export async function sendDM(
  userId: string,
  message: string,
  env: Env,
): Promise<void> {
  // TODO: Implement in Phase 3A
}

export async function getConversations(
  userId: string,
  env: Env,
): Promise<any[]> {
  // TODO: Implement in Phase 3A
  return [];
}
