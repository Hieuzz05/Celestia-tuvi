import { boDau } from './thuc-the';

/**
 * Lớp an toàn cho chat — TẤT ĐỊNH, không gọi model.
 *
 * ---------------------------------------------------------------------------
 * HAI THỨ KHÁC NHAU, ĐỪNG GỘP
 *
 * `QuyetDinhAnToan` quyết ĐƯỜNG ĐI: có được luận lá số nữa không.
 * `LopPhuAnToan`   quyết CÁCH TRÌNH BÀY khi vẫn được luận tiếp.
 *
 * Gộp hai thứ này thành một "overlay" là cái sai đã suýt mắc: với người đang
 * nói chuyện tự hại, một overlay về giọng nghĩa là vẫn luận Tử Vi tám trăm chữ
 * rồi nối một câu miễn trừ vào cuối. Đó không phải lớp an toàn, đó là lớp
 * phòng vệ pháp lý, và người nhận đọc ra đúng như vậy.
 *
 *   CRITICAL  → chặn đường, trả lời an toàn ngắn, KHÔNG luận      (control flow)
 *   SENSITIVE → vẫn luận, nhưng tắt đùa và bảo đảm lời miễn trừ   (presentation)
 *   NORMAL    → chạy bình thường
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO KHÔNG DÙNG MODEL ĐỂ PHÂN LOẠI
 *
 * Ngân sách = 0 là luật cốt lõi của dự án. Nhưng còn một lý do nặng hơn: lớp
 * này phải chạy TRƯỚC khi trừ hạn mức và trước mọi lượt gọi nhà cung cấp. Một
 * người đang khủng hoảng không được phép mất một trong năm câu hỏi miễn phí
 * của ngày để nhận về một lời nhắn an toàn, và càng không được gặp cổng "hết
 * lượt" ở đúng lúc đó. Phân loại bằng model thì chính nó là một lượt gọi.
 *
 * ---------------------------------------------------------------------------
 * KHỚP THEO TỪ, KHÔNG THEO CHUỖI CON
 *
 * `docs/bay/ai-rag.md` ghi lại hai lần đã trả giá: "thiên cơ" bắt nhầm sao
 * Thiên Cơ, "không hợp" bắt nhầm "không hợp lý". Ở đây cái giá cao hơn nhiều —
 * bắt nhầm là chặn một câu hỏi bình thường và nói với người ta những lời chỉ
 * nên nói khi thật sự cần; bỏ sót là bỏ sót đúng lúc cần nhất.
 *
 * Nên mọi phép khớp đi qua ranh giới từ trên chuỗi ĐÃ BỎ DẤU, và có ba lớp:
 *
 *   1. CỤM NGUY CƠ   — thứ đáng chú ý nếu xuất hiện
 *   2. LOẠI TRỪ      — phủ định, trích dẫn, ngôi thứ ba, quá khứ, giả định,
 *                      và nghĩa bóng (thứ nuốt nhiều dương tính giả nhất)
 *   3. DẤU HIỆU GẤP  — ý định, kế hoạch, phương tiện, mốc thời gian gần
 *
 * Lớp 1 một mình chỉ ra SENSITIVE. Phải có thêm lớp 3, hoặc một cụm thuộc
 * nhóm nguy cơ tức thời, mới lên CRITICAL.
 */

/** Mức nghiêm trọng — quyết cả đường đi lẫn cách trình bày */
export type MucAnToan = 'NORMAL' | 'SENSITIVE' | 'CRITICAL';

/** Chủ đề nhạy cảm đã nhận ra; `null` khi NORMAL */
export type ChuDeAnToan = 'tu-hai' | 'bao-luc' | 'suc-khoe-nguy-cap' | 'khung-hoang-tam-ly';

export interface QuyetDinhAnToan {
  muc: MucAnToan;
  chuDe: ChuDeAnToan | null;
  /** Cụm đã khớp — để ghi vết và để bài kiểm chỉ đúng chỗ sai */
  cumKhop: string[];
}

/* ========================================================================== */
/* LỚP 1 — CỤM NGUY CƠ                                                        */
/* ========================================================================== */

/**
 * Viết KHÔNG DẤU vì mọi phép so đều chạy trên chuỗi đã qua `boDau`.
 *
 * Cố ý KHÔNG dài. Một danh sách dài không làm lớp này tốt hơn — bộ kiểm mới
 * làm. Mỗi cụm thêm vào phải kèm ít nhất một ca thật trong `test-an-toan.ts`,
 * cả ca bắt đúng lẫn ca KHÔNG được bắt.
 */
const CUM_NGUY_CO: { cum: string[]; chuDe: ChuDeAnToan; tucThi: boolean }[] = [
  {
    chuDe: 'tu-hai',
    // `tucThi`: tự nó đã đủ nặng để lên CRITICAL khi không bị loại trừ
    tucThi: true,
    cum: [
      'tu tu',
      'tu sat',
      'tu ket lieu',
      'ket lieu doi minh',
      'ket lieu cuoc doi',
      'khong muon song nua',
      'khong con muon song',
      'muon chet',
      'chet quach cho xong',
      'bien mat khoi the gioi nay',
      'tu lam hai ban than',
      'tu lam dau ban than',
      'rach tay',
      'cat tay',
    ],
  },
  {
    chuDe: 'bao-luc',
    tucThi: true,
    cum: ['giet nguoi', 'giet no', 'lam hai nguoi khac', 'danh chet', 'tra thu bang bao luc'],
  },
  {
    chuDe: 'suc-khoe-nguy-cap',
    tucThi: false,
    cum: ['uong thuoc qua lieu', 'qua lieu thuoc', 'ngo doc', 'kho tho du doi', 'dau nguc du doi'],
  },
  {
    chuDe: 'khung-hoang-tam-ly',
    tucThi: false,
    cum: [
      'tuyet vong',
      'be tac hoan toan',
      'khong con loi thoat',
      'tram cam nang',
      'roi loan lo au',
      'khong ai can minh',
      'song khong con y nghia',
    ],
  },
];

/* ========================================================================== */
/* LỚP 2 — LOẠI TRỪ                                                           */
/* ========================================================================== */

/**
 * Phủ định đứng TRƯỚC cụm nguy cơ trong cùng một câu.
 *
 * "Tôi không có ý định tự tử" không được xếp cùng "Tôi đang định tự tử tối
 * nay". Đây là ca mà một bộ khớp từ khoá trần trụi luôn luôn làm sai, và cũng
 * là ca `docs/bay/ai-rag.md` đã dặn: câu miễn trừ "không phải một sự việc chắc
 * chắn sẽ xảy ra" chứa đúng cụm bị cấm nhưng đang nói ngược lại.
 */
const PHU_DINH = [
  'khong co y dinh',
  'khong he nghi den',
  'khong nghi den',
  'khong bao gio',
  'chua bao gio',
  'khong muon',
  'khong phai',
  'dau co',
  'chang he',
  'khong con nghi den',
];

/**
 * Ngữ cảnh làm cụm nguy cơ KHÔNG nói về chính người đang hỏi, ngay lúc này.
 *
 * Bốn nhóm, và nhóm cuối là nhóm nuốt nhiều dương tính giả nhất: tiếng Việt
 * đời thường dùng "chết" làm từ nhấn mạnh ("chết cười", "mệt chết đi được"),
 * và một lớp an toàn bắt những câu đó sẽ nhanh chóng bị người dùng ghét.
 */
const LOAI_TRU = [
  // nghiên cứu, học thuật, trích dẫn
  'nghien cuu ve',
  'tim hieu ve',
  'doc bai bao',
  'xem phim',
  'trong truyen',
  'bai hat',
  'nhan vat',
  // ngôi thứ ba
  'ban toi',
  'ban cua toi',
  'nguoi quen',
  'dong nghiep',
  'mot nguoi',
  'anh ay',
  'chi ay',
  'co ay',
  'em ay',
  // quá khứ đã qua, đã vượt qua
  'hoi do',
  'ngay xua',
  'nhieu nam truoc',
  'da vuot qua',
  'da on hon',
  'gio thi on',
  // giả định
  'neu nhu',
  'gia su',
  'lo nhu',
  // nghĩa bóng / nói quá
  'chet cuoi',
  'chet di duoc',
  'buon chet',
  'chan chet',
  'met chet',
  'dep chet',
  'thuong chet',
];

/* ========================================================================== */
/* LỚP 3 — DẤU HIỆU GẤP                                                       */
/* ========================================================================== */

/**
 * Ý định, kế hoạch, phương tiện, hoặc mốc thời gian gần.
 *
 * Đây là thứ phân biệt "tôi thấy cuộc sống vô nghĩa" (SENSITIVE — cần nói
 * chuyện tử tế, không cần chặn) với "tối nay tôi sẽ làm" (CRITICAL — chặn).
 */
const DAU_HIEU_GAP = [
  'toi nay',
  'dem nay',
  'hom nay',
  'ngay mai',
  'bay gio',
  'ngay bay gio',
  'luc nay',
  'sap',
  'se lam',
  'da chuan bi',
  'chuan bi san',
  'da len ke hoach',
  'ke hoach',
  'cach de',
  'cach nao de',
  'lam the nao de',
  'da viet thu',
  'thu tuyet menh',
  'da quyet dinh',
];

/* ========================================================================== */
/* PHÉP KHỚP                                                                  */
/* ========================================================================== */

/**
 * Khớp theo RANH GIỚI TỪ trên chuỗi đã bỏ dấu.
 *
 * `includes` trần trụi là chỗ hỏng: "tu tu" nằm trong "tu tuc" (Tử Tức — một
 * cung trên lá số, người ta hỏi về con cái suốt). Đệm hai đầu bằng dấu cách
 * rồi tìm cụm có dấu cách bao quanh là xong, không cần biểu thức chính quy.
 */
function coCum(khongDau: string, cum: string): boolean {
  // `boDau` bỏ dấu thanh và hạ chữ thường, nhưng GIỮ NGUYÊN dấu câu. Nên
  // "tôi muốn chết." thành "toi muon chet." — và tìm " muon chet " trong đó thì
  // trượt, vì dấu chấm dính ngay sau "chet". Đổi mọi thứ không phải chữ/số
  // thành dấu cách trước khi so, nếu không thì mỗi câu kết thúc bằng dấu chấm
  // là một lần bỏ sót, lặng lẽ, đúng ở nhánh không được phép bỏ sót.
  const chuan = ` ${khongDau.replace(/[^a-z0-9]+/g, ' ').trim()} `;
  return chuan.includes(` ${cum} `);
}

/** Tách câu thô — đủ để biết phủ định có đứng cùng câu với cụm nguy cơ không */
function tachCau(s: string): string[] {
  return s
    .split(/[.!?;\n]+/)
    .map((c) => c.trim())
    .filter(Boolean);
}

/**
 * Đọc một tin nhắn, trả về quyết định an toàn.
 *
 * Chỉ nhìn tin nhắn HIỆN TẠI. Quét cả lịch sử hội thoại nghe có vẻ cẩn thận
 * hơn, nhưng nó biến một câu đã nói xong từ ba tuần trước thành cái chặn mọi
 * câu hỏi sau đó — và người dùng không hiểu vì sao Celes đột nhiên không luận
 * nữa. Lịch sử là việc của Phase 4, khi đã có `H###` để biết điều gì còn hiệu
 * lực.
 */
export function doAnToan(cauHoi: string): QuyetDinhAnToan {
  const toanBo = boDau(cauHoi);
  const cau = tachCau(toanBo);

  const khop: string[] = [];
  let chuDe: ChuDeAnToan | null = null;
  let coTucThi = false;

  for (const nhom of CUM_NGUY_CO) {
    for (const c of nhom.cum) {
      // Câu nào chứa cụm này? Phủ định và loại trừ chỉ tính TRONG CÙNG CÂU —
      // "Bạn tôi từng tự tử. Tôi muốn chết." là hai câu, câu sau không được
      // miễn nhờ ngữ cảnh của câu trước.
      const cauChua = cau.filter((x) => coCum(x, c));
      if (!cauChua.length) continue;

      /*
       * Phủ định nằm BÊN TRONG chính cụm nguy cơ thì không phải phủ định.
       *
       * "khong muon song nua" bắt đầu bằng "khong muon", mà "khong muon" lại
       * nằm trong danh sách phủ định. Để nguyên thì cụm tự huỷ chính nó, và
       * "Tôi không muốn sống nữa" — câu nói thẳng nhất có thể — rơi về NORMAL.
       * Bộ kiểm bắt đúng ca này; nếu không có nó thì lỗi đã đi vào production
       * và chỉ lộ ra khi có người thật gõ đúng câu đó.
       *
       * Nên chỉ xét phủ định ở phần câu NGOÀI cụm đã khớp.
       */
      const conHieuLuc = cauChua.some((x) => {
        const ngoai = x.replace(/[^a-z0-9]+/g, ' ').split(` ${c} `).join(' ');
        return !PHU_DINH.some((p) => coCum(ngoai, p)) && !LOAI_TRU.some((l) => coCum(ngoai, l));
      });
      if (!conHieuLuc) continue;

      khop.push(c);
      if (!chuDe) chuDe = nhom.chuDe;
      if (nhom.tucThi) coTucThi = true;
    }
  }

  if (!khop.length) return { muc: 'NORMAL', chuDe: null, cumKhop: [] };

  const gap = DAU_HIEU_GAP.filter((d) => coCum(toanBo, d));

  /*
   * CRITICAL cần hai điều, không phải một.
   *
   * Nhóm `tucThi` (tự hại, bạo lực) tự nó đã đủ: ai gõ thẳng "tôi muốn chết"
   * thì không cần thêm bằng chứng nào nữa. Các nhóm còn lại — tuyệt vọng, bế
   * tắc, trầm cảm — chỉ lên CRITICAL khi đi kèm dấu hiệu gấp. Người nói "mình
   * thấy bế tắc quá" cần được nói chuyện tử tế, không cần bị chặn.
   */
  const muc: MucAnToan = coTucThi || gap.length ? 'CRITICAL' : 'SENSITIVE';

  return { muc, chuDe, cumKhop: [...khop, ...gap] };
}

/* ========================================================================== */
/* CÂU TRẢ LỜI CHO NHÁNH CRITICAL — HẰNG, KHÔNG QUA MODEL                     */
/* ========================================================================== */

/**
 * Số khẩn cấp: chốt 02/10/2026 sau khi chủ dự án tự tra nguồn.
 *
 * **115** — cấp cứu y tế, dùng cho tình huống nguy hiểm TỨC THÌ. Các văn bản
 * Chính phủ hiện vẫn xác định 113/114/115 là số khẩn cấp đang hoạt động.
 *
 * **111** — Tổng đài Quốc gia Bảo vệ Trẻ em, 24/7, có tư vấn tâm lý và hỗ trợ
 * khẩn cấp cho trẻ em.
 *
 * CỐ Ý KHÔNG hardcode một "đường dây nóng tự sát" cho người lớn: chưa có nguồn
 * chính thức chuyên biệt nào mô tả một số toàn quốc đúng chức năng đó. Một vài
 * bệnh viện có công bố tổng đài tư vấn, nhưng trang của họ không gọi đó là
 * đường dây khủng hoảng toàn quốc. Quảng bá sai chức năng một số điện thoại
 * trong đúng tình huống này là loại lỗi không sửa lại được — nên thà chỉ tới
 * cấp cứu và người thật bên cạnh.
 */
export const SO_KHAN_CAP = { capCuu: '115', treEm: '111' } as const;

/**
 * Lời nhắn cho nhánh CRITICAL — do MÃ đặt, không do model sinh.
 *
 * Cùng lý do với `MIEN_TRU_Y_TE` ở `lib/rag/ban-doc-sau.ts`: một ràng buộc an
 * toàn không được đặt vào tay thứ không tất định. Ở đây lý do còn nặng hơn —
 * nhánh này tồn tại ĐỂ KHÔNG gọi model.
 *
 * Ngắn, cố ý. Người đang ở trong tình huống đó không đọc một bài dài. Không
 * mở bằng lời rào trách nhiệm, không giảng giải, không hỏi thêm dữ kiện.
 *
 * CÂU ĐẦU GHI NHẬN NGƯỜI ĐỌC, KHÔNG PHẢI TỪ CHỐI HỌ (sửa 02/10/2026 sau soát
 * chữ). Bản đầu mở bằng "Mình sẽ không luận lá số ở tình huống này" — đúng về
 * nội dung, nhưng câu đầu là câu được đọc kỹ nhất, và mở bằng một lời từ chối
 * thì nó đọc như hệ thống chặn yêu cầu. Người vừa nói ra điều khó nói nhất cần
 * được nghe thấy trước khi được chỉ việc phải làm.
 *
 * Cũng bỏ chữ "chuyên khoa tâm thần": nặng, dễ gây kỳ thị, và quá lâm sàng với
 * người đang hoảng. "Bác sĩ hoặc chuyên gia tâm lý" nói đúng chừng ấy việc mà
 * không dán nhãn lên người đọc.
 *
 * Dòng 111 GỘP THẲNG vào lời nhắn, không để riêng một hằng chờ ai đó nối vào:
 * hệ thống không biết tuổi người hỏi, nên một hằng `LOI_NHAN_TRE_EM` chỉ dùng
 * "khi biết người hỏi dưới 16 tuổi" là một hằng không bao giờ được dùng. Câu
 * điều kiện "Nếu bạn dưới 16 tuổi" để chính người đọc tự áp vào mình.
 */
export const LOI_NHAN_KHAN_CAP = [
  `Mình nghe thấy bạn đang rất khó khăn, và mình lo cho bạn. Mình dừng việc xem lá số lại ở đây, vì điều quan trọng nhất lúc này là bạn được an toàn.`,
  `Nếu bạn đang có ý định làm hại bản thân, hoặc thấy mình không an toàn ngay lúc này, hãy gọi **${SO_KHAN_CAP.capCuu}** hoặc đến cơ sở cấp cứu gần nhất. Nếu bạn dưới 16 tuổi, Tổng đài Quốc gia Bảo vệ Trẻ em **${SO_KHAN_CAP.treEm}** nghe máy 24/7.`,
  `Nếu có thể, hãy ở cùng một người bạn tin tưởng và nói thẳng với họ rằng bạn đang không an toàn. Khi đã bớt gấp hơn, một bác sĩ hoặc chuyên gia tâm lý sẽ đồng hành với bạn được lâu hơn mình.`,
  `Mình vẫn ở đây. Khi bạn thấy an toàn hơn, mình sẽ nói chuyện tiếp với bạn về bất cứ điều gì bạn muốn.`,
].join('\n\n');

/* ========================================================================== */
/* LỜI MIỄN TRỪ CHO NHÁNH SENSITIVE                                           */
/* ========================================================================== */

/**
 * Nối vào CUỐI bài, sau mọi lớp sửa chữ.
 *
 * Khuôn mẫu lấy đúng từ `datMienTruYTe` (`ban-doc-sau.ts:951`): hằng trong mã,
 * dò xem đã có chưa, nối vào nếu chưa. Và nối SAU CÙNG — tiền lệ gọi nó ở
 * `ban-doc-sau.ts:792`, tức sau các lớp sửa, không phải giữa chừng.
 *
 * Hiện `suaCauTiengLong` chỉ viết lại câu khớp regex tiếng lóng nên một câu
 * miễn trừ đặt trước nó vẫn đi qua nguyên vẹn. Nhưng dựa vào việc một biểu
 * thức chính quy tiếp tục không khớp là một bảo đảm mỏng, và nó không mua lại
 * được gì cả.
 */
const MIEN_TRU_TAM_LY =
  'Lá số nói về xu hướng, không thay thế người có chuyên môn. Nếu điều này kéo dài và làm bạn mệt, một chuyên gia tâm lý sẽ giúp được nhiều hơn một lá số.';

/** Đã có sẵn lời miễn trừ chưa — nhận cả những cách nói khác nhau của model */
function daCoMienTru(van: string): boolean {
  const s = boDau(van);
  return (
    s.includes('chuyen gia tam ly') ||
    s.includes('nguoi co chuyen mon') ||
    s.includes('khong thay the')
  );
}

/**
 * Bảo đảm bài SENSITIVE có lời miễn trừ tâm lý.
 *
 * Trả về văn đã nối; `NORMAL`/`CRITICAL` không đi qua đây (`CRITICAL` không có
 * bài nào để nối vào).
 */
export function datMienTruTamLy(van: string): string {
  if (daCoMienTru(van)) return van;
  return `${van.trim()}\n\n${MIEN_TRU_TAM_LY}`;
}
