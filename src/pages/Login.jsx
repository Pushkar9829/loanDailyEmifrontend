import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Phone, ReceiptText, ShieldCheck, UsersRound } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button, ErrorBox } from '../components/ui';
import { Brand } from '../components/Layout';

const SLOTS = ['9:30 AM', '12:30 PM', '3:30 PM', '6:30 PM', '9:30 PM'];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
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
    <div className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="relative overflow-hidden bg-slate-950 px-6 pb-10 pt-6 text-white lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-brand-700/40 blur-3xl" />
        <div className="relative -mx-5">
          <Brand />
        </div>
        <div className="relative mt-6 lg:mt-0">
          <h1 className="max-w-lg text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Your EMI, in <span className="bg-gradient-to-r from-brand-300 to-emerald-200 bg-clip-text text-transparent">5 small steps</span> a day.
          </h1>
          <p className="mt-3 max-w-md text-sm text-slate-300 sm:text-base">
            Pay for your plot, flat or vehicle a little at a time through a trusted local agent – every rupee gets an instant receipt.
          </p>

          {/* Today's 5 payment slots */}
          <div className="mt-7 hidden max-w-md rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:block">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Today's payment slots</div>
            <div className="flex items-end gap-2">
              {SLOTS.map((s, i) => (
                <div key={s} className="flex-1 text-center">
                  <div
                    className="mx-auto w-full rounded-lg bg-gradient-to-t from-brand-600 to-brand-400"
                    style={{ height: 18 + i * 12, opacity: 0.55 + i * 0.1 }}
                  />
                  <div className="mt-1.5 text-[10px] text-slate-400">{s}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-xs">
              <span className="text-slate-400">Small payments add up to</span>
              <span className="font-semibold text-emerald-300">your monthly EMI ✓</span>
            </div>
          </div>
        </div>
        <ul className="relative mt-8 hidden gap-5 text-sm text-slate-300 lg:flex">
          <li className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-brand-300" /> Local agents you know
          </li>
          <li className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-brand-300" /> Instant receipts
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-300" /> Every rupee tracked
          </li>
        </ul>
      </div>

      {/* Form */}
      <div className="flex items-start justify-center bg-white px-6 py-10 lg:items-center lg:bg-slate-50">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Log in with your registered mobile number.</p>

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-700">Mobile number</span>
              <div className="flex items-center rounded-xl bg-white shadow-sm ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-brand-500">
                <span className="flex items-center gap-1.5 border-r border-slate-200 px-3 text-sm text-slate-500">
                  <Phone className="h-4 w-4" /> +91
                </span>
                <input
                  className="w-full rounded-r-xl bg-transparent px-3 py-3 text-[15px] tracking-wide outline-none"
                  inputMode="numeric"
                  autoComplete="username"
                  maxLength={10}
                  placeholder="10 digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-slate-700">Password</span>
              <div className="flex items-center rounded-xl bg-white shadow-sm ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-brand-500">
                <span className="px-3 text-slate-400">
                  <LockKeyhole className="h-4 w-4" />
                </span>
                <input
                  className="w-full bg-transparent py-3 text-[15px] outline-none"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="cursor-pointer px-3 text-slate-400 hover:text-slate-600" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <ErrorBox error={error} />
            <Button type="submit" className="w-full" size="lg" busy={busy} disabled={phone.length !== 10 || !password}>
              Log in
            </Button>
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">Forgot your password? Ask your agent or Super Franchisee to reset it.</p>
        </form>
      </div>
    </div>
  );
}
