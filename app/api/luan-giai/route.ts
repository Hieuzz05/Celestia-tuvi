import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { randomUUID } from 'node:crypto';
import { KhongCoModelError } from '@/lib/ai/fallback';
import { CHU_DE, type ChuDeId } from '@/lib/ai/prompt';
import { luanBaiDai } from '@/lib/rag/bai-dai';
import { bamLaSo, ghiVetTraLoi } from '@/lib/rag/nhat-ky';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { nhanPhuongPhap } from '@/lib/tuvi/phuong-phap';
import { thangAmHienTai } from '@/lib/tuvi/bay-gio';

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
  // Tháng ÂM, không phải tháng dương — xem lib/tuvi/bay-gio.ts
  const thangXem = soHopLe(body.thangXem, 1, 12) ? body.thangXem! : thangAmHienTai();

  const laSo = lapLaSo({
    ngay: ngay!,
    thang: thang!,
    nam: nam!,
    gio: gio!,
    gioiTinh: gioiTinh as GioiTinh,
    hoTen: typeof body.hoTen === 'string' ? body.hoTen.slice(0, 80) : undefined,
  });

  const cauHoi = typeof body.cauHoi === 'string' ? body.cauHoi.slice(0, 500) : undefined;

  try {
    const requestId = randomUUID();
    const kq = await luanBaiDai({
      laSo,
      chuDe,
      namXem,
      thangXem,
      cauHoiThem: cauHoi,
      requestId,
      uuTienModel: body.model,
    });

    // Ghi vết sau khi có bài: nhật ký hỏng không được làm mất bài.
    await ghiVetTraLoi({
      requestId,
      chartHash: bamLaSo(ngay!, thang!, nam!, gio!, gioiTinh),
      tinhNang: 'luan-giai',
      cauHoi: `${chuDe}${cauHoi ? ` · ${cauHoi}` : ''}`,
      runId: kq.runId,
      phienBan: kq.phienBan,
      provider: kq.provider,
      model: kq.model,
      kiemDuyet: kq.ngonNgu
        ? {
            dat: kq.kiemDuyet.dat && kq.ngonNgu.dat,
            loi: [
              ...kq.kiemDuyet.loi.map((m) => ({ ma: 'bai-dai', mucDo: 'chan' as const, moTa: m })),
              ...kq.ngonNgu.loi,
            ],
            phuSong: 0,
            phienBan: kq.phienBan.baiDai,
          }
        : undefined,
    });

    return NextResponse.json({
      noiDung: kq.van,
      model: `${kq.provider}/${kq.model}`,
      daThuHong: kq.daThuHong,
      // "Muốn biết vì sao không?" — chỉ dữ kiện lá số và mạch suy luận. Không tên
      // tài liệu, không điểm liên quan — xem ghi chú ở components/CanCu.tsx.
      canCu: {
        duKien: kq.goi.duKien.map((f) => ({ id: f.id, noiDung: f.noiDung })),
        cachNoi: kq.coCauTruc?.cachNoi ?? null,
        luongNguoc: kq.coCauTruc
          ? [kq.coCauTruc.cauTruc, ...kq.coCauTruc.diemManh, ...kq.coCauTruc.choDeKet]
              .map((y) => y.luongNguoc)
              .filter((x): x is string => !!x)
          : [],
        mucChacChan: kq.coCauTruc
          ? [kq.coCauTruc.cauTruc, ...kq.coCauTruc.diemManh, ...kq.coCauTruc.choDeKet].map((y) => ({
              tieuDe: y.tieuDe,
              muc: y.mucChacChan ?? null,
            }))
          : [],
        chuDe: kq.goi.chuDe,
        cungLienQuan: kq.goi.cungLienQuan,
        phuongPhap: nhanPhuongPhap(),
        coNguon: kq.goi.bangChung.length > 0,
      },
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
