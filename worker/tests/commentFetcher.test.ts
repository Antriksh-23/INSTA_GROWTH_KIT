import { describe, it, expect, beforeEach } from 'vitest';
import { fetchNewComments, CURSOR_KV_KEY } from '../src/commentFetcher';
import type { Comment, Env } from '../src/types';
import { MockKVNamespace } from './helpers/mockKv';

describe('Sub-Phase 3B — commentFetcher Unit Tests', () => {
  let mockKv: MockKVNamespace;
  let mockEnv: Env;

  const sampleComments: Comment[] = [
    {
      id: 'c1',
      comment_id: 'c1',
      from_id: 'u1',
      from_username: 'arjun_fitness',
      text: 'PRICE pls',
      timestamp: '2026-11-12T09:00:00Z',
    },
    {
      id: 'c2',
      comment_id: 'c2',
      from_id: 'u2',
      from_username: 'sneha_runs',
      text: 'kitne ka hai ye?',
      timestamp: '2026-11-12T09:15:00Z',
    },
    {
      id: 'c3',
      comment_id: 'c3',
      from_id: 'u3',
      from_username: 'rohit_lifts',
      text: 'link please',
      timestamp: '2026-11-12T09:30:00Z',
    },
  ];

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

  it('should return all comments on first run and store cursor as latest timestamp', async () => {
    const comments = await fetchNewComments(mockEnv, {
      commentsGetter: async () => sampleComments,
    });

    expect(comments).toHaveLength(3);
    expect(comments.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);

    const savedCursor = await mockKv.get(CURSOR_KV_KEY);
    expect(savedCursor).toBe('2026-11-12T09:30:00Z');
  });

  it('should return only new comments on second run and advance cursor', async () => {
    // Simulate first run
    await fetchNewComments(mockEnv, {
      commentsGetter: async () => sampleComments,
    });

    // New comment arrives
    const newComment: Comment = {
      id: 'c4',
      comment_id: 'c4',
      from_id: 'u4',
      from_username: 'vikram_crossfit',
      text: 'cost kitna hai?',
      timestamp: '2026-11-12T09:45:00Z',
    };

    const secondRunComments = await fetchNewComments(mockEnv, {
      commentsGetter: async () => [...sampleComments, newComment],
    });

    expect(secondRunComments).toHaveLength(1);
    expect(secondRunComments[0].id).toBe('c4');

    const updatedCursor = await mockKv.get(CURSOR_KV_KEY);
    expect(updatedCursor).toBe('2026-11-12T09:45:00Z');
  });

  it('should return empty array if no new comments since last cursor', async () => {
    // Set existing cursor
    await mockKv.put(CURSOR_KV_KEY, '2026-11-12T09:30:00Z');

    const comments = await fetchNewComments(mockEnv, {
      commentsGetter: async () => sampleComments,
    });

    expect(comments).toHaveLength(0);
    const cursor = await mockKv.get(CURSOR_KV_KEY);
    expect(cursor).toBe('2026-11-12T09:30:00Z');
  });

  it('should sort comments chronologically even if API returns them out of order', async () => {
    const unorderedComments = [sampleComments[2], sampleComments[0], sampleComments[1]];

    const comments = await fetchNewComments(mockEnv, {
      commentsGetter: async () => unorderedComments,
    });

    expect(comments[0].id).toBe('c1');
    expect(comments[1].id).toBe('c2');
    expect(comments[2].id).toBe('c3');
  });

  it('should return empty array if API returns no comments', async () => {
    const comments = await fetchNewComments(mockEnv, {
      commentsGetter: async () => [],
    });

    expect(comments).toEqual([]);
    const cursor = await mockKv.get(CURSOR_KV_KEY);
    expect(cursor).toBeNull();
  });

  it('should throw if MEDIA_ID is missing', async () => {
    const envWithoutMedia = { ...mockEnv, MEDIA_ID: '' };
    await expect(fetchNewComments(envWithoutMedia)).rejects.toThrow(/MEDIA_ID is not configured/);
  });
});

