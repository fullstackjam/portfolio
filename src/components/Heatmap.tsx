import type { ContributionDay } from '../lib/types';

const COLORS = ['var(--hm-0)', 'var(--hm-1)', 'var(--hm-2)', 'var(--hm-3)', 'var(--hm-4)'];

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
              style={{ width: '11px', height: '11px', borderRadius: '2px', background: COLORS[d.level] }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
