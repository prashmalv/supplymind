import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import { KpiTile } from '@supplymind/shared';
import { exportCsv, printPage } from '../../lib/exportData';

export interface KpiDetail {
  tile: KpiTile;
  note?: string;
  columns: string[];
  rows: (string | number)[][];
}

const th = 'py-2 px-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 whitespace-nowrap';
const rowBorder = 'border-b border-slate-200 dark:border-white/5 last:border-0';

export const KpiDetailModal: React.FC<{ detail: KpiDetail | null; onClose: () => void }> = ({ detail, onClose }) => {
  if (!detail) return null;
  const { tile, note, columns, rows } = detail;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col liquid-card rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/40">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{tile.label}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">{tile.value}</div>
            {(tile.delta || tile.sublabel) && (
              <div className="text-xs text-slate-500 mt-0.5">{tile.delta} {tile.sublabel}</div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => exportCsv(tile.label.replace(/\s+/g, '-').toLowerCase(), columns, rows)} title="Export CSV"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-md px-2 py-1 hover:bg-slate-100 dark:hover:bg-white/5">
              <Download size={12} /> CSV
            </button>
            <button onClick={printPage} title="Print / PDF"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-md px-2 py-1 hover:bg-slate-100 dark:hover:bg-white/5">
              <Printer size={12} /> PDF
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={18} /></button>
          </div>
        </div>
        <div className="overflow-auto p-5">
          {note && <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{note}</p>}
          {rows.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left ${rowBorder}`}>
                  {columns.map((c, i) => <th key={c} className={`${th} ${typeof rows[0]?.[i] === 'number' ? 'text-right' : ''}`}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri} className={`${rowBorder} hover:bg-slate-100/60 dark:hover:bg-white/[0.02]`}>
                    {r.map((cell, ci) => (
                      <td key={ci} className={`py-2 px-3 ${typeof cell === 'number' ? 'text-right tabular-nums text-slate-700 dark:text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>
                        {typeof cell === 'number' ? cell.toLocaleString('en-IN') : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-400">No further breakdown available for this metric.</p>
          )}
        </div>
      </div>
    </div>
  );
};
