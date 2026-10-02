import type { TinNhan } from '@/lib/ai/prompt';
import type { MucAnToan } from './an-toan';
import { CUM_TIENG_LONG_CAM } from './chuan-ngon-ngu';
import type { YDinh } from './planner';

/**
 * Dấu ấn Celes — tầng tính cách của một lượt chat (Character System v4).
 *
 * Quyết định và số đo nằm ở `docs/chien-luoc/ca-nhan-hoa-celes.md` mục 23.
 *
 * Tầng này chỉ chọn MỘT câu dẫn luận đặt cạnh kết luận. Nó không đọc lá số,
 * không đọc bằng chứng, không đọc lời người dùng — nên không có đường nào chạm
 * tới nội dung luận.
 *
 * Tầng tính cách KHÔNG được biết và KHÔNG được hứa tầng trình bày sẽ dựng thế nào.
 */

/** Đổi câu trong thư viện hay đổi cách chọn thì tăng — ghi vào `phienBan` của mỗi lượt */
export const PHIEN_BAN_DAU_AN = 'dau-an-v1';

export type TangDauAn = 'KHONG' | 'DAN_LUAN' | 'KHO_HAI';

/**
 * Tầng hài khô. TẮT, và chưa có câu nào.
 *
 * Bật cờ mà không có thư viện thì `chonTang` vẫn trả `DAN_LUAN` — điều kiện thứ ba
 * của hàm đó. Mở tầng này là một phiên riêng, có duyệt riêng.
 */
export const BAT_KHO_HAI = false;

/** Ý định được phép đùa khô — chỉ có tác dụng khi `BAT_KHO_HAI` bật */
const Y_DINH_KHO_HAI: ReadonlySet<YDinh> = new Set<YDinh>(['mo-ta', 'giai-thich', 'thoi-diem']);

/** Chưa viết câu nào — mục 23: ship DAN_LUAN trước, KHO_HAI để phiên sau */
const THU_VIEN_KHO_HAI: Partial<Record<YDinh, readonly string[]>> = {};

/**
 * Lượt này có dấu ấn không, và ở tầng nào.
 *
 * - Không phải NORMAL thì KHÔNG. SENSITIVE vẫn được luận nhưng không cần một
 *   giọng riêng chen vào; CRITICAL không bao giờ tới đây — route đã dừng từ
 *   `app/api/hoi-dap/route.ts`, nhưng vẫn chặn ở đây để hàm đúng khi gọi lẻ.
 * - `tra-cuu` thì KHÔNG: khuôn tin nhắn đã rút gọn nó, một câu dẫn luận cho
 *   "Lộc Tồn nghĩa là gì" là thừa.
 * - Còn lại `DAN_LUAN`. `quyet-dinh` / `co-khong` là nơi nó chạy mạnh nhất.
 */
export function chonTang(yDinh: YDinh, mucAnToan: MucAnToan, batKhoHai = BAT_KHO_HAI): TangDauAn {
  if (mucAnToan !== 'NORMAL') return 'KHONG';
  if (yDinh === 'tra-cuu') return 'KHONG';
  if (batKhoHai && Y_DINH_KHO_HAI.has(yDinh) && THU_VIEN_KHO_HAI[yDinh]?.length) return 'KHO_HAI';
  return 'DAN_LUAN';
}

/** Số biến thể mỗi ý định. Đổi con số này là phải chạy lại `scripts/do-coverage-dau-an.ts` */
export const SO_BIEN_THE = 3;

/**
 * FNV-1a 32-bit, tất định trên mọi máy và mọi lần chạy.
 *
 * Không dùng `Math.random` (hai lần hỏi cùng câu ra hai giọng) và không băm lời
 * người dùng (câu chữ đổi một dấu là đổi giọng, và không đo được phủ).
 */
export function stableIndex(khoa: string, n: number): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < khoa.length; i++) {
    h ^= khoa.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % n;
}

/**
 * Khoá chọn biến thể: `chuDe:yDinh`, KHÔNG gì khác.
 *
 * Không phụ thuộc `lichSu`: một nửa phiên dừng sau đúng một câu (mục 17), nên
 * xoay theo lịch sử là mọi người dùng mới đọc cùng một câu, vĩnh viễn.
 *
 * Keyspace chỉ có 6 chuDe × 5 yDinh. Với 3 biến thể mỗi yDinh, 6 khoá phủ kín
 * 3 ô (UNREACHABLE = 0, đã đo); từ 4 biến thể trở lên là có câu không khoá nào
 * tới được. Hai khoá khác chủ đề CÓ THỂ ra cùng một câu — vô hại chỉ vì câu
 * không nhắc chủ đề (bất biến (a) bên dưới).
 */
export function khoaBienThe(chuDe: string, yDinh: YDinh): string {
  return `${chuDe}:${yDinh}`;
}

/**
 * Thư viện DAN_LUAN — đúng `SO_BIEN_THE` câu mỗi ý định. Chủ dự án duyệt tay.
 *
 * HAI BẤT BIẾN — vi phạm là lỗi, không phải góp ý (mục 23):
 *
 * (a) KHÔNG nhắc chủ đề. Hai khoá khác chủ đề có thể băm vào cùng một câu
 *     (tai-chinh:mo-ta và tinh-cam:mo-ta cùng ra mo-ta#0), nên "Với chuyện tiền
 *     bạc…" sẽ hiện ra trong một câu hỏi về tình cảm.
 * (b) KHÔNG hứa bố cục bài. `ketLuan` là tuỳ chọn và `dungVan` chọn khuôn tin
 *     nhắn khi ít ý — "chốt trước, lý do phía sau" có thể trỏ vào thứ không có.
 *
 * Thêm một luật viết: không khẳng định cũng không rào độ chắc. Câu đứng ngay
 * sau kết luận — "khá rõ" hay "còn tuỳ hoàn cảnh" đều là đổi giọng kết luận,
 * mà giọng chắc chắn do luật quyết (`haGiong`), không do tầng này.
 */
export const THU_VIEN_DAN_LUAN: Readonly<Record<Exclude<YDinh, 'tra-cuu'>, readonly string[]>> = {
  'quyet-dinh': [
    'Một quyết định rõ hơn khi biết mỗi phía đang dựa trên những căn cứ nào.',
    'Điều đáng giữ lại không chỉ là kết luận, mà là vì sao các căn cứ dẫn tới kết luận đó.',
    'Một dấu hiệu hiếm khi đủ để làm rõ một quyết định; cần nhìn cách nhiều căn cứ ghép lại.',
  ],
  'co-khong': [
    'Dù kết luận là có hay không, câu trả lời chỉ đáng tin khi có đủ căn cứ.',
    'Câu trả lời có hay không đến từ cách các dấu hiệu nghiêng về phía nào khi đặt cạnh nhau.',
    'Câu trả lời ở đây nằm ở cách các dấu hiệu kết hợp với nhau, không ở một dấu hiệu đơn lẻ.',
  ],
  'thoi-diem': [
    'Thời điểm trong lá số hiện ra theo từng giai đoạn, không phải một ngày đẹp đứng riêng.',
    'Mốc đáng chú ý thường xuất hiện khi nhiều dấu hiệu cùng thay đổi trong một giai đoạn.',
    'Chuyện lúc nào chỉ rõ khi đặt vào đúng giai đoạn đang chạy, không tách khỏi nhịp chung của lá số.',
  ],
  'giai-thich': [
    'Một điều lặp lại hiếm khi đứng một mình; nó thường là chỗ nhiều dấu hiệu cùng gặp nhau.',
    'Điều nhìn thấy trước thường chỉ là phần nổi; nguyên do nằm ở cách các dấu hiệu trong lá số tác động lẫn nhau.',
    'Một nét chỉ giải thích được khi đặt cạnh những phần còn lại của lá số, không đọc riêng một mảnh.',
  ],
  'mo-ta': [
    'Cùng một nét có thể mang nghĩa khác khi đi cùng những dấu hiệu khác.',
    'Mỗi nét ở đây chỉ đọc đúng khi đặt cạnh những nét còn lại.',
    'Nhìn một nét thôi rất dễ đọc thiếu; ý nghĩa của nó rõ hơn khi đặt cùng những dấu hiệu khác.',
  ],
};

/**
 * Cụm nhạt — câu dán được vào bất kỳ cuộc trò chuyện nào.
 *
 * `soatNgonNgu` KHÔNG bắt được loại này (đã đo: nó cho qua "Đây là một câu hỏi
 * thú vị và đáng để suy nghĩ thêm"). Danh sách này cũng chỉ là lint; người
 * duyệt vẫn phải đọc từng câu.
 */
export const CUM_FILLER_CAM: readonly string[] = [
  'câu hỏi thú vị',
  'đáng để suy nghĩ',
  'nhiều góc nhìn',
  'không có câu trả lời đơn giản',
  'điều đáng chú ý là',
];

/** Bất biến (a): tên chủ đề và các cách gọi đời thường của nó */
const CHU_DE_CAM =
  /(?:sự nghiệp|công việc|việc làm|nghề|tài chính|tiền|của cải|thu nhập|đầu tư|tình cảm|tình yêu|hôn nhân|vợ|chồng|người yêu|gia đình|gia đạo|con cái|cha mẹ|bố mẹ|sức khỏe|sức khoẻ|bệnh|tổng quan)/iu;

/** Bất biến (b): câu trỏ vào phần khác của bài */
const HUA_BO_CUC =
  /(?:dưới đây|phía sau|phần sau|đoạn sau|ở sau|trước tiên|rồi mới|chốt (?:ngắn|hướng|trước)|sẽ (?:tách|nói|đi|chốt|phân tích|xem)|lần lượt|từng phần)/iu;

/** Rào hoặc khẳng định độ chắc — xem ghi chú thư viện */
const DO_CHAC =
  /(?:khá rõ|rất rõ|chắc chắn|còn tuỳ|còn tùy|tuỳ hoàn cảnh|tùy hoàn cảnh|khó nói)/iu;

/** Trả danh sách lỗi của một câu dấu ấn; rỗng là qua */
export function kiemCauDauAn(cau: string): string[] {
  const loi: string[] = [];
  const thuong = cau.toLowerCase();
  for (const cum of CUM_FILLER_CAM) if (thuong.includes(cum)) loi.push(`filler: "${cum}"`);
  // Cùng danh sách khối `cam-tieng-long` in vào prompt — không giữ bản sao riêng.
  for (const cum of CUM_TIENG_LONG_CAM) if (thuong.includes(cum)) loi.push(`tiếng lóng: "${cum}"`);
  const cd = cau.match(CHU_DE_CAM);
  if (cd) loi.push(`nhắc chủ đề: "${cd[0]}"`);
  const bc = cau.match(HUA_BO_CUC);
  if (bc) loi.push(`hứa bố cục: "${bc[0]}"`);
  const dc = cau.match(DO_CHAC);
  if (dc) loi.push(`đổi độ chắc: "${dc[0]}"`);
  return loi;
}

/** Vì sao lượt này không có dấu ấn — để bộ đo tách đúng nguyên nhân */
export type LyDoKhong =
  | 'an-toan'
  | 'tra-cuu'
  | 'planner-khong-chac'
  | 'cau-noi'
  | 'khong-ket-luan'
  | 'lap-lien-truoc';

export interface DauAnLuot {
  tang: TangDauAn;
  /** `yDinh#chỉ số` — để đo phân bố; null khi không có dấu ấn */
  bienThe: string | null;
  cau: string | null;
  lyDo: LyDoKhong | null;
}

export interface DauVaoDauAn {
  chuDe: string;
  yDinh: YDinh;
  mucAnToan: MucAnToan;
  /** `KeHoachTruyVan.chacChan` */
  chacChan: boolean;
  /** `KeHoachTruyVan.phanLoaiBangModel` */
  phanLoaiBangModel?: boolean;
  /** Câu nối tiếp mạch đang nói — cùng cờ `laCauNoi` của `dungVan` */
  laCauNoi: boolean;
  /** Bài model trả có `ketLuan` không rỗng — dấu ấn là cầu nối SAU kết luận */
  coKetLuan: boolean;
  /** Lịch sử hội thoại — chỉ đọc tin trợ lý LIỀN TRƯỚC, xem `daDungOLuotLienTruoc` */
  lichSu?: TinNhan[];
}

/**
 * Tin trợ lý liền trước đã chứa đúng câu này chưa.
 *
 * Cổng chống lặp HẸP, có chủ ý: chỉ chặn ca khó chịu nhất — hai câu hỏi liền
 * nhau, độc lập, cùng khoá `chuDe:yDinh`, đọc lại đúng một câu. Không quét cả
 * lịch sử và không đổi cách chọn: Q3 sau đó vẫn có thể ra lại câu ấy. Chống
 * lặp đầy đủ là bài của cách chọn có đọc lịch sử, không phải của cổng này.
 */
export function daDungOLuotLienTruoc(lichSu: readonly TinNhan[], cau: string): boolean {
  for (let i = lichSu.length - 1; i >= 0; i--) {
    if (lichSu[i].vaiTro === 'tro-ly') return lichSu[i].noiDung.includes(cau);
  }
  return false;
}

/**
 * Điểm vào duy nhất cho `tra-loi.ts`.
 *
 * Bốn cổng ngoài policy theo ý định (chủ dự án chốt 02/10/2026):
 *
 * - `tong-quan:mo-ta` mà planner KHÔNG chắc → không có dấu ấn. Đó là ô mặc
 *   định hút mọi câu planner không hiểu ("hi", câu phân loại sai). Chèn một câu
 *   nghe rất chủ ý vào một phân loại chính planner cũng không tin là sai chỗ.
 *   Nhánh model (`lapKeHoachDayDu`) đặt `chacChan = true` khi model trả lời, mà
 *   "còn lại" của model cũng chính là ô này — nên ô này qua tay model cũng tính
 *   là không chắc. Không bắt riêng chữ "hi": đó là chữa triệu chứng.
 * - Câu nối tiếp → không có dấu ấn. Chọn biến thể không đọc lịch sử, nên hỏi
 *   tiếp cùng mạch là đọc lại đúng câu cũ. Dấu ấn là lớp trình bày; vào mạch rồi
 *   thì liền mạch quan trọng hơn. Muốn có lại ở lượt sau thì phải làm cách chọn
 *   CÓ đọc lịch sử, đừng bỏ cổng này với cách chọn hiện tại.
 * - Không có `ketLuan` → không có dấu ấn. Thiếu kết luận thì câu dẫn thành câu
 *   mở bài, chiếm chỗ câu nghiêng hướng mà `co-khong`/`quyet-dinh` phải đặt
 *   đầu tiên. Áp cho mọi ý định, không riêng hai ý định đó.
 */
export function chonDauAn(vao: DauVaoDauAn): DauAnLuot {
  const khong = (lyDo: LyDoKhong): DauAnLuot => ({ tang: 'KHONG', bienThe: null, cau: null, lyDo });
  if (vao.mucAnToan !== 'NORMAL') return khong('an-toan');
  if (vao.yDinh === 'tra-cuu') return khong('tra-cuu');
  if (vao.chuDe === 'tong-quan' && vao.yDinh === 'mo-ta' && (!vao.chacChan || vao.phanLoaiBangModel)) {
    return khong('planner-khong-chac');
  }
  if (vao.laCauNoi) return khong('cau-noi');
  if (!vao.coKetLuan) return khong('khong-ket-luan');

  const tang = chonTang(vao.yDinh, vao.mucAnToan);
  // KHO_HAI chưa có thư viện nên không tới được đây; tới được thì phải viết nhánh riêng.
  if (tang !== 'DAN_LUAN') return khong('an-toan');
  const ds = THU_VIEN_DAN_LUAN[vao.yDinh];
  const i = stableIndex(khoaBienThe(vao.chuDe, vao.yDinh), ds.length);
  if (vao.lichSu && daDungOLuotLienTruoc(vao.lichSu, ds[i])) return khong('lap-lien-truoc');
  return { tang, bienThe: `${vao.yDinh}#${i}`, cau: ds[i], lyDo: null };
}
