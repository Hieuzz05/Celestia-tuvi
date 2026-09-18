import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { sinhDiemNoiBat, type DiemNoiBat } from '@/lib/rag/be-mat-ngan';
import { kyTheoNgay, layHoacSinh } from '@/lib/rag/noi-dung-ai';
import { bamLaSo } from '@/lib/rag/nhat-ky';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { namAmHienTai, thangAmHienTai } from '@/lib/tuvi/bay-gio';

/**
 * Điểm nổi bật của hôm nay — một thẻ, sinh một lần mỗi ngày cho mỗi lá số.
 *
 * "Mỗi ngày một điểm nổi bật riêng, trong ngày không đổi" là yêu cầu thẳng từ
 * chủ dự án, và nó cũng là điều đúng: một thẻ đổi chữ mỗi lần tải trang thì
 * người đọc không kịp tin nó, còn một thẻ không bao giờ đổi thì sau ba hôm
 * không ai nhìn nữa. Khoá đệm theo ngày dương lịch giải quyết cả hai.
 *
 * Model hỏng, hết hạn mức, hoặc bài không qua kiểm duyệt thì trả 204. Trang chủ
 * giữ nguyên thẻ tất định đang có — không có màn trắng, không có thông báo lỗi
 * cho một thứ người dùng không yêu cầu.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const soHopLe = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export async function POST(req: Request) {
  const cong = await canDangNhap('diem_noi_bat');
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

  const ngay = body.ngay as number;
  const thang = body.thang as number;
  const nam = body.nam as number;
  const gio = body.gio as number;
  const gioiTinh = body.gioiTinh as GioiTinh;
  const ngonNgu = body.ngonNgu === 'en' ? 'en' : 'vi';

  const laSo = lapLaSo({ ngay, thang, nam, gio, gioiTinh });

  const ra = await layHoacSinh<DiemNoiBat>(
    {
      chartHash: bamLaSo(ngay, thang, nam, gio, gioiTinh),
      beMat: 'diem-noi-bat',
      khoaKy: kyTheoNgay(),
      ngonNgu,
    },
    async () => {
      const kq = await sinhDiemNoiBat({
        laSo,
        namXem: namAmHienTai(),
        thangXem: thangAmHienTai(),
      });
      return kq ? { noiDung: kq.noiDung, provider: kq.provider, model: kq.model, phienBan: kq.phienBan } : null;
    }
  );

  // 204: không có gì để thay, giữ nguyên thứ đang hiện
  if (!ra) return new NextResponse(null, { status: 204 });

  return NextResponse.json({ ...ra.noiDung, tuDem: ra.tuDem });
}
