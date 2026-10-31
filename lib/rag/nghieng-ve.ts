import { nhanDangCachCuc } from '@/lib/tuvi/cach-cuc';
import { luanHan, type CapLuanHan } from '@/lib/tuvi/luan-han';
import {
  cungDaiVan,
  cungNguyetHan,
  cungTieuHan,
  luuTinhTheoNam,
  tamPhuongTuChinh,
  type Cung,
  type LaSo,
} from '@/lib/tuvi/ansao';
import { CHINH_TINH, type Sao } from '@/lib/tuvi/constants';
import { KHUON } from '@/lib/tuvi/quick-read-noi-dung';
import { khopLuatToHop } from '@/lib/tuvi/luat-to-hop';
import { lopHan as bangLopHan, type HoaHan, type TenHoa } from '@/lib/tuvi/tu-hoa-han';
import type { ChuDe, LopHan } from './planner';

/**
 * DỮ KIỆN CỦA PHẦN ĐANG HỎI — thứ câu trả lời phải đứng lên trên.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO TỆP NÀY BỊ VIẾT LẠI
 *
 * Bản trước trả về hai thứ, và cả hai đều là thứ không được để người đọc nhìn
 * thấy: một CON SỐ đếm được ('7 yếu tố đỡ / 2 yếu tố cản') và một NHÃN viết sẵn
 * ('nghiêng rõ về phía đẩy tới'). Rồi prompt bảo model đặt thẳng nhãn ấy vào
 * câu. Model làm đúng thứ nó được bảo, và người dùng nhận về:
 *
 *   "Năm 2026 nghiêng rõ về phía đẩy tới: bảy yếu tố đang đỡ so với hai yếu tố
 *    cản ở phần tình cảm."
 *
 * Câu đó không sai. Nó chỉ không nói gì. "Đẩy tới" là đẩy cái gì, "yếu tố" là
 * yếu tố nào — người đọc không tra được, không đối chiếu được, và không có lý
 * do nào để tin. Đó là tiếng lóng nội bộ của engine rò thẳng ra mặt trước.
 *
 * Lỗi nằm ở thiết kế của tệp này, không ở model:
 *
 *   1. Đưa cho model một nhãn để DÁN, thay vì một hướng để TUÂN.
 *   2. Đưa CON SỐ làm bằng chứng chính. Con số là sổ sách nội bộ; bằng chứng
 *      của một bài luận Tử Vi là TÊN — tên sao, tên lớp hạn, tên cách cục.
 *   3. Và lỗi nặng nhất, ở tầng dưới: dữ kiện theo NĂM chưa bao giờ được tính
 *      cho phần đang hỏi. `luanHan` chỉ gắn lưu tinh vào cung trọng tâm, còn
 *      sáu lĩnh vực thì đọc cung của chúng ở tầng lá số gốc. Nên khi người ta
 *      hỏi "năm 2026 chuyện tình cảm thế nào", thứ đáng nói nhất — tiểu hạn rơi
 *      vào đâu, lưu tinh nào đang đóng ở đó — engine không hề tính. Có dặn model
 *      "nêu tên dữ kiện" thì nó cũng không có dữ kiện nào để nêu.
 *
 * ---------------------------------------------------------------------------
 * BẢN NÀY LÀM GÌ
 *
 * Đọc thẳng cung của phần đang hỏi, qua bốn lớp, và trả về DỮ KIỆN CÓ TÊN:
 *
 *   nền lá số  →  chính tinh, Tứ Hóa, phụ tinh có nét viết sẵn, Tuần/Triệt
 *   đại vận    →  quãng đang đi có đi qua cung ấy không
 *   năm        →  tiểu hạn có rơi vào đó không, và LƯU TINH của năm đóng ở đó
 *   tháng      →  chỉ khi câu hỏi hỏi tới tháng
 *
 * Hướng nghiêng vẫn do LUẬT tính, vẫn tất định — nhưng giờ nó tính từ chính
 * những dữ kiện được nêu tên, nên câu trả lời và lý do của nó là một. Bản cũ
 * đếm trên một tập, rồi đưa model một tập khác để viết.
 *
 * Con số không đi ra prompt nữa. Hướng cũng không đi ra dưới dạng một mệnh đề
 * chép được — nó đi ra dưới dạng một mã viết hoa kèm mô tả, để model phải tự
 * diễn đạt bằng lời của bài.
 *
 * ---------------------------------------------------------------------------
 * RANH GIỚI KHÔNG ĐỔI
 *
 *   Nghiêng về một bên, có tên dữ kiện đi kèm  →  BẮT BUỘC.
 *   Hứa một sự việc sẽ xảy ra                   →  vẫn cấm, `PHAN_QUYET` giữ nguyên.
 *
 * "Năm 2026 chuyện này nghiêng về hướng có" là nhận định, đối chiếu được.
 * "Tháng 5 bạn sẽ gặp người ấy" là lời hứa, không ai kiểm được.
 */

export const PHIEN_BAN_NGHIENG = '2026.09.2';
/** Phép cân theo lớp hạn (CEL-200) — chỉ chạy khi cờ `CELES_LOP_HAN` bật; ghi vết riêng */
export const PHIEN_BAN_NGHIENG_LOP_HAN = '2026.10.2';

export type HuongNghieng = 'thuan-ro' | 'thuan-nhe' | 'can-bang' | 'can-nhe' | 'can-ro';

/** Lớp nào mang dữ kiện này tới */
export type LopDauMoc = 'nen' | 'dai-van' | 'nam' | 'thang';

/**
 * Một dữ kiện CÓ TÊN trên lá số.
 *
 * `ten` là thứ được phép gọi thẳng trong bài — tên sao, "Tuần", "Triệt". Đây là
 * ngoại lệ thứ hai của luật cấm thuật ngữ, cùng dạng với ngoại lệ cho tên cách
 * cục, và cùng một điều kiện: nêu tên xong phải dịch ngay. `y` có sẵn để model
 * không phải tự nghĩ nghĩa, tức là không phải bịa.
 */
export interface DauMoc {
  ten: string;
  lop: LopDauMoc;
  huong: 'do' | 'can';
  /** Trọng số khi tính hướng — lớp năm nặng hơn nền khi câu hỏi hỏi về năm */
  trong: number;
  /** Nét đời sống của dữ kiện này, lấy từ kho chữ chung, không viết lại ở đây */
  y: string;
}

export interface NghiengVe {
  huong: HuongNghieng;
  /** Lớp hạn sâu nhất mà câu hỏi chạm tới */
  cap: CapLuanHan;
  /** Tên cung — dùng cho log và test, KHÔNG đi vào prompt */
  cung: string;
  /** Phần đời, nói bằng lời thường — đây mới là thứ đi vào prompt */
  phanDoi: string;
  /** Các lớp thời gian có chạm vào cung ấy không */
  cham: { daiVan: boolean; nam: boolean; thang: boolean };
  /** Năm đang xét, để câu trả lời có mốc số */
  namXem: number;
  khoangTuoi?: string;
  /** Dữ kiện có tên, đã xếp theo trọng số giảm dần */
  dauMoc: DauMoc[];
  cachCuc: string[];
  /** Tổng trọng số hai bên — chỉ để log và test, KHÔNG đi vào prompt */
  canNang: { do: number; can: number };
  /**
   * Chỉ có ở phép cân theo lớp hạn (CEL-200). Khi có: `dauMoc` chỉ gồm dữ kiện
   * của lớp hạn, còn sao gốc ở phần đang hỏi nằm ở `nen` — dẫn chứng, không cộng
   * vào chiều.
   */
  lopHan?: {
    nen: DauMoc[];
    /** Tiểu hạn rơi đúng cung đại vận, và cung ấy chạm phần đang hỏi */
    nhanManh: boolean;
  };
}

/**
 * Chủ đề của planner → cung đọc ra nó.
 *
 * Viết thẳng tên cung ở đây thay vì đi vòng qua bảng lĩnh vực của `luanHan`:
 * bảng ấy chỉ có sáu lĩnh vực và ánh xạ 'gia-dao' → Phụ Mẫu, vốn là đúng lỗi đã
 * sửa ở bài luận 12 cung. Gia đạo là chỗ ở và nếp nhà, không phải cha mẹ.
 *
 * 'tong-quan' cố ý trả null: nó không ứng vào một cung nào, và ép một cung vào
 * đó là trả lời một câu hỏi người ta không hỏi.
 */
const CUNG_THEO_CHU_DE: Record<ChuDe, string | null> = {
  'su-nghiep': 'Quan Lộc',
  'tai-chinh': 'Tài Bạch',
  'tinh-cam': 'Phu Thê',
  'gia-dao': 'Điền Trạch',
  'suc-khoe': 'Tật Ách',
  'tong-quan': null,
};

/**
 * Nét đời sống của lưu tinh theo năm.
 *
 * Kho chữ chung (`netPhuTinh`) không có chúng, vì lưu tinh không phải sao trên
 * lá số gốc — chúng chỉ chạy qua theo năm. Mà đây đúng là nhóm dữ kiện người ta
 * cần nhất khi hỏi "năm nay thì sao": nó là thứ DUY NHẤT trong bài thay đổi
 * theo năm được hỏi.
 *
 * Viết ở thì hiện tại và nói về một QUÃNG, không nói về tính cách: lưu tinh đến
 * rồi đi, nên nét của nó là nét của năm chứ không phải nét của người.
 */
const NET_LUU_VI: Record<string, string> = {
  'Lưu Thái Tuế': 'năm nay đứng đúng ở phần này, nên chuyện ở đây dễ nổi lên thành việc cụ thể thay vì cứ âm ỉ',
  'Lưu Lộc Tồn': 'năm nay phần này có phần được hưởng thật, và nó tới theo đường chính thức chứ không nhờ may',
  'Lưu Kình Dương': 'năm nay chuyện ở đây bị đẩy nhanh hơn mức bạn muốn, và chỗ vội thường là chỗ va',
  'Lưu Đà La': 'năm nay việc ở phần này hay bị kéo dài, dây dưa không dứt điểm được',
  'Lưu Thiên Mã': 'năm nay phần này có xê dịch: đổi chỗ, đổi người, đổi cách — ít khi đứng yên',
  'Lưu Thiên Khốc': 'năm nay phần này hay chạm vào chuyện cũ chưa xong, và dễ thấy hụt vì nó',
  'Lưu Thiên Hư': 'năm nay phần này dễ thấy trống ngay cả khi bên ngoài không thiếu gì',
  'Lưu Tang Môn': 'năm nay phần này dễ có chuyện buồn lòng hoặc phải lo cho người thân, và nó làm bạn nặng đầu hơn bình thường',
  'Lưu Bạch Hổ': 'năm nay phần này dễ va chạm, tranh cãi hoặc phải xử lý việc gấp, nên chỗ này cần đi chậm lại',
};

const NET_LUU_EN: Record<string, string> = {
  'Lưu Thái Tuế': 'this year sits directly on this area, so what has been simmering here tends to surface as something concrete',
  'Lưu Lộc Tồn': 'this year brings a real share in this area, and it arrives through proper channels rather than luck',
  'Lưu Kình Dương': 'this year pushes this area faster than you want, and haste is where the friction lands',
  'Lưu Đà La': 'this year things in this area drag and are hard to close out',
  'Lưu Thiên Mã': 'this year this area moves: a change of place, of people, of method — it rarely stays still',
  'Lưu Thiên Khốc': 'this year this area brushes against unfinished business, and that is where the ache comes from',
  'Lưu Thiên Hư': 'this year this area can feel empty even when nothing is actually missing',
  'Lưu Tang Môn': 'this year this area can bring worries or care for family, and it weighs on you more than usual',
  'Lưu Bạch Hổ': 'this year this area is prone to friction, arguments or urgent fixes, so it pays to slow down here',
};

/**
 * Lớp hạn nào là lớp sâu nhất câu hỏi chạm tới.
 *
 * Lấy lớp CỤ THỂ NHẤT. Hỏi "năm 2026" thì đọc tới lớp năm; hỏi "tháng này" thì
 * đọc tới tháng. Hỏi chung chung thì rơi về đại vận — quãng người ta đang đứng,
 * vì 'ban-menh' không nói được gì về thời gian.
 */
function capTu(lopHan: LopHan[]): CapLuanHan {
  if (lopHan.includes('nguyet-han')) return 'thang';
  if (lopHan.includes('luu-nien')) return 'nam';
  return 'giai-doan';
}

function laChinhTinh(s: Sao) {
  return (CHINH_TINH as readonly string[]).includes(s.ten);
}

/** Độ sáng đủ để sao thể hiện được nét của nó */
const SANG_RO = new Set(['M', 'V', 'D', 'L']);

/**
 * TRỌNG SỐ THEO LỚP — và vì sao lớp năm nặng hơn nền.
 *
 * Người hỏi "năm 2026 thế nào" đang hỏi về một quãng, không hỏi về tính cách
 * của họ. Nếu nền lá số nặng ngang lớp năm thì câu trả lời cho 2026 và cho 2031
 * sẽ giống hệt nhau — mà đó đúng là thứ làm bài đọc thành vô nghĩa.
 *
 * Khi câu hỏi KHÔNG hỏi về thời gian, `capTu` trả 'giai-doan' và lớp năm không
 * được thu thập, nên bảng này tự khớp.
 */
const TRONG_LOP: Record<LopDauMoc, number> = {
  nen: 2,
  'dai-van': 2,
  nam: 3,
  thang: 3,
};

/**
 * Gom dữ kiện có tên của một cung, ở một lớp.
 *
 * Chỉ nhận sao CÓ NÉT VIẾT SẴN trong kho chữ. Một sao không giải nghĩa được thì
 * đưa vào prompt cũng chỉ để model tự nghĩ ra nghĩa cho nó — tức là mở đường
 * cho bịa. Thà nêu ba dữ kiện có nghĩa còn hơn sáu cái tên trống.
 */
function dauMocCuaCung(
  cung: Cung,
  lop: LopDauMoc,
  ngonNgu: 'vi' | 'en',
  focused = false,
): DauMoc[] {
  const k = KHUON[ngonNgu];
  const ra: DauMoc[] = [];

  for (const s of cung.sao) {
    const chinh = laChinhTinh(s);
    const manh = !s.doSang || SANG_RO.has(s.doSang);
    /*
     * Focused (CEL-186 vé B, 4.2): chính tinh hãm đứng ở phía cản, nên nghĩa đi
     * kèm phải là nét "cần" (điều còn thiếu), không phải nét lúc sáng. Đường cũ
     * giữ nguyên để không đổi bài của các bề mặt khác.
     */
    const canHam = focused && chinh && !manh ? k.netSao[s.ten]?.can : undefined;
    const net = canHam
      ? `${ngonNgu === 'vi' ? 'cần' : 'needs'} ${canHam}`
      : chinh
        ? k.netSao[s.ten]?.manh
        : k.netPhuTinh[s.ten];
    if (!net) continue;

    /*
     * Cát mà hãm địa thì không tính là đỡ.
     *
     * Đây là chỗ nhiều bản luận tự động sai nhất: đếm tên sao mà bỏ qua độ
     * sáng, nên một cung đầy sao tốt hãm địa vẫn ra kết luận thuận.
     */
    let huong: 'do' | 'can';
    if (s.tinhChat === 'hung') huong = 'can';
    else if (s.tinhChat === 'cat') huong = manh ? 'do' : 'can';
    else if (chinh) huong = manh ? 'do' : 'can';
    else huong = 'do';

    // Hóa Kỵ là ngoại lệ trong nhóm Tứ Hóa: ba cái kia mở ra, nó thì vướng lại.
    if (s.ten === 'Hóa Kỵ') huong = 'can';

    ra.push({
      ten: s.ten,
      lop,
      huong,
      // Tứ Hóa nặng hơn: nó là thứ làm một lá số khác hẳn lá số bên cạnh dù
      // cùng bộ sao. Chính tinh nặng thứ nhì vì nó định hình cả cung.
      trong: TRONG_LOP[lop] * (s.loai === 'tu-hoa' ? 1.5 : chinh ? 1.2 : 1),
      y: boChuNgu(net),
    });
  }

  if (cung.coTuan || cung.coTriet) {
    const ten = [cung.coTuan ? 'Tuần' : null, cung.coTriet ? 'Triệt' : null]
      .filter(Boolean)
      .join(' và ');
    ra.push({
      ten,
      lop,
      huong: 'can',
      trong: TRONG_LOP[lop],
      y:
        ngonNgu === 'vi'
          ? 'phần này khó hiện ra đúng lúc: thứ có thật ở đây thường tới chậm hơn hoặc lệch hơn bạn tính'
          : 'this area struggles to land on time: what is really here tends to arrive late or sideways',
    });
  }

  return ra;
}

/** Bỏ chủ ngữ đầu câu — nét sao viết sẵn dạng "bạn …", mà ở đây nó nối vào sau một mệnh đề */
function boChuNgu(cau: string) {
  return cau.replace(/^(?:bạn|you)\s+/i, '');
}

function huongTu(do_: number, can: number): HuongNghieng {
  const lech = do_ - can;
  // Ngưỡng tính theo tổng, không theo hiệu tuyệt đối: lệch 3 trên tổng 6 là một
  // chuyện, lệch 3 trên tổng 30 là gần như cân.
  const tong = Math.max(do_ + can, 1);
  const ti = lech / tong;
  if (ti >= 0.34) return 'thuan-ro';
  if (ti >= 0.12) return 'thuan-nhe';
  if (ti > -0.12) return 'can-bang';
  if (ti > -0.34) return 'can-nhe';
  return 'can-ro';
}

/**
 * Đọc dữ kiện của phần đang hỏi, qua đủ bốn lớp.
 *
 * Trả null khi không có dữ kiện nào giải nghĩa được — lớp gọi phải chạy bình
 * thường khi null, vì thiếu khối này thì bài quay về như trước chứ không trắng.
 */
export function tinhNghiengVe(vao: {
  laSo: LaSo;
  chuDe: ChuDe;
  lopHan: LopHan[];
  namXem: number;
  thangXem: number;
  ngonNgu?: 'vi' | 'en';
  /**
   * Cung đọc nghiêng, khi lớp gọi đã biết chính xác (Focused: câu về con đọc
   * Tử Tức, không qua chủ đề gia-dao → Điền Trạch). Thiếu thì suy từ chủ đề.
   */
  cungChinh?: string;
  /** Bật các sửa của Focused (4.2, 4.3). Tắt thì kết quả y nguyên đường cũ. */
  focused?: boolean;
  /**
   * Câu vận hạn cân theo lớp hạn (CEL-200, cờ server `CELES_LOP_HAN`). Thiếu thì
   * kết quả y nguyên đường cũ. Chỉ có tác dụng khi `lopHan` có lớp khác `ban-menh`.
   */
  lopHanMoi?: boolean;
}): NghiengVe | null {
  if (vao.lopHanMoi === true && vao.lopHan.some((l) => l !== 'ban-menh')) return tinhTheoLopHan(vao);
  try {
    const ngonNgu = vao.ngonNgu ?? 'vi';
    const k = KHUON[ngonNgu];
    const cap = capTu(vao.lopHan);

    const fo = vao.focused === true;
    const tenCung = vao.cungChinh ?? CUNG_THEO_CHU_DE[vao.chuDe];
    if (!tenCung) return null;
    const cung = vao.laSo.cungs.find((c) => c.tenCung === tenCung);
    if (!cung) return null;

    const tuoi = vao.namXem - vao.laSo.thongTin.amLich.nam + 1;
    const cungDai = cungDaiVan(vao.laSo, tuoi);
    const iNam = cungTieuHan(vao.laSo, tuoi);
    const iThang = cungNguyetHan(vao.laSo, tuoi, vao.thangXem);

    /*
     * "Chạm" tính cả tam phương tứ chính, không chỉ trùng cung.
     *
     * Tiểu hạn rơi vào tam hợp của cung đang hỏi vẫn tác động thật, và bỏ qua
     * nó thì mười hai năm chỉ có một năm được coi là có liên quan — tức là
     * mười một năm trả lời "không có gì nổi bật", vô dụng.
     */
    const lienQuan = (i: number) => {
      const { tamHop, xungChieu } = tamPhuongTuChinh(i);
      return i === cung.chiIndex || tamHop.includes(cung.chiIndex) || xungChieu === cung.chiIndex;
    };

    const chamDaiVan = cungDai ? lienQuan(cungDai.chiIndex) : false;
    const chamNam = lienQuan(iNam);
    const chamThang = cap === 'thang' ? lienQuan(iThang) : false;

    const dauMoc: DauMoc[] = [...dauMocCuaCung(cung, 'nen', ngonNgu, fo)];

    // Đại vận: chỉ lấy khi quãng ấy thật sự đi qua phần đang hỏi. Cung đại vận
    // nằm ở góc khác hẳn thì sao của nó không nói gì về chuyện này.
    if (cungDai && chamDaiVan && cungDai.chiIndex !== cung.chiIndex) {
      dauMoc.push(...dauMocCuaCung(cungDai, 'dai-van', ngonNgu, fo));
    }

    /*
     * LỚP NĂM — phần bản cũ thiếu hẳn.
     *
     * Lưu tinh rơi đúng vào cung đang hỏi là dữ kiện sắc nhất mà engine có cho
     * một câu hỏi theo năm, vì nó là thứ duy nhất đổi khi đổi năm. Không có nó
     * thì "năm 2026 thế nào" và "năm 2031 thế nào" trả về cùng một bài.
     */
    if (cap !== 'giai-doan') {
      /*
       * Cung tiểu hạn, khi nó KHÁC cung đang hỏi.
       *
       * Trùng cung thì sao của nó đã nằm ở lớp nền rồi. Khác cung mà vẫn chạm
       * (tam phương tứ chính) thì sao ở đó tác động thật trong năm ấy, và bỏ
       * qua là bỏ đúng phần trả lời cho câu "năm nay thì sao".
       */
      const cungNam = vao.laSo.cungs[iNam];
      if (chamNam && cungNam.chiIndex !== cung.chiIndex) {
        dauMoc.push(...dauMocCuaCung(cungNam, 'nam', ngonNgu, fo));
      }

      const netLuu = ngonNgu === 'vi' ? NET_LUU_VI : NET_LUU_EN;
      for (const s of luuTinhTheoNam(vao.namXem)) {
        if (s.chiIndex !== cung.chiIndex) continue;
        // Focused: Lưu Thái Tuế không thuận không cản, nên không được đứng ở
        // phía nào. Nó vẫn có mặt trong gói F### (khối 'luu-tinh') làm mốc năm.
        if (fo && s.tinhChat === 'trung') continue;
        const y = netLuu[s.ten];
        if (!y) continue;
        dauMoc.push({
          ten: s.ten,
          lop: 'nam',
          huong: s.tinhChat === 'hung' ? 'can' : 'do',
          // Lưu Thái Tuế không nghiêng bên nào — nó chỉ làm chuyện nổi lên. Trọng
          // số thấp để nó có mặt làm mốc thời gian mà không tự lái kết luận.
          trong: s.tinhChat === 'trung' ? 1 : TRONG_LOP.nam,
          y,
        });
      }
      if (cap === 'thang' && chamThang) {
        const cungThang = vao.laSo.cungs[iThang];
        if (cungThang.chiIndex !== cung.chiIndex) {
          dauMoc.push(...dauMocCuaCung(cungThang, 'thang', ngonNgu, fo));
        }
      }
    }

    if (dauMoc.length === 0) return null;

    const do_ = dauMoc.filter((d) => d.huong === 'do').reduce((t, d) => t + d.trong, 0);
    const can = dauMoc.filter((d) => d.huong === 'can').reduce((t, d) => t + d.trong, 0);

    // Xếp nặng trước: model đọc từ trên xuống và bám vào thứ gặp đầu tiên, nên
    // thứ tự ở đây quyết định bài nêu tên dữ kiện nào.
    dauMoc.sort((a, b) => b.trong - a.trong);
    const huong = huongTu(do_, can);
    let chon = dauMoc.slice(0, 6);
    /*
     * Focused (4.3): cân bằng thì câu chốt phải nêu được một mốc mỗi phía. Top 6
     * toàn một phía thì đổi mốc nhẹ nhất lấy mốc nặng nhất của phía còn thiếu.
     */
    if (fo && huong === 'can-bang') {
      for (const phia of ['do', 'can'] as const) {
        if (chon.some((d) => d.huong === phia)) continue;
        const bu = dauMoc.find((d) => d.huong === phia);
        if (bu) chon = [...chon.slice(0, Math.max(chon.length - 1, 0)), bu];
      }
    }

    const bai = luanHan(vao.laSo, cap, vao.namXem, vao.thangXem, ngonNgu);

    return {
      huong,
      cap,
      cung: tenCung,
      phanDoi: k.chuDeCung[tenCung] ?? tenCung,
      cham: { daiVan: chamDaiVan, nam: chamNam, thang: chamThang },
      namXem: vao.namXem,
      khoangTuoi: cungDai?.daiVan
        ? `${cungDai.daiVan.tuTuoi}–${cungDai.daiVan.denTuoi} tuổi`
        : khoangTuoiDaiVan(bai.subline),
      // Sáu là đủ chất liệu. Nhiều hơn thì model quay ra liệt kê thay vì luận,
      // và bài thành một bảng tra cứu có dấu chấm câu.
      dauMoc: chon,
      cachCuc: nhanDangCachCuc(vao.laSo, tenCung)
        .filter((c) => c.loai !== 'han')
        .map((c) => c.ten)
        .slice(0, 4),
      canNang: { do: do_, can },
    };
  } catch {
    return null;
  }
}

/**
 * TRỌNG SỐ CỦA PHÉP CÂN THEO LỚP HẠN (CEL-200).
 *
 * Thứ bậc chủ dự án chốt 16/10/2026: luật tổ hợp (đúng cặp sao sách nêu) > tứ hoá
 * theo hạn = sao lưu đơn lẻ. Lưu hoá ngang sao lưu; tứ hoá đại vận nhẹ hơn một
 * bậc vì nó phủ cả mười năm chứ không riêng năm đang hỏi.
 *
 * Tam phương tứ chính chỉ được nửa trọng số: Lưu Hóa Kỵ ở Mệnh chiếu tam hợp sang
 * phần sự nghiệp vẫn tác động (bản cũ bỏ hẳn — lỗi gốc 16/10/2026), nhưng không
 * nặng bằng khi nó đóng ngay ở đó. Các con số này chờ bảng đo phân bố hai phía
 * trước khi bật cờ.
 */
const TRONG_HAN = {
  luat: 4.5,
  luu: 3,
  daiVan: 2,
  /** Hệ số khi dữ kiện nằm ở tam hợp / xung chiếu thay vì đúng cung đang hỏi */
  tamPhuong: 0.5,
} as const;

/**
 * Nét đời sống của tứ hoá theo hạn. Kỵ là cản; Lộc, Quyền, Khoa là thuận.
 * Viết trung tính theo chủ đề — cùng một câu đứng được cho sự nghiệp, tình cảm,
 * sức khỏe, tiền bạc. Mốc thời gian ghép ở `themHoa` theo nguồn (năm / đại vận).
 */
const NET_HOA_HAN: Record<'vi' | 'en', Record<TenHoa, string>> = {
  vi: {
    'Hóa Lộc': 'phần này có thêm cửa được hưởng, việc dễ suôn và dễ sinh lợi hơn',
    'Hóa Quyền': 'bạn có thêm tiếng nói và sức chủ động ở phần này, việc nắm được trong tay hơn',
    'Hóa Khoa': 'phần này dễ được ghi nhận, chuyện khó dễ tìm ra lời giải hơn',
    'Hóa Kỵ': 'phần này dễ vướng: việc tắc giữa chừng, hiểu lầm hoặc phải gỡ rối',
  },
  en: {
    'Hóa Lộc': 'this area gains an opening; things go more smoothly and pay off more easily',
    'Hóa Quyền': 'you gain more say and initiative here; things are more in your hands',
    'Hóa Khoa': 'this area is more easily recognised, and difficulties more readily find a way out',
    'Hóa Kỵ': 'this area tends to snag: things stall midway, get misread, or need untangling',
  },
};

/**
 * Phép cân cho câu vận hạn khi cờ lớp hạn bật.
 *
 * Chiều CHỈ lấy từ lớp hạn: luật tổ hợp, tứ hoá theo hạn (năm, đại vận), sao lưu.
 * Sao gốc ở phần đang hỏi thành mục `nen`, không cộng. Sao gốc ở cung hạn không
 * cộng cát/hung lẻ — nó chỉ vào chiều khi làm thành một luật tổ hợp với sao lưu
 * (phản biện S2: bản cũ cho sao gốc quay lại qua cung đại vận / tiểu hạn).
 */
function tinhTheoLopHan(vao: Parameters<typeof tinhNghiengVe>[0]): NghiengVe | null {
  try {
    const ngonNgu = vao.ngonNgu ?? 'vi';
    const k = KHUON[ngonNgu];
    const cap = capTu(vao.lopHan);
    const fo = vao.focused === true;
    const tenCung = vao.cungChinh ?? CUNG_THEO_CHU_DE[vao.chuDe];
    if (!tenCung) return null;
    const cung = vao.laSo.cungs.find((c) => c.tenCung === tenCung);
    if (!cung) return null;

    const lh = bangLopHan(vao.laSo, vao.namXem, cap === 'thang' ? vao.thangXem : undefined);
    const tuoi = vao.namXem - vao.laSo.thongTin.amLich.nam + 1;
    const cungDai = cungDaiVan(vao.laSo, tuoi);

    const { tamHop, xungChieu } = tamPhuongTuChinh(cung.chiIndex);
    /** 1 = đúng cung đang hỏi, hệ số tam phương = chiếu tới, 0 = không liên quan */
    const heSo = (i: number) =>
      i === cung.chiIndex ? 1 : tamHop.includes(i) || i === xungChieu ? TRONG_HAN.tamPhuong : 0;
    const noiO = (i: number) => {
      if (i === cung.chiIndex) return ngonNgu === 'vi' ? 'ngay ở phần này' : 'right in this area';
      const ten = vao.laSo.cungs.find((c) => c.chiIndex === i)?.tenCung;
      const phan = ten ? (k.chuDeCung[ten] ?? ten) : '';
      if (!phan) return ngonNgu === 'vi' ? 'ở một phần khác của lá số' : 'elsewhere in the chart';
      return ngonNgu === 'vi' ? `nằm ở ${phan}, hướng sang phần này` : `sits in ${phan}, reaching into this area`;
    };

    const chamDaiVan = lh.daiVan !== null && heSo(lh.daiVan) > 0;
    const chamNam = heSo(lh.tieuHan) > 0;
    const chamThang = cap === 'thang' && lh.nguyetHan !== null && heSo(lh.nguyetHan) > 0;

    const dauMoc: DauMoc[] = [];
    /** Tên sao lưu / hoá đã nằm trong một luật tổ hợp — không cộng lẻ lần nữa */
    const daDung = new Set<string>();

    // 1. Luật tổ hợp — chỉ ở cung hạn chạm phần đang hỏi.
    for (const kl of khopLuatToHop(vao.laSo, lh, cung.chiIndex)) {
      if (kl.cungXet === 'tieu-han' && cap === 'giai-doan') continue;
      const hs = heSo(kl.chiIndex);
      if (!hs) continue;
      const lop: LopDauMoc = kl.cungXet === 'dai-van' ? 'dai-van' : kl.cungXet === 'nguyet-han' ? 'thang' : 'nam';
      const ten = [...new Set(kl.viTri.map((v) => v.ten))].join(' + ');
      if (dauMoc.some((d) => d.ten === ten)) continue;
      for (const v of kl.viTri) if (!v.laGoc) daDung.add(v.ten);
      const cacHuong: ('do' | 'can')[] =
        kl.luat.chieu === 'hai-mat' ? ['do', 'can'] : [kl.luat.chieu === 'thuan' ? 'do' : 'can'];
      for (const huong of cacHuong) {
        dauMoc.push({ ten, lop, huong, trong: TRONG_HAN.luat * hs, y: kl.luat.nghia });
      }
    }

    // 2. Tứ hoá theo hạn: lưu hoá (năm) ngang sao lưu, tứ hoá đại vận nhẹ hơn.
    const themHoa = (h: HoaHan, lop: LopDauMoc, trong: number) => {
      const hs = heSo(h.chiIndex);
      if (!hs) return;
      const ten =
        h.nguon === 'nam'
          ? `Lưu ${h.hoa} (${h.sao})`
          : ngonNgu === 'vi'
            ? `${h.hoa} đại vận (${h.sao})`
            : `${h.hoa} of the decade (${h.sao})`;
      // luat-to-hop đặt tên tứ hoá là "Hóa Kỵ (Liêm Trinh)", không có tiền tố lưu/đại vận
      if (daDung.has(`${h.hoa} (${h.sao})`)) return;
      const khi =
        h.nguon === 'nam'
          ? ngonNgu === 'vi' ? `năm ${vao.namXem}` : `in ${vao.namXem}`
          : ngonNgu === 'vi' ? 'quãng đại vận này' : 'over this decade';
      dauMoc.push({
        ten,
        lop,
        huong: h.hoa === 'Hóa Kỵ' ? 'can' : 'do',
        trong: trong * hs,
        y: `${khi}, ${NET_HOA_HAN[ngonNgu][h.hoa]} (${noiO(h.chiIndex)})`,
      });
    };
    if (cap !== 'giai-doan') for (const h of lh.luuTuHoa) themHoa(h, 'nam', TRONG_HAN.luu);
    if (vao.lopHan.includes('dai-van')) for (const h of lh.tuHoaDaiVan) themHoa(h, 'dai-van', TRONG_HAN.daiVan);

    // 3. Sao lưu đơn lẻ. Lưu Thái Tuế không thuận không cản: không đứng phía nào.
    if (cap !== 'giai-doan') {
      const netLuu = ngonNgu === 'vi' ? NET_LUU_VI : NET_LUU_EN;
      for (const s of lh.luuTinh) {
        if (s.tinhChat === 'trung' || daDung.has(s.ten)) continue;
        const hs = heSo(s.chiIndex);
        const y = netLuu[s.ten];
        if (!hs || !y) continue;
        dauMoc.push({
          ten: s.ten,
          lop: 'nam',
          huong: s.tinhChat === 'hung' ? 'can' : 'do',
          trong: TRONG_HAN.luu * hs,
          y: hs === 1 ? y : `${y} (${noiO(s.chiIndex)})`,
        });
      }
    }

    // Nền: sao gốc ở phần đang hỏi — dẫn chứng, KHÔNG vào tổng.
    const nen = dauMocCuaCung(cung, 'nen', ngonNgu, fo)
      .sort((a, b) => b.trong - a.trong)
      .slice(0, 3);
    if (dauMoc.length === 0 && nen.length === 0) return null;

    const do_ = dauMoc.filter((d) => d.huong === 'do').reduce((t, d) => t + d.trong, 0);
    const can = dauMoc.filter((d) => d.huong === 'can').reduce((t, d) => t + d.trong, 0);
    dauMoc.sort((a, b) => b.trong - a.trong);
    const huong = huongTu(do_, can);

    /*
     * Lấy 6 mốc nặng nhất, không chèn mốc phía thiếu (đảo quyết định "luôn nói hai
     * mặt" ngày 16/10, theo C3/Q2): năm nghiêng hẳn một phía thì danh sách phản
     * ánh đúng thế, phía kia có căn cứ đủ nặng mới được nêu.
     */
    const chon = dauMoc.slice(0, 6);

    const iTrung = lh.trung.find((t) => t.loai === 'tieu-han-trung-dai-van');
    const bai = luanHan(vao.laSo, cap, vao.namXem, vao.thangXem, ngonNgu);

    return {
      huong,
      cap,
      cung: tenCung,
      phanDoi: k.chuDeCung[tenCung] ?? tenCung,
      cham: { daiVan: chamDaiVan, nam: chamNam, thang: chamThang },
      namXem: vao.namXem,
      khoangTuoi: cungDai?.daiVan
        ? `${cungDai.daiVan.tuTuoi}–${cungDai.daiVan.denTuoi} tuổi`
        : khoangTuoiDaiVan(bai.subline),
      dauMoc: chon,
      cachCuc: nhanDangCachCuc(vao.laSo, tenCung)
        .filter((c) => c.loai !== 'han')
        .map((c) => c.ten)
        .slice(0, 4),
      canNang: { do: do_, can },
      lopHan: {
        nen,
        nhanManh: cap !== 'giai-doan' && !!iTrung && heSo(iTrung.chiIndex) > 0,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Bóc khoảng tuổi ra khỏi dòng phụ đề của bài luận hạn.
 *
 * Chỉ dùng làm đường lùi khi cung đại vận không có khoảng tuổi. Dùng lại chuỗi
 * engine đã dựng thay vì tự tính lại: hai chỗ cùng tính một thứ là hai chỗ sẽ
 * lệch nhau sau vài lần sửa.
 */
function khoangTuoiDaiVan(subline: string): string | undefined {
  return subline.match(/\d{1,2}\s*[–—-]\s*\d{1,2}\s*tuổi/)?.[0];
}

/**
 * Mô tả hướng cho model — KHÔNG phải mệnh đề để chép.
 *
 * Bản cũ đưa ra 'nghiêng rõ về phía đẩy tới' và dặn "đặt thẳng vào câu", nên nó
 * ra mặt trước nguyên văn. Bản này đưa một MÃ viết hoa cộng một mô tả về việc
 * phải viết gì — mã viết hoa thì không chép vào văn xuôi được, và mô tả thì nói
 * về hình dạng câu chứ không cho sẵn câu.
 */
const MO_TA_HUONG: Record<HuongNghieng, string> = {
  'thuan-ro':
    'Dữ kiện nghiêng HẲN về phía CÓ / THUẬN. Viết câu đầu nói rõ điều đó, bằng lời thường, không rào đón.',
  'thuan-nhe':
    'Dữ kiện nghiêng về phía CÓ / THUẬN nhưng không áp đảo. Nói rõ là có nghiêng, và nói luôn phần chưa chắc nằm ở đâu.',
  'can-bang':
    'Dữ kiện hai bên ngang nhau thật. Nói THẲNG rằng nó ngang nhau — đó vẫn là một câu trả lời — rồi chỉ đích danh dữ kiện nào sẽ làm nó lệch.',
  'can-nhe':
    'Dữ kiện nghiêng về phía CHƯA / KHÓ nhưng không áp đảo. Nói rõ là có nghiêng, và nói luôn chỗ còn mở.',
  'can-ro':
    'Dữ kiện nghiêng HẲN về phía CHƯA / KHÓ. Viết câu đầu nói rõ điều đó, bằng lời thường, không rào đón.',
};

const TEN_LOP: Record<LopDauMoc, (n: NghiengVe) => string> = {
  nen: () => 'sẵn trên lá số gốc',
  'dai-van': (n) => `thuộc quãng đại vận${n.khoangTuoi ? ` ${n.khoangTuoi}` : ''}`,
  nam: (n) => `chạy theo năm ${n.namXem}`,
  thang: () => 'thuộc lớp tháng đang xét',
};

/**
 * Khối chèn vào prompt.
 *
 * Ba thứ CỐ Ý không có mặt ở đây, và mỗi thứ đều từng có:
 *   - con số đếm dữ kiện  → nó ra mặt trước thành "bảy yếu tố đỡ / hai yếu tố cản"
 *   - nhãn hướng viết sẵn → nó ra mặt trước nguyên văn
 *   - tên cung            → luật cấm tên cung ở mọi dạng, và `phanDoi` thay được
 */
export function khoiNghiengVe(n: NghiengVe | null): string {
  if (!n) return '';
  if (n.lopHan) return khoiTheoLopHan(n, n.lopHan);

  const moc: string[] = [];
  if (n.cham.daiVan && n.khoangTuoi) moc.push(`Đại vận ${n.khoangTuoi} CÓ đi qua phần này.`);
  /*
   * Câu hỏi về cả chặng dài: phải nói ra, không để model tự suy.
   *
   * Thiếu dòng này thì model vẫn mở bài bằng "Năm 2026…" theo thói quen, dù
   * khối dữ kiện không hề nhắc tới năm nào. Đo được trên câu thật "sau này tôi
   * có giàu có ko?" — bài trả lời neo vào tiểu hạn một năm, tức là trả lời một
   * câu người ta không hỏi.
   */
  if (n.cap === 'giai-doan') {
    moc.push(
      'Câu hỏi này KHÔNG hỏi về một năm cụ thể — nó hỏi về cả chặng dài. ' +
        'ĐỪNG mở bài bằng "Năm 2026…". Neo vào quãng đại vận bằng SỐ TUỔI, và vào ' +
        'cấu trúc sẵn có trên lá số, vì đó mới là thứ nói được về cả chặng.'
    );
  }
  if (n.cap !== 'giai-doan') {
    moc.push(
      n.cham.nam
        ? `Tiểu hạn năm ${n.namXem} CÓ rơi vào phần này — đây là mốc thời gian đáng nêu ra trong bài.`
        : `Tiểu hạn năm ${n.namXem} KHÔNG rơi vào phần này, nên chuyện ở đây năm nay chạy lặng hơn.`
    );
  }

  const dong = (d: DauMoc) => `- ${d.ten} (${TEN_LOP[d.lop](n)}) — ${d.y}`;
  const ben = (h: 'do' | 'can') => {
    const ds = n.dauMoc.filter((d) => d.huong === h);
    return ds.length ? ds.map(dong).join('\n') : '- (không có dữ kiện nào)';
  };

  return `

DỮ KIỆN CỦA PHẦN ĐANG HỎI — ĐÃ ĐỌC XONG TỪ LÁ SỐ, KHÔNG ĐƯỢC ĐẢO:
Phần đời đang hỏi: ${n.phanDoi}.
${moc.join('\n')}

Dữ kiện đang mở đường:
${ben('do')}

Dữ kiện đang cản lại:
${ben('can')}
${
    n.cachCuc.length
      ? `\nCÁCH CỤC đọc được ở phần này: ${n.cachCuc.join(', ')}
Phải nêu tên ít nhất MỘT cái ở câu kết luận hoặc ý đầu tiên, rồi dịch nghĩa ngay.
Tên sao không thay được việc này: sao thì lá số nào cũng có, còn cách cục là tổ
hợp hiếm — nó mới là thứ làm bài đọc này khác bài của người bên cạnh.`
      : ''
  }

XU HƯỚNG ENGINE ĐÃ CHỐT: [${n.huong.toUpperCase()}]
${MO_TA_HUONG[n.huong]}

CÁCH VIẾT — ĐÚNG THỨ TỰ NÀY, KHÔNG ĐẢO:

1. TRẢ LỜI THẲNG CÂU ĐƯỢC HỎI, ngay câu đầu, theo xu hướng trên. Người ta hỏi
   "có hay không" thì câu đầu phải nói được "có" hay "chưa" nghiêng về đâu.

2. NGAY SAU ĐÓ, NÊU ĐÍCH DANH ÍT NHẤT HAI DỮ KIỆN Ở TRÊN làm lý do — gọi thẳng
   tên nó, kèm lớp mang nó tới, rồi dịch nghĩa ngay trong cùng câu hoặc câu kế.
   Đây là NGOẠI LỆ của luật cấm thuật ngữ, và nó đi kèm điều kiện: nêu tên mà
   không dịch nghĩa thì vi phạm.

   NGOẠI LỆ NÀY KHÔNG GỒM TÊN CUNG. Được gọi thẳng: tên sao, tên lớp hạn (đại
   vận, tiểu hạn, lưu niên), tên cách cục. KHÔNG được gọi: Quan Lộc, Phúc Đức,
   Phu Thê, Thiên Di, Tài Bạch, Tật Ách, Điền Trạch, Tử Tức, Phụ Mẫu, Huynh Đệ,
   Nô Bộc — kể cả khi đổi giới từ thành "phần Phúc Đức", vì đổi giới từ không
   làm nó dễ hiểu hơn. Gọi thẳng phần đời, như dòng đầu khối này đã viết sẵn.
   Sai:  "tiểu hạn năm nay rơi vào phần Phúc Đức"
   Đúng: "tiểu hạn năm nay rơi vào ${n.phanDoi}"

   Hai ví dụ dưới dùng dữ kiện KHÔNG có trong lá số này — chúng cho thấy HÌNH
   DẠNG của câu, không phải nội dung để chép. Nội dung lấy từ danh sách trên.
   Viết đúng:  "Năm ${n.namXem} chuyện này nghiêng về hướng có: tiểu hạn năm nay
                rơi đúng vào phần bạn đời, mà ở đó sẵn có Hồng Loan — chuyện đôi
                lứa đến theo đường tự nhiên, ít phải sắp đặt."
   Viết sai:   "Năm ${n.namXem} nghiêng về phía thuận vì các yếu tố đang đỡ nhiều hơn yếu tố cản."

3. NÊU TÊN MỘT CÁCH CỤC ở trên, cũng trong hai ba câu đầu, dịch nghĩa liền sau.
   Đây là việc RIÊNG với việc 2, không phải một phần của nó: nêu đủ hai tên sao
   rồi VẪN CÒN THIẾU việc này. Sao thì lá số nào cũng có và hai người dễ trùng
   sao ở cùng một cung; cách cục là tổ hợp hiếm, nên nó mới là thứ làm bài đọc
   này khác bài của người bên cạnh.

4. Rồi mới đi tiếp như thường: lực ngược, đánh đổi, cách tự kiểm chứng.

CẤM — ĐÂY LÀ TIẾNG LÓNG NỘI BỘ CỦA HỆ THỐNG, KHÔNG PHẢI TIẾNG VIỆT:
"đẩy tới", "đang đỡ", "yếu tố đỡ", "yếu tố cản", "lực đỡ", "nghiêng về phía
thuận", "tương quan", "hai lực ngang nhau", và mọi câu đếm dữ kiện kiểu "bảy
yếu tố… so với hai yếu tố…". Người đọc không tra được chúng, không đối chiếu
được với đời mình, và không có lý do nào để tin. Thay vào đó luôn luôn là TÊN
của dữ kiện cộng nghĩa đời sống của nó.`;
}

/**
 * Khối prompt của phép cân theo lớp hạn (CEL-200).
 *
 * Khác khối cũ ở ba chỗ (quyết định 16/10/2026, mục hai mặt sửa theo C3/Q2):
 *   - hai danh sách chỉ gồm dữ kiện LỚP HẠN; sao gốc đứng riêng ở mục nền,
 *     ghi rõ là dẫn chứng, không quyết chiều;
 *   - không ép hai mặt — phía có dữ kiện thì nêu, phía mỏng thì không độn;
 *   - danh sách cấm thêm các tên nội bộ của phép cân và các câu tự nói về kho.
 */
function khoiTheoLopHan(n: NghiengVe, lh: NonNullable<NghiengVe['lopHan']>): string {
  const moc: string[] = [];
  if (n.cham.daiVan && n.khoangTuoi) moc.push(`Đại vận ${n.khoangTuoi} CÓ chạm phần này.`);
  if (n.cap === 'giai-doan') {
    moc.push(
      'Câu hỏi này KHÔNG hỏi về một năm cụ thể — nó hỏi về cả chặng mười năm. ' +
        `ĐỪNG mở bài bằng "Năm ${n.namXem}…". Neo vào quãng đại vận bằng SỐ TUỔI.`
    );
  } else {
    moc.push(
      n.cham.nam
        ? `Tiểu hạn năm ${n.namXem} CÓ chạm phần này — đây là mốc thời gian đáng nêu ra trong bài.`
        : `Tiểu hạn năm ${n.namXem} KHÔNG chạm phần này.`
    );
  }
  if (lh.nhanManh) {
    moc.push(`Năm ${n.namXem} tiểu hạn rơi đúng cung đại vận: hai lớp cùng nhấn một chỗ. Nói rằng chuyện ở phần này dễ nổi rõ hơn mọi năm, không khẳng định nó sẽ xảy ra.`);
  }

  const dong = (d: DauMoc) => `- ${d.ten} (${TEN_LOP[d.lop](n)}) — ${d.y}`;
  const ben = (h: 'do' | 'can') => {
    const ds = n.dauMoc.filter((d) => d.huong === h);
    return ds.length ? ds.map(dong).join('\n') : '- (lớp hạn không có dữ kiện nào ở phía này — phía này MỎNG)';
  };
  const nen = lh.nen.length ? lh.nen.map((d) => `- ${d.ten} — ${d.y}`).join('\n') : '- (không có)';

  return `

DỮ KIỆN CỦA PHẦN ĐANG HỎI — ĐÃ ĐỌC XONG TỪ LÁ SỐ, KHÔNG ĐƯỢC ĐẢO:
Phần đời đang hỏi: ${n.phanDoi}.
${moc.join('\n')}

Câu này hỏi về THỜI GIAN, nên chiều kết luận lấy từ LỚP HẠN (đại vận, tiểu hạn,
sao lưu của năm, tứ hoá theo năm và theo đại vận) — thứ thay đổi theo quãng được hỏi.

Điều thuận lợi của lớp hạn:
${ben('do')}

Điều cản trở của lớp hạn:
${ben('can')}

NỀN SẴN TRÊN LÁ SỐ GỐC ở phần này — CHỈ để dẫn chứng, KHÔNG quyết chiều:
${nen}
Nền năm nào cũng như nhau, nên nó không trả lời được câu "quãng này thế nào".
Được nhắc để giải thích VÌ SAO lớp hạn tác động mạnh hay nhẹ ở đây; không được
dùng nó để lật chiều đã chốt dưới đây.
${
    n.cachCuc.length
      ? `\nCÁCH CỤC đọc được ở phần này: ${n.cachCuc.join(', ')}
Nêu tên ÍT NHẤT MỘT cách cục ở trên, dịch nghĩa ngay. Cách cục là cấu trúc gốc,
năm nào cũng như nhau: nó là DẪN CHỨNG vì sao phần này nhạy, không quyết chiều.`
      : ''
  }

XU HƯỚNG ENGINE ĐÃ CHỐT: [${n.huong.toUpperCase()}]
${MO_TA_HUONG[n.huong]}

CÁCH VIẾT — ĐÚNG THỨ TỰ NÀY, KHÔNG ĐẢO:

1. TRẢ LỜI THẲNG CÂU ĐƯỢC HỎI, ngay câu đầu, theo xu hướng trên.

2. CÓ CĂN CỨ THÌ NÊU, KHÔNG CÓ THÌ KHÔNG THÊM CHO ĐỦ. Nói phía theo xu hướng
   trước, nêu đích danh dữ kiện của nó — gọi thẳng tên, kèm lớp mang nó tới, rồi
   dịch nghĩa ngay. Phía kia có dữ kiện trong danh sách thì nêu đúng mức, cũng
   gọi tên như vậy. Phía nào ghi MỎNG thì không cần nhắc tới; đừng dựng một ý
   ngược chiều chỉ để bài có đủ hai mặt, và đừng bịa dữ kiện. Với câu hỏi thời
   gian, luật này thay cho mọi chỉ dẫn "cân cả hai mặt" hay "nói luôn phần chưa
   chắc / chỗ còn mở" ở trên: phần đó chỉ nói khi danh sách có dữ kiện cho nó.

   Tên được gọi thẳng: tên sao, tên tứ hoá (kể cả "lưu Hóa Kỵ" — nhưng chỉ đúng
   sao như danh sách trên), tên lớp hạn (đại vận, tiểu hạn, lưu niên), tên cách
   cục. KHÔNG gọi tên cung (Quan Lộc, Phúc Đức, Phu Thê, Thiên Di, Tài Bạch, Tật
   Ách, Điền Trạch, Tử Tức, Phụ Mẫu, Huynh Đệ, Nô Bộc) — gọi phần đời, như dòng
   đầu khối này đã viết sẵn.

3. Rồi mới đi tiếp: đánh đổi, việc nên làm, cách tự kiểm chứng.

CẤM — ĐÂY LÀ TIẾNG LÓNG NỘI BỘ CỦA HỆ THỐNG, KHÔNG PHẢI TIẾNG VIỆT:
"đẩy tới", "đang đỡ", "yếu tố đỡ", "yếu tố cản", "lực đỡ", "lực cản", "tín hiệu",
"chồng lớp", "lớp nền", "lớp hạn", "nền sẵn", "quyết chiều", "lật chiều", "dẫn chứng",
"nghiêng về phía thuận", "tương quan", "hai lực ngang
nhau", và mọi câu đếm dữ kiện. Không dùng chữ "nền", "nhịp", "phần nổi", "lớp
bên dưới", "gốc sâu" theo nghĩa bóng — kể cả khi dữ kiện cách cục viết "dựng nền":
nói thẳng việc cụ thể ("tích góp dần", "làm chắc từng bước"). Mỗi lần nêu một Hóa
thì nêu luôn tên sao nhận hoá ngay sau nó, đúng như dữ kiện ("Hóa Kỵ vào Văn Xương"); dữ kiện không ghi sao nào nhận thì đừng
nêu Hóa đó. Ghi rõ Hóa thuộc năm sinh, năm đang xem hay đại vận, đúng như dữ kiện: "Hóa Quyền
gốc vào Vũ Khúc", "lưu Hóa Kỵ năm 2026 vào Liêm Trinh", "Hóa Kỵ đại vận vào Thiên Cơ". Nói "điều thuận lợi", "điều cản trở" bằng lời thường. Cũng KHÔNG nói "không có tài liệu", "không có nguồn", "kho chưa có" —
người đọc không hỏi về kho; chưa chắc thì nói mức chắc chắn bằng lời thường.`;
}
