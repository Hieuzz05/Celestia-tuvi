import { embedTruyVan } from '@/lib/ai/embedding';
import { ghiSuCo } from '@/lib/ai/su-co';
import { AiRetryableError } from '@/lib/ai/types';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { tachTuKhoa } from './cum-tu-khoa';
import type { ThucThe } from './thuc-the';
import { chonDaDang, xepTheoUuTien } from './uu-tien-nguon';

/**
 * Truy hồi lai (vector + từ khoá) rồi trộn theo thứ hạng.
 *
 * Vector một mình không đủ cho tử vi. Tên sao là danh từ riêng gần nhau về mặt
 * ngữ nghĩa: "Thiên Riêu", "Thiên Diêu", "Thiên Y" nằm sát nhau trong không gian
 * vector nhưng nói về những thứ khác hẳn. Tìm theo từ khoá bắt đúng chữ; tìm
 * theo vector bắt đúng ý. Cần cả hai.
 *
 * Trộn bằng RRF chứ không cộng điểm: điểm cosine nằm trong [0,1], điểm ts_rank
 * thì không có trần và phụ thuộc độ dài văn bản. Cộng hai thang đó lại là để
 * một bên lấn át bên kia một cách tình cờ. RRF chỉ nhìn thứ hạng nên miễn nhiễm
 * với chuyện đó.
 */

export const PHIEN_BAN_TRUY_HOI = '2026.09.4';

/**
 * Phần kế hoạch mà truy hồi thật sự cần.
 *
 * Cố ý hẹp hơn `KeHoachTruyVan`: luận giải một người và so hai người có hai bộ
 * lập kế hoạch khác nhau, nhưng đều kết thúc ở ba thứ này. Buộc truy hồi phụ
 * thuộc vào cả `KeHoachTruyVan` thì phần Kết nối phải bịa ra `chuDe`, `lopHan`
 * chỉ để gọi được hàm — và những trường bịa ra đó rồi sẽ đi vào nhật ký.
 */
export interface KeHoachChoTruyHoi {
  truyVan: string;
  truyVanTuKhoa: string;
  /** Tên riêng phải tìm nguyên cụm. Thiếu thì lấy tên thực thể thay vào. */
  cumTuKhoa?: string[];
  thucThe: ThucThe[];
}

export interface CauHinhTruyHoi {
  /** Số ứng viên lấy từ mỗi nhánh trước khi trộn */
  soUngVienVector: number;
  soUngVienTuKhoa: number;
  /** Số đoạn cuối cùng đi vào Evidence Pack */
  soCuoi: number;
  /** Hằng số làm mượt của RRF. 60 là giá trị trong bài gốc của Cormack. */
  hangSoRRF: number;
  /**
   * Ngưỡng cosine tối thiểu. Mặc định 0 — tức KHÔNG lọc. Ngưỡng là thứ phải
   * chỉnh bằng eval; đặt sẵn 0.6 như v1 là tự cắt mất đoạn đúng mà không ai biết.
   */
  nguongVector: number;
  /** Chỉ lấy đoạn có gắn ít nhất một trong các thực thể này (null = không lọc) */
  locThucThe: boolean;
  hePhai?: string;
}

export const CAU_HINH_MAC_DINH: CauHinhTruyHoi = {
  soUngVienVector: 15,
  soUngVienTuKhoa: 15,
  soCuoi: 6,
  hangSoRRF: 60,
  nguongVector: 0,
  locThucThe: false,
};

export interface DoanUngVien {
  chunkId: string;
  documentId: string;
  versionId: string;
  noiDung: string;
  duongDeMuc: string | null;
  tieuDe: string;
  hePhai: string;
  mucTinCay: string;
  phienBanTaiLieu: string;
  hangVector?: number;
  diemVector?: number;
  hangTuKhoa?: number;
  diemTuKhoa?: number;
  diemRRF: number;
  duocChon: boolean;
  /**
   * Đoạn này gần như chép lại một đoạn đã được chọn (thường là cùng câu phú
   * trong hai cuốn sách khác nhau) — mang mã đoạn kia, và không vào gói bằng
   * chứng. Xem `chonDaDang`.
   */
  trungVoi?: string;
}

export interface KetQuaTruyHoi {
  ungVien: DoanUngVien[];
  daChon: DoanUngVien[];
  truyVan: string;
  cauHinh: CauHinhTruyHoi;
  phienBan: string;
  doTreMs: number;
  /** Kho chưa có nguồn nào xuất bản — khác hẳn với "tìm mà không thấy" */
  khoTrong: boolean;
}

interface DongSql {
  chunk_id: string;
  version_id: string;
  document_id: string;
  noi_dung: string;
  duong_de_muc: string | null;
  tieu_de: string;
  he_phai: string;
  muc_tin_cay: string;
  phien_ban: string;
  diem: number;
}

function veUngVien(d: DongSql): DoanUngVien {
  return {
    chunkId: d.chunk_id,
    documentId: d.document_id,
    versionId: d.version_id,
    noiDung: d.noi_dung,
    duongDeMuc: d.duong_de_muc,
    tieuDe: d.tieu_de,
    hePhai: d.he_phai,
    mucTinCay: d.muc_tin_cay,
    phienBanTaiLieu: d.phien_ban,
    diemRRF: 0,
    duocChon: false,
  };
}

/**
 * Nhánh từ khoá: tìm nguyên cụm cho tên riêng, từ lẻ cho phần còn lại.
 *
 * Hàm SQL mới (`tim_kien_thuc_tu_khoa_cum`, trong supabase/va-rag-chat-luong.sql)
 * có thể chưa chạy trên database đang dùng — hai máy dùng chung một Supabase và
 * SQL do người chạy tay. Thiếu hàm thì lùi về hàm cũ, để bản mã này lên trước
 * SQL cũng không làm chết nhánh từ khoá.
 */
async function timTheoTuKhoa(
  supabase: NonNullable<ReturnType<typeof taoSupabaseAdmin>>,
  keHoach: KeHoachChoTruyHoi,
  cauHinh: CauHinhTruyHoi,
  locThucThe: string[] | null
) {
  const cauGoc = keHoach.truyVanTuKhoa || keHoach.truyVan;
  const tenThucThe = keHoach.thucThe.map((t) => t.ten);
  const { cum, tuLe } = tachTuKhoa(cauGoc, [...(keHoach.cumTuKhoa ?? []), ...tenThucThe], tenThucThe);

  const moi = await supabase.rpc('tim_kien_thuc_tu_khoa_cum', {
    cau_tu_le: tuLe,
    cum_tu: cum,
    so_luong: cauHinh.soUngVienTuKhoa,
    loc_he_phai: cauHinh.hePhai ?? null,
    loc_thuc_the: locThucThe,
  });
  const thieuHam =
    moi.error && (moi.error.code === 'PGRST202' || /could not find the function/i.test(moi.error.message));
  if (!thieuHam) return moi;

  return supabase.rpc('tim_kien_thuc_tu_khoa', {
    cau_truy_van: cauGoc,
    so_luong: cauHinh.soUngVienTuKhoa,
    loc_he_phai: cauHinh.hePhai ?? null,
    loc_thuc_the: locThucThe,
  });
}

export async function truyHoi(
  keHoach: KeHoachChoTruyHoi,
  cauHinhVao: Partial<CauHinhTruyHoi> = {}
): Promise<KetQuaTruyHoi> {
  const cauHinh = { ...CAU_HINH_MAC_DINH, ...cauHinhVao };
  const batDau = Date.now();
  const rong = (): KetQuaTruyHoi => ({
    ungVien: [],
    daChon: [],
    truyVan: keHoach.truyVan,
    cauHinh,
    phienBan: PHIEN_BAN_TRUY_HOI,
    doTreMs: Date.now() - batDau,
    khoTrong: true,
  });

  const supabase = taoSupabaseAdmin();
  if (!supabase) return rong();

  const locThucThe =
    cauHinh.locThucThe && keHoach.thucThe.length ? keHoach.thucThe.map((t) => t.id) : null;

  let vector: number[];
  try {
    vector = await embedTruyVan(keHoach.truyVan);
  } catch (e) {
    console.warn('[RAG] Không sinh được vector truy vấn:', e instanceof Error ? e.message : e);
    // RAG hỏng thì mọi bài mất nguồn sách mà không báo lỗi gì ra ngoài — phải ghi sự cố
    void ghiSuCo({
      nguon: 'embedding',
      provider: process.env.EMBEDDING_PROVIDER === 'gemini' ? 'gemini' : 'openai',
      loai: e instanceof AiRetryableError ? e.loai : 'server',
      thongDiep: e instanceof Error ? e.message : String(e),
    });
    return rong();
  }

  // Hai nhánh chạy song song: chúng độc lập, và nhánh từ khoá rẻ hơn nhiều nên
  // chờ tuần tự chỉ làm tăng độ trễ mà không được gì.
  const [kqVector, kqTuKhoa] = await Promise.all([
    supabase.rpc('tim_kien_thuc_vector', {
      vector_truy_van: vector,
      so_luong: cauHinh.soUngVienVector,
      nguong_toi_thieu: cauHinh.nguongVector,
      loc_he_phai: cauHinh.hePhai ?? null,
      loc_thuc_the: locThucThe,
    }),
    timTheoTuKhoa(supabase, keHoach, cauHinh, locThucThe),
  ]);

  if (kqVector.error) {
    console.warn('[RAG] Nhánh vector lỗi:', kqVector.error.message);
    return rong();
  }
  if (kqTuKhoa.error) {
    // Nhánh từ khoá hỏng không nên làm chết cả truy hồi — vector vẫn dùng được.
    console.warn('[RAG] Nhánh từ khoá lỗi:', kqTuKhoa.error.message);
  }

  const dsVector: DongSql[] = kqVector.data ?? [];
  const dsTuKhoa: DongSql[] = kqTuKhoa.error ? [] : (kqTuKhoa.data ?? []);

  if (dsVector.length === 0 && dsTuKhoa.length === 0) {
    return { ...rong(), khoTrong: false, doTreMs: Date.now() - batDau };
  }

  const gop = new Map<string, DoanUngVien>();

  dsVector.forEach((d, i) => {
    const u = gop.get(d.chunk_id) ?? veUngVien(d);
    u.hangVector = i + 1;
    u.diemVector = d.diem;
    gop.set(d.chunk_id, u);
  });

  dsTuKhoa.forEach((d, i) => {
    const u = gop.get(d.chunk_id) ?? veUngVien(d);
    u.hangTuKhoa = i + 1;
    u.diemTuKhoa = d.diem;
    gop.set(d.chunk_id, u);
  });

  const k = cauHinh.hangSoRRF;
  for (const u of gop.values()) {
    // Đoạn chỉ xuất hiện ở một nhánh vẫn có điểm, chỉ là thấp hơn đoạn được cả
    // hai nhánh đồng thuận — đúng tinh thần của rank fusion.
    u.diemRRF =
      (u.hangVector ? 1 / (k + u.hangVector) : 0) + (u.hangTuKhoa ? 1 / (k + u.hangTuKhoa) : 0);
  }

  // Xếp theo độ liên quan; mức tin cậy chỉ phân xử khi hai đoạn ngang ngửa. Rồi
  // bỏ đoạn chép lại đoạn đã chọn, và giới hạn số đoạn mỗi tài liệu để gói bằng
  // chứng có nhiều tiếng nói — xem lib/rag/uu-tien-nguon.ts.
  const ungVien = xepTheoUuTien([...gop.values()]);
  const daChon = chonDaDang(ungVien, cauHinh.soCuoi);
  for (const u of daChon) u.duocChon = true;

  return {
    ungVien,
    daChon,
    truyVan: keHoach.truyVan,
    cauHinh,
    phienBan: PHIEN_BAN_TRUY_HOI,
    doTreMs: Date.now() - batDau,
    khoTrong: false,
  };
}
