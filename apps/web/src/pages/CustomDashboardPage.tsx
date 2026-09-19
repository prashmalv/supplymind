import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend,
} from 'recharts';
import {
  Plus, X, ChevronUp, ChevronDown, Maximize2, Minimize2, Sparkles, Loader2, LayoutDashboard, Download, FileSpreadsheet, Trash2,
} from 'lucide-react';
import { useProcurementMis, useInventoryMis, useForecastMis } from '../lib/misApi';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../theme/ThemeProvider';
import { getCategorical, getChrome } from '../lib/viz';
import { DarkTooltip, KpiCard, PageHeader } from '../components/mis/kit';
import { exportCsv, exportXlsx } from '../lib/exportData';
import { DashWidget, ChartSpec, ReportSpec, loadDashboard, saveDashboard, uid } from '../lib/dashboardStore';
import { geminiService } from '../../services/geminiService';

type Cat = 'Procurement' | 'Inventory' | 'Forecasting';
interface CatalogDef { id: string; title: string; category: Cat; kind: 'kpi' | 'bar' | 'bar2' | 'line' | 'table'; }

const CATALOG: CatalogDef[] = [
  { id: 'proc-kpis', title: 'Procurement KPIs', category: 'Procurement', kind: 'kpi' },
  { id: 'spend-by-category', title: 'Spend by Category', category: 'Procurement', kind: 'bar' },
  { id: 'budget-vs-actual', title: 'Budget vs Actual', category: 'Procurement', kind: 'bar2' },
  { id: 'monthly-spend', title: 'Monthly Spend Trend', category: 'Procurement', kind: 'line' },
  { id: 'on-time-vendor', title: 'On-time % by Vendor', category: 'Procurement', kind: 'bar' },
  { id: 'open-pos', title: 'Open Purchase Orders', category: 'Procurement', kind: 'table' },
  { id: 'top-vendors', title: 'Top Vendors', category: 'Procurement', kind: 'table' },
  { id: 'contract-expiry', title: 'Contract Expiry', category: 'Procurement', kind: 'table' },
  { id: 'inv-kpis', title: 'Inventory KPIs', category: 'Inventory', kind: 'kpi' },
  { id: 'coal-stock', title: 'Coal Stock Days by Plant', category: 'Inventory', kind: 'bar' },
  { id: 'inv-value-category', title: 'Inventory Value by Category', category: 'Inventory', kind: 'bar' },
  { id: 'critical-spares', title: 'Critical Spares', category: 'Inventory', kind: 'table' },
  { id: 'dead-stock', title: 'Dead / Non-moving Stock', category: 'Inventory', kind: 'table' },
  { id: 'forecast-accuracy', title: 'Forecast Accuracy by Category', category: 'Forecasting', kind: 'bar' },
];

const CARD = 'liquid-card rounded-xl p-4';
const th = 'py-1.5 px-2 font-semibold text-[10px] uppercase tracking-wider text-slate-500 whitespace-nowrap';

export const CustomDashboardPage: React.FC = () => {
  const { currentOrgId } = useAuth();
  const { theme } = useTheme();
  const CHROME = getChrome(theme);
  const CAT = getCategorical(theme);
  const axis = { tick: { fill: CHROME.muted, fontSize: 11 }, axisLine: { stroke: CHROME.axis }, tickLine: { stroke: CHROME.axis } };

  const { data: proc } = useProcurementMis();
  const { data: inv } = useInventoryMis();
  const { data: fc } = useForecastMis();

  const [widgets, setWidgets] = useState<DashWidget[]>(() => loadDashboard(currentOrgId || 'default'));
  const [panelOpen, setPanelOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState('');

  const persist = (next: DashWidget[]) => { setWidgets(next); saveDashboard(currentOrgId || 'default', next); };
  const addCatalog = (c: CatalogDef) => persist([...widgets, { id: uid(), kind: 'catalog', catalogId: c.id, title: c.title, width: c.kind === 'kpi' || c.kind === 'table' ? 'full' : 'half' }]);
  const remove = (id: string) => persist(widgets.filter((w) => w.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const i = widgets.findIndex((w) => w.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= widgets.length) return;
    const next = [...widgets];
    [next[i], next[j]] = [next[j], next[i]];
    persist(next);
  };
  const toggleWidth = (id: string) => persist(widgets.map((w) => (w.id === id ? { ...w, width: w.width === 'full' ? 'half' : 'full' } : w)));
  const clearAll = () => { if (confirm('Remove all widgets from your dashboard?')) persist([]); };

  const askAi = async () => {
    if (!aiText.trim() || aiBusy) return;
    setAiBusy(true); setAiErr('');
    try {
      const prompt = `Create ONE dashboard widget for this request: "${aiText.trim()}". Respond with ONLY a single fenced code block — either \`\`\`chart (bar for comparisons, line for trends) or \`\`\`report (for a tabular list) — using the real data catalog. No prose before or after.`;
      const resp = await geminiService.getChatResponse([], prompt);
      const m = resp.match(/```(chart|report)\s*([\s\S]*?)```/);
      if (!m) { setAiErr('Could not build a widget from that. Try naming a metric, comparison or list.'); return; }
      const spec = JSON.parse(m[2].trim());
      if (m[1] === 'chart' && Array.isArray(spec.data)) {
        persist([...widgets, { id: uid(), kind: 'chart', title: spec.title || 'Custom chart', width: 'half', chartSpec: spec as ChartSpec }]);
      } else if (m[1] === 'report' && Array.isArray(spec.columns)) {
        persist([...widgets, { id: uid(), kind: 'report', title: spec.title || 'Custom report', width: 'full', reportSpec: spec as ReportSpec }]);
      } else { setAiErr('The AI returned an unexpected format. Please try rephrasing.'); return; }
      setAiText('');
    } catch {
      setAiErr('Widget generation is unavailable right now. Please try again.');
    } finally {
      setAiBusy(false);
    }
  };

  // ---- generic renderers ----
  const BarW = (data: { name: string; value: number }[], unit?: string, horizontal = false) => (
    <ResponsiveContainer width="100%" height={230}>
      {horizontal ? (
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={CHROME.grid} horizontal={false} />
          <XAxis type="number" {...axis} />
          <YAxis type="category" dataKey="name" {...axis} width={110} />
          <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
          <Bar dataKey="value" name={unit || 'Value'} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((_, i) => <Cell key={i} fill={CAT[i % CAT.length]} />)}
          </Bar>
        </BarChart>
      ) : (
        <BarChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHROME.grid} vertical={false} />
          <XAxis dataKey="name" {...axis} interval={0} angle={data.length > 5 ? -20 : 0} textAnchor={data.length > 5 ? 'end' : 'middle'} height={data.length > 5 ? 50 : 30} />
          <YAxis {...axis} width={40} />
          <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
          <Bar dataKey="value" name={unit || 'Value'} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((_, i) => <Cell key={i} fill={CAT[i % CAT.length]} />)}
          </Bar>
        </BarChart>
      )}
    </ResponsiveContainer>
  );

  const LineW = (data: any[], keys: { key: string; label: string }[]) => (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHROME.grid} vertical={false} />
        <XAxis dataKey="period" {...axis} />
        <YAxis {...axis} width={44} />
        <Tooltip content={<DarkTooltip />} cursor={{ stroke: CHROME.axis }} />
        {keys.map((k, i) => <Line key={k.key} type="monotone" dataKey={k.key} name={k.label} stroke={CAT[i % CAT.length]} strokeWidth={2} dot={false} isAnimationActive={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );

  const Bar2W = (data: any[], keys: { key: string; label: string }[]) => (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHROME.grid} vertical={false} />
        <XAxis dataKey="period" {...axis} />
        <YAxis {...axis} width={44} />
        <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {keys.map((k, i) => <Bar key={k.key} dataKey={k.key} name={k.label} fill={i === 0 ? CHROME.muted : CAT[0]} radius={[3, 3, 0, 0]} isAnimationActive={false} />)}
      </BarChart>
    </ResponsiveContainer>
  );

  const TableW = (columns: string[], rows: (string | number)[][], name = 'widget') => (
    <div>
      <div className="flex justify-end gap-1.5 mb-1.5">
        <button onClick={() => exportCsv(name, columns, rows)} className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-white/10"><Download size={11} /> CSV</button>
        <button onClick={() => exportXlsx(name, columns, rows)} className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded px-1.5 py-0.5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><FileSpreadsheet size={11} /> Excel</button>
      </div>
      <div className="overflow-x-auto max-h-64 rounded-lg border border-slate-200 dark:border-white/10">
        <table className="w-full text-xs">
          <thead className="sticky top-0"><tr className="bg-slate-100/90 dark:bg-[#0b1220]/95">{columns.map((c, i) => <th key={i} className={`${th} text-left`}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-t border-slate-200 dark:border-white/5">
                {r.map((c, ci) => <td key={ci} className={`px-2 py-1.5 whitespace-nowrap ${typeof c === 'number' ? 'text-right tabular-nums text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-200'}`}>{typeof c === 'number' ? c.toLocaleString('en-IN') : c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCatalog = (id?: string): React.ReactNode => {
    switch (id) {
      case 'proc-kpis':
        return proc ? <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{proc.kpis.map((t) => <KpiCard key={t.label} tile={t} />)}</div> : null;
      case 'inv-kpis':
        return inv ? <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{inv.kpis.map((t) => <KpiCard key={t.label} tile={t} />)}</div> : null;
      case 'spend-by-category':
        return proc ? BarW(proc.spendByCategory, '₹ Cr') : null;
      case 'budget-vs-actual':
        return proc?.budgetVsActual ? Bar2W(proc.budgetVsActual, [{ key: 'budget', label: 'Budget' }, { key: 'actual', label: 'Actual' }]) : null;
      case 'monthly-spend':
        return proc?.monthlySpend ? LineW(proc.monthlySpend.map((m: any) => ({ period: m.period, total: (proc.monthlySpendSeries || []).reduce((s: number, k: any) => s + (m[k.key] || 0), 0) })), [{ key: 'total', label: 'Total spend (₹ Cr)' }]) : null;
      case 'on-time-vendor':
        return proc ? BarW(proc.onTimeByVendor, '%') : null;
      case 'coal-stock':
        return inv ? BarW(inv.coalStockByPlant.map((c) => ({ name: c.plant, value: c.coalStockDays })), 'days') : null;
      case 'inv-value-category':
        return inv ? BarW(inv.valueByCategory, '₹ Cr', true) : null;
      case 'forecast-accuracy':
        return fc ? BarW(fc.accuracyByCategory, '% MAPE', true) : null;
      case 'open-pos':
        return proc ? TableW(['PO No', 'Vendor', 'Material', 'Plant', 'Value (₹ Cr)', 'Overdue (d)'], proc.openPos.map((p) => [p.poNumber, p.vendor, p.material, p.plant, p.value, p.daysOverdue]), 'open-pos') : null;
      case 'top-vendors':
        return proc ? TableW(['Vendor', 'Category', 'Spend (₹ Cr)', 'On-time %', 'Reliability'], proc.topVendors.map((v) => [v.vendor, v.category, v.spend, v.onTimePct, v.reliability]), 'top-vendors') : null;
      case 'contract-expiry':
        return proc?.contractExpiry ? TableW(['Contract', 'Vendor', 'Expiry', 'Days Left', 'Value (₹ Cr)'], proc.contractExpiry.map((c) => [c.contract, c.vendor, c.expiryDate, c.daysLeft, c.value]), 'contract-expiry') : null;
      case 'critical-spares':
        return inv?.criticalSpares ? TableW(['Material', 'Plant', 'On-hand', 'Days Cover', 'Status'], inv.criticalSpares.map((s) => [s.material, s.plant, s.onHand, s.daysCover, s.status]), 'critical-spares') : null;
      case 'dead-stock':
        return inv?.deadStock ? TableW(['Material', 'Plant', 'Value (₹ Cr)', 'Months No Movement'], inv.deadStock.items.map((d) => [d.material, d.plant, d.value, d.monthsNoMovement]), 'dead-stock') : null;
      default:
        return <div className="text-xs text-slate-400">Loading…</div>;
    }
  };

  const renderWidget = (w: DashWidget): React.ReactNode => {
    if (w.kind === 'catalog') return renderCatalog(w.catalogId);
    if (w.kind === 'chart' && w.chartSpec) {
      const s = w.chartSpec;
      return s.type === 'line' ? LineW(s.data.map((d) => ({ period: d.name, value: d.value })), [{ key: 'value', label: s.unit || 'Value' }]) : BarW(s.data, s.unit);
    }
    if (w.kind === 'report' && w.reportSpec) return TableW(w.reportSpec.columns, w.reportSpec.rows, w.reportSpec.filename || 'report');
    return null;
  };

  const grouped = useMemo(() => {
    const g: Record<string, CatalogDef[]> = {};
    CATALOG.forEach((c) => { (g[c.category] ||= []).push(c); });
    return g;
  }, []);

  return (
    <div>
      <PageHeader
        title="My Dashboard"
        subtitle="Your personalised board — add widgets, pin AI answers, arrange & export. Saved for your organisation."
        right={
          <div className="flex items-center gap-2">
            {widgets.length > 0 && (
              <button onClick={clearAll} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5"><Trash2 size={14} /> Clear</button>
            )}
            <button onClick={() => setPanelOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-red-500 rounded-lg px-3 py-1.5 hover:shadow-[0_2px_12px_rgba(220,38,38,0.4)]"><Plus size={14} /> Add widget</button>
          </div>
        }
      />

      {/* AI describe-a-widget */}
      <div className="liquid-card rounded-xl p-3 mb-5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-red-500 flex-shrink-0" />
          <input
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') askAi(); }}
            placeholder="Describe a widget in plain words — e.g. 'chart of coal stock days by plant' or 'table of overdue POs'"
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
          />
          <button onClick={askAi} disabled={aiBusy || !aiText.trim()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-800 dark:bg-white/10 rounded-lg px-3 py-1.5 disabled:opacity-50">
            {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Build
          </button>
        </div>
        {aiErr && <p className="text-[11px] text-red-500 mt-1.5 pl-6">{aiErr}</p>}
      </div>

      {widgets.length === 0 ? (
        <div className="liquid-card rounded-xl p-12 text-center">
          <LayoutDashboard size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Your dashboard is empty</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Add widgets from the catalog, describe one above, or pin a chart/report from the Knowledge Bot.</p>
          <button onClick={() => setPanelOpen(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-red-500 rounded-lg px-4 py-2"><Plus size={14} /> Add your first widget</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {widgets.map((w, i) => (
            <div key={w.id} className={`${CARD} group relative ${w.width === 'full' ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{w.title}</h3>
                <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => move(w.id, -1)} disabled={i === 0} title="Move up" className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30"><ChevronUp size={15} /></button>
                  <button onClick={() => move(w.id, 1)} disabled={i === widgets.length - 1} title="Move down" className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30"><ChevronDown size={15} /></button>
                  <button onClick={() => toggleWidth(w.id)} title={w.width === 'full' ? 'Make half width' : 'Make full width'} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">{w.width === 'full' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>
                  <button onClick={() => remove(w.id)} title="Remove" className="p-1 text-slate-400 hover:text-red-500"><X size={15} /></button>
                </div>
              </div>
              {renderWidget(w)}
            </div>
          ))}
        </div>
      )}

      {/* Add-widget side panel */}
      {panelOpen && (
        <>
          <div onClick={() => setPanelOpen(false)} className="fixed inset-0 bg-black/40 z-40" />
          <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] z-50 bg-white dark:bg-[#070c1a] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 dark:border-white/10">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Widget catalog</h3>
              <button onClick={() => setPanelOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {Object.entries(grouped).map(([cat, defs]) => (
                <div key={cat}>
                  <div className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600 font-semibold px-1 pb-1.5">{cat}</div>
                  <div className="space-y-1.5">
                    {defs.map((c) => (
                      <button key={c.id} onClick={() => addCatalog(c)} className="w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <span className="text-xs text-slate-700 dark:text-slate-200">{c.title}</span>
                        <Plus size={14} className="text-slate-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-white/10 text-[11px] text-slate-400">Tip: pin charts & reports straight from the Knowledge Bot.</div>
          </div>
        </>
      )}
    </div>
  );
};
