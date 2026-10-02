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
 */

import type { ChuDe, YDinh } from './planner';
import type { MucAnToan } from './an-toan';

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
  if (DA_CO_CHI_THI.has(yDinh)) return '';
  return `CÁCH VIẾT LƯỢT NÀY\n${CHU_NHIP[h.nhip]}\n${CHU_KIEU[h.kieu]}`;
}
