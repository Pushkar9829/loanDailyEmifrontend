import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { istToday } from '../../lib/format';
import { download } from '../../lib/api';
import { Button, Card, ErrorBox, Field, Input, PageHeader, Select } from '../../components/ui';
import InstallmentTable from '../../components/InstallmentTable';

export default function Installments() {
  const { user } = useAuth();
  const [sp] = useSearchParams();
  const [f, setF] = useState({ from: user.role === 'customer' ? '' : istToday(-30), to: '', status: '', mode: '', q: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const [exp, setExp] = useState({ busy: false, error: null });
  const exportCsv = async () => {
    const from = f.from || istToday(-30);
    const to = f.to || istToday();
    setExp({ busy: true, error: null });
    try {
      await download('/finance/export/installments.csv', { from, to, status: f.status }, `installments_${from}_${to}.csv`);
      setExp({ busy: false, error: null });
    } catch (e) {
      setExp({ busy: false, error: e });
    }
  };
  const title = { admin: 'Installments', sf: 'Network collections', agent: 'My collections', customer: 'My payments' }[user.role];

  return (
    <>
      <PageHeader
        title={title}
        subtitle="Every payment has a receipt number. Reversals are shown struck through."
        actions={
          user.role !== 'customer' && (
            <Button variant="secondary" busy={exp.busy} onClick={exportCsv}>
              Export CSV
            </Button>
          )
        }
      />
      <ErrorBox error={exp.error} />
      <Card padded={false}>
        <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-5">
          <Field label="From">
            <Input type="date" value={f.from} onChange={set('from')} />
          </Field>
          <Field label="To">
            <Input type="date" value={f.to} onChange={set('to')} />
          </Field>
          <Field label="Status">
            <Select value={f.status} onChange={set('status')} placeholder="All" options={[{ value: 'success', label: 'Success' }, { value: 'reversed', label: 'Reversed' }]} />
          </Field>
          <Field label="Mode">
            <Select value={f.mode} onChange={set('mode')} placeholder="All" options={[{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }]} />
          </Field>
          <Field label="Receipt / UTR">
            <Input value={f.q} onChange={set('q')} />
          </Field>
        </div>
        <InstallmentTable query={{ ...f, planId: sp.get('planId') || undefined }} />
      </Card>
    </>
  );
}
