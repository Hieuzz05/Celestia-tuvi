import { nhanDangCachCuc } from '@/lib/tuvi/cach-cuc';
import { luanHan, type CapLuanHan } from '@/lib/tuvi/luan-han';
import type { LaSo } from '@/lib/tuvi/ansao';
import type { ChuDe, LopHan } from './planner';

/**
 * NGHIÊNG VỀ ĐÂU — câu trả lời thẳng cho câu hỏi quyết định, do LUẬT tính.
 *
 * Vì sao phải có lớp này. Người hỏi "năm 2026 có chuyển việc không" đang cần
 * một câu trả lời, và bài cũ trả về "có thể có, cũng có thể gặp cản trở, nếu…
 * thì…". Đó không phải thận trọng, đó là né. Người đọc đóng tab với đúng lượng
 * thông tin họ có lúc mở.
 *
 * Nhưng gốc của việc né không nằm ở model. Nó nằm ở hai dòng luật viết từ
 * trước: `CHUAN_NGON_NGU_CELES` ghi "Không trả lời có/không", và khối
 * 'quyet-dinh' của prompt ghi "KHÔNG phán có hay không". Model làm đúng thứ nó
 * được bảo.
 *
 * Hai dòng ấy nhắm vào một thứ có thật và vẫn phải chặn: HỨA MỘT SỰ VIỆC.
 * "Bạn sẽ chuyển việc vào tháng 5" là thứ không ai kiểm được và không ai chịu
 * trách nhiệm. Nhưng chúng chặn quá tay sang cả việc NGHIÊNG VỀ MỘT BÊN, mà
 * nghiêng về một bên mới đúng là việc của người luận giải.
 *
 * Nên tách hẳn hai thứ:
 *   - Nghiêng về một bên, có căn cứ, nói rõ mức chắc  →  BẮT BUỘC phải làm.
 *   - Hứa một sự việc sẽ xảy ra                        →  vẫn cấm, `PHAN_QUYET` giữ nguyên.
 *
 * Và cái nghiêng ấy KHÔNG để model tự chọn. Engine đếm được: tương quan cát/hung
 * ở đúng cung của chủ đề đang hỏi, trong đúng lớp hạn đang hỏi, sau khi đã trừ
 * ảnh hưởng Tuần/Triệt. Cùng một lá số hỏi hai lần phải ra cùng một hướng —
 * để model chọn là mở đường cho hai lần đọc ra hai kết luận trái nhau.
 */

export const PHIEN_BAN_NGHIENG = '2026.09.1';

export type HuongNghieng = 'thuan-ro' | 'thuan-nhe' | 'can-bang' | 'can-nhe' | 'can-ro';

export interface NghiengVe {
  huong: HuongNghieng;
  /** Nhãn ngắn model phải dùng nguyên văn trong câu kết luận */
  nhan: string;
  /** Lớp hạn đã dùng để đếm */
  cap: CapLuanHan;
  /** Cung đọc ra chủ đề này */
  cung: string;
  /** Quãng đang xét có đi qua cung đó không */
  cham: boolean;
  soThuan: number;
  soCan: number;
  /** Các nét đang đỡ — câu đã viết sẵn bởi lớp luật */
  thuan: string[];
  /** Các nét đang cản */
  can: string[];
  /** Khoảng tuổi của đại vận, để câu trả lời có mốc số */
  khoangTuoi?: string;
  /**
   * Tên cách cục của cung đang hỏi.
   *
   * Đi kèm ngay đây chứ không để model tự đi tìm ở khối dữ kiện. Đo được: khi
   * khối này chỉ có con số, tỉ lệ bài nêu được tên cách cục tụt từ 100% xuống
   * 60% — model bám vào thứ gần nhất và cụ thể nhất, và nó viết xong bài mà
   * không cần đi đâu khác.
   */
  cachCuc: string[];
}

/**
 * Chủ đề của planner → lĩnh vực của luận hạn.
 *
 * Hai bảng này sinh ra độc lập nên tên không trùng nhau. Viết tay chứ không
 * đoán: 'tong-quan' cố ý trả null vì nó không ứng vào một cung nào, và lúc đó
 * phải đếm trên nhịp tổng chứ không đếm trên một lĩnh vực.
 */
const LINH_VUC_THEO_CHU_DE: Record<ChuDe, string | null> = {
  'su-nghiep': 'cong-viec',
  'tai-chinh': 'tai-chinh',
  'tinh-cam': 'tinh-cam',
  'gia-dao': 'gia-dinh',
  'suc-khoe': 'suc-khoe',
  'tong-quan': null,
};

/**
 * Lớp hạn nào được dùng để đếm.
 *
 * Lấy lớp CỤ THỂ NHẤT mà câu hỏi chạm tới. Hỏi "năm 2026" thì đếm trên năm;
 * hỏi "tháng này" thì đếm trên tháng. Hỏi chung chung, không mốc nào, thì
 * 'ban-menh' không đếm được gì về thời gian nên rơi về đại vận — quãng người
 * ta đang đứng.
 */
function capTu(lopHan: LopHan[]): CapLuanHan {
  if (lopHan.includes('nguyet-han')) return 'thang';
  if (lopHan.includes('luu-nien')) return 'nam';
  return 'giai-doan';
}

/**
 * Nhãn cho từng hướng.
 *
 * Viết ở ngôi của người luận, không ở ngôi mệnh lệnh: "nghiêng về giữ" chứ
 * không "bạn nên giữ". Nghiêng là một nhận định về quãng; nên là một chỉ thị
 * cho người.
 */
const NHAN: Record<HuongNghieng, string> = {
  'thuan-ro': 'nghiêng rõ về phía đẩy tới',
  'thuan-nhe': 'nghiêng nhẹ về phía đẩy tới',
  'can-bang': 'hai lực ngang nhau',
  'can-nhe': 'nghiêng nhẹ về phía giữ nguyên',
  'can-ro': 'nghiêng rõ về phía giữ nguyên',
};

function huongTu(soThuan: number, soCan: number): HuongNghieng {
  const lech = soThuan - soCan;
  if (lech >= 2) return 'thuan-ro';
  if (lech >= 1) return 'thuan-nhe';
  if (lech === 0) return 'can-bang';
  if (lech >= -1) return 'can-nhe';
  return 'can-ro';
}

/**
 * Tính hướng nghiêng cho một câu hỏi quyết định.
 *
 * Trả null khi không đếm được — engine hỏng, hoặc chủ đề không ứng vào cung
 * nào và nhịp tổng cũng không dựng được. Lớp gọi phải chạy bình thường khi
 * null: thiếu nó thì bài trở lại như trước, chứ không được trắng.
 */
export function tinhNghiengVe(vao: {
  laSo: LaSo;
  chuDe: ChuDe;
  lopHan: LopHan[];
  namXem: number;
  thangXem: number;
}): NghiengVe | null {
  try {
    const cap = capTu(vao.lopHan);
    const bai = luanHan(vao.laSo, cap, vao.namXem, vao.thangXem, 'vi');

    const idLinhVuc = LINH_VUC_THEO_CHU_DE[vao.chuDe];
    const lv = idLinhVuc ? bai.linhVuc.find((x) => x.id === idLinhVuc) : undefined;

    /*
     * Chủ đề không ứng vào cung nào ('tong-quan'), hoặc cung ấy không có trên
     * lá số: đếm trên TOÀN BỘ các lĩnh vực thay vì bỏ cuộc. Tổng của sáu lĩnh
     * vực vẫn là một tương quan cát/hung có thật, chỉ rộng hơn.
     */
    const thuan = lv ? lv.thuan : bai.linhVuc.flatMap((x) => x.thuan);
    const can = lv ? lv.can : bai.linhVuc.flatMap((x) => x.can);
    if (thuan.length === 0 && can.length === 0) return null;

    const huong = huongTu(thuan.length, can.length);

    return {
      huong,
      nhan: NHAN[huong],
      cap,
      cung: lv?.cung ?? '',
      cham: lv?.cham ?? false,
      soThuan: thuan.length,
      soCan: can.length,
      // Bốn nét mỗi bên là đủ để model có chất liệu; nhiều hơn thì nó quay ra
      // liệt kê thay vì luận.
      thuan: thuan.slice(0, 4),
      can: can.slice(0, 4),
      khoangTuoi: khoangTuoiDaiVan(bai.subline),
      // Đọc từ chính cung của chủ đề đang hỏi, không đọc từ Mệnh: câu hỏi về
      // công việc thì cách cục ở Quan Lộc mới là thứ nói đúng chuyện.
      cachCuc: nhanDangCachCuc(vao.laSo, lv?.cung)
        .filter((c) => c.loai !== 'han')
        .map((c) => c.ten)
        .slice(0, 4),
    };
  } catch {
    return null;
  }
}

/**
 * Bóc khoảng tuổi ra khỏi dòng phụ đề của bài luận hạn.
 *
 * Dùng lại chuỗi engine đã dựng thay vì tự tính lại: hai chỗ cùng tính một thứ
 * là hai chỗ sẽ lệch nhau sau vài lần sửa. Không thấy thì bỏ qua — mốc tuổi là
 * thứ làm câu trả lời sắc hơn, không phải thứ nó cần để đúng.
 */
function khoangTuoiDaiVan(subline: string): string | undefined {
  return subline.match(/\d{1,2}\s*[–—-]\s*\d{1,2}\s*tuổi/)?.[0];
}

/** Khối chèn vào prompt. Rỗng khi không tính được hướng. */
export function khoiNghiengVe(n: NghiengVe | null): string {
  if (!n) return '';

  const nhanCap =
    n.cap === 'thang' ? 'tháng đang xét' : n.cap === 'nam' ? 'năm đang xét' : 'quãng đại vận đang đi qua';

  return `

HƯỚNG NGHIÊNG — ĐÃ ĐẾM XONG, KHÔNG ĐƯỢC ĐẢO:
Lớp đang xét: ${nhanCap}${n.khoangTuoi ? ` (${n.khoangTuoi})` : ''}.
Tương quan tại phần đang hỏi: ${n.soThuan} yếu tố đỡ / ${n.soCan} yếu tố cản.
Quãng này ${n.cham ? 'CÓ' : 'KHÔNG'} đi qua cung của phần đang hỏi.
KẾT LUẬN CỦA ENGINE: ${n.nhan}

Đang đỡ:
${n.thuan.length ? n.thuan.map((t) => `- ${t}`).join('\n') : '- (không có)'}
Đang cản:
${n.can.length ? n.can.map((t) => `- ${t}`).join('\n') : '- (không có)'}

CÁCH CỤC của phần đang hỏi: ${n.cachCuc.length ? n.cachCuc.join(', ') : '(không có)'}
Con số nói MỨC ĐỘ nghiêng. Cách cục nói VÌ SAO LÀ NGƯỜI NÀY. Câu kết luận hoặc ý đầu tiên phải nêu tên ít nhất một cách cục ở trên rồi dịch nó ngay — thiếu nó thì bài này dùng được cho bất kỳ ai có cùng tương quan số.

Con số và hướng trên do engine đếm từ lá số, không phải bạn đoán. Viết câu kết luận BÁM VÀO hướng đó. Không được viết ngược lại, không được làm mờ nó thành "có thể thế này cũng có thể thế kia".

Nhãn hướng viết sẵn bằng lời thường để bạn đặt thẳng vào câu. Giữ nguyên chữ thường, đừng viết hoa — nó là một mệnh đề trong câu của bạn, không phải một cái nhãn dán vào bài.`;
}
