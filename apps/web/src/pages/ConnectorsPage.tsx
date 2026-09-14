import React, { useState } from 'react';
import {
  Database, Server, Cloud, HardDrive, FolderOpen, FileSpreadsheet, ShoppingBag, Boxes,
  Plug, CheckCircle2, X, Loader2, Link2, Info,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { PageHeader } from '../components/mis/kit';

interface Field { name: string; label: string; type?: string; placeholder?: string; secret?: boolean; }
interface ConnectorDef {
  key: string; name: string; category: string; desc: string; icon: React.ReactNode; accent: string;
  oauth?: 'Google' | 'Microsoft'; fields: Field[];
}

const CONNECTORS: ConnectorDef[] = [
  {
    key: 'sap', name: 'SAP ECC 6.0 (EHP8)', category: 'ERP', desc: 'Scheduled MM / FICO extracts', accent: '#2c5f7c',
    icon: <Database size={22} />,
    fields: [
      { name: 'sid', label: 'SAP System ID (SID)', placeholder: 'PRD' },
      { name: 'client', label: 'Client', placeholder: '100' },
      { name: 'landing', label: 'Extract landing (S3 / Blob path)', placeholder: 's3://bajaj-sap-extracts/mm/' },
      { name: 'tables', label: 'Tables / extract profile', placeholder: 'EKKO, EKPO, MSEG, MARD, MBEW…' },
      { name: 'schedule', label: 'Refresh schedule', placeholder: 'Daily 02:00 IST' },
    ],
  },
  {
    key: 'procol', name: 'Procol', category: 'Sourcing', desc: 'e-Sourcing & RFQ platform', accent: '#b5352a',
    icon: <ShoppingBag size={22} />,
    fields: [
      { name: 'endpoint', label: 'API endpoint', placeholder: 'https://api.procol.io/v1' },
      { name: 'apiKey', label: 'API key', secret: true, placeholder: '••••••••' },
      { name: 'org', label: 'Organization ID', placeholder: 'bajaj-energy' },
    ],
  },
  {
    key: 'oracle', name: 'Oracle 19c', category: 'Database', desc: 'SAP underlying database (read-only)', accent: '#c0392b',
    icon: <Server size={22} />,
    fields: [
      { name: 'host', label: 'Host', placeholder: 'oracle-db.internal' },
      { name: 'port', label: 'Port', placeholder: '1521' },
      { name: 'service', label: 'Service name / SID', placeholder: 'PRDDB' },
      { name: 'user', label: 'Username (read-only)', placeholder: 'mis_reader' },
      { name: 'pass', label: 'Password', secret: true },
      { name: 'schema', label: 'Schema', placeholder: 'SAPPRD' },
    ],
  },
  {
    key: 'postgres', name: 'PostgreSQL', category: 'Database', desc: 'Generic SQL database', accent: '#2f6f9f',
    icon: <Server size={22} />,
    fields: [
      { name: 'host', label: 'Host', placeholder: 'db.company.com' },
      { name: 'port', label: 'Port', placeholder: '5432' },
      { name: 'db', label: 'Database', placeholder: 'analytics' },
      { name: 'user', label: 'Username', placeholder: 'reader' },
      { name: 'pass', label: 'Password', secret: true },
    ],
  },
  {
    key: 's3', name: 'Amazon S3', category: 'Object Store', desc: 'Extract / file landing bucket', accent: '#d9822b',
    icon: <Cloud size={22} />,
    fields: [
      { name: 'bucket', label: 'Bucket', placeholder: 'bajaj-sap-extracts' },
      { name: 'region', label: 'Region', placeholder: 'ap-south-1' },
      { name: 'auth', label: 'IAM role ARN (preferred)', placeholder: 'arn:aws:iam::…:role/mis-reader' },
      { name: 'prefix', label: 'Prefix', placeholder: 'mm/' },
    ],
  },
  {
    key: 'blob', name: 'Azure Blob', category: 'Object Store', desc: 'Extract / file landing container', accent: '#2c7fb8',
    icon: <HardDrive size={22} />,
    fields: [
      { name: 'account', label: 'Storage account', placeholder: 'bajajmis' },
      { name: 'container', label: 'Container', placeholder: 'sap-extracts' },
      { name: 'sas', label: 'SAS token / connection string', secret: true },
      { name: 'prefix', label: 'Prefix', placeholder: 'mm/' },
    ],
  },
  {
    key: 'gdrive', name: 'Google Drive', category: 'Drive', desc: 'Documents & flat files', accent: '#2e7d46',
    icon: <FolderOpen size={22} />, oauth: 'Google', fields: [],
  },
  {
    key: 'sharepoint', name: 'SharePoint', category: 'Drive', desc: 'Documents & flat files', accent: '#2c5f7c',
    icon: <FileSpreadsheet size={22} />, oauth: 'Microsoft', fields: [],
  },
];

export const ConnectorsPage: React.FC = () => {
  const { currentOrgId } = useAuth();
  const storeKey = `sm_conn_${currentOrgId || 'x'}`;
  const [connected, setConnected] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(storeKey) || '{}'); } catch { return {}; }
  });
  const [active, setActive] = useState<ConnectorDef | null>(null);
  const [testing, setTesting] = useState<'idle' | 'running' | 'ok'>('idle');
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const persist = (next: Record<string, boolean>) => {
    setConnected(next);
    try { localStorage.setItem(storeKey, JSON.stringify(next)); } catch { /* */ }
  };
  const openModal = (c: ConnectorDef) => { setActive(c); setTesting('idle'); setValues({}); };
  const test = () => { setTesting('running'); setTimeout(() => setTesting('ok'), 1300); };
  const save = () => {
    if (!active) return;
    setSaving(true);
    setTimeout(() => { persist({ ...connected, [active.key]: true }); setSaving(false); setActive(null); }, 800);
  };
  const disconnect = (key: string) => { const n = { ...connected }; delete n[key]; persist(n); };

  const connectedCount = Object.values(connected).filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="Connectors"
        subtitle="Connect your enterprise data sources — SAP, Procol, databases, object stores & drives"
        right={<span className="text-xs text-slate-500">{connectedCount} of {CONNECTORS.length} connected</span>}
      />

      <div className="flex items-start gap-2 mb-5 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-xs text-slate-600 dark:text-slate-300">
        <Info size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <span>Pick a source and click <strong>Connect</strong> to configure it. Phase 1 uses scheduled SAP / Procol extracts — no change to SAP transactions. Credentials are stored securely server-side. (Demo — connections are illustrative.)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONNECTORS.map((c) => {
          const isOn = !!connected[c.key];
          return (
            <div key={c.key} className="liquid-card rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: c.accent }}>{c.icon}</div>
                {isOn ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 rounded-full px-2 py-0.5"><CheckCircle2 size={12} /> Connected</span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-500/10 rounded-full px-2 py-0.5">{c.category}</span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5 flex-1">{c.desc}</p>
              <div className="mt-4 flex gap-2">
                {isOn ? (
                  <>
                    <button onClick={() => openModal(c)} className="flex-1 text-xs font-semibold rounded-lg py-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5">Manage</button>
                    <button onClick={() => disconnect(c.key)} className="text-xs font-semibold rounded-lg py-2 px-3 border border-slate-200 dark:border-white/10 text-red-600 dark:text-red-400 hover:bg-red-500/10">Disconnect</button>
                  </>
                ) : (
                  <button onClick={() => openModal(c)} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg py-2 bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-[0_0_14px_rgba(220,38,38,0.4)]"><Plug size={13} /> Connect</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect / manage modal */}
      {active && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setActive(null)}>
          <div className="w-full max-w-md max-h-[88vh] flex flex-col liquid-card rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/10">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: active.accent }}>{active.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{active.name}</div>
                <div className="text-[11px] text-slate-500">{active.category} · configure connection</div>
              </div>
              <button onClick={() => setActive(null)} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={18} /></button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {active.oauth ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500 mb-4">Authorize SupplyMind to read files from {active.name}.</p>
                  <button onClick={test} className="inline-flex items-center gap-2 text-sm font-semibold rounded-lg px-5 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5">
                    <Link2 size={15} /> Connect with {active.oauth}
                  </button>
                </div>
              ) : (
                active.fields.map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{f.label}</label>
                    <input
                      type={f.secret ? 'password' : 'text'}
                      value={values[f.name] || ''}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full text-sm rounded-lg px-3 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500/40"
                    />
                  </div>
                ))
              )}

              {testing === 'ok' && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
                  <CheckCircle2 size={15} /> Connection successful — {active.oauth ? 'authorized' : 'source reachable'}.
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
              {!active.oauth && (
                <button onClick={test} disabled={testing === 'running'} className="text-sm font-medium rounded-lg px-4 py-2 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 inline-flex items-center gap-1.5">
                  {testing === 'running' ? <Loader2 size={14} className="animate-spin" /> : <Plug size={14} />} Test Connection
                </button>
              )}
              <div className="flex-1" />
              <button onClick={save} disabled={saving} className="text-sm font-semibold rounded-lg px-5 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white inline-flex items-center gap-1.5 disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Save &amp; Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
