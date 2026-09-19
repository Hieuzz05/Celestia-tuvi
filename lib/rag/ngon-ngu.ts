import { TEN_CACH_CUC } from '@/lib/tuvi/cach-cuc';
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

export const PHIEN_BAN_NGON_NGU = '2026.09.3';

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

/**
 * Từ huyền bí mơ hồ — không phải thuật ngữ sản phẩm.
 *
 * Cố ý KHÔNG có "thiên cơ": bỏ dấu thì nó trùng với tên sao Thiên Cơ, vốn xuất
 * hiện trong gần như mọi lá số. Một luật chặn bắt nhầm tên sao thì người sửa sẽ
 * học cách bỏ qua cả bộ soát.
 */
const TU_HUYEN_BI = ['nang luong vu tru', 'dinh menh', 'van so da an bai'];

/**
 * Từ chuyên môn của sách, KHÔNG được tới thẳng người đọc.
 *
 * Chúng hoàn toàn đúng trong nguồn, và chính vì thế mà nguy: kho tri thức càng
 * đầy thì model càng dễ bê nguyên chữ của sách ra. Đo trên bộ vàng RAG: một bài
 * lọt chữ "tọa thủ" tới mặt trước.
 *
 * Khung luận §7 xếp chúng vào nhóm phải dịch sang lời thường. Ghi ở mức cảnh báo
 * chứ không chặn: một chữ lọt ra không đáng vứt cả bài, nhưng phải đếm được để
 * biết nó đang tăng hay giảm.
 *
 * Danh sách chỉ gồm từ KHÔNG có nghĩa đời thường. "Hãm" hay "vượng" không nằm
 * đây vì người Việt vẫn dùng chúng ngoài đời.
 */
const TU_CHUYEN_MON = [
  'mieu vien',
  'toa thu',
  'hoi chieu',
  'cung chieu',
  'xung chieu',
  'tam phuong tu chinh',
  'nhi hop',
  'ban tien cach',
  'phu quy cach',
  'thu menh',
];

/**
 * Tính từ Barnum: đúng với gần như ai cũng được.
 *
 * Chỉ bị bắt khi đứng một mình. "Bạn là người sâu sắc" thì sáo; "bạn cân nhắc
 * lâu trước khi tin ai đó, và điều này khiến người khác thấy bạn sâu sắc" thì
 * không — vì đã có hành vi cụ thể đi kèm.
 */
const TINH_TU_BARNUM = ['sau sac', 'nhay cam', 'manh me', 'dac biet', 'tinh te', 'phuc tap'];

/**
 * Phán quyết — Celes đưa góc nhìn, không ra quyết định thay.
 *
 * Cụm phải đủ dài để chỉ khớp đúng ý bị cấm. "khong hop" từng nằm ở đây và bắt
 * luôn "không hợp lý", "không hợp tác" — thứ bị cấm là phán "hai người không hợp
 * nhau", không phải chữ "hợp".
 */
const PHAN_QUYET = [
  'ban chac chan',
  'se xay ra',
  'nen nghi viec',
  'khong hop nhau',
  'khong hop voi nhau',
  'nen cuoi',
  'khong nen cuoi',
  'chac chan se',
  'nhat dinh se',
];

/**
 * Rò rỉ RAG ra giao diện người dùng — cấm tuyệt đối theo mục 10.
 *
 * Thứ bị cấm là tên tài liệu, hệ phái gắn theo từng đoạn, và điểm liên quan.
 * KHÔNG cấm nhãn phương pháp (`celestia-nam-phai · v2026.09.1`) — mục 10.3 của
 * tài liệu cho phép hiện nó trong phần "Muốn biết vì sao không?", vì nó nói bộ
 * quy tắc nào đã chạy chứ không tiết lộ nguồn nào được truy hồi.
 */
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

/**
 * Mọi cụm 1–5 từ có trong văn bản.
 *
 * Khớp theo TỪ chứ không theo chuỗi con. Bộ soát bản đầu dùng `includes` nên
 * "không hợp lý" bị bắt vì chứa "không hợp", và "Thiên Cơ" bị bắt vì chứa
 * "thiên cơ". Một cổng chặn bắt nhầm như vậy sẽ bị người sửa học cách bỏ qua —
 * và lúc đó nó vô dụng hơn cả không có.
 */
function cumTu(khongDau: string): Set<string> {
  const tu = khongDau.split(/[^a-z0-9]+/).filter(Boolean);
  const ra = new Set<string>();
  for (let i = 0; i < tu.length; i++) {
    for (let n = 1; n <= 5 && i + n <= tu.length; n++) ra.add(tu.slice(i, i + n).join(' '));
  }
  return ra;
}

function dem(cum: Set<string>, canTim: string[]): string[] {
  return canTim.filter((c) => cum.has(c));
}

/**
 * Từ đứng ngay trước một cụm phán quyết mà làm nó thành câu phủ định — hoặc
 * thành câu hỏi. "Điều gì sẽ xảy ra nếu bạn mở lòng hơn?" là câu phản chiếu,
 * đúng thứ framework muốn kết bài, không phải lời tiên đoán.
 */
const PHU_DINH = [
  'khong phai', 'chua chac', 'khong han', 'chua han', 'khong the noi',
  'dieu gi', 'chuyen gi', 'lieu',
];

/**
 * Như `dem`, nhưng bỏ qua khi cụm nằm trong một câu phủ định.
 *
 * Câu miễn trừ "đây là xu hướng, không phải một sự việc chắc chắn sẽ xảy ra"
 * chứa đúng cụm bị cấm, nhưng nó đang nói ngược lại điều bị cấm. Bắt cả những
 * câu như vậy thì cổng ngôn ngữ chặn chính phần cẩn trọng nhất của bài — và
 * người sửa sẽ đi gỡ bỏ lời miễn trừ để làm hài lòng cái máy.
 */
function demCoPhuDinh(khongDau: string, cum: Set<string>, canTim: string[]): string[] {
  return canTim.filter((c) => {
    if (!cum.has(c)) return false;
    let i = khongDau.indexOf(c);
    while (i !== -1) {
      const truoc = khongDau.slice(Math.max(0, i - 48), i);
      if (!PHU_DINH.some((p) => truoc.includes(p))) return true;
      i = khongDau.indexOf(c, i + c.length);
    }
    return false;
  });
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
/**
 * Động từ / cụm chỉ HÀNH VI ĐỜI SỐNG.
 *
 * Dùng để kiểm cách cục đã được dịch chưa. Không cần đầy đủ — chỉ cần đủ dày để
 * một câu thật sự nói về đời sống thì gần như chắc chắn chạm ít nhất một cụm.
 * Thiếu sót ở đây chỉ làm cảnh báo thừa, không chặn bài.
 */
const DONG_TU_DOI_SONG = [
  'lam', 'song', 'noi', 'nghi', 'chon', 'quyet', 'doi', 'giu', 'mat', 'duoc',
  'thay', 'can', 'muon', 'tranh', 'chiu', 'gap', 'di', 've', 'o lai', 'bo',
  'day', 'keo', 'dung', 'xay', 'hop', 'thich', 'ngai', 'de', 'kho', 'met',
  'vui', 'buon', 'tien', 'viec', 'nguoi', 'quan he', 'gia dinh', 'suc khoe',
  'ban', 'sep', 'dong nghiep', 'con', 'cha', 'me', 'nha', 'thoi gian',
];

/** Một câu có nói bằng lời đời sống không */
function coLoiDoiSong(cau: string): boolean {
  const cum = cumTu(boDau(cau));
  return DONG_TU_DOI_SONG.some((t) => cum.has(t));
}

export function soatNgonNgu(van: string, doanMoDau: string[]): KetQuaNgonNgu {
  const loi: LoiNgonNgu[] = [];

  /*
   * Cách cục nêu tên mà không dịch.
   *
   * Chuẩn ngôn ngữ cho phép gọi thẳng tên cách cục — đó là ngoại lệ duy nhất
   * với luật cấm thuật ngữ. Ngoại lệ ấy đi kèm điều kiện: phải có một mệnh đề
   * đời sống trong phạm vi ±1 câu. Không có điều kiện đó thì "ngoại lệ" biến
   * thành đường cho thuật ngữ tràn về.
   *
   * Mức CẢNH BÁO chứ không chặn: câu vẫn đúng, chỉ là khó đọc. Chặn một bài
   * đúng vì nó quên dịch một cái tên là phản ứng quá tay — cùng lý do với các
   * lỗi giọng khác.
   */
  const cau = van.split(/(?<=[.!?])\s+/).filter((c) => c.trim());
  const chuaDich: string[] = [];
  for (let i = 0; i < cau.length; i++) {
    const co = TEN_CACH_CUC.filter((t) => boDau(cau[i]).includes(boDau(t)));
    if (!co.length) continue;
    const quanh = [cau[i - 1], cau[i], cau[i + 1]].filter(Boolean).join(' ');
    if (!coLoiDoiSong(quanh)) chuaDich.push(...co);
  }
  if (chuaDich.length) {
    loi.push({
      ma: 'cach-cuc-khong-dich',
      mucDo: 'canh-bao',
      moTa: 'Nêu tên cách cục nhưng không có mệnh đề đời sống đi kèm trong phạm vi một câu.',
      viDu: [...new Set(chuaDich)].join(', '),
    });
  }
  // Gỡ nhãn phương pháp trước khi soát: nó chứa tên hệ phái nhưng được phép hiện.
  const khongDau = boDau(van).replace(/celestia[- ][a-z- ]+phai/g, 'phuong-phap');
  const cum = cumTu(khongDau);

  // Rò rỉ RAG là lỗi nặng nhất: nó phá đúng cam kết sản phẩm, và người dùng
  // nhìn thấy ngay. Chặn, không cảnh báo.
  const roRi = dem(cum, RO_RI_RAG);
  if (roRi.length) {
    loi.push({
      ma: 'lo-nguon-rag',
      mucDo: 'chan',
      moTa: 'Nhắc tới tài liệu, hệ phái hoặc độ liên quan — những thứ chỉ được nằm ở trace quản trị.',
      viDu: roRi.join(', '),
    });
  }

  const phan = demCoPhuDinh(khongDau, cum, PHAN_QUYET);
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
  const ai = dem(cum, CUM_AI);
  if (ai.length) {
    loi.push({ ma: 'cum-van-may', mucDo: 'canh-bao', moTa: 'Dùng cụm nối rỗng nghĩa.', viDu: ai.join(', ') });
  }

  const tho = dem(cum, TU_THO);
  if (tho.length) {
    loi.push({ ma: 'tu-kich-tinh', mucDo: 'canh-bao', moTa: 'Dùng từ kịch tính không cần thiết.', viDu: tho.join(', ') });
  }

  const huyen = dem(cum, TU_HUYEN_BI);
  if (huyen.length) {
    loi.push({ ma: 'tu-huyen-bi', mucDo: 'canh-bao', moTa: 'Dùng từ huyền bí mơ hồ.', viDu: huyen.join(', ') });
  }

  const chuyenMon = dem(cum, TU_CHUYEN_MON);
  if (chuyenMon.length) {
    loi.push({
      ma: 'tu-chuyen-mon-chua-dich',
      mucDo: 'canh-bao',
      moTa: 'Bê nguyên chữ chuyên môn của sách ra mặt trước, chưa dịch sang lời thường.',
      viDu: chuyenMon.join(', '),
    });
  }

  // Ngưỡng 2: một tính từ chung chung trong cả bài là chuyện bình thường của
  // tiếng Việt; nhiều cái cùng lúc mới là dấu hiệu bài đang nói cho ai cũng được.
  const barnum = dem(cum, TINH_TU_BARNUM);
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
