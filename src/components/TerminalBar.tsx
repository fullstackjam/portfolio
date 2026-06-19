import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function pad(n: number) { return String(n).padStart(2, '0'); }
function nowBeijing() {
  // Beijing is UTC+8 — derive from a UTC instant so it's right regardless of
  // the viewer's local zone (works at home, on a flight, anywhere).
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
  const bj = new Date(utc + 8 * 60 * 60_000);
  return `${pad(bj.getHours())}:${pad(bj.getMinutes())}:${pad(bj.getSeconds())}`;
}

interface Props { name: string; }

export default function TerminalBar({ name }: Props) {
  const [theme, setTheme] = useState<Theme>('light');
  const [clock, setClock] = useState('--:--:--');

  useEffect(() => {
    const t = (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
    setTheme(t);
    setClock(nowBeijing());
    const id = setInterval(() => setClock(nowBeijing()), 1000);
    return () => clearInterval(id);
  }, []);

  const toggle = () => {
    const cur = (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
    const next: Theme = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch {}
    setTheme(next);
  };

  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'color-mix(in srgb, var(--bg) 84%, transparent)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <div
        className="container-x"
        style={{
          height: 46,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em',
        }}
      >
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)',
        }}>
          <span style={{ color: 'var(--accent)' }} aria-hidden="true">✦</span>
          <span>{name} — selected work</span>
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 18,
          color: 'var(--muted)', letterSpacing: '0.06em',
        }}>
          <span className="hidden sm:inline">
            <span className="tnum" style={{ color: 'var(--fg)' }}>{clock}</span>
            <span> 北京</span>
          </span>
          <a href="/resume" style={{ color: 'var(--fg)', textDecoration: 'none' }}>
            Résumé <span aria-hidden="true">↗</span>
          </a>
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--fg)', fontSize: 13, padding: 0, lineHeight: 1,
            }}
            title={theme === 'dark' ? 'light' : 'dark'}
          >◐</button>
        </span>
      </div>
    </div>
  );
}
