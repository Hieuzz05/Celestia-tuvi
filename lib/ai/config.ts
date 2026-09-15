import type { ModelConfig, ProviderId } from './types';

/**
 * Cấu hình model đọc từ biến môi trường (giai đoạn chưa có database).
 *
 * Cách khai báo:
 *   GEMINI_API_KEY=...
 *   OPENROUTER_API_KEY=...
 *   OPENAI_API_KEY=...
 *   ANTHROPIC_API_KEY=...
 *   AI_FALLBACK_ORDER=gemini|gemini-2.5-flash,openrouter|deepseek/deepseek-chat-v3-0324:free
 *
 * Nếu không khai báo AI_FALLBACK_ORDER, hệ thống tự dựng thứ tự mặc định từ các
 * key đang có, ưu tiên nhà cung cấp có tier miễn phí dùng được thật.
 */

const KEY_ENV: Record<ProviderId, string> = {
  gemini: 'GEMINI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

const MODEL_MAC_DINH: Record<ProviderId, string> = {
  gemini: 'gemini-2.5-flash',
  openrouter: 'deepseek/deepseek-chat-v3-0324:free',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
};

/** Thứ tự ưu tiên mặc định: free tier dùng được thật đứng trước */
const THU_TU_MAC_DINH: ProviderId[] = ['gemini', 'openrouter', 'openai', 'anthropic'];

export function layApiKey(provider: ProviderId): string {
  return process.env[KEY_ENV[provider]]?.trim() ?? '';
}

export function danhSachModel(): ModelConfig[] {
  const thuCong = process.env.AI_FALLBACK_ORDER?.trim();
  if (thuCong) {
    return thuCong
      .split(',')
      .map((mucStr, i) => {
        const [providerRaw, modelRaw] = mucStr.split('|').map((s) => s.trim());
        const provider = providerRaw as ProviderId;
        if (!KEY_ENV[provider]) return null;
        const apiKey = layApiKey(provider);
        return {
          provider,
          model: modelRaw || MODEL_MAC_DINH[provider],
          apiKey,
          priority: i,
          enabled: Boolean(apiKey),
        } satisfies ModelConfig;
      })
      .filter((m): m is ModelConfig => m !== null);
  }

  return THU_TU_MAC_DINH.map((provider, i) => ({
    provider,
    model: MODEL_MAC_DINH[provider],
    apiKey: layApiKey(provider),
    priority: i,
    enabled: Boolean(layApiKey(provider)),
  }));
}

/** Danh sách model đang bật, đã sắp theo thứ tự fallback */
export function modelKhaDung(): ModelConfig[] {
  return danhSachModel()
    .filter((m) => m.enabled && m.apiKey)
    .sort((a, b) => a.priority - b.priority);
}

/** Thông tin an toàn để trả về client — không bao giờ kèm API key */
export function trangThaiModel() {
  return danhSachModel().map((m) => ({
    provider: m.provider,
    model: m.model,
    priority: m.priority,
    daCauHinh: Boolean(m.apiKey),
    keyMasked: m.apiKey ? `${m.apiKey.slice(0, 4)}••••${m.apiKey.slice(-4)}` : null,
  }));
}
