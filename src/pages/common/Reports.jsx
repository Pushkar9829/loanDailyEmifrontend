import { useState } from 'react';
import { useApi } from '../../lib/hooks';
import { useAuth } from '../../lib/auth';
import { inr, istToday } from '../../lib/format';
import { Card, ErrorBox, Field, Input, Loading, PageHeader, Select, Stat, Table } from '../../components/ui';
import Shortfall from '../../components/Shortfall';

export default function Reports() {
  const { user } = useAuth();
  const [from, setFrom] = useState(istToday().slice(0, 8) + '01');
  const [to, setTo] = useState(istToday());
  const groups = [
    { value: 'day', label: 'By day' },
    user.role !== 'agent' && { value: 'agent', label: 'By agent' },
    user.role === 'admin' && { value: 'sf', label: 'By Super Franchisee' },
    { value: 'mode', label: 'By payment mode' },
  ].filter(Boolean);
  const [groupBy, setGroupBy] = useState('day');
  const { data, error, loading } = useApi('/reports/collections', { from, to, groupBy }, { skip: !from || !to });

  const label = (r) => (groupBy === 'agent' || groupBy === 'sf' ? `${r.name || '—'} (${r.code || ''})` : groupBy === 'mode' ? String(r._id).toUpperCase() : r._id);

  return (
    <>
      <PageHeader title="Reports" subtitle="Collections and commission for any period" />
      <Card>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="Group">
            <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} options={groups} />
          </Field>
        </div>
      </Card>
      {loading && !data ? <Loading /> : <ErrorBox error={error} />}
      {data && !error && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Collected" value={inr(data.totals.amount)} tone="brand" />
            <Stat label="Payments" value={data.totals.count} />
            {user.role !== 'agent' && <Stat label="SF commission" value={inr(data.totals.sfCommission)} />}
            {user.role !== 'sf' && <Stat label="Agent commission" value={inr(data.totals.agentCommission)} />}
          </div>
          <Card className="mt-4" padded={false}>
            <Table
              rows={data.rows}
              rowKey={(r) => String(r._id)}
              empty="No collections in this period"
              columns={[
                { label: groups.find((g) => g.value === groupBy)?.label.replace('By ', ''), render: label },
                { label: 'Payments', key: 'count', right: true },
                { label: 'Collected', render: (r) => inr(r.amount), right: true },
                user.role !== 'agent' && { label: 'SF commission', render: (r) => inr(r.sfCommission), right: true },
                user.role !== 'sf' && { label: 'Agent commission', render: (r) => inr(r.agentCommission), right: true },
              ].filter(Boolean)}
            />
          </Card>
        </>
      )}
      <div className="mt-4">
        <Shortfall />
      </div>
    </>
  );
}
