/**
 * HỢP ĐỒNG TRẢ LỜI v2 — đường Focused (CEL-186 Answer Contract v2, spec 2.2 + 5.1).
 *
 * Model viết TRỌN bài (`answer`) và khai các kết luận ẩn (`claims`) kèm mã căn cứ.
 * Mã không ghép, không cắt, không thay câu: `answer` là đúng chuỗi người dùng đọc.
 * `claims` không hiển thị — chỉ để validator kiểm và để lưu kết luận chính.
 *
 * Tệp này chỉ có kiểu, hằng và hàm đọc JSON. Luật kiểm nằm ở `kiem.ts`.
 */

import { docObjectJson } from '../doc-json';
import { docChieu, type NhomHuong } from './chot-huong';

/** AnswerClaim */
export interface KetLuan {
  /** Một câu tóm ý, ≤200 ký tự; không bắt trùng nguyên văn answer */
  claim: string;
  /** F### và/hoặc E### (và T### khi có nghiệm lý — luôn kèm ≥1 F###) có trong gói lượt này; ≥1 */
  evidenceIds: string[];
  /** Bắt buộc ở claims[0] khi lượt có hướng engine */
  direction?: NhomHuong;
  /** Mã cửa sổ ('W1', 'W2') hoặc 'nam' — chỉ khi claim nói về một mốc */
  timeRefs?: string[];
}

/** AnswerDraft */
export interface BanNhap {
  /** Văn xuôi hoàn chỉnh, người dùng đọc đúng chuỗi này */
  answer: string;
  /** Ẩn: claims[0] là kết luận chính */
  claims: KetLuan[];
  /** 0–3 chip */
  suggestedQuestions: string[];
  /** Câu hoàn toàn ngoài đời sống cá nhân: miễn KHONG_CAN_CU */
  outOfScope?: boolean;
  /** ≤3 nhãn ngắn ≤6 từ ("đang thất nghiệp") — lượt sau dùng */
  hoanCanhNhanRa?: string[];
}

export type MaLoiCung =
  | 'SCHEMA'
  | 'KHONG_CAN_CU'
  | 'MA_KHONG_HOP_LE'
  | 'TEN_NGOAI_GOI'
  | 'LUU_HOA'
  | 'TEN_BIA'
  | 'MOC_BIA'
  | 'MOC_NHO_HON_NAM'
  | 'PHAN_TRAM'
  | 'CHAC_CHAN_GIA'
  | 'CHON_HO'
  | 'LO_NGUON'
  | 'LO_MA'
  | 'NGUOC_HUONG'
  | 'THIEU_THANG'
  // CEL-196: claim dẫn T### mà không dẫn F###
  | 'T_THIEU_F'
  // Tầng C (CEL-191): chỉ đo, không chặn
  | 'GIONG_BAO_CAO'
  | 'PHAN_QUYET';

/**
 * Tầng của mã lỗi (CEL-191 §7). A = sai sự thật / hợp đồng, B = vi phạm chính sách: cả hai viết lại
 * một lần, vẫn sai thì 502. C = chất lượng: chỉ ghi điểm vào vết, KHÔNG viết lại, KHÔNG chặn.
 */
export type TangLoi = 'A' | 'B' | 'C';
export const TANG_CUA: Record<MaLoiCung, TangLoi> = {
  SCHEMA: 'A',
  KHONG_CAN_CU: 'A',
  MA_KHONG_HOP_LE: 'A',
  TEN_NGOAI_GOI: 'A',
  LUU_HOA: 'A',
  TEN_BIA: 'A',
  MOC_BIA: 'A',
  MOC_NHO_HON_NAM: 'A',
  NGUOC_HUONG: 'A',
  THIEU_THANG: 'A',
  LO_MA: 'A',
  T_THIEU_F: 'A',
  CHON_HO: 'B',
  PHAN_TRAM: 'B',
  CHAC_CHAN_GIA: 'B',
  LO_NGUON: 'B',
  GIONG_BAO_CAO: 'C',
  PHAN_QUYET: 'C',
};

export interface LoiCung {
  ma: MaLoiCung;
  tang: TangLoi;
  /** Mô tả cho prompt viết lại — KHÔNG chép câu người dùng, KHÔNG ghi vào vết */
  chiTiet: string;
  /** ≤60 ký tự quanh chỗ lỗi trong answer, chỉ để đưa vào prompt viết lại */
  doan?: string;
}

export const CLAIM_TOI_DA = 200;
const HOAN_CANH_TOI_DA = 3;
const HOAN_CANH_TU_TOI_DA = 6;

const chuoi = (x: unknown) => (typeof x === 'string' ? x.trim() : '');
const dsChuoi = (x: unknown) => (Array.isArray(x) ? x.map(chuoi).filter(Boolean) : []);

/**
 * Đọc bản nháp. Không đọc được object JSON thì `null` (lỗi SCHEMA). Trường sai
 * kiểu bị bỏ, KHÔNG đoán thay: `answer` rỗng vẫn trả về để validator báo SCHEMA.
 */
export function docBanNhap(text: string): BanNhap | null {
  const o = docObjectJson(text);
  if (!o) return null;
  const claims: KetLuan[] = Array.isArray(o.claims)
    ? o.claims.flatMap((c): KetLuan[] => {
        if (!c || typeof c !== 'object') return [];
        const r = c as Record<string, unknown>;
        const claim = chuoi(r.claim);
        if (!claim) return [];
        const direction = docChieu(r.direction);
        const timeRefs = dsChuoi(r.timeRefs);
        return [
          {
            claim: claim.slice(0, CLAIM_TOI_DA),
            evidenceIds: dsChuoi(r.evidenceIds),
            ...(direction ? { direction } : {}),
            ...(timeRefs.length ? { timeRefs } : {}),
          },
        ];
      })
    : [];
  const hoanCanh = dsChuoi(o.hoanCanhNhanRa)
    .filter((h) => h.split(/\s+/u).length <= HOAN_CANH_TU_TOI_DA)
    .slice(0, HOAN_CANH_TOI_DA);
  return {
    answer: typeof o.answer === 'string' ? o.answer.normalize('NFC').trim() : '',
    claims,
    suggestedQuestions: dsChuoi(o.suggestedQuestions),
    ...(o.outOfScope === true ? { outOfScope: true } : {}),
    ...(hoanCanh.length ? { hoanCanhNhanRa: hoanCanh } : {}),
  };
}
