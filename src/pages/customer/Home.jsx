import { Link } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { inr, monthLabel, PROPERTY_TYPES } from '../../lib/format';
import { Card, Empty, ErrorBox, Loading, PageHeader, Progress, StatusBadge } from '../../components/ui';

export default function CustomerHome() {
  const { data: d, error, loading } = useApi('/reports/dashboard');
  if (loading && !d) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return (
    <>
      <PageHeader title="My plans" subtitle={d.currentSlot ? `Payment slot ${d.currentSlot.label} is open now – pay your agent` : 'Pay your agent in any of the 5 daily slots'} />
      {d.plans.length === 0 && (
        <Card>
          <Empty>No plans yet. Your agent will open a plan for you.</Empty>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {d.plans.map((p) => (
          <Link key={p._id} to={`/plans/${p._id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-500">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{PROPERTY_TYPES[p.property?.type]}</div>
                <div className="text-lg font-semibold">{p.property?.title}</div>
                <div className="text-xs text-slate-500">
                  {p.planNo} · {p.property?.location}
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-xs text-slate-500">Paid so far</div>
                <div className="text-2xl font-bold tabular-nums text-brand-700">{inr(p.totalPaid)}</div>
              </div>
              <div className="text-right text-sm text-slate-500">of {inr(p.totalPayable)}</div>
            </div>
            <Progress className="mt-2 h-3" value={p.progressPercent} />
            <div className="mt-1 text-right text-xs text-slate-500">{p.progressPercent}% complete</div>
            {p.status === 'active' && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{monthLabel(p.month.monthKey)} target (EMI)</span>
                  <span className="tabular-nums">
                    {inr(p.month.paid)} / {inr(p.month.target)}
                  </span>
                </div>
                <Progress className="mt-2" value={p.month.percentOfTarget} />
                <div className="mt-1.5 text-xs text-slate-500">
                  {p.month.remainingThisMonth > 0 ? `${inr(p.month.remainingThisMonth)} more to reach this month's EMI` : "This month's EMI is complete ✓"}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
