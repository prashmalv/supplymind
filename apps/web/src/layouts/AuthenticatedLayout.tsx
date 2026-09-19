import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  MessageSquareText, Layers,
  ShoppingCart, Boxes, Plug, ChevronDown, LogOut, Settings, Sun, Moon, FileText,
  Menu, PanelLeftClose, PanelLeftOpen, KeyRound, Database, TrendingUp, LayoutDashboard,
} from 'lucide-react';
import { Permission } from '@supplymind/shared';
import { useAuth } from '../auth/AuthProvider';
import { can } from '../lib/rbac';
import { useTheme } from '../theme/ThemeProvider';
import { FloatingAssistant } from '../components/assistant/FloatingAssistant';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import rlaiLogo from '../../logo/rlailogo.png';

const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

interface NavDef {
  to: string;
  label: string;
  icon: React.ReactNode;
  perm?: Permission;
}

const PRIMARY: NavDef[] = [
  { to: '/my-dashboard', label: 'My Dashboard', icon: <LayoutDashboard size={18} />, perm: 'kpi:read' },
  { to: '/procurement', label: 'Procurement MIS', icon: <ShoppingCart size={18} />, perm: 'kpi:read' },
  { to: '/inventory', label: 'Inventory MIS', icon: <Boxes size={18} />, perm: 'kpi:read' },
  { to: '/forecast-inventory', label: 'Forecasting', icon: <TrendingUp size={18} />, perm: 'kpi:read' },
  { to: '/reports', label: 'MIS Reports', icon: <FileText size={18} />, perm: 'kpi:read' },
  { to: '/sap-mapping', label: 'SAP Mapping', icon: <Database size={18} />, perm: 'kpi:read' },
];

const TOOLS: NavDef[] = [
  { to: '/scenario', label: 'What-If', icon: <Layers size={18} />, perm: 'kpi:read' },
  { to: '/chat', label: 'Knowledge Bot', icon: <MessageSquareText size={18} />, perm: 'ai:chat' },
];

const ADMIN: NavDef[] = [
  { to: '/connectors', label: 'Connectors', icon: <Plug size={18} />, perm: 'connector:read' },
  { to: '/admin', label: 'Admin', icon: <Settings size={18} />, perm: 'user:manage' },
];

const SidebarLink: React.FC<{ item: NavDef; collapsed: boolean; onNav?: () => void }> = ({ item, collapsed, onNav }) => (
  <NavLink
    to={item.to}
    onClick={onNav}
    title={collapsed ? item.label : undefined}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-lg transition-all text-sm font-medium relative ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'} ${
        isActive
          ? 'text-white bg-gradient-to-r from-red-600 to-red-500 shadow-[0_2px_10px_rgba(220,38,38,0.35)]'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
      }`
    }
  >
    <span className="flex-shrink-0">{item.icon}</span>
    {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
  </NavLink>
);

const OrgSwitcher: React.FC = () => {
  const { memberships, currentOrg, switchOrg } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (memberships.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-sm text-slate-700 dark:text-slate-200"
      >
        <span className="max-w-[140px] truncate">{currentOrg?.orgName ?? 'Select org'}</span>
        <ChevronDown size={14} className="text-slate-500" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 liquid-card rounded-xl py-1 z-50">
          {memberships.map((m) => (
            <button
              key={m.orgId}
              onClick={() => {
                switchOrg(m.orgId);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-between ${
                m.orgId === currentOrg?.orgId ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className="truncate">{m.orgName}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">{m.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const initials = (user?.name || 'U')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-gradient-to-b from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-300"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 liquid-card rounded-xl py-1 z-50">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-white/5">
            <p className="text-sm text-slate-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => { setOpen(false); setPwOpen(true); }}
            className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2"
          >
            <KeyRound size={14} /> Change password
          </button>
          <button
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
            className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
};

export const AuthenticatedLayout: React.FC = () => {
  const { role } = useAuth();
  const visible = (items: NavDef[]) => items.filter((i) => !i.perm || can(role, i.perm));
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sm_sidebar') === 'collapsed'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleCollapse = () => setCollapsed((c) => { const n = !c; try { localStorage.setItem('sm_sidebar', n ? 'collapsed' : 'open'); } catch { /* */ } return n; });

  const NavGroup: React.FC<{ items: NavDef[]; label?: string }> = ({ items, label }) => {
    const list = visible(items);
    if (!list.length) return null;
    return (
      <div className="flex flex-col gap-1">
        {label && !collapsed && <div className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 font-semibold px-3 pt-3 pb-1">{label}</div>}
        {label && collapsed && <div className="h-px bg-slate-200 dark:bg-white/10 mx-3 my-2" />}
        {list.map((i) => <SidebarLink key={i.to} item={i} collapsed={collapsed} onNav={() => setMobileOpen(false)} />)}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-800 dark:bg-[#020617] dark:text-slate-200 font-sans">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 h-screen z-50 flex flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#070c1a] transition-all duration-200 ${collapsed ? 'w-[68px]' : 'w-60'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`flex items-center h-16 border-b border-slate-200 dark:border-white/10 ${collapsed ? 'justify-center px-0' : 'px-4 gap-2.5'}`}>
          <img src={rlaiLogo} alt="RLAI" className={`w-auto flex-shrink-0 ${collapsed ? 'h-7' : 'h-9'}`} />
          {!collapsed && (
            <div className="leading-tight">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">SupplyMind</h1>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Making your chain intelligent</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-hide px-2 py-3 flex flex-col gap-2">
          <NavGroup items={PRIMARY} />
          <NavGroup items={TOOLS} label="Tools" />
          <NavGroup items={ADMIN} label="Admin" />
        </nav>

        <button onClick={toggleCollapse} className="hidden lg:flex items-center gap-2 m-2 px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white text-sm">
          {collapsed ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /> <span>Collapse</span></>}
        </button>
      </aside>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/40 z-40 lg:hidden" />}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-3 sm:px-5 border-b border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#020617]/85 backdrop-blur-md">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300"><Menu size={20} /></button>
          <div className="flex-1" />
          <OrgSwitcher />
          <ThemeToggle />
          <UserMenu />
        </header>

        <main className="flex-1 overflow-x-hidden relative w-full pt-5 pb-12 px-3 sm:px-5">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#020617]">
          <div className="px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">SupplyMind <span className="text-slate-400 dark:text-slate-600 font-normal">· Powered by RLAI</span></span>
            <span className="text-xs text-slate-400 dark:text-slate-600">© 2026 RLAI Inc.</span>
          </div>
        </footer>
      </div>

      <FloatingAssistant />
    </div>
  );
};
