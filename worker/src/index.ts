/**
 * Insta Growth Kit — Cloudflare Worker entry point.
 *
 * Cron handler:
 * 1. fetchNewComments(env)
 * 2. classifyComment(comment, env)
 * 3. checkReplyEligibility(classifiedComment, env)
 * 4. sendPrivateReply(comment.comment_id, message, env)
 * 5. appendLead(leadRow, env)
 *
 * Fetch handler:
 * - GET / or /health: Worker health check & status
 * - GET /webhook: Meta Webhook challenge verification
 * - POST /webhook: Real-time Meta messaging/comment event webhook
 * - POST /test-cron: Manual cron trigger for dev/testing
 */

import type { Comment, ClassifiedComment, Env, LeadRow } from './types';
import { fetchNewComments } from './commentFetcher';
import { classifyComment } from './commentClassifier';
import { checkReplyEligibility } from './replyGuard';
import { sendPrivateReply, sendDM } from './instagramClient';
import { appendLead } from './leadLogger';
import { handleFollowUp } from './followUpHandler';

export const OFFICIAL_WEBSITE = 'https://www.whoop.in/';

/**
 * Builds the approved shop owner message based on classified intent.
 */
export function buildReplyMessage(classified: ClassifiedComment): string {
  const handle = classified.from_username ? `@${classified.from_username}` : 'there';

  if (classified.intent === 'price_request') {
    return `Hey ${handle}! 👋 WHOOP 5.0 starts at ₹20,890 (WHOOP One) or ₹27,539 (WHOOP Peak) with No-Cost EMI up to 6 months. Check full details & order here: ${OFFICIAL_WEBSITE}`;
  }

  if (classified.intent === 'link_request') {
    return `Hey ${handle}! 👋 You can order your WHOOP 5.0 directly at ${OFFICIAL_WEBSITE} with No-Cost EMI up to 6 months!`;
  }

  return `Hey ${handle}! Thanks for checking out WHOOP 5.0. Visit ${OFFICIAL_WEBSITE} for details!`;
}

/**
 * Core comment processing pipeline (called by cron and test triggers).
 */
export async function processCommentsPipeline(
  env: Env,
  options?: {
    now?: Date;
    commentsGetter?: (mediaId: string, env: Env) => Promise<Comment[]>;
    replySender?: (commentId: string, message: string, env: Env) => Promise<void>;
    leadLoggerFn?: (row: LeadRow, env: Env) => Promise<void>;
  },
): Promise<{
  processedCount: number;
  repliesSent: number;
  skippedCount: number;
  results: Array<{ commentId: string; username: string; intent: string; allowed: boolean; reason: string }>;
}> {
  console.log(`[InstaGrowthKit] Starting comment check on Reel Media ID: ${env.MEDIA_ID}`);

  const comments = await fetchNewComments(env, {
    commentsGetter: options?.commentsGetter,
  });

  if (!comments || comments.length === 0) {
    console.log('[InstaGrowthKit] No new comments found.');
    return { processedCount: 0, repliesSent: 0, skippedCount: 0, results: [] };
  }

  console.log(`[InstaGrowthKit] Fetched ${comments.length} new comments to process.`);

  let repliesSent = 0;
  let skippedCount = 0;
  const results: Array<{ commentId: string; username: string; intent: string; allowed: boolean; reason: string }> = [];

  const sendReply = options?.replySender ?? sendPrivateReply;
  const logLead = options?.leadLoggerFn ?? appendLead;

  for (const comment of comments) {
    // 1. Classify intent
    const classified = await classifyComment(comment, env);

    // 2. 5-step reply guard check
    const guardResult = await checkReplyEligibility(classified, env, { now: options?.now });

    results.push({
      commentId: comment.comment_id,
      username: comment.from_username,
      intent: classified.intent,
      allowed: guardResult.allowed,
      reason: guardResult.reason,
    });

    if (guardResult.allowed) {
      const replyMessage = buildReplyMessage(classified);

      try {
        await sendReply(comment.comment_id, replyMessage, env);
        repliesSent++;
        console.log(`[Reply Sent] Sent private reply to @${comment.from_username} (ID: ${comment.comment_id})`);

        // Record lead in Google Sheets
        const leadRow: LeadRow = {
          timestamp: new Date().toISOString(),
          username: comment.from_username || 'anonymous',
          userId: comment.from_id || comment.comment_id,
          commentText: comment.text,
          intent: classified.intent,
          replySent: 'Yes',
          followUpQuestion: '',
          needsOwner: false,
          status: 'open',
        };

        try {
          await logLead(leadRow, env);
        } catch (sheetErr) {
          console.warn('[LeadLogger] Non-blocking sheet logging warning:', sheetErr);
        }
      } catch (replyErr) {
        console.error(`[Reply Error] Failed to send reply to comment ${comment.comment_id}:`, replyErr);
      }
    } else {
      skippedCount++;
      console.log(`[Reply Skipped] Comment ${comment.comment_id} skipped: ${guardResult.reason}`);
    }
  }

  return {
    processedCount: comments.length,
    repliesSent,
    skippedCount,
    results,
  };
}

export default {
  /**
   * Cloudflare Worker Cron Trigger (fires every 1 minute)
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    try {
      await processCommentsPipeline(env);
    } catch (error) {
      console.error('[InstaGrowthKit Cron Error]:', error);
    }
  },

  /**
   * Cloudflare Worker Fetch handler (HTTP endpoints & webhooks)
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // ── 1. Health check ────────────────────────────────────────────────
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          app: 'Insta Growth Kit DM Bot',
          version: '1.0.0',
          mediaId: env.MEDIA_ID,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // ── 2. Meta Webhook Verification (GET /webhook) ────────────────────
    if (url.pathname === '/webhook' && request.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      const expectedToken = env.INSTAGRAM_VERIFY_TOKEN || 'insta_growth_kit_secret';

      if (mode === 'subscribe' && token === expectedToken) {
        console.log('[Webhook Verification] Successfully verified Meta webhook subscription.');
        return new Response(challenge || '', { status: 200 });
      }

      console.warn('[Webhook Verification] Mismatched verify token or mode.');
      return new Response('Forbidden', { status: 403 });
    }

    // ── 3. Meta Incoming Webhook Events (POST /webhook) ─────────────────
    if (url.pathname === '/webhook' && request.method === 'POST') {
      try {
        const payload = (await request.json()) as any;
        console.log('[Webhook Event Received]:', JSON.stringify(payload));

        // Check for incoming DM messages
        const entries = payload?.entry || [];
        for (const entry of entries) {
          const messaging = entry?.messaging || [];
          for (const msgEvent of messaging) {
            const senderId = msgEvent?.sender?.id;
            const senderUsername = msgEvent?.sender?.username || `user_${senderId}`;
            const messageText = msgEvent?.message?.text;

            if (senderId && messageText) {
              const followUp = await handleFollowUp(messageText, env);
              console.log(`[Follow-Up Answered] Sender: ${senderId}, needs_handoff: ${followUp.needs_handoff}`);

              // Send response back via Instagram DM
              try {
                await sendDM(senderId, followUp.reply, env);
                console.log(`[Follow-Up DM Sent] Dispatched reply to user ${senderId}`);
              } catch (dmErr) {
                console.warn('[Webhook] Non-blocking sendDM warning:', dmErr);
              }

              // Log lead to Google Sheets
              const leadRow: LeadRow = {
                timestamp: new Date().toISOString(),
                username: senderUsername,
                userId: senderId,
                commentText: '',
                intent: 'question',
                replySent: 'Yes',
                followUpQuestion: messageText,
                needsOwner: followUp.needs_handoff,
                status: 'open',
              };

              try {
                await appendLead(leadRow, env);
              } catch (leadErr) {
                console.warn('[Webhook] Non-blocking leadLogger warning:', leadErr);
              }
            }
          }
        }

        return new Response('EVENT_RECEIVED', { status: 200 });
      } catch (err) {
        console.error('[Webhook Processing Error]:', err);
        return new Response('Bad Request', { status: 400 });
      }
    }

    // ── 4. Manual Follow-Up Test endpoint for dev/verification ─────────
    if (url.pathname === '/test-followup' && (request.method === 'POST' || request.method === 'GET')) {
      let body: any = {};
      if (request.method === 'POST') {
        try {
          body = await request.json();
        } catch {}
      } else {
        body = {
          senderId: url.searchParams.get('senderId'),
          username: url.searchParams.get('username'),
          message: url.searchParams.get('message'),
        };
      }

      const senderId = body?.senderId || 'demo_user_101';
      const username = body?.username || 'arjun_fitness';
      const messageText = body?.message || 'Is COD available for WHOOP 5.0?';

      const followUp = await handleFollowUp(messageText, env);

      let dmDispatched = false;
      try {
        await sendDM(senderId, followUp.reply, env);
        dmDispatched = true;
      } catch (e) {
        console.warn('[Test-Followup] Simulated/non-fatal sendDM:', e);
      }

      const leadRow: LeadRow = {
        timestamp: new Date().toISOString(),
        username,
        userId: senderId,
        commentText: '',
        intent: 'question',
        replySent: 'Yes',
        followUpQuestion: messageText,
        needsOwner: followUp.needs_handoff,
        status: 'open',
      };

      let leadLogged = false;
      let logReason: string | undefined;
      try {
        const logRes = await appendLead(leadRow, env);
        leadLogged = logRes.appended;
        logReason = logRes.reason;
      } catch (sheetErr) {
        console.warn('[Test-Followup] Non-fatal sheet logging:', sheetErr);
        logReason = String(sheetErr);
      }

      return new Response(
        JSON.stringify(
          {
            success: true,
            senderId,
            username,
            question: messageText,
            reply: followUp.reply,
            needsOwner: followUp.needs_handoff,
            dmDispatched,
            leadLogged,
            logReason,
          },
          null,
          2,
        ),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // ── 5. Manual Cron Trigger endpoint for testing ────────────────────
    if (url.pathname === '/test-cron' && (request.method === 'POST' || request.method === 'GET')) {
      const summary = await processCommentsPipeline(env);
      return new Response(JSON.stringify(summary, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
