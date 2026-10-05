/**
 * VẾT PREVIEW — đường Focused (CEL-186 Answer Contract v2, spec mục 5.4).
 *
 * Một dòng `[focused-vet] {json}` mỗi lượt, route gọi sau `traLoiCoCanCu`, lên Vercel logs.
 * Không bảng mới, không DB. Ghi CHỈ KHI `CELES_FOCUSED_TRACE=1` VÀ không phải production
 * thật — Production không bao giờ ghi, kể cả khi lỡ đặt cờ.
 *
 * Chỉ mã, số, cờ. KHÔNG ghi: câu hỏi, câu trả lời, claim, đoạn RAG, chi tiết lỗi, nhãn hoàn
 * cảnh, tên người, vai quan hệ — chủ đề + quan hệ + requestId đã là suy luận cá nhân.
 */

import { laProductionThat } from '@/lib/moi-truong-dem';

type Env = Record<string, string | undefined>;

/** Mục tiêu thời gian của lượt — chỉ loại và số, không chữ. */
export type ThoiGianVet =
  | { loai: 'nam'; nam: number }
  | { loai: 'thang-duong'; nam: number; thang: number }
  | { loai: 'thang-am'; namAm: number; thangAm: number; nhuan: boolean };

export interface LanGoiVet {
  stt: 1 | 2;
  ms: number;
  tokVao?: number;
  tokRa?: number;
  loi: { ma: string }[];
}

export interface VetPreview {
  requestId: string;
  phienBan: string;
  loiRa: 'ok' | '502' | `ma-${string}`;
  hieu: {
    chuDe: string;
    yDinh: string;
    khuon: string;
    coDoiTuong: boolean;
    thoiGian: ThoiGianVet;
    nguon: string;
    giaiThichLuotTruoc: boolean;
    coChoHoiLai: boolean;
  };
  /** CHỈ số lượng, không nhãn */
  hoanCanhSo: number;
  cuaSo?: { ma: string; thangAm: number; nhuan: boolean; soNgay: number; nhom?: string }[];
  maDuKien: string[];
  maNguon: string[];
  /** uuid đoạn RAG đã chọn */
  chunkIds: string[];
  lan: LanGoiVet[];
  /** Mã lỗi lần 1 */
  lyDoVietLai?: string[];
  ketQua?: { soKyTu: number; soAmTiet: number; soClaim: number; maClaim: string[]; soChip: number };
  msTong: number;
  msTruyHoi: number;
  usdUocTinh?: number;
  /** Lượt trước bị bỏ vì sao (spec 2.3) */
  luotTruocBo?: string;
  /** Mã E### của lượt trước không còn xuất bản */
  canCuEMat?: number;
  /** Mã F### của lượt trước không dựng lại được */
  canCuFMat?: number;
}

export const vetBat = (env: Env = process.env) => env.CELES_FOCUSED_TRACE === '1' && !laProductionThat(env);

/** Tiền ước tính theo `AI_GIA_VAO_USD` / `AI_GIA_RA_USD` (USD / 1 triệu token) — thiếu giá thì bỏ trống. */
export function usdUocTinh(lan: readonly LanGoiVet[], env: Env = process.env): number | undefined {
  const vao = Number(env.AI_GIA_VAO_USD);
  const ra = Number(env.AI_GIA_RA_USD);
  if (!(vao > 0) || !(ra > 0)) return undefined;
  const usd = lan.reduce((s, l) => s + ((l.tokVao ?? 0) * vao + (l.tokRa ?? 0) * ra) / 1e6, 0);
  return Math.round(usd * 1e6) / 1e6;
}

/** Số âm tiết ≈ số chữ cách nhau bằng khoảng trắng. */
export const demAmTiet = (s: string) => s.split(/\s+/u).filter(Boolean).length;

/** Trả true khi đã ghi. `ghi` chỉ test tiêm vào. */
export function ghiVetPreview(
  vet: VetPreview | undefined,
  env: Env = process.env,
  ghi: (dong: string) => void = (d) => console.info(d)
): boolean {
  if (!vet || !vetBat(env)) return false;
  ghi('[focused-vet] ' + JSON.stringify(vet));
  return true;
}
