import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function apply(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'dark';
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
    const cur = (document.documentElement.getAttribute('data-theme') as Theme) || 'dark';
    const next: Theme = cur === 'dark' ? 'light' : 'dark';
    apply(next);
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="fixed top-4 right-4 z-[60] border rule px-3 py-1 text-xs uppercase tracking-widest"
    >
      {theme === 'dark' ? '◐ light' : '◑ dark'}
    </button>
  );
}
