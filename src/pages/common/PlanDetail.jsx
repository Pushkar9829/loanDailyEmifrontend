import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { useAuth } from '../../lib/auth';
import { date, inr, monthLabel, PAY_MODES, PROPERTY_TYPES } from '../../lib/format';
import { CalendarRange, FileText, HandCoins, Landmark, ListChecks, ReceiptText, ScrollText, XCircle } from 'lucide-react';
import { Alert, Badge, Button, Card, ErrorBox, Loading, PageHeader, Progress, ProgressRing, StatusBadge, Table } from '../../components/ui';
import SlotTimeline from '../../components/SlotTimeline';
import { CancelPlanModal, DownPaymentModal, RefundModal } from '../../components/PlanActions';
import CollectModal from '../../components/CollectModal';
import InstallmentTable from '../../components/InstallmentTable';

export default function PlanDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: d, error, loading, reload } = useApi(`/plans/${id}`);
  const [slot, setSlot] = useState(null);
  const [dialog, setDialog] = useState(null); // 'down' | 'cancel' | 'refund'
  const [listKey, setListKey] = useState(0);

  if (loading && !d) return <Loading page />;
  if (error) return <ErrorBox error={error} />;
  const { plan, month, slots, monthly } = d;
  const isAgent = user.role === 'agent';

  const staff = user.role !== 'customer';
  const st = plan.settlement;

  return (
    <>
      <PageHeader
        eyebrow={`${plan.planNo} · ${PROPERTY_TYPES[plan.property?.type]}`}
        title={plan.property?.title}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-2">
            Agreement {plan.agreementNo} <StatusBadge status={plan.status} />
            {plan.financeType === 'partner_loan' && <Badge tone="blue">Loan · {plan.lender?.name}</Badge>}
          </span>
        }
        actions={
          <>
            <a className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50" href={`/plans/${plan._id}/statement`} target="_blank" rel="noreferrer">
              <FileText className="h-4 w-4" /> Statement
            </a>
            <a className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50" href={`/plans/${plan._id}/kfs`} target="_blank" rel="noreferrer">
              <ScrollText className="h-4 w-4" /> Key Fact Statement
            </a>
            {user.role === 'admin' && plan.status === 'active' && (
              <Button variant="danger" icon={XCircle} onClick={() => setDialog('cancel')}>
                Cancel plan
              </Button>
            )}
          </>
        }
      />

      {plan.status === 'active' && plan.downPaymentStatus === 'pending' && (
        <div className="mb-4">
          <Alert>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Down payment of <b>{inr(plan.downPayment)}</b> is not recorded yet.{d.downPaymentBlocked ? ' Daily collections start after it is received.' : ''}
              </span>
              {staff && (
                <Button size="sm" onClick={() => setDialog('down')}>
                  Record down payment
                </Button>
              )}
            </div>
          </Alert>
        </div>
      )}
      {plan.status === 'cancelled' && st && st.status !== 'none' && (
        <div className="mb-4">
          <Alert tone={st.status === 'paid' ? 'blue' : 'red'}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Cancelled {date(plan.cancelledAt)} – {plan.cancelReason}. Refund <b>{inr(st.refundAmount)}</b> ({inr(st.paidInstallments + st.downPayment)} paid − {st.chargePercent}% charge {inr(st.charge)})
                {st.commissionClawedBack ? `, commission taken back ${inr(st.commissionClawedBack)}` : ''}.{' '}
                {st.status === 'paid' ? `Paid ${date(st.paidAt)} by ${PAY_MODES[st.mode]} (ref ${st.reference}).` : 'Refund pending.'}
              </span>
              {user.role === 'admin' && st.status === 'pending' && (
                <Button size="sm" onClick={() => setDialog('refund')}>
                  Mark refund paid
                </Button>
              )}
            </div>
          </Alert>
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-slate-950 p-5 text-white shadow-lift sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-6">
          <ProgressRing value={plan.progressPercent} size={110} stroke={10}>
            <span className="tabular text-2xl font-extrabold">{Math.round(plan.progressPercent)}%</span>
            <span className="text-[10px] uppercase tracking-wider text-brand-100">paid</span>
          </ProgressRing>
          <div className="grid w-full grid-cols-2 gap-x-6 gap-y-4 sm:w-auto sm:flex-1 lg:grid-cols-4">
            {[
              ['Monthly EMI', inr(plan.monthlyTarget), `${plan.tenureMonths} months${plan.interestRate ? ` @ ${plan.interestRate}%` : ', no interest'}`],
              ['Paid', inr(plan.totalPaid), `${plan.installmentsCount} installment${plan.installmentsCount === 1 ? '' : 's'}`],
              ['Remaining', inr(d.remaining), `of ${inr(plan.totalPayable)}`],
              ['Milestones', plan.milestonesReached.length ? plan.milestonesReached.map((m) => `${m}%`).join(' · ') : '—', 'reached'],
            ].map(([k, v, sub]) => (
              <div key={k}>
                <div className="text-[11px] uppercase tracking-wide text-brand-200">{k}</div>
                <div className="tabular text-xl font-bold">{v}</div>
                <div className="text-xs text-brand-100/70">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title="Today's slots" subtitle={d.today} icon={CalendarRange} className="lg:col-span-2">
          <SlotTimeline slots={slots} onSlotClick={setSlot} canClick={(x) => isAgent && x.canCollect} />
          {isAgent && slots.some((x) => x.canCollect) && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {slots
                .filter((x) => x.canCollect)
                .map((x) => (
                  <Button key={x.no} icon={HandCoins} variant={x.state === 'open' ? 'primary' : 'secondary'} onClick={() => setSlot(x)}>
                    Collect · {x.label}
                  </Button>
                ))}
            </div>
          )}
          <div className="mt-4 text-xs text-slate-500">Allowed amounts: {plan.denominations.map(inr).join(' · ')}</div>
        </Card>

        <Card title={monthLabel(month.monthKey)} subtitle="This month vs EMI" icon={ListChecks}>
          <div className="space-y-2 text-sm">
            <Line label="Paid this month" value={inr(month.paid)} />
            <Line label="EMI target" value={inr(month.target)} />
            <Line label="Expected by today" value={inr(month.expectedToDate)} />
            <Line label="Behind by" value={<span className={month.shortfallToDate ? 'text-rose-600' : 'text-emerald-600'}>{inr(month.shortfallToDate)}</span>} />
          </div>
          <Progress className="mt-3" value={month.percentOfTarget} />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card title="Plan details" icon={Landmark}>
          <div className="space-y-2 text-sm">
            <Line label="Customer" value={<span>{plan.customer?.name} ({plan.customer?.code})</span>} />
            {user.role !== 'customer' && <Line label="Phone" value={plan.customer?.phone} />}
            <Line label="Agent" value={`${plan.agent?.name} · ${plan.agent?.phone}`} />
            {user.role === 'admin' && <Line label="Super Franchisee" value={`${plan.sf?.name} (${plan.sf?.code})`} />}
            <Line label="Property value" value={inr(plan.propertyValue)} />
            <Line
              label="Down payment"
              value={
                plan.downPaymentStatus === 'received'
                  ? `${inr(plan.downPayment)} · ${PAY_MODES[plan.downPaymentReceipt?.mode]} · ${plan.downPaymentReceipt?.receiptNo}`
                  : plan.downPaymentStatus === 'pending'
                    ? `${inr(plan.downPayment)} · pending`
                    : '—'
              }
            />
            <Line label="Financed by" value={plan.financeType === 'partner_loan' ? `${plan.lender?.name} (loan a/c ${plan.loanAccountNo})` : 'Self / seller'} />
            {plan.financeType === 'partner_loan' && plan.processingFee > 0 && <Line label="Processing fee" value={inr(plan.processingFee)} />}
            <Line label="Financed" value={inr(plan.financedAmount)} />
            <Line label="Start → End" value={`${date(plan.startDate)} → ${date(plan.endDate)}`} />
            {plan.immovable && <Line label="Cash paid (cap applies)" value={inr(plan.cashPaid)} />}
          </div>
        </Card>
        <Card title="Month by month" icon={CalendarRange} padded={false} className="lg:col-span-2">
          <Table
            rows={monthly}
            rowKey={(r) => r.monthKey}
            empty="No payments yet"
            columns={[
              { label: 'Month', render: (r) => monthLabel(r.monthKey) },
              { label: 'Paid', render: (r) => inr(r.paid), right: true },
              { label: 'Target', render: (r) => inr(r.target), right: true },
              {
                label: '',
                render: (r) => (r.paid >= r.target ? <Badge tone="green">met</Badge> : <Badge tone="amber">{Math.round((r.paid / r.target) * 100)}%</Badge>),
              },
            ]}
          />
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Installments" icon={ReceiptText} padded={false} actions={<Link className="text-sm text-brand-700" to={`/installments?planId=${plan._id}`}>All →</Link>}>
          <InstallmentTable key={listKey} query={{ planId: plan._id, limit: 10 }} onChanged={reload} hidePlan />
        </Card>
      </div>

      <CollectModal
        open={!!slot}
        plan={plan}
        slot={slot}
        onClose={() => {
          setSlot(null);
          reload();
          setListKey((k) => k + 1);
        }}
      />
      <DownPaymentModal open={dialog === 'down'} onClose={() => setDialog(null)} plan={plan} onDone={reload} />
      <CancelPlanModal open={dialog === 'cancel'} onClose={() => setDialog(null)} plan={plan} onDone={reload} />
      {st && <RefundModal open={dialog === 'refund'} onClose={() => setDialog(null)} plan={plan} onDone={reload} />}
    </>
  );
}

const Line = ({ label, value }) => (
  <div className="flex justify-between gap-3">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-medium">{value}</span>
  </div>
);
