import { ProcurementMis, InventoryMis, KpiTile, TrendPoint, NamedValue, OrgUnit } from '@supplymind/shared';

// ---------------------------------------------------------------------------
// Time model. The demo dataset spans Aug 2025 → Mar 2026 (fiscal window).
// "Current" month = the latest month present in the data (Mar 2026), so the
// default period is dynamic, never a hard-coded label.
// ---------------------------------------------------------------------------

export interface MonthDef { ym: string; short: string; label: string }

export const MONTHS: MonthDef[] = [
  { ym: '2025-08', short: 'Aug', label: 'Aug 2025' },
  { ym: '2025-09', short: 'Sep', label: 'Sep 2025' },
  { ym: '2025-10', short: 'Oct', label: 'Oct 2025' },
  { ym: '2025-11', short: 'Nov', label: 'Nov 2025' },
  { ym: '2025-12', short: 'Dec', label: 'Dec 2025' },
  { ym: '2026-01', short: 'Jan', label: 'Jan 2026' },
  { ym: '2026-02', short: 'Feb', label: 'Feb 2026' },
  { ym: '2026-03', short: 'Mar', label: 'Mar 2026' },
];

export const FIRST_MONTH = MONTHS[0].ym;
export const LATEST_MONTH = MONTHS[MONTHS.length - 1].ym;

export type PeriodMode = 'Monthly' | 'Quarterly' | 'Yearly' | 'Range';

/** Raw period picker state (owned by the FilterBar). */
export interface PeriodState {
  mode: PeriodMode;
  asOf: string;   // 'YYYY-MM' — anchor month for Monthly/Quarterly/Yearly
  from: string;   // 'YYYY-MM' — Range start
  to: string;     // 'YYYY-MM' — Range end
}

export const defaultPeriod = (): PeriodState => ({
  mode: 'Monthly', asOf: LATEST_MONTH, from: MONTHS[Math.max(0, MONTHS.length - 3)].ym, to: LATEST_MONTH,
});

const ymIndex = (ym: string) => MONTHS.findIndex((m) => m.ym === ym);

/** Resolve a PeriodState to the list of short month labels it covers. */
export function periodMonths(p: PeriodState): string[] {
  const clamp = (i: number) => Math.min(MONTHS.length - 1, Math.max(0, i));
  if (p.mode === 'Yearly') return MONTHS.map((m) => m.short);
  if (p.mode === 'Range') {
    let a = ymIndex(p.from), b = ymIndex(p.to);
    if (a < 0) a = 0; if (b < 0) b = MONTHS.length - 1;
    if (a > b) [a, b] = [b, a];
    return MONTHS.slice(a, b + 1).map((m) => m.short);
  }
  const end = clamp(ymIndex(p.asOf) < 0 ? MONTHS.length - 1 : ymIndex(p.asOf));
  const span = p.mode === 'Quarterly' ? 3 : 1;
  return MONTHS.slice(clamp(end - span + 1), end + 1).map((m) => m.short);
}

/** Human label for the current period (used in KPI captions and the context chip). */
export function periodLabel(p: PeriodState): string {
  const byShort = (s: string) => MONTHS.find((m) => m.short === s)?.label ?? s;
  const months = periodMonths(p);
  if (p.mode === 'Yearly') return 'FY 2025-26 (YTD)';
  if (p.mode === 'Monthly') return byShort(months[0]);
  const first = byShort(months[0]), last = byShort(months[months.length - 1]);
  if (p.mode === 'Quarterly') return `Quarter · ${first} – ${last}`;
  return `${first} – ${last}`;
}

/** Short tag for KPI tile suffixes (MTD/QTD/YTD-ish). */
export function periodTag(p: PeriodState): string {
  return p.mode === 'Monthly' ? 'MTD' : p.mode === 'Quarterly' ? 'QTD' : p.mode === 'Yearly' ? 'YTD' : 'Range';
}

// ---------------------------------------------------------------------------
// Unit → Location scope
// ---------------------------------------------------------------------------

export const ALL_UNITS = 'All Units';
export const ALL_LOCATIONS = 'All Locations';

export interface ScopeState { unit: string; location: string }
export const defaultScope = (): ScopeState => ({ unit: ALL_UNITS, location: ALL_LOCATIONS });

/** Locations selectable for the chosen unit. */
export function locationsForUnit(units: OrgUnit[] | undefined, unit: string): string[] {
  if (!units || unit === ALL_UNITS) return [ALL_LOCATIONS, ...(units?.flatMap((u) => u.plants) ?? [])];
  const u = units.find((x) => x.name === unit || x.key === unit);
  return [ALL_LOCATIONS, ...(u?.plants ?? [])];
}

/** Resolve scope to a concrete plant list, or null for "everything". */
export function scopePlants(units: OrgUnit[] | undefined, s: ScopeState): string[] | null {
  if (s.location !== ALL_LOCATIONS) return [s.location];
  if (s.unit !== ALL_UNITS) {
    const u = units?.find((x) => x.name === s.unit || x.key === s.unit);
    return u ? u.plants : null;
  }
  return null;
}

/** Map a plant name to its unit short label (for injected Unit columns). */
export function unitOfPlant(units: OrgUnit[] | undefined, plant: string): string {
  return units?.find((u) => u.plants.some((p) => plant.startsWith(p)))?.short ?? '—';
}

// ---------------------------------------------------------------------------
// The resolved filter that pages pass to the transform functions.
// ---------------------------------------------------------------------------

export interface ResolvedFilter {
  plants: string[] | null;   // null = all
  months: string[] | null;   // short labels; null = all
  mode: PeriodMode;
  label: string;
  tag: string;
}

const money = (v: number, cur: string) =>
  `${cur === 'INR' ? '₹' : '$'}${Math.round(v).toLocaleString('en-IN')}${cur === 'INR' ? ' Cr' : 'M'}`;

const num = (s: string | undefined) => (s ? Number(s.replace(/[^0-9.]/g, '')) : 0);
const matchesPlant = (name: string, plants: string[]) => plants.some((p) => name.startsWith(p) || name === p);

const scaleNV = (arr: NamedValue[] | undefined, f: number): NamedValue[] | undefined =>
  arr?.map((n) => ({ ...n, value: +(n.value * f).toFixed(1) }));

function windowTrend(arr: TrendPoint[] | undefined, months: string[] | null, f = 1): TrendPoint[] | undefined {
  if (!arr) return arr;
  const sliced = months ? arr.filter((p) => months.includes(String(p.period))) : arr;
  const base = sliced.length ? sliced : arr;
  if (f === 1) return base;
  return base.map((p) => {
    const out: TrendPoint = { period: p.period };
    for (const k of Object.keys(p)) if (k !== 'period') out[k] = typeof p[k] === 'number' ? +((p[k] as number) * f).toFixed(1) : p[k];
    return out;
  });
}

const sumSeries = (row: TrendPoint) =>
  Object.keys(row).reduce((s, k) => (k !== 'period' && typeof row[k] === 'number' ? s + (row[k] as number) : s), 0);

// ---- Procurement ----

function procShare(data: ProcurementMis, plants: string[] | null): number {
  if (!plants) return 1;
  const total = data.spendByPlant.reduce((s, p) => s + p.value, 0) || 1;
  const sub = data.spendByPlant.filter((p) => matchesPlant(p.name, plants)).reduce((s, p) => s + p.value, 0);
  return sub > 0 ? sub / total : 0.15;
}

export function filterProcurement(data: ProcurementMis, f: ResolvedFilter): ProcurementMis {
  const cur = data.currency;
  const share = procShare(data, f.plants);
  const isAllPlants = !f.plants;
  const selMonths = f.months;

  // Total spend for the selected period: YTD comes from the period figure;
  // a month/quarter/range is summed from the monthly-spend series.
  let totalSpend: number;
  if (f.mode === 'Yearly' || !selMonths) {
    totalSpend = num(data.spendPeriods?.ytd) * share;
  } else {
    const rows = data.monthlySpend.filter((m) => selMonths.includes(String(m.period)));
    totalSpend = (rows.length ? rows : data.monthlySpend).reduce((s, r) => s + sumSeries(r), 0) * share;
  }
  const periodFraction = f.mode === 'Yearly' || !selMonths ? 1 : Math.min(selMonths.length / 6, 1);

  const kpis: KpiTile[] = data.kpis.map((k) => {
    if (/total spend/i.test(k.label)) {
      return { ...k, label: `Total Spend (${f.tag})`, value: money(totalSpend, cur), raw: totalSpend, delta: undefined, sublabel: f.label };
    }
    if (/open po value/i.test(k.label)) {
      const raw = (k.raw ?? 0) * share;
      return { ...k, value: money(raw, cur), raw, sublabel: isAllPlants ? k.sublabel : f.plants!.join(', ') };
    }
    return k;
  });

  const spendPeriods = data.spendPeriods && !isAllPlants
    ? {
        mtd: money(num(data.spendPeriods.mtd) * share, cur),
        qtd: money(num(data.spendPeriods.qtd) * share, cur),
        ytd: money(num(data.spendPeriods.ytd) * share, cur),
        budgetYtd: data.spendPeriods.budgetYtd ? money(num(data.spendPeriods.budgetYtd) * share, cur) : undefined,
      }
    : data.spendPeriods;

  return {
    ...data,
    kpis,
    spendPeriods,
    monthlySpend: windowTrend(data.monthlySpend, selMonths, share) || data.monthlySpend,
    budgetVsActual: windowTrend(data.budgetVsActual, selMonths, share),
    spendByCategory: scaleNV(data.spendByCategory, share * periodFraction) || data.spendByCategory,
    spendByPlant: isAllPlants ? data.spendByPlant : data.spendByPlant.filter((p) => matchesPlant(p.name, f.plants!)),
    openPos: isAllPlants ? data.openPos : data.openPos.filter((p) => f.plants!.includes(p.plant)),
    approvalPending: data.approvalPending?.map((a) => ({ ...a, count: Math.round(a.count * share), amount: +(a.amount * share).toFixed(1) })),
    prPoAging: data.prPoAging?.map((r) => ({ ...r, prCount: Math.round(r.prCount * share), prValue: +(r.prValue * share).toFixed(1), poCount: Math.round(r.poCount * share), poValue: +(r.poValue * share).toFixed(1) })),
    emergencyProcurement: data.emergencyProcurement ? { ...data.emergencyProcurement, count: Math.round(data.emergencyProcurement.count * share), amount: +(data.emergencyProcurement.amount * share).toFixed(1) } : undefined,
  };
}

// ---- Inventory ----

function invShare(data: InventoryMis, plants: string[] | null): number {
  if (!plants) return 1;
  const total = data.items.reduce((s, i) => s + i.value, 0) || 1;
  const sub = data.items.filter((i) => plants.includes(i.plant)).reduce((s, i) => s + i.value, 0);
  return sub > 0 ? Math.max(sub / total, 0.08) : 0.12;
}

export function filterInventory(data: InventoryMis, f: ResolvedFilter): InventoryMis {
  const cur = data.currency;
  const share = invShare(data, f.plants);
  const isAll = !f.plants;
  const inScope = (plant: string) => isAll || f.plants!.includes(plant);
  const byPlant = <T extends { plant: string }>(rows: T[]) => (isAll ? rows : rows.filter((r) => inScope(r.plant)));

  const kpis: KpiTile[] = data.kpis.map((k) => {
    if (/inventory value/i.test(k.label)) {
      const raw = (k.raw ?? 0) * share;
      return { ...k, value: money(raw, cur), raw, sublabel: isAll ? k.sublabel : f.plants!.join(', ') };
    }
    if (/below safety/i.test(k.label)) {
      const n = data.items.filter((i) => inScope(i.plant) && (i.status === 'below_safety' || i.status === 'stockout')).length;
      return { ...k, value: `${n} items` };
    }
    if (/coal stock/i.test(k.label) && !isAll && f.plants!.length === 1) {
      const cs = data.coalStockByPlant.find((c) => c.plant === f.plants![0]);
      if (cs) return { ...k, value: `${cs.coalStockDays} days`, sublabel: `${f.plants![0]} · CEA norm ≥ 12` };
    }
    return k;
  });

  return {
    ...data,
    kpis,
    valueByCategory: scaleNV(data.valueByCategory, share) || data.valueByCategory,
    agingBuckets: scaleNV(data.agingBuckets, share) || data.agingBuckets,
    coalStockByPlant: isAll ? data.coalStockByPlant : data.coalStockByPlant.filter((c) => inScope(c.plant)),
    abcXyz: data.abcXyz.map((c) => ({ ...c, count: Math.round(c.count * share), value: +(c.value * share).toFixed(1) })),
    ved: data.ved?.map((c) => ({ ...c, count: Math.round(c.count * share), value: +(c.value * share).toFixed(1) })),
    fsn: data.fsn?.map((c) => ({ ...c, count: Math.round(c.count * share), value: +(c.value * share).toFixed(1) })),
    inventoryTrend: windowTrend(data.inventoryTrend, f.months, share),
    items: byPlant(data.items),
    criticalSpares: data.criticalSpares ? byPlant(data.criticalSpares) : undefined,
    deadStock: data.deadStock ? { totalValue: money(data.deadStock.items.filter((d) => inScope(d.plant)).reduce((s, d) => s + d.value, 0), cur), items: byPlant(data.deadStock.items) } : undefined,
  };
}
