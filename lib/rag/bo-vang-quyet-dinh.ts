/**
 * Bộ vàng cho câu hỏi dạng QUYẾT ĐỊNH.
 *
 * Khác hai bộ vàng đang có:
 *   - `bo-vang.ts` đo PLANNER, chạy offline, không gọi model.
 *   - `bo-vang-rag.ts` đo TRUY HỒI và việc có dùng kho không.
 *   - Bộ này đo CHẤT LƯỢNG CẢM NHẬN của bài trả lời — thứ chỉ hiện ra khi đã
 *     có bài thật trong tay, nên nó bắt buộc phải gọi model.
 *
 * Vì sao cần riêng một bộ: "có nên nhận offer" là loại câu hỏi mà hệ thống
 * trượt nặng nhất trước P0-2, và cũng là loại câu người ta hỏi nhiều nhất khi
 * họ thật sự cần. Không có bộ đo riêng thì mọi cải thiện ở P0 sẽ trôi lại sau
 * vài lần sửa prompt mà không ai biết.
 *
 * `tuDoiTuong` là danh sách chữ chỉ CHÍNH VIỆC đang hỏi. Dùng để đo tiêu chí 4:
 * lực ngược có nói về việc đang hỏi hay chỉ nói chung về tính cách. Không có nó
 * thì "tuy nhiên bạn là người nhạy cảm" cũng tính là có lực ngược, mà câu đó
 * đúng với mọi câu hỏi nên nó không đo được gì.
 */

export interface CauVangQuyetDinh {
  cauHoi: string;
  /** Chữ chỉ chính việc đang hỏi — lực ngược phải chạm ít nhất một chữ trong này */
  tuDoiTuong: string[];
  the: string[];
}

export const BO_VANG_QUYET_DINH: CauVangQuyetDinh[] = [
  // ---------- Công việc ----------
  {
    cauHoi: 'tôi vừa nhận được 1 offer, tôi nên nhận nó ko',
    tuDoiTuong: ['offer', 'việc', 'công việc', 'lương', 'công ty', 'vị trí', 'nhận'],
    the: ['career', 'offer'],
  },
  {
    cauHoi: 'Tôi có nên nghỉ việc hiện tại để ra làm riêng không?',
    tuDoiTuong: ['nghỉ việc', 'ra riêng', 'làm riêng', 'tự làm', 'khởi nghiệp', 'công việc', 'kinh doanh'],
    the: ['career', 'startup'],
  },
  {
    cauHoi: 'Có nên chuyển sang một ngành khác hẳn không?',
    tuDoiTuong: ['ngành', 'chuyển', 'nghề', 'công việc', 'lĩnh vực'],
    the: ['career', 'pivot'],
  },
  {
    cauHoi: 'công ty đang layoff, tôi nên ở lại hay chủ động nhảy',
    tuDoiTuong: ['công ty', 'ở lại', 'nhảy', 'việc', 'layoff', 'nghỉ'],
    the: ['career', 'risk'],
  },
  {
    cauHoi: 'Tôi có nên nhận vị trí quản lý khi chưa từng quản ai không?',
    tuDoiTuong: ['quản lý', 'vị trí', 'đội', 'người', 'việc', 'nhận'],
    the: ['career', 'promotion'],
  },

  // ---------- Tiền ----------
  {
    cauHoi: 'Tôi có nên vay ngân hàng để mua nhà lúc này không?',
    tuDoiTuong: ['vay', 'nhà', 'ngân hàng', 'tiền', 'nợ', 'mua'],
    the: ['finance', 'debt'],
  },
  {
    cauHoi: 'có nên gọi vốn cho dự án của tôi ko',
    tuDoiTuong: ['vốn', 'dự án', 'nhà đầu tư', 'tiền', 'gọi vốn'],
    the: ['finance', 'startup'],
  },
  {
    cauHoi: 'Tôi có nên dồn hết tiền tiết kiệm vào một khoản đầu tư không?',
    tuDoiTuong: ['tiền', 'tiết kiệm', 'đầu tư', 'khoản', 'dồn'],
    the: ['finance', 'risk'],
  },

  // ---------- Quan hệ ----------
  {
    cauHoi: 'Tôi có nên chia tay người đang yêu không?',
    tuDoiTuong: ['chia tay', 'người yêu', 'mối quan hệ', 'tình cảm', 'hai người'],
    the: ['love', 'breakup'],
  },
  {
    cauHoi: 'có nên quay lại với người cũ không',
    tuDoiTuong: ['quay lại', 'người cũ', 'mối quan hệ', 'tình cảm'],
    the: ['love', 'reunion'],
  },
  {
    cauHoi: 'Vợ chồng tôi có nên ra ở riêng khỏi bố mẹ không?',
    tuDoiTuong: ['ra riêng', 'bố mẹ', 'vợ chồng', 'nhà', 'ở chung', 'gia đình'],
    the: ['family', 'living'],
  },
  {
    cauHoi: 'Tôi có nên cưới trong năm nay không?',
    tuDoiTuong: ['cưới', 'kết hôn', 'hôn nhân', 'bạn đời', 'năm nay'],
    the: ['love', 'marriage'],
  },

  // ---------- Sức khoẻ & đời sống ----------
  {
    cauHoi: 'Tôi kiệt sức, có nên nghỉ hẳn một thời gian không?',
    tuDoiTuong: ['kiệt sức', 'nghỉ', 'sức khoẻ', 'sức khỏe', 'nghỉ ngơi', 'làm việc'],
    the: ['health', 'burnout'],
  },
  {
    cauHoi: 'Có nên chuyển vào Nam sống và làm việc không?',
    tuDoiTuong: ['chuyển', 'sống', 'làm việc', 'nơi ở', 'đi xa', 'vào Nam'],
    the: ['relocation'],
  },
  {
    cauHoi: 'Tôi có nên đi học lên cao nữa ở tuổi này không?',
    tuDoiTuong: ['học', 'đi học', 'bằng cấp', 'tuổi', 'trường'],
    the: ['education'],
  },
];

/** Ba lá số dùng cho phép đo hoán lá số — khác nhau cả Mệnh, Cục lẫn giới tính */
export const LA_SO_DO: { ngay: number; thang: number; nam: number; gio: number; gioiTinh: 'nam' | 'nu' }[] = [
  { ngay: 24, thang: 8, nam: 2000, gio: 20, gioiTinh: 'nam' },
  { ngay: 3, thang: 11, nam: 1985, gio: 21, gioiTinh: 'nu' },
  { ngay: 28, thang: 6, nam: 1978, gio: 15, gioiTinh: 'nam' },
];
