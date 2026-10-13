import { useEffect, useState } from 'react';
import { useApi } from '../lib/hooks';
import { dateTime, inr, LEDGER_LABEL } from '../lib/format';
import { ErrorBox, Loading, Pagination, Select, Table } from './ui';

export default function LedgerTable({ ownerId, showOwner, reloadKey }) {
  const [kind, setKind] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi('/wallets/ledger', { ownerId, kind, type, page });
  useEffect(() => setPage(1), [kind, type, ownerId]);
  useEffect(() => {
    if (reloadKey) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  return (
    <>
      <div className="flex flex-wrap gap-2 p-3">
        <Select className="max-w-[180px]" value={kind} onChange={(e) => setKind(e.target.value)} placeholder="Both wallets" options={[{ value: 'balance', label: 'Balance' }, { value: 'commission', label: 'Commission' }]} />
        <Select className="max-w-[220px]" value={type} onChange={(e) => setType(e.target.value)} placeholder="All types" options={Object.entries(LEDGER_LABEL).map(([value, label]) => ({ value, label }))} />
      </div>
      {loading && !data ? <Loading /> : <ErrorBox error={error} />}
      {data && (
        <Table
          rows={data.items}
          empty="No entries"
          columns={[
            { label: 'When', render: (e) => dateTime(e.createdAt) },
            showOwner && { label: 'Owner', render: (e) => `${e.owner?.name} (${e.owner?.code})` },
            { label: 'Wallet', render: (e) => <span className="capitalize">{e.kind}</span> },
            { label: 'Type', render: (e) => LEDGER_LABEL[e.type] },
            { label: 'Details', nowrap: false, render: (e) => <span className="text-xs text-slate-600">{[e.counterparty && `${e.counterparty.name} (${e.counterparty.code || e.counterparty.role})`, e.reference && `Ref ${e.reference}`, e.note].filter(Boolean).join(' · ')}</span> },
            { label: 'Amount', right: true, render: (e) => <span className={e.direction === 'credit' ? 'text-emerald-700' : 'text-rose-600'}>{e.direction === 'credit' ? '+' : '−'}{inr(e.amount)}</span> },
            { label: 'Balance after', right: true, render: (e) => inr(e.balanceAfter) },
          ].filter(Boolean)}
        />
      )}
      <div className="pb-3">
        <Pagination page={data?.page} pages={data?.pages} total={data?.total} onPage={setPage} />
      </div>
    </>
  );
}
