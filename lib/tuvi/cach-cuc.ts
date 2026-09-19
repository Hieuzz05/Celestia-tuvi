import { tamPhuongTuChinh, type Cung, type LaSo } from './ansao';

/**
 * Nhận diện CÁCH CỤC — engine tất định, không gọi model.
 *
 * Vì sao phải có lớp này. Bối cảnh lá số trước đây chỉ sinh ra dữ kiện dạng
 * "Cung Quan Lộc (Dần) có Thiên Tướng (miếu); phụ tinh Tả Phù" — tức là một
 * DANH SÁCH SAO RỜI. Trong khi chuẩn ngôn ngữ lại cấm luận từ sao đơn lẻ. Hai
 * luật ấy cộng lại đẩy model vào chỗ duy nhất còn lại: nói trừu tượng. Đó mới
 * là gốc của việc bài đọc "đúng nhưng nhạt" — không phải do prompt viết chưa đủ
 * hay.
 *
 * Cách cục là đơn vị luận điểm thật của Tử Vi: một tổ hợp CÓ TÊN, có nghĩa đã
 * được sách chốt, và khác nhau giữa hai lá số. Bộ vàng đã ghi đúng rủi ro của
 * việc thiếu nó (`bo-vang-rag.ts`): "một cách cục có tên riêng; model không có
 * sách thường bịa nghĩa từ tên sao".
 *
 * Hai luật viết ở đây, không được nới:
 *
 *  1. **Đủ điều kiện mới phát.** Không có mức "gần đủ", không có "tương đối".
 *     Một cách cục phát ra nhầm thì model sẽ luận nguyên một đoạn trên nền sai,
 *     và không lớp nào phía sau bắt được — validator chỉ kiểm tên cách cục CÓ
 *     nằm trong danh sách này hay không, nó không kiểm danh sách này đúng chưa.
 *  2. **`dieuKien` phải nêu rõ vì sao thoả**, đủ để đứng một mình trong prompt.
 *     Model đọc câu đó rồi dịch sang đời sống; câu mập mờ thì bản dịch cũng mập
 *     mờ theo.
 *
 * Cách cục `loai: 'han'` được phát ra ở đây như mọi cách cục khác. Việc lọc
 * theo lớp hạn là của lớp gọi (`lib/rag/boi-canh-la-so.ts`) — giữ tệp này thuần
 * engine thì bộ test chạy được offline mà không cần dựng một kế hoạch truy vấn.
 */

export const PHIEN_BAN_CACH_CUC = '2026.09.1';

export interface CachCuc {
  /** Mã ổn định, dùng cho trace và bộ vàng: 'TU_PHU_VU_TUONG_LIEM' */
  ma: string;
  /** Tên hiển thị được phép nêu trong bài: 'Tử Phủ Vũ Tướng Liêm' */
  ten: string;
  /** Cung mà cách cục này đóng tại */
  cung: string;
  /** Điều kiện ĐÃ THOẢ, viết đủ để đứng một mình trong prompt */
  dieuKien: string;
  /** Sao tạo nên nó — validator dùng để đối chiếu */
  sao: string[];
  /** 'chinh' = bộ chính tinh, 'phu' = bộ phụ tinh, 'han' = chỉ có nghĩa theo lớp hạn */
  loai: 'chinh' | 'phu' | 'han';
}

// ---------------------------------------------------------------- tiện ích

/** Độ sáng đủ để sao thể hiện được nét của nó */
const SANG_RO = new Set(['M', 'V', 'D']);

interface PhamVi {
  /** Cung gốc đang xét */
  goc: Cung;
  /** Cung gốc + hai cung tam hợp + cung xung chiếu */
  bon: Cung[];
  /** Tên sao → cung nó đang đóng, trong phạm vi bốn cung trên */
  sao: Map<string, Cung>;
}

function dungPhamVi(laSo: LaSo, goc: Cung): PhamVi {
  const { tamHop, xungChieu } = tamPhuongTuChinh(goc.chiIndex);
  const chi = new Set([goc.chiIndex, ...tamHop, xungChieu]);
  const bon = laSo.cungs.filter((c) => chi.has(c.chiIndex));

  const sao = new Map<string, Cung>();
  for (const c of bon) for (const s of c.sao) if (!sao.has(s.ten)) sao.set(s.ten, c);

  return { goc, bon, sao };
}

/** Đủ CẢ danh sách hay không — không có mức "gần đủ" */
function duCa(pv: PhamVi, ten: string[]): boolean {
  return ten.every((t) => pv.sao.has(t));
}

/** Mô tả "sao X tại cung Y" cho từng sao, để câu điều kiện tự đứng được */
function viTri(pv: PhamVi, ten: string[]): string {
  return ten.map((t) => `${t} tại ${pv.sao.get(t)!.tenCung} (${pv.sao.get(t)!.chi})`).join(', ');
}

function doSang(pv: PhamVi, ten: string): string | null | undefined {
  const c = pv.sao.get(ten);
  return c?.sao.find((s) => s.ten === ten)?.doSang;
}

function nhan(pv: PhamVi): string {
  return `${pv.goc.tenCung} (${pv.goc.chi})`;
}

// ---------------------------------------------------------------- bộ chính tinh

/**
 * Bốn bộ chính tinh — cách chia kinh điển của Nam phái.
 *
 * Mười bốn chính tinh được an theo một trật tự cố định, nên tam phương tứ chính
 * của bất kỳ cung nào cũng chỉ gặp được một vài tổ hợp nhất định. Bốn bộ dưới
 * đây chia trọn 14 sao (5 + 3 + 4 + 2) và là đơn vị mà sách luận, chứ không ai
 * luận từng sao một.
 */
const BO_CHINH_TINH: { ma: string; ten: string; sao: string[]; net: string }[] = [
  {
    ma: 'TU_PHU_VU_TUONG_LIEM',
    ten: 'Tử Phủ Vũ Tướng Liêm',
    sao: ['Tử Vi', 'Thiên Phủ', 'Vũ Khúc', 'Thiên Tướng', 'Liêm Trinh'],
    net: 'bộ sao của trật tự và tích luỹ — hợp với việc dựng nền lâu dài hơn là bứt phá nhanh',
  },
  {
    ma: 'SAT_PHA_THAM',
    ten: 'Sát Phá Tham',
    sao: ['Thất Sát', 'Phá Quân', 'Tham Lang'],
    net: 'bộ sao của thay đổi và mở rộng — mạnh ở khúc quanh, yếu ở giai đoạn phải giữ nguyên',
  },
  {
    ma: 'CO_NGUYET_DONG_LUONG',
    ten: 'Cơ Nguyệt Đồng Lương',
    sao: ['Thiên Cơ', 'Thái Âm', 'Thiên Đồng', 'Thiên Lương'],
    net: 'bộ sao của tham mưu và chăm lo — mạnh ở việc cần tinh tế, yếu ở việc cần tranh giành',
  },
  {
    ma: 'CU_NHAT',
    ten: 'Cự Nhật',
    sao: ['Cự Môn', 'Thái Dương'],
    net: 'bộ sao của lời nói và sự minh bạch — sống bằng tiếng nói, cũng vướng vì tiếng nói',
  },
];

function boChinhTinh(pv: PhamVi): CachCuc[] {
  const ra: CachCuc[] = [];
  for (const b of BO_CHINH_TINH) {
    if (!duCa(pv, b.sao)) continue;
    ra.push({
      ma: b.ma,
      ten: b.ten,
      cung: pv.goc.tenCung,
      dieuKien: `${b.sao.join(', ')} cùng nằm trên tam phương tứ chính của ${nhan(pv)}: ${viTri(pv, b.sao)}. Đây là ${b.net}.`,
      sao: b.sao,
      loai: 'chinh',
    });
  }
  return ra;
}

// ---------------------------------------------------------------- Nhật Nguyệt

/**
 * Nhật Nguyệt tịnh minh / hãm.
 *
 * Thái Dương và Thái Âm là cặp duy nhất mà ĐỘ SÁNG quyết định nghĩa nhiều hơn
 * vị trí: cùng một cặp sao, cùng sáng thì là cách tốt vào bậc nhất, cùng hãm
 * thì ngược hẳn. Nên hai luật này đọc doSang chứ không đọc chi.
 */
function nhatNguyet(pv: PhamVi): CachCuc[] {
  if (!duCa(pv, ['Thái Dương', 'Thái Âm'])) return [];

  const sD = doSang(pv, 'Thái Dương');
  const sA = doSang(pv, 'Thái Âm');
  const viT = viTri(pv, ['Thái Dương', 'Thái Âm']);

  if (sD && sA && SANG_RO.has(sD) && SANG_RO.has(sA)) {
    return [{
      ma: 'NHAT_NGUYET_TINH_MINH',
      ten: 'Nhật Nguyệt tịnh minh',
      cung: pv.goc.tenCung,
      dieuKien: `Thái Dương và Thái Âm cùng chiếu ${nhan(pv)} và cả hai đều sáng (${viT}; độ sáng ${sD} và ${sA}). Cặp này sáng cùng lúc là cách hiếm — nó cho cả mặt bộc lộ ra ngoài lẫn mặt thu vào bên trong đều dùng được.`,
      sao: ['Thái Dương', 'Thái Âm'],
      loai: 'chinh',
    }];
  }

  if (sD === 'H' && sA === 'H') {
    return [{
      ma: 'NHAT_NGUYET_HAM',
      ten: 'Nhật Nguyệt hãm',
      cung: pv.goc.tenCung,
      dieuKien: `Thái Dương và Thái Âm cùng chiếu ${nhan(pv)} nhưng cả hai đều hãm địa (${viT}). Sức của cặp này bị kìm, nên nét của nó thường phải qua một quãng mới hiện ra được.`,
      sao: ['Thái Dương', 'Thái Âm'],
      loai: 'chinh',
    }];
  }

  return [];
}

// ---------------------------------------------------------------- bộ phụ tinh

/**
 * Các bộ phụ tinh đi thành cặp hoặc thành nhóm.
 *
 * Phụ tinh lẻ hầu như không đổi được cách đọc một cung; chúng chỉ có trọng
 * lượng khi đi đủ bộ. Đó cũng là lý do bảng này không liệt kê từng sao một.
 */
const BO_PHU_TINH: { ma: string; ten: string; sao: string[]; net: string }[] = [
  {
    ma: 'HINH_TUONG_AN',
    ten: 'Hình Tướng Ấn',
    sao: ['Thiên Hình', 'Thiên Tướng', 'Quốc Ấn'],
    net: 'bộ của kỷ luật và thẩm quyền — hợp việc có quy tắc rõ, vướng ở việc phải tuỳ cơ',
  },
  {
    ma: 'KHOI_VIET',
    ten: 'Khôi Việt',
    sao: ['Thiên Khôi', 'Thiên Việt'],
    net: 'bộ của người đỡ đầu — cơ hội hay đến qua một người đứng cao hơn, không đến từ việc tự xoay',
  },
  {
    ma: 'XUONG_KHUC',
    ten: 'Xương Khúc',
    sao: ['Văn Xương', 'Văn Khúc'],
    net: 'bộ của chữ nghĩa và diễn đạt — mạnh ở việc phải trình bày, dễ sa vào cầu toàn câu chữ',
  },
  {
    ma: 'TA_HUU',
    ten: 'Tả Hữu',
    sao: ['Tả Phù', 'Hữu Bật'],
    net: 'bộ của người phụ tá — việc chạy được nhờ có người bên cạnh, làm một mình thì đuối',
  },
  {
    ma: 'SONG_LOC',
    ten: 'Song Lộc',
    sao: ['Lộc Tồn', 'Hóa Lộc'],
    net: 'hai nguồn lộc cùng tụ — nguồn lực đến từ hai đường khác nhau, nhưng dễ giữ không kịp',
  },
  {
    ma: 'KHOC_HU',
    ten: 'Khốc Hư',
    sao: ['Thiên Khốc', 'Thiên Hư'],
    net: 'bộ của nỗi trống — hay thấy thiếu ngay cả lúc đủ, và điều đó thành động lực lẫn thành gánh',
  },
  {
    ma: 'KHONG_KIEP',
    ten: 'Không Kiếp',
    sao: ['Địa Không', 'Địa Kiếp'],
    net: 'bộ của mất và làm lại — thứ dựng lên dễ tan, nhưng chịu được thì lần sau dựng nhanh hơn',
  },
  {
    ma: 'KINH_DA',
    ten: 'Kình Đà',
    sao: ['Kình Dương', 'Đà La'],
    net: 'hai sát tinh cùng hội — việc hay bị cản và bị kéo dài, nhưng sức chịu va cũng dày hơn người',
  },
  {
    ma: 'HOA_LINH',
    ten: 'Hoả Linh',
    sao: ['Hỏa Tinh', 'Linh Tinh'],
    net: 'bộ của nóng và gấp — phản ứng nhanh hơn người, cũng hay phải sửa lại cái vừa làm',
  },
  {
    ma: 'DAO_HONG',
    ten: 'Đào Hồng',
    sao: ['Đào Hoa', 'Hồng Loan'],
    net: 'bộ của duyên và sức hút — dễ được để ý, cũng dễ vướng vào chuyện không định vướng',
  },
  {
    ma: 'LONG_PHUONG',
    ten: 'Long Phượng',
    sao: ['Long Trì', 'Phượng Các'],
    net: 'bộ của tài khéo và thẩm mỹ — việc có hình có nét thì làm tốt, việc thô ráp thì chán',
  },
];

function boPhuTinh(pv: PhamVi): CachCuc[] {
  const ra: CachCuc[] = [];
  for (const b of BO_PHU_TINH) {
    if (!duCa(pv, b.sao)) continue;
    ra.push({
      ma: b.ma,
      ten: b.ten,
      cung: pv.goc.tenCung,
      dieuKien: `${b.sao.join(' và ')} cùng hội về ${nhan(pv)}: ${viTri(pv, b.sao)}. Đây là ${b.net}.`,
      sao: b.sao,
      loai: 'phu',
    });
  }
  return ra;
}

/**
 * Vô chính diệu — cung gốc không có chính tinh nào đóng.
 *
 * Đây là cách cục duy nhất định nghĩa bằng sự VẮNG MẶT, và nó có luật đọc riêng
 * trong sách: nét của cung mượn từ cung xung chiếu, nên người mang nó thường
 * linh hoạt hơn nhưng cũng khó tự thấy mình là ai. Bộ vàng RAG đã có sẵn một
 * câu đo đúng chi tiết này ("Mệnh không có chính tinh thì đọc thế nào").
 *
 * Đọc CUNG GỐC chứ không đọc tam phương: vắng chính tinh ở cung mình mới là vô
 * chính diệu; tam phương gần như luôn có chính tinh ở đâu đó.
 */
function voChinhDieu(pv: PhamVi): CachCuc[] {
  const coChinh = pv.goc.sao.some((s) => s.loai === 'chinh-tinh');
  if (coChinh) return [];

  const doiDien = pv.bon.find((c) => c.chiIndex === (pv.goc.chiIndex + 6) % 12);
  const muon = doiDien?.sao.filter((s) => s.loai === 'chinh-tinh').map((s) => s.ten) ?? [];

  return [{
    ma: 'VO_CHINH_DIEU',
    ten: 'Vô chính diệu',
    cung: pv.goc.tenCung,
    dieuKien: `${nhan(pv)} không có chính tinh nào đóng${
      muon.length
        ? `, nên nét của nó mượn từ cung xung chiếu ${doiDien!.tenCung} (${doiDien!.chi}) — nơi có ${muon.join(', ')}`
        : ''
    }. Kiểu này thường cho sự linh hoạt, đổi lại là khó tự thấy rõ mình, và dễ thấy mình khác đi tuỳ môi trường đang ở.`,
    sao: muon,
    loai: 'chinh',
  }];
}

/**
 * Mã đầu đới kiếm — Kình Dương cư NGỌ, có Thiên Mã trong tam phương.
 *
 * Bản đầu bắt Kình Dương ĐỒNG CUNG Thiên Mã, và đó là mã chết: quét 6.912 lá số
 * không ra lần nào. Kình Dương an theo Lộc Tồn (theo can năm), Thiên Mã an theo
 * tam hợp chi năm nên chỉ rơi vào Dần/Thân/Tỵ/Hợi — hai quỹ đạo không gặp nhau
 * trong engine này. Một luật không bao giờ phát ra là luật viết sai, không phải
 * luật hiếm.
 *
 * Dạng Nam phái đứng vững: Kình Dương ở Ngọ là chỗ nó đắc địa, "kiếm" mới thành
 * kiếm chứ không thành vết thương; "mã" là Thiên Mã hội về. Đo được 8,3%.
 */
function maDauDoiKiem(pv: PhamVi): CachCuc[] {
  const cK = pv.sao.get('Kình Dương');
  const cM = pv.sao.get('Thiên Mã');
  if (!cK || !cM || cK.chi !== 'Ngọ') return [];

  return [{
    ma: 'MA_DAU_DOI_KIEM',
    ten: 'Mã đầu đới kiếm',
    cung: pv.goc.tenCung,
    dieuKien: `Kình Dương đóng tại cung Ngọ — chỗ nó đắc địa — và Thiên Mã tại ${cM.tenCung} (${cM.chi}) cùng hội về tam phương tứ chính của ${nhan(pv)}. Đây là cách đi xa có sức bật nhưng phải chịu va: thuận ở môi trường cạnh tranh, bất lợi ở môi trường cần yên.`,
    sao: ['Kình Dương', 'Thiên Mã'],
    loai: 'phu',
  }];
}

/**
 * Hình Tù giáp Ấn — Thiên Hình và Liêm Trinh kẹp hai bên cung có Quốc Ấn.
 *
 * "Giáp" trong Tử Vi là hai cung LIỀN KỀ, không phải tam phương. Đây là cách
 * cục duy nhất trong bộ v1 đọc theo quan hệ liền kề, nên nó không dùng PhamVi
 * mà quét thẳng trên 12 cung.
 */
function hinhTuGiapAn(laSo: LaSo, goc: Cung): CachCuc[] {
  const theoChi = new Map(laSo.cungs.map((c) => [c.chiIndex, c]));
  const co = (c: Cung | undefined, ten: string) => !!c?.sao.some((s) => s.ten === ten);

  const coAn = goc.sao.some((s) => s.ten === 'Quốc Ấn');
  if (!coAn) return [];

  const truoc = theoChi.get((goc.chiIndex + 11) % 12);
  const sau = theoChi.get((goc.chiIndex + 1) % 12);

  const kep =
    (co(truoc, 'Thiên Hình') && co(sau, 'Liêm Trinh')) ||
    (co(truoc, 'Liêm Trinh') && co(sau, 'Thiên Hình'));
  if (!kep) return [];

  return [{
    ma: 'HINH_TU_GIAP_AN',
    ten: 'Hình Tù giáp Ấn',
    cung: goc.tenCung,
    dieuKien: `Quốc Ấn đóng tại ${goc.tenCung} (${goc.chi}), hai cung liền kề là ${truoc!.tenCung} và ${sau!.tenCung} mang Thiên Hình và Liêm Trinh. Thẩm quyền bị kẹp giữa kỷ luật và ràng buộc — quyền có thật nhưng luôn đi kèm điều kiện.`,
    sao: ['Quốc Ấn', 'Thiên Hình', 'Liêm Trinh'],
    loai: 'phu',
  }];
}

// ---------------------------------------------------------------- theo lớp hạn

/**
 * Cách cục chỉ có nghĩa khi đang nói về một quãng thời gian.
 *
 * Tang Môn / Thái Tuế / Điếu Khách và Tuế Phá đều thuộc vòng Thái Tuế — chúng
 * mô tả không khí của một NĂM, không mô tả con người. Đưa chúng vào bài luận
 * tính cách là nói sai chuyện, nên lớp gọi phải lọc theo lớp hạn.
 */
function theoHan(pv: PhamVi): CachCuc[] {
  const ra: CachCuc[] = [];

  if (duCa(pv, ['Tang Môn', 'Thái Tuế', 'Điếu Khách'])) {
    ra.push({
      ma: 'TANG_TUE_DIEU',
      ten: 'Tang Tuế Điếu',
      cung: pv.goc.tenCung,
      dieuKien: `Tang Môn, Thái Tuế và Điếu Khách cùng hội về ${nhan(pv)}: ${viTri(pv, ['Tang Môn', 'Thái Tuế', 'Điếu Khách'])}. Bộ này báo một quãng nhiều chuyện phải đối đáp và nhiều việc ngoài ý muốn chen vào, không báo một sự việc cụ thể nào.`,
      sao: ['Tang Môn', 'Thái Tuế', 'Điếu Khách'],
      loai: 'han',
    });
  }

  const cM = pv.sao.get('Thiên Mã');
  const cTP = pv.sao.get('Tuế Phá');
  if (cM && cTP) {
    ra.push({
      ma: 'MA_GAP_TUE_PHA',
      ten: 'Thiên Mã gặp Tuế Phá',
      cung: pv.goc.tenCung,
      dieuKien: `Thiên Mã tại ${cM.tenCung} và Tuế Phá tại ${cTP.tenCung} cùng nằm trong tam phương tứ chính của ${nhan(pv)}. Quãng có xu hướng dịch chuyển, nhưng thứ đang chạy dễ bị cắt ngang giữa đường.`,
      sao: ['Thiên Mã', 'Tuế Phá'],
      loai: 'han',
    });
  }

  if (pv.goc.coTuan || pv.goc.coTriet) {
    const ten = [pv.goc.coTuan ? 'Tuần' : null, pv.goc.coTriet ? 'Triệt' : null]
      .filter(Boolean)
      .join(' và ');
    ra.push({
      ma: 'TUAN_TRIET_AN_NGU',
      ten: `${ten} án ngữ`,
      cung: pv.goc.tenCung,
      dieuKien: `${ten} đóng ngay tại ${nhan(pv)}. Nét của cung này khó hiện ra đúng lúc cần — thường phải qua một quãng, hoặc phải có việc đẩy tới, nó mới lộ.`,
      sao: [pv.goc.coTuan ? 'Tuần' : '', pv.goc.coTriet ? 'Triệt' : ''].filter(Boolean),
      loai: 'han',
    });
  }

  return ra;
}

// ---------------------------------------------------------------- đầu vào chung

/** Trần số cách cục trả về. Nhiều hơn thì prompt loãng và model mất chỗ để chọn. */
const TRAN = 8;

const THU_TU: Record<CachCuc['loai'], number> = { chinh: 0, phu: 1, han: 2 };

/**
 * Nhận diện cách cục trên một lá số.
 *
 * Luôn xét cung Mệnh — đó là nền của mọi câu trả lời. Có `cungTrongTam` và nó
 * khác Mệnh thì xét thêm cung ấy, vì câu hỏi đang nhìn vào đó.
 *
 * Cắt ở 8 và xếp bộ chính tinh lên trước: khi phải bỏ bớt thì bỏ cái ít nói
 * nhất, chứ không bỏ ngẫu nhiên theo thứ tự quét.
 */
export function nhanDangCachCuc(laSo: LaSo, cungTrongTam?: string): CachCuc[] {
  const menh = laSo.cungs[laSo.menhIndex];
  const goc: Cung[] = [menh];

  if (cungTrongTam && cungTrongTam !== menh.tenCung) {
    const c = laSo.cungs.find((x) => x.tenCung === cungTrongTam);
    if (c) goc.push(c);
  }

  const ra: CachCuc[] = [];
  const daCo = new Set<string>();

  for (const g of goc) {
    const pv = dungPhamVi(laSo, g);
    const tim = [
      ...boChinhTinh(pv),
      ...voChinhDieu(pv),
      ...nhatNguyet(pv),
      ...boPhuTinh(pv),
      ...maDauDoiKiem(pv),
      ...hinhTuGiapAn(laSo, g),
      ...theoHan(pv),
    ];
    for (const cc of tim) {
      /*
       * Bỏ trùng theo MÃ, không theo (mã + cung).
       *
       * Mệnh, Tài Bạch và Quan Lộc là một tam hợp, nên tam phương tứ chính của
       * Mệnh và của Quan Lộc dùng chung BA trên BỐN cung. Xét cả hai cho ra gần
       * như hai bản sao của cùng một luận điểm.
       *
       * Đo được hậu quả của bản trước: Tả Hữu có mặt ở 77% lá số mà KHÔNG lần
       * nào lọt vào kết quả cuối — các bản sao chiếm hết trần 8, và `slice` cắt
       * theo thứ tự quét nên lần nào cũng cắt đúng những mục đứng cuối bảng.
       */
      if (daCo.has(cc.ma)) continue;
      daCo.add(cc.ma);
      ra.push(cc);
    }
  }

  /*
   * Cắt ở trần, nhưng GIỮ CHỖ cho nhóm 'han'.
   *
   * Xếp theo loại rồi `slice` trần trụi thì nhóm 'han' luôn nằm cuối và luôn
   * bị cắt đầu tiên — nghĩa là lá số nào nhiều cách cục bản mệnh thì Tuần/Triệt
   * và Tang Tuế Điếu không bao giờ tới được model, kể cả khi câu hỏi đang hỏi
   * đúng về vận hạn. Đó là cùng một lỗi vừa sửa ở Tả Hữu, chỉ đổi chỗ.
   */
  const chinhPhu = ra.filter((c) => c.loai !== 'han');
  const han = ra.filter((c) => c.loai === 'han');
  const choHan = Math.min(han.length, 2);

  return [
    ...chinhPhu.sort((a, b) => THU_TU[a.loai] - THU_TU[b.loai]).slice(0, TRAN - choHan),
    ...han.slice(0, choHan),
  ];
}

/** Mọi tên cách cục engine có thể phát ra — validator dùng để bắt tên bịa */
export const TEN_CACH_CUC: string[] = [
  ...BO_CHINH_TINH.map((b) => b.ten),
  'Vô chính diệu',
  'Nhật Nguyệt tịnh minh',
  'Nhật Nguyệt hãm',
  ...BO_PHU_TINH.map((b) => b.ten),
  'Mã đầu đới kiếm',
  'Hình Tù giáp Ấn',
  'Tang Tuế Điếu',
  'Thiên Mã gặp Tuế Phá',
  'Tuần án ngữ',
  'Triệt án ngữ',
  'Tuần và Triệt án ngữ',
];
