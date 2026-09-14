// Client-side AI service. All calls now go to the SupplyMind API (NestJS),
// which holds the provider keys and grounds responses in the org's data.
// The exported `geminiService` keeps its original method signatures so the
// existing components need no changes. (Named for historical reasons; the
// backend provider is pluggable — Azure OpenAI for demo, Bedrock for prod.)
import { Message, ScenarioParams } from '../types';
import { api } from '../src/lib/apiClient';

class SupplyMindAiClient {
  async getChatResponse(
    history: Message[],
    newMessage: string,
    image?: { data: string; mimeType: string },
  ): Promise<string> {
    try {
      const res = await api.post<{ text: string }>('/ai/chat', {
        history: history.map((m) => ({ role: m.role, text: m.text })),
        message: newMessage,
        image,
      });
      return res.text || "I couldn't generate a response right now.";
    } catch (e) {
      console.error('chat error', e);
      return 'The AI service is unavailable right now. Please try again shortly.';
    }
  }

  async generateSpeech(text: string): Promise<string | null> {
    try {
      const res = await api.post<{ audio: string | null }>('/ai/tts', { text });
      return res.audio ?? null;
    } catch {
      return null;
    }
  }

  async generateDraft(prompt: string): Promise<string> {
    try {
      const res = await api.post<{ text: string }>('/ai/draft', { prompt });
      return res.text;
    } catch (e) {
      console.error('draft error', e);
      return 'Draft generation is unavailable right now.';
    }
  }

  async runScenarioSimulation(params: ScenarioParams): Promise<string> {
    try {
      const res = await api.post<{ text: string }>('/ai/scenario', params);
      return res.text;
    } catch (e) {
      console.error('scenario error', e);
      return 'Scenario simulation is unavailable right now.';
    }
  }

  async explainChartInsights(chartName: string, dataContext: any): Promise<string> {
    try {
      const res = await api.post<{ text: string }>('/ai/insight', {
        kind: 'chart',
        name: chartName,
        context: dataContext,
      });
      return res.text;
    } catch {
      return 'Chart analysis unavailable.';
    }
  }

  async explainKpiInsights(kpiName: string, kpiValue: any, trend: string): Promise<string> {
    try {
      const res = await api.post<{ text: string }>('/ai/insight', {
        kind: 'kpi',
        name: kpiName,
        value: kpiValue,
        trend,
      });
      return res.text;
    } catch {
      return 'KPI analysis unavailable.';
    }
  }

  async generateForecastInsight(skuData: any): Promise<string> {
    try {
      const res = await api.post<{ text: string }>('/ai/insight', {
        kind: 'forecast',
        name: 'forecast',
        context: skuData,
      });
      return res.text;
    } catch {
      return 'Forecast analysis unavailable.';
    }
  }

  /**
   * Live voice requires provider-specific realtime brokering, added in a later
   * phase. Until then this throws a clear, catchable error (callers already
   * handle it by showing an error state) so no provider key ever reaches the
   * browser.
   */
  async connectLiveSession(_callbacks: {
    onOpen: () => void;
    onMessage: (message: any) => void;
    onError: (e: any) => void;
    onClose: (e: any) => void;
  }): Promise<never> {
    let info: { configured: boolean; message?: string } = { configured: false };
    try {
      info = await api.post('/ai/live-token');
    } catch {
      /* fall through to the not-configured error */
    }
    throw new Error(info.message || 'Live voice is not configured for this deployment yet.');
  }
}

export const geminiService = new SupplyMindAiClient();
