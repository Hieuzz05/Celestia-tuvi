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
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import { PHIEN_BAN_CACH_CUC } from '@/lib/tuvi/cach-cuc';
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
 *
 * 8 → 9 (16/10/2026) — chủ dự án duyệt: độ sáng theo Tử Vi hàm số (phương pháp
 * 2026.10.1) và sửa Nhật Nguyệt tịnh minh, Mã đầu đới kiếm, gỡ Hình Tù giáp Ấn
 * (cách cục 2026.10.2). Khoá v3 không chứa phiên bản phương pháp, nên không
 * tăng số này thì bài đã đệm vẫn luận theo độ sáng cũ. Đếm trước: 14 bài, 5 lá số.
 */
export const THE_HE_DEM: number = 9;


/**
 * DẤU LOGIC trên từng câu, tóm lại, bức tranh lớn (K2, 22/10/2026 — quyết định 10.19 C).
 *
 * Khoá v3 không chứa phiên bản logic nào, nên sửa phương pháp an sao / cách cục / dữ kiện thì bài đã đệm
 * vẫn luận theo logic cũ cho tới khi có người tăng THE_HE_DEM — mà tăng số ấy là xả cả đệm, phải hỏi chủ
 * dự án (QĐ-14). 10.19 C: "sửa logic thì bài viết lại khi mở" — đây là ngoại lệ của QĐ-14 đúng cho
 * trường hợp này. Câu mang dấu lệch được coi như THIẾU: viết lại khi mở, bản cũ giữ trong `banCu` để
 * hiện tạm nếu viết hỏng. Giọng văn (prompt) KHÔNG vào dấu: sửa giọng không kéo bài cũ.
 *
 * Vẫn là số tăng tay: sửa engine mà quên tăng phiên bản của nó thì dấu không đổi.
 */
export const LOGIC_V3 = [PHUONG_PHAP.phienBan, PHIEN_BAN_CACH_CUC, PHIEN_BAN_V3.duKien].join('|');
/**
 * Bài viết trước khi có dấu được coi là viết với logic lúc deploy K2 (như dấu kho từng làm, 26/09/2026):
 * không có dòng này thì deploy K2 làm MỌI bài v3 viết lại dù logic chưa đổi gì.
 */
const LG_TRUOC_DAU = '2026.10.1|2026.10.2|2026.10.1';
const dungLogic = (c: { lg?: string }) => (c.lg ?? LG_TRUOC_DAU) === LOGIC_V3;

/**
 * Che phần THÁNG của bản cũ đang hiện tạm (X2, 22/10/2026). Tăng phienBan làm mọi bài V3 viết lại khi mở;
 * viết hỏng (chạm trần token) hay khách hết lượt thì người đọc thấy bản cũ, mà bản cũ an nguyệt hạn theo
 * cách trước. Bản cũ khác phienBan: bỏ câu văn nói một tháng cụ thể / nguyệt hạn, thêm một câu không hứa
 * hẹn; phần khác giữ nguyên. Chỉ đổi thứ trả ra, KHÔNG ghi vào đệm.
 */
const THANG_CU_THE =
  /nguyệt hạn|(?:^|[^\p{L}])(?:các|những|từng) tháng|tháng\s+(?:\d{1,2}|giêng|chạp|một|hai|ba|tư|bốn|năm|sáu|bảy|tám|chín|mười)(?=[^\p{L}]|$)/iu;
export const CAU_AN_THANG = 'Phần nhịp từng tháng tạm ẩn ở bản này.';
const khacPhienBan = (c: { lg?: string }) => (c.lg ?? LG_TRUOC_DAU).split('|')[0] !== PHUONG_PHAP.phienBan;
function boCauThang(van: string): { van: string; bo: boolean } {
  const doan = van.split(/(?<=[.!?…])\s+|\n+/);
  const giu = doan.filter((d) => !THANG_CU_THE.test(d));
  return giu.length === doan.length ? { van, bo: false } : { van: giu.join(' ').trim(), bo: true };
}
type CoVan = { lg?: string; luanGiai?: string; viSao?: string; yChinh?: string[]; goiY?: string; tomLai?: string; bucTranh?: string };
export function cheThangBanCu<T extends CoVan>(c: T): T {
  if (!khacPhienBan(c)) return c;
  const ra: CoVan = { ...c };
  let bo = false;
  for (const k of ['luanGiai', 'viSao', 'goiY', 'tomLai', 'bucTranh'] as const) {
    if (!c[k]) continue;
    const r = boCauThang(c[k]);
    if (r.bo) (bo = true), (ra[k] = r.van);
  }
  if (c.yChinh?.some((y) => THANG_CU_THE.test(y))) (bo = true), (ra.yChinh = c.yChinh.filter((y) => !THANG_CU_THE.test(y)));
  if (!bo) return c;
  for (const k of ['luanGiai', 'tomLai', 'bucTranh'] as const) if (c[k] !== undefined) ra[k] = `${ra[k] ? `${ra[k]} ` : ''}${CAU_AN_THANG}`;
  if (ra.goiY === '') ra.goiY = undefined;
  return ra as T;
}

/**
 * Lọc bài thế hệ đệm trước được dùng làm đường lùi. Chỉ nhận bài cũ khi CÙNG câu hỏi: khung đổi nghĩa id
 * (Sự nghiệp 25/09) thì bài cũ dưới id ấy là của câu khác. Câu có dữ kiện nguyệt hạn mà bài mang dấu logic
 * cũ thì bỏ: X2 (22/10/2026) đổi cách an cung tháng, bài cũ nói sai cung — để trống còn hơn sai (T-05).
 */
export function locBaiTheHeTruoc(ds: CauTraRaV3[]): Map<string, CauTraRaV3> {
  const cauHoiCua = new Map(CAU_HOI_V3.map((q) => [q.id, q.cauHoi]));
  const coNguyet = new Set(CAU_HOI_V3.filter((q) => q.van.includes('nguyet')).map((q) => q.id));
  return new Map(
    ds
      .filter((c) => !c.chuaViet && c.cauHoi === cauHoiCua.get(c.id) && (dungLogic(c) || !coNguyet.has(c.id)))
      .map((c) => [c.id, c])
  );
}

/**
 * Câu được dùng THƯ VIỆN TRI THỨC (KIEN-TRUC-LUAN-GIAI.md mục 11). Chỉ thêm câu vào
 * đây khi lát cắt của nó đã đạt đủ ngưỡng 11.2 — đo bằng scripts/do-thu-vien.ts và
 * scripts/so-sanh-v3.ts --du. Rỗng = thư viện chưa chạy cho người dùng.
 */
/*
 * Sự nghiệp BẬT 26/09/2026 theo quyết định chủ dự án ("đẩy thư viện lên, tôi tự check trên lá số") — dù
 * lát cắt chưa đạt ngưỡng 11.2 / 11.7 (KIEN-TRUC-LUAN-GIAI.md, QĐ-16). Chỉ các câu Sự nghiệp
 * không hỏi thời điểm; chỉ đợt trích lượt 2.
 *
 * Chủ đề khác (30/09/2026): dựng bằng `scripts/dung-thu-vien.ts --chu-de <id> --dot <đợt>` rồi thêm
 * một dòng ở đây. CHƯA có gói đợt trong Supabase thì đừng thêm — câu ấy sẽ được viết bằng khối thư
 * viện rỗng.
 */
export const THU_VIEN_THEO_CHU_DE: Record<string, { dot: string; cau: string[] }> = {
  'su-nghiep': { dot: 'sn-2,sn-2b', cau: ['SN01', 'SN02', 'SN04', 'SN05'] },
  // BẬT 01/10/2026 theo chủ dự án — đợt lượt 1 mỗi chủ đề, chỉ các câu không hỏi thời điểm
  'tinh-duyen': { dot: 'td-1', cau: ['TD01', 'TD03'] },
  'con-cai': { dot: 'cc-1', cau: ['CC02', 'CC03'] },
  'tien-bac': { dot: 'tb-1', cau: ['TB01', 'TB02', 'TB04'] },
  'gia-dinh': { dot: 'gd-1', cau: ['GD01', 'GD02'] },
  'suc-khoe': { dot: 'sk-1', cau: ['SK01'] },
  'ra-ngoai': { dot: 'rn-1', cau: ['RN02'] },
  'tinh-cach': { dot: 'tc-1', cau: ['TC02', 'TC03'] },
};
export const CAU_THU_VIEN = new Set<string>(Object.values(THU_VIEN_THEO_CHU_DE).flatMap((t) => t.cau));
const dotCuaCau = (id: string) => Object.values(THU_VIEN_THEO_CHU_DE).find((t) => t.cau.includes(id))?.dot;

/**
 * Dấu kho MONG ĐỢI của một câu: câu dùng thư viện mang thêm đợt thư viện. Nút "Tạo bản mới" đọc dấu
 * này đã gỡ (K2, 22/10/2026 — 10.19 C); dấu vẫn ghi lên câu để thu hồi (X3) biết câu nào viết với kho nào.
 */
const khoMongDoi = (kho: string | null, id?: string) => (kho && id && CAU_THU_VIEN.has(id) ? `${kho}|tv:${dotCuaCau(id)}` : kho);

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
   * VIẾT LẠI CƯỠNG BỨC — CHỈ quản trị viên (30/09/2026, chủ dự án: "tự test gen lại khi đổi cách
   * luận"). Bỏ qua đệm của phần được hỏi (câu, tóm lại, bức tranh lớn), viết lại bằng prompt/khung
   * hiện tại rồi ghi đè đệm. Không phải quản trị thì 403. Sửa prompt (giọng) không kéo bài cũ
   * (10.19 C), nên cờ này là đường thử duy nhất cho quản trị.
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
  /** Dấu logic lúc viết (`LOGIC_V3`) — lệch thì câu được viết lại khi mở; thiếu là bài trước K2 */
  lg?: string;
  /** Ý ghép nghĩa hai sao chưa có nguồn cho tổ hợp — sổ khuyết để bổ sung kho sau */
  ghep?: string[];
  /** Phiên bản prompt + model viết RIÊNG câu này (01/10/2026) — một hàng đệm ghép câu của nhiều lượt, cột model của hàng chỉ đúng cho lượt cuối */
  pb?: string;
  model?: string;
  /**
   * Căn cứ: TOÀN BỘ tập đã cấp cho model khi viết câu này (22/10/2026), không chỉ mã model tự nhắc —
   * để biết bài nào phải viết lại khi một mục thư viện hay một bản tài liệu bị rút. Chỉ ở trong đệm.
   */
  canCu?: CanCuCauV3;
}

export interface CanCuCauV3 {
  thuVien: { ma: string; id: string; dot: string; dau: string }[];
  nguon: { ma: string; documentId: string; versionId: string; chunkId: string }[];
}

/** Căn cứ của một câu vừa viết — từ đúng tập dữ liệu đã đưa vào prompt */
export const canCuCua = (k: Pick<KetQuaCauV3, 'thuVien' | 'nguon'>): CanCuCauV3 => ({
  thuVien: (k.thuVien?.daChon ?? []).map(({ ma, id, dot, dau }) => ({ ma, id, dot, dau })),
  nguon: k.nguon.map((n) => ({ ma: n.id, documentId: n.documentId, versionId: n.versionId, chunkId: n.chunkId })),
});

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
/**
 * pb / model / canCu chỉ ở trong đệm (trang chấm bài đọc) — không gửi ra trình duyệt: mặt trước không lộ
 * tên model, không lộ nguồn gốc RAG. MỌI đường trả `cau` phải đi qua đây, kể cả bài lấy từ đệm.
 */
export const anNoiBo = (ds: CauTraRaV3[]) => ds.map(({ pb: _pb, model: _model, canCu: _canCu, lg: _lg, ...c }) => c);

const khoaGocV3 = (namXem: number, nhom: string, boiCanh: ReturnType<typeof lamSachBoiCanh>) =>
  `nam:${namXem}|nhom:${nhom}${khoaBoiCanh(boiCanh, nhom)}`;
const khoaKyTheHe = (khoaGoc: string) => (THE_HE_DEM === 1 ? khoaGoc : `${khoaGoc}|th:${THE_HE_DEM}`);

/**
 * Khoá đệm của một lượt xem — CÙNG công thức với xuLyLuanGiaiV3. Trang chấm bài của quản trị dùng
 * để tự tính khoá ở máy chủ (không tin khoá client gửi) và đối chiếu bản chụp với bài đang đệm.
 */
export function khoaDemV3(body: Pick<BodyV3, 'ngay' | 'thang' | 'nam' | 'gio' | 'gioiTinh' | 'namXem' | 'nhom' | 'boiCanh'>): { chartHash: string; khoaKy: string; nhom: string } | null {
  const { ngay, thang, nam, gio, gioiTinh } = body;
  const so = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
  if (!laNgayDuongCoThat(ngay, thang, nam) || !so(ngay, 1, 31) || !so(thang, 1, 12) || !so(nam, 1900, 2100) || !so(gio, 0, 23) || (gioiTinh !== 'nam' && gioiTinh !== 'nu')) return null;
  const nhom = body.nhom ?? 'tong-quan';
  const namXem = so(body.namXem, 1900, 2100) ? (body.namXem as number) : new Date().getFullYear();
  return {
    chartHash: bamLaSo(ngay!, thang!, nam!, veGioLaSo(gio!), gioiTinh),
    khoaKy: khoaKyTheHe(khoaGocV3(namXem, nhom, lamSachBoiCanh(body.boiCanh))),
    nhom,
  };
}

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
  const vietLai = body.vietLai === true;
  if (vietLai && !(await mt.quanTri())) return tra({ loi: 'Chỉ quản trị viên được viết lại cưỡng bức.' }, 403);
  if (nhom !== 'tong-quan') {
    const chan = await mt.canDangNhap('deep_read');
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
  const khoaGoc = khoaGocV3(namXem, nhom, boiCanh);
  /*
   * Băm theo KHUNG giờ, không theo giờ thô (26/09/2026): cùng một người, máy
   * này lưu giờ 6, máy kia lưu giờ 5 — cùng lá số nhưng hai khoá, máy thứ hai
   * sinh lại từ đầu. Bài đã cất dưới khoá giờ thô vẫn được đọc lùi (docCoLui).
   */
  const bamCu = bamLaSo(ngay!, thang!, nam!, gio!, gioiTinh);
  const khoa: KhoaDem = {
    chartHash: bamLaSo(ngay!, thang!, nam!, veGioLaSo(gio!), gioiTinh),
    beMat: 'luan-giai-v3',
    khoaKy: khoaKyTheHe(khoaGoc),
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
      return locBaiTheHeTruoc(cu?.noiDung ?? []);
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
      const da = await dem.doc<{ bucTranh: string; kho?: string; lg?: string }>(khoaBuc);
      const khoBuc = await mt.phienBanKho();
      if (!vietLai && da?.noiDung?.bucTranh && dungLogic(da.noiDung)) {
        return tra({ bucTranh: da.noiDung.bucTranh, soChuDe: tomLai.length, tuDem: true });
      }
      const tq = ds.find((r) => r.khoaKy === `${tienToNhom}tong-quan|th:${THE_HE_DEM}` && Array.isArray(r.noiDung));
      const tongQuan = ((tq?.noiDung as CauTraRaV3[] | undefined) ?? []).filter((c) => !c.chuaViet && c.luanGiai);
      const bt = await viBucTranh({ tomLai: tomLai.map(({ chuDe, tomLai: t }) => ({ chuDe, tomLai: t })), tongQuan });
      // Viết lại vì lệch dấu logic mà hỏng: hiện bản cũ, không để trống chỗ người đọc từng có bài
      if (!bt && da?.noiDung?.bucTranh && !vietLai) return tra({ bucTranh: cheThangBanCu(da.noiDung).bucTranh, soChuDe: tomLai.length, tuDem: true });
      if (!bt) return tra({ loi: 'Celes chưa ghép được bức tranh lớn.' }, 502);
      const [provider, model] = bt.model.split('/');
      await dem.luu(khoaBuc, { bucTranh: bt.bucTranh, kho: khoBuc ?? undefined, lg: LOGIC_V3 }, { provider, model, phienBan: PHIEN_BAN_V3 });
      if (vietLai) await mt.ghiVet?.('viet-lai-luan-giai', { chartHash: khoa.chartHash, khoaKy: khoaBuc.khoaKy });
      return tra({ bucTranh: bt.bucTranh, soChuDe: tomLai.length, tuDem: false });
    }

    if (body.tomLai && nhom !== 'tong-quan') {
      // Kèm phiên bản khung: khung đổi câu hỏi thì tóm lại cũ (viết từ câu cũ) không được dùng lại
      const khoaTom = { ...khoa, khoaKy: `${khoaGoc}|th:${THE_HE_DEM}|tom-lai|k:${PHIEN_BAN_V3.khung}` };
      const daTom = await docCoLui<{ tomLai: string; kho?: string; lg?: string }>(khoaTom);
      // Tóm lại của chủ đề có câu dùng thư viện mang dấu thư viện — viết lại khi các câu được viết lại
      const khoTom = khoMongDoi(await mt.phienBanKho(), ids.find((id) => CAU_THU_VIEN.has(id)));
      if (!vietLai && daTom?.noiDung?.tomLai && dungLogic(daTom.noiDung)) {
        return tra({ nhom, tomLai: daTom.noiDung.tomLai, tuDem: true });
      }
      const nhomBai = await docCoLui<CauTraRaV3[]>(khoa);
      // Chỉ ghép từ câu ĐÚNG dấu logic: tóm lại viết từ câu cũ thì lại mang logic cũ
      const du = ids.map((id) => nhomBai?.noiDung.find((c) => c.id === id && !c.chuaViet && dungLogic(c))).filter((c): c is CauTraRaV3 => Boolean(c));
      // Có câu chưa viết lại được theo logic mới: giữ tóm lại cũ còn hơn bỏ trống
      const giuTomCu = () => (daTom?.noiDung?.tomLai && !vietLai ? tra({ nhom, tomLai: cheThangBanCu(daTom.noiDung).tomLai, tuDem: true }) : null);
      if (du.length < ids.length) return giuTomCu() ?? tra({ nhom, tomLai: null, chuaDu: true });
      const tom = await viTomLai({ chuDe: nhom, cau: du });
      if (!tom) return giuTomCu() ?? tra({ loi: 'Celes chưa viết được phần tóm lại.' }, 502);
      const [provider, model] = tom.model.split('/');
      await dem.luu(khoaTom, { tomLai: tom.tomLai, kho: khoTom ?? undefined, lg: LOGIC_V3 }, { provider, model, phienBan: PHIEN_BAN_V3 });
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
    /*
     * Viết lại cưỡng bức, hoặc câu mang dấu logic cũ: bỏ bài đã cất của câu ấy; giữ bản cũ riêng để hiện
     * tạm khi câu viết lại hỏng. Câu lệch dấu ở NGOÀI phạm vi lượt này giữ nguyên trong đệm — lượt của nó
     * tự viết lại.
     */
    const banCu = new Map<string, CauTraRaV3>();
    for (const id of phamVi) {
      const c = daCo.get(id);
      if (c && (vietLai || !dungLogic(c))) { banCu.set(id, c); daCo.delete(id); }
    }
    const thieu = phamVi.filter((id) => !daCo.has(id));

    if (!thieu.length) {
      // Chuyển bài cũ sang khoá mới để lần sau đọc thẳng, không phải dò tiền tố
      if (chuyenKhoa) {
        await dem.luu(khoa, cu!.noiDung, { provider: cu!.provider ?? undefined, model: cu!.model ?? undefined });
      }
      const cauDem = phamVi.map((id) => daCo.get(id)!);
      return tra({ nhom, cau: anNoiBo(cauDem), tuDem: true });
    }

    // Tới đây là phải gọi model — khách chưa đăng nhập thì xin lượt trước (chỉ tổng quan mới tới được đây khi là khách)
    if (nhom === 'tong-quan' && (await mt.laKhach())) {
      const luot = await mt.xinLuotLaSoMoi(khoa.chartHash);
      // Lá số khách đã đọc, chỉ thiếu vì logic đổi: trả bài cũ, không bắt đăng nhập vì lỗi của mình
      if (!luot.duocPhep && thieu.every((id) => banCu.has(id))) {
        return tra({ nhom, cau: anNoiBo(phamVi.map((id) => daCo.get(id) ?? cheThangBanCu(banCu.get(id)!))), tuDem: true });
      }
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

    const tvNhom = THU_VIEN_THEO_CHU_DE[nhom];
    const thuVien = tvNhom && thieu.some((id) => tvNhom.cau.includes(id)) ? { muc: await mt.docThuVien(nhom, tvNhom.dot), cau: new Set(tvNhom.cau) } : undefined;
    const kq = await luanNhieuCau({ laSo, ids: thieu, namXem, songSong: thieu.length, hanChot, daNoi, thuVien, khiXong: mt.quanSat, boiCanh: khoiBoiCanh(boiCanh, nhom) });
    /*
     * Đọc lại bản MỚI NHẤT trước khi ghi: lượt song song kia có thể đã cất phần
     * của nó trong lúc lượt này đang viết. Ghi đè bằng bản đọc lúc đầu là xoá
     * mất bài của lượt kia.
     */
    const moiNhat = await dem.doc<CauTraRaV3[]>(khoa);
    // Lượt kia vừa viết lại một câu lệch dấu (ngoài phạm vi lượt này): lấy bản mới của nó, đừng ghi đè bằng bản cũ
    for (const c of moiNhat?.noiDung ?? []) {
      if (c.chuaViet || !dungLogic(c) || banCu.has(c.id)) continue;
      const da = daCo.get(c.id);
      if (!da || !dungLogic(da)) daCo.set(c.id, c);
    }
    for (const k of kq) {
      if (!k.luanGiai) continue;
      daCo.set(k.id, {
        id: k.id, cauHoi: k.cauHoi, luanGiai: k.luanGiai, viSao: k.viSao, doRo: k.doRo, chuaViet: false,
        yChinh: k.danY.map((y) => y.y).filter(Boolean),
        goiY: k.goiY || undefined,
        kho: khoMongDoi(kho, k.id) ?? undefined,
        lg: LOGIC_V3,
        ghep: k.danY.some((y) => y.ghep) ? k.danY.filter((y) => y.ghep && y.y).map((y) => y.y).slice(0, 5) : undefined,
        pb: PHIEN_BAN_V3.prompt,
        model: k.model || undefined,
        canCu: canCuCua(k),
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
    if (vietLaiHong.length) cauTra = cauTra.map((c) => (c.chuaViet && banCu.has(c.id) ? cheThangBanCu(banCu.get(c.id)!) : c));
    /*
     * Câu nào sinh lại hỏng thì tạm lấy bài của thế hệ đệm trước để hiện — người
     * đọc từng có bài ở đây, không được thấy chỗ trống chỉ vì mình vừa làm mới.
     * Bài cũ CHỈ đi vào câu trả lời, không ghi vào khoá mới: lần sau còn thử lại.
     */
    if (THE_HE_DEM > 1 && cauTra.some((c) => c.chuaViet)) {
      const truoc = await baiTheHeTruoc();
      if (truoc.size) cauTra = cauTra.map((c) => (c.chuaViet && truoc.has(c.id) ? cheThangBanCu(truoc.get(c.id)!) : c));
    }
    // Không câu nào trong phần được hỏi viết được thì không đệm — lần sau thử lại được ngay
    if (cau.filter((c) => phamVi.includes(c.id)).every((c) => c.chuaViet)) {
      if (cauTra.some((c) => !c.chuaViet)) return tra({ nhom, cau: anNoiBo(cauTra), tuDem: true, ...(vietLai ? { vietLaiHong } : {}) });
      return tra({ loi: 'Celes chưa viết được phần này. Bạn thử lại giúp.' }, 502);
    }
    const mot = kq.find((k) => k.model);
    const [provider, model] = (mot?.model ?? '/').split('/');
    // Câu viết lại hỏng không được mất bài ở đệm: ghi lại bản cũ cho câu đó
    await dem.luu(khoa, cau.map((c) => (c.chuaViet ? banCu.get(c.id) ?? c : c)), { provider, model, phienBan: PHIEN_BAN_V3 });
    if (vietLai) await mt.ghiVet?.('viet-lai-luan-giai', { chartHash: khoa.chartHash, khoaKy: khoa.khoaKy, cau: thieu, hong: vietLaiHong });
    return tra({ nhom, cau: anNoiBo(cauTra), tuDem: false, ...(vietLai ? { vietLaiHong } : {}) });
  } catch (e) {
    if (e instanceof KhongCoModelError) {
      return tra({ loi: e.message, chuaCauHinh: true }, 503);
    }
    return tra({ loi: e instanceof Error ? e.message : 'Lỗi không xác định' }, 502);
  }
}
