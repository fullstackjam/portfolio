# Portfolio Editorial Redesign (v2) — Design Spec

**Date:** 2026-06-09
**Status:** Approved (design phase)
**Supersedes (presentation only):** the front-end of `2026-06-09-portfolio-rebuild-design.md`

## Why

The v1 rebuild shipped a **Terminal × Brutalist Editorial** site. In practice it reads as *"唬人但假大空"* — visually loud but hollow, and it never delivered the **优美的交互** (elegant, refined interaction) that was actually wanted. Two problems to fix:

1. **Hollow content** — everything is auto-pulled generic GitHub data with no real narrative.
2. **Loud-but-empty design** — oversized brutalist type posturing instead of craft; basic motion (count-up, jump-scroll) instead of beautiful interaction.

This redesign pivots the **presentation and interaction layer** to a quiet, refined editorial aesthetic. The **data/deploy backend is untouched.**

## Goals

- A calm, elegant **Refined Editorial** look — restraint, generous whitespace, beautiful typography.
- **优美的交互**: smooth scrolling, scroll-triggered text reveals, magnetic links, refined hovers — tasteful, never gratuitous.
- Reduce hollowness: real, specific, drafted editorial copy (positioning headline, about narrative, per-project value lines) sourced from the real GitHub profile, all editable in one file.
- Keep everything that works: live GitHub data, KV cache, snapshot fallback, Cloudflare Workers deploy, CI, `fullstackjam.com`.
- Accessible: SSR text, keyboard-navigable, full `prefers-reduced-motion` support.

## Non-Goals

- No backend/data-pipeline changes (`src/lib/github.ts`, `cache.ts`, KV, wrangler, CI stay as-is).
- No CMS, no blog, no new external services.
- No full interview-based content this round — copy is drafted from GitHub + inference, refined later by editing `profile.ts`.

## Design DNA

**Refined Editorial.**

- **Type:** **Instrument Serif** for display headings (with an *italic* accent word in brand color as the recurring "small move"); **Inter** for body/UI; a touch of monospace for micro-labels.
- **Palette (warm paper, default light; dark toggle preserved):**

| Token | Light (default) | Dark |
|---|---|---|
| bg | `#f3efe7` (warm paper) | `#14131a` |
| fg | `#1a1a1a` (ink) | `#ece9e2` |
| accent | `#b3401f` (brick) | `#e07a5f` (warm coral) |
| muted | `#6a6459` | `#8a8678` |
| rule | `#dcd6c8` | `#2a2832` |

- **Layout:** asymmetric editorial grid, large left-aligned headings, wide margins, quiet section labels (e.g. `01 — about`) in mono.
- **The recurring move:** every section heading is set in Instrument Serif with one italic word in `accent`.

## Interaction System (the heart of "优美")

All motion is **progressive enhancement** over SSR'd content and gated behind `prefers-reduced-motion: no-preference`.

- **Smooth scroll** via `lenis` (small client init in the layout). Disabled under reduced-motion.
- **`<RevealText>`** island — wraps a heading; on first in-view, splits into words/lines and animates them rising + fading in with a gentle stagger (Motion, cubic-bezier ease). Falls back to plain visible text without JS or under reduced-motion.
- **`<Reveal>`** island — wraps a block (paragraph, card, row); fades/translates up once on in-view.
- **`useMagnetic`** hook — applied to primary links/buttons; element eases toward the cursor within a radius, springs back on leave. No-op under reduced-motion / on touch.
- **Refined hovers:** link underlines draw in; project rows shift right and reveal a thumbnail/metadata; all with `cubic-bezier(.2,.8,.2,1)` easing.
- **Hero load sequence:** on first paint, the headline reveals line-by-line, then the sub-line and CTA.

## Page Structure (single page)

1. **Hero** — name, Instrument Serif positioning headline with italic accent word, one real sub-line, magnetic "selected work ↓". Line-by-line reveal on load.
2. **About** — a real, specific drafted narrative (2–4 sentences) in editorial type; GitHub avatar treated tastefully (e.g. small, framed, subtle); a few real facts woven inline (years on GitHub, primary languages) — not big stat counters.
3. **Selected Work** — top real repos as an **editorial list**: index, title, one-line "what it solves" (drafted), language + stars, link out. Hover shifts the row and surfaces metadata/thumbnail with refined easing.
4. **Stack** — restrained: real language composition (quiet inline treatment, not loud full-width bars) + curated tools as calm typographic tags.
5. **Activity** — the GitHub contribution heatmap, **recolored for the paper palette** (muted warm ramp), framed as a quiet "currently building" signal. Hidden if no contributions (unchanged data contract).
6. **Contact** — elegant closing line (drafted, real invitation) + magnetic email/social links.
7. **Footer** — minimal: © year + "built with Astro · Cloudflare Workers".

## Content Sourcing

Copy is **drafted by the implementer from the real GitHub profile** (`fullstackjam` — repos, languages, activity, existing bio) plus reasonable inference. It is **not** lorem/placeholder; it reads as specific and real. All editable copy lives in `src/data/profile.ts`:

- `POSITIONING` — the hero headline (with a marked italic accent word) + sub-line.
- `ABOUT` — the about narrative.
- `PROJECT_BLURBS` — a map of `repoName → "what it solves"` one-liners, applied over live repo data (repos without a blurb fall back to their GitHub description).
- existing `SOCIAL_LINKS`, `CURATED_SKILLS`, `OVERRIDES`.

This caps the hollowness with real-feeling copy now, and the user lifts it further by editing a few strings later.

## Components

**Removed:** `Terminal.tsx`, `src/lib/terminal.ts`, `test/terminal.test.ts`, `CountUp.tsx` (count-up stat treatment is dropped in favor of inline editorial facts).

**New islands / utilities:**
- `src/components/RevealText.tsx` — heading word/line reveal.
- `src/components/Reveal.tsx` — block in-view reveal.
- `src/lib/useMagnetic.ts` — magnetic pointer hook.
- `src/components/SmoothScroll.tsx` — Lenis init island (client-only, reduced-motion aware).
- `src/components/ThemeToggle.tsx` — kept, restyled for the editorial palette.
- `src/components/Heatmap.tsx` — kept, recolored (paper ramp + dark ramp).

**Rewritten sections** (`src/components/sections/*.astro`): Hero, About, Work (was Projects), Stack (was Skills), Activity, Contact + Footer. All consume the same `GitHubData` props from `index.astro`.

**Restyled:** `src/styles/global.css` (new palette, type scale, editorial utilities; scanlines removed).

## Data Flow

Unchanged. `index.astro` still calls `getGitHubData(env)` (KV-cached, snapshot fallback) and passes typed props to each section. The redesign only changes how that data is presented and what drafted copy is layered alongside it.

## Error Handling

Unchanged contract: never-empty via snapshot; `Work` shows an empty-state line if `repos` is empty; `Activity` hidden if no contributions. New interaction islands degrade to static content if JS fails or under reduced-motion.

## Testing

- Existing `cache.test.ts` and `github.test.ts` stay green (no backend changes).
- `terminal.test.ts` is **removed** with the terminal.
- New unit test: `useMagnetic` offset math (pure function extracted, e.g. `magneticOffset(pointer, rect, radius, strength)`), tested with Vitest.
- Build smoke: `astro build` succeeds; `tsc --noEmit` clean.
- Manual: theme toggle persists; reveals fire on scroll; reduced-motion shows static content; live data renders on the deployed Worker.

## Deployment

Unchanged. `wrangler.jsonc`, KV binding, custom domain, and the GitHub Actions deploy workflow all stay. Adds the `lenis` dependency. Ships via the existing push-to-`master` pipeline.

## Risks

- **Still-limited content depth** — drafted copy is real-feeling but inferred; true depth needs the user's input later (accepted, documented; `profile.ts` makes it a 2-minute edit).
- **Motion performance** — reveals/magnetic must stay GPU-cheap (transform/opacity only) and respect reduced-motion; thumbnails in Work lazy-loaded.
- **Font loading** — Instrument Serif + Inter via Google Fonts; use `display=swap` and preconnect to avoid layout shift on the hero.
