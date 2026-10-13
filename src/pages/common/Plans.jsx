import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { useAuth } from '../../lib/auth';
import { inr } from '../../lib/format';
import { Badge, Button, Card, ErrorBox, Input, Loading, PageHeader, Pagination, Progress, Select, StatusBadge, Table } from '../../components/ui';

export default function Plans() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const customerId = sp.get('customerId') || undefined;
  const [status, setStatus] = useState('active');
  const [q, setQ] = useState('');
  const [extra, setExtra] = useState('');
  const extraQuery = { dp: { downPayment: 'pending' }, refund: { refund: 'pending' }, loan: { financeType: 'partner_loan' } }[extra] || {};
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApi('/plans', { status, q, page, customerId, ...extraQuery });
  useEffect(() => setPage(1), [status, q, extra]);

  return (
    <>
      <PageHeader title="Plans" subtitle={customerId ? 'Filtered to one customer' : undefined} actions={<Button onClick={() => nav('/plans/new')}>+ New plan</Button>} />
      <Card padded={false}>
        <div className="flex flex-wrap gap-2 p-3">
          <Input className="max-w-xs" placeholder="Plan no / agreement no" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select
            className="max-w-[160px]"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="All statuses"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <Select
            className="max-w-[220px]"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="All plans"
            options={[
              { value: 'dp', label: 'Down payment pending' },
              { value: 'refund', label: 'Refund pending' },
              { value: 'loan', label: 'Partner loans' },
            ]}
          />
        </div>
        {loading && !data ? <Loading /> : <ErrorBox error={error} />}
        {data && (
          <Table
            rows={data.items}
            onRowClick={(p) => nav(`/plans/${p._id}`)}
            empty="No plans"
            columns={[
              { label: 'Plan', render: (p) => <span className="font-medium text-brand-700">{p.planNo}</span> },
              { label: 'Customer', render: (p) => <span>{p.customer?.name}<span className="block text-xs text-slate-500">{p.customer?.phone}</span></span> },
              { label: 'Property', render: (p) => p.property?.title, nowrap: false },
              user.role !== 'agent' && { label: 'Agent', render: (p) => p.agent?.name },
              { label: 'EMI', render: (p) => inr(p.monthlyTarget), right: true },
              { label: 'This month', render: (p) => <span className={p.month.shortfallToDate ? 'text-rose-600' : 'text-emerald-700'}>{inr(p.month.paid)}</span>, right: true },
              {
                label: 'Progress',
                render: (p) => (
                  <div className="w-28">
                    <Progress value={p.progressPercent} />
                    <div className="mt-0.5 text-xs text-slate-500">{p.progressPercent}% of {inr(p.totalPayable)}</div>
                  </div>
                ),
              },
              {
                label: 'Status',
                render: (p) => (
                  <span className="flex flex-wrap gap-1">
                    <StatusBadge status={p.status} />
                    {p.downPaymentStatus === 'pending' && <Badge tone="amber">DP pending</Badge>}
                    {p.settlement?.status === 'pending' && <Badge tone="red">refund due</Badge>}
                    {p.financeType === 'partner_loan' && <Badge tone="blue">{p.lender?.name?.split(' ')[0]} loan</Badge>}
                  </span>
                ),
              },
            ].filter(Boolean)}
          />
        )}
        <div className="pb-3">
          <Pagination page={data?.page} pages={data?.pages} total={data?.total} onPage={setPage} />
        </div>
      </Card>
    </>
  );
}
