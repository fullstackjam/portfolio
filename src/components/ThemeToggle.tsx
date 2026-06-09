import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function apply(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
    setTheme(current);
    const handler = (e: Event) => {
      const next = (e as CustomEvent).detail as Theme;
      apply(next);
      setTheme(next);
    };
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, []);

  const toggle = () => {
    const cur = (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
    const next: Theme = cur === 'dark' ? 'light' : 'dark';
    apply(next);
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="fixed top-5 right-5 z-[60] label rule-c border rounded-full px-3 py-1.5 hover:[border-color:var(--accent)] hover:[color:var(--accent)] transition-colors"
      style={{ background: 'color-mix(in srgb, var(--bg) 70%, transparent)', backdropFilter: 'blur(6px)' }}
    >
      {theme === 'dark' ? 'light' : 'dark'}
    </button>
  );
}
