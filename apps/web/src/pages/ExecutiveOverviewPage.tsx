import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { useExecutiveMis, useMisAlerts } from '../lib/misApi';
import { KpiCard, ChartCard, DarkTooltip, Loading, PageHeader } from '../components/mis/kit';
import { AlertActions } from '../components/mis/AlertActions';
import { getCategorical, getChrome, STATUS, moneyUnit } from '../lib/viz';
import { useTheme } from '../theme/ThemeProvider';

export const ExecutiveOverviewPage: React.FC = () => {
  const { theme } = useTheme();
  const CHROME = getChrome(theme);
  const CAT = getCategorical(theme);
  const axisProps = {
    tick: { fill: CHROME.muted, fontSize: 11 },
    axisLine: { stroke: CHROME.axis },
    tickLine: { stroke: CHROME.axis },
  };
  const { data, isLoading } = useExecutiveMis();
  const { data: alerts } = useMisAlerts();

  if (isLoading || !data) return <Loading />;
  const unit = moneyUnit(data.currency);

  return (
    <div>
      <PageHeader
        title="Executive Overview"
        subtitle={`${data.orgName} · ${data.sector}`}
        right={
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400"><AlertTriangle size={13} /> {data.alertsSummary.critical} critical</span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><AlertTriangle size={13} /> {data.alertsSummary.warning} warning</span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400"><Info size={13} /> {data.alertsSummary.info} info</span>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {data.headline.map((t) => <KpiCard key={t.label} tile={t} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <ChartCard title="Generation vs Plan" subtitle="Actual output against planned" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.generationTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={CHROME.grid} vertical={false} />
              <XAxis dataKey="period" {...axisProps} />
              <YAxis {...axisProps} width={48} />
              <Tooltip content={<DarkTooltip />} cursor={{ stroke: CHROME.axis }} />
              <Legend formatter={(v) => <span style={{ color: CHROME.textSecondary, fontSize: 12 }}>{v}</span>} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke={CAT[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="plan" name="Plan" stroke={CHROME.muted} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Spend by Category" subtitle={`Procurement spend (${unit})`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.spendByCategory} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={CHROME.grid} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="name" {...axisProps} width={96} />
              <Tooltip content={<DarkTooltip unit={unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
              <Bar dataKey="value" name="Spend" fill={CAT[0]} radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: 'right', fill: CHROME.textSecondary, fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {alerts && alerts.length > 0 && (
        <ChartCard title="Exceptions & Recommendations">
          <div className="space-y-2">
            {alerts.slice(0, 5).map((a) => {
              const color =
                a.severity === 'critical' ? STATUS.critical : a.severity === 'warning' ? '#b45309' : a.severity === 'success' ? STATUS.good : '#64748b';
              const Icon = a.severity === 'success' ? CheckCircle2 : a.severity === 'info' ? Info : AlertTriangle;
              return (
                <div key={a.id} className="flex gap-3 p-3 rounded-lg bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                  <Icon size={16} style={{ color }} className="mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
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
        </ChartCard>
      )}
    </div>
  );
};
