import type { Cung, LaSo } from '@/lib/tuvi/ansao';
import type { MucThuVien, QuanHe } from './kieu';

/**
 * BỘ KHỚP ĐIỀU KIỆN — chạy trên dữ kiện engine, trong bộ nhớ, mili-giây
 * (KIEN-TRUC-LUAN-GIAI.md mục 8). Không gọi model, không truy vấn.
 *
 * Mọi quan hệ neo vào MỘT cung gốc. "Giáp" là quan hệ ba ngôi: hai sao ở hai
 * cung kề kẹp cung gốc, cần đủ cả hai bên — một sao "giáp" đơn lẻ thì nằm ở bên
 * nào cũng được.
 */

export interface MucKhop {
  muc: MucThuVien;
  /** Cung gốc mà mục khớp vào */
  cung: string;
}

const m12 = (n: number) => ((n % 12) + 12) % 12;

function viTri(quanHe: QuanHe, goc: number): number[] {
  switch (quanHe) {
    case 'o-cung':
      return [goc];
    case 'xung':
      return [m12(goc + 6)];
    case 'tam-hop':
      return [m12(goc + 4), m12(goc + 8)];
    case 'tam-phuong':
      return [goc, m12(goc + 6), m12(goc + 4), m12(goc + 8)];
    case 'giap':
      return [m12(goc - 1), m12(goc + 1)];
    case 'muon-tu':
      return [m12(goc + 6)];
  }
}

const coChinhTinh = (c: Cung) => c.sao.some((s) => s.loai === 'chinh-tinh');

function co(c: Cung, ten: string, doSang?: string[]): boolean {
  return c.sao.some((s) => s.ten === ten && (!doSang?.length || (s.doSang != null && doSang.includes(s.doSang))));
}

/** Một mục có khớp với cung gốc `goc` không */
export function khopTaiCung(laSo: LaSo, muc: MucThuVien, goc: Cung): boolean {
  const dk = muc.dieuKien;
  if (dk.cung.length && !dk.cung.includes(goc.tenCung)) return false;
  if (dk.chi?.length && !dk.chi.includes(goc.chi)) return false;
  if (dk.gioiTinh && dk.gioiTinh !== laSo.thongTin.gioiTinh) return false;
  const tt = dk.thuocTinh;
  if (tt) {
    if (tt.tuan !== undefined && tt.tuan !== goc.coTuan) return false;
    if (tt.triet !== undefined && tt.triet !== goc.coTriet) return false;
    if (tt.trangSinh?.length && !tt.trangSinh.includes(goc.trangSinh)) return false;
    if (tt.voChinhDieu !== undefined && tt.voChinhDieu === coChinhTinh(goc)) return false;
  }
  const theoChi = (i: number) => laSo.cungs.find((c) => c.chiIndex === i)!;

  const giap = dk.sao.filter((s) => s.quanHe === 'giap');
  for (const s of dk.sao) {
    if (s.quanHe === 'giap') continue;
    if (s.quanHe === 'muon-tu' && coChinhTinh(goc)) return false;
    if (!viTri(s.quanHe, goc.chiIndex).some((i) => co(theoChi(i), s.ten, s.doSang))) return false;
  }
  if (giap.length) {
    const [trai, phai] = viTri('giap', goc.chiIndex).map(theoChi);
    if (giap.length === 1) {
      if (!co(trai, giap[0].ten, giap[0].doSang) && !co(phai, giap[0].ten, giap[0].doSang)) return false;
    } else {
      // Hai sao kẹp: một bên một sao, đổi bên được
      const [a, b] = giap;
      const xuoi = co(trai, a.ten, a.doSang) && co(phai, b.ten, b.doSang);
      const nguoc = co(phai, a.ten, a.doSang) && co(trai, b.ten, b.doSang);
      if (!xuoi && !nguoc) return false;
    }
  }
  for (const n of dk.nhom ?? []) {
    const o = viTri(n.quanHe, goc.chiIndex).map(theoChi);
    if (n.ten.filter((t) => o.some((c) => co(c, t))).length < Math.max(1, n.toiThieu)) return false;
  }
  for (const k of dk.khong ?? []) {
    if (viTri(k.quanHe, goc.chiIndex).some((i) => co(theoChi(i), k.ten))) return false;
  }
  return true;
}

/**
 * Mọi mục khớp trên các cung được đọc. Lọc nhanh trước: mục đòi một sao không có
 * trên cả lá số thì bỏ ngay (đóng vai chỉ mục theo tên sao).
 */
export function khopThuVien(laSo: LaSo, thuVien: MucThuVien[], cungDoc: string[]): MucKhop[] {
  const tenTrenLa = new Set(laSo.cungs.flatMap((c) => c.sao.map((s) => s.ten)));
  const goc = cungDoc
    .map((t) => laSo.cungs.find((c) => c.tenCung === t))
    .filter((c): c is Cung => Boolean(c));
  const ra: MucKhop[] = [];
  for (const muc of thuVien) {
    if (muc.duyet === 'bi-bac') continue;
    if (!muc.dieuKien.sao.every((s) => tenTrenLa.has(s.ten))) continue;
    if (!(muc.dieuKien.nhom ?? []).every((n) => n.ten.filter((t) => tenTrenLa.has(t)).length >= Math.max(1, n.toiThieu))) continue;
    for (const c of goc) {
      if (khopTaiCung(laSo, muc, c)) {
        ra.push({ muc, cung: c.tenCung });
        break;
      }
    }
  }
  return ra;
}
