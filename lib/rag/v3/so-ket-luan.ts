import { docNhieuTheoTienTo } from '@/lib/rag/noi-dung-ai';
import { THE_HE_DEM, type CauTraRaV3 } from './xu-ly';
import { PHIEN_BAN_V3 } from '.';

/**
 * SỔ KẾT LUẬN CHUNG (30/09/2026) — những gì bài luận giải đã kết luận về chính lá số này,
 * để Hỏi Celes (và các bề mặt sau) không nói ngược lại.
 *
 * Chủ dự án: các phần khác nhau của sản phẩm phải nói cùng một giọng về cùng một người.
 * Bản rẻ: chỉ ĐỌC đệm đã có, không sinh mới, không nhúng vector. Chưa đọc chủ đề nào thì
 * trả rỗng và Hỏi Celes chạy như cũ.
 *
 * `chartHash` phải là băm theo GIỜ LÁ SỐ (veGioLaSo) — cùng khoá bài v3 cất, KHÁC băm giờ
 * thô mà hỏi đáp dùng cho nhật ký.
 *
 * Thứ tự ưu tiên: "Tóm lại" của từng chủ đề (đã là kết luận), rồi ý chính phần tổng quan.
 * Lỗi nào cũng nuốt: thiếu sổ chỉ là kém nhất quán hơn, không phải lý do để chat hỏng.
 */

const TOI_DA = 6;

/** Câu đầu của một đoạn — một kết luận, không phải cả bài */
function cauDau(s: string): string {
  const t = s.replace(/\s+/g, ' ').trim();
  const m = t.match(/^.{20,260}?[.!?](?=\s|$)/);
  return (m ? m[0] : t.slice(0, 260)).trim();
}

export async function soKetLuanV3(chartHash: string | undefined, namXem: number): Promise<string[]> {
  if (!chartHash) return [];
  try {
    const tienTo = `nam:${namXem}|nhom:`;
    const ds = await docNhieuTheoTienTo<{ tomLai?: string } | CauTraRaV3[]>(
      { chartHash, beMat: 'luan-giai-v3', ngonNgu: 'vi' },
      tienTo,
      `|th:${THE_HE_DEM}`
    );
    const cuoiTom = `|th:${THE_HE_DEM}|tom-lai|k:${PHIEN_BAN_V3.khung}`;
    const tomLai = ds
      .filter((r) => r.khoaKy.endsWith(cuoiTom) && !Array.isArray(r.noiDung) && typeof r.noiDung?.tomLai === 'string')
      .map((r) => cauDau((r.noiDung as { tomLai: string }).tomLai));
    const tq = ds.find((r) => r.khoaKy === `${tienTo}tong-quan|th:${THE_HE_DEM}` && Array.isArray(r.noiDung));
    const yTongQuan = ((tq?.noiDung as CauTraRaV3[] | undefined) ?? [])
      .filter((c) => !c.chuaViet)
      .map((c) => c.yChinh?.[0] ?? (c.luanGiai ? cauDau(c.luanGiai) : ''));
    return [...tomLai, ...yTongQuan].filter((x) => x.length > 20).slice(0, TOI_DA);
  } catch {
    return [];
  }
}
