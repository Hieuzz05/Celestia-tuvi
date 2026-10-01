import { createHash } from 'node:crypto';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { boDau } from '../thuc-the';
import { docMoiGoi, docSoDaDoc, ghiDot, ghiSoDaDoc, xoaSoDaDoc } from './kho';
import { viTriNguyenVan } from './kiem';
import type { MucThuVien } from './kieu';

/**
 * ĐỒNG BỘ THƯ VIỆN VỚI BẢN TÀI LIỆU ĐANG XUẤT BẢN — không gọi model.
 *
 * Chủ dự án chốt 01/10/2026: "thư viện phải được coi là bản update mới nhất của
 * tài liệu". Xuất bản bản mới cấp id mới cho MỌI đoạn (nap-tai-lieu.ts), nên căn
 * cứ của mục thư viện trỏ vào đoạn của bản cũ. Bước này dời từng câu trích sang
 * bản mới; câu trích không còn trong bản mới thì BỎ CẢ MỤC — câu nghĩa của mục
 * viết trên đủ các câu trích, giữ mục với căn cứ thiếu là để thư viện khẳng định
 * điều nguồn không còn đỡ. Nút "đọc vào thư viện" sẽ đọc lại đoạn ấy.
 *
 * Bước này chỉ BỚT được, không THÊM: nội dung mới của bản mới cần model đọc,
 * và việc đó thuộc nút "đọc vào thư viện" (nhánh sau). Thay vào đó nó đếm số
 * đoạn mới chưa đọc, ghi vào sổ để trang quản trị hiện ra.
 *
 * Lưu trữ hay xoá phiên bản KHÔNG đi qua đây: tài liệu có thể được xuất bản lại,
 * gỡ vĩnh viễn lúc ấy là mất mục mà phải tốn model mới dựng lại được. Lúc tài liệu
 * không có bản xuất bản, `dungKhoiThuVien` tự bỏ căn cứ của nó khi dựng prompt.
 * Chỉ xoá HẲN tài liệu mới gỡ vĩnh viễn (`boHet`).
 */

export interface DoanTaiLieu {
  id: string;
  versionId: string;
  thuTu: number;
  noiDung: string;
  /** Đoạn bị loại trừ (trang_thai khác hoat_dong) không được truy hồi — không làm căn cứ, không tính là chưa đọc */
  hoatDong: boolean;
}

export interface KetQuaDongBo {
  /** Câu trích đã ở đúng bản mới */
  giuNguyen: number;
  /** Câu trích dời sang đoạn của bản mới */
  doiCho: number;
  /** Câu trích không còn trong bản mới */
  go: number;
  /** Mục bỏ hẳn: mất câu trích, hoặc là mục lật / hoá giải mà mọi đích đã bỏ */
  boMuc: number;
  /** Đoạn của bản mới chưa được đọc vào thư viện */
  chuaDoc: number;
}

/** Chuẩn để so nội dung — cùng cách chuẩn của `viTriNguyenVan` */
const chuanSo = (s: string) => boDau(s).replace(/[^a-z0-9]+/g, ' ').trim();
export const bamDoan = (noiDung: string) => createHash('sha1').update(chuanSo(noiDung)).digest('hex').slice(0, 16);

/**
 * Lõi đồng bộ, thuần — không đọc ghi gì. Sửa `goi` tại chỗ, trả các mục đã đổi
 * và id mục bị bỏ của từng đợt.
 *
 * `banMoi` null = tài liệu bị xoá hẳn: gỡ mọi câu trích của nó.
 * `doan` là đoạn của MỌI phiên bản còn trong kho (cũ để biết nội dung đoạn đang
 * được trỏ, mới để dời tới).
 */
export function dongBoTrongBoNho(
  goi: { dot: string; ds: MucThuVien[] }[],
  documentId: string,
  doan: DoanTaiLieu[],
  banMoi: string | null
): { ketQua: Omit<KetQuaDongBo, 'chuaDoc'>; thayDoi: Map<string, { ds: MucThuVien[]; doi: MucThuVien[]; xoa: string[] }> } {
  const moi = banMoi ? doan.filter((d) => d.versionId === banMoi && d.hoatDong) : [];
  const idMoi = new Set(moi.map((d) => d.id));
  const theoId = new Map(doan.map((d) => [d.id, d]));
  const moiTheoBam = new Map<string, DoanTaiLieu>();
  for (const d of moi) if (!moiTheoBam.has(bamDoan(d.noiDung))) moiTheoBam.set(bamDoan(d.noiDung), d);
  const moiTheoThuTu = [...moi].sort((a, b) => a.thuTu - b.thuTu);
  const moiChuan = moi.map((d) => ({ d, v: chuanSo(d.noiDung) }));

  /*
   * Tìm câu trích trong bản mới. Đoạn cũ còn nguyên văn ở bản mới (phần lớn) →
   * khớp bằng dấu băm. Không thì tìm nguyên văn trong cả bản, rồi khớp gần ở các
   * đoạn quanh vị trí cũ — khớp gần trên mọi đoạn quá chậm cho một request.
   * Tìm nguyên văn cả bản đòi câu trích đủ dài: câu ngắn dễ khớp nhầm sang một
   * đoạn khác ngữ cảnh.
   */
  const timTrongBanMoi = (chunkId: string, trich: string): DoanTaiLieu | null => {
    const cu = theoId.get(chunkId);
    if (cu) {
      const cungNoiDung = moiTheoBam.get(bamDoan(cu.noiDung));
      if (cungNoiDung && viTriNguyenVan(trich, cungNoiDung.noiDung) >= 0) return cungNoiDung;
    }
    const t = chuanSo(trich);
    if (t.length >= 40) {
      const dung = moiChuan.find((x) => x.v.includes(t));
      if (dung) return dung.d;
    }
    if (cu) {
      const gan = moiTheoThuTu.filter((d) => Math.abs(d.thuTu - cu.thuTu) <= 3);
      const khop = gan.find((d) => viTriNguyenVan(trich, d.noiDung) >= 0);
      if (khop) return khop;
    }
    return null;
  };

  const ketQua = { giuNguyen: 0, doiCho: 0, go: 0, boMuc: 0 };
  const thayDoi = new Map<string, { ds: MucThuVien[]; doi: MucThuVien[]; xoa: string[] }>();

  for (const g of goi) {
    const doi = new Map<string, MucThuVien>();
    const bo = new Set<string>();
    for (const m of g.ds) {
      if (!m.canCu.some((c) => c.documentId === documentId)) continue;
      let daDoi = false;
      const canCu = m.canCu.flatMap((c) => {
        if (c.documentId !== documentId) return [c];
        if (banMoi && idMoi.has(c.chunkId)) {
          ketQua.giuNguyen++;
          if (c.versionId === banMoi) return [c];
          daDoi = true;
          return [{ ...c, versionId: banMoi }];
        }
        const toi = banMoi ? timTrongBanMoi(c.chunkId, c.trich) : null;
        daDoi = true;
        if (!toi) {
          ketQua.go++;
          return [];
        }
        ketQua.doiCho++;
        return [{ ...c, chunkId: toi.id, versionId: banMoi! }];
      });
      if (!daDoi) continue;
      if (canCu.length < m.canCu.length) bo.add(m.id);
      else doi.set(m.id, { ...m, canCu });
    }
    if (!doi.size && !bo.size) continue;

    /*
     * Mục "lật / hoá giải" trỏ vào mục vừa bỏ: gỡ đích ấy. Hết đích thì bỏ luôn —
     * câu nghĩa của nó viết để đảo một mục khác, đứng riêng là sai nghĩa. Lặp vì
     * bỏ một mục lật có thể làm hết đích của mục lật khác.
     */
    for (let lai = true; lai; ) {
      lai = false;
      for (const m of g.ds) {
        if (bo.has(m.id) || !m.dich?.some((d) => bo.has(d))) continue;
        const goc = doi.get(m.id) ?? m;
        const dich = goc.dich!.filter((d) => !bo.has(d));
        if (dich.length === goc.dich!.length) continue;
        if (!dich.length) {
          bo.add(m.id);
          doi.delete(m.id);
          lai = true;
        } else doi.set(m.id, { ...goc, dich });
      }
    }

    ketQua.boMuc += bo.size;
    const ds = g.ds.filter((m) => !bo.has(m.id)).map((m) => doi.get(m.id) ?? m);
    g.ds = ds;
    thayDoi.set(g.dot, { ds, doi: [...doi.values()], xoa: [...bo] });
  }

  return { ketQua, thayDoi };
}

async function docDoanCuaTaiLieu(documentId: string): Promise<DoanTaiLieu[]> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return [];
  const ra: DoanTaiLieu[] = [];
  for (let tu = 0; ; tu += 1000) {
    const { data, error } = await supabase
      .from('knowledge_chunks')
      .select('id, version_id, thu_tu, noi_dung, trang_thai')
      .eq('document_id', documentId)
      .order('id')
      .range(tu, tu + 999);
    if (error) throw new Error(`Không đọc được đoạn của tài liệu: ${error.message}`);
    for (const d of data ?? []) ra.push({ id: d.id, versionId: d.version_id, thuTu: d.thu_tu, noiDung: d.noi_dung, hoatDong: d.trang_thai === 'hoat_dong' });
    if (!data || data.length < 1000) break;
  }
  return ra;
}

/**
 * Đồng bộ thư viện cho một tài liệu. Gọi SAU khi xuất bản (bản mới đã là
 * da_xuat_ban), hoặc với `boHet` TRƯỚC khi xoá hẳn tài liệu (lúc đó còn đọc được
 * đoạn — không cần, nhưng sổ đã đọc phải xoá theo).
 */
export async function dongBoThuVien(documentId: string, tuyChon: { boHet?: boolean } = {}): Promise<KetQuaDongBo> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) throw new Error('Chưa cấu hình Supabase');

  let banMoi: string | null = null;
  if (!tuyChon.boHet) {
    const { data } = await supabase
      .from('knowledge_document_versions')
      .select('id')
      .eq('document_id', documentId)
      .eq('trang_thai', 'da_xuat_ban')
      .maybeSingle();
    if (!data) throw new Error('Tài liệu không có bản đang xuất bản');
    banMoi = data.id as string;
  }

  const [goi, doan, so] = await Promise.all([
    docMoiGoi(),
    tuyChon.boHet ? Promise.resolve([] as DoanTaiLieu[]) : docDoanCuaTaiLieu(documentId),
    tuyChon.boHet ? Promise.resolve(null) : docSoDaDoc(documentId),
  ]);

  /*
   * Sổ đã đọc dựng lần đầu từ chính thư viện: mọi đoạn của các bản có ít nhất
   * một câu trích trỏ tới coi là đã đọc (thư viện đọc trọn bản lúc dựng). Phải
   * dựng TRƯỚC khi dời câu trích, vì sau đó mọi câu trích đều trỏ bản mới.
   */
  let bam = so?.bam;
  if (!bam && !tuyChon.boHet) {
    const theoId = new Map(doan.map((d) => [d.id, d.versionId]));
    const banDaDoc = new Set(
      goi.flatMap((g) => g.ds.flatMap((m) => m.canCu.filter((c) => c.documentId === documentId).map((c) => c.versionId ?? theoId.get(c.chunkId))))
    );
    bam = [...new Set(doan.filter((d) => banDaDoc.has(d.versionId)).map((d) => bamDoan(d.noiDung)))];
  }

  const { ketQua, thayDoi } = dongBoTrongBoNho(goi, documentId, doan, banMoi);

  /*
   * Ghi sổ TRƯỚC khi ghi thư viện: ghi thư viện lỗi giữa chừng thì câu trích đã
   * mang versionId bản mới, lần thử lại mà dựng sổ từ đó sẽ coi mọi đoạn bản mới
   * là đã đọc. Có sổ rồi thì lần thử lại dùng sổ, không dựng lại. Lần ghi đầu
   * giữ versionId cũ để trang quản trị vẫn hiện nút đồng bộ nếu bước sau lỗi;
   * ghi thư viện xong mới đóng dấu bản mới.
   */
  if (tuyChon.boHet) {
    for (const [dot, t] of thayDoi) await ghiDot(dot, t.ds, t.doi, t.xoa);
    await xoaSoDaDoc(documentId);
    return { ...ketQua, chuaDoc: 0 };
  }
  const daDoc = new Set(bam);
  const chuaDoc = doan.filter((d) => d.versionId === banMoi && d.hoatDong && !daDoc.has(bamDoan(d.noiDung))).length;
  const luc = new Date().toISOString();
  if (!so) await ghiSoDaDoc(documentId, { bam: bam!, versionId: '', chuaDoc, luc });
  for (const [dot, t] of thayDoi) await ghiDot(dot, t.ds, t.doi, t.xoa);
  await ghiSoDaDoc(documentId, { bam: bam!, versionId: banMoi!, chuaDoc, luc });
  return { ...ketQua, chuaDoc };
}
