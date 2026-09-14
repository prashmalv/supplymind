import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Cell,
} from 'recharts';
import { useProcurementMis } from '../lib/misApi';
import { KpiCard, ChartCard, DarkTooltip, StatusBadge, Loading, PageHeader, ExportBtn } from '../components/mis/kit';
import { FilterBar } from '../components/mis/FilterBar';
import { ExceptionsPanel } from '../components/mis/ExceptionsPanel';
import { KpiDetailModal, KpiDetail } from '../components/mis/KpiDetailModal';
import { filterProcurement, Period } from '../lib/filters';
import { getCategorical, getChrome, moneyUnit, STATUS } from '../lib/viz';
import { useTheme } from '../theme/ThemeProvider';

const DEFAULT_SPEND_SERIES = [
  { key: 'coal', label: 'Category 1' },
  { key: 'spares', label: 'Category 2' },
  { key: 'chemicals', label: 'Category 3' },
  { key: 'fuel', label: 'Category 4' },
  { key: 'services', label: 'Category 5' },
];

const th = 'py-2 font-semibold text-[11px] uppercase tracking-wider text-slate-500';
const rowBorder = 'border-b border-slate-200 dark:border-white/5 last:border-0';

export const ProcurementMISPage: React.FC = () => {
  const { theme } = useTheme();
  const CHROME = getChrome(theme);
  const CAT = getCategorical(theme);
  const axisProps = {
    tick: { fill: CHROME.muted, fontSize: 11 },
    axisLine: { stroke: CHROME.axis },
    tickLine: { stroke: CHROME.axis },
  };
  const { data: raw, isLoading } = useProcurementMis();
  const [plant, setPlant] = useState('All Plants');
  const [period, setPeriod] = useState<Period>('Yearly');
  const [detail, setDetail] = useState<KpiDetail | null>(null);
  const plants = useMemo(() => raw ? ['All Plants', ...Array.from(new Set(raw.openPos.map((p) => p.plant)))] : ['All Plants'], [raw]);
  const data = useMemo(() => (raw ? filterProcurement(raw, plant, period) : null), [raw, plant, period]);
  if (isLoading || !data) return <Loading />;
  const openPos = data.openPos;
  const unit = moneyUnit(data.currency);
  const spendSeries = data.monthlySpendSeries?.length ? data.monthlySpendSeries : DEFAULT_SPEND_SERIES;
  const cur = data.currency === 'INR' ? '₹' : '$';
  const suf = data.currency === 'INR' ? ' Cr' : 'M';
  const money = (v: number) => `${cur}${v.toLocaleString('en-IN')}${suf}`;
  const windowColor = (w: number) => (w === 30 ? STATUS.critical : w === 60 ? '#b45309' : CAT[0]);

  const detailFor = (tile: typeof data.kpis[number]): KpiDetail => {
    const l = tile.label.toLowerCase();
    if (l.includes('open po')) return { tile, note: 'Open purchase orders contributing to this value.', columns: ['PO', 'Vendor', 'Material', 'Plant', `Value (${unit})`, 'Delivery', 'Status'], rows: openPos.map((p) => [p.poNumber, p.vendor, p.material, p.plant, p.value, p.deliveryDate, p.status]) };
    if (l.includes('otif') || l.includes('on-time')) return { tile, note: 'On-time delivery % by key vendor (target 95%).', columns: ['Vendor', 'On-time %'], rows: data.onTimeByVendor.map((v) => [v.name, v.value]) };
    if (l.includes('cycle')) return { tile, note: 'Spend by plant — cycle time is tracked across these plants.', columns: ['Plant', `Spend (${unit})`], rows: data.spendByPlant.map((p) => [p.name, p.value]) };
    if (l.includes('maverick')) return { tile, note: 'Off-contract (maverick) spend. Drill-down to PO level available in the full report.', columns: ['Vendor', `Spend (${unit})`, 'On-time %'], rows: data.topVendors.map((v) => [v.vendor, v.spend, v.onTimePct]) };
    if (l.includes('budget') && data.budgetVsActual) return { tile, note: `Budget vs actual by month (${unit}).`, columns: ['Month', `Budget (${unit})`, `Actual (${unit})`], rows: data.budgetVsActual.map((b) => [b.period as string, b.budget as number, b.actual as number]) };
    // Total spend / period spend / coal share / default → category + plant breakdown
    return { tile, note: `Breakdown by category (${unit}).`, columns: ['Category', `Spend (${unit})`], rows: data.spendByCategory.map((c) => [c.name, c.value]) };
  };

  return (
    <div>
      <PageHeader title="Procurement MIS" subtitle="SAP MM · Procure-to-Pay — EKKO · EKPO · EKBE · EBAN · RBKP · LFA1 (LPGCL & BEPL)" />

      <FilterBar plants={plants} plant={plant} onPlant={setPlant} period={period} onPeriod={(v) => setPeriod(v as Period)} />

      <ExceptionsPanel />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {data.kpis.map((t) => <KpiCard key={t.label} tile={t} onClick={() => setDetail(detailFor(t))} />)}
      </div>

      {/* Spend periods + Budget vs Actual + Savings */}
      {data.spendPeriods && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Spend MTD', value: data.spendPeriods.mtd, status: 'neutral' as const },
            { label: 'Spend QTD', value: data.spendPeriods.qtd, status: 'neutral' as const },
            { label: 'Spend YTD', value: data.spendPeriods.ytd, status: 'neutral' as const },
            ...(data.spendPeriods.budgetYtd ? [{ label: 'Budget YTD', value: data.spendPeriods.budgetYtd, status: 'neutral' as const, sublabel: 'Plan' }] : []),
          ].map((t) => <KpiCard key={t.label} tile={t} onClick={() => setDetail(detailFor(t))} />)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {data.budgetVsActual && (
          <ChartCard title="Budget vs Actual Spend" subtitle={`Monthly (${unit})`} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.budgetVsActual} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHROME.grid} vertical={false} />
                <XAxis dataKey="period" {...axisProps} />
                <YAxis {...axisProps} width={44} />
                <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
                <Legend formatter={(v) => <span style={{ color: CHROME.textSecondary, fontSize: 12 }}>{v}</span>} />
                <Bar dataKey="budget" name="Budget" fill={CHROME.muted} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="actual" name="Actual" fill={CAT[0]} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
        {data.savings && (
          <ChartCard title="Procurement Savings" subtitle={`YTD ${data.savings.ytdValue} · ${data.savings.ytdPct}`}>
            <div className="flex gap-4 mb-1 text-xs">
              <div><span className="text-slate-500">vs last purchase </span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{data.savings.vsLastPurchase}</span></div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.savings.trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHROME.grid} vertical={false} />
                <XAxis dataKey="period" {...axisProps} />
                <YAxis {...axisProps} width={36} />
                <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ stroke: CHROME.axis }} />
                <Line type="monotone" dataKey="savings" name="Savings" stroke="#0ca30c" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <ChartCard title="Monthly Spend by Category" subtitle={`Stacked (${unit})`} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthlySpend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={CHROME.grid} vertical={false} />
              <XAxis dataKey="period" {...axisProps} />
              <YAxis {...axisProps} width={44} />
              <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
              <Legend formatter={(v) => <span style={{ color: CHROME.textSecondary, fontSize: 12 }}>{v}</span>} />
              {spendSeries.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={CAT[i]} stroke={CHROME.surface} strokeWidth={1} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Spend by Plant" subtitle={`Total (${unit})`}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.spendByPlant} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={CHROME.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="name" {...axisProps} width={120} />
              <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
              <Bar dataKey="value" name="Spend" fill={CAT[0]} radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: 'right', fill: CHROME.textSecondary, fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <ChartCard title="On-Time Delivery by Vendor" subtitle="% vs 95% target">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.onTimeByVendor} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={CHROME.grid} vertical={false} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} width={40} domain={[80, 100]} />
              <Tooltip content={<DarkTooltip unit="%" />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
              <ReferenceLine y={95} stroke={CHROME.muted} strokeDasharray="4 4" label={{ value: 'Target 95%', fill: CHROME.muted, fontSize: 10, position: 'right' }} />
              <Bar dataKey="value" name="On-time %" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {data.onTimeByVendor.map((d, i) => (
                  <Cell key={i} fill={d.value >= 95 ? '#0ca30c' : d.value >= 90 ? CAT[0] : '#eda100'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Vendors by Purchase Value & # POs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left ${rowBorder}`}>
                  <th className={`${th} pr-2`}>Vendor</th>
                  <th className={`${th} px-2 text-right`}>Spend</th>
                  <th className={`${th} px-2 text-right`}># POs</th>
                  <th className={`${th} px-2 text-right`}>On-time</th>
                  <th className={`${th} pl-2`}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.topVendors.slice(0, 8).map((v) => (
                  <tr key={v.vendor} className={rowBorder}>
                    <td className="py-2 pr-2 text-slate-700 dark:text-slate-200">
                      <div className="truncate max-w-[170px]">{v.vendor}</div>
                      <div className="text-[10px] text-slate-500">{v.category}</div>
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums text-slate-600 dark:text-slate-300">{money(v.spend)}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400">{v.poCount ?? '—'}</td>
                    <td className="py-2 px-2 text-right tabular-nums" style={{ color: v.onTimePct >= 95 ? '#0ca30c' : v.onTimePct >= 90 ? CHROME.textSecondary : '#b45309' }}>{v.onTimePct}%</td>
                    <td className="py-2 pl-2">
                      <span className="text-[11px] font-semibold" style={{ color: v.reliability === 'High' ? '#0ca30c' : v.reliability === 'Medium' ? '#b45309' : '#d03b3b' }}>{v.reliability}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* PR/PO aging + Approval pending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {data.prPoAging && (
          <ChartCard title="Open PR & PO Aging" subtitle="Process bottlenecks by age">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-left ${rowBorder}`}>
                    <th className={`${th} pr-2`}>Age</th>
                    <th className={`${th} px-2 text-right`}>PR #</th>
                    <th className={`${th} px-2 text-right`}>PR Val</th>
                    <th className={`${th} px-2 text-right`}>PO #</th>
                    <th className={`${th} pl-2 text-right`}>PO Val</th>
                  </tr>
                </thead>
                <tbody>
                  {data.prPoAging.map((r) => (
                    <tr key={r.bucket} className={rowBorder}>
                      <td className="py-2 pr-2 text-slate-700 dark:text-slate-200">{r.bucket}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-slate-600 dark:text-slate-300">{r.prCount}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-slate-600 dark:text-slate-300">{money(r.prValue)}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-slate-600 dark:text-slate-300">{r.poCount}</td>
                      <td className="py-2 pl-2 text-right tabular-nums" style={{ color: r.bucket.startsWith('30') ? '#b45309' : undefined }}>{money(r.poValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )}
        {data.approvalPending && (
          <ChartCard title="Approval Pending by Stage" subtitle={`Count & amount (${unit})`}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.approvalPending} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 0 }}>
                <CartesianGrid stroke={CHROME.grid} horizontal={false} />
                <XAxis type="number" {...axisProps} />
                <YAxis type="category" dataKey="stage" {...axisProps} width={120} />
                <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
                <Bar dataKey="amount" name="Amount" fill={CAT[3]} radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: 'right', fill: CHROME.textSecondary, fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
            {data.emergencyProcurement && (
              <p className="text-xs text-slate-500 mt-1">Emergency procurement: <span className="font-semibold text-amber-600 dark:text-amber-400">{data.emergencyProcurement.count} cases · {money(data.emergencyProcurement.amount)}</span></p>
            )}
          </ChartCard>
        )}
      </div>

      {/* Contract expiry */}
      {data.contractExpiry && (
        <ChartCard title="Contract Expiry Alerts (30 / 60 / 90 Days)" subtitle="Manage sourcing & compliance risk" className="mb-5">
          <div className="flex justify-end mb-2"><ExportBtn filename="contract-expiry" columns={['Contract', 'Vendor', 'Material', 'Expiry', 'Days Left', 'Value']} rows={data.contractExpiry.map((c) => [c.contract, c.vendor, c.material || '', c.expiryDate, c.daysLeft, c.value])} /></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left ${rowBorder}`}>
                  <th className={`${th} pr-3`}>Contract</th>
                  <th className={`${th} px-3`}>Vendor</th>
                  <th className={`${th} px-3`}>Scope</th>
                  <th className={`${th} px-3 text-right`}>Value</th>
                  <th className={`${th} px-3`}>Expiry</th>
                  <th className={`${th} pl-3`}>Window</th>
                </tr>
              </thead>
              <tbody>
                {data.contractExpiry.map((c) => (
                  <tr key={c.contract} className={rowBorder}>
                    <td className="py-2 pr-3 tabular-nums text-slate-700 dark:text-slate-200">{c.contract}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[160px]">{c.vendor}</td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[160px]">{c.material}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{money(c.value)}</td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 tabular-nums">{c.expiryDate} <span className="text-[10px]">({c.daysLeft}d)</span></td>
                    <td className="py-2 pl-3">
                      <span className="text-[11px] font-semibold rounded px-1.5 py-0.5" style={{ color: windowColor(c.window), background: `${windowColor(c.window)}22` }}>{c.window} days</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      {/* Vendor outstanding + MSME */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {data.vendorOutstanding && (
          <ChartCard title="Vendor Outstanding & Advances" subtitle={`(${unit})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-left ${rowBorder}`}>
                    <th className={`${th} pr-2`}>Vendor</th>
                    <th className={`${th} px-2 text-right`}>Outstanding</th>
                    <th className={`${th} px-2 text-right`}>Advance</th>
                    <th className={`${th} pl-2`}>MSME</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vendorOutstanding.map((v) => (
                    <tr key={v.vendor} className={rowBorder}>
                      <td className="py-2 pr-2 text-slate-700 dark:text-slate-200 truncate max-w-[180px]">{v.vendor}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-slate-600 dark:text-slate-300">{money(v.outstanding)}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400">{money(v.advance)}</td>
                      <td className="py-2 pl-2">{v.msme ? <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">MSME</span> : <span className="text-slate-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )}
        {data.msmeOutstanding && (
          <ChartCard title="Total MSME Outstanding" subtitle="By ageing bucket (₹ Cr)">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data.msmeOutstanding} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHROME.grid} vertical={false} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} width={36} />
                <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
                <Bar dataKey="value" name="Outstanding" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {data.msmeOutstanding.map((d, i) => <Cell key={i} fill={i >= 3 ? '#b45309' : CAT[0]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Bank guarantees */}
      {data.bankGuarantees && (
        <ChartCard title="Bank Guarantee Status" subtitle="Open & expiry tracking" className="mb-5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left ${rowBorder}`}>
                  <th className={`${th} pr-3`}>Vendor</th>
                  <th className={`${th} px-3`}>BG No</th>
                  <th className={`${th} px-3 text-right`}>Amount</th>
                  <th className={`${th} px-3`}>Expiry</th>
                  <th className={`${th} pl-3`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.bankGuarantees.map((b) => (
                  <tr key={b.bgNo} className={rowBorder}>
                    <td className="py-2 pr-3 text-slate-700 dark:text-slate-200">{b.vendor}</td>
                    <td className="py-2 px-3 tabular-nums text-slate-500 dark:text-slate-400">{b.bgNo}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{money(b.amount)}</td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 tabular-nums">{b.expiryDate}</td>
                    <td className="py-2 pl-3">
                      <span className="text-[11px] font-semibold rounded px-1.5 py-0.5" style={{
                        color: b.status === 'expired' ? STATUS.critical : b.status === 'expiring' ? '#b45309' : '#0ca30c',
                        background: `${b.status === 'expired' ? STATUS.critical : b.status === 'expiring' ? '#b45309' : '#0ca30c'}22`,
                      }}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}

      <ChartCard title="Open Purchase Orders" subtitle={`SAP EKKO/EKPO/EKET · ${openPos.length} open${plant !== 'All Plants' ? ` · ${plant}` : ''} · overdue highlighted`}>
        <div className="flex justify-end mb-2"><ExportBtn filename="open-pos" columns={['PO', 'Vendor', 'Material', 'Plant', 'Value', 'Delivery', 'Days Overdue', 'Status']} rows={openPos.map((p) => [p.poNumber, p.vendor, p.material, p.plant, p.value, p.deliveryDate, p.daysOverdue, p.status])} /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left ${rowBorder}`}>
                <th className={`${th} pr-3`}>PO #</th>
                <th className={`${th} px-3`}>Vendor</th>
                <th className={`${th} px-3`}>Material</th>
                <th className={`${th} px-3`}>Plant</th>
                <th className={`${th} px-3 text-right`}>Value</th>
                <th className={`${th} px-3`}>Delivery</th>
                <th className={`${th} pl-3`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {openPos.map((po) => (
                <tr key={po.poNumber} className={`${rowBorder} hover:bg-slate-100/60 dark:hover:bg-white/[0.02]`}>
                  <td className="py-2 pr-3 tabular-nums text-slate-600 dark:text-slate-300">{po.poNumber}</td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[160px]">{po.vendor}</td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{po.material}</td>
                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{po.plant}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-800 dark:text-slate-200">{money(po.value)}</td>
                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400 tabular-nums">
                    {po.deliveryDate}
                    {po.daysOverdue > 0 && <span className="text-red-600 dark:text-red-400"> (+{po.daysOverdue}d)</span>}
                  </td>
                  <td className="py-2 pl-3"><StatusBadge status={po.status} /></td>
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
