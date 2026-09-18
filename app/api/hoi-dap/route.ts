import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { canDangNhap } from '@/lib/auth/cong';
import { chotCauHoi, datChoCauHoi, hoanCauHoi } from '@/lib/support/quota';
import { quyenHienTai } from '@/lib/support/entitlements';
import { KhongCoModelError } from '@/lib/ai/fallback';
import type { TinNhan } from '@/lib/ai/prompt';
import { bamLaSo, ghiVetTraLoi } from '@/lib/rag/nhat-ky';
import { traLoiCoCanCu } from '@/lib/rag/tra-loi';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { thangAmHienTai } from '@/lib/tuvi/bay-gio';

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
  // Tháng ÂM, không phải tháng dương — xem lib/tuvi/bay-gio.ts
  const thangXem = soHopLe(body.thangXem, 1, 12) ? body.thangXem! : thangAmHienTai();

  const laSo = lapLaSo({
    ngay: body.ngay!,
    thang: body.thang!,
    nam: body.nam!,
    gio: body.gio!,
    gioiTinh: body.gioiTinh as GioiTinh,
    hoTen: typeof body.hoTen === 'string' ? body.hoTen.slice(0, 80) : undefined,
  });

  // Đặt chỗ NGAY TRƯỚC khi gọi model: câu thứ 6 không được phép chạm tới nhà
  // cung cấp. Kiểm ở React không tính là chặn — ai cũng gọi thẳng endpoint được.
  const requestId = randomUUID();
  const cho = await datChoCauHoi(requestId);
  if (!cho.duocPhep) return cho.chan!;

  try {
    const kq = await traLoiCoCanCu({
      laSo,
      cauHoi,
      namXem,
      thangXem,
      lichSu,
      requestId,
    });
    await chotCauHoi(requestId, `${kq.provider}/${kq.model}`);

    // Ghi vết sau khi đã chốt: nhật ký hỏng không được làm mất câu trả lời.
    await ghiVetTraLoi({
      requestId,
      chartHash: bamLaSo(body.ngay!, body.thang!, body.nam!, body.gio!, body.gioiTinh as string),
      cauHoi,
      runId: kq.runId,
      phienBan: kq.phienBan,
      provider: kq.provider,
      model: kq.model,
      doTreMs: kq.doTreMs.tong,
      kiemDuyet: kq.kiemDuyet ?? undefined,
    });

    /*
     * "Muốn biết vì sao không?" giờ CHỈ dành cho quản trị.
     *
     * Nó là công cụ đối soát: xem engine lấy dữ kiện nào, nối ra sao, mức chắc
     * chắn tới đâu. Với người dùng thường nó là nhiễu — và tệ hơn, dòng phương
     * pháp "celestia-nam-phai v2026.09.1" nằm cạnh các dữ kiện khiến người đọc
     * tưởng đó là tên một cuốn sách trong kho. Nó không phải: đó là phiên bản
     * bộ quy tắc AN SAO, ghi lại lá số được tính bằng luật nào.
     *
     * Chặn ở MÁY CHỦ chứ không ẩn ở giao diện: ẩn ở giao diện thì dữ liệu vẫn
     * nằm nguyên trong phản hồi, mở tab Network là đọc được.
     */
    const laQuanTri = (await quyenHienTai()).tier === 'admin';

    return NextResponse.json({
      traLoi: kq.van,
      model: `${kq.provider}/${kq.model}`,
      canCu: !laQuanTri ? undefined : {
        duKien: kq.goi.duKien.map((f) => ({ id: f.id, noiDung: f.noiDung })),
        cachNoi: kq.coCauTruc?.cachNoi ?? null,
        luongNguoc: (kq.coCauTruc?.yChinh ?? [])
          .map((y) => y.luongNguoc)
          .filter((x): x is string => !!x),
        mucChacChan: (kq.coCauTruc?.yChinh ?? []).map((y) => ({
          tieuDe: y.tieuDe,
          muc: y.mucChacChan ?? null,
        })),
        chuDe: kq.goi.chuDe,
        cungLienQuan: kq.goi.cungLienQuan,
        phuongPhap: `${kq.phienBan.engine} v${kq.phienBan.phuongPhap}`,
        coNguon: kq.goi.bangChung.length > 0,
      },
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
