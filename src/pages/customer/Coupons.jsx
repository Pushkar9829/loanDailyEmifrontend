import { useState } from 'react';
import { useApi } from '../../lib/hooks';
import { useAuth } from '../../lib/auth';
import { dateTime } from '../../lib/format';
import { Card, Empty, ErrorBox, Loading, PageHeader, Pagination, StatusBadge, Table } from '../../components/ui';

export default function Coupons() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const draws = useApi('/rewards/draws');
  const coupons = useApi('/rewards/coupons', { page });
  const plans = useApi(user.role === 'customer' ? '/reports/dashboard' : null, undefined, { skip: user.role !== 'customer' });

  return (
    <>
      <PageHeader title="Rewards" subtitle="Milestones you reach as you pay" />
      {plans.data && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {plans.data.plans.map((p) => (
            <Card key={p._id} title={p.property?.title}>
              <div className="flex gap-2">
                {[25, 50, 75, 100].map((m) => {
                  const hit = p.milestonesReached?.includes(m);
                  return (
                    <div key={m} className={`flex-1 rounded-xl border p-3 text-center ${hit ? 'border-amber-300 bg-amber-50' : 'border-dashed border-slate-300 text-slate-400'}`}>
                      <div className="text-xl">{hit ? (m === 100 ? '🏆' : '⭐') : '○'}</div>
                      <div className="text-sm font-semibold">{m}%</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {draws.data?.enabled && (
        <Card title="Lucky draw coupons" padded={false}>
          {coupons.loading && !coupons.data ? <Loading /> : <ErrorBox error={coupons.error} />}
          {coupons.data && (
            <Table
              rows={coupons.data.items}
              empty="You get one coupon for every installment you pay"
              columns={[
                { label: 'Coupon', render: (c) => <span className="font-mono font-semibold">{c.code}</span> },
                { label: 'Plan', render: (c) => c.plan?.planNo },
                { label: 'Date', key: 'dateKey' },
                { label: 'Status', render: (c) => <span><StatusBadge status={c.status} />{c.draw && c.status === 'won' && <span className="ml-1 text-xs text-emerald-700">{c.draw.prize}</span>}
                  {c.draw && c.status === 'void' && <span className="ml-1 text-xs text-rose-600">prize cancelled</span>}</span> },
              ]}
            />
          )}
          <div className="pb-3">
            <Pagination page={coupons.data?.page} pages={coupons.data?.pages} total={coupons.data?.total} onPage={setPage} />
          </div>
        </Card>
      )}
      {draws.data?.enabled && draws.data.items.some((d) => d.status === 'completed') && (
        <Card title="Past draws" className="mt-4">
          <ul className="space-y-2 text-sm">
            {draws.data.items
              .filter((d) => d.status === 'completed')
              .map((d) => (
                <li key={d._id}>
                  <b>{d.title}</b> – {d.prize} · {dateTime(d.runAt)} · winners: {d.winners.map((w) => (w.voided ? `${w.code} (cancelled)` : w.code)).join(', ')}
                </li>
              ))}
          </ul>
        </Card>
      )}
      {draws.data && !draws.data.enabled && !plans.data?.plans.length && <Empty>No rewards yet</Empty>}
    </>
  );
}
