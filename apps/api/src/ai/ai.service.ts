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
