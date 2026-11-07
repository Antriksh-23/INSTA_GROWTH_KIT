/**
 * followUpHandler — Answers follow-up DMs using only
 * owner-approved facts from factCard.json.
 */

import type { Env } from './types';

export interface FollowUpResult {
  reply: string;
  needs_handoff: boolean;
}

export async function handleFollowUp(
  customerMessage: string,
  env: Env,
): Promise<FollowUpResult> {
  // TODO: Implement in Phase 4A
  return {
    reply: 'Great question! The owner will get back to you shortly. 🙏',
    needs_handoff: true,
  };
}
