/**
 * Bộ vàng cho kho tri thức — dùng để ĐO, không phải để minh hoạ.
 *
 * Khác bộ vàng của planner ở một điểm quyết định: mọi câu ở đây đều có **đáp án
 * nằm sẵn trong kho, dưới dạng chuỗi kiểm chứng được**. Nhờ vậy câu hỏi "AI có
 * dùng kho không" trả lời được bằng phép so chuỗi, không phải bằng cảm nhận.
 *
 * Cách chọn câu, theo đúng thứ tự ưu tiên:
 *
 *  1. **Tri thức phải ĐẶC THÙ.** "Sao Tử Vi là đế tinh" thì model nào cũng nói
 *     được, nên nó không phân biệt được có kho hay không. "Cự Cơ đồng cung ở
 *     cung Bào thì có anh chị em dị bào, thường cùng mẹ khác cha" thì phải có
 *     sách mới nói đúng. Chỉ loại thứ hai mới đo được cái gì.
 *  2. **Đáp án phải kiểm được bằng chuỗi**, không cần người đọc phán xét.
 *  3. **Câu hỏi viết như người Việt hỏi thật**, không phải như một truy vấn.
 *
 * `tuKhoaNguon` là bằng chứng TRUY HỒI đúng: ít nhất một đoạn lấy về phải chứa
 * một trong các chuỗi đó.
 *
 * `tuKhoaTraLoi` là bằng chứng ĐÃ DÙNG: chi tiết đặc thù phải xuất hiện trong
 * bài trả lời. Để trống khi chi tiết đó quá dễ diễn đạt bằng nhiều cách khác
 * nhau — thà không đo còn hơn đo sai.
 */

export interface CauVangRag {
  cauHoi: string;
  /** Ít nhất MỘT chuỗi phải có trong một đoạn được truy hồi */
  tuKhoaNguon: string[];
  /** Chi tiết đặc thù nên xuất hiện trong bài trả lời nếu kho được dùng thật */
  tuKhoaTraLoi?: string[];
  /** Vì sao câu này đo được điều gì */
  vi: string;
  the: string[];
}

export const BO_VANG_RAG: CauVangRag[] = [
  {
    cauHoi: 'Cự Môn và Thiên Cơ cùng đóng ở cung Huynh Đệ thì nói lên điều gì về anh chị em?',
    tuKhoaNguon: ['dị bào'],
    tuKhoaTraLoi: ['dị bào'],
    vi: 'Chi tiết "anh chị em dị bào, cùng mẹ khác cha" là tri thức sách, không phải suy luận chung',
    the: ['cach-cuc', 'gia-dao'],
  },
  {
    cauHoi: 'Mệnh không có chính tinh thì đọc thế nào?',
    tuKhoaNguon: ['vô chính diệu', 'VÔ CHÍNH DIỆU'],
    tuKhoaTraLoi: ['vô chính diệu'],
    vi: 'Mệnh vô chính diệu có luật đọc riêng, kèm đặc lệ tam Không tứ Không',
    the: ['cach-cuc', 'menh'],
  },
  {
    cauHoi: 'Thiên La Địa Võng nằm ở cung nào?',
    tuKhoaNguon: ['Thiên la ở thìn', 'thiên la địa võng', 'Thiên La Địa Võng'],
    tuKhoaTraLoi: ['Thìn', 'Tuất'],
    vi: 'Vị trí cố định, sai là sai hẳn — chỗ tốt để bắt model nói theo trí nhớ',
    the: ['an-sao', 'exact-term'],
  },
  {
    cauHoi: 'Linh Xương Đà Vũ là cách gì, có đáng lo không?',
    tuKhoaNguon: ['LINH XƯƠNG ĐÀ VŨ', 'LINH XƯƠNG LA VŨ', 'Linh Xương Đà Vũ'],
    vi: 'Một cách cục có tên riêng; model không có sách thường bịa nghĩa từ tên sao',
    the: ['cach-cuc'],
  },
  {
    cauHoi: 'Thiên Mã gặp Tuần Triệt ở cung Phu Thê thì sao?',
    tuKhoaNguon: ['Thiên Mã gặp Tuần'],
    vi: 'Tổ hợp ba yếu tố, nghĩa đã được sách chốt — khó suy ra từ nghĩa từng sao',
    the: ['cach-cuc', 'tinh-duyen'],
  },
  {
    cauHoi: 'Sao Vũ Khúc sáng nhất ở những cung nào?',
    tuKhoaNguon: ['VŨ KHÚC', 'Vũ Khúc'],
    tuKhoaTraLoi: ['Thìn', 'Tuất', 'Sửu', 'Mùi'],
    vi: 'Bảng độ sáng là dữ kiện tra cứu, model hay nhớ lẫn giữa các sao',
    the: ['do-sang', 'exact-term'],
  },
  {
    cauHoi: 'Cách Minh Lộc Ám Lộc nghĩa là gì?',
    tuKhoaNguon: ['Minh lộc Ám lộc', 'Minh Lộc Ám Lộc'],
    tuKhoaTraLoi: ['Lộc Tồn'],
    vi: 'Định nghĩa dựa vào vị trí nhị hợp của Hóa Lộc và Lộc Tồn, rất dễ nói sai',
    the: ['cach-cuc', 'tai-loc'],
  },
  {
    cauHoi: 'Lộc Tồn và Thiên Mã cùng ở cung Thiên Di thì thế nào?',
    tuKhoaNguon: ['Lộc Mã', 'Lộc Tồn, Thiên Mã'],
    vi: 'Có câu phú riêng cho tổ hợp này',
    the: ['cach-cuc', 'tai-loc'],
  },
  {
    cauHoi: 'Phá Quân đóng ở cung Phu Thê thì hôn nhân ra sao?',
    tuKhoaNguon: ['PHÁ QUÂN', 'Phá Quân'],
    vi: 'Câu hỏi người dùng thật hay hỏi; đo xem kho có đỡ được câu thường gặp không',
    the: ['tinh-duyen'],
  },
  {
    cauHoi: 'Thái Dương hãm địa gặp Hóa Kỵ thì đọc ra sao?',
    tuKhoaNguon: ['Thái dương', 'Thái Dương', 'THÁI DƯƠNG'],
    vi: 'Tổ hợp sao và tứ hoá, nằm trong phần ý nghĩa từng sao của nhiều cuốn',
    the: ['tu-hoa'],
  },

  // ---------- Đối chứng âm: kho KHÔNG có câu trả lời ----------
  {
    cauHoi: 'Cách nấu phở bò Hà Nội cho ngon là gì?',
    tuKhoaNguon: [],
    vi: 'Ngoài phạm vi hoàn toàn. Hệ thống phải không bịa ra nguồn, và phải nói thẳng là không thuộc phạm vi',
    the: ['doi-chung-am'],
  },
  {
    cauHoi: 'Tử Vi nói gì về việc đầu tư Bitcoin năm nay?',
    tuKhoaNguon: [],
    vi: 'Đề tài hiện đại, sách cổ không có. Bẫy điển hình để model bịa cho có',
    the: ['doi-chung-am'],
  },
];

/** Câu dùng cho phép so có kho và không kho — chọn câu mà tri thức sách là quyết định */
export const CAU_SO_SANH = [
  'Cự Môn và Thiên Cơ cùng đóng ở cung Huynh Đệ thì nói lên điều gì về anh chị em?',
  'Thiên La Địa Võng nằm ở cung nào?',
  'Linh Xương Đà Vũ là cách gì, có đáng lo không?',
];
