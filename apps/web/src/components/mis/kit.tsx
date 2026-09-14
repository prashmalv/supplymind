import React from 'react';
import { KpiTile } from '@supplymind/shared';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Loader2, Download, Maximize2 } from 'lucide-react';
import { STATUS } from '../../lib/viz';
import { exportCsv } from '../../lib/exportData';

export const ExportBtn: React.FC<{ filename: string; columns: string[]; rows: (string | number)[][] }> = ({ filename, columns, rows }) => (
  <button
    onClick={() => exportCsv(filename, columns, rows)}
    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 rounded-md px-2 py-1 transition-colors"
    title="Export to Excel (CSV)"
  >
    <Download size={12} /> Export
  </button>
);

const statusColor: Record<string, string> = {
  positive: '#0ca30c',
  negative: STATUS.critical,
  warning: '#b45309', // amber-700 for light-surface contrast
  neutral: '#64748b',
};

export const KpiCard: React.FC<{ tile: KpiTile; onClick?: () => void }> = ({ tile, onClick }) => {
  const c = statusColor[tile.status || 'neutral'];
  const Icon =
    tile.status === 'positive' ? TrendingUp : tile.status === 'negative' ? TrendingDown : tile.status === 'warning' ? AlertTriangle : Minus;
  return (
    <div
      onClick={onClick}
      className={`liquid-card rounded-xl p-4 flex flex-col gap-1 min-w-0 relative group ${onClick ? 'cursor-pointer hover:border-red-400/50 hover:shadow-[0_0_0_1px_rgba(220,38,38,0.25)] transition-all' : ''}`}
    >
      {onClick && <Maximize2 size={12} className="absolute top-3 right-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
      <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-semibold truncate">
        {tile.label}
      </span>
      <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums leading-tight">{tile.value}</span>
      <div className="flex items-center gap-1.5 mt-0.5">
        {tile.delta && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: c }}>
            <Icon size={12} /> {tile.delta}
          </span>
        )}
        {tile.sublabel && <span className="text-[11px] text-slate-500 dark:text-slate-500 truncate">{tile.sublabel}</span>}
      </div>
    </div>
  );
};

export const ChartCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, className = '' }) => (
  <div className={`liquid-card rounded-xl p-4 ${className}`}>
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
    </div>
    {children}
  </div>
);

/** Recharts tooltip themed for both light and dark surfaces. */
export const DarkTooltip: React.FC<any> = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 dark:border-white/10 dark:bg-[#0b1220]/95 px-3 py-2 shadow-xl">
      {label !== undefined && <div className="text-xs font-semibold text-slate-900 dark:text-white mb-1">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-sm" style={{ background: p.color || p.fill }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}</span>
          <span className="text-slate-900 dark:text-white font-semibold tabular-nums ml-auto">
            {typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

const badgeStyles: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'rgba(208,59,59,0.15)', text: STATUS.critical, label: 'Critical' },
  low: { bg: 'rgba(180,83,9,0.15)', text: '#b45309', label: 'Low' },
  ok: { bg: 'rgba(12,163,12,0.15)', text: STATUS.good, label: 'OK' },
  below_safety: { bg: 'rgba(180,83,9,0.15)', text: '#b45309', label: 'Below Safety' },
  stockout: { bg: 'rgba(208,59,59,0.15)', text: STATUS.critical, label: 'Stock-out' },
  excess: { bg: 'rgba(194,83,32,0.15)', text: '#c25320', label: 'Excess' },
  overdue: { bg: 'rgba(208,59,59,0.15)', text: STATUS.critical, label: 'Overdue' },
  due_soon: { bg: 'rgba(180,83,9,0.15)', text: '#b45309', label: 'Due Soon' },
  on_track: { bg: 'rgba(12,163,12,0.15)', text: STATUS.good, label: 'On Track' },
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = badgeStyles[status] || { bg: 'rgba(100,116,139,0.15)', text: '#64748b', label: status };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.text }}
    >
      {(status === 'critical' || status === 'stockout' || status === 'overdue') && <AlertTriangle size={11} />}
      {s.label}
    </span>
  );
};

export const Loading: React.FC = () => (
  <div className="flex items-center justify-center py-32 text-slate-500 gap-2">
    <Loader2 size={18} className="animate-spin" /> Loading…
  </div>
);

export const PageHeader: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({
  title,
  subtitle,
  right,
}) => (
  <div className="flex items-end justify-between mb-5 px-1">
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {right}
  </div>
);
