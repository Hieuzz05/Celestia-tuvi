import { NextResponse } from 'next/server';
import { canQuanTri } from '@/lib/rag/cong-quan-tri';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Phễu kích hoạt — số khách KHÁC NHAU chạm mỗi bước trong N ngày (mặc định 7).
 *
 * Đếm theo khách chứ không theo lượt: một người bấm "Muốn biết vì sao" mười lần
 * vẫn là một người đã tò mò về căn cứ. Thứ tự bước là hành trình người mới đi
 * qua; tỉ lệ ở giao diện tính so với bước trước.
 */
const BUOC: { ten: string; nhan: string }[] = [
  { ten: 'landing_cta_click', nhan: 'Bấm "Bắt đầu" ở trang chủ' },
  { ten: 'birth_flow_started', nhan: 'Bắt đầu nhập ngày sinh' },
  { ten: 'chart_generated', nhan: 'Lập xong lá số' },
  { ten: 'quick_read_viewed', nhan: 'Xem trang lá số' },
  { ten: 'why_opened', nhan: 'Mở "Muốn biết vì sao"' },
  { ten: 'deep_read_cta', nhan: 'Bấm đọc chuyên sâu' },
  { ten: 'auth_gate_viewed', nhan: 'Gặp cổng đăng nhập' },
  { ten: 'signup_started', nhan: 'Bấm tạo tài khoản' },
  { ten: 'signup_completed', nhan: 'Đăng ký xong' },
  { ten: 'ask_submitted', nhan: 'Hỏi Celes' },
  { ten: 'connection_compare_completed', nhan: 'So xong hai người (Kết nối)' },
];

export async function GET(req: Request) {
  const cong = await canQuanTri();
  if (!cong.duocPhep) return cong.chan;
  const db = taoSupabaseAdmin();
  if (!db) return NextResponse.json({ loi: 'Chưa cấu hình' }, { status: 503 });

  const soNgay = Math.min(90, Math.max(1, Number(new URL(req.url).searchParams.get('ngay')) || 7));
  const tu = new Date(Date.now() - soNgay * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db
    .from('su_kien')
    .select('ten, khach')
    .in('ten', BUOC.map((b) => b.ten))
    .gte('luc', tu)
    .limit(50000);
  if (error) return NextResponse.json({ loi: error.message, chuaTaoBang: /su_kien/.test(error.message) }, { status: 200 });

  const theoBuoc = new Map<string, Set<string>>();
  for (const d of data ?? []) {
    if (!theoBuoc.has(d.ten)) theoBuoc.set(d.ten, new Set());
    theoBuoc.get(d.ten)!.add(d.khach ?? '?');
  }
  return NextResponse.json({
    soNgay,
    buoc: BUOC.map((b) => ({ ...b, soKhach: theoBuoc.get(b.ten)?.size ?? 0 })),
    tongSuKien: data?.length ?? 0,
  });
}
