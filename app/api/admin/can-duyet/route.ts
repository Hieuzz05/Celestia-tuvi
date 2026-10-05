import { NextResponse } from 'next/server';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { COT_PHAN_HOI_AN_TOAN, dongPhanHoiAnToan } from '@/lib/rag/phan-hoi';
import { BANG_PHIEN_BAN } from '@/lib/rag/thu-vien/nghiem-ly';

/**
 * CẦN DUYỆT — một màn cho hai hàng chờ của chủ dự án (CEL-195):
 *  1. Phiên bản nghiệm lý chưa duyệt (chỉ mã, số phiên bản, lúc tạo).
 *  2. Phản hồi 👎 trong 30 ngày: chỉ nhãn + phiên bản + mã lỗi, KHÔNG câu hỏi / câu trả lời / người dùng.
 * Bảng nghiệm lý chưa có (chưa chạy SQL) thì hàng 1 rỗng kèm cờ, hàng 2 vẫn chạy.
 */
export async function GET() {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;
  const db = taoSupabaseAdmin();
  if (!db) return NextResponse.json({ loi: 'Chưa cấu hình Supabase' }, { status: 503 });

  const nl = await db
    .from(BANG_PHIEN_BAN)
    .select('muc_id, phien_ban, tao_luc')
    .eq('duyet', 'chua')
    .order('tao_luc', { ascending: false })
    .limit(100);

  const tu = new Date(Date.now() - 30 * 86400_000).toISOString();
  const ph = await db
    .from('ai_requests')
    .select(COT_PHAN_HOI_AN_TOAN)
    .not('phan_hoi', 'is', null)
    .gte('tao_luc', tu)
    .order('tao_luc', { ascending: false })
    .limit(500);
  if (ph.error) return NextResponse.json({ loi: 'Chưa đọc được hàng chờ phản hồi.' }, { status: 500 });

  const ds = (ph.data ?? []).map((r) => dongPhanHoiAnToan(r as Record<string, unknown>));
  const theoLyDo: Record<string, number> = {};
  for (const d of ds) if (d.phanHoi === 'khong_dung') theoLyDo[d.lyDo ?? 'khong-ro'] = (theoLyDo[d.lyDo ?? 'khong-ro'] ?? 0) + 1;

  return NextResponse.json({
    nghiemLy: nl.error ? [] : nl.data ?? [],
    nghiemLyChuaCoBang: !!nl.error,
    phanHoi: {
      huuIch: ds.filter((d) => d.phanHoi === 'huu_ich').length,
      khongDung: ds.filter((d) => d.phanHoi === 'khong_dung').length,
      theoLyDo,
      ds: ds.filter((d) => d.phanHoi === 'khong_dung').slice(0, 100),
    },
  });
}
