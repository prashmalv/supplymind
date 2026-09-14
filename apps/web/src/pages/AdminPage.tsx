import React, { useState } from 'react';
import { Users, ShieldCheck, ScrollText, UserPlus, X, Check, Minus, Mail } from 'lucide-react';
import { ROLE_PERMISSIONS, Permission } from '@supplymind/shared';
import { useAuth } from '../auth/AuthProvider';
import { PageHeader } from '../components/mis/kit';

interface DemoUser { name: string; email: string; role: string; createdBy: string; lastLogin: string; status: 'Active' | 'Invited' | 'Disabled'; }

const SEED_USERS: DemoUser[] = [
  { name: 'Bajaj Energy Planner', email: 'planner@bajajenergy.com', role: 'Org Admin', createdBy: 'System', lastLogin: 'Today 09:12', status: 'Active' },
  { name: 'Procurement Analyst', email: 'analyst@bajajenergy.com', role: 'Analyst', createdBy: 'Bajaj Energy Planner', lastLogin: 'Yesterday 18:40', status: 'Active' },
  { name: 'Stores Manager', email: 'stores@bajajenergy.com', role: 'Analyst', createdBy: 'Bajaj Energy Planner', lastLogin: '2 days ago', status: 'Active' },
  { name: 'MD Office', email: 'md.office@bajajenergy.com', role: 'Viewer', createdBy: 'Bajaj Energy Planner', lastLogin: 'Today 08:05', status: 'Active' },
  { name: 'Finance Controller', email: 'finance@bajajenergy.com', role: 'Analyst', createdBy: 'Bajaj Energy Planner', lastLogin: '—', status: 'Invited' },
];

const AUDIT = [
  { who: 'Bajaj Energy Planner', action: 'Created automation', detail: 'Email alert: coal stock < 10 days', when: 'Today 09:20' },
  { who: 'Bajaj Energy Planner', action: 'Exported report', detail: 'Open PO Aging (CSV)', when: 'Today 09:14' },
  { who: 'Procurement Analyst', action: 'Viewed dashboard', detail: 'Procurement MIS · plant = Lalitpur', when: 'Yesterday 18:41' },
  { who: 'Bajaj Energy Planner', action: 'Changed role', detail: 'stores@bajajenergy.com → Analyst', when: 'Yesterday 15:22' },
  { who: 'Bajaj Energy Planner', action: 'Invited user', detail: 'finance@bajajenergy.com (Analyst)', when: 'Yesterday 12:03' },
  { who: 'Bajaj Energy Planner', action: 'Connected source', detail: 'SAP ECC 6.0 extract', when: '2 days ago' },
  { who: 'System', action: 'Login', detail: 'planner@bajajenergy.com', when: '2 days ago' },
];

const PERM_LABELS: Record<Permission, string> = {
  'org:read': 'View organization', 'org:manage': 'Manage organization', 'user:manage': 'Manage users & roles',
  'connector:read': 'View connectors', 'connector:write': 'Configure connectors', 'sync:run': 'Run data sync',
  'kpi:read': 'View dashboards & KPIs', 'ai:chat': 'Use AI assistant', 'ai:draft': 'AI drafting & actions',
  'alert:read': 'View alerts', 'alert:ack': 'Acknowledge alerts', 'data:export': 'Export data (CSV / PDF)',
  'admin:platform': 'Platform administration',
};
const ROLE_COLS: { key: keyof typeof ROLE_PERMISSIONS; label: string }[] = [
  { key: 'platform-admin', label: 'Platform Admin' }, { key: 'org-admin', label: 'Org Admin' },
  { key: 'analyst', label: 'Analyst' }, { key: 'viewer', label: 'Viewer' },
];
const ALL_PERMS = Object.keys(PERM_LABELS) as Permission[];

const th = 'py-2 px-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 whitespace-nowrap';
const rowBorder = 'border-b border-slate-200 dark:border-white/5 last:border-0';
const statusColor = (s: string) => (s === 'Active' ? '#0ca30c' : s === 'Invited' ? '#b45309' : '#64748b');

export const AdminPage: React.FC = () => {
  const { user, currentOrg } = useAuth();
  const storeKey = `sm_users_${currentOrg?.orgId || 'x'}`;
  const [tab, setTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [users, setUsers] = useState<DemoUser[]>(() => {
    try { const extra = JSON.parse(localStorage.getItem(storeKey) || '[]'); return [...extra, ...SEED_USERS]; } catch { return SEED_USERS; }
  });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Analyst' });

  const addUser = () => {
    if (!form.email.trim()) return;
    const u: DemoUser = { name: form.name || form.email.split('@')[0], email: form.email, role: form.role, createdBy: user?.name || 'Admin', lastLogin: '—', status: 'Invited' };
    const next = [u, ...users];
    setUsers(next);
    try {
      const extra = JSON.parse(localStorage.getItem(storeKey) || '[]');
      localStorage.setItem(storeKey, JSON.stringify([u, ...extra]));
    } catch { /* */ }
    setAdding(false); setForm({ name: '', email: '', role: 'Analyst' });
  };

  return (
    <div>
      <PageHeader title="Admin Console" subtitle="Manage users, roles & permissions, and review the audit trail" />

      <div className="flex gap-1 mb-4 border-b border-slate-200 dark:border-white/10">
        {([['users', 'Users', Users], ['roles', 'Roles & Permissions', ShieldCheck], ['audit', 'Audit Trail', ScrollText]] as const).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 border-b-2 -mb-px ${tab === k ? 'border-red-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="liquid-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Organization Users <span className="text-slate-400 font-normal">({users.length})</span></span>
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white"><UserPlus size={14} /> Add User</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className={`text-left ${rowBorder}`}>
                <th className={th}>Name</th><th className={th}>Email</th><th className={th}>Role</th>
                <th className={th}>Created by</th><th className={th}>Last login</th><th className={th}>Status</th>
              </tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email} className={rowBorder}>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-200 font-medium">{u.name}</td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="py-2 px-3"><span className="text-[11px] font-semibold rounded-md px-2 py-0.5 bg-slate-500/10 text-slate-600 dark:text-slate-300">{u.role}</span></td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{u.createdBy}</td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 tabular-nums">{u.lastLogin}</td>
                    <td className="py-2 px-3"><span className="text-[11px] font-semibold rounded-md px-2 py-0.5" style={{ color: statusColor(u.status), background: `${statusColor(u.status)}1f` }}>{u.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">New users receive an email invite and set their own password on first login. Every user can change their password from the profile menu.</p>
        </div>
      )}

      {tab === 'roles' && (
        <div className="liquid-card rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-3">What each role can access. Assign the least-privilege role that fits the user's job.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className={`text-left ${rowBorder}`}>
                <th className={th}>Capability / Page</th>
                {ROLE_COLS.map((r) => <th key={r.key} className={`${th} text-center`}>{r.label}</th>)}
              </tr></thead>
              <tbody>
                {ALL_PERMS.map((perm) => (
                  <tr key={perm} className={rowBorder}>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-200">{PERM_LABELS[perm]}</td>
                    {ROLE_COLS.map((r) => {
                      const has = ROLE_PERMISSIONS[r.key].includes(perm);
                      return <td key={r.key} className="py-2 px-3 text-center">{has ? <Check size={15} className="text-emerald-500 inline" /> : <Minus size={14} className="text-slate-300 dark:text-slate-600 inline" />}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="liquid-card rounded-2xl p-4">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Recent Activity</span>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead><tr className={`text-left ${rowBorder}`}>
                <th className={th}>User</th><th className={th}>Action</th><th className={th}>Details</th><th className={th}>When</th>
              </tr></thead>
              <tbody>
                {AUDIT.map((a, i) => (
                  <tr key={i} className={rowBorder}>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-200">{a.who}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">{a.action}</td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{a.detail}</td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">{a.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add user modal */}
      {adding && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setAdding(false)}>
          <div className="w-full max-w-sm liquid-card rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><UserPlus size={16} className="text-red-500" /> Add User</span>
              <button onClick={() => setAdding(false)} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={17} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Full name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" className="w-full text-sm rounded-lg px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500/40" /></div>
              <div><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@bajajenergy.com" className="w-full text-sm rounded-lg px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500/40" /></div>
              <div><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full text-sm rounded-lg px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500/40">
                  {['Org Admin', 'Analyst', 'Viewer'].map((r) => <option key={r}>{r}</option>)}
                </select></div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-2">
              <button onClick={() => setAdding(false)} className="text-sm rounded-lg px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">Cancel</button>
              <button onClick={addUser} className="text-sm font-semibold rounded-lg px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white inline-flex items-center gap-1.5"><Mail size={14} /> Send Invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
