import { goiVoiFallback } from '@/lib/ai/fallback';
import type { LaSo } from '@/lib/tuvi/ansao';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import { dungGoiBangChung, dungKhoiChoPrompt } from './bang-chung';
import { chonBoiCanh, saoChinhTheoCung } from './boi-canh-la-so';
import { boCauRaLenh, CHUAN_NGON_NGU_CELES } from './chuan-ngon-ngu';
import { docObjectJson } from './doc-json';
import { soatNgonNgu } from './ngon-ngu';
import { suaCauKeSao } from './sua-chua';
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

BỐN LUẬT CỨNG:
- KHÔNG chép lại danh sách sao từ dữ kiện. Người đọc không cần bản kê sao.
- Tối đa MỘT tên sao trong một câu, và chỉ khi nó giải thích được điều vừa nói bằng lời thường.
- KHÔNG viết tên cung vào câu văn: Mệnh, Phụ Mẫu, Phúc Đức, Điền Trạch, Quan Lộc, Nô Bộc, Thiên Di, Tật Ách, Tài Bạch, Tử Tức, Phu Thê, Huynh Đệ. Nói thẳng phần đời mà cung đó nói tới. Sai: "yếu tố tích cực trong cung Phúc Đức". Đúng: "phần bên trong bạn thường tự xoay xở được".
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

/**
 * Câu kê đơn — dạng rộng, chỉ dùng cho sáu ô lĩnh vực.
 *
 * `CAU_RA_LENH` ở chuan-ngon-ngu cố ý hẹp: nó chạy trên MỌI bề mặt, kể cả
 * những trường không có gì lùi về, nên bắt rộng ở đó là đổi một lỗi giọng lấy
 * một khối trắng. Sáu ô lĩnh vực thì khác — mỗi ô còn nguyên khuôn câu của lớp
 * luật, nên ở đây chặn rộng được: mất câu thì ô đó về khuôn, không mất gì.
 *
 * Bốn lượt siết prompt vẫn ra "Đừng để cảm xúc chi phối…", "Cần thận trọng…".
 * Model tầm này không giữ nổi một lệnh cấm qua một bài mười hai đoạn, nên chỗ
 * nào chặn được bằng luật thì chặn bằng luật.
 */
const KHUYEN_BAO =
  /(?:^|\s)(?:đừng|nên|cần|hãy|tránh|chú ý|lưu ý|cân nhắc|quan trọng là|điều đáng)/iu;

/** Bỏ câu kê đơn trong một ô lĩnh vực, giữ phần còn lại */
function boCauKhuyenBao(doan: string): string {
  return doan
    .split(/(?<=[.!?])\s+/)
    .filter((c) => c.trim() && !KHUYEN_BAO.test(c))
    .join(' ')
    .trim();
}

/**
 * Bóc mã khỏi câu văn và bỏ câu nhắc sao không có trong dữ liệu.
 *
 * `nhan` chỉ để ghi log: khi một trường BẮT BUỘC bị loại thì cả khối rơi về
 * khuôn câu, và không có dòng này thì chỉ thấy hậu quả chứ không thấy lý do.
 */
function sachCau(cau: unknown, nen: DuLieuNen, nhan?: string): string | null {
  const bo = (vi: string, chiTiet?: string) => {
    if (nhan) console.warn(`[be-mat-ngan] loại ${nhan}: ${vi}${chiTiet ? ` — ${chiTiet}` : ''}`);
    return null;
  };
  if (typeof cau !== 'string') return bo('không phải chuỗi');
  const s = cau
    .replace(/\s*\((?:\s*[FE]\d{3}\s*,?)+\s*\)/g, '')
    .replace(/\b[FE]\d{3}\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;])/g, '$1')
    .trim();
  if (s.length < 12) return bo('quá ngắn sau khi bóc mã', s);

  // Celes không kê đơn. Bỏ đúng câu sai vai, không bỏ cả trường.
  const khongLenh = boCauRaLenh(s);
  if (khongLenh.length < 12) return bo('chỉ còn câu ra lệnh', s);

  // Sao bịa là lỗi nặng nhất của bề mặt ngắn: cả thẻ chỉ có ba câu, sai một câu
  // là hỏng cả thẻ. Thà bỏ còn hơn hiện một cái tên không có trong lá số.
  const bia = nhanDangThucThe(khongLenh).filter(
    (t) => (t.loai === 'STAR' || t.loai === 'TRANSFORMATION') && !nen.saoChoPhep.has(t.id)
  );
  return bia.length ? bo('nhắc sao không có trong dữ liệu', bia.map((t) => t.id).join(', ')) : khongLenh;
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
  /*
   * Bước sửa chữa trước khi qua cổng.
   *
   * Thẻ này chỉ có ba câu, nên một câu kê hai tên sao là một phần ba thẻ hỏng.
   * Loại cả thẻ thì mất một bài đúng vì một câu sai hình; bỏ qua thì luật thành
   * lời khuyên. Sửa đúng câu ấy là cách thứ ba, và chỉ tốn thêm một lượt gọi
   * nhỏ khi thật sự có câu phạm.
   */
  const daSua = await suaCauKeSao({ insight, doiSong, matTrai });

  const gate = soatNgonNgu(
    [daSua.insight, daSua.doiSong, daSua.matTrai].join(' '),
    [daSua.insight]
  );
  if (!gate.dat) {
    console.warn('[diem-noi-bat] không qua cổng ngôn ngữ', gate.loi.map((l) => l.ma));
    return null;
  }

  return {
    noiDung: {
      insight: daSua.insight,
      doiSong: daSua.doiSong,
      matTrai: daSua.matTrai,
      cauMangTheo: cauMangTheo ?? '',
    },
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
  /** id lĩnh vực -> đoạn văn. Thiếu id nào thì lớp trên dùng khuôn cũ của id đó. */
  linhVuc?: Record<string, string>;
}

/** Dữ kiện luật của một lĩnh vực, đưa cho model viết lại chứ không cho nó tự đọc */
export interface LinhVucChoAi {
  id: string;
  nhan: string;
  cung: string;
  cham: boolean;
  thuan: string[];
  can: string[];
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
  /** Sáu lĩnh vực kèm dữ kiện luật. Bỏ trống thì model không viết phần này. */
  linhVuc?: LinhVucChoAi[];
}): Promise<{ noiDung: NhipHanhTrinh; provider: string; model: string; phienBan: Record<string, string> } | null> {
  const nen = await dungNen(
    vao.laSo,
    `Giai đoạn đang đi qua mở ra điều gì, căng ở đâu, và chỗ nào nên chờ`,
    'tong-quan',
    vao.namXem,
    vao.thangXem
  );

  /*
   * Sáu lĩnh vực đi CHUNG một lượt gọi với ba chuyển động.
   *
   * Tách ra là sáu lượt nữa cho mỗi lần mở một mốc, mà cả sáu đều dựa trên
   * đúng bộ dữ kiện vừa dựng ở trên. Đi chung còn được một cái quan trọng hơn:
   * model thấy ba chuyển động và sáu lĩnh vực cùng lúc nên không viết ra sáu ô
   * mâu thuẫn với phần tổng ngay phía trên chúng.
   *
   * Dữ kiện đưa vào là đồ LUẬT ĐÃ CHỐT: lĩnh vực nào đọc từ cung nào, yếu tố
   * nào đỡ, yếu tố nào cản, quãng có chạm vào cung đó không. Model không được
   * tự đọc lá số ở đây, và không được đảo chiều kết luận — nó chỉ viết lại
   * thành chữ đọc được.
   */
  const coLinhVuc = Boolean(vao.linhVuc?.length);
  const khoiLinhVuc = coLinhVuc
    ? `

SÁU LĨNH VỰC — DỮ KIỆN LUẬT ĐÃ CHỐT, VIẾT LẠI CHỨ KHÔNG ĐỌC LẠI:
${vao
  .linhVuc!.map((lv) => {
    const dong = [
      `- ${lv.id} · ${lv.nhan} · đọc từ cung ${lv.cung} · quãng này ${lv.cham ? 'CÓ' : 'KHÔNG'} đi qua cung đó`,
      `  đang đỡ (${lv.thuan.length}): ${lv.thuan.length ? lv.thuan.join(' | ') : 'không có'}`,
      `  đang cản (${lv.can.length}): ${lv.can.length ? lv.can.join(' | ') : 'không có'}`,
    ];
    return dong.join('\n');
  })
  .join('\n')}

LUẬT CHO SÁU Ô NÀY:
- Mỗi ô ĐÚNG 2 câu, tối đa 45 từ. Câu đầu nói phần này đang ở đâu; câu sau nói nó có nghĩa gì với người đọc. Một câu là thiếu.
- Tương quan đỡ/cản ở trên là KẾT LUẬN ĐÃ CHỐT. Không được đảo. Nhiều đỡ hơn cản thì không được viết thành đang khó, và ngược lại.
- CẤM viết trần tương quan kiểu "các yếu tố đang đỡ nhiều hơn cản", "thuận nhiều hơn nghịch". Đó là số đếm, không phải nhận định. Phải nói ĐỠ Ở CHỖ NÀO và CẢN Ở CHỖ NÀO, bằng chính các nét đã liệt kê.
- CẤM nhắc tên cung ("đọc từ cung Quan Lộc"). Người đọc không cần biết nó đọc từ đâu.
- "Quãng này không đi qua cung đó" nghĩa là phần này giữ nhịp cũ — viết ra thành điều có ích, không viết thành "không có gì đáng nói".
- CẤM nói phần này nằm ngoài quãng: "phần tài chính không nằm trong giai đoạn này", "chưa tới lượt", "không thuộc quãng này". Đó là chuyện nội bộ của cách tính, người đọc không hỏi.
- Celes MÔ TẢ, không khuyên. Cùng một ý, viết theo cột phải:
    "cần thận trọng khi ra quyết định tài chính"  ->  "quyết định tiền bạc lúc này dễ bị cảm xúc của tuần đó kéo đi"
    "nên chú ý giữ sức khoẻ"                       ->  "sức bền tụt xuống trước khi bạn kịp nhận ra, thường là qua giấc ngủ"
    "đừng để áp lực công việc ảnh hưởng"           ->  "việc tràn sang giờ nghỉ là chuyện dễ xảy ra trong quãng này"
    "việc chăm sóc mối quan hệ sẽ hỗ trợ bạn"      ->  "người quanh bạn đang sẵn lòng hơn bình thường, phần đó đỡ được nhiều"
  Nhận ra mình đang viết "cần", "nên", "đừng", "tránh", "lưu ý", "chú ý" thì viết lại câu đó theo cột phải.
- Sáu ô phải khác nhau thật. Đổi một hai chữ trong cùng một câu là hỏng.
- Riêng suc-khoe: nói nhịp sống và mức năng lượng, không chẩn đoán, không nhắc bệnh.`
    : '';

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
  "ghepLai": "2-3 câu: ghép ba chuyển động lại thì quãng này là gì. Không lặp lại từng phần.",${
    coLinhVuc
      ? `
  "linhVuc": { ${vao.linhVuc!.map((lv) => `"${lv.id}": "2 câu"`).join(', ')} },`
      : ''
  }
  "maDuKien": [], "maNguon": []
}${khoiLinhVuc}`;

  // 4800 chứ không 3600: đo được ở lượt chạy thật là JSON bị cắt giữa ô thứ
  // năm, ô còn lại rỗng nên rơi về khuôn. Cắt token ở đây không tiết kiệm được
  // gì — bài cụt vẫn phải trả tiền, mà lại không dùng được.
  const kq = await goiVoiFallback({ system, user: nen.khoi, maxTokens: coLinhVuc ? 4800 : 2000 });
  const tho = docObjectJson(kq.text);
  if (!tho) return null;

  const doc = (x: unknown, nhan: string): ChuyenDong | null => {
    const o = x as { tieuDe?: unknown; noiDung?: unknown } | undefined;
    const noiDung = sachCau(o?.noiDung, nen, nhan);
    if (!noiDung) return null;
    const tieuDe = typeof o?.tieuDe === 'string' && o.tieuDe.trim() ? o.tieuDe.trim() : '';
    return { tieuDe, noiDung };
  };

  const dangMo = doc(tho.dangMo, 'dangMo');
  const dangCang = doc(tho.dangCang, 'dangCang');
  const canCho = doc(tho.canCho, 'canCho');
  const ghepLai = sachCau(tho.ghepLai, nen, 'ghepLai');
  if (!dangMo || !dangCang || !canCho || !ghepLai) {
    console.warn('[nhip-hanh-trinh] thiếu trường bắt buộc', {
      dangMo: Boolean(dangMo),
      dangCang: Boolean(dangCang),
      canCho: Boolean(canCho),
      ghepLai: Boolean(ghepLai),
    });
    return null;
  }

  /*
   * Sáu lĩnh vực: sai một ô thì bỏ RIÊNG ô đó.
   *
   * Khác ba chuyển động ở trên — thiếu một chuyển động là bài mất nghĩa nên
   * loại cả bài. Ở đây mỗi ô đứng độc lập, và lớp gọi còn nguyên khuôn cũ để
   * lấp vào. Loại cả bài chỉ vì một ô là ném đi năm ô viết đúng.
   */
  const linhVuc: Record<string, string> = {};
  if (coLinhVuc) {
    const tho6 = tho.linhVuc as Record<string, unknown> | undefined;
    for (const lv of vao.linhVuc!) {
      const cau = sachCau(tho6?.[lv.id], nen);
      if (!cau) continue;
      /*
       * Bỏ câu kê đơn NẾU phần còn lại vẫn đứng được. Không bỏ bằng mọi giá.
       *
       * Bản trước cho ô về khuôn khi phần còn lại dưới 40 ký tự, và đo được
       * ngay: 17% số ô rơi về khuôn, tức là đổi một câu hơi giống lời khuyên
       * lấy đúng câu "các yếu tố đang đỡ nhiều hơn cản" — thứ tệ hơn hẳn theo
       * đúng cái người đọc phàn nàn. Giọng kê đơn là lỗi nhẹ hơn văn cụt.
       */
      const khongKhuyen = boCauKhuyenBao(cau);
      const dung = khongKhuyen.length >= 40 ? khongKhuyen : cau;
      // Soát RIÊNG từng ô. Gộp sáu ô vào cùng một lượt soát với ba chuyển động
      // là để một chữ vấp ở ô Sức khoẻ xoá luôn cả bài — đo được ở lượt chạy
      // thật: hai trên ba mốc của một lá số mất trắng vì đúng chuyện này.
      if (soatNgonNgu(dung, [dung]).dat) linhVuc[lv.id] = dung;
    }
  }

  // Ba chuyển động và phần ghép mới là thứ quyết định bài còn dùng được hay
  // không: thiếu một cái là bài mất nghĩa, mà lớp gọi không có gì lấp vào.
  const gate = soatNgonNgu(
    [dangMo.noiDung, dangCang.noiDung, canCho.noiDung, ghepLai].join(' '),
    [dangMo.noiDung, dangCang.noiDung, canCho.noiDung]
  );
  if (!gate.dat) {
    console.warn('[nhip-hanh-trinh] không qua cổng ngôn ngữ', gate.loi.map((l) => l.ma));
    return null;
  }

  return {
    noiDung: {
      dangMo,
      dangCang,
      canCho,
      ghepLai,
      linhVuc: Object.keys(linhVuc).length ? linhVuc : undefined,
    },
    provider: kq.provider,
    model: kq.model,
    phienBan: nen.phienBan,
  };
}
