import type {
  ResumeMetric,
  ExperienceItem,
  SkillGroup,
  EducationItem,
} from '../lib/types';

/** Hero block. `headline` accents `accentWord` (rendered italic + terracotta). */
export const RESUME = {
  name: 'Jam Ma',
  eyebrow: 'SRE · Platform · Full-stack',
  headline: 'I keep systems alive, and ship what people actually touch.',
  accentWord: 'alive',
  subline:
    'SRE / Platform engineer with full-stack range. Five years across fintech and consumer hardware — Citi, then Huami.',
  pdf: { href: '/resume/Jam-Ma-resume-cn.pdf', label: 'Download PDF · 中文' },
};

export const METRICS: ResumeMetric[] = [
  { value: '↓70%', label: 'Model cost' },
  { value: '100+', label: 'Services on GitOps' },
  { value: '99.95%', label: 'Core service SLA' },
  { value: '↓80%', label: 'Alert MTTR' },
];

export const EXPERIENCE: ExperienceItem[] = [
  {
    company: 'Huami · Zepp Health',
    role: 'SRE · DevOps',
    location: 'Nanjing',
    period: '2025.09 → now',
    bullets: [
      "Replaced GitLab's script-based delivery with Argo CD and a real GitOps model — git is the source of truth, 100+ services reconciled. Swapped random-10% canaries for header-based routing, so releases verify safely even without a staging environment.",
      'Pushed the BU toward an AI-native workflow: rolled out Claude Code and Codex, and built a self-hosted Codex reverse proxy that cut monthly model spend by ~70%.',
      'Rebuilt observability from availability-only to business-level metrics, with automatic alert diagnosis — MTTR down ~80%.',
    ],
  },
  {
    company: 'Citi',
    role: 'SRE · Tech Lead',
    location: 'Shanghai',
    period: '2022.08 → 2025.07',
    bullets: [
      'Led an in-house AIOps platform (Python / FastAPI) on OpenShift — a DAG workflow engine, NLP + GenAI command handling, and token-bucket / PID concurrency control. Throughput +300%, task failures −85%, 90% of common ops automated.',
      'Owned delivery and reliability end-to-end: Tekton / Helm pipelines with staged rollout, Ansible config-drift detection, K8s + ELK + Grafana monitoring. 99.2% deploy success, −55% prod incidents, core SLA held 99.95%+.',
    ],
  },
  {
    company: 'Qunzhimai',
    role: 'SRE',
    location: 'Shanghai',
    period: '2021.03 → 2022.06',
    bullets: [
      "Built the team's first in-house ops platform from scratch (Flask + Aliyun SDK + Docker) — folded repetitive ops into one place and made the reporting data trustworthy.",
    ],
  },
];

export const SKILLS: SkillGroup[] = [
  {
    label: 'Cloud & containers',
    items: ['Aliyun / Tencent Cloud / AWS', 'Kubernetes (HA, troubleshooting)', 'Docker', 'OpenShift'],
  },
  {
    label: 'CI/CD & GitOps',
    items: ['Argo CD', 'Jenkins / Tekton', 'GitHub Actions / GitLab CI', 'Ansible', 'Terraform', 'Helm'],
  },
  {
    label: 'Observability & reliability',
    items: ['Prometheus + Grafana + ELK', 'business metrics', 'SLO', 'automated alert diagnosis'],
  },
  {
    label: 'AI engineering',
    items: ['Claude Code / Codex rollout', 'self-hosted Codex proxy', 'workflow redesign'],
  },
  {
    label: 'Systems & dev',
    items: ['Linux tuning & troubleshooting', 'Nginx / Redis / MongoDB / OracleDB', 'Python (FastAPI / Flask)', 'Shell'],
  },
];

export const EDUCATION: EducationItem = {
  school: 'Jiangsu University of Science and Technology',
  degree: 'B.E., Computer Science',
  period: '2016 → 2021',
};
