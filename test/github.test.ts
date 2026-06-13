import { describe, it, expect } from 'vitest';
import { aggregateLanguages, sumStars } from '../src/lib/github';

const raw = (over: any) => ({
  name: 'r', description: null, language: 'Go', stargazers_count: 0,
  forks_count: 0, topics: [], homepage: null, html_url: 'u', fork: false, ...over,
});

describe('aggregateLanguages', () => {
  it('counts languages across repos and returns sorted percentages', () => {
    const repos = [
      { language: 'Go' }, { language: 'Go' }, { language: 'TypeScript' }, { language: null },
    ] as any;
    const out = aggregateLanguages(repos);
    expect(out[0]).toEqual({ name: 'Go', pct: 67 });
    expect(out[1]).toEqual({ name: 'TypeScript', pct: 33 });
    expect(out).toHaveLength(2);
  });
});

describe('sumStars', () => {
  it('sums stargazers across repos', () => {
    expect(sumStars([raw({ stargazers_count: 3 }), raw({ stargazers_count: 4 })])).toBe(7);
  });
});
