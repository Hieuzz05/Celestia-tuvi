/**
 * Danh mục chủ đề bài đọc dài và kiểu tin nhắn hội thoại.
 *
 * Tệp này từng chứa bốn system prompt và hàm `moTaLaSo` — thứ đổ nguyên 12 cung
 * với toàn bộ sao vào prompt rồi xin một bài markdown. Chính nó là gốc của "nêu
 * sao dài dòng mà không đi sâu ý nghĩa": model nhận cả bảng tra thì kể lại từng
 * sao. Bốn prompt đó cũng nói bốn giọng khác nhau về cùng một thứ, đúng điều
 * framework §16 cấm.
 *
 * Mọi bề mặt có AI giờ đi qua `lib/rag/*` — chọn dữ kiện theo chủ đề, truy hồi
 * nguồn, trả cấu trúc, kiểm bằng luật — và dùng chung `CHUAN_NGON_NGU_CELES`.
 * Phần cũ đã xoá hẳn thay vì để lại: mã chết là chỗ dễ bị gọi lại nhất khi ai đó
 * cần "một cách nhanh".
 */

/*
 * Nhãn chủ đề đặt theo câu hỏi người dùng thật sự mang tới, không theo tên cung.
 * Phần moTa giữ ngôn ngữ chuyên môn vì nó đi vào prompt và câu truy vấn kho tri
 * thức — đó là ngôn ngữ cho máy, người dùng không nhìn thấy.
 *
 * `cung` là cung engine sẽ chọn dữ kiện (xem lib/rag/boi-canh-la-so.ts). 'Thân'
 * không phải tên cung trong TEN_CUNG nên bộ chọn bỏ qua; giữ lại để nói rõ ý
 * "Thân cư đâu" là một phần của chủ đề tổng quan.
 */
export const CHU_DE = {
  'tong-quan': {
    nhan: 'Tôi là ai?',
    moTa: 'Tính cách, năng lực nổi trội, thế mạnh và điểm cần lưu ý của cả đời',
    cung: ['Mệnh', 'Thân', 'Phúc Đức', 'Thiên Di'],
  },
  'su-nghiep': {
    nhan: 'Công việc & hướng phát triển',
    moTa: 'Hướng nghề phù hợp, cách thăng tiến, môi trường làm việc hợp mệnh',
    cung: ['Quan Lộc', 'Mệnh', 'Thiên Di', 'Nô Bộc'],
  },
  'tai-chinh': {
    nhan: 'Tiền bạc & cách bạn tạo sự ổn định',
    moTa: 'Cách kiếm tiền, giữ tiền, rủi ro tài chính, tài sản - nhà đất',
    cung: ['Tài Bạch', 'Điền Trạch', 'Phúc Đức', 'Mệnh'],
  },
  'tinh-duyen': {
    nhan: 'Tình cảm & chuyện đôi lứa',
    moTa: 'Đặc điểm người bạn đời, chất lượng hôn nhân, giai đoạn nên lưu ý',
    cung: ['Phu Thê', 'Mệnh', 'Phúc Đức', 'Tử Tức'],
  },
  'suc-khoe': {
    nhan: 'Sức khoẻ & nhịp sống',
    moTa: 'Thể trạng bẩm sinh, bộ phận cần chú ý, thói quen nên giữ',
    cung: ['Tật Ách', 'Mệnh', 'Phúc Đức'],
  },
  'gia-dao': {
    nhan: 'Gia đình & những người quanh bạn',
    moTa: 'Quan hệ với cha mẹ, anh em, con cái và phúc phần gia đình',
    cung: ['Phụ Mẫu', 'Huynh Đệ', 'Tử Tức', 'Phúc Đức'],
  },
  'van-han': {
    nhan: 'Năm nay có gì đáng chú ý?',
    moTa: 'Đại vận, tiểu hạn, nguyệt hạn của năm đang xem',
    cung: [],
  },
} as const;

export type ChuDeId = keyof typeof CHU_DE;

/** Một lượt trong hội thoại Hỏi Celes */
export interface TinNhan {
  vaiTro: 'nguoi-dung' | 'tro-ly';
  noiDung: string;
}
