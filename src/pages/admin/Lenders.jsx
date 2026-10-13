import { useState } from 'react';
import { useApi } from '../../lib/hooks';
import { post, put } from '../../lib/api';
import { Alert, Button, Card, ErrorBox, Field, Input, Loading, Modal, PageHeader, Select, StatusBadge, Table, Toggle, useToast } from '../../components/ui';

const TYPES = [
  { value: 'nbfc', label: 'NBFC' },
  { value: 'bank', label: 'Bank' },
  { value: 'hfc', label: 'Housing finance co.' },
];

export default function Lenders() {
  const { data, error, loading, reload } = useApi('/finance/lenders');
  const [edit, setEdit] = useState(null);
  return (
    <>
      <PageHeader
        title="Lending partners"
        subtitle="NBFCs / banks that give the actual loan when a plan is a 'partner loan'. The platform collects in daily slots and remits to the lender."
        actions={<Button onClick={() => setEdit({})}>+ Add lender</Button>}
      />
      <div className="mb-4">
        <Alert tone="blue">
          Only RBI-regulated entities can lend. Sign a lending service provider (LSP) agreement with each partner; under RBI Digital Lending Directions the borrower must get the lender's Key Fact Statement
          before the loan (available on each plan page).
        </Alert>
      </div>
      <Card padded={false}>
        {loading && !data ? <Loading /> : <ErrorBox error={error} />}
        {data && (
          <Table
            rows={data.items}
            onRowClick={setEdit}
            empty="No lending partners yet"
            columns={[
              { label: 'Name', render: (l) => <span className="font-medium">{l.name}<span className="block text-xs text-slate-500">{TYPES.find((t) => t.value === l.type)?.label}</span></span> },
              { label: 'RBI reg. no.', key: 'rbiRegNo' },
              { label: 'Max interest', render: (l) => `${l.maxInterestRate}%`, right: true },
              { label: 'Default fee', render: (l) => `${l.defaultProcessingFeePercent}%`, right: true },
              { label: 'Grievance officer', key: 'grievanceOfficer', nowrap: false },
              { label: 'Status', render: (l) => <StatusBadge status={l.active ? 'active' : 'inactive'} /> },
            ]}
          />
        )}
      </Card>
      {edit && <LenderForm lender={edit} onClose={() => setEdit(null)} onSaved={reload} />}
    </>
  );
}

function LenderForm({ lender, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !lender._id;
  const [f, setF] = useState({
    name: lender.name || '',
    type: lender.type || 'nbfc',
    rbiRegNo: lender.rbiRegNo || '',
    contactName: lender.contactName || '',
    contactPhone: lender.contactPhone || '',
    contactEmail: lender.contactEmail || '',
    grievanceOfficer: lender.grievanceOfficer || '',
    remittanceAccount: lender.remittanceAccount || '',
    maxInterestRate: lender.maxInterestRate ?? 24,
    defaultProcessingFeePercent: lender.defaultProcessingFeePercent ?? 1,
    active: lender.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { ...f, maxInterestRate: Number(f.maxInterestRate), defaultProcessingFeePercent: Number(f.defaultProcessingFeePercent) };
      if (isNew) await post('/finance/lenders', body);
      else await put(`/finance/lenders/${lender._id}`, body);
      toast('Lender saved');
      onSaved();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isNew ? 'Add lending partner' : lender.name} wide>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <Input value={f.name} onChange={set('name')} required />
        </Field>
        <Field label="Type">
          <Select value={f.type} onChange={set('type')} options={TYPES} />
        </Field>
        <Field label="RBI registration / licence no.">
          <Input value={f.rbiRegNo} onChange={set('rbiRegNo')} required />
        </Field>
        <Field label="Remittance account (bank a/c or UPI)">
          <Input value={f.remittanceAccount} onChange={set('remittanceAccount')} />
        </Field>
        <Field label="Max interest rate (% p.a.)">
          <Input type="number" min="0" max="60" step="0.1" value={f.maxInterestRate} onChange={set('maxInterestRate')} />
        </Field>
        <Field label="Default processing fee (%)">
          <Input type="number" min="0" max="10" step="0.1" value={f.defaultProcessingFeePercent} onChange={set('defaultProcessingFeePercent')} />
        </Field>
        <Field label="Contact name">
          <Input value={f.contactName} onChange={set('contactName')} />
        </Field>
        <Field label="Contact phone">
          <Input value={f.contactPhone} onChange={set('contactPhone')} />
        </Field>
        <Field label="Contact email">
          <Input type="email" value={f.contactEmail} onChange={set('contactEmail')} />
        </Field>
        <Field label="Grievance officer (name, phone, email)" hint="Printed on the Key Fact Statement">
          <Input value={f.grievanceOfficer} onChange={set('grievanceOfficer')} />
        </Field>
        <div className="sm:col-span-2">
          <Toggle checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Active (can be chosen for new plans)" />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <ErrorBox error={error} />
          <Button type="submit" className="w-full" busy={busy}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
