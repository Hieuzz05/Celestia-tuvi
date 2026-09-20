import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { canDangNhap } from '@/lib/auth/cong';
import { KhongCoModelError } from '@/lib/ai/fallback';
import { dungChang, PHIEN_BAN_BAN_DOC_SAU } from '@/lib/rag/ban-doc-sau';
import { layHoacSinh } from '@/lib/rag/noi-dung-ai';
import { bamLaSo } from '@/lib/rag/nhat-ky';
import { THU_TU_CHANG, type ChangId } from '@/lib/tuvi/chang-cung';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { thangAmHienTai } from '@/lib/tuvi/bay-gio';
import {
  chotBaiSau,
  datChoBaiSau,
  hoanBaiSau,
  type NguonBaiSau,
} from '@/lib/support/quota-bai-sau';

export const maxDuration = 60;

/**
 * Bản đọc sâu — MỘT CHẶNG mỗi lượt gọi.
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO KHÔNG PHẢI SSE NHƯ SPEC VIẾT
 *
 * Spec mục 9 đòi `POST /api/luan-giai` phát SSE theo chặng. SSE không cứu được
 * ràng buộc thật ở đây: `maxDuration` trên Vercel là 60 giây và nó giết hàm bất
 * kể hàm ấy đang phát dở hay không.
 *
 * Đo được trên lá số thật: cả bài mất 153 giây — chặng 1 xong ở giây 42, rồi
 * ba chặng còn lại không bao giờ tới được người đọc.
 *
 * Chia theo lượt gọi thì mỗi lượt khoảng 40 giây, nằm gọn trong trần, và người
 * dùng nhận đúng trải nghiệm spec mô tả: đọc chặng một trong khi chặng hai
 * đang viết. Khác cách làm, giống kết quả — và là cách duy nhất chạy được trên
 * hạ tầng đang có.
 *
 * Mỗi chặng đệm riêng, nên mở lại bài là tức thì và ra đúng chữ cũ.
 */

/** Ném từ trong `layHoacSinh` để phân biệt hết lượt với hỏng thật */
class LoiHetLuot extends Error {}

interface Body {
  ngay?: number;
  thang?: number;
  nam?: number;
  gio?: number;
  gioiTinh?: string;
  namXem?: number;
  chang?: string;
}

export async function POST(req: Request) {
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
    return NextResponse.json({ loi: 'Thông tin ngày sinh không hợp lệ' }, { status: 400 });
  }

  const chang = body.chang as ChangId;
  if (!THU_TU_CHANG.includes(chang)) {
    return NextResponse.json({ loi: 'Chặng không hợp lệ' }, { status: 400 });
  }

  const namXem = soHopLe(body.namXem, 1900, 2100)
    ? (body.namXem as number)
    : new Date().getFullYear();

  const laSo = lapLaSo({
    ngay: ngay!,
    thang: thang!,
    nam: nam!,
    gio: gio!,
    gioiTinh: gioiTinh as GioiTinh,
  });

  const khoa = {
    chartHash: bamLaSo(ngay!, thang!, nam!, gio!, gioiTinh),
    beMat: 'ban-doc-sau' as const,
    khoaKy: `nam:${namXem}|chang:${chang}|v:${PHIEN_BAN_BAN_DOC_SAU}`,
    ngonNgu: 'vi',
  };

  /*
   * Hạn mức tính MỘT LẦN cho cả bài, ở chặng đầu.
   *
   * Tính từng chặng thì một bài ngốn bốn lượt, người dùng hết quota giữa chừng
   * và đứng lại ở nửa bài — tệ hơn hẳn việc không cho đọc từ đầu.
   *
   * Và chỉ tính khi CHƯA CÓ TRONG ĐỆM: mở lại bài cũ không phải đọc bài mới.
   * `layHoacSinh` chỉ gọi hàm sinh khi đệm trống, nên đặt phép trừ vào trong
   * hàm ấy là tự nó có đúng ngữ nghĩa này.
   */
  const laChangDau = chang === THU_TU_CHANG[0];
  const requestId = randomUUID();
  let nguonDaTru: NguonBaiSau | undefined;

  try {
    const ra = await layHoacSinh(khoa, async () => {
      if (laChangDau) {
        const datCho = await datChoBaiSau(requestId);
        if (!datCho.duocPhep) throw new LoiHetLuot();
        nguonDaTru = datCho.nguon;
      }
      const c = await dungChang({ laSo, chang, namXem, thangXem: thangAmHienTai() });
      return c ? { noiDung: c, phienBan: { banDocSau: PHIEN_BAN_BAN_DOC_SAU } } : null;
    });

    if (!ra) {
      await hoanBaiSau(nguonDaTru, requestId);
      return NextResponse.json(
        { loi: 'Celes chưa viết được chặng này. Bạn thử lại giúp — lượt hôm nay chưa bị trừ.' },
        { status: 502 }
      );
    }

    if (nguonDaTru) await chotBaiSau(requestId);

    const i = THU_TU_CHANG.indexOf(chang);
    return NextResponse.json({
      chang: ra.noiDung,
      tuDem: ra.tuDem,
      // Giao diện dùng cái này để biết còn phải gọi tiếp chặng nào
      changTiep: THU_TU_CHANG[i + 1] ?? null,
      tongSoChang: THU_TU_CHANG.length,
    });
  } catch (e) {
    if (e instanceof LoiHetLuot) {
      return NextResponse.json(
        {
          loi: 'Hôm nay bạn đã dùng hết lượt đọc sâu miễn phí. Ủng hộ Celes để mở thêm.',
          canUngHo: true,
          lyDo: 'long_report',
        },
        { status: 429 }
      );
    }
    await hoanBaiSau(nguonDaTru, requestId);
    if (e instanceof KhongCoModelError) {
      return NextResponse.json({ loi: e.message, chuaCauHinh: true }, { status: 503 });
    }
    return NextResponse.json(
      { loi: e instanceof Error ? e.message : 'Lỗi không xác định' },
      { status: 502 }
    );
  }
}
