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

export type LoaiThucThe = 'STAR' | 'PALACE' | 'TRANSFORMATION' | 'PERIOD' | 'MARKER' | 'FORMATION';

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

/**
 * Vài cặp sao trùng nhau hoàn toàn sau khi bỏ dấu, nên phải đặt mã tay.
 *
 * "Quan Phù" (vòng Thái Tuế) và "Quan Phủ" (vòng Lộc Tồn) là hai sao khác nhau
 * nhưng đều thành "quan phu". Lấy tên vòng làm phần phân biệt — đó là cấu trúc
 * có thật của tử vi, không phải hậu tố kỹ thuật bịa ra.
 */
const ID_RIENG: Record<string, string> = {
  'Quan Phù': 'STAR.QUAN_PHU_THAI_TUE',
  'Quan Phủ': 'STAR.QUAN_PHU_LOC_TON',
};

function ma(loai: LoaiThucThe, ten: string): string {
  return ID_RIENG[ten] ?? `${loai}.${boDau(ten).replace(/[^a-z0-9]+/g, '_').toUpperCase()}`;
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

/**
 * Cách cục — loại thực thể thứ sáu, thêm cùng lớp `lib/tuvi/cach-cuc.ts`.
 *
 * Vì sao nó đáng nằm trong từ điển: người muốn tra một cách cục LUÔN gõ nguyên
 * tên nó ("Tử Phủ Vũ Tướng Liêm là gì"), và tên ấy là chuỗi đặc trưng nhất có
 * thể có trong cả kho — nó chỉ xuất hiện ở những đoạn sách nói đúng về nó.
 * Nhận ra được thì nhánh từ khoá trỏ thẳng vào đúng đoạn.
 *
 * KHÔNG khai là STAR: `sachCau` ở các bề mặt ngắn loại bỏ câu nhắc STAR không
 * có trong dữ liệu, mà cách cục lại được phép gọi tên. Khai nhầm loại là tự
 * chặn đúng thứ vừa mở.
 *
 * Bí danh viết không dấu vì bảng tra so trên chuỗi đã bỏ dấu.
 */
const CACH_CUC_TT: ThucThe[] = [
  { id: 'FORMATION.TU_PHU_VU_TUONG_LIEM', loai: 'FORMATION', ten: 'Tử Phủ Vũ Tướng Liêm', biDanh: ['tu phu vu tuong', 'bo tu phu'] },
  { id: 'FORMATION.SAT_PHA_THAM', loai: 'FORMATION', ten: 'Sát Phá Tham', biDanh: ['sat pha tham lang', 'bo sat pha tham'] },
  { id: 'FORMATION.CO_NGUYET_DONG_LUONG', loai: 'FORMATION', ten: 'Cơ Nguyệt Đồng Lương', biDanh: ['bo co nguyet dong luong'] },
  { id: 'FORMATION.CU_NHAT', loai: 'FORMATION', ten: 'Cự Nhật', biDanh: ['cu mon thai duong'] },
  { id: 'FORMATION.VO_CHINH_DIEU', loai: 'FORMATION', ten: 'Vô chính diệu', biDanh: ['khong co chinh tinh', 'menh vo chinh dieu'] },
  { id: 'FORMATION.NHAT_NGUYET_TINH_MINH', loai: 'FORMATION', ten: 'Nhật Nguyệt tịnh minh', biDanh: ['nhat nguyet sang'] },
  { id: 'FORMATION.NHAT_NGUYET_HAM', loai: 'FORMATION', ten: 'Nhật Nguyệt hãm', biDanh: ['nhat nguyet ham dia'] },
  { id: 'FORMATION.HINH_TUONG_AN', loai: 'FORMATION', ten: 'Hình Tướng Ấn', biDanh: ['binh hinh tuong an'] },
  { id: 'FORMATION.HINH_TU_GIAP_AN', loai: 'FORMATION', ten: 'Hình Tù giáp Ấn', biDanh: ['hinh tu giap an'] },
  { id: 'FORMATION.KHOI_VIET', loai: 'FORMATION', ten: 'Khôi Việt', biDanh: ['luc quy hoi menh', 'thien khoi thien viet'] },
  { id: 'FORMATION.XUONG_KHUC', loai: 'FORMATION', ten: 'Xương Khúc', biDanh: ['van xuong van khuc'] },
  { id: 'FORMATION.TA_HUU', loai: 'FORMATION', ten: 'Tả Hữu', biDanh: ['ta phu huu bat'] },
  { id: 'FORMATION.SONG_LOC', loai: 'FORMATION', ten: 'Song Lộc', biDanh: ['loc ton hoa loc', 'hai loc'] },
  { id: 'FORMATION.KHOC_HU', loai: 'FORMATION', ten: 'Khốc Hư', biDanh: ['thien khoc thien hu'] },
  { id: 'FORMATION.KHONG_KIEP', loai: 'FORMATION', ten: 'Không Kiếp', biDanh: ['dia khong dia kiep'] },
  { id: 'FORMATION.KINH_DA', loai: 'FORMATION', ten: 'Kình Đà', biDanh: ['kinh duong da la'] },
  { id: 'FORMATION.HOA_LINH', loai: 'FORMATION', ten: 'Hoả Linh', biDanh: ['hoa tinh linh tinh'] },
  { id: 'FORMATION.DAO_HONG', loai: 'FORMATION', ten: 'Đào Hồng', biDanh: ['dao hoa hong loan'] },
  { id: 'FORMATION.LONG_PHUONG', loai: 'FORMATION', ten: 'Long Phượng', biDanh: ['long tri phuong cac'] },
  { id: 'FORMATION.MA_DAU_DOI_KIEM', loai: 'FORMATION', ten: 'Mã đầu đới kiếm', biDanh: ['ma dau doi kiem'] },
  { id: 'FORMATION.TANG_TUE_DIEU', loai: 'FORMATION', ten: 'Tang Tuế Điếu', biDanh: ['tang mon thai tue dieu khach'] },
  { id: 'FORMATION.MA_GAP_TUE_PHA', loai: 'FORMATION', ten: 'Thiên Mã gặp Tuế Phá', biDanh: ['ma gap tue pha'] },
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
  ...CACH_CUC_TT,
];

// Mã trùng nhau sẽ làm hỏng cả bảng tra lẫn lệnh upsert xuống database, mà hỏng
// im lặng: Postgres báo "ON CONFLICT DO UPDATE cannot affect row a second time"
// còn ứng dụng thì chỉ thấy bảng thực thể trống. Nổ ngay lúc nạp module thì rẻ hơn.
{
  const dem = new Map<string, string[]>();
  for (const t of TU_DIEN_THUC_THE) dem.set(t.id, [...(dem.get(t.id) ?? []), t.ten]);
  const trung = [...dem].filter(([, ten]) => ten.length > 1);
  if (trung.length) {
    throw new Error(
      `Từ điển thực thể có mã trùng: ${trung.map(([id, ten]) => `${id} (${ten.join(', ')})`).join('; ')}`
    );
  }
}

/**
 * Những chuỗi trùng với từ tiếng Việt thông thường sau khi bỏ dấu.
 *
 * "Suy" là một giai đoạn vòng Tràng Sinh, nhưng cũng là chữ trong "suy nghĩ".
 * "Tử" là giai đoạn, cũng là "tư duy" sau khi bỏ dấu. Nhận nhầm những chữ này
 * khiến validator chặn oan những câu hoàn toàn đúng — mà validator chặn oan còn
 * tệ hơn là bỏ sót, vì người dùng mất hẳn phần nội dung đó.
 *
 * Nhóm hai âm tiết thêm vào sau, sau khi bắt được tận tay một lần mất khối:
 *   [be-mat-ngan] loại canCho: nhắc sao không có trong dữ liệu — STAR.TUONG_QUAN
 * Câu bị loại viết "tương quan" — một từ hoàn toàn bình thường, trùng "Tướng
 * Quân" sau khi bỏ dấu. Ba chuỗi còn lại cùng dạng: "linh tinh" (lung tung),
 * "thiên tài" / "thiên tai", "phúc phận". Cả bốn xuất hiện trong lời thường
 * dày hơn hẳn so với lúc chúng thật sự là tên sao.
 *
 * Chúng vẫn ở trong từ điển (tra trực tiếp theo tên vẫn ra), chỉ là không được
 * quét tự do trong câu văn.
 */
const KHONG_QUET_TU_DO = new Set([
  'suy', 'tu', 'mo', 'thai', 'benh', 'duong', 'tuyet', 'tuan', 'triet', 'bac si',
  'tuong quan', 'linh tinh', 'thien tai', 'phuc phan',
]);

/** Bảng tra: chuỗi đã bỏ dấu → thực thể. Dựng sẵn để nhận dạng không phải quét mảng. */
const BANG_TRA = new Map<string, ThucThe>();
for (const tt of TU_DIEN_THUC_THE) {
  BANG_TRA.set(boDau(tt.ten), tt);
  for (const b of tt.biDanh) BANG_TRA.set(boDau(b), tt);
}

/**
 * Bảng dùng khi quét câu văn — bỏ các chuỗi dễ nhận nhầm, và tách CÁCH CỤC ra.
 *
 * Cách cục phải quét riêng vì nó CHỒNG LÊN tên sao chứ không thay thế: "Kình
 * Dương Đà La" vừa là cách cục Kình Đà vừa là hai sao. Vòng quét chính ăn cụm
 * dài trước rồi nhảy qua — nên để chung một bảng thì nhận ra cách cục là mất
 * luôn hai sao tạo nên nó. Đo được ngay khi vừa thêm: bộ vàng tụt từ 100% xuống
 * 89,5% ở mục "đủ thực thể", đúng hai câu "Kình Dương Đà La giáp mệnh" và "Địa
 * Không Địa Kiếp gặp nhau".
 */
const BANG_QUET = new Map(
  [...BANG_TRA].filter(([k, t]) => !KHONG_QUET_TU_DO.has(k) && t.loai !== 'FORMATION')
);

const BANG_CACH_CUC = new Map([...BANG_TRA].filter(([, t]) => t.loai === 'FORMATION'));

/** Cụm dài nhất trong bảng quét, để biết cần ghép tối đa mấy từ */
const SO_TU_TOI_DA = Math.max(
  ...[...BANG_QUET.keys(), ...BANG_CACH_CUC.keys()].map((k) => k.split(' ').length)
);

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

  // Lượt một: cách cục. KHÔNG nhảy qua sau khi khớp — cụm ấy vẫn còn là tên sao.
  for (let i = 0; i < tu.length; i++) {
    for (let n = Math.min(SO_TU_TOI_DA, tu.length - i); n >= 1; n--) {
      const cc = BANG_CACH_CUC.get(tu.slice(i, i + n).join(' '));
      if (cc) {
        thay.set(cc.id, cc);
        break;
      }
    }
  }

  // Lượt hai: sao, cung, Tứ Hoá, mốc. Cụm dài trước, và nhảy qua sau khi khớp
  // để "Hóa Kỵ" không bị đọc thành hai từ rời.
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
