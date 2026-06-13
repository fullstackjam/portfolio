import type { LangStat, GitHubData, ProfileData } from './types';
import { cached } from './cache';
import { GITHUB_USER, OVERRIDES } from '../data/profile';
import snapshot from '../data/github-snapshot.json';
import type { KVNamespace } from '@cloudflare/workers-types';

interface RawUser {
  login: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string;
}

interface RawRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics?: string[];
  homepage: string | null;
  html_url: string;
  fork: boolean;
}

export function aggregateLanguages(repos: { language: string | null }[]): LangStat[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const { language } of repos) {
    if (!language) continue;
    counts.set(language, (counts.get(language) ?? 0) + 1);
    total++;
  }
  return [...counts.entries()]
    .map(([name, n]) => ({ name, pct: Math.round((n / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

const API = 'https://api.github.com';

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    'User-Agent': 'fullstackjam-site',
    Accept: 'application/vnd.github+json',
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function ghJson(url: string, token?: string): Promise<any> {
  const res = await fetch(url, { headers: headers(token) });
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${url}`);
  return res.json();
}

async function fetchAll(token?: string): Promise<GitHubData> {
  const user = (await ghJson(`${API}/users/${GITHUB_USER}`, token)) as RawUser;
  if (!user || typeof user.login !== 'string') throw new Error('GitHub: unexpected user payload');
  const rawRepos = (await ghJson(`${API}/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, token)) as RawRepo[];

  const profile: ProfileData = {
    name: user.name || user.login,
    bio: OVERRIDES.bio || user.bio || '',
    location: user.location || 'Remote',
    avatarUrl: user.avatar_url,
  };

  const languages: LangStat[] = aggregateLanguages(rawRepos);

  return { profile, languages };
}

/** Orchestrator: cached live data, snapshot fallback so the site is never empty. */
export async function getGitHubData(env: { GITHUB_CACHE: KVNamespace; GITHUB_TOKEN?: string }): Promise<GitHubData> {
  try {
    return await cached(env.GITHUB_CACHE, `gh:${GITHUB_USER}`, 3600, () => fetchAll(env.GITHUB_TOKEN));
  } catch {
    return snapshot as GitHubData;
  }
}
