import { useState } from 'react';
import { useApi } from '../../lib/hooks';
import { del, post, put } from '../../lib/api';
import { inr, inrShort } from '../../lib/format';
import { Button, Card, ErrorBox, Field, Input, Loading, Modal, PageHeader, StatusBadge, Table, Toggle, useToast } from '../../components/ui';

export default function Tiers() {
  const { data, error, loading, reload } = useApi('/config/tiers');
  const settings = useApi('/config/settings');
  const [edit, setEdit] = useState(null);
  const slots = settings.data?.settings.slots.length || 5;

  return (
    <>
      <PageHeader
        title="Plan tiers"
        subtitle="Property value → installment amounts a customer may pay in each slot (from the client's table). A plan uses the smallest tier at or above its property value."
        actions={<Button onClick={() => setEdit({})}>+ Add tier</Button>}
      />
      <Card padded={false}>
        {loading && !data ? <Loading /> : <ErrorBox error={error} />}
        {data && (
          <Table
            rows={data.items}
            onRowClick={setEdit}
            columns={[
              { label: 'Property value', render: (t) => <span className="font-semibold">{inrShort(t.propertyValue)}</span> },
              { label: 'Installment amounts', nowrap: false, render: (t) => t.denominations.map(inrShort).join(' · ') },
              { label: 'Max / day', render: (t) => inr(Math.max(...t.denominations) * slots), right: true },
              { label: 'Max / month', render: (t) => inrShort(Math.max(...t.denominations) * slots * 30), right: true },
              { label: 'Status', render: (t) => <StatusBadge status={t.active ? 'active' : 'inactive'} /> },
            ]}
          />
        )}
      </Card>
      {edit && <TierForm tier={edit} onClose={() => setEdit(null)} onSaved={reload} />}
    </>
  );
}

function TierForm({ tier, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !tier._id;
  const [value, setValue] = useState(tier.propertyValue || '');
  const [denoms, setDenoms] = useState((tier.denominations || [100, 500, 1000, 2000, 5000]).join(', '));
  const [active, setActive] = useState(tier.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const save = async (fn, msg) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      toast(msg);
      onSaved();
      onClose();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  const body = () => ({
    propertyValue: Number(value),
    denominations: denoms
      .split(/[,\s]+/)
      .map((x) => Number(x))
      .filter((x) => x > 0),
    active,
  });

  return (
    <Modal open onClose={onClose} title={isNew ? 'Add tier' : `Tier ${inrShort(tier.propertyValue)}`}>
      <div className="space-y-3">
        <Field label="Property value (₹)">
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
        <Field label="Installment amounts (₹)" hint="Comma separated, e.g. 100, 500, 1000, 2000, 5000">
          <Input value={denoms} onChange={(e) => setDenoms(e.target.value)} />
        </Field>
        <Toggle checked={active} onChange={setActive} label="Active" />
        <ErrorBox error={error} />
        <div className="flex gap-2">
          <Button className="flex-1" busy={busy} onClick={() => save(() => (isNew ? post('/config/tiers', body()) : put(`/config/tiers/${tier._id}`, body())), 'Tier saved')}>
            Save
          </Button>
          {!isNew && (
            <Button variant="danger" busy={busy} onClick={() => save(() => del(`/config/tiers/${tier._id}`), 'Tier deleted')}>
              Delete
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-500">Changes apply to new plans only. Existing plans keep the amounts they were opened with.</p>
      </div>
    </Modal>
  );
}
