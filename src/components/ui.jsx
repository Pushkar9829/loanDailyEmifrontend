import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Info, Inbox, X, XCircle } from 'lucide-react';

export const cx = (...c) => c.filter(Boolean).join(' ');

/* ---------- Buttons & inputs ---------- */

const BTN = {
  primary:
    'bg-gradient-to-b from-brand-600 to-brand-700 text-white shadow-sm shadow-brand-900/20 ring-1 ring-inset ring-brand-800/20 hover:from-brand-700 hover:to-brand-800 disabled:from-brand-600/60 disabled:to-brand-700/60',
  secondary: 'bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 hover:ring-slate-400 disabled:opacity-50',
  danger: 'bg-rose-600 text-white shadow-sm shadow-rose-900/20 hover:bg-rose-700 disabled:bg-rose-600/50',
  ghost: 'text-brand-700 hover:bg-brand-50 disabled:opacity-50',
  dark: 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50',
};

export function Button({ variant = 'primary', size = 'md', className, busy, icon: Icon, children, ...p }) {
  const sz = size === 'sm' ? 'h-8 px-3 text-[13px]' : size === 'lg' ? 'h-12 px-5 text-base' : 'h-10 px-4 text-sm';
  return (
    <button
      className={cx(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        BTN[variant],
        sz,
        className
      )}
      disabled={busy || p.disabled}
      {...p}
    >
      {busy ? <Spinner className="h-4 w-4" /> : Icon ? <Icon className="h-4 w-4" strokeWidth={2.25} /> : null}
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-slate-700">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

const INPUT =
  'w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500';

export const Input = ({ className, ...p }) => <input className={cx(INPUT, className)} {...p} />;
export const Textarea = ({ className, ...p }) => <textarea className={cx(INPUT, 'min-h-24', className)} {...p} />;
export function Select({ className, options, placeholder, ...p }) {
  return (
    <select className={cx(INPUT, 'cursor-pointer pr-8', className)} {...p}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className={cx('relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-slate-300')}>
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5.5' : 'translate-x-0.5')} />
      </span>
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

/* ---------- Layout bits ---------- */

export function Card({ title, subtitle, icon: Icon, actions, children, className, padded = true }) {
  return (
    <section className={cx('rounded-2xl border border-slate-200/80 bg-white shadow-card', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-semibold text-slate-900">{title}</h2>
              {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-700">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const STAT_TONE = {
  default: { value: 'text-slate-900', icon: 'bg-slate-100 text-slate-600' },
  brand: { value: 'text-brand-700', icon: 'bg-brand-50 text-brand-700' },
  warn: { value: 'text-amber-600', icon: 'bg-amber-50 text-amber-600' },
  bad: { value: 'text-rose-600', icon: 'bg-rose-50 text-rose-600' },
  blue: { value: 'text-slate-900', icon: 'bg-sky-50 text-sky-600' },
  violet: { value: 'text-slate-900', icon: 'bg-violet-50 text-violet-600' },
};

export function Stat({ label, value, sub, tone = 'default', icon: Icon }) {
  const t = STAT_TONE[tone] || STAT_TONE.default;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[12px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
        {Icon && (
          <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', t.icon)}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <div className={cx('tabular -mt-0.5 text-[22px] font-bold tracking-tight sm:text-2xl', t.value)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

const BADGE = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/25',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  gray: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
};
export const Badge = ({ tone = 'gray', children, dot }) => (
  <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', BADGE[tone])}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

const STATUS_TONE = {
  active: 'green', verified: 'green', success: 'green', completed: 'blue', resolved: 'green', won: 'green', available: 'green',
  pending: 'amber', open: 'amber', in_progress: 'blue', scheduled: 'amber', booked: 'blue',
  suspended: 'red', rejected: 'red', reversed: 'red', cancelled: 'red', void: 'gray', closed: 'gray', inactive: 'gray', before_plan: 'gray',
};
export const StatusBadge = ({ status }) => (
  <Badge tone={STATUS_TONE[status] || 'gray'} dot>
    {String(status).replace(/_/g, ' ')}
  </Badge>
);

export function Progress({ value, className, tone }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cx('h-full rounded-full transition-[width] duration-500', tone || (v >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-brand-600'))}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

// Circular progress for hero cards
export function ProgressRing({ value, size = 96, stroke = 9, track = 'rgb(255 255 255 / 0.18)', color = '#fff', children }) {
  const v = Math.max(0, Math.min(100, value || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          style={{ transition: 'stroke-dashoffset 700ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

export const Spinner = ({ className = 'h-6 w-6' }) => (
  <svg className={cx('animate-spin text-current', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const Skeleton = ({ className }) => <div className={cx('animate-pulse rounded-lg bg-slate-200/70', className)} />;

// Spinner by default; <Loading page /> shows a page skeleton (stat tiles + card)
export const Loading = ({ page }) =>
  !page ? (
    <div className="flex justify-center py-10 text-brand-600">
      <Spinner />
    </div>
  ) : (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );

export const Empty = ({ children = 'Nothing here yet', icon: Icon = Inbox, action }) => (
  <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
      <Icon className="h-6 w-6" />
    </span>
    <div className="max-w-sm text-sm text-slate-500">{children}</div>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorBox = ({ error }) =>
  error ? (
    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{error.message || String(error)}</span>
    </div>
  ) : null;

export const Alert = ({ tone = 'amber', children }) => {
  const t = {
    amber: ['border-amber-200 bg-amber-50 text-amber-900', AlertTriangle, 'text-amber-500'],
    blue: ['border-sky-200 bg-sky-50 text-sky-900', Info, 'text-sky-500'],
    red: ['border-rose-200 bg-rose-50 text-rose-900', AlertTriangle, 'text-rose-500'],
    green: ['border-emerald-200 bg-emerald-50 text-emerald-900', CheckCircle2, 'text-emerald-500'],
  }[tone];
  const Icon = t[1];
  return (
    <div className={cx('flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm', t[0])}>
      <Icon className={cx('mt-0.5 h-4 w-4 shrink-0', t[2])} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

/* ---------- Table ---------- */

export function Table({ columns, rows, rowKey = (r) => r._id, empty, onRowClick }) {
  if (!rows?.length) return <Empty>{empty}</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {columns.map((c) => (
              <th key={c.key || c.label} className={cx('whitespace-nowrap px-4 py-2.5', c.right && 'text-right')}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr
              key={rowKey(r)}
              className={cx('transition-colors', onRowClick ? 'cursor-pointer hover:bg-brand-50/40' : 'hover:bg-slate-50/60')}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key || c.label} className={cx('px-4 py-3 align-middle', c.right && 'tabular text-right', c.nowrap !== false && 'whitespace-nowrap')}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, total, onPage }) {
  if (!pages || pages <= 1) return total ? <div className="px-4 pt-3 text-xs text-slate-500">{total} records</div> : null;
  return (
    <div className="flex items-center justify-between px-4 pt-3 text-sm">
      <span className="text-xs text-slate-500">
        {total} records · page {page} of {pages}
      </span>
      <div className="flex gap-1.5">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------- Modal (bottom sheet on phones) ---------- */

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex animate-fade items-end justify-center bg-slate-950/50 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={cx(
          'max-h-[92vh] w-full animate-sheet overflow-y-auto rounded-t-3xl bg-white shadow-lift sm:animate-pop sm:rounded-2xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
        )}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 pb-3 pt-2 backdrop-blur sm:pt-3">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-5 pb-safe sm:pb-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */

const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, tone = 'success') => {
    const id = Math.random();
    setItems((x) => [...x, { id, message, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              'pointer-events-auto flex animate-toast items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lift',
              t.tone === 'error' ? 'bg-rose-600' : 'bg-slate-900'
            )}
          >
            {t.tone === 'error' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ---------- Tabs ---------- */

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-4 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            'cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition',
            value === t.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Misc ---------- */

const AVATAR_TONES = ['bg-brand-600', 'bg-sky-600', 'bg-violet-600', 'bg-amber-500', 'bg-rose-500', 'bg-emerald-600'];
export function Avatar({ name = '?', size = 'md', className }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const tone = AVATAR_TONES[[...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % AVATAR_TONES.length];
  const sz = size === 'sm' ? 'h-7 w-7 text-[11px]' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs';
  return <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', tone, sz, className)}>{initials}</span>;
}
