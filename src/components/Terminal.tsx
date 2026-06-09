import { useRef, useState } from 'react';
import { runCommand } from '../lib/terminal';

interface Line { prompt: boolean; text: string; }

const INTRO: Line[] = [
  { prompt: false, text: "type 'help' to explore. try: about · projects · theme · neofetch" },
];

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>(INTRO);
  const [value, setValue] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = runCommand(value);
    const echoed: Line[] = [{ prompt: true, text: value }];

    if (result.action?.type === 'clear') {
      setLines([]);
      setValue('');
      return;
    }
    if (result.action?.type === 'scroll') {
      document.getElementById(result.action.value)?.scrollIntoView({ behavior: 'smooth' });
    }
    if (result.action?.type === 'theme') {
      const root = document.documentElement;
      const cur = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = result.action.value === 'toggle' ? (cur === 'dark' ? 'light' : 'dark') : result.action.value;
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
    }

    setLines((prev) => [...prev, ...echoed, ...result.output.map((t) => ({ prompt: false, text: t }))]);
    setValue('');
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  return (
    <div className="border rule p-4 text-sm h-72 overflow-y-auto">
      {lines.map((l, i) => (
        <div key={i}>
          {l.prompt && <span className="dim">jam@cloud ~ % </span>}
          <span className={l.prompt ? '' : 'dim'}>{l.text}</span>
        </div>
      ))}
      <form onSubmit={submit} className="flex">
        <span className="accent">jam@cloud ~ % </span>
        <input
          autoFocus
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
