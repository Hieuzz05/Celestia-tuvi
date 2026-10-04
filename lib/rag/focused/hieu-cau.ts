/**
 * HIỂU CÂU QUA LƯỢT — trạng thái hội thoại của đường Focused (CEL-186 Answer Contract v2, spec 2.3 + 6).
 *
 * Server phát `MetaLuot` sau mỗi lượt Focused; client giữ một bản trong sessionStorage và gửi lại
 * đúng một bản ở lượt sau (`luotTruoc`). Meta không chép nội dung dữ kiện: nó lưu tham số đủ để
 * `chonBoiCanh` dựng lại đúng dãy F### (`dungLaiBoiCanh`), và định danh bền của đoạn RAG (`canCuE`).
 *
 * Chống giả mạo: HMAC-SHA256 trên JSON chuẩn hoá, khoá `CELES_META_KHOA`. Thiếu khoá thì tính
 * năng tắt — không phát meta, không nhận `luotTruoc`. Chữ ký đúng vẫn chưa đủ: meta phải đúng lá
 * số, đúng người, đúng tin trợ lý cuối của lịch sử (spec 2.3, delta #1). Lệch thì bỏ, chạy như
 * câu mới, không báo lỗi cho người dùng.
 */

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { TinNhan } from '@/lib/ai/prompt';
import type { ThoiDiemAm } from '@/lib/tuvi/bay-gio';
import type { LaSo } from '@/lib/tuvi/ansao';
import { chonBoiCanh, type BoiCanhLaSo } from '../boi-canh-la-so';
import type { ChuDe, KeHoachTruyVan, LopHan, YDinh } from '../planner';
import { cauVanRieng, chipLaSoCuaNguoiDuocHoi, chipQuanHe } from './cau-ma';
import { nhanDangDoiTuong, type DoiTuongCauHoi, type VaiNguoi } from './doi-tuong';
import { soAmTiet, TRAN_AM_TIET_CAU_NGAN } from './ke-thua';
import type { NgonNgu } from './ngon-ngu';
import type { BoiCanhThoiGian, Khuon, MucTieuThoiGian } from './phan-loai';
import { ngayDuongCua, soVoiBayGio, trangThaiThangDuong, type CuaSoAm } from './thang-am';

/* ------------------------------------------------------------- kiểu */

export type LaSoCuaAi = 'nguoi-hoi' | 'nguoi-duoc-hoi' | 'chua-ro';

/** Câu hỏi lại đang chờ (F2). Server chỉ phát bản chưa giải; giải xong thì lượt mới không mang nó. */
export interface ChoHoiLai {
  loai: 'la-so-cua-ai';
  cauHoiGoc: string;
  doiTuong: { vai: string; nhan: string };
  daGiai: false;
}

export interface MetaLuot {
  v: 1;
  phienBan: string;
  chuDe: ChuDe;
  yDinh: YDinh;
  khuon: Khuon;
  keHoach: { cungLienQuan: string[]; lopHan: LopHan[] };
  namHieuLuc: number;
  cuaSo: CuaSoAm[] | null;
  doiTuong: { vai: string; nhan: string; cung: string | null } | null;
  laSoCuaAi: LaSoCuaAi;
  thoiGian: MucTieuThoiGian;
  ketLuanChinh: { claim: string; direction?: string } | null;
  canCuF: string[];
  canCuE: { chunkId: string; documentId: string; versionId: string }[];
  hoanCanh: string[];
  choHoiLai: ChoHoiLai | null;
  laSo: string;
  nguoiDung: string;
  bamTraLoi: string;
  ky: string;
}

export type MetaChuaKy = Omit<MetaLuot, 'ky'>;

/** Lý do bỏ `luotTruoc` — ghi vào vết Preview (spec 2.3) */
export type LyDoBoLuotTruoc = 'ky' | 'la-so' | 'nguoi-dung' | 'luot';

/** Ràng buộc server tự tính từ request hiện tại — không bao giờ lấy từ meta */
export interface RangBuocMeta {
  laSo: string;
  nguoiDung: string;
}

/** Trần route đặt cho `JSON.stringify(luotTruoc)` (spec 2.3) */
export const TRAN_KY_TU_LUOT_TRUOC = 4000;
export const TRAN_CLAIM = 200;
export const TRAN_CAN_CU_E = 6;
export const TRAN_HOAN_CANH = 3;

/* ------------------------------------------------------------- băm, ký */

export const bam16 = (s: string): string => createHash('sha256').update(s).digest('hex').slice(0, 16);

/**
 * Băm tin trợ lý. Route cắt `noiDung` của lịch sử ở 2000 ký tự, nên băm trên đúng phần ấy —
 * băm cả bài thì mọi câu trả lời dài hơn 2000 ký tự sẽ bị bỏ ở điều kiện 4.
 */
export const bamTraLoi = (van: string): string => bam16(van.slice(0, 2000));

/** JSON khoá xếp theo thứ tự chữ, đệ quy — hai bên ký và kiểm ra cùng một chuỗi */
function jsonChuan(x: unknown): string {
  if (Array.isArray(x)) return `[${x.map(jsonChuan).join(',')}]`;
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${jsonChuan(o[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(x);
}

export const khoaMeta = (): string | null => process.env.CELES_META_KHOA || null;

const chuKy = (m: MetaChuaKy, khoa: string) => createHmac('sha256', khoa).update(jsonChuan(m)).digest('base64url');

export function kyMeta(m: MetaChuaKy, khoa: string): MetaLuot {
  return { ...m, ky: chuKy(m, khoa) };
}

/* ------------------------------------------------------- kiểm hình dạng */

const laChuoi = (x: unknown, tran = 2000): x is string => typeof x === 'string' && x.length <= tran;
const laSoNguyen = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x);
const dsChuoi = (x: unknown, tran = 20): x is string[] => Array.isArray(x) && x.length <= tran && x.every((s) => laChuoi(s, 200));
const laObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

function laCuaSo(x: unknown): x is CuaSoAm {
  return (
    laObj(x) &&
    (x.ma === 'W1' || x.ma === 'W2' || x.ma === 'W3') &&
    laSoNguyen(x.namAm) &&
    laSoNguyen(x.thangAm) &&
    typeof x.nhuan === 'boolean' &&
    laChuoi(x.tuNgay, 10) &&
    laChuoi(x.denNgay, 10) &&
    laSoNguyen(x.soNgay) &&
    laChuoi(x.trangThai, 10)
  );
}

function laThoiGian(x: unknown): x is MucTieuThoiGian {
  if (!laObj(x)) return false;
  if (x.loai === 'nam') return laSoNguyen(x.nam);
  if (x.loai === 'thang-duong') return laSoNguyen(x.nam) && laSoNguyen(x.thang);
  if (x.loai === 'thang-am') return laSoNguyen(x.namAm) && laSoNguyen(x.thangAm) && typeof x.nhuan === 'boolean';
  return false;
}

/** Kiểm kiểu từng trường. Sai bất kỳ trường nào → null (route và Focused coi như không có). */
export function docMetaLuot(x: unknown): MetaLuot | null {
  if (!laObj(x) || x.v !== 1) return null;
  const kh = x.keHoach;
  const dt = x.doiTuong;
  const kl = x.ketLuanChinh;
  const ch = x.choHoiLai;
  const ok =
    laChuoi(x.phienBan, 60) &&
    laChuoi(x.chuDe, 30) &&
    laChuoi(x.yDinh, 30) &&
    laChuoi(x.khuon, 4) &&
    laObj(kh) &&
    dsChuoi(kh.cungLienQuan) &&
    dsChuoi(kh.lopHan) &&
    laSoNguyen(x.namHieuLuc) &&
    (x.cuaSo === null || (Array.isArray(x.cuaSo) && x.cuaSo.length <= 3 && x.cuaSo.every(laCuaSo))) &&
    (dt === null || (laObj(dt) && laChuoi(dt.vai, 30) && laChuoi(dt.nhan, 30) && (dt.cung === null || laChuoi(dt.cung, 30)))) &&
    (x.laSoCuaAi === 'nguoi-hoi' || x.laSoCuaAi === 'nguoi-duoc-hoi' || x.laSoCuaAi === 'chua-ro') &&
    laThoiGian(x.thoiGian) &&
    (kl === null || (laObj(kl) && laChuoi(kl.claim, TRAN_CLAIM) && (kl.direction === undefined || laChuoi(kl.direction, 20)))) &&
    dsChuoi(x.canCuF, 30) &&
    Array.isArray(x.canCuE) &&
    x.canCuE.length <= TRAN_CAN_CU_E &&
    x.canCuE.every((e) => laObj(e) && laChuoi(e.chunkId, 64) && laChuoi(e.documentId, 64) && laChuoi(e.versionId, 64)) &&
    dsChuoi(x.hoanCanh, TRAN_HOAN_CANH) &&
    (ch === null ||
      (laObj(ch) &&
        ch.loai === 'la-so-cua-ai' &&
        laChuoi(ch.cauHoiGoc, 800) &&
        laObj(ch.doiTuong) &&
        laChuoi(ch.doiTuong.vai, 30) &&
        laChuoi(ch.doiTuong.nhan, 30) &&
        ch.daGiai === false)) &&
    laChuoi(x.laSo, 64) &&
    laChuoi(x.nguoiDung, 64) &&
    laChuoi(x.bamTraLoi, 64) &&
    laChuoi(x.ky, 100);
  return ok ? (x as unknown as MetaLuot) : null;
}

/**
 * Bước 0 của `hieuCauHoi` (spec 6.3): xác thực `luotTruoc`. Nhận khi và chỉ khi đủ bốn điều
 * kiện của spec 2.3 — chữ ký + phiên bản, lá số, người dùng, tin trợ lý cuối.
 */
export function kiemLuotTruoc(
  tho: unknown,
  rb: RangBuocMeta,
  lichSu: readonly TinNhan[],
  phienBan: string
): { meta: MetaLuot | null; bo?: LyDoBoLuotTruoc } {
  if (tho === undefined || tho === null) return { meta: null };
  const khoa = khoaMeta();
  const m = docMetaLuot(tho);
  if (!khoa || !m || m.phienBan !== phienBan) return { meta: null, bo: 'ky' };
  const { ky, ...than } = m;
  const dung = Buffer.from(chuKy(than, khoa));
  const gui = Buffer.from(ky);
  if (dung.length !== gui.length || !timingSafeEqual(dung, gui)) return { meta: null, bo: 'ky' };
  if (m.laSo !== rb.laSo) return { meta: null, bo: 'la-so' };
  if (m.nguoiDung !== rb.nguoiDung) return { meta: null, bo: 'nguoi-dung' };
  const cuoi = [...lichSu].reverse().find((t) => t.vaiTro === 'tro-ly');
  if (!cuoi || bamTraLoi(cuoi.noiDung) !== m.bamTraLoi) return { meta: null, bo: 'luot' };
  return { meta: m };
}

/* ---------------------------------------------- dựng lại gói lượt trước */

/**
 * Gói F### của lượt trước, dựng lại từ đúng tham số đã lưu (spec 2.3). `chonBoiCanh` chỉ đọc
 * `keHoach.cungLienQuan` và `keHoach.lopHan`, nên kế hoạch tối thiểu là đủ; trường khác để rỗng.
 */
export function dungLaiBoiCanh(laSo: LaSo, meta: Pick<MetaLuot, 'keHoach' | 'namHieuLuc' | 'cuaSo'>, thangXem: number): BoiCanhLaSo {
  const keHoach = {
    cungLienQuan: [...meta.keHoach.cungLienQuan],
    lopHan: [...meta.keHoach.lopHan],
  } as KeHoachTruyVan;
  const cuaSo = meta.cuaSo ?? undefined;
  return chonBoiCanh({
    laSo,
    keHoach,
    namXem: meta.namHieuLuc,
    thangXem: cuaSo?.[0]?.thangAm ?? thangXem,
    focused: true,
    ...(cuaSo?.length ? { cuaSo } : {}),
  });
}

/** Mốc thời gian của lượt trước, trạng thái (đã qua / đang / tới) tính lại theo hôm nay */
export function thoiGianTuMeta(meta: Pick<MetaLuot, 'namHieuLuc' | 'cuaSo' | 'thoiGian'>, bayGio: ThoiDiemAm): BoiCanhThoiGian {
  const muc = meta.thoiGian;
  if (muc.loai === 'nam' || !meta.cuaSo?.length) return { namHieuLuc: meta.namHieuLuc, thang: null, cuoiNam: false };
  const trangThai =
    muc.loai === 'thang-duong'
      ? trangThaiThangDuong(muc.nam, muc.thang, ngayDuongCua(bayGio))
      : soVoiBayGio(muc.namAm, muc.thangAm, bayGio);
  return { namHieuLuc: meta.namHieuLuc, thang: { muc, trangThai, cuaSo: meta.cuaSo }, cuoiNam: false };
}

/** Người được hỏi của lượt trước, dựng lại để đọc qua quan hệ (F1) */
export function doiTuongTuMeta(meta: Pick<MetaLuot, 'doiTuong'>): DoiTuongCauHoi | null {
  const d = meta.doiTuong;
  if (!d?.cung) return null;
  return { vai: d.vai as VaiNguoi, nhan: d.nhan, cung: d.cung, loai: 'quan-he' };
}

/* ------------------------------------------------------ 6.1 hỏi lại F2 */

export type KetQuaHoiLai = 'nguoi-duoc-hoi' | 'nguoi-hoi' | 'khong-lien-quan';

const NHAN_HOI_LAI: KetQuaHoiLai[] = ['nguoi-duoc-hoi', 'nguoi-hoi', 'khong-lien-quan'];
const HAN_CHO_MS = 8_000;

const dtCho = (c: ChoHoiLai): DoiTuongCauHoi => ({ vai: c.doiTuong.vai as VaiNguoi, nhan: c.doiTuong.nhan, cung: '', loai: 'van-rieng' });

/** Câu phát lại khi lá số là của người được hỏi: chip 1 của lượt F2 (null → câu gốc) */
export const cauLaSoNguoiDuocHoi = (c: ChoHoiLai): string | null => chipLaSoCuaNguoiDuocHoi(c.cauHoiGoc, dtCho(c));

/**
 * Câu trả lời của người dùng cho câu hỏi lại "lá số này của ai" (spec 6.1). Tất định trước,
 * chỉ dùng bộ nhận dạng sẵn có; không khớp thì hỏi một model nhỏ, lỗi → `khong-lien-quan`.
 * `chuDeTho`: chủ đề planner luật THÔ ra trên câu hiện tại.
 */
export async function giaiHoiLai(cauHoi: string, cho: ChoHoiLai, chuDeTho: ChuDe, nn: NgonNgu): Promise<KetQuaHoiLai> {
  const cau = cauHoi.trim();
  const chip1 = cauLaSoNguoiDuocHoi(cho);
  if (chip1 && cau === chip1.trim()) return 'nguoi-duoc-hoi';
  // Chip 2 so nguyên văn TRƯỚC bộ nhận dạng: "Tôi với con tôi có hợp nhau không?" mang đúng vai
  // và planner thô có thể ra tong-quan, sẽ bị đọc nhầm thành lá số của người được hỏi.
  if (cau === chipQuanHe(dtCho(cho), nn).trim()) return 'khong-lien-quan';
  const nd = nhanDangDoiTuong(cau);
  if (nd && nd.vai === cho.doiTuong.vai && chuDeTho === 'tong-quan') return 'nguoi-duoc-hoi';

  try {
    const { goiVoiFallback } = await import('@/lib/ai/fallback');
    const nhan = cho.doiTuong.nhan;
    const system = `Bạn xác định LÁ SỐ CỦA AI đang mở trong một cuộc trò chuyện Tử Vi. Celes vừa hỏi lại người dùng vì chưa biết lá số đang mở là của chính họ hay của ${nhan} của họ. Đọc câu người dùng vừa gõ, rồi trả DUY NHẤT một nhãn, không giải thích, không rào code:
nguoi-duoc-hoi   lá số đang mở là của ${nhan} (người được hỏi)
nguoi-hoi        lá số đang mở là của chính người dùng
khong-lien-quan  câu không trả lời câu hỏi lại (hỏi sang chuyện khác)`;
    const user = `Câu hỏi gốc: "${cho.cauHoiGoc.slice(0, 300)}"\nCeles hỏi lại: "${cauVanRieng(nn)}"\nNgười dùng vừa gõ: "${cau.slice(0, 300)}"`;
    const kq = await Promise.race([
      goiVoiFallback({ system, user, maxTokens: 60 }),
      new Promise<null>((r) => setTimeout(() => r(null), HAN_CHO_MS)),
    ]);
    const chu = kq?.text.trim().toLowerCase() ?? '';
    return NHAN_HOI_LAI.find((n) => chu === n || chu.startsWith(n)) ?? 'khong-lien-quan';
  } catch {
    return 'khong-lien-quan';
  }
}

/* -------------------------------------------- 6.2 giải thích lượt trước */

/**
 * Câu "vì sao" trỏ về kết luận lượt trước (spec 6.2). Tính trên planner luật THÔ: kế thừa sẽ
 * gán chủ đề cho mọi câu ngắn, model thì không tất định.
 */
export function laGiaiThichLuotTruoc(
  cauHoi: string,
  tho: Pick<KeHoachTruyVan, 'yDinh' | 'chuDe' | 'namMucTieu' | 'thangMucTieu' | 'phamViThoiGian'>,
  meta: MetaLuot | null
): boolean {
  return (
    !!meta?.ketLuanChinh &&
    tho.yDinh === 'giai-thich' &&
    tho.chuDe === 'tong-quan' &&
    !nhanDangDoiTuong(cauHoi) &&
    tho.namMucTieu === undefined &&
    tho.thangMucTieu === undefined &&
    tho.phamViThoiGian === 'khong-ro' &&
    soAmTiet(cauHoi) <= TRAN_AM_TIET_CAU_NGAN
  );
}

/** Claim đi vào prompt: một dòng, ≤200 ký tự (spec 2.3) */
export const claimMotDong = (s: string): string => s.replace(/\s+/g, ' ').trim().slice(0, TRAN_CLAIM);
