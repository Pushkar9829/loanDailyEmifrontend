import { inr, inrShort } from '../lib/format';

// Simple daily-collections column chart (no chart library needed).
export default function BarChart({ data, height = 160 }) {
  const top = Math.max(...data.map((d) => d.amount));
  const max = Math.max(1, top);
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d) => {
          const h = Math.round((d.amount / max) * (height - 18));
          return (
            <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className={`w-full rounded-t ${d.amount ? 'bg-brand-600 group-hover:bg-brand-800' : 'bg-slate-200'}`}
                style={{ height: Math.max(h, 2) }}
                title={`${d.date}: ${inr(d.amount)} (${d.count} payments)`}
              />
              <div className="pointer-events-none absolute -top-1 left-1/2 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white group-hover:block">
                {d.date.slice(5)} · {inr(d.amount)} · {d.count}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-1 text-[10px] text-slate-400">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % 2 === 0 ? d.date.slice(8) : ''}
          </div>
        ))}
      </div>
      <div className="mt-1 text-right text-[11px] text-slate-400">{top ? `best day ${inrShort(top)}` : 'No collections in this period'}</div>
    </div>
  );
}
