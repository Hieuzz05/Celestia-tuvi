import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { danhSachModel, layApiKey } from './config';
import { giaiMa } from './ma-hoa';
import type { ModelConfig, ProviderId } from './types';

/**
 * Nguồn cấu hình model: database trước, biến môi trường sau.
 *
 * Quy tắc gọn và cố ý cứng: **có dòng trong `ai_model_configs` thì bảng đó là
 * nguồn duy nhất.** Không trộn, không tự chèn thêm provider từ env vào cuối.
 *
 * Bản cũ có chèn thêm — provider nào có key mà không nằm trong `AI_FALLBACK_ORDER`
 * thì vẫn được xếp vào cuối hàng, với lý do "thêm key mà hệ thống lặng lẽ bỏ qua
 * là một cái bẫy". Lý do đó đúng khi cấu hình chỉ nằm ở env. Nhưng khi đã có màn
 * quản trị cho phép xoá một model, thì xoá phải là xoá — một dòng tự mọc lại sau
 * khi người vận hành vừa bấm xoá là cái bẫy lớn hơn hẳn. Thay vào đó màn quản
 * trị hiện rõ những provider đang có key trong env mà chưa nằm trong danh sách,
 * kèm nút thêm.
 */

export interface DongCauHinh {
  id: string;
  provider: ProviderId;
  model: string;
  /** Có key riêng lưu trong database hay đang mượn key từ env */
  coKeyRieng: boolean;
  uuTien: number;
  bat: boolean;
  ghiChu: string | null;
}

interface DongSql {
  id: string;
  provider: ProviderId;
  model: string;
  api_key_ma: string | null;
  uu_tien: number;
  bat: boolean;
  ghi_chu: string | null;
}

async function docDong(): Promise<DongSql[] | null> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('ai_model_configs')
    .select('id, provider, model, api_key_ma, uu_tien, bat, ghi_chu')
    .order('uu_tien', { ascending: true });

  if (error) {
    // Bảng chưa tạo là trạng thái bình thường trước khi chạy schema — quay về
    // env, đừng làm chết luận giải chỉ vì thiếu một bảng cấu hình.
    if (!error.message.includes('does not exist')) {
      console.warn('[AI] Không đọc được cấu hình model:', error.message);
    }
    return null;
  }

  return (data as DongSql[] | null) ?? null;
}

function veModelConfig(d: DongSql, thuTu: number): ModelConfig {
  // Key riêng giải mã được thì dùng; không thì mượn key env của provider đó.
  // Nhờ vậy người vận hành có thể khai thứ tự trên giao diện mà vẫn giữ key ở
  // biến môi trường nếu muốn.
  const apiKey = giaiMa(d.api_key_ma) ?? layApiKey(d.provider);
  return {
    provider: d.provider,
    model: d.model,
    apiKey,
    priority: thuTu,
    enabled: d.bat && Boolean(apiKey),
  };
}

/** Danh sách model đầy đủ, đã sắp thứ tự. Kèm cờ cho biết đang đọc từ đâu. */
export async function danhSachModelThuc(): Promise<{
  ds: ModelConfig[];
  tuDatabase: boolean;
}> {
  const dong = await docDong();
  if (!dong || dong.length === 0) return { ds: danhSachModel(), tuDatabase: false };

  return { ds: dong.map(veModelConfig), tuDatabase: true };
}

/** Model đang bật và có key, đã sắp theo thứ tự fallback */
export async function modelKhaDungThuc(): Promise<ModelConfig[]> {
  const { ds } = await danhSachModelThuc();
  return ds.filter((m) => m.enabled && m.apiKey).sort((a, b) => a.priority - b.priority);
}

/**
 * Bản dùng cho trang quản trị: kèm id để sửa/xoá, và nói rõ key đến từ đâu.
 * Không bao giờ trả về key đầy đủ.
 */
export async function cauHinhChoQuanTri(): Promise<{
  tuDatabase: boolean;
  dong: (DongCauHinh & { daCoKey: boolean; keyRutGon: string | null })[];
  thieuTrongDanhSach: { provider: ProviderId; keyRutGon: string }[];
}> {
  const { cheKey } = await import('./ma-hoa');
  const dong = await docDong();

  const danhSachProvider: ProviderId[] = [
    'gemini',
    'groq',
    'cerebras',
    'openrouter',
    'openai',
    'anthropic',
  ];

  if (!dong || dong.length === 0) {
    // Chưa cấu hình gì trong database — dựng danh sách từ env để người vận hành
    // thấy đúng thứ đang chạy, rồi mới quyết định có chuyển sang quản lý ở đây không.
    return {
      tuDatabase: false,
      dong: danhSachModel().map((m, i) => ({
        id: '',
        provider: m.provider,
        model: m.model,
        coKeyRieng: false,
        uuTien: i,
        bat: m.enabled,
        ghiChu: null,
        daCoKey: Boolean(m.apiKey),
        keyRutGon: cheKey(m.apiKey),
      })),
      thieuTrongDanhSach: [],
    };
  }

  const daCo = new Set(dong.map((d) => d.provider));

  return {
    tuDatabase: true,
    dong: dong.map((d, i) => {
      const key = giaiMa(d.api_key_ma) ?? layApiKey(d.provider);
      return {
        id: d.id,
        provider: d.provider,
        model: d.model,
        coKeyRieng: Boolean(d.api_key_ma),
        uuTien: i,
        bat: d.bat,
        ghiChu: d.ghi_chu,
        daCoKey: Boolean(key),
        keyRutGon: cheKey(key),
      };
    }),
    // Provider có key trong env nhưng chưa được khai ở đây. Hiện ra để người
    // vận hành biết mình đang bỏ phí một lưới đỡ sẵn có.
    thieuTrongDanhSach: danhSachProvider
      .filter((p) => !daCo.has(p) && layApiKey(p))
      .map((p) => ({ provider: p, keyRutGon: cheKey(layApiKey(p))! })),
  };
}
