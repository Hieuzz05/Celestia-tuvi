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
  /**
   * Tắt "thinking tokens" (Gemini 3.x trở lên). Model đời mới mặc định tiêu một
   * phần hạn mức output cho bước suy nghĩ nội bộ; với lệnh test kết nối thì phần
   * đó vừa thừa vừa tốn quota.
   */
  tatSuyNghi?: boolean;
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

/**
 * Gợi ý model cho từng nhà cung cấp (ưu tiên rẻ/miễn phí vì ngân sách 0).
 * Danh sách Gemini lấy từ endpoint ListModels ngày 2026-09-15 — Google đã ngừng
 * phục vụ gemini-2.5-flash cho tài khoản mới, nên đừng quay lại tên model cũ.
 */
export const MODEL_GOI_Y: Record<ProviderId, string[]> = {
  gemini: ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'],
  openrouter: [
    'deepseek/deepseek-chat-v3-0324:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'google/gemma-3-27b-it:free',
  ],
  openai: ['gpt-4o-mini', 'gpt-5-mini', 'gpt-4.1-mini'],
  anthropic: ['claude-haiku-4-5-20251001', 'claude-sonnet-5'],
};
