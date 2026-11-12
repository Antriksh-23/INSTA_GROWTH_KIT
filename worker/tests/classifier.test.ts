import { describe, it, expect, vi } from 'vitest';
import {
  classifyComment,
  classifyCommentText,
  classifyWithFallback,
} from '../src/commentClassifier';
import type { Comment, Env, IntentLabel } from '../src/types';
import { MockKVNamespace } from './helpers/mockKv';

interface TestCase {
  text: string;
  expected: IntentLabel;
  language: 'EN' | 'HI' | 'Hinglish';
  notes?: string;
}

export const DATASET_30_COMMENTS: TestCase[] = [
  // ── 1. price_request (6 comments) ──────────────────────────
  { text: 'PRICE please', expected: 'price_request', language: 'EN' },
  { text: 'How much does the WHOOP 5.0 cost?', expected: 'price_request', language: 'EN' },
  { text: 'Bhai kitne ka hai ye band?', expected: 'price_request', language: 'Hinglish' },
  { text: 'Bhaiya iska rate kya hai?', expected: 'price_request', language: 'Hinglish' },
  { text: 'kitna daam hai iska?', expected: 'price_request', language: 'HI' },
  { text: 'MRP and best offer price batao', expected: 'price_request', language: 'Hinglish' },

  // ── 2. link_request (6 comments) ───────────────────────────
  { text: 'link pls', expected: 'link_request', language: 'EN' },
  { text: 'Where can I buy this online?', expected: 'link_request', language: 'EN' },
  { text: 'bhai buy link bhejo jaldi', expected: 'link_request', language: 'Hinglish' },
  { text: 'kahan se order karein isko?', expected: 'link_request', language: 'Hinglish' },
  { text: 'Website link send karo', expected: 'link_request', language: 'Hinglish' },
  { text: 'Store link please, want to purchase today', expected: 'link_request', language: 'EN' },

  // ── 3. question (6 comments) ───────────────────────────────
  { text: 'Does it have COD available for Mumbai?', expected: 'question', language: 'EN' },
  { text: 'Battery life kitni hai iski?', expected: 'question', language: 'Hinglish' },
  { text: 'Is it waterproof for swimming?', expected: 'question', language: 'EN' },
  { text: 'Bhai iPhone ke saath connect hoga kya?', expected: 'question', language: 'Hinglish' },
  { text: 'Warranty kitne saal ki milti hai?', expected: 'question', language: 'Hinglish' },
  { text: 'Can I wear this while sleeping without screen light?', expected: 'question', language: 'EN' },

  // ── 4. praise (6 comments) ─────────────────────────────────
  { text: 'This looks absolutely fire 🔥🔥', expected: 'praise', language: 'EN' },
  { text: 'Best fitness tracker in the market!', expected: 'praise', language: 'EN' },
  { text: 'Super clean product bhai maza aa gaya ❤️', expected: 'praise', language: 'Hinglish' },
  { text: 'Love the screen-free design!', expected: 'praise', language: 'EN' },
  { text: 'Ekdum badiya device hai 👏', expected: 'praise', language: 'Hinglish' },
  { text: 'Awesome recovery insights, using since 6 months', expected: 'praise', language: 'EN' },

  // ── 5. spam_abuse (6 comments) ─────────────────────────────
  { text: 'Earn $500 daily with crypto DM on Telegram @scam', expected: 'spam_abuse', language: 'EN' },
  { text: 'Follow me back for free iPhone giveaway check bio', expected: 'spam_abuse', language: 'EN' },
  { text: 'Bakwas product fraud company chor log', expected: 'spam_abuse', language: 'HI' },
  { text: 'DM to promote on 1M network whatsapp +123456', expected: 'spam_abuse', language: 'EN' },
  { text: 'Scam fake tracker don\'t buy idiot seller', expected: 'spam_abuse', language: 'EN' },
  { text: 'Invest in bitcoin 100x profit guaranteed telegram link in bio', expected: 'spam_abuse', language: 'EN' },
];

const mockEnv: Env = {
  REPLY_STORE: new MockKVNamespace() as unknown as KVNamespace,
  MEDIA_ID: '18042938491024821',
  LEAD_SHEET_ID: 'test-sheet',
  INSTAGRAM_ACCESS_TOKEN: 'mock-token',
  GEMINI_API_KEY: 'mock-gemini-key',
  GOOGLE_SERVICE_ACCOUNT_JSON: '{}',
};

describe('Sub-Phase 3C — commentClassifier & 30-Comment Evaluation', () => {
  it('should achieve ≥ 25 / 30 correct classifications using the Hinglish fallback engine', () => {
    let correctCount = 0;
    const failures: { text: string; expected: string; actual: string }[] = [];

    for (const item of DATASET_30_COMMENTS) {
      const result = classifyWithFallback(item.text);
      if (result.intent === item.expected) {
        correctCount++;
      } else {
        failures.push({
          text: item.text,
          expected: item.expected,
          actual: result.intent,
        });
      }
    }

    const accuracy = (correctCount / DATASET_30_COMMENTS.length) * 100;
    console.log(`Fallback Classifier Score: ${correctCount}/${DATASET_30_COMMENTS.length} (${accuracy.toFixed(1)}%)`);

    if (failures.length > 0) {
      console.warn('Fallback Failures:', failures);
    }

    expect(correctCount).toBeGreaterThanOrEqual(25);
    expect(correctCount).toBe(30); // 100% target
  });

  it('should classify correctly via Gemini API call (mocked)', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      const prompt = body.contents[0].parts[0].text;

      let intent = 'question';
      if (prompt.includes('PRICE please')) intent = 'price_request';
      if (prompt.includes('link pls')) intent = 'link_request';
      if (prompt.includes('This looks absolutely fire')) intent = 'praise';

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: intent }],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const comment: Comment = {
      id: 'c1',
      comment_id: 'c1',
      from_id: 'u1',
      from_username: 'arjun',
      text: 'PRICE please',
      timestamp: '2026-11-12T10:00:00Z',
    };

    const classified = await classifyComment(comment, mockEnv, { fetchFn: mockFetch });
    expect(classified.intent).toBe('price_request');
    expect(classified.confidence).toBeGreaterThanOrEqual(0.9);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should gracefully fall back to keyword classifier when Gemini API returns 500 error', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 500, message: 'Internal Server Error' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await classifyCommentText('kitne ka hai bhai?', mockEnv, {
      fetchFn: mockFetch,
    });

    // Should fall back to regex engine and detect price_request
    expect(result.intent).toBe('price_request');
  });

  it('should fast-filter obvious spam/abuse before calling Gemini API', async () => {
    const mockFetch = vi.fn();

    const result = await classifyCommentText(
      'Earn $500 daily with crypto DM on Telegram @scam',
      mockEnv,
      { fetchFn: mockFetch },
    );

    expect(result.intent).toBe('spam_abuse');
    expect(mockFetch).not.toHaveBeenCalled(); // Fast pre-filter saved an API call
  });
});
