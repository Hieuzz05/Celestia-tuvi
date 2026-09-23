import { docObjectJson } from './doc-json';
import { cumVietHoa } from './cum-tu-khoa';
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

export const PHIEN_BAN_PLANNER = '2026.09.7';

export type ChuDe = 'su-nghiep' | 'tai-chinh' | 'tinh-cam' | 'gia-dao' | 'suc-khoe' | 'tong-quan';

export type LopHan = 'ban-menh' | 'dai-van' | 'luu-nien' | 'nguyet-han';

/**
 * Trục ý định — người hỏi muốn LÀM GÌ với câu trả lời.
 *
 * Chủ đề nói câu hỏi VỀ cái gì; ý định nói người ta cần gì. Hai câu cùng chủ đề
 * sự nghiệp — "công việc tôi thế nào" và "tôi có nên nhận offer này không" —
 * cần hai câu trả lời khác hẳn nhau về hình dạng lẫn về lớp dữ liệu phải lấy.
 * Thiếu trục này thì mọi câu ra cùng một khuôn.
 */
export type YDinh =
  | 'quyet-dinh'   // "có nên…", "chọn A hay B" — xin lời khuyên để tự quyết
  | 'co-khong'     // "năm 2026 có chuyển việc ko" — xin một nhận định có/không
  | 'thoi-diem'    // "khi nào", "lúc này", "năm nay có hợp"
  | 'giai-thich'   // "vì sao tôi hay…"
  | 'tra-cuu'      // "Lộc Tồn ở Tài Bạch nghĩa là gì"
  | 'mo-ta';       // mặc định

export interface KeHoachTruyVan {
  chuDe: ChuDe;
  yDinh: YDinh;
  /** Chủ đề đọc được từ luật hay chỉ là mặc định khi không có tín hiệu nào */
  chacChan: boolean;
  /** Chủ đề do model phân loại chứ không do luật — chỉ để ghi trace */
  phanLoaiBangModel?: boolean;
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
  /**
   * Những tên riêng trong `truyVanTuKhoa` phải tìm NGUYÊN CỤM — tên cách cục,
   * cụm viết hoa người dùng gõ, tên cung khi có dùng. Xem lib/rag/cum-tu-khoa.ts.
   */
  cumTuKhoa?: string[];
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
    // Nhóm dưới thêm ở phiên bản 2026.09.3. Không có chúng thì câu hỏi thường
    // gặp nhất — "tôi vừa nhận được một offer, có nên nhận không" — rơi về
    // 'tong-quan' và cung Quan Lộc không bao giờ được truy hồi.
    'offer', 'loi moi', 'moi lam', 'nhan viec', 'chuyen viec', 'chuyen cong ty',
    'chuyen nganh', 'doi nganh', 'nganh khac', 'nganh nghe', 'trai nganh',
    'deal', 'thu viec', 'thu vien', 'on boarding', 'onboarding', 'tang luong',
    'dam phan luong', 'bi sa thai', 'sa thai', 'layoff', 'nghi that nghiep',
    'that nghiep', 'nhay sang', 'doi cong ty', 'vao lam', 'ra rieng',
    'team lead', 'quan ly', 'lanh dao', 'tuyen dung', 'ung tuyen', 'cv',
  ],
  'tai-chinh': [
    'tien', 'tai chinh', 'tai loc', 'thu nhap', 'luong', 'dau tu', 'chung khoan',
    'no nan', 'vay', 'tiet kiem', 'giau', 'ngheo', 'phat tai', 'lam an', 'buon ban',
    'mua nha', 'mua dat', 'bat dong san', 'tai san',
    'vay ngan hang', 'tra gop', 'lai suat', 'goi von', 'von', 'crypto',
    'coin', 'mua vang', 'gia vang', 'quy dau tu', 'bao hiem', 'chi tieu',
    'pha san', 'no xau',
  ],
  'tinh-cam': [
    'tinh cam', 'tinh duyen', 'nguoi yeu', 'ban trai', 'ban gai', 'hon nhan',
    'cuoi', 'ket hon', 'lay vo', 'lay chong', 'vo chong', 'ly hon', 'chia tay',
    'doc than', 'ban doi', 'hop tuoi',
    'to tinh', 'cau hon', 'quay lai', 'nguoi cu', 'crush', 'hen ho',
    'song thu', 'ngoai tinh', 'tha thu', 'yeu xa', 'gia dinh chong',
    'gia dinh vo', 'dam cuoi',
    /*
     * Cách người ta hỏi chuyện tình cảm mà KHÔNG gọi tên nó.
     *
     * "Có ai đang để ý tôi không" rơi vào 'tong-quan' trước khi có mấy dòng
     * này, và hậu quả không dừng ở một nhãn sai trong log: 'tong-quan' không
     * ứng vào cung nào, nên khối dữ kiện trả về RỖNG và bài mất sạch căn cứ.
     * Câu trả lời chung chung người dùng nhận về bắt đầu từ đúng chỗ này.
     *
     * Đây lại là hình câu hỏi phổ biến nhất của người chưa có ai: họ không hỏi
     * "tình duyên tôi thế nào", họ hỏi "có ai để ý tôi không".
     *
     * 'co ai' cố ý KHÔNG có mặt: nó đứng đầu quá nhiều câu chẳng liên quan
     * ("có ai từng làm việc này chưa"). Đặc trưng nằm ở 'de y', 'thich toi'.
     */
    'de y', 'thich toi', 'don phuong', 'tim hieu', 'nguoi thuong',
    'duyen', 'tim duoc nguoi', 'gap duoc nguoi', 'tan tinh', 'theo duoi',
    'mai mot', 'cap ke',
  ],
  'gia-dao': [
    'gia dinh', 'cha me', 'bo me', 'anh em', 'anh chi em', 'con cai',
    'ho hang', 'phu mau', 'sinh con',
    // 'bo' và 'me' trần trụi thì "bỏ dở giữa chừng" thành câu hỏi gia đạo —
    // đo được ngay khi vừa thêm. Phải đi kèm sở hữu mới đủ đặc trưng.
    'nuoi con', 'bo me toi', 'bo cua toi', 'me cua toi', 'bo minh', 'me minh',
    'ong ba', 'chuyen nha', 'ra o rieng',
    'song chung', 'cham soc bo me', 'thua ke', 'chia tai san',
  ],
  'suc-khoe': [
    'suc khoe', 'benh', 'benh tat', 'om', 'om dau', 'the trang', 'tinh than',
    'stress', 'met moi', 'mat ngu', 'tai nan', 'phau thuat', 'di kham',
    'kiet suc', 'burn out', 'burnout', 'tram cam', 'lo au', 'nghi ngoi',
    'tap luyen', 'an uong', 'nhip song', 'nang luong',
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

/**
 * Chữ báo rằng câu hỏi nhắm tới CẢ CHẶNG DÀI, không nhắm tới một năm.
 *
 * Không có nhóm này thì mọi câu có/không đều bị kéo về lưu niên, kể cả câu hỏi
 * về cả đời. Đo được trên câu thật: "sau này tôi có giàu có ko?" nhận về một
 * bài mở bằng "Năm 2026…".
 *
 * Cố ý KHÔNG có "lâu dài": nó hay đi với một mốc gần ("kế hoạch lâu dài cho năm
 * nay"), nên nó không phân biệt được hai hình câu hỏi.
 */
const TU_KHOA_CHANG_DAI = [
  'sau nay', 've sau', 'tuong lai', 've gia', 'cuoi doi', 'ca doi',
  'suot doi', 'doi toi', 'den gia', 'luc gia', 'nhung nam toi',
  'may nam toi', 'mai sau',
];

const TU_KHOA_HAN: [LopHan, string[]][] = [
  ['nguyet-han', ['thang nay', 'thang toi', 'thang sau', 'trong thang', 'nguyet han']],
  ['luu-nien', ['nam nay', 'nam toi', 'nam sau', 'trong nam', 'luu nien', 'tieu han']],
  ['dai-van', ['dai van', 'dai han', 'muoi nam', '10 nam', 'giai doan nay', 'nhung nam toi']],
  ['ban-menh', ['ca doi', 'suot doi', 'ban chat', 'tinh cach', 'ban menh', 'so phan']],
];

/**
 * Từ khoá nhận ý định. Cùng luật với TU_KHOA_CHU_DE: khớp theo TỪ, không theo
 * chuỗi con.
 *
 * 'tra-cuu' cố ý hẹp nhất: nó là ý định DUY NHẤT làm THU HẸP lớp hạn, nên nhận
 * nhầm ở đây đắt hơn hẳn nhận nhầm ở ba ý định kia. Ba ý định kia chỉ thêm lớp,
 * thêm thừa thì bài loãng một chút; nhận nhầm tra-cuu thì dữ kiện đại vận biến
 * mất khỏi prompt và không có gì báo.
 */
const TU_KHOA_Y_DINH: Record<Exclude<YDinh, 'mo-ta' | 'co-khong'>, string[]> = {
  'quyet-dinh': [
    'co nen', 'nen khong', 'co nen khong', 'nen hay', 'quyet dinh', 'lua chon',
    'co dang', 'dang khong', 'lieu co', 'co on khong', 'co hop ly',
    'dong y', 'tu choi', 'chot', 'nhan hay', 'di hay', 'o lai hay',
  ],
  'thoi-diem': [
    'khi nao', 'bao gio', 'luc nao', 'thoi diem', 'luc nay', 'hien gio',
    'sap toi', 'den bao gio', 'may tuoi', 'nam bao nhieu tuoi', 'dung luc',
    'co phai luc', 'thoi gian nao',
  ],
  'giai-thich': [
    'vi sao', 'tai sao', 'sao toi', 'sao lai', 'vi dau', 'do dau', 'ly do',
    'giai thich', 'nguyen nhan', 'sao ma',
  ],
  'tra-cuu': [
    'nghia la gi', 'la gi', 'la cach gi', 'co nghia', 'dinh nghia',
    'nghia the nao', 'giai nghia', 'y nghia', 'hieu the nao', 'doc the nao',
  ],
};

/**
 * Thứ tự phân xử khi nhiều ý định cùng chạm.
 *
 * "Năm nay tôi có nên đổi việc không" chạm cả quyet-dinh lẫn thoi-diem, và nếu
 * chấm bằng tổng độ dài từ khoá thì thoi-diem thắng vì cụm 'nam nay' dài hơn —
 * trong khi thứ người ta thật sự cần là một quyết định. Quyết định luôn đứng
 * trước: một câu "có nên" đã ngầm chứa "lúc này", chiều ngược lại thì không.
 */
const UU_TIEN_Y_DINH: Exclude<YDinh, 'mo-ta'>[] = [
  'quyet-dinh', 'co-khong', 'tra-cuu', 'giai-thich', 'thoi-diem',
];

/**
 * Câu hỏi có/không, nhận theo CẤU TRÚC chứ không theo từ khoá.
 *
 * Tiếng Việt hỏi có/không bằng cách đặt "không" (hay "chưa") ở CUỐI câu. Đó là
 * một dấu hiệu hình thức, chắc hơn mọi danh sách từ khoá — và không có cách nào
 * liệt kê hết động từ đứng giữa: chuyển việc, lấy chồng, mua nhà, hợp nghề…
 *
 * Phải xét VỊ TRÍ, không chỉ xét có mặt: "tôi không thích công việc hiện tại,
 * phải làm sao" cũng chứa "không" nhưng là câu kể, không phải câu hỏi có/không.
 * Ba từ cuối là đủ rộng để bắt "…được không", "…hay không".
 */
function laCauCoKhong(tu: string[]): boolean {
  return tu.slice(-3).some((t) => t === 'khong' || t === 'chua');
}

/** Tách câu đã bỏ dấu thành từ, sau khi chuẩn hoá viết tắt chat */
function tuCua(cauKhongDau: string): string[] {
  return cauKhongDau
    .replace(/\b(?:ko|kg|hok|khg)\b/g, 'khong')
    .replace(/\bdc\b/g, 'duoc')
    .replace(/\bntn\b/g, 'nhu the nao')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Mọi cụm 1–4 từ có trong câu, để so khớp theo ranh giới từ chứ không theo chuỗi con */
function cumTu(cauKhongDau: string): Set<string> {
  /*
   * Chuẩn hoá viết tắt trước khi tách từ.
   *
   * Người ta gõ "ko" nhiều hơn "không" trong chat. Không chuẩn hoá thì câu
   * "tôi nên nhận nó ko" mất hẳn dấu hiệu câu hỏi có/không, và nó rơi về
   * 'mo-ta' — đúng câu mà spec lấy làm ví dụ.
   */
  const daChuan = cauKhongDau
    .replace(/\b(?:ko|kg|hok|khg)\b/g, 'khong')
    .replace(/\bdc\b/g, 'duoc')
    .replace(/\bntn\b/g, 'nhu the nao');
  const tu = daChuan.split(/[^a-z0-9]+/).filter(Boolean);
  const ra = new Set<string>();
  const nap = (ds: string[]) => {
    for (let i = 0; i < ds.length; i++) {
      for (let n = 1; n <= 4 && i + n <= ds.length; n++) ra.add(ds.slice(i, i + n).join(' '));
    }
  };

  nap(tu);

  /*
   * Bộ cụm thứ hai, sau khi bỏ TỪ ĐỆM.
   *
   * Tiếng Việt hay chen một chữ vào giữa động từ và tân ngữ: "mua ĐƯỢC nhà",
   * "lấy ĐƯỢC chồng", "xin ĐƯỢC việc", "đổi SANG nghề". Bảng từ khoá thì viết
   * dạng gọn ('mua nha', 'lay chong'), nên câu thật không khớp — đo được:
   * "năm nay có mua được nhà ko" ra chủ đề 'tong-quan' thay vì 'tai-chinh'.
   *
   * Vá từng cụm một là đuổi không bao giờ hết. Bỏ hẳn nhóm từ đệm rồi ghép lại
   * là một luật, và nó phủ mọi động từ.
   */
  const khongDem = tu.filter((t) => !TU_DEM.has(t));
  if (khongDem.length !== tu.length) nap(khongDem);

  return ra;
}

/**
 * Từ đệm — bỏ ra khi dựng bộ cụm thứ hai.
 *
 * Cố ý ngắn và chỉ gồm những chữ KHÔNG BAO GIỜ là thứ cần tìm. Thêm một chữ có
 * nghĩa vào đây là làm hỏng cụm khác: bỏ "nhà" thì "mua nhà" thành "mua".
 */
const TU_DEM = new Set(['duoc', 'da', 'se', 'dang', 'bi', 'con', 'cung', 'van']);

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

/**
 * Đọc ý định từ câu hỏi.
 *
 * Ngoài bảng từ khoá còn một luật CẤU TRÚC: chữ "nên" đứng cạnh một dấu hiệu
 * câu hỏi có/không ("không") hoặc một dấu hiệu chọn lựa ("hay") thì đó là câu
 * quyết định, bất kể động từ theo sau là gì. Liệt kê hết động từ là việc không
 * bao giờ xong — "nên nhận", "nên đổi", "nên ở lại", "nên ký"… — mà cấu trúc
 * thì chỉ có một.
 */
function doanYDinh(cum: Set<string>, tu: string[]): YDinh {
  if (cum.has('nen') && (cum.has('khong') || cum.has('hay'))) return 'quyet-dinh';

  const diem = new Map<YDinh, number>();
  // Cấu trúc câu hỏi có/không tính như một từ khoá đã khớp, với trọng số đủ để
  // thắng các ý định đọc bằng từ khoá lẻ.
  if (laCauCoKhong(tu)) diem.set('co-khong', 20);
  for (const [y, tuKhoa] of Object.entries(TU_KHOA_Y_DINH) as [YDinh, string[]][]) {
    const d = tuKhoa.reduce((t, k) => (cum.has(k) ? t + k.length : t), 0);
    if (d > 0) diem.set(y, d);
  }
  if (diem.size === 0) return 'mo-ta';

  for (const y of UU_TIEN_Y_DINH) if (diem.has(y)) return y;
  return 'mo-ta';
}

function doanLopHan(cum: Set<string>, thucThe: ThucThe[], yDinh: YDinh): LopHan[] {
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

  /*
   * Ý định lái lớp hạn.
   *
   * Mọi câu "có nên" đều ngầm chứa "lúc này" — người ta không hỏi có nên nhận
   * offer trên lý thuyết, họ hỏi có nên nhận NÓ, BÂY GIỜ. Mà "bây giờ" trong
   * tử vi là đại vận cộng lưu niên. Không có luật này thì câu quyết định chỉ
   * đọc bản mệnh, và bài trả lời thành một bản mô tả tính cách.
   *
   * Chiều ngược lại: tra-cuu KHÔNG được kéo lưu niên vào. "Lộc Tồn ở Tài Bạch
   * nghĩa là gì" là câu hỏi về học thuyết, thêm lớp hạn chỉ làm loãng truy hồi.
   * Nhưng nếu người ta đã gọi tên một mốc thời gian thì tin họ, không tin nhãn
   * ý định — nên chỉ thu hẹp khi luật KHÔNG tìm thấy lớp hạn nào.
   */
  if (yDinh === 'quyet-dinh' || yDinh === 'co-khong' || yDinh === 'thoi-diem') {
    ra.add('dai-van');
    /*
     * ... TRỪ khi câu hỏi nói rõ nó hỏi về CẢ CHẶNG DÀI.
     *
     * "Sau này tôi có giàu có không" không hỏi về năm nay. Nhưng luật trên kéo
     * lưu niên vào mọi câu có/không, nên bài trả lời mở bằng "Năm 2026…" — trả
     * lời một câu người ta không hỏi, và bỏ qua đúng câu người ta hỏi.
     *
     * Hai hình câu hỏi này nằm chung một ý định mà cần hai lớp khác hẳn nhau:
     *   "năm nay có cưới được không"   → lưu niên, vì họ hỏi về một năm
     *   "sau này tôi có giàu có không" → đại vận và nền lá số, vì họ hỏi cả đời
     *
     * Thiếu phân biệt này thì câu hỏi về cả đời được trả lời bằng tiểu hạn của
     * một năm — mà tiểu hạn là thứ nói ít nhất về việc một người rồi sẽ ra sao.
     */
    if (!TU_KHOA_CHANG_DAI.some((t) => cum.has(t))) ra.add('luu-nien');
  } else if (yDinh === 'tra-cuu' && ra.size === 1) {
    return ['ban-menh'];
  }

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
  saoTheoCung: Record<string, string[]> | undefined,
  tenCachCuc?: string[]
): string {
  const phan: string[] = [cauHoi.trim()];

  // Cách cục đứng TRƯỚC danh sách cung: nó là chữ đặc trưng nhất trong cả truy
  // vấn, và embedding đọc phần đầu nặng hơn phần đuôi.
  if (tenCachCuc?.length) phan.push(`Cách cục: ${tenCachCuc.join(', ')}.`);

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
  /**
   * Tên cách cục đã nhận diện trên lá số này.
   *
   * Đây là nửa còn lại của giá trị lớp cách cục. Nhánh từ khoá tồn tại để bắt
   * ĐÚNG CHỮ, mà tên cách cục là chữ đặc trưng nhất có thể có: "Tử Phủ Vũ Tướng
   * Liêm" chỉ xuất hiện trong những đoạn sách nói đúng về nó, còn "Tử Vi" thì
   * xuất hiện ở khắp nơi.
   */
  tenCachCuc?: string[];
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
  cungLienQuan: string[],
  tenCachCuc?: string[]
): string {
  // Tên cách cục luôn vào, kể cả khi câu hỏi đã đủ đặc trưng: nhánh từ khoá
  // dùng ngữ nghĩa HOẶC, và đây là chuỗi hiếm nhất trong cả kho — nó không làm
  // loãng như tên cung, mà lại là thứ duy nhất trỏ thẳng vào đoạn sách nói về
  // đúng tổ hợp này.
  const rieng = [
    ...new Set([...(tenCachCuc ?? []), ...thucThe.map((t) => t.ten), ...tuDacTrung(cauHoi)]),
  ];
  // Ba từ trở lên là đủ đặc trưng để tự đứng một mình
  return (rieng.length >= 3 ? rieng : [...new Set([...rieng, ...cungLienQuan])]).join(' ');
}

/**
 * Cụm phải tìm nguyên văn, đi kèm `dungTruyVanTuKhoa` và theo đúng luật thêm
 * tên cung của nó — tên cung chỉ thành cụm khi nó có mặt trong truy vấn.
 */
function dungCumTuKhoa(
  cauHoi: string,
  thucThe: ThucThe[],
  cungLienQuan: string[],
  tenCachCuc?: string[]
): string[] {
  const rieng = [
    ...new Set([...(tenCachCuc ?? []), ...thucThe.map((t) => t.ten), ...tuDacTrung(cauHoi)]),
  ];
  const cung = rieng.length >= 3 ? [] : cungLienQuan;
  return [...new Set([...(tenCachCuc ?? []), ...cumVietHoa(cauHoi), ...thucThe.map((t) => t.ten), ...cung])];
}

/** Dựng kế hoạch từ một cặp (chủ đề, ý định) đã chốt — dùng chung cho luật và cho nhánh LLM */
function dungKeHoach(
  cauHoi: string,
  saoTheoCung: Record<string, string[]> | undefined,
  chuDe: ChuDe,
  yDinh: YDinh,
  chacChan: boolean,
  tenCachCuc?: string[],
  phanLoaiBangModel?: boolean
): KeHoachTruyVan {
  const cum = cumTu(boDau(cauHoi));
  const thucThe = nhanDangThucThe(cauHoi);
  const cungGoiTen = thucThe.filter((t) => t.loai === 'PALACE').map((t) => t.ten);
  const cungLienQuan = [...new Set([...cungGoiTen, ...CUNG_THEO_CHU_DE[chuDe]])];

  return {
    chuDe,
    yDinh,
    chacChan,
    ...(phanLoaiBangModel ? { phanLoaiBangModel: true } : {}),
    cungLienQuan,
    lopHan: doanLopHan(cum, thucThe, yDinh),
    thucThe,
    truyVan: vietLaiTruyVan(cauHoi, cungLienQuan, thucThe, saoTheoCung, tenCachCuc),
    truyVanTuKhoa: dungTruyVanTuKhoa(cauHoi, thucThe, cungLienQuan, tenCachCuc),
    cumTuKhoa: dungCumTuKhoa(cauHoi, thucThe, cungLienQuan, tenCachCuc),
    phienBan: PHIEN_BAN_PLANNER,
  };
}

/**
 * Lập kế hoạch bằng LUẬT. Đồng bộ, chạy offline, không bao giờ gọi model.
 *
 * Giữ đồng bộ là chủ ý: bộ eval và Retrieval Lab chạy hàng trăm lượt trên nó,
 * và một hàm đồng bộ thì không có cách nào lỡ tay gọi model trong vòng lặp.
 * Nhánh model nằm ở `lapKeHoachDayDu` bên dưới.
 */
export function lapKeHoach({ cauHoi, saoTheoCung, tenCachCuc }: DauVaoPlanner): KeHoachTruyVan {
  const cum = cumTu(boDau(cauHoi));
  const thucThe = nhanDangThucThe(cauHoi);

  // Cung gọi đích danh (kể cả qua bí danh như "công việc", "vợ chồng") là tín
  // hiệu mạnh nhất: nó nói thẳng người hỏi đang nhìn vào đâu. Chỉ khi không có
  // cung nào mới phải đoán chủ đề từ từ khoá.
  const cungGoiTen = thucThe.filter((t) => t.loai === 'PALACE').map((t) => t.ten);
  const theoTuKhoa = doanChuDe(cum);
  const chuDe = cungGoiTen.length ? (CHU_DE_THEO_CUNG[cungGoiTen[0]] ?? 'tong-quan') : theoTuKhoa.chuDe;

  return dungKeHoach(
    cauHoi,
    saoTheoCung,
    chuDe,
    doanYDinh(cum, tuCua(boDau(cauHoi))),
    theoTuKhoa.chacChan || cungGoiTen.length > 0,
    tenCachCuc
  );
}

// ------------------------------------------------ Nhánh phân loại bằng model

const CHU_DE_HOP_LE: ChuDe[] = [
  'su-nghiep', 'tai-chinh', 'tinh-cam', 'gia-dao', 'suc-khoe', 'tong-quan',
];
const Y_DINH_HOP_LE: YDinh[] = [
  'quyet-dinh', 'co-khong', 'thoi-diem', 'giai-thich', 'tra-cuu', 'mo-ta',
];

/** Chờ tối đa 8 giây. Phân loại là bước MỞ ĐẦU — nó chậm thì cả câu trả lời chậm theo. */
const HAN_CHO_MS = 8_000;

/**
 * Lập kế hoạch đầy đủ: luật trước, model chỉ khi luật bí.
 *
 * Bảng từ khoá không bao giờ phủ hết cách người ta gõ. Nhưng thay nó bằng model
 * thì mất tính tái lập và trả tiền cho mọi câu, kể cả câu mà luật trả lời đúng
 * trong một micro giây. Nên model chỉ được gọi khi `chacChan === false` — tức
 * là khi luật đã tự nhận nó không biết.
 *
 * Model hỏng, hết giờ, hay trả về giá trị ngoài danh sách thì dùng nguyên kết
 * quả của luật. Không có đường nào để một lượt phân loại hỏng làm hỏng câu trả
 * lời.
 */
export async function lapKeHoachDayDu(vao: DauVaoPlanner): Promise<KeHoachTruyVan> {
  const theoLuat = lapKeHoach(vao);
  if (theoLuat.chacChan) return theoLuat;

  try {
    const { goiVoiFallback } = await import('@/lib/ai/fallback');
    const system = `Bạn là bộ phân loại câu hỏi của một sản phẩm Tử Vi. Chỉ phân loại, KHÔNG trả lời câu hỏi.

chuDe — câu hỏi về lĩnh vực nào:
  su-nghiep · tai-chinh · tinh-cam · gia-dao · suc-khoe · tong-quan

yDinh — người hỏi cần gì:
  quyet-dinh  người hỏi đang phải chọn, cần tiêu chí để quyết
  co-khong    người hỏi muốn một nhận định có hay không
  thoi-diem   người hỏi muốn biết lúc nào
  giai-thich  người hỏi muốn hiểu vì sao
  tra-cuu     người hỏi muốn biết một thuật ngữ nghĩa là gì
  mo-ta       còn lại

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code, không giải thích:
{"chuDe": "...", "yDinh": "..."}`;

    const kq = await Promise.race([
      goiVoiFallback({ system, user: vao.cauHoi.slice(0, 400), maxTokens: 60 }),
      new Promise<null>((r) => setTimeout(() => r(null), HAN_CHO_MS)),
    ]);
    if (!kq) return theoLuat;

    const tho = docObjectJson(kq.text);
    const chuDe = tho?.chuDe as ChuDe | undefined;
    const yDinh = tho?.yDinh as YDinh | undefined;
    if (!chuDe || !CHU_DE_HOP_LE.includes(chuDe)) return theoLuat;

    return dungKeHoach(
      vao.cauHoi,
      vao.saoTheoCung,
      chuDe,
      yDinh && Y_DINH_HOP_LE.includes(yDinh) ? yDinh : theoLuat.yDinh,
      true,
      vao.tenCachCuc,
      true
    );
  } catch (e) {
    console.warn('[planner] phân loại bằng model hỏng:', e instanceof Error ? e.message : e);
    return theoLuat;
  }
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
