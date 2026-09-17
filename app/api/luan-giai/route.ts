import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { goiVoiFallback, KhongCoModelError } from '@/lib/ai/fallback';
import { CHU_DE, dungPrompt, type ChuDeId } from '@/lib/ai/prompt';
import { dungKhoiTriThuc, truyHoiTriThuc } from '@/lib/ai/rag';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';

export const maxDuration = 60;

interface Body {
  ngay?: number;
  thang?: number;
  nam?: number;
  gio?: number;
  gioiTinh?: string;
  hoTen?: string;
  chuDe?: string;
  namXem?: number;
  thangXem?: number;
  cauHoi?: string;
  model?: string;
}

export async function POST(req: Request) {
  // Ẩn nút ở giao diện không phải phân quyền — chặn thật phải ở đây
  const cong = await canDangNhap('deep_read');
  if (!cong.duocPhep) return cong.chan!;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ loi: 'Body không phải JSON hợp lệ' }, { status: 400 });
  }

  const { ngay, thang, nam, gio, gioiTinh } = body;
  const soHopLe = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

  if (
    !soHopLe(ngay, 1, 31) ||
    !soHopLe(thang, 1, 12) ||
    !soHopLe(nam, 1900, 2100) ||
    !soHopLe(gio, 0, 23) ||
    (gioiTinh !== 'nam' && gioiTinh !== 'nu')
  ) {
    return NextResponse.json({ loi: 'Thông tin ngày giờ sinh không hợp lệ' }, { status: 400 });
  }

  const chuDe = (body.chuDe ?? 'tong-quan') as ChuDeId;
  if (!CHU_DE[chuDe]) {
    return NextResponse.json({ loi: 'Chủ đề luận giải không hợp lệ' }, { status: 400 });
  }

  const namXem = soHopLe(body.namXem, 1900, 2100) ? body.namXem! : new Date().getFullYear();
  const thangXem = soHopLe(body.thangXem, 1, 12) ? body.thangXem! : new Date().getMonth() + 1;

  const laSo = lapLaSo({
    ngay: ngay!,
    thang: thang!,
    nam: nam!,
    gio: gio!,
    gioiTinh: gioiTinh as GioiTinh,
    hoTen: typeof body.hoTen === 'string' ? body.hoTen.slice(0, 80) : undefined,
  });

  const cauHoi = typeof body.cauHoi === 'string' ? body.cauHoi.slice(0, 500) : undefined;

  // Truy hồi tri thức: mô tả câu truy vấn bằng chính các sao có thật trong lá số
  // để tìm đúng đoạn tài liệu nói về bộ sao đó, thay vì chỉ khớp theo tên chủ đề.
  const cungMenh = laSo.cungs[laSo.menhIndex];
  const saoMenh = cungMenh.sao
    .filter((s) => s.loai === 'chinh-tinh' || s.loai === 'tu-hoa')
    .map((s) => s.ten)
    .join(' ');
  const cauTruyVan = [CHU_DE[chuDe].nhan, CHU_DE[chuDe].moTa, saoMenh, laSo.cuc.ten, cauHoi]
    .filter(Boolean)
    .join('. ');

  // Vận hạn luận theo Bắc phái, các chủ đề còn lại theo Nam phái
  const doans = await truyHoiTriThuc(cauTruyVan, 6, chuDe === 'van-han' ? 'bac-phai' : 'nam-phai');

  const { system, user } = dungPrompt(
    laSo,
    chuDe,
    namXem,
    thangXem,
    cauHoi,
    dungKhoiTriThuc(doans)
  );

  try {
    const kq = await goiVoiFallback({ system, user, maxTokens: 6000 }, body.model);
    return NextResponse.json({
      noiDung: kq.text,
      model: `${kq.provider}/${kq.model}`,
      daThuHong: kq.daThuHong,
      // Nguồn gốc RAG không ra tới trình duyệt — xem ghi chú ở components/CanCu.tsx
      tokens: { vao: kq.tokensIn, ra: kq.tokensOut },
    });
  } catch (e) {
    if (e instanceof KhongCoModelError) {
      return NextResponse.json({ loi: e.message, chuaCauHinh: true }, { status: 503 });
    }
    return NextResponse.json(
      { loi: e instanceof Error ? e.message : 'Lỗi không xác định khi gọi AI' },
      { status: 502 }
    );
  }
}
