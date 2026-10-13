import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/hooks';
import { useAuth } from '../../lib/auth';
import { post, patch, get } from '../../lib/api';
import { inr, ROLE_LABEL, date } from '../../lib/format';
import KycDocs from '../../components/KycDocs';
import { Avatar, Button, Card, ErrorBox, Field, Input, Loading, Modal, PageHeader, Pagination, Select, StatusBadge, Table, Textarea, useToast } from '../../components/ui';

const TITLES = { sf: 'Super Franchisees', agent: 'Agents', customer: 'Customers' };

export default function Users() {
  const { role } = useParams();
  const { user: me } = useAuth();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState('');
  const [kyc, setKyc] = useState(sp.get('kyc') || '');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(sp.get('new') === '1');
  const [selected, setSelected] = useState(null);
  // Which user lists each role may open
  const visible = { admin: ['sf', 'agent', 'customer'], sf: ['agent', 'customer'], agent: ['customer'] }[me.role] || [];
  const allowed = visible.includes(role);
  const { data, error, loading, reload } = useApi('/users', { role, q, kycStatus: kyc, page }, { skip: !allowed });

  useEffect(() => setPage(1), [role, q, kyc]);
  if (!TITLES[role] || !allowed) return <Navigate to="/" replace />;
  const canCreate = visible.includes(role);

  const cols = [
    {
      label: 'Name',
      render: (u) => (
        <span className="flex items-center gap-3">
          <Avatar name={u.name} size="sm" />
          <span>
            <span className="block font-medium text-slate-900">{u.name}</span>
            <span className="block text-xs text-slate-500">{u.code}{u.area ? ` · ${u.area}` : ''}</span>
          </span>
        </span>
      ),
    },
    { label: 'Phone', key: 'phone' },
    role !== 'sf' && me.role === 'admin' && { label: 'Super Franchisee', render: (u) => u.sf?.name || '—' },
    role === 'customer' && me.role !== 'agent' && { label: 'Agent', render: (u) => u.agent?.name || '—' },
    role !== 'customer' && { label: 'Balance', render: (u) => inr(u.wallets?.balance), right: true },
    role !== 'customer' && { label: 'Commission', render: (u) => inr(u.wallets?.commission), right: true },
    role === 'customer' && { label: 'KYC', render: (u) => <StatusBadge status={u.kyc?.status || 'pending'} /> },
    { label: 'Status', render: (u) => <StatusBadge status={u.status} /> },
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title={me.role === 'admin' ? TITLES[role] : `My ${TITLES[role].toLowerCase()}`}
        actions={canCreate && <Button onClick={() => setCreating(true)}>+ Add {ROLE_LABEL[role]}</Button>}
      />
      <Card padded={false}>
        <div className="flex flex-wrap gap-2 p-3">
          <Input className="max-w-xs" placeholder="Search name, phone, code, area" value={q} onChange={(e) => setQ(e.target.value)} />
          {role === 'customer' && (
            <Select
              className="max-w-[180px]"
              placeholder="All KYC"
              value={kyc}
              onChange={(e) => setKyc(e.target.value)}
              options={[
                { value: 'pending', label: 'KYC pending' },
                { value: 'verified', label: 'KYC verified' },
                { value: 'rejected', label: 'KYC rejected' },
              ]}
            />
          )}
        </div>
        {loading && !data ? <Loading /> : <ErrorBox error={error} />}
        {data && <Table rows={data.items} columns={cols} onRowClick={(u) => setSelected(u._id)} empty={`No ${TITLES[role].toLowerCase()} yet`} />}
        <div className="pb-3">
          <Pagination page={data?.page} pages={data?.pages} total={data?.total} onPage={setPage} />
        </div>
      </Card>

      <CreateUser
        open={creating}
        role={role}
        onClose={() => {
          setCreating(false);
          if (sp.get('new')) setSp({});
        }}
        onCreated={reload}
      />
      {selected && <UserDrawer id={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </>
  );
}

function CreateUser({ open, role, onClose, onCreated }) {
  const { user: me } = useAuth();
  const toast = useToast();
  const empty = { name: '', phone: '', password: '', email: '', area: '', sfId: '', agentId: '', aadhaarLast4: '', pan: '', address: '' };
  const [f, setF] = useState(empty);
  const [parents, setParents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (!open) return;
    setF(empty);
    setError(null);
    const needs = role === 'agent' && me.role === 'admin' ? 'sf' : role === 'customer' && me.role !== 'agent' ? 'agent' : null;
    if (needs) get('/users', { role: needs, status: 'active', limit: 200 }).then((d) => setParents(d.items)).catch(() => setParents([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { role, name: f.name, phone: f.phone, password: f.password, email: f.email, area: f.area };
      if (role === 'agent' && me.role === 'admin') body.sfId = f.sfId;
      if (role === 'customer' && me.role !== 'agent') body.agentId = f.agentId;
      if (role === 'customer' && (f.aadhaarLast4 || f.pan || f.address)) {
        body.kyc = { aadhaarLast4: f.aadhaarLast4 || undefined, pan: f.pan, address: f.address || undefined };
      }
      await post('/users', body);
      toast(`${ROLE_LABEL[role]} created`);
      onCreated();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Add ${ROLE_LABEL[role]}`} wide>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name">
          <Input value={f.name} onChange={set('name')} required />
        </Field>
        <Field label="Mobile (login ID)">
          <Input value={f.phone} inputMode="numeric" maxLength={10} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} required />
        </Field>
        <Field label="Initial password" hint="Min 8 characters. Share it with the user privately.">
          <Input value={f.password} onChange={set('password')} minLength={8} required />
        </Field>
        <Field label="Area / locality">
          <Input value={f.area} onChange={set('area')} />
        </Field>
        <Field label="Email (optional)">
          <Input type="email" value={f.email} onChange={set('email')} />
        </Field>
        {role === 'agent' && me.role === 'admin' && (
          <Field label="Super Franchisee">
            <Select required value={f.sfId} onChange={set('sfId')} placeholder="Select" options={parents.map((p) => ({ value: p._id, label: `${p.name} (${p.code})` }))} />
          </Field>
        )}
        {role === 'customer' && me.role !== 'agent' && (
          <Field label="Agent">
            <Select required value={f.agentId} onChange={set('agentId')} placeholder="Select" options={parents.map((p) => ({ value: p._id, label: `${p.name} (${p.code})` }))} />
          </Field>
        )}
        {role === 'customer' && (
          <>
            <div className="sm:col-span-2 mt-2 text-sm font-semibold text-slate-700">KYC</div>
            <Field label="Aadhaar – last 4 digits" hint="Never store the full Aadhaar number">
              <Input value={f.aadhaarLast4} maxLength={4} inputMode="numeric" onChange={(e) => setF({ ...f, aadhaarLast4: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label="PAN">
              <Input value={f.pan} maxLength={10} onChange={(e) => setF({ ...f, pan: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea value={f.address} onChange={set('address')} className="min-h-16" />
            </Field>
          </>
        )}
        <div className="sm:col-span-2">
          <ErrorBox error={error} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full" busy={busy}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function UserDrawer({ id, onClose, onChanged }) {
  const { user: me } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const { data, error, loading, reload } = useApi(`/users/${id}`);
  const settings = useApi('/config/settings');
  const [action, setAction] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => setErr(null), [action]);

  const run = async (fn, msg) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      toast(msg);
      setAction(null);
      setForm({});
      reload();
      onChanged();
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  const u = data?.user;
  const canManage = me.role === 'admin' || me.role === 'sf';
  const kycEditable = u?.role === 'customer';

  return (
    <Modal open onClose={onClose} title={u ? `${u.name} · ${u.code}` : 'User'} wide>
      {loading && !data ? <Loading /> : <ErrorBox error={error} />}
      {u && (
        <div className="space-y-4">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <Info label="Role" value={ROLE_LABEL[u.role]} />
            <Info label="Status" value={<StatusBadge status={u.status} />} />
            <Info label="Phone" value={u.phone} />
            <Info label="Area" value={u.area || '—'} />
            {u.sf && <Info label="Super Franchisee" value={`${u.sf.name} (${u.sf.code})`} />}
            {u.agent && <Info label="Agent" value={`${u.agent.name} · ${u.agent.phone}`} />}
            <Info label="Joined" value={date(u.createdAt)} />
            {u.role !== 'customer' && <Info label="Balance / Commission" value={`${inr(data.wallets.balance)} / ${inr(data.wallets.commission)}`} />}
          </div>
          {kycEditable && (
            <div className="rounded-xl border border-slate-200 p-3 text-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">KYC</span>
                <StatusBadge status={u.kyc?.status || 'pending'} />
              </div>
              <div className="grid gap-1 sm:grid-cols-3">
                <Info label="Aadhaar" value={u.kyc?.aadhaarLast4 ? `XXXX XXXX ${u.kyc.aadhaarLast4}` : '—'} />
                <Info label="PAN" value={u.kyc?.pan || '—'} />
                <Info label="Address" value={u.kyc?.address || '—'} />
              </div>
              {u.kyc?.note && <div className="mt-1 text-xs text-slate-500">Note: {u.kyc.note}</div>}
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</div>
                <KycDocs
                  userId={u._id}
                  canDelete={me.role === 'admin' || u.kyc?.status !== 'verified'}
                  required={settings.data?.settings.kyc?.requireDocsToVerify ? settings.data.settings.kyc.requiredDocs : []}
                  onChanged={() => {
                    setErr(null);
                    reload();
                    onChanged();
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {u.role === 'customer' && me.role !== 'customer' && (
              <Button size="sm" onClick={() => nav(`/plans/new?customerId=${u._id}`)} disabled={u.status !== 'active'}>
                Open plan
              </Button>
            )}
            {u.role === 'customer' && (
              <Button size="sm" variant="secondary" onClick={() => nav(`/plans?customerId=${u._id}`)}>
                View plans
              </Button>
            )}
            {kycEditable && canManage && u.kyc?.status !== 'verified' && (
              <Button size="sm" variant="secondary" onClick={() => run(() => post(`/users/${u._id}/kyc`, { status: 'verified' }), 'KYC verified')}>
                Verify KYC
              </Button>
            )}
            {kycEditable && canManage && u.kyc?.status !== 'rejected' && (
              <Button size="sm" variant="secondary" onClick={() => setAction('rejectKyc')}>
                Reject KYC
              </Button>
            )}
            {kycEditable && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setForm({ aadhaarLast4: u.kyc?.aadhaarLast4 || '', pan: u.kyc?.pan || '', address: u.kyc?.address || '' });
                  setAction('editKyc');
                }}
              >
                Edit KYC
              </Button>
            )}
            {me.role === 'admin' && u.role === 'sf' && (
              <Button size="sm" onClick={() => setAction('issue')}>
                Issue balance
              </Button>
            )}
            {me.role === 'sf' && u.role === 'agent' && (
              <Button size="sm" onClick={() => setAction('transfer')}>
                Transfer balance
              </Button>
            )}
            {me.role === 'admin' && (u.role === 'sf' || u.role === 'agent') && (
              <Button size="sm" variant="secondary" onClick={() => setAction('payout')}>
                Pay commission
              </Button>
            )}
            {(u.role === 'sf' || u.role === 'agent') && me.role !== 'agent' && (
              <Button size="sm" variant="secondary" onClick={() => nav(me.role === 'admin' ? `/ledger?ownerId=${u._id}` : `/wallet?ownerId=${u._id}`)}>
                Ledger
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => setAction('password')}>
              Reset password
            </Button>
            {canManage && (
              <Button
                size="sm"
                variant={u.status === 'active' ? 'danger' : 'secondary'}
                onClick={() => run(() => post(`/users/${u._id}/status`, { status: u.status === 'active' ? 'suspended' : 'active' }), 'Status updated')}
              >
                {u.status === 'active' ? 'Suspend' : 'Activate'}
              </Button>
            )}
          </div>

          {action && (
            <div className="space-y-3 rounded-xl bg-slate-50 p-3">
              {action === 'issue' && (
                <>
                  <Field label="Amount received from SF (₹)">
                    <Input type="number" min="1" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </Field>
                  <Field label="Bank reference / UTR">
                    <Input value={form.reference || ''} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                  </Field>
                  <Button busy={busy} onClick={() => run(() => post('/wallets/issue', { sfId: u._id, amount: Number(form.amount), reference: form.reference }), 'Balance issued')}>
                    Issue balance
                  </Button>
                </>
              )}
              {action === 'transfer' && (
                <>
                  <Field label="Amount (₹)">
                    <Input type="number" min="1" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </Field>
                  <Button busy={busy} onClick={() => run(() => post('/wallets/transfer', { agentId: u._id, amount: Number(form.amount), note: form.note }), 'Balance transferred')}>
                    Transfer
                  </Button>
                </>
              )}
              {action === 'payout' && (
                <>
                  <p className="text-sm text-slate-600">Commission balance: {inr(data.wallets.commission)}</p>
                  <Field label="Amount paid (₹)">
                    <Input type="number" min="1" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </Field>
                  <Field label="Payout reference (NEFT/UPI)">
                    <Input value={form.reference || ''} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                  </Field>
                  <Button busy={busy} onClick={() => run(() => post('/wallets/commission/payout', { userId: u._id, amount: Number(form.amount), reference: form.reference }), 'Commission paid')}>
                    Record payout
                  </Button>
                </>
              )}
              {action === 'password' && (
                <>
                  <Field label="New password" hint="Min 8 characters. User will be logged out everywhere.">
                    <Input value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </Field>
                  <Button busy={busy} onClick={() => run(() => post(`/users/${u._id}/reset-password`, { password: form.password }), 'Password reset')}>
                    Reset password
                  </Button>
                </>
              )}
              {action === 'rejectKyc' && (
                <>
                  <Field label="Reason">
                    <Input value={form.note || ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                  </Field>
                  <Button variant="danger" busy={busy} onClick={() => run(() => post(`/users/${u._id}/kyc`, { status: 'rejected', note: form.note }), 'KYC rejected')}>
                    Reject KYC
                  </Button>
                </>
              )}
              {action === 'editKyc' && (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label="Aadhaar last 4">
                      <Input maxLength={4} value={form.aadhaarLast4} onChange={(e) => setForm({ ...form, aadhaarLast4: e.target.value.replace(/\D/g, '') })} />
                    </Field>
                    <Field label="PAN">
                      <Input maxLength={10} value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} />
                    </Field>
                  </div>
                  <Field label="Address">
                    <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </Field>
                  <p className="text-xs text-slate-500">Saving sends KYC back to "pending" for verification.</p>
                  <Button
                    busy={busy}
                    onClick={() =>
                      run(
                        () => patch(`/users/${u._id}`, { kyc: { aadhaarLast4: form.aadhaarLast4 || undefined, pan: form.pan, address: form.address } }),
                        'KYC updated'
                      )
                    }
                  >
                    Save KYC
                  </Button>
                </>
              )}
            </div>
          )}
          {/* Shown for both the action forms above and the one-click buttons (verify, suspend…) */}
          <ErrorBox error={err} />
        </div>
      )}
    </Modal>
  );
}

const Info = ({ label, value }) => (
  <div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="font-medium">{value}</div>
  </div>
);
