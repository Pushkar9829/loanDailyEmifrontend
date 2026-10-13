import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BadgeIndianRupee, Building2, CalendarDays, ChartColumn, CircleHelp, ClipboardCheck, HandCoins, IdCard, Landmark, Trophy, Users, UsersRound, Wallet,
} from 'lucide-react';
import { useApi } from '../../lib/hooks';
import { inr } from '../../lib/format';
import { Alert, Avatar, Card, Empty, ErrorBox, Loading, PageHeader, Stat } from '../../components/ui';
import BarChart from '../../components/BarChart';
import Shortfall from '../../components/Shortfall';
import SlotTimeline from '../../components/SlotTimeline';

export default function AdminDashboard() {
  const { data: d, error, loading } = useApi('/reports/dashboard');
  const cfg = useApi('/config/settings');
  if (loading && !d) return <Loading page />;
  if (error) return <ErrorBox error={error} />;

  const toRecover = d.commission.toRecover;
  return (
    <>
      <PageHeader eyebrow="Admin" title="Dashboard" subtitle="Collections, balances and the health of your network at a glance." />
      {d.luckyDrawEnabled && (
        <div className="mb-4">
          <Alert>Lucky draw is ON. Keep your legal sign-off on file (Prize Chits & Money Circulation Schemes Act, 1978).</Alert>
        </div>
      )}

      <Hero
        title="Collected today"
        amount={d.collections.today.amount}
        meta={[
          ['Payments today', d.collections.today.count],
          ['This month', inr(d.collections.month.amount)],
          ['Active plans', d.plans.active],
        ]}
        slots={cfg.data?.slots}
      />

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Landmark} label="Balance issued" value={inr(d.balance.issued)} sub="to Super Franchisees" tone="blue" />
        <Stat
          icon={Wallet}
          label="Balance in network"
          value={inr(d.balance.withSf + d.balance.withAgents)}
          sub={`SF ${inr(d.balance.withSf)} · Agents ${inr(d.balance.withAgents)}${d.balance.fromCommission ? ` · incl. ${inr(d.balance.fromCommission)} from commission` : ''}`}
          tone="brand"
        />
        <Stat
          icon={BadgeIndianRupee}
          label="Commission owed"
          value={inr(d.commission.owedSf + d.commission.owedAgents)}
          sub={`SF ${inr(d.commission.owedSf)} · Agents ${inr(d.commission.owedAgents)}${toRecover ? ` · ${inr(toRecover)} to recover` : ''}`}
          tone="warn"
        />
        <Stat icon={ClipboardCheck} label="All-time collected" value={inr(d.collections.all.amount)} sub={`${d.plans.completed} plans fully paid`} tone="violet" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title="Collections" subtitle="Last 14 days" icon={ChartColumn} className="lg:col-span-2" actions={<CardLink to="/reports">Reports</CardLink>}>
          <BarChart data={d.series} />
        </Card>
        <Card title="Network" icon={UsersRound} padded={false}>
          <ul className="divide-y divide-slate-100">
            <Row to="/users/sf" icon={Building2} label="Super Franchisees" value={d.users.sf} />
            <Row to="/users/agent" icon={UsersRound} label="Agents" value={d.users.agents} />
            <Row to="/users/customer" icon={Users} label="Customers" value={d.users.customers} />
            <Row to="/users/customer?kyc=pending" icon={IdCard} label="KYC waiting" value={d.users.pendingKyc} warn={d.users.pendingKyc > 0} />
            <Row to="/complaints" icon={CircleHelp} label="Open complaints" value={d.openComplaints} warn={d.openComplaints > 0} />
          </ul>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="Top agents" subtitle="This month" icon={Trophy} padded={false}>
          {d.topAgents.length === 0 ? (
            <Empty icon={HandCoins}>No collections this month yet</Empty>
          ) : (
            <ol className="divide-y divide-slate-100">
              {d.topAgents.map((a, i) => (
                <li key={a._id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 text-center text-sm font-bold text-slate-400">{i + 1}</span>
                  <Avatar name={a.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{a.name}</div>
                    <div className="text-xs text-slate-500">
                      {a.code} · {a.count} payments
                    </div>
                  </div>
                  <div className="tabular text-sm font-semibold text-slate-900">{inr(a.amount)}</div>
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Shortfall limit={6} />
      </div>
    </>
  );
}

export function Hero({ title, amount, meta, slots, children }) {
  const open = slots?.find((s) => s.state === 'open');
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-lift sm:p-7">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-brand-700/30 blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-300">
            <CalendarDays className="h-4 w-4" /> {title}
          </div>
          <div className="tabular mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">{inr(amount)}</div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {meta.map(([k, v]) => (
              <div key={k}>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">{k}</div>
                <div className="tabular text-base font-semibold">{v}</div>
              </div>
            ))}
          </div>
          {children}
        </div>
        {slots && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="mb-4 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-widest text-slate-400">Today's slots</span>
              <span className={open ? 'font-semibold text-brand-300' : 'text-slate-400'}>{open ? `${open.label} slot open` : 'No slot open now'}</span>
            </div>
            <SlotTimeline slots={slots} dark />
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ to, icon: Icon, label, value, warn }) {
  return (
    <li>
      <Link to={to} className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${warn ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
          {warn ? <AlertTriangle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </span>
        <span className="flex-1 text-sm text-slate-700">{label}</span>
        <span className={`tabular text-sm font-bold ${warn ? 'text-amber-600' : 'text-slate-900'}`}>{value}</span>
        <ArrowRight className="h-4 w-4 text-slate-300" />
      </Link>
    </li>
  );
}

export function CardLink({ to, children }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}
