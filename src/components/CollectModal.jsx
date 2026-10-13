import { useEffect, useState } from 'react';
import { post } from '../lib/api';
import { useAuth } from '../lib/auth';
import { inr } from '../lib/format';
import { useApi } from '../lib/hooks';
import { Banknote, CheckCircle2, MessageCircle, Printer, Smartphone, Ticket } from 'lucide-react';
import { Avatar, Button, ErrorBox, Field, Input, Modal, cx } from './ui';
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
          <div className="mx-auto flex h-16 w-16 animate-pop items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <div className="tabular text-4xl font-extrabold tracking-tight">{inr(receipt.amount)}</div>
          <div className="text-sm text-slate-600">
            Receipt <b>{receipt.receiptNo}</b>
            <br />
            {plan.customer?.name} · {plan.planNo} · {receipt.mode.toUpperCase()}
          </div>
          {receipt.couponCode && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 p-2.5 text-sm text-amber-800">
              <Ticket className="h-4 w-4" /> Lucky draw coupon <b className="font-mono">{receipt.couponCode}</b>
            </div>
          )}
          <p className="text-xs text-slate-500">The customer has been sent this receipt in their app (and by SMS if enabled).</p>
          <div className="grid grid-cols-2 gap-2">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold ring-1 ring-inset bg-[#25D366]/10 text-[#128C7E] ring-[#25D366]/30 hover:bg-[#25D366]/20"
              href={`https://wa.me/91${plan.customer?.phone}?text=${encodeURIComponent(
                `${settings.data?.settings.companyName || 'KistiPay'} receipt ${receipt.receiptNo}: ${inr(receipt.amount)} received for plan ${plan.planNo} (${receipt.mode.toUpperCase()}).`
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <a className="inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold ring-1 ring-inset text-slate-700 ring-slate-300 hover:bg-slate-50" href={`/receipts/${receipt._id}`} target="_blank" rel="noreferrer">
              <Printer className="h-4 w-4" /> Print
            </a>
          </div>
          <Button className="w-full" size="lg" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <Avatar name={plan.customer?.name || '?'} />
            <div className="min-w-0 text-sm">
              <div className="truncate font-semibold text-slate-900">{plan.customer?.name}</div>
              <div className="tabular truncate text-slate-500">
                {plan.planNo} · {inr(remaining)} left
              </div>
            </div>
          </div>
          <div>
            <div className="mb-2 text-[13px] font-medium text-slate-700">Amount</div>
            <div className="grid grid-cols-3 gap-2">
              {options.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className={cx(
                    'tabular h-14 cursor-pointer rounded-2xl text-[15px] font-bold transition active:scale-95',
                    amount === v ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20 ring-2 ring-brand-600 ring-offset-2' : 'bg-white text-slate-800 ring-1 ring-slate-300 hover:ring-brand-500'
                  )}
                >
                  {inr(v)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[13px] font-medium text-slate-700">Paid by</div>
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'upi'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cx(
                    'flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
                    mode === m ? 'bg-brand-50 text-brand-800 ring-2 ring-brand-600' : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:ring-slate-400'
                  )}
                >
                  {m === 'cash' ? <Banknote className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
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
