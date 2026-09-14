import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

const selCls =
  'text-xs font-medium rounded-lg px-2.5 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500/40';

export const FilterBar: React.FC<{
  plants: string[];
  plant: string;
  onPlant: (v: string) => void;
  period: string;
  onPeriod: (v: string) => void;
  categories?: string[];
  category?: string;
  onCategory?: (v: string) => void;
}> = ({ plants, plant, onPlant, period, onPeriod, categories, category, onCategory }) => (
  <div className="flex items-center gap-2 flex-wrap mb-4 px-1">
    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
      <SlidersHorizontal size={13} /> Filters
    </span>
    <select className={selCls} value={plant} onChange={(e) => onPlant(e.target.value)} aria-label="Plant / Store">
      {plants.map((p) => <option key={p} value={p}>{p}</option>)}
    </select>
    {categories && onCategory && (
      <select className={selCls} value={category} onChange={(e) => onCategory(e.target.value)} aria-label="Category">
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    )}
    <select className={selCls} value={period} onChange={(e) => onPeriod(e.target.value)} aria-label="Period">
      <option value="Monthly">This month · Mar 2026</option>
      <option value="Quarterly">This quarter · Q4 (Jan–Mar 2026)</option>
      <option value="Yearly">This year · FY 2025-26</option>
    </select>
    <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden md:inline">
      {period === 'Monthly' ? 'showing Mar 2026' : period === 'Quarterly' ? 'showing Q4 FY26 (Jan–Mar)' : 'showing FY 2025-26 (YTD)'}
    </span>
    {(plant !== plants[0] || (category && categories && category !== categories[0])) && (
      <button
        onClick={() => { onPlant(plants[0]); if (onCategory && categories) onCategory(categories[0]); }}
        className="text-[11px] text-red-600 dark:text-red-400 hover:underline"
      >
        Clear
      </button>
    )}
  </div>
);
