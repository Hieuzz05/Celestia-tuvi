import { NextResponse } from 'next/server';
import { TEN_SU_KIEN } from '@/lib/su-kien-ten';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Nhận sự kiện phễu từ trình duyệt (lib/analytics.ts) → bảng `su_kien`.
 *
 * Chỉ nhận TÊN có trong danh sách, thuộc tính chỉ giữ giá trị đơn (chuỗi ngắn,
 * số, đúng/sai) và tối đa 12 khoá — để một người gửi rác không nhồi được gì
 * lớn vào bảng. Luôn trả 204: sự kiện là thứ "gửi rồi quên", trình duyệt không
 * cần biết kết quả.
 */
const CHO_PHEP = new Set<string>(TEN_SU_KIEN);

export async function POST(req: Request) {
  let body: { ten?: unknown; thuocTinh?: unknown; khach?: unknown; trang?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  if (typeof body.ten !== 'string' || !CHO_PHEP.has(body.ten)) return new NextResponse(null, { status: 204 });

  const thuocTinh: Record<string, string | number | boolean> = {};
  if (body.thuocTinh && typeof body.thuocTinh === 'object') {
    for (const [k, v] of Object.entries(body.thuocTinh as Record<string, unknown>).slice(0, 12)) {
      if (typeof v === 'string') thuocTinh[k.slice(0, 40)] = v.slice(0, 80);
      else if (typeof v === 'number' || typeof v === 'boolean') thuocTinh[k.slice(0, 40)] = v;
    }
  }

  const db = taoSupabaseAdmin();
  if (db) {
    const { error } = await db.from('su_kien').insert({
      ten: body.ten,
      thuoc_tinh: thuocTinh,
      khach: typeof body.khach === 'string' ? body.khach.slice(0, 64) : null,
      trang: typeof body.trang === 'string' ? body.trang.slice(0, 120) : null,
    });
    if (error) console.warn('[su-kien] Không ghi được:', error.message);
  }
  return new NextResponse(null, { status: 204 });
}
