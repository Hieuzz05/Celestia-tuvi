/**
 * CHẠY MỘT LƯỢT MODEL — đường Focused (CEL-186 vé B, mục 5–6, 15 L2).
 *
 * gọi model → đọc JSON → sửa câu chỉ trượt vì tiếng lóng (luật 11) → guard →
 * hết câu / quá dài / JSON gãy thì thử lại MỘT lần → vẫn hỏng thì `van: ''`
 * (route coi là hỏng: 502 + hoàn lượt, như đường STANDARD).
 *
 * Không nuốt `VuotNganSachError`: script eval cần nó nổi lên để dừng cả bộ (15 S3).
 * Cả lượt có MỘT hạn chót; lần thử lại không bắt đầu khi còn quá ít thời gian.
 */

import { goiVoiFallback } from '@/lib/ai/fallback';
import { datMienTruTamLy } from '../an-toan';
import { datMienTruTheoNgonNgu } from './ngon-ngu';
import { suaCauTiengLong } from '../sua-chua';
import { kiemLuot, kiemMotCau, lamSach, type BanThoFocused, type KetQuaKiem, type NguCanhKiem } from './kiem';
import { docFocused, dungPromptFocused, type DauVaoPromptFocused } from './prompt';

/** Cùng ngân sách token với đường STANDARD — token suy nghĩ trừ vào đây (tra-loi.ts) */
const MAX_TOKENS = 6000;
/** Trần của route là 60 giây; chừa 10 giây cho phần còn lại, như `goiVoiFallback` mặc định */
export const HAN_CHOT_LUOT_MS = 50_000;
/** Còn ít hơn chừng này thì không thử lại — một lượt gọi không kịp xong tệ hơn không gọi */
const TOI_THIEU_THU_LAI_MS = 16_000;
/**
 * Lý do thử lại mà bản cuối vẫn mắc thì là HỎNG (502 + hoàn lượt), không dùng
 * tạm: hết câu có căn cứ; hỏi một tháng mà không còn câu nguyệt hạn (04/10).
 */
const HONG_NEU_CON = new Set(['het-cau', 'thieu-nguyet-han']);
const laHong = (ly: string | null) => !!ly && HONG_NEU_CON.has(ly);

export interface VetFocused {
  lanGoi: number;
  /** Lý do lần đầu trượt, nếu có thử lại */
  thuLai: string | null;
  boCau: KetQuaKiem['bo'];
  dungDuPhong: boolean;
  lyDoThayChot?: string;
  soCauSuaTiengLong: number;
  soAmTiet: number;
}

export interface KetQuaChayFocused {
  /** Rỗng = hỏng, route trả 502 và hoàn lượt */
  van: string;
  chip: string[];
  kiem: KetQuaKiem | null;
  provider: string;
  model: string;
  doTreMs: number;
  vet: VetFocused;
}

/** Dựng văn: đoạn một là câu mã + câu chốt, đoạn hai là căn cứ. DEEP thì chia ba câu một đoạn. */
export function ghepVan(cauMa: readonly string[], k: Pick<KetQuaKiem, 'cauChot' | 'cau'>, sau: boolean): string {
  const dau = [...cauMa, k.cauChot].filter(Boolean).join(' ');
  const than = k.cau.map((c) => c.noiDung);
  const doan: string[] = [];
  if (dau) doan.push(dau);
  const co = sau ? 3 : than.length || 1;
  for (let i = 0; i < than.length; i += co) doan.push(than.slice(i, i + co).join(' '));
  return doan.join('\n\n');
}

/**
 * Luật 11: câu (kể cả câu chốt) trượt DUY NHẤT vì tiếng lóng thì nhờ model viết
 * lại đúng câu đó, đưa kèm tên dữ kiện để nó không phải tự nghĩ tên. Sửa hỏng
 * thì `suaCauTiengLong` trả nguyên câu, và guard sẽ bỏ nó như thường.
 */
async function suaTiengLong(ban: BanThoFocused, ctx: NguCanhKiem, ten: string[]): Promise<[BanThoFocused, number]> {
  const chiLong = (s: string, chot: boolean) => {
    const ly = kiemMotCau(lamSach(s), ctx, chot);
    return ly.length === 1 && ly[0] === 'tieng-long';
  };
  let dem = 0;
  const sua = async (s: string, chot: boolean) => {
    if (!s || !chiLong(s, chot)) return s;
    dem += 1;
    return suaCauTiengLong(s, ten);
  };
  const cauChot = await sua(ban.cauChot, true);
  const cau = await Promise.all(ban.cau.map(async (c) => ({ ...c, noiDung: await sua(c.noiDung, false) })));
  return [{ ...ban, cauChot, cau }, dem];
}

export async function chayFocused(v: {
  prompt: DauVaoPromptFocused;
  ctx: NguCanhKiem;
  /** Tên dữ kiện đưa cho lớp sửa tiếng lóng */
  tenSua: string[];
  batDau?: number;
  /** Chỉ test tiêm vào (ca "không còn câu có căn cứ → thử lại → 502"); sản phẩm dùng mặc định. */
  goi?: typeof goiVoiFallback;
}): Promise<KetQuaChayFocused> {
  const goi = v.goi ?? goiVoiFallback;
  const batDau = v.batDau ?? Date.now();
  const hanChot = batDau + HAN_CHOT_LUOT_MS;
  const vet: VetFocused = { lanGoi: 0, thuLai: null, boCau: [], dungDuPhong: false, soCauSuaTiengLong: 0, soAmTiet: 0 };
  let provider = '';
  let model = '';
  let kiem: KetQuaKiem | null = null;
  let lyDo: string | null = null;

  for (let lan = 0; lan < 2; lan++) {
    const conLai = hanChot - Date.now();
    if (lan > 0 && conLai < TOI_THIEU_THU_LAI_MS) break;

    const { system, user } = dungPromptFocused({ ...v.prompt, lyDoThuLai: lan > 0 ? (lyDo ?? undefined) : undefined });
    vet.lanGoi += 1;
    const kq = await goi({ system, user, maxTokens: MAX_TOKENS }, undefined, Math.max(conLai, 1));
    provider = kq.provider;
    model = kq.model;

    const ban = docFocused(kq.text);
    if (!ban) {
      lyDo = 'json-gay';
    } else {
      const [daSua, soSua] = await suaTiengLong(ban, v.ctx, v.tenSua);
      vet.soCauSuaTiengLong += soSua;
      const k = kiemLuot(daSua, v.ctx);
      lyDo = k.thuLai;
      // Bản "quá dài" vẫn dùng được (đã cắt tới trần câu) — giữ lại phòng lần thử lại gãy.
      if (!kiem || !laHong(k.thuLai)) kiem = k;
      if (!lyDo) break;
    }
    if (lan === 0) vet.thuLai = lyDo;
  }

  const doTreMs = Date.now() - batDau;
  // Chỉ "hết câu", "thiếu nguyệt hạn" (hoặc chưa đọc được bản nào) là hỏng; "quá dài" dùng bản đã cắt.
  const hong = !kiem || laHong(kiem.thuLai);
  if (kiem) {
    vet.boCau = kiem.bo;
    vet.dungDuPhong = kiem.dungDuPhong;
    vet.lyDoThayChot = kiem.lyDoThayChot;
    vet.soAmTiet = kiem.soAmTiet;
  }
  if (hong) return { van: '', chip: [], kiem, provider, model, doTreMs, vet };

  const vanTho = ghepVan(v.ctx.cauMa, kiem!, v.ctx.phanLoai.sau);
  // 15 L2: miễn trừ nối SAU guard độ dài, để không bị cắt và không bị đếm.
  const van =
    v.ctx.mucAnToan === 'SENSITIVE'
      ? datMienTruTheoNgonNgu(vanTho, v.ctx.ngonNgu ?? 'vi', datMienTruTamLy)
      : vanTho;
  return { van, chip: kiem!.chip, kiem, provider, model, doTreMs, vet };
}
