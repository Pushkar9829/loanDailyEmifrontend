import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { get } from '../lib/api';
import { inr, ROLE_LABEL } from '../lib/format';
import { applyUpdate, canInstall, hasUpdate, promptInstall } from '../lib/pwa';

const NAV = {
  admin: [
    ['/', 'Dashboard'],
    ['/users/sf', 'Super Franchisees'],
    ['/users/agent', 'Agents'],
    ['/users/customer', 'Customers'],
    ['/properties', 'Properties'],
    ['/plans', 'Plans'],
    ['/installments', 'Installments'],
    ['/reports', 'Reports'],
    ['/ledger', 'Ledger'],
    ['/reconciliation', 'Bank Reconciliation'],
    ['/lenders', 'Lending Partners'],
    ['/remittance', 'Lender Remittance'],
    ['/draws', 'Rewards & Draws'],
    ['/complaints', 'Complaints'],
    ['/messages', 'Messages & Jobs'],
    ['/tiers', 'Plan Tiers'],
    ['/settings', 'Settings'],
    ['/audit', 'Audit Log'],
  ],
  sf: [
    ['/', 'Dashboard'],
    ['/users/agent', 'My Agents'],
    ['/users/customer', 'Customers'],
    ['/plans', 'Plans'],
    ['/installments', 'Collections'],
    ['/wallet', 'Wallet & Commission'],
    ['/reports', 'Reports'],
    ['/complaints', 'Help'],
  ],
  agent: [
    ['/', 'Collect'],
    ['/users/customer', 'My Customers'],
    ['/plans', 'Plans'],
    ['/installments', 'My Collections'],
    ['/wallet', 'Wallet & Commission'],
    ['/reports', 'Reports'],
    ['/complaints', 'Help'],
  ],
  customer: [
    ['/', 'My Plans'],
    ['/installments', 'Payments'],
    ['/coupons', 'Rewards'],
    ['/complaints', 'Help & Complaints'],
    ['/profile', 'Profile & KYC'],
  ],
};

export default function Layout() {
  const { user, wallets, logout, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const loc = useLocation();

  useEffect(() => {
    setOpen(false);
    get('/notifications', { limit: 1 })
      .then((d) => setUnread(d.unread))
      .catch(() => {});
    if (user.role === 'sf' || user.role === 'agent') refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname]);

  const [installable, setInstallable] = useState(canInstall());
  const [updateReady, setUpdateReady] = useState(hasUpdate());
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const onInstallable = () => setInstallable(canInstall());
    const onUpdate = () => setUpdateReady(true);
    const onNet = () => setOnline(navigator.onLine);
    window.addEventListener('kp:installable', onInstallable);
    window.addEventListener('kp:update-ready', onUpdate);
    window.addEventListener('online', onNet);
    window.addEventListener('offline', onNet);
    return () => {
      window.removeEventListener('kp:installable', onInstallable);
      window.removeEventListener('kp:update-ready', onUpdate);
      window.removeEventListener('online', onNet);
      window.removeEventListener('offline', onNet);
    };
  }, []);

  useEffect(() => {
    const onRead = () => setUnread(0);
    window.addEventListener('kp:notifications-read', onRead);
    return () => window.removeEventListener('kp:notifications-read', onRead);
  }, []);

  const links = NAV[user.role] || [];
  const showWallet = user.role === 'sf' || user.role === 'agent';

  const nav = (
    <nav className="flex flex-col gap-0.5 p-3">
      {links.map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
        <Brand />
        {nav}
      </aside>

      {/* Drawer (mobile) */}
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-64 overflow-y-auto bg-white" onClick={(e) => e.stopPropagation()}>
            <Brand />
            {nav}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur">
          <button className="cursor-pointer rounded p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900">{user.name}</div>
            <div className="text-xs text-slate-500">
              {ROLE_LABEL[user.role]}
              {user.code ? ` · ${user.code}` : ''}
            </div>
          </div>
          {showWallet && (
            <NavLink to="/wallet" className="hidden rounded-lg bg-brand-50 px-3 py-1.5 text-right sm:block">
              <div className="text-[10px] uppercase tracking-wide text-brand-700">Balance</div>
              <div className="text-sm font-bold tabular-nums text-brand-800">{inr(wallets.balance)}</div>
            </NavLink>
          )}
          <NavLink to="/notifications" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>
            )}
          </NavLink>
          <NavLink to="/profile" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </NavLink>
          <button onClick={logout} className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Logout
          </button>
        </header>
        {!online && (
          <div className="bg-rose-600 px-4 py-1.5 text-center text-sm font-medium text-white">You are offline. Payments can't be recorded until the internet is back.</div>
        )}
        {updateReady && (
          <div className="flex items-center justify-center gap-3 bg-slate-900 px-4 py-1.5 text-sm text-white">
            A new version of the app is ready.
            <button className="cursor-pointer rounded bg-white px-2 py-0.5 font-medium text-slate-900" onClick={applyUpdate}>
              Reload
            </button>
          </div>
        )}
        {installable && (
          <div className="flex items-center justify-center gap-3 bg-brand-50 px-4 py-1.5 text-sm text-brand-900">
            Install KistiPay on this phone for one-tap access.
            <button className="cursor-pointer rounded bg-brand-700 px-2 py-0.5 font-medium text-white" onClick={promptInstall}>
              Install app
            </button>
          </div>
        )}
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      <div>
        <div className="font-bold leading-tight text-slate-900">KistiPay</div>
        <div className="text-[11px] leading-tight text-slate-500">EMI, 5 small steps a day</div>
      </div>
    </div>
  );
}
