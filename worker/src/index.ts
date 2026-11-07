/**
 * Insta Growth Kit — Cloudflare Worker entry point.
 *
 * Cron handler: fetch → classify → guard → reply → log.
 * Fetch handler: incoming DM webhook → followUpHandler.
 */

import type { Env } from './types';
import { fetchNewComments } from './commentFetcher';
import { classifyComment } from './commentClassifier';
import { checkReplyEligibility } from './replyGuard';
import { sendPrivateReply } from './instagramClient';
import { appendLead } from './leadLogger';

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    // TODO: Implement in Phase 3E
    console.log('Cron triggered — not yet implemented.');
  },

  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // TODO: Implement webhook handler in Phase 3E / 4A
    return new Response('Insta Growth Kit is running.', { status: 200 });
  },
};
