import { useState } from 'react';
import { useApi } from '../../lib/hooks';
import { post } from '../../lib/api';
import { dateTime } from '../../lib/format';
import { Button, Card, Empty, ErrorBox, Loading, PageHeader, Pagination } from '../../components/ui';

export default function Notifications() {
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi('/notifications', { page });
  const readAll = async () => {
    await post('/notifications/read-all');
    window.dispatchEvent(new Event('kp:notifications-read')); // clears the bell count in the header
    reload();
  };
  return (
    <>
      <PageHeader title="Notifications" actions={data?.unread > 0 && <Button variant="secondary" onClick={readAll}>Mark all read</Button>} />
      <Card padded={false}>
        {loading && !data ? <Loading /> : <ErrorBox error={error} />}
        {data?.items.length === 0 && <Empty>No notifications</Empty>}
        <ul className="divide-y divide-slate-100">
          {data?.items.map((n) => (
            <li key={n._id} className={`px-4 py-3 ${n.read ? '' : 'bg-brand-50/50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{n.title}</div>
                  {n.body && <div className="text-sm text-slate-600">{n.body}</div>}
                </div>
                <div className="whitespace-nowrap text-xs text-slate-400">{dateTime(n.createdAt)}</div>
              </div>
            </li>
          ))}
        </ul>
        <div className="pb-3">
          <Pagination page={data?.page} pages={data?.pages} total={data?.total} onPage={setPage} />
        </div>
      </Card>
    </>
  );
}
