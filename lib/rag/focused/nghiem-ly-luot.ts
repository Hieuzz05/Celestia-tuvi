/**
 * NGHIỆM LÝ TRONG MỘT LƯỢT FOCUSED — mã T### (CEL-194, sau cờ CELES_OWNER_KNOWLEDGE_FOCUSED).
 *
 * Luồng: nghiệm lý ĐÃ LỌC (`locNghiemLyDungDuoc`: celes, đang dùng, phiên bản đã duyệt) →
 * `khopThuVien` (matcher dùng chung, không đổi) trên cung liên quan → giải T↔T tất định →
 * T001, T002… theo id. Hàm thuần, không gọi model, không truy vấn.
 *
 * Luật:
 *  - Một claim dẫn T### phải dẫn kèm ≥1 F###: nghiệm lý chỉ là CÁCH ĐỌC, dữ kiện lá số mới là căn cứ.
 *  - T↔T: mục `override` / `neutralize` có `dich` gỡ mục đích khỏi gói. Duyệt theo id tăng dần; mục
 *    đã bị gỡ không gỡ được ai (vòng A↔B → id nhỏ hơn thắng). `modify` giữ cả hai, in cạnh nhau.
 *  - Vết chỉ ghi id / phiên bản / chế độ / số đếm — không ghi câu nghĩa.
 */
import type { LaSo } from '@/lib/tuvi/ansao';
import { khopThuVien } from '../thu-vien/khop';
import { saoCuaMuc } from '../thu-vien/kieu';
import type { NghiemLy } from '../thu-vien/nghiem-ly';

export interface NghiemLyTrongGoi {
  /** T001… */
  id: string;
  mucId: string;
  phienBan: number;
  cheDo: string;
  cung: string;
  chieu: string;
  muc: string;
  y: string;
  /** Sao trong điều kiện — engine đã xác nhận có mặt đúng quan hệ */
  sao: string[];
  /** Mục id mà mục này điều chỉnh (`modify`) */
  dieuChinh?: string[];
}

export interface KetQuaNghiemLy {
  ds: NghiemLyTrongGoi[];
  /** Số mục đã duyệt đưa vào matcher */
  soDuyet: number;
  /** Số mục khớp lá số trước khi giải T↔T */
  soKhop: number;
  /** Mục id bị gỡ bởi override / neutralize */
  biGo: string[];
}

export function chonNghiemLy(laSo: LaSo, daDuyet: readonly NghiemLy[], cungLienQuan: readonly string[]): KetQuaNghiemLy {
  const phienBan = new Map(daDuyet.map((n) => [n.muc.id, n.phienBan]));
  const khop = khopThuVien(laSo, daDuyet.map((n) => n.muc), [...cungLienQuan]).sort((a, b) => a.muc.id.localeCompare(b.muc.id));

  const biGo = new Set<string>();
  for (const k of khop) {
    if (biGo.has(k.muc.id)) continue;
    if (k.muc.cheDo === 'override' || k.muc.cheDo === 'neutralize') {
      for (const d of k.muc.dich ?? []) if (d !== k.muc.id) biGo.add(d);
    }
  }
  const conLai = khop.filter((k) => !biGo.has(k.muc.id));
  const coMat = new Set(conLai.map((k) => k.muc.id));

  return {
    ds: conLai.map((k, i) => {
      const dieuChinh = k.muc.cheDo === 'modify' ? (k.muc.dich ?? []).filter((d) => coMat.has(d)) : [];
      return {
        id: `T${String(i + 1).padStart(3, '0')}`,
        mucId: k.muc.id,
        phienBan: phienBan.get(k.muc.id) ?? 0,
        cheDo: k.muc.cheDo,
        cung: k.cung,
        chieu: k.muc.nhan.chieu,
        muc: k.muc.nhan.muc,
        y: k.muc.y,
        sao: saoCuaMuc(k.muc),
        ...(dieuChinh.length ? { dieuChinh } : {}),
      };
    }),
    soDuyet: daDuyet.length,
    soKhop: khop.length,
    biGo: [...biGo].filter((id) => khop.some((k) => k.muc.id === id)).sort(),
  };
}

const NHAN_CHIEU: Record<string, string> = { cat: 'thuận', hung: 'vướng', trung: 'trung tính' };
const NHAN_MUC: Record<string, string> = { manh: 'rõ', vua: 'vừa', nhe: 'nhẹ' };

/**
 * Khối prompt — đặt TRƯỚC khối dữ kiện/nguồn để model đọc nó như cách đọc ưu tiên. Không có mục nào
 * thì trả '' (prompt y như khi cờ tắt).
 */
export function khoiNghiemLy(ds: readonly NghiemLyTrongGoi[]): string {
  if (!ds.length) return '';
  const theoMuc = new Map(ds.map((t) => [t.mucId, t.id]));
  const dong = ds.map((t) => {
    const dc = t.dieuChinh?.length ? ` · điều chỉnh ${t.dieuChinh.map((m) => theoMuc.get(m)).join(', ')}` : '';
    return `${t.id}. [cung ${t.cung} · ${NHAN_CHIEU[t.chieu] ?? t.chieu} · ${NHAN_MUC[t.muc] ?? t.muc}${dc}] ${t.y}`;
  });
  return [
    'NGHIỆM LÝ CỦA CELES (mã T###) — cách đọc đã được kiểm chứng, áp đúng vào lá số này. Khi khác NGUỒN THAM CHIẾU (E###), theo T###.',
    'Claim dẫn T### PHẢI dẫn kèm ít nhất một F### nói đúng sao/cung đó. Không nhắc mã T### hay chữ "nghiệm lý" trong câu văn.',
    ...dong,
  ].join('\n');
}

/** Vết: chỉ id / phiên bản / chế độ / số đếm. */
export function vetNghiemLy(kq: KetQuaNghiemLy | null): {
  mode: 'tat' | 'bat';
  soDuyet: number;
  soKhop: number;
  soTrongGoi: number;
  biGo: string[];
  muc: { t: string; id: string; v: number; cheDo: string }[];
} {
  if (!kq) return { mode: 'tat', soDuyet: 0, soKhop: 0, soTrongGoi: 0, biGo: [], muc: [] };
  return {
    mode: 'bat',
    soDuyet: kq.soDuyet,
    soKhop: kq.soKhop,
    soTrongGoi: kq.ds.length,
    biGo: kq.biGo,
    muc: kq.ds.map((t) => ({ t: t.id, id: t.mucId, v: t.phienBan, cheDo: t.cheDo })),
  };
}
