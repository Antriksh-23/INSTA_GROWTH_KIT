import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker, { buildReplyMessage, processCommentsPipeline } from '../src/index';
import type { Comment, ClassifiedComment, Env } from '../src/types';
import { MockKVNamespace } from './helpers/mockKv';

describe('Sub-Phase 3E — Worker Entry Point & Pipeline Integration Tests', () => {
  let mockKv: MockKVNamespace;
  let mockEnv: Env;
  const baseTime = new Date('2026-11-12T10:00:00Z');

  beforeEach(() => {
    mockKv = new MockKVNamespace();
    mockEnv = {
      REPLY_STORE: mockKv as unknown as KVNamespace,
      MEDIA_ID: '18042938491024821',
      LEAD_SHEET_ID: 'test-sheet-id',
      INSTAGRAM_ACCESS_TOKEN: 'mock-token',
      GEMINI_API_KEY: 'mock-gemini-key',
      GOOGLE_SERVICE_ACCOUNT_JSON: '{}',
      INSTAGRAM_VERIFY_TOKEN: 'test_secret_token_123',
    };
  });

  it('should build proper reply messages for price_request and link_request', () => {
    const priceComment: ClassifiedComment = {
      id: 'c1',
      comment_id: 'c1',
      from_id: 'u1',
      from_username: 'rohit_kumar',
      text: 'PRICE please',
      timestamp: baseTime.toISOString(),
      intent: 'price_request',
      confidence: 0.95,
    };
    const priceMsg = buildReplyMessage(priceComment);
    expect(priceMsg).toContain('@rohit_kumar');
    expect(priceMsg).toContain('₹20,890');
    expect(priceMsg).toContain('₹27,539');
    expect(priceMsg).toContain('whoop.in');

    const linkComment: ClassifiedComment = {
      ...priceComment,
      intent: 'link_request',
      text: 'link please',
    };
    const linkMsg = buildReplyMessage(linkComment);
    expect(linkMsg).toContain('@rohit_kumar');
    expect(linkMsg).toContain('whoop.in');
  });

  it('should run full comment pipeline: fetch → classify → guard → reply → log', async () => {
    const mockComments: Comment[] = [
      {
        id: 'c1',
        comment_id: 'c1',
        from_id: 'u1',
        from_username: 'arjun_fitness',
        text: 'PRICE please',
        timestamp: '2026-11-12T09:30:00Z',
      },
      {
        id: 'c2',
        comment_id: 'c2',
        from_id: 'u2',
        from_username: 'priya_health',
        text: 'bhai website link bhejo',
        timestamp: '2026-11-12T09:35:00Z',
      },
      {
        id: 'c3',
        comment_id: 'c3',
        from_id: 'u3',
        from_username: 'troll_user',
        text: 'Bakwas fraud scam',
        timestamp: '2026-11-12T09:40:00Z',
      },
    ];

    const repliesSent: { commentId: string; msg: string }[] = [];
    const leadsLogged: any[] = [];

    const summary = await processCommentsPipeline(mockEnv, {
      now: baseTime,
      commentsGetter: async () => mockComments,
      replySender: async (id, msg) => {
        repliesSent.push({ commentId: id, msg });
      },
      leadLoggerFn: async (row) => {
        leadsLogged.push(row);
      },
    });

    expect(summary.processedCount).toBe(3);
    expect(summary.repliesSent).toBe(2); // c1 (price) and c2 (link)
    expect(summary.skippedCount).toBe(1); // c3 (spam/abuse)

    expect(repliesSent).toHaveLength(2);
    expect(repliesSent[0].commentId).toBe('c1');
    expect(repliesSent[1].commentId).toBe('c2');

    expect(leadsLogged).toHaveLength(2);
    expect(leadsLogged[0].username).toBe('arjun_fitness');
    expect(leadsLogged[0].intent).toBe('price_request');
    expect(leadsLogged[1].username).toBe('priya_health');
    expect(leadsLogged[1].intent).toBe('link_request');
  });

  it('should return health check on GET /', async () => {
    const req = new Request('https://insta-growth.worker.dev/health');
    const res = await worker.fetch(req, mockEnv, {} as ExecutionContext);

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe('healthy');
    expect(data.mediaId).toBe('18042938491024821');
  });

  it('should verify Meta webhook with hub.challenge on GET /webhook', async () => {
    const challenge = 'random_hub_challenge_code_98765';
    const req = new Request(
      `https://insta-growth.worker.dev/webhook?hub.mode=subscribe&hub.verify_token=test_secret_token_123&hub.challenge=${challenge}`,
    );
    const res = await worker.fetch(req, mockEnv, {} as ExecutionContext);

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toBe(challenge);
  });

  it('should reject invalid webhook verify token with 403', async () => {
    const req = new Request(
      'https://insta-growth.worker.dev/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=123',
    );
    const res = await worker.fetch(req, mockEnv, {} as ExecutionContext);

    expect(res.status).toBe(403);
  });

  it('should handle POST /webhook incoming messaging event', async () => {
    const payload = {
      entry: [
        {
          messaging: [
            {
              sender: { id: 'user_123' },
              message: { text: 'How much is WHOOP 5.0?' },
            },
          ],
        },
      ],
    };

    const req = new Request('https://insta-growth.worker.dev/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await worker.fetch(req, mockEnv, {} as ExecutionContext);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('EVENT_RECEIVED');
  });

  it('should handle POST /test-followup for a known question without owner handoff', async () => {
    const req = new Request('https://insta-growth.worker.dev/test-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: 'user_99',
        username: 'fitness_buff',
        message: 'Is COD available for WHOOP 5.0?',
      }),
    });

    const res = await worker.fetch(req, mockEnv, {} as ExecutionContext);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.needsOwner).toBe(false);
    expect(body.reply.toLowerCase()).toContain('not available');
  });

  it('should handle POST /test-followup for an unknown question with owner handoff', async () => {
    const req = new Request('https://insta-growth.worker.dev/test-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: 'user_100',
        username: 'bargain_hunter',
        message: 'Can I get a 50% discount coupon code?',
      }),
    });

    const res = await worker.fetch(req, mockEnv, {} as ExecutionContext);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.needsOwner).toBe(true);
    expect(body.reply).toContain('Great question! The owner will get back to you shortly. 🙏');
  });

  it('should execute scheduled cron handler without error', async () => {
    const mockScheduledEvent = {
      cron: '* * * * *',
      scheduledTime: Date.now(),
      type: 'cron',
    } as unknown as ScheduledEvent;

    await expect(
      worker.scheduled(mockScheduledEvent, mockEnv, {} as ExecutionContext),
    ).resolves.not.toThrow();
  });
});

