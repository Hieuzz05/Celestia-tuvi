import type { GoiBangChung, TraLoiCoCauTruc } from './bang-chung';
import { nhanDangThucThe } from './thuc-the';

/**
 * Validator tất định — chạy trước, và với phần lớn lỗi là chạy thay cho LLM thứ hai.
 *
 * Tử Vi có từ vựng đóng, nên ba loại lỗi nguy hiểm nhất đều bắt được bằng luật:
 *
 *   1. Bịa mã: model trích F009 trong khi gói chỉ có tới F007.
 *   2. Bịa sao: model nói "Thiên Riêu tại Quan Lộc" mà dữ kiện không hề có.
 *   3. Khẳng định chuyên môn không nguồn: nói một quy tắc tử vi mà không gắn
 *      mã nào — tức là lấy từ trí nhớ model, đúng thứ spec cấm.
 *
 * Gọi một model thứ hai để kiểm ba thứ này vừa chậm vừa đắt vừa kém tin cậy hơn
 * so sánh chuỗi.
 */

export const PHIEN_BAN_VALIDATOR = '2026.09.1';

export type MucDo = 'chan' | 'canh-bao';

export interface LoiKiemDuyet {
  ma: string;
  mucDo: MucDo;
  moTa: string;
  /** Tiêu đề ý chính chứa lỗi, nếu lỗi thuộc về một ý cụ thể */
  tai?: string;
}

export interface KetQuaKiemDuyet {
  dat: boolean;
  loi: LoiKiemDuyet[];
  /** Tỉ lệ ý chính có ít nhất một mã nguồn — chỉ số evidence coverage của spec */
  phuSong: number;
  phienBan: string;
}

/**
 * Câu có phải khẳng định chuyên môn tử vi không?
 *
 * Dùng chính từ điển thực thể: một câu nhắc tới tên sao, tên cung hay Tứ Hóa thì
 * đang nói về học thuyết, chứ không phải đang động viên chung chung. Chỉ những
 * câu như vậy mới bị bắt buộc có nguồn — nếu bắt mọi câu thì lời khuyên đời
 * thường cũng bị chặn, và đó không phải điều spec yêu cầu.
 */
function laKhangDinhChuyenMon(cau: string): boolean {
  return nhanDangThucThe(cau).some((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION');
}

export function kiemDuyet(traLoi: TraLoiCoCauTruc, goi: GoiBangChung): KetQuaKiemDuyet {
  const loi: LoiKiemDuyet[] = [];

  const maDuKien = new Set(goi.duKien.map((f) => f.id));
  const maNguon = new Set(goi.bangChung.map((e) => e.id));

  // Tên sao/cung được phép nhắc tới: lấy từ chính dữ kiện lá số và nội dung các
  // đoạn nguồn. Ngoài hai chỗ đó thì model đang tự nghĩ ra.
  const chuoiChoPhep = [
    ...goi.duKien.map((f) => f.noiDung),
    ...goi.bangChung.map((e) => e.noiDung),
  ].join(' ');
  const thucTheChoPhep = new Set(nhanDangThucThe(chuoiChoPhep).map((t) => t.id));

  let soYCoNguon = 0;

  for (const y of traLoi.yChinh) {
    const nhan = y.tieuDe || y.noiDung.slice(0, 40);

    for (const m of y.maDuKien) {
      if (!maDuKien.has(m)) {
        loi.push({
          ma: 'du-kien-khong-ton-tai',
          mucDo: 'chan',
          moTa: `Trích dữ kiện ${m} nhưng lá số không có mã này.`,
          tai: nhan,
        });
      }
    }

    for (const m of y.maNguon) {
      if (!maNguon.has(m)) {
        loi.push({
          ma: 'nguon-khong-ton-tai',
          mucDo: 'chan',
          moTa: `Trích nguồn ${m} nhưng gói bằng chứng không có mã này.`,
          tai: nhan,
        });
      }
    }

    // Sao/Tứ Hóa xuất hiện trong lời mà không có ở đâu trong đầu vào
    for (const tt of nhanDangThucThe(y.noiDung)) {
      if (tt.loai !== 'STAR' && tt.loai !== 'TRANSFORMATION') continue;
      if (!thucTheChoPhep.has(tt.id)) {
        loi.push({
          ma: 'sao-khong-co-trong-du-lieu',
          mucDo: 'chan',
          moTa: `Nhắc tới ${tt.ten} nhưng sao này không có trong dữ kiện lá số lẫn nguồn tham chiếu.`,
          tai: nhan,
        });
      }
    }

    const coCanCu = y.maDuKien.length > 0 || y.maNguon.length > 0;
    if (y.maNguon.length > 0) soYCoNguon += 1;

    if (!coCanCu) {
      // Mức độ phụ thuộc vào ý đó nói gì. Spec cấm trình bày claim chuyên môn
      // không căn cứ như thể nó có căn cứ — nhưng một lời khuyên đời thường
      // không nhắc sao nào thì không phải claim chuyên môn, và chặn nó chỉ làm
      // câu trả lời cụt đi chứ không an toàn hơn.
      loi.push(
        laKhangDinhChuyenMon(y.noiDung)
          ? {
              ma: 'khang-dinh-chuyen-mon-khong-can-cu',
              mucDo: 'chan',
              moTa: 'Nói về sao/Tứ Hóa nhưng không gắn với dữ kiện lá số hay nguồn nào.',
              tai: nhan,
            }
          : {
              ma: 'khong-can-cu',
              mucDo: 'canh-bao',
              moTa: 'Ý này không gắn mã nào, nhưng cũng không khẳng định điều gì về tử vi.',
              tai: nhan,
            }
      );
    } else if (laKhangDinhChuyenMon(y.noiDung) && y.maNguon.length === 0) {
      // Có dữ kiện lá số nhưng không có nguồn: model đang tự diễn giải học thuyết
      // từ trí nhớ. Chưa đến mức chặn (dữ kiện vẫn thật), nhưng phải ghi lại — đây
      // chính là con số "unsupported chuyên môn" mà spec đặt ngưỡng dưới 2%.
      loi.push({
        ma: 'dien-giai-khong-nguon',
        mucDo: 'canh-bao',
        moTa: 'Khẳng định chuyên môn dựa trên dữ kiện lá số nhưng không có nguồn tài liệu nào chống lưng.',
        tai: nhan,
      });
    }
  }

  if (traLoi.yChinh.length === 0) {
    loi.push({ ma: 'khong-co-y-nao', mucDo: 'chan', moTa: 'Câu trả lời không có ý chính nào.' });
  }

  return {
    dat: !loi.some((l) => l.mucDo === 'chan'),
    loi,
    phuSong: traLoi.yChinh.length ? soYCoNguon / traLoi.yChinh.length : 0,
    phienBan: PHIEN_BAN_VALIDATOR,
  };
}

/**
 * Bỏ những ý không qua được kiểm duyệt, giữ lại phần còn lại.
 *
 * Chặn cả câu trả lời vì một ý sai là phản ứng quá tay: người dùng mất luôn ba
 * ý đúng. Nên bỏ đúng ý hỏng.
 *
 * Nhưng nếu BỎ HẾT thì giữ nguyên bài và báo không đạt. Lúc đó nguyên nhân gần
 * như chắc chắn nằm ở phía ta — model không hiểu khuôn JSON, hoặc gói bằng chứng
 * rỗng nên chẳng có mã nào để trích — chứ không phải model bịa đặt có hệ thống.
 * Trả về một câu trả lời rỗng trong tình huống đó là tự làm hỏng sản phẩm để
 * chống một mối nguy chưa xảy ra. Bài vẫn ra, `dat: false` vào nhật ký, và tỉ lệ
 * đó nhìn được ở trang quản trị — hỏng thì thấy, chứ không im lặng.
 */
export function locYHong(
  traLoi: TraLoiCoCauTruc,
  ketQua: KetQuaKiemDuyet
): { traLoi: TraLoiCoCauTruc; soYBiBo: number } {
  const nhanHong = new Set(
    ketQua.loi.filter((l) => l.mucDo === 'chan' && l.tai).map((l) => l.tai!)
  );
  if (nhanHong.size === 0) return { traLoi, soYBiBo: 0 };

  const giu = traLoi.yChinh.filter((y) => !nhanHong.has(y.tieuDe || y.noiDung.slice(0, 40)));
  if (giu.length === 0) return { traLoi, soYBiBo: 0 };

  return { traLoi: { ...traLoi, yChinh: giu }, soYBiBo: traLoi.yChinh.length - giu.length };
}
