import { NextResponse } from 'next/server';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';
import { ghiNhatKyQuanTri } from '@/lib/rag/nhat-ky';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { QUAN_HE } from '@/lib/rag/thu-vien/kieu';
import { BANG_MUC, BANG_PHIEN_BAN, MA_NGHIEM_LY, chuanHoaNoiDung, xoaDemNghiemLy } from '@/lib/rag/thu-vien/nghiem-ly';
import { TEN_CUNG } from '@/lib/tuvi/constants';

/**
 * NGHIỆM LÝ CỦA TÔI — chỉ quản trị viên (CEL-196, QĐ-13). Bảng: supabase/va-qd13-thu-vien.sql.
 *
 * GET                                   → mọi mục + mọi phiên bản (mới trước)
 * POST { hanhDong: 'tao', id, noiDung } → mục mới (nhap) + phiên bản 1 (chua)
 * POST { hanhDong: 'sua', id, noiDung } → phiên bản MỚI (nội dung phiên bản cũ bất biến)
 * POST { hanhDong: 'duyet' | 'bac', id, phienBan }
 * POST { hanhDong: 'dung', id, phienBan } → chỉ khi phiên bản đã duyệt
 * POST { hanhDong: 'luu-tru', id }
 *
 * Người duyệt + thời điểm do MÁY CHỦ ghi (email admin đang đăng nhập), không nhận từ body.
 */

const CHUA_CHAY = 'Chưa có bảng nghiệm lý — chủ dự án cần chạy supabase/va-qd13-thu-vien.sql trên Supabase';
const loiBang = (e: { message?: string; code?: string }) =>
  e.code === '42P01' || /does not exist|schema cache/i.test(e.message ?? '') ? CHUA_CHAY : `Lỗi cơ sở dữ liệu: ${e.message}`;

export async function GET() {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;
  const db = taoSupabaseAdmin();
  if (!db) return NextResponse.json({ loi: 'Chưa cấu hình Supabase' }, { status: 503 });

  const m = await db.from(BANG_MUC).select('*').order('id');
  if (m.error) return NextResponse.json({ loi: loiBang(m.error) }, { status: 500 });
  const p = await db.from(BANG_PHIEN_BAN).select('*').order('phien_ban', { ascending: false });
  if (p.error) return NextResponse.json({ loi: loiBang(p.error) }, { status: 500 });
  return NextResponse.json({ muc: m.data ?? [], phienBan: p.data ?? [], cung: TEN_CUNG, quanHe: QUAN_HE });
}

export async function POST(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;
  const db = taoSupabaseAdmin();
  if (!db) return NextResponse.json({ loi: 'Chưa cấu hình Supabase' }, { status: 503 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không phải JSON hợp lệ' }, { status: 400 });
  }
  const id = typeof b.id === 'string' ? b.id.trim().toUpperCase() : '';
  if (!MA_NGHIEM_LY.test(id)) return NextResponse.json({ loi: 'Mã nghiệm lý phải dạng NL-XXX' }, { status: 400 });
  const ai = cong.actor.email ?? cong.actor.id ?? 'cuc-bo';
  const hanhDong = String(b.hanhDong ?? '');
  const sai = (loi: string, status = 400) => NextResponse.json({ loi }, { status });
  const xong = async (chiTiet: Record<string, unknown>) => {
    xoaDemNghiemLy();
    await ghiNhatKyQuanTri(`nghiem-ly.${hanhDong}`, 'muc_thu_vien', id, cong.actor, chiTiet);
    return NextResponse.json({ ok: true });
  };

  if (hanhDong === 'tao' || hanhDong === 'sua') {
    const kq = chuanHoaNoiDung(b.noiDung, TEN_CUNG, QUAN_HE);
    if (!kq.ok) return sai(kq.loi);
    let phienBan = 1;
    if (hanhDong === 'tao') {
      const r = await db.from(BANG_MUC).insert({ id, truong_phai: 'celes', trang_thai: 'nhap', tao_boi: ai });
      if (r.error) return sai(r.error.code === '23505' ? 'Mã đã tồn tại — dùng "Sửa" để thêm phiên bản' : loiBang(r.error), 500);
    } else {
      const r = await db.from(BANG_PHIEN_BAN).select('phien_ban').eq('muc_id', id).order('phien_ban', { ascending: false }).limit(1);
      if (r.error) return sai(loiBang(r.error), 500);
      if (!r.data?.length) return sai('Không có mục này', 404);
      phienBan = (r.data[0].phien_ban as number) + 1;
    }
    const r = await db.from(BANG_PHIEN_BAN).insert({ muc_id: id, phien_ban: phienBan, noi_dung: kq.noiDung, tao_boi: ai });
    if (r.error) return sai(loiBang(r.error), 500);
    await db.from(BANG_MUC).update({ cap_nhat_luc: new Date().toISOString() }).eq('id', id);
    return xong({ phienBan });
  }

  if (hanhDong === 'duyet' || hanhDong === 'bac' || hanhDong === 'dung') {
    const phienBan = Number(b.phienBan);
    if (!Number.isInteger(phienBan) || phienBan < 1) return sai('Phiên bản không hợp lệ');
    if (hanhDong === 'dung') {
      const r = await db.from(BANG_PHIEN_BAN).select('duyet').eq('muc_id', id).eq('phien_ban', phienBan).maybeSingle();
      if (r.error) return sai(loiBang(r.error), 500);
      if (r.data?.duyet !== 'da-duyet') return sai('Chỉ dùng được phiên bản đã duyệt');
      const u = await db
        .from(BANG_MUC)
        .update({ trang_thai: 'dang-dung', phien_ban_dang_dung: phienBan, cap_nhat_luc: new Date().toISOString() })
        .eq('id', id);
      if (u.error) return sai(loiBang(u.error), 500);
      return xong({ phienBan });
    }
    const capNhat =
      hanhDong === 'duyet'
        ? { duyet: 'da-duyet', approved_by: ai, approved_at: new Date().toISOString() }
        : { duyet: 'bi-bac', approved_by: null, approved_at: null };
    const u = await db.from(BANG_PHIEN_BAN).update(capNhat).eq('muc_id', id).eq('phien_ban', phienBan).select('phien_ban');
    if (u.error) return sai(loiBang(u.error), 500);
    if (!u.data?.length) return sai('Không có phiên bản này', 404);
    // Bác đúng phiên bản đang dùng → mục rời khỏi chat ngay (bộ lọc cũng chặn, đây là cho rõ trạng thái)
    if (hanhDong === 'bac')
      await db.from(BANG_MUC).update({ trang_thai: 'nhap', phien_ban_dang_dung: null }).eq('id', id).eq('phien_ban_dang_dung', phienBan);
    return xong({ phienBan });
  }

  if (hanhDong === 'luu-tru') {
    const u = await db.from(BANG_MUC).update({ trang_thai: 'luu-tru', cap_nhat_luc: new Date().toISOString() }).eq('id', id);
    if (u.error) return sai(loiBang(u.error), 500);
    return xong({});
  }

  return sai('Hành động không hợp lệ');
}
