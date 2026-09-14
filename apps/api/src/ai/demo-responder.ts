// Dataset-driven demo responses. Used when no real LLM provider is configured,
// so the "demo mode" answers reflect whichever org's sample data is active
// (Bajaj Energy power sector vs the pharma demo) rather than hardcoded text.
import { SiteDataset } from '../mis/datasets';
import { KpiTile } from '@supplymind/shared';

function tileLine(t: KpiTile): string {
  const parts = [`**${t.label}: ${t.value}**`];
  if (t.delta) parts.push(`(${t.delta})`);
  if (t.sublabel) parts.push(`— ${t.sublabel}`);
  return parts.join(' ');
}

function findTiles(tiles: KpiTile[], keywords: string[]): KpiTile[] {
  return tiles.filter((t) => keywords.some((k) => t.label.toLowerCase().includes(k)));
}

function chartBlock(type: 'bar' | 'line', title: string, unit: string, data: { name: string; value: number }[]): string {
  return '\n\n```chart\n' + JSON.stringify({ type, title, unit, data }) + '\n```';
}

export function demoChat(query: string, ds: SiteDataset): string {
  const q = query.toLowerCase();
  const ex = ds.executive;
  const proc = ds.procurement;
  const inv = ds.inventory;

  const topAlert = ds.alerts.find((a) => a.severity === 'critical') || ds.alerts[0];

  // Chart-intent questions → prose + a chart block the UI renders.
  const wantsChart = /(chart|plot|graph|visuali|breakdown|compare|by plant|by category|by vendor)/.test(q);
  if (wantsChart) {
    if (/coal|stock day|by plant|rake/.test(q) && inv.coalStockByPlant.length) {
      const data = inv.coalStockByPlant.map((p) => ({ name: p.plant, value: p.coalStockDays }));
      const worst = [...inv.coalStockByPlant].sort((a, b) => a.coalStockDays - b.coalStockDays)[0];
      return `**Coal stock days by plant.** ${worst.plant} is the constraint at **${worst.coalStockDays} days** (CEA norm ≥ 12). Escalate rake supply and blend imported coal to protect it.` +
        chartBlock('bar', 'Coal Stock Days by Plant', 'days', data);
    }
    if (/vendor|on-time|delivery|supplier/.test(q)) {
      return `**On-time delivery by vendor.** Lowest performers need attention before they hit service.` +
        chartBlock('bar', 'On-Time Delivery by Vendor', '%', proc.onTimeByVendor);
    }
    if (/inventory|value/.test(q)) {
      return `**Inventory value by category.** Coal dominates; spares are where working capital can be optimized.` +
        chartBlock('bar', 'Inventory Value by Category', ex.currency === 'INR' ? '₹ Cr' : '$M', inv.valueByCategory);
    }
    // default: spend by category
    return `**Procurement spend by category.** Coal is the dominant lever at the top.` +
      chartBlock('bar', 'Spend by Category', ex.currency === 'INR' ? '₹ Cr' : '$M', proc.spendByCategory);
  }

  // Route by intent to the most relevant KPI group.
  if (/(coal|stock day|rake|fuel)/.test(q) && inv.coalStockByPlant.length) {
    const worst = [...inv.coalStockByPlant].sort((a, b) => a.coalStockDays - b.coalStockDays)[0];
    return `**Coal Stock — ${worst.plant}: ${worst.coalStockDays} days** (${worst.status.toUpperCase()})

Fleet weighted coal stock is ${inv.kpis.find((k) => k.label.includes('Coal'))?.value ?? 'n/a'}. ${worst.plant} is the constraint at ${worst.dailyRequirementMT.toLocaleString()} MT/day burn.

**Recommendation:** ${topAlert?.recommendation ?? 'Escalate rake indent and blend imported coal to protect stock.'}`;
  }

  if (/(spend|cost|procure|budget|vendor|supplier|po |purchase)/.test(q)) {
    const lines = proc.kpis.slice(0, 4).map((k) => `- ${tileLine(k)}`).join('\n');
    const topVendor = proc.topVendors[0];
    return `**Procurement Snapshot — ${ex.orgName}**
${lines}

**Top vendor:** ${topVendor.vendor} (${topVendor.category}) — on-time ${topVendor.onTimePct}%.

**Recommendation:** Focus on the lowest on-time vendors and overdue open POs to protect service and cost.`;
  }

  if (/(inventory|stock|turnover|excess|obsolete|safety)/.test(q)) {
    const lines = inv.kpis.slice(0, 4).map((k) => `- ${tileLine(k)}`).join('\n');
    const below = inv.items.filter((i) => i.status === 'below_safety' || i.status === 'stockout');
    return `**Inventory Health — ${ex.orgName}**
${lines}

**${below.length} item(s) below safety / stocked-out**, incl. ${below.slice(0, 3).map((i) => i.material).join(', ') || 'none'}.

**Recommendation:** Prioritize emergency replenishment for critical spares with long OEM lead times.`;
  }

  // Default: executive briefing.
  const head = ex.headline.slice(0, 5).map((k) => `- ${tileLine(k)}`).join('\n');
  return `**Executive Briefing — ${ex.orgName} (${ex.sector})**
${head}

${topAlert ? `**Top exception:** ${topAlert.title} — ${topAlert.message}` : ''}

**Recommendation:** ${topAlert?.recommendation ?? 'Review the largest variance driver and act within 72 hours.'}`;
}

export function demoScenario(
  params: { demandSurge: number; supplierDelay: number; portCongestion: boolean; priceSpike?: number; plantOutage?: boolean },
  ds: SiteDataset,
): string {
  const impacts: string[] = [];
  let severity = 'LOW';
  const bump = (to: string) => { severity = severity === 'CRITICAL' ? 'CRITICAL' : to; };
  if (params.demandSurge > 15) {
    bump('HIGH');
    impacts.push(`**Load / Demand +${params.demandSurge}%:** consumption rises across the fleet — coverage and stock-days compress; expect earlier reorder triggers on A-class items.`);
  } else if (params.demandSurge > 0) {
    impacts.push(`**Load / Demand +${params.demandSurge}%:** absorbed by current buffers; monitor A-class critical spares.`);
  }
  if (params.supplierDelay > 5) {
    bump('CRITICAL');
    impacts.push(`**Supply / Coal Delay ${params.supplierDelay}d:** service level drops; critical items with long OEM lead times (e.g. ${ds.inventory.items.find((i) => i.xyzClass === 'Z')?.material ?? 'key spares'}) are most exposed.`);
  } else if (params.supplierDelay > 0) {
    impacts.push(`**Supply / Coal Delay ${params.supplierDelay}d:** within buffer; expedite the next replenishment cycle.`);
  }
  if (params.portCongestion) {
    bump('HIGH');
    impacts.push(`**Logistics / Rake Disruption:** inbound rakes/parcels delayed 8–14 days; consider alternative sourcing and premium freight.`);
  }
  if (params.priceSpike && params.priceSpike > 0) {
    bump(params.priceSpike > 10 ? 'HIGH' : 'MODERATE');
    const spend = ds.procurement.spendByCategory[0];
    impacts.push(`**Input Price Spike +${params.priceSpike}%:** ~₹${Math.round((spend?.value ?? 100) * params.priceSpike / 100)} Cr added cost on ${spend?.name ?? 'top category'}; renegotiate contracts, advance-buy against fixed price and re-optimize the sourcing mix.`);
  }
  if (params.plantOutage) {
    bump('CRITICAL');
    impacts.push(`**Plant / Unit Outage:** output loss and demand redistribution to sister plants; critical-spare demand spikes and overhaul window pressure increases.`);
  }
  if (!impacts.length) return `**Baseline Scenario — ${ds.executive.orgName}**\nAll systems within normal parameters. No mitigation required.`;
  return `**Impact — ${ds.executive.orgName} · Severity: ${severity}**\n\n${impacts.join('\n')}\n\n**Mitigation:** convene an emergency review within 24h; expedite overdue POs; pre-position buffer stock for critical items; activate alternate sourcing where price/logistics are hit.`;
}

export function demoDraft(prompt: string, ds: SiteDataset): string {
  const top = ds.alerts.find((a) => a.severity === 'critical') || ds.alerts[0];
  return `SUPPLY CHAIN ADVISORY — ${ds.executive.orgName}
Generated by RLAI SupplyMind

Subject: ${top?.title ?? 'Operational advisory'}

${top?.message ?? 'Advisory based on current supply-chain status.'}

Recommended action: ${top?.recommendation ?? 'Review and approve via standard change management.'}

(Draft — review before issuing.)`;
}

export function demoInsight(kind: string, name: string, ds: SiteDataset): string {
  const ex = ds.executive;
  const worstAlert = ds.alerts.find((a) => a.severity === 'critical') || ds.alerts[0];
  if (kind === 'kpi') {
    return `${name} for ${ex.orgName} is trending against target. Review it against the plan and act on the largest variance driver within 72 hours.`;
  }
  return `${worstAlert?.title ?? name}: ${worstAlert?.message ?? 'Cross-referencing procurement and inventory data suggests action within 72 hours.'} ${worstAlert?.recommendation ?? ''}`.trim();
}
