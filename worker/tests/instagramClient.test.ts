import { describe, it, expect, vi } from 'vitest';
import {
  getComments,
  sendPrivateReply,
  sendDM,
  getConversations,
  fetchWithRetry,
} from '../src/instagramClient';
import type { Env } from '../src/types';
import { MockKVNamespace } from './helpers/mockKv';

const mockEnv: Env = {
  REPLY_STORE: new MockKVNamespace() as unknown as KVNamespace,
  MEDIA_ID: '18042938491024821',
  LEAD_SHEET_ID: 'test-sheet-id',
  INSTAGRAM_ACCESS_TOKEN: 'valid_mock_token_12345',
  GEMINI_API_KEY: 'test_gemini_key',
  GOOGLE_SERVICE_ACCOUNT_JSON: '{}',
};

describe('Sub-Phase 3A — instagramClient Unit Tests', () => {
  it('should fetch comments successfully and map fields', async () => {
    const mockApiResponse = {
      data: [
        {
          id: 'comm_001',
          from: { id: 'user_101', username: 'fitness_guy_in' },
          text: 'PRICE please',
          timestamp: '2026-11-12T10:00:00+0000',
        },
        {
          id: 'comm_002',
          from: { id: 'user_102', username: 'priya_health' },
          text: 'kitne ka hai ye?',
          timestamp: '2026-11-12T10:05:00+0000',
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockApiResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const comments = await getComments(mockEnv.MEDIA_ID, mockEnv, {
      fetchFn: mockFetch,
    });

    expect(comments).toHaveLength(2);
    expect(comments[0]).toEqual({
      id: 'comm_001',
      comment_id: 'comm_001',
      from_id: 'user_101',
      from_username: 'fitness_guy_in',
      text: 'PRICE please',
      timestamp: '2026-11-12T10:00:00+0000',
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain('18042938491024821/comments');
  });

  it('should handle HTTP 429 rate limit with exponential backoff retry and succeed', async () => {
    const sleepCalls: number[] = [];
    const mockSleep = async (ms: number) => {
      sleepCalls.push(ms);
    };

    let attempt = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      attempt++;
      if (attempt <= 2) {
        // Return 429 for the first 2 attempts
        return new Response(JSON.stringify({ error: { message: 'Rate limit hit' } }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Succeed on attempt 3
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const response = await fetchWithRetry(
      'https://graph.facebook.com/v18.0/test',
      { method: 'GET' },
      {
        fetchFn: mockFetch,
        sleepFn: mockSleep,
        initialDelayMs: 10,
        maxRetries: 3,
      },
    );

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(sleepCalls).toEqual([10, 20]); // 10 * 2^0, 10 * 2^1
  });

  it('should throw when HTTP 429 exceeds max retries', async () => {
    const mockSleep = vi.fn().mockResolvedValue(undefined);
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'Too many requests' } }), {
        status: 429,
      }),
    );

    await expect(
      fetchWithRetry(
        'https://graph.facebook.com/v18.0/test',
        { method: 'GET' },
        {
          fetchFn: mockFetch,
          sleepFn: mockSleep,
          initialDelayMs: 5,
          maxRetries: 2,
        },
      ),
    ).rejects.toThrow(/rate limit exceeded.*after 2 retries/i);

    expect(mockFetch).toHaveBeenCalledTimes(3); // attempt 0, 1, 2
  });

  it('should throw an informative error when token is invalid (HTTP 401/400)', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            message: 'Invalid OAuth access token.',
            type: 'OAuthException',
            code: 190,
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(
      getComments(mockEnv.MEDIA_ID, mockEnv, { fetchFn: mockFetch }),
    ).rejects.toThrow(/Failed to fetch comments \(HTTP 401\)/);
  });

  it('should send a private reply successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'reply_abc123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await sendPrivateReply('comm_999', 'WHOOP 5.0 starts at ₹20,890!', mockEnv, {
      fetchFn: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('comm_999/private_replies');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      message: 'WHOOP 5.0 starts at ₹20,890!',
    });
    expect(init.headers.Authorization).toBe('Bearer valid_mock_token_12345');
  });

  it('should send a direct message (DM) successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ recipient_id: 'user_101', message_id: 'mid_001' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await sendDM('user_101', 'Here is your link: https://whoop.in', mockEnv, {
      fetchFn: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/me/messages');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      recipient: { id: 'user_101' },
      message: { text: 'Here is your link: https://whoop.in' },
    });
  });

  it('should get conversations successfully', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: 'conv_1' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const convs = await getConversations('user_101', mockEnv, { fetchFn: mockFetch });
    expect(convs).toHaveLength(1);
    expect(convs[0].id).toBe('conv_1');
  });
});

