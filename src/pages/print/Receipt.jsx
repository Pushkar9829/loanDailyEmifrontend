import { useParams } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { dateTime, inr } from '../../lib/format';
import { ErrorBox, Loading } from '../../components/ui';
import PrintShell, { Row } from './PrintShell';

export default function Receipt() {
  const { id } = useParams();
  const { data, error, loading } = useApi(`/installments/${id}`);
  const settings = useApi('/config/settings');
  const i = data?.installment;
  const company = settings.data?.settings.companyName || 'KistiPay';
  return (
    <PrintShell title={i ? `Receipt ${i.receiptNo}` : 'Receipt'} ready={!!i}>
      {loading && !data ? <Loading /> : <ErrorBox error={error} />}
      {i && (
        <div>
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
            <div>
              <div className="text-2xl font-bold">{company}</div>
              <div className="text-sm text-slate-500">Installment receipt</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-semibold">{i.receiptNo}</div>
              <div className="text-sm text-slate-500">{dateTime(i.createdAt)}</div>
            </div>
          </div>
          {i.status === 'reversed' && (
            <div className="my-3 rounded border-2 border-rose-600 p-2 text-center font-bold text-rose-700">REVERSED – {i.reverseReason}</div>
          )}
          <div className="my-6 text-center">
            <div className="text-sm text-slate-500">Amount received</div>
            <div className="text-4xl font-bold">{inr(i.amount)}</div>
          </div>
          <Row label="Customer" value={`${i.customer?.name} (${i.customer?.code})`} />
          <Row label="Plan" value={i.plan?.planNo} />
          <Row label="Property / asset" value={i.plan?.property?.title} />
          <Row label="Slot" value={`${i.dateKey}, slot ${i.slotNo}`} />
          <Row label="Paid by" value={i.mode === 'upi' ? `UPI · UTR ${i.upiRef}` : 'Cash to agent'} />
          <Row label="Collected by" value={`${i.agent?.name} (${i.agent?.code})`} />
          <Row label="Total paid on plan" value={`${inr(i.plan?.totalPaid)} of ${inr(i.plan?.totalPayable)}`} />
          {i.couponCode && <Row label="Lucky draw coupon" value={i.couponCode} />}
          <p className="mt-8 text-xs text-slate-500">
            This is a computer-generated receipt. Check every payment in the {company} app under "Payments". If any payment is missing, raise a complaint in the app — it goes directly to the
            company.
          </p>
        </div>
      )}
    </PrintShell>
  );
}
