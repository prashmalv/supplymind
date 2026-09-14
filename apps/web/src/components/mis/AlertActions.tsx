import React, { useState } from 'react';
import { Search, ListChecks, Loader2, X } from 'lucide-react';
import { MisAlert } from '@supplymind/shared';
import { api } from '../../lib/apiClient';
import { Markdown } from '../Markdown';

type Mode = 'root-cause' | 'action-plan';

/** AI action buttons for an exception — root-cause analysis and action plan,
 *  answered inline by the AI (SOW: AI-based recommendations & exception mgmt). */
export const AlertActions: React.FC<{ alert: MisAlert }> = ({ alert }) => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const run = async (m: Mode) => {
    if (mode === m && result) { setMode(null); setResult(''); return; }
    setMode(m);
    setLoading(true);
    setResult('');
    const ask = m === 'root-cause'
      ? `Do a concise AI root-cause analysis for this exception: "${alert.title}" — ${alert.message}. Give the most likely root cause, contributing factors, and one way to confirm it. Keep it tight.`
      : `Create a concise, prioritized AI action plan to resolve this exception: "${alert.title}" — ${alert.message}. Give 3–5 concrete steps with a suggested owner and timeline each. End with the expected outcome.`;
    try {
      const { text } = await api.post<{ text: string }>('/ai/chat', { history: [], message: ask });
      setResult(text);
    } catch {
      setResult('Could not generate this analysis just now. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => run('root-cause')}
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-md px-2.5 py-1 border transition-colors ${mode === 'root-cause' ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-red-400'}`}>
          <Search size={12} /> AI Root Cause
        </button>
        <button onClick={() => run('action-plan')}
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-md px-2.5 py-1 border transition-colors ${mode === 'action-plan' ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-red-400'}`}>
          <ListChecks size={12} /> AI Action Plan
        </button>
      </div>

      {mode && (
        <div className="mt-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-3 relative">
          <button onClick={() => { setMode(null); setResult(''); }} className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={14} /></button>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-red-500 mb-1.5">
            {mode === 'root-cause' ? 'AI Root-Cause Analysis' : 'AI Action Plan'}
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-2"><Loader2 size={15} className="animate-spin" /> Analyzing…</div>
          ) : (
            <Markdown text={result} />
          )}
        </div>
      )}
    </div>
  );
};
