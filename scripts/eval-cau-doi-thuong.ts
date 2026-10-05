/**
 * Bộ 15 câu đời thường — cổng của bước 1 CEL-186 vé B (chủ dự án 04/10).
 *   npx tsx scripts/eval-cau-doi-thuong.ts [--xuat <tệp.json>]
 *
 * GỌI MODEL THẬT, KHÔNG nằm trong CI. Cùng cổng chạy với `eval-focused.ts`: bắt buộc
 * AI_GHIM_MODEL, AI_TRAN_USD (≤ 0.1 cho bộ này), AI_GIA_VAO_USD, AI_GIA_RA_USD.
 *
 * Sinh ra vì lỗi UAT 04/10: eval cũ chấm "ra đúng khuôn D" là PASS trong khi người dùng nhận một
 * câu từ chối. Bộ này chấm GIÁ TRỊ NGƯỜI DÙNG NHẬN ĐƯỢC, kèm vết cho từng câu:
 *   - ý định / chủ đề / khuôn nhận ra;
 *   - có dừng bằng mã trước model không, có tính lượt không;
 *   - model có thấy câu hỏi và lịch sử không;
 *   - dùng dữ kiện nào (mã F### trong câu thân);
 *   - câu "khi nào": không bịa tháng / mùa / quý; câu có kể hoàn cảnh: nhắc tới hoàn cảnh.
 * Câu hỏi nối tiếp (bấm chip) chạy đúng thứ tự, lịch sử là câu trả lời thật của lượt trước.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { lapLaSo, type LaSo } from '../lib/tuvi/ansao';
import { traLoiCoCanCu, type DauVaoTraLoi } from '../lib/rag/tra-loi';
import type { KetQuaFocused } from '../lib/rag/focused/tra-loi-focused';
import { tienDaTinh, VuotNganSachError } from '../lib/ai/fallback';
import type { TinNhan } from '../lib/ai/prompt';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && process.env[k.trim()] === undefined) process.env[k.trim()] = v;
}

const thieu = ['AI_GHIM_MODEL', 'AI_TRAN_USD', 'AI_GIA_VAO_USD', 'AI_GIA_RA_USD'].filter((k) => !process.env[k]?.trim());
if (thieu.length) {
  console.error(`Thiếu ${thieu.join(', ')} — phải ghim model Production và đặt trần tiền.`);
  process.exit(2);
}
if (Number(process.env.AI_TRAN_USD) > 0.1) {
  console.error(`AI_TRAN_USD=${process.env.AI_TRAN_USD} vượt $0.1 — bộ 15 câu không cần hơn.`);
  process.exit(2);
}
process.env.CELES_FOCUSED_CHAT = '1';
process.env.AI_NHAN = 'test';

const i = process.argv.indexOf('--xuat');
const xuat = i !== -1 ? process.argv[i + 1] : null;

/* --------------------------------------------------------------- lá số */

const LA_SO: Record<string, LaSo> = {
  'lon-nam': lapLaSo({ ngay: 14, thang: 3, nam: 1992, gio: 8, gioiTinh: 'nam' }),
  'lon-nu': lapLaSo({ ngay: 2, thang: 9, nam: 1995, gio: 20, gioiTinh: 'nu' }),
  // Lá số đứa con mở trên máy cha mẹ, và hai ca bé dưới 15 tuổi.
  'be-2016': lapLaSo({ ngay: 10, thang: 6, nam: 2016, gio: 10, gioiTinh: 'nam' }),
  'be-2019': lapLaSo({ ngay: 5, thang: 1, nam: 2019, gio: 14, gioiTinh: 'nu' }),
};

/* ---------------------------------------------------------------- ca */

interface Luot {
  cauHoi: string;
  /** Câu này là chip của lượt trước: lấy chip có số thứ tự này thay vì cauHoi. */
  chipSo?: number;
}

interface Ca {
  ma: string;
  laSo: keyof typeof LA_SO;
  luot: Luot[];
  ngonNgu?: 'vi' | 'en';
  /** Lượt cuối được phép dừng bằng mã — tên lối, hoặc null nếu phải tới model. */
  dungMa: string | null;
  /** Lượt cuối là câu "khi nào": không được nêu mốc nhỏ hơn năm. */
  khiNao?: boolean;
  /** Lượt cuối phải nhắc lại hoàn cảnh người hỏi kể. */
  hoanCanh?: RegExp;
  ghiChu: string;
}

const CA: Ca[] = [
  { ma: '01-anh-1', laSo: 'lon-nam', luot: [{ cauHoi: 'khi nào tôi có việc mới' }], dungMa: null, khiNao: true, ghiChu: 'ảnh UAT, câu 1' },
  {
    ma: '02-anh-2', laSo: 'lon-nam',
    luot: [{ cauHoi: 'khi nào tôi có việc mới' }, { cauHoi: 'hiện tại tôi đang thất nghiệp, khi nào thì tìm đc việc mới' }],
    dungMa: null, khiNao: true, hoanCanh: /thất nghiệp|chưa có việc|đang tìm việc|tìm việc/iu, ghiChu: 'ảnh UAT, hỏi lại lần hai, có hoàn cảnh, gõ tắt "đc"',
  },
  { ma: '03-chua-bao-gio', laSo: 'lon-nu', luot: [{ cauHoi: 'Tôi chưa bao giờ có người yêu, năm nay có không?' }], dungMa: null, ghiChu: 'nhận nhầm D' },
  { ma: '04-luc-nao-cung', laSo: 'lon-nam', luot: [{ cauHoi: 'Lúc nào cũng mệt, năm nay sức khỏe tôi thế nào?' }], dungMa: null, ghiChu: 'nhận nhầm D' },
  { ma: '05-nam-nao-cung', laSo: 'lon-nu', luot: [{ cauHoi: 'Năm nào cũng vất vả, năm nay tiền bạc ra sao?' }], dungMa: null, ghiChu: 'nhận nhầm D' },
  { ma: '06-dang-that-nghiep', laSo: 'lon-nu', luot: [{ cauHoi: 'Mình đang thất nghiệp 3 tháng rồi, năm nay công việc có khá lên không?' }], dungMa: null, hoanCanh: /thất nghiệp|chưa có việc|đang tìm việc|tìm việc|quãng nghỉ/iu, ghiChu: 'kể hoàn cảnh' },
  {
    ma: '07-con-toi-f2', laSo: 'be-2016',
    luot: [{ cauHoi: 'Con tôi năm nay học hành thế nào?' }],
    dungMa: 'focused-f2', ghiChu: 'cha mẹ mở lá số con: phải HỎI LẠI, không trừ lượt',
  },
  {
    ma: '08-con-toi-chip', laSo: 'be-2016',
    luot: [{ cauHoi: 'Con tôi năm nay học hành thế nào?' }, { cauHoi: '', chipSo: 0 }],
    dungMa: null, ghiChu: 'MỘT chạm chip đầu → trả lời câu gốc (học hành) trên lá số con',
  },
  { ma: '09-khong-dau', laSo: 'lon-nam', luot: [{ cauHoi: 'nam nay cong viec cua toi the nao' }], dungMa: null, ghiChu: 'không dấu' },
  { ma: '10-hai-y', laSo: 'lon-nu', luot: [{ cauHoi: 'Năm nay công việc và tình cảm của tôi thế nào?' }], dungMa: null, ghiChu: 'hai ý một câu' },
  { ma: '11-en-khi-nao', laSo: 'lon-nam', ngonNgu: 'en', luot: [{ cauHoi: 'When will I find a new job?' }], dungMa: null, khiNao: true, ghiChu: 'tiếng Anh' },
  { ma: '12-be-hoc', laSo: 'be-2019', luot: [{ cauHoi: 'Năm nay tôi học hành thế nào?' }], dungMa: null, ghiChu: 'bé < 15, chuyện hợp tuổi → model' },
  { ma: '13-be-nguoi-yeu', laSo: 'be-2016', luot: [{ cauHoi: 'Khi nào tôi có người yêu?' }], dungMa: 'focused-chua-hop-tuoi', ghiChu: 'bé < 15, AGE-02 ngoại lệ tạm' },
  { ma: '14-chong-la-so-nam', laSo: 'lon-nam', luot: [{ cauHoi: 'Năm nay chuyện vợ chồng của tôi thế nào?' }], dungMa: null, ghiChu: 'PERSON-03 đã bỏ: không dừng' },
  { ma: '15-nam-2027-thang-nao', laSo: 'lon-nam', luot: [{ cauHoi: 'Năm 2027 tháng nào tôi có việc?' }], dungMa: null, khiNao: true, ghiChu: 'D có năm mục tiêu: đọc 2027 mức năm' },
];

/** Mốc nhỏ hơn năm mà câu "khi nào" không được nêu (mức năm, Q3). */
const MOC_NHO = /tháng\s*(?:\d|giêng|chạp|này|sau|tới)|\bmùa\b|\bquý\b|cuối năm|đầu năm|giữa năm|nửa (?:đầu|cuối)|sau Tết|\b(?:month|season|quarter)\b|end of the year|early next/iu;

/* --------------------------------------------------------------- chạy */

interface Vet {
  ma: string;
  ghiChu: string;
  cauHoi: string;
  khuon: string;
  chuDe: string;
  yDinh: string;
  dungBangMa: boolean;
  model: string;
  khongTinhLuot: boolean;
  modelThayCau: boolean | null;
  lichSuChoModel: number | null;
  duKien: number;
  maDung: string[];
  van: string;
  chip: string[];
  dat: boolean;
  loi: string[];
}

async function chayCa(ca: Ca): Promise<Vet> {
  const laSo = LA_SO[ca.laSo];
  const lichSu: TinNhan[] = [];
  let kq: KetQuaFocused | null = null;
  let cauHoi = '';
  for (const [n, l] of ca.luot.entries()) {
    cauHoi = l.chipSo !== undefined ? kq?.coCauTruc?.goiYTiep?.[l.chipSo] ?? '' : l.cauHoi;
    const vao: DauVaoTraLoi = {
      laSo,
      cauHoi,
      namXem: 2026,
      thangXem: 10,
      lichSu: [...lichSu],
      laTiepTuChip: l.chipSo !== undefined,
      ngonNgu: ca.ngonNgu,
      ghiNhatKy: false,
    };
    kq = (await traLoiCoCanCu(vao)) as KetQuaFocused;
    if (n < ca.luot.length - 1) lichSu.push({ vaiTro: 'nguoi-dung', noiDung: cauHoi }, { vaiTro: 'tro-ly', noiDung: kq.van });
  }
  const k = kq as KetQuaFocused;
  const p = k.vetFocused?.dauVaoPrompt;
  const dungBangMa = k.provider === 'ma';
  const yChinh = k.coCauTruc?.yChinh ?? [];
  const loi: string[] = [];
  if (!cauHoi) loi.push('không có chip để bấm');
  if (!k.van) loi.push('502 (văn rỗng)');
  if (ca.dungMa === null && dungBangMa) loi.push(`dừng bằng mã ${k.model} — phải tới model`);
  if (ca.dungMa && (!dungBangMa || k.model !== ca.dungMa)) loi.push(`cần ${ca.dungMa}, ra ${k.provider}/${k.model}`);
  if (dungBangMa && !k.khongTinhLuot && ca.dungMa !== 'focused-nhuan-chua-tach') loi.push('dừng bằng mã mà vẫn tính lượt');
  if (!dungBangMa && p && p.cauHoiGoc !== cauHoi) loi.push('model không thấy đúng câu hỏi');
  if (!dungBangMa && p && p.lichSu.length !== lichSu.length) loi.push(`model thấy ${p.lichSu.length} tin lịch sử, cần ${lichSu.length}`);
  if (ca.khiNao && MOC_NHO.test(k.van)) loi.push(`câu "khi nào" nêu mốc nhỏ hơn năm: ${MOC_NHO.exec(k.van)?.[0]}`);
  if (ca.hoanCanh && !ca.hoanCanh.test(k.van)) loi.push('không nhắc hoàn cảnh người hỏi kể');
  if (ca.ma === '08-con-toi-chip' && !/học|thi|đèn sách/iu.test(k.van)) loi.push('chip một chạm không trả lời câu gốc (học hành)');
  return {
    ma: ca.ma,
    ghiChu: ca.ghiChu,
    cauHoi,
    khuon: k.phienBan.focused ?? '?',
    chuDe: k.goi.chuDe,
    yDinh: k.goi.yDinh,
    dungBangMa,
    model: `${k.provider}/${k.model}`,
    khongTinhLuot: !!k.khongTinhLuot,
    modelThayCau: dungBangMa ? null : p ? p.cauHoiGoc === cauHoi : false,
    lichSuChoModel: dungBangMa ? null : p?.lichSu.length ?? null,
    duKien: k.goi.duKien.length,
    maDung: [...new Set(yChinh.flatMap((y) => y.maDuKien ?? []))],
    van: k.van,
    chip: k.coCauTruc?.goiYTiep ?? [],
    dat: loi.length === 0,
    loi,
  };
}

async function main() {
  const ra: Vet[] = [];
  try {
    for (const ca of CA) {
      const v = await chayCa(ca);
      ra.push(v);
      console.log(`${v.dat ? 'ĐẠT ' : 'HỎNG'} ${v.ma.padEnd(22)} ${v.khuon.padEnd(3)} ${v.model.padEnd(34)} $${tienDaTinh().toFixed(4)}${v.loi.length ? `  ← ${v.loi.join('; ')}` : ''}`);
    }
  } catch (e) {
    if (e instanceof VuotNganSachError) console.error(`Vượt trần tiền ở ca ${ra.length + 1}: $${tienDaTinh().toFixed(4)}`);
    else throw e;
  } finally {
    if (xuat) writeFileSync(xuat, JSON.stringify(ra, null, 2));
  }
  const hong = ra.filter((v) => !v.dat).length;
  console.log(`\n${ra.length - hong}/${CA.length} đạt · tiền $${tienDaTinh().toFixed(4)}${xuat ? ` · vết: ${xuat}` : ''}`);
  process.exit(hong || ra.length < CA.length ? 1 : 0);
}

void main();
