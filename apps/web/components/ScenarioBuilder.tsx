import React, { useMemo, useState } from 'react';
import {
  Play, RotateCcw, Zap, Loader2, TrendingDown, Gauge, IndianRupee, AlertTriangle, Copy, Check, Layers,
} from 'lucide-react';
import { ScenarioParams } from '../types';
import { api } from '../src/lib/apiClient';
import { Markdown } from '../src/components/Markdown';

const BASE: ScenarioParams = { demandSurge: 0, supplierDelay: 0, portCongestion: false, priceSpike: 0, plantOutage: false };

const PRESETS: { name: string; icon: string; params: ScenarioParams }[] = [
  { name: 'Peak-summer load + rake shortage', icon: '☀️', params: { demandSurge: 18, supplierDelay: 6, portCongestion: true, priceSpike: 0, plantOutage: false } },
  { name: 'Monsoon coal supply crunch', icon: '🌧️', params: { demandSurge: 5, supplierDelay: 9, portCongestion: true, priceSpike: 8, plantOutage: false } },
  { name: 'Imported-coal price spike', icon: '📈', params: { demandSurge: 0, supplierDelay: 2, portCongestion: false, priceSpike: 20, plantOutage: false } },
  { name: 'Unit outage + demand surge', icon: '⚠️', params: { demandSurge: 22, supplierDelay: 3, portCongestion: false, priceSpike: 0, plantOutage: true } },
];

function severityScore(p: ScenarioParams) {
  return p.demandSurge * 1.1 + p.supplierDelay * 4 + (p.portCongestion ? 18 : 0) + (p.priceSpike ?? 0) * 1.4 + (p.plantOutage ? 30 : 0);
}

export const ScenarioBuilder: React.FC = () => {
  const [params, setParams] = useState<ScenarioParams>(BASE);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const dirty = useMemo(() => JSON.stringify(params) !== JSON.stringify(BASE), [params]);
  const score = severityScore(params);
  const severity = score >= 60 ? 'CRITICAL' : score >= 30 ? 'HIGH' : score >= 12 ? 'MODERATE' : score > 0 ? 'LOW' : 'BASELINE';
  const sevColor = severity === 'CRITICAL' ? '#d03b3b' : severity === 'HIGH' ? '#e0685b' : severity === 'MODERATE' ? '#b9770f' : severity === 'LOW' ? '#2c5f7c' : '#2e7d46';

  // Illustrative projected deltas (client-side estimate shown before the AI narrative).
  const otifDelta = (-(params.supplierDelay * 1.2 + params.demandSurge * 0.12 + (params.plantOutage ? 4 : 0))).toFixed(1);
  const coalDaysDelta = (-(params.supplierDelay * 0.5 + params.demandSurge * 0.06)).toFixed(1);
  const costDelta = ((params.priceSpike ?? 0) * 3.9 + params.supplierDelay * 1.2 + (params.portCongestion ? 8 : 0)).toFixed(0);

  const run = async () => {
    setRunning(true); setResult(null);
    try {
      const { text } = await api.post<{ text: string }>('/ai/scenario', params);
      setResult(text);
    } catch {
      setResult('Could not reach the AI simulation engine. Please try again.');
    } finally { setRunning(false); }
  };

  const reset = () => { setParams(BASE); setResult(null); };
  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(`WHAT-IF SCENARIO\nDemand +${params.demandSurge}% · Supply delay ${params.supplierDelay}d · Logistics ${params.portCongestion ? 'disrupted' : 'ok'} · Price +${params.priceSpike}% · Outage ${params.plantOutage ? 'yes' : 'no'}\n\n${result}`);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const metric = (icon: React.ReactNode, label: string, val: string, tone: string) => (
    <div className="liquid-card rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{icon}{label}</div>
      <div className="text-xl font-bold tabular-nums mt-1" style={{ color: tone }}>{val}</div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 pb-8 max-w-[1400px] mx-auto">
      <div className="flex items-end justify-between mb-5 px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Layers size={22} className="text-red-500" /> What-If Studio</h1>
          <p className="text-sm text-slate-500 mt-0.5">Model supply-chain disruptions and get an AI impact analysis with a mitigation playbook.</p>
        </div>
      </div>

      {/* Presets */}
      <div className="flex gap-2 flex-wrap mb-4">
        {PRESETS.map((p) => (
          <button key={p.name} onClick={() => { setParams(p.params); setResult(null); }}
            className="flex items-center gap-1.5 text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
            <span>{p.icon}</span>{p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Controls */}
        <div className="lg:col-span-2 liquid-card rounded-2xl p-5 space-y-5 self-start">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm"><Zap size={15} className="text-red-500" /> Scenario Levers</h3>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex justify-between">Demand / Load Surge <span className="text-slate-900 dark:text-white">+{params.demandSurge}%</span></label>
            <input type="range" min="0" max="40" value={params.demandSurge} onChange={(e) => setParams({ ...params, demandSurge: +e.target.value })} className="w-full accent-red-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex justify-between">Supplier / Coal Delay <span className="text-slate-900 dark:text-white">{params.supplierDelay} days</span></label>
            <input type="range" min="0" max="20" value={params.supplierDelay} onChange={(e) => setParams({ ...params, supplierDelay: +e.target.value })} className="w-full accent-red-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex justify-between">Input Price Spike <span className="text-slate-900 dark:text-white">+{params.priceSpike ?? 0}%</span></label>
            <input type="range" min="0" max="30" value={params.priceSpike ?? 0} onChange={(e) => setParams({ ...params, priceSpike: +e.target.value })} className="w-full accent-red-500" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {([['portCongestion', 'Logistics / Rake Disruption'], ['plantOutage', 'Plant / Unit Outage']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setParams({ ...params, [k]: !params[k] })}
                className={`p-3 rounded-xl border text-left transition-all ${params[k] ? 'bg-red-500/15 border-red-500/40 text-slate-900 dark:text-white' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                <div className={`w-3.5 h-3.5 rounded border mb-2 flex items-center justify-center ${params[k] ? 'bg-red-500 border-red-500' : 'border-slate-400'}`}>{params[k] && <Check size={9} className="text-white" />}</div>
                <span className="text-xs font-medium leading-tight block">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={run} disabled={running || !dirty}
              className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={15} fill="currentColor" />} Run Simulation
            </button>
            {dirty && <button onClick={reset} className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl"><RotateCcw size={17} /></button>}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          <div className="liquid-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Projected Impact</h3>
              <span className="text-xs font-bold rounded-full px-3 py-1" style={{ color: sevColor, background: `${sevColor}22` }}>{severity}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {metric(<Gauge size={11} />, 'OTIF Δ', dirty ? `${otifDelta}%` : '—', dirty ? '#d03b3b' : 'var(--muted)')}
              {metric(<TrendingDown size={11} />, 'Coal Days Δ', dirty ? `${coalDaysDelta}d` : '—', dirty ? '#b9770f' : '')}
              {metric(<IndianRupee size={11} />, 'Cost Impact', dirty ? `₹${costDelta} Cr` : '—', dirty ? '#e0685b' : '')}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Illustrative estimate — run the simulation for a full AI analysis and mitigation playbook.</p>
          </div>

          <div className="liquid-card rounded-2xl p-5 min-h-[280px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2"><AlertTriangle size={15} className="text-red-500" /> AI Impact Analysis</h3>
              {result && <button onClick={copy} className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">{copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}</button>}
            </div>
            {running ? (
              <div className="flex items-center gap-2 text-slate-500 py-16 justify-center"><Loader2 size={18} className="animate-spin" /> Simulating cascading impacts…</div>
            ) : result ? (
              <Markdown text={result} />
            ) : (
              <div className="text-center text-slate-400 py-16 text-sm">Set the levers (or pick a preset) and run the simulation to see the AI impact analysis.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
