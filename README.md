# fullstackjam — portfolio

A design-forward personal portfolio with a **Terminal × Brutalist Editorial**
aesthetic. Server-rendered on Cloudflare Workers, with live data from GitHub.
→ [fullstackjam.com](https://fullstackjam.com)

## Stack

- [Astro 5](https://astro.build) (SSR) + React 19 islands
- Tailwind CSS v4 + [Motion](https://motion.dev) + [Lenis](https://lenis.darkroom.engineering) smooth scroll
- Cloudflare Workers + Workers KV (GitHub response cache)
- GitHub REST + GraphQL APIs (profile, languages, contribution graph)

## How it works

The page is a single SSR route ([`src/pages/index.astro`](src/pages/index.astro))
composed of section components. On each request the Worker resolves GitHub data
through a three-tier strategy:

1. **KV cache** — read-through cache over Workers KV ([`src/lib/cache.ts`](src/lib/cache.ts)).
2. **GitHub APIs** — on cache miss, fetch the profile, languages, and contribution
   graph ([`src/lib/github.ts`](src/lib/github.ts)), then write back to KV.
   On a fetch error, stale KV data is served instead.
3. **Snapshot fallback** — if there's no KV binding (e.g. `astro dev`),
   [`src/data/github-snapshot.json`](src/data/github-snapshot.json) is used.

The **Work** section is fully curated — projects are defined manually in
[`src/data/profile.ts`](src/data/profile.ts) rather than auto-fetched from the API.

### Sections

`Hero` · `About` · `Work` (curated projects) · `Stack` (languages + tools)
· `Activity` (contribution heatmap) · `Contact` — see [`src/components/sections/`](src/components/sections/).

## Develop

```bash
npm install
npm run dev        # http://localhost:4321 (snapshot fallback — no KV locally)
npm test           # unit tests: cache, github transforms, magnetic helper
npm run preview    # wrangler dev — full Worker runtime with KV
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

## Customize

All content lives in [`src/data/profile.ts`](src/data/profile.ts):

- `GITHUB_USER` — the account everything syncs from
- `OVERRIDES` — bio override and the "available for work" flag
- `POSITIONING` / `ABOUT` — hero headline and about narrative
- `PROJECTS` — curated work shown in the Work section (fully manual, each entry is a `Repo` object)
- `SOCIAL_LINKS` — footer links
- `CURATED_SKILLS` — tools shown alongside auto-detected GitHub languages
