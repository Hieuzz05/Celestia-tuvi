import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { moDuoc, quyenHienTai } from '@/lib/support/entitlements';
import { KhongCoModelError } from '@/lib/ai/fallback';
import { luanKetNoi } from '@/lib/ket-noi/tra-loi';
import { laYDinhHopLe, Y_DINH_MAC_DINH, type YDinhKetNoi } from '@/lib/ket-noi/y-dinh';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { soSanhHaiLaSo } from '@/lib/tuvi/hoptuoi';

export const maxDuration = 60;

interface NguoiXem {
  ngay?: number;
  thang?: number;
  nam?: number;
  gio?: number;
  gioiTinh?: string;
  hoTen?: string;
}

const soHopLe = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

function kiemTra(n: NguoiXem | undefined): string | null {
  if (!n) return 'Thiếu thông tin người xem';
  if (
    !soHopLe(n.ngay, 1, 31) ||
    !soHopLe(n.thang, 1, 12) ||
    !soHopLe(n.nam, 1900, 2100) ||
    !soHopLe(n.gio, 0, 23) ||
    (n.gioiTinh !== 'nam' && n.gioiTinh !== 'nu')
  ) {
    return 'Ngày giờ sinh không hợp lệ';
  }
  return null;
}

const dungLaSo = (n: NguoiXem) =>
  lapLaSo({
    ngay: n.ngay!,
    thang: n.thang!,
    nam: n.nam!,
    gio: n.gio!,
    gioiTinh: n.gioiTinh as GioiTinh,
    hoTen: typeof n.hoTen === 'string' ? n.hoTen.slice(0, 80) : undefined,
  });

export async function POST(req: Request) {
  // Ẩn nút ở giao diện không phải phân quyền — chặn thật phải ở đây
  const cong = await canDangNhap('connection');
  if (!cong.duocPhep) return cong.chan!;

  // Bản đọc đầy đủ cho hai người là khả năng trả phí. Gọi model rồi mới kiểm
  // thì tiền mua token đã tiêu mất, nên kiểm ngay tại đây.
  const quyen = await quyenHienTai();
  if (!moDuoc(quyen, 'connectionFull')) {
    return NextResponse.json(
      {
        error: { code: 'SUPPORTER_REQUIRED', message: 'Phần này cần quyền Supporter.' },
        loi: 'Phần này cần quyền Supporter.',
        canUngHo: 'connection_full',
      },
      { status: 402 }
    );
  }

  let body: {
    a?: NguoiXem;
    b?: NguoiXem;
    comparison?: { intent?: string; question?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không hợp lệ' }, { status: 400 });
  }

  for (const [nhan, n] of [
    ['người thứ nhất', body.a],
    ['người thứ hai', body.b],
  ] as const) {
    const loi = kiemTra(n);
    if (loi) return NextResponse.json({ loi: `${loi} (${nhan})` }, { status: 400 });
  }

  // Ý định so sánh quyết định cung nào được đọc, RAG tìm gì và bài có mục nào.
  // Thiếu nó thì mọi cặp đều nhận cùng một kiểu luận giải — đúng vấn đề mà lớp
  // này sinh ra để sửa.
  const yDinh: YDinhKetNoi = laYDinhHopLe(body.comparison?.intent)
    ? (body.comparison!.intent as YDinhKetNoi)
    : Y_DINH_MAC_DINH;

  const cauHoi =
    typeof body.comparison?.question === 'string'
      ? body.comparison.question.trim().slice(0, 500)
      : '';

  if (yDinh === 'khac' && cauHoi.length < 10) {
    return NextResponse.json(
      { loi: 'Hãy nói ngắn gọn điều bạn muốn hiểu về hai người này.' },
      { status: 400 }
    );
  }

  const laSoA = dungLaSo(body.a!);
  const laSoB = dungLaSo(body.b!);
  const soSanh = soSanhHaiLaSo(laSoA, laSoB);

  try {
    const kq = await luanKetNoi({
      laSoA,
      laSoB,
      tenA: soSanh.tenA,
      tenB: soSanh.tenB,
      yDinh,
      cauHoi: cauHoi || undefined,
    });

    return NextResponse.json({ soSanh, ketNoi: kq, model: `${kq.provider}/${kq.model}` });
  } catch (e) {
    // Bảng so sánh do engine tính nên luôn trả về được, kể cả khi model hỏng —
    // người dùng vẫn nhận được phần dữ kiện thay vì một trang trắng.
    if (e instanceof KhongCoModelError) {
      return NextResponse.json({ soSanh, yDinh, loiAi: e.message });
    }
    return NextResponse.json(
      { soSanh, yDinh, loiAi: e instanceof Error ? e.message : 'Lỗi khi gọi AI' },
      { status: 200 }
    );
  }
}
