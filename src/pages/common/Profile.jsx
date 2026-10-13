import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { post, setToken } from '../../lib/api';
import { ROLE_LABEL } from '../../lib/format';
import { Button, Card, ErrorBox, Field, Input, PageHeader, StatusBadge, useToast } from '../../components/ui';
import KycDocs from '../../components/KycDocs';

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (f.newPassword !== f.confirm) return setError(new Error('New passwords do not match'));
    setBusy(true);
    setError(null);
    try {
      const d = await post('/auth/change-password', { currentPassword: f.currentPassword, newPassword: f.newPassword });
      setToken(d.token);
      setF({ currentPassword: '', newPassword: '', confirm: '' });
      toast('Password changed. Other devices are logged out.');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="My profile" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Details">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Item label="Name" value={user.name} />
            <Item label="Role" value={ROLE_LABEL[user.role]} />
            <Item label="Code" value={user.code || '—'} />
            <Item label="Mobile" value={user.phone} />
            {user.sf && <Item label="Super Franchisee" value={`${user.sf.name} · ${user.sf.phone}`} />}
            {user.agent && <Item label="My agent" value={`${user.agent.name} · ${user.agent.phone}`} />}
            {user.role === 'customer' && <Item label="KYC" value={<StatusBadge status={user.kyc?.status || 'pending'} />} />}
          </dl>
        </Card>
        <Card title="Change password">
          <form onSubmit={submit} className="space-y-3">
            <Field label="Current password">
              <Input type="password" autoComplete="current-password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} required />
            </Field>
            <Field label="New password" hint="Min 8 characters">
              <Input type="password" autoComplete="new-password" minLength={8} value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} required />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} required />
            </Field>
            <ErrorBox error={error} />
            <Button type="submit" busy={busy}>
              Change password
            </Button>
          </form>
        </Card>
        {user.role === 'customer' && (
          <Card title="My KYC documents" className="lg:col-span-2">
            <KycDocs userId={user._id} canDelete={user.kyc?.status !== 'verified'} />
          </Card>
        )}
      </div>
    </>
  );
}

const Item = ({ label, value }) => (
  <div>
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="font-medium">{value}</dd>
  </div>
);
