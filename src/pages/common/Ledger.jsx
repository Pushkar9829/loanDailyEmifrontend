import { useSearchParams } from 'react-router-dom';
import { Card, PageHeader } from '../../components/ui';
import LedgerTable from '../../components/LedgerTable';

// Admin: every wallet movement in the system (or one owner's via ?ownerId=)
export default function Ledger() {
  const [sp] = useSearchParams();
  const ownerId = sp.get('ownerId') || undefined;
  return (
    <>
      <PageHeader title="Ledger" subtitle={ownerId ? 'One user' : 'All wallet movements. Entries are never edited — corrections are reversals.'} />
      <Card padded={false}>
        <LedgerTable ownerId={ownerId} showOwner />
      </Card>
    </>
  );
}
