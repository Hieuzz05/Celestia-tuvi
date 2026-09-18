import { goiVoiFallback } from '@/lib/ai/fallback';
import { docObjectJson } from './doc-json';
import { nhanDangThucThe } from './thuc-the';

/**
 * Sửa câu kê sao, thay vì vứt cả bài vì nó.
 *
 * Luật cho bề mặt ngắn: tối đa MỘT tên sao trong một câu, và chỉ khi tên đó
 * giải thích được điều vừa nói bằng lời thường. Đo trên gpt-4o-mini: thỉnh
 * thoảng thẻ Điểm nổi bật vẫn ra "…thể hiện qua Vũ Khúc và Thiên Phủ trong cung
 * Mệnh" — hai tên sao trong một câu, đúng thứ prompt cấm.
 *
 * Hai cách xử đều tệ theo cách riêng:
 *  - Loại cả thẻ: mất một bài đúng vì một câu sai hình. Người dùng thấy bản
 *    template, và không ai biết vì sao.
 *  - Bỏ qua: luật thành lời khuyên, và lời khuyên thì model không giữ.
 *
 * Cách thứ ba là sửa. Gom mọi câu phạm luật của cả lượt sinh vào MỘT lần gọi,
 * xin viết lại bằng lời thường. Giữ nguyên ý, chỉ bỏ cái tên. Một lần gọi nhỏ
 * cho cả lượt, và chỉ khi thật sự có câu phạm.
 *
 * Sửa hỏng thì trả lại nguyên văn: câu kê sao vẫn hơn không có câu nào.
 */

/** Số tên sao riêng biệt trong một câu */
export function demTenSao(cau: string): number {
  return new Set(
    nhanDangThucThe(cau)
      .filter((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION')
      .map((t) => t.id)
  ).size;
}

/** Câu nào có từ hai tên sao trở lên thì đang kê sao chứ không luận */
export function laCauKeSao(cau: string, tran = 2): boolean {
  return demTenSao(cau) >= tran;
}

/** Nhiều câu trong một chuỗi — tách theo dấu kết câu */
function tachCau(doan: string): string[] {
  return doan.split(/(?<=[.!?])\s+/).filter((c) => c.trim().length > 0);
}

/**
 * Viết lại những câu kê sao trong một tập văn bản.
 *
 * Nhận vào một bảng khoá → đoạn, trả về bảng đã sửa. Không có câu nào phạm thì
 * trả lại nguyên bảng cũ và KHÔNG gọi model.
 */
export async function suaCauKeSao(
  van: Record<string, string>,
  tuyChon: { tran?: number; toiDa?: number } = {}
): Promise<Record<string, string>> {
  const tran = tuyChon.tran ?? 2;
  const toiDa = tuyChon.toiDa ?? 6;

  // Gom mọi câu phạm luật của cả lượt sinh
  const viPham: { khoa: string; viTri: number; cau: string }[] = [];
  const cauTheoKhoa = new Map<string, string[]>();
  for (const [khoa, doan] of Object.entries(van)) {
    const cs = tachCau(doan);
    cauTheoKhoa.set(khoa, cs);
    cs.forEach((c, i) => {
      if (viPham.length < toiDa && laCauKeSao(c, tran)) viPham.push({ khoa, viTri: i, cau: c });
    });
  }
  if (!viPham.length) return van;

  const danhSach = viPham.map((p, i) => `C${i + 1}. ${p.cau}`).join('\n');

  const system = `Bạn là biên tập viên của Celestia. Việc duy nhất: viết lại từng câu cho bớt tên sao.

LUẬT:
- Giữ nguyên ý và giữ nguyên giọng. Đây là sửa chữ, không phải viết lại nội dung.
- Bỏ tên sao Tử Vi khỏi câu. Nếu ý của câu dựa vào một tên sao thì giữ đúng MỘT tên, bỏ phần còn lại.
- Nói bằng lời thường: điều đó tạo ra gì trong đời sống, chứ không phải nó tên là gì.
- Không thêm ý mới, không thêm lời khuyên, không dài hơn câu gốc.

TRẢ VỀ DUY NHẤT MỘT OBJECT JSON, không rào code:
{ "cau": [ { "id": "C1", "moi": "..." } ] }`;

  let sua: Record<string, string> = {};
  try {
    const kq = await goiVoiFallback(
      { system, user: danhSach, maxTokens: 1200, temperature: 0.3 },
      undefined
    );
    const tho = docObjectJson(kq.text);
    const mang = Array.isArray((tho as { cau?: unknown } | null)?.cau)
      ? ((tho as { cau: unknown[] }).cau as { id?: unknown; moi?: unknown }[])
      : [];
    for (const m of mang) {
      if (typeof m.id !== 'string' || typeof m.moi !== 'string') continue;
      const so = Number(m.id.replace(/^C/i, ''));
      if (!viPham[so - 1]) continue;
      const moi = m.moi.trim();
      // Sửa xong mà vẫn kê sao, hoặc cụt hơn hẳn câu gốc, thì coi như hỏng
      if (moi.length < 12 || laCauKeSao(moi, tran)) continue;
      sua[`${viPham[so - 1].khoa}|${viPham[so - 1].viTri}`] = moi;
    }
  } catch {
    // Sửa hỏng thì giữ nguyên văn — câu kê sao vẫn hơn không có câu nào
    sua = {};
  }
  if (!Object.keys(sua).length) return van;

  const ra: Record<string, string> = {};
  for (const [khoa, cs] of cauTheoKhoa) {
    ra[khoa] = cs.map((c, i) => sua[`${khoa}|${i}`] ?? c).join(' ');
  }
  return ra;
}
