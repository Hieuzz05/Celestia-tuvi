import { NextResponse } from 'next/server';
import { goiVoiFallback, KhongCoModelError } from '@/lib/ai/fallback';
import { CHU_DE, dungPrompt, type ChuDeId } from '@/lib/ai/prompt';
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

  const { system, user } = dungPrompt(
    laSo,
    chuDe,
    namXem,
    thangXem,
    typeof body.cauHoi === 'string' ? body.cauHoi.slice(0, 500) : undefined
  );

  try {
    const kq = await goiVoiFallback({ system, user, maxTokens: 6000 }, body.model);
    return NextResponse.json({
      noiDung: kq.text,
      model: `${kq.provider}/${kq.model}`,
      daThuHong: kq.daThuHong,
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
