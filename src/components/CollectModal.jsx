import { useEffect, useState } from 'react';
import { post } from '../lib/api';
import { useAuth } from '../lib/auth';
import { inr } from '../lib/format';
import { useApi } from '../lib/hooks';
import { Button, ErrorBox, Field, Input, Modal } from './ui';
import UpiQr from './UpiQr';

// Agent records one installment for a plan in a slot.
export default function CollectModal({ open, onClose, plan, slot, onDone }) {
  const { wallets, refresh } = useAuth();
  const settings = useApi('/config/settings', undefined, { skip: !open });
  const [amount, setAmount] = useState(null);
  const [mode, setMode] = useState('cash');
  const [upiRef, setUpiRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (open) {
      setAmount(null);
      setMode('cash');
      setUpiRef('');
      setError(null);
      setReceipt(null);
    }
  }, [open, plan?._id, slot?.no]);

  if (!plan || !slot) return null;
  const remaining = Math.max(0, (plan.totalPayable || 0) - (plan.totalPaid || 0));
  const options = [...plan.denominations.filter((d) => d <= remaining)];
  if (remaining > 0 && !options.includes(remaining) && remaining < Math.max(...plan.denominations)) options.push(remaining);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const d = await post('/installments', {
        planId: plan._id,
        amount,
        slotNo: slot.no,
        mode,
        upiRef: mode === 'upi' ? upiRef.trim() : undefined,
      });
      setReceipt(d.installment);
      refresh();
      onDone?.(d);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={receipt ? 'Payment recorded' : `Collect · ${slot.label} slot`}>
      {receipt ? (
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</div>
          <div className="text-3xl font-bold tabular-nums">{inr(receipt.amount)}</div>
          <div className="text-sm text-slate-600">
            Receipt <b>{receipt.receiptNo}</b>
            <br />
            {plan.customer?.name} · {plan.planNo} · {receipt.mode.toUpperCase()}
          </div>
          {receipt.couponCode && <div className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">Lucky draw coupon: <b>{receipt.couponCode}</b></div>}
          <p className="text-xs text-slate-500">The customer has been sent this receipt in their app (and by SMS if enabled).</p>
          <div className="grid grid-cols-2 gap-2">
            <a
              className="rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              href={`https://wa.me/91${plan.customer?.phone}?text=${encodeURIComponent(
                `${settings.data?.settings.companyName || 'KistiPay'} receipt ${receipt.receiptNo}: ${inr(receipt.amount)} received for plan ${plan.planNo} (${receipt.mode.toUpperCase()}).`
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              Share on WhatsApp
            </a>
            <a className="rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" href={`/receipts/${receipt._id}`} target="_blank" rel="noreferrer">
              Print receipt
            </a>
          </div>
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="font-medium">{plan.customer?.name}</div>
            <div className="text-slate-500">
              {plan.planNo} · remaining {inr(remaining)}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-sm font-medium text-slate-700">Amount</div>
            <div className="grid grid-cols-3 gap-2">
              {options.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className={`cursor-pointer rounded-lg border px-2 py-3 text-sm font-semibold tabular-nums ${
                    amount === v ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 bg-white hover:border-brand-600'
                  }`}
                >
                  {inr(v)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-sm font-medium text-slate-700">Paid by</div>
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'upi'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`cursor-pointer rounded-lg border py-2 text-sm font-medium ${mode === m ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-slate-300'}`}
                >
                  {m === 'cash' ? 'Cash to me' : 'UPI to company'}
                </button>
              ))}
            </div>
          </div>
          {mode === 'upi' && (
            <UpiQr upiId={settings.data?.settings.companyUpiId} name={settings.data?.settings.companyName} amount={amount} note={`${plan.planNo} slot ${slot.no}`} size={160} />
          )}
          {mode === 'upi' && (
            <Field label="UPI reference / UTR" hint="12-digit UTR from the customer's UPI app">
              <Input value={upiRef} onChange={(e) => setUpiRef(e.target.value)} placeholder="e.g. 428712345678" />
            </Field>
          )}
          <div className="text-xs text-slate-500">Your balance: {inr(wallets.balance)} (this amount will be deducted)</div>
          <ErrorBox error={error} />
          <Button className="w-full" size="lg" busy={busy} disabled={!amount || (mode === 'upi' && upiRef.trim().length < 6)} onClick={submit}>
            Confirm {amount ? inr(amount) : ''}
          </Button>
        </div>
      )}
    </Modal>
  );
}
