import { useState } from 'react';
import { useApi } from '../../lib/hooks';
import { useAuth } from '../../lib/auth';
import { post } from '../../lib/api';
import { dateTime, ROLE_LABEL } from '../../lib/format';
import { Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader, Pagination, Select, StatusBadge, Textarea, Toggle, useToast } from '../../components/ui';

export default function Complaints() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [status, setStatus] = useState(isAdmin ? 'open' : '');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(null);
  const { data, error, loading, reload } = useApi('/complaints', { status, page });

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Complaints' : 'Help & complaints'}
        subtitle={isAdmin ? 'Raised directly by customers, agents and franchisees' : 'Goes straight to the company Admin — not through your agent'}
        actions={!isAdmin && <Button onClick={() => setCreating(true)}>+ New complaint</Button>}
      />
      <Card padded={false}>
        <div className="p-3">
          <Select
            className="max-w-[180px]"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="All"
            options={[
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In progress' },
              { value: 'resolved', label: 'Resolved' },
            ]}
          />
        </div>
        {loading && !data ? <Loading /> : <ErrorBox error={error} />}
        {data?.items.length === 0 && <Empty>No complaints</Empty>}
        <ul className="divide-y divide-slate-100">
          {data?.items.map((c) => (
            <li key={c._id}>
              <button className="flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50" onClick={() => setOpen(c)}>
                <div className="min-w-0">
                  <div className="font-medium">
                    {c.ticketNo} · {c.subject}
                  </div>
                  <div className="truncate text-sm text-slate-500">{c.message}</div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {isAdmin && `${c.raisedBy?.name} (${ROLE_LABEL[c.raisedBy?.role]}) · `}
                    {dateTime(c.createdAt)}
                    {c.against && ` · about agent ${c.against.name}`}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </button>
            </li>
          ))}
        </ul>
        <div className="pb-3">
          <Pagination page={data?.page} pages={data?.pages} total={data?.total} onPage={setPage} />
        </div>
      </Card>
      <NewComplaint open={creating} onClose={() => setCreating(false)} onDone={reload} />
      {open && (
        <Thread
          complaint={open}
          onClose={() => setOpen(null)}
          onUpdated={(c) => {
            setOpen(c);
            reload();
          }}
        />
      )}
    </>
  );
}

function NewComplaint({ open, onClose, onDone }) {
  const { user } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ subject: '', message: '', againstAgent: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await post('/complaints', f);
      toast('Complaint sent to Admin');
      setF({ subject: '', message: '', againstAgent: false });
      onDone();
      onClose();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="New complaint">
      <div className="space-y-3">
        <Field label="Subject">
          <Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
        </Field>
        <Field label="What happened?">
          <Textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
        </Field>
        {user.role === 'customer' && <Toggle checked={f.againstAgent} onChange={(v) => setF({ ...f, againstAgent: v })} label="This is about my agent" hint="Admin will review your agent's entries" />}
        <ErrorBox error={error} />
        <Button className="w-full" busy={busy} disabled={f.subject.trim().length < 3 || f.message.trim().length < 5} onClick={submit}>
          Send
        </Button>
      </div>
    </Modal>
  );
}

function Thread({ complaint: c, onClose, onUpdated }) {
  const { user } = useAuth();
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const d = await post(`/complaints/${c._id}/reply`, { message: msg, status: status || undefined });
      setMsg('');
      onUpdated({ ...c, ...d.complaint });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={`${c.ticketNo} · ${c.subject}`} wide>
      <div className="space-y-3">
        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <div className="mb-1 text-xs text-slate-500">
            {c.raisedBy?.name} · {dateTime(c.createdAt)}
          </div>
          {c.message}
        </div>
        {c.replies?.map((r) => (
          <div key={r._id} className={`rounded-xl p-3 text-sm ${r.by?.role === 'admin' ? 'ml-6 bg-brand-50' : 'mr-6 bg-slate-50'}`}>
            <div className="mb-1 text-xs text-slate-500">
              {r.by?.role === 'admin' ? 'Admin' : r.by?.name} · {dateTime(r.at)}
            </div>
            {r.message}
          </div>
        ))}
        <div className="flex items-center gap-2 text-sm">
          Status: <StatusBadge status={c.status} />
        </div>
        <Field label="Reply">
          <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} />
        </Field>
        {user.role === 'admin' && (
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="Keep status"
            options={[
              { value: 'in_progress', label: 'Mark in progress' },
              { value: 'resolved', label: 'Mark resolved' },
              { value: 'open', label: 'Re-open' },
            ]}
          />
        )}
        <ErrorBox error={error} />
        <Button busy={busy} disabled={!msg.trim()} onClick={send}>
          Send reply
        </Button>
      </div>
    </Modal>
  );
}
