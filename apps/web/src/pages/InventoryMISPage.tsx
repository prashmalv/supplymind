import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell,
} from 'recharts';
import { useInventoryMis } from '../lib/misApi';
import { KpiCard, ChartCard, DarkTooltip, StatusBadge, Loading, PageHeader, ExportBtn } from '../components/mis/kit';
import { FilterBar } from '../components/mis/FilterBar';
import { KpiDetailModal, KpiDetail } from '../components/mis/KpiDetailModal';
import { filterInventory, Period } from '../lib/filters';
import { getCategorical, getChrome, STATUS, moneyUnit } from '../lib/viz';
import { useTheme } from '../theme/ThemeProvider';

const classColor: Record<string, string> = { V: STATUS.critical, E: '#b45309', D: '#0ca30c', F: '#0ca30c', S: '#b45309', N: STATUS.critical };

const coalColor = (s: string) => (s === 'critical' ? STATUS.critical : s === 'low' ? '#eda100' : STATUS.good);

// Sequential blue ramp for the ABC/XYZ value heatmap.
const SEQ = ['#0d366b', '#184f95', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4'];
function seqColor(v: number, max: number) {
  if (max <= 0) return SEQ[0];
  const idx = Math.min(SEQ.length - 1, Math.floor((v / max) * SEQ.length));
  return SEQ[idx];
}

const th = 'py-2 font-semibold text-[11px] uppercase tracking-wider text-slate-500';
const rowBorder = 'border-b border-slate-200 dark:border-white/5 last:border-0';

export const InventoryMISPage: React.FC = () => {
  const { theme } = useTheme();
  const CHROME = getChrome(theme);
  const CAT = getCategorical(theme);
  const axisProps = {
    tick: { fill: CHROME.muted, fontSize: 11 },
    axisLine: { stroke: CHROME.axis },
    tickLine: { stroke: CHROME.axis },
  };
  const { data: raw, isLoading } = useInventoryMis();
  const [plant, setPlant] = useState('All Plants');
  const [period, setPeriod] = useState<Period>('Yearly');
  const [detail, setDetail] = useState<KpiDetail | null>(null);
  const plants = useMemo(() => raw ? ['All Plants', ...Array.from(new Set(raw.items.map((i) => i.plant)))] : ['All Plants'], [raw]);
  const data = useMemo(() => (raw ? filterInventory(raw, plant, period) : null), [raw, plant, period]);
  if (isLoading || !data) return <Loading />;
  const items = data.items;
  const criticalSpares = data.criticalSpares;
  const deadStockItems = data.deadStock?.items;
  const unit = moneyUnit(data.currency);
  const money = (v: number) => `${data.currency === 'INR' ? '₹' : '$'}${v.toLocaleString('en-IN')}${data.currency === 'INR' ? ' Cr' : 'M'}`;

  const detailFor = (tile: typeof data.kpis[number]): KpiDetail => {
    const l = tile.label.toLowerCase();
    if (l.includes('coal stock') && data.coalStockByPlant.length) return { tile, note: 'Coal stock days by plant (CEA critical norm ≥ 12 days).', columns: ['Plant', 'Coal Stock (days)', 'Daily Req (MT)', 'Status'], rows: data.coalStockByPlant.map((c) => [c.plant, c.coalStockDays, c.dailyRequirementMT, c.status]) };
    if (l.includes('below safety')) { const below = items.filter((i) => i.status === 'below_safety' || i.status === 'stockout'); return { tile, note: 'Items at or below safety stock.', columns: ['Material', 'Plant', 'On-hand', 'Safety', 'Status'], rows: below.map((i) => [i.material, i.plant, `${i.onHand} ${i.uom}`, i.safetyStock, i.status]) }; }
    if (l.includes('excess') || l.includes('obsolete')) return { tile, note: 'Dead / non-moving stock (no movement > 12 months).', columns: ['Material', 'Plant', `Value (${unit})`, 'Months No Movement'], rows: (deadStockItems || []).map((d) => [d.material, d.plant, d.value, d.monthsNoMovement]) };
    if (l.includes('days of supply')) return { tile, note: 'Days of supply by material.', columns: ['Material', 'Plant', 'Days of Supply', `Value (${unit})`], rows: items.map((i) => [i.material, i.plant, i.daysOfSupply, i.value]) };
    // Inventory value / turnover / default → category breakdown
    return { tile, note: `Inventory value by category (${unit}).`, columns: ['Category', `Value (${unit})`], rows: data.valueByCategory.map((c) => [c.name, c.value]) };
  };

  const abcMax = Math.max(...data.abcXyz.map((c) => c.value), 1);
  const cellOf = (r: string, c: string) => data.abcXyz.find((x) => x.cell === `${r}${c}`);

  return (
    <div>
      <PageHeader title="Inventory MIS" subtitle="SAP MM · Stock & Valuation — MARD · MARC · MBEW · MKPF/MSEG · MARA" />

      <FilterBar plants={plants} plant={plant} onPlant={setPlant} period={period} onPeriod={(v) => setPeriod(v as Period)} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {data.kpis.map((t) => <KpiCard key={t.label} tile={t} onClick={() => setDetail(detailFor(t))} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {data.coalStockByPlant.length > 0 && (
          <ChartCard title="Coal Stock Days by Plant" subtitle="SAP MARD.LABST ÷ MSEG GI · vs CEA norm (12 days)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.coalStockByPlant} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHROME.grid} vertical={false} />
                <XAxis dataKey="plant" {...axisProps} />
                <YAxis {...axisProps} width={36} />
                <Tooltip content={<DarkTooltip unit="days" />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
                <ReferenceLine y={12} stroke={STATUS.critical} strokeDasharray="4 4" label={{ value: 'CEA norm', fill: STATUS.critical, fontSize: 10, position: 'insideTopRight' }} />
                <Bar dataKey="coalStockDays" name="Coal stock" radius={[4, 4, 0, 0]} isAnimationActive={false} label={{ position: 'top', fill: CHROME.textSecondary, fontSize: 11 }}>
                  {data.coalStockByPlant.map((d, i) => <Cell key={i} fill={coalColor(d.status)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: STATUS.critical }} /> Critical</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#eda100' }} /> Low</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: STATUS.good }} /> OK</span>
            </div>
          </ChartCard>
        )}

        <ChartCard title="Inventory Value by Category" subtitle={`(${unit})`} className={data.coalStockByPlant.length ? '' : 'lg:col-span-2'}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.valueByCategory} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={CHROME.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="name" {...axisProps} width={110} />
              <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
              <Bar dataKey="value" name="Value" fill={CAT[0]} radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: 'right', fill: CHROME.textSecondary, fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <ChartCard title="Inventory Aging" subtitle={`Non-coal stock value (${unit})`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.agingBuckets} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={CHROME.grid} vertical={false} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} width={40} />
              <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
              <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {data.agingBuckets.map((_, i) => <Cell key={i} fill={SEQ[Math.min(SEQ.length - 1, i + 2)]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="ABC / XYZ Classification" subtitle="Count & value (₹ Cr) — darker = higher value">
          <div className="grid grid-cols-4 gap-1 text-center text-xs">
            <div />
            {['X (stable)', 'Y (variable)', 'Z (erratic)'].map((h) => (
              <div key={h} className="text-[10px] text-slate-500 pb-1">{h}</div>
            ))}
            {['A', 'B', 'C'].map((r) => (
              <React.Fragment key={r}>
                <div className="text-[10px] text-slate-500 flex items-center justify-center">
                  {r === 'A' ? 'A (high)' : r === 'B' ? 'B (med)' : 'C (low)'}
                </div>
                {['X', 'Y', 'Z'].map((c) => {
                  const cell = cellOf(r, c);
                  const v = cell?.value ?? 0;
                  return (
                    <div key={c} className="rounded-md py-3 border border-black/5 dark:border-white/5" style={{ background: seqColor(v, abcMax) }}>
                      <div className="text-white font-bold tabular-nums">{cell?.count ?? 0}</div>
                      <div className="text-[10px] text-white/70 tabular-nums">₹{v} Cr</div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Inventory trend + VED + FSN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {data.inventoryTrend && (
          <ChartCard title="Inventory Trend" subtitle={`Total value (${unit})`}>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={data.inventoryTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHROME.grid} vertical={false} />
                <XAxis dataKey="period" {...axisProps} />
                <YAxis {...axisProps} width={44} domain={['dataMin - 40', 'dataMax + 20']} />
                <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ stroke: CHROME.axis }} />
                <Line type="monotone" dataKey="value" name="Inventory" stroke={CAT[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {data.ved && (
          <ChartCard title="VED Analysis" subtitle="Vital / Essential / Desirable">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={data.ved} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHROME.grid} vertical={false} />
                <XAxis dataKey="cell" {...axisProps} tickFormatter={(c) => ({ V: 'Vital', E: 'Essential', D: 'Desirable' } as any)[c] || c} />
                <YAxis {...axisProps} width={40} />
                <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
                <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {data.ved.map((d, i) => <Cell key={i} fill={classColor[d.cell] || CAT[0]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {data.fsn && (
          <ChartCard title="FSN Analysis" subtitle="Fast / Slow / Non-moving">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={data.fsn} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHROME.grid} vertical={false} />
                <XAxis dataKey="cell" {...axisProps} tickFormatter={(c) => ({ F: 'Fast', S: 'Slow', N: 'Non-moving' } as any)[c] || c} />
                <YAxis {...axisProps} width={40} />
                <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
                <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {data.fsn.map((d, i) => <Cell key={i} fill={classColor[d.cell] || CAT[0]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Critical spares + Dead stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {criticalSpares && (
          <ChartCard title="Critical Spare & Stock-out Monitoring" subtitle="Vital spares at risk">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-left ${rowBorder}`}>
                    <th className={`${th} pr-3`}>Material</th>
                    <th className={`${th} px-3`}>Plant</th>
                    <th className={`${th} px-3 text-right`}>On-hand</th>
                    <th className={`${th} px-3 text-right`}>Days Cover</th>
                    <th className={`${th} pl-3`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalSpares.map((s) => (
                    <tr key={s.code} className={rowBorder}>
                      <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">
                        <div className="truncate max-w-[170px]">{s.material}</div>
                        <div className="text-[10px] text-slate-500">{s.code}</div>
                      </td>
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{s.plant}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{s.onHand}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{s.daysCover}d</td>
                      <td className="py-2 pl-3"><StatusBadge status={s.status === 'critical' ? 'critical' : s.status === 'watch' ? 'below_safety' : 'ok'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )}
        {data.deadStock && (
          <ChartCard title="Dead / Non-Moving Stock" subtitle={`${data.deadStock.totalValue} · no movement > 12 months`}>
            <div className="flex justify-end mb-2"><ExportBtn filename="dead-stock" columns={['Material', 'Code', 'Plant', 'Value', 'Months No Movement']} rows={(deadStockItems || []).map((d) => [d.material, d.code, d.plant, d.value, d.monthsNoMovement])} /></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-left ${rowBorder}`}>
                    <th className={`${th} pr-3`}>Material</th>
                    <th className={`${th} px-3`}>Plant</th>
                    <th className={`${th} px-3 text-right`}>Value</th>
                    <th className={`${th} pl-3 text-right`}>No Movement</th>
                  </tr>
                </thead>
                <tbody>
                  {(deadStockItems || []).map((d) => (
                    <tr key={d.code} className={rowBorder}>
                      <td className="py-2 pr-3 text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{d.material}</td>
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{d.plant}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{money(d.value)}</td>
                      <td className="py-2 pl-3 text-right tabular-nums text-red-600 dark:text-red-400">{d.monthsNoMovement} mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )}
      </div>

      {/* Scrap */}
      {data.scrap && (
        <ChartCard title="Scrap Details" subtitle="Opening · Receipt · Sale · Closing" className="mb-5">
          <div className="flex justify-end mb-2"><ExportBtn filename="scrap" columns={['Material', 'Opening', 'Receipt', 'Sale', 'Closing', 'Value']} rows={data.scrap.map((s) => [s.material, s.opening, s.receipt, s.sale, s.closing, s.value])} /></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left ${rowBorder}`}>
                  <th className={`${th} pr-3`}>Material</th>
                  <th className={`${th} px-3 text-right`}>Opening</th>
                  <th className={`${th} px-3 text-right`}>Receipt</th>
                  <th className={`${th} px-3 text-right`}>Sale</th>
                  <th className={`${th} px-3 text-right`}>Closing</th>
                  <th className={`${th} pl-3 text-right`}>Value</th>
                </tr>
              </thead>
              <tbody>
                {data.scrap.map((s) => (
                  <tr key={s.material} className={rowBorder}>
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">{s.material}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{s.opening.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{s.receipt.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{s.sale.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{s.closing.toLocaleString('en-IN')}</td>
                    <td className="py-2 pl-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{money(s.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      <ChartCard title="Stock Items" subtitle="SAP MARD (stock) · MARC (safety/ROP) · MBEW (value) · exceptions flagged">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left ${rowBorder}`}>
                <th className={`${th} pr-3`}>Material</th>
                <th className={`${th} px-3`}>Plant</th>
                <th className={`${th} px-3 text-right`}>On-hand</th>
                <th className={`${th} px-3 text-right`}>Safety</th>
                <th className={`${th} px-3 text-right`}>DoS</th>
                <th className={`${th} px-3 text-center`}>ABC/XYZ</th>
                <th className={`${th} px-3 text-right`}>Value</th>
                <th className={`${th} pl-3`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.code + it.plant} className={`${rowBorder} hover:bg-slate-100/60 dark:hover:bg-white/[0.02]`}>
                  <td className="py-2 pr-3">
                    <div className="text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{it.material}</div>
                    <div className="text-[10px] text-slate-500">{it.code} · {it.category}</div>
                  </td>
                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{it.plant}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{it.onHand.toLocaleString('en-IN')} {it.uom}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{it.safetyStock.toLocaleString('en-IN')}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{it.daysOfSupply}d</td>
                  <td className="py-2 px-3 text-center tabular-nums text-slate-500 dark:text-slate-400">{it.abcClass}{it.xyzClass}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{money(it.value)}</td>
                  <td className="py-2 pl-3"><StatusBadge status={it.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <KpiDetailModal detail={detail} onClose={() => setDetail(null)} />
    </div>
  );
};
