import type { Repo, LangStat, GitHubData, ProfileData, ContributionDay } from './types';
import { cached } from './cache';
import { GITHUB_USER, OVERRIDES } from '../data/profile';
import snapshot from '../data/github-snapshot.json';
import type { KVNamespace } from '@cloudflare/workers-types';

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

export function mapRepo(r: RawRepo): Repo {
  return {
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    forks: r.forks_count,
    topics: r.topics ?? [],
    homepage: r.homepage || null,
    url: r.html_url,
  };
}

export function selectTopRepos(repos: RawRepo[], limit: number): Repo[] {
  return repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, limit)
    .map(mapRepo);
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

export function sumStars(repos: RawRepo[]): number {
  return repos.reduce((s, r) => s + r.stargazers_count, 0);
}

const API = 'https://api.github.com';
const GQL = 'https://api.github.com/graphql';

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    'User-Agent': 'fullstackjam-portfolio',
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

const LEVELS: Record<number, ContributionDay['level']> = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 };

async function fetchContributions(token: string): Promise<{ days: ContributionDay[]; total: number }> {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
  const res = await fetch(GQL, {
    method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { login: GITHUB_USER } }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);
  const json = await res.json();
  const cal = json.data.user.contributionsCollection.contributionCalendar;
  const days: ContributionDay[] = cal.weeks.flatMap((w: any) =>
    w.contributionDays.map((d: any) => {
      const c = d.contributionCount as number;
      const level = c === 0 ? 0 : c < 3 ? 1 : c < 6 ? 2 : c < 10 ? 3 : 4;
      return { date: d.date, count: c, level: LEVELS[level] };
    }),
  );
  return { days, total: cal.totalContributions };
}

async function fetchAll(token?: string): Promise<GitHubData> {
  const user = await ghJson(`${API}/users/${GITHUB_USER}`, token);
  const rawRepos = await ghJson(`${API}/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, token);

  const profile: ProfileData = {
    name: user.name || user.login,
    bio: OVERRIDES.bio || user.bio || '',
    location: user.location || 'Remote',
    avatarUrl: user.avatar_url,
    followers: user.followers,
    publicRepos: user.public_repos,
    totalStars: sumStars(rawRepos),
  };

  const repos: Repo[] = selectTopRepos(rawRepos, 6);
  const languages: LangStat[] = aggregateLanguages(rawRepos);

  let contributions: ContributionDay[] = [];
  let totalContributions = 0;
  if (token) {
    try {
      const c = await fetchContributions(token);
      contributions = c.days;
      totalContributions = c.total;
    } catch {
      // contributions are optional; degrade gracefully
    }
  }

  return { profile, repos, languages, contributions, totalContributions };
}

/** Orchestrator: cached live data, snapshot fallback so the site is never empty. */
export async function getGitHubData(env: { GITHUB_CACHE: KVNamespace; GITHUB_TOKEN?: string }): Promise<GitHubData> {
  try {
    return await cached(env.GITHUB_CACHE, `gh:${GITHUB_USER}`, 3600, () => fetchAll(env.GITHUB_TOKEN));
  } catch {
    return snapshot as GitHubData;
  }
}
