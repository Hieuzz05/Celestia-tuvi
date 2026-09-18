import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { moDuoc, quyenHienTai } from '@/lib/support/entitlements';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { luanHan, type CapLuanHan } from '@/lib/tuvi/luan-han';
import type { NgonNguDoc } from '@/lib/tuvi/quick-read-noi-dung';
import { thangAmHienTai } from '@/lib/tuvi/bay-gio';

/**
 * Luận hạn chi tiết cho một quãng / năm / tháng.
 *
 * Cùng lý do với bảng luận giải: đây là khả năng trả phí nên phải dựng ở máy
 * chủ. Chưa mở quyền thì vẫn nhận tiêu đề và chủ đề chính — đủ để biết bên
 * trong nói về cái gì — nhưng không nhận phần luận và căn cứ.
 */
export const dynamic = 'force-dynamic';

const soHopLe = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export async function POST(req: Request) {
  const cong = await canDangNhap('journey_detail');
  if (!cong.duocPhep) return cong.chan!;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không hợp lệ' }, { status: 400 });
  }

  if (
    !soHopLe(body.ngay, 1, 31) ||
    !soHopLe(body.thang, 1, 12) ||
    !soHopLe(body.nam, 1900, 2100) ||
    !soHopLe(body.gio, 0, 23) ||
    (body.gioiTinh !== 'nam' && body.gioiTinh !== 'nu')
  ) {
    return NextResponse.json({ loi: 'Thông tin ngày giờ sinh không hợp lệ' }, { status: 400 });
  }

  const laSo = lapLaSo({
    ngay: body.ngay as number,
    thang: body.thang as number,
    nam: body.nam as number,
    gio: body.gio as number,
    gioiTinh: body.gioiTinh as GioiTinh,
    hoTen: typeof body.hoTen === 'string' ? body.hoTen.slice(0, 80) : undefined,
  });

  const cap: CapLuanHan =
    body.cap === 'giai-doan' || body.cap === 'thang' ? body.cap : 'nam';
  const namXem = soHopLe(body.namXem, 1900, 2100)
    ? (body.namXem as number)
    : new Date().getFullYear();
  // Mặc định là tháng ÂM hiện tại, không phải tháng 1
  const thangXem = soHopLe(body.thangXem, 1, 12) ? (body.thangXem as number) : thangAmHienTai();
  const ngonNgu: NgonNguDoc = body.ngonNgu === 'en' ? 'en' : 'vi';

  const quyen = await quyenHienTai();
  const day = moDuoc(quyen, 'journeyDetail');
  const bai = luanHan(laSo, cap, namXem, thangXem, ngonNgu);

  return NextResponse.json(
    {
      day,
      bai: day
        ? bai
        : { ...bai, tanDung: [], luuY: [], linhVuc: [], canCu: [], nhip: { nhan: '', mo: '' } },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
