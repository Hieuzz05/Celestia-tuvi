import { createHash } from 'node:crypto';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import type { KetQuaKiemDuyet } from './kiem-duyet';
import type { KeHoachTruyVan } from './planner';
import type { KetQuaTruyHoi } from './truy-hoi';

/**
 * Ghi vết một lượt trả lời.
 *
 * Mục đích duy nhất: khi người dùng báo "câu này sai", phân biệt được engine
 * tính sai, truy hồi trượt, hay model diễn giải hỏng. Không có vết thì cả ba
 * đều trông giống nhau.
 *
 * Mọi hàm ở đây đều nuốt lỗi. Nhật ký hỏng không được phép làm hỏng câu trả lời
 * — đó là thứ người dùng thật sự đến vì nó.
 */

/** Băm lá số để trace lần được mà không chép lại ngày giờ sinh */
export function bamLaSo(ngay: number, thang: number, nam: number, gio: number, gioiTinh: string): string {
  return createHash('sha256').update(`${ngay}-${thang}-${nam}-${gio}-${gioiTinh}`).digest('hex').slice(0, 16);
}

export async function ghiLanTruyHoi(
  keHoach: KeHoachTruyVan,
  kq: KetQuaTruyHoi,
  meta: { requestId?: string; cauHoi: string; cheDo?: 'that' | 'thu_nghiem'; nguoiChay?: string }
): Promise<string | null> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('retrieval_runs')
      .insert({
        request_id: meta.requestId ?? null,
        cau_hoi: meta.cauHoi,
        truy_van: kq.truyVan,
        y_dinh: keHoach.chuDe,
        thuc_the: keHoach.thucThe.map((t) => t.id),
        cung_lien_quan: keHoach.cungLienQuan,
        bo_loc: { hePhai: kq.cauHinh.hePhai ?? null, locThucThe: kq.cauHinh.locThucThe },
        cau_hinh: kq.cauHinh,
        phien_ban: { planner: keHoach.phienBan, truyHoi: kq.phienBan },
        do_tre_ms: kq.doTreMs,
        che_do: meta.cheDo ?? 'that',
        nguoi_chay: meta.nguoiChay ?? null,
      })
      .select('id')
      .single();

    if (error || !data) return null;

    if (kq.ungVien.length) {
      await supabase.from('retrieval_results').insert(
        kq.ungVien.map((u) => ({
          run_id: data.id,
          chunk_id: u.chunkId,
          hang_vector: u.hangVector ?? null,
          diem_vector: u.diemVector ?? null,
          hang_tu_khoa: u.hangTuKhoa ?? null,
          diem_tu_khoa: u.diemTuKhoa ?? null,
          diem_rrf: u.diemRRF,
          duoc_chon: u.duocChon,
        }))
      );
    }

    return data.id;
  } catch (e) {
    console.warn('[RAG] Không ghi được nhật ký truy hồi:', e instanceof Error ? e.message : e);
    return null;
  }
}

export interface VetTraLoi {
  requestId: string;
  userId?: string;
  chartHash?: string;
  tinhNang?: string;
  cauHoi?: string;
  runId?: string | null;
  phienBan: Record<string, string>;
  provider?: string;
  model?: string;
  doTreMs?: number;
  kiemDuyet?: KetQuaKiemDuyet;
}

export async function ghiVetTraLoi(v: VetTraLoi): Promise<void> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return;

  try {
    await supabase.from('ai_requests').insert({
      request_id: v.requestId,
      user_id: v.userId ?? null,
      chart_hash: v.chartHash ?? null,
      tinh_nang: v.tinhNang ?? 'hoi-dap',
      cau_hoi: v.cauHoi ?? null,
      run_id: v.runId ?? null,
      phien_ban: v.phienBan,
      provider: v.provider ?? null,
      model: v.model ?? null,
      do_tre_ms: v.doTreMs ?? null,
      ket_qua_kiem_duyet: v.kiemDuyet ?? null,
      dat: v.kiemDuyet?.dat ?? null,
    });
  } catch (e) {
    console.warn('[RAG] Không ghi được vết trả lời:', e instanceof Error ? e.message : e);
  }
}

/** Nhật ký thao tác quản trị — bắt buộc cho xuất bản/lưu trữ/xoá */
export async function ghiNhatKyQuanTri(
  hanhDong: string,
  doiTuong: string,
  doiTuongId: string,
  actor: { id?: string; email?: string },
  chiTiet: Record<string, unknown> = {}
): Promise<void> {
  const supabase = taoSupabaseAdmin();
  if (!supabase) return;

  try {
    await supabase.from('admin_audit_log').insert({
      actor: actor.id ?? null,
      actor_email: actor.email ?? null,
      hanh_dong: hanhDong,
      doi_tuong: doiTuong,
      doi_tuong_id: doiTuongId,
      chi_tiet: chiTiet,
    });
  } catch (e) {
    console.warn('[RAG] Không ghi được nhật ký quản trị:', e instanceof Error ? e.message : e);
  }
}
