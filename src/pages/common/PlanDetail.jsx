import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { useAuth } from '../../lib/auth';
import { date, inr, monthLabel, PAY_MODES, PROPERTY_TYPES } from '../../lib/format';
import { Alert, Badge, Button, Card, ErrorBox, Loading, PageHeader, Progress, Stat, StatusBadge, Table } from '../../components/ui';
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

  if (loading && !d) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const { plan, month, slots, monthly } = d;
  const isAgent = user.role === 'agent';

  const staff = user.role !== 'customer';
  const st = plan.settlement;

  return (
    <>
      <PageHeader
        title={plan.property?.title}
        subtitle={
          <>
            {plan.planNo} · {PROPERTY_TYPES[plan.property?.type]} · Agreement {plan.agreementNo} · <StatusBadge status={plan.status} />
          </>
        }
        actions={
          <>
            <a className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" href={`/plans/${plan._id}/statement`} target="_blank" rel="noreferrer">
              Statement
            </a>
            <a className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" href={`/plans/${plan._id}/kfs`} target="_blank" rel="noreferrer">
              Key Fact Statement
            </a>
            {user.role === 'admin' && plan.status === 'active' && (
              <Button variant="danger" onClick={() => setDialog('cancel')}>
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Monthly target (EMI)" value={inr(plan.monthlyTarget)} sub={`${plan.tenureMonths} months${plan.interestRate ? ` @ ${plan.interestRate}%` : ', no interest'}`} />
        <Stat label="Paid" value={inr(plan.totalPaid)} sub={`${plan.installmentsCount} installment${plan.installmentsCount === 1 ? "" : "s"}`} tone="brand" />
        <Stat label="Remaining" value={inr(d.remaining)} sub={`of ${inr(plan.totalPayable)}`} />
        <Stat label="Progress" value={`${plan.progressPercent}%`} sub={plan.milestonesReached.length ? `Milestones: ${plan.milestonesReached.join('%, ')}%` : 'No milestones yet'} />
      </div>
      <Progress className="mt-3 h-3" value={plan.progressPercent} />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title={`Today's slots (${d.today})`} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {slots.map((s) => {
              const tone = s.paid ? 'border-emerald-300 bg-emerald-50' : s.state === 'open' ? 'border-brand-500 bg-brand-50' : s.state === 'closed' ? 'border-slate-200 bg-slate-50' : 'border-dashed border-slate-300';
              return (
                <div key={s.no} className={`rounded-xl border p-3 ${tone}`}>
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="mt-1 text-xs">
                    {s.paid ? (
                      <span className="text-emerald-700">
                        Paid {inr(s.paid.amount)}
                        <br />
                        <span className="text-slate-500">{s.paid.receiptNo}</span>
                      </span>
                    ) : s.state === 'open' ? (
                      <Badge tone="brand">open now</Badge>
                    ) : s.state === 'before_plan' ? (
                      <span className="text-slate-400">before plan start</span>
                    ) : s.state === 'closed' ? (
                      <span className="text-slate-500">missed</span>
                    ) : (
                      <span className="text-slate-400">upcoming</span>
                    )}
                  </div>
                  {isAgent && s.canCollect && (
                    <Button size="sm" className="mt-2 w-full" onClick={() => setSlot(s)}>
                      Collect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-slate-500">Allowed amounts: {plan.denominations.map(inr).join(' · ')}</div>
        </Card>

        <Card title={`${monthLabel(month.monthKey)} status`}>
          <div className="space-y-2 text-sm">
            <Line label="Paid this month" value={inr(month.paid)} />
            <Line label="EMI target" value={inr(month.target)} />
            <Line label="Expected by today" value={inr(month.expectedToDate)} />
            <Line label="Behind by" value={<span className={month.shortfallToDate ? 'text-rose-600' : 'text-emerald-600'}>{inr(month.shortfallToDate)}</span>} />
          </div>
          <Progress className="mt-3" value={month.percentOfTarget} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Plan details">
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
        <Card title="Month by month" padded={false} className="lg:col-span-2">
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
        <Card title="Installments" padded={false} actions={<Link className="text-sm text-brand-700" to={`/installments?planId=${plan._id}`}>All →</Link>}>
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
