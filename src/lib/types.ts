export interface LangStat {
  name: string;
  pct: number;
}

export interface ProfileData {
  name: string;
  location: string;
  avatarUrl: string;
}

export interface CommitInfo {
  /** first line of the commit message */
  message: string;
  /** short (7-char) sha */
  sha: string;
  /** html_url of the commit */
  url: string;
  /** ISO author date */
  date: string;
}

export interface GitHubData {
  profile: ProfileData;
  languages: LangStat[];
  /** latest commit per "owner/repo", for projects that declare `latestCommit` */
  latestCommits: Record<string, CommitInfo>;
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
  /** when set, the footnote is replaced at render time with this repo's live latest commit */
  latestCommit?: { owner: string; repo: string };
}
