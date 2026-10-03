import { modelKhaDungThuc } from './nguon-cau-hinh';
import { goiModel } from './providers';
import { AiRetryableError, type ChatRequest, type ChatResult } from './types';
import { daCanHanMuc, ghiNhanSuDung, HAN_MUC_NGAY, soLuotHomNay } from './usage';
import { ghiSuCo } from './su-co';

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

/*
 * TRẦN NGÂN SÁCH cho script đo / thử (26/09/2026 — một ngày đo tiêu ~11 tr token, góp phần làm hết
 * credit). Script đặt AI_NGAN_SACH_TOKEN=<số>: cộng dồn token vào + ra của tiến trình, vượt là dừng
 * hẳn thay vì âm thầm chạy tiếp. Sản phẩm không đặt biến này nên không bị ảnh hưởng.
 */
// Đọc mỗi lượt gọi, không đọc lúc nạp module — script đặt biến sau khi đã import
const nganSachThu = () => Number(process.env.AI_NGAN_SACH_TOKEN) || 0;
const nhanLog = () => (process.env.AI_NHAN ?? '').trim();
let daTieuThu = 0;
export class VuotNganSachError extends Error {
  name = 'VuotNganSachError';
}
function kiemNganSachThu() {
  if (nganSachThu() && daTieuThu >= nganSachThu()) {
    throw new VuotNganSachError(`Vượt ngân sách lượt thử: đã dùng ${daTieuThu} / ${nganSachThu()} token (AI_NGAN_SACH_TOKEN)`);
  }
}
/** Token đã dùng trong tiến trình này — script in ra cuối lượt */
export function tokenDaDung(): number {
  return daTieuThu;
}

/*
 * GHIM MODEL + TRẦN TIỀN CỨNG cho script eval (CEL-186 vé B, cờ #8; mục 15 S2 / S3).
 *
 * `AI_GHIM_MODEL='provider|model'`: MỌI lời gọi trong tiến trình — planner, lời
 * gọi chính, lượt thử lại, lớp sửa câu — chỉ dùng đúng model đó, không lùi.
 * Ghim riêng lời gọi chính là không đủ: ba chỗ kia lùi sang model khác thì con
 * số eval đo một hỗn hợp, không phải model Production.
 *
 * `AI_TRAN_USD` (kèm `AI_GIA_VAO_USD`, `AI_GIA_RA_USD` — USD cho một triệu
 * token): GIỮ CHỖ bi quan TRƯỚC mỗi lời gọi (token vào ước theo độ dài prompt,
 * token ra tính đủ `maxTokens`), vượt trần thì ném trước khi gọi. Gọi xong mới
 * đổi phần giữ chỗ thành số thật; lượt hỏng giữ nguyên phần giữ chỗ. Bộ đếm
 * chỉ tăng, nên một lỗi bị nuốt ở planner hay sửa câu cũng chỉ trì hoãn một
 * bước — lời gọi kế tiếp vẫn bị chặn.
 *
 * Sản phẩm không đặt các biến này: hành vi Production không đổi.
 */
const ghimModel = () => (process.env.AI_GHIM_MODEL ?? '').trim();
const soEnv = (k: string) => Number(process.env[k]) || 0;
/** Mặc định của nhà cung cấp khi lời gọi không đặt `maxTokens` — giữ chỗ theo mức cao. */
const MAX_TOKENS_GIU_CHO = 8192;
let daTieuUsd = 0;

/** Ước token vào theo ký tự: tiếng Việt ~2–3 ký tự một token, lấy 2 cho bi quan. */
const uocTokenVao = (req: ChatRequest) => Math.ceil((req.system.length + req.user.length) / 2);

function giuChoTien(req: ChatRequest): number {
  const tran = soEnv('AI_TRAN_USD');
  if (!tran) return 0;
  const giaVao = soEnv('AI_GIA_VAO_USD');
  const giaRa = soEnv('AI_GIA_RA_USD');
  if (!giaVao || !giaRa) throw new VuotNganSachError('AI_TRAN_USD cần kèm AI_GIA_VAO_USD và AI_GIA_RA_USD');
  const giu = (uocTokenVao(req) * giaVao + (req.maxTokens ?? MAX_TOKENS_GIU_CHO) * giaRa) / 1e6;
  if (daTieuUsd + giu > tran) {
    throw new VuotNganSachError(
      `Vượt trần tiền: đã tính $${daTieuUsd.toFixed(4)}, lượt này giữ $${giu.toFixed(4)}, trần $${tran} (AI_TRAN_USD)`
    );
  }
  daTieuUsd += giu;
  return giu;
}

/**
 * Đổi phần giữ chỗ thành số thật. Provider không báo token suy nghĩ thì có thể
 * đếm thiếu token ra — lấy số lớn hơn giữa số báo về và phần giữ chỗ của token ra.
 */
function chotTien(giu: number, req: ChatRequest, kq: ChatResult) {
  if (!giu) return;
  const giaVao = soEnv('AI_GIA_VAO_USD');
  const giaRa = soEnv('AI_GIA_RA_USD');
  const tokVao = kq.tokensIn || uocTokenVao(req);
  const tokRa = kq.tokensNghi !== undefined ? (kq.tokensOut ?? 0) : Math.max(kq.tokensOut ?? 0, req.maxTokens ?? MAX_TOKENS_GIU_CHO);
  daTieuUsd += (tokVao * giaVao + tokRa * giaRa) / 1e6 - giu;
}

/** Tiền đã tính trong tiến trình (theo AI_TRAN_USD) — script eval in ra khi dừng */
export function tienDaTinh(): number {
  return daTieuUsd;
}

export async function goiVoiFallback(
  req: ChatRequest,
  uuTienProvider?: string,
  nganSachMs: number = NGAN_SACH_MAC_DINH_MS
): Promise<KetQuaFallback> {
  const batDau = Date.now();
  let danhSach = await modelKhaDungThuc();
  if (danhSach.length === 0) throw new KhongCoModelError();

  // S2: ghim cho MỌI lời gọi, bỏ qua cả `uuTienProvider`. Không có model đó là lỗi, không lùi.
  const ghim = ghimModel();
  if (ghim) {
    danhSach = danhSach.filter((m) => `${m.provider}|${m.model}` === ghim);
    if (danhSach.length === 0) throw new KhongCoModelError();
    uuTienProvider = undefined;
  }

  // Người dùng chọn model nào thì đưa model đó lên đầu, phần còn lại vẫn là lưới an toàn
  if (uuTienProvider) {
    const chon = danhSach.filter((m) => `${m.provider}|${m.model}` === uuTienProvider);
    const conLai = danhSach.filter((m) => `${m.provider}|${m.model}` !== uuTienProvider);
    if (chon.length) danhSach = [...chon, ...conLai];
    /*
     * Script đo (AI_KHONG_LUI=1, đặt bởi scripts/thu-chung.ts): giám khảo được chỉ định mà không gọi
     * được thì BÁO LỖI, không lặng lẽ lùi sang model khác — 26/09/2026 "giám khảo groq" không gọi được
     * nên mọi phiếu rơi về luna (model đắt nhất), vừa tốn gấp nhiều lần vừa làm hỏng phép đo nhiều giám khảo.
     */
    if (process.env.AI_KHONG_LUI === '1') {
      if (!chon.length) throw new KhongCoModelError();
      danhSach = chon;
    }
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

    // Ném TRƯỚC khi gọi, ngoài try: vượt trần không phải lỗi để lùi sang model khác.
    const giu = giuChoTien(req);
    try {
      kiemNganSachThu();
      const kq = await goiModel(m.provider, m.model, m.apiKey, req);
      chotTien(giu, req, kq);
      daTieuThu += (kq.tokensIn ?? 0) + (kq.tokensOut ?? 0);
      // Cho scripts/thu-chung.ts đọc lúc thoát mà không phải import module này
      (globalThis as { __celestiaTokenDaDung?: number }).__celestiaTokenDaDung = daTieuThu;
      // Lượt chạy thử / đo (script đặt AI_NHAN=test) ghi riêng dòng "<model>@test" — tách chi phí
      // test khỏi chi phí người dùng thật trong ai_usage_logs (26/09/2026: test ~70% lượng dùng một ngày)
      await ghiNhanSuDung(m.provider, nhanLog() ? `${m.model}@${nhanLog()}` : m.model, kq.tokensIn ?? 0, kq.tokensOut ?? 0, false, { dem: kq.tokensDem, nghi: kq.tokensNghi });
      return { ...kq, daThuHong };
    } catch (e) {
      if (e instanceof AiRetryableError) {
        await ghiNhanSuDung(m.provider, nhanLog() ? `${m.model}@${nhanLog()}` : m.model, 0, 0, true);
        // Ghi KÈM LÝ DO để phân biệt hết credit với gọi hơi nhanh (lib/ai/su-co.ts).
        // Không chờ: chuỗi đang lùi sang model kế, đừng bắt người dùng chờ thêm.
        void ghiSuCo({ nguon: 'chat', provider: m.provider, model: m.model, loai: e.loai, thongDiep: e.message });
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
