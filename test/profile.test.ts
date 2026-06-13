import { describe, it, expect } from 'vitest';
import { PROJECTS } from '../src/data/profile';

describe('PROJECTS narrative shape', () => {
  it('every project has the fields a case card needs', () => {
    expect(PROJECTS.length).toBeGreaterThanOrEqual(4);
    for (const p of PROJECTS) {
      expect(typeof p.name).toBe('string');
      expect(p.url).toMatch(/^https?:\/\//);
      expect(typeof p.year).toBe('string');
      expect(typeof p.language).toBe('string');
      expect(Array.isArray(p.topics)).toBe(true);
      expect(p.topics.length).toBeGreaterThan(0);
      expect(p.story.length).toBeGreaterThan(20);
      expect(typeof p.reflection.label).toBe('string');
      expect(p.reflection.label.length).toBeGreaterThan(0);
      expect(p.reflection.text.length).toBeGreaterThan(0);
      if (p.footnote !== null) {
        expect(typeof p.footnote.prompt).toBe('string');
        expect(typeof p.footnote.cmd).toBe('string');
        const action = p.footnote.action;
        expect(['copy', 'link']).toContain(action.kind);
        if (action.kind === 'link') {
          expect(action.href).toMatch(/^https?:\/\//);
        }
      }
    }
  });

  it('exactly one project renders the dashboard', () => {
    expect(PROJECTS.filter((p) => p.hasDashboard).length).toBe(1);
  });
});
