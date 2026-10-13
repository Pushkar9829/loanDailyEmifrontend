import { useEffect, useState } from 'react';
import { useApi } from '../../lib/hooks';
import { dateTime, ROLE_LABEL } from '../../lib/format';
import { Card, ErrorBox, Input, Loading, PageHeader, Pagination, Table } from '../../components/ui';

export default function Audit() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, loading } = useApi('/audit', { action, page, limit: 50 });
  useEffect(() => setPage(1), [action]);
  return (
    <>
      <PageHeader title="Audit log" subtitle="Every change made in the system, who made it and when" />
      <Card padded={false}>
        <div className="p-3">
          <Input className="max-w-xs" placeholder="Exact action e.g. installment.reverse" value={action} onChange={(e) => setAction(e.target.value.trim())} />
        </div>
        {loading && !data ? <Loading /> : <ErrorBox error={error} />}
        {data && (
          <Table
            rows={data.items}
            columns={[
              { label: 'When', render: (a) => dateTime(a.createdAt) },
              { label: 'Who', render: (a) => (a.actor ? `${a.actor.name} (${ROLE_LABEL[a.actor.role]})` : '—') },
              { label: 'Action', render: (a) => <span className="font-mono text-xs">{a.action}</span> },
              { label: 'Details', nowrap: false, render: (a) => <span className="break-all font-mono text-[11px] text-slate-500">{a.meta ? JSON.stringify(a.meta).slice(0, 200) : ''}</span> },
            ]}
          />
        )}
        <div className="pb-3">
          <Pagination page={data?.page} pages={data?.pages} total={data?.total} onPage={setPage} />
        </div>
      </Card>
    </>
  );
}
