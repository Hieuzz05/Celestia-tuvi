import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { sinhMocHanhTrinh, type LoaiMoc, type MocChoSinh } from '@/lib/rag/moc-hanh-trinh';
import { bamLaSo } from '@/lib/rag/nhat-ky';
import { layHoacSinh } from '@/lib/rag/noi-dung-ai';
import { lapLaSo, type Cung, type GioiTinh } from '@/lib/tuvi/ansao';
import { thangAmHienTai } from '@/lib/tuvi/bay-gio';
import { CHI, CHINH_TINH } from '@/lib/tuvi/constants';
import { cacGiaiDoan, cacNam, cacThang, type MocHanhTrinh } from '@/lib/tuvi/hanh-trinh';
import { KHUON, type NgonNguDoc } from '@/lib/tuvi/quick-read-noi-dung';
import { kyCoPhienBan } from '@/lib/rag/phien-ban-chu';

/**
 * Chữ cho các mốc trên dòng thời gian, sinh theo NHÓM chứ không theo từng mốc.
 *
 * Danh sách mốc dựng ở phía máy chủ từ chính engine an sao, không nhận từ trình
 * duyệt. Nhận từ trình duyệt thì ai cũng bơm được một danh sách bịa vào và bắt
 * model viết về những cung không có trong lá số.
 *
 * Khoá đệm theo từng nhóm: lật cửa sổ năm hay đổi năm đang chọn chỉ tốn thêm
 * đúng một lượt cho nhóm mới, không sinh lại cả dòng thời gian.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const soHopLe = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

/** Chính tinh kèm độ sáng, để model biết mốc này nặng hay nhẹ */
function taSao(cung: Cung, k: (typeof KHUON)['vi']): string {
  return cung.sao
    .filter((s) => (CHINH_TINH as readonly string[]).includes(s.ten))
    .slice(0, 2)
    .map((s) => (s.doSang ? `${s.ten} (${k.doSang[s.doSang] ?? s.doSang})` : s.ten))
    .join(', ');
}

function taVong(cung: Cung): string {
  return [cung.coTuan ? 'Tuần' : null, cung.coTriet ? 'Triệt' : null].filter(Boolean).join(' + ');
}

function doiSangChoSinh(ds: MocHanhTrinh[], k: (typeof KHUON)['vi']): MocChoSinh[] {
  return ds.map((m) => ({
    id: m.id,
    nhan: m.nhan,
    tenCung: m.cung.tenCung,
    chi: CHI[m.cung.chiIndex],
    sao: taSao(m.cung, k),
    vong: taVong(m.cung),
  }));
}

export async function POST(req: Request) {
  const cong = await canDangNhap('moc_hanh_trinh');
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
  if (!soHopLe(body.namXem, 1900, 2100)) {
    return NextResponse.json({ loi: 'Năm xem không hợp lệ' }, { status: 400 });
  }

  const loai: LoaiMoc =
    body.loai === 'giai-doan' || body.loai === 'nam' || body.loai === 'thang'
      ? body.loai
      : 'giai-doan';
  const ngonNgu: NgonNguDoc = body.ngonNgu === 'en' ? 'en' : 'vi';
  const namXem = body.namXem as number;
  const k = KHUON[ngonNgu];

  const laSo = lapLaSo({
    ngay: body.ngay as number,
    thang: body.thang as number,
    nam: body.nam as number,
    gio: body.gio as number,
    gioiTinh: body.gioiTinh as GioiTinh,
  });

  const danhSach =
    loai === 'giai-doan'
      ? cacGiaiDoan(laSo, namXem, ngonNgu)
      : loai === 'nam'
        ? cacNam(laSo, namXem, namXem, ngonNgu)
        : cacThang(laSo, namXem, null, ngonNgu);

  /*
   * Khoá kỳ theo đúng nhóm.
   *
   * Giai đoạn không phụ thuộc năm đang xem — các quãng mười năm của một lá số là
   * cố định cả đời — nên khoá là 'tat-ca' và sinh đúng một lần cho mỗi lá số.
   */
  const khoaKy = kyCoPhienBan(
    loai === 'giai-doan'
      ? 'tat-ca'
      : loai === 'nam'
        ? `cua-so:${danhSach[0]?.nhan ?? namXem}-${danhSach[danhSach.length - 1]?.nhan ?? namXem}`
        : `nam:${namXem}`
  );

  const beMat = loai === 'giai-doan' ? 'moc-giai-doan' : loai === 'nam' ? 'moc-nam' : 'moc-thang';

  const ra = await layHoacSinh<Record<string, string>>(
    {
      chartHash: bamLaSo(
        body.ngay as number,
        body.thang as number,
        body.nam as number,
        body.gio as number,
        body.gioiTinh as GioiTinh
      ),
      beMat,
      khoaKy,
      ngonNgu,
    },
    async () => {
      const kq = await sinhMocHanhTrinh({
        laSo,
        loai,
        moc: doiSangChoSinh(danhSach, k),
        namXem,
        thangXem: thangAmHienTai(),
      });
      return kq
        ? { noiDung: kq.noiDung, provider: kq.provider, model: kq.model, phienBan: kq.phienBan }
        : null;
    }
  );

  if (!ra) return new NextResponse(null, { status: 204 });

  return NextResponse.json({ moc: ra.noiDung, tuDem: ra.tuDem });
}
