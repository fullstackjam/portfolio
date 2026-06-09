# Portfolio Editorial Redesign (v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the loud brutalist-terminal front-end with a quiet Refined Editorial design (Instrument Serif, warm paper palette) and beautiful interactions (smooth scroll, scroll reveals, magnetic links), backed by real drafted copy and curated featured repos. Backend (GitHub data, KV, deploy) unchanged.

**Architecture:** Keep `src/lib/github.ts` + `cache.ts` + KV + wrangler/CI. Add curated featured-repo selection. Rewrite all section components, `global.css`, and the Base layout for the editorial aesthetic. Add a small interaction layer (Lenis smooth scroll + `Reveal`/`RevealText` Motion islands + a `useMagnetic` hook). Remove the terminal and count-up.

**Tech Stack:** Astro 5, React 19 islands, Tailwind v4, Motion, **lenis** (new), Instrument Serif + Inter, Cloudflare Workers + KV.

---

## File Structure

```
src/data/profile.ts          # REWRITE: + POSITIONING, ABOUT, FEATURED_REPOS, PROJECT_BLURBS
src/lib/github.ts            # MODIFY: add selectFeaturedRepos, use it in fetchAll
src/lib/magnetic.ts          # NEW: pure magneticOffset()
src/lib/useMagnetic.ts       # NEW: React hook wrapping magneticOffset
src/styles/global.css        # REWRITE: editorial palette/type, lenis css, remove scanlines
src/components/SmoothScroll.tsx   # NEW: Lenis init island
src/components/Reveal.tsx         # NEW: block in-view reveal island
src/components/RevealText.tsx     # NEW: heading word-stagger reveal island
src/components/ThemeToggle.tsx    # RESTYLE
src/components/Heatmap.tsx        # MODIFY: theme-aware warm ramp
src/components/MagneticLink.tsx   # NEW: magnetic anchor island
src/components/sections/Hero.astro     # REWRITE
src/components/sections/About.astro    # REWRITE
src/components/sections/Work.astro     # NEW (replaces Projects.astro)
src/components/sections/Stack.astro    # REWRITE (replaces Skills.astro)
src/components/sections/Activity.astro # RESTYLE
src/components/sections/Contact.astro  # REWRITE
src/components/Footer.astro            # RESTYLE
src/pages/index.astro        # REWRITE: new sections, SmoothScroll, no terminal
test/github.test.ts          # MODIFY: add selectFeaturedRepos tests
test/magnetic.test.ts        # NEW
REMOVED: src/components/Terminal.tsx, src/lib/terminal.ts, test/terminal.test.ts,
         src/components/CountUp.tsx, src/components/sections/Projects.astro,
         src/components/sections/Skills.astro
```

---

### Task 1: Remove terminal + count-up, add lenis dependency

**Files:**
- Delete: `src/components/Terminal.tsx`, `src/lib/terminal.ts`, `test/terminal.test.ts`, `src/components/CountUp.tsx`
- Modify: `package.json`

- [ ] **Step 1: Delete obsolete files**

```bash
git rm src/components/Terminal.tsx src/lib/terminal.ts test/terminal.test.ts src/components/CountUp.tsx
```

- [ ] **Step 2: Install lenis**

Run: `npm install lenis@^1.1.0`
Expected: adds `lenis` to dependencies (use latest 1.x if that range fails).

- [ ] **Step 3: Verify remaining tests still pass**

Run: `npm test`
Expected: `cache.test.ts` + `github.test.ts` pass; terminal tests gone.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove terminal/count-up, add lenis for smooth scroll"
```

---

### Task 2: Curated content + featured-repo selection

**Files:**
- Modify: `src/data/profile.ts`, `src/lib/github.ts`, `test/github.test.ts`

- [ ] **Step 1: Add the failing test for `selectFeaturedRepos`**

Add to `test/github.test.ts` (extend the existing import line and append the describe block):

```ts
// extend existing import:
import { selectTopRepos, aggregateLanguages, mapRepo, sumStars, contributionLevel, selectFeaturedRepos } from '../src/lib/github';

describe('selectFeaturedRepos', () => {
  const repo = (name: string, stars: number) => ({
    name, description: null, language: 'Go', stars, forks: 0, topics: [], homepage: null, url: 'u',
  });

  it('orders featured repos first by the featured list, then the rest by stars', () => {
    const repos = [repo('a', 1), repo('star', 50), repo('k8s', 2), repo('b', 9)];
    const out = selectFeaturedRepos(repos, ['k8s', 'a'], 4);
    expect(out.map((r) => r.name)).toEqual(['k8s', 'a', 'star', 'b']);
  });

  it('ignores featured names that do not exist and de-dupes', () => {
    const repos = [repo('k8s', 2), repo('b', 9)];
    const out = selectFeaturedRepos(repos, ['ghost', 'k8s', 'k8s'], 5);
    expect(out.map((r) => r.name)).toEqual(['k8s', 'b']);
  });

  it('respects the limit', () => {
    const repos = [repo('a', 1), repo('b', 2), repo('c', 3)];
    expect(selectFeaturedRepos(repos, [], 2).map((r) => r.name)).toEqual(['c', 'b']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- github`
Expected: FAIL — `selectFeaturedRepos` is not exported.

- [ ] **Step 3: Implement `selectFeaturedRepos`**

Add to `src/lib/github.ts` (near the other pure transforms, after `selectTopRepos`):

```ts
import type { Repo } from './types';

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
```

(Note: `Repo` is already imported at the top of `github.ts`; if the import line already lists it, do not duplicate — this block's import line is illustrative.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- github`
Expected: PASS (all github tests including the 3 new ones).

- [ ] **Step 5: Wire `selectFeaturedRepos` into `fetchAll`**

In `src/lib/github.ts`, add `FEATURED_REPOS` to the profile import:

```ts
import { GITHUB_USER, OVERRIDES, FEATURED_REPOS } from '../data/profile';
```

In `fetchAll`, replace the line `const repos: Repo[] = selectTopRepos(rawRepos, 6);` with:

```ts
  const nonFork: Repo[] = rawRepos.filter((r) => !r.fork).map(mapRepo);
  const repos: Repo[] = selectFeaturedRepos(nonFork, FEATURED_REPOS, 6);
```

- [ ] **Step 6: Rewrite `src/data/profile.ts` with real drafted copy**

```ts
export const GITHUB_USER = 'fullstackjam';

/** Optional overrides. Leave bio '' to use the live GitHub bio. */
export const OVERRIDES = {
  bio: '',
  availableForWork: true,
};

/** Hero positioning. `accent` is the single word rendered italic + in brand color. */
export const POSITIONING = {
  headline: 'Reliable systems, delightful interfaces.',
  accent: 'delightful',
  subline:
    'Fullstack engineer working across the web, Kubernetes, and the cloud — from GitOps pipelines to the pixels people actually touch.',
};

/** About narrative — specific, drawn from real repos (k8s-gitops, canary-deployment, Go, dotfiles). */
export const ABOUT =
  "I'm a fullstack engineer who enjoys the whole stack — shipping the product people see, and running the infrastructure that keeps it alive. Lately that has meant a lot of Kubernetes and Go: a fully GitOps-managed cluster, canary deployments, and a development environment I can reproduce from a single clone. I care about systems that stay up, and interfaces that feel good to use.";

/** Curated order for the Selected Work section; the rest fill in by stars. */
export const FEATURED_REPOS = [
  'k8s-gitops',
  'canary-deployment',
  'flask-watchlist',
  'dotfiles',
  'blog',
  'portfolio',
];

/** One-line "what it solves" per repo. Repos without an entry fall back to their GitHub description. */
export const PROJECT_BLURBS: Record<string, string> = {
  'k8s-gitops': 'A fully version-controlled Kubernetes cluster — infrastructure as code, reconciled by GitOps.',
  'canary-deployment': 'Progressive, low-risk releases — canary rollouts for Kubernetes workloads.',
  'flask-watchlist': 'A small but complete web app — auth, persistence, and a clean UI on Flask.',
  dotfiles: 'My entire development environment, reproducible from a single clone.',
  blog: 'Notes and writing, built and hosted on my own stack.',
  portfolio: 'This site — Astro on Cloudflare Workers, rendered live from GitHub.',
};

export const SOCIAL_LINKS = [
  { name: 'GitHub', url: 'https://github.com/fullstackjam' },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/fullstackjam-ma-a817b5239/' },
  { name: 'X', url: 'https://twitter.com/fullstackjam' },
  { name: 'Email', url: 'mailto:fullstackjam@outlook.com' },
];

/** Curated tools shown alongside auto-detected GitHub languages. */
export const CURATED_SKILLS = [
  'TypeScript', 'Go', 'Python', 'React', 'Astro', 'Node.js',
  'Kubernetes', 'Docker', 'Cloudflare', 'PostgreSQL', 'Terraform', 'CI/CD',
];
```

- [ ] **Step 7: Verify build + types**

Run: `npm test && npx astro sync && npx tsc --noEmit`
Expected: tests pass, no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/data/profile.ts src/lib/github.ts test/github.test.ts
git commit -m "feat: curated featured repos + real drafted editorial copy"
```

---

### Task 3: Editorial global styles

**Files:**
- Rewrite: `src/styles/global.css`

- [ ] **Step 1: Replace `src/styles/global.css` entirely**

```css
@import 'tailwindcss';

@theme {
  --font-serif: 'Instrument Serif', Georgia, 'Times New Roman', serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: ui-monospace, 'SF Mono', Menlo, monospace;
}

:root {
  --bg: #f3efe7;
  --fg: #1a1a1a;
  --accent: #b3401f;
  --muted: #6a6459;
  --rule: #dcd6c8;
  /* contribution heatmap ramp (warm) */
  --hm-0: #e7e1d4;
  --hm-1: #e7b9a3;
  --hm-2: #d98e6e;
  --hm-3: #c0613b;
  --hm-4: #9a3d18;
}

:root[data-theme='dark'] {
  --bg: #14131a;
  --fg: #ece9e2;
  --accent: #e07a5f;
  --muted: #8a8678;
  --rule: #2a2832;
  --hm-0: #24222c;
  --hm-1: #5a3a30;
  --hm-2: #8a5240;
  --hm-3: #b56a4e;
  --hm-4: #e07a5f;
}

html {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

/* lenis smooth-scroll baseline */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

/* Editorial display heading */
.serif { font-family: var(--font-serif); font-weight: 400; line-height: 1.02; letter-spacing: -0.01em; }
.accent { color: var(--accent); }
.muted { color: var(--muted); }
.rule-c { border-color: var(--rule); }

/* small mono section label */
.label { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--muted); }

::selection { background: var(--accent); color: var(--bg); }

/* animated underline for inline links */
.ul { background-image: linear-gradient(var(--accent), var(--accent)); background-size: 0% 1px; background-position: 0 100%; background-repeat: no-repeat; transition: background-size 0.4s cubic-bezier(0.2,0.8,0.2,1); }
.ul:hover { background-size: 100% 1px; }
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: editorial palette, serif/sans type system, lenis styles"
```

---

### Task 4: Magnetic offset (pure) + hook

**Files:**
- Create: `src/lib/magnetic.ts`, `src/lib/useMagnetic.ts`, `test/magnetic.test.ts`

- [ ] **Step 1: Write the failing test**

`test/magnetic.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { magneticOffset } from '../src/lib/magnetic';

const rect = { left: 100, top: 100, width: 100, height: 100 } as DOMRect; // center 150,150

describe('magneticOffset', () => {
  it('returns zero when pointer is outside the radius', () => {
    expect(magneticOffset({ x: 400, y: 400 }, rect, 120, 0.4)).toEqual({ x: 0, y: 0 });
  });

  it('pulls toward the pointer scaled by strength when inside the radius', () => {
    // pointer 30px right, 0 down from center → x = 30*0.4 = 12
    expect(magneticOffset({ x: 180, y: 150 }, rect, 120, 0.4)).toEqual({ x: 12, y: 0 });
  });

  it('returns zero at the exact center', () => {
    expect(magneticOffset({ x: 150, y: 150 }, rect, 120, 0.4)).toEqual({ x: 0, y: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- magnetic`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/magnetic.ts`**

```ts
export interface Point { x: number; y: number; }
export interface RectLike { left: number; top: number; width: number; height: number; }

/** Offset to apply to a magnetic element: pulls toward the pointer within `radius`, scaled by `strength`. */
export function magneticOffset(pointer: Point, rect: RectLike, radius: number, strength: number): Point {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = pointer.x - cx;
  const dy = pointer.y - cy;
  if (Math.hypot(dx, dy) > radius) return { x: 0, y: 0 };
  return { x: dx * strength, y: dy * strength };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- magnetic`
Expected: PASS (3 tests).

- [ ] **Step 5: Implement the hook `src/lib/useMagnetic.ts`**

```ts
import { useEffect, useRef } from 'react';
import { magneticOffset } from './magnetic';

/** Attach to an element to make it ease toward the pointer. No-op for touch / reduced-motion. */
export function useMagnetic<T extends HTMLElement>(radius = 120, strength = 0.4) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    el.style.transition = 'transform 0.25s cubic-bezier(0.2,0.8,0.2,1)';
    el.style.willChange = 'transform';

    const onMove = (e: PointerEvent) => {
      const { x, y } = magneticOffset({ x: e.clientX, y: e.clientY }, el.getBoundingClientRect(), radius, strength);
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    const reset = () => { el.style.transform = 'translate(0px, 0px)'; };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', reset, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', reset);
    };
  }, [radius, strength]);

  return ref;
}
```

- [ ] **Step 6: Typecheck + Commit**

Run: `npx tsc --noEmit`
Expected: clean.

```bash
git add src/lib/magnetic.ts src/lib/useMagnetic.ts test/magnetic.test.ts
git commit -m "feat: magnetic pointer offset helper + hook"
```

---

### Task 5: Interaction islands — SmoothScroll, Reveal, RevealText, MagneticLink

**Files:**
- Create: `src/components/SmoothScroll.tsx`, `src/components/Reveal.tsx`, `src/components/RevealText.tsx`, `src/components/MagneticLink.tsx`

- [ ] **Step 1: Create `src/components/SmoothScroll.tsx`**

```tsx
import { useEffect } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3) });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
  return null;
}
```

- [ ] **Step 2: Create `src/components/Reveal.tsx`**

```tsx
import { motion, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/** Reveals its children (fade + rise) once when scrolled into view. SSR-visible; static under reduced-motion. */
export default function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const visible = !animated || inView;
  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 24 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 3: Create `src/components/RevealText.tsx`**

```tsx
import { motion, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  accent?: string;       // a single word rendered italic + accent color
  className?: string;
  delay?: number;
}

/** Splits a heading into words and reveals them with a gentle upward stagger. SSR-visible; static under reduced-motion. */
export default function RevealText({ text, accent, className = '', delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const words = text.split(' ');
  const show = !animated || inView;

  return (
    <span ref={ref} className={className} style={{ display: 'inline-block' }}>
      {words.map((w, i) => {
        const isAccent = accent && w.replace(/[.,]/g, '') === accent;
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden' }}>
            <motion.span
              style={{ display: 'inline-block', fontStyle: isAccent ? 'italic' : undefined }}
              className={isAccent ? 'accent' : undefined}
              initial={false}
              animate={{ y: show ? 0 : '110%', opacity: show ? 1 : 0 }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: delay + i * 0.06 }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </span>
  );
}
```

- [ ] **Step 4: Create `src/components/MagneticLink.tsx`**

```tsx
import { useMagnetic } from '../lib/useMagnetic';
import type { ReactNode } from 'react';

interface Props {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}

export default function MagneticLink({ href, children, className = '', external = false }: Props) {
  const ref = useMagnetic<HTMLAnchorElement>(100, 0.35);
  const ext = external ? { target: '_blank', rel: 'noopener' } : {};
  return (
    <a ref={ref} href={href} className={`inline-block ${className}`} {...ext}>
      {children}
    </a>
  );
}
```

- [ ] **Step 5: Typecheck + Commit**

Run: `npx tsc --noEmit`
Expected: clean.

```bash
git add src/components/SmoothScroll.tsx src/components/Reveal.tsx src/components/RevealText.tsx src/components/MagneticLink.tsx
git commit -m "feat: interaction islands (smooth scroll, reveal, reveal-text, magnetic link)"
```

---

### Task 6: Restyle ThemeToggle (editorial, default light)

**Files:**
- Modify: `src/components/ThemeToggle.tsx`

- [ ] **Step 1: Replace `src/components/ThemeToggle.tsx`**

```tsx
import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function apply(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
    setTheme(current);
    const handler = (e: Event) => {
      const next = (e as CustomEvent).detail as Theme;
      apply(next);
      setTheme(next);
    };
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, []);

  const toggle = () => {
    const cur = (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
    const next: Theme = cur === 'dark' ? 'light' : 'dark';
    apply(next);
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="fixed top-5 right-5 z-[60] label rule-c border rounded-full px-3 py-1.5 hover:[border-color:var(--accent)] hover:[color:var(--accent)] transition-colors"
      style={{ background: 'color-mix(in srgb, var(--bg) 70%, transparent)', backdropFilter: 'blur(6px)' }}
    >
      {theme === 'dark' ? 'light' : 'dark'}
    </button>
  );
}
```

- [ ] **Step 2: Typecheck + Commit**

Run: `npx tsc --noEmit`
Expected: clean.

```bash
git add src/components/ThemeToggle.tsx
git commit -m "feat: restyle theme toggle for editorial palette (default light)"
```

---

### Task 7: Base layout (fonts, default light, smooth scroll)

**Files:**
- Modify: `src/layouts/Base.astro`

- [ ] **Step 1: Replace `src/layouts/Base.astro`**

```astro
---
import '../styles/global.css';
import ThemeToggle from '../components/ThemeToggle.tsx';
import SmoothScroll from '../components/SmoothScroll.tsx';
interface Props { title: string; description?: string; }
const { title, description = 'Fullstack engineer — reliable systems, delightful interfaces.' } = Astro.props;
---
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" href="https://github.com/fullstackjam.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
    <script is:inline>
      (function () {
        try {
          var t = localStorage.getItem('theme') || 'light';
          document.documentElement.setAttribute('data-theme', t);
        } catch (e) {}
      })();
    </script>
  </head>
  <body>
    <SmoothScroll client:load />
    <ThemeToggle client:load />
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Typecheck + Commit**

Run: `npx astro sync && npx tsc --noEmit`
Expected: clean.

```bash
git add src/layouts/Base.astro
git commit -m "feat: editorial base layout — Instrument Serif/Inter, light default, smooth scroll"
```

---

### Task 8: Hero section

**Files:**
- Rewrite: `src/components/sections/Hero.astro`

- [ ] **Step 1: Replace `src/components/sections/Hero.astro`**

```astro
---
import type { ProfileData } from '../../lib/types';
import { POSITIONING } from '../../data/profile';
import RevealText from '../RevealText.tsx';
import MagneticLink from '../MagneticLink.tsx';
interface Props { profile: ProfileData; }
const { profile } = Astro.props;
---
<header class="min-h-[92vh] flex flex-col justify-center max-w-5xl mx-auto px-6 sm:px-10">
  <div class="flex justify-between label border-b rule-c pb-3">
    <span>{profile.name}</span><span>Portfolio — 2026</span>
  </div>
  <h1 class="serif mt-12 text-[clamp(2.75rem,8vw,6.5rem)] max-w-4xl">
    <RevealText text={POSITIONING.headline} accent={POSITIONING.accent} client:load />
  </h1>
  <p class="font-sans mt-8 max-w-xl text-lg leading-relaxed muted">{POSITIONING.subline}</p>
  <div class="mt-12">
    <MagneticLink href="#work" client:visible className="serif text-2xl italic accent ul">
      selected work ↓
    </MagneticLink>
  </div>
</header>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/Hero.astro
git commit -m "feat: editorial hero with reveal headline + magnetic cta"
```

---

### Task 9: About section

**Files:**
- Rewrite: `src/components/sections/About.astro`

- [ ] **Step 1: Replace `src/components/sections/About.astro`**

```astro
---
import type { ProfileData } from '../../lib/types';
import { ABOUT } from '../../data/profile';
import Reveal from '../Reveal.tsx';
import RevealText from '../RevealText.tsx';
interface Props { profile: ProfileData; sinceYear: number; topLanguages: string[]; }
const { profile, sinceYear, topLanguages } = Astro.props;
const facts = [
  { k: 'On GitHub since', v: String(sinceYear) },
  { k: 'Works mostly in', v: topLanguages.slice(0, 3).join(' · ') || '—' },
  { k: 'Public repos', v: String(profile.publicRepos) },
];
---
<section id="about" class="max-w-5xl mx-auto px-6 sm:px-10 py-28 border-t rule-c">
  <p class="label">01 — about</p>
  <div class="grid md:grid-cols-[1fr_auto] gap-12 items-start mt-8">
    <h2 class="serif text-[clamp(1.75rem,3.6vw,3rem)] max-w-2xl">
      <RevealText text={ABOUT} accent="delightful" client:visible />
    </h2>
    <img
      src={profile.avatarUrl}
      alt={profile.name}
      width="96" height="96" loading="lazy"
      class="rounded-full w-24 h-24 object-cover border rule-c justify-self-start md:justify-self-end"
    />
  </div>
  <Reveal client:visible>
    <dl class="grid grid-cols-1 sm:grid-cols-3 gap-px mt-16 border rule-c">
      {facts.map((f) => (
        <div class="p-6 border-r rule-c last:border-r-0">
          <dt class="label">{f.k}</dt>
          <dd class="serif text-2xl mt-2">{f.v}</dd>
        </div>
      ))}
    </dl>
  </Reveal>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/About.astro
git commit -m "feat: editorial about section with inline facts"
```

---

### Task 10: Work section (replaces Projects)

**Files:**
- Create: `src/components/sections/Work.astro`
- Delete: `src/components/sections/Projects.astro`

- [ ] **Step 1: Create `src/components/sections/Work.astro`**

```astro
---
import type { Repo } from '../../lib/types';
import { PROJECT_BLURBS } from '../../data/profile';
import RevealText from '../RevealText.tsx';
import Reveal from '../Reveal.tsx';
interface Props { repos: Repo[]; }
const { repos } = Astro.props;
const blurb = (r: Repo) => PROJECT_BLURBS[r.name] ?? r.description ?? '';
---
<section id="work" class="max-w-5xl mx-auto px-6 sm:px-10 py-28 border-t rule-c">
  <p class="label">02 — selected work</p>
  <h2 class="serif text-[clamp(2rem,5vw,4rem)] mt-6 mb-12">
    <RevealText text="Things I have built." accent="built." client:visible />
  </h2>
  {repos.length > 0 ? (
    <ul class="border-t rule-c">
      {repos.map((r, i) => (
        <Reveal client:visible delay={i * 0.05}>
          <li>
            <a href={r.url} target="_blank" rel="noopener"
               class="group grid grid-cols-[auto_1fr_auto] gap-6 items-baseline py-8 border-b rule-c transition-[padding] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:pl-4">
              <span class="label">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 class="serif text-3xl group-hover:[color:var(--accent)] transition-colors">{r.name}</h3>
                <p class="font-sans muted mt-2 max-w-xl">{blurb(r)}</p>
              </div>
              <span class="label whitespace-nowrap">{[r.language, r.stars ? `★ ${r.stars}` : null].filter(Boolean).join('  ·  ')}</span>
            </a>
          </li>
        </Reveal>
      ))}
    </ul>
  ) : (
    <p class="font-sans muted">Projects are loading from GitHub — check back in a moment.</p>
  )}
</section>
```

- [ ] **Step 2: Delete the old Projects section**

```bash
git rm src/components/sections/Projects.astro
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Work.astro
git commit -m "feat: editorial selected-work list with hover motion"
```

---

### Task 11: Stack section (replaces Skills)

**Files:**
- Create: `src/components/sections/Stack.astro`
- Delete: `src/components/sections/Skills.astro`

- [ ] **Step 1: Create `src/components/sections/Stack.astro`**

```astro
---
import type { LangStat } from '../../lib/types';
import { CURATED_SKILLS } from '../../data/profile';
import RevealText from '../RevealText.tsx';
import Reveal from '../Reveal.tsx';
interface Props { languages: LangStat[]; }
const { languages } = Astro.props;
const langNames = languages.map((l) => l.name);
const tools = CURATED_SKILLS.filter((s) => !langNames.includes(s));
const topLangs = languages.slice(0, 5);
---
<section id="stack" class="max-w-5xl mx-auto px-6 sm:px-10 py-28 border-t rule-c">
  <p class="label">03 — stack</p>
  <h2 class="serif text-[clamp(2rem,5vw,4rem)] mt-6 mb-12">
    <RevealText text="Tools of the trade." accent="trade." client:visible />
  </h2>
  <Reveal client:visible>
    <div class="grid md:grid-cols-2 gap-12">
      <div>
        <p class="label mb-4">most used on github</p>
        <ul class="space-y-2">
          {topLangs.map((l) => (
            <li class="flex items-baseline justify-between border-b rule-c pb-2">
              <span class="serif text-xl">{l.name}</span>
              <span class="label">{l.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p class="label mb-4">also working with</p>
        <div class="flex flex-wrap gap-x-5 gap-y-3">
          {tools.map((t) => <span class="serif text-xl italic">{t}</span>)}
        </div>
      </div>
    </div>
  </Reveal>
</section>
```

- [ ] **Step 2: Delete the old Skills section**

```bash
git rm src/components/sections/Skills.astro
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Stack.astro
git commit -m "feat: restrained editorial stack section"
```

---

### Task 12: Recolor Heatmap + restyle Activity

**Files:**
- Modify: `src/components/Heatmap.tsx`, `src/components/sections/Activity.astro`

- [ ] **Step 1: Replace `src/components/Heatmap.tsx`** (use theme-aware CSS vars)

```tsx
import type { ContributionDay } from '../lib/types';

const COLORS = ['var(--hm-0)', 'var(--hm-1)', 'var(--hm-2)', 'var(--hm-3)', 'var(--hm-4)'];

export default function Heatmap({ days }: { days: ContributionDay[] }) {
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
              style={{ width: '11px', height: '11px', borderRadius: '2px', background: COLORS[d.level] }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/components/sections/Activity.astro`**

```astro
---
import type { ContributionDay } from '../../lib/types';
import Heatmap from '../Heatmap.tsx';
import RevealText from '../RevealText.tsx';
import Reveal from '../Reveal.tsx';
interface Props { contributions: ContributionDay[]; total: number; }
const { contributions, total } = Astro.props;
---
{contributions.length > 0 && (
  <section id="activity" class="max-w-5xl mx-auto px-6 sm:px-10 py-28 border-t rule-c">
    <p class="label">04 — activity</p>
    <h2 class="serif text-[clamp(2rem,5vw,4rem)] mt-6 mb-12">
      <RevealText text={`${total} contributions, still counting.`} accent="counting." client:visible />
    </h2>
    <Reveal client:visible>
      <Heatmap days={contributions} client:visible />
    </Reveal>
  </section>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Heatmap.tsx src/components/sections/Activity.astro
git commit -m "feat: warm theme-aware contribution heatmap"
```

---

### Task 13: Contact + Footer

**Files:**
- Rewrite: `src/components/sections/Contact.astro`, `src/components/Footer.astro`

- [ ] **Step 1: Replace `src/components/sections/Contact.astro`**

```astro
---
import { SOCIAL_LINKS } from '../../data/profile';
import RevealText from '../RevealText.tsx';
import MagneticLink from '../MagneticLink.tsx';
const email = SOCIAL_LINKS.find((l) => l.name === 'Email');
const others = SOCIAL_LINKS.filter((l) => l.name !== 'Email');
---
<section id="contact" class="max-w-5xl mx-auto px-6 sm:px-10 py-32 border-t rule-c">
  <p class="label">05 — contact</p>
  <h2 class="serif text-[clamp(2.5rem,8vw,6rem)] mt-6 max-w-3xl">
    <RevealText text="Let's build something good together." accent="good" client:visible />
  </h2>
  {email && (
    <div class="mt-10">
      <MagneticLink href={email.url} client:visible className="serif italic text-3xl accent ul">
        {email.url.replace('mailto:', '')}
      </MagneticLink>
    </div>
  )}
  <div class="flex flex-wrap gap-x-8 gap-y-3 mt-12 label">
    {others.map((l) => (
      <a href={l.url} target="_blank" rel="noopener" class="hover:[color:var(--accent)] transition-colors">{l.name} ↗</a>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Replace `src/components/Footer.astro`**

```astro
---
const year = new Date().getFullYear();
---
<footer class="max-w-5xl mx-auto px-6 sm:px-10 py-10 border-t rule-c label flex justify-between">
  <span>© {year} fullstackjam</span>
  <span>Astro · Cloudflare Workers</span>
</footer>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Contact.astro src/components/Footer.astro
git commit -m "feat: editorial contact + minimal footer"
```

---

### Task 14: Assemble the page

**Files:**
- Rewrite: `src/pages/index.astro`

- [ ] **Step 1: Replace `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/sections/Hero.astro';
import About from '../components/sections/About.astro';
import Work from '../components/sections/Work.astro';
import Stack from '../components/sections/Stack.astro';
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

// Editorial facts derived from real data (no count-up; quiet inline facts).
const sinceYear = 2021;
const topLanguages = data.languages.map((l) => l.name);
---
<Base title="fullstackjam — reliable systems, delightful interfaces">
  <Hero profile={data.profile} />
  <About profile={data.profile} sinceYear={sinceYear} topLanguages={topLanguages} />
  <Work repos={data.repos} />
  <Stack languages={data.languages} />
  <Activity contributions={data.contributions} total={data.totalContributions} />
  <Contact />
  <Footer />
</Base>
```

- [ ] **Step 2: Build + smoke check**

Run: `npm run build`
Expected: succeeds; `dist/_worker.js/index.js` exists.

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: assemble editorial single-page portfolio"
```

---

### Task 15: Full verification

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: `cache`, `github` (incl. `selectFeaturedRepos`), `magnetic` all pass; no terminal tests.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: succeeds; `dist/.assetsignore` present (postbuild); `dist/_worker.js/index.js` present.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Local Worker smoke test (optional, manual)**

Run: `npm run preview` (wrangler dev). Open the printed URL: hero headline reveals on load, scrolling reveals sections, theme toggle persists, links are magnetic, reduced-motion (OS setting) shows static content. Stop preview.

- [ ] **Step 5: Final commit (only if fixes were needed)**

```bash
git add -A
git commit -m "chore: editorial redesign verification fixes"
```

---

## Self-Review Notes

- **Spec coverage:** Refined Editorial palette/type (Task 3, 7) ✓; Instrument Serif + italic accent (Task 3, RevealText Task 5, all headings) ✓; warm-paper default + dark toggle (Task 3, 6, 7) ✓; terminal removed (Task 1) ✓; interaction system — smooth scroll/reveal/reveal-text/magnetic (Tasks 4, 5) ✓; all 7 sections (Tasks 8–14) ✓; real drafted copy + featured repos (Task 2) ✓; recolored heatmap (Task 12) ✓; reduced-motion + SSR-visible everywhere (Tasks 5 components) ✓; data pipeline untouched, snapshot fallback (Task 14) ✓; tests for selectFeaturedRepos + magneticOffset (Tasks 2, 4) ✓.
- **Backend deviation (justified):** `fetchAll` now uses `selectFeaturedRepos` over a curated list instead of `selectTopRepos` by stars — the spec calls for curated, meaningful project selection to fight hollowness; `selectTopRepos` is retained (still exported/tested) for reuse.
- **Type consistency:** `RevealText` props `{text, accent?, className?, delay?}` used consistently across Hero/About/Work/Stack/Activity/Contact. `Reveal` props `{children, delay?}`. `selectFeaturedRepos(repos: Repo[], featured: string[], limit)` matches its test and the `fetchAll` call. `Heatmap` still takes `{days}`. `index.astro` passes `sinceYear`/`topLanguages` matching About's Props.
- **No placeholders:** all copy is real drafted text; all component code is complete.
