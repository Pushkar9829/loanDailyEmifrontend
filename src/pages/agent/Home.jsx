import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeIndianRupee, ClipboardPlus, HandCoins, PartyPopper, Search, TrendingUp, UserPlus, Wallet } from 'lucide-react';
import { useApi } from '../../lib/hooks';
import { useAuth } from '../../lib/auth';
import { inr } from '../../lib/format';
import { Alert, Avatar, Button, Card, Empty, ErrorBox, Loading, Progress, Stat } from '../../components/ui';
import CollectModal from '../../components/CollectModal';
import { Hero } from '../admin/Dashboard';

export default function AgentHome() {
  const { wallets } = useAuth();
  const nav = useNavigate();
  const { data: d, error, loading, reload } = useApi('/reports/dashboard');
  const cfg = useApi('/config/settings');
  const [target, setTarget] = useState(null);
  const [q, setQ] = useState('');

  if (loading && !d) return <Loading page />;
  if (error) return <ErrorBox error={error} />;
  const slot = d.currentSlot;
  const lowBalance = wallets.balance < 1000;
  const pending = d.pendingNow.filter(
    (p) => !q || p.planNo.toLowerCase().includes(q.toLowerCase()) || p.customer?.name.toLowerCase().includes(q.toLowerCase()) || p.customer?.phone.includes(q)
  );

  return (
    <>
      <Hero
        title="Collected today"
        amount={d.collections.today.amount}
        meta={[
          ['Payments', d.collections.today.count],
          ['This month', inr(d.collections.month.amount)],
          ['Active plans', d.plans.active],
        ]}
        slots={cfg.data?.slots}
      >
        <div className="mt-5 flex flex-wrap gap-2">
          <Button icon={UserPlus} variant="secondary" size="sm" onClick={() => nav('/users/customer?new=1')}>
            New customer
          </Button>
          <Button icon={ClipboardPlus} size="sm" onClick={() => nav('/plans/new')} className="from-brand-400! to-brand-500!">
            Open plan
          </Button>
        </div>
      </Hero>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Wallet} label="My balance" value={inr(wallets.balance)} tone={lowBalance ? 'bad' : 'brand'} sub={lowBalance ? 'Low – ask your SF for a top-up' : 'Available to credit'} />
        <Stat icon={BadgeIndianRupee} label="Commission" value={inr(wallets.commission)} tone={wallets.commission < 0 ? 'bad' : 'warn'} sub="Earned on collections" />
        <Stat icon={TrendingUp} label="This month" value={inr(d.collections.month.amount)} sub={`${d.collections.month.count} payments`} tone="blue" />
        <Stat icon={HandCoins} label="Customers" value={d.customers} sub={`${d.plans.active} active plans`} tone="violet" />
      </div>

      <div className="mt-5">
        {!slot ? (
          <Alert tone="blue">
            No payment slot is open right now. Open a customer's plan from <Link className="font-semibold underline" to="/plans">Plans</Link> to record a slot that already passed today (if
            late entry is allowed).
          </Alert>
        ) : (
          <Card
            title={`Collect for the ${slot.label} slot`}
            subtitle={`${d.pendingNow.length} customer${d.pendingNow.length === 1 ? '' : 's'} not paid yet`}
            icon={HandCoins}
            actions={
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-56 rounded-xl border-0 bg-slate-100 py-2 pl-9 pr-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-brand-500"
                  placeholder="Name, phone or plan"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Search customers"
                />
              </div>
            }
          >
            {pending.length === 0 ? (
              <Empty icon={PartyPopper}>
                {d.plans.active === 0 ? 'No active plans yet. Open a plan for a customer to start collecting.' : q ? 'No customer matches your search.' : 'Everyone has paid for this slot. 🎉'}
              </Empty>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pending.map((p) => {
                  const month = p.monthly?.[d.today.slice(0, 7)] || 0;
                  const pct = (month / p.monthlyTarget) * 100;
                  return (
                    <div key={p._id} className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-card">
                      <div className="flex items-start gap-3">
                        <Avatar name={p.customer?.name || '?'} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-slate-900">{p.customer?.name}</div>
                          <div className="truncate text-xs text-slate-500">
                            {p.customer?.phone} · {p.planNo}
                          </div>
                          <div className="truncate text-xs text-slate-400">{p.property?.title}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-500">This month</span>
                        <span className="tabular font-medium text-slate-700">
                          {inr(month)} <span className="text-slate-400">/ {inr(p.monthlyTarget)}</span>
                        </span>
                      </div>
                      <Progress className="mt-1.5" value={pct} />
                      <Button className="mt-3 w-full" icon={HandCoins} onClick={() => setTarget(p)}>
                        Collect
                      </Button>
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
