import { Link } from 'react-router-dom';
import { useApi } from '../lib/hooks';
import { inr } from '../lib/format';
import { Card, ErrorBox, Loading, Table } from './ui';

// Plans behind their pro-rata monthly EMI target.
export default function Shortfall({ limit }) {
  const { data, error, loading } = useApi('/reports/shortfall');
  const rows = data?.items?.slice(0, limit) || [];
  return (
    <Card title={`Behind this month's target${data ? ` (${data.total})` : ''}`} padded={false}>
      {loading && !data ? <Loading /> : <ErrorBox error={error} />}
      {data && (
        <Table
          rows={rows}
          rowKey={(r) => r.plan._id}
          empty="Everyone is on track 🎉"
          columns={[
            { label: 'Plan', render: (r) => <Link className="font-medium text-brand-700" to={`/plans/${r.plan._id}`}>{r.plan.planNo}</Link> },
            { label: 'Customer', render: (r) => <span>{r.plan.customer?.name}<span className="block text-xs text-slate-500">{r.plan.customer?.phone}</span></span> },
            { label: 'Paid / expected', render: (r) => `${inr(r.month.paid)} / ${inr(r.month.expectedToDate)}`, right: true },
            { label: 'Short', render: (r) => <span className="font-semibold text-rose-600">{inr(r.month.shortfallToDate)}</span>, right: true },
          ]}
        />
      )}
    </Card>
  );
}
