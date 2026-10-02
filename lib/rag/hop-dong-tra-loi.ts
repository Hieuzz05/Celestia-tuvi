/**
 * Hợp đồng trả lời — chọn NHỊP và KIỂU cho một lượt chat.
 *
 * Hàm thuần, tất định, không gọi model. Chạy trước khi ráp prompt.
 *
 * ================== THỨ NÀY KHÔNG LÀM GÌ ==================
 *
 * Hợp đồng KHÔNG chứa hướng, không chứa nghiêng, không chứa khuyến nghị. Nó
 * đổi thứ tự và độ dài, KHÔNG BAO GIỜ đổi kết luận. Hướng do engine đếm ở
 * `nghieng-ve.ts` và đi vào prompt bằng đường riêng (`khoiNghiengVe`); hàm này
 * không nhận lá số nên không có cách nào chạm vào nó.
 *
 * Thêm một trường kiểu `huong`/`nghiengVe`/`khuyenNghi` vào đây là phá chính
 * ranh giới làm nó an toàn. Đừng.
 *
 * ================== VÌ SAO CHỈ CÓ HAI TRƯỜNG ==================
 *
 * Bản thiết kế ban đầu có bốn: thêm `playfulness` (0|1|2) và `characterHook`
 * (NONE|INSIGHT_FOUND|DRY_HUMOR|LIGHT_TEASE). Hai trường ấy đã bị bỏ ngày
 * 02/10/2026 — xem mục 17 của `docs/chien-luoc/ca-nhan-hoa-celes.md`.
 *
 * Lý do ngắn gọn: một trường enum trong schema ĐẦU RA của model không phải một
 * phép đếm, nó là lời model tự khai. Ghi nó xuống cơ sở dữ liệu là ghi lại một
 * điều có thể đã không xảy ra. Dự án đã trả giá bốn lần cho bài học này —
 * `gomLoiKhuyen` (75–79% sau ba lần sửa prompt), `CUM_BA_PHAI`, `catMoDauThua`,
 * `suaCauTiengLong`. Nếp là ép bằng mã, đừng xin model.
 *
 * ================== CHỈ LẤP CHỖ TRỐNG ==================
 *
 * `THEO_Y_DINH` trong `prompt-co-can-cu.ts` ĐÃ điều khiển nhịp/giọng cho năm
 * trong sáu ý định, và `dungVan` (`tra-loi.ts`) đã chốt khuôn tin nhắn/báo cáo
 * một cách tất định TRÊN ĐẦU RA — tầng đáng tin hơn hẳn tầng prompt.
 *
 * Nên hàm này cố ý KHÔNG phát khối cho những ô đã có người nói. Viết lại một
 * chỉ thị đã tồn tại, bằng từ khác, ở tầng kém tin cậy hơn, không phải tính
 * năng — đó là hai chỉ thị cạnh tranh trong cùng một prompt, và không ai đoán
 * được model nghe cái nào.
 *
 * Đúng bốn chỗ hàm này được phép có tiếng nói:
 *
 *   1. Ô `mo-ta` — `THEO_Y_DINH['mo-ta']` là chuỗi RỖNG. Khoảng trống thật.
 *   2. `chuDe` ∈ {tinh-cam, gia-dao} → COMPANION. `chuDe` không xuất hiện một
 *      lần nào trong `prompt-co-can-cu.ts`; trục này chưa ai dùng.
 *   3. `quyet-dinh`/`co-khong` KHÔNG BAO GIỜ nhận COMPACT (xem dưới).
 *   4. `SENSITIVE` → cấm COMPACT, ép COMPANION (xem dưới).
 *
 * `suc-khoe` CỐ Ý không nằm trong (2). `doAnToan()` đã gác chủ đề đó rồi; cho
 * nó tự sang COMPANION là dựng luật thứ hai chồng lên lớp an toàn. Người hỏi
 * sức khoẻ ở mức NORMAL là đang hỏi bình thường — đẩy họ sang giọng tâm sự là
 * tự ý cho rằng họ đang lo. Nếu họ lo thật thì `doAnToan()` chấm SENSITIVE, và
 * luật (4) lo phần đó.
 *
 * ================== ĐỘ SÂU (CEL-186a) ==================
 *
 * `tinhDoSau` ở cuối tệp chọn QUICK / STANDARD / DEEP — trục RIÊNG với nhịp.
 * Cùng ranh giới: nó nhận `coNghieng` và `cap`, KHÔNG nhận hướng, nên chỉ
 * quyết bài dài hay ngắn. Luật nào đẩy về STANDARD (an toàn, chủ đề nặng, chip,
 * nhiều yêu cầu, năm khác, chiều xấu, hỏi về người khác…) đều thắng QUICK.
 * Cờ `CELES_QUICK_ANSWER` quyết độ sâu có được dùng thật không — xem
 * `quickAnswerBat`.
 */

import type { ChuDe, YDinh } from './planner';
import type { MucAnToan } from './an-toan';
import type { CapLuanHan } from '@/lib/tuvi/luan-han';
import { coNamKhac, laCauChieuXau } from './chot-huong';
import { boDau } from './thuc-the';

/** Nhịp: bài dài bao nhiêu, dẫn dắt bao nhiêu. KHÔNG phải kết luận gì. */
export type Nhip = 'COMPACT' | 'MEDIUM' | 'DEEP';

/** Kiểu: nói theo lối nào. KHÔNG phải nói điều gì. */
export type Kieu = 'PRACTICAL' | 'ANALYTICAL' | 'COMPANION';

export interface HopDongTraLoi {
  nhip: Nhip;
  kieu: Kieu;
}

/**
 * Ý định nào ĐÃ có chỉ thị nhịp/giọng trong `THEO_Y_DINH`.
 *
 * Năm ô này không nhận khối hợp đồng — `THEO_Y_DINH` nói rồi, và nó nói cụ thể
 * hơn. Giữ danh sách này khớp với `THEO_Y_DINH`: ô nào bên đó chuyển từ rỗng
 * sang có chữ thì thêm vào đây, và ngược lại.
 */
const DA_CO_CHI_THI: ReadonlySet<YDinh> = new Set<YDinh>([
  'quyet-dinh',
  'co-khong',
  'thoi-diem',
  'giai-thich',
  'tra-cuu',
]);

/** Ô này có nhận khối hợp đồng vào prompt không. Một nguồn cho cả `khoiHopDong` lẫn `boDanDat`. */
function coKhoiHopDong(yDinh: YDinh): boolean {
  return !DA_CO_CHI_THI.has(yDinh);
}

/**
 * Prompt lượt này có bảo model "bỏ phần dẫn dắt" không.
 *
 * Đúng khi `khoiHopDong` phát chữ của nhịp COMPACT. Dấu ấn Celes đọc hàm này
 * để không tự chèn lại đúng cái câu dẫn mà prompt vừa bảo model bỏ — xem
 * `dau-an.ts`. Cùng điều kiện với `khoiHopDong`, nên hai bên không lệch nhau.
 */
export function boDanDat(h: HopDongTraLoi, yDinh: YDinh): boolean {
  return coKhoiHopDong(yDinh) && h.nhip === 'COMPACT';
}

/**
 * Câu hỏi dài bao nhiêu thì người ta muốn nghe dài.
 *
 * Ngưỡng thô và cố ý thô: đây là tín hiệu yếu, không đáng cân đo tinh vi. Câu
 * một dòng thường là hỏi nhanh; câu kể lể mấy dòng thường là đang cần nói
 * chuyện. Chỉ dùng cho ô `mo-ta`, nơi không có chỉ thị nào khác.
 */
const NGAN = 60;
const DAI = 220;

/**
 * Ý định nào tuyệt đối không được nén.
 *
 * `quyet-dinh` và `co-khong` mang theo bảy việc bắt buộc trong `THEO_Y_DINH`,
 * luật "3–6 câu" mỗi `yChinh`, và `kiem-duyet` sẽ LOẠI bài thiếu `ketLuan` hay
 * `tuKiem`. Bảo model vừa "nén lại" vừa "làm đủ bảy việc" là đặt hai chỉ thị
 * ngược nhau cạnh nhau — nó sẽ bỏ bớt cái gì đó, và không ai biết trước là cái
 * nào. Thứ dễ rơi nhất lại đúng là thứ tốn chữ nhất: dịch nghĩa cách cục, lực
 * ngược, `neuThi`.
 *
 * Kẹp bằng MÃ, không bằng lời dặn trong prompt. Lời dặn là thứ `gomLoiKhuyen`
 * đã đo được: 75–79% sau ba lần sửa.
 */
const KHONG_DUOC_NEN: ReadonlySet<YDinh> = new Set<YDinh>(['quyet-dinh', 'co-khong']);

/** Chủ đề nào đáng đổi sang giọng đồng hành. Xem ghi chú đầu tệp về `suc-khoe`. */
const CHU_DE_DONG_HANH: ReadonlySet<ChuDe> = new Set<ChuDe>(['tinh-cam', 'gia-dao']);

/**
 * Chọn hợp đồng cho một lượt.
 *
 * Tất định: cùng đầu vào luôn cho cùng kết quả. Không đọc đồng hồ, không đọc
 * biến môi trường, không gọi model, không chạm mạng.
 */
export function tinhHopDong(vao: {
  yDinh: YDinh;
  chuDe: ChuDe;
  doDaiCauHoi: number;
  mucAnToan?: MucAnToan;
}): HopDongTraLoi {
  const dongHanh = CHU_DE_DONG_HANH.has(vao.chuDe);

  /*
   * Nhịp mặc định theo độ dài câu hỏi, chỉ có nghĩa ở ô `mo-ta`.
   *
   * Các ô khác không phát khối nên giá trị này không ra tới prompt; vẫn tính
   * đủ để hàm luôn trả một hợp đồng hợp lệ và bài kiểm phủ được mọi tổ hợp.
   */
  let nhip: Nhip = 'MEDIUM';
  if (vao.doDaiCauHoi <= NGAN) nhip = 'COMPACT';
  else if (vao.doDaiCauHoi >= DAI) nhip = 'DEEP';

  let kieu: Kieu = dongHanh ? 'COMPANION' : 'ANALYTICAL';

  /*
   * SENSITIVE: cấm nén, ép giọng đồng hành.
   *
   * Người đang ở trạng thái này vẫn được luận bình thường — CRITICAL mới dừng
   * luồng, và nó dừng từ `route.ts` trước khi tới đây. Nhưng một bài cộc lốc
   * với người đang khó khăn thì lời miễn trừ nối ở cuối bài không bù lại được:
   * họ đã đọc hết bài trước khi gặp nó.
   */
  if (vao.mucAnToan === 'SENSITIVE') {
    if (nhip === 'COMPACT') nhip = 'MEDIUM';
    kieu = 'COMPANION';
  }

  // Kẹp cuối cùng, sau mọi luật khác: ý định có ràng buộc cứng thì không nén.
  if (KHONG_DUOC_NEN.has(vao.yDinh) && nhip === 'COMPACT') nhip = 'MEDIUM';

  return { nhip, kieu };
}

/** Nhịp → câu tiếng Việt. Nhãn máy KHÔNG được lọt vào prompt. */
const CHU_NHIP: Record<Nhip, string> = {
  COMPACT: 'Trả lời gọn. Vào thẳng điều họ hỏi, bỏ phần dẫn dắt.',
  MEDIUM: 'Độ dài vừa phải. Đủ để nói hết ý, không kéo dài thêm.',
  DEEP: 'Được nói kỹ. Họ hỏi dài nên họ muốn nghe đủ, nhưng vẫn phải có mạch.',
};

/**
 * Kiểu → câu tiếng Việt.
 *
 * CHỮ Ở ĐÂY ĐI THẲNG VÀO PROMPT, nên nó phải tuân `CHUAN_NGON_NGU_CELES`:
 * chuẩn đó CẤM "cấu trúc" và "biểu hiện" (xem bảng `bang-chu-truu-tuong`).
 * Dặn model bằng đúng chữ chuẩn cấm nó dùng là đặt hai chỉ thị ngược nhau
 * trong một prompt — và chữ ấy rất dễ chép thẳng ra bài.
 *
 * KHÔNG dùng chữ "báo cáo" trong các câu này. `dungVan` (`tra-loi.ts:122`)
 * chọn khuôn TIN NHẮN hay BÁO CÁO một cách tất định trên ĐẦU RA, và khuôn báo
 * cáo chính là khuôn có `### tieuDe`. Dặn model "đừng như một bản báo cáo" ở
 * đây là mời nó bỏ `tieuDe` — một câu về GIỌNG đổi mất HÌNH, mà hình thì
 * không phải việc của hợp đồng.
 *
 * `PRACTICAL` hiện là MÃ CHẾT: `tinhHopDong` chỉ trả ANALYTICAL hoặc
 * COMPANION. Giữ lại để trục kiểu còn chỗ mở, nhưng bật nó thì phải soát lại
 * câu chữ trước — chưa ai đọc nó trong một prompt thật.
 */
const CHU_KIEU: Record<Kieu, string> = {
  PRACTICAL: 'Nói theo lối thực tế: điều họ làm được, không phải điều đáng suy ngẫm.',
  ANALYTICAL:
    'Nói rõ từng bước: cách mọi thứ đang xếp trước, rồi tới chuyện đời thường nó dẫn tới.',
  COMPANION:
    'Nói như đang ngồi cạnh người hỏi — đây là chuyện của người thật, không phải một hồ sơ. Nhưng ấm không phải là mơ hồ: vẫn nêu tên căn cứ, vẫn nói rõ lá số nghiêng về đâu, và không hứa chuyện chưa xảy ra.',
};

/**
 * Khối chữ cho prompt. Trả chuỗi RỖNG khi ô đã có chỉ thị khác.
 *
 * Rỗng là trạng thái bình thường và đúng, không phải lỗi: năm trong sáu ý định
 * đã được `THEO_Y_DINH` nói cụ thể hơn.
 *
 * Khối này phải đứng TRƯỚC `phanYDinh` trong phần `user`, để `THEO_Y_DINH` —
 * nơi giữ các luật cứng — luôn là thứ model đọc sau cùng. Model nghiêng về chỉ
 * thị đứng sau; chỗ đứng ở đây là một quyết định, không phải chuyện sắp xếp.
 * Có bài kiểm khoá thứ tự này.
 */
export function khoiHopDong(h: HopDongTraLoi, yDinh: YDinh): string {
  if (!coKhoiHopDong(yDinh)) return '';
  return `CÁCH VIẾT LƯỢT NÀY\n${CHU_NHIP[h.nhip]}\n${CHU_KIEU[h.kieu]}`;
}

/* ================================================================
 * ĐỘ SÂU — CEL-186a
 * ================================================================
 *
 * Trục thứ ba, TÁCH khỏi `Nhip`: `Nhip` chỉnh độ dài trong ô `mo-ta`, còn độ
 * sâu chọn KHUÔN của cả lượt — QUICK là một tin nhắn ngắn có một câu chốt,
 * STANDARD là đường hôm nay, DEEP là đường hôm nay cộng nhịp DEEP.
 *
 * Vẫn đúng ranh giới đầu tệp: hàm này KHÔNG nhận lá số và KHÔNG nhận hướng
 * nghiêng. Nó chỉ cần biết engine CÓ hướng hay không (`coNghieng`) và hướng ấy
 * thuộc lớp hạn nào (`cap`) — cả hai đều không nói hướng là gì.
 *
 * Luật xếp theo thứ tự cố định, luật nào khớp trước thì thắng. Mọi luật đẩy
 * về STANDARD/DEEP đứng TRƯỚC luật cho QUICK, nên một tín hiệu nặng không bao
 * giờ bị một tín hiệu nhẹ hơn ghi đè.
 */

export type DoSauTraLoi = 'QUICK' | 'STANDARD' | 'DEEP';

/** Lý do chọn độ sâu — ghi vết, không đi vào prompt. */
export type LyDoDoSau =
  | 'an-toan'
  | 'chu-de-nang'
  | 'xin-sau'
  | 'xin-them'
  | 'tu-chip'
  | 'giai-thich'
  | 'nhieu-ve'
  | 'ngoai-tam'
  | 'y-dinh'
  | 'a-hay-b'
  | 'chu-de'
  | 'khong-huong'
  | 'giai-doan'
  | 'nam-khac'
  | 'chieu-xau'
  | 'nguoi-khac'
  | 'quick';

/** Chủ đề được QUICK trong 186a (P2). Gia đạo, sức khoẻ, tổng quan: chưa. */
const CHU_DE_QUICK: ReadonlySet<ChuDe> = new Set<ChuDe>(['su-nghiep', 'tai-chinh', 'tinh-cam']);

/** Câu không có dấu tiếng Việt nào — người gõ không dấu. */
const khongDau = (s: string) => boDau(s) === s.toLowerCase();

/** Khớp cụm có dấu theo ranh giới từ; người gõ không dấu thì khớp bản bỏ dấu. */
function khop(cauHoi: string, coDau: string, boDauMau: string): boolean {
  const s = cauHoi.normalize('NFC');
  if (new RegExp(`(?<![\\p{L}\\p{M}])(?:${coDau})(?![\\p{L}\\p{M}])`, 'iu').test(s)) return true;
  return khongDau(s) && new RegExp(`(?:^|[^a-z])(?:${boDauMau})(?:$|[^a-z])`).test(boDau(s));
}

/**
 * Chủ đề nặng (doc 16.6): cụm nhiều âm tiết, so có dấu. Bỏ "mất" trần và "qua
 * khỏi" trần — tiên lượng đã chặn ở route. Nhầm về phía an toàn chấp nhận được.
 */
export function coChuDeNang(cauHoi: string): boolean {
  return khop(
    cauHoi,
    'bệnh nặng|ung thư|phẫu thuật|tai nạn|sảy thai|qua đời|đã mất|vừa mất|đám tang|nằm viện',
    'benh nang|ung thu|phau thuat|tai nan|say thai|qua doi|da mat|vua mat|dam tang|nam vien'
  );
}

/** Người dùng xin phân tích sâu. */
export function xinSau(cauHoi: string): boolean {
  return khop(
    cauHoi,
    'phân tích|chi tiết|kỹ|kĩ|sâu hơn|cặn kẽ|cả đời|các đại vận|toàn bộ',
    'phan tich|chi tiet|can ke|ca doi|cac dai van|toan bo'
  );
}

/** Người dùng xin nói thêm về điều vừa nói. */
export function xinThem(cauHoi: string): boolean {
  return khop(
    cauHoi,
    'nói rõ hơn|rõ hơn|cụ thể hơn|giải thích thêm|nói thêm',
    'noi ro hon|cu the hon|giai thich them|noi them'
  );
}

/** Hỏi "vì sao" — cần lý lẽ, không phải câu chốt. */
function hoiViSao(cauHoi: string): boolean {
  return khop(cauHoi, 'tại sao|vì sao|sao vậy|lý do', 'tai sao|vi sao|sao vay|ly do');
}

/** Chuỗi bỏ dấu, chỉ còn chữ-số, có dấu cách hai đầu — để khớp theo từ. */
const tuBoDau = (s: string) => ` ${boDau(s).replace(/[^a-z0-9]+/g, ' ').trim()} `;

/**
 * Hai vế hỏi độc lập: từ hai dấu "?" trở lên, hoặc "… và có … không".
 * "Tôi và người yêu có cưới không" chỉ một vế: "và" nối chủ ngữ, không nối câu hỏi.
 */
export function nhieuVe(cauHoi: string): boolean {
  if ((cauHoi.match(/\?/g) ?? []).length >= 2) return true;
  return / (?:va|voi lai|con) (?:co|nen|bao gio|khi nao) /.test(tuBoDau(cauHoi));
}

/** "A hay B": hai lựa chọn. "… hay không / hay chưa" chỉ là đuôi câu hỏi. */
export function laAHayB(cauHoi: string): boolean {
  return / (?:hay|hoac) (?!(?:khong|ko|k|chua|thoi|la khong) )\S/.test(tuBoDau(cauHoi));
}

/**
 * Câu hỏi về đời của NGƯỜI KHÁC: "bố tôi có…", "vợ tôi năm nay có thăng
 * chức không", "anh ấy có yêu tôi không". Câu dự phòng nói về phần đời của
 * người hỏi, nên với câu này nó sai chủ ngữ (doc mục 17, Lung lay).
 *
 * Chỉ bắt khi người kia đứng làm CHỦ NGỮ ở đầu câu, hoặc là đại từ ngôi ba.
 * "Chuyện vợ chồng tôi…", "tôi với người yêu…" là chuyện của người hỏi.
 */
export function hoiVeNguoiKhac(cauHoi: string): boolean {
  const s = tuBoDau(cauHoi);
  const dau = s.trim().replace(/^(?:cho (?:em|toi|minh) hoi|xin hoi|celes oi|celes)\s+/, '');
  const NGUOI =
    '(?:bo|me|ba|ma|cha|ong|con|anh|chi|em|sep|ban|vo|chong|nguoi yeu|ban trai|ban gai|dong nghiep|anh trai|chi gai|em trai|em gai)';
  if (new RegExp(`^${NGUOI} (?:toi|minh|cua toi|cua minh|nha toi)(?: |$)`).test(dau)) return true;
  return / (?:anh ay|co ay|chi ay|ong ay|ba ay|nguoi do|nguoi ay) (?:co|se|da|dang|nam nay|bao gio) /.test(s);
}

export interface DauVaoDoSau {
  yDinh: YDinh;
  chuDe: ChuDe;
  cauHoi: string;
  namXem: number;
  mucAnToan?: MucAnToan;
  /** Lượt bấm từ chip gợi ý. TÁCH khỏi câu nối gõ tay. */
  laTiepTuChip: boolean;
  ngoaiTam: boolean;
  /** Engine có chốt một hướng không — KHÔNG phải hướng nào. */
  coNghieng: boolean;
  /** Lớp hạn sâu nhất engine dùng; `null` khi không có hướng. */
  cap: CapLuanHan | null;
}

/**
 * Chọn độ sâu cho một lượt. Hàm thuần: không đọc env, không đọc đồng hồ.
 * Cờ bật/tắt QUICK nằm ở `quickAnswerBat` — lớp gọi tự áp.
 */
export function tinhDoSau(v: DauVaoDoSau): { doSau: DoSauTraLoi; lyDo: LyDoDoSau } {
  const S = (lyDo: LyDoDoSau) => ({ doSau: 'STANDARD' as const, lyDo });
  const mucAnToan = v.mucAnToan ?? 'NORMAL';

  if (mucAnToan !== 'NORMAL') return S('an-toan');
  if (coChuDeNang(v.cauHoi)) return S('chu-de-nang');
  if (xinSau(v.cauHoi)) return { doSau: 'DEEP', lyDo: 'xin-sau' };
  if (xinThem(v.cauHoi)) return S('xin-them');
  if (v.laTiepTuChip) return S('tu-chip');
  if (v.yDinh === 'giai-thich' || v.yDinh === 'tra-cuu' || hoiViSao(v.cauHoi)) return S('giai-thich');
  if (nhieuVe(v.cauHoi)) return S('nhieu-ve');

  // Ngoại lệ duy nhất của P2: câu ngoài tầm không cần hướng — mã đặt kết luận.
  // Trừ khi câu kèm chuyện xấu ("… có phải ngoại tình với X"): đó là câu nặng,
  // không phải câu hỏi tên.
  if (v.ngoaiTam) return laCauChieuXau(v.cauHoi) ? S('chieu-xau') : { doSau: 'QUICK', lyDo: 'ngoai-tam' };

  if (v.yDinh !== 'co-khong' && v.yDinh !== 'quyet-dinh') return S('y-dinh');
  if (laAHayB(v.cauHoi)) return S('a-hay-b');
  if (!CHU_DE_QUICK.has(v.chuDe)) return S('chu-de');
  if (!v.coNghieng) return S('khong-huong');
  if (v.cap === 'giai-doan' || v.cap === null) return S('giai-doan');
  if (coNamKhac(v.cauHoi, v.namXem)) return S('nam-khac');
  if (laCauChieuXau(v.cauHoi)) return S('chieu-xau');
  if (hoiVeNguoiKhac(v.cauHoi)) return S('nguoi-khac');
  return { doSau: 'QUICK', lyDo: 'quick' };
}

/**
 * Cờ `CELES_QUICK_ANSWER`: '1' bật, '0' tắt. Không đặt thì chỉ bật trên bản
 * preview của Vercel (`VERCEL_ENV=preview`) — production không tự bật.
 */
export function quickAnswerBat(env: Record<string, string | undefined> = process.env): boolean {
  const v = env.CELES_QUICK_ANSWER?.trim().toLowerCase();
  if (v === '1' || v === 'true') return true;
  if (v === '0' || v === 'false') return false;
  return env.VERCEL_ENV === 'preview';
}

/**
 * Cờ `CELES_TINH_NGHICH`: '1' bật, '0' tắt. Không đặt thì theo cờ QUICK.
 * Tắt riêng được nhịp trêu mà không phải tắt QUICK.
 */
export function tinhNghichBat(env: Record<string, string | undefined> = process.env): boolean {
  const v = env.CELES_TINH_NGHICH?.trim().toLowerCase();
  if (v === '1' || v === 'true') return true;
  if (v === '0' || v === 'false') return false;
  return quickAnswerBat(env);
}
