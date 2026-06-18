import { ABOUT, PROJECTS, SOCIAL_LINKS, POSITIONING } from '../data/profile';

export function buildSystemPrompt(): string {
  const projects = PROJECTS.map(p => `- ${p.name} (${p.year}): ${p.story}`).join('\n');
  const links = SOCIAL_LINKS.map(l => `${l.name}: ${l.url}`).join(' · ');

  return `You are an AI assistant embedded in fullstackjam's portfolio website. \
Answer questions about the site owner concisely in a terminal/shell style — \
terse, direct, no fluff. Respond in 1–3 sentences max. No markdown, no bullet points.

About: ${ABOUT}

Headline: ${POSITIONING.headline}

Projects:
${projects}

Links: ${links}`;
}
