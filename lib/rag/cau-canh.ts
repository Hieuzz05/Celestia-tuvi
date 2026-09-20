import { boDau } from './thuc-the';

/**
 * CÂU CẢNH — câu người đọc hình dung ra được.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO CẦN ĐO THỨ NÀY
 *
 * Bản đọc sâu đã dịch tên sao sang hành vi. Nhưng đo trên một bài 11.767 từ
 * thì thứ nó dịch ra là hành vi TRỪU TƯỢNG: "năng lực tổ chức", "quyền tự
 * quyết", "khả năng biến nguồn lực rời rạc thành một hệ thống có người chịu
 * trách nhiệm". Đó không phải hành vi, đó là một danh từ khác. Đếm được:
 * "nền" 42 lần, "năng lực" 27, "nhịp" 24, "cấu trúc" 15.
 *
 * Phép dịch dừng sớm một nấc. Từ tên sao sang nghĩa thì xong; từ nghĩa sang
 * một CẢNH có người, có việc, có lúc thì chưa. Bài đúng mà không chạm, vì
 * người đọc không có chỗ nào để đặt mình vào.
 *
 * ---------------------------------------------------------------------------
 * ĐO BẰNG GÌ, VÀ VÌ SAO ĐÒI HAI TRONG BA
 *
 * Ba nhóm chữ: NGƯỜI cụ thể, VIỆC quan sát được, LÚC đời thường. Một câu phải
 * chạm ít nhất hai nhóm mới tính là cảnh.
 *
 * Đòi một nhóm thì quá dễ: "Bạn cần quyền tự quyết trong công việc" có chữ
 * "công việc" và đã qua, trong khi nó vẫn là đúng cái câu trừu tượng cần
 * tránh. Đòi cả ba thì quá chặt, vì một cảnh gọn hoàn toàn có thể chỉ có
 * người và việc: "Sếp nhắn lúc chín giờ tối và bạn trả lời ngay."
 *
 * Đây là phép đo XẤP XỈ, và nó biết mình xấp xỉ. Nó không hiểu câu; nó đếm
 * chữ. Một câu cảnh viết bằng chữ ngoài ba bảng dưới sẽ bị chấm trượt oan.
 * Chấp nhận được, vì hướng sai của nó là chặt hơn thực tế — nó không bao giờ
 * chấm đậu một câu toàn danh từ trừu tượng, mà đó mới là thứ cần chặn.
 */

/** Người cụ thể — có mặt mũi, có vai trò, không phải "người khác" chung chung */
const NGUOI = [
  'sep', 'cap tren', 'quan ly', 'dong nghiep', 'cong su', 'doi tac', 'khach hang',
  'nhan vien', 'cap duoi', 'ban be', 'ban than', 'bo me', 'cha me', 'bo', 'me',
  'anh chi em', 'anh trai', 'chi gai', 'em trai', 'em gai', 'ban doi', 'vo',
  'chong', 'nguoi yeu', 'con cai', 'hang xom', 'thay', 'bac si', 'nguoi nha',
  'nguoi quen', 'nguoi gioi thieu', 'khach', 'hoc tro', 'chu nha',
  // Bổ sung sau lần đo đầu: vẫn là người có mặt, không phải "người khác" chung
  'nguoi o canh', 'nguoi ben canh', 'gia dinh', 'nguoi lon', 'ca nhom',
  'doi nhom', 'nguoi cung lam',
];

/** Việc quan sát được — nhìn thấy hoặc nghe thấy, không phải trạng thái bên trong */
const VIEC = [
  'nhan tin', 'goi dien', 'nhac may', 'hop', 'ky', 'ky hop dong', 'gui mail',
  'tra loi', 'hen', 'dat lich', 'hoan', 'huy', 'xin nghi', 'nghi phep',
  'chuyen viec', 'nghi viec', 'nop don', 'phong van', 'chuyen nha', 'don nha',
  'mua nha', 'mua xe', 'vay', 'tra no', 'chuyen khoan', 'ban hang', 'di lam',
  'tang ca', 'thuc khuya', 'bo bua', 'an com', 'di choi', 've que', 'cai nhau',
  'noi chuyen', 'hoi y kien', 'nho giup', 'tu choi', 'nhan viec', 'giao viec',
  'bao cao', 'thuyet trinh', 'dang bai', 'nhan luong', 'tang luong',
  // Bổ sung sau lần đo đầu: đều là việc nhìn thấy hoặc nghe thấy được
  'kiem tra', 'mo dien thoai', 'im lang', 'noi that', 'hua', 'bo di',
  'quay lai', 'gap mat', 'ngoi canh', 'do lai', 'dem lai', 'ghi ra',
  'lap danh sach', 'don dep', 'nau com', 'cho doi', 'xin loi', 'giai thich',
];

/** Lúc — mốc thời gian đời thường, không phải tên hạn tử vi */
const LUC = [
  'buoi sang', 'buoi trua', 'buoi chieu', 'buoi toi', 'ban dem', 'sang som',
  'nua dem', 'cuoi tuan', 'dau tuan', 'giua tuan', 'cuoi thang', 'dau thang',
  'cuoi nam', 'dau nam', 'vai hom', 'may hom', 'vai tuan', 'vai thang',
  'may thang', 'mot hai nam', 'vai nam', 'hang ngay', 'moi sang', 'moi toi',
  'sau bua', 'truoc khi ngu', 'gio nghi', 'ngay nghi', 'dip le', 'dip tet',
];

/**
 * Giờ đồng hồ viết bằng chữ hoặc bằng số: "chín giờ tối", "7 giờ sáng".
 *
 * Phải bắt riêng bằng mẫu chứ không liệt kê được: số nào ghép với "giờ" cũng
 * là một mốc, mà liệt kê hết thì bảng dài vô ích. Đây là chỗ bảng chữ hụt thật
 * — đo trên bài đầu có luật mới, câu "Chín giờ tối, bạn vẫn kiểm tra tài
 * khoản" bị chấm trượt trong khi nó đúng là cảnh rõ nhất cả phần.
 */
const GIO_DONG_HO =
  /\b(?:\d{1,2}|mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi|muoi mot|muoi hai)\s*gio\b/u;

function chamNhom(s: string, nhom: readonly string[]): boolean {
  return nhom.some((t) => s.includes(t));
}

/** Một câu có phải câu cảnh không — chạm ít nhất hai trong ba nhóm */
export function laCauCanh(cau: string): boolean {
  const s = ` ${boDau(cau)} `;
  let cham = 0;
  if (chamNhom(s, NGUOI)) cham += 1;
  if (chamNhom(s, VIEC)) cham += 1;
  if (chamNhom(s, LUC) || GIO_DONG_HO.test(s)) cham += 1;
  return cham >= 2;
}

/**
 * Khối chữ đưa vào prompt.
 *
 * Nêu VÍ DỤ CHỨ KHÔNG NÊU CẢ BẢNG. Dán ba bảng trên vào prompt là dạy model
 * viết cho vừa phép đo: nó sẽ rải đúng những chữ ấy vào câu cho qua cửa, và
 * thứ đo được sẽ hết liên quan tới thứ cần đo. Ví dụ thì chỉ đường; bảng đầy
 * đủ thì thành đáp án.
 */
export const KHOI_CAU_CANH = `Câu cảnh là câu người đọc hình dung ra được, phải có ít nhất hai trong ba thứ:
  NGƯỜI cụ thể — sếp, đồng nghiệp, bạn đời, bố mẹ, khách hàng
  VIỆC quan sát được — nhắn tin, họp, xin nghỉ, đổi việc, dọn nhà, trả lời muộn
  LÚC đời thường — cuối tuần, chín giờ tối, sau vài tháng, mỗi sáng

Đúng:  "Sếp nhắn lúc chín giờ tối, và bạn trả lời ngay dù đang ăn dở."
Sai:   "Bạn có năng lực tổ chức và cần quyền tự quyết trong công việc."
Câu sai ở trên không sai về nghĩa. Nó chỉ không phải một cảnh, nên người đọc
gật đầu rồi quên, vì không có chỗ nào để đặt mình vào.`;
