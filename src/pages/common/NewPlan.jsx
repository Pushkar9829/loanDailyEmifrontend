import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { post } from '../../lib/api';
import { useApi } from '../../lib/hooks';
import { inr, PAY_MODES, PROPERTY_TYPES } from '../../lib/format';
import { Alert, Button, Card, ErrorBox, Field, Input, PageHeader, Select, StatusBadge, Toggle, useToast } from '../../components/ui';

export default function NewPlan() {
  const nav = useNavigate();
  const toast = useToast();
  const [sp] = useSearchParams();
  const [f, setF] = useState({ customerId: sp.get('customerId') || '', propertyId: '', downPayment: '0', tenureMonths: '12', interestRate: '0', agreementNo: '', financeType: 'self', lenderId: '', loanAccountNo: '', processingFee: '0', dpNow: false, dpMode: 'upi', dpRef: '' });
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const customers = useApi('/users', { role: 'customer', status: 'active', limit: 200 });
  const properties = useApi('/config/properties', { status: 'available', limit: 200 });
  const settings = useApi('/config/settings');
  const lenders = useApi('/finance/lenders');
  const lender = lenders.data?.items.find((l) => l._id === f.lenderId);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const customer = customers.data?.items.find((c) => c._id === f.customerId);
  const property = properties.data?.items.find((p) => p._id === f.propertyId);
  const needKyc = settings.data?.settings.requireKycForPlan && customer && customer.kyc?.status !== 'verified';

  const quoteInput = useMemo(
    () =>
      property && Number(f.tenureMonths) > 0
        ? { value: property.value, downPayment: Number(f.downPayment) || 0, tenureMonths: Number(f.tenureMonths), interestRate: Number(f.interestRate) || 0 }
        : null,
    [property, f.downPayment, f.tenureMonths, f.interestRate]
  );

  useEffect(() => {
    if (!quoteInput) return setQuote(null);
    const t = setTimeout(() => {
      post('/config/quote', quoteInput)
        .then(setQuote)
        .catch((e) => setQuote({ error: e.message }));
    }, 250);
    return () => clearTimeout(t);
  }, [quoteInput]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const d = await post('/plans', {
        customerId: f.customerId,
        propertyId: f.propertyId,
        downPayment: Number(f.downPayment) || 0,
        tenureMonths: Number(f.tenureMonths),
        interestRate: Number(f.interestRate) || 0,
        agreementNo: f.agreementNo,
        ...(Number(f.downPayment) > 0 && f.dpNow ? { downPaymentReceived: { mode: f.dpMode, reference: f.dpRef.trim() || undefined } } : {}),
        ...(f.financeType === 'partner_loan'
          ? { financeType: 'partner_loan', lenderId: f.lenderId, loanAccountNo: f.loanAccountNo.trim(), processingFee: Number(f.processingFee) || 0 }
          : {}),
      });
      toast(`Plan ${d.plan.planNo} opened`);
      nav(`/plans/${d.plan._id}`, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const perDay = quote && !quote.error ? Math.ceil(quote.monthlyTarget / 30) : 0;

  return (
    <>
      <PageHeader title="Open a new plan" subtitle="Tie the customer to one specific property with a written agreement" />
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <Card title="Details" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer" className="sm:col-span-2">
              <Select
                required
                value={f.customerId}
                onChange={set('customerId')}
                placeholder={customers.loading ? 'Loading…' : 'Select customer'}
                options={(customers.data?.items || []).map((c) => ({ value: c._id, label: `${c.name} · ${c.phone} (${c.code})` }))}
              />
            </Field>
            {customer && (
              <div className="sm:col-span-2 -mt-1 text-sm">
                KYC: <StatusBadge status={customer.kyc?.status || 'pending'} />
              </div>
            )}
            {needKyc && (
              <div className="sm:col-span-2">
                <Alert>Customer KYC must be verified by the Super Franchisee or Admin before a plan can be opened.</Alert>
              </div>
            )}
            <Field label="Property" className="sm:col-span-2">
              <Select
                required
                value={f.propertyId}
                onChange={set('propertyId')}
                placeholder={properties.loading ? 'Loading…' : 'Select available property'}
                options={(properties.data?.items || []).map((p) => ({ value: p._id, label: `${p.title} · ${PROPERTY_TYPES[p.type]} · ${inr(p.value)}` }))}
              />
            </Field>
            <Field label="Down payment (₹)" hint="Paid separately, outside the daily plan">
              <Input type="number" min="0" value={f.downPayment} onChange={set('downPayment')} />
            </Field>
            <Field label="Tenure (months)">
              <Input type="number" min="1" max="360" value={f.tenureMonths} onChange={set('tenureMonths')} required />
            </Field>
            <Field label="Interest rate (% per year)" hint="0 if the seller sells at fixed price">
              <Input type="number" min="0" max="36" step="0.1" value={f.interestRate} onChange={set('interestRate')} />
            </Field>
            <Field label="Agreement number">
              <Input value={f.agreementNo} onChange={set('agreementNo')} required />
            </Field>

            {Number(f.downPayment) > 0 && (
              <div className="sm:col-span-2 space-y-2 rounded-xl border border-slate-200 p-3">
                <Toggle checked={f.dpNow} onChange={(v) => setF({ ...f, dpNow: v })} label="Down payment received now" hint="Otherwise record it later from the plan page. Daily collections start after it is received." />
                {f.dpNow && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Received by">
                      <Select value={f.dpMode} onChange={set('dpMode')} options={Object.entries(PAY_MODES).map(([value, label]) => ({ value, label }))} />
                    </Field>
                    {f.dpMode !== 'cash' && (
                      <Field label={f.dpMode === 'cheque' ? 'Cheque number' : 'UTR / reference'}>
                        <Input value={f.dpRef} onChange={set('dpRef')} required />
                      </Field>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="sm:col-span-2 space-y-2 rounded-xl border border-slate-200 p-3">
              <div className="text-sm font-medium text-slate-700">Who finances this plan?</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['self', 'Seller / company (instalment purchase)'],
                  ['partner_loan', 'Lending partner loan (NBFC / bank)'],
                ].map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setF({ ...f, financeType: v })}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-left text-sm ${f.financeType === v ? 'border-brand-700 bg-brand-50 text-brand-800' : 'border-slate-300'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {f.financeType === 'partner_loan' && (
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field label="Lender">
                    <Select
                      required
                      value={f.lenderId}
                      onChange={(e) => {
                        const l = lenders.data?.items.find((x) => x._id === e.target.value);
                        const fee = l && quote && !quote.error ? Math.round((quote.financedAmount * l.defaultProcessingFeePercent) / 100) : 0;
                        setF({ ...f, lenderId: e.target.value, processingFee: String(fee) });
                      }}
                      placeholder="Select lender"
                      options={(lenders.data?.items || []).filter((l) => l.active).map((l) => ({ value: l._id, label: l.name }))}
                    />
                  </Field>
                  <Field label="Loan account no.">
                    <Input value={f.loanAccountNo} onChange={set('loanAccountNo')} required />
                  </Field>
                  <Field label="Processing fee (₹)">
                    <Input type="number" min="0" value={f.processingFee} onChange={set('processingFee')} />
                  </Field>
                  {lender && (
                    <div className="sm:col-span-3 text-xs text-slate-500">
                      {lender.name} · RBI reg. {lender.rbiRegNo} · max interest {lender.maxInterestRate}% · collections are remitted to the lender
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
        <Card title="Plan preview">
          {!quote ? (
            <p className="text-sm text-slate-500">Select a property to see the EMI.</p>
          ) : quote.error ? (
            <ErrorBox error={quote.error} />
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Monthly target (EMI)</div>
                <div className="text-3xl font-bold text-brand-700 tabular-nums">{inr(quote.monthlyTarget)}</div>
                <div className="text-xs text-slate-500">≈ {inr(perDay)} per day · split across up to 5 slots</div>
              </div>
              <Row label="Financed amount" value={inr(quote.financedAmount)} />
              <Row label="Total payable" value={inr(quote.totalPayable)} />
              <div>
                <div className="mb-1 text-xs text-slate-500">Allowed installment amounts (tier {inr(quote.tierValue)})</div>
                <div className="flex flex-wrap gap-1">
                  {quote.denominations.map((d) => (
                    <span key={d} className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium">
                      {inr(d)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 space-y-2">
            <ErrorBox error={error} />
            <Button type="submit" className="w-full" busy={busy} disabled={needKyc}>
              Open plan
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-slate-500">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);
