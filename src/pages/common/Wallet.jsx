import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useApi } from '../../lib/hooks';
import { post } from '../../lib/api';
import { inr } from '../../lib/format';
import { Button, Card, ErrorBox, Field, Input, PageHeader, Select, Stat, useToast } from '../../components/ui';
import LedgerTable from '../../components/LedgerTable';

export default function Wallet() {
  const { user, wallets, refresh } = useAuth();
  const toast = useToast();
  const [sp] = useSearchParams();
  const ownerId = sp.get('ownerId') || undefined; // SF viewing an agent's ledger
  const [reloadKey, setReloadKey] = useState(0);
  const settings = useApi('/config/settings');
  const pct = user.role === 'sf' ? settings.data?.settings.commission.sfPercent : settings.data?.settings.commission.agentPercent;

  const done = (msg) => {
    toast(msg);
    refresh();
    setReloadKey((k) => k + 1);
  };

  return (
    <>
      <PageHeader title={ownerId ? 'Agent ledger' : 'Wallet & commission'} />
      {!ownerId && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Balance" value={inr(wallets.balance)} tone="brand" sub={user.role === 'agent' ? 'Used to credit customer installments' : 'Transfer to your agents'} />
            <Stat
              label="Commission"
              value={inr(wallets.commission)}
              tone={wallets.commission < 0 ? 'bad' : 'default'}
              sub={
                wallets.commission < 0
                  ? 'To recover: a reversed payment\'s commission was already used. It is adjusted from your next commission.'
                  : pct !== undefined
                    ? `You earn ${pct}% of every collection`
                    : ''
              }
            />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {user.role === 'sf' && <TransferCard onDone={done} />}
            <ConvertCard onDone={done} max={wallets.commission} />
          </div>
        </>
      )}
      <Card title="Ledger" padded={false} className="mt-4">
        <LedgerTable ownerId={ownerId} reloadKey={reloadKey} />
      </Card>
    </>
  );
}

function TransferCard({ onDone }) {
  const agents = useApi('/users', { role: 'agent', status: 'active', limit: 200 });
  const [agentId, setAgentId] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await post('/wallets/transfer', { agentId, amount: Number(amount) });
      setAmount('');
      agents.reload();
      onDone('Balance transferred');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Transfer balance to agent">
      <div className="space-y-3">
        <Field label="Agent">
          <Select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Select agent"
            options={(agents.data?.items || []).map((a) => ({ value: a._id, label: `${a.name} (${a.code}) · bal ${inr(a.wallets?.balance)}` }))}
          />
        </Field>
        <Field label="Amount (₹)">
          <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <ErrorBox error={error} />
        <Button busy={busy} disabled={!agentId || !(Number(amount) > 0)} onClick={submit}>
          Transfer
        </Button>
      </div>
    </Card>
  );
}

function ConvertCard({ onDone, max }) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await post('/wallets/commission/convert', { amount: Number(amount) });
      setAmount('');
      onDone('Commission moved to balance');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Use commission as balance">
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Move earned commission into your balance instead of waiting for a payout from Admin.</p>
        <Field label={`Amount (max ${inr(Math.max(0, max))})`}>
          <Input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <ErrorBox error={error} />
        <Button variant="secondary" busy={busy} disabled={!(Number(amount) > 0)} onClick={submit}>
          Move to balance
        </Button>
      </div>
    </Card>
  );
}
