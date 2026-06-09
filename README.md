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
