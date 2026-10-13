import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { post } from '../../lib/api';
import { dateTime, istToday } from '../../lib/format';
import { Alert, Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader, StatusBadge, useToast } from '../../components/ui';

export default function Draws() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi('/rewards/draws');
  const [creating, setCreating] = useState(false);
  const [running, setRunning] = useState(null);
  const [runErr, setRunErr] = useState(null);

  const run = async (d) => {
    setRunning(d._id);
    setRunErr(null);
    try {
      await post(`/rewards/draws/${d._id}/run`);
      toast('Draw completed');
      reload();
    } catch (e) {
      setRunErr(e);
    } finally {
      setRunning(null);
    }
  };

  if (loading && !data) return <Loading />;
  return (
    <>
      <PageHeader
        title="Rewards & draws"
        subtitle="Milestone rewards are always on. The lucky draw is switched on in Settings."
        actions={data?.enabled && <Button onClick={() => setCreating(true)}>+ New draw</Button>}
      />
      <ErrorBox error={error || runErr} />
      {!data?.enabled && (
        <Alert>
          Lucky draw is <b>off</b>. Customers still get milestone rewards at 25 / 50 / 75 / 100% paid. To enable coupons, get legal sign-off and switch it on in{' '}
          <Link className="font-semibold underline" to="/settings">
            Settings
          </Link>
          .
        </Alert>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {data?.items.length === 0 && (
          <Card>
            <Empty>No draws yet</Empty>
          </Card>
        )}
        {data?.items.map((d) => (
          <Card key={d._id} title={d.title} actions={<StatusBadge status={d.status} />}>
            <div className="space-y-1 text-sm">
              <div>
                Prize: <b>{d.prize}</b> · {d.winnersCount} winner(s)
              </div>
              <div className="text-slate-500">
                Coupons from {d.fromDate} to {d.toDate}
              </div>
              {d.status === 'completed' ? (
                <div className="mt-2 rounded-lg bg-emerald-50 p-2">
                  <div className="text-xs text-slate-500">
                    {dateTime(d.runAt)} · {d.eligibleCount} eligible coupons
                  </div>
                  {d.winners.map((w) => (
                    <div key={w.code} className={w.voided ? 'text-slate-400' : ''}>
                      {w.voided ? '✕' : '🏆'} <span className={w.voided ? 'line-through' : ''}>{w.customer?.name} ({w.customer?.code}) – <span className="font-mono">{w.code}</span></span>
                      {w.voided && <span className="block text-xs text-rose-600">Prize cancelled: {w.voidReason}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                data.enabled && (
                  <Button className="mt-2" busy={running === d._id} onClick={() => run(d)}>
                    Run draw now
                  </Button>
                )
              )}
            </div>
          </Card>
        ))}
      </div>
      <NewDraw open={creating} onClose={() => setCreating(false)} onDone={reload} />
    </>
  );
}

function NewDraw({ open, onClose, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ title: '', prize: '', winnersCount: 1, fromDate: istToday().slice(0, 8) + '01', toDate: istToday() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await post('/rewards/draws', { ...f, winnersCount: Number(f.winnersCount) });
      toast('Draw created');
      onDone();
      onClose();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="New lucky draw">
      <div className="space-y-3">
        <Field label="Title">
          <Input value={f.title} onChange={set('title')} placeholder="Diwali draw" />
        </Field>
        <Field label="Prize">
          <Input value={f.prize} onChange={set('prize')} placeholder="Silver coin 10g" />
        </Field>
        <Field label="Number of winners">
          <Input type="number" min="1" max="100" value={f.winnersCount} onChange={set('winnersCount')} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Coupons from">
            <Input type="date" value={f.fromDate} onChange={set('fromDate')} />
          </Field>
          <Field label="to">
            <Input type="date" value={f.toDate} onChange={set('toDate')} />
          </Field>
        </div>
        <ErrorBox error={error} />
        <Button className="w-full" busy={busy} onClick={submit}>
          Create draw
        </Button>
      </div>
    </Modal>
  );
}
