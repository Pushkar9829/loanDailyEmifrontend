import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { useAuth } from '../../lib/auth';
import { inr } from '../../lib/format';
import { Alert, Button, Card, ErrorBox, Input, Loading, PageHeader, Progress, Stat } from '../../components/ui';
import CollectModal from '../../components/CollectModal';

export default function AgentHome() {
  const { wallets } = useAuth();
  const nav = useNavigate();
  const { data: d, error, loading, reload } = useApi('/reports/dashboard');
  const [target, setTarget] = useState(null);
  const [q, setQ] = useState('');

  if (loading && !d) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const slot = d.currentSlot;
  const pending = d.pendingNow.filter(
    (p) => !q || p.planNo.toLowerCase().includes(q.toLowerCase()) || p.customer?.name.toLowerCase().includes(q.toLowerCase()) || p.customer?.phone.includes(q)
  );

  return (
    <>
      <PageHeader
        title="Collect installments"
        subtitle={slot ? `Slot ${slot.label} is open now` : 'No slot is open right now'}
        actions={
          <>
            <Button variant="secondary" onClick={() => nav('/users/customer?new=1')}>+ Customer</Button>
            <Button onClick={() => nav('/plans/new')}>+ New plan</Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="My balance" value={inr(wallets.balance)} tone={wallets.balance < 1000 ? 'bad' : 'brand'} sub={wallets.balance < 1000 ? 'Low – ask SF for top-up' : 'Available to credit'} />
        <Stat label="Commission earned" value={inr(wallets.commission)} />
        <Stat label="Collected today" value={inr(d.collections.today.amount)} sub={`${d.collections.today.count} payments`} />
        <Stat label="This month" value={inr(d.collections.month.amount)} sub={`${d.plans.active} active plans · ${d.customers} customers`} />
      </div>

      <div className="mt-4">
        {!slot ? (
          <Alert tone="blue">
            Payments are taken in 5 slots daily. Open a plan from <Link className="font-semibold underline" to="/plans">Plans</Link> to record a slot that already passed today
            (if late entry is allowed).
          </Alert>
        ) : (
          <Card
            title={`Not yet paid in ${slot.label} slot (${d.pendingNow.length})`}
            actions={<Input className="w-48" placeholder="Search name / phone / plan" value={q} onChange={(e) => setQ(e.target.value)} />}
          >
            {pending.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                {d.plans.active === 0 ? 'No active plans yet. Open a plan for a customer to start collecting.' : q ? 'No match' : 'All your active plans are paid for this slot 🎉'}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pending.map((p) => {
                  const month = p.monthly?.[d.today.slice(0, 7)] || 0;
                  return (
                    <div key={p._id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{p.customer?.name}</div>
                          <div className="truncate text-xs text-slate-500">
                            {p.customer?.phone} · {p.planNo}
                          </div>
                          <div className="truncate text-xs text-slate-500">{p.property?.title}</div>
                        </div>
                        <Button size="sm" onClick={() => setTarget(p)}>
                          Collect
                        </Button>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-slate-500">
                        <span>This month</span>
                        <span>
                          {inr(month)} / {inr(p.monthlyTarget)}
                        </span>
                      </div>
                      <Progress className="mt-1" value={(month / p.monthlyTarget) * 100} />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>

      <CollectModal
        open={!!target}
        plan={target}
        slot={slot}
        onClose={() => {
          setTarget(null);
          reload();
        }}
      />
    </>
  );
}
