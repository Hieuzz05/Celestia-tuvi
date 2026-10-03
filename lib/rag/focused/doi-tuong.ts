/**
 * NGƯỜI ĐƯỢC HỎI — lớp riêng của đường Focused (CEL-186 vé B, cờ #1, mục 14.1 + 15 L1).
 *
 * Planner dùng chung xếp "con tôi", "bố tôi", "anh tôi" vào chủ đề `gia-dao`,
 * và bảng chủ đề → cung đưa cả ba về Phụ Mẫu / Điền Trạch. Câu về con mà đọc
 * Điền Trạch là trả lời sai người. Sửa ở planner là đổi hợp đồng dùng chung (và
 * nâng `PHIEN_BAN_PLANNER`, xả đệm), nên việc này nằm ở đây, chỉ đường Focused đọc.
 *
 * Chỉ kích hoạt khi có ĐỊNH DANH SỞ HỮU: "con tôi", "bố của mình", "chồng em".
 * Đại từ xưng hô trần ("con năm nay…", "em có người yêu không") là chính người
 * hỏi, không phải người khác.
 */

import type { KeHoachTruyVan } from '../planner';
import { boDau } from '../thuc-the';

export type VaiNguoi = 'vo-chong' | 'nguoi-yeu' | 'con' | 'bo-me' | 'anh-chi-em' | 'ban-be' | 'cap-tren';

export interface DoiTuongCauHoi {
  vai: VaiNguoi;
  /** Cung lục thân, viết có dấu như `Cung.tenCung` */
  cung: string;
  /**
   * `quan-he`: câu nói về quan hệ hai người — đọc được trên lá số người hỏi.
   * `van-rieng`: người kia là chủ ngữ của chuyện vận (thăng chức, bệnh, đỗ…) —
   * phải đọc trên lá số của chính họ, mã trả lời, không gọi model.
   */
  loai: 'quan-he' | 'van-rieng';
  /** Danh từ người dùng gõ, có dấu ("bố", "con gái") — dùng cho chip */
  nhan: string;
}

/** Danh từ chỉ người → vai. Dài trước ngắn: "con gái" phải thắng "con". */
const NGUOI: { co: string; vai: VaiNguoi }[] = [
  { co: 'anh chị em', vai: 'anh-chi-em' },
  { co: 'vợ chồng', vai: 'vo-chong' },
  { co: 'bố mẹ', vai: 'bo-me' },
  { co: 'cha mẹ', vai: 'bo-me' },
  { co: 'ba mẹ', vai: 'bo-me' },
  { co: 'con trai', vai: 'con' },
  { co: 'con gái', vai: 'con' },
  { co: 'con cái', vai: 'con' },
  { co: 'anh trai', vai: 'anh-chi-em' },
  { co: 'chị gái', vai: 'anh-chi-em' },
  { co: 'em trai', vai: 'anh-chi-em' },
  { co: 'em gái', vai: 'anh-chi-em' },
  { co: 'anh em', vai: 'anh-chi-em' },
  { co: 'chị em', vai: 'anh-chi-em' },
  { co: 'người yêu', vai: 'nguoi-yeu' },
  { co: 'bạn trai', vai: 'nguoi-yeu' },
  { co: 'bạn gái', vai: 'nguoi-yeu' },
  { co: 'bạn thân', vai: 'ban-be' },
  { co: 'bạn bè', vai: 'ban-be' },
  { co: 'đồng nghiệp', vai: 'ban-be' },
  { co: 'cấp trên', vai: 'cap-tren' },
  { co: 'sếp', vai: 'cap-tren' },
  { co: 'vợ', vai: 'vo-chong' },
  { co: 'chồng', vai: 'vo-chong' },
  { co: 'con', vai: 'con' },
  { co: 'bố', vai: 'bo-me' },
  { co: 'cha', vai: 'bo-me' },
  { co: 'mẹ', vai: 'bo-me' },
  { co: 'anh', vai: 'anh-chi-em' },
  { co: 'chị', vai: 'anh-chi-em' },
  { co: 'em', vai: 'anh-chi-em' },
  { co: 'bạn', vai: 'ban-be' },
];

/**
 * Bỏ dấu ra mơ hồ thì không nhận trên chuỗi không dấu: "ba" (bố / số ba), "me"
 * (mẹ / mè), "ma" (má / ma). Người gõ không dấu "ban than toi" chỉ được nhận là
 * bạn thân khi có ngữ cảnh — vì "bản thân tôi" bỏ dấu ra y hệt.
 */
const KHONG_NHAN_KHONG_DAU = new Set(['ba mẹ', 'mẹ', 'bạn thân']);

export const CUNG_CUA_VAI: Record<VaiNguoi, string> = {
  'vo-chong': 'Phu Thê',
  'nguoi-yeu': 'Phu Thê',
  con: 'Tử Tức',
  'bo-me': 'Phụ Mẫu',
  'anh-chi-em': 'Huynh Đệ',
  'ban-be': 'Nô Bộc',
  // Người đi trước, người có vị thế với mình — Phụ Mẫu, không phải Quan Lộc.
  'cap-tren': 'Phụ Mẫu',
};

const CHU = '(?:của )?(?:tôi|mình|em|tớ)';
const CHU_KHONG_DAU = '(?:cua )?(?:toi|minh|em)';

const reTu = (mau: string) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${mau})(?![\\p{L}\\p{M}])`, 'iu');
const thoat = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Quan hệ hai người — thắng mọi tín hiệu vận riêng ("vợ tôi có giúp tôi giàu"). */
const QUAN_HE = [
  'với tôi', 'với mình', 'với em', 'hợp', 'hợp nhau', 'thương', 'yêu', 'giúp', 'đỡ', 'hiếu',
  'nhờ', 'xung đột', 'va chạm', 'cãi', 'gần gũi', 'xa cách', 'quan hệ', 'gắn bó', 'hiểu',
  'tin tưởng', 'phản', 'ngoại tình', 'chung thủy', 'chung thuỷ', 'làm ăn chung', 'ủng hộ',
  'ưu ái', 'cất nhắc', 'chiều', 'ghét', 'thân',
];

/** Người kia là chủ ngữ của chuyện vận — đọc trên lá số của chính họ. */
const VAN_RIENG = [
  'thăng chức', 'lên chức', 'thăng tiến', 'giàu', 'phát tài', 'đỗ', 'thi', 'thi cử', 'học hành',
  'đại học', 'cưới', 'lấy chồng', 'lấy vợ', 'bệnh', 'ốm', 'sức khỏe', 'sức khoẻ', 'khỏe', 'khoẻ',
  'hạn', 'tai nạn', 'mất', 'chết', 'qua đời', 'sống', 'thọ', 'sinh con', 'có con', 'có bầu',
  'kiếm tiền', 'làm ăn', 'công việc', 'sự nghiệp', 'tiền bạc', 'việc làm', 'đi làm', 'xin việc',
  'tiền', 'phá sản', 'nợ', 'kiện',
];

/** Tiếng Việt có dấu thật không (người gõ không dấu thì mọi so khớp đi đường bỏ dấu) */
function coDau(s: string): boolean {
  return boDau(s) !== s.toLowerCase();
}

function coCum(cau: string, ds: readonly string[], coDauThat: boolean): boolean {
  if (coDauThat) return reTu(ds.map(thoat).join('|')).test(cau);
  const s = ` ${boDau(cau).replace(/[^a-z0-9]+/g, ' ').trim()} `;
  return ds.some((c) => s.includes(` ${boDau(c)} `));
}

/** Câu hỏi có hỏi về một người cụ thể khác người hỏi không. `null` khi không. */
export function nhanDangDoiTuong(cauHoi: string): DoiTuongCauHoi | null {
  const cau = cauHoi.normalize('NFC').toLowerCase();
  const daDau = coDau(cau);

  let gap: { co: string; vai: VaiNguoi } | null = null;
  if (daDau) {
    for (const n of NGUOI) {
      if (reTu(`${thoat(n.co)} ${CHU}`).test(cau)) {
        gap = n;
        break;
      }
    }
  } else {
    const s = boDau(cau).replace(/[^a-z0-9]+/g, ' ');
    for (const n of NGUOI) {
      if (KHONG_NHAN_KHONG_DAU.has(n.co)) {
        if (n.co !== 'bạn thân') continue;
        // "ban than toi" chỉ là bạn thân khi có ngữ cảnh quan hệ bạn bè.
        if (!/(?:^| )ban than (?:cua )?toi(?: |$)/.test(s) || !/(?:^| )(?:phan|choi|giup)(?: |$)/.test(s)) continue;
        gap = n;
        break;
      }
      if (new RegExp(`(?:^| )${boDau(n.co)} ${CHU_KHONG_DAU}(?: |$)`).test(s)) {
        gap = n;
        break;
      }
    }
  }
  if (!gap) return null;

  // Bỏ chính danh từ người trước khi dò tín hiệu: "người yêu" chứa "yêu", "bạn
  // thân" chứa "thân" — để nguyên thì câu nào về hai người đó cũng thành quan hệ.
  const conLai = daDau
    ? cau.replace(reTu(thoat(gap.co)), ' ')
    : ` ${boDau(cau).replace(/[^a-z0-9]+/g, ' ')} `.replace(` ${boDau(gap.co)} `, ' ');
  const loai = coCum(conLai, QUAN_HE, daDau) ? 'quan-he' : coCum(conLai, VAN_RIENG, daDau) ? 'van-rieng' : 'quan-he';
  return { vai: gap.vai, cung: CUNG_CUA_VAI[gap.vai], loai, nhan: gap.co };
}

/**
 * Cung của CHÍNH người hỏi mà câu kéo theo khi nói về người khác ("công việc
 * của bố tôi" kéo Quan Lộc của người hỏi vào). Đọc chúng là đọc nhầm người.
 */
const CUNG_CUA_NGUOI_HOI = new Set(['Quan Lộc', 'Tài Bạch', 'Tật Ách']);

/**
 * Ghép kế hoạch (15 L1): mọi trường lấy từ câu GỐC, riêng `cungLienQuan` lấy từ
 * câu ghép "<cung lục thân> + câu gốc", cung lục thân đứng đầu, bỏ cung của
 * chính người hỏi. Câu ghép chỉ dùng để lấy cung và truy hồi, không vào prompt.
 */
export function ghepKeHoach(
  goc: KeHoachTruyVan,
  ghep: KeHoachTruyVan,
  doiTuong: DoiTuongCauHoi
): KeHoachTruyVan {
  const cung = [doiTuong.cung, ...ghep.cungLienQuan.filter((c) => c !== doiTuong.cung && !CUNG_CUA_NGUOI_HOI.has(c))];
  return { ...goc, cungLienQuan: cung };
}

/** Câu ghép dùng để lập kế hoạch: tên cung đứng đầu thành PALACE đầu tiên. */
export function cauGhep(cauHoi: string, doiTuong: DoiTuongCauHoi): string {
  return `${doiTuong.cung} ${cauHoi}`;
}
