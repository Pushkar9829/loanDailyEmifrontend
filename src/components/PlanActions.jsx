import { useEffect, useState } from 'react';
import { post } from '../lib/api';
import { useApi } from '../lib/hooks';
import { inr, PAY_MODES } from '../lib/format';
import { Alert, Button, ErrorBox, Field, Input, Modal, Select, Textarea, Toggle, useToast } from './ui';
import UpiQr from './UpiQr';

function useSubmit(onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onDone();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}

export function DownPaymentModal({ open, onClose, plan, onDone }) {
  const toast = useToast();
  const settings = useApi('/config/settings', undefined, { skip: !open });
  const [mode, setMode] = useState('upi');
  const [reference, setReference] = useState('');
  const s = useSubmit(() => {
    toast('Down payment recorded');
    onDone();
    onClose();
  });
  useEffect(() => {
    if (open) {
      setMode('upi');
      setReference('');
      s.setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const cap = settings.data?.settings.compliance.immovableCashCapPerPlan;
  return (
    <Modal open={open} onClose={onClose} title={`Down payment ${inr(plan.downPayment)}`}>
      <div className="space-y-3">
        <Field label="Received by">
          <Select value={mode} onChange={(e) => setMode(e.target.value)} options={Object.entries(PAY_MODES).map(([value, label]) => ({ value, label }))} />
        </Field>
        {mode === 'cash' && plan.immovable && cap !== undefined && plan.downPayment + plan.cashPaid > cap && (
          <Alert tone="red">Cash above {inr(cap)} is not allowed for land / flats (IT Act s.269SS). Use UPI, bank transfer or cheque.</Alert>
        )}
        {mode === 'upi' && <UpiQr upiId={settings.data?.settings.companyUpiId} name={settings.data?.settings.companyName} amount={plan.downPayment} note={`${plan.planNo} down payment`} />}
        {mode !== 'cash' && (
          <Field label={mode === 'cheque' ? 'Cheque number' : 'UTR / transaction reference'}>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
        )}
        <ErrorBox error={s.error} />
        <Button
          className="w-full"
          busy={s.busy}
          disabled={mode !== 'cash' && reference.trim().length < 3}
          onClick={() => s.run(() => post(`/plans/${plan._id}/down-payment`, { mode, reference: reference.trim() || undefined }))}
        >
          Record down payment
        </Button>
      </div>
    </Modal>
  );
}

export function CancelPlanModal({ open, onClose, plan, onDone }) {
  const toast = useToast();
  const settings = useApi('/config/settings', undefined, { skip: !open });
  const [reason, setReason] = useState('');
  const [pct, setPct] = useState('');
  const [claw, setClaw] = useState(false);
  const s = useSubmit(() => {
    toast('Plan cancelled');
    onDone();
    onClose();
  });
  useEffect(() => {
    if (open && settings.data) {
      setPct(String(settings.data.settings.cancellation.chargePercent));
      setClaw(settings.data.settings.cancellation.clawBackCommission);
    }
  }, [open, settings.data]);
  const dp = plan.downPaymentStatus === 'received' ? plan.downPayment : 0;
  const base = plan.totalPaid + dp;
  const charge = Math.round(((base * (Number(pct) || 0)) / 100) * 100) / 100;
  return (
    <Modal open={open} onClose={onClose} title={`Cancel ${plan.planNo}`}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">The property goes back to "available". The customer is owed a refund of what they paid, less the cancellation charge.</p>
        <Field label="Reason">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-16" />
        </Field>
        <Field label="Cancellation charge (%)">
          <Input type="number" min="0" max="50" step="0.5" value={pct} onChange={(e) => setPct(e.target.value)} />
        </Field>
        <Toggle checked={claw} onChange={setClaw} label="Take back the commission paid on this plan" hint="Debits SF and agent commission wallets (may go negative = to recover)" />
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between">
            <span>Installments + down payment</span>
            <span>{inr(base)}</span>
          </div>
          <div className="flex justify-between">
            <span>Charge</span>
            <span>− {inr(charge)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-semibold">
            <span>Refund due</span>
            <span>{inr(base - charge)}</span>
          </div>
        </div>
        <ErrorBox error={s.error} />
        <Button
          variant="danger"
          className="w-full"
          busy={s.busy}
          disabled={reason.trim().length < 3}
          onClick={() => s.run(() => post(`/plans/${plan._id}/cancel`, { reason, chargePercent: Number(pct) || 0, clawBackCommission: claw }))}
        >
          Cancel plan
        </Button>
      </div>
    </Modal>
  );
}

export function RefundModal({ open, onClose, plan, onDone }) {
  const toast = useToast();
  const [mode, setMode] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const s = useSubmit(() => {
    toast('Refund recorded');
    onDone();
    onClose();
  });
  return (
    <Modal open={open} onClose={onClose} title={`Pay refund ${inr(plan.settlement?.refundAmount)}`}>
      <div className="space-y-3">
        <Field label="Paid by">
          <Select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            options={[
              { value: 'bank_transfer', label: PAY_MODES.bank_transfer },
              { value: 'upi', label: 'UPI' },
              { value: 'cheque', label: 'Cheque' },
            ]}
          />
        </Field>
        <Field label="Reference (UTR / cheque no.)">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
        <ErrorBox error={s.error} />
        <Button className="w-full" busy={s.busy} disabled={reference.trim().length < 3} onClick={() => s.run(() => post(`/plans/${plan._id}/refund`, { mode, reference: reference.trim() }))}>
          Mark refund paid
        </Button>
      </div>
    </Modal>
  );
}
