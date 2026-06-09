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

/** About narrative — specific, drawn from real repos (k8s-gitops, Go, dotfiles). */
export const ABOUT =
  "I'm a fullstack engineer who enjoys the whole stack — shipping the product people see, and running the infrastructure that keeps it alive. Lately that has meant a lot of Kubernetes and Go: a fully GitOps-managed cluster, progressive delivery, and a development environment I can reproduce from a single clone. I care about systems that stay up, and interfaces that feel good to use.";

/** Curated order for the Selected Work section; the rest fill in by stars. */
export const FEATURED_REPOS = [
  'k8s-gitops',
  'lark-coding-agent-bridge',
  'dotfiles',
  'blog',
  'portfolio',
];

/** One-line "what it solves" per repo. Repos without an entry fall back to their GitHub description. */
export const PROJECT_BLURBS: Record<string, string> = {
  'k8s-gitops': 'A fully version-controlled Kubernetes cluster — infrastructure as code, reconciled by GitOps.',
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
