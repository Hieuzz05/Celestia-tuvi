/**
 * Bóc mã máy (E###, F###, W1–W3) khỏi chữ người dùng thấy ở đường chat thường.
 *
 * Mã căn cứ là để máy đối chiếu ý với nguồn, không phải chữ cho người đọc. Ngày
 * 15/11/2026 chạy thật 6 câu, 2 câu lộ mã ngay trong văn ("E004 cũng gắn tổ hợp
 * này với việc…", "E001 cũng ghi nhận Tham Lang…") — CELES-81. Đường Focused đã
 * chặn mã (`focused/kiem.ts` MA_MAY); đường thường chưa có gì.
 *
 * Cách bóc, KHÔNG BAO GIỜ thay mã bằng chữ khác (không viết "sách", "nguồn"…):
 * - mã nằm trong ngoặc "(E001, F002)", "[E004]": xoá cả cặp ngoặc;
 * - câu có mã đứng trơ trọi trong câu: bỏ cả câu nếu trường đó còn câu khác
 *   (câu kiểu "E004 cũng gắn…" là câu nhắc thêm nguồn, bỏ không mất ý chính);
 *   nếu đó là câu duy nhất thì chỉ xoá mã rồi dọn dấu câu.
 *
 * Mã bóc ra KHÔNG nhét lại vào `maNguon`: mã model tự bịa sẽ bị đánh "nguồn
 * không tồn tại" và làm rơi cả ý.
 *
 * Hàm thuần, tất định, không gọi model. Chạy SAU kiểm duyệt (lúc đó mã trong
 * `maNguon` đã đối chiếu xong), TRƯỚC `dungVan`.
 */
import type { TraLoiCoCauTruc, YChinh } from './bang-chung';

const MA = String.raw`(?:\b[EF]\d{3}\b|\bW[1-3]\b)`;

/** Có mã máy trong chữ. Dùng chung cho lưới soát cuối (`ngon-ngu.ts`). */
export const MA_MAY_TRONG_VAN = new RegExp(MA, 'u');

/** Cặp ngoặc có chứa mã: "(E001)", "(theo E001, F002)", "[E004]" */
const NGOAC_CO_MA = new RegExp(String.raw`\s*(?:\([^()\[\]]*?${MA}[^()\[\]]*?\)|\[[^()\[\]]*?${MA}[^()\[\]]*?\])`, 'gu');

/** Một chuỗi mã liền nhau: "E001", "E001, F002 và E004" */
const CHUOI_MA = new RegExp(String.raw`${MA}(?:\s*(?:,|;|/|&|và)\s*${MA})*`, 'gu');

function coMa(s: string): boolean {
  return MA_MAY_TRONG_VAN.test(s);
}

/** Tách câu, giữ nguyên dấu câu và khoảng trắng đi kèm để ghép lại y nguyên. */
function tachCau(s: string): string[] {
  return s.match(/[^.!?…\n]+(?:[.!?…]+|\n+|$)\s*|\n+/gu) ?? [s];
}

/**
 * Lời dẫn chỉ tồn tại để trỏ vào mã: "Theo E001, …", "Dựa trên F002 …". Xoá mã mà
 * để lại "Theo, …" là câu cụt, nên xoá cùng lời dẫn — vẫn chỉ XOÁ, không thêm chữ.
 */
const LOI_DAN_MA = new RegExp(
  String.raw`(?<![\p{L}\p{M}])(?:theo|dựa (?:trên|vào)|căn cứ(?: vào)?|như)\s+${MA}(?:\s*(?:,|;|/|&|và)\s*${MA})*\s*,?\s*`,
  'giu'
);

/**
 * Mã làm chủ ngữ của động từ dẫn nguồn: "E001 cũng ghi nhận Tham Lang khó phát sớm…".
 * Xoá cả cụm dẫn thì phần còn lại là chính ý đó ("Tham Lang khó phát sớm…") — vẫn chỉ XOÁ.
 */
const MA_DAN_NGUON = new RegExp(
  String.raw`${MA}(?:\s*(?:,|;|/|&|và)\s*${MA})*\s+(?:cũng\s+)?(?:ghi nhận|ghi|nói|nêu|cho rằng|nhận định|chỉ ra|lưu ý)(?:\s+(?:rằng|là))?\s+`,
  'giu'
);

/**
 * Câu mang điều kiện / giới hạn ("chưa đủ để chốt", "không chắc", "nếu… thì", "chỉ là").
 * Bỏ cả câu loại này làm phần còn lại nói mạnh hơn dữ kiện (celes-domain 18/11, câu thật
 * DC4) — nên giữ câu, chỉ xoá mã.
 */
const CAU_GIOI_HAN = /(?<![\p{L}\p{M}])(?:chưa|không|chẳng|tuy|nếu|trừ khi|chỉ|đừng)(?![\p{L}\p{M}])/iu;

function xoaMaTrongCau(cau: string): string {
  // Giữ đúng khoảng trắng đầu câu như gốc: mã đứng đầu câu xoá đi để lại dấu cách thừa.
  const dau = cau.match(/^\s*/u)?.[0] ?? '';
  const daXoa = dau + cau.slice(dau.length)
    .replace(MA_DAN_NGUON, '')
    .replace(LOI_DAN_MA, '')
    .replace(CHUOI_MA, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,.;:!?…)])/g, '$1')
    .replace(/([(\[])[ \t]+/g, '$1')
    .replace(/,(\s*[,.;:!?…])/g, '$1')
    .replace(/([:;])\s*,/g, '$1')
    .replace(/^\s*[,;:]?\s*/u, '');
  // Câu mở đầu bằng mã thì chữ đầu sau khi xoá phải viết hoa lại.
  return daXoa.replace(/^(\s*)(\p{Ll})/u, (_, k: string, c: string) => k + c.toUpperCase());
}

/** Bóc mã khỏi một đoạn chữ. Chữ không có mã thì trả về ĐÚNG chuỗi cũ. */
export function boMaTrongChu(s: string): string {
  if (!s || !coMa(s)) return s;
  // Ngoặc đứng đầu chuỗi "(E001) Mở đầu…" để lại dấu cách đầu: trả lại đúng đầu gốc.
  const dauGoc = s.match(/^\s*/u)?.[0] ?? '';
  const boNgoac = dauGoc + s.replace(NGOAC_CO_MA, '').trimStart();
  if (!coMa(boNgoac)) return boNgoac.replace(/[ \t]+([,.;:!?…])/g, '$1');

  const cau = tachCau(boNgoac);
  const conCauSach = cau.some((c) => c.trim() && !coMa(c));
  const giu = cau.map((c) => {
    if (!coMa(c)) return c;
    // Câu mang giới hạn, hoặc không còn câu sạch nào: giữ câu, chỉ xoá mã.
    if (!conCauSach || CAU_GIOI_HAN.test(c)) return xoaMaTrongCau(c);
    // Bỏ câu nhưng giữ xuống dòng của nó, để hai đoạn không dính vào nhau.
    return c.match(/\n[\s]*$/u)?.[0] ?? '';
  });
  // Bỏ câu cuối thì khoảng trắng sau câu áp chót thành đuôi thừa: cắt rồi trả lại đúng đuôi gốc.
  return giu.join('').replace(/[ \t]+\n/g, '\n').trimEnd() + (boNgoac.match(/\s+$/u)?.[0] ?? '');
}

function boMaMang(a: string[]): string[] {
  // Mục chỉ có mã (vd "E001") bóc xong rỗng thì bỏ mục, đừng để gạch đầu dòng trống.
  return a.map(boMaTrongChu).filter((c) => c.trim().length > 0);
}

function boMaY(y: YChinh): YChinh {
  return {
    ...y,
    tieuDe: boMaTrongChu(y.tieuDe),
    noiDung: boMaTrongChu(y.noiDung),
    ...(y.luongNguoc !== undefined ? { luongNguoc: boMaTrongChu(y.luongNguoc) } : {}),
    ...(y.neuThi !== undefined ? { neuThi: boMaTrongChu(y.neuThi) } : {}),
  };
}

/**
 * Bóc mã khỏi MỌI trường chữ người dùng thấy của một câu trả lời.
 * Không đụng `maDuKien` / `maNguon` / `maNghiemLy` (là dữ liệu cho máy, không hiện ra văn).
 */
export function boMaMay<T extends TraLoiCoCauTruc>(t: T): T {
  const ra: T = { ...t, tomTat: boMaTrongChu(t.tomTat), yChinh: t.yChinh.map(boMaY) };
  // Chỉ ghi lại trường ĐANG CÓ, để không đẻ khoá `undefined` mới trong đối tượng.
  for (const k of ['ketLuan', 'cachNoi', 'hoiLai', 'tuKiem'] as const) {
    if (typeof t[k] === 'string') ra[k] = boMaTrongChu(t[k]);
  }
  for (const k of ['canNhac', 'buocTiepTheo', 'goiYTiep'] as const) {
    if (Array.isArray(t[k])) ra[k] = boMaMang(t[k]);
  }
  return ra;
}
