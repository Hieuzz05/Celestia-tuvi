import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { moDuoc, quyenHienTai } from '@/lib/support/entitlements';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { luanGiaiSau } from '@/lib/tuvi/luan-giai-sau';
import type { NgonNguDoc } from '@/lib/tuvi/quick-read-noi-dung';

/**
 * Bảng luận giải 8 lĩnh vực.
 *
 * Phần này chạy ở máy chủ chứ không dựng thẳng trong trình duyệt, dù engine là
 * hàm thuần. Lý do: đây là khả năng trả phí, mà "ẩn ở giao diện" không phải
 * phân quyền — dựng ở client thì mở devtools là đọc được hết.
 *
 * Người chưa mở quyền vẫn nhận được câu kết luận của từng khối để thấy bên
 * trong có gì; phần thân và căn cứ thì không gửi đi.
 */
export const dynamic = 'force-dynamic';

const soHopLe = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export async function POST(req: Request) {
  const cong = await canDangNhap('deep_map');
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

  const namXem = soHopLe(body.namXem, 1900, 2100)
    ? (body.namXem as number)
    : new Date().getFullYear();
  const ngonNgu: NgonNguDoc = body.ngonNgu === 'en' ? 'en' : 'vi';

  const quyen = await quyenHienTai();
  const day = moDuoc(quyen, 'deepMap');
  const khoi = luanGiaiSau(laSo, namXem, ngonNgu);

  return NextResponse.json(
    {
      day,
      khoi: day
        ? khoi
        : // Xem trước: chỉ câu kết luận, không thân bài, không căn cứ
          khoi.map((k) => ({ ...k, doan: [], canCu: [] })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
