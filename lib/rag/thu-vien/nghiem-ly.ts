/**
 * NGHIỆM LÝ CỦA TÔI — mục thư viện do chủ dự án soạn và ký (CEL-194, QĐ-13).
 *
 * Đọc từ hai bảng có phiên bản (`supabase/va-qd13-thu-vien.sql`). Chỉ mục:
 *   truong_phai = 'celes' · trang_thai = 'dang-dung' · phiên bản đang dùng có duyet = 'da-duyet'
 *   + approved_by + approved_at
 * mới được vào chat Focused. Lọc ở ĐÂY, TRƯỚC khi đưa vào matcher dùng chung (`khopThuVien`) —
 * matcher không đổi, luận v3 không đổi.
 *
 * Chưa chạy SQL → đọc lỗi → 0 mục (không ném). Luôn sau cờ `CELES_OWNER_KNOWLEDGE_FOCUSED=1`.
 */
import type { MucThuVien } from './kieu';

export const BANG_MUC = 'muc_thu_vien';
export const BANG_PHIEN_BAN = 'muc_thu_vien_phien_ban';

export type TrangThaiMuc = 'nhap' | 'dang-dung' | 'luu-tru';
export type DuyetPhienBan = 'chua' | 'da-duyet' | 'bi-bac' | 'tranh-chap';

export interface DongMuc {
  id: string;
  truong_phai: MucThuVien['truongPhai'];
  trang_thai: TrangThaiMuc;
  phien_ban_dang_dung: number | null;
}

export interface DongPhienBan {
  muc_id: string;
  phien_ban: number;
  noi_dung: Partial<MucThuVien> | null;
  schema_version: number;
  duyet: DuyetPhienBan;
  approved_by: string | null;
  approved_at: string | null;
}

/** Một nghiệm lý dùng được: nội dung + danh tính phiên bản (để ghi vết, kiểm T###). */
export interface NghiemLy {
  muc: MucThuVien;
  phienBan: number;
}

export function batNghiemLyFocused(env: Record<string, string | undefined> = process.env): boolean {
  return env.CELES_OWNER_KNOWLEDGE_FOCUSED === '1';
}

/** Nội dung jsonb đủ hình để matcher chạy được — thiếu là bỏ, không đoán. */
function hopHinh(nd: Partial<MucThuVien> | null): nd is Partial<MucThuVien> {
  return (
    !!nd &&
    typeof nd.y === 'string' &&
    nd.y.trim().length > 0 &&
    !!nd.dieuKien &&
    Array.isArray(nd.dieuKien.cung) &&
    Array.isArray(nd.dieuKien.sao) &&
    !!nd.nhan &&
    Array.isArray(nd.chuDe)
  );
}

/**
 * Hàm THUẦN: từ dòng hai bảng ra danh sách nghiệm lý dùng được ở chat Focused. Thứ tự theo id
 * (tất định). Đây là chỗ duy nhất quyết định "đã duyệt" — mọi đường đọc đi qua đây.
 */
export function locNghiemLyDungDuoc(muc: DongMuc[], phienBan: DongPhienBan[]): NghiemLy[] {
  const theoKhoa = new Map(phienBan.map((p) => [`${p.muc_id}#${p.phien_ban}`, p]));
  const ra: NghiemLy[] = [];
  for (const m of [...muc].sort((a, b) => a.id.localeCompare(b.id))) {
    if (m.truong_phai !== 'celes' || m.trang_thai !== 'dang-dung' || m.phien_ban_dang_dung == null) continue;
    const p = theoKhoa.get(`${m.id}#${m.phien_ban_dang_dung}`);
    if (!p || p.duyet !== 'da-duyet' || !p.approved_by || !p.approved_at) continue;
    const nd = p.noi_dung;
    if (!hopHinh(nd)) continue;
    ra.push({
      phienBan: p.phien_ban,
      muc: {
        cheDo: 'add',
        canCu: [],
        ...nd,
        schemaVersion: p.schema_version,
        dotTrich: `nghiem-ly@v${p.phien_ban}`,
        id: m.id,
        truongPhai: 'celes',
        duyet: 'da-duyet',
      } as MucThuVien,
    });
  }
  return ra;
}

/** Đệm trong tiến trình — nghiệm lý đổi theo tay chủ dự án, không cần tươi từng giây. */
const HAN_DEM_MS = 60_000;
let dem: { luc: number; ds: NghiemLy[] } | null = null;

/** Đọc nghiệm lý đã duyệt. Bảng chưa có / Supabase tắt / lỗi → []. */
export async function docNghiemLyDaDuyet(): Promise<NghiemLy[]> {
  if (dem && Date.now() - dem.luc < HAN_DEM_MS) return dem.ds;
  try {
    const { taoSupabaseAdmin } = await import('@/lib/supabase/admin');
    const sb = taoSupabaseAdmin();
    if (!sb) return [];
    const m = await sb
      .from(BANG_MUC)
      .select('id, truong_phai, trang_thai, phien_ban_dang_dung')
      .eq('truong_phai', 'celes')
      .eq('trang_thai', 'dang-dung');
    if (m.error || !m.data?.length) {
      dem = { luc: Date.now(), ds: [] };
      return [];
    }
    const p = await sb
      .from(BANG_PHIEN_BAN)
      .select('muc_id, phien_ban, noi_dung, schema_version, duyet, approved_by, approved_at')
      .in('muc_id', (m.data as DongMuc[]).map((x) => x.id))
      .eq('duyet', 'da-duyet');
    const ds = p.error ? [] : locNghiemLyDungDuoc(m.data as DongMuc[], (p.data ?? []) as DongPhienBan[]);
    dem = { luc: Date.now(), ds };
    return ds;
  } catch (e) {
    console.warn('[nghiem-ly] đọc hỏng:', e instanceof Error ? e.message : e);
    return [];
  }
}

/** Chỉ test. */
export function xoaDemNghiemLy() {
  dem = null;
}

// ── Soạn nghiệm lý (API admin) ────────────────────────────────────────────────

const CHE_DO: MucThuVien['cheDo'][] = ['add', 'modify', 'neutralize', 'override'];
const CHIEU = ['cat', 'hung', 'trung'] as const;
const MUC = ['manh', 'vua', 'nhe'] as const;
export const MA_NGHIEM_LY = /^NL-[A-Z0-9-]{2,40}$/;

/** Nội dung một phiên bản nghiệm lý — đúng hình `MucThuVien` trừ danh tính / duyệt. */
export type NoiDungNghiemLy = Pick<MucThuVien, 'chuDe' | 'dieuKien' | 'y' | 'nhan' | 'cheDo' | 'dich'>;

/**
 * Kiểm và chuẩn hoá nội dung admin gửi lên. Danh sách ĐÓNG cho cung / quan hệ / chế độ / nhãn —
 * chữ lạ là từ chối, không đoán. `cungHopLe` truyền vào để hàm vẫn thuần (không import engine).
 */
export function chuanHoaNoiDung(
  vao: unknown,
  cungHopLe: readonly string[],
  quanHeHopLe: readonly string[]
): { ok: true; noiDung: NoiDungNghiemLy } | { ok: false; loi: string } {
  const v = (vao ?? {}) as Record<string, unknown>;
  const chuoi = (x: unknown, tran: number) => (typeof x === 'string' ? x.trim().slice(0, tran) : '');
  const ds = (x: unknown) => (Array.isArray(x) ? x.map((s) => chuoi(s, 60)).filter(Boolean) : []);

  const y = chuoi(v.y, 400);
  if (!y) return { ok: false, loi: 'Thiếu câu nghĩa (y)' };
  if (y.split(/\s+/).length > 45) return { ok: false, loi: 'Câu nghĩa quá 45 chữ' };

  const dk = (v.dieuKien ?? {}) as Record<string, unknown>;
  const cung = ds(dk.cung);
  const cungLa = cung.find((c) => !cungHopLe.includes(c));
  if (cungLa) return { ok: false, loi: `Cung không hợp lệ: ${cungLa}` };
  const saoVao = Array.isArray(dk.sao) ? (dk.sao as Record<string, unknown>[]) : [];
  const sao = saoVao.map((s) => ({ ten: chuoi(s?.ten, 40), quanHe: chuoi(s?.quanHe, 20) }));
  if (!sao.length || sao.some((s) => !s.ten)) return { ok: false, loi: 'Cần ít nhất một sao có tên' };
  const qhLa = sao.find((s) => !quanHeHopLe.includes(s.quanHe));
  if (qhLa) return { ok: false, loi: `Quan hệ không hợp lệ: ${qhLa.quanHe || '(trống)'}` };

  const nhan = (v.nhan ?? {}) as Record<string, unknown>;
  const chieu = CHIEU.find((c) => c === nhan.chieu);
  const muc = MUC.find((m) => m === nhan.muc);
  if (!chieu || !muc) return { ok: false, loi: 'Nhãn chiều / mức không hợp lệ' };

  const cheDo = CHE_DO.find((c) => c === (v.cheDo ?? 'add'));
  if (!cheDo) return { ok: false, loi: 'Chế độ không hợp lệ' };
  const dich = ds(v.dich);
  if (cheDo !== 'add' && !dich.length) return { ok: false, loi: 'Chế độ khác add phải có mục đích (dich)' };

  const chuDe = ds(v.chuDe);
  return {
    ok: true,
    noiDung: {
      chuDe,
      dieuKien: { cung, sao: sao as MucThuVien['dieuKien']['sao'] },
      y,
      nhan: { chieu, muc, linhVuc: ds(nhan.linhVuc).length ? ds(nhan.linhVuc) : chuDe },
      cheDo,
      ...(dich.length ? { dich } : {}),
    },
  };
}
