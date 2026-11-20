/**
 * CHẠY MỘT LƯỢT MODEL — đường Focused (CEL-186 Answer Contract v2, spec 5.3).
 *
 * gọi model → đọc `BanNhap` → validator cứng → trượt thì viết lại TOÀN bài một
 * lần (kèm lỗi) → vẫn trượt / hết giờ thì `van: ''` (route coi là hỏng: 502 +
 * hoàn lượt, như đường STANDARD). Không văn dự phòng của mã, không trả bản lần một
 * "tốt nhất có thể".
 *
 * NGOẠI LỆ — lỗi TỪ NGỮ (tầng B: chữ cấm, nói quá chắc, chọn hộ, phần trăm, lộ nguồn) KHÔNG BAO GIỜ
 * làm mất câu trả lời (chủ dự án quyết 21/11/2026, CELES-95): người dùng thấy "chưa trả lời được" vì
 * một chữ "nhịp" là tưởng app hỏng. Bản cuối chỉ còn lỗi tầng B thì sửa riêng câu còn chữ cấm (nếu
 * còn giờ), rồi vẫn trả bài và ghi vết. Chỉ lỗi tầng A (sai dữ kiện / hợp đồng) mới còn ra 502.
 *
 * Không nuốt `VuotNganSachError`: script eval cần nó nổi lên để dừng cả bộ (15 S3).
 * Cả lượt có MỘT hạn chót; lần viết lại không bắt đầu khi còn quá ít thời gian.
 */

import { goiVoiFallback } from '@/lib/ai/fallback';
import { datMienTruTamLy } from '../an-toan';
import { cacChuLopHan, loiChuLopHan } from '../kiem-lop-han';
import { boMarkdown, demChuRao, suaCauTiengLong } from '../sua-chua';
import { quetTen } from './quet-ten';
import { datMienTruTheoNgonNgu } from './ngon-ngu';
import { docBanNhap, type BanNhap, type LoiCung, type MaLoiCung } from './hop-dong';
import { chonChip, kiemBaTang, lamMemDoChac, type NguCanhKiem } from './kiem';
import { dungPromptFocused, type DauVaoPromptFocused } from './prompt';
import type { LanGoiVet } from './vet';

/** Cùng ngân sách token với đường STANDARD — token suy nghĩ trừ vào đây (tra-loi.ts) */
const MAX_TOKENS = 6000;
/** Trần của route là 60 giây; chừa 10 giây cho phần còn lại, như `goiVoiFallback` mặc định */
export const HAN_CHOT_LUOT_MS = 50_000;
/** Còn ít hơn chừng này thì không viết lại — một lượt gọi không kịp xong tệ hơn không gọi */
const TOI_THIEU_THU_LAI_MS = 16_000;
/** Lượt sửa riêng câu chữ cấm ngắn (≤900 token ra); còn ít hơn chừng này thì trả luôn bản đang có. */
const TOI_THIEU_SUA_CAU_MS = 6_000;

const HOA = /H(?:óa|oá)\s+(Lộc|Quyền|Khoa|Kỵ)/gu;
const demHoa = (s: string) => {
  const dem = new Map<string, number>();
  for (const m of s.normalize('NFC').matchAll(HOA)) dem.set(m[1], (dem.get(m[1]) ?? 0) + 1);
  return dem;
};
/**
 * Bản sửa câu (model viết lại vài câu chữ cấm) có giữ nghĩa bài không (celes-domain 21/11): không
 * mất / thêm tứ hoá nào, không thêm tên sao–cung mới, không bớt chữ rào (điều kiện, cảnh báo, Kỵ).
 * Không giữ được thì dùng bản cũ — trả bài còn chữ cấm vẫn hơn trả bài sai nghĩa.
 */
export function giuNghia(goc: string, moi: string): boolean {
  const a = demHoa(goc);
  const b = demHoa(moi);
  if (a.size !== b.size || [...a].some(([k, n]) => b.get(k) !== n)) return false;
  const tenGoc = new Set(quetTen(goc).map((t) => t.ten));
  if (quetTen(moi).some((t) => !tenGoc.has(t.ten))) return false;
  return demChuRao(moi) >= demChuRao(goc);
}

export interface VetFocused {
  lanGoi: number;
  /** Mã lỗi lần một (nối bằng dấu phẩy), nếu có viết lại */
  thuLai: string | null;
  /** Lỗi tầng A ∪ B của bản cuối (rỗng = sạch). Văn khác rỗng mà còn lỗi = chỉ lỗi từ ngữ (CELES-95). */
  loi: LoiCung[];
  /** CELES-95: bài vẫn trả dù còn lỗi từ ngữ — mã lỗi còn lại, để đo tỉ lệ lọt */
  traKemLoiChu?: MaLoiCung[];
  /** CELES-95: lượt sửa riêng câu chữ cấm (thời gian, bản sửa có được nhận không, sau đó còn chữ không) */
  suaCau?: { ms: number; nhan: boolean; conChu: boolean };
  /** CELES-95: đã thử làm mềm cụm nói quá chắc / phần trăm — true = bản làm mềm được nhận */
  lamMem?: boolean;
  /** Cụm chữ cấm còn trong bản cuối (chữ của danh sách cố định, không phải câu người dùng) */
  chuBat?: string[];
  /** Điểm tầng C của bản cuối — chỉ đo, không viết lại (CEL-191 §7) */
  diemC: { ma: MaLoiCung; dem: number }[];
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
  const vet: VetFocused = { lanGoi: 0, thuLai: null, loi: [], diemC: [], lan: [], dauVaoPrompt: v.prompt };
  let provider = '';
  let model = '';
  let ban: BanNhap | null = null;
  let truoc: { answer: string; loi: LoiCung[] } | undefined;
  let chiLoiChu: BanNhap | null = null;

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
    const { chan: loi, do: diemC } = kiemBaTang(banDoc, v.ctx);
    vet.lan.push({ stt: lan === 0 ? 1 : 2, ms: Date.now() - t0, tokVao: kq.tokensIn, tokRa: kq.tokensOut, loi: loi.map((l) => ({ ma: l.ma })) });
    vet.loi = loi;
    vet.diemC = diemC;
    if (!loi.length) {
      ban = banDoc;
      break;
    }
    // Giữ bản MỚI NHẤT chỉ vướng lỗi từ ngữ; lần hai mà sinh lỗi dữ kiện thì bản lần một vẫn dùng được.
    if (banDoc && loi.every((l) => l.tang === 'B')) chiLoiChu = banDoc;
    if (lan === 0) vet.thuLai = loi.map((l) => l.ma).join(',');
    truoc = { answer: banDoc?.answer ?? '', loi };
  }

  // CELES-95: không có bản sạch nhưng có bản chỉ vướng lỗi từ ngữ → không bao giờ 502 vì chữ.
  if (!ban && chiLoiChu) {
    let chon = chiLoiChu;
    let { chan, do: diemC } = kiemBaTang(chon, v.ctx);
    // Nhận một bản sửa chỉ khi nó KHÔNG sinh lỗi dữ kiện mới và không đổi nghĩa bài.
    const thu = (moi: string): boolean => {
      if (moi === chon.answer || !giuNghia(chon.answer, moi)) return false;
      const kt = kiemBaTang({ ...chon, answer: moi }, v.ctx);
      if (!kt.chan.every((l) => l.tang === 'B')) return false;
      chon = { ...chon, answer: moi };
      chan = kt.chan;
      diemC = kt.do;
      return true;
    };
    const conLai = hanChot - Date.now();
    if (chan.some((l) => l.ma === 'CHU_LOP_HAN') && conLai >= TOI_THIEU_SUA_CAU_MS) {
      const tenTrongBai = [...new Set(quetTen(chon.answer).map((t) => t.ten))];
      const t0 = Date.now();
      const moi = await suaCauTiengLong(chon.answer, tenTrongBai, (c) => !!loiChuLopHan(c), { goi, nganSachMs: conLai });
      const nhan = thu(moi);
      vet.suaCau = { ms: Date.now() - t0, nhan, conChu: chan.some((l) => l.ma === 'CHU_LOP_HAN') };
    }
    // Nói quá chắc / phần trăm: làm mềm bằng mã (không gọi model), chỉ đúng cụm bộ kiểm báo.
    if (chan.some((l) => l.ma === 'CHAC_CHAN_GIA' || l.ma === 'THANG_CHAC_CAO' || l.ma === 'PHAN_TRAM')) {
      vet.lamMem = thu(lamMemDoChac(chon.answer, !!v.ctx.thoiGian.thang));
    }
    ban = chon;
    vet.loi = chan;
    vet.diemC = diemC;
    vet.traKemLoiChu = chan.map((l) => l.ma);
  }
  if (v.ctx.bangHoa) vet.chuBat = cacChuLopHan(ban?.answer ?? truoc?.answer ?? '');

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
