import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { sinhNhipHanhTrinh, type NhipHanhTrinh } from '@/lib/rag/be-mat-ngan';
import { bamLaSo } from '@/lib/rag/nhat-ky';
import { layHoacSinh } from '@/lib/rag/noi-dung-ai';
import { cungDaiVan, lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { tuoiAmTaiNam } from '@/lib/tuvi/hanh-trinh';
import { luanHan, type CapLuanHan } from '@/lib/tuvi/luan-han';
import type { NgonNguDoc } from '@/lib/tuvi/quick-read-noi-dung';

/**
 * "Điều đang chuyển động" — phần chữ của Hành trình, do model viết.
 *
 * Nhịp hành động (Tiến / Giữ / Rà soát / Thu hẹp) KHÔNG do model chọn. Nó đếm
 * được từ tương quan cát/hung sau khi trừ Tuần/Triệt, nên để luật quyết và đưa
 * xuống cho model như một ràng buộc. Model chỉ viết ba chuyển động quanh nó.
 * Để model tự chọn nhịp là mở đường cho hai lần đọc ra hai kết luận trái nhau
 * trên cùng một lá số.
 *
 * Khoá đệm đổi theo đúng cấp đang xem, nên "Điều đang chuyển động" của trang
 * chính tự nhảy sang bài mới khi sang tháng âm lịch kế tiếp, còn trong tháng thì
 * mở bao nhiêu lần cũng ra đúng bài đó.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const soHopLe = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export async function POST(req: Request) {
  const cong = await canDangNhap('nhip_hanh_trinh');
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
  if (!soHopLe(body.namXem, 1900, 2100) || !soHopLe(body.thangXem, 1, 12)) {
    return NextResponse.json({ loi: 'Thời điểm xem không hợp lệ' }, { status: 400 });
  }

  const ngay = body.ngay as number;
  const thang = body.thang as number;
  const nam = body.nam as number;
  const gio = body.gio as number;
  const gioiTinh = body.gioiTinh as GioiTinh;
  const namXem = body.namXem as number;
  const thangXem = body.thangXem as number;
  const ngonNgu: NgonNguDoc = body.ngonNgu === 'en' ? 'en' : 'vi';
  const cap: CapLuanHan =
    body.cap === 'giai-doan' || body.cap === 'thang' ? body.cap : 'nam';

  const laSo = lapLaSo({ ngay, thang, nam, gio, gioiTinh });

  // Nhịp lấy từ engine tất định rồi mới đưa xuống model
  const bai = luanHan(laSo, cap, namXem, thangXem, ngonNgu);

  /*
   * Khoá kỳ theo đúng thứ đang xem.
   *
   * Một quãng dài kéo mười năm nên khoá theo khoảng tuổi, không theo năm: bấm
   * năm nào trong quãng cũng phải ra đúng bài của quãng ấy, bằng không mười năm
   * là mười bài nói về cùng một thứ.
   */
  const giaiDoan = cungDaiVan(laSo, tuoiAmTaiNam(laSo, namXem));
  const khoaKy =
    cap === 'giai-doan'
      ? `giai-doan:${giaiDoan?.daiVan?.tuTuoi ?? '?'}-${giaiDoan?.daiVan?.denTuoi ?? '?'}`
      : cap === 'nam'
        ? `nam:${namXem}`
        : `thang:${namXem}-${String(thangXem).padStart(2, '0')}`;

  const ra = await layHoacSinh<NhipHanhTrinh>(
    { chartHash: bamLaSo(ngay, thang, nam, gio, gioiTinh), beMat: 'nhip-hien-tai', khoaKy, ngonNgu },
    async () => {
      const kq = await sinhNhipHanhTrinh({
        laSo,
        cap,
        namXem,
        thangXem,
        nhip: bai.nhip.nhan,
      });
      return kq ? { noiDung: kq.noiDung, provider: kq.provider, model: kq.model, phienBan: kq.phienBan } : null;
    }
  );

  if (!ra) return new NextResponse(null, { status: 204 });

  return NextResponse.json({ ...ra.noiDung, nhip: bai.nhip, tuDem: ra.tuDem });
}
