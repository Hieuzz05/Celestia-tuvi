import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { moDuoc, quyenHienTai } from '@/lib/support/entitlements';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { luanGiaiSau } from '@/lib/tuvi/luan-giai-sau';
import type { NgonNguDoc } from '@/lib/tuvi/quick-read-noi-dung';
import { sinhBangLinhVuc, type KhoiAi } from '@/lib/rag/bang-linh-vuc';
import { bamLaSo } from '@/lib/rag/nhat-ky';
import { layHoacSinh } from '@/lib/rag/noi-dung-ai';
import { thangAmHienTai } from '@/lib/tuvi/bay-gio';

/**
 * Bảng luận giải 8 lĩnh vực.
 *
 * Phần này chạy ở máy chủ chứ không dựng thẳng trong trình duyệt, dù engine là
 * hàm thuần. Lý do: đây là khả năng trả phí, mà "ẩn ở giao diện" không phải
 * phân quyền — dựng ở client thì mở devtools là đọc được hết.
 *
 * Người chưa mở quyền vẫn nhận được câu kết luận của từng khối để thấy bên
 * trong có gì; phần thân và căn cứ thì không gửi đi.
 */
export const dynamic = 'force-dynamic';
// Tuyến này giờ có thể phải chờ model viết bài. Không đặt thì hàm bị cắt ở mức
// mặc định và người dùng nhận lỗi cho một thứ vẫn đang chạy bình thường.
export const maxDuration = 60;

const soHopLe = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export async function POST(req: Request) {
  const cong = await canDangNhap('deep_map');
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

  const laSo = lapLaSo({
    ngay: body.ngay as number,
    thang: body.thang as number,
    nam: body.nam as number,
    gio: body.gio as number,
    gioiTinh: body.gioiTinh as GioiTinh,
    hoTen: typeof body.hoTen === 'string' ? body.hoTen.slice(0, 80) : undefined,
  });

  const namXem = soHopLe(body.namXem, 1900, 2100)
    ? (body.namXem as number)
    : new Date().getFullYear();
  const ngonNgu: NgonNguDoc = body.ngonNgu === 'en' ? 'en' : 'vi';

  const quyen = await quyenHienTai();
  const day = moDuoc(quyen, 'deepMap');
  const khoi = luanGiaiSau(laSo, namXem, ngonNgu);

  /*
   * Phần chữ do model viết, phần chứng minh vẫn do luật dựng.
   *
   * `canCu` — cái mở ra khi bấm "Muốn biết vì sao không?" — KHÔNG lấy từ model.
   * Nó phải truy ngược được về cung và sao, mà thứ model nói thì không bảo đảm
   * điều đó. Model viết nhận định; luật giữ phần chứng minh. Tiêu đề và câu hỏi
   * gợi ý cũng giữ nguyên vì chúng là nhãn điều hướng, không phải luận giải.
   *
   * Khoá đệm theo NĂM: lớp hạn của năm có tham gia vào bài, nên sang năm là bài
   * khác; trong năm thì mở lại ra đúng bài cũ.
   */
  let khoiRa = khoi;
  if (day) {
    const ai = await layHoacSinh<KhoiAi[]>(
      {
        chartHash: bamLaSo(
          body.ngay as number,
          body.thang as number,
          body.nam as number,
          body.gio as number,
          body.gioiTinh as GioiTinh
        ),
        beMat: 'bang-linh-vuc',
        khoaKy: `nam:${namXem}`,
        ngonNgu,
      },
      async () => {
        const kq = await sinhBangLinhVuc({ laSo, namXem, thangXem: thangAmHienTai() });
        return kq
          ? { noiDung: kq.noiDung, provider: kq.provider, model: kq.model, phienBan: kq.phienBan }
          : null;
      }
    );

    if (ai?.noiDung?.length) {
      const theoId = new Map(ai.noiDung.map((x) => [x.id, x]));
      // Thứ tự lấy theo model: §11.2 cho phép lĩnh vực nổi bật đứng trước. Khối
      // nào model bỏ qua thì giữ bản tất định và xếp xuống cuối.
      const coAi = ai.noiDung
        .map((x) => {
          const goc = khoi.find((k) => k.id === x.id);
          return goc ? { ...goc, ketLuan: x.ketLuan, doan: x.doan } : null;
        })
        .filter((x): x is (typeof khoi)[number] => x !== null);
      const conLai = khoi.filter((k) => !theoId.has(k.id));
      khoiRa = [...coAi, ...conLai];
    }
  }

  return NextResponse.json(
    {
      day,
      khoi: day
        ? khoiRa
        : // Xem trước: chỉ câu kết luận, không thân bài, không căn cứ
          khoi.map((k) => ({ ...k, doan: [], canCu: [] })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
