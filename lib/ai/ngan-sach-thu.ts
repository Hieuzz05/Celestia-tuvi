import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { closeSync, existsSync, fsyncSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import type { ChatRequest, ChatResult } from './types';
import { AiRetryableError } from './types';
import { docSuDungHomNayBatBuoc, ghiNhanSuDungBatBuoc, type DongSuDungNgay } from './usage';

type Bien = Record<string, string | undefined>;
const CO_THU = ['AI_NHAN', 'AI_NGAN_SACH_TOKEN', 'AI_MUC_DICH'] as const;

/** Có đặt biến thử mà sai/rỗng vẫn là thử: không được rơi về đường production. */
export function laLuotThu(env: Bien = process.env): boolean {
  return CO_THU.some((k) => env[k] !== undefined);
}

export class VuotNganSachError extends Error {
  name = 'VuotNganSachError';
}

export const MODEL_THU_MIEN_PHI = new Set([
  'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b',
]);

export function modelThuDuocPhep(provider: string, model: string): boolean {
  return provider === 'groq' && MODEL_THU_MIEN_PHI.has(model);
}

/*
 * NGOẠI LỆ CÓ PHÍ (22/10/2026, docs/chien-luoc/kho-tri-thuc-to-be-2026-10.md mục "Duyệt 22/10"): lượt thử
 * được gọi ĐÚNG MỘT model trả phí đã ghim (`AI_GHIM_MODEL`) khi đặt đủ trần tiền cứng `AI_TRAN_USD` và giá
 * `AI_GIA_VAO_USD` / `AI_GIA_RA_USD`. Thiếu một biến là không có ngoại lệ, X1 chặn như cũ. Không phải lượt
 * thử (production) thì không bao giờ có ngoại lệ này.
 * Chỉ mở bên trong `trongCuaCoPhi` — fallback.ts gọi nó SAU khi đã giữ chỗ tiền; gọi provider trực tiếp
 * (ngoài fallback, không giữ chỗ) vẫn bị chặn.
 */
export function luotThuCoPhi(env: Bien = process.env): string | null {
  if (!laLuotThu(env)) return null;
  const ghim = (env.AI_GHIM_MODEL ?? '').trim();
  const duong = (k: string) => Number(env[k]) > 0;
  return ghim && duong('AI_TRAN_USD') && duong('AI_GIA_VAO_USD') && duong('AI_GIA_RA_USD') ? ghim : null;
}

const cuaCoPhi = new AsyncLocalStorage<string>();

/** fallback.ts bọc lời gọi đã giữ chỗ tiền: chỉ lời gọi này (theo ngữ cảnh async) được qua cửa có phí */
export function trongCuaCoPhi<T>(provider: string, model: string, fn: () => Promise<T>): Promise<T> {
  return cuaCoPhi.run(`${provider}|${model}`, fn);
}

export function duocGoiCoPhi(provider: string, model: string): boolean {
  const ghim = luotThuCoPhi();
  return !!ghim && ghim === `${provider}|${model}` && cuaCoPhi.getStore() === ghim;
}

function soDuong(env: Bien, ten: string): number {
  const n = Number(env[ten]);
  if (!Number.isSafeInteger(n) || n <= 0) throw new VuotNganSachError(`${ten} phải là số nguyên dương; lượt thử đã dừng.`);
  return n;
}

export interface CauHinhThu {
  nhan: string;
  groqTokenNgay: number;
  thuTokenNgay: number;
  thuLuotNgay: number;
  tokenTienTrinh: number;
  tepDoiSoat: string;
}

export function docCauHinhThu(env: Bien = process.env): CauHinhThu {
  const nhan = (env.AI_NHAN ?? env.AI_MUC_DICH ?? 'test').trim();
  if (!/^[a-zA-Z0-9_-]{1,48}$/.test(nhan)) throw new VuotNganSachError('Nhãn lượt thử không hợp lệ.');
  if (env.AI_MUC_DICH !== undefined && !['test', 'thu-nghiem', 'nen', 'background'].includes(env.AI_MUC_DICH)) {
    throw new VuotNganSachError('AI_MUC_DICH không hợp lệ cho lượt thử/nền.');
  }
  const tepDoiSoat = (env.AI_THU_TEP_DOI_SOAT ?? '').trim();
  if (!isAbsolute(tepDoiSoat)) throw new VuotNganSachError('AI_THU_TEP_DOI_SOAT cần đường dẫn tuyệt đối, lưu bền và dùng chung cho các script tuần tự.');
  return {
    nhan,
    groqTokenNgay: soDuong(env, 'AI_GROQ_TRAN_TOKEN_NGAY'),
    thuTokenNgay: soDuong(env, 'AI_THU_TRAN_TOKEN_NGAY'),
    thuLuotNgay: soDuong(env, 'AI_THU_TRAN_LUOT_NGAY'),
    tokenTienTrinh: soDuong(env, 'AI_NGAN_SACH_TOKEN'),
    tepDoiSoat,
  };
}

/** Biên dự kiến theo byte UTF-8 + phần output adapter Groq thực sự gửi; không là tokenizer. */
export function uocTokenLuotThu(req: ChatRequest): number {
  const output = req.maxTokens ?? 2048;
  if (!Number.isSafeInteger(output) || output <= 0) throw new VuotNganSachError('maxTokens lượt thử phải là số nguyên dương.');
  return Buffer.byteLength(req.system, 'utf8') + Buffer.byteLength(req.user, 'utf8') + 128 + output;
}

export function tongSuDungThu(rows: DongSuDungNgay[]) {
  let groqToken = 0, thuToken = 0, thuLuot = 0;
  for (const r of rows) {
    const token = r.tokensVao + r.tokensRa;
    if (r.provider === 'groq') groqToken += token;
    // Mọi nhãn ghi thử, không chỉ @test: các script không được có trần riêng do đổi nhãn.
    if (r.model.includes('@')) {
      thuToken += token;
      thuLuot += r.soRequest + r.soLoi;
    }
  }
  if (![groqToken, thuToken, thuLuot].every(Number.isSafeInteger)) throw new VuotNganSachError('Tổng sổ dùng vượt miền số an toàn.');
  return { groqToken, thuToken, thuLuot };
}

export function kiemTranThu(cfg: CauHinhThu, rows: DongSuDungNgay[], tokenDaDung: number, duKien: number): void {
  const t = tongSuDungThu(rows);
  if (t.groqToken + duKien > cfg.groqTokenNgay) throw new VuotNganSachError('Lượt thử chạm trần token Groq hôm nay.');
  if (t.thuToken + duKien > cfg.thuTokenNgay) throw new VuotNganSachError('Lượt thử chạm trần token riêng hôm nay.');
  if (t.thuLuot + 1 > cfg.thuLuotNgay) throw new VuotNganSachError('Lượt thử chạm trần số lần riêng hôm nay.');
  if (tokenDaDung + duKien > cfg.tokenTienTrinh) throw new VuotNganSachError('Lượt thử chạm ngân sách token của tiến trình.');
}

let tokenTienTrinh = 0;
let dangGoi = false;
export function tokenThuDaDung(): number { return tokenTienTrinh; }

/** Đường embedding/batch không có chính sách miễn phí đã kiểm trong X1. */
export function chanDuongTraPhiKhiThu(): void {
  // Ngoại lệ có phí: embedding câu hỏi (~0,0002 USD / lượt so mù) không tính vào AI_TRAN_USD — quá nhỏ để giữ chỗ
  if (luotThuCoPhi()) return;
  if (laLuotThu()) throw new VuotNganSachError('X1 chặn embedding/batch sống trong lượt thử. Dùng căn cứ/fixture chuẩn bị trước; không tự đổi không gian vector.');
}

/**
 * Chỉ script tuần tự trên một máy, cùng tệp đối soát. Không giữ chỗ quota nhiều máy.
 * Tệp còn tồn tại sau crash/lỗi ghi usage phải được operator đối soát; không tự hết hạn.
 */
export async function goiTrongNganSachThu(
  provider: string, model: string, req: ChatRequest, goi: () => Promise<ChatResult>,
): Promise<ChatResult> {
  if (!modelThuDuocPhep(provider, model)) throw new VuotNganSachError('Lượt thử chỉ được gọi model Groq trong danh sách X1; không lùi sang dịch vụ trả phí.');
  const cfg = docCauHinhThu();
  const duKien = uocTokenLuotThu(req);
  if (dangGoi) throw new VuotNganSachError('Script X1 phải chạy tuần tự; đang có lượt chưa xong.');
  dangGoi = true;
  let daTaoDau = false;
  let daGoi = false;
  const id = randomUUID();
  try {
    if (existsSync(cfg.tepDoiSoat)) throw new VuotNganSachError('Còn dấu chưa quyết toán. Đối soát usage trước khi mở lại, kể cả sau khởi động lại script.');
    const rows = await docSuDungHomNayBatBuoc();
    kiemTranThu(cfg, rows, tokenTienTrinh, duKien);
    // wx không ghi đè tệp có sẵn; fsync trước HTTP để dấu tồn tại qua restart tiến trình.
    const fd = openSync(cfg.tepDoiSoat, 'wx', 0o600);
    daTaoDau = true;
    try {
      writeFileSync(fd, JSON.stringify({ id, provider, model, nhan: cfg.nhan, ngay: new Date().toISOString().slice(0, 10), duKien }));
      fsyncSync(fd);
    } finally { closeSync(fd); }

    daGoi = true;
    let kq: ChatResult;
    try {
      kq = await goi();
    } catch (e) {
      // Không rõ đã tiêu bao nhiêu: ghi biên bảo thủ, tính cả lượt lỗi, rồi mới được xóa dấu.
      tokenTienTrinh += duKien;
      (globalThis as { __celestiaTokenDaDung?: number }).__celestiaTokenDaDung = tokenTienTrinh;
      await ghiNhanSuDungBatBuoc(provider, `${model}@${cfg.nhan}`, duKien, 0, true);
      // Chỉ phản hồi từ chối rõ trước xử lý mới được lùi. Timeout/mất mạng,
      // lỗi server hoặc phản hồi không đọc được có thể đã tiêu hơn dự kiến.
      const tuChoiRo = e instanceof AiRetryableError &&
        e.status !== undefined && [401, 402, 403, 429].includes(e.status);
      if (!tuChoiRo) throw new VuotNganSachError('Kết quả lượt trước chưa xác định; đã ghi dự kiến, giữ dấu đối soát và dừng chuỗi.');
      xoaDau(cfg.tepDoiSoat, id);
      throw e;
    }
    const usageDu = [kq.tokensIn, kq.tokensOut].every((n) => Number.isSafeInteger(n) && n! >= 0);
    const vao = usageDu ? kq.tokensIn! : duKien;
    const ra = usageDu ? kq.tokensOut! : 0;
    // completion_tokens đã gồm reasoning_tokens trên Groq; không cộng phần nghĩ lần hai.
    tokenTienTrinh += vao + ra;
    (globalThis as { __celestiaTokenDaDung?: number }).__celestiaTokenDaDung = tokenTienTrinh;
    await ghiNhanSuDungBatBuoc(provider, `${model}@${cfg.nhan}`, vao, ra, false, { dem: kq.tokensDem, nghi: kq.tokensNghi });
    if (!usageDu) throw new VuotNganSachError('Model không trả usage đầy đủ; đã tính dự kiến, giữ dấu để đối soát.');
    if (vao + ra > duKien) throw new VuotNganSachError('Usage thực tế vượt biên dự kiến; đã ghi usage, giữ dấu để đối soát trước khi chạy tiếp.');
    xoaDau(cfg.tepDoiSoat, id);
    return kq;
  } catch (e) {
    if (e instanceof VuotNganSachError) throw e;
    // Lỗi provider đã ghi được usage giữ kiểu lỗi cũ; lỗi storage phải dừng, không fallback.
    if (daGoi && daTaoDau && !existsSync(cfg.tepDoiSoat)) throw e;
    throw new VuotNganSachError('Không xác nhận được sổ dùng hoặc tệp đối soát; lượt thử đã dừng.');
  } finally { dangGoi = false; }
}

function xoaDau(tep: string, id: string): void {
  const dau = JSON.parse(readFileSync(tep, 'utf8')) as { id?: string };
  if (dau.id !== id) throw new VuotNganSachError('Dấu đối soát đã đổi; không tự xóa.');
  unlinkSync(tep);
}
