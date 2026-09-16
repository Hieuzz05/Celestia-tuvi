import { NextResponse } from 'next/server';
import { goiVoiFallback, KhongCoModelError } from '@/lib/ai/fallback';
import { dungPromptHopTuoi, moTaLaSo } from '@/lib/ai/prompt';
import { dungKhoiTriThuc, truyHoiTriThuc } from '@/lib/ai/rag';
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
  let body: { a?: NguoiXem; b?: NguoiXem; namXem?: number; thangXem?: number };
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

  const namXem = soHopLe(body.namXem, 1900, 2100) ? body.namXem! : new Date().getFullYear();
  const thangXem = soHopLe(body.thangXem, 1, 12) ? body.thangXem! : new Date().getMonth() + 1;

  const laSoA = dungLaSo(body.a!);
  const laSoB = dungLaSo(body.b!);
  const soSanh = soSanhHaiLaSo(laSoA, laSoB);

  const bangSoSanh = soSanh.tieuChi
    .map(
      (t) =>
        `- ${t.ten}: ${soSanh.tenA} = ${t.giaTriA} | ${soSanh.tenB} = ${t.giaTriB} -> ${t.ketQua} (${t.mucDo})`
    )
    .join('\n');

  const doans = await truyHoiTriThuc(
    `hợp tuổi hôn nhân cung Phu Thê ${soSanh.tieuChi.map((t) => t.ketQua).join(' ')}`,
    5,
    'nam-phai'
  );

  const { system, user } = dungPromptHopTuoi(
    moTaLaSo(laSoA, namXem, thangXem),
    moTaLaSo(laSoB, namXem, thangXem),
    bangSoSanh,
    dungKhoiTriThuc(doans)
  );

  try {
    const kq = await goiVoiFallback({ system, user, maxTokens: 5000 });
    return NextResponse.json({
      soSanh,
      noiDung: kq.text,
      model: `${kq.provider}/${kq.model}`,
      nguonTriThuc: doans.map((d) => ({
        tieuDe: d.tieuDe,
        hePhai: d.hePhai,
        diem: Math.round(d.diemTuongDong * 100),
      })),
    });
  } catch (e) {
    if (e instanceof KhongCoModelError) {
      // Bảng so sánh tính bằng engine nên vẫn trả về được dù AI chưa cấu hình
      return NextResponse.json({ soSanh, loiAi: e.message });
    }
    return NextResponse.json(
      { soSanh, loiAi: e instanceof Error ? e.message : 'Lỗi khi gọi AI' },
      { status: 200 }
    );
  }
}
