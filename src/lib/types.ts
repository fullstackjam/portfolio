export interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  homepage: string | null;
  url: string;
}

export interface LangStat {
  name: string;
  pct: number;
}

export interface ProfileData {
  name: string;
  bio: string;
  location: string;
  avatarUrl: string;
  followers: number;
  publicRepos: number;
  totalStars: number;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitHubData {
  profile: ProfileData;
  repos: Repo[];
  languages: LangStat[];
  contributions: ContributionDay[];
  totalContributions: number;
}
