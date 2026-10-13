import { Link } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { inr } from '../../lib/format';
import { Alert, Card, ErrorBox, Loading, PageHeader, Stat, Table } from '../../components/ui';
import BarChart from '../../components/BarChart';
import Shortfall from '../../components/Shortfall';

export default function AdminDashboard() {
  const { data: d, error, loading } = useApi('/reports/dashboard');
  if (loading && !d) return <Loading />;
  if (error) return <ErrorBox error={error} />;

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        subtitle={`Today ${d.today}${d.currentSlot ? ` · slot ${d.currentSlot.label} open` : ' · no slot open now'}`}
      />
      {d.luckyDrawEnabled && (
        <div className="mb-4">
          <Alert>Lucky draw is ON. Make sure your legal sign-off is on file (Prize Chits & Money Circulation Schemes Act, 1978).</Alert>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Collected today" value={inr(d.collections.today.amount)} sub={`${d.collections.today.count} payments`} tone="brand" />
        <Stat label="This month" value={inr(d.collections.month.amount)} sub={`${d.collections.month.count} payments`} />
        <Stat label="Active plans" value={d.plans.active} sub={`${d.plans.completed} completed`} />
        <Stat label="All-time collections" value={inr(d.collections.all.amount)} />
        <Stat label="Balance issued to SFs" value={inr(d.balance.issued)} />
        <Stat
          label="Balance with SFs / Agents"
          value={inr(d.balance.withSf + d.balance.withAgents)}
          sub={`SF ${inr(d.balance.withSf)} · Agents ${inr(d.balance.withAgents)}${d.balance.fromCommission ? ` · incl. ${inr(d.balance.fromCommission)} moved from commission` : ''}`}
        />
        <Stat
          label="Commission owed"
          value={inr(d.commission.owedSf + d.commission.owedAgents)}
          sub={`SF ${inr(d.commission.owedSf)} · Agents ${inr(d.commission.owedAgents)}${d.commission.toRecover ? ` · ${inr(d.commission.toRecover)} to recover` : ''}`}
          tone="warn"
        />
        <Stat label="Commission paid out" value={inr(d.commission.paidOut)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Collections – last 14 days" className="lg:col-span-2">
          <BarChart data={d.series} />
        </Card>
        <Card title="Network">
          <ul className="space-y-2 text-sm">
            <Row to="/users/sf" label="Super Franchisees" value={d.users.sf} />
            <Row to="/users/agent" label="Agents" value={d.users.agents} />
            <Row to="/users/customer" label="Customers" value={d.users.customers} />
            <Row to="/users/customer?kyc=pending" label="KYC pending" value={d.users.pendingKyc} warn={d.users.pendingKyc > 0} />
            <Row to="/complaints" label="Open complaints" value={d.openComplaints} warn={d.openComplaints > 0} />
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Top agents this month" padded={false}>
          <Table
            rows={d.topAgents}
            empty="No collections this month"
            columns={[
              { label: 'Agent', render: (r) => `${r.name} (${r.code})` },
              { label: 'Payments', key: 'count', right: true },
              { label: 'Collected', render: (r) => inr(r.amount), right: true },
            ]}
          />
        </Card>
        <Shortfall limit={8} />
      </div>
    </>
  );
}

function Row({ to, label, value, warn }) {
  return (
    <li>
      <Link to={to} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50">
        <span className="text-slate-600">{label}</span>
        <span className={`font-semibold ${warn ? 'text-amber-600' : 'text-slate-900'}`}>{value}</span>
      </Link>
    </li>
  );
}
