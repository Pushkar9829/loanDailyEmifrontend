import { useParams } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { date, dateTime, inr, PAY_MODES } from '../../lib/format';
import { ErrorBox, Loading } from '../../components/ui';
import PrintShell, { Row } from './PrintShell';

export default function Statement() {
  const { id } = useParams();
  const { data, error, loading } = useApi(`/plans/${id}/statement`);
  const p = data?.plan;
  return (
    <PrintShell title={p ? `Statement ${p.planNo}` : 'Statement'} ready={!!p}>
      {loading && !data ? <Loading /> : <ErrorBox error={error} />}
      {p && (
        <div>
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
            <div>
              <div className="text-2xl font-bold">{data.companyName}</div>
              <div className="text-sm text-slate-500">Plan statement</div>
            </div>
            <div className="text-right text-sm">
              <div className="font-mono text-lg font-semibold">{p.planNo}</div>
              <div className="text-slate-500">Generated {dateTime(data.generatedAt)}</div>
            </div>
          </div>
          <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
            <div>
              <Row label="Customer" value={`${p.customer?.name} (${p.customer?.code})`} />
              <Row label="Asset" value={p.property?.title} />
              <Row label="Agreement" value={p.agreementNo} />
              {p.financeType === 'partner_loan' && <Row label="Lender / loan a/c" value={`${p.lender?.name} · ${p.loanAccountNo}`} />}
              <Row label="Status" value={p.status} />
            </div>
            <div>
              <Row label="Value / down payment" value={`${inr(p.propertyValue)} / ${inr(p.downPayment)}`} />
              <Row label="Monthly target (EMI)" value={inr(p.monthlyTarget)} />
              <Row label="Total payable" value={inr(p.totalPayable)} />
              <Row label="Paid" value={inr(p.totalPaid)} />
              <Row label="Balance" value={inr(Math.max(0, p.totalPayable - p.totalPaid))} />
            </div>
          </div>
          {p.downPaymentStatus === 'received' && (
            <p className="mt-3 text-sm">
              Down payment {inr(p.downPayment)} received {date(p.downPaymentReceipt?.receivedAt)} by {PAY_MODES[p.downPaymentReceipt?.mode]}
              {p.downPaymentReceipt?.reference ? ` (ref ${p.downPaymentReceipt.reference})` : ''}, receipt {p.downPaymentReceipt?.receiptNo}.
            </p>
          )}
          {p.settlement?.status && p.settlement.status !== 'none' && (
            <p className="mt-2 text-sm">
              Cancelled {date(p.cancelledAt)}: refund {inr(p.settlement.refundAmount)} ({p.settlement.status}
              {p.settlement.reference ? `, ref ${p.settlement.reference}` : ''}).
            </p>
          )}
          <table className="mt-5 w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-800">
                <th className="py-1">#</th>
                <th>Receipt</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Mode</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.installments.map((i, n) => (
                <tr key={i._id} className="border-b border-slate-100">
                  <td className="py-1">{n + 1}</td>
                  <td className="font-mono">{i.receiptNo}</td>
                  <td>{i.dateKey}</td>
                  <td>{i.slotNo}</td>
                  <td>{i.mode.toUpperCase()}</td>
                  <td className={`text-right ${i.status === 'reversed' ? 'line-through text-slate-400' : ''}`}>{inr(i.amount)}</td>
                  <td className="text-right">{i.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.installments.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No installments yet</p>}
        </div>
      )}
    </PrintShell>
  );
}
