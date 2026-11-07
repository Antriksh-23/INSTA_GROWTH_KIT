import { describe, it, expect } from 'vitest';
import factCardData from '../data/factCard.json';
import { leadRowToArray, type LeadRow, type FactCard } from '../src/types';

describe('Phase 0 — Smoke & Environment Verification', () => {
  it('should confirm the test runner works', () => {
    expect(true).toBe(true);
  });

  it('should import types and verify leadRowToArray produces 9 columns', () => {
    const sampleRow: LeadRow = {
      timestamp: '2026-11-06T12:00:00Z',
      username: 'test_user',
      userId: '12345678',
      commentText: 'PRICE pls',
      intent: 'price_request',
      replySent: 'Yes',
      followUpQuestion: '',
      needsOwner: false,
      status: 'open',
    };

    const arrayOutput = leadRowToArray(sampleRow);
    expect(arrayOutput).toHaveLength(9);
    expect(arrayOutput[0]).toBe('2026-11-06T12:00:00Z');
    expect(arrayOutput[1]).toBe('test_user');
    expect(arrayOutput[2]).toBe('12345678');
    expect(arrayOutput[3]).toBe('PRICE pls');
    expect(arrayOutput[4]).toBe('price_request');
    expect(arrayOutput[5]).toBe('Yes');
    expect(arrayOutput[6]).toBe('');
    expect(arrayOutput[7]).toBe(false);
    expect(arrayOutput[8]).toBe('open');
  });

  it('should validate factCard.json has all required shop fields', () => {
    const card = factCardData as FactCard;

    expect(card.product_name).toBe('WHOOP 5.0');
    expect(card.brand).toBe('WHOOP');
    expect(card.price).toContain('₹20,890');
    expect(card.offer).toContain('No-Cost EMI');
    expect(card.delivery).toBeTruthy();
    expect(card.location).toBeTruthy();
    expect(card.contact).toBeTruthy();
    expect(card.timings).toBeTruthy();
    expect(card.website).toBe('https://www.whoop.in/');
    expect(Array.isArray(card.key_benefits)).toBe(true);
    expect(card.key_benefits.length).toBeGreaterThan(0);
  });

  it('should import all module stubs without runtime errors', async () => {
    const [
      indexMod,
      fetcherMod,
      classifierMod,
      guardMod,
      clientMod,
      followUpMod,
      loggerMod,
    ] = await Promise.all([
      import('../src/index'),
      import('../src/commentFetcher'),
      import('../src/commentClassifier'),
      import('../src/replyGuard'),
      import('../src/instagramClient'),
      import('../src/followUpHandler'),
      import('../src/leadLogger'),
    ]);

    expect(indexMod.default).toBeDefined();
    expect(typeof indexMod.default.scheduled).toBe('function');
    expect(typeof indexMod.default.fetch).toBe('function');

    expect(typeof fetcherMod.fetchNewComments).toBe('function');
    expect(typeof classifierMod.classifyComment).toBe('function');
    expect(typeof guardMod.checkReplyEligibility).toBe('function');
    expect(typeof clientMod.getComments).toBe('function');
    expect(typeof clientMod.sendPrivateReply).toBe('function');
    expect(typeof clientMod.sendDM).toBe('function');
    expect(typeof clientMod.getConversations).toBe('function');
    expect(typeof followUpMod.handleFollowUp).toBe('function');
    expect(typeof loggerMod.appendLead).toBe('function');
  });
});
