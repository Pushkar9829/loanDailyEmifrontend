import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { post } from '../lib/api';
import { dateTime, inr } from '../lib/format';
import { Badge, Button, ErrorBox, Field, Loading, Modal, Pagination, StatusBadge, Table, Textarea, useToast } from './ui';

// Paged installment list; admin can reverse.
export default function InstallmentTable({ query, onChanged, hidePlan }) {
  const { user } = useAuth();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi('/installments', { ...query, page });
  const [rev, setRev] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [revErr, setRevErr] = useState(null);

  const doReverse = async () => {
    setBusy(true);
    setRevErr(null);
    try {
      await post(`/installments/${rev._id}/reverse`, { reason });
      toast('Installment reversed');
      setRev(null);
      setReason('');
      reload();
      onChanged?.();
    } catch (e) {
      setRevErr(e);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <Loading />;
  const cols = [
    { label: 'Receipt', render: (r) => <a className="font-mono text-xs text-brand-700" href={`/receipts/${r._id}`} target="_blank" rel="noreferrer">{r.receiptNo}</a> },
    { label: 'Date / slot', render: (r) => <span>{r.dateKey}<span className="block text-xs text-slate-500">slot {r.slotNo} · {dateTime(r.createdAt).split(', ')[1]}</span></span> },
    !hidePlan && { label: 'Plan', render: (r) => (r.plan ? <Link className="text-brand-700" to={`/plans/${r.plan._id}`}>{r.plan.planNo}</Link> : '—') },
    user.role !== 'customer' && { label: 'Customer', render: (r) => r.customer?.name },
    ['admin', 'sf'].includes(user.role) && { label: 'Agent', render: (r) => r.agent?.name },
    { label: 'Mode', render: (r) => <span>{r.mode.toUpperCase()}{r.upiRef && <span className="block text-xs text-slate-500">{r.upiRef}</span>}</span> },
    { label: 'Amount', render: (r) => <span className={r.status === 'reversed' ? 'line-through text-slate-400' : 'font-semibold'}>{inr(r.amount)}</span>, right: true },
    user.role !== 'customer' && {
      label: 'Commission',
      right: true,
      render: (r) => (user.role === 'agent' ? inr(r.commission?.agentAmount) : user.role === 'sf' ? inr(r.commission?.sfAmount) : `${inr(r.commission?.sfAmount)} + ${inr(r.commission?.agentAmount)}`),
    },
    {
      label: 'Status',
      render: (r) => (
        <span>
          <StatusBadge status={r.status} />
          {r.couponCode && <span className="ml-1"><Badge tone="amber">🎫 {r.couponCode}</Badge></span>}
          {user.role === 'admin' && r.mode === 'upi' && r.recon?.status && r.recon.status !== 'unreconciled' && (
            <span className="ml-1">
              <Badge tone={r.recon.status === 'matched' ? 'green' : 'red'}>bank: {r.recon.status.replace(/_/g, ' ')}</Badge>
            </span>
          )}
          {r.reverseReason && <span className="block text-xs text-slate-500">{r.reverseReason}</span>}
        </span>
      ),
    },
    user.role === 'admin' && {
      label: '',
      render: (r) =>
        r.status === 'success' ? (
          <Button size="sm" variant="ghost" onClick={() => setRev(r)}>
            Reverse
          </Button>
        ) : null,
    },
  ].filter(Boolean);

  return (
    <>
      <ErrorBox error={error} />
      <Table rows={data?.items} columns={cols} empty="No installments" />
      <div className="pb-3">
        <Pagination page={data?.page} pages={data?.pages} total={data?.total} onPage={setPage} />
      </div>
      <Modal open={!!rev} onClose={() => setRev(null)} title={`Reverse ${rev?.receiptNo}`}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {inr(rev?.amount)} goes back to the agent's balance, the plan total is reduced and the commission is taken back. This cannot be undone.
          </p>
          <Field label="Reason">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. entered on wrong plan" />
          </Field>
          <ErrorBox error={revErr} />
          <Button variant="danger" className="w-full" busy={busy} disabled={reason.trim().length < 3} onClick={doReverse}>
            Reverse installment
          </Button>
        </div>
      </Modal>
    </>
  );
}
