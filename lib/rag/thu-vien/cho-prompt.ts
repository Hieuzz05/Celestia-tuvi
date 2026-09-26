import type { LaSo } from '@/lib/tuvi/ansao';
import { NHAN_TIN_CAY } from '../uu-tien-nguon';
import { LOAI_NGUON_AN, type MetaTaiLieu } from '../tai-lieu-meta';
import type { DuKienV3 } from '../v3/du-kien';
import { khopThuVien, type MucKhop } from './khop';
import { saoCuaMuc, type MucThuVien } from './kieu';

/**
 * Chọn mục thư viện đã khớp và dựng khối T### cho prompt v3 (KIEN-TRUC-LUAN-GIAI.md mục 8).
 *
 * Mọi phân xử làm bằng mã TRƯỚC khi model nhìn thấy: gom tổ hợp với mục đơn cấu
 * thành nó, đánh dấu mục bị lật / hoá giải, đánh dấu cặp ngược chiều. Model nhận
 * kết quả đã xếp, không nhận một đống nghĩa rời để tự chọn.
 */

/**
 * Trần số mục mỗi câu — theo ngân sách chữ: ~18 câu nghĩa ≈ 650 chữ, vẫn ít hơn tám đoạn sách thô.
 * 14 → 18 (lượt 2, KIEN-TRUC 11.8): đáp án chuyên gia tổng hợp 3–7 sao lớn mỗi điểm — bài cần đủ
 * THÀNH PHẦN (từng sao đúng độ sáng) để tự tổng hợp, không có quy tắc sách nào gộp sẵn năm sao.
 */
export const TRAN_MUC = 18;

const BAC: Record<string, number> = { 'cot-loi': 3, 'chuyen-gia-duyet': 2, 'tham-khao': 1, 'ho-tro': 0 };
const MUC: Record<string, number> = { manh: 2, vua: 1, nhe: 0 };
const CHIEU: Record<string, string> = { cat: 'cát', hung: 'hung', trung: 'trung tính' };

export const CHINH_TINH = new Set([
  'Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh', 'Thiên Phủ',
  'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát', 'Phá Quân',
]);
/** Sao lớn: chính tinh, lục cát, lục sát, tứ hoá, Lộc Tồn, Thiên Mã */
export const SAO_LON = new Set([
  ...CHINH_TINH,
  'Tả Phù', 'Hữu Bật', 'Văn Xương', 'Văn Khúc', 'Thiên Khôi', 'Thiên Việt',
  'Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp',
  'Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ', 'Lộc Tồn', 'Thiên Mã',
]);

export interface KetQuaThuVienCau {
  /** Khối chèn vào user prompt ('' khi không mục nào khớp) */
  khoi: string;
  /** Mục đã đưa vào prompt, theo mã T### */
  daChon: { ma: string; khop: MucKhop; mucTinCay: string; an: boolean }[];
  /** MỌI mục khớp (kể cả không vừa trần) — để đo "ghép bỏ qua thư viện" */
  khopHet: MucKhop[];
  /** Cặp mục add cùng khớp mà ngược chiều cát/hung — hàng duyệt ưu tiên cao */
  nguocChieu: [string, string][];
}

export function dungKhoiThuVien(vao: {
  laSo: LaSo;
  duKien: DuKienV3[];
  thuVien: MucThuVien[];
  cungChinh?: string;
  meta: Map<string, MetaTaiLieu>;
}): KetQuaThuVienCau {
  const cungDoc = [
    ...new Set([
      ...(vao.cungChinh ? [vao.cungChinh] : []),
      ...vao.duKien.filter((d) => d.cung && d.noiDung.startsWith('Cung ')).map((d) => d.cung!),
    ]),
  ];
  const khopHet = khopThuVien(vao.laSo, vao.thuVien, cungDoc);
  if (!khopHet.length) return { khoi: '', daChon: [], khopHet, nguocChieu: [] };

  const tinCay = (m: MucThuVien) => {
    const ds = m.canCu.map((c) => vao.meta.get(c.documentId)).filter((x): x is MetaTaiLieu => Boolean(x));
    const cao = ds.map((x) => x.mucTinCay).sort((a, b) => (BAC[b] ?? 0) - (BAC[a] ?? 0))[0] ?? 'tham-khao';
    return { mucTinCay: cao, an: ds.length > 0 && ds.every((x) => LOAI_NGUON_AN.has(x.loaiNguon)) };
  };
  /*
   * XẾP THEO TẦNG (bản B2, 26/09/2026 — KIEN-TRUC-LUAN-GIAI.md 11.7).
   *
   * Bản đầu cộng +100 cho MỌI tổ hợp ≥ 2 sao. Đo lượt 1: tổ hợp sao nhỏ (Tướng Quân +
   * Phục Binh…) chiếm chỗ, 24% mục vào prompt chỉ có sao nhỏ, và ở 6/12 lá số nghĩa
   * của chính tinh tại cung chính KHÔNG lọt vào prompt dù thư viện có mục khớp.
   * Giờ: chính tinh tại cung chính (ưu tiên mục có độ sáng khớp) → tổ hợp chính tinh +
   * sao lớn → sao lớn → sao nhỏ chỉ lấp chỗ trống.
   */
  const coChinhTaiGoc = (k: MucKhop) =>
    k.cung === vao.cungChinh && k.muc.dieuKien.sao.some((s) => CHINH_TINH.has(s.ten) && (s.quanHe === 'o-cung' || s.quanHe === 'muon-tu'));
  const coDoSang = (k: MucKhop) => k.muc.dieuKien.sao.some((s) => CHINH_TINH.has(s.ten) && s.doSang?.length);
  const lon = (k: MucKhop) => saoCuaMuc(k.muc).filter((s) => SAO_LON.has(s)).length;
  // Sao lớn KHÔNG phải chính tinh đóng tại cung chính (Kình Dương hãm tại Quan Lộc…) — lượt 1 lá 5: 0 mục vào prompt
  const saoLonTaiGoc = (k: MucKhop) =>
    k.cung === vao.cungChinh && k.muc.dieuKien.sao.some((s) => SAO_LON.has(s.ten) && !CHINH_TINH.has(s.ten) && s.quanHe === 'o-cung');
  const coSangBatKy = (k: MucKhop) => k.muc.dieuKien.sao.some((s) => s.doSang?.length);
  const diem = (k: MucKhop) =>
    (coChinhTaiGoc(k) ? 400 + (coDoSang(k) ? 60 : 0) : 0) +
    (saoLonTaiGoc(k) ? 250 + (coSangBatKy(k) ? 60 : 0) : 0) +
    (coSangBatKy(k) ? 40 : 0) +
    (saoCuaMuc(k.muc).some((s) => CHINH_TINH.has(s)) && lon(k) >= 2 ? 200 : 0) +
    (lon(k) >= 1 ? 100 : 0) +
    (k.cung === vao.cungChinh ? 20 : 0) +
    (BAC[tinCay(k.muc).mucTinCay] ?? 0) * 4 +
    (MUC[k.muc.nhan.muc] ?? 0) * 2 +
    new Set(k.muc.canCu.map((c) => c.documentId)).size;
  const xep = [...khopHet].sort((a, b) => diem(b) - diem(a));

  // Gom: mỗi tổ hợp kéo theo ngay sau nó các mục đơn cấu thành nó (cùng cung)
  const thuTu: MucKhop[] = [];
  const da = new Set<string>();
  // Cùng một bộ sao tối đa 3 mục — mười câu nghĩa gần giống nhau về một sao là lãng phí chỗ
  const demBo = new Map<string, number>();
  const them = (k: MucKhop) => {
    const bo = [...saoCuaMuc(k.muc)].sort().join('+');
    if (da.has(k.muc.id) || thuTu.length >= TRAN_MUC || (demBo.get(bo) ?? 0) >= 3) return;
    da.add(k.muc.id);
    demBo.set(bo, (demBo.get(bo) ?? 0) + 1);
    thuTu.push(k);
  };
  for (const k of xep) {
    if (thuTu.length >= TRAN_MUC) break;
    them(k);
    if (saoCuaMuc(k.muc).length >= 2) {
      const sao = new Set(saoCuaMuc(k.muc));
      // Kéo theo mục đơn cấu thành — chỉ sao lớn, sao nhỏ không đáng một chỗ riêng
      for (const d of xep) if (saoCuaMuc(d.muc).length === 1 && sao.has(saoCuaMuc(d.muc)[0]) && SAO_LON.has(saoCuaMuc(d.muc)[0]) && d.cung === k.cung) them(d);
    }
  }

  const ma = new Map(thuTu.map((k, i) => [k.muc.id, `T${String(i + 1).padStart(3, '0')}`]));
  const daChon = thuTu.map((k) => ({ ma: ma.get(k.muc.id)!, khop: k, ...tinCay(k.muc) }));

  // Lật / hoá giải: gắn lên mục đích đang có mặt
  const chuThich = new Map<string, string[]>();
  for (const k of thuTu) {
    if (k.muc.cheDo === 'add') continue;
    const loi = k.muc.cheDo === 'override' ? 'bị lật bởi' : k.muc.cheDo === 'neutralize' ? 'được hoá giải bởi' : 'được điều chỉnh bởi';
    for (const d of k.muc.dich ?? []) if (ma.has(d)) chuThich.set(d, [...(chuThich.get(d) ?? []), `${loi} ${ma.get(k.muc.id)}`]);
  }
  // Ngược chiều: hai mục add cùng cung, chung ít nhất một sao, một cát một hung
  const nguocChieu: [string, string][] = [];
  for (let i = 0; i < thuTu.length; i++)
    for (let j = i + 1; j < thuTu.length; j++) {
      const a = thuTu[i], b = thuTu[j];
      if (a.muc.cheDo !== 'add' || b.muc.cheDo !== 'add' || a.cung !== b.cung) continue;
      const cap = new Set([a.muc.nhan.chieu, b.muc.nhan.chieu]);
      if (!(cap.has('cat') && cap.has('hung'))) continue;
      if (!saoCuaMuc(a.muc).some((s) => saoCuaMuc(b.muc).includes(s))) continue;
      nguocChieu.push([a.muc.id, b.muc.id]);
      const ma1 = ma.get(a.muc.id)!, ma2 = ma.get(b.muc.id)!;
      chuThich.set(a.muc.id, [...(chuThich.get(a.muc.id) ?? []), `ngược chiều với ${ma2}`]);
      chuThich.set(b.muc.id, [...(chuThich.get(b.muc.id) ?? []), `ngược chiều với ${ma1}`]);
    }

  const dong = daChon.map(({ ma: m, khop, mucTinCay, an }) => {
    const sao = saoCuaMuc(khop.muc).join(' + ');
    const nhan = [
      khop.cung,
      sao,
      CHIEU[khop.muc.nhan.chieu],
      khop.muc.nhan.muc,
      `tin cậy: ${NHAN_TIN_CAY[mucTinCay] ?? mucTinCay}`,
      ...(an ? ['LUẬT NGẦM'] : []),
    ].join(' · ');
    const ct = chuThich.get(khop.muc.id);
    return `${m} [${nhan}] ${khop.muc.y}${ct ? ` (${ct.join('; ')})` : ''}`;
  });

  const khoi = `TRI THỨC THƯ VIỆN (mã T###) — quy tắc đã trích từ sách và kiểm căn cứ, khớp đúng các sao – cung của lá số này. Dùng TRƯỚC nguồn tham chiếu; ý dựa vào mục nào thì ghi mã T### của mục đó trong dàn ý.
- Mục tổ hợp (nhiều sao) mô tả hiệu ứng CHUNG; các mục một sao đứng ngay sau nó chỉ là nền.
- Mục ghi "bị lật bởi T…" / "được hoá giải bởi T…" thì theo mục kia.
- Hai mục "ngược chiều" thì cân cả hai, không bỏ một bên.
- Ý nào ghép nghĩa hai sao trở lên mà KHÔNG mục nào ở đây nói về chính tổ hợp ấy: ghi "ghep": true và "sao": [tên các sao] vào ý đó.
${dong.join('\n')}`;

  return { khoi, daChon, khopHet, nguocChieu };
}
