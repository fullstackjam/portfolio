# Portfolio Rebuild — Design Spec

**Date:** 2026-06-09
**Status:** Approved (design phase)
**Owner:** fullstackjam

## Summary

Full rebuild of the personal portfolio site. The current implementation is Angular 19 + SSR, deployed via Docker + Helm to Kubernetes, with placeholder content. We replace it entirely with a modern, design-forward Astro site deployed to Cloudflare Workers, with content auto-fetched live from the GitHub API.

The aesthetic is **Terminal × Brutalist Editorial**: monospace type system, oversized display headings, raw grids, high contrast, and a real interactive command-line as the signature interaction. Dark phosphor theme is the default; a light "paper" theme is one click away.

## Goals

- Visually distinctive, "coolest / most design-forward" portfolio (user's explicit priority).
- Content is **real and always fresh** — pulled from GitHub at request time, not hand-written placeholders.
- Cloudflare-native: deploy to Workers, cache via KV, custom domain `fullstackjam.com`.
- Excellent performance and SEO (server-rendered HTML, near-zero unnecessary JS).
- Accessible: keyboard-navigable, respects `prefers-reduced-motion`, semantic HTML.

## Non-Goals

- No CMS / blog (out of scope for this spec; can be a future sub-project).
- No authentication, no backend database.
- No i18n (single language).

## Design DNA

**Terminal × Brutalist Editorial.**

- **Type:** Monospace (e.g. JetBrains Mono / Geist Mono) for UI + labels; a heavy grotesk or the same mono at huge sizes for display headings. Tight negative letter-spacing on display type.
- **Layout:** Asymmetric, raw grids with visible 1–2px rules, uppercase micro-labels, numbered sections, generous void.
- **Motifs:** Command prompt (`jam@cloud ~ %`), blinking cursor, typed text, ASCII/box-drawing accents, CRT scanline overlay (dark theme only).

### Themes (CSS variables, `data-theme` on `<html>`)

| Token | Dark (default) | Light |
|---|---|---|
| bg | `#08090b` | `#efeae0` |
| fg | `#eaeaea` | `#111111` |
| accent | phosphor green `#3ad17c` | brick red `#c2300f` |
| dim | `#5b6b5f` | `#9a9384` |
| rule | `#1c2620` | `#111111` |

- Default = dark. Toggle in top-right; persists to `localStorage`. First visit ignores OS preference and uses dark (brand choice), but the toggle is always available.
- Scanline overlay and phosphor glow apply in dark theme only.
- All animation gated behind `prefers-reduced-motion: no-preference`.

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Astro 5, **SSR (`output: 'server'`)** | Edge-rendered HTML for SEO + fast first paint |
| Interactive | React 19 islands | Only for terminal, theme toggle, animated counters, heatmap |
| Styling | Tailwind CSS v4 + CSS variables | Variables drive theming |
| Animation | Motion (`motion`/`framer-motion`) | Scroll reveal, typing, count-up; reduced-motion aware |
| Adapter | `@astrojs/cloudflare` | Deploys to Cloudflare Workers (static assets + SSR) |
| Cache | Workers KV | GitHub responses, TTL ~1h, stale-while-revalidate |
| Tooling | Vitest, Wrangler, TypeScript | |

## Architecture & Data Flow

```
Browser ──▶ Cloudflare Worker (Astro SSR)
                 │
                 ├─ getGitHubData(user)  ──▶ KV cache hit? ──▶ return cached
                 │                              │ miss / stale
                 │                              ▼
                 │                         GitHub REST + GraphQL (with GITHUB_TOKEN)
                 │                              │
                 │                         transform + aggregate
                 │                              │
                 │                         write KV (TTL 1h) + return
                 │
                 └─ render HTML (data baked in) ──▶ client hydrates islands
```

### GitHub data module (`src/lib/github.ts`)

Single well-bounded module. Public surface:

- `getProfile(): Profile` — avatar, name, bio, location, followers, publicRepos, totalStars.
- `getTopRepos(limit=6): Repo[]` — non-fork repos sorted by stars; name, description, language, stars, forks, topics, homepage, htmlUrl.
- `getLanguageStats(): LangStat[]` — aggregated language byte counts → percentages.
- `getContributions(): ContributionWeek[]` — GraphQL `contributionsCollection` calendar (requires token).
- `getGitHubData()` — orchestrates the above with KV caching; returns one typed object consumed by the page.

**Caching:** each upstream call wrapped by a `cached(key, ttl, fetcher)` helper using KV. On upstream failure: serve stale KV value if present; else fall back to a committed static snapshot (`src/data/github-snapshot.json`) so the site is **never empty**.

**Auth:** `GITHUB_TOKEN` provided as a Wrangler secret. Raises rate limit to 5000/h and enables the GraphQL contributions query. Without it, contributions degrade gracefully (heatmap hidden, REST data still works at 60/h behind cache).

### Interactive terminal (`src/components/Terminal.tsx`, React island)

- Real command parser. Commands: `help`, `about`, `skills`, `projects`, `ls`, `cat <file>`, `theme [dark|light]`, `open <project>`, `clear`, plus easter eggs (`whoami`, `sudo`, `neofetch`).
- Output writes to a scrollback buffer; `theme` command flips the global theme; navigation commands smooth-scroll to the matching section.
- Command parsing logic is pure and unit-tested independently of the React component.
- Keyboard-first; focus management and ARIA live region for screen readers.

## Page Structure (single-page scroll)

1. **Hero** — boot-sequence typing, oversized name/title, live "available for work" status, theme toggle.
2. **Terminal** — embedded interactive CLI (above).
3. **About** — bio (GitHub bio + optional override in `src/data/profile.ts`) + count-up stats (repos / stars / followers).
4. **Skills** — language stats from GitHub + curated tech list, as brutalist tag grid.
5. **Projects** — top repos as editorial cards (stars, language dot, topics, links).
6. **GitHub Activity** — custom contribution heatmap (pixel/terminal style) + language breakdown bars.
7. **Contact** — GitHub / LinkedIn / X / Email links.
8. **Footer** — copyright only (ICP filing number removed).

Section content (bio override, social links, curated skills) lives in a single editable `src/data/profile.ts` so the user can tweak copy without touching components.

## Error Handling

- GitHub upstream failure → stale KV → committed snapshot (never blank).
- Missing `GITHUB_TOKEN` → contributions section hidden, rest functions behind cache.
- Per-section error boundaries so one failing data source doesn't break the page.
- Terminal: unknown command prints a friendly `command not found` line, never throws.

## Testing

- **Vitest unit tests:**
  - GitHub transform/aggregation (language %, star sort, fork exclusion, snapshot fallback).
  - Terminal command parser (each command, unknown command, args).
  - `cached()` helper (hit / miss / stale-on-error) with a mock KV.
- **Build smoke test:** `astro build` succeeds; output contains expected sections.
- **Optional Playwright:** theme toggle persists; terminal `help`/`projects` flow; reduced-motion.

## Deployment

- `wrangler.jsonc`: Worker name, `@astrojs/cloudflare`, KV namespace binding, `GITHUB_TOKEN` secret.
- Custom domain `fullstackjam.com` on the Worker; `portfolio.fullstackjam.com` → 301 redirect to root.
- GitHub Actions workflow runs `astro build` + `wrangler deploy` on push to `master`.

## Removals (full replacement)

Deleted as part of this rebuild:

- Angular app: `src/` (Angular), `angular.json`, `tsconfig.*.json` (Angular variants), Angular deps in `package.json`.
- `Dockerfile`
- `helm/` (entire Helm chart)
- `.github/workflows/docker.yml`
- Footer ICP filing number (`苏ICP备2024064777号`).

`LICENSE` and the git history are kept.

## Open Risks

- **Contributions GraphQL** depends on a valid token in the Worker secret; mitigated by graceful degradation.
- **KV cold cache** on first request after deploy is slightly slower; acceptable, and snapshot covers worst case.
- **GitHub API shape changes** isolated behind the `github.ts` module and covered by transform tests.
