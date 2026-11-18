import { docObjectJson } from '../doc-json';
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
import { docBanNhap, type BanNhap, type LoiCung, type MaLoiCung } from './hop-dong';
import { chonChip, kiemBaTang, type NguCanhKiem } from './kiem';
import { dungPromptFocused, type DauVaoPromptFocused } from './prompt';
import type { LanGoiVet } from './vet';
import { bienTapG } from './demo-g';
import { coDoanSaoGoc, LOI_DOAN_SAO_GOC } from './demo-k';

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
  /** Lỗi CHẶN (tầng A ∪ B) của bản cuối (rỗng = sạch) */
  loi: LoiCung[];
  /** Điểm tầng C của bản cuối — chỉ đo, không viết lại (CEL-191 §7) */
  diemC: { ma: MaLoiCung; dem: number }[];
  /** Từng lần gọi model: thời gian, token, mã lỗi (vết Preview, spec 5.4) */
  lan: LanGoiVet[];
  /** Đầu vào prompt của lượt (tham chiếu, không chép) — chỉ cho bộ đo dựng lại chữ model thấy (oracle tên) */
  dauVaoPrompt?: DauVaoPromptFocused;
  /** DEMO_G: kết quả lượt biên tập */
  bienTap?: { dung: boolean; lyDo: string; nhap: string; ms: number };
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
  const vet: VetFocused = { lanGoi: 0, thuLai: null, loi: [], diemC: [], lan: [], dauVaoPrompt: v.prompt };
  let provider = '';
  let model = '';
  let ban: BanNhap | null = null;
  let truoc: { answer: string; loi: LoiCung[] } | undefined;
  let duPhong: BanNhap | null = null;

  for (let lan = 0; lan < 2; lan++) {
    const conLai = hanChot - Date.now();
    if (lan > 0 && conLai < TOI_THIEU_THU_LAI_MS) break;

    const { system, user } = dungPromptFocused({ ...v.prompt, vietLai: truoc });
    if (process.env.DEMO_DUMP) require('fs').appendFileSync(process.env.DEMO_DUMP, `

######## LAN ${lan}
######## SYSTEM
${system}
######## USER
${user}
`);
    vet.lanGoi += 1;
    const t0 = Date.now();
    const kq = await goi({ system, user, maxTokens: MAX_TOKENS }, undefined, Math.max(conLai, 1));
    provider = kq.provider;
    model = kq.model;

    const doc = docBanNhap(kq.text);
    if (process.env.DEMO_DONG === '1' && !doc) ((vet as unknown as Record<string, unknown>).tho ??= [] as string[], ((vet as unknown as Record<string, string[]>).tho).push(kq.text));
    if (process.env.DEMO_DONG === '1') (vet as unknown as Record<string, unknown>).docGiaiDoan = (docObjectJson(kq.text) as Record<string, unknown> | null)?.docGiaiDoan;
    // v18: dặn "viết \n\n (dạng thoát)" thì có lượt model thoát hai lần — chữ "\n" thô lộ ra bài (C2/1).
    const banDoc = doc ? { ...doc, answer: boMarkdown(doc.answer.replace(/\\n/g, '\n')) } : null;
    const { chan: loi, do: diemC } = kiemBaTang(banDoc, v.ctx);
    // DEMO_DONG v10: model để cân nhắc theo tuổi chỉ trong "docGiaiDoan", bài thành chung cho mọi tuổi
    // (C1 v10 lần 4). Cho viết lại một lần; lần hai hỏng thì vẫn dùng bản này — không bao giờ ra rỗng vì nó.
    if (process.env.DEMO_DONG === '1' && lan === 0 && !loi.length && banDoc && !/tuổi|chặng|đại vận/u.test(banDoc.answer)) {
      duPhong = banDoc;
      loi.push({ ma: 'THIEU_DOC_TUOI', tang: 'C', chiTiet: 'Bài chưa có đoạn nào cho thấy chuyện năm nay mang hình dạng gì ở tuổi, chặng đời của người hỏi; phần cân nhắc trong "docGiaiDoan" phải lộ ra trong bài. Giữ nguyên kết luận và câu đầu, thêm ý đó.' } as unknown as LoiCung);
    }
    // v17: biên tập bắt được đoạn tả sao gốc nhưng hai lần không gỡ được thì rơi về nháp — nháp có sẵn đoạn
    // ấy (5/8). Bắt từ nháp, cùng cách THIEU_DOC_TUOI: viết lại một lần, hỏng thì vẫn dùng bản này.
    if (process.env.DEMO_K === '1' && lan === 0 && !loi.length && banDoc && coDoanSaoGoc(v.ctx.nghieng, banDoc.answer)) {
      duPhong ??= banDoc;
      loi.push({ ma: 'DOAN_SAO_GOC', tang: 'C', chiTiet: `Bài ${LOI_DOAN_SAO_GOC}. Giữ nguyên kết luận và câu đầu.` } as unknown as LoiCung);
    }
    vet.lan.push({ stt: lan === 0 ? 1 : 2, ms: Date.now() - t0, tokVao: kq.tokensIn, tokRa: kq.tokensOut, loi: loi.map((l) => ({ ma: l.ma })) });
    vet.loi = loi;
    vet.diemC = diemC;
    if (!loi.length) {
      ban = banDoc;
      break;
    }
    if (lan === 0) vet.thuLai = loi.map((l) => l.ma).join(',');
    truoc = { answer: banDoc?.answer ?? '', loi };
  }

  if (!ban && duPhong) ban = duPhong;

  if (ban && process.env.DEMO_G === '1') {
    const bt = await bienTapG({ ban, ctx: v.ctx, cauHoi: v.prompt.cauHoiGoc, goi });
    vet.bienTap = bt.vet;
    ban = bt.ban;
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
