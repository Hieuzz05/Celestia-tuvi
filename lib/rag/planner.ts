import { boDau, nhanDangThucThe, type ThucThe } from './thuc-the';

/**
 * Query Planner — quyết định phải đi tìm cái gì, TRƯỚC khi đụng tới embedding.
 *
 * Trước đây truy vấn là `${cauHoi}. ${saoMenh}`: ném nguyên câu người dùng cộng
 * với vài sao cung Mệnh vào vector search. Hỏi "năm nay có nên đổi việc không"
 * thì cung Quan Lộc — nơi thật sự chứa câu trả lời — không xuất hiện ở đâu cả.
 *
 * Planner làm ba việc: đọc ra chủ đề, suy ra các cung liên quan, và xác định
 * lớp hạn cần xem. Tất cả bằng luật. LLM chỉ được gọi khi luật không kết luận
 * được, và đó là bước sau (chưa bật ở P0).
 *
 * Cấu hình có số phiên bản vì mỗi lần sửa bảng dưới đây là đổi kết quả truy
 * hồi. Không đánh số thì không so sánh được hai lần chạy eval.
 */

export const PHIEN_BAN_PLANNER = '2026.09.2';

export type ChuDe = 'su-nghiep' | 'tai-chinh' | 'tinh-cam' | 'gia-dao' | 'suc-khoe' | 'tong-quan';

export type LopHan = 'ban-menh' | 'dai-van' | 'luu-nien' | 'nguyet-han';

export interface KeHoachTruyVan {
  chuDe: ChuDe;
  /** Chủ đề đọc được từ luật hay chỉ là mặc định khi không có tín hiệu nào */
  chacChan: boolean;
  cungLienQuan: string[];
  lopHan: LopHan[];
  thucThe: ThucThe[];
  /** Câu truy vấn đã viết lại cho retrieval — không phải câu người dùng gõ */
  truyVan: string;
  /**
   * Truy vấn riêng cho nhánh từ khoá: chỉ những thuật ngữ đặc trưng.
   *
   * Nhánh từ khoá tồn tại để bắt ĐÚNG CHỮ. Ném cả câu văn vào đó thì các từ nối
   * ("của", "thế nào") lấn át tên sao, mà tên sao mới là thứ nó giỏi hơn vector.
   */
  truyVanTuKhoa: string;
  phienBan: string;
}

/**
 * Chủ đề → cung. Bảng này là kiến thức tử vi, không phải lựa chọn kỹ thuật:
 * hỏi chuyện công việc mà chỉ đọc Quan Lộc là thiếu — Mệnh cho biết người đó
 * hợp cách làm việc nào, Tài Bạch cho biết đổi việc có được gì, Thiên Di cho
 * biết cơ hội đến từ trong hay ngoài.
 */
const CUNG_THEO_CHU_DE: Record<ChuDe, string[]> = {
  'su-nghiep': ['Quan Lộc', 'Mệnh', 'Tài Bạch', 'Thiên Di'],
  'tai-chinh': ['Tài Bạch', 'Quan Lộc', 'Điền Trạch', 'Phúc Đức'],
  'tinh-cam': ['Phu Thê', 'Mệnh', 'Phúc Đức', 'Thiên Di'],
  'gia-dao': ['Phụ Mẫu', 'Huynh Đệ', 'Điền Trạch', 'Phúc Đức'],
  'suc-khoe': ['Tật Ách', 'Mệnh', 'Phúc Đức'],
  'tong-quan': ['Mệnh', 'Phúc Đức', 'Thiên Di'],
};

/**
 * Từ khoá nhận chủ đề. Viết không dấu vì câu hỏi sẽ được chuẩn hoá trước khi so.
 * Cố ý dùng từ người dùng thật sự gõ, không dùng thuật ngữ tử vi — thuật ngữ đã
 * có từ điển thực thể lo.
 *
 * Khớp theo TỪ, không theo chuỗi con. Bộ vàng từng bắt được lỗi đúng kiểu này:
 * từ khoá "thi" nằm lọt trong "thì" và trong "thiên", khiến "Tử Vi thủ mệnh thì
 * tính cách thế nào" bị đọc thành câu hỏi sự nghiệp.
 */
const TU_KHOA_CHU_DE: Record<Exclude<ChuDe, 'tong-quan'>, string[]> = {
  'su-nghiep': [
    'cong viec', 'su nghiep', 'nghe nghiep', 'lam nghe', 'nghe gi', 'cong danh',
    'doi viec', 'nhay viec', 'thang chuc', 'thang tien', 'sep', 'dong nghiep',
    'khoi nghiep', 'kinh doanh', 'nghi viec', 'phong van', 'du an', 'chuc vu',
    'hoc hanh', 'thi cu',
  ],
  'tai-chinh': [
    'tien', 'tai chinh', 'tai loc', 'thu nhap', 'luong', 'dau tu', 'chung khoan',
    'no nan', 'vay', 'tiet kiem', 'giau', 'ngheo', 'phat tai', 'lam an', 'buon ban',
    'mua nha', 'mua dat', 'bat dong san', 'tai san',
  ],
  'tinh-cam': [
    'tinh cam', 'tinh duyen', 'nguoi yeu', 'ban trai', 'ban gai', 'hon nhan',
    'cuoi', 'ket hon', 'lay vo', 'lay chong', 'vo chong', 'ly hon', 'chia tay',
    'doc than', 'ban doi', 'hop tuoi',
  ],
  'gia-dao': [
    'gia dinh', 'cha me', 'bo me', 'anh em', 'anh chi em', 'con cai',
    'ho hang', 'phu mau', 'sinh con',
  ],
  'suc-khoe': [
    'suc khoe', 'benh', 'benh tat', 'om', 'om dau', 'the trang', 'tinh than',
    'stress', 'met moi', 'mat ngu', 'tai nan', 'phau thuat', 'di kham',
  ],
};

/**
 * Cung → chủ đề.
 *
 * Người dùng gọi đích danh một cung là tín hiệu mạnh hơn mọi từ khoá: "Lộc Tồn ở
 * Tài Bạch có tốt không" không chứa từ nào về tiền, nhưng rõ ràng là câu hỏi tài
 * chính. Bảng này là chiều ngược của CUNG_THEO_CHU_DE, viết tay vì không phải
 * ánh xạ một-một (Mệnh xuất hiện ở nhiều chủ đề).
 */
const CHU_DE_THEO_CUNG: Record<string, ChuDe> = {
  'Quan Lộc': 'su-nghiep',
  'Tài Bạch': 'tai-chinh',
  'Điền Trạch': 'tai-chinh',
  'Phu Thê': 'tinh-cam',
  'Phụ Mẫu': 'gia-dao',
  'Huynh Đệ': 'gia-dao',
  'Tử Tức': 'gia-dao',
  'Tật Ách': 'suc-khoe',
  'Mệnh': 'tong-quan',
  'Phúc Đức': 'tong-quan',
  'Thiên Di': 'tong-quan',
  'Nô Bộc': 'tong-quan',
};

const TU_KHOA_HAN: [LopHan, string[]][] = [
  ['nguyet-han', ['thang nay', 'thang toi', 'thang sau', 'trong thang', 'nguyet han']],
  ['luu-nien', ['nam nay', 'nam toi', 'nam sau', 'trong nam', 'luu nien', 'tieu han']],
  ['dai-van', ['dai van', 'dai han', 'muoi nam', '10 nam', 'giai doan nay', 'nhung nam toi']],
  ['ban-menh', ['ca doi', 'suot doi', 'ban chat', 'tinh cach', 'ban menh', 'so phan']],
];

/** Mọi cụm 1–4 từ có trong câu, để so khớp theo ranh giới từ chứ không theo chuỗi con */
function cumTu(cauKhongDau: string): Set<string> {
  const tu = cauKhongDau.split(/[^a-z0-9]+/).filter(Boolean);
  const ra = new Set<string>();
  for (let i = 0; i < tu.length; i++) {
    for (let n = 1; n <= 4 && i + n <= tu.length; n++) ra.add(tu.slice(i, i + n).join(' '));
  }
  return ra;
}

function doanChuDe(cum: Set<string>): { chuDe: ChuDe; chacChan: boolean } {
  let tot: ChuDe = 'tong-quan';
  let diemTot = 0;

  for (const [chuDe, tuKhoa] of Object.entries(TU_KHOA_CHU_DE) as [ChuDe, string[]][]) {
    // Cộng dồn thay vì dừng ở từ đầu tiên: "đổi việc có thêm tiền không" chạm cả
    // hai chủ đề, và chủ đề nào chạm nhiều hơn (và bằng cụm dài hơn) thì thắng.
    const diem = tuKhoa.reduce((s, t) => (cum.has(t) ? s + t.length : s), 0);
    if (diem > diemTot) {
      diemTot = diem;
      tot = chuDe;
    }
  }

  return { chuDe: tot, chacChan: diemTot > 0 };
}

function doanLopHan(cum: Set<string>, thucThe: ThucThe[]): LopHan[] {
  const ra = new Set<LopHan>();

  for (const [lop, tuKhoa] of TU_KHOA_HAN) {
    if (tuKhoa.some((t) => cum.has(t))) ra.add(lop);
  }

  // Người dùng gọi thẳng tên lớp hạn thì tin theo, khỏi đoán
  for (const tt of thucThe) {
    if (tt.id === 'PERIOD.LUU_NIEN') ra.add('luu-nien');
    if (tt.id === 'PERIOD.DAI_VAN') ra.add('dai-van');
    if (tt.id === 'PERIOD.NGUYET_HAN') ra.add('nguyet-han');
    if (tt.id === 'PERIOD.BAN_MENH') ra.add('ban-menh');
  }

  // Bản mệnh luôn có mặt: mọi lớp hạn đều đọc trên nền lá số gốc, bỏ nó ra thì
  // đoạn tài liệu về cách cục gốc không bao giờ được truy hồi.
  ra.add('ban-menh');

  // Hỏi chung chung, không mốc thời gian nào — mặc định nhìn năm đang xem, vì
  // đó cũng là thứ màn Hôm nay đang hiển thị.
  if (ra.size === 1) ra.add('luu-nien');

  return [...ra];
}

/**
 * Viết lại truy vấn cho retrieval.
 *
 * Câu người dùng gõ là câu hỏi; tài liệu tử vi thì viết bằng thuật ngữ. Truy
 * vấn phải nói được cả hai thứ tiếng — nên nó gồm câu gốc, tên các cung suy ra
 * từ chủ đề, tên thực thể đã chuẩn hoá, và các sao thực sự đứng ở những cung đó
 * trên lá số này.
 */
function vietLaiTruyVan(
  cauHoi: string,
  cungLienQuan: string[],
  thucThe: ThucThe[],
  saoTheoCung: Record<string, string[]> | undefined
): string {
  const phan: string[] = [cauHoi.trim()];

  phan.push(`Cung liên quan: ${cungLienQuan.join(', ')}.`);

  const tenThucThe = thucThe.map((t) => t.ten);
  if (tenThucThe.length) phan.push(`Thuật ngữ: ${tenThucThe.join(', ')}.`);

  if (saoTheoCung) {
    const net = cungLienQuan
      .map((c) => {
        const sao = saoTheoCung[c];
        return sao?.length ? `${c}: ${sao.join(' ')}` : null;
      })
      .filter(Boolean);
    if (net.length) phan.push(`Sao tại các cung này: ${net.join('; ')}.`);
  }

  return phan.join(' ');
}

export interface DauVaoPlanner {
  cauHoi: string;
  /** Sao đứng tại từng cung của lá số đang xem, để truy vấn nói đúng tên sao */
  saoTheoCung?: Record<string, string[]>;
}

/**
 * Từ nối và từ hỏi — bỏ khỏi truy vấn từ khoá.
 *
 * So trên chữ CÓ DẤU. Bản đầu so trên chữ đã bỏ dấu và nuốt mất tên sao: trong
 * tiếng Việt dấu phân biệt nghĩa, nên "Đà" thành "da" rồi trùng với "đã", "Cơ"
 * thành "co" rồi trùng với "có". Đo được: câu hỏi về "Linh Xương Đà Vũ" cho ra
 * truy vấn "Linh Xương Vũ" — mất đúng chữ cần tìm.
 *
 * Danh sách cố ý ngắn, chỉ những từ không bao giờ là thứ cần tìm.
 */
const TU_DUNG = new Set([
  'của', 'tôi', 'là', 'gì', 'thế', 'nào', 'có', 'không', 'thì', 'và', 'với',
  'ở', 'tại', 'cho', 'như', 'ra', 'sao', 'này', 'đó', 'ấy', 'những', 'mà',
  'được', 'bị', 'sẽ', 'đang', 'đã', 'về', 'nói', 'lên', 'điều', 'cách',
  'nghĩa', 'đúng', 'lo', 'hay', 'các', 'nhiều', 'ít', 'rất', 'một', 'người',
  'nên', 'khi', 'nếu', 'còn', 'cùng', 'đến', 'từ', 'trong', 'ngoài', 'bao',
]);

/**
 * Từ đặc trưng lấy thẳng từ câu người dùng gõ.
 *
 * Tên cách cục không nằm trong từ điển thực thể — không thể liệt kê hết, vì mỗi
 * cuốn sách đặt tên một kiểu. Nhưng chúng LUÔN xuất hiện nguyên chữ trong câu
 * hỏi của người muốn tra chúng. Giữ lại chữ ấy là cách rẻ nhất để bắt được.
 */
function tuDacTrung(cauHoi: string): string[] {
  const ra: string[] = [];
  const daCo = new Set<string>();
  for (const tu of cauHoi.split(/[^\p{L}\p{N}]+/u)) {
    if (tu.length < 2) continue;
    const thuong = tu.toLowerCase();
    if (TU_DUNG.has(thuong) || daCo.has(thuong)) continue;
    daCo.add(thuong);
    ra.push(tu);
  }
  // Trần 12 từ: dài hơn thì truy vấn loãng và nhánh từ khoá mất tính chọn lọc
  return ra.slice(0, 12);
}

/**
 * Dựng truy vấn cho nhánh từ khoá.
 *
 * Nhánh này dùng ngữ nghĩa HOẶC, nên mỗi từ thêm vào là một cách nữa để lọt vào
 * kết quả. Với câu hỏi đã có cụm đặc trưng, thêm tên cung là tự làm loãng: đo
 * được, mười lăm kết quả đầu bị ba cung phổ biến chiếm hết và đoạn đúng rơi ra
 * ngoài, trong khi tìm bằng riêng cụm đặc trưng thì nó đứng thứ nhất.
 *
 * Nhưng câu hỏi mơ hồ ("công việc của tôi thế nào") thì tên cung lại là tín hiệu
 * duy nhất. Nên chỉ thêm khi câu hỏi không tự mang đủ chữ.
 */
function dungTruyVanTuKhoa(
  cauHoi: string,
  thucThe: ThucThe[],
  cungLienQuan: string[]
): string {
  const rieng = [...new Set([...thucThe.map((t) => t.ten), ...tuDacTrung(cauHoi)])];
  // Ba từ trở lên là đủ đặc trưng để tự đứng một mình
  return (rieng.length >= 3 ? rieng : [...new Set([...rieng, ...cungLienQuan])]).join(' ');
}

export function lapKeHoach({ cauHoi, saoTheoCung }: DauVaoPlanner): KeHoachTruyVan {
  const cum = cumTu(boDau(cauHoi));
  const thucThe = nhanDangThucThe(cauHoi);

  // Cung gọi đích danh (kể cả qua bí danh như "công việc", "vợ chồng") là tín
  // hiệu mạnh nhất: nó nói thẳng người hỏi đang nhìn vào đâu. Chỉ khi không có
  // cung nào mới phải đoán chủ đề từ từ khoá.
  const cungGoiTen = thucThe.filter((t) => t.loai === 'PALACE').map((t) => t.ten);
  const theoTuKhoa = doanChuDe(cum);
  const chuDe = cungGoiTen.length ? (CHU_DE_THEO_CUNG[cungGoiTen[0]] ?? 'tong-quan') : theoTuKhoa.chuDe;

  const cungLienQuan = [...new Set([...cungGoiTen, ...CUNG_THEO_CHU_DE[chuDe]])];

  return {
    chuDe,
    chacChan: theoTuKhoa.chacChan || cungGoiTen.length > 0,
    cungLienQuan,
    lopHan: doanLopHan(cum, thucThe),
    thucThe,
    truyVan: vietLaiTruyVan(cauHoi, cungLienQuan, thucThe, saoTheoCung),
    truyVanTuKhoa: dungTruyVanTuKhoa(cauHoi, thucThe, cungLienQuan),
    phienBan: PHIEN_BAN_PLANNER,
  };
}

/** Nhãn tiếng Việt để hiện trong Retrieval Lab và trace */
export const NHAN_CHU_DE: Record<ChuDe, string> = {
  'su-nghiep': 'Sự nghiệp',
  'tai-chinh': 'Tài chính',
  'tinh-cam': 'Tình cảm',
  'gia-dao': 'Gia đạo',
  'suc-khoe': 'Sức khoẻ',
  'tong-quan': 'Tổng quan',
};

export const NHAN_LOP_HAN: Record<LopHan, string> = {
  'ban-menh': 'Bản mệnh',
  'dai-van': 'Đại vận',
  'luu-nien': 'Lưu niên',
  'nguyet-han': 'Nguyệt hạn',
};
