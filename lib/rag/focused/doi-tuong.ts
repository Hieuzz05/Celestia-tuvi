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
import { chuKhongDau, khopCum } from './khop';

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

/*
 * "mẹ chồng tôi", "bố vợ tôi", "em chồng tôi", "nhà chồng tôi": "chồng tôi" /
 * "vợ tôi" nằm trọn bên trong, nhưng người được hỏi KHÔNG phải vợ chồng — đọc
 * Phu Thê là đọc nhầm người. Chưa có vai cho người bên nội ngoại của vợ chồng,
 * nên các cụm này không kích hoạt (câu đi đường thường, không gán cung).
 */
const TRUOC_VO_CHONG = '(?<!(?:mẹ|bố|cha|ba|má|anh|chị|em|ông|bà|nhà|cô|dì|chú|bác|cậu|mợ|thím|họ|con|bạn) )';
const TRUOC_VO_CHONG_KD = '(?<!(?:me|bo|cha|ba|ma|anh|chi|em|ong|nha|co|di|chu|bac|cau|mo|thim|ho|con|ban) )';
const laVoChong = (co: string) => co === 'vợ' || co === 'chồng';

const reTu = (mau: string) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${mau})(?![\\p{L}\\p{M}])`, 'iu');
const thoat = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Quan hệ hai người — thắng mọi tín hiệu vận riêng ("vợ tôi có giúp tôi giàu"). */
const QUAN_HE = [
  'với tôi', 'với mình', 'với em', 'hợp', 'hợp nhau', 'thương', 'yêu', 'giúp', 'đỡ', 'hiếu',
  'nhờ', 'xung đột', 'va chạm', 'cãi', 'gần gũi', 'xa cách', 'quan hệ', 'gắn bó', 'hiểu',
  'tin tưởng', 'phản', 'ngoại tình', 'chung thủy', 'chung thuỷ', 'làm ăn chung', 'ủng hộ',
  'ưu ái', 'cất nhắc', 'chiều', 'ghét', 'thân',
].join('|');
/*
 * Bản không dấu bỏ chữ đơn mơ hồ: "thuong" (thương / thường), "yeu" (yêu /
 * yếu), "do" (đỡ / do), "than" (thân / than), "phan" (phản / phần).
 */
const QUAN_HE_KD = [
  'voi toi', 'voi minh', 'voi em', 'hop', 'hop nhau', 'giup', 'hieu', 'xung dot', 'va cham', 'cai nhau',
  'gan gui', 'xa cach', 'quan he', 'gan bo', 'tin tuong', 'ngoai tinh', 'chung thuy', 'lam an chung',
  'ung ho', 'uu ai', 'cat nhac', 'ghet', 'thuong toi', 'yeu toi', 'phan toi', 'do toi', 'nho duoc',
].join('|');

/** Người kia là chủ ngữ của chuyện vận — đọc trên lá số của chính họ. */
const VAN_RIENG = [
  'thăng chức', 'lên chức', 'thăng tiến', 'giàu', 'phát tài', 'đỗ', 'thi', 'thi cử', 'học hành',
  'đại học', 'cưới', 'lấy chồng', 'lấy vợ', 'bệnh', 'ốm', 'sức khỏe', 'sức khoẻ', 'khỏe', 'khoẻ',
  'hạn', 'tai nạn', 'mất', 'chết', 'qua đời', 'sống', 'thọ', 'sinh con', 'có con', 'có bầu',
  'kiếm tiền', 'làm ăn', 'công việc', 'sự nghiệp', 'tiền bạc', 'việc làm', 'đi làm', 'xin việc',
  'tiền', 'phá sản', 'nợ', 'kiện', 'bị thương', 'đỡ bệnh', 'khỏi bệnh', 'nghề', 'học', 'cất nhắc',
].join('|');
const VAN_RIENG_KD = [
  'thang chuc', 'len chuc', 'thang tien', 'giau', 'phat tai', 'thi cu', 'thi do', 'hoc hanh', 'dai hoc',
  'cuoi', 'lay chong', 'lay vo', 'benh', 'om', 'suc khoe', 'khoe', 'tai nan', 'qua doi', 'sinh con',
  'co con', 'co bau', 'kiem tien', 'lam an', 'cong viec', 'su nghiep', 'tien bac', 'viec lam', 'di lam',
  'xin viec', 'tien', 'pha san', 'bi thuong', 'nghe', 'hoc', 'cat nhac',
].join('|');

/** Câu hỏi có hỏi về một người cụ thể khác người hỏi không. `null` khi không. */
export function nhanDangDoiTuong(cauHoi: string): DoiTuongCauHoi | null {
  const cau = cauHoi.normalize('NFC').toLowerCase();

  let gap: { co: string; vai: VaiNguoi } | null = null;
  let mauBo = '';
  for (const n of NGUOI) {
    if (reTu(`${laVoChong(n.co) ? TRUOC_VO_CHONG : ''}${thoat(n.co)} ${CHU}`).test(cau)) {
      gap = n;
      mauBo = thoat(n.co);
      break;
    }
  }
  if (!gap) {
    // Chỉ chữ người dùng tự gõ không dấu: "Còn tôi thì sao" không thành "con tôi".
    const s = chuKhongDau(cau);
    for (const n of NGUOI) {
      const kd = boDau(n.co);
      if (KHONG_NHAN_KHONG_DAU.has(n.co)) {
        if (n.co !== 'bạn thân') continue;
        // "ban than toi" chỉ là bạn thân khi có ngữ cảnh quan hệ bạn bè.
        if (!/(?<= )ban than (?:cua )?toi(?= )/.test(s) || !/(?<= )(?:phan|choi|giup)(?= )/.test(s)) continue;
      } else if (!new RegExp(`(?<= )${laVoChong(n.co) ? TRUOC_VO_CHONG_KD : ''}${kd} ${CHU_KHONG_DAU}(?= )`).test(s)) {
        continue;
      }
      gap = n;
      mauBo = kd;
      break;
    }
  }
  if (!gap) return null;

  // Bỏ chính danh từ người trước khi dò tín hiệu: "người yêu" chứa "yêu", "bạn
  // thân" chứa "thân" — để nguyên thì câu nào về hai người đó cũng thành quan hệ.
  const conLai = cau.replace(reTu(mauBo), ' ');
  const quanHe = khopCum(conLai, QUAN_HE, QUAN_HE_KD);
  const vanRieng = khopCum(conLai, VAN_RIENG, VAN_RIENG_KD);
  /*
   * Có cả hai tín hiệu: chữ quan hệ nhiều nghĩa ("đỡ bệnh", "bị thương", "nghề
   * gì hợp", "có được cất nhắc", "học có hiểu bài") chỉ là quan hệ khi người hỏi
   * có mặt lần nữa trong câu ("thương tôi", "giúp tôi giàu", "hợp nhau").
   * Không có thì người kia là chủ ngữ của chuyện vận → vận riêng.
   */
  const conLaiNguoi = cau.replace(reTu(`${mauBo} ${CHU}|${mauBo} ${CHU_KHONG_DAU}`), ' ');
  const coNguoiHoi = khopCum(conLaiNguoi, 'tôi|mình|tớ|nhau|em', 'toi|minh|nhau|em');
  const loai = vanRieng && (!quanHe || !coNguoiHoi) ? 'van-rieng' : 'quan-he';
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
