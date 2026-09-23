import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { KhongCoModelError } from '@/lib/ai/fallback';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { layHoacSinh } from '@/lib/rag/noi-dung-ai';
import { bamLaSo } from '@/lib/rag/nhat-ky';
import { kyCoPhienBan } from '@/lib/rag/phien-ban-chu';
import { CAU_HOI_V3, luanNhieuCau, PHIEN_BAN_V3, type KetQuaCauV3 } from '@/lib/rag/v3';

export const maxDuration = 60;

/**
 * Luận giải v3 — MỘT NHÓM câu hỏi mỗi lượt gọi: "tong-quan" (11 câu) hoặc một
 * chủ đề chuyên sâu ("su-nghiep", "tien-bac"…). Các câu trong nhóm chạy song
 * song, mỗi câu độc lập, nên hết giờ chỉ mất đúng câu ấy.
 *
 * Route này gọi ĐÚNG hàm `luanNhieuCau` mà `scripts/test-luan-giai-v3.ts` đo —
 * không có nhánh riêng cho sản phẩm. Đó là điều kiện để con số đo được ở bộ
 * thử là con số người dùng nhận.
 *
 * QUYỀN — chủ dự án chốt 23/09/2026:
 *   - Tổng quan mở cho cả khách chưa đăng nhập (kể cả khi phải gọi model).
 *   - Chuyên sâu cần đăng nhập.
 *   - KHÔNG trừ hạn mức ở cả hai. Bài đã đệm theo lá số + năm + nhóm, nên mở
 *     lại không tốn thêm lượt gọi nào.
 */

interface Body {
  ngay?: number;
  thang?: number;
  nam?: number;
  gio?: number;
  gioiTinh?: string;
  namXem?: number;
  nhom?: string;
}

export interface CauTraRaV3 {
  id: string;
  cauHoi: string;
  luanGiai: string;
  viSao: string;
  doRo: KetQuaCauV3['doRo'];
  /** Câu nào Celes chưa viết được thì nói thẳng, không bịa cho đủ */
  chuaViet: boolean;
}

export async function POST(req: Request) {
  // Trần 60 giây của Vercel, chừa 8 giây cho đệm và trả lời
  const hanChot = Date.now() + 52_000;
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

  const nhom = body.nhom ?? 'tong-quan';
  if (nhom !== 'tong-quan') {
    const cong = await canDangNhap('deep_read');
    if (!cong.duocPhep) return cong.chan!;
  }
  const ids = CAU_HOI_V3.filter((q) =>
    nhom === 'tong-quan' ? q.loai === 'tong-quan' : q.loai === 'chuyen-sau' && q.chuDe === nhom
  ).map((q) => q.id);
  if (!ids.length) return NextResponse.json({ loi: 'Nhóm câu hỏi không hợp lệ' }, { status: 400 });

  const namXem = soHopLe(body.namXem, 1900, 2100) ? (body.namXem as number) : new Date().getFullYear();
  const laSo = lapLaSo({ ngay: ngay!, thang: thang!, nam: nam!, gio: gio!, gioiTinh: gioiTinh as GioiTinh });
  const phienBan = Object.values(PHIEN_BAN_V3).join('.');

  try {
    const ra = await layHoacSinh(
      {
        chartHash: bamLaSo(ngay!, thang!, nam!, gio!, gioiTinh),
        beMat: 'luan-giai-v3',
        khoaKy: kyCoPhienBan(`nam:${namXem}|nhom:${nhom}|s:${phienBan}`),
        ngonNgu: 'vi',
      },
      async () => {
        const kq = await luanNhieuCau({ laSo, ids, namXem, songSong: ids.length, hanChot });
        const cau: CauTraRaV3[] = kq.map((k) => ({
          id: k.id,
          cauHoi: k.cauHoi,
          luanGiai: k.luanGiai,
          viSao: k.viSao,
          doRo: k.doRo,
          chuaViet: !k.luanGiai,
        }));
        // Không câu nào viết được thì không đệm — lần sau thử lại được ngay
        if (cau.every((c) => c.chuaViet)) return null;
        const mot = kq.find((k) => k.model);
        const [provider, model] = (mot?.model ?? '/').split('/');
        return { noiDung: cau, provider, model, phienBan: PHIEN_BAN_V3 };
      }
    );
    if (!ra) {
      return NextResponse.json({ loi: 'Celes chưa viết được phần này. Bạn thử lại giúp.' }, { status: 502 });
    }
    return NextResponse.json({ nhom, cau: ra.noiDung, tuDem: ra.tuDem });
  } catch (e) {
    if (e instanceof KhongCoModelError) {
      return NextResponse.json({ loi: e.message, chuaCauHinh: true }, { status: 503 });
    }
    return NextResponse.json({ loi: e instanceof Error ? e.message : 'Lỗi không xác định' }, { status: 502 });
  }
}
