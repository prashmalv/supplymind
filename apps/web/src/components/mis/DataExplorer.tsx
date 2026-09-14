import React, { useMemo, useState } from 'react';
import { Search, Download, Printer, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { exportCsv, printPage } from '../../lib/exportData';

export type Cell = string | number;
export interface ExplorerData {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: Cell[][];
}

const isNumericCol = (rows: Cell[][], i: number) => rows.length > 0 && rows.every((r) => typeof r[i] === 'number' || r[i] === '' || r[i] === '—');
const fmt = (c: Cell) => (typeof c === 'number' ? c.toLocaleString('en-IN') : c);

/** Columns whose distinct string values are few enough to become dropdown filters. */
function autoFilterCols(columns: string[], rows: Cell[][], numeric: boolean[]): number[] {
  const out: number[] = [];
  columns.forEach((_, i) => {
    if (numeric[i]) return;
    const distinct = new Set(rows.map((r) => String(r[i] ?? '')));
    if (distinct.size > 1 && distinct.size <= 12 && rows.length > distinct.size) out.push(i);
  });
  return out.slice(0, 4);
}

/** Interactive table: global search, auto column filters, sortable headers,
 *  row expand, and CSV / print export of the current view. */
export const DataExplorer: React.FC<{ data: ExplorerData; maxHeight?: string }> = ({ data, maxHeight = '60vh' }) => {
  const { columns, rows } = data;
  const numeric = useMemo(() => columns.map((_, i) => isNumericCol(rows, i)), [columns, rows]);
  const filterCols = useMemo(() => autoFilterCols(columns, rows, numeric), [columns, rows, numeric]);

  const [q, setQ] = useState('');
  const [colFilters, setColFilters] = useState<Record<number, string>>({});
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const view = useMemo(() => {
    let out = rows.map((r, i) => ({ r, i }));
    const term = q.trim().toLowerCase();
    if (term) out = out.filter(({ r }) => r.some((c) => String(c).toLowerCase().includes(term)));
    for (const [ci, val] of Object.entries(colFilters)) {
      if (val) out = out.filter(({ r }) => String(r[+ci] ?? '') === val);
    }
    if (sort) {
      const { col, dir } = sort;
      out = [...out].sort((a, b) => {
        const x = a.r[col], y = b.r[col];
        if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
        return String(x).localeCompare(String(y)) * dir;
      });
    }
    return out;
  }, [rows, q, colFilters, sort]);

  const toggleSort = (col: number) =>
    setSort((s) => (s?.col === col ? { col, dir: (s.dir === 1 ? -1 : 1) as 1 | -1 } : { col, dir: 1 }));

  const distinctVals = (ci: number) => Array.from(new Set(rows.map((r) => String(r[ci] ?? '')))).sort();
  const exportRows = view.map(({ r }) => r);

  const th = 'py-2 px-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 whitespace-nowrap select-none';
  const rowBorder = 'border-b border-slate-200 dark:border-white/5 last:border-0';

  return (
    <div className="flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
            className="w-full text-sm rounded-lg pl-8 pr-3 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500/40"
          />
        </div>
        {filterCols.map((ci) => (
          <div key={ci} className="relative">
            <Filter size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={colFilters[ci] || ''} onChange={(e) => setColFilters((f) => ({ ...f, [ci]: e.target.value }))}
              className="text-xs font-medium rounded-lg pl-7 pr-2 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none appearance-none"
              aria-label={columns[ci]}
            >
              <option value="">All {columns[ci]}</option>
              {distinctVals(ci).map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        ))}
        <button onClick={() => exportCsv(data.title.replace(/\s+/g, '-').toLowerCase(), columns, exportRows)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5">
          <Download size={12} /> CSV
        </button>
        <button onClick={printPage}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5">
          <Printer size={12} /> PDF
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg border border-slate-200 dark:border-white/5" style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/70 backdrop-blur z-10">
            <tr className={`text-left ${rowBorder}`}>
              <th className="w-6" />
              {columns.map((c, i) => (
                <th key={c} className={`${th} ${numeric[i] ? 'text-right' : ''} cursor-pointer hover:text-slate-800 dark:hover:text-white`} onClick={() => toggleSort(i)}>
                  <span className="inline-flex items-center gap-1">
                    {c}
                    {sort?.col === i ? (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={10} className="opacity-30" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map(({ r, i }) => (
              <React.Fragment key={i}>
                <tr className={`${rowBorder} hover:bg-slate-100/60 dark:hover:bg-white/[0.03] cursor-pointer`} onClick={() => setExpanded(expanded === i ? null : i)}>
                  <td className="pl-2 text-slate-400">{expanded === i ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                  {r.map((cell, ci) => (
                    <td key={ci} className={`py-2 px-3 ${numeric[ci] ? 'text-right tabular-nums text-slate-700 dark:text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>
                      {fmt(cell)}
                    </td>
                  ))}
                </tr>
                {expanded === i && (
                  <tr className="bg-slate-50 dark:bg-white/[0.02]">
                    <td />
                    <td colSpan={columns.length} className="px-3 py-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                        {columns.map((c, ci) => (
                          <div key={c} className="min-w-0">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400">{c}</div>
                            <div className="text-sm text-slate-800 dark:text-slate-100 truncate">{fmt(r[ci])}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {view.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="py-8 text-center text-sm text-slate-400">No rows match the current search / filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-[11px] text-slate-500">
        Showing <span className="font-semibold tabular-nums">{view.length}</span> of <span className="tabular-nums">{rows.length}</span> rows
        {(q || Object.values(colFilters).some(Boolean)) && (
          <button onClick={() => { setQ(''); setColFilters({}); }} className="ml-2 text-red-600 dark:text-red-400 hover:underline">clear filters</button>
        )}
      </div>
    </div>
  );
};

/** Modal wrapper — used for chart / row drill-downs. */
export const DrillDown: React.FC<{ data: ExplorerData | null; onClose: () => void }> = ({ data, onClose }) => {
  if (!data) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col liquid-card rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/40">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{data.title}</h3>
            {data.subtitle && <p className="text-xs text-slate-500 mt-0.5">{data.subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white flex-shrink-0"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-hidden flex flex-col min-h-0">
          <DataExplorer data={data} maxHeight="66vh" />
        </div>
      </div>
    </div>
  );
};
