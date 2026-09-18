import { goiVoiFallback } from '@/lib/ai/fallback';
import type { LaSo } from '@/lib/tuvi/ansao';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import { dungGoiBangChung, dungKhoiChoPrompt } from './bang-chung';
import { chonBoiCanh, saoChinhTheoCung } from './boi-canh-la-so';
import { boCauRaLenh, CHUAN_NGON_NGU_CELES } from './chuan-ngon-ngu';
import { docObjectJson } from './doc-json';
import { soatNgonNgu } from './ngon-ngu';
import { lapKeHoach, type ChuDe } from './planner';
import { nhanDangThucThe } from './thuc-the';
import { truyHoi } from './truy-hoi';

/**
 * Hai bề mặt ngắn của Celes, sinh bằng model thay vì ghép từ khuôn câu.
 *
 * Trước đây trang Hôm nay và Hành trình dựng chữ hoàn toàn bằng template. Mở
 * bao nhiêu lần cũng ra một bài, và bài đó là các mẩu dữ kiện nối lại chứ không
 * phải một nhận định. Giờ model viết, nhưng đi qua đúng đường đi của bài dài:
 * chọn dữ kiện theo chủ đề, truy hồi nguồn, bắt trả cấu trúc, kiểm bằng luật.
 *
 * Khác bài dài ở hai chỗ, và cả hai đều do tài liệu khung quy định:
 *
 *  - **§11.1 Home insight**: mục tiêu là một "aha" trong 20-40 giây. Một câu
 *    insight, một câu đời sống, một câu mặt trái. 60-100 từ. Không luận cả lá số.
 *  - **§11.4 Journey**: ba chuyển động — đang mở / đang căng / cần chờ. Nhịp
 *    hành động (Tiến / Giữ / Rà soát / Thu hẹp) KHÔNG do model chọn: nó đếm
 *    được từ tương quan cát/hung nên để luật quyết, model chỉ viết phần chữ.
 *
 * Cả hai đều có thể trả null. Lớp gọi phải giữ đường lùi về chữ tất định — hết
 * hạn mức model không được phép làm trắng trang chủ.
 */

export const PHIEN_BAN_BE_MAT_NGAN = '2026.09.1';

function nenChung(): string {
  return `BỐN NGUỒN SỰ THẬT, THEO THỨ TỰ:
1. DỮ KIỆN LÁ SỐ (mã F###) — do engine tính. Bất khả xâm phạm: không thêm sao, không đổi cung.
2. NGUỒN THAM CHIẾU (mã E###) — học thuyết Tử Vi. Mọi khẳng định chuyên môn phải dựa vào đây.
3. Kiến thức chung của bạn — chỉ cho ngôn ngữ đời thường, KHÔNG thay cho mục 2.

BA LUẬT CỨNG:
- KHÔNG chép lại danh sách sao từ dữ kiện. Người đọc không cần bản kê sao.
- Tối đa MỘT tên sao trong một câu, và chỉ khi nó giải thích được điều vừa nói bằng lời thường.
- Mã F###/E### CHỈ nằm trong trường "maDuKien"/"maNguon". Tuyệt đối không viết vào câu văn.

${CHUAN_NGON_NGU_CELES}

KHÔNG ĐƯỢC: nhắc tên sách, tên hệ phái, số phần trăm; phán chắc chắn về sức khoẻ, tiền bạc, pháp lý.`;
}

interface DuLieuNen {
  khoi: string;
  maF: Set<string>;
  maE: Set<string>;
  saoChoPhep: Set<string>;
  phienBan: Record<string, string>;
}

async function dungNen(
  laSo: LaSo,
  cauHoi: string,
  chuDeEp: ChuDe | null,
  namXem: number,
  thangXem: number
): Promise<DuLieuNen> {
  const keHoachGoc = lapKeHoach({ cauHoi, saoTheoCung: saoChinhTheoCung(laSo) });
  const keHoach = chuDeEp ? { ...keHoachGoc, chuDe: chuDeEp } : keHoachGoc;

  const { duKien } = chonBoiCanh({ laSo, keHoach, namXem, thangXem });
  const kq = await truyHoi(keHoach, { soCuoi: 5 });
  const goi = dungGoiBangChung(cauHoi, keHoach, duKien, kq.daChon);

  return {
    khoi: dungKhoiChoPrompt(goi),
    maF: new Set(duKien.map((f) => f.id)),
    maE: new Set(goi.bangChung.map((e) => e.id)),
    saoChoPhep: new Set(
      nhanDangThucThe(
        [...duKien.map((f) => f.noiDung), ...goi.bangChung.map((e) => e.noiDung)].join(' ')
      ).map((t) => t.id)
    ),
    phienBan: {
      beMatNgan: PHIEN_BAN_BE_MAT_NGAN,
      planner: keHoach.phienBan,
      truyHoi: kq.phienBan,
      phuongPhap: PHUONG_PHAP.phienBan,
    },
  };
}

/** Bóc mã khỏi câu văn và bỏ câu nhắc sao không có trong dữ liệu */
function sachCau(cau: unknown, nen: DuLieuNen): string | null {
  if (typeof cau !== 'string') return null;
  const s = cau
    .replace(/\s*\((?:\s*[FE]\d{3}\s*,?)+\s*\)/g, '')
    .replace(/\b[FE]\d{3}\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;])/g, '$1')
    .trim();
  if (s.length < 12) return null;

  // Celes không kê đơn. Bỏ đúng câu sai vai, không bỏ cả trường.
  const khongLenh = boCauRaLenh(s);
  if (khongLenh.length < 12) return null;

  // Sao bịa là lỗi nặng nhất của bề mặt ngắn: cả thẻ chỉ có ba câu, sai một câu
  // là hỏng cả thẻ. Thà bỏ còn hơn hiện một cái tên không có trong lá số.
  const bia = nhanDangThucThe(khongLenh).filter(
    (t) => (t.loai === 'STAR' || t.loai === 'TRANSFORMATION') && !nen.saoChoPhep.has(t.id)
  );
  return bia.length ? null : khongLenh;
}

// ---------------------------------------------------------------- Điểm nổi bật

export interface DiemNoiBat {
  insight: string;
  doiSong: string;
  matTrai: string;
  cauMangTheo: string;
}

export async function sinhDiemNoiBat(vao: {
  laSo: LaSo;
  namXem: number;
  thangXem: number;
}): Promise<{ noiDung: DiemNoiBat; provider: string; model: string; phienBan: Record<string, string> } | null> {
  const nen = await dungNen(
    vao.laSo,
    'Điểm mạnh nổi bật nhất của người này là gì, và nó thể hiện ra đời sống thế nào',
    'tong-quan',
    vao.namXem,
    vao.thangXem
  );

  const system = `Bạn là Celes, người luận giải Tử Vi của Celestia. Viết tiếng Việt, bình tĩnh, nói với người đối diện.

Đây là THẺ ĐIỂM NỔI BẬT của trang chủ. Mục tiêu: tạo một khoảnh khắc "đúng rồi" trong 20-40 giây. KHÔNG luận cả lá số. Tổng cả thẻ 60-100 từ.

${nenChung()}

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code:
{
  "insight": "1 câu: điểm mạnh rõ nhất, CỤ THỂ cho lá số này. Cấm câu ai đọc cũng thấy đúng.",
  "doiSong": "1 câu: nét đó thường lộ ra ở đâu trong đời sống thường ngày.",
  "matTrai": "1 câu: cái giá của chính nét đó, hoặc lúc nó quay ra làm khó người ta.",
  "cauMangTheo": "1 câu ngắn để mang theo hôm nay, mọc ra TỪ điểm mạnh vừa nói. Không phải châm ngôn chung chung, không hô khẩu hiệu.",
  "maDuKien": ["F001"],
  "maNguon": []
}`;

  const kq = await goiVoiFallback({ system, user: nen.khoi, maxTokens: 1200 });
  const tho = docObjectJson(kq.text);
  if (!tho) return null;

  const insight = sachCau(tho.insight, nen);
  const doiSong = sachCau(tho.doiSong, nen);
  const matTrai = sachCau(tho.matTrai, nen);
  const cauMangTheo = sachCau(tho.cauMangTheo, nen);

  // Thiếu mặt trái là hỏng theo luật counterweight §5.3: một thẻ chỉ khen là
  // thẻ không dùng được, dù nó đọc dễ chịu. Ba trường này là bắt buộc.
  if (!insight || !doiSong || !matTrai) {
    console.warn('[diem-noi-bat] thiếu trường bắt buộc', {
      insight: Boolean(insight),
      doiSong: Boolean(doiSong),
      matTrai: Boolean(matTrai),
    });
    return null;
  }

  /*
   * Câu mang theo KHÔNG bắt buộc.
   *
   * Nó là dòng trích dẫn dưới thẻ, và giao diện đã tự ẩn khi không có. Bắt nó
   * bắt buộc thì một câu ra lệnh ở đúng chỗ đó làm mất cả thẻ — đo được: hai
   * trên ba lượt sinh trả về rỗng chỉ vì dòng này.
   *
   * Cổng ngôn ngữ cũng chỉ soát phần thân thẻ, vì đó mới là phần người đọc
   * nhận như một nhận định.
   */
  const gate = soatNgonNgu([insight, doiSong, matTrai].join(' '), [insight]);
  if (!gate.dat) {
    console.warn('[diem-noi-bat] không qua cổng ngôn ngữ', gate.loi.map((l) => l.ma));
    return null;
  }

  return {
    noiDung: { insight, doiSong, matTrai, cauMangTheo: cauMangTheo ?? '' },
    provider: kq.provider,
    model: kq.model,
    phienBan: nen.phienBan,
  };
}

// ------------------------------------------------------------------ Hành trình

export interface ChuyenDong {
  tieuDe: string;
  noiDung: string;
}

export interface NhipHanhTrinh {
  dangMo: ChuyenDong;
  dangCang: ChuyenDong;
  canCho: ChuyenDong;
  ghepLai: string;
}

const NHAN_CAP: Record<string, string> = {
  'giai-doan': 'một quãng dài nhiều năm',
  nam: 'một năm',
  thang: 'một tháng',
};

export async function sinhNhipHanhTrinh(vao: {
  laSo: LaSo;
  cap: 'giai-doan' | 'nam' | 'thang';
  namXem: number;
  thangXem: number;
  /** Nhịp do luật đếm ra — model viết chữ quanh nó, không được tự đổi */
  nhip: string;
}): Promise<{ noiDung: NhipHanhTrinh; provider: string; model: string; phienBan: Record<string, string> } | null> {
  const nen = await dungNen(
    vao.laSo,
    `Giai đoạn đang đi qua mở ra điều gì, căng ở đâu, và chỗ nào nên chờ`,
    'tong-quan',
    vao.namXem,
    vao.thangXem
  );

  const system = `Bạn là Celes, người luận giải Tử Vi của Celestia. Viết tiếng Việt, bình tĩnh, nói với người đối diện.

Đây là phần ĐIỀU ĐANG CHUYỂN ĐỘNG của ${NHAN_CAP[vao.cap] ?? 'một quãng'}. Ba chuyển động, mỗi cái 2-3 câu.

LUẬT RIÊNG CỦA PHẦN VẬN HẠN:
- KHÔNG kết luận "năm nay sẽ xảy ra chuyện X" chỉ vì hạn đi vào cung X. Cung hạn là MỘT lớp, không phải nguyên nhân.
- Nói xu hướng và điều đáng cân nhắc, không nói sự kiện.
- Nhịp hành động của quãng này đã được tính sẵn là "${vao.nhip}". Viết sao cho ba chuyển động nhất quán với nhịp đó. Không tự đổi nhịp, không nhắc lại chữ đó như một nhãn.

${nenChung()}

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code:
{
  "dangMo":   { "tieuDe": "ngắn, cụ thể", "noiDung": "2-3 câu: điều đang mở ra, và dùng được vào việc gì" },
  "dangCang": { "tieuDe": "ngắn", "noiDung": "2-3 câu: chỗ đang căng, nó biểu hiện thế nào" },
  "canCho":   { "tieuDe": "ngắn", "noiDung": "2-3 câu: chỗ chưa tới lúc, và vì sao chờ lại hơn đẩy" },
  "ghepLai": "2-3 câu: ghép ba chuyển động lại thì quãng này là gì. Không lặp lại từng phần.",
  "maDuKien": [], "maNguon": []
}`;

  const kq = await goiVoiFallback({ system, user: nen.khoi, maxTokens: 2000 });
  const tho = docObjectJson(kq.text);
  if (!tho) return null;

  const doc = (x: unknown): ChuyenDong | null => {
    const o = x as { tieuDe?: unknown; noiDung?: unknown } | undefined;
    const noiDung = sachCau(o?.noiDung, nen);
    if (!noiDung) return null;
    const tieuDe = typeof o?.tieuDe === 'string' && o.tieuDe.trim() ? o.tieuDe.trim() : '';
    return { tieuDe, noiDung };
  };

  const dangMo = doc(tho.dangMo);
  const dangCang = doc(tho.dangCang);
  const canCho = doc(tho.canCho);
  const ghepLai = sachCau(tho.ghepLai, nen);
  if (!dangMo || !dangCang || !canCho || !ghepLai) return null;

  const gate = soatNgonNgu(
    [dangMo.noiDung, dangCang.noiDung, canCho.noiDung, ghepLai].join(' '),
    [dangMo.noiDung, dangCang.noiDung, canCho.noiDung]
  );
  if (!gate.dat) return null;

  return {
    noiDung: { dangMo, dangCang, canCho, ghepLai },
    provider: kq.provider,
    model: kq.model,
    phienBan: nen.phienBan,
  };
}
