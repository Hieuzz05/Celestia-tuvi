/**
 * Behavior Contract — TẦNG OFFLINE (CI). CEL-186 Answer Contract v2, spec 7.1 / commit C.
 *
 *   npx tsx scripts/test-hop-dong-focused.ts [--chi-tiet]
 *
 * Chấm cột "người / ý / thời gian" của 30 flow (`hop-dong-focused.ts`) trên vết có cấu trúc
 * (`vetPreview.hieu`, cửa sổ, đường ra, khongTinhLuot, meta). Không Supabase, không mạng: model
 * phân loại thay bằng bảng giả `PHAN_LOAI_GIA`, model trả lời là một hàm giả `traLoiGia`
 * — đổi hợp đồng đầu ra (commit D) thì chỉ sửa hàm đó.
 *
 * `CHUA_DAT` là danh sách tường minh các lượt CHƯA đạt ở mã hiện tại. Mỗi commit sau gỡ dần:
 * lượt trong danh sách mà đã đạt → test ĐỎ, bắt gỡ khỏi danh sách (không để danh sách nói dối).
 */
for (const k of Object.keys(process.env)) {
  if (/SUPABASE|_API_KEY$|^AI_GHIM_MODEL$|^AI_FALLBACK_ORDER$|^CELES_/.test(k)) delete process.env[k];
}
process.env.GROQ_API_KEY = 'khoa-gia-test';
process.env.CELES_META_KHOA = 'khoa-meta-test';

import type { KetQuaFocused } from '../lib/rag/focused/tra-loi-focused';

/** Khoá lượt: "<số flow>#<thứ tự lượt, từ 1>". Lý do ghi ngay cạnh — commit nào gỡ. */
const CHUA_DAT: Record<string, string> = {
  '18#1': 'NỢ — planner không bắt "this year" nên khuôn ra G; spec 3.1 cấm thêm bảng từ / sửa planner',
};

/**
 * Bộ phân loại giả (thay `lapKeHoachDayDu` gọi model, spec 7.1): câu luật chưa chắc chủ đề thì
 * trả đúng thứ một bộ phân loại tốt phải trả. Câu không có ở đây → JSON hỏng → planner giữ luật.
 */
const PHAN_LOAI_GIA: Record<string, { chuDe: string; yDinh: string }> = {
  'Tháng 10 tôi tìm việc được không?': { chuDe: 'su-nghiep', yDinh: 'co-khong' },
  'How will my career go this year?': { chuDe: 'su-nghiep', yDinh: 'mo-ta' },
  'Will I find a job this October?': { chuDe: 'su-nghiep', yDinh: 'co-khong' },
};

/** Model giả theo hợp đồng đầu ra HIỆN TẠI: một câu dẫn mã F### đầu tiên có trong prompt. */
function traLoiGia(prompt: string): string {
  const ma = prompt.match(/\bF\d{3}\b/)?.[0] ?? 'F001';
  return JSON.stringify({
    answer: 'Năm nay mọi việc đi khá đều. Có một điểm tựa giúp mọi việc đi đều.',
    claims: [{ claim: 'Mọi việc đi khá đều', evidenceIds: [ma], direction: 'thuan' }],
    suggestedQuestions: ['Sang năm thì sao?'],
  });
}

let loi = 0;
const chiTiet = process.argv.includes('--chi-tiet');

async function main() {
  const { HOP_DONG, HOM_NAY, chayFlow, chamHieu } = await import('./hop-dong-focused');
  const { traLoiFocused } = await import('../lib/rag/focused/tra-loi-focused');
  const { phienBanHienTai } = await import('../lib/rag/tra-loi');

  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url instanceof Request ? url.url : url);
    if (!u.includes('api.groq.com')) return new Response('khong co mang trong test', { status: 500 });
    const body = typeof init?.body === 'string' ? init.body : '';
    let noiDung = traLoiGia(body);
    if (body.includes('LÁ SỐ CỦA AI')) {
      // Bộ hỏi lại giả (spec 6.1): chỉ câu người dùng tự nói lá số là của mình mới ra nguoi-hoi
      noiDung = /lá số này của tôi/i.test(body.split('Người dùng vừa gõ')[1] ?? '') ? 'nguoi-hoi' : 'khong-lien-quan';
    } else if (body.includes('bộ phân loại câu hỏi')) {
      const msgs = (JSON.parse(body).messages ?? []) as { role: string; content: string }[];
      const cau = msgs.filter((m) => m.role === 'user').pop()?.content ?? '';
      noiDung = PHAN_LOAI_GIA[cau] ? JSON.stringify(PHAN_LOAI_GIA[cau]) : 'khong-ro';
    }
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: noiDung }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;

  const goi = (vao: Parameters<typeof traLoiFocused>[0]): Promise<KetQuaFocused> =>
    traLoiFocused(vao, phienBanHienTai, async () => [], HOM_NAY);

  let dat = 0;
  let tong = 0;
  const conTrongDs = new Set(Object.keys(CHUA_DAT));
  for (const flow of HOP_DONG) {
    const ds = await chayFlow(flow, goi);
    ds.forEach((l, i) => {
      if (!l.luot.hieu) return;
      tong++;
      const khoa = `${flow.so}#${i + 1}`;
      const lech = chamHieu(l.luot.hieu, l.kq);
      const daBiet = khoa in CHUA_DAT;
      conTrongDs.delete(khoa);
      if (!lech.length) {
        dat++;
        if (daBiet) {
          loi++;
          console.error(`  ✗ ${khoa} (${flow.ten}) ĐÃ ĐẠT — gỡ khỏi CHUA_DAT`);
        }
      } else if (!daBiet) {
        loi++;
        console.error(`  ✗ ${khoa} (${flow.ten}): ${lech.join(' · ')}`);
      } else if (chiTiet) {
        console.log(`  … ${khoa} (${flow.ten}) chưa đạt [${CHUA_DAT[khoa]}]: ${lech.join(' · ')}`);
      }
    });
  }
  for (const k of conTrongDs) {
    loi++;
    console.error(`  ✗ CHUA_DAT có khoá không tồn tại: ${k}`);
  }
  console.log(`Behavior Contract offline: ${dat}/${tong} lượt đạt, ${Object.keys(CHUA_DAT).length} lượt còn trong CHUA_DAT`);

  if (loi) {
    console.error(`\nTRƯỢT: ${loi} lỗi`);
    process.exit(1);
  }
  console.log('\nĐẠT');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
