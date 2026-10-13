import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { inr, upiLink } from '../lib/format';

// QR + deep link for paying the company's UPI ID directly (no gateway, zero MDR for UPI P2M).
export default function UpiQr({ upiId, name, amount, note, size = 180 }) {
  const [src, setSrc] = useState('');
  const link = upiId ? upiLink({ pa: upiId, pn: name || 'KistiPay', am: amount, tn: note }) : '';

  useEffect(() => {
    let alive = true;
    if (!link) return undefined;
    QRCode.toDataURL(link, { width: size, margin: 1, errorCorrectionLevel: 'M' })
      .then((d) => alive && setSrc(d))
      .catch(() => alive && setSrc(''));
    return () => {
      alive = false;
    };
  }, [link, size]);

  if (!upiId) {
    return <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Admin has not set the company UPI ID yet (Settings → Compliance).</div>;
  }
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-center">
      {src ? <img src={src} width={size} height={size} alt={`UPI QR to pay ${upiId}`} /> : <div style={{ width: size, height: size }} className="animate-pulse rounded bg-slate-100" />}
      <div className="text-sm">
        Pay <b>{amount ? inr(amount) : 'any amount'}</b> to <span className="font-mono">{upiId}</span>
      </div>
      <a href={link} className="rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-medium text-white sm:hidden">
        Open UPI app
      </a>
      <div className="text-[11px] text-slate-500">Scan with any UPI app (PhonePe, GPay, Paytm, BHIM). Then enter the 12-digit UTR from the customer's app.</div>
    </div>
  );
}
