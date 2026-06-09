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
    const handler = (e: Event) => setTheme((e as CustomEvent).detail as Theme);
    window.addEventListener('themechange', handler);
    return () => window.removeEventListener('themechange', handler);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    apply(next);
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="fixed top-4 right-4 z-[60] border rule px-3 py-1 text-xs uppercase tracking-widest"
    >
      {theme === 'dark' ? '◐ light' : '◑ dark'}
    </button>
  );
}
