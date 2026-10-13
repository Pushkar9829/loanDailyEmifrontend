import { useEffect, useState } from 'react';
import { useApi } from '../../lib/hooks';
import { put } from '../../lib/api';
import { inr, KYC_DOCS, NOTIFY_TYPES } from '../../lib/format';
import { Alert, Button, Card, ErrorBox, Field, Input, Loading, PageHeader, Toggle, useToast } from '../../components/ui';

const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const fromHHMM = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
const label12 = (m) => {
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  return `${((h + 11) % 12) + 1}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
};

export default function Settings() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi('/config/settings');
  const [s, setS] = useState(null);
  const [milestonesText, setMilestonesText] = useState(''); // raw text; parsed on save so commas can be typed
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (data) {
      setS(structuredClone(data.settings));
      setMilestonesText(data.settings.milestones.join(', '));
    }
  }, [data]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!s) return null;

  const upd = (path, value) => {
    const next = structuredClone(s);
    const keys = path.split('.');
    let o = next;
    keys.slice(0, -1).forEach((k) => (o = o[k]));
    o[keys.at(-1)] = value;
    setS(next);
  };

  const save = async () => {
    const ms = milestonesText.split(/[,\s]+/).filter(Boolean).map(Number);
    if (ms.some((n) => !Number.isFinite(n) || n < 1 || n > 100)) {
      setErr(new Error('Milestones must be numbers from 1 to 100, separated by commas'));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await put('/config/settings', {
        commission: { sfPercent: Number(s.commission.sfPercent), agentPercent: Number(s.commission.agentPercent) },
        slots: s.slots.map((x, i) => ({ no: i + 1, label: label12(x.startMinutes), startMinutes: x.startMinutes })),
        slotWindowMinutes: Number(s.slotWindowMinutes),
        strictSlots: s.strictSlots,
        requireKycForPlan: s.requireKycForPlan,
        compliance: {
          immovableCashCapPerPlan: Number(s.compliance.immovableCashCapPerPlan),
          dailyCashCapPerCustomer: Number(s.compliance.dailyCashCapPerCustomer),
        },
        reversalSameDayOnly: s.reversalSameDayOnly,
        luckyDraw: { enabled: s.luckyDraw.enabled, acknowledgedLegalRisk: s.luckyDraw.acknowledgedLegalRisk },
        milestones: [...new Set(ms)].sort((a, b) => a - b),
        companyUpiId: (s.companyUpiId || '').trim(),
        companyName: s.companyName,
        messaging: { smsTypes: s.messaging.smsTypes, whatsappTypes: s.messaging.whatsappTypes },
        reminders: {
          enabled: s.reminders.enabled,
          timeMinutes: Number(s.reminders.timeMinutes),
          customers: s.reminders.customers,
          agentSummary: s.reminders.agentSummary,
        },
        downPayment: { requireBeforeCollection: s.downPayment.requireBeforeCollection },
        cancellation: { chargePercent: Number(s.cancellation.chargePercent), clawBackCommission: s.cancellation.clawBackCommission },
        kyc: { requireDocsToVerify: s.kyc.requireDocsToVerify, requiredDocs: s.kyc.requiredDocs },
      });
      toast('Settings saved');
      reload();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  const total = Number(s.commission.sfPercent) + Number(s.commission.agentPercent);

  return (
    <>
      <PageHeader title="Settings" actions={<Button busy={busy} onClick={save}>Save settings</Button>} />
      <ErrorBox error={err} />
      <div className="mt-2 grid gap-4 lg:grid-cols-2">
        <Card title="Company">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company / brand name" hint="Shown on receipts, SMS and the KFS">
              <Input value={s.companyName || ''} onChange={(e) => upd('companyName', e.target.value)} />
            </Field>
            <Field label="Company UPI ID" hint="Customers pay this ID by UPI QR (zero MDR)">
              <Input value={s.companyUpiId || ''} onChange={(e) => upd('companyUpiId', e.target.value)} placeholder="company@bank" />
            </Field>
          </div>
        </Card>

        <Card title="SMS / WhatsApp messages">
          <p className="mb-2 text-xs text-slate-500">In-app notifications are always sent. Tick what should also go by SMS / WhatsApp (provider set on the server).</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500">
                  <th className="py-1">Message</th>
                  <th className="text-center">SMS</th>
                  <th className="text-center">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(NOTIFY_TYPES).map(([type, label]) => (
                  <tr key={type} className="border-t border-slate-100">
                    <td className="py-1.5">{label}</td>
                    {['smsTypes', 'whatsappTypes'].map((k) => (
                      <td key={k} className="text-center">
                        <input
                          type="checkbox"
                          aria-label={`${label} ${k === 'smsTypes' ? 'SMS' : 'WhatsApp'}`}
                          checked={s.messaging[k].includes(type)}
                          onChange={(e) => upd(`messaging.${k}`, e.target.checked ? [...s.messaging[k], type] : s.messaging[k].filter((t) => t !== type))}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Daily reminders">
          <div className="space-y-3">
            <Toggle checked={s.reminders.enabled} onChange={(v) => upd('reminders.enabled', v)} label="Send a reminder every evening" hint="Once a day, after the time below (IST)" />
            <Field label="Reminder time">
              <Input
                type="time"
                className="max-w-[160px]"
                value={toHHMM(s.reminders.timeMinutes)}
                onChange={(e) => upd('reminders.timeMinutes', fromHHMM(e.target.value || '20:00'))}
              />
            </Field>
            <Toggle checked={s.reminders.customers} onChange={(v) => upd('reminders.customers', v)} label="Remind customers who are behind this month's target" />
            <Toggle checked={s.reminders.agentSummary} onChange={(v) => upd('reminders.agentSummary', v)} label="Send each agent a summary of customers behind" />
          </div>
        </Card>

        <Card title="Down payment, cancellation & KYC">
          <div className="space-y-3">
            <Toggle
              checked={s.downPayment.requireBeforeCollection}
              onChange={(v) => upd('downPayment.requireBeforeCollection', v)}
              label="Collect daily installments only after the down payment is received"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Default cancellation charge (%)">
                <Input type="number" min="0" max="50" step="0.5" value={s.cancellation.chargePercent} onChange={(e) => upd('cancellation.chargePercent', e.target.value)} />
              </Field>
            </div>
            <Toggle
              checked={s.cancellation.clawBackCommission}
              onChange={(v) => upd('cancellation.clawBackCommission', v)}
              label="On cancellation, take back commission by default"
            />
            <Toggle checked={s.kyc.requireDocsToVerify} onChange={(v) => upd('kyc.requireDocsToVerify', v)} label="KYC can be verified only when these documents are uploaded" />
            <div className="flex flex-wrap gap-3 text-sm">
              {Object.entries(KYC_DOCS).map(([t, label]) => (
                <label key={t} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={s.kyc.requiredDocs.includes(t)}
                    onChange={(e) => upd('kyc.requiredDocs', e.target.checked ? [...s.kyc.requiredDocs, t] : s.kyc.requiredDocs.filter((x) => x !== t))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Commission (notional, on every collection)">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Super Franchisee %">
              <Input type="number" min="0" max="50" step="0.5" value={s.commission.sfPercent} onChange={(e) => upd('commission.sfPercent', e.target.value)} />
            </Field>
            <Field label="Agent %">
              <Input type="number" min="0" max="50" step="0.5" value={s.commission.agentPercent} onChange={(e) => upd('commission.agentPercent', e.target.value)} />
            </Field>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Total {total}% · on a {inr(1000)} installment: SF {inr((1000 * s.commission.sfPercent) / 100)}, Agent {inr((1000 * s.commission.agentPercent) / 100)}. The customer is always credited the full
            amount; commission is paid from the company's margin.
          </p>
        </Card>

        <Card title="Daily payment slots (IST)">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {s.slots.map((slot, i) => (
              <Field key={i} label={`Slot ${i + 1}`}>
                <div className="flex gap-1">
                  <Input
                    type="time"
                    value={toHHMM(slot.startMinutes)}
                    onChange={(e) => {
                      const next = [...s.slots];
                      next[i] = { ...slot, startMinutes: fromHHMM(e.target.value || '00:00') };
                      upd('slots', next);
                    }}
                  />
                  {s.slots.length > 1 && (
                    <button className="cursor-pointer px-1 text-slate-400 hover:text-rose-600" onClick={() => upd('slots', s.slots.filter((_, j) => j !== i))} aria-label="Remove slot">
                      ✕
                    </button>
                  )}
                </div>
              </Field>
            ))}
          </div>
          {s.slots.length < 10 && (
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => upd('slots', [...s.slots, { startMinutes: 1320 }])}>
              + Add slot
            </Button>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Each slot stays open (minutes)">
              <Input type="number" min="15" max="720" value={s.slotWindowMinutes} onChange={(e) => upd('slotWindowMinutes', e.target.value)} />
            </Field>
          </div>
          <div className="mt-3">
            <Toggle
              checked={s.strictSlots}
              onChange={(v) => upd('strictSlots', v)}
              label="Strict slots"
              hint="On: agents can record a slot only while it is open. Off: a slot that already passed today can still be entered late."
            />
          </div>
        </Card>

        <Card title="Compliance guards (India)">
          <div className="space-y-3">
            <Field label="Max cash per property plan (₹)" hint="Income Tax Act s.269SS – no cash advance ≥ ₹20,000 for land / flats. Above this only UPI is accepted.">
              <Input type="number" min="0" value={s.compliance.immovableCashCapPerPlan} onChange={(e) => upd('compliance.immovableCashCapPerPlan', e.target.value)} />
            </Field>
            <Field label="Max cash per customer per day (₹)" hint="Income Tax Act s.269ST – no cash receipt ≥ ₹2 lakh from one person in a day.">
              <Input type="number" min="0" value={s.compliance.dailyCashCapPerCustomer} onChange={(e) => upd('compliance.dailyCashCapPerCustomer', e.target.value)} />
            </Field>
            <Toggle checked={s.requireKycForPlan} onChange={(v) => upd('requireKycForPlan', v)} label="Require verified KYC before opening a plan" />
            <Toggle checked={s.reversalSameDayOnly} onChange={(v) => upd('reversalSameDayOnly', v)} label="Allow reversals only on the same day" />
          </div>
        </Card>

        <Card title="Rewards">
          <Field label="Milestones (% of plan paid)" hint="Comma separated numbers from 1 to 100, e.g. 25, 50, 75, 100">
            <Input value={milestonesText} onChange={(e) => setMilestonesText(e.target.value)} />
          </Field>
          <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
            <Alert>
              A lucky draw tied to payments can be treated as a prize chit under the <b>Prize Chits and Money Circulation Schemes (Banning) Act, 1978</b> and state lottery laws. Turn this on only after
              written legal advice.
            </Alert>
            <Toggle
              checked={s.luckyDraw.acknowledgedLegalRisk}
              onChange={(v) => upd('luckyDraw.acknowledgedLegalRisk', v)}
              label="We have legal sign-off for the lucky draw"
            />
            <Toggle checked={s.luckyDraw.enabled} onChange={(v) => upd('luckyDraw.enabled', v)} label="Give a lucky draw coupon on every installment" />
          </div>
        </Card>
      </div>
    </>
  );
}
