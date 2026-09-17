import { boDau } from './thuc-the';

/**
 * Cổng ngôn ngữ — bắt những cách viết mà framework cấm.
 *
 * Bạn không sửa được "đang viết giống AI quá" bằng cách dặn model viết tự nhiên
 * hơn. Dặn xong nó vẫn mở mọi đoạn bằng "Bạn thường…" vì đó là hình dạng an
 * toàn nhất của một câu tiếng Việt mô tả tính cách. Cách duy nhất chắc chắn là
 * đo: liệt kê đích danh những cụm đó, đếm, và chặn khi vượt ngưỡng.
 *
 * Mọi luật ở đây đều là luật ĐẾM, không phải luật đọc hiểu. Máy không phán được
 * một câu có sáo hay không; nó chỉ đếm được cụm nào lặp bao nhiêu lần. Vậy nên
 * mỗi luật dưới đây đều phải quy về một con số, và ngưỡng của con số đó phải
 * giải thích được.
 */

export const PHIEN_BAN_NGON_NGU = '2026.09.1';

export type MucDoNgonNgu = 'chan' | 'canh-bao';

export interface LoiNgonNgu {
  ma: string;
  mucDo: MucDoNgonNgu;
  moTa: string;
  viDu?: string;
}

/** Cụm mở đầu bị lặp — vấn đề không phải một lần, mà là nhiều đoạn cùng mở như nhau */
const MO_DAU_SAO = [
  'ban thuong',
  'phan nay',
  'o phan',
  'net noi len la',
  'giai doan nay',
  'dieu nay cho thay',
  'nhin chung',
];

/** Cụm nối rỗng nghĩa — dấu hiệu rõ nhất của văn model */
const CUM_AI = [
  'dieu nay cho thay rang',
  'co the noi rang',
  'nhin chung',
  'khong chi',
  'noi tom lai',
  'nhu vay co the thay',
  'dieu quan trong can luu y la',
];

/** Từ kịch tính không cần thiết */
const TU_THO = ['tran danh', 'boc len', 'dut ganh', 'pha bo', 'van di', 'tra gia'];

/** Từ huyền bí mơ hồ — không phải thuật ngữ sản phẩm */
const TU_HUYEN_BI = ['nang luong vu tru', 'dinh menh', 'van so da an bai', 'thien co'];

/**
 * Tính từ Barnum: đúng với gần như ai cũng được.
 *
 * Chỉ bị bắt khi đứng một mình. "Bạn là người sâu sắc" thì sáo; "bạn cân nhắc
 * lâu trước khi tin ai đó, và điều này khiến người khác thấy bạn sâu sắc" thì
 * không — vì đã có hành vi cụ thể đi kèm.
 */
const TINH_TU_BARNUM = ['sau sac', 'nhay cam', 'manh me', 'dac biet', 'tinh te', 'phuc tap'];

/** Phán quyết — Celes đưa góc nhìn, không ra quyết định thay */
const PHAN_QUYET = [
  'ban chac chan',
  'se xay ra',
  'nen nghi viec',
  'khong hop',
  'nen cuoi',
  'khong nen cuoi',
  'chac chan se',
  'nhat dinh se',
];

/** Rò rỉ RAG ra giao diện người dùng — cấm tuyệt đối theo mục 10 */
const RO_RI_RAG = [
  'theo tai lieu',
  'trong sach',
  'tai lieu cho biet',
  'nguon tham chieu cho thay',
  'nam phai',
  'bac phai',
  '% lien quan',
  'do lien quan',
];

function dem(khongDau: string, cum: string[]): string[] {
  return cum.filter((c) => khongDau.includes(c));
}

export interface KetQuaNgonNgu {
  dat: boolean;
  loi: LoiNgonNgu[];
  /** Tỉ lệ đoạn mở đầu trùng khuôn — chỉ số "đọc thấy template" */
  tyLeMoDauTrung: number;
}

/**
 * Soát một bài đã dựng thành chữ.
 *
 * `doanMoDau` là danh sách câu mở của từng ý; tách riêng vì luật lặp chỉ có
 * nghĩa khi nhìn cả bài, không nhìn từng đoạn.
 */
export function soatNgonNgu(van: string, doanMoDau: string[]): KetQuaNgonNgu {
  const loi: LoiNgonNgu[] = [];
  const khongDau = boDau(van);

  // Rò rỉ RAG là lỗi nặng nhất: nó phá đúng cam kết sản phẩm, và người dùng
  // nhìn thấy ngay. Chặn, không cảnh báo.
  const roRi = dem(khongDau, RO_RI_RAG);
  if (roRi.length) {
    loi.push({
      ma: 'lo-nguon-rag',
      mucDo: 'chan',
      moTa: 'Nhắc tới tài liệu, hệ phái hoặc độ liên quan — những thứ chỉ được nằm ở trace quản trị.',
      viDu: roRi.join(', '),
    });
  }

  const phan = dem(khongDau, PHAN_QUYET);
  if (phan.length) {
    loi.push({
      ma: 'phan-quyet',
      mucDo: 'chan',
      moTa: 'Nói như một phán quyết chắc chắn thay vì một góc nhìn để cân nhắc.',
      viDu: phan.join(', '),
    });
  }

  // Các lỗi còn lại chỉ cảnh báo: chúng làm bài kém hay chứ không làm bài sai,
  // và chặn một bài đúng vì nó dùng chữ "nhìn chung" là phản ứng quá tay.
  const ai = dem(khongDau, CUM_AI);
  if (ai.length) {
    loi.push({ ma: 'cum-van-may', mucDo: 'canh-bao', moTa: 'Dùng cụm nối rỗng nghĩa.', viDu: ai.join(', ') });
  }

  const tho = dem(khongDau, TU_THO);
  if (tho.length) {
    loi.push({ ma: 'tu-kich-tinh', mucDo: 'canh-bao', moTa: 'Dùng từ kịch tính không cần thiết.', viDu: tho.join(', ') });
  }

  const huyen = dem(khongDau, TU_HUYEN_BI);
  if (huyen.length) {
    loi.push({ ma: 'tu-huyen-bi', mucDo: 'canh-bao', moTa: 'Dùng từ huyền bí mơ hồ.', viDu: huyen.join(', ') });
  }

  // Barnum: chỉ tính khi tính từ đứng gần dấu kết câu hoặc liên từ, tức là nó
  // được dùng như một kết luận chứ không phải một mô tả có ví dụ theo sau.
  const barnum = TINH_TU_BARNUM.filter((t) => new RegExp(`\\b${t}\\s*[.,;]`).test(khongDau));
  if (barnum.length >= 2) {
    loi.push({
      ma: 'tinh-tu-barnum',
      mucDo: 'canh-bao',
      moTa: 'Nhiều tính từ chung chung dùng làm kết luận mà không có hành vi cụ thể minh hoạ.',
      viDu: barnum.join(', '),
    });
  }

  // Lặp khuôn mở đầu
  const moDau = doanMoDau.map((d) => boDau(d).slice(0, 40));
  const trung = moDau.filter((m) => MO_DAU_SAO.some((c) => m.startsWith(c))).length;
  const tyLe = moDau.length ? trung / moDau.length : 0;
  if (moDau.length >= 3 && tyLe >= 0.5) {
    loi.push({
      ma: 'lap-khuon-mo-dau',
      mucDo: 'canh-bao',
      moTa: `${trung}/${moDau.length} đoạn mở đầu bằng cùng một kiểu cụm — người đọc sẽ nhận ra template.`,
    });
  }

  return { dat: !loi.some((l) => l.mucDo === 'chan'), loi, tyLeMoDauTrung: tyLe };
}
