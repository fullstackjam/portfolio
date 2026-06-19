import type { KVNamespace } from '@cloudflare/workers-types';
import { GITHUB_USER } from '../data/profile';
import { cached } from './cache';

export interface DeepSeekTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, { type: string; description?: string; default?: unknown }>;
      required: string[];
    };
  };
}

export const TOOLS: DeepSeekTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_repos',
      description: "List the site owner's public GitHub repositories, sorted by most recently updated.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_commits',
      description: "Get the most recent commits for a specific repo on the site owner's GitHub.",
      parameters: {
        type: 'object',
        properties: {
          repo: { type: 'string', description: 'Repository name (not full slug)' },
          limit: { type: 'number', description: 'Number of commits to return (1-10)', default: 5 },
        },
        required: ['repo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_repos',
      description: "Search the site owner's public repos by name, description, language, or topic.",
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keyword (case-insensitive)' },
        },
        required: ['query'],
      },
    },
  },
];

const API = 'https://api.github.com';
const TTL = 900;

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    'User-Agent': 'fullstackjam-site',
    Accept: 'application/vnd.github+json',
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

interface RawRepo {
  name: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  description?: string | null;
  topics?: string[];
}

interface RepoLine {
  name: string;
  language: string | null;
  stars: number;
  updated: string;
  description: string;
  topics: string[];
}

async function fetchRepos(kv: KVNamespace, token?: string): Promise<RepoLine[]> {
  return cached(kv, `gh:repos:${GITHUB_USER}`, TTL, async () => {
    const res = await fetch(`${API}/users/${GITHUB_USER}/repos?sort=updated&per_page=30&type=public`, {
      headers: headers(token),
    });
    if (!res.ok) throw new Error(`github ${res.status}`);
    const raw = (await res.json()) as RawRepo[];
    return raw.map(r => ({
      name: r.name,
      language: r.language,
      stars: r.stargazers_count,
      updated: r.updated_at.slice(0, 10),
      description: r.description ?? '',
      topics: r.topics ?? [],
    }));
  });
}

function formatRepos(repos: RepoLine[]): string {
  return repos
    .slice(0, 20)
    .map(r => `${r.name} · ${r.language ?? '—'} · ⭐${r.stars} · updated ${r.updated}`)
    .join('\n');
}

async function listReposTool(kv: KVNamespace, token?: string): Promise<string> {
  try {
    return formatRepos(await fetchRepos(kv, token));
  } catch {
    return 'error fetching repos';
  }
}

interface RawCommit {
  sha: string;
  commit: { message: string; author: { date: string } };
}

async function getCommitsTool(
  repo: string,
  rawLimit: number,
  kv: KVNamespace,
  token?: string,
): Promise<string> {
  const limit = Math.max(1, Math.min(10, Math.floor(rawLimit)));
  const key = `gh:commits:${GITHUB_USER}/${repo}:${limit}`;
  try {
    const lines = await cached<string[]>(kv, key, TTL, async () => {
      const res = await fetch(`${API}/repos/${GITHUB_USER}/${repo}/commits?per_page=${limit}`, {
        headers: headers(token),
      });
      if (res.status === 404) throw new Error('not_found');
      if (res.status === 403) throw new Error('rate_limit');
      if (!res.ok) throw new Error('fetch_failed');
      const raw = (await res.json()) as RawCommit[];
      return raw.map(c => {
        const sha7 = c.sha.slice(0, 7);
        const date = c.commit.author.date.slice(0, 10);
        const firstLine = c.commit.message.split('\n')[0];
        return `[${sha7}] ${date}: ${firstLine}`;
      });
    });
    return lines.join('\n');
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'not_found') return 'repo not found';
    if (msg === 'rate_limit') return 'GitHub rate limit hit — try again shortly';
    return 'error fetching commits';
  }
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  kv: KVNamespace,
  token?: string,
): Promise<string> {
  if (name === 'list_repos') return listReposTool(kv, token);
  if (name === 'get_commits') {
    const repo = String(args.repo ?? '');
    const limit = typeof args.limit === 'number' ? args.limit : 5;
    if (!repo) return 'missing repo';
    return getCommitsTool(repo, limit, kv, token);
  }
  return 'unknown tool';
}
