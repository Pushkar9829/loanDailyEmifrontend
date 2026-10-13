import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button, ErrorBox, Field, Input } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(phone.trim(), password);
      nav('/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src="/favicon.svg" alt="" className="mx-auto h-14 w-14" />
          <h1 className="mt-3 text-2xl font-bold text-slate-900">KistiPay</h1>
          <p className="mt-1 text-sm text-slate-500">Pay your EMI in small amounts, up to 5 times a day</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Field label="Mobile number">
            <Input
              inputMode="numeric"
              autoComplete="username"
              maxLength={10}
              placeholder="10 digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              required
            />
          </Field>
          <Field label="Password">
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <ErrorBox error={error} />
          <Button type="submit" className="w-full" size="lg" busy={busy}>
            Login
          </Button>
          <p className="text-center text-xs text-slate-500">Forgot password? Ask your agent / Super Franchisee to reset it.</p>
        </form>
      </div>
    </div>
  );
}
