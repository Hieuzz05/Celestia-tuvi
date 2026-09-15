export type ProviderId = 'gemini' | 'openrouter' | 'openai' | 'anthropic';

export interface ModelConfig {
  provider: ProviderId;
  /** Tên model theo đúng định danh của nhà cung cấp */
  model: string;
  apiKey: string;
  /** Thứ tự ưu tiên, số nhỏ chạy trước */
  priority: number;
  enabled: boolean;
  /** Nhãn hiển thị cho người dùng cuối */
  nhan?: string;
}

export interface ChatRequest {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResult {
  text: string;
  provider: ProviderId;
  model: string;
  tokensIn?: number;
  tokensOut?: number;
}

/** Lỗi khiến orchestrator chuyển sang model kế tiếp thay vì dừng hẳn */
export class AiRetryableError extends Error {
  constructor(
    message: string,
    readonly loai: 'quota' | 'rate-limit' | 'auth' | 'server' | 'network',
    readonly status?: number
  ) {
    super(message);
    this.name = 'AiRetryableError';
  }
}

export const TEN_PROVIDER: Record<ProviderId, string> = {
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
};

/** Gợi ý model miễn phí / rẻ cho từng nhà cung cấp (ngân sách 0) */
export const MODEL_GOI_Y: Record<ProviderId, string[]> = {
  gemini: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'],
  openrouter: [
    'deepseek/deepseek-chat-v3-0324:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'google/gemma-3-27b-it:free',
  ],
  openai: ['gpt-4o-mini', 'gpt-4.1-mini'],
  anthropic: ['claude-haiku-4-5-20251001', 'claude-sonnet-5'],
};
