import { createHash } from 'node:crypto';
import { CHUAN_NGON_NGU_CELES } from './chuan-ngon-ngu';
import { CHU_TRUU_TUONG } from './chu-truu-tuong';
import { PHIEN_BAN_NGON_NGU } from './ngon-ngu';
import { PHIEN_BAN_VALIDATOR } from './kiem-duyet';
import { PHIEN_BAN_PLANNER } from './planner';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';

/**
 * MỘT PHIÊN BẢN CHỮ CHO MỌI BỀ MẶT — dấu vân tay của bộ luật đang viết bài.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO CẦN
 *
 * Bộ nhớ đệm khoá theo (lá số, bề mặt, kỳ, ngôn ngữ). Sửa prompt không đổi bất
 * kỳ thứ nào trong bốn thứ ấy, nên người đã từng đọc sẽ đọc lại đúng bài cũ —
 * mãi mãi, hoặc cho tới khi có người nhớ chạy tay `chay-lai-luan-giai.ts`.
 *
 * Đây không phải rủi ro lý thuyết. Đếm được lúc thêm hằng số này: chỉ 2 trên 7
 * bề mặt có phiên bản prompt trong khoá. Tám phiên bản vừa được bump trong một
 * phiên làm việc, và phần lớn không tới được người dùng nào đang có đệm.
 *
 * ---------------------------------------------------------------------------
 * BĂM TỪ CHÍNH BỘ LUẬT, KHÔNG ĐẾM TAY
 *
 * Một hằng số đếm tay chỉ đổi khi có người nhớ đổi nó, mà quên chính là cách
 * hỏng này xảy ra ngay từ đầu. Băm thì sửa một chữ trong chuẩn ngôn ngữ là mọi
 * khoá đổi theo, không cần ai nhớ gì.
 *
 * Cái giá phải nói rõ: mỗi lần sửa chuẩn là toàn bộ đệm mất hiệu lực và bài
 * được sinh lại, tức là tốn tiền model. Đó là đánh đổi có chủ ý — người đọc
 * nhận bài cũ trong khi lỗi đã sửa xong từ lâu là cái giá đắt hơn.
 *
 * KHÔNG băm prompt riêng của từng bề mặt: chúng nằm trong thân hàm, dựng lúc
 * chạy từ chính lá số, nên không có chuỗi tĩnh nào để băm. Phần chung này đổi
 * gần như mỗi lần sửa giọng, nên nó bắt được phần lớn; phần còn lại vẫn phải
 * bump hằng số của bề mặt ấy bằng tay.
 */
export const PHIEN_BAN_CHU = createHash('sha1')
  .update(
    [
      CHUAN_NGON_NGU_CELES,
      CHU_TRUU_TUONG.map(([a, b]) => `${a}>${b}`).join(','),
      PHIEN_BAN_NGON_NGU,
      PHIEN_BAN_VALIDATOR,
      PHIEN_BAN_PLANNER,
      /*
       * Phương pháp an sao. Thêm 24/09/2026: sửa độ sáng Khốc/Hư/Hóa Kỵ mà
       * không đổi khoá thì bài đã đệm vẫn luận theo độ sáng SAI mãi mãi — kể cả
       * luận giải v3, vốn chỉ khoá theo phiên bản khung/dữ kiện/prompt.
       */
      PHUONG_PHAP.phienBan,
    ].join('|')
  )
  .digest('hex')
  .slice(0, 8);

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
