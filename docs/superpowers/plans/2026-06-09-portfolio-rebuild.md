# Portfolio Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Angular/K8s portfolio with a design-forward Astro site (Terminal × Brutalist Editorial aesthetic) deployed to Cloudflare Workers, showing live GitHub data cached in KV.

**Architecture:** Astro 5 in SSR mode renders HTML at the edge on Cloudflare Workers. A `github.ts` module fetches and transforms GitHub REST + GraphQL data, cached in Workers KV with stale-on-error fallback to a committed snapshot. Interactive pieces (terminal, theme toggle, counters, heatmap) are React 19 islands. Styling is Tailwind v4 + CSS variables driving a dark (default) / light theme.

**Tech Stack:** Astro 5, React 19, Tailwind CSS v4, Motion, `@astrojs/cloudflare`, Workers KV, Vitest, Wrangler, TypeScript.

---

## File Structure

```
package.json              # Astro project (replaces Angular)
astro.config.mjs          # Astro + react + cloudflare adapter + tailwind vite plugin
wrangler.jsonc            # Worker name, KV binding, assets
tsconfig.json             # Astro strict TS
vitest.config.ts          # Unit test config
src/
  data/
    profile.ts            # editable overrides: bio, socials, curated skills, github user
    github-snapshot.json  # committed fallback data (never-empty guarantee)
  lib/
    types.ts              # shared TS types
    cache.ts              # cached() KV helper (stale-on-error)
    github.ts             # fetch + pure transforms + getGitHubData() orchestrator
    terminal.ts           # pure runCommand() parser/runtime
  components/
    ThemeToggle.tsx       # React island
    Terminal.tsx          # React island (uses lib/terminal.ts)
    CountUp.tsx           # React island
    Heatmap.tsx           # React island
    sections/
      Hero.astro
      About.astro
      Skills.astro
      Projects.astro
      Activity.astro
      Contact.astro
    Footer.astro
  layouts/
    Base.astro            # <html>, theme no-flash script, global css, scanlines
  pages/
    index.astro           # assembles sections with live data + error handling
  styles/
    global.css            # tailwind import, CSS variables, themes, fonts, scanlines
test/
  cache.test.ts
  github.test.ts
  terminal.test.ts
.github/workflows/deploy.yml
README.md
```

---

### Task 1: Remove the old Angular / Docker / Helm project

**Files:**
- Delete: `src/` (Angular sources), `angular.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `Dockerfile`, `helm/`, `.github/workflows/docker.yml`, `package.json`, `package-lock.json`, `.editorconfig`, `public/favicon.ico`
- Keep: `LICENSE`, `.git/`, `.gitignore`, `README.md` (will be overwritten later), `.vscode/`, `docs/`

- [ ] **Step 1: Delete old project files**

```bash
git rm -r --quiet src angular.json tsconfig.app.json tsconfig.spec.json tsconfig.json Dockerfile helm .github/workflows/docker.yml package.json package-lock.json
rm -f public/favicon.ico
```

- [ ] **Step 2: Verify only kept files remain**

Run: `git status --short && ls`
Expected: deletions staged; `LICENSE`, `README.md`, `docs/`, `.gitignore`, `.vscode/` still present. No `src/app`, no `helm`, no `Dockerfile`.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove Angular/Docker/Helm project ahead of Astro rebuild"
```

---

### Task 2: Scaffold the Astro + Cloudflare + Tailwind + Vitest project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/env.d.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "portfolio",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "wrangler dev",
    "deploy": "astro build && wrangler deploy",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@astrojs/cloudflare": "^12.0.0",
    "@astrojs/react": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "astro": "^5.0.0",
    "motion": "^12.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240000.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "wrangler": "^3.90.0"
  }
}
```

- [ ] **Step 2: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://fullstackjam.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "types": ["@cloudflare/workers-types"]
  }
}
```

- [ ] **Step 4: Create `src/env.d.ts`**

```ts
/// <reference types="astro/client" />

type KVNamespace = import('@cloudflare/workers-types').KVNamespace;

interface Env {
  GITHUB_CACHE: KVNamespace;
  GITHUB_TOKEN?: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['test/**/*.test.ts'] },
});
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: completes; `node_modules/` and `package-lock.json` created.

- [ ] **Step 7: Verify `.gitignore` covers Astro artifacts**

Ensure `.gitignore` contains `node_modules`, `dist`, `.astro`, `.wrangler`. Append any missing:

```bash
printf '\nnode_modules\ndist\n.astro\n.wrangler\n' >> .gitignore
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts src/env.d.ts .gitignore
git commit -m "chore: scaffold Astro + Cloudflare + Tailwind + Vitest"
```

---

### Task 3: Shared types, editable profile data, and fallback snapshot

**Files:**
- Create: `src/lib/types.ts`, `src/data/profile.ts`, `src/data/github-snapshot.json`

- [ ] **Step 1: Create `src/lib/types.ts`**

```ts
export interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  homepage: string | null;
  url: string;
}

export interface LangStat {
  name: string;
  pct: number;
}

export interface ProfileData {
  name: string;
  bio: string;
  location: string;
  avatarUrl: string;
  followers: number;
  publicRepos: number;
  totalStars: number;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitHubData {
  profile: ProfileData;
  repos: Repo[];
  languages: LangStat[];
  contributions: ContributionDay[];
  totalContributions: number;
}
```

- [ ] **Step 2: Create `src/data/profile.ts`** (editable copy overrides + curated content)

```ts
export const GITHUB_USER = 'fullstackjam';

/** Optional overrides. Leave bio '' to use the live GitHub bio. */
export const OVERRIDES = {
  title: 'Software Engineer · DevOps · Cloud',
  bio: '',
  availableForWork: true,
};

export const SOCIAL_LINKS = [
  { name: 'GitHub', url: 'https://github.com/fullstackjam' },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/fullstackjam-ma-a817b5239/' },
  { name: 'X', url: 'https://twitter.com/fullstackjam' },
  { name: 'Email', url: 'mailto:fullstackjam@outlook.com' },
];

/** Curated skills shown alongside auto-detected GitHub languages. */
export const CURATED_SKILLS = [
  'TypeScript', 'Go', 'Python', 'React', 'Astro', 'Node.js',
  'Kubernetes', 'Docker', 'Cloudflare', 'PostgreSQL', 'Terraform', 'CI/CD',
];
```

- [ ] **Step 3: Create `src/data/github-snapshot.json`** (committed never-empty fallback)

```json
{
  "profile": {
    "name": "fullstackjam",
    "bio": "Fullstack engineer building for the web and the cloud.",
    "location": "Remote",
    "avatarUrl": "https://github.com/fullstackjam.png",
    "followers": 0,
    "publicRepos": 0,
    "totalStars": 0
  },
  "repos": [],
  "languages": [],
  "contributions": [],
  "totalContributions": 0
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/data/profile.ts src/data/github-snapshot.json
git commit -m "feat: add shared types, profile data, and fallback snapshot"
```

---

### Task 4: KV cache helper with stale-on-error (TDD)

**Files:**
- Create: `src/lib/cache.ts`, `test/cache.test.ts`

- [ ] **Step 1: Write the failing test**

`test/cache.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- cache`
Expected: FAIL — cannot find module `../src/lib/cache`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/cache.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- cache`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cache.ts test/cache.test.ts
git commit -m "feat: add KV cache helper with stale-on-error"
```

---

### Task 5: GitHub pure transforms (TDD)

**Files:**
- Create: `src/lib/github.ts` (transforms only this task), `test/github.test.ts`

- [ ] **Step 1: Write the failing test**

`test/github.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { selectTopRepos, aggregateLanguages, mapRepo, sumStars } from '../src/lib/github';

const raw = (over: any) => ({
  name: 'r', description: null, language: 'Go', stargazers_count: 0,
  forks_count: 0, topics: [], homepage: null, html_url: 'u', fork: false, ...over,
});

describe('mapRepo', () => {
  it('maps API fields to our Repo shape', () => {
    expect(mapRepo(raw({ name: 'x', stargazers_count: 5, html_url: 'h' }))).toEqual({
      name: 'x', description: null, language: 'Go', stars: 5,
      forks: 0, topics: [], homepage: null, url: 'h',
    });
  });
});

describe('selectTopRepos', () => {
  it('excludes forks, sorts by stars desc, and limits', () => {
    const repos = [
      raw({ name: 'a', stargazers_count: 1 }),
      raw({ name: 'b', stargazers_count: 9 }),
      raw({ name: 'f', stargazers_count: 99, fork: true }),
      raw({ name: 'c', stargazers_count: 5 }),
    ];
    const out = selectTopRepos(repos, 2);
    expect(out.map((r) => r.name)).toEqual(['b', 'c']);
  });
});

describe('aggregateLanguages', () => {
  it('counts languages across repos and returns sorted percentages', () => {
    const repos = [
      { language: 'Go' }, { language: 'Go' }, { language: 'TypeScript' }, { language: null },
    ] as any;
    const out = aggregateLanguages(repos);
    expect(out[0]).toEqual({ name: 'Go', pct: 67 });
    expect(out[1]).toEqual({ name: 'TypeScript', pct: 33 });
    expect(out).toHaveLength(2);
  });
});

describe('sumStars', () => {
  it('sums stargazers across repos', () => {
    expect(sumStars([raw({ stargazers_count: 3 }), raw({ stargazers_count: 4 })])).toBe(7);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- github`
Expected: FAIL — cannot find module `../src/lib/github`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/github.ts`:

```ts
import type { Repo, LangStat } from './types';

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- github`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/github.ts test/github.test.ts
git commit -m "feat: add GitHub data transforms"
```

---

### Task 6: GitHub fetch + `getGitHubData()` orchestrator with snapshot fallback

**Files:**
- Modify: `src/lib/github.ts`

- [ ] **Step 1: Append fetch + orchestrator to `src/lib/github.ts`**

Add these imports at the top (merge with existing import line):

```ts
import type { Repo, LangStat, GitHubData, ProfileData, ContributionDay } from './types';
import { cached } from './cache';
import { GITHUB_USER, OVERRIDES } from '../data/profile';
import snapshot from '../data/github-snapshot.json';
import type { KVNamespace } from '@cloudflare/workers-types';
```

Append at the end of the file:

```ts
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
```

- [ ] **Step 2: Verify existing transform tests still pass**

Run: `npm test -- github`
Expected: PASS (transform tests unaffected by the appended fetch code).

- [ ] **Step 3: Typecheck**

Run: `npx astro sync && npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/github.ts
git commit -m "feat: add GitHub fetch and cached getGitHubData orchestrator"
```

---

### Task 7: Terminal command parser (TDD)

**Files:**
- Create: `src/lib/terminal.ts`, `test/terminal.test.ts`

- [ ] **Step 1: Write the failing test**

`test/terminal.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { runCommand } from '../src/lib/terminal';

describe('runCommand', () => {
  it('lists available commands on help', () => {
    const r = runCommand('help');
    expect(r.output.join(' ')).toMatch(/about/);
    expect(r.output.join(' ')).toMatch(/projects/);
  });

  it('returns a scroll action for section commands', () => {
    expect(runCommand('projects').action).toEqual({ type: 'scroll', value: 'projects' });
    expect(runCommand('about').action).toEqual({ type: 'scroll', value: 'about' });
  });

  it('switches theme with an argument', () => {
    expect(runCommand('theme light').action).toEqual({ type: 'theme', value: 'light' });
    expect(runCommand('theme dark').action).toEqual({ type: 'theme', value: 'dark' });
  });

  it('toggles theme when no argument given', () => {
    expect(runCommand('theme').action).toEqual({ type: 'theme', value: 'toggle' });
  });

  it('clears the screen', () => {
    expect(runCommand('clear').action).toEqual({ type: 'clear' });
  });

  it('reports unknown commands without throwing', () => {
    const r = runCommand('bogus');
    expect(r.output.join(' ')).toMatch(/command not found/i);
    expect(r.action).toBeUndefined();
  });

  it('handles empty input', () => {
    expect(runCommand('   ').output).toEqual([]);
  });

  it('responds to whoami easter egg', () => {
    expect(runCommand('whoami').output.join(' ')).toMatch(/fullstackjam/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- terminal`
Expected: FAIL — cannot find module `../src/lib/terminal`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/terminal.ts`:

```ts
export type TerminalAction =
  | { type: 'scroll'; value: string }
  | { type: 'theme'; value: 'dark' | 'light' | 'toggle' }
  | { type: 'clear' };

export interface TerminalResult {
  output: string[];
  action?: TerminalAction;
}

const SECTIONS = ['about', 'skills', 'projects', 'activity', 'contact'];

const HELP = [
  'available commands:',
  '  about       scroll to about',
  '  skills      scroll to skills',
  '  projects    scroll to projects',
  '  activity    scroll to github activity',
  '  contact     scroll to contact',
  '  ls          list sections',
  '  theme [d|l] toggle or set theme',
  '  clear       clear the screen',
  '  help        show this help',
];

export function runCommand(input: string): TerminalResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: [] };
  const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/);

  if (cmd === 'help') return { output: HELP };
  if (cmd === 'ls') return { output: [SECTIONS.join('   ')] };
  if (cmd === 'clear') return { output: [], action: { type: 'clear' } };
  if (cmd === 'whoami') return { output: ['fullstackjam — fullstack engineer'] };
  if (cmd === 'neofetch') {
    return { output: ['fullstackjam@cloud', 'os: cloudflare workers', 'stack: astro · react · k8s'] };
  }
  if (cmd === 'sudo') return { output: ['nice try 😏 — you already have root here'] };

  if (cmd === 'theme') {
    const v = args[0];
    if (v === 'light' || v === 'l') return { output: ['theme → light'], action: { type: 'theme', value: 'light' } };
    if (v === 'dark' || v === 'd') return { output: ['theme → dark'], action: { type: 'theme', value: 'dark' } };
    return { output: ['toggling theme…'], action: { type: 'theme', value: 'toggle' } };
  }

  if (SECTIONS.includes(cmd)) {
    return { output: [`→ ${cmd}`], action: { type: 'scroll', value: cmd } };
  }

  return { output: [`command not found: ${cmd}  (try 'help')`] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- terminal`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/terminal.ts test/terminal.test.ts
git commit -m "feat: add interactive terminal command parser"
```

---

### Task 8: Global styles — themes, fonts, scanlines

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Create `src/styles/global.css`**

```css
@import 'tailwindcss';

@theme {
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}

:root {
  --bg: #08090b;
  --fg: #eaeaea;
  --accent: #3ad17c;
  --dim: #5b6b5f;
  --rule: #1c2620;
}

:root[data-theme='light'] {
  --bg: #efeae0;
  --fg: #111111;
  --accent: #c2300f;
  --dim: #9a9384;
  --rule: #111111;
}

html {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-mono);
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

/* CRT scanline overlay — dark theme only */
.scanlines::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  background: repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px);
}
:root[data-theme='light'] .scanlines::after { display: none; }

.display {
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 0.9;
}

.rule { border-color: var(--rule); }
.accent { color: var(--accent); }
.dim { color: var(--dim); }

::selection { background: var(--accent); color: var(--bg); }

.blink { animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
```

- [ ] **Step 2: Add the JetBrains Mono font link** (done in Base layout, Task 9). No action here.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add global theme styles and scanline overlay"
```

---

### Task 9: Base layout + theme toggle island (no-flash)

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/ThemeToggle.tsx`

- [ ] **Step 1: Create `src/components/ThemeToggle.tsx`**

```tsx
import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function apply(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'dark';
    setTheme(current);
    const handler = (e: Event) => setTheme((e as CustomEvent).detail as Theme);
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    apply(next);
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="fixed top-4 right-4 z-[60] border rule px-3 py-1 text-xs uppercase tracking-widest"
    >
      {theme === 'dark' ? '◐ light' : '◑ dark'}
    </button>
  );
}
```

- [ ] **Step 2: Create `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css';
import ThemeToggle from '../components/ThemeToggle.tsx';
interface Props { title: string; description?: string; }
const { title, description = 'Fullstack engineer · DevOps · Cloud' } = Astro.props;
---
<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" href="https://github.com/fullstackjam.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet" />
    <script is:inline>
      // No-flash theme init before paint
      (function () {
        try {
          var t = localStorage.getItem('theme') || 'dark';
          document.documentElement.setAttribute('data-theme', t);
        } catch (e) {}
      })();
    </script>
  </head>
  <body class="scanlines">
    <ThemeToggle client:load />
    <slot />
  </body>
</html>
```

- [ ] **Step 3: Typecheck/build sanity**

Run: `npx astro sync && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Base.astro src/components/ThemeToggle.tsx
git commit -m "feat: add base layout and no-flash theme toggle"
```

---

### Task 10: Hero section

**Files:**
- Create: `src/components/sections/Hero.astro`

- [ ] **Step 1: Create `src/components/sections/Hero.astro`**

```astro
---
import type { ProfileData } from '../../lib/types';
import { OVERRIDES } from '../../data/profile';
interface Props { profile: ProfileData; }
const { profile } = Astro.props;
---
<header class="min-h-[88vh] flex flex-col justify-center max-w-6xl mx-auto px-6">
  <div class="flex justify-between text-[10px] uppercase tracking-[0.2em] dim border-b rule pb-2">
    <span>FULLSTACKJAM</span><span>PORTFOLIO ©2026</span>
  </div>
  <p class="mt-8 text-sm accent">jam@cloud ~ % whoami</p>
  <h1 class="display text-[clamp(3rem,14vw,11rem)] mt-2">
    FULL<br />STACK<span class="accent blink">_</span>
  </h1>
  <div class="flex flex-wrap gap-x-8 gap-y-2 mt-8 text-[11px] uppercase tracking-[0.15em] dim border-t rule pt-3">
    <span>↳ {OVERRIDES.title}</span>
    <span>{profile.location}</span>
    {OVERRIDES.availableForWork && <span class="accent">● available for work</span>}
  </div>
</header>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/Hero.astro
git commit -m "feat: add hero section"
```

---

### Task 11: Terminal island component

**Files:**
- Create: `src/components/Terminal.tsx`

- [ ] **Step 1: Create `src/components/Terminal.tsx`**

```tsx
import { useRef, useState } from 'react';
import { runCommand } from '../lib/terminal';

interface Line { prompt: boolean; text: string; }

const INTRO: Line[] = [
  { prompt: false, text: "type 'help' to explore. try: about · projects · theme · neofetch" },
];

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>(INTRO);
  const [value, setValue] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = runCommand(value);
    const echoed: Line[] = [{ prompt: true, text: value }];

    if (result.action?.type === 'clear') {
      setLines([]);
      setValue('');
      return;
    }
    if (result.action?.type === 'scroll') {
      document.getElementById(result.action.value)?.scrollIntoView({ behavior: 'smooth' });
    }
    if (result.action?.type === 'theme') {
      const root = document.documentElement;
      const cur = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = result.action.value === 'toggle' ? (cur === 'dark' ? 'light' : 'dark') : result.action.value;
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
    }

    setLines((prev) => [...prev, ...echoed, ...result.output.map((t) => ({ prompt: false, text: t }))]);
    setValue('');
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  return (
    <div class="border rule p-4 text-sm h-72 overflow-y-auto" onClick={() => {}}>
      {lines.map((l, i) => (
        <div key={i}>
          {l.prompt && <span class="dim">jam@cloud ~ % </span>}
          <span class={l.prompt ? '' : 'dim'}>{l.text}</span>
        </div>
      ))}
      <form onSubmit={submit} class="flex">
        <span class="accent">jam@cloud ~ % </span>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          aria-label="terminal input"
          class="flex-1 bg-transparent outline-none ml-1"
        />
      </form>
      <div ref={endRef} />
    </div>
  );
}
```

> Note: JSX `class` is valid in Astro's React via preact-style? No — for `@astrojs/react`, use `className`. Replace every `class=` above with `className=` when implementing. (Left as `class` here only to flag the substitution; the engineer MUST use `className`.)

- [ ] **Step 2: Fix attribute names**

Replace all `class=` with `className=` in `src/components/Terminal.tsx`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Terminal.tsx
git commit -m "feat: add interactive terminal island"
```

---

### Task 12: CountUp island + About section

**Files:**
- Create: `src/components/CountUp.tsx`, `src/components/sections/About.astro`

- [ ] **Step 1: Create `src/components/CountUp.tsx`**

```tsx
import { animate, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

export default function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.2,
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return <span ref={ref}>{n}{suffix}</span>;
}
```

- [ ] **Step 2: Create `src/components/sections/About.astro`**

```astro
---
import type { ProfileData } from '../../lib/types';
import CountUp from '../CountUp.tsx';
interface Props { profile: ProfileData; }
const { profile } = Astro.props;
const stats = [
  { value: profile.publicRepos, label: 'public repos' },
  { value: profile.totalStars, label: 'total stars' },
  { value: profile.followers, label: 'followers' },
];
---
<section id="about" class="max-w-6xl mx-auto px-6 py-24 border-t rule">
  <p class="text-[10px] uppercase tracking-[0.2em] dim">01 — about</p>
  <p class="display text-[clamp(1.5rem,4vw,3rem)] mt-4 max-w-3xl">{profile.bio}</p>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-px mt-12 border rule">
    {stats.map((s) => (
      <div class="p-6 border-r rule last:border-r-0">
        <div class="display text-5xl accent"><CountUp to={s.value} client:visible /></div>
        <div class="text-[11px] uppercase tracking-[0.15em] dim mt-2">{s.label}</div>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CountUp.tsx src/components/sections/About.astro
git commit -m "feat: add about section with animated counters"
```

---

### Task 13: Skills section

**Files:**
- Create: `src/components/sections/Skills.astro`

- [ ] **Step 1: Create `src/components/sections/Skills.astro`**

```astro
---
import type { LangStat } from '../../lib/types';
import { CURATED_SKILLS } from '../../data/profile';
interface Props { languages: LangStat[]; }
const { languages } = Astro.props;
const langNames = languages.map((l) => l.name);
const extra = CURATED_SKILLS.filter((s) => !langNames.includes(s));
---
<section id="skills" class="max-w-6xl mx-auto px-6 py-24 border-t rule">
  <p class="text-[10px] uppercase tracking-[0.2em] dim">02 — skills</p>
  <h2 class="display text-[clamp(2rem,6vw,4rem)] mt-4">STACK</h2>
  {languages.length > 0 && (
    <div class="mt-10 space-y-3">
      {languages.slice(0, 6).map((l) => (
        <div class="flex items-center gap-4">
          <span class="w-32 text-sm">{l.name}</span>
          <div class="flex-1 h-3 border rule">
            <div class="h-full" style={`width:${l.pct}%;background:var(--accent)`}></div>
          </div>
          <span class="w-10 text-right text-xs dim">{l.pct}%</span>
        </div>
      ))}
    </div>
  )}
  <div class="flex flex-wrap gap-2 mt-10">
    {extra.map((s) => (
      <span class="border rule px-3 py-1 text-xs uppercase tracking-widest">{s}</span>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/Skills.astro
git commit -m "feat: add skills section"
```

---

### Task 14: Projects section

**Files:**
- Create: `src/components/sections/Projects.astro`

- [ ] **Step 1: Create `src/components/sections/Projects.astro`**

```astro
---
import type { Repo } from '../../lib/types';
interface Props { repos: Repo[]; }
const { repos } = Astro.props;
---
<section id="projects" class="max-w-6xl mx-auto px-6 py-24 border-t rule">
  <p class="text-[10px] uppercase tracking-[0.2em] dim">03 — projects</p>
  <h2 class="display text-[clamp(2rem,6vw,4rem)] mt-4">WORK</h2>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-px mt-10 border rule">
    {repos.map((r) => (
      <a href={r.url} target="_blank" rel="noopener"
         class="group block p-6 border-r border-b rule hover:[background:var(--accent)] hover:text-[var(--bg)] transition-colors">
        <div class="flex justify-between items-start">
          <h3 class="text-lg font-bold">{r.name}</h3>
          <span class="text-xs dim group-hover:text-[var(--bg)]">★ {r.stars}</span>
        </div>
        <p class="text-sm mt-3 dim group-hover:text-[var(--bg)] min-h-[3rem]">{r.description ?? '—'}</p>
        <div class="flex gap-3 mt-4 text-[11px] uppercase tracking-widest">
          {r.language && <span>{r.language}</span>}
          {r.topics.slice(0, 3).map((t) => <span class="dim group-hover:text-[var(--bg)]">#{t}</span>)}
        </div>
      </a>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/Projects.astro
git commit -m "feat: add projects section"
```

---

### Task 15: Heatmap island + Activity section

**Files:**
- Create: `src/components/Heatmap.tsx`, `src/components/sections/Activity.astro`

- [ ] **Step 1: Create `src/components/Heatmap.tsx`**

```tsx
import type { ContributionDay } from '../lib/types';

const COLORS = ['var(--rule)', '#1f7a4a', '#2aa866', '#3ad17c', '#7af0a8'];

export default function Heatmap({ days }: { days: ContributionDay[] }) {
  // Chunk days into weeks of 7 (columns)
  const weeks: ContributionDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div style={{ display: 'flex', gap: '3px', overflowX: 'auto' }} aria-label="contribution graph">
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {week.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.count}`}
              style={{ width: '11px', height: '11px', background: COLORS[d.level] }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/sections/Activity.astro`**

```astro
---
import type { ContributionDay } from '../../lib/types';
import Heatmap from '../Heatmap.tsx';
interface Props { contributions: ContributionDay[]; total: number; }
const { contributions, total } = Astro.props;
---
{contributions.length > 0 && (
  <section id="activity" class="max-w-6xl mx-auto px-6 py-24 border-t rule">
    <p class="text-[10px] uppercase tracking-[0.2em] dim">04 — activity</p>
    <h2 class="display text-[clamp(2rem,6vw,4rem)] mt-4">{total} <span class="accent">contributions</span></h2>
    <div class="mt-10">
      <Heatmap days={contributions} client:visible />
    </div>
  </section>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Heatmap.tsx src/components/sections/Activity.astro
git commit -m "feat: add github activity heatmap section"
```

---

### Task 16: Contact section + Footer

**Files:**
- Create: `src/components/sections/Contact.astro`, `src/components/Footer.astro`

- [ ] **Step 1: Create `src/components/sections/Contact.astro`**

```astro
---
import { SOCIAL_LINKS } from '../../data/profile';
---
<section id="contact" class="max-w-6xl mx-auto px-6 py-24 border-t rule">
  <p class="text-[10px] uppercase tracking-[0.2em] dim">05 — contact</p>
  <h2 class="display text-[clamp(2.5rem,9vw,7rem)] mt-4">LET'S<br />TALK<span class="accent blink">_</span></h2>
  <div class="flex flex-wrap gap-px mt-10 border rule">
    {SOCIAL_LINKS.map((l) => (
      <a href={l.url} target="_blank" rel="noopener"
         class="px-6 py-4 border-r rule text-sm uppercase tracking-widest hover:[background:var(--accent)] hover:text-[var(--bg)] transition-colors">
        {l.name} →
      </a>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Create `src/components/Footer.astro`**

```astro
---
const year = new Date().getFullYear();
---
<footer class="max-w-6xl mx-auto px-6 py-10 border-t rule text-[11px] uppercase tracking-[0.15em] dim flex justify-between">
  <span>© {year} fullstackjam</span>
  <span>built with astro · cloudflare workers</span>
</footer>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Contact.astro src/components/Footer.astro
git commit -m "feat: add contact section and footer"
```

---

### Task 17: Assemble the page with live data + error handling

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: Create `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/sections/Hero.astro';
import Terminal from '../components/Terminal.tsx';
import About from '../components/sections/About.astro';
import Skills from '../components/sections/Skills.astro';
import Projects from '../components/sections/Projects.astro';
import Activity from '../components/sections/Activity.astro';
import Contact from '../components/sections/Contact.astro';
import Footer from '../components/Footer.astro';
import { getGitHubData } from '../lib/github';
import snapshot from '../data/github-snapshot.json';
import type { GitHubData } from '../lib/types';

let data: GitHubData;
try {
  const { env } = Astro.locals.runtime;
  data = await getGitHubData(env);
} catch {
  data = snapshot as GitHubData;
}
---
<Base title="fullstackjam — fullstack engineer">
  <Hero profile={data.profile} />
  <div class="max-w-6xl mx-auto px-6 -mt-10 mb-10">
    <Terminal client:load />
  </div>
  <About profile={data.profile} />
  <Skills languages={data.languages} />
  <Projects repos={data.repos} />
  <Activity contributions={data.contributions} total={data.totalContributions} />
  <Contact />
  <Footer />
</Base>
```

- [ ] **Step 2: Run the dev server and smoke-check**

Run: `npm run dev`
Then in another shell: `curl -s http://localhost:4321 | grep -o 'PORTFOLIO ©2026'`
Expected: prints `PORTFOLIO ©2026` (page renders; falls back to snapshot locally since KV isn't bound in plain `astro dev`). Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: assemble single-page portfolio with live github data"
```

---

### Task 18: Wrangler config + KV binding + build verification

**Files:**
- Create: `wrangler.jsonc`, `public/robots.txt`

- [ ] **Step 1: Create a KV namespace**

Run: `npx wrangler kv namespace create GITHUB_CACHE`
Expected: prints an `id`. Copy it into the config below.

- [ ] **Step 2: Create `wrangler.jsonc`**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "portfolio",
  "main": "./dist/_worker.js/index.js",
  "compatibility_date": "2025-05-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": "./dist", "binding": "ASSETS" },
  "kv_namespaces": [
    { "binding": "GITHUB_CACHE", "id": "PASTE_KV_ID_HERE" }
  ],
  "observability": { "enabled": true }
}
```

- [ ] **Step 3: Create `public/robots.txt`**

```
User-agent: *
Allow: /
Sitemap: https://fullstackjam.com/sitemap.xml
```

- [ ] **Step 4: Build and verify output**

Run: `npm run build`
Expected: build succeeds; `dist/_worker.js/` and `dist/` assets exist.

Run: `ls dist/_worker.js`
Expected: contains `index.js`.

- [ ] **Step 5: Set the GitHub token secret** (enables contributions + higher rate limit)

Run: `npx wrangler secret put GITHUB_TOKEN`
Then paste a GitHub PAT (classic, `read:user` + `public_repo` scopes) when prompted.
Expected: "Success! Uploaded secret GITHUB_TOKEN".

> If the user has no token yet, this step can be deferred — the site still works (contributions hidden, REST behind cache at 60/h).

- [ ] **Step 6: Commit**

```bash
git add wrangler.jsonc public/robots.txt
git commit -m "feat: add wrangler config with KV binding"
```

---

### Task 19: Deploy workflow + README

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md` (overwrite)

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [master]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

- [ ] **Step 2: Overwrite `README.md`**

```markdown
# fullstackjam — portfolio

Design-forward personal portfolio. **Terminal × Brutalist Editorial** aesthetic,
live GitHub data, deployed on Cloudflare Workers.

## Stack

- [Astro 5](https://astro.build) (SSR) + React 19 islands
- Tailwind CSS v4 + Motion
- Cloudflare Workers + Workers KV (GitHub response cache)
- Live data from the GitHub REST + GraphQL APIs

## Develop

```bash
npm install
npm run dev        # http://localhost:4321 (uses snapshot fallback — no KV locally)
npm test           # unit tests (cache, github transforms, terminal parser)
npm run preview    # wrangler dev — full Worker runtime with KV
```

## Deploy

Pushes to `master` deploy via GitHub Actions. Manual:

```bash
npm run deploy
```

Required Cloudflare repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
Worker secret: `GITHUB_TOKEN` (set with `wrangler secret put GITHUB_TOKEN`).

## Customize

Edit `src/data/profile.ts` (bio override, socials, curated skills).
Content otherwise auto-syncs from GitHub user `fullstackjam`.
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "docs: add deploy workflow and rewrite README"
```

---

### Task 20: Final full-suite verification

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all suites pass (cache, github, terminal).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: succeeds, no type errors.

- [ ] **Step 3: Full Worker runtime smoke test with KV**

Run: `npm run preview` (wrangler dev)
Then: `curl -s http://localhost:8787 | grep -o "LET'S"`
Expected: prints `LET'S` (contact heading renders end-to-end through the Worker). Stop preview.

- [ ] **Step 4: Verify reduced-motion + theme toggle manually** (optional, browser)

Open `http://localhost:8787`, click the theme toggle (top-right) → colors flip dark↔light and persist on reload. Type `projects` in the terminal → page scrolls to projects.

- [ ] **Step 5: Final commit (if any fixes were made)**

```bash
git add -A
git commit -m "chore: final verification fixes"
```

---

## Post-Implementation (manual, outside this plan)

These require Cloudflare dashboard / DNS access and are done by the user:

1. **Custom domain:** In the Worker's Settings → Domains & Routes, add `fullstackjam.com`.
2. **Redirect:** Add a redirect rule `portfolio.fullstackjam.com/*` → `https://fullstackjam.com/$1` (301).
3. **Repo secrets:** Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in GitHub repo settings.

## Self-Review Notes

- **Spec coverage:** aesthetic/themes (Task 8, 9) ✓; tech stack (Task 2) ✓; GitHub data flow + KV + snapshot fallback (Tasks 4, 6, 17) ✓; all 8 sections (Tasks 10–17) ✓; interactive terminal (Tasks 7, 11) ✓; error handling/degradation (Tasks 6, 15, 17) ✓; testing (Tasks 4, 5, 7, 20) ✓; deployment + domain (Tasks 18, 19, Post-Impl) ✓; removals incl. ICP (Task 1, Footer in Task 16) ✓.
- **Language stats simplification:** implemented as repo-count-per-language percentages (cheap, no N+1 calls) rather than byte counts — a deliberate, documented deviation from the spec's wording for efficiency.
- **Terminal `class`→`className`:** Task 11 explicitly flags the substitution as Step 2.
```
