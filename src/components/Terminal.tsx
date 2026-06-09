import { useRef, useState } from 'react';
import { runCommand } from '../lib/terminal';

interface Line { prompt: boolean; text: string; }

const INTRO: Line[] = [
  { prompt: false, text: "type 'help' to explore. try: about · projects · theme · neofetch" },
];

function scrollBehavior(): ScrollBehavior {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
}

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>(INTRO);
  const [value, setValue] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = runCommand(value);

    if (result.action?.type === 'clear') {
      setLines([]);
      setValue('');
      return;
    }
    if (result.action?.type === 'scroll') {
      document.getElementById(result.action.value)?.scrollIntoView({ behavior: scrollBehavior() });
    }
    if (result.action?.type === 'theme') {
      const root = document.documentElement;
      const cur = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = result.action.value === 'toggle' ? (cur === 'dark' ? 'light' : 'dark') : result.action.value;
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
    }

    const echoed: Line[] = value.trim() ? [{ prompt: true, text: value }] : [];
    setLines((prev) => [...prev, ...echoed, ...result.output.map((t) => ({ prompt: false, text: t }))]);
    setValue('');
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: scrollBehavior() }), 0);
  };

  return (
    <div
      role="region"
      aria-label="interactive terminal"
      className="border rule p-4 text-sm h-72 overflow-y-auto"
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((l, i) => (
        <div key={i}>
          {l.prompt && <span className="dim">jam@cloud ~ % </span>}
          <span className={l.prompt ? '' : 'dim'}>{l.text}</span>
        </div>
      ))}
      <form onSubmit={submit} className="flex">
        <span className="accent">jam@cloud ~ % </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          aria-label="terminal input"
          className="flex-1 bg-transparent outline-none ml-1"
        />
      </form>
      <div ref={endRef} />
    </div>
  );
}
