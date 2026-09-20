import { boDau } from './thuc-the';

/**
 * CHỮ TRỪU TƯỢNG — những chữ đúng ngữ pháp mà người đọc không hình dung ra gì.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO CÓ BẢNG NÀY
 *
 * Bản đọc sâu đã dịch tên sao sang hành vi. Nhưng đo trên một bài 11.767 từ
 * thì thứ dịch ra là hành vi TRỪU TƯỢNG: "năng lực tổ chức", "quyền tự quyết",
 * "khả năng biến nguồn lực rời rạc thành một hệ thống có người chịu trách
 * nhiệm". Đó không phải hành vi, đó là một danh từ khác. Đếm được trong một
 * bài: "nền" 42 lần, "năng lực" 27, "nhịp" 24, "cấu trúc" 15.
 *
 * Những chữ này nguy ở chỗ chúng nghe rất chuyên nghiệp. Câu nào có chúng cũng
 * đọc như đã nói điều gì đó, nên cả người viết lẫn người kiểm đều không thấy
 * chỗ hụt. Người đọc thì gật đầu rồi quên, vì không có gì để nhớ.
 *
 * ---------------------------------------------------------------------------
 * MỖI CHỮ CẤM PHẢI ĐI KÈM MỘT CHỮ THAY
 *
 * Cấm không thôi thì model sẽ tìm một chữ trừu tượng khác ngoài bảng — nó bỏ
 * "năng lực" và viết "tố chất", bảng dài thêm một dòng mà bài không khá hơn.
 * Chữ thay nói cho nó biết phải đi về HƯỚNG nào: về phía việc làm được, người
 * gặp được, lúc xảy ra.
 *
 * Bảng này KHÔNG dùng để sửa tự động. Thay "năng lực" bằng "làm được gì" trong
 * một câu đã viết xong thì câu hỏng ngữ pháp. Nó là luật cho lúc viết, và là
 * phép đếm cho lúc kiểm.
 */
/*
 * KHÔNG CÓ "xu hướng" và "khuynh hướng" TRONG BẢNG NÀY, và đó là cố ý.
 *
 * Bản đầu có. Bộ kiểm hợp đồng bắt ngay một mâu thuẫn ngay trong cùng một
 * prompt: chuẩn ngôn ngữ KÊ ĐƠN đúng chữ ấy ("Bạn luôn…" đổi thành "Bạn có xu
 * hướng…"), và câu miễn trừ của chính sản phẩm mở bằng "Đây là xu hướng của
 * giai đoạn". Cấm nó là bảo model vừa phải dùng vừa không được dùng.
 *
 * Xét lại thì chữ ấy không thuộc về đây. Bảng này bắt những chữ người đọc
 * KHÔNG HÌNH DUNG RA GÌ. "Xu hướng" thì ai cũng hiểu, và nó làm đúng một việc
 * sản phẩm này cần: nói rằng đây là nghiêng về, không phải chắc chắn.
 */
export const CHU_TRUU_TUONG: readonly (readonly [string, string])[] = [
  ['năng lực', 'làm được việc gì'],
  ['nguồn lực', 'tiền, người và thời gian'],
  ['cấu trúc', 'cách mọi thứ được xếp'],
  ['nền tảng', 'chỗ dựa sẵn có'],
  ['hệ thống', 'một cách làm cố định'],
  ['cơ chế', 'chuyện đó xảy ra thế nào'],
  ['vận hành', 'làm việc'],
  ['tiềm năng', 'có thể làm được'],
  ['tối ưu', 'gọn nhất, đỡ tốn nhất'],
  ['trật tự', 'thứ tự rõ ràng'],
  ['tự chủ', 'tự lo được cho mình'],
  ['quyền tự quyết', 'được tự quyết'],
  ['tích lũy', 'dồn dần, để dành'],
  ['định hình', 'thành hình'],
  ['bứt phá', 'vọt lên'],
  ['đồng hành', 'đi cùng'],
  ['kết nối', 'quen biết, nối được với nhau'],
  ['tương tác', 'qua lại với nhau'],
  ['duy trì', 'giữ'],
  ['thể hiện', 'lộ ra'],
  ['biểu hiện', 'hiện ra'],
  ['tác động', 'làm cho'],
  ['bản chất', 'thật ra'],
  ['giá trị cốt lõi', 'điều bạn coi trọng nhất'],
  ['phạm vi', 'tới đâu'],
  ['khía cạnh', 'mặt'],
  ['yếu tố', 'điều gì'],
  ['tối đa hóa', 'làm nhiều nhất có thể'],
];

const BANG = CHU_TRUU_TUONG.map(([chu]) => boDau(chu));

/** Những chữ trừu tượng có trong đoạn, kèm số lần — để nói được sai ở đâu */
export function demChuTruuTuong(van: string): [string, number][] {
  const s = boDau(van);
  const ra: [string, number][] = [];
  for (const [i, chu] of BANG.entries()) {
    const d = s.split(chu).length - 1;
    if (d) ra.push([CHU_TRUU_TUONG[i][0], d]);
  }
  return ra.sort((a, b) => b[1] - a[1]);
}

/**
 * Khối chữ đưa vào prompt.
 *
 * Ở đây dán CẢ BẢNG, khác với `KHOI_CAU_CANH` chỉ nêu ví dụ. Lý do khác nhau:
 * bảng câu cảnh mà dán đủ thì model rải đúng mấy chữ ấy cho qua cửa, tức là
 * dạy nó gian lận phép đo. Bảng này thì ngược — nó là danh sách CẤM, và model
 * phải biết đủ mới tránh được đủ. Biết trước danh sách cấm không giúp gian
 * lận: tránh hết bảng chính là điều cần đạt.
 */
export const KHOI_CHU_TRUU_TUONG = `CẤM những chữ sau, vì người đọc không hình dung ra gì. Cột sau là hướng phải đi:
${CHU_TRUU_TUONG.map(([a, b]) => `  "${a}" -> ${b}`).join('\n')}

Đây không phải danh sách đầy đủ, nó chỉ chỉ hướng. Luật thật là: mỗi câu phải
nói được một việc NHÌN THẤY ĐƯỢC hoặc một chuyện XẢY RA ĐƯỢC. Nếu đọc một câu
mà không hình dung ra ai đang làm gì, câu đó chưa viết xong.`;
