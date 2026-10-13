import { Link } from 'react-router-dom';
import { PartyPopper, TrendingDown } from 'lucide-react';
import { useApi } from '../lib/hooks';
import { inr } from '../lib/format';
import { Avatar, Card, Empty, ErrorBox, Loading, Progress } from './ui';

// Plans behind their pro-rata monthly EMI target.
export default function Shortfall({ limit }) {
  const { data, error, loading } = useApi('/reports/shortfall');
  const rows = data?.items?.slice(0, limit) || [];
  return (
    <Card title="Behind this month's target" subtitle={data ? `${data.total} plan${data.total === 1 ? '' : 's'} need follow-up` : undefined} icon={TrendingDown} padded={false}>
      {loading && !data ? <Loading /> : <ErrorBox error={error} />}
      {data && rows.length === 0 && <Empty icon={PartyPopper}>Everyone is on track this month</Empty>}
      {rows.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.plan._id}>
              <Link to={`/plans/${r.plan._id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50">
                <Avatar name={r.plan.customer?.name || '?'} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-slate-900">{r.plan.customer?.name}</span>
                    <span className="tabular shrink-0 text-sm font-semibold text-rose-600">−{inr(r.month.shortfallToDate)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress className="h-1.5" value={(r.month.paid / Math.max(1, r.month.expectedToDate)) * 100} tone="bg-amber-400" />
                    <span className="tabular shrink-0 text-[11px] text-slate-500">
                      {inr(r.month.paid)} / {inr(r.month.expectedToDate)}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-400">
                    {r.plan.planNo} · {r.plan.customer?.phone}
                    {r.plan.agent?.name ? ` · ${r.plan.agent.name}` : ''}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
