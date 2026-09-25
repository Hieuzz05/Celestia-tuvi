import { NextResponse } from 'next/server';
import { canDangNhap } from '@/lib/auth/cong';
import { KhongCoModelError } from '@/lib/ai/fallback';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import { docNoiDung, docNoiDungMoiNhat, luuNoiDung } from '@/lib/rag/noi-dung-ai';
import { bamLaSo } from '@/lib/rag/nhat-ky';
import { CAU_HOI_V3, luanNhieuCau, PHIEN_BAN_V3, type KetQuaCauV3 } from '@/lib/rag/v3';

export const maxDuration = 60;

/**
 * Thế hệ đệm. TĂNG BẰNG TAY chỉ khi muốn MỌI lá số sinh lại (bài cũ thành sai,
 * không chỉ là "viết hay hơn được"). Sửa prompt thường ngày KHÔNG tăng số này —
 * bài mới chỉ áp cho lá số chưa có bài.
 *
 * Lịch sử: 1 → 2 (25/09/2026) — chủ dự án duyệt "chạy lại với các lá cũ" để mọi
 * lá số được viết theo bản C (luận sâu hơn, prompt 2026.09.6). Câu nào sinh lại
 * hỏng thì tạm trả bài của thế hệ trước (xem `baiTheHeTruoc`), không để trống.
 */
const THE_HE_DEM: number = 2;

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
  /** Chỉ lấy / chỉ sinh các câu này trong nhóm — để trang chia một nhóm thành vài lượt song song */
  chi?: string[];
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
  /*
   * `chi`: trang tổng quan gọi HAI lượt song song — ba câu cho ba thẻ đầu, tám
   * câu còn lại. Sinh 11 câu một lượt thì người đọc chờ câu CHẬM NHẤT trong 11
   * (đo 24/09/2026: 35–48 giây lần đầu); tách ra thì ba thẻ đầu chỉ chờ câu chậm
   * nhất trong ba. Hai lượt KHÔNG chồng câu nào, nên không tốn thêm lượt gọi.
   */
  const phamVi = Array.isArray(body.chi) ? ids.filter((id) => body.chi!.includes(id)) : ids;
  if (!phamVi.length) return NextResponse.json({ loi: 'Không có câu nào khớp' }, { status: 400 });

  const namXem = soHopLe(body.namXem, 1900, 2100) ? (body.namXem as number) : new Date().getFullYear();
  const laSo = lapLaSo({ ngay: ngay!, thang: thang!, nam: nam!, gio: gio!, gioiTinh: gioiTinh as GioiTinh });
  /*
   * ĐỆM: MỖI LÁ SỐ + NĂM XEM + NHÓM CHỈ SINH MỘT LẦN (chủ dự án chốt 24/09/2026).
   *
   * Bản trước khoá theo phiên bản của MỌI thứ (prompt, dữ kiện, RAG, chuẩn ngôn
   * ngữ, planner, validator, phương pháp). Mỗi lần deploy một chỉnh sửa nhỏ là
   * khoá đổi và mọi lá số sinh lại — đo trong bảng: cùng lá số, chủ đề "Tính
   * cách" sinh ba lần trong tám tiếng. Người đọc thấy "lần nào vào cũng gen lại".
   *
   * Giờ khoá chỉ còn lá số + năm + nhóm. Muốn chủ động làm mới toàn bộ (một thay
   * đổi đủ lớn để bài cũ thành sai) thì tăng THE_HE_DEM bằng tay.
   *
   * Câu nào lần trước chưa viết được (hết giờ) thì lần sau chỉ sinh ĐÚNG câu đó
   * rồi ghép vào — không sinh lại cả nhóm.
   */
  const khoaGoc = `nam:${namXem}|nhom:${nhom}`;
  const khoa = {
    chartHash: bamLaSo(ngay!, thang!, nam!, gio!, gioiTinh),
    beMat: 'luan-giai-v3' as const,
    khoaKy: THE_HE_DEM === 1 ? khoaGoc : `${khoaGoc}|th:${THE_HE_DEM}`,
    ngonNgu: 'vi',
  };

  try {
    let cu = await docNoiDung<CauTraRaV3[]>(khoa);
    let chuyenKhoa = false;
    if (!cu && THE_HE_DEM === 1) {
      // Bài đã sinh dưới khoá kiểu cũ ("…|s:<phiên bản>|v:<băm>") — dùng lại bản mới nhất
      cu = await docNoiDungMoiNhat<CauTraRaV3[]>(khoa, `${khoaGoc}|s:`);
      chuyenKhoa = Boolean(cu);
    }

    const daCo = new Map((cu?.noiDung ?? []).filter((c) => !c.chuaViet).map((c) => [c.id, c]));
    const thieu = phamVi.filter((id) => !daCo.has(id));

    if (!thieu.length) {
      // Chuyển bài cũ sang khoá mới để lần sau đọc thẳng, không phải dò tiền tố
      if (chuyenKhoa) {
        await luuNoiDung(khoa, cu!.noiDung, { provider: cu!.provider ?? undefined, model: cu!.model ?? undefined });
      }
      return NextResponse.json({ nhom, cau: phamVi.map((id) => daCo.get(id)!), tuDem: true });
    }

    const kq = await luanNhieuCau({ laSo, ids: thieu, namXem, songSong: thieu.length, hanChot });
    /*
     * Đọc lại bản MỚI NHẤT trước khi ghi: lượt song song kia có thể đã cất phần
     * của nó trong lúc lượt này đang viết. Ghi đè bằng bản đọc lúc đầu là xoá
     * mất bài của lượt kia.
     */
    const moiNhat = await docNoiDung<CauTraRaV3[]>(khoa);
    for (const c of moiNhat?.noiDung ?? []) if (!c.chuaViet && !daCo.has(c.id)) daCo.set(c.id, c);
    for (const k of kq) {
      if (!k.luanGiai) continue;
      daCo.set(k.id, { id: k.id, cauHoi: k.cauHoi, luanGiai: k.luanGiai, viSao: k.viSao, doRo: k.doRo, chuaViet: false });
    }
    const cau: CauTraRaV3[] = ids.map(
      (id) =>
        daCo.get(id) ?? {
          id,
          cauHoi: CAU_HOI_V3.find((q) => q.id === id)?.cauHoi ?? '',
          luanGiai: '',
          viSao: '',
          doRo: 'Gợi ý',
          chuaViet: true,
        }
    );
    let cauTra = cau.filter((c) => phamVi.includes(c.id));
    /*
     * Câu nào sinh lại hỏng thì tạm lấy bài của thế hệ đệm trước để hiện — người
     * đọc từng có bài ở đây, không được thấy chỗ trống chỉ vì mình vừa làm mới.
     * Bài cũ CHỈ đi vào câu trả lời, không ghi vào khoá mới: lần sau còn thử lại.
     */
    if (THE_HE_DEM > 1 && cauTra.some((c) => c.chuaViet)) {
      const truoc = await baiTheHeTruoc(khoa, khoaGoc);
      if (truoc.size) cauTra = cauTra.map((c) => (c.chuaViet ? truoc.get(c.id) ?? c : c));
    }
    // Không câu nào trong phần được hỏi viết được thì không đệm — lần sau thử lại được ngay
    if (cau.filter((c) => phamVi.includes(c.id)).every((c) => c.chuaViet)) {
      if (cauTra.some((c) => !c.chuaViet)) return NextResponse.json({ nhom, cau: cauTra, tuDem: true });
      return NextResponse.json({ loi: 'Celes chưa viết được phần này. Bạn thử lại giúp.' }, { status: 502 });
    }
    const mot = kq.find((k) => k.model);
    const [provider, model] = (mot?.model ?? '/').split('/');
    await luuNoiDung(khoa, cau, { provider, model, phienBan: PHIEN_BAN_V3 });
    return NextResponse.json({ nhom, cau: cauTra, tuDem: false });
  } catch (e) {
    if (e instanceof KhongCoModelError) {
      return NextResponse.json({ loi: e.message, chuaCauHinh: true }, { status: 503 });
    }
    return NextResponse.json({ loi: e instanceof Error ? e.message : 'Lỗi không xác định' }, { status: 502 });
  }
}

/** Bài đã viết được ở thế hệ đệm liền trước — đường lùi khi sinh lại hỏng */
async function baiTheHeTruoc(
  hienTai: Parameters<typeof docNoiDung>[0],
  khoaGoc: string
): Promise<Map<string, CauTraRaV3>> {
  try {
    const khoaKy = THE_HE_DEM === 2 ? khoaGoc : `${khoaGoc}|th:${THE_HE_DEM - 1}`;
    const cu = await docNoiDung<CauTraRaV3[]>({ ...hienTai, khoaKy });
    return new Map((cu?.noiDung ?? []).filter((c) => !c.chuaViet).map((c) => [c.id, c]));
  } catch {
    return new Map();
  }
}
