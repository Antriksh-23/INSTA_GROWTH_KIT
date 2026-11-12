import { describe, it, expect, beforeEach } from 'vitest';
import { checkReplyEligibility } from '../src/replyGuard';
import type { ClassifiedComment, Env } from '../src/types';
import { MockKVNamespace } from './helpers/mockKv';

describe('Sub-Phase 3D — replyGuard 5-Step Gate Unit Tests', () => {
  let mockKv: MockKVNamespace;
  let mockEnv: Env;
  const baseDate = new Date('2026-11-12T12:00:00Z');

  beforeEach(() => {
    mockKv = new MockKVNamespace();
    mockEnv = {
      REPLY_STORE: mockKv as unknown as KVNamespace,
      MEDIA_ID: '18042938491024821',
      LEAD_SHEET_ID: 'test-sheet',
      INSTAGRAM_ACCESS_TOKEN: 'mock-token',
      GEMINI_API_KEY: 'mock-gemini-key',
      GOOGLE_SERVICE_ACCOUNT_JSON: '{}',
    };
  });

  const createComment = (overrides?: Partial<ClassifiedComment>): ClassifiedComment => ({
    id: 'comm_123',
    comment_id: 'comm_123',
    from_id: 'user_456',
    from_username: 'healthy_athlete',
    text: 'PRICE pls',
    timestamp: baseDate.toISOString(),
    intent: 'price_request',
    confidence: 0.95,
    ...overrides,
  });

  // ── Step 1: Intent Eligibility ───────────────────────────────────────
  describe('Gate 1: Intent eligibility', () => {
    it('should allow price_request', async () => {
      const res = await checkReplyEligibility(createComment({ intent: 'price_request' }), mockEnv, {
        now: baseDate,
      });
      expect(res.allowed).toBe(true);
      expect(res.reason).toContain('eligible');
    });

    it('should allow link_request', async () => {
      const res = await checkReplyEligibility(
        createComment({ id: 'comm_link', comment_id: 'comm_link', intent: 'link_request', text: 'link please' }),
        mockEnv,
        { now: baseDate },
      );
      expect(res.allowed).toBe(true);
    });

    it('should reject question, praise, and spam_abuse', async () => {
      const questionRes = await checkReplyEligibility(
        createComment({ intent: 'question', text: 'COD available?' }),
        mockEnv,
        { now: baseDate },
      );
      expect(questionRes.allowed).toBe(false);
      expect(questionRes.reason).toContain('intent_ineligible');

      const praiseRes = await checkReplyEligibility(
        createComment({ intent: 'praise', text: 'Super fire!' }),
        mockEnv,
        { now: baseDate },
      );
      expect(praiseRes.allowed).toBe(false);
      expect(praiseRes.reason).toContain('intent_ineligible');

      const spamRes = await checkReplyEligibility(
        createComment({ intent: 'spam_abuse', text: 'Crypto profit' }),
        mockEnv,
        { now: baseDate },
      );
      expect(spamRes.allowed).toBe(false);
      expect(spamRes.reason).toContain('intent_ineligible');
    });
  });

  // ── Step 2: 7-Day Eligibility Window ────────────────────────────────
  describe('Gate 2: 7-day eligibility window', () => {
    it('should allow comment at day 0 (fresh comment)', async () => {
      const res = await checkReplyEligibility(
        createComment({ timestamp: baseDate.toISOString() }),
        mockEnv,
        { now: baseDate },
      );
      expect(res.allowed).toBe(true);
    });

    it('should allow comment at day 6 (within 7 days)', async () => {
      const sixDaysAgo = new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000);
      const res = await checkReplyEligibility(
        createComment({ timestamp: sixDaysAgo.toISOString() }),
        mockEnv,
        { now: baseDate },
      );
      expect(res.allowed).toBe(true);
    });

    it('should reject comment at day 8 (older than 7 days)', async () => {
      const eightDaysAgo = new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000);
      const res = await checkReplyEligibility(
        createComment({ timestamp: eightDaysAgo.toISOString() }),
        mockEnv,
        { now: baseDate },
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('outside_7_day_window');
    });
  });

  // ── Step 3: Blocklist Check ─────────────────────────────────────────
  describe('Gate 3: Blocklist check', () => {
    it('should reject comment if user ID is on blocklist', async () => {
      await mockKv.put('blocklist:user_blocked_99', 'blocked: abusive history');

      const res = await checkReplyEligibility(
        createComment({ from_id: 'user_blocked_99' }),
        mockEnv,
        { now: baseDate },
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('user_blocked');
    });

    it('should reject comment if username is on blocklist', async () => {
      await mockKv.put('blocklist:spammer_bob', 'blocked');

      const res = await checkReplyEligibility(
        createComment({ from_username: 'spammer_bob' }),
        mockEnv,
        { now: baseDate },
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('user_blocked');
    });

    it('should reject comment if username is in global blocked_users JSON list', async () => {
      await mockKv.put('blocked_users', JSON.stringify(['bad_bot', 'troll_123']));

      const res = await checkReplyEligibility(
        createComment({ from_username: 'bad_bot' }),
        mockEnv,
        { now: baseDate },
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('user_blocked');
    });
  });

  // ── Step 4: Duplicate Guard ─────────────────────────────────────────
  describe('Gate 4: Duplicate guard', () => {
    it('should allow first reply and prevent second duplicate reply to same comment', async () => {
      const comment = createComment({ id: 'comm_first_time', comment_id: 'comm_first_time' });

      // First run: allowed
      const firstRes = await checkReplyEligibility(comment, mockEnv, { now: baseDate });
      expect(firstRes.allowed).toBe(true);

      // Verify KV entry created
      const stored = await mockKv.get('sent_replies:comm_first_time');
      expect(stored).toBe(baseDate.toISOString());

      // Second run: blocked as duplicate
      const secondRes = await checkReplyEligibility(comment, mockEnv, { now: baseDate });
      expect(secondRes.allowed).toBe(false);
      expect(secondRes.reason).toContain('duplicate_reply');
    });
  });

  // ── Step 5: Blocked Terms / Abuse Check ─────────────────────────────
  describe('Gate 5: Blocked terms / abuse check', () => {
    it('should reject comment containing abuse or scam terms even if intent is price_request', async () => {
      const abuseComments = [
        'PRICE fraud company chor log',
        'cost kitna hai scam bot idiot',
        'rate batao bakwas product',
        'price please fake tracker',
      ];

      for (const text of abuseComments) {
        const res = await checkReplyEligibility(
          createComment({ id: `comm_${Math.random()}`, comment_id: `comm_${Math.random()}`, text }),
          mockEnv,
          { now: baseDate },
        );
        expect(res.allowed).toBe(false);
        expect(res.reason).toContain('contains_blocked_terms');
      }
    });
  });
});

