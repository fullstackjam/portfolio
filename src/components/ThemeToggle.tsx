import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function apply(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Sync state with the theme the inline pre-paint script already applied.
    const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
    setTheme(current);
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
