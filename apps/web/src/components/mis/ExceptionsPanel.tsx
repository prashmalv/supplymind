import React, { useState } from 'react';
import { AlertTriangle, Info, CheckCircle2, ChevronDown } from 'lucide-react';
import { useMisAlerts } from '../../lib/misApi';
import { AlertActions } from './AlertActions';
import { STATUS } from '../../lib/viz';

/** Collapsible Exceptions & Recommendations with per-alert AI actions.
 *  Default collapsed so dashboard stats stay above the fold; the header shows a
 *  severity summary so it's useful even when closed. */
export const ExceptionsPanel: React.FC = () => {
  const { data: alerts } = useMisAlerts();
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem('sm_exceptions_open') === '1'; } catch { return false; }
  });
  if (!alerts || alerts.length === 0) return null;

  const toggle = () => setOpen((o) => { const n = !o; try { localStorage.setItem('sm_exceptions_open', n ? '1' : '0'); } catch { /* */ } return n; });
  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info' || a.severity === 'success').length,
  };

  return (
    <div className="liquid-card rounded-xl mb-5 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
        aria-expanded={open}
      >
        <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Exceptions &amp; Recommendations</div>
          <div className="text-[11px] text-slate-500">AI-driven alerts across procurement &amp; inventory</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {counts.critical > 0 && <span className="text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ color: STATUS.critical, background: `${STATUS.critical}1f` }}>{counts.critical} critical</span>}
          {counts.warning > 0 && <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 text-amber-600 dark:text-amber-400 bg-amber-500/15">{counts.warning} warning</span>}
          {counts.info > 0 && <span className="hidden sm:inline text-[11px] font-semibold rounded-full px-2 py-0.5 text-slate-500 bg-slate-500/15">{counts.info} info</span>}
          <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-200 dark:border-white/5">
          {alerts.slice(0, 6).map((a) => {
            const color =
              a.severity === 'critical' ? STATUS.critical : a.severity === 'warning' ? '#b45309' : a.severity === 'success' ? STATUS.good : '#64748b';
            const Icon = a.severity === 'success' ? CheckCircle2 : a.severity === 'info' ? Info : AlertTriangle;
            return (
              <div key={a.id} className="flex gap-3 p-3 rounded-lg bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                <Icon size={16} style={{ color }} className="mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{a.title}</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color, background: `${color}22` }}>{a.category}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{a.message}</p>
                  {a.recommendation && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1"><span className="text-slate-500">Action: </span>{a.recommendation}</p>
                  )}
                  <AlertActions alert={a} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
