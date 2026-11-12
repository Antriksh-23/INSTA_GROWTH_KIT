/**
 * replyGuard — 5-step gate before any private message is sent.
 *
 * 5-Step Gate:
 * 1. Intent eligibility — only price_request and link_request trigger a reply.
 * 2. 7-day window — comment must have been posted within the last 7 days.
 * 3. Blocklist check — from_id or from_username must not be in the blocked list.
 * 4. Duplicate check — comment_id must not have already received a reply.
 * 5. Blocked terms — comment text must not contain abusive or spam terms.
 *
 * If eligible: records comment_id to sent_replies in KV and returns allowed: true.
 */

import type { ClassifiedComment, Env, ReplyGuardResult } from './types';

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const ABUSE_BLOCKED_TERMS: string[] = [
  'fraud',
  'chor',
  'scam',
  'idiot',
  'bakwas',
  'fake',
  'ghatiya',
  'bullshit',
  'bastard',
  'harami',
  'kamina',
  'chutiya',
  'kutta',
  'crypto',
  'telegram',
  'giveaway',
  'whatsapp me',
];

export interface ReplyGuardOptions {
  now?: Date;
  recordReply?: boolean; // Default true: writes to KV when allowed
}

/**
 * Checks if a classified comment is eligible for an automated private reply.
 */
export async function checkReplyEligibility(
  comment: ClassifiedComment,
  env: Env,
  options?: ReplyGuardOptions,
): Promise<ReplyGuardResult> {
  const now = options?.now ?? new Date();
  const shouldRecord = options?.recordReply ?? true;

  // ── Step 1: Intent Eligibility ───────────────────────────────────────
  // Only 'price_request' and 'link_request' trigger private replies
  if (comment.intent !== 'price_request' && comment.intent !== 'link_request') {
    return {
      allowed: false,
      reason: `intent_ineligible: intent '${comment.intent}' does not trigger a private reply`,
    };
  }

  // ── Step 2: 7-Day Eligibility Window ────────────────────────────────
  const commentDate = new Date(comment.timestamp);
  if (isNaN(commentDate.getTime())) {
    return {
      allowed: false,
      reason: 'invalid_timestamp: unable to parse comment timestamp',
    };
  }

  const ageMs = now.getTime() - commentDate.getTime();
  if (ageMs > SEVEN_DAYS_MS) {
    const ageDays = (ageMs / (24 * 60 * 60 * 1000)).toFixed(1);
    return {
      allowed: false,
      reason: `outside_7_day_window: comment is ${ageDays} days old (> 7 days)`,
    };
  }

  // ── Step 3: Blocklist Check ─────────────────────────────────────────
  // Check both direct key 'blocklist:<id>', 'blocklist:<username>', and 'blocked_users' JSON array
  if (comment.from_id) {
    const isIdBlocked = await env.REPLY_STORE.get(`blocklist:${comment.from_id}`);
    if (isIdBlocked) {
      return {
        allowed: false,
        reason: `user_blocked: user ID '${comment.from_id}' is on the blocklist`,
      };
    }
  }

  if (comment.from_username) {
    const cleanUsername = comment.from_username.toLowerCase().replace(/^@/, '');
    const isUserBlocked = await env.REPLY_STORE.get(`blocklist:${cleanUsername}`);
    if (isUserBlocked) {
      return {
        allowed: false,
        reason: `user_blocked: username '${comment.from_username}' is on the blocklist`,
      };
    }

    // Also check global blocked_users list if present
    const blockedList = (await env.REPLY_STORE.get('blocked_users', 'json')) as string[] | null;
    if (Array.isArray(blockedList)) {
      const lowerList = blockedList.map((u) => u.toLowerCase().replace(/^@/, ''));
      if (lowerList.includes(cleanUsername) || (comment.from_id && lowerList.includes(comment.from_id))) {
        return {
          allowed: false,
          reason: `user_blocked: user '${cleanUsername}' is in blocked_users list`,
        };
      }
    }
  }

  // ── Step 4: Duplicate Reply Guard ───────────────────────────────────
  const commentId = comment.comment_id || comment.id;
  const sentKey = `sent_replies:${commentId}`;
  const alreadySent = await env.REPLY_STORE.get(sentKey);

  if (alreadySent) {
    return {
      allowed: false,
      reason: `duplicate_reply: comment '${commentId}' was already replied to at ${alreadySent}`,
    };
  }

  // ── Step 5: Blocked Terms / Abuse Check ─────────────────────────────
  const lowerText = comment.text.toLowerCase();
  for (const term of ABUSE_BLOCKED_TERMS) {
    // Check for exact word or phrase boundary
    const termRegex = new RegExp(`\\b${term}\\b`, 'i');
    if (termRegex.test(lowerText) || lowerText.includes(term.toLowerCase())) {
      return {
        allowed: false,
        reason: `contains_blocked_terms: comment contains abusive/spam term '${term}'`,
      };
    }
  }

  // ── All 5 gates passed: eligible for reply ───────────────────────────
  if (shouldRecord) {
    // Record to sent_replies in KV with a 30-day TTL (2,592,000 seconds)
    await env.REPLY_STORE.put(sentKey, now.toISOString(), {
      expirationTtl: 30 * 24 * 60 * 60,
    });
  }

  return {
    allowed: true,
    reason: 'eligible: all 5 safety gates passed',
  };
}
