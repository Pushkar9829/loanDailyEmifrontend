import { useEffect, useState } from 'react';
import { useApi } from '../../lib/hooks';
import { post } from '../../lib/api';
import { dateTime, ROLE_LABEL } from '../../lib/format';
import { Alert, Badge, Button, Card, ErrorBox, Loading, PageHeader, Pagination, Select, StatusBadge, Table, useToast } from '../../components/ui';

const TONE = { sent: 'green', pending: 'amber', failed: 'red', skipped: 'gray' };

export default function Messages() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [channel, setChannel] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi('/admin/messages', { status, channel, page });
  const jobs = useApi('/admin/jobs');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState(null);
  useEffect(() => setPage(1), [status, channel]);

  const act = async (key, fn, msg) => {
    setBusy(key);
    setErr(null);
    try {
      const r = await fn();
      toast(typeof msg === 'function' ? msg(r) : msg);
      reload();
      jobs.reload();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy('');
    }
  };

  const providers = data?.providers;
  return (
    <>
      <PageHeader
        title="Messages & jobs"
        subtitle="SMS / WhatsApp copies of notifications, with delivery status. In-app notifications are always delivered."
        actions={
          <>
            <Button variant="secondary" busy={busy === 'tick'} onClick={() => act('tick', () => post('/admin/jobs/tick'), (r) => `Sent ${r.outbox.sent}, retrying ${r.outbox.retried}, failed ${r.outbox.failed}`)}>
              Send queued now
            </Button>
            <Button busy={busy === 'rem'} onClick={() => act('rem', () => post('/admin/jobs/reminders'), (r) => `Reminders: ${r.result.customers} customers, ${r.result.agents} agents`)}>
              Send reminders now
            </Button>
          </>
        }
      />
      {providers && (providers.sms === 'log' || providers.whatsapp === 'log') && (
        <div className="mb-4">
          <Alert tone="blue">
            SMS provider: <b>{providers.sms}</b> · WhatsApp provider: <b>{providers.whatsapp}</b>. "log" means messages are only written to the server log. Set <code>SMS_PROVIDER</code> /{' '}
            <code>WHATSAPP_PROVIDER</code> (twilio or msg91) and their keys on Render to send real messages. Indian SMS needs DLT-registered templates.
          </Alert>
        </div>
      )}
      <ErrorBox error={err} />
      <Card padded={false}>
        <div className="flex flex-wrap gap-2 p-3">
          <Select className="w-40" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="All statuses" options={['pending', 'sent', 'failed', 'skipped'].map((v) => ({ value: v, label: v }))} />
          <Select className="w-40" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="All channels" options={[{ value: 'sms', label: 'SMS' }, { value: 'whatsapp', label: 'WhatsApp' }]} />
        </div>
        {loading && !data ? <Loading /> : <ErrorBox error={error} />}
        {data && (
          <Table
            rows={data.items}
            empty="No outgoing messages"
            columns={[
              { label: 'When', render: (n) => dateTime(n.createdAt) },
              { label: 'To', render: (n) => <span>{n.user?.name}<span className="block text-xs text-slate-500">{n.user?.phone} · {ROLE_LABEL[n.user?.role]}</span></span> },
              { label: 'Message', nowrap: false, render: (n) => <span className="text-xs"><b>{n.title}</b>{n.body ? ` – ${n.body}` : ''}</span> },
              {
                label: 'Delivery',
                render: (n) => (
                  <div className="space-y-1">
                    {n.deliveries.map((d) => (
                      <div key={d.channel} className="text-xs">
                        <span className="uppercase">{d.channel}</span> <Badge tone={TONE[d.status]}>{d.status}</Badge>
                        {d.attempts > 0 && <span className="text-slate-400"> · {d.attempts} try</span>}
                        {d.error && <span className="block max-w-[220px] truncate text-rose-600" title={d.error}>{d.error}</span>}
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                label: '',
                render: (n) =>
                  n.deliveries.some((d) => d.status === 'failed' || d.status === 'skipped') ? (
                    <Button size="sm" variant="ghost" busy={busy === n._id} onClick={() => act(n._id, () => post(`/admin/messages/${n._id}/retry`), 'Retried')}>
                      Retry
                    </Button>
                  ) : null,
              },
            ]}
          />
        )}
        <div className="pb-3">
          <Pagination page={data?.page} pages={data?.pages} total={data?.total} onPage={setPage} />
        </div>
      </Card>
      <Card title="Scheduled job runs" className="mt-4" padded={false}>
        <Table
          rows={jobs.data?.items}
          empty="No jobs have run yet. Daily reminders run once after the reminder time set in Settings."
          columns={[
            { label: 'Job', render: (j) => <span className="font-mono text-xs">{j.key}</span> },
            { label: 'Status', render: (j) => <StatusBadge status={j.status === 'done' ? 'success' : j.status === 'failed' ? 'rejected' : 'pending'} /> },
            { label: 'Result', render: (j) => <span className="text-xs">{j.error || (j.result ? JSON.stringify(j.result) : '')}</span> },
            { label: 'Finished', render: (j) => dateTime(j.finishedAt) },
          ]}
        />
      </Card>
    </>
  );
}
