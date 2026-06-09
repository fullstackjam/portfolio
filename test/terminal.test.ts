import { describe, it, expect } from 'vitest';
import { runCommand } from '../src/lib/terminal';

describe('runCommand', () => {
  it('lists available commands on help', () => {
    const r = runCommand('help');
    expect(r.output.join(' ')).toMatch(/about/);
    expect(r.output.join(' ')).toMatch(/projects/);
  });

  it('returns a scroll action for section commands', () => {
    expect(runCommand('projects').action).toEqual({ type: 'scroll', value: 'projects' });
    expect(runCommand('about').action).toEqual({ type: 'scroll', value: 'about' });
  });

  it('switches theme with an argument', () => {
    expect(runCommand('theme light').action).toEqual({ type: 'theme', value: 'light' });
    expect(runCommand('theme dark').action).toEqual({ type: 'theme', value: 'dark' });
  });

  it('toggles theme when no argument given', () => {
    expect(runCommand('theme').action).toEqual({ type: 'theme', value: 'toggle' });
  });

  it('clears the screen', () => {
    expect(runCommand('clear').action).toEqual({ type: 'clear' });
  });

  it('reports unknown commands without throwing', () => {
    const r = runCommand('bogus');
    expect(r.output.join(' ')).toMatch(/command not found/i);
    expect(r.action).toBeUndefined();
  });

  it('handles empty input', () => {
    expect(runCommand('   ').output).toEqual([]);
  });

  it('responds to whoami easter egg', () => {
    expect(runCommand('whoami').output.join(' ')).toMatch(/fullstackjam/);
  });
});
