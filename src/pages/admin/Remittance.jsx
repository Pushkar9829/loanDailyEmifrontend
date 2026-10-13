import { useState } from 'react';
import { useApi } from '../../lib/hooks';
import { post } from '../../lib/api';
import { dateTime, inr, istToday } from '../../lib/format';
import { Button, Card, ErrorBox, Field, Input, PageHeader, Select, Stat, Table, useToast } from '../../components/ui';

export default function Remittance() {
  const toast = useToast();
  const lenders = useApi('/finance/lenders');
  const [lenderId, setLenderId] = useState('');
  const [from, setFrom] = useState(istToday().slice(0, 8) + '01');
  const [to, setTo] = useState(istToday());
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const pending = useApi('/finance/remittance/pending', { lenderId, from, to }, { skip: !lenderId || !from || !to });
  const batches = useApi('/finance/remittance', { lenderId: lenderId || undefined, limit: 20 });
  const lender = lenders.data?.items.find((l) => l._id === lenderId);

  const remit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await post('/finance/remittance', { lenderId, from, to, reference: reference.trim() });
      toast(`Batch ${r.batch.batchNo}: ${inr(r.batch.amount)} marked remitted`);
      setReference('');
      pending.reload();
      batches.reload();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Remittance to lenders" subtitle="Installments collected on partner-loan plans belong to the lender. Transfer them and record the batch here." />
      <Card>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Field label="Lender">
            <Select value={lenderId} onChange={(e) => setLenderId(e.target.value)} placeholder="Select lender" options={(lenders.data?.items || []).map((l) => ({ value: l._id, label: l.name }))} />
          </Field>
          <Field label="Collections from">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="to">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        {lenderId && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Stat label="Not yet remitted" value={inr(pending.data?.amount)} sub={`${pending.data?.count ?? 0} installments`} tone="brand" />
            <div className="md:col-span-2 space-y-2">
              <div className="text-sm text-slate-600">
                Transfer to: <b>{lender?.remittanceAccount || 'remittance account not set on the lender'}</b>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input className="max-w-xs" placeholder="UTR of your transfer to the lender" value={reference} onChange={(e) => setReference(e.target.value)} />
                <Button busy={busy} disabled={!pending.data?.count || reference.trim().length < 3} onClick={remit}>
                  Mark as remitted
                </Button>
              </div>
              <ErrorBox error={err || pending.error} />
            </div>
          </div>
        )}
      </Card>
      <Card title="Remittance batches" className="mt-4" padded={false}>
        <Table
          rows={batches.data?.items}
          empty="No remittances yet"
          columns={[
            { label: 'Batch', key: 'batchNo' },
            { label: 'Lender', render: (b) => b.lender?.name },
            { label: 'Period', render: (b) => `${b.fromDate} → ${b.toDate}` },
            { label: 'Installments', key: 'count', right: true },
            { label: 'Amount', render: (b) => inr(b.amount), right: true },
            { label: 'UTR', render: (b) => <span className="font-mono">{b.reference}</span> },
            { label: 'Recorded', render: (b) => dateTime(b.createdAt) },
          ]}
        />
      </Card>
    </>
  );
}
