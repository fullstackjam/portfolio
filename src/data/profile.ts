import type { Project } from '../lib/types';

export const GITHUB_USER = 'fullstackjam';

/** Optional overrides applied on top of the live GitHub profile. */
export const OVERRIDES = {
  availableForWork: true,
};

/** Hero positioning. `accent` is the single word rendered italic + in brand color. */
export const POSITIONING = {
  headline: 'Reliable systems, delightful interfaces.',
  accent: 'delightful',
  subline:
    'Fullstack engineer working across the web, Kubernetes, and the cloud — from GitOps pipelines to the pixels people actually touch.',
};

/** About narrative — specific, drawn from real repos (cloudlab, openboot, Go). */
export const ABOUT =
  "I'm a fullstack engineer who enjoys the whole stack — shipping the product people see, and running the infrastructure that keeps it alive. Lately that has meant a lot of Kubernetes and Go: a Flux-managed k3s lab, and a development environment I can reproduce from a single command. I care about systems that stay up, and interfaces that feel good to use.";

/** Projects shown in Selected Work — fully curated narrative cards.
 *  Copy is drawn from each repo; keep it understated and first-person. */
export const PROJECTS: Project[] = [
  {
    name: 'openboot',
    url: 'https://github.com/openbootdotdev/openboot',
    year: '2026 → now',
    language: 'Go',
    topics: ['CLI', 'TUI', 'macOS'],
    story:
      'Setting up a fresh Mac dev environment used to eat a whole day. So I built a one-command setup — and it quietly grew into a web dashboard and team sharing. The hard part was never the script; it was making the result reproducible across machines.',
    reflection: {
      label: 'what it taught me',
      text: '"Reproducible" is harder, and more valuable, than "works."',
    },
    footnote: { prompt: '$', cmd: 'curl -fsSL openboot.dev/install.sh | bash', note: 'a fresh Mac, set up in one line', action: { kind: 'copy' } },
    hasDashboard: true,
  },
  {
    name: 'cloudlab',
    url: 'https://github.com/fullstackjam/cloudlab',
    year: '2026 → now',
    language: 'Python',
    topics: ['Kubernetes', 'GitOps', 'Flux'],
    story:
      'I wanted a cluster I could rebuild from zero, so this one is a single-node k3s lab: Flux reconciles everything from git, SOPS encrypts the secrets, and a tunnel is the only way in. Nobody runs kubectl apply by hand.',
    reflection: {
      label: 'what it taught me',
      text: 'When "rebuild" becomes a non-event, you dare to change boldly.',
    },
    footnote: { prompt: 'commit', cmd: 'latest on GitHub', action: { kind: 'link', href: 'https://github.com/fullstackjam/cloudlab/commits' } },
    latestCommit: { owner: 'fullstackjam', repo: 'cloudlab' },
  },
  {
    name: 'phrasefolio',
    url: 'https://github.com/fullstackjam/phrasefolio',
    year: '2026 → now',
    language: 'JavaScript',
    topics: ['Cloudflare', 'Workers', 'D1'],
    story:
      'I kept collecting English phrases in spreadsheets and losing the thread. So I built a small notebook — a reading page, a Worker API, and a D1 database — that unlocks in the browser and follows me across devices. The hard part was keeping the notes private without making them annoying to use.',
    reflection: {
      label: 'what it taught me',
      text: 'A notebook only counts if you open it the next day.',
    },
    footnote: { prompt: 'commit', cmd: 'latest on GitHub', action: { kind: 'link', href: 'https://github.com/fullstackjam/phrasefolio/commits' } },
    latestCommit: { owner: 'fullstackjam', repo: 'phrasefolio' },
  },
  {
    name: 'blog',
    url: 'https://blog.fullstackjam.com',
    year: '2022 → now',
    language: 'HTML',
    topics: ['Zola', 'GitHub Pages', 'writing'],
    story:
      'Notes and writing on the things I build — GitOps, homelab, dev environments, AI workflows — a static site built with Zola and published to GitHub Pages, because owning what you say is worth more than owning the servers.',
    reflection: {
      label: 'why I write',
      text: 'Writing it down is how I find out whether I actually understand it.',
    },
    footnote: { prompt: '→', cmd: 'blog.fullstackjam.com', note: 'notes & writing, since 2022', action: { kind: 'link', href: 'https://blog.fullstackjam.com' } },
  },
];

export const SOCIAL_LINKS = [
  { name: 'GitHub', url: 'https://github.com/fullstackjam' },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/fullstackjam-ma-a817b5239/' },
  { name: 'X', url: 'https://twitter.com/fullstackjam' },
  { name: 'Email', url: 'mailto:fullstackjam@outlook.com' },
];
