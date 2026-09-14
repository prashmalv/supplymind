import { Logger } from '@nestjs/common';
import { LlmProvider, LlmMessage } from '../llm.provider';

/**
 * Azure OpenAI chat provider (demo default → gpt-4o-mini). Uses the REST API
 * directly via fetch to avoid an extra SDK dependency. Swapping to AWS Bedrock
 * for production is a new provider implementing the same interface + a config flip.
 */
export class AzureOpenAiProvider implements LlmProvider {
  readonly id = 'azure-openai';
  private readonly logger = new Logger(AzureOpenAiProvider.name);

  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly deployment: string,
    private readonly apiVersion: string,
  ) {}

  static fromEnv(): AzureOpenAiProvider | null {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';
    if (!endpoint || !apiKey) return null;
    return new AzureOpenAiProvider(endpoint.replace(/\/$/, ''), apiKey, deployment, apiVersion);
  }

  async chat(messages: LlmMessage[]): Promise<string> {
    const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;
    const body = {
      messages: messages.map((m) => {
        if (m.image) {
          return {
            role: m.role,
            content: [
              { type: 'text', text: m.content },
              {
                type: 'image_url',
                image_url: { url: `data:${m.image.mimeType};base64,${m.image.data}` },
              },
            ],
          };
        }
        return { role: m.role, content: m.content };
      }),
      temperature: 0.3,
      max_tokens: 1200,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': this.apiKey },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`Azure OpenAI error ${res.status}: ${text.slice(0, 300)}`);
      throw new Error(`Azure OpenAI request failed (${res.status})`);
    }
    const json: any = await res.json();
    return json?.choices?.[0]?.message?.content ?? '';
  }
}
