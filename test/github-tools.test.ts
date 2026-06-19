import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { KVNamespace } from '@cloudflare/workers-types';
import { TOOLS, executeTool } from '../src/lib/github-tools';

function mockKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string, type?: string) => {
      const v = store.get(key);
      if (v === undefined) return null;
      return type === 'json' ? JSON.parse(v) : v;
    }),
    put: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
  } as unknown as KVNamespace;
}

function mockFetch(payload: unknown, status = 200) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  })) as unknown as typeof fetch;
}

describe('TOOLS schema', () => {
  it('exposes three function tools', () => {
    expect(TOOLS).toHaveLength(3);
    const names = TOOLS.map(t => t.function.name);
    expect(names).toEqual(['list_repos', 'get_commits', 'search_repos']);
  });

  it('every tool has type=function and required parameters object', () => {
    for (const t of TOOLS) {
      expect(t.type).toBe('function');
      expect(t.function.parameters.type).toBe('object');
    }
  });
});

describe('executeTool: list_repos', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns formatted lines for each repo', async () => {
    const repos = [
      { name: 'openboot', language: 'Go', stargazers_count: 12, updated_at: '2026-06-10T08:00:00Z' },
      { name: 'k8s-gitops', language: 'Python', stargazers_count: 5, updated_at: '2026-05-01T00:00:00Z' },
    ];
    global.fetch = mockFetch(repos);
    const out = await executeTool('list_repos', {}, mockKv());
    expect(out).toContain('openboot · Go · ⭐12 · updated 2026-06-10');
    expect(out).toContain('k8s-gitops · Python · ⭐5 · updated 2026-05-01');
  });

  it('caps at 20 lines', async () => {
    const repos = Array.from({ length: 30 }, (_, i) => ({
      name: `r${i}`, language: 'TS', stargazers_count: 0, updated_at: '2026-01-01T00:00:00Z',
    }));
    global.fetch = mockFetch(repos);
    const out = await executeTool('list_repos', {}, mockKv());
    expect(out.split('\n')).toHaveLength(20);
  });

  it('uses em-dash for null language', async () => {
    global.fetch = mockFetch([{ name: 'x', language: null, stargazers_count: 0, updated_at: '2026-01-01T00:00:00Z' }]);
    const out = await executeTool('list_repos', {}, mockKv());
    expect(out).toContain('x · — · ⭐0 · updated 2026-01-01');
  });

  it('returns error string on fetch failure', async () => {
    global.fetch = mockFetch({}, 500);
    const out = await executeTool('list_repos', {}, mockKv());
    expect(out).toBe('error fetching repos');
  });

  it('caches the repos response', async () => {
    const repos = [{ name: 'a', language: 'Go', stargazers_count: 1, updated_at: '2026-01-01T00:00:00Z' }];
    const fetchSpy = mockFetch(repos);
    global.fetch = fetchSpy;
    const kv = mockKv();
    await executeTool('list_repos', {}, kv);
    await executeTool('list_repos', {}, kv);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

function mockFetchStatus(payload: unknown, status: number) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  })) as unknown as typeof fetch;
}

describe('executeTool: get_commits', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('returns formatted commit lines', async () => {
    const commits = [
      { sha: 'abcdef1234567', commit: { message: 'feat: add x\n\nbody', author: { date: '2026-06-15T10:00:00Z' } } },
      { sha: '0123456789ab0', commit: { message: 'fix: y', author: { date: '2026-06-14T09:00:00Z' } } },
    ];
    global.fetch = mockFetch(commits);
    const out = await executeTool('get_commits', { repo: 'openboot', limit: 2 }, mockKv());
    expect(out).toContain('[abcdef1] 2026-06-15: feat: add x');
    expect(out).toContain('[0123456] 2026-06-14: fix: y');
  });

  it('defaults limit to 5 when omitted', async () => {
    const fetchSpy = mockFetch([]);
    global.fetch = fetchSpy;
    await executeTool('get_commits', { repo: 'openboot' }, mockKv());
    const url = (fetchSpy as unknown as { mock: { calls: [string][] } }).mock.calls[0][0];
    expect(url).toContain('per_page=5');
  });

  it('clamps limit to 10', async () => {
    const fetchSpy = mockFetch([]);
    global.fetch = fetchSpy;
    await executeTool('get_commits', { repo: 'openboot', limit: 50 }, mockKv());
    const url = (fetchSpy as unknown as { mock: { calls: [string][] } }).mock.calls[0][0];
    expect(url).toContain('per_page=10');
  });

  it('clamps limit to minimum 1', async () => {
    const fetchSpy = mockFetch([]);
    global.fetch = fetchSpy;
    await executeTool('get_commits', { repo: 'openboot', limit: 0 }, mockKv());
    const url = (fetchSpy as unknown as { mock: { calls: [string][] } }).mock.calls[0][0];
    expect(url).toContain('per_page=1');
  });

  it('returns repo not found on 404', async () => {
    global.fetch = mockFetchStatus({}, 404);
    const out = await executeTool('get_commits', { repo: 'nope' }, mockKv());
    expect(out).toBe('repo not found');
  });

  it('returns rate limit string on 403', async () => {
    global.fetch = mockFetchStatus({}, 403);
    const out = await executeTool('get_commits', { repo: 'openboot' }, mockKv());
    expect(out).toBe('GitHub rate limit hit — try again shortly');
  });
});

describe('executeTool: unknown tool', () => {
  it('returns unknown tool string', async () => {
    const out = await executeTool('nonsense', {}, mockKv());
    expect(out).toBe('unknown tool');
  });
});
