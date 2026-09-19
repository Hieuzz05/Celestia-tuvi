import type { MucChacChan } from './uu-tien-nguon';
import type { YDinh, LopHan, ChuDe } from './planner';

/**
 * Hai lớp hậu xử lý tất định cho câu trả lời: giọng chắc chắn, và lối đi tiếp.
 *
 * Cả hai đều là thứ KHÔNG ĐƯỢC để model quyết, và vì hai lý do khác nhau:
 *
 *  - **Mức chắc chắn**: engine đã chấm rồi, bằng cách đếm số tài liệu độc lập
 *    ủng hộ mỗi ý. Để model tự chọn cụm ngôn ngữ theo mức là để nó TỰ CHẤM ĐỘ
 *    CHẮC CỦA CHÍNH NÓ — và không ai tự chấm mình thấp cả. Bài đối chiếu nói
 *    mọi thứ bằng cùng một giọng chắc; đây là chỗ Celes vượt chứ không phải bắt
 *    kịp, nên không được đánh đổi.
 *
 *  - **Liên kết**: kế hoạch truy vấn đã biết chủ đề và lớp hạn, nên ánh xạ ra
 *    đường dẫn là việc của một bảng tra. Để model sinh URL là mở đường cho nó
 *    bịa ra một trang không tồn tại — lỗi mà người dùng gặp ngay và không có
 *    cách nào sửa ở phía sau.
 */

// ----------------------------------------------------------- giọng chắc chắn

/**
 * Cụm mở đầu ứng với từng mức, theo bảng 5.2 của framework.
 *
 * Chỉ liệt kê MỘT cụm cho mỗi mức, không phải cả bảng: đây là cụm dùng để ghi
 * đè, mà ghi đè bằng hai cụm luân phiên thì lại thành một khuôn mới.
 */
const CUM_THEO_MUC: Record<MucChacChan, string> = {
  manh: 'Một nét khá rõ là',
  vua: 'Có xu hướng là',
  yeu: 'Có một khả năng đáng để ý là',
  'trai-chieu': 'Có hai lực cùng tồn tại ở đây:',
  'chua-du': 'Chưa đủ căn cứ để đi xa, nhưng có thể nói rằng',
};

/** Thứ bậc để biết cụm nào mạnh hơn cụm nào */
const BAC: Record<MucChacChan, number> = {
  manh: 3,
  vua: 2,
  'trai-chieu': 2,
  yeu: 1,
  'chua-du': 0,
};

/**
 * Các cụm mở đầu model hay dùng, kèm mức mà chúng NGỤ Ý.
 *
 * Nhận theo chuỗi mở đầu chứ không theo từ rời: chúng đều là cụm cố định và
 * luôn đứng ở đầu câu, nên so đầu chuỗi vừa đủ vừa không bắt nhầm.
 */
const CUM_NHAN_DIEN: { cum: string; muc: MucChacChan }[] = [
  { cum: 'một nét khá rõ', muc: 'manh' },
  { cum: 'điểm này lặp lại', muc: 'manh' },
  { cum: 'rõ ràng là', muc: 'manh' },
  { cum: 'chắc chắn', muc: 'manh' },
  { cum: 'có thể thấy rõ', muc: 'manh' },
  { cum: 'có xu hướng', muc: 'vua' },
  { cum: 'điểm đáng để ý', muc: 'vua' },
  { cum: 'thường thì', muc: 'vua' },
  { cum: 'có hai lực', muc: 'trai-chieu' },
  { cum: 'có một khả năng', muc: 'yeu' },
  { cum: 'có thể', muc: 'yeu' },
];

function boDau(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/**
 * Hạ giọng một ý khi nó nói chắc hơn mức bằng chứng cho phép.
 *
 * CHỈ HẠ, không bao giờ nâng. Hai lý do:
 *
 *  1. Cái hại nằm hẳn về một phía. Một suy luận yếu nói bằng giọng chắc là thứ
 *     người đọc tin rồi mang đi quyết việc. Một suy luận mạnh nói bằng giọng dè
 *     dặt thì cùng lắm là nhạt — không ai thiệt.
 *  2. Nâng giọng đòi phải chèn chữ vào một câu model viết, và chèn vào giữa một
 *     câu tiếng Việt thì hỏng ngữ pháp nhiều hơn là được việc.
 *
 * Trả về nguyên văn khi không nhận ra cụm mở đầu nào — lúc đó `soatNgonNgu` sẽ
 * cảnh báo, và cảnh báo là đủ: nó không phải lỗi sai, chỉ là một chỗ khó đo.
 */
export function haGiong(noiDung: string, muc: MucChacChan | undefined): string {
  if (!muc) return noiDung;

  const kd = boDau(noiDung);
  const nhan = CUM_NHAN_DIEN.find((c) => kd.startsWith(c.cum));
  if (!nhan) return noiDung;
  if (BAC[nhan.muc] <= BAC[muc]) return noiDung;

  // Cắt đúng cụm đã nhận rồi ghép cụm của mức thật. Giữ nguyên phần còn lại,
  // kể cả dấu câu — chỉ đổi chữ mở đầu.
  const conLai = noiDung.slice(nhan.cum.length).replace(/^[\s,:]+/, '');
  const than = conLai.charAt(0).toLowerCase() + conLai.slice(1);
  return `${CUM_THEO_MUC[muc]} ${than}`;
}

/** Cụm nào đang được dùng ở đầu một đoạn, và nó ngụ ý mức nào */
export function mucNguYCuaCum(noiDung: string): MucChacChan | null {
  const kd = boDau(noiDung);
  return CUM_NHAN_DIEN.find((c) => kd.startsWith(c.cum))?.muc ?? null;
}

export { BAC as BAC_CHAC_CHAN };

// ----------------------------------------------------------------- liên kết

export interface LoiDiTiep {
  nhan: string;
  duong: string;
}

/**
 * Lối đi tiếp, ánh xạ TẤT ĐỊNH từ kế hoạch truy vấn.
 *
 * Tối đa HAI. Ba trở lên là biến câu trả lời thành một cái menu, và người đọc
 * vừa mới đọc xong một bài thì không chọn giữa ba cửa.
 *
 * Nhãn viết bằng ngôn ngữ người dùng, không tên kỹ thuật — cùng bảng từ ngữ mà
 * mặt trước đang dùng ("Khám phá bản đồ", "Hành trình", "Kết nối").
 */
export function loiDiTiep(vao: {
  chuDe: ChuDe;
  lopHan: LopHan[];
  yDinh: YDinh;
  cungTrongTam?: string;
}): LoiDiTiep[] {
  const ra: LoiDiTiep[] = [];

  if (vao.chuDe === 'su-nghiep') {
    ra.push({ nhan: 'Đọc kỹ hơn về công việc và hướng đi', duong: '/luan-giai?chuDe=su-nghiep' });
  } else if (vao.chuDe === 'tai-chinh') {
    ra.push({ nhan: 'Đọc kỹ hơn về tiền bạc', duong: '/luan-giai?chuDe=tai-chinh' });
  } else if (vao.chuDe === 'tinh-cam') {
    ra.push({ nhan: 'Xem hai lá số cạnh nhau', duong: '/hop-tuoi' });
  }

  if (vao.lopHan.includes('dai-van') || vao.lopHan.includes('luu-nien')) {
    ra.push({ nhan: 'Xem quãng này nằm ở đâu trong hành trình', duong: '/hanh-trinh' });
  }

  // Câu tra cứu thì thứ giúp nhất là nhìn thấy chính cung đang nói tới
  if (vao.yDinh === 'tra-cuu' && vao.cungTrongTam) {
    ra.push({ nhan: 'Nhìn trên bản đồ lá số', duong: '/la-so' });
  }

  return ra.slice(0, 2);
}
