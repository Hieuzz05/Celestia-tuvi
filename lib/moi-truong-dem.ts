import { createHash } from 'node:crypto';

/**
 * Môi trường đang chạy và PHẠM VI ĐỆM của nó — nguồn sự thật DUY NHẤT phía server.
 *
 * Vì sao có tệp này (03/10/2026, docs/chien-luoc/moi-truong-phat-trien-2026-10.md): production,
 * Preview và máy local dùng CHUNG một Supabase. Trước đây bảng `noi_dung_ai` không biết bản ghi
 * thuộc môi trường nào, nên Preview đọc trúng bài cũ của production và local ghi đè đệm production.
 *
 * Luật:
 * - Production CHỈ khi đúng là Vercel Production đang chạy: `VERCEL=1`, `VERCEL_ENV=production`
 *   và `NODE_ENV=production`. `next dev` luôn ép NODE_ENV=development, nên `.env.local` có chép
 *   `VERCEL_ENV=production` (hay cả `VERCEL=1` từ `vercel env pull`) vẫn là local.
 * - Script chạy tay KHÔNG dựa vào biến môi trường (script nào cũng nạp `.env.local`): gọi
 *   `khaiBaoScript(process.argv)` ở đầu script, và chỉ cờ dòng lệnh `--ghi-production` mới cho
 *   script đó ghi production. Cờ dòng lệnh không thể lọt vào `next dev` qua `.env.local`.
 * - Không chỗ nào khác được tự đọc VERCEL_ENV để quyết định ghi/đọc đệm — gọi tệp này.
 *
 * Tính lúc GỌI, không tính một lần lúc import: bài kiểm đổi env giữa các ca.
 */

export type MoiTruong = 'production' | 'preview' | 'local';

export interface PhamViDem {
  moiTruong: MoiTruong;
  /** Tiền tố gắn vào `khoa_ky`. Production là '' — khoá y hệt trước đây, không migration, không xả đệm */
  ns: string;
  /** Tên không nhạy cảm để in ra `/api/phien-ban`: `production`, `preview:<nhánh>-<băm>`, `local:<tên>` */
  phamViDem: string;
}

type Env = Record<string, string | undefined>;

export const CO_GHI_PRODUCTION = '--ghi-production';

/** Script đã tự khai báo (null = không phải script, xét theo env) */
let cheDoScript: 'production' | 'local' | null = null;

/** Chữ thường không dấu, chỉ còn [a-z0-9-]; không bao giờ chứa `%`, `_`, `:` (ký tự đại diện LIKE / dấu ngăn ns) */
export function slugNs(s: string | undefined, macDinh: string): string {
  const x = (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
    .replace(/-$/, '');
  return x || macDinh;
}

/** Băm tên nhánh GỐC: `a_b` và `a-b` cùng ra slug `a-b` nhưng khác băm, nên không đè nhau */
function bam(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 8);
}

function laVercelDangChay(env: Env): boolean {
  return env.VERCEL === '1' && env.NODE_ENV === 'production';
}

export function phamViDem(env: Env = process.env): PhamViDem {
  if (cheDoScript === 'production') return { moiTruong: 'production', ns: '', phamViDem: 'production' };
  if (cheDoScript === null && laVercelDangChay(env)) {
    if (env.VERCEL_ENV === 'production') return { moiTruong: 'production', ns: '', phamViDem: 'production' };
    if (env.VERCEL_ENV === 'preview') {
      const ref = env.VERCEL_GIT_COMMIT_REF?.trim() || '';
      const ten = ref ? `${slugNs(ref, 'khong-ro')}-${bam(ref)}` : 'khong-ro';
      return { moiTruong: 'preview', ns: `preview:${ten}:`, phamViDem: `preview:${ten}` };
    }
  }
  const ten = slugNs(env.CELES_CACHE_NAMESPACE, 'local');
  return { moiTruong: 'local', ns: `local:${ten}:`, phamViDem: `local:${ten}` };
}

export function laProductionThat(env: Env = process.env): boolean {
  return phamViDem(env).moiTruong === 'production';
}

/** Lỗi khi ghi/xoá dữ liệu dùng chung (cấu hình) từ ngoài production. Route bắt lỗi này trả 403. */
export class LoiNgoaiProduction extends Error {
  constructor(viec: string) {
    super(`${viec}: chỉ được ghi trên production. Script chạy tay thì thêm ${CO_GHI_PRODUCTION}.`);
    this.name = 'LoiNgoaiProduction';
  }
}

/** Gọi ĐẦU mọi hàm ghi/xoá cấu hình dùng chung (thu-vien, mau-giong, cau-hinh-v3) */
export function chanGhiNgoaiProduction(viec: string, env: Env = process.env): void {
  if (!laProductionThat(env)) throw new LoiNgoaiProduction(viec);
}

/**
 * CHỈ script chạy tay gọi, một lần ở đầu: có `--ghi-production` trong argv thì ghi production,
 * không có thì local — bỏ qua mọi VERCEL* trong env. Mã web không được gọi hàm này
 * (scripts/test-moi-truong-dem.ts quét để chặn).
 */
export function khaiBaoScript(argv: readonly string[]): PhamViDem {
  cheDoScript = argv.includes(CO_GHI_PRODUCTION) ? 'production' : 'local';
  return phamViDem();
}

/** Chỉ cho bài kiểm */
export function _datLaiCheDoScript(): void {
  cheDoScript = null;
}
