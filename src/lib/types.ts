export interface LangStat {
  name: string;
  pct: number;
}

export interface ProfileData {
  name: string;
  bio: string;
  location: string;
  avatarUrl: string;
}

export interface GitHubData {
  profile: ProfileData;
  languages: LangStat[];
}

export interface Reflection {
  /** mono overline, e.g. "what it taught me" */
  label: string;
  text: string;
}

/** What clicking the footnote does: copy the command, or open a link. */
export type FootnoteAction = { kind: 'copy' } | { kind: 'link'; href: string };

export interface Footnote {
  /** terracotta prefix token, e.g. "$" or "commit" */
  prompt: string;
  cmd: string;
  note?: string;
  action: FootnoteAction;
}

export interface Project {
  name: string;
  url: string;
  /** display string, e.g. "2024 → now" */
  year: string;
  language: string;
  /** tags shown in mono, e.g. ['CLI', 'TUI', 'macOS'] */
  topics: string[];
  story: string;
  reflection: Reflection;
  footnote: Footnote | null;
  /** renders the CSS/ASCII openboot dashboard in the visual slot */
  hasDashboard?: boolean;
}
