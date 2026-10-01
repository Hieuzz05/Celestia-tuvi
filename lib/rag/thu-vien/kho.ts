import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import type { MucThuVien } from './kieu';

/**
 * Chỗ lưu thư viện — TẠM trong bảng noi_dung_ai (QĐ-13 trong KIEN-TRUC-LUAN-GIAI.md).
 *
 * Máy làm việc không chạy được SQL tạo bảng; noi_dung_ai đã có khoá duy nhất
 * (chart_hash, be_mat, khoa_ky, ngon_ngu) đúng dạng cần: mỗi mục một dòng, khoá là
 * id mục. chart_hash cố định CHART_HASH — không băm được từ ngày giờ sinh nào
 * (băm lá số là 16 ký tự hex), nên route luận giải không bao giờ đọc nhầm.
 *
 * Câu trích sách nằm ở đây, trong Supabase — không vào repo.
 * Xét lại khi chủ dự án chạy SQL bảng riêng.
 */

const CHART_HASH = 'thu-vien';
const BE_MAT = 'thu-vien';
const HAN_MS = 5 * 60_000;
/** Khoá của GÓI một đợt — cả đợt trong một dòng, đọc bằng khoá chính xác qua chỉ mục duy nhất */
const khoaGoi = (dot: string) => `goi:${dot}`;

/** Đệm theo bộ đợt ("" = mọi đợt) */
const dem = new Map<string, { luc: number; ds: MucThuVien[] }>();

/**
 * Đọc thư viện. Có `dot` ("sn-2,sn-2b"): đọc GÓI của từng đợt — lọc theo phien_ban->>dot hay theo
 * khoảng khoa_ky đều chậm / sai (trường JSON không có chỉ mục: 11,6 giây cho 2.499 mục; collation bỏ
 * qua gạch nối nên khoảng "TV-SN-2-…" trả rỗng). Gói thiếu thì lùi về đọc từng dòng.
 */
export async function docThuVien(chuDe?: string, dot?: string): Promise<MucThuVien[]> {
  const dsDot = (dot ?? '').split(',').map((x) => x.trim()).filter(Boolean).sort();
  const khoa = dsDot.join(',');
  const co = dem.get(khoa);
  if (!co || Date.now() - co.luc > HAN_MS) {
    const supabase = taoSupabaseAdmin();
    if (!supabase) return [];
    let ds: MucThuVien[] = [];
    try {
      let duGoi = dsDot.length > 0;
      for (const d of dsDot) {
        const { data } = await supabase
          .from('noi_dung_ai')
          .select('noi_dung')
          .eq('chart_hash', CHART_HASH)
          .eq('be_mat', BE_MAT)
          .eq('khoa_ky', khoaGoi(d))
          .eq('ngon_ngu', 'vi')
          .maybeSingle();
        if (Array.isArray(data?.noi_dung)) ds.push(...(data!.noi_dung as MucThuVien[]));
        else duGoi = false;
      }
      if (!duGoi) ds = (await docTungDong()).filter((m) => !dsDot.length || dsDot.includes(m.dotTrich));
    } catch {
      return (co?.ds ?? []).filter((m) => !chuDe || m.chuDe.includes(chuDe));
    }
    dem.set(khoa, { luc: Date.now(), ds });
  }
  return dem.get(khoa)!.ds.filter((m) => !chuDe || m.chuDe.includes(chuDe));
}

/** Đọc từng dòng mục (chậm — dùng offline hoặc khi chưa có gói) */
async function docTungDong(): Promise<MucThuVien[]> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return [];
  const ds: MucThuVien[] = [];
  for (let tu = 0; ; tu += 1000) {
    const { data, error } = await supabase
      .from('noi_dung_ai')
      .select('noi_dung')
      .eq('chart_hash', CHART_HASH)
      .eq('be_mat', BE_MAT)
      .order('khoa_ky')
      .range(tu, tu + 999);
    if (error) throw new Error(error.message);
    for (const d of data ?? []) if (!Array.isArray(d.noi_dung)) ds.push(d.noi_dung as MucThuVien);
    if (!data || data.length < 1000) break;
  }
  return ds;
}

/** Dựng lại GÓI cho các đợt từ các dòng mục — gọi sau mỗi lần lưu / sửa mục */
export async function dongGoi(dots: string[]): Promise<void> {
  const supabase = taoSupabaseAdmin();
  if (!supabase || !dots.length) return;
  const tatCa = await docTungDong();
  for (const d of new Set(dots)) {
    const ds = tatCa.filter((m) => m.dotTrich === d);
    const { error } = await supabase.from('noi_dung_ai').upsert(
      { chart_hash: CHART_HASH, be_mat: BE_MAT, khoa_ky: khoaGoi(d), ngon_ngu: 'vi', noi_dung: ds, phien_ban: { goi: d, so: String(ds.length) } },
      { onConflict: 'chart_hash,be_mat,khoa_ky,ngon_ngu' }
    );
    if (error) throw new Error(`Không lưu được gói ${d}: ${error.message}`);
  }
  dem.clear();
}

export async function luuThuVien(ds: MucThuVien[]): Promise<number> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return 0;
  let da = 0;
  for (let i = 0; i < ds.length; i += 200) {
    const lo = ds.slice(i, i + 200).map((m) => ({
      chart_hash: CHART_HASH,
      be_mat: BE_MAT,
      khoa_ky: m.id,
      ngon_ngu: 'vi',
      noi_dung: m,
      phien_ban: { schema: String(m.schemaVersion), dot: m.dotTrich },
    }));
    const { error } = await supabase.from('noi_dung_ai').upsert(lo, { onConflict: 'chart_hash,be_mat,khoa_ky,ngon_ngu' });
    if (error) throw new Error(`Không lưu được thư viện: ${error.message}`);
    da += lo.length;
  }
  await dongGoi([...new Set(ds.map((m) => m.dotTrich))]);
  return da;
}

/** Xoá các mục của một đợt trích (chạy lại đợt) — chỉ đụng bề mặt thư viện */
export async function xoaDotTrich(dot: string): Promise<void> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return;
  await supabase.from('noi_dung_ai').delete().eq('chart_hash', CHART_HASH).eq('be_mat', BE_MAT).eq('phien_ban->>dot', dot);
  await supabase.from('noi_dung_ai').delete().eq('chart_hash', CHART_HASH).eq('be_mat', BE_MAT).eq('khoa_ky', khoaGoi(dot));
  dem.clear();
}

/** Mọi gói đợt. Đồng bộ phải đọc hết: một mục có thể dẫn câu trích từ nhiều tài liệu */
export async function docMoiGoi(): Promise<{ dot: string; ds: MucThuVien[] }[]> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('noi_dung_ai')
    .select('khoa_ky, noi_dung')
    .eq('chart_hash', CHART_HASH)
    .eq('be_mat', BE_MAT)
    .eq('ngon_ngu', 'vi')
    .like('khoa_ky', 'goi:%');
  if (error) throw new Error(`Không đọc được gói thư viện: ${error.message}`);
  return (data ?? [])
    .filter((d) => Array.isArray(d.noi_dung))
    .map((d) => ({ dot: String(d.khoa_ky).slice('goi:'.length), ds: d.noi_dung as MucThuVien[] }));
}

/**
 * Ghi thay đổi của MỘT đợt: dòng mục đã sửa, dòng mục bị bỏ, rồi gói. Không đi
 * qua `dongGoi` — nó đọc lại mọi dòng của mọi đợt, quá chậm cho một request.
 * Gói là bản `ds` đã sửa trong bộ nhớ, nên dòng và gói khớp nhau.
 */
export async function ghiDot(dot: string, ds: MucThuVien[], doi: MucThuVien[], xoa: string[]): Promise<void> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) throw new Error('Chưa cấu hình Supabase');
  for (let i = 0; i < doi.length; i += 200) {
    const lo = doi.slice(i, i + 200).map((m) => ({
      chart_hash: CHART_HASH,
      be_mat: BE_MAT,
      khoa_ky: m.id,
      ngon_ngu: 'vi',
      noi_dung: m,
      phien_ban: { schema: String(m.schemaVersion), dot: m.dotTrich },
    }));
    const { error } = await supabase.from('noi_dung_ai').upsert(lo, { onConflict: 'chart_hash,be_mat,khoa_ky,ngon_ngu' });
    if (error) throw new Error(`Không lưu được mục thư viện: ${error.message}`);
  }
  for (let i = 0; i < xoa.length; i += 200) {
    const { error } = await supabase
      .from('noi_dung_ai')
      .delete()
      .eq('chart_hash', CHART_HASH)
      .eq('be_mat', BE_MAT)
      .in('khoa_ky', xoa.slice(i, i + 200));
    if (error) throw new Error(`Không xoá được mục thư viện: ${error.message}`);
  }
  const { error } = await supabase.from('noi_dung_ai').upsert(
    { chart_hash: CHART_HASH, be_mat: BE_MAT, khoa_ky: khoaGoi(dot), ngon_ngu: 'vi', noi_dung: ds, phien_ban: { goi: dot, so: String(ds.length) } },
    { onConflict: 'chart_hash,be_mat,khoa_ky,ngon_ngu' }
  );
  if (error) throw new Error(`Không lưu được gói ${dot}: ${error.message}`);
  dem.clear();
}

/*
 * SỔ "ĐÃ ĐỌC" của từng tài liệu: dấu băm nội dung các đoạn thư viện đã đọc qua.
 *
 * Bề mặt riêng, KHÔNG phải BE_MAT: docTungDong coi mọi dòng của BE_MAT là một
 * mục thư viện. Đoạn mới của bản xuất bản = đoạn có dấu băm chưa nằm trong sổ —
 * khớp theo nội dung chứ không theo id, vì xuất bản lại là cấp id mới cho mọi đoạn.
 */
const BE_MAT_DA_DOC = 'thu-vien-da-doc';

export interface SoDaDoc {
  bam: string[];
  /** Bản đang xuất bản lúc ghi sổ */
  versionId: string;
  /** Số đoạn của bản đó chưa được đọc vào thư viện */
  chuaDoc: number;
  luc: string;
}

export async function docSoDaDoc(documentId: string): Promise<SoDaDoc | null> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from('noi_dung_ai')
    .select('noi_dung')
    .eq('chart_hash', CHART_HASH)
    .eq('be_mat', BE_MAT_DA_DOC)
    .eq('khoa_ky', documentId)
    .eq('ngon_ngu', 'vi')
    .maybeSingle();
  return (data?.noi_dung as SoDaDoc | undefined) ?? null;
}

export async function ghiSoDaDoc(documentId: string, so: SoDaDoc): Promise<void> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return;
  const { error } = await supabase.from('noi_dung_ai').upsert(
    { chart_hash: CHART_HASH, be_mat: BE_MAT_DA_DOC, khoa_ky: documentId, ngon_ngu: 'vi', noi_dung: so, phien_ban: { versionId: so.versionId } },
    { onConflict: 'chart_hash,be_mat,khoa_ky,ngon_ngu' }
  );
  if (error) throw new Error(`Không lưu được sổ đã đọc: ${error.message}`);
}

export async function xoaSoDaDoc(documentId: string): Promise<void> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return;
  await supabase.from('noi_dung_ai').delete().eq('chart_hash', CHART_HASH).eq('be_mat', BE_MAT_DA_DOC).eq('khoa_ky', documentId);
}

/** Số đoạn chưa đọc của mọi tài liệu có sổ — cho trang quản trị kho */
export async function docSoChuaDoc(): Promise<Map<string, { versionId: string; chuaDoc: number }>> {
  const ra = new Map<string, { versionId: string; chuaDoc: number }>();
  const supabase = taoSupabaseAdmin();
  if (!supabase) return ra;
  const { data } = await supabase
    .from('noi_dung_ai')
    .select('khoa_ky, versionId:noi_dung->>versionId, chuaDoc:noi_dung->chuaDoc')
    .eq('chart_hash', CHART_HASH)
    .eq('be_mat', BE_MAT_DA_DOC);
  for (const d of (data ?? []) as { khoa_ky: string; versionId: string; chuaDoc: number }[]) {
    ra.set(d.khoa_ky, { versionId: d.versionId, chuaDoc: Number(d.chuaDoc) || 0 });
  }
  return ra;
}
