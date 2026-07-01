import React from 'react';
import { Bell, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getRoleHome } from '../auth/roleRouting';
import { useAuth } from '../auth/AuthContext';
import MobileBottomNav from '../components/pwa/MobileBottomNav';
import { UserRole } from '../types';

const workspaceConfig = {
  [UserRole.LOGISTICS]: {
    label: 'Logistics Operations',
    shortLabel: 'Logistics',
    accent: 'bg-emerald-600',
    active: 'bg-emerald-600 text-white shadow-emerald-100'
  },
  [UserRole.FINANCE]: {
    label: 'Finance Management',
    shortLabel: 'Finance',
    accent: 'bg-blue-700',
    active: 'bg-blue-700 text-white shadow-blue-100'
  },
  [UserRole.SUPPORT]: {
    label: 'Customer Support Desk',
    shortLabel: 'Support',
    accent: 'bg-orange-500',
    active: 'bg-orange-500 text-white shadow-orange-100'
  }
} as const;

const StaffLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role as UserRole.LOGISTICS | UserRole.FINANCE | UserRole.SUPPORT;
  const config = workspaceConfig[role];
  const home = getRoleHome(role);
  const notificationPath = `${home}/notifications`;
  const navItems = [
    { to: home, label: 'Overview', icon: <LayoutDashboard size={19} /> },
    { to: notificationPath, label: 'Alerts', icon: <Bell size={19} /> }
  ];

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <aside className="hidden w-72 shrink-0 border-r border-gray-200 bg-white p-6 md:flex md:flex-col">
        <Link to={home} className="flex items-center gap-3 px-2 py-4">
          <span className={`h-10 w-10 rounded-2xl ${config.accent} shadow-lg`} />
          <span>
            <span className="block text-lg font-black text-gray-950">E-MALLA</span>
            <span className="block text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">{config.shortLabel}</span>
          </span>
        </Link>

        <nav className="mt-8 flex-grow space-y-2">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-black transition-colors ${
                  active ? `${config.active} shadow-lg` : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white ${config.accent}`}>
              <ShieldCheck size={18} />
            </span>
            <span>
              <span className="block text-sm font-black text-gray-900">{user?.name}</span>
              <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400">{user?.staffLevel || 'officer'}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-white text-xs font-black text-red-500"
          >
            <LogOut size={15} className="mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-grow">
        <header className="sticky top-0 z-40 flex min-h-20 items-center justify-between border-b border-gray-200 bg-white/95 px-5 backdrop-blur-xl md:px-9">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">E-Malla Staff Workspace</p>
            <h1 className="mt-1 text-lg font-black text-gray-950">{config.label}</h1>
          </div>
          <Link to={notificationPath} aria-label="Open staff alerts" className="relative rounded-2xl bg-gray-100 p-3 text-gray-600">
            <Bell size={19} />
          </Link>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 pb-28 md:p-8">{children}</main>
        <MobileBottomNav
          accentClass="text-gray-950"
          backgroundClass="bg-white/96"
          items={navItems}
        />
      </div>
    </div>
  );
};

export default StaffLayout;
