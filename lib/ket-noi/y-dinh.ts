/**
 * Ý định so sánh — lớp còn thiếu giữa "chọn hai người" và "chạy phân tích".
 *
 * Trước đây hai lá số vào là ra một bài nhận định, bất kể người dùng đang muốn
 * biết gì. Nhưng cùng một cặp A/B, câu hỏi "có nên yêu nhau" và câu hỏi "có nên
 * mở công ty chung" cần đọc những cung khác nhau, tìm những quy tắc khác nhau,
 * và trả về những mục khác nhau. Không hỏi mục đích thì hệ thống chỉ có một câu
 * trả lời cho mọi nhu cầu.
 *
 * Cấu hình ở đây quyết định ba thứ phía sau: cung nào được đọc, truy vấn RAG
 * tìm gì, và bài kết quả có những mục nào. Đổi bảng này là đổi kết quả, nên nó
 * có số phiên bản.
 */

export const PHIEN_BAN_Y_DINH = '2026.09.1';

export type YDinhKetNoi = 'tinh-cam' | 'lam-an' | 'ban-be' | 'gia-dinh' | 'khac';

export interface CauHinhYDinh {
  id: YDinhKetNoi;
  nhan: string;
  moTa: string;
  /** Nút bấm nói giá trị nhận được, không nói thao tác */
  nutBam: string;
  goiYCauHoi: string;
  /** Cung của CẢ HAI người cần đưa vào bối cảnh */
  cung: string[];
  /** Các mục bắt buộc có trong kết quả, theo đúng thứ tự hiển thị */
  muc: { id: string; tieuDe: string; huong: string }[];
}

export const CAU_HINH_Y_DINH: Record<YDinhKetNoi, CauHinhYDinh> = {
  'tinh-cam': {
    id: 'tinh-cam',
    nhan: 'Tình cảm',
    moTa: 'Tìm hiểu, yêu đương, gắn bó lâu dài.',
    nutBam: 'Xem kết nối tình cảm',
    goiYCauHoi: 'Ví dụ: Hai người có phù hợp để tiến xa hơn không?',
    cung: ['Mệnh', 'Phu Thê', 'Phúc Đức', 'Thiên Di'],
    muc: [
      {
        id: 'hut-nhau',
        tieuDe: 'Điều kéo hai người lại gần',
        huong: 'Điểm bổ trợ nhau, chỗ dễ tạo cảm giác đồng điệu, cách mỗi người phản ứng với người kia.',
      },
      {
        id: 'cach-the-hien',
        tieuDe: 'Cách hai người thể hiện tình cảm',
        huong: 'Nhu cầu gần gũi, cách cho và nhận sự quan tâm, khác biệt trong biểu đạt.',
      },
      {
        id: 'va-cham',
        tieuDe: 'Điểm dễ hiểu lầm hoặc va chạm',
        huong: 'Pattern dễ lặp, thứ hay châm ngòi, cách khác biệt biến thành mâu thuẫn.',
      },
      {
        id: 'lau-dai',
        tieuDe: 'Khả năng đồng hành lâu dài',
        huong: 'Yếu tố nâng đỡ và yếu tố cần cố gắng. Không kết luận chắc chắn về chuyện cưới xin.',
      },
      {
        id: 'can-de-tot-hon',
        tieuDe: 'Điều mối quan hệ cần để vận hành tốt hơn',
        huong: 'Hai đến bốn điều đáng cân nhắc, viết như gợi ý chứ không phải mệnh lệnh.',
      },
    ],
  },

  'lam-an': {
    id: 'lam-an',
    nhan: 'Làm ăn & hợp tác',
    moTa: 'Cùng kinh doanh, làm dự án hoặc xây một thứ chung.',
    nutBam: 'Xem cách hai người hợp tác',
    goiYCauHoi: 'Ví dụ: Chúng tôi có phù hợp để cùng kinh doanh lâu dài không?',
    cung: ['Mệnh', 'Quan Lộc', 'Tài Bạch', 'Nô Bộc', 'Thiên Di'],
    muc: [
      {
        id: 'cach-lam-viec',
        tieuDe: 'Cách hai người làm việc cùng nhau',
        huong: 'Nhịp độ, cách tổ chức, xu hướng chủ động hay phản ứng, độ linh hoạt.',
      },
      {
        id: 'ra-quyet-dinh',
        tieuDe: 'Cách ra quyết định',
        huong: 'Tốc độ, mức chấp nhận rủi ro, thiên về lý lẽ hay trực giác, chỗ dễ kẹt.',
      },
      {
        id: 'nguon-luc',
        tieuDe: 'Tiền bạc và nguồn lực',
        huong: 'Cách ưu tiên nguồn lực và chỗ dễ bất đồng. Tuyệt đối không thành khuyến nghị đầu tư.',
      },
      {
        id: 'vai-tro',
        tieuDe: 'Phân chia vai trò',
        huong: 'Vai trò mỗi người dễ phát huy — dẫn dắt, triển khai, đối ngoại, phân tích. Nói như khả năng, không như định mệnh.',
      },
      {
        id: 'xung-dot',
        tieuDe: 'Điểm dễ phát sinh xung đột',
        huong: 'Chỗ hai cách vận hành chạm nhau, và điều kiện khiến nó thành vấn đề thật.',
      },
      {
        id: 'thoa-thuan',
        tieuDe: 'Điều cần thống nhất trước khi làm chung',
        huong: 'Quyền quyết định, tài chính, vai trò, cách xử bất đồng, kỳ vọng.',
      },
    ],
  },

  'ban-be': {
    id: 'ban-be',
    nhan: 'Bạn bè & đồng nghiệp',
    moTa: 'Cách giao tiếp, phối hợp và xử lý khác biệt.',
    nutBam: 'Xem cách hai người tương tác',
    goiYCauHoi: 'Ví dụ: Vì sao hai người thường bất đồng khi làm việc cùng nhau?',
    cung: ['Mệnh', 'Nô Bộc', 'Thiên Di', 'Phúc Đức'],
    muc: [
      { id: 'giao-tiep', tieuDe: 'Cách hai người giao tiếp', huong: 'Nhịp nói chuyện, mức thẳng thắn, điều dễ bị hiểu khác đi.' },
      { id: 'phoi-hop', tieuDe: 'Cách phối hợp', huong: 'Ai thường khởi xướng, ai thường giữ nhịp, chỗ ăn ý.' },
      { id: 'kho-chiu', tieuDe: 'Điểm dễ gây khó chịu', huong: 'Thói quen của bên này dễ chạm vào điều bên kia coi trọng.' },
      { id: 'bo-tro', tieuDe: 'Hai người bổ trợ nhau ở đâu', huong: 'Chỗ khác biệt trở thành lợi thế thay vì trở ngại.' },
      { id: 'ranh-gioi', tieuDe: 'Điều nên rõ ràng để quan hệ bền', huong: 'Kỳ vọng nào nên nói thành lời thay vì ngầm hiểu.' },
    ],
  },

  'gia-dinh': {
    id: 'gia-dinh',
    nhan: 'Gia đình',
    moTa: 'Hiểu cách hai người ảnh hưởng và phản ứng với nhau.',
    nutBam: 'Hiểu mối quan hệ này',
    goiYCauHoi: 'Ví dụ: Điều gì khiến hai người khó hiểu nhau?',
    cung: ['Mệnh', 'Phúc Đức', 'Phụ Mẫu', 'Huynh Đệ', 'Điền Trạch'],
    muc: [
      { id: 'phan-ung', tieuDe: 'Cách hai người phản ứng với nhau', huong: 'Nhịp cảm xúc, điều gì làm mỗi bên khép lại hoặc mở ra.' },
      { id: 'ky-vong', tieuDe: 'Kỳ vọng dễ không nói thành lời', huong: 'Điều mỗi bên mặc định bên kia phải hiểu.' },
      { id: 'va-cham', tieuDe: 'Pattern dễ va chạm', huong: 'Vòng lặp quen thuộc và chỗ nó bắt đầu.' },
      { id: 'ho-tro', tieuDe: 'Cách hai người hỗ trợ nhau', huong: 'Chỗ mỗi bên thật sự là điểm tựa cho bên kia.' },
      { id: 'ranh-gioi', tieuDe: 'Khoảng cách có lợi', huong: 'Ranh giới nào giúp quan hệ nhẹ đi thay vì xa đi.' },
      { id: 'cai-thien', tieuDe: 'Gợi ý cải thiện tương tác', huong: 'Hai đến ba điều cụ thể có thể thử.' },
    ],
  },

  'khac': {
    id: 'khac',
    nhan: 'Một điều khác',
    moTa: 'Nói cho Celes điều bạn thực sự muốn hiểu.',
    nutBam: 'Cùng Celes nhìn kỹ hơn',
    goiYCauHoi: 'Bạn muốn hiểu điều gì về hai người này?',
    // Không đoán trước cung nào: planner sẽ suy từ chính câu hỏi. Đây chỉ là nền
    // tối thiểu để bài không rỗng khi câu hỏi quá mơ hồ.
    cung: ['Mệnh', 'Phúc Đức', 'Thiên Di'],
    muc: [
      { id: 'ket-noi', tieuDe: 'Hai người gặp nhau ở đâu', huong: 'Điểm chung hoặc chỗ bổ trợ rõ nhất.' },
      { id: 'giao-tiep', tieuDe: 'Cách hai người hiểu nhau', huong: 'Nhịp trao đổi và chỗ dễ lệch.' },
      { id: 'va-cham', tieuDe: 'Điểm dễ lệch nhau', huong: 'Khác biệt nào dễ thành khó chịu.' },
      { id: 'ho-tro', tieuDe: 'Chỗ hai người nâng đỡ nhau', huong: 'Điều mỗi bên mang lại cho bên kia.' },
      { id: 'boi-canh', tieuDe: 'Điều đáng lưu ý', huong: 'Bối cảnh cần biết trước khi kết luận gì.' },
    ],
  },
};

export const DANH_SACH_Y_DINH = Object.values(CAU_HINH_Y_DINH);

export const Y_DINH_MAC_DINH: YDinhKetNoi = 'tinh-cam';

export function laYDinhHopLe(x: unknown): x is YDinhKetNoi {
  return typeof x === 'string' && x in CAU_HINH_Y_DINH;
}
