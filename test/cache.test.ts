import { describe, it, expect, vi } from 'vitest';
import { cached } from '../src/lib/cache';

function mockKV(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    get: vi.fn(async (k: string, _t?: string) => {
      const v = store.get(k);
      return v ? JSON.parse(v) : null;
    }),
    put: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
  } as any;
}

describe('cached', () => {
  it('fetches and stores on miss', async () => {
    const kv = mockKV();
    const fetcher = vi.fn(async () => ({ n: 1 }));
    const out = await cached(kv, 'k', 60, fetcher, () => 1000);
    expect(out).toEqual({ n: 1 });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(kv.put).toHaveBeenCalledOnce();
  });

  it('returns fresh cached value without calling fetcher', async () => {
    const kv = mockKV({ k: JSON.stringify({ data: { n: 2 }, exp: 5000 }) });
    const fetcher = vi.fn(async () => ({ n: 99 }));
    const out = await cached(kv, 'k', 60, fetcher, () => 1000);
    expect(out).toEqual({ n: 2 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('refetches when cached value is expired', async () => {
    const kv = mockKV({ k: JSON.stringify({ data: { n: 2 }, exp: 500 }) });
    const fetcher = vi.fn(async () => ({ n: 3 }));
    const out = await cached(kv, 'k', 60, fetcher, () => 1000);
    expect(out).toEqual({ n: 3 });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('serves stale value when fetcher throws', async () => {
    const kv = mockKV({ k: JSON.stringify({ data: { n: 2 }, exp: 500 }) });
    const fetcher = vi.fn(async () => { throw new Error('upstream'); });
    const out = await cached(kv, 'k', 60, fetcher, () => 1000);
    expect(out).toEqual({ n: 2 });
  });

  it('rethrows when fetcher fails and no cache exists', async () => {
    const kv = mockKV();
    const fetcher = vi.fn(async () => { throw new Error('upstream'); });
    await expect(cached(kv, 'k', 60, fetcher, () => 1000)).rejects.toThrow('upstream');
  });
});
