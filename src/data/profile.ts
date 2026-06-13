import type { Project } from '../lib/types';

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
    name: 'k8s-gitops',
    url: 'https://github.com/fullstackjam/k8s-gitops',
    year: '2022 → now',
    language: 'Go',
    topics: ['Kubernetes', 'GitOps', 'ArgoCD'],
    story:
      'I wanted a cluster I could rebuild from zero, so all the infrastructure is code, reconciled by GitOps: git is the source of truth and nobody runs kubectl apply by hand.',
    reflection: {
      label: 'what it taught me',
      text: 'When "rebuild" becomes a non-event, you dare to change boldly.',
    },
    footnote: { prompt: '→', cmd: 'k8s-gitops.fullstackjam.com', note: 'architecture & docs', action: { kind: 'link', href: 'https://k8s-gitops.fullstackjam.com/' } },
  },
  {
    name: 'lark-coding-agent-bridge',
    url: 'https://github.com/fullstackjam/lark-coding-agent-bridge',
    year: '2026',
    language: 'TypeScript',
    topics: ['AI', 'Lark', 'agent'],
    story:
      'Driving an AI coding agent from inside Lark/Feishu. The hard part was context and streaming — turning a chat thread into state an agent can use, then streaming the results back.',
    reflection: {
      label: 'what it taught me',
      text: 'An elegant interface is usually just catching someone else\'s mess.',
    },
    // Footnote is replaced at render time with the live latest commit; this is the fallback.
    footnote: { prompt: 'commit', cmd: 'latest on GitHub', action: { kind: 'link', href: 'https://github.com/fullstackjam/lark-coding-agent-bridge/commits' } },
    latestCommit: { owner: 'fullstackjam', repo: 'lark-coding-agent-bridge' },
  },
  {
    name: 'blog',
    url: 'https://blog.fullstackjam.com',
    year: '2022 → now',
    language: 'Hugo',
    topics: ['self-hosted', 'writing'],
    story:
      'Notes and writing on the things I build — GitOps, homelab, dev environments, AI workflows — built and hosted on my own stack, because owning the publishing pipeline is worth it.',
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
