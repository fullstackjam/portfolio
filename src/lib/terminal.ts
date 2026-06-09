export type TerminalAction =
  | { type: 'scroll'; value: string }
  | { type: 'theme'; value: 'dark' | 'light' | 'toggle' }
  | { type: 'clear' };

export interface TerminalResult {
  output: string[];
  action?: TerminalAction;
}

const SECTIONS = ['about', 'skills', 'projects', 'activity', 'contact'];

const HELP = [
  'available commands:',
  '  about       scroll to about',
  '  skills      scroll to skills',
  '  projects    scroll to projects',
  '  activity    scroll to github activity',
  '  contact     scroll to contact',
  '  ls          list sections',
  '  theme [d|l] toggle or set theme',
  '  clear       clear the screen',
  '  help        show this help',
];

export function runCommand(input: string): TerminalResult {
  const trimmed = input.trim();
  if (!trimmed) return { output: [] };
  const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/);

  if (cmd === 'help') return { output: HELP };
  if (cmd === 'ls') return { output: [SECTIONS.join('   ')] };
  if (cmd === 'clear') return { output: [], action: { type: 'clear' } };
  if (cmd === 'whoami') return { output: ['fullstackjam — fullstack engineer'] };
  if (cmd === 'neofetch') {
    return { output: ['fullstackjam@cloud', 'os: cloudflare workers', 'stack: astro · react · k8s'] };
  }
  if (cmd === 'sudo') return { output: ['nice try 😏 — you already have root here'] };

  if (cmd === 'theme') {
    const v = args[0];
    if (v === 'light' || v === 'l') return { output: ['theme → light'], action: { type: 'theme', value: 'light' } };
    if (v === 'dark' || v === 'd') return { output: ['theme → dark'], action: { type: 'theme', value: 'dark' } };
    return { output: ['toggling theme…'], action: { type: 'theme', value: 'toggle' } };
  }

  if (SECTIONS.includes(cmd)) {
    return { output: [`→ ${cmd}`], action: { type: 'scroll', value: cmd } };
  }

  return { output: [`command not found: ${cmd}  (try 'help')`] };
}
