import { lapKeHoach } from '@/lib/rag/planner';
import { nhanDangThucThe, type ThucThe } from '@/lib/rag/thuc-the';
import { CAU_HINH_Y_DINH, PHIEN_BAN_Y_DINH, type YDinhKetNoi } from './y-dinh';

/**
 * Query Planner cho Kết nối.
 *
 * Khác planner một người ở chỗ chủ đề không phải đoán — người dùng đã chọn ý
 * định rồi. Việc còn lại là: lấy cung theo ý định, cộng thêm cung mà câu hỏi tự
 * do chỉ ra, rồi viết truy vấn nói đúng thuật ngữ tài liệu quan hệ.
 *
 * Với ý định "một điều khác" thì ngược lại: không có cấu hình cung nào đáng tin,
 * nên câu hỏi trở thành nguồn duy nhất và planner một người làm phần suy chủ đề.
 */

export const PHIEN_BAN_KE_HOACH_KET_NOI = '2026.09.2';

export interface KeHoachKetNoi {
  yDinh: YDinhKetNoi;
  cung: string[];
  thucThe: ThucThe[];
  truyVan: string;
  truyVanTuKhoa: string;
  /** Tên cung và tên sao phải tìm nguyên cụm — xem lib/rag/cum-tu-khoa.ts */
  cumTuKhoa: string[];
  /** Mục bắt buộc trong kết quả, lấy từ cấu hình ý định */
  muc: { id: string; tieuDe: string; huong: string }[];
  phienBan: string;
}

/** Từ khoá chủ đề quan hệ, để truy vấn chạm được tài liệu nói về đôi lứa/hợp tác */
const TU_KHOA_CHU_DE: Record<YDinhKetNoi, string> = {
  'tinh-cam': 'hôn nhân tình duyên vợ chồng phối ngẫu',
  'lam-an': 'hợp tác làm ăn tài lộc sự nghiệp đối tác',
  'ban-be': 'bạn bè nô bộc giao tiếp đồng nghiệp',
  'gia-dinh': 'gia đạo phụ mẫu huynh đệ điền trạch',
  'khac': 'quan hệ giữa hai người',
};

export interface DauVaoKeHoach {
  yDinh: YDinhKetNoi;
  cauHoi?: string;
  /** Chính tinh + Tứ Hóa tại từng cung của mỗi người */
  saoA: Record<string, string[]>;
  saoB: Record<string, string[]>;
  tenA: string;
  tenB: string;
}

export function lapKeHoachKetNoi(vao: DauVaoKeHoach): KeHoachKetNoi {
  const cauHinh = CAU_HINH_Y_DINH[vao.yDinh];
  const cauHoi = vao.cauHoi?.trim() ?? '';

  // Cung từ câu hỏi: người dùng gọi đích danh cung nào thì cung đó phải có mặt,
  // kể cả khi ý định không liệt kê nó.
  const thucTheCauHoi = cauHoi ? nhanDangThucThe(cauHoi) : [];
  const cungGoiTen = thucTheCauHoi.filter((t) => t.loai === 'PALACE').map((t) => t.ten);

  // "Một điều khác" thì cấu hình không nói được gì — mượn planner một người để
  // suy chủ đề từ chính câu hỏi.
  const cungSuyRa =
    vao.yDinh === 'khac' && cauHoi ? lapKeHoach({ cauHoi }).cungLienQuan : [];

  const cung = [...new Set([...cungGoiTen, ...cauHinh.cung, ...cungSuyRa])];

  const saoTrenCung = (sao: Record<string, string[]>, ten: string) => {
    const net = cung
      .map((c) => (sao[c]?.length ? `${c}: ${sao[c].join(' ')}` : null))
      .filter(Boolean);
    return net.length ? `Lá số ${ten} — ${net.join('; ')}.` : '';
  };

  const phan = [
    cauHoi || `Hai người hợp nhau và lệch nhau ở đâu khi xét ${cauHinh.nhan.toLowerCase()}?`,
    `Chủ đề: ${TU_KHOA_CHU_DE[vao.yDinh]}.`,
    `Cung cần đọc: ${cung.join(', ')}.`,
    saoTrenCung(vao.saoA, vao.tenA),
    saoTrenCung(vao.saoB, vao.tenB),
  ].filter(Boolean);

  const thucThe = [...thucTheCauHoi];

  return {
    yDinh: vao.yDinh,
    cung,
    thucThe,
    truyVan: phan.join(' '),
    // Nhánh từ khoá chỉ nhận thuật ngữ: tên cung và từ khoá chủ đề. Ném cả câu
    // vào đó thì từ nối lấn át tên cung — xem ghi chú ở lib/rag/truy-hoi.ts.
    truyVanTuKhoa: [...cung, TU_KHOA_CHU_DE[vao.yDinh], ...thucThe.map((t) => t.ten)].join(' '),
    cumTuKhoa: [...cung, ...thucThe.map((t) => t.ten)],
    muc: cauHinh.muc,
    phienBan: `${PHIEN_BAN_KE_HOACH_KET_NOI}/${PHIEN_BAN_Y_DINH}`,
  };
}
