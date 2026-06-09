import type { Repo, LangStat, GitHubData, ProfileData, ContributionDay } from './types';
import { cached } from './cache';
import { GITHUB_USER, OVERRIDES, FEATURED_REPOS } from '../data/profile';
import snapshot from '../data/github-snapshot.json';
import type { KVNamespace } from '@cloudflare/workers-types';

interface RawUser {
  login: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string;
  followers: number;
  public_repos: number;
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

export function mapRepo(r: RawRepo): Repo {
  return {
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    forks: r.forks_count,
    topics: r.topics ?? [],
    homepage: r.homepage?.trim() || null,
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

/**
 * Order curated `featured` repos first (in list order), then the remaining
 * repos by stars descending. De-dupes and slices to `limit`.
 */
export function selectFeaturedRepos(repos: Repo[], featured: string[], limit: number): Repo[] {
  const byName = new Map(repos.map((r) => [r.name, r]));
  const seen = new Set<string>();
  const picked: Repo[] = [];
  for (const name of featured) {
    const r = byName.get(name);
    if (r && !seen.has(name)) {
      picked.push(r);
      seen.add(name);
    }
  }
  const rest = repos.filter((r) => !seen.has(r.name)).sort((a, b) => b.stars - a.stars);
  return [...picked, ...rest].slice(0, limit);
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

export function contributionLevel(count: number): ContributionDay['level'] {
  if (count === 0) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
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
    w.contributionDays.map((d: any) => ({
      date: d.date,
      count: d.contributionCount as number,
      level: contributionLevel(d.contributionCount as number),
    })),
  );
  return { days, total: cal.totalContributions };
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
    followers: user.followers,
    publicRepos: user.public_repos,
    totalStars: sumStars(rawRepos),
  };

  const nonFork: Repo[] = rawRepos.filter((r) => !r.fork).map(mapRepo);
  const repos: Repo[] = selectFeaturedRepos(nonFork, FEATURED_REPOS, 6);
  const languages: LangStat[] = aggregateLanguages(rawRepos);

  let contributions: ContributionDay[] = [];
  let totalContributions = 0;
  if (token) {
    try {
      const c = await fetchContributions(token);
      contributions = c.days;
      totalContributions = c.total;
    } catch (err) {
      console.warn('GitHub contributions unavailable:', err instanceof Error ? err.message : err);
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
