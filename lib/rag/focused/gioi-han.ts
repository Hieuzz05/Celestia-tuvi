/**
 * GIỚI HẠN CỦA LÁ SỐ — đường Focused (CEL-186, final hardening 04/10/2026).
 *
 * Hai chỗ dừng trước truy hồi và trước model:
 *   AGE-01  mốc hỏi kết thúc trước ngày sinh → chưa có vận nào để đọc (DỮ KIỆN);
 *   AGE-02  chuyện người lớn (việc làm, hôn nhân, người yêu) ở tuổi chưa hợp —
 *           NGOẠI LỆ TẠM duy nhất (chủ dự án 04/10): đóng băng, không thêm từ khoá,
 *           bước 2 hạ thành cách nói. Danh sách lối dừng: `scripts/test-loi-chi-ma.ts`.
 *
 * PERSON-03 (lệch giới) đã bỏ 04/10: lá số đang mở có thể không phải của người
 * hỏi, và người nam vẫn có thể có chồng — luật chữ không đủ để dừng lượt.
 *
 * Hàm thuần, không gọi model.
 */

import type { LaSo } from '@/lib/tuvi/ansao';
import type { ChuDe, KeHoachTruyVan } from '../planner';
import { cauChuaHopTuoi, cauTruocSinh, type CauMa, type MocHoi } from './cau-ma';
import type { DoiTuongCauHoi } from './doi-tuong';
import { khopCum } from './khop';
import type { NgonNgu } from './ngon-ngu';
import type { BoiCanhThoiGian } from './phan-loai';
import { ngayCuoiNamAm, ngayCuoiThangAm } from './thang-am';

/** Tuổi âm dưới mức này thì không kể chuyện việc làm, hôn nhân, người yêu (AGE-02). */
export const TUOI_NGUOI_LON = 15;

/* ------------------------------------------------------ trước ngày sinh */

/** Mốc người hỏi gọi tên + ngày dương cuối cùng của mốc ấy. Không gọi mốc nào thì null. */
export function mocDaHoi(
  tg: BoiCanhThoiGian,
  keHoach: Pick<KeHoachTruyVan, 'namMucTieu'>
): { moc: MocHoi; ketThuc: Date } | null {
  const t = tg.thang;
  if (t?.muc.loai === 'thang-duong') {
    return {
      moc: { loai: 'thang-duong', nam: t.muc.nam, thang: t.muc.thang },
      ketThuc: new Date(Date.UTC(t.muc.nam, t.muc.thang, 0)),
    };
  }
  if (t?.muc.loai === 'thang-am') {
    const kt = ngayCuoiThangAm(t.muc.namAm, t.muc.thangAm, t.muc.nhuan);
    return kt
      ? { moc: { loai: 'thang-am', nam: t.muc.namAm, thang: t.muc.thangAm, nhuan: t.muc.nhuan }, ketThuc: kt }
      : null;
  }
  // Chỉ năm GỌI TÊN mới so — năm đang xem mặc định là năm hiện tại, không phải câu hỏi của họ.
  if (keHoach.namMucTieu === undefined) return null;
  const kt = ngayCuoiNamAm(tg.namHieuLuc);
  return kt ? { moc: { loai: 'nam', nam: tg.namHieuLuc }, ketThuc: kt } : null;
}

/**
 * AGE-01. Trước sinh khi mốc NGƯỜI HỎI GỌI TÊN kết thúc trước ngày sinh dương:
 * tháng chứa ngày sinh vẫn đọc được. Năm âm trước năm sinh âm cũng là trước sinh
 * (một năm âm kết thúc trước Tết năm sau, nên điều kiện ngày đã bao).
 */
export function chanTruocSinh(
  laSo: Pick<LaSo, 'thongTin'>,
  tg: BoiCanhThoiGian,
  keHoach: Pick<KeHoachTruyVan, 'namMucTieu'>,
  nn: NgonNgu
): CauMa | null {
  const sinh = laSo.thongTin;
  const ngaySinh = Date.UTC(sinh.nam, sinh.thang - 1, sinh.ngay);
  const hoi = mocDaHoi(tg, keHoach);
  // Không gọi mốc thì không xét: "tính cách của bé" trên lá số sinh sau hôm nay vẫn đọc được bản mệnh.
  if (!hoi || hoi.ketThuc.getTime() >= ngaySinh) return null;
  return cauTruocSinh(hoi.moc, sinh, nn);
}

/* ------------------------------------------------------ chưa hợp tuổi */

const NGUOI_LON =
  'việc làm|công việc|đi làm|xin việc|nghỉ việc|chuyển việc|đổi việc|nghề|sự nghiệp|lương|thăng chức|thăng tiến|lên chức|' +
  'đồng nghiệp|sếp|cấp trên|kinh doanh|làm ăn|công ty|khởi nghiệp|' +
  'kết hôn|cưới|lấy chồng|lấy vợ|hôn nhân|người yêu|yêu đương|hẹn hò|ly hôn|ly dị|ngoại tình|chồng|vợ|bạn đời|tình duyên|tình yêu|bạn trai|bạn gái|crush';
const NGUOI_LON_KD =
  'viec lam|cong viec|di lam|xin viec|nghi viec|chuyen viec|doi viec|su nghiep|tien luong|thang chuc|thang tien|len chuc|' +
  'dong nghiep|sep|cap tren|kinh doanh|lam an|cong ty|khoi nghiep|' +
  'ket hon|cuoi vo|cuoi chong|lay chong|lay vo|chong toi|vo toi|hon nhan|nguoi yeu|yeu duong|hen ho|ly hon|ly di|ngoai tinh|ban doi|tinh duyen|tinh yeu|ban trai|ban gai|crush|' +
  // Câu tiếng Anh: planner chỉ hiểu tiếng Việt, nên chủ đề có thể ra tổng quan — bắt bằng từ.
  // Không có "work" trần: "will her studies work out" là câu học hành.
  'my work|at work|job|jobs|career|promotion|salary|boss|colleague|colleagues|coworker|coworkers|business|' +
  'marriage|married|marry|wedding|divorce|husband|wife|partner|boyfriend|girlfriend|lover|dating|romance|love life';
/** Chuyện học của trẻ đi qua Quan Lộc — không chặn. Không có "thi" trần: "thi sao" gõ không dấu là "thì sao". */
const HOC = 'học|học hành|thi cử|đi thi|kỳ thi|trường|lớp|điểm số';
const HOC_KD = 'hoc|hoc hanh|thi cu|di thi|ky thi|truong hoc|lop hoc|diem so';
/** Hỏi thiên hướng / năng khiếu là câu bản mệnh cả đời, cha mẹ hỏi cho con — không chặn. */
const THIEN_HUONG = 'hợp nghề|nghề gì|nghề nào|năng khiếu|thiên hướng|lớn lên|khi lớn';
const THIEN_HUONG_KD = 'hop nghe|nghe gi|nghe nao|nang khieu|thien huong|lon len|khi lon';
const VAI_NGUOI_LON = new Set<DoiTuongCauHoi['vai']>(['vo-chong', 'nguoi-yeu', 'cap-tren']);
const CHU_DE_NGUOI_LON = new Set<ChuDe>(['tinh-cam', 'su-nghiep']);

export function tuoiAmTai(laSo: Pick<LaSo, 'thongTin'>, namAm: number): number {
  return namAm - laSo.thongTin.amLich.nam + 1;
}

/**
 * AGE-02: tuổi âm của năm đang đọc dưới `TUOI_NGUOI_LON` và câu hỏi về chuyện
 * người lớn CỦA CHÍNH người có lá số, trong một khoảng thời gian cụ thể.
 *
 * Không chặn:
 *   - câu cả đời ("sau này", "cả đời" → `giai-doan`) và câu hỏi thiên hướng nghề:
 *     đó là bản mệnh, cha mẹ hỏi cho con là chuyện thường;
 *   - câu về người khác trong nhà ("bố tôi công việc", "chị tôi lấy chồng",
 *     "bố mẹ tôi có ly hôn không") — F2 / F1 lo, không lấy tuổi đứa trẻ trả lời.
 *
 * `theoChuDe` = false ở lượt chặn thứ hai: chủ đề khi đó có thể do model phân
 * loại, cùng một câu không được lúc chặn lúc không. Lượt hai chỉ xét từ khoá + vai.
 */
export function chanChuaHopTuoi(
  laSo: Pick<LaSo, 'thongTin'>,
  tg: BoiCanhThoiGian,
  cauHoi: string,
  keHoach: Pick<KeHoachTruyVan, 'chuDe' | 'phamViThoiGian'>,
  doiTuong: DoiTuongCauHoi | null,
  nn: NgonNgu,
  theoChuDe = true
): CauMa | null {
  const tuoi = tuoiAmTai(laSo, tg.namHieuLuc);
  if (tuoi < 1 || tuoi >= TUOI_NGUOI_LON) return null;
  if (keHoach.phamViThoiGian === 'giai-doan' || khopCum(cauHoi, THIEN_HUONG, THIEN_HUONG_KD)) return null;
  const vaiNguoiLon = !!doiTuong && (VAI_NGUOI_LON.has(doiTuong.vai) || doiTuong.nhan === 'đồng nghiệp');
  if (doiTuong && !vaiNguoiLon) return null;
  const hoc = khopCum(cauHoi, HOC, HOC_KD);
  const nguoiLon =
    vaiNguoiLon ||
    khopCum(cauHoi, NGUOI_LON, NGUOI_LON_KD) ||
    (theoChuDe && CHU_DE_NGUOI_LON.has(keHoach.chuDe) && !hoc);
  if (!nguoiLon) return null;
  return cauChuaHopTuoi(tuoi, tg.namHieuLuc, nn);
}
