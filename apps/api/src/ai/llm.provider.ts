export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  /** Optional base64 image (multimodal) attached to a user message. */
  image?: { data: string; mimeType: string };
}

/**
 * Provider-agnostic LLM interface. Adapters: Azure OpenAI (demo), AWS Bedrock
 * (prod), Gemini (optional). Selected at runtime by AI_PROVIDER.
 */
export interface LlmProvider {
  readonly id: string;
  chat(messages: LlmMessage[]): Promise<string>;
  /** Text-to-speech; returns base64 audio or null if unsupported. */
  speech?(text: string): Promise<string | null>;
}
