import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal, Building2, MapPin, CalendarRange, RotateCcw } from 'lucide-react';
import { OrgUnit } from '@supplymind/shared';
import {
  ALL_UNITS, ALL_LOCATIONS, ScopeState, defaultScope, locationsForUnit, scopePlants,
  PeriodState, PeriodMode, defaultPeriod, periodMonths, periodLabel, periodTag,
  ResolvedFilter, FIRST_MONTH, LATEST_MONTH,
} from '../../lib/filters';

const selCls =
  'text-xs font-medium rounded-lg pl-7 pr-2 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500/40 appearance-none';
const monthCls =
  'text-xs font-medium rounded-lg px-2 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500/40 [color-scheme:light] dark:[color-scheme:dark]';

const MODES: PeriodMode[] = ['Monthly', 'Quarterly', 'Yearly', 'Range'];
const MODE_LABEL: Record<PeriodMode, string> = { Monthly: 'Month', Quarterly: 'Quarter', Yearly: 'Year', Range: 'Range' };

export const FilterBar: React.FC<{
  units?: OrgUnit[];
  plants: string[];               // all plant names (fallback when no units)
  onChange: (f: ResolvedFilter) => void;
}> = ({ units, plants, onChange }) => {
  const [scope, setScope] = useState<ScopeState>(defaultScope);
  const [period, setPeriod] = useState<PeriodState>(defaultPeriod);
  const hasUnits = !!units && units.length > 0;

  const locations = useMemo(
    () => (hasUnits ? locationsForUnit(units, scope.unit) : [ALL_LOCATIONS, ...plants]),
    [hasUnits, units, scope.unit, plants],
  );

  const resolved: ResolvedFilter = useMemo(() => ({
    plants: scopePlants(hasUnits ? units : undefined, scope) ?? (scope.location !== ALL_LOCATIONS ? [scope.location] : null),
    months: period.mode === 'Yearly' ? null : periodMonths(period),
    mode: period.mode,
    label: periodLabel(period),
    tag: periodTag(period),
  }), [units, hasUnits, scope, period]);

  // Emit on change without depending on onChange identity (avoids render loops).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => { onChangeRef.current(resolved); }, [resolved]);

  const isDefault =
    scope.unit === ALL_UNITS && scope.location === ALL_LOCATIONS &&
    period.mode === 'Monthly' && period.asOf === LATEST_MONTH;

  const reset = () => { setScope(defaultScope()); setPeriod(defaultPeriod()); };

  return (
    <div className="liquid-card rounded-xl px-3 py-2.5 mb-5 flex items-center gap-2.5 flex-wrap">
      <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
        <SlidersHorizontal size={13} /> Filters
      </span>

      {/* Unit */}
      {hasUnits && (
        <div className="relative">
          <Building2 size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            className={selCls}
            value={scope.unit}
            onChange={(e) => setScope({ unit: e.target.value, location: ALL_LOCATIONS })}
            aria-label="Unit"
          >
            <option value={ALL_UNITS}>All Units</option>
            {units!.map((u) => <option key={u.key} value={u.name}>{u.name}</option>)}
          </select>
        </div>
      )}

      {/* Location */}
      <div className="relative">
        <MapPin size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <select
          className={selCls}
          value={scope.location}
          onChange={(e) => setScope((s) => ({ ...s, location: e.target.value }))}
          aria-label="Location"
        >
          {locations.map((l) => <option key={l} value={l}>{l === ALL_LOCATIONS ? 'All Locations' : l}</option>)}
        </select>
      </div>

      <span className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

      {/* Period mode segmented control */}
      <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setPeriod((p) => ({ ...p, mode: m }))}
            className={`text-[11px] font-semibold px-2.5 py-1.5 transition-colors ${
              period.mode === m
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white'
                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      {/* Month pickers (calendar) */}
      {(period.mode === 'Monthly' || period.mode === 'Quarterly') && (
        <input
          type="month" className={monthCls} min={FIRST_MONTH} max={LATEST_MONTH}
          value={period.asOf} onChange={(e) => setPeriod((p) => ({ ...p, asOf: e.target.value || LATEST_MONTH }))}
          aria-label="As-of month"
        />
      )}
      {period.mode === 'Range' && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarRange size={13} className="text-slate-400" />
          <input type="month" className={monthCls} min={FIRST_MONTH} max={LATEST_MONTH}
            value={period.from} onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value || FIRST_MONTH }))} aria-label="From month" />
          <span className="text-xs text-slate-400">–</span>
          <input type="month" className={monthCls} min={FIRST_MONTH} max={LATEST_MONTH}
            value={period.to} onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value || LATEST_MONTH }))} aria-label="To month" />
        </span>
      )}

      <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline">
        showing <span className="font-semibold text-slate-700 dark:text-slate-200">{periodLabel(period)}</span>
      </span>

      {!isDefault && (
        <button onClick={reset} className="inline-flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 hover:underline ml-auto">
          <RotateCcw size={12} /> Reset
        </button>
      )}
    </div>
  );
};
