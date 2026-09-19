import { modelKhaDungThuc } from './nguon-cau-hinh';
import { goiModel } from './providers';
import { AiRetryableError, type ChatRequest, type ChatResult } from './types';
import { daCanHanMuc, ghiNhanSuDung, HAN_MUC_NGAY, soLuotHomNay } from './usage';

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
/**
 * Thời gian tối thiểu một lượt gọi cần để có cơ may xong.
 *
 * Không có con số này thì chuỗi fallback tự bắn vào chân mình: model đầu chạy
 * 44 giây rồi chạm trần 55 giây của `goiApi`, chuỗi lùi sang model hai, model
 * hai cần thêm ~30 giây — tổng vượt trần 60 giây của route trên Vercel, và
 * người dùng nhận 504 thay vì nhận bản tất định.
 *
 * Một lượt lùi CHỈ đáng bắt đầu khi còn đủ chỗ cho nó chạy xong.
 */
const TOI_THIEU_MOT_LUOT_MS = 16_000;

/** Ngân sách mặc định: 50 giây, chừa 10 giây của trần 60 cho phần còn lại của route */
const NGAN_SACH_MAC_DINH_MS = 50_000;

export async function goiVoiFallback(
  req: ChatRequest,
  uuTienProvider?: string,
  nganSachMs: number = NGAN_SACH_MAC_DINH_MS
): Promise<KetQuaFallback> {
  const batDau = Date.now();
  let danhSach = await modelKhaDungThuc();
  if (danhSach.length === 0) throw new KhongCoModelError();

  // Người dùng chọn model nào thì đưa model đó lên đầu, phần còn lại vẫn là lưới an toàn
  if (uuTienProvider) {
    const chon = danhSach.filter((m) => `${m.provider}|${m.model}` === uuTienProvider);
    const conLai = danhSach.filter((m) => `${m.provider}|${m.model}` !== uuTienProvider);
    if (chon.length) danhSach = [...chon, ...conLai];
  }

  // Biết trước model nào đã cạn lượt trong ngày thì bỏ qua luôn, thay vì tiêu
  // một lần gọi chỉ để nhận về 429.
  const daDung = await soLuotHomNay();

  const daThuHong: KetQuaFallback['daThuHong'] = [];
  for (const m of danhSach) {
    /*
     * Hết chỗ trong ngân sách thì DỪNG, đừng thử tiếp.
     *
     * Bắt đầu một lượt gọi không kịp xong là tệ hơn không gọi: nó ăn nốt phần
     * thời gian mà lớp trên cần để trả về bản tất định, và biến một bài kém
     * thành một trang lỗi.
     */
    const conLai = nganSachMs - (Date.now() - batDau);
    if (conLai < TOI_THIEU_MOT_LUOT_MS && daThuHong.length > 0) {
      daThuHong.push({
        provider: m.provider,
        model: m.model,
        loi: `Còn ${Math.round(conLai / 1000)}s trong ngân sách ${Math.round(nganSachMs / 1000)}s — không đủ để thử, dừng chuỗi`,
      });
      break;
    }

    if (daCanHanMuc(m.provider, daDung[m.provider] ?? 0)) {
      daThuHong.push({
        provider: m.provider,
        model: m.model,
        loi: `Đã dùng ${daDung[m.provider]}/${HAN_MUC_NGAY[m.provider]} lượt miễn phí hôm nay — bỏ qua`,
      });
      continue;
    }

    try {
      const kq = await goiModel(m.provider, m.model, m.apiKey, req);
      await ghiNhanSuDung(m.provider, m.model, kq.tokensIn ?? 0, kq.tokensOut ?? 0);
      return { ...kq, daThuHong };
    } catch (e) {
      if (e instanceof AiRetryableError) {
        await ghiNhanSuDung(m.provider, m.model, 0, 0, true);
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
