import { CHINH_TINH, TEN_CUNG } from '@/lib/tuvi/constants';

/**
 * Từ điển thực thể chuẩn hoá — bước đầu của Query Planner, và là nền của validator.
 *
 * Tử Vi có **từ vựng đóng**: số sao, số cung, số loại hạn đều hữu hạn và đã
 * biết trước. Đây là lợi thế lớn mà embedding không tận dụng được. "Thiên Riêu"
 * và "Thiên Y" gần nhau về vector nhưng là hai thứ khác hẳn; ngược lại "công
 * danh" và "Quan Lộc" xa nhau về mặt chữ mà lại là một.
 *
 * Danh sách sao phải phủ ĐÚNG những gì engine an được — không nhiều hơn, không
 * ít hơn. Thiếu một sao là validator không phát hiện được khi model bịa ra nó.
 * `scripts/test-rag-planner.ts` chạy engine trên nhiều lá số rồi đối chiếu, nên
 * nếu ansao.ts thêm sao mới mà quên cập nhật đây thì kiểm tra sẽ báo.
 *
 * Mã định danh theo dạng `LOAI.TEN_KHONG_DAU` để dùng được cả trong SQL, JSON
 * và khoá metadata mà không lo dấu tiếng Việt.
 */

export type LoaiThucThe = 'STAR' | 'PALACE' | 'TRANSFORMATION' | 'PERIOD' | 'MARKER';

export interface ThucThe {
  id: string;
  loai: LoaiThucThe;
  /** Tên hiển thị chuẩn, có dấu */
  ten: string;
  /** Các cách viết khác mà người dùng có thể gõ */
  biDanh: string[];
}

/** Bỏ dấu tiếng Việt để so khớp — người dùng gõ "hoa ky" phải ra "Hoá Kỵ" */
export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function ma(loai: LoaiThucThe, ten: string): string {
  return `${loai}.${boDau(ten).replace(/[^a-z0-9]+/g, '_').toUpperCase()}`;
}

/**
 * 12 sao vòng Tràng Sinh. Xếp riêng vì chúng là *giai đoạn*, không phải sao an
 * theo can chi, và vì tên chúng trùng với từ thông thường nhiều hơn hẳn.
 */
const VONG_TRANG_SINH_TEN = [
  'Trường Sinh', 'Mộc Dục', 'Quan Đới', 'Lâm Quan', 'Đế Vượng', 'Suy',
  'Bệnh', 'Tử', 'Mộ', 'Tuyệt', 'Thai', 'Dưỡng',
];

const TU_HOA_TEN = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'];

/**
 * Mọi sao engine có thể an, sinh từ `lib/tuvi/ansao.ts`. Trừ chính tinh (lấy từ
 * constants), Tứ Hóa và vòng Tràng Sinh vì ba nhóm đó có loại riêng.
 */
const PHU_TINH_TEN = [
  'Ân Quang', 'Bác Sĩ', 'Bạch Hổ', 'Bát Tọa', 'Bệnh Phù', 'Cô Thần',
  'Đà La', 'Đại Hao', 'Đào Hoa', 'Đẩu Quân', 'Địa Giải', 'Địa Không',
  'Địa Kiếp', 'Địa Võng', 'Điếu Khách', 'Đường Phù', 'Giải Thần', 'Hoa Cái',
  'Hỏa Tinh', 'Hồng Loan', 'Hữu Bật', 'Hỷ Thần', 'Kiếp Sát', 'Kình Dương',
  'Linh Tinh', 'LN Văn Tinh', 'Long Đức', 'Long Trì', 'Lộc Tồn', 'Lực Sĩ',
  'Lưu Hà', 'Nguyệt Đức', 'Phá Toái', 'Phi Liêm', 'Phong Cáo', 'Phục Binh',
  'Phúc Đức', 'Phượng Các', 'Quả Tú', 'Quan Phù', 'Quan Phủ', 'Quốc Ấn',
  'Tả Phù', 'Tam Thai', 'Tang Môn', 'Tấu Thư', 'Thái Tuế', 'Thai Phụ',
  'Thanh Long', 'Thiên Đức', 'Thiên Giải', 'Thiên Hình', 'Thiên Hư', 'Thiên Hỷ',
  'Thiên Khốc', 'Thiên Khôi', 'Thiên Không', 'Thiên La', 'Thiên Mã', 'Thiên Phúc',
  'Thiên Quan', 'Thiên Quý', 'Thiên Riêu', 'Thiên Sứ', 'Thiên Tài', 'Thiên Thọ',
  'Thiên Thương', 'Thiên Trù', 'Thiên Việt', 'Thiên Y', 'Thiếu Âm', 'Thiếu Dương',
  'Tiểu Hao', 'Trực Phù', 'Tuế Phá', 'Tử Phù', 'Tướng Quân', 'Văn Khúc',
  'Văn Xương',
];

/**
 * Bí danh của cung: người dùng gần như không bao giờ gõ tên cung. Họ nói "công
 * việc", "chuyện tiền nong", "vợ chồng". Đây là chỗ khoảng cách giữa lời người
 * dùng và thuật ngữ tài liệu rộng nhất, nên cũng là chỗ từ điển đáng giá nhất.
 */
const BI_DANH_CUNG: Record<string, string[]> = {
  'Mệnh': ['ban than', 'chinh minh', 'tinh cach', 'con nguoi toi'],
  'Huynh Đệ': ['anh em', 'anh chi em'],
  'Phu Thê': ['vo chong', 'ban doi', 'hon nhan', 'tinh duyen', 'nguoi yeu'],
  'Tử Tức': ['con cai', 'con cua toi'],
  'Tài Bạch': ['tien bac', 'tai chinh', 'tien nong', 'thu nhap'],
  'Tật Ách': ['suc khoe', 'benh tat', 'the trang'],
  'Thiên Di': ['di chuyen', 'xuat ngoai', 'nuoc ngoai', 'moi truong ben ngoai'],
  'Nô Bộc': ['ban be', 'dong nghiep', 'quan he xa hoi'],
  'Quan Lộc': ['cong viec', 'su nghiep', 'cong danh', 'nghe nghiep', 'thang tien', 'cung quan'],
  'Điền Trạch': ['nha cua', 'dat dai', 'bat dong san'],
  'Phúc Đức': ['phuc phan', 'an vui', 'noi tam'],
  'Phụ Mẫu': ['cha me', 'bo me'],
};

const HAN_TT: ThucThe[] = [
  { id: 'PERIOD.BAN_MENH', loai: 'PERIOD', ten: 'Bản mệnh', biDanh: ['la so goc'] },
  { id: 'PERIOD.DAI_VAN', loai: 'PERIOD', ten: 'Đại vận', biDanh: ['dai han', 'giai doan muoi nam'] },
  { id: 'PERIOD.LUU_NIEN', loai: 'PERIOD', ten: 'Lưu niên', biDanh: ['tieu han', 'nam dang xem', 'nam nay', 'nam toi', 'nam sau'] },
  { id: 'PERIOD.NGUYET_HAN', loai: 'PERIOD', ten: 'Nguyệt hạn', biDanh: ['han thang', 'thang nay', 'thang toi'] },
];

const MARKER_KHAC: ThucThe[] = [
  { id: 'MARKER.TUAN', loai: 'MARKER', ten: 'Tuần', biDanh: ['tuan khong'] },
  { id: 'MARKER.TRIET', loai: 'MARKER', ten: 'Triệt', biDanh: ['triet lo'] },
];

function muc(loai: LoaiThucThe, ten: string, biDanh: string[] = []): ThucThe {
  return { id: ma(loai, ten), loai, ten, biDanh };
}

/** Toàn bộ từ điển, dựng một lần khi nạp module */
export const TU_DIEN_THUC_THE: ThucThe[] = [
  ...CHINH_TINH.map((s) => muc('STAR', s)),
  ...PHU_TINH_TEN.map((s) => muc('STAR', s)),
  ...TU_HOA_TEN.map((s) => muc('TRANSFORMATION', s)),
  ...VONG_TRANG_SINH_TEN.map((s) => muc('MARKER', s)),
  ...MARKER_KHAC,
  ...TEN_CUNG.map((c) => muc('PALACE', c, BI_DANH_CUNG[c] ?? [])),
  ...HAN_TT,
];

/**
 * Những chuỗi một âm tiết trùng với từ tiếng Việt thông thường.
 *
 * "Suy" là một giai đoạn vòng Tràng Sinh, nhưng cũng là chữ trong "suy nghĩ".
 * "Tử" là giai đoạn, cũng là "tư duy" sau khi bỏ dấu. Nhận nhầm những chữ này
 * khiến validator chặn oan những câu hoàn toàn đúng — mà validator chặn oan còn
 * tệ hơn là bỏ sót, vì người dùng mất hẳn phần nội dung đó.
 *
 * Chúng vẫn ở trong từ điển (tra trực tiếp theo tên vẫn ra), chỉ là không được
 * quét tự do trong câu văn.
 */
const KHONG_QUET_TU_DO = new Set([
  'suy', 'tu', 'mo', 'thai', 'benh', 'duong', 'tuyet', 'tuan', 'triet', 'bac si',
]);

/** Bảng tra: chuỗi đã bỏ dấu → thực thể. Dựng sẵn để nhận dạng không phải quét mảng. */
const BANG_TRA = new Map<string, ThucThe>();
for (const tt of TU_DIEN_THUC_THE) {
  BANG_TRA.set(boDau(tt.ten), tt);
  for (const b of tt.biDanh) BANG_TRA.set(boDau(b), tt);
}

/** Bảng dùng khi quét câu văn — bỏ các chuỗi dễ nhận nhầm */
const BANG_QUET = new Map([...BANG_TRA].filter(([k]) => !KHONG_QUET_TU_DO.has(k)));

/** Cụm dài nhất trong bảng quét, để biết cần ghép tối đa mấy từ */
const SO_TU_TOI_DA = Math.max(...[...BANG_QUET.keys()].map((k) => k.split(' ').length));

/** Tra đúng một tên/bí danh. Không giới hạn như quét câu — gọi thẳng thì là cố ý. */
export function traThucThe(chuoi: string): ThucThe | undefined {
  return BANG_TRA.get(boDau(chuoi));
}

/**
 * Nhận dạng thực thể trong một câu.
 *
 * Quét theo cụm dài trước để "Hóa Kỵ" không bị đọc thành hai từ rời, và để
 * "Quan Lộc" thắng "Lộc Tồn" khi cả hai cùng chạm chữ "lộc".
 */
export function nhanDangThucThe(cau: string): ThucThe[] {
  const tu = boDau(cau).split(/[^a-z0-9]+/).filter(Boolean);
  const thay = new Map<string, ThucThe>();

  for (let i = 0; i < tu.length; i++) {
    for (let n = Math.min(SO_TU_TOI_DA, tu.length - i); n >= 1; n--) {
      const tt = BANG_QUET.get(tu.slice(i, i + n).join(' '));
      if (tt) {
        thay.set(tt.id, tt);
        i += n - 1;
        break;
      }
    }
  }

  return [...thay.values()];
}

/** Mọi tên sao engine có thể an — dùng để kiểm tra từ điển không bị lạc hậu */
export const TEN_SAO_TRONG_TU_DIEN = new Set(
  TU_DIEN_THUC_THE.filter((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION' || t.loai === 'MARKER').map(
    (t) => t.ten
  )
);
