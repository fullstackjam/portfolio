import { describe, it, expect } from 'vitest';
import { CANNED, CHIPS } from '../src/lib/console-responses';

describe('CANNED responses', () => {
  it('has a response for every chip', () => {
    for (const chip of CHIPS) {
      expect(typeof CANNED[chip]).toBe('string');
      expect(CANNED[chip].length).toBeGreaterThan(10);
    }
  });

  it('whoami mentions fullstackjam', () => {
    expect(CANNED.whoami.toLowerCase()).toContain('fullstackjam');
  });

  it('projects lists at least one project name', () => {
    expect(CANNED.projects).toContain('openboot');
  });

  it('contact includes an email address', () => {
    expect(CANNED.contact).toMatch(/@/);
  });

  it('CHIPS has exactly 5 entries', () => {
    expect(CHIPS).toHaveLength(5);
  });
});
