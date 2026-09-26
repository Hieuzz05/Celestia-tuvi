import type { BaiV3, LoiV3 } from './kiem-v3';

/**
 * SỬA CỤC BỘ — chỉ đưa các CÂU dính lỗi cho model viết lại, thay vì bắt viết lại cả bài.
 *
 * Đo 26/09/2026 trên 120 câu: 31% câu phải chạy vòng sửa, vòng sửa chiếm 22% toàn bộ token ra
 * (mỗi lần ~1.100 token ra: cả dàn ý + bài + vì sao). 30 / 37 ca là lỗi nằm gọn trong một câu —
 * từ cấm, lộ tên sao, chữ nội bộ. Sửa cục bộ tốn ~100 token ra, và đúng hơn với ý định của vòng
 * sửa ("sửa ĐÚNG lỗi, giữ nguyên phần còn lại"): phần không lỗi giữ nguyên từng chữ.
 *
 * Chỉ dùng khi MỌI lỗi chặn đều khoanh được vào câu (có `cum`). Lỗi cấu trúc (độ dài, mở bằng
 * "Bạn", kết bằng lời khuyên) vẫn đi đường sửa cả bài.
 */

type Truong = 'luanGiai' | 'viSao' | 'goiY';
export interface CauCanSua {
  id: string;
  truong: Truong;
  cau: string;
  truoc: string;
  sau: string;
}

interface Tach {
  truong: Truong;
  /** Đoạn → các câu. viSao / goiY chỉ có một đoạn. */
  doan: string[][];
}

const TACH_CAU = /(?<=[.!?…])\s+(?=\S)/;

function tach(truong: Truong, van: string): Tach {
  const doan = truong === 'luanGiai' ? van.split(/\n\s*\n/) : [van];
  return { truong, doan: doan.map((d) => d.trim().split(TACH_CAU).filter(Boolean)) };
}

function ghep(t: Tach): string {
  return t.doan.map((d) => d.join(' ')).join(t.truong === 'luanGiai' ? '\n\n' : ' ');
}

export function suaCucBoDuoc(loi: LoiV3[]): boolean {
  const chan = loi.filter((l) => l.chan);
  return chan.length > 0 && chan.every((l) => l.cum?.length);
}

/** Các câu chứa cụm gây lỗi (không phân biệt hoa thường), kèm câu trước / sau làm ngữ cảnh */
export function chonCauLoi(bai: BaiV3, loi: LoiV3[]): CauCanSua[] | null {
  const cum = [...new Set(loi.filter((l) => l.chan).flatMap((l) => l.cum ?? []))].map((c) => c.toLowerCase()).filter(Boolean);
  if (!cum.length) return null;
  const ra: CauCanSua[] = [];
  for (const truong of ['luanGiai', 'viSao', 'goiY'] as Truong[]) {
    const t = tach(truong, bai[truong] ?? '');
    t.doan.forEach((d, i) =>
      d.forEach((cau, j) => {
        if (cum.some((c) => cau.toLowerCase().includes(c))) {
          ra.push({ id: `${truong}:${i}:${j}`, truong, cau, truoc: d[j - 1] ?? '', sau: d[j + 1] ?? '' });
        }
      })
    );
  }
  // Mọi cụm phải rơi vào ít nhất một câu — cụm vắt qua hai câu thì không sửa cục bộ được
  const phu = cum.every((c) => ra.some((x) => x.cau.toLowerCase().includes(c)));
  return phu && ra.length ? ra : null;
}

/** Thay câu đã sửa vào đúng chỗ; câu model không trả thì giữ nguyên */
export function apCauSua(bai: BaiV3, sua: Map<string, string>): BaiV3 {
  const ra: BaiV3 = { ...bai };
  for (const truong of ['luanGiai', 'viSao', 'goiY'] as Truong[]) {
    const t = tach(truong, bai[truong] ?? '');
    let doi = false;
    t.doan.forEach((d, i) =>
      d.forEach((_, j) => {
        const moi = sua.get(`${truong}:${i}:${j}`)?.trim();
        if (moi) {
          d[j] = moi;
          doi = true;
        }
      })
    );
    if (doi) ra[truong] = ghep(t);
  }
  return ra;
}

export function nhacSuaCucBo(cau: CauCanSua[], loi: LoiV3[]): string {
  const TEN: Record<Truong, string> = { luanGiai: 'bài luận', viSao: 'phần vì sao', goiY: 'gợi ý' };
  return `SỬA CỤC BỘ — chỉ viết lại ĐÚNG các câu dưới đây cho hết lỗi. Giữ nguyên ý, giọng văn và độ dài tương đương; câu mới phải nối mạch với câu trước và câu sau. Mọi luật trình bày ở trên vẫn áp dụng (bài luận không nêu tên sao, tên cung, thuật ngữ).

LỖI:
${loi.filter((l) => l.chan).map((l) => `- ${l.moTa}`).join('\n')}

CÂU CẦN SỬA:
${cau.map((c) => `[${c.id}] (${TEN[c.truong]}) ${c.cau}\n   trước: ${c.truoc || '—'}\n   sau: ${c.sau || '—'}`).join('\n')}

Chỉ trả JSON: {"sua":[{"id":"${cau[0].id}","cau":"câu đã sửa"}]}`;
}
