/**
 * CHẠY MỘT LƯỢT MODEL — đường Focused (CEL-186 Answer Contract v2, spec 5.3).
 *
 * gọi model → đọc `BanNhap` → validator cứng → trượt thì viết lại TOÀN bài một
 * lần (kèm lỗi) → vẫn trượt / hết giờ thì `van: ''` (route coi là hỏng: 502 +
 * hoàn lượt, như đường STANDARD). Không cắt câu, không văn dự phòng của mã, không
 * trả bản lần một "tốt nhất có thể".
 *
 * Không nuốt `VuotNganSachError`: script eval cần nó nổi lên để dừng cả bộ (15 S3).
 * Cả lượt có MỘT hạn chót; lần viết lại không bắt đầu khi còn quá ít thời gian.
 */

import { goiVoiFallback } from '@/lib/ai/fallback';
import { datMienTruTamLy } from '../an-toan';
import { boMarkdown } from '../sua-chua';
import { datMienTruTheoNgonNgu } from './ngon-ngu';
import { docBanNhap, type BanNhap, type LoiCung } from './hop-dong';
import { chonChip, kiemCung, type NguCanhKiem } from './kiem';
import { dungPromptFocused, type DauVaoPromptFocused } from './prompt';
import type { LanGoiVet } from './vet';

/** Cùng ngân sách token với đường STANDARD — token suy nghĩ trừ vào đây (tra-loi.ts) */
const MAX_TOKENS = 6000;
/** Trần của route là 60 giây; chừa 10 giây cho phần còn lại, như `goiVoiFallback` mặc định */
export const HAN_CHOT_LUOT_MS = 50_000;
/** Còn ít hơn chừng này thì không viết lại — một lượt gọi không kịp xong tệ hơn không gọi */
const TOI_THIEU_THU_LAI_MS = 16_000;

export interface VetFocused {
  lanGoi: number;
  /** Mã lỗi lần một (nối bằng dấu phẩy), nếu có viết lại */
  thuLai: string | null;
  /** Lỗi cứng của bản cuối (rỗng = sạch) */
  loi: LoiCung[];
  /** Từng lần gọi model: thời gian, token, mã lỗi (vết Preview, spec 5.4) */
  lan: LanGoiVet[];
  /** Đầu vào prompt của lượt (tham chiếu, không chép) — chỉ cho bộ đo dựng lại chữ model thấy (oracle tên) */
  dauVaoPrompt?: DauVaoPromptFocused;
}

export interface KetQuaChayFocused {
  /** Rỗng = hỏng, route trả 502 và hoàn lượt */
  van: string;
  chip: string[];
  /** Bản nháp đã qua validator — null khi hỏng */
  banNhap: BanNhap | null;
  provider: string;
  model: string;
  doTreMs: number;
  vet: VetFocused;
}

export async function chayFocused(v: {
  prompt: DauVaoPromptFocused;
  ctx: NguCanhKiem;
  batDau?: number;
  /** Chỉ test tiêm vào (ca "trượt → viết lại → 502"); sản phẩm dùng mặc định. */
  goi?: typeof goiVoiFallback;
}): Promise<KetQuaChayFocused> {
  const goi = v.goi ?? goiVoiFallback;
  const batDau = v.batDau ?? Date.now();
  const hanChot = batDau + HAN_CHOT_LUOT_MS;
  const vet: VetFocused = { lanGoi: 0, thuLai: null, loi: [], lan: [], dauVaoPrompt: v.prompt };
  let provider = '';
  let model = '';
  let ban: BanNhap | null = null;
  let truoc: { answer: string; loi: LoiCung[] } | undefined;

  for (let lan = 0; lan < 2; lan++) {
    const conLai = hanChot - Date.now();
    if (lan > 0 && conLai < TOI_THIEU_THU_LAI_MS) break;

    const { system, user } = dungPromptFocused({ ...v.prompt, vietLai: truoc });
    vet.lanGoi += 1;
    const t0 = Date.now();
    const kq = await goi({ system, user, maxTokens: MAX_TOKENS }, undefined, Math.max(conLai, 1));
    provider = kq.provider;
    model = kq.model;

    const doc = docBanNhap(kq.text);
    const banDoc = doc ? { ...doc, answer: boMarkdown(doc.answer) } : null;
    const loi = kiemCung(banDoc, v.ctx);
    vet.lan.push({ stt: lan === 0 ? 1 : 2, ms: Date.now() - t0, tokVao: kq.tokensIn, tokRa: kq.tokensOut, loi: loi.map((l) => ({ ma: l.ma })) });
    vet.loi = loi;
    if (!loi.length) {
      ban = banDoc;
      break;
    }
    if (lan === 0) vet.thuLai = loi.map((l) => l.ma).join(',');
    truoc = { answer: banDoc?.answer ?? '', loi };
  }

  const doTreMs = Date.now() - batDau;
  if (!ban) return { van: '', chip: [], banNhap: null, provider, model, doTreMs, vet };

  // Câu mã đứng đầu (E, tháng dương, cuối năm, danh tính bạn đời) — commit E/G gỡ dần.
  const vanTho = [v.ctx.cauMa.join(' '), ban.answer].filter(Boolean).join('\n\n');
  const van =
    v.ctx.mucAnToan === 'SENSITIVE'
      ? datMienTruTheoNgonNgu(vanTho, v.ctx.ngonNgu ?? 'vi', datMienTruTamLy)
      : vanTho;
  return { van, chip: chonChip(ban.suggestedQuestions, v.ctx), banNhap: ban, provider, model, doTreMs, vet };
}
