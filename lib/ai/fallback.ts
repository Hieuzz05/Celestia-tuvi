import { modelKhaDung } from './config';
import { goiModel } from './providers';
import { AiRetryableError, type ChatRequest, type ChatResult } from './types';

export interface KetQuaFallback extends ChatResult {
  /** Các model đã thử và thất bại trước khi có kết quả */
  daThuHong: { provider: string; model: string; loi: string }[];
}

export class KhongCoModelError extends Error {
  constructor() {
    super('Chưa cấu hình model AI nào. Thêm API key vào biến môi trường để bật luận giải.');
    this.name = 'KhongCoModelError';
  }
}

/**
 * Gọi lần lượt các model theo thứ tự ưu tiên. Gặp lỗi hết quota / rate limit /
 * key sai / lỗi phía nhà cung cấp thì chuyển sang model kế tiếp; lỗi khác coi
 * như lỗi thật và dừng ngay để không che giấu bug.
 */
export async function goiVoiFallback(
  req: ChatRequest,
  uuTienProvider?: string
): Promise<KetQuaFallback> {
  let danhSach = modelKhaDung();
  if (danhSach.length === 0) throw new KhongCoModelError();

  // Người dùng chọn model nào thì đưa model đó lên đầu, phần còn lại vẫn là lưới an toàn
  if (uuTienProvider) {
    const chon = danhSach.filter((m) => `${m.provider}|${m.model}` === uuTienProvider);
    const conLai = danhSach.filter((m) => `${m.provider}|${m.model}` !== uuTienProvider);
    if (chon.length) danhSach = [...chon, ...conLai];
  }

  const daThuHong: KetQuaFallback['daThuHong'] = [];
  for (const m of danhSach) {
    try {
      const kq = await goiModel(m.provider, m.model, m.apiKey, req);
      return { ...kq, daThuHong };
    } catch (e) {
      if (e instanceof AiRetryableError) {
        daThuHong.push({ provider: m.provider, model: m.model, loi: e.message });
        continue;
      }
      throw e;
    }
  }

  throw new Error(
    `Tất cả ${danhSach.length} model đều không dùng được:\n` +
      daThuHong.map((t) => `- ${t.provider}/${t.model}: ${t.loi}`).join('\n')
  );
}
