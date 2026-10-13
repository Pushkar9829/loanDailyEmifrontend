import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { inr } from '../../lib/format';
import { Button, Card, ErrorBox, Loading, PageHeader, Stat, StatusBadge, Table } from '../../components/ui';
import BarChart from '../../components/BarChart';
import Shortfall from '../../components/Shortfall';

export default function SfDashboard() {
  const nav = useNavigate();
  const { data: d, error, loading } = useApi('/reports/dashboard');
  if (loading && !d) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return (
    <>
      <PageHeader
        title="Super Franchisee dashboard"
        subtitle={`Today ${d.today}${d.currentSlot ? ` · slot ${d.currentSlot.label} open` : ''}`}
        actions={<Button onClick={() => nav('/wallet')}>Transfer balance to agent</Button>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="My balance" value={inr(d.wallets.balance)} tone="brand" />
        <Stat label="My commission" value={inr(d.wallets.commission)} />
        <Stat label="Network collected today" value={inr(d.collections.today.amount)} sub={`${d.collections.today.count} payments`} />
        <Stat label="This month" value={inr(d.collections.month.amount)} sub={`${d.plans.active} active plans · ${d.customers} customers`} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Network collections – 14 days" className="lg:col-span-2">
          <BarChart data={d.series} />
        </Card>
        <Card title="Needs attention">
          <button onClick={() => nav('/users/customer?kyc=pending')} className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50">
            <span>Customers waiting for KYC</span>
            <span className={`font-semibold ${d.pendingKyc ? 'text-amber-600' : ''}`}>{d.pendingKyc}</span>
          </button>
          <button
            onClick={() => nav('/users/agent')}
            className="flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-slate-50"
          >
            <span>Agents with balance below ₹1,000</span>
            <span className="font-semibold text-rose-600">{d.agents.filter((a) => a.wallets.balance < 1000).length}</span>
          </button>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="My agents" padded={false}>
          <Table
            rows={d.agents}
            empty="No agents yet"
            columns={[
              { label: 'Agent', render: (a) => `${a.name} (${a.code})` },
              { label: 'Status', render: (a) => <StatusBadge status={a.status} /> },
              { label: 'Balance', render: (a) => <span className={a.wallets.balance < 1000 ? 'text-rose-600' : ''}>{inr(a.wallets.balance)}</span>, right: true },
              { label: 'Month', render: (a) => inr(a.month.amount), right: true },
            ]}
          />
        </Card>
        <Shortfall limit={8} />
      </div>
    </>
  );
}
