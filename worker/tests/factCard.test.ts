import { describe, expect, it, vi } from 'vitest';
import defaultFactCard from '../data/factCard.json';
import {
  HANDOFF_REPLY,
  handleFollowUp,
  handleFollowUpFallback,
} from '../src/followUpHandler';
import type { Env, FactCard } from '../src/types';
import { createMockEnv } from './helpers/mockKv';

describe('Sub-Phase 4A — followUpHandler & factCard Grounding Tests', () => {
  const env: Env = createMockEnv();

  // ── 1. Fact Card Integrity Tests ─────────────────────────────────────
  it('should load default factCard.json with all required shop fields', () => {
    expect(defaultFactCard.product_name).toBe('WHOOP 5.0');
    expect(defaultFactCard.brand).toBe('WHOOP');
    expect(defaultFactCard.cod_available).toBe(false);
    expect(defaultFactCard.price).toContain('₹20,890');
    expect(defaultFactCard.website).toBe('https://www.whoop.in/');
    expect(defaultFactCard.key_benefits.length).toBeGreaterThanOrEqual(3);
  });

  // ── 2. Fallback Engine Tests (Known questions) ────────────────────────
  it('should answer COD question accurately stating COD is NOT available', () => {
    const result = handleFollowUpFallback('Is cash on delivery available?', defaultFactCard as unknown as FactCard);
    expect(result.needs_handoff).toBe(false);
    expect(result.reply.toLowerCase()).toContain('not available');
    expect(result.reply).toContain(defaultFactCard.website);
  });

  it('should answer Hindi / Hinglish COD question stating COD is NOT available', () => {
    const result = handleFollowUpFallback('COD milega kya bhai?', defaultFactCard as unknown as FactCard);
    expect(result.needs_handoff).toBe(false);
    expect(result.reply.toLowerCase()).toContain('not available');
  });

  it('should answer battery life question with 14+ days from fact card', () => {
    const result = handleFollowUpFallback('How long does the battery last on WHOOP 5.0?', defaultFactCard as unknown as FactCard);
    expect(result.needs_handoff).toBe(false);
    expect(result.reply).toContain('14+ days');
    expect(result.reply).toContain('PowerPack');
  });

  it('should answer waterproofing question confirming 100% waterproof', () => {
    const result = handleFollowUpFallback('Can I wear this while swimming in a pool?', defaultFactCard as unknown as FactCard);
    expect(result.needs_handoff).toBe(false);
    expect(result.reply.toLowerCase()).toContain('waterproof');
  });

  it('should answer price and tiers question with WHOOP One & Peak prices', () => {
    const result = handleFollowUpFallback('What are the different variants and prices?', defaultFactCard as unknown as FactCard);
    expect(result.needs_handoff).toBe(false);
    expect(result.reply).toContain('₹20,890');
    expect(result.reply).toContain('₹27,539');
  });

  it('should answer screen question explaining screen-free 24/7 design', () => {
    const result = handleFollowUpFallback('Does it have a touchscreen display?', defaultFactCard as unknown as FactCard);
    expect(result.needs_handoff).toBe(false);
    expect(result.reply.toLowerCase()).toContain('screen-free');
  });

  // ── 3. Unknown Questions & Owner Handoff Flag Tests ───────────────────
  it('should trigger owner handoff when asked for an unapproved 50% discount', () => {
    const result = handleFollowUpFallback('Can you give me a 50% discount coupon code?', defaultFactCard as unknown as FactCard);
    expect(result.needs_handoff).toBe(true);
    expect(result.reply).toBe(HANDOFF_REPLY);
  });

  it('should trigger owner handoff when customer asks completely unrelated question', () => {
    const result = handleFollowUpFallback('Do you sell protein powders and dumbbells too?', defaultFactCard as unknown as FactCard);
    expect(result.needs_handoff).toBe(true);
    expect(result.reply).toBe(HANDOFF_REPLY);
  });

  it('should trigger owner handoff for unlisted offline shop location', () => {
    const result = handleFollowUpFallback('Where is your physical shop in Karol Bagh Delhi?', defaultFactCard as unknown as FactCard);
    // Since Karol Bagh offline shop is not in factCard, it must answer with online location or handoff
    expect(result.reply).toBeDefined();
  });

  it('should trigger owner handoff on empty message', async () => {
    const result = await handleFollowUp('', env);
    expect(result.needs_handoff).toBe(true);
    expect(result.reply).toBe(HANDOFF_REPLY);
  });

  // ── 4. Gemini API Integration & Mock Tests ───────────────────────────
  it('should correctly parse Gemini valid JSON response for a known answer', async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  reply: 'WHOOP 5.0 battery lasts 14+ days and charges wirelessly via PowerPack.',
                  needs_handoff: false,
                }),
              },
            ],
          },
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockGeminiResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await handleFollowUp('How long is the battery?', env, {
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.needs_handoff).toBe(false);
    expect(result.reply).toContain('14+ days');
  });

  it('should correctly handle markdown-fenced JSON from Gemini', async () => {
    const fencedJson = '```json\n{\n  "reply": "COD is not available for WHOOP 5.0.",\n  "needs_handoff": false\n}\n```';
    const mockGeminiResponse = {
      candidates: [{ content: { parts: [{ text: fencedJson }] } }],
    };

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockGeminiResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await handleFollowUp('Do you have COD?', env, {
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(result.needs_handoff).toBe(false);
    expect(result.reply).toContain('COD is not available');
  });

  it('should flag needs_handoff when Gemini detects unknown question', async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  reply: HANDOFF_REPLY,
                  needs_handoff: true,
                }),
              },
            ],
          },
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockGeminiResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await handleFollowUp('Can you do 70% off for black friday?', env, {
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(result.needs_handoff).toBe(true);
    expect(result.reply).toBe(HANDOFF_REPLY);
  });

  it('should gracefully fall back to factCard rules when Gemini API returns HTTP 500 error', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response('Internal Server Error', { status: 500 }),
    );

    const result = await handleFollowUp('Is WHOOP waterproof?', env, {
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.needs_handoff).toBe(false);
    expect(result.reply.toLowerCase()).toContain('waterproof');
  });
});

