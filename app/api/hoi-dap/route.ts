import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { canDangNhap } from '@/lib/auth/cong';
import { chotCauHoi, datChoCauHoi, hoanCauHoi } from '@/lib/support/quota';
import { goiVoiFallback, KhongCoModelError } from '@/lib/ai/fallback';
import { dungPromptHoiDap, type TinNhan } from '@/lib/ai/prompt';
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
  namXem?: number;
  thangXem?: number;
  cauHoi?: string;
  lichSu?: TinNhan[];
}

const soHopLe = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export async function POST(req: Request) {
  // Ẩn nút ở giao diện không phải phân quyền — chặn thật phải ở đây
  const cong = await canDangNhap('ask_celes');
  if (!cong.duocPhep) return cong.chan!;

  let body: Body;
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

  const cauHoi = body.cauHoi?.trim();
  if (!cauHoi) return NextResponse.json({ loi: 'Chưa nhập câu hỏi' }, { status: 400 });
  if (cauHoi.length > 800) {
    return NextResponse.json({ loi: 'Câu hỏi quá dài (tối đa 800 ký tự)' }, { status: 400 });
  }

  // Lịch sử đến từ client nên phải lọc lại: chỉ nhận đúng hình dạng mong đợi và
  // cắt bớt độ dài, tránh việc nhét nội dung tuỳ ý vào prompt.
  const lichSu: TinNhan[] = Array.isArray(body.lichSu)
    ? body.lichSu
        .filter(
          (t): t is TinNhan =>
            !!t &&
            (t.vaiTro === 'nguoi-dung' || t.vaiTro === 'tro-ly') &&
            typeof t.noiDung === 'string'
        )
        .slice(-10)
        .map((t) => ({ vaiTro: t.vaiTro, noiDung: t.noiDung.slice(0, 2000) }))
    : [];

  const namXem = soHopLe(body.namXem, 1900, 2100) ? body.namXem! : new Date().getFullYear();
  const thangXem = soHopLe(body.thangXem, 1, 12) ? body.thangXem! : new Date().getMonth() + 1;

  const laSo = lapLaSo({
    ngay: body.ngay!,
    thang: body.thang!,
    nam: body.nam!,
    gio: body.gio!,
    gioiTinh: body.gioiTinh as GioiTinh,
    hoTen: typeof body.hoTen === 'string' ? body.hoTen.slice(0, 80) : undefined,
  });

  const cungMenh = laSo.cungs[laSo.menhIndex];
  const saoMenh = cungMenh.sao
    .filter((s) => s.loai === 'chinh-tinh' || s.loai === 'tu-hoa')
    .map((s) => s.ten)
    .join(' ');
  const doans = await truyHoiTriThuc(`${cauHoi}. ${saoMenh}`, 5);

  const { system, user } = dungPromptHoiDap(
    laSo,
    namXem,
    thangXem,
    lichSu,
    cauHoi,
    dungKhoiTriThuc(doans)
  );

  // Đặt chỗ NGAY TRƯỚC khi gọi model: câu thứ 6 không được phép chạm tới nhà
  // cung cấp. Kiểm ở React không tính là chặn — ai cũng gọi thẳng endpoint được.
  const requestId = randomUUID();
  const cho = await datChoCauHoi(requestId);
  if (!cho.duocPhep) return cho.chan!;

  try {
    const kq = await goiVoiFallback({ system, user, maxTokens: 3000 });
    await chotCauHoi(requestId, `${kq.provider}/${kq.model}`);
    return NextResponse.json({
      traLoi: kq.text,
      model: `${kq.provider}/${kq.model}`,
      nguonTriThuc: doans.map((d) => ({
        tieuDe: d.tieuDe,
        hePhai: d.hePhai,
        diem: Math.round(d.diemTuongDong * 100),
      })),
    });
  } catch (e) {
    // Hỏng ở phía nhà cung cấp là lỗi của hệ thống, không phải của người dùng —
    // trả lại lượt vừa trừ.
    await hoanCauHoi(cho.nguon, requestId);
    if (e instanceof KhongCoModelError) {
      return NextResponse.json({ loi: e.message, chuaCauHinh: true }, { status: 503 });
    }
    return NextResponse.json(
      { loi: e instanceof Error ? e.message : 'Lỗi khi gọi AI' },
      { status: 502 }
    );
  }
}
