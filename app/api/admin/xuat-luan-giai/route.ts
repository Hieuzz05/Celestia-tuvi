import { NextResponse } from 'next/server';
import { laAdmin, supabaseDaCauHinh } from '@/lib/supabase/config';
import { nguoiDungHienTai } from '@/lib/supabase/server';
import { taoExcel, taoPdf, type GoiXuat } from '@/lib/xuat/luan-giai';

/**
 * Xuất luận giải chuyên sâu ra Excel / PDF (CEL-137) — CHỈ quản trị viên.
 *
 * GET  → { laAdmin } để trang /luan-giai/sau biết có hiện nút xuất hay không.
 * POST → { dinhDang: 'xlsx' | 'pdf', goi: GoiXuat } → tệp tải về.
 *
 * Ẩn nút ở giao diện không phải phân quyền, nên POST kiểm lại quyền ở đây.
 */
export const runtime = 'nodejs';
export const maxDuration = 60;

// Mười bốn chủ đề cỡ ~60 câu chỉ vài trăm KB chữ — chặn trên để không ai đẩy khối lớn vào máy chủ
const TOI_DA_BYTE = 3_000_000;

async function quyenAdmin(): Promise<boolean> {
  if (!supabaseDaCauHinh) return process.env.NODE_ENV !== 'production';
  const user = await nguoiDungHienTai();
  return Boolean(user && laAdmin(user.email));
}

export async function GET() {
  return NextResponse.json({ laAdmin: await quyenAdmin() });
}

const chuoi = (x: unknown, max = 20_000) => (typeof x === 'string' ? x.slice(0, max) : '');

/** Chỉ giữ đúng các trường cần, ép kiểu chuỗi — dữ liệu từ trình duyệt không tin được */
function lamSach(g: unknown): GoiXuat | null {
  if (!g || typeof g !== 'object') return null;
  const o = g as Record<string, unknown>;
  if (!Array.isArray(o.chuDe) || o.chuDe.length === 0 || o.chuDe.length > 20) return null;
  return {
    ten: chuoi(o.ten, 120),
    thongTinSinh: chuoi(o.thongTinSinh, 200),
    namXem: Number(o.namXem) || new Date().getFullYear(),
    bucTranh: chuoi(o.bucTranh) || null,
    chuDe: o.chuDe.map((c: Record<string, unknown>) => ({
      id: chuoi(c?.id, 40),
      ten: chuoi(c?.ten, 120),
      dan: chuoi(c?.dan, 500),
      tomLai: chuoi(c?.tomLai) || null,
      cau: (Array.isArray(c?.cau) ? c.cau : []).slice(0, 20).map((q: Record<string, unknown>) => ({
        id: chuoi(q?.id, 20),
        cauHoi: chuoi(q?.cauHoi, 500),
        luanGiai: chuoi(q?.luanGiai),
        viSao: chuoi(q?.viSao),
        goiY: chuoi(q?.goiY, 2000),
        chuaViet: Boolean(q?.chuaViet),
      })),
    })),
  };
}

const boDau = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

export async function POST(req: Request) {
  if (!(await quyenAdmin())) {
    return NextResponse.json({ loi: 'Chỉ tài khoản quản trị được xuất dữ liệu.' }, { status: 403 });
  }
  const tho = await req.text();
  if (tho.length > TOI_DA_BYTE) return NextResponse.json({ loi: 'Dữ liệu quá lớn.' }, { status: 413 });

  let body: { dinhDang?: string; goi?: unknown };
  try {
    body = JSON.parse(tho);
  } catch {
    return NextResponse.json({ loi: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }
  const dinhDang = body.dinhDang === 'pdf' ? 'pdf' : 'xlsx';
  const goi = lamSach(body.goi);
  if (!goi) return NextResponse.json({ loi: 'Chưa có chủ đề nào để xuất.' }, { status: 400 });

  try {
    const tep = dinhDang === 'pdf' ? await taoPdf(goi) : await taoExcel(goi);
    const phamVi = goi.chuDe.length === 1 ? boDau(goi.chuDe[0].ten) : 'toan-bo';
    const ten = `luan-giai-${boDau(goi.ten || 'la-so') || 'la-so'}-${phamVi}-${goi.namXem}.${dinhDang}`;
    return new NextResponse(new Uint8Array(tep), {
      headers: {
        'Content-Type':
          dinhDang === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${ten}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('[xuat-luan-giai]', e);
    return NextResponse.json({ loi: 'Không tạo được tệp. Thử lại sau.' }, { status: 500 });
  }
}
