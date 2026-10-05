/**
 * Kiểm `lib/ai/fallback.ts` — vùng dùng chung — sau CEL-186 vé B (cờ #4 của chủ dự án).
 *
 * Vé B thêm AI_GHIM_MODEL và AI_TRAN_USD cho script eval. Câu cần chứng minh:
 * KHÔNG đặt các biến đó thì cách chọn model, thứ tự lùi, ghi nhận sử dụng, lỗi
 * ném ra — y hệt bản trước vé B. `tra-loi.ts` không đổi là chưa đủ: mọi lời gọi
 * model của STANDARD (planner, lời gọi chính, sửa câu) đều đi qua tệp này.
 *
 * Cách làm: SO KHÁC BIỆT. Chép bản hiện tại và bản đóng băng trước vé B
 * (`scripts/dong-bang/fallback-truoc-cel186.ts.txt`, lấy từ origin/main ed85126)
 * vào một thư mục tạm cùng các mô-đun giả (`nguon-cau-hinh`, `providers`,
 * `usage`, `su-co`; `types` là bản thật). Chạy cùng một bộ tình huống trên cả
 * hai, ghi vết mọi lời gọi ra ngoài, rồi so từng byte. Offline, không DB, không model.
 *
 * Một khác biệt có chủ đích, kiểm riêng ở mục 3: khi script đặt AI_NHAN, lượt
 * model HỎNG cũng ghi nhãn "<model>@test" (bản cũ chỉ gắn cho lượt thành công).
 *
 * Cố ý đổi hành vi của fallback.ts? Cập nhật bản đóng băng trong cùng commit và
 * ghi lý do — bài này đỏ là đúng việc của nó.
 *
 * Chạy: npx tsx scripts/test-fallback-giu-nguyen.ts
 */

// Nối bài này vào đồ thị import cho kiem-nhanh (chỉ kiểu, xoá lúc chạy).
import type { KetQuaFallback } from '../lib/ai/fallback';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const hong: string[] = [];
const kiem = (dk: boolean, loi: string) => {
  if (!dk) hong.push(loi);
};

/* ---------------------------------------------------------- mô-đun giả */

const GIA = {
  'nguon-cau-hinh.ts': `
export async function modelKhaDungThuc() {
  const g = (globalThis as any).__fb;
  g.vet.push(['modelKhaDungThuc']);
  return g.danhSach.map((m: any) => ({ ...m }));
}`,
  'providers.ts': `
import { AiRetryableError } from './types';
export async function goiModel(provider: string, model: string, apiKey: string, req: any) {
  const g = (globalThis as any).__fb;
  g.vet.push(['goiModel', provider, model, apiKey, req.maxTokens ?? null]);
  const kq = g.ketQua[provider + '|' + model] ?? 'ok';
  if (kq === 'lui') throw new AiRetryableError('het quota ' + model, 'quota');
  if (kq === 'that') throw new Error('loi that ' + model);
  return { text: 'van ' + model, provider, model, tokensIn: 10, tokensOut: 20 };
}`,
  'usage.ts': `
export const HAN_MUC_NGAY: Record<string, number | null> = { gemini: 20, groq: 900, openai: null };
export function daCanHanMuc(provider: string, n: number) {
  const h = HAN_MUC_NGAY[provider];
  return h !== null && h !== undefined && n >= h - 5;
}
export async function ghiNhanSuDung(...a: unknown[]) { (globalThis as any).__fb.vet.push(['ghiNhanSuDung', ...a]); }
export async function soLuotHomNay() {
  const g = (globalThis as any).__fb;
  g.vet.push(['soLuotHomNay']);
  return { ...g.daDung };
}`,
  'su-co.ts': `
export async function ghiSuCo(x: unknown) { (globalThis as any).__fb.vet.push(['ghiSuCo', x]); }`,
};

const thuMuc = mkdtempSync(join(tmpdir(), 'test-fallback-'));
for (const [ten, ma] of Object.entries(GIA)) writeFileSync(join(thuMuc, ten), ma);
copyFileSync(join(__dirname, '..', 'lib', 'ai', 'types.ts'), join(thuMuc, 'types.ts'));
copyFileSync(join(__dirname, '..', 'lib', 'ai', 'fallback.ts'), join(thuMuc, 'fallback-moi.ts'));
writeFileSync(join(thuMuc, 'fallback-goc.ts'), readFileSync(join(__dirname, 'dong-bang', 'fallback-truoc-cel186.ts.txt')));

/* ---------------------------------------------------------- tình huống */

type MoDun = { goiVoiFallback: (req: unknown, uu?: string, ns?: number) => Promise<KetQuaFallback> };

interface TinhHuong {
  ten: string;
  danhSach: { provider: string; model: string; apiKey: string; priority: number; enabled: boolean }[];
  ketQua?: Record<string, 'ok' | 'lui' | 'that'>;
  daDung?: Record<string, number>;
  uuTien?: string;
  nganSachMs?: number;
  env?: Record<string, string>;
  maxTokens?: number;
}

const m = (provider: string, model: string, priority: number) => ({ provider, model, apiKey: `key-${model}`, priority, enabled: true });
const BA = [m('gemini', 'g1', 1), m('groq', 'q1', 2), m('openai', 'o1', 3)];

const TINH_HUONG: TinhHuong[] = [
  { ten: 'model đầu chạy được', danhSach: BA },
  { ten: 'model đầu hết quota, lùi sang model hai', danhSach: BA, ketQua: { 'gemini|g1': 'lui' } },
  { ten: 'lỗi thật thì dừng, không lùi', danhSach: BA, ketQua: { 'gemini|g1': 'that' } },
  { ten: 'hết cả ba', danhSach: BA, ketQua: { 'gemini|g1': 'lui', 'groq|q1': 'lui', 'openai|o1': 'lui' } },
  { ten: 'ưu tiên model hai', danhSach: BA, uuTien: 'groq|q1' },
  { ten: 'ưu tiên model không có', danhSach: BA, uuTien: 'groq|khong-co' },
  { ten: 'ưu tiên hỏng thì lùi về phần còn lại', danhSach: BA, uuTien: 'openai|o1', ketQua: { 'openai|o1': 'lui' } },
  { ten: 'AI_KHONG_LUI chỉ gọi model ưu tiên', danhSach: BA, uuTien: 'groq|q1', ketQua: { 'groq|q1': 'lui' }, env: { AI_KHONG_LUI: '1' } },
  { ten: 'AI_KHONG_LUI, ưu tiên không có', danhSach: BA, uuTien: 'groq|x', env: { AI_KHONG_LUI: '1' } },
  { ten: 'gemini cạn hạn mức ngày', danhSach: BA, daDung: { gemini: 15 } },
  { ten: 'danh sách rỗng', danhSach: [] },
  { ten: 'ngân sách thời gian 0 sau một lượt hỏng', danhSach: BA, ketQua: { 'gemini|g1': 'lui' }, nganSachMs: 0 },
  { ten: 'có maxTokens', danhSach: BA, maxTokens: 300 },
  { ten: 'AI_NHAN=test, lượt thành công', danhSach: BA, env: { AI_NHAN: 'test' } },
  // Biến của vé B đặt RỖNG phải như không đặt.
  { ten: 'biến eval rỗng', danhSach: BA, ketQua: { 'gemini|g1': 'lui' }, env: { AI_GHIM_MODEL: '', AI_TRAN_USD: '', AI_GIA_VAO_USD: '', AI_GIA_RA_USD: '' } },
];

const BIEN = ['AI_KHONG_LUI', 'AI_NHAN', 'AI_NGAN_SACH_TOKEN', 'AI_GHIM_MODEL', 'AI_TRAN_USD', 'AI_GIA_VAO_USD', 'AI_GIA_RA_USD'];

async function chay(md: MoDun, th: TinhHuong) {
  const cu = Object.fromEntries(BIEN.map((k) => [k, process.env[k]]));
  for (const k of BIEN) delete process.env[k];
  Object.assign(process.env, th.env ?? {});
  const g = { vet: [] as unknown[], danhSach: th.danhSach, ketQua: th.ketQua ?? {}, daDung: th.daDung ?? {} };
  (globalThis as { __fb?: unknown }).__fb = g;
  let ra: unknown;
  try {
    const kq = await md.goiVoiFallback({ system: 'he thong', user: 'cau hoi', maxTokens: th.maxTokens }, th.uuTien, th.nganSachMs);
    ra = { kq };
  } catch (e) {
    ra = { loi: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  } finally {
    for (const k of BIEN) {
      if (cu[k] === undefined) delete process.env[k];
      else process.env[k] = cu[k];
    }
  }
  return JSON.stringify({ ra, vet: g.vet });
}

/* ---------------------------------------------------------------- chạy */

async function main() {
  const url = (ten: string) => pathToFileURL(join(thuMuc, ten)).href;
  const moi = (await import(url('fallback-moi.ts'))) as MoDun;
  const goc = (await import(url('fallback-goc.ts'))) as MoDun;

  // 1. Không đặt biến eval: hai bản ra y hệt nhau.
  for (const th of TINH_HUONG) {
    const a = await chay(goc, th);
    const b = await chay(moi, th);
    kiem(a === b, `"${th.ten}" lệch bản trước vé B:\n    trước: ${a}\n    sau:   ${b}`);
  }

  // 2. Bộ tình huống có chạm đủ các nhánh: không thì "y hệt" chẳng chứng minh gì.
  // Tuần tự: các tình huống dùng chung process.env và vết toàn cục.
  const vetMoi: string[] = [];
  for (const th of TINH_HUONG) vetMoi.push(await chay(moi, th));
  const coVet = (ten: string, x: string) => vetMoi[TINH_HUONG.findIndex((t) => t.ten === ten)].includes(x);
  kiem(coVet('model đầu hết quota, lùi sang model hai', '"goiModel","groq","q1"'), 'tình huống lùi không gọi model hai');
  kiem(coVet('lỗi thật thì dừng, không lùi', 'loi that g1') && !coVet('lỗi thật thì dừng, không lùi', '"q1"'), 'lỗi thật vẫn lùi');
  kiem(coVet('ưu tiên model hai', '"kq":{"text":"van q1"'), 'ưu tiên không đưa model hai lên đầu');
  kiem(coVet('gemini cạn hạn mức ngày', 'lượt miễn phí hôm nay') && !coVet('gemini cạn hạn mức ngày', '"goiModel","gemini"'), 'hạn mức ngày không bỏ qua gemini');
  kiem(coVet('danh sách rỗng', 'KhongCoModelError'), 'danh sách rỗng không ném KhongCoModelError');
  kiem(coVet('ngân sách thời gian 0 sau một lượt hỏng', 'không đủ để thử'), 'ngân sách thời gian không dừng chuỗi');
  kiem(coVet('AI_NHAN=test, lượt thành công', '"g1@test"'), 'AI_NHAN không gắn nhãn');

  // 3. Đổi CÓ CHỦ ĐÍCH, chỉ khi script đặt AI_NHAN (Production không đặt): lượt
  // HỎNG cũng mang nhãn "@test", để ai_usage_logs tách trọn chi phí eval.
  const nhanHong = await chay(moi, { ten: 'nhãn lượt hỏng', danhSach: BA, ketQua: { 'gemini|g1': 'lui' }, env: { AI_NHAN: 'test' } });
  kiem(nhanHong.includes('["ghiNhanSuDung","gemini","g1@test",0,0,true]'), `lượt hỏng thiếu nhãn @test: ${nhanHong}`);

  // 4. Có đặt biến eval: ghim đúng một model, không lùi; trần tiền ném TRƯỚC khi gọi.
  const ghim = await chay(moi, { ten: 'ghim', danhSach: BA, uuTien: 'gemini|g1', ketQua: { 'groq|q1': 'lui' }, env: { AI_GHIM_MODEL: 'groq|q1' } });
  kiem(!ghim.includes('"goiModel","gemini"') && !ghim.includes('"goiModel","openai"') && ghim.includes('"goiModel","groq","q1"'), `ghim vẫn gọi model khác: ${ghim}`);
  const ghimSai = await chay(moi, { ten: 'ghim sai', danhSach: BA, env: { AI_GHIM_MODEL: 'groq|khong-co' } });
  kiem(ghimSai.includes('KhongCoModelError') && !ghimSai.includes('goiModel'), `ghim model không có vẫn gọi: ${ghimSai}`);
  const tran = await chay(moi, { ten: 'trần', danhSach: BA, env: { AI_TRAN_USD: '0.000001', AI_GIA_VAO_USD: '1', AI_GIA_RA_USD: '1' } });
  kiem(tran.includes('VuotNganSachError') && !tran.includes('goiModel'), `trần tiền không chặn trước khi gọi: ${tran}`);
  const thieuGia = await chay(moi, { ten: 'thiếu giá', danhSach: BA, env: { AI_TRAN_USD: '2' } });
  kiem(thieuGia.includes('VuotNganSachError') && !thieuGia.includes('goiModel'), `trần thiếu giá vẫn gọi: ${thieuGia}`);
}

void main()
  .catch((e) => hong.push(`ném lỗi: ${e instanceof Error ? e.stack : e}`))
  .then(() => {
    rmSync(thuMuc, { recursive: true, force: true });
    if (hong.length) {
      console.log(`HỎNG ${hong.length}:`);
      for (const l of hong) console.log(`  - ${l}`);
      process.exit(1);
    }
    console.log(`Tất cả đạt. ${TINH_HUONG.length} tình huống: không đặt biến eval thì fallback.ts y hệt bản trước vé B.`);
  });
