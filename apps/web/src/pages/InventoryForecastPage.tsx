import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, Legend,
} from 'recharts';
import { MaterialForecast } from '@supplymind/shared';
import { Search } from 'lucide-react';
import { useForecastMis } from '../lib/misApi';
import { KpiCard, ChartCard, DarkTooltip, Loading, PageHeader, ExportBtn } from '../components/mis/kit';
import { DrillDown, ExplorerData } from '../components/mis/DataExplorer';
import { getCategorical, getChrome, STATUS } from '../lib/viz';
import { useTheme } from '../theme/ThemeProvider';

const th = 'py-2 font-semibold text-[11px] uppercase tracking-wider text-slate-500';
const rowBorder = 'border-b border-slate-200 dark:border-white/5 last:border-0';

const STATUS_META: Record<MaterialForecast['status'], { label: string; bg: string; text: string }> = {
  stockout_risk: { label: 'Stock-out risk', bg: 'rgba(208,59,59,0.15)', text: STATUS.critical },
  reorder: { label: 'Reorder now', bg: 'rgba(180,83,9,0.15)', text: '#b45309' },
  overstock: { label: 'Overstock', bg: 'rgba(194,83,32,0.15)', text: '#c25320' },
  ok: { label: 'Healthy', bg: 'rgba(12,163,12,0.15)', text: STATUS.good },
};

const ForecastBadge: React.FC<{ status: MaterialForecast['status'] }> = ({ status }) => {
  const s = STATUS_META[status];
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
};

// MAPE → accuracy quality colour (lower error = greener).
const mapeColor = (m: number) => (m <= 8 ? STATUS.good : m <= 15 ? '#b45309' : STATUS.critical);

const ExploreBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 rounded-md px-2 py-1 transition-colors" title="Search, filter & export">
    <Search size={12} /> Explore
  </button>
);

const REC_COLS = ['Material', 'Code', 'Category', 'Plant', 'Method', 'MAPE %', 'On-hand', 'Current Safety', 'Recommended Safety', 'Reorder Point', 'Lead Time (d)', 'Service Level %', 'Stock-out (days)', 'Recommended Order Qty', 'Status'];
const recRows = (list: MaterialForecast[]): (string | number)[][] =>
  list.map((m) => [m.material, m.code, m.category, m.plant, m.method, m.mape, m.currentStock, m.safetyStock, m.recommendedSafety, m.reorderPoint, m.leadTimeDays, m.serviceLevel, m.stockoutInDays ?? '—', m.recommendedOrderQty, STATUS_META[m.status].label]);

export const InventoryForecastPage: React.FC = () => {
  const { theme } = useTheme();
  const CHROME = getChrome(theme);
  const CAT = getCategorical(theme);
  const axisProps = {
    tick: { fill: CHROME.muted, fontSize: 11 },
    axisLine: { stroke: CHROME.axis },
    tickLine: { stroke: CHROME.axis },
  };
  const { data, isLoading } = useForecastMis();
  const [selected, setSelected] = useState(0);
  const [drill, setDrill] = useState<ExplorerData | null>(null);

  const materials = data?.materials ?? [];
  const active = materials[selected];

  const chartData = useMemo(
    () =>
      (active?.series ?? []).map((p) => ({
        period: p.period,
        actual: p.actual,
        forecast: p.forecast,
        range: p.band ? [p.band[0], p.band[1]] : undefined,
      })),
    [active],
  );

  if (isLoading) return <Loading />;
  if (!data || !materials.length)
    return (
      <div>
        <PageHeader title="Inventory Forecasting" subtitle="Demand forecast · safety-stock optimization · stock-out prediction" />
        <div className="liquid-card rounded-xl p-8 text-center text-slate-500">No forecast data available for this organization.</div>
      </div>
    );

  const openRecs = (title: string, list: MaterialForecast[]) => setDrill({ title, subtitle: 'AI-recommended safety stock vs SAP MARC — search, filter & export', columns: REC_COLS, rows: recRows(list) });
  const openSeries = () => setDrill({ title: `Demand Forecast · ${active.material}`, subtitle: `${active.method} · MAPE ${active.mape}% · history + 4-month forecast with 95% band`, columns: ['Period', `Actual (${active.uom})`, `Forecast (${active.uom})`, 'Band Low', 'Band High'], rows: active.series.map((p) => [p.period, p.actual ?? '—', p.forecast ?? '—', p.band ? p.band[0] : '—', p.band ? p.band[1] : '—']) });

  return (
    <div>
      <PageHeader
        title="Inventory Forecasting"
        subtitle="SAP MM · Demand planning — MSEG (consumption) → forecast · MARC (safety/ROP · dispo) · MARD (on-hand)"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {data.kpis.map((t) => <KpiCard key={t.label} tile={t} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Demand forecast with confidence band */}
        <ChartCard
          title="Demand Forecast"
          subtitle={`${active.material} (${active.code}) · ${active.method} · MAPE ${active.mape}% · shaded = 95% band · click chart to explore`}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5">
            {materials.map((m, i) => (
              <button
                key={m.code}
                onClick={() => setSelected(i)}
                className={`text-[11px] font-medium rounded-lg px-2.5 py-1 border transition-colors ${
                  i === selected
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white border-transparent'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {m.material}
              </button>
            ))}
          </div>
            <ExploreBtn onClick={openSeries} />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }} style={{ cursor: 'pointer' }} onClick={openSeries}>
              <CartesianGrid stroke={CHROME.grid} vertical={false} />
              <XAxis dataKey="period" {...axisProps} />
              <YAxis {...axisProps} width={52} />
              <Tooltip content={<DarkTooltip unit={active.uom} />} cursor={{ stroke: CHROME.axis }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="range"
                name="95% confidence"
                stroke="none"
                fill={CAT[1]}
                fillOpacity={0.18}
                isAnimationActive={false}
                connectNulls
                legendType="none"
              />
              <Line type="monotone" dataKey="actual" name="Actual" stroke={CHROME.textSecondary} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
              <Line type="monotone" dataKey="forecast" name="Forecast" stroke={CAT[1]} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2 }} isAnimationActive={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-center">
            <div className="rounded-lg bg-slate-50 dark:bg-white/5 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">On-hand</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{active.currentStock.toLocaleString('en-IN')} {active.uom}</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-white/5 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Reorder point</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{active.reorderPoint.toLocaleString('en-IN')}</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-white/5 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Lead time</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{active.leadTimeDays} days</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-white/5 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Stock-out in</div>
              <div className={`text-sm font-bold tabular-nums ${active.stockoutInDays !== null && active.stockoutInDays <= active.leadTimeDays ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                {active.stockoutInDays === null ? 'No risk' : `${active.stockoutInDays} days`}
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Forecast accuracy by category */}
        <ChartCard title="Forecast Accuracy by Category" subtitle="MAPE % — lower is better (target ≤ 8%) · click a bar for its materials">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.accuracyByCategory} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={CHROME.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} unit="%" />
              <YAxis type="category" dataKey="name" {...axisProps} width={92} />
              <Tooltip content={<DarkTooltip unit="% MAPE" />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
              <ReferenceLine x={8} stroke={STATUS.good} strokeDasharray="4 4" label={{ value: 'target', fill: STATUS.good, fontSize: 10, position: 'top' }} />
              <Bar dataKey="value" name="MAPE" radius={[0, 4, 4, 0]} isAnimationActive={false} cursor="pointer"
                onClick={(d: any) => openRecs(`Forecast · ${d?.name}`, materials.filter((m) => m.category === d?.name))}
                label={{ position: 'right', fill: CHROME.textSecondary, fontSize: 11, formatter: (v: number) => `${v}%` }}>
                {data.accuracyByCategory.map((d, i) => <Cell key={i} fill={mapeColor(d.value)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Safety-stock optimization & reorder recommendations */}
      <ChartCard
        title="Safety-Stock Optimization & Reorder Recommendations"
        subtitle="AI-recommended safety stock vs SAP MARC · reorder qty · service level"
      >
        <div className="flex justify-end gap-1.5 mb-2">
          <ExploreBtn onClick={() => openRecs('Safety-Stock & Reorder Recommendations', materials)} />
          <ExportBtn filename="forecast-recommendations" columns={REC_COLS} rows={recRows(materials)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left ${rowBorder}`}>
                <th className={`${th} pr-3`}>Material</th>
                <th className={`${th} px-3`}>Method</th>
                <th className={`${th} px-3 text-right`}>MAPE</th>
                <th className={`${th} px-3 text-right`}>On-hand</th>
                <th className={`${th} px-3 text-right`}>Safety (SAP → Rec.)</th>
                <th className={`${th} px-3 text-right`}>ROP</th>
                <th className={`${th} px-3 text-right`}>Svc %</th>
                <th className={`${th} px-3 text-right`}>Order Qty</th>
                <th className={`${th} pl-3`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.code} className={`${rowBorder} hover:bg-slate-100/60 dark:hover:bg-white/[0.02] cursor-pointer`} onClick={() => openRecs(`Forecast · ${m.category}`, materials.filter((x) => x.category === m.category))}>
                  <td className="py-2 pr-3">
                    <div className="text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{m.material}</div>
                    <div className="text-[10px] text-slate-500">{m.code} · {m.plant} · {m.category}</div>
                  </td>
                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{m.method}</td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold" style={{ color: mapeColor(m.mape) }}>{m.mape}%</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{m.currentStock.toLocaleString('en-IN')} {m.uom}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {m.safetyStock.toLocaleString('en-IN')}
                    <span className="text-slate-400 dark:text-slate-600"> → </span>
                    <span className={m.recommendedSafety > m.safetyStock ? 'text-red-600 dark:text-red-400' : m.recommendedSafety < m.safetyStock ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                      {m.recommendedSafety.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{m.reorderPoint.toLocaleString('en-IN')}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{m.serviceLevel}%</td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                    {m.recommendedOrderQty > 0 ? m.recommendedOrderQty.toLocaleString('en-IN') : '—'}
                  </td>
                  <td className="py-2 pl-3"><ForecastBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
          Recommended safety stock = z(service level) × σ(demand) × √(lead time). Reorder point = avg demand × lead time + safety stock.
          Figures are model-generated on sample consumption history for demonstration.
        </p>
      </ChartCard>

      <DrillDown data={drill} onClose={() => setDrill(null)} />
    </div>
  );
};
