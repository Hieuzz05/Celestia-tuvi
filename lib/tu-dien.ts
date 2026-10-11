import { KHUON, type NgonNguDoc } from '@/lib/tuvi/quick-read-noi-dung';

/**
 * Từ điển thuật ngữ (CEL-075) — KHÔNG có lời giải nghĩa riêng.
 *
 * Mọi nghĩa đọc thẳng từ bảng chữ của bản đọc nhanh
 * (lib/tuvi/quick-read-noi-dung.ts): sửa nét một sao ở đó thì từ điển đổi
 * theo, không có bản thứ hai để lệch. Chỉ tên nhóm, tên khái niệm và khuôn
 * nối nằm ở lib/i18n (t.tuDien). Hàm thuần — trang và bài kiểm cùng gọi.
 */

export type NhomTuDien = 'chinhTinh' | 'cung' | 'phuTinh' | 'trangSinh' | 'khaiNiem';

export interface MucTuDien {
  /** Neo trên trang, duy nhất trong cả từ điển */
  id: string;
  ten: string;
  nghia: string;
}

export interface NhomMuc {
  nhom: NhomTuDien;
  muc: MucTuDien[];
}

/** Chữ lấy từ lib/i18n — tách ra để hàm này không phụ thuộc React */
export interface ChuTuDien {
  thanCu: string;
  daiVan: string;
  tieuHan: string;
  nguyetHan: string;
  tuanTriet: string;
  /** Khuôn cho vòng Tràng Sinh, có `{net}` — nét gốc là mảnh câu thiếu chủ ngữ */
  mauTrangSinh: string;
}

export const THU_TU_NHOM: NhomTuDien[] = ['chinhTinh', 'cung', 'phuTinh', 'trangSinh', 'khaiNiem'];

export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

const maMuc = (s: string) =>
  boDau(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const hoaDau = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const cham = (s: string) => (/[.!?…]$/.test(s) ? s : `${s}.`);
/** Câu đầu của một lời căn cứ — phần sau câu đầu nói về lá số cụ thể ({cung}, {nam}) */
const cauDau = (s: string) => {
  const i = s.indexOf('. ');
  return i < 0 ? s : s.slice(0, i + 1);
};

export function dungTuDien(nn: NgonNguDoc, chu: ChuTuDien): NhomMuc[] {
  const k = KHUON[nn];
  const muc: Record<NhomTuDien, MucTuDien[]> = {
    chinhTinh: Object.entries(k.netSao).map(([sao, n]) => ({
      id: maMuc(sao),
      ten: sao,
      // Bản câu hoàn chỉnh nếu có; mảnh thì viết hoa đầu và chấm cuối
      nghia: `${n.manhCau ?? cham(hoaDau(n.manh))} ${n.canCau ?? cham(hoaDau(n.can))}`,
    })),
    cung: Object.entries(k.chuDeCung).map(([cung, y]) => ({
      id: `cung-${maMuc(cung)}`,
      ten: cung,
      nghia: cham(hoaDau(y)),
    })),
    phuTinh: Object.entries(k.netPhuTinh).map(([sao, y]) => ({
      id: maMuc(sao),
      ten: sao,
      nghia: cham(hoaDau(y)),
    })),
    trangSinh: Object.entries(k.netTrangSinh).map(([giaiDoan, y]) => ({
      id: `trang-sinh-${maMuc(giaiDoan)}`,
      ten: giaiDoan,
      nghia: cham(chu.mauTrangSinh.replace('{net}', y)),
    })),
    khaiNiem: [
      { id: 'cung-than', ten: chu.thanCu, nghia: cauDau(k.canCu.thanCuY) },
      { id: 'dai-van', ten: chu.daiVan, nghia: cauDau(k.canCu.giaiDoanTuoiY) },
      { id: 'tieu-han', ten: chu.tieuHan, nghia: cauDau(k.canCu.namUngVaoY) },
      { id: 'nguyet-han', ten: chu.nguyetHan, nghia: cauDau(k.canCu.thangUngVaoY) },
      { id: 'tuan-triet', ten: chu.tuanTriet, nghia: k.canCu.tuanTrietY.replace('{ten}', chu.tuanTriet) },
    ],
  };
  // Bỏ dấu có thể làm hai tên trùng neo (Quan Phù / Quan Phủ) — thêm số cho tên sau
  const daCo = new Set<string>();
  return THU_TU_NHOM.map((nhom) => ({
    nhom,
    muc: muc[nhom].map((m) => {
      let id = m.id;
      for (let i = 2; daCo.has(id); i++) id = `${m.id}-${i}`;
      daCo.add(id);
      return { ...m, id };
    }),
  }));
}

/** Lọc theo ô tìm: khớp tên hoặc nghĩa, không phân biệt dấu */
export function locTuDien(ds: NhomMuc[], q: string): NhomMuc[] {
  const tim = boDau(q.trim());
  if (!tim) return ds;
  return ds
    .map((n) => ({ ...n, muc: n.muc.filter((m) => boDau(m.ten).includes(tim) || boDau(m.nghia).includes(tim)) }))
    .filter((n) => n.muc.length > 0);
}
