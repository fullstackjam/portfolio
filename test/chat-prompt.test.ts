import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../src/lib/chat-prompt';

describe('buildSystemPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildSystemPrompt();
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(100);
  });

  it('mentions fullstackjam', () => {
    expect(buildSystemPrompt().toLowerCase()).toContain('fullstackjam');
  });

  it('includes at least one project name', () => {
    expect(buildSystemPrompt()).toContain('openboot');
  });

  it('instructs terse terminal style', () => {
    const p = buildSystemPrompt().toLowerCase();
    expect(p).toMatch(/terse|concise|brief/);
  });
});
