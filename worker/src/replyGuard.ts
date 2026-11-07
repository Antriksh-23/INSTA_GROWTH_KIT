/**
 * replyGuard — 5-step gate before any private message is sent.
 *
 * Checks: intent eligibility, 7-day window, blocklist,
 * duplicate guard, blocked terms.
 */

import type { ClassifiedComment, Env, ReplyGuardResult } from './types';

export async function checkReplyEligibility(
  comment: ClassifiedComment,
  env: Env,
): Promise<ReplyGuardResult> {
  // TODO: Implement in Phase 3D
  return { allowed: false, reason: 'Not implemented' };
}
