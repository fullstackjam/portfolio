# Portfolio narrative redesign — design

**Date:** 2026-06-13
**Status:** Approved (design); ready for implementation planning
**Reference mockup:** `docs/superpowers/specs/2026-06-13-portfolio-narrative-redesign-mockup.html`
(the high-fidelity, panel-vetted Hero + Selected Work mockup this spec is drawn from —
open it in a browser; it is the visual source of truth)

## Problem

The current site reads like a **GitHub analytics dashboard**, not a personal
portfolio. The "analytics" feeling comes from accumulated *metrics* —
contribution heatmap, language % bars, repo/star/follower counters — which
dominate the page. The Work section is a row-list of repos, so it also reads
like a **résumé** rather than a portfolio with personal narrative.

Goal: a narrative, first-person portfolio that keeps the existing warm /
serif aesthetic but tells *stories* (what I built, why, what it taught me)
instead of displaying *numbers*. Unified and elegant across the whole site.

## Decision summary

- **Direction:** narrative spine (per-project story cards), executed in the
  panel-winning **"editorial ledger"** visual language. The single bold move
  is an **oversized Instrument-Serif index numeral (01–04)** running down the
  left of each Work entry, like a printed book's table of contents, with the
  leading zero in terracotta. Everything else stays quiet around it.
- **Metrics: keep-but-weaken.** Fold the few meaningful facts into prose;
  remove every dashboard-shaped element (heatmap, % bars, vanity counters,
  follower count).
- **Work depth:** each project gets a short on-page narrative (problem → how →
  result) plus a one-line *reflection* and a factual *commit-style footnote*.
  No separate case-study pages.
- Aesthetic is unchanged: warm paper palette, Instrument Serif display, the
  first-visit boot/"reconcile" sequence in the hero all stay.

## Taste principles (the site's verifiable style contract)

1. **Accent budget — terracotta only MARKS, never FILLS.** Per screen it may
   appear on the one hero accent word, the leading folio zeros, the reflection
   left-rule, the colophon tick, the footnote prompt / view arrow, and hover
   underlines. If it ever becomes a filled button or block, it has overspent.
2. **One bold move, everything else quiet.** The oversized serif folio numerals
   are the only oversized element besides the hero headline. No second
   competing display gesture, no decorative chrome (status bars, pulsing dots,
   registration-mark cosplay).
3. **Strict, role-bound type roster.** Instrument Serif = headline, project
   titles, folio numerals, and the reflection (the *only* italic body voice);
   Inter = narrative prose only; JetBrains Mono = all labels, years, tags,
   footnotes. No font used outside its role.
4. **Hairlines carry separation, not boxes or shadows.** 1px `#e1dacb` between
   entries; a heavier 1.5px ink rule under a section header for authority.
   Entries are ruled sections, not floating panels.
5. **Every card follows one fixed rhythm** so a stranger learns it once:
   numeral → title + year → story (max ~52ch) → italic reflection pull-quote →
   mono footnote → tags + view. No vanity metrics, heatmaps, or % bars anywhere.
6. **A signature element appears at one size, in one role.** If it shows up as
   a smaller "echo" elsewhere, the eye reads inconsistency. The oversized
   numeral belongs to Selected Work only — the hero does **not** get a folio.

## Visual language

- **Palette (unchanged):** bg `#f7f4ef`, surface `#efe9de`, ink `#181512`,
  accent terracotta `#a33a12`, muted `#71695c`, hairline `#e1dacb`. Dark
  "theatre" Contact panel retained. Existing dark-theme tokens retained.
- **Type:** Instrument Serif / Inter / JetBrains Mono, per principle 3.
- **Mono label primitive:** one locked style — 12px, +0.09em tracking,
  uppercase, muted — reused identically for colophon, eyebrow, section markers,
  years, tags, footnotes. Tabular figures (`font-variant-numeric:tabular-nums`)
  on every year / index / count.
- **Folio numeral:** Instrument Serif, `clamp(96px,15vw,230px)`, leading zero
  terracotta; on hover the numeral and its zero swap colors (deliberate swap,
  not a fade).
- **Reflection pull-quote:** Instrument Serif italic, 2px terracotta left rule,
  with a mono `// what it taught me` overline. The emotional crescendo of each
  card; the only place italic serif appears in body context.
- **Footnote:** faux commit line — JetBrains Mono on a recessed `--surface`
  chip, leading terracotta `$` / `commit` token, e.g.
  `$ flux reconcile — delete the cluster, it comes back in ~10 min`. Factual,
  never a metric.
- **Motion:** restrained and mechanical. Card hover slides/recolors the numeral,
  wipes the view-link underline left→right, nudges the `↗`. No scroll-fades on
  the structural grid. Existing `prefers-reduced-motion` handling preserved.

## Per-section changes

### Hero
- Keep the boot/"reconcile" first-visit sequence and the headline.
- Headline set as **two lines broken at the comma** —
  `Reliable systems,` / `delightful interfaces.` — each line a `.line` block
  with `white-space:nowrap` at ≥560px so the phrase never collapses to one
  word per line. Size `clamp(44px,7vw,100px)`.
- Accent: one italic terracotta word (`delightful`) with a **low-opacity proof
  underline that sits below the baseline of that word only** (never a strike
  through the next word).
- A print-style **colophon / running header** (mono): left
  `✦ fullstackjam — selected work`, right `vol.01 / no.04   2024 → now`. This
  replaces / absorbs the current top bar.
- Eyebrow: mono `Infrastructure & interface engineer` with a short terracotta
  rule.
- **Remove the follower count.** No folio numeral in the hero (principle 6).

### About
- Keep the `ABOUT` narrative and the avatar.
- **Remove the three big animated stat counters** (public repos / stars /
  shipping-since). `CountUp` becomes unused here.
- Fold the surviving facts into one quiet mono line, e.g.
  `Works mostly in — Go / TypeScript / Python · since 2021`. Language names
  still come from the live GitHub data (names only, no percentages).

### Selected Work (the centerpiece)
- Replace the repo-row list with **narrative case cards** in the ledger layout:
  oversized folio numeral (left) + body (right), entries separated by
  hairlines, image/typographic rhythm alternating.
- Each card: numeral → title + year → 2–4 sentence story → reflection
  pull-quote → commit footnote → tags + `view ↗`.
- **openboot** renders the one dark object on the page: a hand-built CSS/ASCII
  **dashboard** (browser chrome, checklist rows, ASCII progress meter) — no
  raster image. Projects with real screenshots later slot into the same image
  slot; infrastructure/CLI projects use the typographic/ASCII treatment.
- Mixed-image handling: the card supports an optional visual slot; absent → the
  body simply runs full measure.

### Stack
- **Remove the language % bars.** Present a quiet list: "most used" language
  names (from GitHub data, names only) + the curated tools list. No numbers,
  no progress bars — mono index + serif name, hairline-separated.

### Activity
- **Removed entirely** (heatmap deleted). The "still shipping since 2021"
  sentiment is folded into the About quiet line. `Heatmap.tsx` and the
  contributions fetch become orphaned by this change and are removed as part of
  it (own-mess cleanup only).

### Contact
- Unchanged. Keep the inverted dark "theatre" panel and social links.

### Section numbering
- De-emphasize the `01—05` dashboard-style index. Keep light mono section
  markers (e.g. `Selected Work   [ 04 ]`) but not an index-of-the-whole-page
  feel.

## Content (draft — to be refined against real project READMEs)

Voice: understated, first person, dry-witty. The copy below is the approved
draft baked into the mockup; refine wording from each repo's README before/while
implementing, but keep the shape (story + reflection + footnote).

| # | Project | Stack | Year | Reflection | Footnote |
|---|---------|-------|------|-----------|----------|
| 01 | openboot | Go · CLI · TUI · macOS | 2024→now | "reproducible" is harder, and more valuable, than "works". | `$ openboot init — empty machine to coding in ~1 command` |
| 02 | k8s-gitops | Go · Kubernetes · FluxCD | 2022→now | when "rebuild" becomes a non-event, you dare to change boldly. | `$ flux reconcile — delete the cluster, it comes back in ~10 min` |
| 03 | lark-coding-agent-bridge | TypeScript · AI · Lark | 2025 | an elegant interface is usually just catching someone else's mess. | `commit — streaming over Lark long-connection` |
| 04 | blog | TypeScript · Astro | ongoing | (short, on craft for its own sake) | (optional) |

Stories (drafts): openboot — "Setting up a fresh Mac dev env used to eat a whole
day. So I built a one-command setup — and it quietly grew into a web dashboard
and team sharing. The hard part was never the script; it was making the result
reproducible across machines." · k8s-gitops — "I wanted a cluster rebuildable
from zero, so all the infra is code, reconciled by GitOps: git is the source of
truth and nobody runs kubectl apply by hand." · lark — "Driving an AI coding
agent from inside Lark/Feishu; the hard part was context and streaming — turning
a chat thread into state an agent can use, then streaming results back." · blog —
"Written and hosted on my own stack, because owning the publishing pipeline is
worth it."

## Affected files

- `src/components/sections/Hero.astro` — headline two-line `.line` markup +
  sizing, accent proof-underline, colophon/eyebrow, drop followers. Keep boot.
- `src/components/sections/About.astro` — drop stat counters; quiet facts line.
- `src/components/sections/Work.astro` — rewrite to ledger case cards. Likely a
  new `CaseCard` component + an `OpenbootDashboard` (CSS/ASCII) component.
- `src/components/sections/Stack.astro` — drop % bars; quiet list.
- `src/components/sections/Activity.astro` — **delete**.
- `src/components/Heatmap.tsx` — **delete** (orphaned by Activity removal).
- `src/components/CountUp.tsx` — remove if no remaining consumer after About.
- `src/pages/index.astro` — drop Activity import/usage and contributions data.
- `src/lib/github.ts` / `types.ts` — stop fetching contributions; extend the
  project type with `year`, `story`, `reflection {label,text}`,
  `footnote {prompt,cmd,note}`, optional visual slot.
- `src/data/profile.ts` — populate `PROJECTS` with the narrative fields above.
- `src/styles/global.css` — add folio numeral, reflection pull-quote, footnote
  chip, colophon, headline `.line` styles; remove now-orphaned styles
  (`ghost-num`, old `work-row` row treatment, heatmap classes).
- `src/data/github-snapshot.json` — drop contributions if the fetch is removed.

## Non-goals / out of scope

- No separate per-project case-study pages.
- No new color palette, no font changes, no removal of the boot sequence.
- No changes to deployment, data-fetch caching, or the Cloudflare worker setup
  beyond removing the contributions fetch.
- Real screenshots for image-bearing projects are a later content task; the
  card supports them but only openboot's CSS dashboard ships in this pass.

## Success criteria

- No heatmap, no % bars, no follower/repo/star counters anywhere on the page.
- Work reads as four narrative stories, each with a reflection + factual
  footnote; a stranger learns the card rhythm once.
- The oversized folio numeral appears at one size, in one role (Work only).
- Accent-budget, type-roster, and hairline principles hold on every section
  (principles 1–6 are checkable in review).
- Existing aesthetic (warm palette, serif, boot sequence) and
  `prefers-reduced-motion` behavior preserved.
- `npm run build` succeeds; no orphaned imports/components remain from the
  changes above.
