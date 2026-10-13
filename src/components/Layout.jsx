import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeftRight, BadgeIndianRupee, Banknote, Bell, BookOpenText, Building2, ChartColumn, ChevronDown, CircleHelp, ClipboardList, Download,
  FileSpreadsheet, Gift, HandCoins, House, Landmark, Layers, LayoutDashboard, LogOut, Menu, MessageSquareText, MoreHorizontal,
  Receipt, RefreshCw, ScrollText, Settings, ShieldCheck, Store, UserRound, Users, UsersRound, Wallet, WifiOff, X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { get } from '../lib/api';
import { inr, ROLE_LABEL } from '../lib/format';
import { applyUpdate, canInstall, hasUpdate, promptInstall } from '../lib/pwa';
import { Avatar, cx } from './ui';

// Grouped navigation per role: [section, [[path, label, icon], ...]]
const NAV = {
  admin: [
    ['Overview', [['/', 'Dashboard', LayoutDashboard], ['/reports', 'Reports', ChartColumn]]],
    ['Network', [['/users/sf', 'Super Franchisees', Building2], ['/users/agent', 'Agents', UsersRound], ['/users/customer', 'Customers', Users]]],
    ['Plans & collections', [['/plans', 'Plans', ClipboardList], ['/installments', 'Installments', Receipt], ['/properties', 'Properties', House], ['/tiers', 'Plan tiers', Layers]]],
    ['Money', [['/ledger', 'Ledger', BookOpenText], ['/reconciliation', 'Bank reconciliation', FileSpreadsheet], ['/lenders', 'Lending partners', Landmark], ['/remittance', 'Lender remittance', ArrowLeftRight]]],
    ['Engagement', [['/draws', 'Rewards & draws', Gift], ['/complaints', 'Complaints', CircleHelp], ['/messages', 'Messages & jobs', MessageSquareText]]],
    ['System', [['/settings', 'Settings', Settings], ['/audit', 'Audit log', ScrollText]]],
  ],
  sf: [
    ['Overview', [['/', 'Dashboard', LayoutDashboard], ['/reports', 'Reports', ChartColumn]]],
    ['Network', [['/users/agent', 'My agents', UsersRound], ['/users/customer', 'Customers', Users]]],
    ['Money', [['/plans', 'Plans', ClipboardList], ['/installments', 'Collections', Receipt], ['/wallet', 'Wallet & commission', Wallet]]],
    ['Support', [['/complaints', 'Help', CircleHelp]]],
  ],
  agent: [
    ['Today', [['/', 'Collect', HandCoins], ['/installments', 'My collections', Receipt]]],
    ['Customers', [['/users/customer', 'My customers', Users], ['/plans', 'Plans', ClipboardList]]],
    ['Money', [['/wallet', 'Wallet & commission', Wallet], ['/reports', 'Reports', ChartColumn]]],
    ['Support', [['/complaints', 'Help', CircleHelp]]],
  ],
  customer: [
    ['', [['/', 'My plans', House], ['/installments', 'Payments', Receipt], ['/coupons', 'Rewards', Gift], ['/complaints', 'Help', CircleHelp], ['/profile', 'Profile & KYC', ShieldCheck]]],
  ],
};

// Phone bottom bar: 4 most-used destinations + "More"
const TABS = {
  admin: [['/', 'Home', LayoutDashboard], ['/plans', 'Plans', ClipboardList], ['/installments', 'Payments', Receipt], ['/reports', 'Reports', ChartColumn]],
  sf: [['/', 'Home', LayoutDashboard], ['/users/agent', 'Agents', UsersRound], ['/wallet', 'Wallet', Wallet], ['/installments', 'Collections', Receipt]],
  agent: [['/', 'Collect', HandCoins], ['/users/customer', 'Customers', Users], ['/installments', 'History', Receipt], ['/wallet', 'Wallet', Wallet]],
  customer: [['/', 'Plans', House], ['/installments', 'Payments', Receipt], ['/coupons', 'Rewards', Gift], ['/profile', 'Profile', UserRound]],
};

export default function Layout() {
  const { user, wallets, logout, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [unread, setUnread] = useState(0);
  const loc = useLocation();
  const menuRef = useRef(null);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
    get('/notifications', { limit: 1 })
      .then((d) => setUnread(d.unread))
      .catch(() => {});
    if (user.role === 'sf' || user.role === 'agent') refresh();
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname]);

  const [installable, setInstallable] = useState(canInstall());
  const [updateReady, setUpdateReady] = useState(hasUpdate());
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const onInstallable = () => setInstallable(canInstall());
    const onUpdate = () => setUpdateReady(true);
    const onNet = () => setOnline(navigator.onLine);
    const onRead = () => setUnread(0);
    const onDoc = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    window.addEventListener('kp:installable', onInstallable);
    window.addEventListener('kp:update-ready', onUpdate);
    window.addEventListener('kp:notifications-read', onRead);
    window.addEventListener('online', onNet);
    window.addEventListener('offline', onNet);
    document.addEventListener('mousedown', onDoc);
    return () => {
      window.removeEventListener('kp:installable', onInstallable);
      window.removeEventListener('kp:update-ready', onUpdate);
      window.removeEventListener('kp:notifications-read', onRead);
      window.removeEventListener('online', onNet);
      window.removeEventListener('offline', onNet);
      document.removeEventListener('mousedown', onDoc);
    };
  }, []);

  const groups = NAV[user.role] || [];
  const tabs = TABS[user.role] || [];
  const showWallet = user.role === 'sf' || user.role === 'agent';

  const sidebar = (
    <div className="flex h-full flex-col">
      <Brand />
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Main">
        {groups.map(([section, links]) => (
          <div key={section || 'main'}>
            {section && <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{section}</div>}
            <div className="space-y-0.5">
              {links.map(([to, label, Icon]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    cx(
                      'group flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition',
                      isActive ? 'bg-white/10 text-white shadow-inner shadow-white/5' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cx('h-[18px] w-[18px]', isActive ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300')} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
          <Avatar name={user.name} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{user.name}</div>
            <div className="truncate text-[11px] text-slate-400">
              {ROLE_LABEL[user.role]}
              {user.code ? ` · ${user.code}` : ''}
            </div>
          </div>
          <button onClick={logout} className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Log out" title="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-slate-950 lg:block">{sidebar}</aside>

      {/* Drawer (phone) */}
      {open && (
        <div className="fixed inset-0 z-50 animate-fade bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-72 animate-sheet bg-slate-950 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute left-[17rem] top-4 cursor-pointer rounded-full bg-white/10 p-2 text-white" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button className="cursor-pointer rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold text-slate-900">
              {greeting()}, {user.name.split(' ')[0]}
            </div>
            <div className="truncate text-xs text-slate-500">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          {showWallet && (
            <Link to="/wallet" className="hidden items-center gap-2.5 rounded-xl bg-brand-50 py-1.5 pl-2 pr-3 ring-1 ring-brand-100 transition hover:bg-brand-100 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Wallet className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-[10px] font-medium uppercase tracking-wide text-brand-700">Balance</span>
                <span className="tabular block text-sm font-bold leading-tight text-brand-900">{inr(wallets.balance)}</span>
              </span>
            </Link>
          )}
          <Link to="/notifications" className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenu((m) => !m)} className="flex cursor-pointer items-center gap-1.5 rounded-xl p-1 hover:bg-slate-100" aria-haspopup="menu" aria-expanded={menu} aria-label="Account menu">
              <Avatar name={user.name} size="sm" />
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
            {menu && (
              <div className="absolute right-0 mt-2 w-60 animate-pop overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift" role="menu">
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="truncate text-sm font-semibold text-slate-900">{user.name}</div>
                  <div className="truncate text-xs text-slate-500">
                    {ROLE_LABEL[user.role]} · {user.phone}
                  </div>
                </div>
                <div className="p-1.5">
                  <MenuLink to="/profile" icon={UserRound}>
                    Profile & password
                  </MenuLink>
                  {showWallet && (
                    <MenuLink to="/wallet" icon={BadgeIndianRupee}>
                      Wallet · {inr(wallets.balance)}
                    </MenuLink>
                  )}
                  <MenuLink to="/notifications" icon={Bell}>
                    Notifications
                  </MenuLink>
                  {installable && (
                    <button onClick={promptInstall} className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" role="menuitem">
                      <Download className="h-4 w-4 text-slate-400" /> Install app
                    </button>
                  )}
                  <button onClick={logout} className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50" role="menuitem">
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-rose-600 px-4 py-1.5 text-sm font-medium text-white">
            <WifiOff className="h-4 w-4" /> You are offline. Payments can't be recorded until the internet is back.
          </div>
        )}
        {updateReady && (
          <div className="flex items-center justify-center gap-3 bg-slate-900 px-4 py-1.5 text-sm text-white">
            <RefreshCw className="h-4 w-4" /> A new version is ready.
            <button className="cursor-pointer rounded-lg bg-white px-2.5 py-0.5 font-semibold text-slate-900" onClick={applyUpdate}>
              Reload
            </button>
          </div>
        )}
        {installable && (
          <div className="flex items-center justify-center gap-3 bg-brand-50 px-4 py-1.5 text-sm text-brand-900 lg:hidden">
            <Store className="h-4 w-4" /> Install KistiPay for one-tap access.
            <button className="cursor-pointer rounded-lg bg-brand-700 px-2.5 py-0.5 font-semibold text-white" onClick={promptInstall}>
              Install app
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
        <Outlet />
      </main>

      {/* Bottom tab bar (phone) */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden" aria-label="Quick">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {tabs.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => cx('flex flex-col items-center gap-0.5 pb-1 pt-2 text-[10.5px] font-medium', isActive ? 'text-brand-700' : 'text-slate-500')}
            >
              {({ isActive }) => (
                <>
                  <span className={cx('flex h-7 w-12 items-center justify-center rounded-full transition', isActive && 'bg-brand-50')}>
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
          <button onClick={() => setOpen(true)} className="flex cursor-pointer flex-col items-center gap-0.5 pb-1 pt-2 text-[10.5px] font-medium text-slate-500">
            <span className="flex h-7 w-12 items-center justify-center">
              <MoreHorizontal className="h-5 w-5" />
            </span>
            More
          </button>
        </div>
      </nav>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function MenuLink({ to, icon: Icon, children }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" role="menuitem">
      <Icon className="h-4 w-4 text-slate-400" />
      {children}
    </Link>
  );
}

export function Brand({ dark = true }) {
  return (
    <div className={cx('flex items-center gap-3 px-5 py-5', dark ? 'border-b border-white/10' : '')}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-900/40">
        <Banknote className="h-5 w-5 text-white" />
      </span>
      <div>
        <div className={cx('text-[17px] font-extrabold leading-tight tracking-tight', dark ? 'text-white' : 'text-slate-900')}>
          Kisti<span className="text-brand-400">Pay</span>
        </div>
        <div className={cx('text-[11px] leading-tight', dark ? 'text-slate-400' : 'text-slate-500')}>EMI in 5 small steps a day</div>
      </div>
    </div>
  );
}

