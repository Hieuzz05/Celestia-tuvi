/**
 * CỔNG THU HỒI (X3, CELES-27, 22/10/2026) — phần thuần: câu / tóm lại / bức tranh đã đệm có dính một
 * mục thư viện đã bị thu hồi không. Không import Supabase (app di động có thể kéo tệp này qua đồ thị
 * import); đọc lệnh thu hồi ở `kho.ts`.
 *
 * Khoá là DẤU nội dung của mục (`dauMuc`, thu-vien/dau.ts), đã lưu trong `canCu.thuVien[].dau` của mọi
 * câu V3 viết từ K1. Câu viết trước K1 không có căn cứ → cổng không thấy, không chặn (điểm mù đã ghi).
 *
 * Hai loại dấu, KHÔNG trộn (phản biện bản 2, S-A):
 *   - `dauHienTai`: căn cứ của chính bản này — quyết câu có phải viết lại không, và là đầu vào của `dauTV`.
 *   - `dauLichSu` = hiện tại ∪ `thayThuHoi`: chỉ để nhận ra tóm lại / bức tranh CŨ (không có `dauTV`)
 *     được ghép từ bản trước của câu. Dùng nhầm cho câu thì câu vừa viết lại sạch vẫn bị coi là dính và
 *     bị viết lại ở mỗi lần mở.
 */

export interface CoCanCu {
  canCu?: { thuVien?: { dau: string }[] };
  /** Dấu đã thu hồi của các bản trước của câu này (chỉ trong đệm) */
  thayThuHoi?: string[];
}

export const TAP_RONG: ReadonlySet<string> = new Set();

export const dauHienTai = (c: CoCanCu): string[] => (c.canCu?.thuVien ?? []).map((t) => t.dau);
export const dauLichSu = (c: CoCanCu): string[] => [...dauHienTai(c), ...(c.thayThuHoi ?? [])];

const giao = (ds: readonly string[], tap: ReadonlySet<string>) => tap.size > 0 && ds.some((d) => tap.has(d));

/** Câu này (bản đang có) dựa vào một mục đã thu hồi */
export const dinhThuHoi = (c: CoCanCu, tap: ReadonlySet<string>) => giao(dauHienTai(c), tap);

const gom = (ds: Iterable<string>) => [...new Set(ds)].sort();

/**
 * `thayThuHoi` của bản viết lại: dấu đã thu hồi mà bản cũ dựa vào, cộng `thayThuHoi` cũ. Bản cũ không dính
 * (viết lại vì lệch logic) thì chỉ mang `thayThuHoi` cũ sang. Rỗng → undefined, để không thêm trường thừa.
 */
export function thayThuHoiMoi(cu: CoCanCu | undefined, tap: ReadonlySet<string>): string[] | undefined {
  if (!cu) return undefined;
  const ds = gom([...(cu.thayThuHoi ?? []), ...dauHienTai(cu).filter((d) => tap.has(d))]);
  return ds.length ? ds : undefined;
}

/** Dấu của một bài tổng hợp (tóm lại) từ các câu thật đã đưa vào prompt — chỉ dấu hiện tại */
export const dauTVTuCau = (cau: CoCanCu[]): string[] => gom(cau.flatMap(dauHienTai));

/**
 * Dấu một nguồn tổng hợp đóng góp vào bài tổng hợp tầng trên (bức tranh): có `dauTV` thì lấy nó; không
 * có (viết trước X3) thì lấy dấu lịch sử của các câu nhóm đó (phản biện bản 2, S-B).
 */
export const dauTVCuaNguon = (ban: { dauTV?: unknown }, cauNhom: () => CoCanCu[]): string[] =>
  Array.isArray(ban.dauTV) ? (ban.dauTV as string[]) : gom(cauNhom().flatMap(dauLichSu));

/**
 * Tóm lại / bức tranh đã đệm có dính không. Có `dauTV` (viết từ X3) → so thẳng. Không có (viết trước X3)
 * → dính khi một câu nguồn hiện có, hoặc bản trước của nó, dựa vào mục đã thu hồi (luật L3).
 */
export function tongHopDinh(ban: { dauTV?: unknown }, cauNguon: () => CoCanCu[], tap: ReadonlySet<string>): boolean {
  if (!tap.size) return false;
  if (Array.isArray(ban.dauTV)) return giao(ban.dauTV as string[], tap);
  return cauNguon().some((c) => giao(dauLichSu(c), tap));
}
