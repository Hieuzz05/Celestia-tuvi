/**
 * Xử lý MỘT lượt gọi luận giải v3 — toàn bộ phần thân của app/api/luan-giai-v3/route.ts
 * (tách ra 30/09/2026). Route và scripts/test-luan-giai-v3.ts gọi ĐÚNG hàm này, chỉ khác
 * MÔI TRƯỜNG truyền vào:
 *
 *   - route: đệm là bảng noi_dung_ai, cổng đăng nhập và hạn mức khách thật;
 *   - script: đệm trong bộ nhớ (không ghi database), cổng mở, không phải khách.
 *
 * Kho tri thức, thư viện nghề, sổ ý, tóm lại, bức tranh lớn, hạn chót 52 giây, đường lùi
 * thế hệ trước: chung một mã. Sửa logic ở đây là sửa cả hai — đừng chép nhánh riêng vào
 * route hay script, bộ thử sẽ đo một thứ khác thứ người dùng nhận.
 */
import { KhongCoModelError } from '@/lib/ai/fallback';
import { lapLaSo, type GioiTinh } from '@/lib/tuvi/ansao';
import type { BanGhiNoiDung } from '@/lib/rag/noi-dung-ai';
import { dungSoY } from '@/lib/rag/v3/so-y';
import { viTomLai } from '@/lib/rag/v3/tom-lai';
import { SO_CHU_DE_TOI_THIEU, viBucTranh } from '@/lib/rag/v3/buc-tranh';
import { bamLaSo, veGioLaSo } from '@/lib/rag/nhat-ky';
import type { MucThuVien } from '@/lib/rag/thu-vien/kieu';
import { CAU_HOI_V3, luanNhieuCau, PHIEN_BAN_V3, type KetQuaCauV3 } from '@/lib/rag/v3';
import { laNgayDuongCoThat } from '@/lib/tuvi/kiem-ngay';
import { khoaBoiCanh, khoiBoiCanh, lamSachBoiCanh } from '@/lib/rag/v3/boi-canh-doc';

/**
 * Thế hệ đệm. TĂNG BẰNG TAY chỉ khi muốn MỌI lá số sinh lại (bài cũ thành sai,
 * không chỉ là "viết hay hơn được"). Sửa prompt thường ngày KHÔNG tăng số này —
 * bài mới chỉ áp cho lá số chưa có bài.
 *
 * Lịch sử: 1 → 2 (25/09/2026) — chủ dự án duyệt "chạy lại với các lá cũ" để mọi
 * lá số được viết theo bản C (luận sâu hơn, prompt 2026.09.6). Câu nào sinh lại
 * hỏng thì tạm trả bài của thế hệ trước (xem `baiTheHeTruoc`), không để trống.
 * 2 → 3 (25/09/2026) — chống lặp giữa các phần (sổ ý so-y.ts + phân quyền dữ kiện); chủ dự án yêu cầu rà và sửa lặp trên chính lá số của mình.
 * 3 → 4 (25/09/2026) — phiên cải thiện chất lượng (CEL-131): truy hồi ưu tiên cung chính chủ đề, chuyên sâu dùng nguồn + việc làm được ngay, TQ04 nói vì sao.
 * 4 → 5 (25/09/2026) — bỏ "việc làm được ngay / trong tuần tới" (chủ dự án: nghe như ép buộc); bài thế hệ 4 có giọng đó.
 * 5 → 6 (25/09/2026) — khung Sự nghiệp viết lại (id SN01–SN08 đổi nghĩa) + công thức chuyên sâu mới; bài cũ dưới cùng id là bài của câu khác.
 * 6 → 7 (26/09/2026) — khung 13 chủ đề còn lại viết lại (khung 2026.09.3), sức khỏe được nêu nhóm cơ quan, thêm Bức tranh lớn.
 * 7 → 8 (30/09/2026) — chủ dự án duyệt: sửa mâu thuẫn giữa các phần, khung Tình duyên / Con cái trung tính giới + trạng thái duyên, tách dữ kiện / nguồn, độ dài theo cấu hình quản trị, bối cảnh người đọc. Gom một lần tăng.
 *
 * CÁI GIÁ CỦA MỖI LẦN TĂNG — đo 26/09/2026: lá số của chủ dự án bị sinh lại
 * TÁM lần trong hai ngày 24–25/09 (đổi kiểu khoá + th:2 → th:6 → th:7). Chủ dự
 * án mở trên máy khác, thấy bài viết lại, tưởng đệm không theo tài khoản — thật
 * ra đệm đúng theo lá số, chỉ là thế hệ vừa đổi. Nên: KHÔNG tăng số này khi chưa
 * hỏi chủ dự án, và gom nhiều thay đổi vào một lần tăng.
 */
export const THE_HE_DEM: number = 8;

/**
 * Bài viết trước khi có dấu kho (26/09/2026) được coi là viết với kho lúc đó —
 * dấu đo ngay trước khi deploy. Không có dòng này thì nút "Tạo bản mới" hiện
 * trên MỌI lá số ngay sau deploy (bài cũ không mang dấu nào), mời viết lại
 * hàng loạt dù kho chưa đổi gì.
 */
const KHO_TRUOC_DAU = '40749bb09806';
const khoCua = (c: { kho?: string }) => c.kho ?? KHO_TRUOC_DAU;

/**
 * Câu được dùng THƯ VIỆN TRI THỨC (KIEN-TRUC-LUAN-GIAI.md mục 11). Chỉ thêm câu vào
 * đây khi lát cắt của nó đã đạt đủ ngưỡng 11.2 — đo bằng scripts/do-thu-vien.ts và
 * scripts/so-sanh-v3.ts --du. Rỗng = thư viện chưa chạy cho người dùng.
 */
export const CAU_THU_VIEN = new Set<string>(['SN01', 'SN02', 'SN04', 'SN05']);

/**
 * BẬT 26/09/2026 theo quyết định chủ dự án ("đẩy thư viện lên, tôi tự check trên lá số") — dù
 * lát cắt chưa đạt ngưỡng 11.2 / 11.7 (KIEN-TRUC-LUAN-GIAI.md, QĐ-16). Chỉ các câu Sự nghiệp
 * không hỏi thời điểm; chỉ đợt trích lượt 2.
 */
export const DOT_THU_VIEN = 'sn-2,sn-2b';

/**
 * Dấu kho MONG ĐỢI của một câu: câu dùng thư viện mang thêm đợt thư viện. Nhờ vậy câu Sự nghiệp
 * đã viết trước khi bật thư viện hiện nút "Tạo bản mới" — và CHỈ năm câu ấy (+ tóm lại) được viết
 * lại, không đụng câu hay chủ đề khác.
 */
const khoMongDoi = (kho: string | null, id?: string) => (kho && id && CAU_THU_VIEN.has(id) ? `${kho}|tv:${DOT_THU_VIEN}` : kho);

export interface BodyV3 {
  ngay?: number;
  thang?: number;
  nam?: number;
  gio?: number;
  gioiTinh?: string;
  namXem?: number;
  nhom?: string;
  /** Chỉ lấy / chỉ sinh các câu này trong nhóm — để trang chia một nhóm thành vài lượt song song */
  chi?: string[];
  /** Lấy / viết phần "Tóm lại" của chủ đề (chỉ khi đủ các câu) */
  tomLai?: boolean;
  /** Lấy / viết "Bức tranh lớn" của cả lá số (khi đã đọc đủ số chủ đề) */
  bucTranh?: boolean;
  /**
   * "Tạo bản mới" (chủ dự án chốt 26/09/2026, phương án C): viết lại những câu
   * được viết với KHO TRI THỨC cũ. Cần đăng nhập; mỗi lá số chỉ một lần cho mỗi
   * phiên bản kho — câu đã viết với kho hiện tại thì trả nguyên, không gọi model.
   */
  taoMoi?: boolean;
  /**
   * VIẾT LẠI CƯỠNG BỨC — CHỈ quản trị viên (30/09/2026, chủ dự án: "tự test gen lại khi đổi cách
   * luận"). Bỏ qua đệm của phần được hỏi (câu, tóm lại, bức tranh lớn), viết lại bằng prompt/khung
   * hiện tại rồi ghi đè đệm. Không phải quản trị thì 403. taoMoi chỉ viết lại khi KHO đổi, nên sửa
   * prompt xong bấm "Tạo bản mới" không có tác dụng — cờ này là đường thử cho quản trị.
   */
  vietLai?: boolean;
  /**
   * Bối cảnh người đọc tự chọn (boi-canh-doc.ts) — chỉ Tình duyên, Con cái, Sự nghiệp dùng. Đổi GÓC
   * NHÌN và THÌ, không đổi kết luận; đi vào khoá đệm (`|bc:…`) để bài "đã kết hôn" không đến tay
   * người "đang độc thân".
   */
  boiCanh?: unknown;
}

export interface CauTraRaV3 {
  id: string;
  cauHoi: string;
  luanGiai: string;
  viSao: string;
  doRo: KetQuaCauV3['doRo'];
  /** Câu nào Celes chưa viết được thì nói thẳng, không bịa cho đủ */
  chuaViet: boolean;
  /** Ý chính (dàn ý lúc sinh) — sổ ý chống lặp cho các phần sinh sau (so-y.ts) */
  yChinh?: string[];
  /** Gợi ý tách khỏi bài luận — trang gom thành phần "Gợi ý của Celes" */
  goiY?: string;
  /** Phiên bản kho tri thức lúc viết câu này (tai-lieu-meta.ts) — thiếu là bài viết trước 26/09/2026 */
  kho?: string;
  /** Ý ghép nghĩa hai sao chưa có nguồn cho tổ hợp — sổ khuyết để bổ sung kho sau */
  ghep?: string[];
}

interface KhoaDem {
  chartHash: string;
  beMat: 'luan-giai-v3';
  khoaKy: string;
  ngonNgu: string;
}
type MetaLuu = { provider?: string; model?: string; phienBan?: Record<string, string> };

/** Mọi thứ khác nhau giữa lượt thật và lượt thử. Ngoài đây ra, hai bên chạy cùng một mã. */
export interface MoiTruongV3 {
  dem: {
    doc<T>(k: KhoaDem): Promise<BanGhiNoiDung<T> | null>;
    luu(k: KhoaDem, noiDung: unknown, meta: MetaLuu): Promise<void>;
    docMoiNhat<T>(k: Omit<KhoaDem, 'khoaKy'>, tienTo: string): Promise<BanGhiNoiDung<T> | null>;
    docNhieu<T>(k: Omit<KhoaDem, 'khoaKy'>, tienTo: string, chua?: string): Promise<{ khoaKy: string; noiDung: T }[]>;
  };
  /** Trả phản hồi chặn sẵn khi chưa đăng nhập; null = cho qua */
  canDangNhap(lyDo: 'regenerate' | 'deep_read'): Promise<Response | null>;
  laKhach(): Promise<boolean>;
  xinLuotLaSoMoi(chartHash: string): Promise<{ duocPhep: boolean; tran: number }>;
  phienBanKho(): Promise<string | null>;
  docThuVien(chuDe: string, dot: string): Promise<MucThuVien[]>;
  /** Người gọi có phải quản trị viên không — null = không. Chỉ hỏi khi body.vietLai */
  quanTri(): Promise<{ id?: string; email?: string } | null>;
  /** Ghi vết thao tác quản trị (tuỳ chọn — bộ thử không ghi) */
  ghiVet?: (hanhDong: string, chiTiet: Record<string, unknown>) => Promise<void>;
  /** Chỉ QUAN SÁT từng câu vừa viết xong (bộ thử ghi lại dữ kiện, nguồn, lỗi) — không đổi kết quả */
  quanSat?: (k: KetQuaCauV3) => void;
}

export type KetQuaXuLyV3 = { traThang: Response } | { status: number; json: Record<string, unknown> };

const tra = (json: Record<string, unknown>, status = 200): KetQuaXuLyV3 => ({ status, json });

export async function xuLyLuanGiaiV3(body: BodyV3, mt: MoiTruongV3): Promise<KetQuaXuLyV3> {
  // Trần 60 giây của Vercel, chừa 8 giây cho đệm và trả lời
  const hanChot = Date.now() + 52_000;
  const { dem } = mt;
  const { ngay, thang, nam, gio, gioiTinh } = body;
  const soHopLe = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
  if (
    !laNgayDuongCoThat(ngay, thang, nam) ||
    !soHopLe(ngay, 1, 31) ||
    !soHopLe(thang, 1, 12) ||
    !soHopLe(nam, 1900, 2100) ||
    !soHopLe(gio, 0, 23) ||
    (gioiTinh !== 'nam' && gioiTinh !== 'nu')
  ) {
    return tra({ loi: 'Thông tin ngày sinh không hợp lệ' }, 400);
  }

  const nhom = body.nhom ?? 'tong-quan';
  const taoMoi = body.taoMoi === true;
  const vietLai = body.vietLai === true;
  if (vietLai && !(await mt.quanTri())) return tra({ loi: 'Chỉ quản trị viên được viết lại cưỡng bức.' }, 403);
  if (nhom !== 'tong-quan' || taoMoi) {
    const chan = await mt.canDangNhap(taoMoi ? 'regenerate' : 'deep_read');
    if (chan) return { traThang: chan };
  }
  const ids = CAU_HOI_V3.filter((q) =>
    nhom === 'tong-quan' ? q.loai === 'tong-quan' : q.loai === 'chuyen-sau' && q.chuDe === nhom
  ).map((q) => q.id);
  if (!ids.length) return tra({ loi: 'Nhóm câu hỏi không hợp lệ' }, 400);
  /*
   * `chi`: trang tổng quan gọi HAI lượt song song — ba câu cho ba thẻ đầu, tám
   * câu còn lại. Sinh 11 câu một lượt thì người đọc chờ câu CHẬM NHẤT trong 11
   * (đo 24/09/2026: 35–48 giây lần đầu); tách ra thì ba thẻ đầu chỉ chờ câu chậm
   * nhất trong ba. Hai lượt KHÔNG chồng câu nào, nên không tốn thêm lượt gọi.
   */
  const phamVi = Array.isArray(body.chi) ? ids.filter((id) => body.chi!.includes(id)) : ids;
  if (!phamVi.length) return tra({ loi: 'Không có câu nào khớp' }, 400);

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
  const boiCanh = lamSachBoiCanh(body.boiCanh);
  const khoaGoc = `nam:${namXem}|nhom:${nhom}${khoaBoiCanh(boiCanh, nhom)}`;
  /*
   * Băm theo KHUNG giờ, không theo giờ thô (26/09/2026): cùng một người, máy
   * này lưu giờ 6, máy kia lưu giờ 5 — cùng lá số nhưng hai khoá, máy thứ hai
   * sinh lại từ đầu. Bài đã cất dưới khoá giờ thô vẫn được đọc lùi (docCoLui).
   */
  const bamCu = bamLaSo(ngay!, thang!, nam!, gio!, gioiTinh);
  const khoa: KhoaDem = {
    chartHash: bamLaSo(ngay!, thang!, nam!, veGioLaSo(gio!), gioiTinh),
    beMat: 'luan-giai-v3',
    khoaKy: THE_HE_DEM === 1 ? khoaGoc : `${khoaGoc}|th:${THE_HE_DEM}`,
    ngonNgu: 'vi',
  };

  /**
   * Đọc đệm; thiếu thì đọc dưới khoá băm GIỜ THÔ (trước 26/09/2026) và chép sang
   * khoá mới, để lần sau đọc thẳng. Giờ lẻ, 0 và 23 thì hai khoá trùng nhau.
   */
  const docCoLui = async <T>(k: KhoaDem): Promise<BanGhiNoiDung<T> | null> => {
    const da = await dem.doc<T>(k);
    if (da || bamCu === k.chartHash) return da;
    const cu = await dem.doc<T>({ ...k, chartHash: bamCu });
    if (cu) await dem.luu(k, cu.noiDung, { provider: cu.provider ?? undefined, model: cu.model ?? undefined });
    return cu;
  };

  /** Bài đã viết được ở thế hệ đệm liền trước — đường lùi khi sinh lại hỏng */
  const baiTheHeTruoc = async (): Promise<Map<string, CauTraRaV3>> => {
    try {
      const khoaKy = THE_HE_DEM === 2 ? khoaGoc : `${khoaGoc}|th:${THE_HE_DEM - 1}`;
      const cu = await docCoLui<CauTraRaV3[]>({ ...khoa, khoaKy });
      // Chỉ nhận bài cũ khi CÙNG câu hỏi: khung đổi nghĩa id (Sự nghiệp 25/09) thì bài cũ dưới id ấy là của câu khác
      const cauHoiCua = new Map(CAU_HOI_V3.map((q) => [q.id, q.cauHoi]));
      return new Map((cu?.noiDung ?? []).filter((c) => !c.chuaViet && c.cauHoi === cauHoiCua.get(c.id)).map((c) => [c.id, c]));
    } catch {
      return new Map();
    }
  };

  try {
    /*
     * TÓM LẠI của một chủ đề chuyên sâu (25/09/2026) — gọi SAU khi đủ các câu.
     * Khoá riêng "…|tom-lai" (không khớp khoá nhóm nên sổ ý không đọc nhầm nó).
     * Chưa đủ câu thì trả rỗng, không sinh từ bài dở dang.
     */
    /*
     * BỨC TRANH LỚN (26/09/2026): ghép phần "Tóm lại" của các chủ đề ĐÃ đọc +
     * tổng quan. Khoá kèm danh sách chủ đề, nên đọc thêm chủ đề thì bức tranh
     * được viết lại cho đủ; đọc lại mà không thêm gì thì lấy từ đệm.
     */
    if (body.bucTranh) {
      const tienToNhom = `nam:${namXem}|nhom:`;
      const cuoiTom = `|th:${THE_HE_DEM}|tom-lai|k:${PHIEN_BAN_V3.khung}`;
      const ds = await dem.docNhieu<{ tomLai?: string } | CauTraRaV3[]>(khoa, tienToNhom, `|th:${THE_HE_DEM}`);
      // Một chủ đề có thể có vài bản tóm lại theo bối cảnh người đọc (`|bc:…`): lấy bản khớp bối cảnh đang chọn
      const theoChuDe = new Map<string, { chuDe: string; khoa: string; tomLai: string }>();
      for (const r of ds) {
        if (!r.khoaKy.endsWith(cuoiTom) || Array.isArray(r.noiDung) || !r.noiDung?.tomLai) continue;
        const tho = r.khoaKy.slice(tienToNhom.length, r.khoaKy.length - cuoiTom.length);
        const chuDe = tho.split('|bc:')[0];
        const cu = theoChuDe.get(chuDe);
        if (cu && cu.khoa === `${chuDe}${khoaBoiCanh(boiCanh, chuDe)}`) continue;
        theoChuDe.set(chuDe, { chuDe, khoa: tho, tomLai: (r.noiDung as { tomLai: string }).tomLai });
      }
      const tomLai = [...theoChuDe.values()].sort((a, b) => a.chuDe.localeCompare(b.chuDe));
      if (tomLai.length < SO_CHU_DE_TOI_THIEU) {
        return tra({ bucTranh: null, soChuDe: tomLai.length, canToiThieu: SO_CHU_DE_TOI_THIEU });
      }
      const khoaBuc = { ...khoa, khoaKy: `nam:${namXem}|buc-tranh|th:${THE_HE_DEM}|k:${PHIEN_BAN_V3.khung}|${tomLai.map((t) => t.khoa).join('+')}` };
      const da = await dem.doc<{ bucTranh: string; kho?: string }>(khoaBuc);
      const khoBuc = await mt.phienBanKho();
      if (!vietLai && da?.noiDung?.bucTranh && !(taoMoi && khoBuc && khoCua(da.noiDung) !== khoBuc)) {
        return tra({ bucTranh: da.noiDung.bucTranh, soChuDe: tomLai.length, tuDem: true });
      }
      const tq = ds.find((r) => r.khoaKy === `${tienToNhom}tong-quan|th:${THE_HE_DEM}` && Array.isArray(r.noiDung));
      const tongQuan = ((tq?.noiDung as CauTraRaV3[] | undefined) ?? []).filter((c) => !c.chuaViet && c.luanGiai);
      const bt = await viBucTranh({ tomLai: tomLai.map(({ chuDe, tomLai: t }) => ({ chuDe, tomLai: t })), tongQuan });
      if (!bt) return tra({ loi: 'Celes chưa ghép được bức tranh lớn.' }, 502);
      const [provider, model] = bt.model.split('/');
      await dem.luu(khoaBuc, { bucTranh: bt.bucTranh, kho: khoBuc ?? undefined }, { provider, model, phienBan: PHIEN_BAN_V3 });
      if (vietLai) await mt.ghiVet?.('viet-lai-luan-giai', { chartHash: khoa.chartHash, khoaKy: khoaBuc.khoaKy });
      return tra({ bucTranh: bt.bucTranh, soChuDe: tomLai.length, tuDem: false });
    }

    if (body.tomLai && nhom !== 'tong-quan') {
      // Kèm phiên bản khung: khung đổi câu hỏi thì tóm lại cũ (viết từ câu cũ) không được dùng lại
      const khoaTom = { ...khoa, khoaKy: `${khoaGoc}|th:${THE_HE_DEM}|tom-lai|k:${PHIEN_BAN_V3.khung}` };
      const daTom = await docCoLui<{ tomLai: string; kho?: string }>(khoaTom);
      // Tóm lại của chủ đề có câu dùng thư viện mang dấu thư viện — viết lại khi các câu được viết lại
      const khoTom = khoMongDoi(await mt.phienBanKho(), ids.find((id) => CAU_THU_VIEN.has(id)));
      // Tạo bản mới: tóm lại viết với kho cũ thì viết lại từ các câu (vừa được viết lại)
      if (!vietLai && daTom?.noiDung?.tomLai && !(taoMoi && khoTom && khoCua(daTom.noiDung) !== khoTom)) {
        return tra({ nhom, tomLai: daTom.noiDung.tomLai, tuDem: true });
      }
      const nhomBai = await docCoLui<CauTraRaV3[]>(khoa);
      const du = ids.map((id) => nhomBai?.noiDung.find((c) => c.id === id && !c.chuaViet)).filter((c): c is CauTraRaV3 => Boolean(c));
      if (du.length < ids.length) return tra({ nhom, tomLai: null, chuaDu: true });
      const tom = await viTomLai({ chuDe: nhom, cau: du });
      if (!tom) return tra({ loi: 'Celes chưa viết được phần tóm lại.' }, 502);
      const [provider, model] = tom.model.split('/');
      await dem.luu(khoaTom, { tomLai: tom.tomLai, kho: khoTom ?? undefined }, { provider, model, phienBan: PHIEN_BAN_V3 });
      if (vietLai) await mt.ghiVet?.('viet-lai-luan-giai', { chartHash: khoa.chartHash, khoaKy: khoaTom.khoaKy });
      return tra({ nhom, tomLai: tom.tomLai, tuDem: false });
    }

    let cu = await docCoLui<CauTraRaV3[]>(khoa);
    let chuyenKhoa = false;
    if (!cu && THE_HE_DEM === 1) {
      // Bài đã sinh dưới khoá kiểu cũ ("…|s:<phiên bản>|v:<băm>") — dùng lại bản mới nhất
      cu = await dem.docMoiNhat<CauTraRaV3[]>(khoa, `${khoaGoc}|s:`);
      chuyenKhoa = Boolean(cu);
    }

    // Chỉ nhận bài đã cất khi CÙNG câu hỏi — khung đổi nghĩa id thì bài cũ dưới id ấy là của câu khác
    const cauHoiHienTai = new Map(CAU_HOI_V3.map((q) => [q.id, q.cauHoi]));
    const daCo = new Map(
      (cu?.noiDung ?? []).filter((c) => !c.chuaViet && c.cauHoi === cauHoiHienTai.get(c.id)).map((c) => [c.id, c])
    );
    const kho = await mt.phienBanKho();
    // Có câu viết với kho cũ thì người đã đăng nhập được thấy nút "Tạo bản mới"
    const coBanMoi = (ds: CauTraRaV3[]) => Boolean(kho) && ds.some((c) => !c.chuaViet && khoCua(c) !== khoMongDoi(kho, c.id));
    if (taoMoi) {
      if (!kho) return tra({ loi: 'Chưa đọc được kho tri thức, thử lại sau ít phút.' }, 503);
      // Chỉ câu viết với kho cũ; câu đã theo kho hiện tại giữ nguyên — mỗi phiên bản kho một lần
      for (const id of phamVi) if (daCo.get(id) && khoCua(daCo.get(id)!) !== khoMongDoi(kho, id)) daCo.delete(id);
    }
    // Viết lại cưỡng bức: bỏ hết bài đã cất của phần được hỏi; giữ bản cũ riêng để hiện tạm khi câu viết lại hỏng
    const banCu = new Map<string, CauTraRaV3>();
    if (vietLai) for (const id of phamVi) if (daCo.has(id)) { banCu.set(id, daCo.get(id)!); daCo.delete(id); }
    const thieu = phamVi.filter((id) => !daCo.has(id));

    if (!thieu.length) {
      // Chuyển bài cũ sang khoá mới để lần sau đọc thẳng, không phải dò tiền tố
      if (chuyenKhoa) {
        await dem.luu(khoa, cu!.noiDung, { provider: cu!.provider ?? undefined, model: cu!.model ?? undefined });
      }
      const cauDem = phamVi.map((id) => daCo.get(id)!);
      return tra({ nhom, cau: cauDem, tuDem: true, banMoi: coBanMoi(cauDem) });
    }

    // Tới đây là phải gọi model — khách chưa đăng nhập thì xin lượt trước (chỉ tổng quan mới tới được đây khi là khách)
    if (nhom === 'tong-quan' && (await mt.laKhach())) {
      const luot = await mt.xinLuotLaSoMoi(khoa.chartHash);
      if (!luot.duocPhep) {
        return tra(
          {
            loi: `Hôm nay bạn đã mở ${luot.tran} lá số mới khi chưa đăng nhập. Đăng nhập miễn phí để Celes viết tiếp.`,
            gioiHanKhach: true,
            canDangNhap: true,
          },
          429
        );
      }
    }

    /*
     * SỔ Ý: những gì các phần khác của CÙNG lá số + năm + thế hệ đệm đã nói —
     * tổng quan, các chủ đề đã mở trước, và các câu cùng nhóm đã có. Câu sắp
     * viết nhận danh sách này để không kể lại (so-y.ts). Đọc hỏng thì sổ rỗng.
     */
    const hauTo = THE_HE_DEM === 1 ? '' : `|th:${THE_HE_DEM}`;
    const tienTo = `nam:${namXem}|nhom:`;
    // Đúng thế hệ đệm hiện tại: "nam:2026|nhom:tien-bac|th:2" → "tien-bac"; khoá kiểu cũ ("…|s:…") bị loại
    const nhomCua = (k: string) => {
      if (!k.startsWith(tienTo) || !k.endsWith(hauTo)) return undefined;
      const ten = k.slice(tienTo.length, k.length - hauTo.length);
      return /^[a-z-]+$/.test(ten) ? ten : undefined;
    };
    const anhEm = (await dem.docNhieu<CauTraRaV3[]>(khoa, tienTo, hauTo || undefined))
      .map((r) => ({ nhom: nhomCua(r.khoaKy), cau: Array.isArray(r.noiDung) ? r.noiDung : [] }))
      .filter((r): r is { nhom: string; cau: CauTraRaV3[] } => Boolean(r.nhom) && r.nhom !== nhom);
    const daNoi = dungSoY([...anhEm, { nhom, cau: [...daCo.values()] }]).filter((d) => !thieu.includes(d.id));

    const thuVien = thieu.some((id) => CAU_THU_VIEN.has(id)) ? { muc: await mt.docThuVien(nhom, DOT_THU_VIEN), cau: CAU_THU_VIEN } : undefined;
    const kq = await luanNhieuCau({ laSo, ids: thieu, namXem, songSong: thieu.length, hanChot, daNoi, thuVien, khiXong: mt.quanSat, boiCanh: khoiBoiCanh(boiCanh, nhom) });
    /*
     * Đọc lại bản MỚI NHẤT trước khi ghi: lượt song song kia có thể đã cất phần
     * của nó trong lúc lượt này đang viết. Ghi đè bằng bản đọc lúc đầu là xoá
     * mất bài của lượt kia.
     */
    const moiNhat = await dem.doc<CauTraRaV3[]>(khoa);
    for (const c of moiNhat?.noiDung ?? []) if (!c.chuaViet && !daCo.has(c.id) && !banCu.has(c.id)) daCo.set(c.id, c);
    for (const k of kq) {
      if (!k.luanGiai) continue;
      daCo.set(k.id, {
        id: k.id, cauHoi: k.cauHoi, luanGiai: k.luanGiai, viSao: k.viSao, doRo: k.doRo, chuaViet: false,
        yChinh: k.danY.map((y) => y.y).filter(Boolean),
        goiY: k.goiY || undefined,
        kho: khoMongDoi(kho, k.id) ?? undefined,
        ghep: k.danY.some((y) => y.ghep) ? k.danY.filter((y) => y.ghep && y.y).map((y) => y.y).slice(0, 5) : undefined,
      });
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
    // Câu viết lại hỏng: hiện bản cũ và báo cho quản trị biết câu nào chưa viết lại được
    const vietLaiHong = cauTra.filter((c) => c.chuaViet && banCu.has(c.id)).map((c) => c.id);
    if (vietLaiHong.length) cauTra = cauTra.map((c) => (c.chuaViet ? banCu.get(c.id) ?? c : c));
    /*
     * Câu nào sinh lại hỏng thì tạm lấy bài của thế hệ đệm trước để hiện — người
     * đọc từng có bài ở đây, không được thấy chỗ trống chỉ vì mình vừa làm mới.
     * Bài cũ CHỈ đi vào câu trả lời, không ghi vào khoá mới: lần sau còn thử lại.
     */
    if (THE_HE_DEM > 1 && cauTra.some((c) => c.chuaViet)) {
      const truoc = await baiTheHeTruoc();
      if (truoc.size) cauTra = cauTra.map((c) => (c.chuaViet ? truoc.get(c.id) ?? c : c));
    }
    // Không câu nào trong phần được hỏi viết được thì không đệm — lần sau thử lại được ngay
    if (cau.filter((c) => phamVi.includes(c.id)).every((c) => c.chuaViet)) {
      if (cauTra.some((c) => !c.chuaViet)) return tra({ nhom, cau: cauTra, tuDem: true, ...(vietLai ? { vietLaiHong } : {}) });
      return tra({ loi: 'Celes chưa viết được phần này. Bạn thử lại giúp.' }, 502);
    }
    const mot = kq.find((k) => k.model);
    const [provider, model] = (mot?.model ?? '/').split('/');
    // Câu viết lại hỏng không được mất bài ở đệm: ghi lại bản cũ cho câu đó
    await dem.luu(khoa, cau.map((c) => (c.chuaViet ? banCu.get(c.id) ?? c : c)), { provider, model, phienBan: PHIEN_BAN_V3 });
    if (vietLai) await mt.ghiVet?.('viet-lai-luan-giai', { chartHash: khoa.chartHash, khoaKy: khoa.khoaKy, cau: thieu, hong: vietLaiHong });
    return tra({ nhom, cau: cauTra, tuDem: false, banMoi: coBanMoi(cauTra), ...(vietLai ? { vietLaiHong } : {}) });
  } catch (e) {
    if (e instanceof KhongCoModelError) {
      return tra({ loi: e.message, chuaCauHinh: true }, 503);
    }
    return tra({ loi: e instanceof Error ? e.message : 'Lỗi không xác định' }, 502);
  }
}
