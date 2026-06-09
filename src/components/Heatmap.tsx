import type { ContributionDay } from '../lib/types';

const COLORS = ['var(--rule)', '#1f7a4a', '#2aa866', '#3ad17c', '#7af0a8'];

export default function Heatmap({ days }: { days: ContributionDay[] }) {
  const weeks: ContributionDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div style={{ display: 'flex', gap: '3px', overflowX: 'auto' }} aria-label="contribution graph">
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {week.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.count}`}
              style={{ width: '11px', height: '11px', background: COLORS[d.level] }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
