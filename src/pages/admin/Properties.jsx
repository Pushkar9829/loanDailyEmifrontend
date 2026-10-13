import { useEffect, useState } from 'react';
import { useApi } from '../../lib/hooks';
import { post, put } from '../../lib/api';
import { inr, PROPERTY_TYPES } from '../../lib/format';
import { Badge, Button, Card, ErrorBox, Field, Input, Loading, Modal, PageHeader, Pagination, Select, StatusBadge, Table, Textarea, useToast } from '../../components/ui';

const TYPE_OPTIONS = Object.entries(PROPERTY_TYPES).map(([value, label]) => ({ value, label }));

export default function Properties() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null);
  const { data, error, loading, reload } = useApi('/config/properties', { status, q, page });
  useEffect(() => setPage(1), [status, q]);

  return (
    <>
      <PageHeader title="Properties" subtitle="Plots, flats, vehicles that customers can buy on a daily plan" actions={<Button onClick={() => setEdit({})}>+ Add property</Button>} />
      <Card padded={false}>
        <div className="flex flex-wrap gap-2 p-3">
          <Input className="max-w-xs" placeholder="Search title, location, seller" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select
            className="max-w-[160px]"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="All"
            options={[
              { value: 'available', label: 'Available' },
              { value: 'booked', label: 'Booked' },
              { value: 'closed', label: 'Closed' },
            ]}
          />
        </div>
        {loading && !data ? <Loading /> : <ErrorBox error={error} />}
        {data && (
          <Table
            rows={data.items}
            onRowClick={(p) => setEdit(p)}
            empty="No properties yet"
            columns={[
              { label: 'Title', render: (p) => <span className="font-medium">{p.title}<span className="block text-xs text-slate-500">{p.location}</span></span>, nowrap: false },
              { label: 'Type', render: (p) => <span>{PROPERTY_TYPES[p.type]} {p.immovable && <Badge tone="blue">immovable</Badge>}</span> },
              { label: 'Seller', render: (p) => p.sellerName || '—' },
              { label: 'Value', render: (p) => inr(p.value), right: true },
              { label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
            ]}
          />
        )}
        <div className="pb-3">
          <Pagination page={data?.page} pages={data?.pages} total={data?.total} onPage={setPage} />
        </div>
      </Card>
      {edit && <PropertyForm property={edit} onClose={() => setEdit(null)} onSaved={reload} />}
    </>
  );
}

function PropertyForm({ property, onClose, onSaved }) {
  const toast = useToast();
  const isNew = !property._id;
  const [f, setF] = useState({
    title: property.title || '',
    type: property.type || 'plot',
    value: property.value || '',
    sellerName: property.sellerName || '',
    location: property.location || '',
    reraNo: property.reraNo || '',
    description: property.description || '',
    status: property.status || 'available',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { ...f, value: Number(f.value) };
      if (isNew) {
        delete body.status;
        await post('/config/properties', body);
      } else {
        if (property.status === 'booked') delete body.value;
        await put(`/config/properties/${property._id}`, body);
      }
      toast('Property saved');
      onSaved();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isNew ? 'Add property' : 'Edit property'} wide>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <Input value={f.title} onChange={set('title')} required />
        </Field>
        <Field label="Type">
          <Select value={f.type} onChange={set('type')} options={TYPE_OPTIONS} />
        </Field>
        <Field label="Value (₹)" hint={property.status === 'booked' ? 'Locked while booked' : undefined}>
          <Input type="number" min="1000" value={f.value} onChange={set('value')} required disabled={property.status === 'booked'} />
        </Field>
        <Field label="Seller / dealer">
          <Input value={f.sellerName} onChange={set('sellerName')} />
        </Field>
        <Field label="Location">
          <Input value={f.location} onChange={set('location')} />
        </Field>
        <Field label="RERA no. (flats / plots)">
          <Input value={f.reraNo} onChange={set('reraNo')} />
        </Field>
        {!isNew && (
          <Field label="Status">
            <Select
              value={f.status}
              onChange={set('status')}
              options={[
                { value: 'available', label: 'Available' },
                { value: 'booked', label: 'Booked' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
          </Field>
        )}
        <Field label="Description" className="sm:col-span-2">
          <Textarea value={f.description} onChange={set('description')} className="min-h-16" />
        </Field>
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
