import React, { useMemo, useState } from 'react';
import { Printer, ChevronDown, ChevronsDownUp, ChevronsUpDown, Table2 } from 'lucide-react';
import { ReportTable } from '@supplymind/shared';
import { useMisReports } from '../lib/misApi';
import { Loading, PageHeader } from '../components/mis/kit';
import { DataExplorer } from '../components/mis/DataExplorer';
import { printPage } from '../lib/exportData';

const GROUP_ORDER = ['All', 'Management', 'Procurement', 'Inventory', 'Vendor', 'Other'];

const GROUP_STYLE: Record<string, string> = {
  Management: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  Procurement: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  Inventory: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  Vendor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  Other: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
};

const ReportRow: React.FC<{ r: ReportTable; open: boolean; onToggle: () => void }> = ({ r, open, onToggle }) => {
  const g = r.group || 'Other';
  return (
    <div className="liquid-card rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${open ? 'bg-slate-50 dark:bg-white/[0.03]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}
      >
        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${GROUP_STYLE[g]}`}>
          <Table2 size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{r.name}</span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${GROUP_STYLE[g]}`}>{g}</span>
          </span>
          {r.description && <span className="block text-xs text-slate-500 truncate mt-0.5">{r.description}</span>}
        </span>
        <span className="flex-shrink-0 flex items-center gap-3">
          <span className="text-[11px] text-slate-400 tabular-nums hidden sm:inline">{r.rows.length} rows · {r.columns.length} cols</span>
          <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-200 dark:border-white/10">
          <DataExplorer data={{ title: r.name, subtitle: r.description, columns: r.columns, rows: r.rows }} maxHeight="min(60vh, 460px)" />
        </div>
      )}
    </div>
  );
};

export const ReportsPage: React.FC = () => {
  const { data, isLoading } = useMisReports();
  const [group, setGroup] = useState('All');
  const [open, setOpen] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    if (!data) return ['All'];
    const present = new Set(data.map((r) => r.group || 'Other'));
    return GROUP_ORDER.filter((g) => g === 'All' || present.has(g));
  }, [data]);

  if (isLoading || !data) return <Loading />;

  if (data.length === 0) {
    return (
      <div>
        <PageHeader title="Operational MIS Reports" subtitle="Automated, exportable reports from SAP ECC" />
        <div className="liquid-card rounded-xl p-8 text-center text-slate-500">Operational reports are available for the Bajaj Energy dataset.</div>
      </div>
    );
  }

  const shown = group === 'All' ? data : data.filter((r) => (r.group || 'Other') === group);
  const toggle = (key: string) => setOpen((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const expandAll = () => setOpen(new Set(shown.map((r) => r.key)));
  const collapseAll = () => setOpen(new Set());
  const allOpen = shown.length > 0 && shown.every((r) => open.has(r.key));

  return (
    <div>
      <PageHeader
        title="Operational MIS Reports"
        subtitle="Click a report to open it — then search, filter by month, sort & export"
        right={
          <button onClick={printPage}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <Printer size={14} /> Print / PDF
          </button>
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {groups.map((g) => {
          const count = g === 'All' ? data.length : data.filter((r) => (r.group || 'Other') === g).length;
          return (
            <button key={g} onClick={() => setGroup(g)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors inline-flex items-center gap-1.5 ${
                group === g ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}>
              {g}
              <span className={`text-[10px] tabular-nums rounded-full px-1.5 ${group === g ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/10'}`}>{count}</span>
            </button>
          );
        })}
        <button onClick={allOpen ? collapseAll : expandAll}
          className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
          {allOpen ? <><ChevronsDownUp size={13} /> Collapse all</> : <><ChevronsUpDown size={13} /> Expand all</>}
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {shown.map((r) => <ReportRow key={r.key} r={r} open={open.has(r.key)} onToggle={() => toggle(r.key)} />)}
      </div>
    </div>
  );
};
