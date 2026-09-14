import { ProcurementMis, InventoryMis, KpiTile, TrendPoint, NamedValue } from '@supplymind/shared';

export type Period = 'Monthly' | 'Quarterly' | 'Yearly';
export const PERIODS: Period[] = ['Monthly', 'Quarterly', 'Yearly'];

const periodCfg: Record<Period, { months: number; key: 'mtd' | 'qtd' | 'ytd'; label: string }> = {
  Monthly: { months: 1, key: 'mtd', label: 'MTD' },
  Quarterly: { months: 3, key: 'qtd', label: 'QTD' },
  Yearly: { months: 6, key: 'ytd', label: 'YTD' },
};

const money = (v: number, cur: string) =>
  `${cur === 'INR' ? '₹' : '$'}${Math.round(v).toLocaleString('en-IN')}${cur === 'INR' ? ' Cr' : 'M'}`;

const scaleNV = (arr: NamedValue[] | undefined, f: number): NamedValue[] | undefined =>
  arr?.map((n) => ({ ...n, value: +(n.value * f).toFixed(1) }));

const windowTrend = (arr: TrendPoint[] | undefined, months: number, f = 1): TrendPoint[] | undefined => {
  if (!arr) return arr;
  const sliced = months >= arr.length ? arr : arr.slice(-months);
  if (f === 1) return sliced;
  return sliced.map((p) => {
    const out: TrendPoint = { period: p.period };
    for (const k of Object.keys(p)) if (k !== 'period') out[k] = typeof p[k] === 'number' ? +((p[k] as number) * f).toFixed(1) : p[k];
    return out;
  });
};

/** Plant share for procurement, from spendByPlant (name startsWith the plant). */
function procShare(data: ProcurementMis, plant: string): number {
  if (plant === 'All Plants') return 1;
  const total = data.spendByPlant.reduce((s, p) => s + p.value, 0) || 1;
  const entry = data.spendByPlant.find((p) => p.name.startsWith(plant));
  return entry ? entry.value / total : 0.15;
}

export function filterProcurement(data: ProcurementMis, plant: string, period: Period): ProcurementMis {
  const cur = data.currency;
  const share = procShare(data, plant);
  const { months, key, label } = periodCfg[period];
  const isAll = plant === 'All Plants';

  // Period figure (scaled by plant share) for the total-spend KPI.
  const periodStr = data.spendPeriods?.[key];
  const periodNum = periodStr ? Number(periodStr.replace(/[^0-9.]/g, '')) : (data.kpis.find((k) => /total spend/i.test(k.label))?.raw ?? 0);
  const totalSpend = periodNum * share;
  const periodFraction = data.spendPeriods && data.spendPeriods.ytd
    ? periodNum / (Number(data.spendPeriods.ytd.replace(/[^0-9.]/g, '')) || 1)
    : months / 6;

  const kpis: KpiTile[] = data.kpis.map((k) => {
    if (/total spend/i.test(k.label)) {
      return { ...k, label: `Total Spend (${label})`, value: money(totalSpend, cur), raw: totalSpend, delta: undefined, sublabel: isAll ? label : plant };
    }
    if (/open po value/i.test(k.label)) {
      const raw = (k.raw ?? 0) * share;
      return { ...k, value: money(raw, cur), raw, sublabel: isAll ? k.sublabel : plant };
    }
    return k;
  });

  const spendPeriods = data.spendPeriods && !isAll
    ? {
        mtd: money(Number(data.spendPeriods.mtd.replace(/[^0-9.]/g, '')) * share, cur),
        qtd: money(Number(data.spendPeriods.qtd.replace(/[^0-9.]/g, '')) * share, cur),
        ytd: money(Number(data.spendPeriods.ytd.replace(/[^0-9.]/g, '')) * share, cur),
        budgetYtd: data.spendPeriods.budgetYtd ? money(Number(data.spendPeriods.budgetYtd.replace(/[^0-9.]/g, '')) * share, cur) : undefined,
      }
    : data.spendPeriods;

  return {
    ...data,
    kpis,
    spendPeriods,
    monthlySpend: windowTrend(data.monthlySpend, months, share) || data.monthlySpend,
    budgetVsActual: windowTrend(data.budgetVsActual, months, share),
    spendByCategory: scaleNV(data.spendByCategory, share * periodFraction) || data.spendByCategory,
    spendByPlant: isAll ? data.spendByPlant : data.spendByPlant.filter((p) => p.name.startsWith(plant)),
    openPos: isAll ? data.openPos : data.openPos.filter((p) => p.plant === plant),
    approvalPending: data.approvalPending?.map((a) => ({ ...a, count: Math.round(a.count * share), amount: +(a.amount * share).toFixed(1) })),
    prPoAging: data.prPoAging?.map((r) => ({ ...r, prCount: Math.round(r.prCount * share), prValue: +(r.prValue * share).toFixed(1), poCount: Math.round(r.poCount * share), poValue: +(r.poValue * share).toFixed(1) })),
    emergencyProcurement: data.emergencyProcurement ? { ...data.emergencyProcurement, count: Math.round(data.emergencyProcurement.count * share), amount: +(data.emergencyProcurement.amount * share).toFixed(1) } : undefined,
  };
}

/** Plant share for inventory, from items value per plant. */
function invShare(data: InventoryMis, plant: string): number {
  if (plant === 'All Plants') return 1;
  const total = data.items.reduce((s, i) => s + i.value, 0) || 1;
  const sub = data.items.filter((i) => i.plant === plant).reduce((s, i) => s + i.value, 0);
  return sub > 0 ? Math.max(sub / total, 0.08) : 0.12;
}

export function filterInventory(data: InventoryMis, plant: string, period: Period): InventoryMis {
  const cur = data.currency;
  const share = invShare(data, plant);
  const { months } = periodCfg[period];
  const isAll = plant === 'All Plants';
  const byPlant = <T extends { plant: string }>(rows: T[]) => (isAll ? rows : rows.filter((r) => r.plant === plant));

  const kpis: KpiTile[] = data.kpis.map((k) => {
    if (/inventory value/i.test(k.label)) {
      const raw = (k.raw ?? 0) * share;
      return { ...k, value: money(raw, cur), raw, sublabel: isAll ? k.sublabel : plant };
    }
    if (/below safety/i.test(k.label)) {
      const n = data.items.filter((i) => (isAll || i.plant === plant) && (i.status === 'below_safety' || i.status === 'stockout')).length;
      return { ...k, value: `${n} items` };
    }
    if (/coal stock/i.test(k.label) && !isAll) {
      const cs = data.coalStockByPlant.find((c) => c.plant === plant);
      if (cs) return { ...k, value: `${cs.coalStockDays} days`, sublabel: `${plant} · CEA norm ≥ 12` };
    }
    return k;
  });

  return {
    ...data,
    kpis,
    valueByCategory: scaleNV(data.valueByCategory, share) || data.valueByCategory,
    agingBuckets: scaleNV(data.agingBuckets, share) || data.agingBuckets,
    coalStockByPlant: isAll ? data.coalStockByPlant : data.coalStockByPlant.filter((c) => c.plant === plant),
    abcXyz: data.abcXyz.map((c) => ({ ...c, count: Math.round(c.count * share), value: +(c.value * share).toFixed(1) })),
    ved: data.ved?.map((c) => ({ ...c, count: Math.round(c.count * share), value: +(c.value * share).toFixed(1) })),
    fsn: data.fsn?.map((c) => ({ ...c, count: Math.round(c.count * share), value: +(c.value * share).toFixed(1) })),
    inventoryTrend: windowTrend(data.inventoryTrend, months, share),
    items: byPlant(data.items),
    criticalSpares: data.criticalSpares ? byPlant(data.criticalSpares) : undefined,
    deadStock: data.deadStock ? { totalValue: money(data.deadStock.items.filter((d) => isAll || d.plant === plant).reduce((s, d) => s + d.value, 0), cur), items: byPlant(data.deadStock.items) } : undefined,
  };
}
