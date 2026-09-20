import { TEN_CACH_CUC } from '@/lib/tuvi/cach-cuc';
import { BAC_CHAC_CHAN, mucNguYCuaCum } from './hinh-dang-tra-loi';
import type { MucChacChan } from './uu-tien-nguon';
import { demChuTruuTuong } from './chu-truu-tuong';
import { boDau, tenBiaChan } from './thuc-the';

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

export const PHIEN_BAN_NGON_NGU = '2026.09.6';

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
 * TIẾNG LÓNG NỘI BỘ CỦA ENGINE — chặn, không cảnh báo.
 *
 * Đây là lỗi đã ra tới người dùng thật, nên nó không được ở mức cảnh báo. Câu
 * nhận về:
 *
 *   "Năm 2026 nghiêng rõ về phía đẩy tới: bảy yếu tố đang đỡ so với hai yếu tố
 *    cản ở phần tình cảm."
 *
 * Mọi chữ trong đó đều là từ vựng hạch toán của hệ thống: engine đếm dữ kiện
 * hai bên rồi dán nhãn cho hiệu số. Người đọc không tra được "đẩy tới" là đẩy
 * cái gì, không biết "yếu tố" nào, và không đối chiếu được gì với đời mình.
 *
 * Vì sao CHẶN chứ không cảnh báo, khác với các lỗi giọng khác ở tệp này:
 *
 *   - Lỗi giọng làm bài kém hay. Lỗi này làm bài KHÔNG CÓ NỘI DUNG. Một câu
 *     trả lời không có tên dữ kiện nào thì không phải một bài luận Tử Vi, nó
 *     là một phỏng đoán có dấu chấm câu.
 *   - Nó đã lọt một lần, và lọt vì chính prompt dạy model viết như vậy — hai
 *     khối ý định đều để câu ấy làm ví dụ "Đúng". Khi một lỗi vào được qua
 *     đường prompt thì mục cảnh báo không giữ được nó: cảnh báo không ai đọc.
 *
 * Danh sách chỉ gồm cụm KHÔNG có nghĩa đời thường trong ngữ cảnh này. "Cản trở"
 * hay "thuận lợi" không nằm đây — chúng là tiếng Việt bình thường. Thứ bị chặn
 * là cách nói ĐẾM và cách TRỪU TƯỢNG HÓA dữ kiện thành "yếu tố".
 */
const TIENG_LONG_ENGINE = [
  'cac yeu to thuan',
  'nghieng ve phia thuan',
  'hai luc ngang nhau',
  'tuong quan cat hung',
];

/**
 * Phần còn lại phải khớp CÓ DẤU — bỏ dấu là bắt nhầm.
 *
 * Bộ eval bắt được ngay ở lần chạy đầu: bài viết "những yếu tố cần thiết để thu
 * hút nhà đầu tư" bị chặn, vì bỏ dấu thì "cần" và "cản" cùng thành "can". Câu
 * ấy là tiếng Việt bình thường và hoàn toàn đúng.
 *
 * Cùng hố với ba lỗi đã có ở tệp này — "không hợp lý" bị bắt vì chứa "không
 * hợp", "Thiên Cơ" bị bắt vì chứa "thiên cơ". Khớp không dấu là công cụ tốt cho
 * cụm dài và đặc trưng, và là công cụ sai cho cụm ngắn: tiếng Việt bỏ dấu thì
 * "đỡ / đó / độ" về một chữ, "cản / cần / căn" về một chữ, và "lực đỡ" đụng
 * thẳng vào "lúc đó".
 *
 * Một cổng chặn bắt nhầm thì người sửa sẽ học cách bỏ qua cả bộ soát — lúc đó
 * nó vô dụng hơn cả không có.
 *
 * Nhóm "(các|những|nhiều|một số|vài) yếu tố" thêm sau, khi một bài thật viết
 * "dễ bị cản trở bởi nhiều yếu tố không lường trước". Luật đếm không bắt được
 * vì nó đòi một con số, mà "nhiều" thì không phải con số — nhưng câu ấy y hệt
 * về bản chất: gộp những thứ CÓ TÊN thành một danh từ trừu tượng rồi đưa cho
 * người đọc. Trong giọng của Celes, "các yếu tố" luôn thay được bằng chính tên
 * của chúng; không thay được thì nghĩa là bài đang không có gì để nói.
 */
const TIENG_LONG_CO_DAU =
  /đẩy tới|yếu tố đỡ|yếu tố cản|yếu tố đang đỡ|yếu tố đang cản|lực đỡ|nghiêng về phía cản|(?:các|những|nhiều|một số|vài)\s+yếu\s+tố/iu;

/**
 * Câu ĐẾM dữ kiện: "bảy yếu tố đang đỡ so với hai yếu tố cản".
 *
 * Tách khỏi danh sách cụm vì nó là một HÌNH DẠNG câu, không phải một cụm cố
 * định — con số đổi theo lá số nên không liệt kê hết được.
 *
 * BẮT BUỘC có từ chỉ chiều (đỡ / cản / thuận / nghịch) đi sau. Bản đầu chỉ tìm
 * "một số + yếu tố", và bộ eval bắt nó chặn nhầm ngay:
 *
 *   "quãng này có nhiều cản trở từ Phá Quân cùng với Văn Xương — HAI YẾU TỐ NÀY
 *    cho thấy sự chuyển mình sẽ không dễ dàng"
 *
 * Câu ấy là thứ NGƯỢC LẠI với lỗi cần chặn: nó đã nêu đích danh hai cái tên,
 * rồi mới trỏ ngược về chúng. Thứ bị cấm là đếm những thứ KHÔNG có tên.
 *
 * Dùng bản CÓ DẤU. Bỏ dấu xong thì "nam" (số 5) trùng "năm" (đơn vị thời gian),
 * và luật sẽ bắt nhầm cả "năm 2026".
 */
const CAU_DEM_YEU_TO =
  /(?:\d+|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười)\s+yếu\s+tố\s+(?:đang\s+)?(?:đỡ|cản|thuận|nghịch)/iu;

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
  /*
   * "không có nghĩa" — thêm sau khi cổng chặn chính CÂU MIỄN TRỪ của sản phẩm.
   *
   * Câu ấy đổi từ "không phải một sự việc chắc chắn sẽ xảy ra" sang "không có
   * nghĩa một sự việc cụ thể chắc chắn sẽ xảy ra". Nghĩa y hệt, nhưng chữ phủ
   * định mới không nằm trong bảng, nên cổng đọc phần đuôi như một lời hứa và
   * chặn. Ba lần trong dự án này cổng đã bắt nhầm đúng câu làm sản phẩm an
   * toàn hơn — và bắt nhầm kiểu ấy đẩy người sửa đi GỠ lời miễn trừ cho máy
   * hài lòng.
   */
  'khong co nghia', 'khong dong nghia', 'khong hua',
  /*
   * "chưa có đủ căn cứ" — cùng một hố, bắt được trên bài dài thật.
   *
   * Câu bị chặn: "Celes chưa có đủ căn cứ để nói cụ thể sự việc nào sẽ xảy
   * ra." Đó là câu sản phẩm TỰ NHẬN giới hạn của mình, tức là đúng thứ chuẩn
   * ngôn ngữ đòi phải có. Cổng đọc mỗi đuôi "sẽ xảy ra" rồi gọi nó là lời hứa.
   */
  'chua co du can cu', 'chua du can cu', 'khong the noi truoc',
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

/** Mọi cụm đúng n từ trong một chuỗi đã bỏ dấu */
function cumNTu(khongDau: string, n: number): Set<string> {
  const tu = khongDau.split(/[^a-z0-9]+/).filter(Boolean);
  const ra = new Set<string>();
  for (let i = 0; i + n <= tu.length; i++) ra.add(tu.slice(i, i + n).join(' '));
  return ra;
}

export interface MucTheoDoan {
  /** Đoạn mở đầu của một ý */
  moDau: string;
  /** Mức engine đã chấm cho ý đó */
  muc: MucChacChan;
}

export function soatNgonNgu(
  van: string,
  doanMoDau: string[],
  mucTheoDoan?: MucTheoDoan[],
  daNoiTruoc?: string[]
): KetQuaNgonNgu {
  const loi: LoiNgonNgu[] = [];

  /*
   * Chép lại nguyên văn bài tổng quan.
   *
   * Khối "đã nói trước" được chèn vào prompt để giữ nhất quán giữa hai bề mặt.
   * Nhưng model có xu hướng dùng nó làm bài mẫu thay vì làm nền — đo được ngay
   * lần chạy đầu: bài chat mở bằng đúng câu của bảng tám lĩnh vực, không sai
   * một chữ. Người đọc gặp lại nguyên văn thì hiểu là Celes không có gì để nói
   * thêm, và khối ấy làm hại nhiều hơn làm lợi.
   *
   * Đếm cụm 7 từ dùng chung. Bảy vì tiếng Việt nhiều từ đơn âm: cụm 5 từ trùng
   * nhau vẫn có thể là tình cờ, cụm 7 thì gần như chắc chắn là chép.
   */
  if (daNoiTruoc?.length) {
    const cuaBai = cumNTu(boDau(van), 7);
    const cuaTruoc = new Set<string>();
    for (const d of daNoiTruoc) for (const g of cumNTu(boDau(d), 7)) cuaTruoc.add(g);
    const chung = [...cuaBai].filter((g) => cuaTruoc.has(g));
    if (chung.length) {
      loi.push({
        ma: 'chep-lai-bai-tong-quan',
        mucDo: 'canh-bao',
        moTa: 'Bài nhắc lại nguyên văn câu đã có trong bài tổng quan thay vì đi tiếp từ đó.',
        viDu: chung.slice(0, 3).join(' | '),
      });
    }
  }

  /*
   * Nói chắc hơn mức bằng chứng cho phép.
   *
   * `haGiong` đã ghi đè những đoạn nhận ra được cụm mở đầu. Luật này bắt phần
   * còn lại: đoạn mở bằng một cách khác mà giọng vẫn chắc hơn mức. Cảnh báo
   * chứ không chặn — nó là lỗi giọng, và bài vẫn đúng.
   */
  if (mucTheoDoan?.length) {
    const qua = mucTheoDoan.filter((d) => {
      const nguY = mucNguYCuaCum(d.moDau);
      return nguY !== null && BAC_CHAC_CHAN[nguY] > BAC_CHAC_CHAN[d.muc];
    });
    if (qua.length) {
      loi.push({
        ma: 'giong-chac-hon-bang-chung',
        mucDo: 'canh-bao',
        moTa: 'Có ý nói chắc hơn mức bằng chứng mà engine đã chấm.',
        viDu: qua.map((d) => `${d.muc}: "${d.moDau.slice(0, 40)}…"`).join(' · '),
      });
    }
  }

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
  /*
   * TÊN CUNG lọt ra mặt trước.
   *
   * Chuẩn ngôn ngữ cấm tên cung ở mọi dạng và đưa sẵn bảng dịch sang phần đời,
   * nhưng cho tới giờ chỉ có prompt nhắc — không có phép đếm nào. Bộ eval bắt
   * được ngay: một bài viết "tiểu hạn năm nay rơi vào phần Phúc Đức". Đổi giới
   * từ từ "cung" sang "phần" không làm nó dễ hiểu hơn chút nào.
   *
   * CẢNH BÁO chứ không chặn, cùng lý do với các lỗi giọng khác: một cái tên lọt
   * ra không đáng vứt cả bài đúng. Nhưng phải đếm được, vì lớp dữ kiện mới
   * khuyến khích nêu tên sao và tên lớp hạn — và khuyến khích nêu tên là làm
   * tăng áp lực lên đúng cái ranh giới này.
   *
   * "Mệnh" đòi giới từ đi kèm: đứng một mình nó trùng "số mệnh", "vận mệnh",
   * "sứ mệnh" — những chữ tiếng Việt bình thường, không phải tên cung.
   */
  const cungLo = [
    ...(van.match(
      /\b(?:Phụ Mẫu|Phúc Đức|Điền Trạch|Quan Lộc|Nô Bộc|Thiên Di|Tật Ách|Tài Bạch|Tử Tức|Phu Thê|Huynh Đệ)\b/giu
    ) ?? []),
    ...(van.match(/(?:cung|phần)\s+Mệnh\b/giu) ?? []),
  ];
  if (cungLo.length) {
    loi.push({
      ma: 'lo-ten-cung',
      mucDo: 'canh-bao',
      moTa: 'Gọi thẳng tên cung thay vì phần đời mà nó nói tới — người đọc không tra được.',
      viDu: [...new Set(cungLo)].join(', '),
    });
  }

  /*
   * TÊN SAO BỊA — dán hai cái tên có thật thành một cái không có thật.
   *
   * Bắt được trên bài thật: "Hóa Triệt". Lá số có Hóa Kỵ, lá số có Triệt, và
   * model gộp chúng thành một ngôi sao chưa từng tồn tại. Mọi lớp kiểm trước
   * đó đều cho qua, vì chúng hỏi "ngôi sao này có trên lá số không" chứ không
   * hỏi "cái tên này có thật không".
   *
   * Đây là lỗi duy nhất ở bảng này được đặt mức CHẶN. Các lỗi còn lại là lỗi
   * giọng: đọc lên thấy dở, nhưng không nói sai điều gì. Cái tên bịa thì nói
   * sai một điều người đọc không có cách nào tự kiểm, và nghe càng đúng giọng
   * chuyên môn thì càng dễ tin. Chữ dở sửa được ở lượt sau; một người mang cái
   * tên ấy đi hỏi thầy thì không sửa được nữa.
   */
  /*
   * CHỮ TRỪU TƯỢNG — cảnh báo, không chặn.
   *
   * Chặn thì một chữ "năng lực" đủ vứt cả bài, đúng cái tỉ lệ trừng phạt đã
   * sai ba lần trong dự án này. Nhưng phải ĐẾM được: bản đọc sâu đo trên một
   * bài 11.767 từ thấy riêng bốn chữ "nền", "năng lực", "nhịp", "cấu trúc" đã
   * hơn một trăm lần, mà không lớp nào báo gì — vì chưa có lớp nào đếm.
   */
  const truu = demChuTruuTuong(van);
  const soTruu = truu.reduce((a, [, d]) => a + d, 0);
  if (soTruu) {
    loi.push({
      ma: 'chu-truu-tuong',
      mucDo: 'canh-bao',
      moTa: 'Dùng chữ trừu tượng người đọc không hình dung ra được.',
      viDu: truu
        .slice(0, 6)
        .map(([c, d]) => `${c}:${d}`)
        .join(', '),
    });
  }

  const bia = tenBiaChan(van);
  if (bia.length) {
    loi.push({
      ma: 'ten-sao-bia',
      mucDo: 'chan',
      moTa: 'Dựng ra một tên sao không có thật bằng cách ghép hai tên thật.',
      viDu: bia.join(', '),
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

  /*
   * Tiếng lóng engine — chặn ngang hàng với rò rỉ RAG.
   *
   * Không đi qua `demCoPhuDinh`: phủ định không cứu được lỗi này. "Không phải
   * là yếu tố cản" vẫn bắt người đọc hiểu "yếu tố cản" là gì, và họ vẫn không
   * có cách nào biết.
   */
  const long = [
    ...dem(cum, TIENG_LONG_ENGINE),
    ...(van.match(new RegExp(TIENG_LONG_CO_DAU, 'giu')) ?? []),
    ...(van.match(CAU_DEM_YEU_TO) ?? []),
  ];
  if (long.length) {
    loi.push({
      ma: 'tieng-long-engine',
      mucDo: 'chan',
      moTa:
        'Nói bằng từ vựng hạch toán của hệ thống thay vì nêu tên dữ kiện trên lá số. ' +
        'Người đọc không tra được "yếu tố" nào, nên câu này không mang thông tin.',
      viDu: [...new Set(long)].join(', '),
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
