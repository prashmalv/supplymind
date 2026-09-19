import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmMessage } from './llm.provider';
import { AzureOpenAiProvider } from './providers/azure-openai.provider';
import { MisService } from '../mis/mis.service';
import { SiteDataset } from '../mis/datasets';
import { demoChat, demoScenario, demoDraft, demoInsight } from './demo-responder';

interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly providerId: string;
  private readonly provider: LlmProvider | null;

  constructor(config: ConfigService, private mis: MisService) {
    this.providerId = config.get<string>('ai.provider') || 'demo';
    this.provider = this.resolveProvider(this.providerId);
    if (this.providerId !== 'demo' && !this.provider) {
      this.logger.warn(
        `AI_PROVIDER=${this.providerId} but it is not configured; using data-driven demo responses.`,
      );
    }
  }

  private resolveProvider(id: string): LlmProvider | null {
    switch (id) {
      case 'azure-openai':
        return AzureOpenAiProvider.fromEnv();
      // case 'bedrock': return BedrockProvider.fromEnv();  // Phase 7
      default:
        return null;
    }
  }

  private systemPrompt(ds: SiteDataset, suffix = ''): string {
    // Exact series the model may chart, so numbers are always correct.
    const chartData = {
      coalStockDaysByPlant: ds.inventory.coalStockByPlant.map((p) => ({ name: p.plant, value: p.coalStockDays })),
      spendByCategory: ds.procurement.spendByCategory,
      inventoryValueByCategory: ds.inventory.valueByCategory,
      onTimePctByVendor: ds.procurement.onTimeByVendor,
      spendByVendor: ds.procurement.topVendors.map((v) => ({ name: v.vendor, value: v.spend })),
    };
    // Structured tabular data the model may combine / filter into custom reports.
    const dataCatalog = {
      readyReports: (ds.reports ?? []).map((r) => ({ name: r.name, group: r.group, columns: r.columns, rows: r.rows })),
      procurement: {
        openPurchaseOrders: ds.procurement.openPos,
        vendors: ds.procurement.topVendors,
        onTimeByVendor: ds.procurement.onTimeByVendor,
        contractExpiry: ds.procurement.contractExpiry,
        bankGuarantees: ds.procurement.bankGuarantees,
        vendorOutstanding: ds.procurement.vendorOutstanding,
        approvalPending: ds.procurement.approvalPending,
        prPoAging: ds.procurement.prPoAging,
        budgetVsActual: ds.procurement.budgetVsActual,
        monthlySpend: ds.procurement.monthlySpend,
      },
      inventory: {
        stockItems: ds.inventory.items,
        criticalSpares: ds.inventory.criticalSpares,
        deadStock: ds.inventory.deadStock?.items,
        scrap: ds.inventory.scrap,
        coalStockByPlant: ds.inventory.coalStockByPlant,
      },
      forecast: ds.forecast?.materials?.map((m) => ({
        material: m.material, code: m.code, category: m.category, plant: m.plant, method: m.method,
        mape: m.mape, currentStock: m.currentStock, safetyStock: m.safetyStock, recommendedSafety: m.recommendedSafety,
        reorderPoint: m.reorderPoint, leadTimeDays: m.leadTimeDays, stockoutInDays: m.stockoutInDays, recommendedOrderQty: m.recommendedOrderQty, status: m.status,
      })),
    };
    return (
      ds.aiContext +
      '\n\nFORMATTING RULES:\n' +
      '- Reply in clean GitHub-flavoured markdown. Use **bold** for emphasis, "- " for bullets, and short paragraphs.\n' +
      '- Do NOT output stray markup characters, HTML, or unmatched asterisks. Keep it tidy and scannable.\n' +
      '- Professional executive tone; be concise; start with the number/status, then the insight, then end with an actionable recommendation.\n\n' +
      'CHARTS:\n' +
      '- When the user asks to chart/plot/visualize/graph/show a breakdown or comparison, append EXACTLY ONE fenced code block labelled chart, on its own lines, containing JSON of the form:\n' +
      '```chart\n{"type":"bar","title":"<title>","unit":"<unit>","data":[{"name":"<label>","value":<number>}]}\n```\n' +
      '- Use type "bar" for comparisons/breakdowns and "line" for trends over time. Use ONLY the exact figures below; never invent numbers. Put a short sentence of prose before the chart. Do not add a chart unless a visual was requested.\n' +
      'CHART DATA (exact figures, currency in ₹ Crore where monetary):\n' +
      JSON.stringify(chartData) +
      '\n\nREPORT / EXPORT BUILDER (IMPORTANT — follow exactly):\n' +
      '- TRIGGER: any request to build, create, generate, make, prepare, combine, merge, join, filter, subset, "list out", export, download, or produce a report / table / Excel / CSV / spreadsheet / dataset.\n' +
      '- On a trigger you MUST reply with ONE short sentence (name of the report + row count), then EXACTLY ONE fenced code block labelled report, on its own lines, containing JSON of this exact shape:\n' +
      '```report\n{"filename":"overdue-pos","title":"Overdue Purchase Orders","columns":["PO Number","Vendor","Material","Value (Cr)","Days Overdue"],"rows":[["45010023","Northern Coalfields Ltd","Steam Coal G11 (rakes)",118.5,3]]}\n```\n' +
      '- CRITICAL: every cell MUST be copied from the DATA CATALOG below. NEVER output "TBD", "-", blanks, guesses, rounded-off names, or example values. If a value is not in the catalog, leave that row out. Do NOT use figures from the narrative above — only the catalog arrays.\n' +
      '- COMBINE by joining on a shared key (vendor name, material code, PO number, plant, month). FILTER by keeping only rows meeting the user\'s condition (e.g. status == "overdue", onHand < safetyStock, a named plant, a given month).\n' +
      '- Numbers stay numeric (no ₹ or unit text inside a numeric cell); put units in the column header. The app renders the block as a table with Download CSV and Download Excel buttons.\n' +
      '- Only skip the report block if the user clearly wants to just read 2–3 values (then use a small markdown table). If none of the requested fields exist in the catalog, say so in one line and emit no block.\n' +
      'CATALOG FIELD GUIDE (use these exact source fields):\n' +
      '- procurement.openPurchaseOrders[]: poNumber, vendor, material, plant, value, deliveryDate, daysOverdue, status ("overdue"|"due_soon"|"on_track")\n' +
      '- procurement.vendors[]: vendor, category, spend, onTimePct, qualityPct, reliability, poCount\n' +
      '- procurement.contractExpiry[]: contract, vendor, material, expiryDate, daysLeft, value, window\n' +
      '- procurement.bankGuarantees[]: vendor, bgNo, amount, expiryDate, status\n' +
      '- procurement.vendorOutstanding[]: vendor, outstanding, advance, msme\n' +
      '- procurement.approvalPending[]: stage, count, amount\n' +
      '- inventory.stockItems[]: material, code, category, plant, onHand, uom, safetyStock, reorderPoint, daysOfSupply, value, abcClass, xyzClass, status\n' +
      '- inventory.criticalSpares[]: material, code, plant, onHand, daysCover, status\n' +
      '- inventory.deadStock[]: material, code, plant, value, monthsNoMovement\n' +
      '- forecast[]: material, code, category, plant, method, mape, currentStock, safetyStock, recommendedSafety, reorderPoint, leadTimeDays, stockoutInDays, recommendedOrderQty, status\n' +
      '- readyReports[]: {name, columns, rows} — pre-built report tables you can slice, filter or combine.\n' +
      'DATA CATALOG (exact rows; amounts in ₹ Crore unless the field name says otherwise):\n' +
      JSON.stringify(dataCatalog) +
      (suffix ? '\n' + suffix : '')
    );
  }

  private async run(messages: LlmMessage[], fallback: () => string): Promise<string> {
    if (!this.provider) return fallback();
    try {
      const text = await this.provider.chat(messages);
      return text?.trim() || fallback();
    } catch (err) {
      this.logger.error(`AI provider call failed, using fallback: ${(err as Error).message}`);
      return fallback();
    }
  }

  async chat(
    orgId: string,
    history: ChatHistoryItem[],
    message: string,
    image?: { data: string; mimeType: string },
  ) {
    const ds = await this.mis.datasetForOrg(orgId);
    const messages: LlmMessage[] = [{ role: 'system', content: this.systemPrompt(ds) }];
    for (const h of history.slice(-12)) {
      messages.push({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text });
    }
    messages.push({ role: 'user', content: message, image });
    return this.run(messages, () => demoChat(message, ds));
  }

  async draft(orgId: string, prompt: string) {
    const ds = await this.mis.datasetForOrg(orgId);
    const messages: LlmMessage[] = [
      { role: 'system', content: this.systemPrompt(ds, 'You are drafting a formal business communication. Be concise and professional.') },
      { role: 'user', content: prompt },
    ];
    return this.run(messages, () => demoDraft(prompt, ds));
  }

  async scenario(orgId: string, params: { demandSurge: number; supplierDelay: number; portCongestion: boolean; priceSpike?: number; plantOutage?: boolean }) {
    const ds = await this.mis.datasetForOrg(orgId);
    const prompt = `WHAT-IF SCENARIO SIMULATION for ${ds.executive.orgName} (${ds.executive.sector}):
- Demand / Load Surge: +${params.demandSurge}%
- Supplier / Coal Delay: ${params.supplierDelay} days
- Logistics / Rake Disruption: ${params.portCongestion ? 'ACTIVE' : 'None'}
- Input Price Spike: +${params.priceSpike ?? 0}%
- Plant / Unit Outage: ${params.plantOutage ? 'ACTIVE' : 'None'}
Analyze cascading impacts on generation/service, coal-stock-days/inventory, critical spares, working capital and cost. Quantify where possible using the org's figures. Provide a ranked mitigation playbook with cost/speed trade-offs. Use markdown with a short **Impact** summary, a bullet list of effects, and a **Mitigation** list. Amounts in ₹ Crore.`;
    const messages: LlmMessage[] = [
      { role: 'system', content: this.systemPrompt(ds) },
      { role: 'user', content: prompt },
    ];
    return this.run(messages, () => demoScenario(params, ds));
  }

  async insight(
    orgId: string,
    kind: 'chart' | 'kpi' | 'forecast',
    name: string,
    context: unknown,
    value?: unknown,
    trend?: string,
  ) {
    const ds = await this.mis.datasetForOrg(orgId);
    const detail =
      kind === 'kpi'
        ? `KPI "${name}": ${JSON.stringify(value)}, trend ${trend}.`
        : `${kind} "${name}" with data: ${JSON.stringify(context)}.`;
    const messages: LlmMessage[] = [
      { role: 'system', content: this.systemPrompt(ds, 'Provide 2 concise, specific sentences with concrete numbers and one action recommendation.') },
      { role: 'user', content: detail },
    ];
    return this.run(messages, () => demoInsight(kind, name, ds));
  }

  async speech(text: string): Promise<string | null> {
    if (this.provider?.speech) {
      try {
        return await this.provider.speech(text);
      } catch {
        return null;
      }
    }
    return null;
  }

  liveToken() {
    return {
      configured: false,
      provider: this.providerId,
      message:
        'Live voice is not configured for this deployment. Configure a realtime voice provider to enable it.',
    };
  }
}
