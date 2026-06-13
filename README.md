# fullstackjam — personal site

A design-forward personal site with a **Terminal × Brutalist Editorial**
aesthetic. Server-rendered on Cloudflare Workers, with live data from GitHub.
→ [fullstackjam.com](https://fullstackjam.com)

## Stack

- [Astro 5](https://astro.build) (SSR) + React 19 islands
- Tailwind CSS v4 + [Motion](https://motion.dev) animations + [Lenis](https://lenis.darkroom.engineering) smooth scroll
- Cloudflare Workers + Workers KV (GitHub response cache)
- GitHub REST API (profile, language mix, latest commits)

## How it works

The page is a single SSR route ([`src/pages/index.astro`](src/pages/index.astro))
composed of section components. On each request the Worker resolves GitHub data
through a three-tier strategy in [`src/lib/github.ts`](src/lib/github.ts):

1. **KV cache** — a read-through cache over Workers KV
   ([`src/lib/cache.ts`](src/lib/cache.ts)) serves fresh entries directly
   (15-min TTL). On a fetch error it serves the last good value (*stale-on-error*).
2. **GitHub APIs** — on a cache miss the Worker fetches the profile, aggregates
   the language mix (forks excluded), and pulls the latest commit for each
   project that opts in via `latestCommit`, then writes the result back to KV.
3. **Snapshot fallback** — with no KV binding (e.g. `astro dev`) or on a hard
   failure, [`src/data/github-snapshot.json`](src/data/github-snapshot.json)
   keeps the site from ever rendering empty.

The **Work** section is fully curated — projects are authored by hand in
[`src/data/profile.ts`](src/data/profile.ts) rather than pulled from the API;
only each card's *latest-commit* footnote is live.

### Sections

`Hero` · `About` · `Work` (curated case cards) · `Contact` — see
[`src/components/sections/`](src/components/sections/).

### Interaction layer

React islands, hydrated per-element with Astro `client:` directives:

- `RevealText` / `Parallax` — Motion-driven entrance and scroll effects
- `MagneticLink` — pointer-following links (math in [`src/lib/magnetic.ts`](src/lib/magnetic.ts))
- `SmoothScroll` — Lenis wrapper · `ThemeToggle` — light/dark
- `CaseFootnote` — copy-the-command / open-the-link footnotes on each work card

## Develop

```bash
npm install
npm run dev        # http://localhost:4321 (snapshot fallback — no KV locally)
npm test           # unit tests: cache, language aggregation, project shape, magnetic helper
npm run preview    # astro build + wrangler dev — full Worker runtime with KV
```

## Deploy

Pushes to `master` deploy automatically via GitHub Actions. To deploy by hand:

```bash
npm run deploy     # build + wrangler deploy
```

**Secrets**

| Where | Name | Purpose |
| --- | --- | --- |
| GitHub repo secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | CI deploy |
| Worker secret | `GITHUB_TOKEN` | GitHub API auth — `wrangler secret put GITHUB_TOKEN` |

The KV namespace is bound as `GITHUB_CACHE` in [`wrangler.jsonc`](wrangler.jsonc).

## Customize

All content lives in [`src/data/profile.ts`](src/data/profile.ts):

- `GITHUB_USER` — the account profile and languages sync from
- `OVERRIDES` — the "available for work" flag
- `POSITIONING` / `ABOUT` — hero headline and about narrative
- `PROJECTS` — curated work shown in the Work section (fully manual; each entry is a
  `Project` from [`src/lib/types.ts`](src/lib/types.ts), with optional `latestCommit`,
  `hasDashboard`, and a copy/link `footnote`)
- `SOCIAL_LINKS` — footer / contact links
