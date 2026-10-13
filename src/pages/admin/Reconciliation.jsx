import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { upload } from '../../lib/api';
import { dateTime, inr } from '../../lib/format';
import { Button, Card, ErrorBox, Loading, PageHeader, Pagination, Stat, Table, Tabs, useToast } from '../../components/ui';

const ISSUE_TABS = [
  { value: 'not_in_bank', label: 'Not in bank' },
  { value: 'amount_mismatch', label: 'Amount mismatch' },
  { value: 'unreconciled', label: 'Not checked yet' },
];

export default function Reconciliation() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [last, setLast] = useState(null);
  const [tab, setTab] = useState('not_in_bank');
  const [page, setPage] = useState(1);
  const batches = useApi('/finance/recon', { limit: 10 });
  const issues = useApi('/finance/recon/issues', { status: tab, page });

  const send = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return setErr(new Error('Choose the bank statement CSV'));
    const form = new FormData();
    form.append('file', file);
    setBusy(true);
    setErr(null);
    try {
      const r = await upload('/finance/recon', form);
      setLast(r.batch);
      toast(`Statement checked: ${r.batch.summary.matched} matched`);
      fileRef.current.value = '';
      batches.reload();
      issues.reload();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  const s = last?.summary;
  return (
    <>
      <PageHeader title="Bank reconciliation" subtitle="Check every UPI payment agents recorded against the company bank statement (by UTR and amount)." />
      <Card title="Upload bank statement">
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="text-sm" aria-label="Bank statement CSV" />
          <Button busy={busy} onClick={send}>
            Check statement
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          CSV export from net banking. Needs a credit / amount column and a UTR / reference or narration column (the 12-digit UPI UTR is read from the narration if needed). Debits are ignored.
        </p>
        <ErrorBox error={err} />
      </Card>

      {s && (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Bank credits" value={s.bankLines} />
          <Stat label="Matched" value={s.matched} tone="brand" />
          <Stat label="Amount mismatch" value={s.amountMismatch} tone={s.amountMismatch ? 'bad' : 'default'} />
          <Stat label="Recorded, not in bank" value={s.notInBank} tone={s.notInBank ? 'bad' : 'default'} />
          <Stat label="In bank, not recorded" value={s.bankOnly} tone={s.bankOnly ? 'warn' : 'default'} />
        </div>
      )}
      {last?.bankOnly?.length > 0 && (
        <Card title="Bank credits with no matching payment" className="mt-4" padded={false}>
          <Table
            rows={last.bankOnly}
            rowKey={(r) => `${r.utr}-${r.amount}-${r.date}`}
            columns={[
              { label: 'Date', key: 'date' },
              { label: 'UTR', render: (r) => <span className="font-mono">{r.utr || '—'}</span> },
              { label: 'Narration', key: 'narration', nowrap: false },
              { label: 'Amount', render: (r) => inr(r.amount), right: true },
            ]}
          />
        </Card>
      )}

      <Card title="Payments needing attention" className="mt-4" padded={false}>
        <div className="px-3 pt-3">
          <Tabs
            tabs={ISSUE_TABS}
            value={tab}
            onChange={(v) => {
              setTab(v);
              setPage(1);
            }}
          />
        </div>
        {issues.loading && !issues.data ? <Loading /> : <ErrorBox error={issues.error} />}
        {issues.data && (
          <Table
            rows={issues.data.items}
            empty="Nothing here"
            columns={[
              { label: 'Receipt', render: (i) => <Link className="font-mono text-xs text-brand-700" to={`/receipts/${i._id}`}>{i.receiptNo}</Link> },
              { label: 'Date', key: 'dateKey' },
              { label: 'Plan', render: (i) => i.plan?.planNo },
              { label: 'Customer', render: (i) => i.customer?.name },
              { label: 'Agent', render: (i) => `${i.agent?.name} (${i.agent?.code})` },
              { label: 'UTR', render: (i) => <span className="font-mono">{i.upiRef}</span> },
              { label: 'Recorded', render: (i) => inr(i.amount), right: true },
              { label: 'In bank', render: (i) => (i.recon?.bankAmount !== undefined ? inr(i.recon.bankAmount) : '—'), right: true },
            ]}
          />
        )}
        <div className="pb-3">
          <Pagination page={issues.data?.page} pages={issues.data?.pages} total={issues.data?.total} onPage={setPage} />
        </div>
      </Card>

      <Card title="Past statements" className="mt-4" padded={false}>
        <Table
          rows={batches.data?.items}
          empty="No statements uploaded yet"
          columns={[
            { label: 'Batch', key: 'batchNo' },
            { label: 'File', key: 'fileName' },
            { label: 'Period', render: (b) => `${b.fromDate} → ${b.toDate}` },
            { label: 'Matched / lines', render: (b) => `${b.summary?.matched} / ${b.summary?.bankLines}`, right: true },
            { label: 'Issues', render: (b) => (b.summary?.amountMismatch || 0) + (b.summary?.notInBank || 0) + (b.summary?.bankOnly || 0), right: true },
            { label: 'Uploaded', render: (b) => `${dateTime(b.createdAt)} · ${b.createdBy?.name || ''}` },
          ]}
        />
      </Card>
    </>
  );
}
