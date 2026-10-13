import { Check, Clock, Minus } from 'lucide-react';
import { inr } from '../lib/format';
import { cx } from './ui';

// Today's payment slots as a connected timeline.
// slot: { no, label, state: 'upcoming'|'open'|'closed'|'before_plan', paid?: { amount } }
export default function SlotTimeline({ slots = [], dark = false, onSlotClick, canClick }) {
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Today's payment slots">
      {slots.map((s, i) => {
        const paid = !!s.paid;
        const open = !paid && s.state === 'open';
        const missed = !paid && s.state === 'closed';
        const clickable = onSlotClick && canClick?.(s);
        const dot = paid
          ? 'bg-emerald-500 text-white ring-emerald-500/30'
          : open
            ? 'bg-brand-500 text-white ring-brand-400/40 animate-pulse'
            : missed
              ? dark
                ? 'bg-white/10 text-slate-400 ring-white/10'
                : 'bg-slate-200 text-slate-500 ring-slate-200'
              : dark
                ? 'bg-transparent text-slate-400 ring-white/25'
                : 'bg-white text-slate-400 ring-slate-300';
        const Icon = paid ? Check : open ? Clock : missed || s.state === 'before_plan' ? Minus : null;
        const status = paid ? inr(s.paid.amount) : open ? 'Open now' : s.state === 'before_plan' ? '—' : missed ? 'Missed' : 'Later';
        return (
          <li key={s.no} className="relative flex flex-col items-center text-center">
            {i < slots.length - 1 && (
              <span className={cx('absolute left-1/2 top-4 h-0.5 w-full', paid ? 'bg-emerald-400' : dark ? 'bg-white/15' : 'bg-slate-200')} aria-hidden="true" />
            )}
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onSlotClick(s)}
              className={cx('relative z-10 flex h-8 w-8 items-center justify-center rounded-full ring-4 transition', dot, clickable ? 'cursor-pointer hover:scale-110' : 'cursor-default')}
              aria-label={`${s.label}: ${status}`}
            >
              {Icon ? <Icon className="h-4 w-4" strokeWidth={2.5} /> : <span className="text-[11px] font-bold">{s.no}</span>}
            </button>
            <div className={cx('mt-2 text-[11px] font-semibold', dark ? 'text-white' : 'text-slate-800')}>{s.label}</div>
            <div
              className={cx(
                'tabular text-[10.5px]',
                paid ? 'font-semibold text-emerald-500' : open ? (dark ? 'font-semibold text-brand-300' : 'font-semibold text-brand-700') : dark ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              {status}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
