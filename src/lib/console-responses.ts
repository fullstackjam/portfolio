import { PROJECTS, SOCIAL_LINKS, POSITIONING } from '../data/profile';

export const CHIPS = ['whoami', 'stack', 'projects', 'now', 'contact'] as const;
export type Chip = typeof CHIPS[number];

function socialUrl(name: string): string {
  return SOCIAL_LINKS.find(l => l.name === name)?.url ?? '';
}

export const CANNED: Record<Chip, string> = {
  whoami: `fullstackjam — fullstack engineer. Web · Kubernetes · cloud. 北京.\n${POSITIONING.subline}`,

  stack: `Go · TypeScript · Python\nKubernetes · ArgoCD · Cloudflare Workers\nAstro · React · PostgreSQL`,

  projects: PROJECTS.map(p => `${p.name} (${p.year}) — ${p.story.split('.')[0]}.`).join('\n'),

  now: `${PROJECTS[0].name} (${PROJECTS[0].year}): ${PROJECTS[0].story.split('.')[0]}.`,

  contact: [
    socialUrl('Email').replace('mailto:', ''),
    socialUrl('GitHub'),
    socialUrl('LinkedIn'),
  ].join('\n'),
};
