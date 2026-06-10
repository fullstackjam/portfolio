import type { Repo } from '../lib/types';

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

/** About narrative — specific, drawn from real repos (k8s-gitops, openboot, Go). */
export const ABOUT =
  "I'm a fullstack engineer who enjoys the whole stack — shipping the product people see, and running the infrastructure that keeps it alive. Lately that has meant a lot of Kubernetes and Go: a fully GitOps-managed cluster, progressive delivery, and a development environment I can reproduce from a single clone. I care about systems that stay up, and interfaces that feel good to use.";

/** Projects shown in the Selected Work section — fully curated, not from GitHub API. */
export const PROJECTS: Repo[] = [
  {
    name: 'k8s-gitops',
    description: 'A fully version-controlled Kubernetes cluster — infrastructure as code, reconciled by GitOps.',
    language: 'Go',
    stars: 0,
    forks: 0,
    topics: ['kubernetes', 'gitops', 'fluxcd'],
    homepage: null,
    url: 'https://github.com/fullstackjam/k8s-gitops',
  },
  {
    name: 'lark-coding-agent-bridge',
    description: 'Bridge between Lark (Feishu) and AI coding agents — routes messages, manages context, streams responses.',
    language: 'TypeScript',
    stars: 0,
    forks: 0,
    topics: ['ai', 'lark', 'agent'],
    homepage: null,
    url: 'https://github.com/fullstackjam/lark-coding-agent-bridge',
  },
  {
    name: 'openboot',
    description: 'Set up a Mac dev environment in one command — CLI, web dashboard, team sharing.',
    language: 'Go',
    stars: 0,
    forks: 0,
    topics: ['cli', 'tui', 'dev-environment', 'macos'],
    homepage: null,
    url: 'https://github.com/openbootdotdev/openboot',
  },
  {
    name: 'blog',
    description: 'Notes and writing, built and hosted on my own stack.',
    language: 'TypeScript',
    stars: 0,
    forks: 0,
    topics: ['astro', 'blog'],
    homepage: null,
    url: 'https://github.com/fullstackjam/blog',
  },
];

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
