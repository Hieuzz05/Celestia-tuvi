import type { ChuDe, LopHan } from './planner';

/**
 * Bộ câu hỏi vàng — chuẩn để đo, không phải để minh hoạ.
 *
 * Spec mục 14: không đổi retrieval/prompt/model nếu không có bài kiểm tra hồi
 * quy. Bộ này là bài kiểm tra đó ở tầng planner, tầng duy nhất hiện đo được
 * (kho tri thức còn trống nên chưa đo được recall của truy hồi).
 *
 * Câu hỏi lấy theo cách người Việt thật sự hỏi: viết tắt, thiếu dấu, lẫn lộn
 * chủ đề, hỏi cụt. Bộ toàn câu hỏi sạch sẽ thì luôn đạt 100% và chẳng nói lên
 * điều gì.
 *
 * Quy ước trường:
 *   - `chuDe`: chủ đề planner phải kết luận.
 *   - `cungBatBuoc`: những cung PHẢI có mặt. Không liệt kê hết — chỉ cung mà
 *     thiếu nó thì câu trả lời chắc chắn hỏng.
 *   - `thucTheBatBuoc`: mã thực thể phải nhận ra được từ câu chữ.
 *   - `lopHanBatBuoc`: lớp hạn phải xét tới.
 */

export interface CauVang {
  cauHoi: string;
  chuDe: ChuDe;
  cungBatBuoc: string[];
  thucTheBatBuoc?: string[];
  lopHanBatBuoc?: LopHan[];
  the: string[];
}

export const BO_VANG_PLANNER: CauVang[] = [
  // ---------- Sự nghiệp ----------
  { cauHoi: 'Năm nay tôi có nên đổi việc không?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc'], lopHanBatBuoc: ['luu-nien'], the: ['career', 'annual'] },
  { cauHoi: 'Công việc của tôi sắp tới thế nào?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc'], the: ['career'] },
  { cauHoi: 'Tôi hợp làm nghề gì?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc', 'Mệnh'], the: ['career'] },
  { cauHoi: 'Tôi có nên nghỉ việc để khởi nghiệp không?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc'], the: ['career'] },
  { cauHoi: 'Năm nay tôi có được thăng chức không?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc'], lopHanBatBuoc: ['luu-nien'], the: ['career', 'annual'] },
  { cauHoi: 'quan he voi sep cua toi the nao', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc'], the: ['career', 'khong-dau'] },
  { cauHoi: 'Đại vận này sự nghiệp tôi ra sao?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc'], thucTheBatBuoc: ['PERIOD.DAI_VAN'], lopHanBatBuoc: ['dai-van'], the: ['career', 'period'] },
  { cauHoi: 'Cung Quan Lộc của tôi có gì đáng chú ý?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc'], thucTheBatBuoc: ['PALACE.QUAN_LOC'], the: ['career', 'exact-term'] },
  { cauHoi: 'Hóa Kỵ ở cung quan lộc thì đọc thế nào?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc'], thucTheBatBuoc: ['TRANSFORMATION.HOA_KY', 'PALACE.QUAN_LOC'], the: ['career', 'exact-term'] },
  { cauHoi: 'Tôi nên đi làm thuê hay tự kinh doanh?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc', 'Mệnh'], the: ['career'] },
  { cauHoi: 'Đợt này tôi phỏng vấn có thuận không?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc'], the: ['career'] },
  { cauHoi: 'Thi cử năm nay của tôi ra sao?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc'], lopHanBatBuoc: ['luu-nien'], the: ['career', 'annual'] },

  // ---------- Tài chính ----------
  { cauHoi: 'Năm nay tài chính của tôi thế nào?', chuDe: 'tai-chinh', cungBatBuoc: ['Tài Bạch'], lopHanBatBuoc: ['luu-nien'], the: ['finance', 'annual'] },
  { cauHoi: 'Tôi có nên đầu tư chứng khoán lúc này không?', chuDe: 'tai-chinh', cungBatBuoc: ['Tài Bạch'], the: ['finance'] },
  { cauHoi: 'Bao giờ tôi mới khá lên về tiền bạc?', chuDe: 'tai-chinh', cungBatBuoc: ['Tài Bạch'], the: ['finance'] },
  { cauHoi: 'Tôi có nên vay tiền mua nhà không?', chuDe: 'tai-chinh', cungBatBuoc: ['Tài Bạch', 'Điền Trạch'], the: ['finance', 'property'] },
  { cauHoi: 'toi co the tiet kiem duoc tien khong', chuDe: 'tai-chinh', cungBatBuoc: ['Tài Bạch'], the: ['finance', 'khong-dau'] },
  { cauHoi: 'Cung Tài Bạch của tôi có sao gì?', chuDe: 'tai-chinh', cungBatBuoc: ['Tài Bạch'], thucTheBatBuoc: ['PALACE.TAI_BACH'], the: ['finance', 'exact-term'] },
  { cauHoi: 'Làm ăn buôn bán năm nay có thuận không?', chuDe: 'tai-chinh', cungBatBuoc: ['Tài Bạch'], lopHanBatBuoc: ['luu-nien'], the: ['finance', 'annual'] },
  { cauHoi: 'Tôi có tài sản đất đai không?', chuDe: 'tai-chinh', cungBatBuoc: ['Điền Trạch'], the: ['finance', 'property'] },
  { cauHoi: 'Thu nhập của tôi có tăng trong đại vận này không?', chuDe: 'tai-chinh', cungBatBuoc: ['Tài Bạch'], thucTheBatBuoc: ['PERIOD.DAI_VAN'], lopHanBatBuoc: ['dai-van'], the: ['finance', 'period'] },

  // ---------- Tình cảm ----------
  { cauHoi: 'Chuyện tình cảm của tôi năm nay ra sao?', chuDe: 'tinh-cam', cungBatBuoc: ['Phu Thê'], lopHanBatBuoc: ['luu-nien'], the: ['love', 'annual'] },
  { cauHoi: 'Bao giờ tôi lấy chồng?', chuDe: 'tinh-cam', cungBatBuoc: ['Phu Thê'], the: ['love'] },
  { cauHoi: 'Bao giờ tôi lấy vợ?', chuDe: 'tinh-cam', cungBatBuoc: ['Phu Thê'], the: ['love'] },
  { cauHoi: 'Tôi và người yêu có hợp nhau không?', chuDe: 'tinh-cam', cungBatBuoc: ['Phu Thê'], the: ['love'] },
  { cauHoi: 'Hôn nhân của tôi có bền không?', chuDe: 'tinh-cam', cungBatBuoc: ['Phu Thê'], the: ['love'] },
  { cauHoi: 'Vì sao tôi vẫn độc thân?', chuDe: 'tinh-cam', cungBatBuoc: ['Phu Thê', 'Mệnh'], the: ['love'] },
  { cauHoi: 'toi co nen chia tay khong', chuDe: 'tinh-cam', cungBatBuoc: ['Phu Thê'], the: ['love', 'khong-dau'] },
  { cauHoi: 'Cung Phu Thê của tôi thế nào?', chuDe: 'tinh-cam', cungBatBuoc: ['Phu Thê'], thucTheBatBuoc: ['PALACE.PHU_THE'], the: ['love', 'exact-term'] },
  { cauHoi: 'Người bạn đời của tôi là người thế nào?', chuDe: 'tinh-cam', cungBatBuoc: ['Phu Thê'], the: ['love'] },
  { cauHoi: 'Tháng này chuyện tình duyên có gì mới không?', chuDe: 'tinh-cam', cungBatBuoc: ['Phu Thê'], lopHanBatBuoc: ['nguyet-han'], the: ['love', 'monthly'] },

  // ---------- Gia đạo ----------
  { cauHoi: 'Quan hệ của tôi với cha mẹ thế nào?', chuDe: 'gia-dao', cungBatBuoc: ['Phụ Mẫu'], the: ['family'] },
  { cauHoi: 'Tôi có mấy anh chị em và quan hệ ra sao?', chuDe: 'gia-dao', cungBatBuoc: ['Huynh Đệ'], the: ['family'] },
  { cauHoi: 'Đường con cái của tôi thế nào?', chuDe: 'gia-dao', cungBatBuoc: ['Phụ Mẫu', 'Huynh Đệ'], the: ['family'] },
  { cauHoi: 'Gia đình tôi năm nay có biến động gì không?', chuDe: 'gia-dao', cungBatBuoc: ['Phụ Mẫu'], lopHanBatBuoc: ['luu-nien'], the: ['family', 'annual'] },
  { cauHoi: 'toi co hop o gan bo me khong', chuDe: 'gia-dao', cungBatBuoc: ['Phụ Mẫu'], the: ['family', 'khong-dau'] },
  { cauHoi: 'Bao giờ tôi nên sinh con?', chuDe: 'gia-dao', cungBatBuoc: ['Phụ Mẫu'], the: ['family'] },

  // ---------- Sức khoẻ ----------
  { cauHoi: 'Sức khỏe của tôi có gì đáng lo không?', chuDe: 'suc-khoe', cungBatBuoc: ['Tật Ách'], the: ['health'] },
  { cauHoi: 'Năm nay tôi có hay ốm không?', chuDe: 'suc-khoe', cungBatBuoc: ['Tật Ách'], lopHanBatBuoc: ['luu-nien'], the: ['health', 'annual'] },
  { cauHoi: 'Tôi hay mất ngủ, lá số nói gì?', chuDe: 'suc-khoe', cungBatBuoc: ['Tật Ách'], the: ['health'] },
  { cauHoi: 'Tinh thần tôi dạo này mệt mỏi, có liên quan gì không?', chuDe: 'suc-khoe', cungBatBuoc: ['Tật Ách', 'Phúc Đức'], the: ['health'] },
  { cauHoi: 'Cung Tật Ách của tôi có gì?', chuDe: 'suc-khoe', cungBatBuoc: ['Tật Ách'], thucTheBatBuoc: ['PALACE.TAT_ACH'], the: ['health', 'exact-term'] },
  { cauHoi: 'Tháng này tôi có nên đi khám không?', chuDe: 'suc-khoe', cungBatBuoc: ['Tật Ách'], lopHanBatBuoc: ['nguyet-han'], the: ['health', 'monthly'] },

  // ---------- Tổng quan / không tín hiệu ----------
  { cauHoi: 'Bạn thấy lá số tôi thế nào?', chuDe: 'tong-quan', cungBatBuoc: ['Mệnh'], the: ['general'] },
  { cauHoi: 'Tôi là người như thế nào?', chuDe: 'tong-quan', cungBatBuoc: ['Mệnh'], the: ['general'] },
  { cauHoi: 'Có điều gì tôi nên biết không?', chuDe: 'tong-quan', cungBatBuoc: ['Mệnh'], the: ['general'] },
  { cauHoi: 'Cho tôi lời khuyên.', chuDe: 'tong-quan', cungBatBuoc: ['Mệnh'], the: ['general'] },
  { cauHoi: 'Đại vận hiện tại của tôi nói lên điều gì?', chuDe: 'tong-quan', cungBatBuoc: ['Mệnh'], thucTheBatBuoc: ['PERIOD.DAI_VAN'], lopHanBatBuoc: ['dai-van'], the: ['general', 'period'] },
  { cauHoi: 'Cung Mệnh của tôi có sao gì?', chuDe: 'tong-quan', cungBatBuoc: ['Mệnh'], thucTheBatBuoc: ['PALACE.MENH'], the: ['general', 'exact-term'] },
  { cauHoi: 'Phúc đức của tôi ra sao?', chuDe: 'tong-quan', cungBatBuoc: ['Phúc Đức'], thucTheBatBuoc: ['PALACE.PHUC_DUC'], the: ['general', 'exact-term'] },
  { cauHoi: 'Tôi có hợp đi nước ngoài không?', chuDe: 'tong-quan', cungBatBuoc: ['Thiên Di'], thucTheBatBuoc: ['PALACE.THIEN_DI'], the: ['general', 'exact-term'] },

  // ---------- Thuật ngữ chuyên môn ----------
  { cauHoi: 'Tử Vi thủ mệnh thì tính cách thế nào?', chuDe: 'tong-quan', cungBatBuoc: ['Mệnh'], thucTheBatBuoc: ['STAR.TU_VI', 'PALACE.MENH'], the: ['exact-term'] },
  { cauHoi: 'Thiên Cơ ở Quan Lộc có ý nghĩa gì?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc'], thucTheBatBuoc: ['STAR.THIEN_CO', 'PALACE.QUAN_LOC'], the: ['career', 'exact-term'] },
  { cauHoi: 'Hóa Lộc và Hóa Quyền cùng cung thì sao?', chuDe: 'tong-quan', cungBatBuoc: ['Mệnh'], thucTheBatBuoc: ['TRANSFORMATION.HOA_LOC', 'TRANSFORMATION.HOA_QUYEN'], the: ['exact-term'] },
  { cauHoi: 'Kình Dương Đà La giáp mệnh là cách gì?', chuDe: 'tong-quan', cungBatBuoc: ['Mệnh'], thucTheBatBuoc: ['STAR.KINH_DUONG', 'STAR.DA_LA'], the: ['exact-term'] },
  { cauHoi: 'Thiên Riêu ở cung Phu Thê nói lên điều gì?', chuDe: 'tinh-cam', cungBatBuoc: ['Phu Thê'], thucTheBatBuoc: ['STAR.THIEN_RIEU', 'PALACE.PHU_THE'], the: ['love', 'exact-term'] },
  { cauHoi: 'Tuần Triệt đóng ở Mệnh thì hoá giải thế nào?', chuDe: 'tong-quan', cungBatBuoc: ['Mệnh'], thucTheBatBuoc: ['PALACE.MENH'], the: ['exact-term'] },
  { cauHoi: 'Lộc Tồn ở Tài Bạch có tốt không?', chuDe: 'tai-chinh', cungBatBuoc: ['Tài Bạch'], thucTheBatBuoc: ['STAR.LOC_TON', 'PALACE.TAI_BACH'], the: ['finance', 'exact-term'] },
  { cauHoi: 'Địa Không Địa Kiếp gặp nhau thì sao?', chuDe: 'tong-quan', cungBatBuoc: ['Mệnh'], thucTheBatBuoc: ['STAR.DIA_KHONG', 'STAR.DIA_KIEP'], the: ['exact-term'] },

  // ---------- Câu ghép nhiều chủ đề ----------
  { cauHoi: 'Đổi việc có giúp tôi kiếm thêm tiền không?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc', 'Tài Bạch'], the: ['career', 'finance', 'mixed'] },
  { cauHoi: 'Công việc bận quá có ảnh hưởng tới hôn nhân không?', chuDe: 'su-nghiep', cungBatBuoc: ['Quan Lộc'], the: ['career', 'love', 'mixed'] },
  { cauHoi: 'Sức khỏe kém có làm hỏng chuyện làm ăn không?', chuDe: 'suc-khoe', cungBatBuoc: ['Tật Ách'], the: ['health', 'finance', 'mixed'] },
];
