import { Link } from 'react-router-dom';
import { ArrowRight, Bike, Building, Car, ClipboardList, House, LandPlot, Store } from 'lucide-react';
import { useApi } from '../../lib/hooks';
import { inr, monthLabel, PROPERTY_TYPES } from '../../lib/format';
import { Card, Empty, ErrorBox, Loading, PageHeader, Progress, ProgressRing, StatusBadge } from '../../components/ui';
import SlotTimeline from '../../components/SlotTimeline';

const TYPE_ICON = { plot: LandPlot, flat: Building, house: House, shop: Store, two_wheeler: Bike, four_wheeler: Car, other: ClipboardList };

export default function CustomerHome() {
  const { data: d, error, loading } = useApi('/reports/dashboard');
  const cfg = useApi('/config/settings');
  if (loading && !d) return <Loading page />;
  if (error) return <ErrorBox error={error} />;
  return (
    <>
      <PageHeader
        title="My plans"
        subtitle={d.currentSlot ? `The ${d.currentSlot.label} payment slot is open now – pay your agent.` : 'Pay your agent in any of the 5 daily slots.'}
      />
      {cfg.data?.slots && (
        <Card className="mb-5">
          <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Today's payment slots</div>
          <SlotTimeline slots={cfg.data.slots} />
        </Card>
      )}
      {d.plans.length === 0 && (
        <Card>
          <Empty icon={ClipboardList}>No plans yet. Your agent will open a plan for you.</Empty>
        </Card>
      )}
      <div className="grid gap-5 md:grid-cols-2">
        {d.plans.map((p) => {
          const Icon = TYPE_ICON[p.property?.type] || ClipboardList;
          return (
            <Link key={p._id} to={`/plans/${p._id}`} className="group block overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-slate-950 p-5 text-white">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex items-center gap-4">
                  <ProgressRing value={p.progressPercent} size={92}>
                    <span className="tabular text-lg font-bold">{Math.round(p.progressPercent)}%</span>
                    <span className="text-[10px] text-brand-100">paid</span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-brand-200">
                      <Icon className="h-3.5 w-3.5" /> {PROPERTY_TYPES[p.property?.type]}
                    </div>
                    <div className="truncate text-lg font-bold">{p.property?.title}</div>
                    <div className="truncate text-xs text-brand-100/80">
                      {p.planNo} · {p.property?.location}
                    </div>
                    <div className="tabular mt-2 text-sm">
                      <b className="text-base">{inr(p.totalPaid)}</b> <span className="text-brand-100/80">of {inr(p.totalPayable)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                {p.status === 'active' ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{monthLabel(p.month.monthKey)} EMI</span>
                      <span className="tabular text-slate-600">
                        <b className="text-slate-900">{inr(p.month.paid)}</b> / {inr(p.month.target)}
                      </span>
                    </div>
                    <Progress className="mt-2 h-2.5" value={p.month.percentOfTarget} />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={p.month.remainingThisMonth > 0 ? 'text-slate-500' : 'font-medium text-emerald-600'}>
                        {p.month.remainingThisMonth > 0 ? `${inr(p.month.remainingThisMonth)} more this month` : "This month's EMI is complete ✓"}
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-brand-700 group-hover:gap-1.5">
                        Details <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <StatusBadge status={p.status} />
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                      Details <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
