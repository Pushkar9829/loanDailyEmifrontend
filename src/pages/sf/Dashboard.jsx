import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeftRight, BadgeIndianRupee, ChartColumn, IdCard, TrendingUp, Users, UsersRound, Wallet } from 'lucide-react';
import { useApi } from '../../lib/hooks';
import { inr } from '../../lib/format';
import { Avatar, Button, Card, Empty, ErrorBox, Loading, PageHeader, Stat, StatusBadge } from '../../components/ui';
import BarChart from '../../components/BarChart';
import Shortfall from '../../components/Shortfall';
import { CardLink, Hero } from '../admin/Dashboard';

export default function SfDashboard() {
  const nav = useNavigate();
  const { data: d, error, loading } = useApi('/reports/dashboard');
  const cfg = useApi('/config/settings');
  if (loading && !d) return <Loading page />;
  if (error) return <ErrorBox error={error} />;
  const lowAgents = d.agents.filter((a) => a.wallets.balance < 1000);

  return (
    <>
      <PageHeader eyebrow="Super Franchisee" title="Dashboard" actions={<Button icon={ArrowLeftRight} onClick={() => nav('/wallet')}>Transfer to agent</Button>} />
      <Hero
        title="Network collected today"
        amount={d.collections.today.amount}
        meta={[
          ['Payments', d.collections.today.count],
          ['This month', inr(d.collections.month.amount)],
          ['Active plans', d.plans.active],
        ]}
        slots={cfg.data?.slots}
      />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Wallet} label="My balance" value={inr(d.wallets.balance)} tone="brand" sub="To transfer to agents" />
        <Stat icon={BadgeIndianRupee} label="My commission" value={inr(d.wallets.commission)} tone="warn" />
        <Stat icon={UsersRound} label="Agents" value={d.agents.length} sub={lowAgents.length ? `${lowAgents.length} low on balance` : 'All topped up'} tone={lowAgents.length ? 'bad' : 'blue'} />
        <Stat icon={Users} label="Customers" value={d.customers} sub={d.pendingKyc ? `${d.pendingKyc} KYC waiting` : 'KYC up to date'} tone="violet" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title="Network collections" subtitle="Last 14 days" icon={ChartColumn} className="lg:col-span-2" actions={<CardLink to="/reports">Reports</CardLink>}>
          <BarChart data={d.series} />
        </Card>
        <Card title="Needs attention" icon={AlertTriangle} padded={false}>
          <ul className="divide-y divide-slate-100">
            <li>
              <Link to="/users/customer?kyc=pending" className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <IdCard className="h-4 w-4 text-slate-400" />
                <span className="flex-1 text-sm">Customers waiting for KYC</span>
                <span className={`tabular font-bold ${d.pendingKyc ? 'text-amber-600' : 'text-slate-900'}`}>{d.pendingKyc}</span>
              </Link>
            </li>
            {lowAgents.map((a) => (
              <li key={a._id}>
                <Link to="/wallet" className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <Avatar name={a.name} size="sm" />
                  <span className="flex-1 text-sm">
                    {a.name} <span className="text-xs text-slate-400">low balance</span>
                  </span>
                  <span className="tabular text-sm font-bold text-rose-600">{inr(a.wallets.balance)}</span>
                </Link>
              </li>
            ))}
            {!d.pendingKyc && !lowAgents.length && <Empty>Nothing needs attention</Empty>}
          </ul>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="My agents" subtitle="Balance and this month's collections" icon={TrendingUp} padded={false} actions={<CardLink to="/users/agent">All agents</CardLink>}>
          {d.agents.length === 0 ? (
            <Empty>No agents yet</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.agents.map((a) => (
                <li key={a._id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={a.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{a.name}</span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="text-xs text-slate-500">
                      {a.code} · balance <span className={a.wallets.balance < 1000 ? 'font-semibold text-rose-600' : ''}>{inr(a.wallets.balance)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular text-sm font-semibold">{inr(a.month.amount)}</div>
                    <div className="text-[11px] text-slate-400">{a.month.count} payments</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Shortfall limit={6} />
      </div>
    </>
  );
}
