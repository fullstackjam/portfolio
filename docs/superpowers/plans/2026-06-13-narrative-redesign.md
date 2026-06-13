# Narrative Portfolio Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe the site from a GitHub-analytics dashboard into a first-person narrative portfolio — per-project story cards in an "editorial ledger" visual language, with the heatmap, language % bars, and vanity counters removed.

**Architecture:** Astro 5 + React islands + Tailwind v4, deployed on Cloudflare Workers. Page is a single route (`src/pages/index.astro`) composing section components. Data comes from `getGitHubData()` (live GitHub → KV cache → static snapshot fallback). This redesign is mostly component + CSS work plus a thin data-layer trim (drop the contributions fetch). The reference visual is `docs/superpowers/specs/2026-06-13-portfolio-narrative-redesign-mockup.html` — open it in a browser; it is the visual source of truth.

**Tech Stack:** Astro, React 19, Tailwind v4 (`@layer components` in `src/styles/global.css`), `motion`, Vitest (node env, logic-only tests), Cloudflare Workers/KV.

**Spec:** `docs/superpowers/specs/2026-06-13-portfolio-narrative-redesign-design.md`

**Conventions for this plan:**
- After every task: `npm run build` MUST succeed and `npm test` MUST pass before committing. Each task leaves the build green.
- Visual tasks are verified in the browser via `npm run dev` (Astro dev at http://localhost:4321). Check both light and dark theme (theme toggle, top-right) and a mobile width (~390px).
- Match existing token names: `--fg --bg --surface --accent --muted --rule` and `--font-serif --font-sans --font-mono`. Do NOT introduce the mockup's `--ink/--hair/--serif` aliases.
- Commit messages use Conventional Commits and end with the Co-Authored-By trailer already used in this repo.

---

## File structure

| File | Responsibility | Change |
|------|----------------|--------|
| `src/layouts/Base.astro` | document shell, fonts | add JetBrains Mono |
| `src/styles/global.css` | tokens + `@layer components` | add ledger/reflection/footnote/dashboard/headline styles; mono token; later remove orphaned styles |
| `src/lib/types.ts` | shared types | add `Project`/`Reflection`/`Footnote`; drop `ContributionDay` + contribution fields |
| `src/lib/github.ts` | data fetch/aggregate | remove contributions fetch + `contributionLevel` |
| `test/github.test.ts` | logic tests | drop `contributionLevel` block |
| `test/profile.test.ts` | **new** content-shape guard | create |
| `src/data/profile.ts` | curated content | retype `PROJECTS` to `Project[]`, add narrative fields |
| `src/data/github-snapshot.json` | offline fallback | drop contribution keys |
| `src/components/sections/Hero.astro` | hero | two-line headline, accent proof-underline, colophon, drop followers; keep boot |
| `src/components/sections/About.astro` | about | drop stat counters, quiet facts line |
| `src/components/sections/Work.astro` | work section frame | render `CaseCard` per project |
| `src/components/CaseCard.astro` | **new** one narrative case | create |
| `src/components/OpenbootDashboard.astro` | **new** CSS/ASCII dashboard | create |
| `src/components/sections/Stack.astro` | stack | drop % bars → quiet list |
| `src/components/sections/Activity.astro` | activity | **delete** |
| `src/components/Heatmap.tsx` | heatmap | **delete** (orphan) |
| `src/components/Reveal.tsx` | scroll reveal | **delete** (orphan after Activity) |
| `src/components/CountUp.tsx` | counter | **delete** (orphan after About) |
| `src/pages/index.astro` | route composition | drop Activity + contributions |

---

## Task 1: Add JetBrains Mono and point the mono token at it

**Files:**
- Modify: `src/layouts/Base.astro:19`
- Modify: `src/styles/global.css:6`

- [ ] **Step 1: Add JetBrains Mono to the Google Fonts link**

In `src/layouts/Base.astro`, replace the fonts `<link>` (line 19):

```html
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: Point `--font-mono` at JetBrains Mono**

In `src/styles/global.css`, in the `@theme` block (line 6), replace the `--font-mono` line:

```css
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Base.astro src/styles/global.css
git commit -m "feat(type): load JetBrains Mono for the mono role

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Add the new component styles (additive)

These rules are additive — nothing references them yet, so the build/visual stay unchanged. They use existing tokens.

**Files:**
- Modify: `src/styles/global.css` (append inside the existing `@layer components { … }` block, before its closing brace)

- [ ] **Step 1: Append the ledger / reflection / footnote / dashboard / headline styles**

Add the following inside the existing `@layer components` block in `src/styles/global.css`:

```css
  /* ---- Hero headline: keep each comma-line intact; proof-underline the accent ---- */
  .hero-headline .block { white-space: nowrap; }
  @media (max-width: 560px) { .hero-headline .block { white-space: normal; } }
  /* underline drawn as a background on the word itself, so RevealText's
     overflow:hidden mask never clips it and it never strikes the next word */
  .hero-headline .accent {
    background-image: linear-gradient(
      color-mix(in srgb, var(--accent) 38%, transparent),
      color-mix(in srgb, var(--accent) 38%, transparent));
    background-size: 100% 0.07em;
    background-position: 0 95%;
    background-repeat: no-repeat;
  }

  /* ---- Selected Work — editorial ledger ----
     .case-row = structure + hover scope (no `display`, so the anchor's Tailwind
     `block` utility is free to apply); .case-grid = the two columns. */
  .case-row {
    padding: clamp(40px, 6vh, 72px) 0;
    border-top: 1px solid var(--rule);
  }
  .case-row:first-of-type { border-top: none; }
  .case-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.32fr);
    gap: clamp(24px, 4.5vw, 76px);
  }
  .case-num {
    font-family: var(--font-serif);
    font-size: clamp(96px, 15vw, 230px);
    line-height: 0.78;
    letter-spacing: -0.02em;
    color: var(--fg);
    user-select: none;
    align-self: start;
    transition: color 0.35s ease;
  }
  .case-num .zero { color: var(--accent); transition: color 0.35s ease; }
  .case-row:hover .case-num { color: var(--accent); }
  .case-row:hover .case-num .zero { color: var(--fg); }
  .case-title {
    font-family: var(--font-serif);
    font-size: clamp(2rem, 4.6vw, 3.6rem);
    line-height: 1;
    letter-spacing: -0.01em;
    transition: color 0.35s ease;
  }
  .case-row:hover .case-title { color: var(--accent); }
  .case-story { max-width: 52ch; line-height: 1.66; color: var(--fg); }
  .reflection { max-width: 50ch; border-left: 2px solid var(--accent); padding-left: 22px; }
  .reflection p {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: clamp(1.3rem, 2.4vw, 1.7rem);
    line-height: 1.32;
    color: var(--fg);
    margin: 0;
  }
  .footnote {
    display: inline-flex;
    align-items: baseline;
    gap: 10px;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 9px 14px;
    font-family: var(--font-mono);
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--fg);
    max-width: 100%;
  }
  .footnote .prompt { color: var(--accent); flex: none; }
  .footnote .note { color: var(--muted); }
  .view {
    font-family: var(--font-mono);
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
  }
  .view .arrow { color: var(--accent); display: inline-block; transition: transform 0.3s ease; }
  .view::after {
    content: "";
    position: absolute; left: 0; right: 0; bottom: -4px;
    height: 1px; background: var(--accent);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.35s ease;
  }
  .case-row:hover .view::after { transform: scaleX(1); }
  .case-row:hover .view .arrow { transform: translate(3px, -3px); }
  .tag:not(:last-child)::after { content: "·"; color: var(--rule); padding-left: 8px; }

  /* ---- openboot CSS/ASCII dashboard — the one dark object (dark in both themes) ---- */
  .dash {
    background: #171311; border-radius: 8px; overflow: hidden;
    box-shadow: 0 24px 50px -28px rgba(24, 21, 18, 0.55);
    font-family: var(--font-mono); font-size: 12px; line-height: 1.65;
    color: #cfc6b8; max-width: 560px;
  }
  .dash-chrome {
    display: flex; align-items: center; gap: 14px;
    padding: 11px 14px; background: #1f1a16; border-bottom: 1px solid #2a241f;
  }
  .dash-dots { display: flex; gap: 7px; }
  .dash-dots i { width: 11px; height: 11px; border-radius: 50%; display: block; background: #5a5048; }
  .dash-dots i:first-child { background: var(--accent); }
  .dash-url { color: #8c8276; font-size: 11px; background: #15110e; border-radius: 4px; padding: 3px 10px; }
  .dash-body { padding: 16px 18px 20px; }
  .dash-body .ok { color: #9bb38a; }
  .dash-body .spin, .dash-meter { color: var(--accent); }
  .dash-body .dim { color: #8c8276; }

  /* ---- ledger collapses to a single column on small screens ---- */
  @media (max-width: 860px) {
    .case-grid { grid-template-columns: 1fr; gap: 8px; }
    .case-num { font-size: clamp(72px, 22vw, 120px); }
  }
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build completes; page looks unchanged (new classes are unused so far).

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(styles): add editorial-ledger, reflection, footnote, dashboard styles

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Remove the Activity section and the contributions data path

This removes the contribution heatmap end-to-end: the section, the orphaned components, and the data fetch/types/test/snapshot. Done as one task so the build stays green.

**Files:**
- Delete: `src/components/sections/Activity.astro`, `src/components/Heatmap.tsx`, `src/components/Reveal.tsx`
- Modify: `src/lib/types.ts`, `src/lib/github.ts`, `test/github.test.ts`, `src/data/github-snapshot.json`, `src/pages/index.astro`

- [ ] **Step 1: Update the failing test first**

In `test/github.test.ts`, remove the `contributionLevel` import and its `describe` block. The import line becomes:

```ts
import { aggregateLanguages, sumStars } from '../src/lib/github';
```

Delete the entire `describe('contributionLevel', …)` block at the bottom of the file.

- [ ] **Step 2: Run tests to confirm the remaining ones still pass**

Run: `npm test`
Expected: `aggregateLanguages`, `sumStars`, `cached`, and `magneticOffset` suites PASS; no reference to `contributionLevel` remains.

- [ ] **Step 3: Trim the types**

In `src/lib/types.ts`, delete the `ContributionDay` interface (lines 27-31) and remove the `contributions` and `totalContributions` fields from `GitHubData`. `GitHubData` becomes:

```ts
export interface GitHubData {
  profile: ProfileData;
  repos: Repo[];
  languages: LangStat[];
}
```

- [ ] **Step 4: Remove the contributions fetch from github.ts**

In `src/lib/github.ts`:
- Change the import on line 1 to drop `ContributionDay`:

```ts
import type { LangStat, GitHubData, ProfileData } from './types';
```

- Delete the `contributionLevel` function (lines 42-48) and the entire `fetchContributions` function (lines 86-104).
- In `fetchAll`, delete the `contributions`/`totalContributions` block (the `let contributions … if (token) { … }` section) and change the return to:

```ts
  return { profile, repos: [], languages };
```

- [ ] **Step 5: Trim the snapshot**

In `src/data/github-snapshot.json`, delete the `"contributions"` and `"totalContributions"` keys (both are empty/zero). Keep `profile`, `repos`, `languages`.

- [ ] **Step 6: Remove Activity from the page and delete orphaned components**

In `src/pages/index.astro`:
- Delete the `import Activity from '../components/sections/Activity.astro';` line.
- Delete the `<Activity … />` line.

Then delete the three now-orphaned files:

```bash
rm src/components/sections/Activity.astro src/components/Heatmap.tsx src/components/Reveal.tsx
```

- [ ] **Step 7: Verify build and tests**

Run: `npm run build && npm test`
Expected: build succeeds (no missing-import errors); all tests pass. The page no longer renders the Activity/heatmap section.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: remove contribution heatmap (section, components, data path)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Hero — two-line headline, accent proof-underline, colophon, drop followers

Keep the boot/reconcile `<script>` and its `data-boot-*` hooks **unchanged**. Only the frontmatter is untouched; the markup changes are below.

**Files:**
- Modify: `src/components/sections/Hero.astro`

- [ ] **Step 1: Restyle the top bar into a colophon and drop the follower meta**

In `src/components/sections/Hero.astro`, replace the top-bar block (the `<div class="container-x pt-6">…</div>` at lines 39-46) with:

```html
  <div class="container-x pt-6">
    <div class="flex items-baseline justify-between gap-4 pb-4 pr-16 sm:pr-20">
      <span class="label"><span class="[color:var(--accent)]">✦</span>&nbsp; {profile.name} — selected work</span>
      <span class="label tnum hidden sm:block">{profile.location} · Index 2026</span>
    </div>
    <div class="rule-x" data-boot-rule></div>
  </div>
```

- [ ] **Step 2: Rework the headline to two flush lines that never collapse to one word per line**

Replace the `<h1 …>…</h1>` block (lines 58-72) with:

```html
        <h1 class="hero-headline display text-[clamp(2.5rem,7vw,6.25rem)]">
          <span class="block">
            <RevealText text={line1} client:load />
            {!line2 && <span class="caret caret-dock caret-blink ml-[0.12ch]" aria-hidden="true"></span>}
          </span>
          {line2 && (
            <span class="block">
              {l2rest && <RevealText text={l2rest} accent={POSITIONING.accent} delay={0.15} client:load />}
              {l2rest && ' '}
              {l2last && <RevealText text={l2last} delay={0.3} className="font-sans font-medium tracking-[-0.045em]" client:load />}
              {!l2rest && !l2last && <RevealText text={line2} accent={POSITIONING.accent} delay={0.15} client:load />}
              <span class="caret caret-dock caret-blink ml-[0.12ch]" aria-hidden="true"></span>
            </span>
          )}
        </h1>
```

(Changes vs current: added `hero-headline` class; reduced the clamp to a `≤100px` max; removed the `sm:pl-[9vw]` indent on line 2 so both lines sit flush-left. The `.hero-headline .block { white-space: nowrap }` rule from Task 2 keeps each comma-line intact; the `.hero-headline .accent` background draws the proof-underline under `delightful` only.)

- [ ] **Step 3: Drop the follower count from the bottom meta row**

Replace the bottom meta `<div …data-boot-meta>` block (lines 79-87) with:

```html
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-x-6 gap-y-8 items-end pt-8" data-boot-meta>
      <p class="sm:col-span-6 max-w-md text-base sm:text-lg leading-relaxed muted">{POSITIONING.subline}</p>
      <div class="sm:col-span-4 sm:col-start-9 sm:justify-self-end">
        <MagneticLink href="#work" client:visible className="serif italic text-2xl accent ul">
          selected work ↓
        </MagneticLink>
      </div>
    </div>
```

(Removes the `{profile.followers} followers` cell; widens the subline and right-aligns the work link.)

- [ ] **Step 4: Verify build, then verify in the browser**

Run: `npm run build`
Expected: build succeeds.

Run: `npm run dev`, open http://localhost:4321. Confirm:
- Headline reads as two lines: `Reliable systems,` / `delightful interfaces.` — never one word per line at desktop or down to ~560px.
- The terracotta underline sits under `delightful` only and does NOT strike through `interfaces`.
- No follower count anywhere; the top bar shows the colophon (`✦ fullstackjam — selected work`).
- First-visit boot sequence still runs (clear `localStorage` key `boot:v1` or append `?boot` to retest); the caret still docks after the last word.
- Check light + dark theme.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Hero.astro
git commit -m "feat(hero): two-line headline, accent proof-underline, colophon; drop followers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: About — drop the stat counters, quiet facts line

**Files:**
- Modify: `src/components/sections/About.astro`
- Delete: `src/components/CountUp.tsx`

- [ ] **Step 1: Remove the CountUp import and the stats array**

In `src/components/sections/About.astro`, delete the line `import CountUp from '../CountUp.tsx';` and delete the `const stats = [ … ];` block (lines 8-12).

- [ ] **Step 2: Remove the big stats grid and enrich the facts line**

Delete the entire second grid block (the `<div class="grid grid-cols-1 sm:grid-cols-3 …">…</div>`, lines 37-46).

Replace the existing facts line (lines 31-33) with:

```html
      <p class="label mt-10">
        Works mostly in — <span class="normal-case tracking-[0.14em]">{topLanguages.slice(0, 3).join(' / ') || '—'}</span> · since {sinceYear}
      </p>
```

- [ ] **Step 3: Delete the orphaned CountUp component**

```bash
rm src/components/CountUp.tsx
```

- [ ] **Step 4: Verify build, then browser**

Run: `npm run build`
Expected: succeeds, no missing-import error.

In `npm run dev`: the About section shows the narrative + avatar + the single quiet line `Works mostly in — Go / TypeScript / Python · since 2021`. The three giant animated numbers (repos / stars / shipping-since) are gone.

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/About.astro
git rm --cached src/components/CountUp.tsx 2>/dev/null; git add -A
git commit -m "feat(about): drop stat counters; fold facts into a quiet line

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Selected Work — narrative case cards

Define the `Project` type, populate the four projects with narrative content, add a shape-guard test, then build the ledger cards.

**Files:**
- Modify: `src/lib/types.ts`, `src/data/profile.ts`
- Create: `test/profile.test.ts`, `src/components/CaseCard.astro`, `src/components/OpenbootDashboard.astro`
- Modify: `src/components/sections/Work.astro`

- [ ] **Step 1: Write the failing content-shape test**

Create `test/profile.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { PROJECTS } from '../src/data/profile';

describe('PROJECTS narrative shape', () => {
  it('every project has the fields a case card needs', () => {
    expect(PROJECTS.length).toBeGreaterThanOrEqual(4);
    for (const p of PROJECTS) {
      expect(typeof p.name).toBe('string');
      expect(p.url).toMatch(/^https?:\/\//);
      expect(typeof p.year).toBe('string');
      expect(typeof p.language).toBe('string');
      expect(Array.isArray(p.topics)).toBe(true);
      expect(p.story.length).toBeGreaterThan(20);
      expect(typeof p.reflection.label).toBe('string');
      expect(p.reflection.text.length).toBeGreaterThan(0);
      if (p.footnote !== null) {
        expect(typeof p.footnote.prompt).toBe('string');
        expect(typeof p.footnote.cmd).toBe('string');
      }
    }
  });

  it('exactly one project renders the dashboard', () => {
    expect(PROJECTS.filter((p) => p.hasDashboard).length).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/profile.test.ts`
Expected: FAIL — `PROJECTS` items lack `year`/`story`/`reflection`/etc. (type/property errors or assertion failures).

- [ ] **Step 3: Add the `Project`, `Reflection`, `Footnote` types**

In `src/lib/types.ts`, add (keep the existing `Repo` interface as-is — it is still used by `RawRepo` mapping and `LangStat`/`ProfileData` are unchanged):

```ts
export interface Reflection {
  /** mono overline, e.g. "what it taught me" */
  label: string;
  text: string;
}

export interface Footnote {
  /** terracotta prefix token, e.g. "$" or "commit" */
  prompt: string;
  cmd: string;
  note?: string;
}

export interface Project {
  name: string;
  url: string;
  /** display string, e.g. "2024 → now" */
  year: string;
  language: string;
  /** tags shown in mono, e.g. ['CLI', 'TUI', 'macOS'] */
  topics: string[];
  story: string;
  reflection: Reflection;
  footnote: Footnote | null;
  /** renders the CSS/ASCII openboot dashboard in the visual slot */
  hasDashboard?: boolean;
}
```

- [ ] **Step 4: Rewrite PROJECTS with narrative content**

In `src/data/profile.ts`, change the import (line 1) — `Repo` is no longer used here once `PROJECTS` is retyped:

```ts
import type { Project } from '../lib/types';
```

Replace the entire `export const PROJECTS: Repo[] = [ … ];` block with:

```ts
/** Projects shown in Selected Work — fully curated narrative cards.
 *  Copy is drawn from each repo; keep it understated and first-person. */
export const PROJECTS: Project[] = [
  {
    name: 'openboot',
    url: 'https://github.com/openbootdotdev/openboot',
    year: '2024 → now',
    language: 'Go',
    topics: ['CLI', 'TUI', 'macOS'],
    story:
      'Setting up a fresh Mac dev environment used to eat a whole day. So I built a one-command setup — and it quietly grew into a web dashboard and team sharing. The hard part was never the script; it was making the result reproducible across machines.',
    reflection: {
      label: 'what it taught me',
      text: '“Reproducible” is harder, and more valuable, than “works.”',
    },
    footnote: { prompt: '$', cmd: 'openboot init', note: 'empty machine to coding in ~1 command' },
    hasDashboard: true,
  },
  {
    name: 'k8s-gitops',
    url: 'https://github.com/fullstackjam/k8s-gitops',
    year: '2022 → now',
    language: 'Go',
    topics: ['Kubernetes', 'GitOps', 'FluxCD'],
    story:
      'I wanted a cluster I could rebuild from zero, so all the infrastructure is code, reconciled by GitOps: git is the source of truth and nobody runs kubectl apply by hand.',
    reflection: {
      label: 'what it taught me',
      text: 'When “rebuild” becomes a non-event, you dare to change boldly.',
    },
    footnote: { prompt: '$', cmd: 'flux reconcile', note: 'delete the cluster, it comes back in ~10 min' },
  },
  {
    name: 'lark-coding-agent-bridge',
    url: 'https://github.com/fullstackjam/lark-coding-agent-bridge',
    year: '2025',
    language: 'TypeScript',
    topics: ['AI', 'Lark', 'agent'],
    story:
      'Driving an AI coding agent from inside Lark/Feishu. The hard part was context and streaming — turning a chat thread into state an agent can use, then streaming the results back.',
    reflection: {
      label: 'what it taught me',
      text: 'An elegant interface is usually just catching someone else’s mess.',
    },
    footnote: { prompt: 'commit', cmd: 'streaming over Lark long-connection' },
  },
  {
    name: 'blog',
    url: 'https://github.com/fullstackjam/blog',
    year: 'ongoing',
    language: 'TypeScript',
    topics: ['Astro', 'writing'],
    story:
      'Notes and writing, built and hosted on my own stack — because owning the publishing pipeline is worth it.',
    reflection: {
      label: 'why it exists',
      text: 'Some things you build just to keep the craft sharp.',
    },
    footnote: null,
  },
];
```

- [ ] **Step 5: Run the shape test to verify it passes**

Run: `npx vitest run test/profile.test.ts`
Expected: PASS (both cases).

- [ ] **Step 6: Create the OpenbootDashboard component**

Create `src/components/OpenbootDashboard.astro`:

```astro
---
// The single dark object on the page — a hand-built CSS/ASCII dashboard for
// openboot. Dark in both themes by design (like the Contact theatre panel).
---
<div class="dash mt-8" aria-hidden="true">
  <div class="dash-chrome">
    <div class="dash-dots"><i></i><i></i><i></i></div>
    <span class="dash-url">openboot.dev/dashboard</span>
  </div>
  <div class="dash-body">
    <div>brew bundle ······· <span class="ok">✓ ok</span></div>
    <div>dotfiles ·········· <span class="ok">✓ ok</span></div>
    <div>runtimes ·········· <span class="spin">⠿ syncing</span></div>
    <div class="dim">team profile ······ shared</div>
    <div class="mt-2"><span class="dash-meter">[█████████░] 90%</span></div>
  </div>
</div>
```

- [ ] **Step 7: Create the CaseCard component**

Create `src/components/CaseCard.astro`:

```astro
---
import type { Project } from '../lib/types';
import OpenbootDashboard from './OpenbootDashboard.astro';
interface Props { project: Project; index: number; }
const { project, index } = Astro.props;
const num = String(index + 1).padStart(2, '0');
const tags = [project.language, ...project.topics];
---
<a href={project.url} target="_blank" rel="noopener" class="case-row block">
  <div class="container-x case-grid">
    <div class="case-num tnum" aria-hidden="true"><span class="zero">{num[0]}</span>{num[1]}</div>
    <div class="min-w-0">
      <div class="flex items-baseline gap-4 flex-wrap mb-5">
        <h3 class="case-title">{project.name}</h3>
        <span class="label tnum">{project.year}</span>
      </div>
      <p class="case-story mb-6">{project.story}</p>
      <div class="reflection mb-7">
        <span class="label block mb-2">{project.reflection.label}</span>
        <p>{project.reflection.text}</p>
      </div>
      {project.footnote && (
        <div class="footnote mb-7">
          <span class="prompt">{project.footnote.prompt}</span>
          <span><span class="cmd">{project.footnote.cmd}</span>{project.footnote.note && <span class="note"> — {project.footnote.note}</span>}</span>
        </div>
      )}
      {project.hasDashboard && <OpenbootDashboard />}
      <div class="flex items-center justify-between gap-5 flex-wrap mt-2">
        <span class="flex gap-2 flex-wrap">
          {tags.map((t) => <span class="label tag normal-case tracking-[0.1em]">{t}</span>)}
        </span>
        <span class="view label">view <span class="arrow accent">↗</span></span>
      </div>
    </div>
  </div>
</a>
```

- [ ] **Step 8: Rewrite Work.astro to render the cards**

Replace the entire contents of `src/components/sections/Work.astro` with:

```astro
---
import type { Project } from '../../lib/types';
import RevealText from '../RevealText.tsx';
import CaseCard from '../CaseCard.astro';
interface Props { repos: Project[]; }
const { repos } = Astro.props;
const count = String(repos.length).padStart(2, '0');
---
<section id="work" class="py-28 sm:py-40">
  <div class="container-x">
    <div class="flex items-baseline justify-between border-b-[1.5px] hairline pb-4">
      <p class="label">Selected work</p>
      <p class="label tnum hidden sm:block">[ {count} ]</p>
    </div>
    <h2 class="serif text-[clamp(2.4rem,6vw,5.5rem)] mt-8 mb-14 sm:mb-20">
      <RevealText text="Things I have built." accent="built." client:visible />
    </h2>
  </div>

  {repos.length > 0 ? (
    repos.map((project, i) => <CaseCard project={project} index={i} />)
  ) : (
    <p class="container-x muted">Projects are loading — check back in a moment.</p>
  )}
</section>
```

- [ ] **Step 9: Verify build, tests, and browser**

Run: `npm run build && npm test`
Expected: build succeeds; all tests (including `profile.test.ts`) pass.

In `npm run dev`, scroll to Work and confirm for each project:
- Oversized serif numeral 01–04 on the left, leading zero terracotta; on row hover the numeral and title turn terracotta and the numeral/zero swap colors.
- Order: numeral → title + year → story → italic reflection (with mono overline + terracotta left rule) → mono footnote chip → tags + `view ↗`.
- openboot shows the dark dashboard block; the other three do not.
- Cards collapse to a single column at mobile width.
- Light + dark theme both legible (the dashboard stays dark in both — intended).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(work): narrative case cards in the editorial-ledger language

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Stack — drop the % bars, quiet list

**Files:**
- Modify: `src/components/sections/Stack.astro`

- [ ] **Step 1: Replace the "most used" bar list with a names-only list**

In `src/components/sections/Stack.astro`, replace the left column block (the `<div class="lg:col-span-5">…</div>`, lines 21-36) with:

```html
    <div class="lg:col-span-5">
      <p class="label mb-8">Most used on GitHub</p>
      <ul class="border-t hairline">
        {topLangs.map((l, i) => (
          <li class="flex items-baseline gap-4 py-4 border-b hairline">
            <span class="label tnum">{String(i + 1).padStart(2, '0')}</span>
            <span class="serif text-xl sm:text-2xl">{l.name}</span>
          </li>
        ))}
      </ul>
    </div>
```

(Removes the `style="width:{pct}%"` accent bars and the `{pct}%` figures — Stack now shows language *names* only, matching the "Also working with" list on the right.)

- [ ] **Step 2: Verify build and browser**

Run: `npm run build`
Expected: succeeds.

In `npm run dev`: the Stack section shows two parallel name lists (most-used languages, and tools) with no percentage bars or numbers.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Stack.astro
git commit -m "feat(stack): drop language % bars for a quiet names list

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Remove orphaned styles, full verification, final pass

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Remove styles orphaned by this redesign**

In `src/styles/global.css`, delete these now-unused blocks (they were only used by the old Work rows / Activity heatmap):
- `.ghost-num { … }` and `.work-row:hover .ghost-num { … }`
- `.work-row { … }`, `.work-row:hover { … }`, `.work-title { … }`, `.work-row:hover .work-title { … }`, `.work-arrow { … }`, `.work-row:hover .work-arrow { … }`

Verify nothing else references them:

Run: `grep -rn "work-row\|ghost-num\|work-title\|work-arrow\|hm-" src` — expected: only the heatmap `--hm-*` token definitions in `global.css` remain (leave the `--hm-*` tokens; removing them is optional cosmetic cleanup and not required). If `work-row`/`ghost-num`/`work-title`/`work-arrow` appear anywhere outside the deleted CSS, stop and reconcile.

- [ ] **Step 2: Optional — drop the now-unused heatmap color tokens**

If `grep -rn "hm-" src` shows the `--hm-0..4` tokens are referenced nowhere (the heatmap is gone), delete the `--hm-0`..`--hm-4` lines from both `:root` and `:root[data-theme='dark']` in `global.css`.

- [ ] **Step 3: Full build + test**

Run: `npm run build && npm test`
Expected: build succeeds; all tests pass.

- [ ] **Step 4: Whole-page browser verification against the success criteria**

In `npm run dev`, walk the whole page (light + dark, desktop + ~390px mobile) and confirm the spec's success criteria:
- No heatmap, no % bars, no follower/repo/star counters anywhere.
- Work reads as four narrative stories, each with reflection + factual footnote.
- The oversized folio numeral appears only in Work, at one size/role.
- Accent only marks (one hero word, folio zeros, reflection rule, footnote prompt, view arrow, hover underlines) — never fills a button/block.
- Type roster holds: serif = headlines/titles/numerals/reflection; Inter = prose; mono = labels/years/tags/footnotes.
- Boot sequence and `prefers-reduced-motion` still behave (test reduced-motion via OS setting or DevTools rendering emulation).

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css
git commit -m "chore(styles): remove styles orphaned by the redesign

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-review notes (verification map)

- **Spec → task coverage:** metrics removal → Tasks 3 (heatmap), 5 (counters), 7 (% bars), 4 (followers). Narrative Work cards + reflection + footnote → Task 6. Hero two-line + colophon → Task 4. Stack quiet list → Task 7. Activity removal → Task 3. Contact unchanged → no task (intentional). Taste principles → enforced in the verification steps of Tasks 4/6/8. Type roster/mono → Tasks 1-2. Orphan cleanup → Tasks 3/5/8.
- **Type consistency:** `Project` (fields `name,url,year,language,topics,story,reflection{label,text},footnote{prompt,cmd,note?}|null,hasDashboard?`) is defined in Task 6 Step 3 and consumed identically by `profile.ts` (Step 4), `test/profile.test.ts` (Step 1), `CaseCard.astro` (Step 7), and `Work.astro` `Props.repos: Project[]` (Step 8). `GitHubData` loses `contributions/totalContributions` in Task 3 and no surviving consumer reads them.
- **Build-green ordering:** font (1) and CSS (2) are additive; Activity+data removal (3) is self-contained; Hero (4), About (5), Stack (7) are isolated component edits; the `Project` type change and its only consumer (Work) land together in Task 6.
```
