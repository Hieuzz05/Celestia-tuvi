import { createHash } from 'node:crypto';
import { PHIEN_BAN_NGON_NGU } from './ngon-ngu';
import { PHIEN_BAN_VALIDATOR } from './kiem-duyet';
import { PHIEN_BAN_PLANNER } from './planner';
import { PHIEN_BAN_NGHIENG } from './nghieng-ve';
import { PHIEN_BAN_TRUY_HOI } from './truy-hoi';
import { PHIEN_BAN_UU_TIEN } from './uu-tien-nguon';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import { PHIEN_BAN_CACH_CUC } from '@/lib/tuvi/cach-cuc';
import { PHIEN_BAN_DO_NOI_BAT } from '@/lib/tuvi/do-noi-bat';

/**
 * MỘT PHIÊN BẢN LOGIC CHO MỌI BỀ MẶT — dấu vân tay của bộ máy đang tính bài.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO CẦN
 *
 * Bộ nhớ đệm khoá theo (lá số, bề mặt, kỳ, ngôn ngữ). Sửa logic không đổi bất
 * kỳ thứ nào trong bốn thứ ấy, nên người đã từng đọc sẽ đọc lại đúng bài cũ —
 * mãi mãi, hoặc cho tới khi có người nhớ chạy tay `chay-lai-luan-giai.ts`.
 *
 * ---------------------------------------------------------------------------
 * GIỌNG VĂN KHÔNG VÀO KHOÁ (quyết định 10.19 C, làm ở K2 — 22/10/2026)
 *
 * Trước K2, băm này gồm cả chuẩn ngôn ngữ (`CHUAN_NGON_NGU_CELES`) và danh sách
 * chữ trừu tượng: sửa một chữ giọng văn là toàn bộ đệm của 6 bề mặt mất hiệu lực,
 * người đọc thấy bài mình đã đọc đổi khác mà lá số không đổi. Chủ dự án chọn:
 * sửa giọng KHÔNG kéo bài cũ, chỉ bài mới viết theo giọng mới; sửa logic (phương
 * pháp an sao, cách cục, bộ kiểm, truy hồi) thì bài viết lại khi mở.
 *
 * Nói thật: đây là băm các số TĂNG TAY. Sửa một tệp logic mà quên tăng phiên bản
 * của tệp ấy thì bài cũ vẫn nằm đó — chưa có máy canh cho lỗ này.
 *
 * Prompt riêng của từng bề mặt (vd hằng `s:` của bảng lĩnh vực, bản đọc sâu):
 * đổi GIỌNG ở đó thì đừng tăng `s:` — cùng lý do như trên.
 *
 * Luận giải V3 không đi qua dấu này: nó có dấu `lg` trên từng câu
 * (`LOGIC_V3`, lib/rag/v3/xu-ly.ts).
 */

/**
 * Lối thoát cho luật an toàn / kết luận nằm trong chuẩn ngôn ngữ. Chuẩn ngôn ngữ
 * không còn vào băm, nên một lỗi giọng nguy hiểm (lời phán cực đoan, sai kết luận)
 * sửa xong vẫn không tới bài cũ. Gặp đúng trường hợp đó thì tăng số này — mọi
 * bài của 6 bề mặt viết lại khi mở. Không tăng cho sửa giọng thường.
 */
export const XA_DEM_CO_CHU_DICH = 1;

/** Đầu vào băm, theo thứ tự — export để test dựng lại và kiểm giọng không lọt vào */
export const DAU_VAO_PHIEN_BAN_CHU: readonly (string | number)[] = [
  PHIEN_BAN_NGON_NGU,
  PHIEN_BAN_VALIDATOR,
  PHIEN_BAN_PLANNER,
  /*
   * Phương pháp an sao. Thêm 24/09/2026: sửa độ sáng Khốc/Hư/Hóa Kỵ mà
   * không đổi khoá thì bài đã đệm vẫn luận theo độ sáng SAI mãi mãi.
   */
  PHUONG_PHAP.phienBan,
  // K2: các phiên bản logic trước đây nằm ngoài khoá — sửa cách cục từng không làm bài nào đổi
  PHIEN_BAN_CACH_CUC,
  PHIEN_BAN_NGHIENG,
  PHIEN_BAN_TRUY_HOI,
  PHIEN_BAN_UU_TIEN,
  PHIEN_BAN_DO_NOI_BAT,
  XA_DEM_CO_CHU_DICH,
];

export const PHIEN_BAN_CHU = createHash('sha1').update(DAU_VAO_PHIEN_BAN_CHU.join('|')).digest('hex').slice(0, 8);

/** Gắn dấu vân tay vào một khoá kỳ — dùng ở MỌI chỗ gọi `layHoacSinh` */
export function kyCoPhienBan(goc: string): string {
  return `${goc}|v:${PHIEN_BAN_CHU}`;
}

/**
 * Khoá kỳ của bảng tám lĩnh vực — MỘT hàm cho cả bên ghi lẫn bên đọc.
 *
 * Trước đây hai bên tự dựng khoá riêng: API ghi bằng `nam:2026|v:<bản>`, còn
 * lớp "đã nói trước" của chat đọc bằng `nam:2026`. Hai chuỗi khác nhau nên lần
 * đọc ấy LUÔN trượt — im lặng, vì trượt đệm là chuyện bình thường và không ai
 * phân biệt được "chưa có" với "có mà tìm sai chỗ".
 *
 * Hậu quả: chat mất hẳn khối giữ nhất quán với bảng lĩnh vực, đúng thứ khối ấy
 * sinh ra để làm. Một hàm dùng chung thì không lệch lại được nữa.
 */
export function khoaBangLinhVuc(namXem: number, phienBanBang: string): string {
  return kyCoPhienBan(`nam:${namXem}|s:${phienBanBang}`);
}
