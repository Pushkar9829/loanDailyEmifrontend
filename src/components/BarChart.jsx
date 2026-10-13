import { useState } from 'react';
import { inr, inrShort } from '../lib/format';

// Daily collections column chart (single series: no legend, the card title names it).
// Recessive grid, 4px rounded tops on the baseline, 2px gaps, hover tooltip on every bar.
export default function BarChart({ data, height = 190 }) {
  const [hover, setHover] = useState(null);
  const top = Math.max(0, ...data.map((d) => d.amount));
  const niceMax = niceCeil(top || 1);
  const ticks = [0, niceMax / 2, niceMax];
  const total = data.reduce((s, d) => s + d.amount, 0);
  const today = data[data.length - 1]?.date;

  if (!top) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-center" style={{ height: height + 40 }}>
        <div className="text-sm font-medium text-slate-600">No collections in the last {data.length} days</div>
        <div className="mt-1 text-xs text-slate-400">Bars appear here as agents record payments.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="tabular text-2xl font-bold text-slate-900">{inr(total)}</span>
        <span className="text-xs text-slate-500">in {data.length} days{top ? ` · best day ${inrShort(top)}` : ''}</span>
      </div>
      <div className="relative flex" style={{ height }}>
        {/* y axis labels */}
        <div className="relative w-12 shrink-0 text-right text-[10px] text-slate-400">
          {ticks.map((t) => (
            <span key={t} className="tabular absolute right-2" style={{ bottom: `${(t / niceMax) * 100}%`, transform: 'translateY(50%)' }}>
              {inrShort(t).replace('₹', '')}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-dashed border-slate-200" style={{ bottom: `${(t / niceMax) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => {
              const h = (d.amount / niceMax) * 100;
              const isToday = d.date === today;
              return (
                <div
                  key={d.date}
                  className="group relative flex h-full flex-1 cursor-default items-end justify-center"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  tabIndex={0}
                  aria-label={`${d.date}: ${inr(d.amount)}, ${d.count} payments`}
                >
                  <div
                    className={`w-full max-w-7 rounded-t-[4px] transition-colors ${
                      d.amount ? (hover === i ? 'bg-brand-700' : isToday ? 'bg-brand-600' : 'bg-brand-500') : 'bg-slate-200'
                    }`}
                    style={{ height: d.amount ? `${Math.max(h, 2)}%` : 2 }}
                  />
                  {hover === i && (
                    <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow-lift">
                      <div className="font-semibold">{fmtDay(d.date)}</div>
                      <div className="tabular">
                        {inr(d.amount)} · {d.count} payment{d.count === 1 ? '' : 's'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="ml-12 mt-1.5 flex gap-[2px] text-[10px] text-slate-400">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {i % 2 === (data.length - 1) % 2 ? (d.date === today ? 'Today' : d.date.slice(8)) : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

function niceCeil(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
const fmtDay = (k) => new Date(`${k}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
