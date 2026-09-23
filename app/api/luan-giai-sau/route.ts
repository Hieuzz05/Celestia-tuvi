import { NextResponse } from 'next/server';
import { moDuoc, quyenHienTai } from '@/lib/support/entitlements';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { luanGiaiSau } from '@/lib/tuvi/luan-giai-sau';
import type { NgonNguDoc } from '@/lib/tuvi/quick-read-noi-dung';
import {
  PHIEN_BAN_BANG_LINH_VUC,
  sinhBangLinhVuc,
  type KhoiAi,
} from '@/lib/rag/bang-linh-vuc';
import { bamLaSo } from '@/lib/rag/nhat-ky';
import { layHoacSinh } from '@/lib/rag/noi-dung-ai';
import { thangAmHienTai } from '@/lib/tuvi/bay-gio';
import { khoaBangLinhVuc } from '@/lib/rag/phien-ban-chu';

/**
 * Bảng luận giải 8 lĩnh vực.
 *
 * Phần này chạy ở máy chủ chứ không dựng thẳng trong trình duyệt, dù engine là
 * hàm thuần. Lý do: đây là khả năng trả phí, mà "ẩn ở giao diện" không phải
 * phân quyền — dựng ở client thì mở devtools là đọc được hết.
 *
 * Người chưa mở quyền vẫn nhận được câu kết luận của từng khối để thấy bên
 * trong có gì; phần thân và căn cứ thì không gửi đi.
 *
 * ---------------------------------------------------------------------------
 * KHÁCH CHƯA ĐĂNG NHẬP CŨNG VÀO ĐƯỢC — từ 23/09/2026, theo quyết định của chủ
 * dự án: phần TỔNG QUAN mở cho mọi người, chỉ LUẬN GIẢI CHUYÊN SÂU mới cần tài
 * khoản (bản đọc sâu, bài dài, luận hạn chi tiết — các tuyến ấy vẫn giữ cổng).
 *
 * Mở cửa này KHÔNG tốn thêm một lượt gọi model nào, và đó là điều kiện để mở
 * được: khách mang quyền `anonymous`, mà `deepMap` của bậc ấy là false, nên
 * nhánh gọi model ở dưới không bao giờ chạy cho khách. Khách nhận đúng bản xem
 * trước tất định mà tài khoản miễn phí đang nhận. Ai sau này định cho khách
 * thấy bản do AI viết thì phải cân lại chuyện này trước — lúc ấy mỗi ngày sinh
 * gõ bừa là hai lượt gọi model, và không có tài khoản nào để đặt hạn mức.
 */
export const dynamic = 'force-dynamic';
// Tuyến này giờ có thể phải chờ model viết bài. Không đặt thì hàm bị cắt ở mức
// mặc định và người dùng nhận lỗi cho một thứ vẫn đang chạy bình thường.
export const maxDuration = 60;

const soHopLe = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;

export async function POST(req: Request) {
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
  const bai = luanGiaiSau(laSo, namXem, ngonNgu);

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
  let khoiRa = bai;
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
        /*
         * Khoá đệm PHẢI mang phiên bản prompt.
         *
         * Khoá cũ là (lá số, bề mặt, năm, ngôn ngữ) — không có chỗ nào nói bài
         * này được viết bằng bộ luật nào. Hệ quả: sửa prompt xong, người đã
         * sinh bài vẫn đọc bản cũ mãi mãi, và người sửa thì tưởng đã xong.
         *
         * Đúng thứ vừa xảy ra: cả loạt sửa cách viết hôm nay không tới được
         * người dùng nào đã mở trang trước đó. Đổi `PHIEN_BAN_BANG_LINH_VUC`
         * giờ tự làm mất hiệu lực bản cũ, không phải đi xoá bảng bằng tay.
         */
        khoaKy: khoaBangLinhVuc(namXem, PHIEN_BAN_BANG_LINH_VUC),
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
      /*
       * Model chỉ được đè CHỮ, không được đổi cấu trúc.
       *
       * Thứ tự phần và cách gom chặng do luật quyết — bốn chặng là một cung
       * đường kể chuyện, và ba phần trong chặng sắp theo độ nổi bật đã tính từ
       * lá số. Cho model sắp lại là để hai lần mở trang ra hai mục lục khác
       * nhau trên cùng một lá số.
       *
       * Phần nào model bỏ qua thì giữ nguyên bản tất định. Không bao giờ thiếu
       * phần: đủ mười hai là cam kết sản phẩm.
       */
      const theoId = new Map(ai.noiDung.map((x) => [x.id, x]));
      khoiRa = {
        ...bai,
        chang: bai.chang.map((c) => ({
          ...c,
          muc: c.muc.map((m) => {
            const x = theoId.get(m.id);
            return x
              ? { ...m, ketLuan: x.ketLuan, doan: x.doan, cauHoiSoi: x.cauHoiSoi, giuLai: x.giuLai }
              : m;
          }),
        })),
      };
    }
  }

  return NextResponse.json(
    {
      day,
      bai: day
        ? khoiRa
        : // Xem trước: chỉ câu kết luận, không thân bài, không căn cứ
          {
            ...bai,
            chang: bai.chang.map((c) => ({
              ...c,
              muc: c.muc.map((m) => ({ ...m, doan: [], canCu: [] })),
            })),
          },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
