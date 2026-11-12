/**
 * In-memory Mock implementation of Cloudflare KVNamespace for Vitest tests.
 */

export class MockKVNamespace {
  private store = new Map<string, { value: string; expiration?: number }>();

  async get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' } | 'text' | 'json' | 'arrayBuffer'): Promise<any> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiration && entry.expiration < Date.now() / 1000) {
      this.store.delete(key);
      return null;
    }

    const type = typeof options === 'string' ? options : options?.type;
    if (type === 'json') {
      try {
        return JSON.parse(entry.value);
      } catch {
        return null;
      }
    }
    return entry.value;
  }

  async put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: { expirationTtl?: number; expiration?: number },
  ): Promise<void> {
    let stringVal: string;
    if (typeof value === 'string') {
      stringVal = value;
    } else {
      stringVal = String(value);
    }

    let expiration: number | undefined;
    if (options?.expirationTtl) {
      expiration = Date.now() / 1000 + options.expirationTtl;
    } else if (options?.expiration) {
      expiration = options.expiration;
    }

    this.store.set(key, { value: stringVal, expiration });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string; expiration?: number }[];
    list_complete: boolean;
    cursor?: string;
  }> {
    const prefix = options?.prefix || '';
    const matching: { name: string; expiration?: number }[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiration && entry.expiration < Date.now() / 1000) {
        this.store.delete(key);
        continue;
      }
      if (key.startsWith(prefix)) {
        matching.push({ name: key, expiration: entry.expiration });
      }
    }

    return {
      keys: matching,
      list_complete: true,
    };
  }

  // Test helper to inspect store directly
  _dump(): Record<string, string> {
    const res: Record<string, string> = {};
    for (const [k, v] of this.store.entries()) {
      res[k] = v.value;
    }
    return res;
  }

  _clear(): void {
    this.store.clear();
  }
}

export function createMockEnv(overrides?: Partial<import('../../src/types').Env>): import('../../src/types').Env {
  const kv = new MockKVNamespace();
  return {
    REPLY_STORE: kv as unknown as KVNamespace,
    MEDIA_ID: '18042938491024821',
    LEAD_SHEET_ID: 'test-sheet-id',
    INSTAGRAM_ACCESS_TOKEN: 'mock-token',
    GEMINI_API_KEY: 'mock-gemini-key',
    GOOGLE_SERVICE_ACCOUNT_JSON: '{}',
    INSTAGRAM_VERIFY_TOKEN: 'test_secret_token_123',
    ...overrides,
  };
}


