import type { KVNamespace } from '@cloudflare/workers-types';

interface Entry<T> { data: T; exp: number; }

/**
 * Read-through cache over Workers KV with stale-on-error.
 * `now` is injectable for testing.
 */
export async function cached<T>(
  kv: KVNamespace,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  now: () => number = Date.now,
): Promise<T> {
  const t = now();
  const entry = (await kv.get(key, 'json')) as Entry<T> | null;

  if (entry && entry.exp > t) return entry.data;

  try {
    const data = await fetcher();
    const next: Entry<T> = { data, exp: t + ttlSeconds * 1000 };
    await kv.put(key, JSON.stringify(next), { expirationTtl: ttlSeconds * 8 });
    return data;
  } catch (err) {
    if (entry) return entry.data; // stale-on-error
    throw err;
  }
}
