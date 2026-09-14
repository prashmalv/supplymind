import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  TrendingUp, TrendingDown, AlertTriangle, Sparkles, Loader2, CheckCircle,
  Clock, ArrowUpRight, ArrowDownRight, Package, BarChart3, Activity,
  ShieldAlert, RefreshCw, Download, ChevronRight, Target, Layers
} from 'lucide-react';
import { MOCK_DATABASE } from '../services/mockDatabase';
import { geminiService } from '../services/geminiService';
import { SkuForecastAccuracy } from '../types';

const db = MOCK_DATABASE;

// ---- Sub-components ----

const MetricPill: React.FC<{ label: string; value: string; trend: 'up' | 'down' | 'neutral'; good?: 'up' | 'down' }> = ({ label, value, trend, good = 'up' }) => {
  const isPositive = trend === good;
  return (
    <div className="flex flex-col items-center px-4 py-3 bg-white/5 rounded-xl border border-white/10">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</span>
      <span className="text-xl font-bold text-white">{value}</span>
      <span className={`flex items-center gap-1 text-xs font-semibold mt-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {trend === 'up' ? <ArrowUpRight size={12} /> : trend === 'down' ? <ArrowDownRight size={12} /> : null}
        {trend !== 'neutral' && (trend === 'up' ? '+' : '-') + '0.7 wk'}
      </span>
    </div>
  );
};

const AbcBadge: React.FC<{ cls: string }> = ({ cls }) => {
  const colors: Record<string, string> = {
    A: 'bg-red-500/20 border-red-500/40 text-red-400',
    B: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
    C: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[cls] || 'bg-slate-700 text-slate-300'}`}>{cls}</span>;
};

const XyzBadge: React.FC<{ cls: string }> = ({ cls }) => {
  const colors: Record<string, string> = {
    X: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
    Y: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
    Z: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors[cls] || 'bg-slate-700 text-slate-300'}`}>{cls}</span>;
};

const StockBar: React.FC<{ current: number; safety: number; reorder: number; max: number }> = ({ current, safety, reorder, max }) => {
  const pct = Math.min(100, (current / max) * 100);
  const safetyPct = (safety / max) * 100;
  const reorderPct = (reorder / max) * 100;
  const color = current < safety ? 'bg-red-500' : current < reorder ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="relative w-full h-2 bg-white/10 rounded-full overflow-visible">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-red-400 rounded" style={{ left: `${safetyPct}%` }} title={`Safety Stock: ${safety.toLocaleString()}`} />
      <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-400 rounded" style={{ left: `${reorderPct}%` }} title={`Reorder Point: ${reorder.toLocaleString()}`} />
    </div>
  );
};

const SopPhaseCard: React.FC<{ phase: { phase: string; date: string; status: string; owner: string; notes: string } }> = ({ phase }) => {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    completed: { color: 'border-emerald-500/40 bg-emerald-500/10', icon: <CheckCircle size={14} className="text-emerald-400" /> },
    in_progress: { color: 'border-blue-500/40 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.2)]', icon: <Activity size={14} className="text-blue-400 animate-pulse" /> },
    upcoming: { color: 'border-white/10 bg-white/5', icon: <Clock size={14} className="text-slate-500" /> },
  };
  const cfg = statusConfig[phase.status] || statusConfig.upcoming;
  return (
    <div className={`p-3 rounded-xl border ${cfg.color} transition-all`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-bold text-white">{phase.phase}</span>
        {cfg.icon}
      </div>
      <p className="text-[10px] text-slate-400 mb-1">{phase.date} · {phase.owner}</p>
      <p className="text-[10px] text-slate-500 italic">{phase.notes}</p>
    </div>
  );
};

// ---- Mape Color ----
const mapeColor = (mape: number) => mape < 10 ? '#10b981' : mape < 15 ? '#f59e0b' : '#ef4444';

// ---- Main Component ----
export const ForecastDashboard: React.FC = () => {
  const [selectedSku, setSelectedSku] = useState<SkuForecastAccuracy>(db.forecastAccuracy.skuAccuracy[0] as SkuForecastAccuracy);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [activeTab, setActiveTab] = useState<'accuracy' | 'safety' | 'sop' | 'abcxyz'>('accuracy');
  const [safetyStockApplied, setSafetyStockApplied] = useState<Record<string, boolean>>({});

  // Radar data for selected SKU vs benchmark
  const radarData = [
    { metric: 'Accuracy', sku: Math.max(0, 100 - selectedSku.mape), benchmark: 88 },
    { metric: 'Coverage', sku: Math.min(100, (selectedSku.currentStock / selectedSku.safetyStock) * 50), benchmark: 75 },
    { metric: 'Service Lvl', sku: 95, benchmark: 93 },
    { metric: 'Bias Control', sku: Math.max(0, 100 - Math.abs(selectedSku.bias) * 5), benchmark: 85 },
    { metric: 'Lead Time Fit', sku: selectedSku.leadTime ? Math.max(40, 100 - selectedSku.leadTime) : 80, benchmark: 72 },
  ];

  const loadForecastInsight = async () => {
    setIsLoadingInsight(true);
    const insight = await geminiService.generateForecastInsight(db.forecastAccuracy.skuAccuracy);
    setAiInsight(insight);
    setIsLoadingInsight(false);
  };

  useEffect(() => {
    loadForecastInsight();
  }, []);

  const handleApplySafetyStock = (sku: string) => {
    setSafetyStockApplied(prev => ({ ...prev, [sku]: true }));
  };

  const exportForecastCSV = () => {
    const rows = [
      ['SKU', 'Name', 'MAPE%', 'Bias%', 'ABC', 'XYZ', 'Current Stock', 'Safety Stock', 'Reorder Point', 'Avg Demand'],
      ...db.forecastAccuracy.skuAccuracy.map(s => [
        s.sku, s.name, s.mape, s.bias, s.abcClass, s.xyzClass,
        s.currentStock, s.safetyStock, s.reorderPoint, s.avgDemand
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast_accuracy_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-6 pb-6 space-y-6 max-w-[1600px] mx-auto">

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]" />
            Demand Forecasting Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1">SKU-level MAPE tracking · Safety stock optimization · S&OP calendar</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadForecastInsight}
            disabled={isLoadingInsight}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl text-xs font-medium transition-all"
          >
            {isLoadingInsight ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh AI
          </button>
          <button
            onClick={exportForecastCSV}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl text-xs font-medium transition-all"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="liquid-card rounded-2xl p-4 border border-white/10">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Overall MAPE</p>
          <p className="text-3xl font-bold text-amber-400">{db.dailyBriefingMetrics.demand.mape}%</p>
          <p className="text-xs text-slate-500 mt-1">Target: &lt;10% · Trend: ↑ from 11.8%</p>
        </div>
        <div className="liquid-card rounded-2xl p-4 border border-white/10">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Forecast Bias</p>
          <p className="text-3xl font-bold text-orange-400">{db.dailyBriefingMetrics.demand.bias}</p>
          <p className="text-xs text-slate-500 mt-1">Over-forecasting detected</p>
        </div>
        <div className="liquid-card rounded-2xl p-4 border border-white/10">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">At-Risk SKUs</p>
          <p className="text-3xl font-bold text-red-400">{db.dailyBriefingMetrics.demand.atRiskSkus.length}</p>
          <p className="text-xs text-slate-500 mt-1">{db.dailyBriefingMetrics.demand.atRiskSkus.join(', ')}</p>
        </div>
        <div className="liquid-card rounded-2xl p-4 border border-white/10">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Forecast Value Add</p>
          <p className="text-3xl font-bold text-emerald-400">+4.2%</p>
          <p className="text-xs text-slate-500 mt-1">AI model vs naïve baseline</p>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="liquid-card rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl flex-shrink-0">
            <Sparkles size={18} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">AI Forecast Intelligence</p>
              {isLoadingInsight && <Loader2 size={12} className="animate-spin text-blue-400" />}
            </div>
            {isLoadingInsight ? (
              <div className="space-y-2">
                <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-white/10 rounded animate-pulse w-1/2" />
              </div>
            ) : (
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-light">{aiInsight}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit border border-white/10">
        {(['accuracy', 'safety', 'sop', 'abcxyz'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'accuracy' ? 'Forecast Accuracy' : tab === 'safety' ? 'Safety Stock' : tab === 'sop' ? 'S&OP Calendar' : 'ABC/XYZ Matrix'}
          </button>
        ))}
      </div>

      {/* ---- TAB: FORECAST ACCURACY ---- */}
      {activeTab === 'accuracy' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: MAPE Trend Chart */}
          <div className="lg:col-span-2 liquid-card rounded-2xl p-5 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-400" /> Weekly MAPE Trend (12 Weeks)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Mean Absolute Percentage Error — target below 10%</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={db.forecastAccuracy.weeklyMape}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[8, 20]} tick={{ fill: '#64748b', fontSize: 10 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                  formatter={(v: any) => [`${v}%`, '']}
                />
                <ReferenceLine y={10} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Target 10%', fill: '#10b981', fontSize: 10 }} />
                <Line dataKey="mape" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} name="MAPE %" />
                <Line dataKey="bias" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Bias %" />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* RIGHT: SKU Picker + Radar */}
          <div className="liquid-card rounded-2xl p-5 border border-white/10 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target size={16} className="text-purple-400" /> SKU Performance Radar
            </h3>
            <div className="flex flex-wrap gap-2">
              {db.forecastAccuracy.skuAccuracy.map(s => (
                <button
                  key={s.sku}
                  onClick={() => setSelectedSku(s as SkuForecastAccuracy)}
                  className={`text-xs px-2 py-1 rounded-lg font-medium transition-all border ${
                    selectedSku.sku === s.sku
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {s.sku}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b', fontSize: 9 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} />
                <Radar dataKey="sku" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name={selectedSku.sku} />
                <Radar dataKey="benchmark" stroke="#64748b" fill="#64748b" fillOpacity={0.1} strokeDasharray="4 4" name="Benchmark" />
                <Legend wrapperStyle={{ fontSize: 10, color: '#94a3b8' }} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="text-center">
              <p className="text-xs font-bold text-white">{selectedSku.name}</p>
              <p className="text-xs text-slate-500">MAPE: <span style={{ color: mapeColor(selectedSku.mape) }} className="font-bold">{selectedSku.mape}%</span> · Bias: {selectedSku.bias > 0 ? '+' : ''}{selectedSku.bias}%</p>
            </div>
          </div>

          {/* SKU MAPE Bar Chart (full width) */}
          <div className="lg:col-span-2 liquid-card rounded-2xl p-5 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-amber-400" /> MAPE by SKU
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={db.forecastAccuracy.skuAccuracy} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 25]} tick={{ fill: '#64748b', fontSize: 10 }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any) => [`${v}%`, 'MAPE']}
                />
                <ReferenceLine x={10} stroke="#10b981" strokeDasharray="4 4" />
                <Bar dataKey="mape" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {db.forecastAccuracy.skuAccuracy.map((s, i) => (
                    <Cell key={i} fill={mapeColor(s.mape)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Demand vs Forecast Chart */}
          <div className="liquid-card rounded-2xl p-5 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" /> Demand vs Forecast
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={db.forecastAccuracy.demandAlignment}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                />
                <Line dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
                <Line dataKey="forecast" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} name="Forecast" />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* SKU Detail Table */}
          <div className="lg:col-span-3 liquid-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package size={16} className="text-slate-400" /> SKU-Level Forecast Detail
              </h3>
              <span className="text-xs text-slate-500">{db.forecastAccuracy.skuAccuracy.length} SKUs</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="text-left p-3 font-bold">SKU</th>
                    <th className="text-left p-3 font-bold">Name</th>
                    <th className="text-center p-3 font-bold">MAPE</th>
                    <th className="text-center p-3 font-bold">Bias</th>
                    <th className="text-center p-3 font-bold">Class</th>
                    <th className="text-left p-3 font-bold w-40">Stock Health</th>
                    <th className="text-right p-3 font-bold">Avg Demand</th>
                    <th className="text-right p-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {db.forecastAccuracy.skuAccuracy.map((sku, i) => {
                    const isBelow = sku.currentStock < sku.safetyStock;
                    const isAtReorder = sku.currentStock < sku.reorderPoint && !isBelow;
                    return (
                      <tr
                        key={sku.sku}
                        onClick={() => setSelectedSku(sku as SkuForecastAccuracy)}
                        className={`border-b border-white/5 cursor-pointer transition-colors ${
                          selectedSku.sku === sku.sku ? 'bg-blue-500/10' : 'hover:bg-white/5'
                        } ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                      >
                        <td className="p-3 font-mono text-blue-400 font-bold">{sku.sku}</td>
                        <td className="p-3 text-white font-medium">{sku.name}</td>
                        <td className="p-3 text-center">
                          <span className="font-bold" style={{ color: mapeColor(sku.mape) }}>{sku.mape}%</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-semibold ${sku.bias > 5 ? 'text-orange-400' : sku.bias < 0 ? 'text-blue-400' : 'text-slate-300'}`}>
                            {sku.bias > 0 ? '+' : ''}{sku.bias}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <AbcBadge cls={sku.abcClass} />
                            <XyzBadge cls={sku.xyzClass} />
                          </div>
                        </td>
                        <td className="p-3 w-40">
                          <div className="mb-1">
                            <StockBar
                              current={sku.currentStock}
                              safety={sku.safetyStock}
                              reorder={sku.reorderPoint}
                              max={sku.reorderPoint * 2}
                            />
                          </div>
                          <span className="text-slate-500">{sku.currentStock.toLocaleString()} / {sku.reorderPoint.toLocaleString()}</span>
                        </td>
                        <td className="p-3 text-right text-slate-300">{sku.avgDemand.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          {isBelow ? (
                            <span className="flex items-center justify-end gap-1 text-red-400 font-bold">
                              <AlertTriangle size={12} /> Below SS
                            </span>
                          ) : isAtReorder ? (
                            <span className="flex items-center justify-end gap-1 text-amber-400 font-bold">
                              <ChevronRight size={12} /> Reorder
                            </span>
                          ) : (
                            <span className="flex items-center justify-end gap-1 text-emerald-400 font-medium">
                              <CheckCircle size={12} /> OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-white/5 flex items-center gap-4 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full inline-block" /> Safety Stock Line</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full inline-block" /> Reorder Point</span>
            </div>
          </div>
        </div>
      )}

      {/* ---- TAB: SAFETY STOCK ---- */}
      {activeTab === 'safety' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2 liquid-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert size={16} className="text-blue-400" /> AI Safety Stock Optimization
              </h3>
              <p className="text-xs text-slate-500 mt-1">Recommendations based on service level targets, demand variability and lead times</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="text-left p-4 font-bold">SKU</th>
                    <th className="text-center p-4 font-bold">Current SS</th>
                    <th className="text-center p-4 font-bold">AI Recommended</th>
                    <th className="text-center p-4 font-bold">Delta</th>
                    <th className="text-center p-4 font-bold">Service Level</th>
                    <th className="text-center p-4 font-bold">Lead Time</th>
                    <th className="text-right p-4 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {db.safetyStockAnalysis.map((row, i) => {
                    const sku = db.forecastAccuracy.skuAccuracy.find(s => s.sku === row.sku);
                    const isApplied = safetyStockApplied[row.sku];
                    return (
                      <tr key={row.sku} className={`border-b border-white/5 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                        <td className="p-4">
                          <p className="font-bold text-white font-mono">{row.sku}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">{sku?.name}</p>
                        </td>
                        <td className="p-4 text-center text-slate-300 font-mono">{row.current.toLocaleString()}</td>
                        <td className="p-4 text-center font-bold font-mono text-white">{row.recommended.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          <span className={`font-bold ${row.delta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {row.delta > 0 ? '+' : ''}{row.delta.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-center text-slate-300">{row.serviceLevel}%</td>
                        <td className="p-4 text-center text-slate-300">{row.leadTime}d</td>
                        <td className="p-4 text-right">
                          {isApplied ? (
                            <span className="flex items-center justify-end gap-1 text-emerald-400 text-xs font-bold">
                              <CheckCircle size={12} /> Applied to ERP
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApplySafetyStock(row.sku)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                row.delta > 0
                                  ? 'border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                                  : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                              } bg-white/5`}
                            >
                              {row.delta > 0 ? '↑ Increase' : '↓ Decrease'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-white/5 bg-blue-500/5">
              <p className="text-xs text-blue-300 flex items-start gap-2">
                <Sparkles size={14} className="flex-shrink-0 mt-0.5 text-blue-400" />
                <span>Safety Stock = Z × σ_demand × √lead_time. Z=1.65 for 95%, 1.96 for 97.5%, 2.33 for 99%. Recommendations auto-recalculate when demand variability changes by &gt;5%.</span>
              </p>
            </div>
          </div>

          {/* Safety Stock Comparison Chart */}
          <div className="liquid-card rounded-2xl p-5 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-4">Current vs Recommended Safety Stock</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={db.safetyStockAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="sku" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar dataKey="current" name="Current SS" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recommended" name="AI Recommended" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="liquid-card rounded-2xl p-5 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Layers size={16} className="text-purple-400" /> Working Capital Impact
            </h3>
            <div className="space-y-3">
              {db.safetyStockAnalysis.map(row => {
                const sku = db.forecastAccuracy.skuAccuracy.find(s => s.sku === row.sku);
                const product = db.products.find(p => p.id === row.sku);
                const impact = row.delta * (product?.unitCost || 100);
                return (
                  <div key={row.sku} className="flex items-center justify-between py-2 border-b border-white/5">
                    <div>
                      <p className="text-xs font-bold text-white">{row.sku}</p>
                      <p className="text-[10px] text-slate-500">{sku?.name} · {row.delta > 0 ? 'Increase' : 'Decrease'} by {Math.abs(row.delta).toLocaleString()} units</p>
                    </div>
                    <span className={`text-sm font-bold ${impact > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {impact > 0 ? '+' : ''}${(impact / 1000).toFixed(0)}k
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs font-bold text-white">Net Working Capital Change</p>
                <span className="text-sm font-bold text-emerald-400">
                  {(() => {
                    const total = db.safetyStockAnalysis.reduce((sum, row) => {
                      const product = db.products.find(p => p.id === row.sku);
                      return sum + row.delta * (product?.unitCost || 100);
                    }, 0);
                    return `${total > 0 ? '+' : ''}$${(total / 1000).toFixed(0)}k`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- TAB: S&OP CALENDAR ---- */}
      {activeTab === 'sop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 liquid-card rounded-2xl p-5 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-blue-400" /> Current S&OP Cycle — March 2026
            </h3>
            <div className="space-y-3">
              {db.sopCalendar.map((phase, i) => (
                <SopPhaseCard key={i} phase={phase} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="liquid-card rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5">
              <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} /> Key Decisions This Cycle
              </h4>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="font-bold text-white mb-1">Alunbrig (PROD-B) Emergency Order</p>
                  <p className="text-slate-400">Current: 3,200 units · Safety Stock: 4,000 · Shortfall: 800 units</p>
                  <p className="text-amber-400 font-semibold mt-1">→ Decision required: Emergency PO or air-bridge from Frankfurt?</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="font-bold text-white mb-1">Lonza Visp Delay Mitigation</p>
                  <p className="text-slate-400">API delay +3 days. Entyvio SS buffer: 12 days. Acceptable.</p>
                  <p className="text-emerald-400 font-semibold mt-1">→ Accept delay. No escalation needed.</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="font-bold text-white mb-1">Oncology Demand Uplift</p>
                  <p className="text-slate-400">+8% vs forecast. Revise Q2 plan for Oncology portfolio.</p>
                  <p className="text-blue-400 font-semibold mt-1">→ Update statistical model with latest Rx data.</p>
                </div>
              </div>
            </div>

            <div className="liquid-card rounded-2xl p-5 border border-white/10">
              <h4 className="text-sm font-bold text-white mb-3">S&OP KPIs — Cycle Health</h4>
              <div className="space-y-3">
                {[
                  { label: 'Forecast Consensus', value: '82%', color: 'text-amber-400' },
                  { label: 'Plan Adherence', value: '94%', color: 'text-emerald-400' },
                  { label: 'Decision Velocity', value: '2.1 days', color: 'text-blue-400' },
                  { label: 'Open Action Items', value: '7', color: 'text-red-400' },
                ].map(kpi => (
                  <div key={kpi.label} className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">{kpi.label}</span>
                    <span className={`font-bold ${kpi.color}`}>{kpi.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- TAB: ABC/XYZ MATRIX ---- */}
      {activeTab === 'abcxyz' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Matrix Visual */}
          <div className="liquid-card rounded-2xl p-5 border border-white/10">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Layers size={16} className="text-purple-400" /> ABC/XYZ Product Classification Matrix
            </h3>
            <p className="text-xs text-slate-500 mb-4">ABC = revenue value · XYZ = demand variability (CV)</p>
            <div className="grid grid-cols-4 gap-1 text-xs">
              {/* Header Row */}
              <div className="p-2" />
              {['X (Stable)', 'Y (Variable)', 'Z (Erratic)'].map(h => (
                <div key={h} className="p-2 text-center font-bold text-slate-400 text-[10px] uppercase tracking-wider">{h}</div>
              ))}
              {/* A Row */}
              <div className="p-2 flex items-center justify-center font-bold text-red-400 text-sm border-r border-white/10">A</div>
              {[
                { key: 'AX', label: 'AX', color: 'bg-emerald-500/10 border-emerald-500/20', textColor: 'text-emerald-400' },
                { key: 'AY', label: 'AY', color: 'bg-amber-500/10 border-amber-500/20', textColor: 'text-amber-400' },
                { key: 'AZ', label: 'AZ', color: 'bg-red-500/10 border-red-500/20', textColor: 'text-red-400' },
              ].map(cell => {
                const products = (db.abcXyzMatrix as any)[cell.key] as string[];
                return (
                  <div key={cell.key} className={`p-3 rounded-xl border ${cell.color} min-h-[80px]`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${cell.textColor}`}>{cell.label}</p>
                    {products.length > 0 ? products.map(p => (
                      <span key={p} className="block text-[10px] text-white font-mono bg-white/10 rounded px-1.5 py-0.5 mb-1 w-fit">{p}</span>
                    )) : <span className="text-slate-600 text-[10px]">—</span>}
                  </div>
                );
              })}
              {/* B Row */}
              <div className="p-2 flex items-center justify-center font-bold text-amber-400 text-sm border-r border-white/10">B</div>
              {[
                { key: 'BX', color: 'bg-emerald-500/5 border-emerald-500/10', textColor: 'text-emerald-500' },
                { key: 'BY', color: 'bg-amber-500/5 border-amber-500/10', textColor: 'text-amber-500' },
                { key: 'BZ', color: 'bg-red-500/5 border-red-500/10', textColor: 'text-red-500' },
              ].map(cell => {
                const products = (db.abcXyzMatrix as any)[cell.key] as string[];
                return (
                  <div key={cell.key} className={`p-3 rounded-xl border ${cell.color} min-h-[80px]`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${cell.textColor}`}>{cell.key}</p>
                    {products.length > 0 ? products.map(p => (
                      <span key={p} className="block text-[10px] text-white font-mono bg-white/10 rounded px-1.5 py-0.5 mb-1 w-fit">{p}</span>
                    )) : <span className="text-slate-600 text-[10px]">—</span>}
                  </div>
                );
              })}
              {/* C Row */}
              <div className="p-2 flex items-center justify-center font-bold text-emerald-400 text-sm border-r border-white/10">C</div>
              {[
                { key: 'CX', color: 'bg-slate-500/5 border-slate-500/10', textColor: 'text-slate-400' },
                { key: 'CY', color: 'bg-slate-500/5 border-slate-500/10', textColor: 'text-slate-400' },
                { key: 'CZ', color: 'bg-slate-500/5 border-slate-500/10', textColor: 'text-slate-400' },
              ].map(cell => {
                const products = (db.abcXyzMatrix as any)[cell.key] as string[];
                return (
                  <div key={cell.key} className={`p-3 rounded-xl border ${cell.color} min-h-[80px]`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${cell.textColor}`}>{cell.key}</p>
                    {products.length > 0 ? products.map(p => (
                      <span key={p} className="block text-[10px] text-white font-mono bg-white/10 rounded px-1.5 py-0.5 mb-1 w-fit">{p}</span>
                    )) : <span className="text-slate-600 text-[10px]">—</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Replenishment Policy Recommendations */}
          <div className="space-y-4">
            <div className="liquid-card rounded-2xl p-5 border border-white/10">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-blue-400" /> AI Replenishment Policy Recommendations
              </h3>
              <div className="space-y-3">
                {Object.entries(db.abcXyzMatrix.insights).map(([cls, insight]) => (
                  <div key={cls} className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        cls.startsWith('A') ? 'border-red-500/40 bg-red-500/20 text-red-400' :
                        cls.startsWith('B') ? 'border-amber-500/40 bg-amber-500/20 text-amber-400' :
                        'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                      }`}>{cls}</span>
                    </div>
                    <p className="text-xs text-slate-300">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="liquid-card rounded-2xl p-5 border border-white/10">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Legend</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-bold text-slate-300 mb-1">ABC (Revenue Value)</p>
                  <p className="text-slate-500">A = Top 80% of revenue</p>
                  <p className="text-slate-500">B = Next 15% of revenue</p>
                  <p className="text-slate-500">C = Bottom 5% of revenue</p>
                </div>
                <div>
                  <p className="font-bold text-slate-300 mb-1">XYZ (Variability CV)</p>
                  <p className="text-slate-500">X = Stable (CV &lt; 0.5)</p>
                  <p className="text-slate-500">Y = Variable (0.5 – 1.0)</p>
                  <p className="text-slate-500">Z = Erratic (CV &gt; 1.0)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
