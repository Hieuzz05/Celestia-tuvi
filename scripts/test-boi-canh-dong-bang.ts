/**
 * CEL-186 Answer Contract v2 — commit A0: đóng băng đầu ra trước mọi thay đổi.
 *
 *   npx tsx scripts/test-boi-canh-dong-bang.ts          # so với ảnh chụp đã commit (CI)
 *   npx tsx scripts/test-boi-canh-dong-bang.ts --sinh   # sinh lại ảnh chụp — CHỈ chạy trên mã 5f29293
 *
 * 1. `chonBoiCanh` trên 6 lá `mau-ansao.json` × câu của Behavior Contract × có/không tháng ×
 *    `focused` tắt/bật phải ra y hệt ảnh chụp `du-lieu/boi-canh-dong-bang.json`. Các commit sau
 *    thêm tham số tuỳ chọn vào `chonBoiCanh`; ảnh chụp này là thứ chứng minh đường cũ không đổi.
 *    Ảnh chụp sinh MỘT lần trên mã gốc rồi đóng băng — test không tự tính lại nó.
 * 2. Cờ Focused tắt: `traLoiCoCanCu` trả kết quả KHÔNG có khoá `meta` / `vetFocused`.
 *    Offline: không Supabase, model giả bằng cách chặn `fetch` — không gọi mạng thật.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Trước mọi import của lib: không DB, không cờ Focused, một khoá giả để có model trong danh sách.
for (const k of Object.keys(process.env)) {
  if (/SUPABASE|_API_KEY$|^AI_GHIM_MODEL$|^AI_FALLBACK_ORDER$/.test(k)) delete process.env[k];
}
delete process.env.CELES_FOCUSED_CHAT;
process.env.GROQ_API_KEY = 'khoa-gia-test';

import type { LaSo } from '../lib/tuvi/ansao';

let loi = 0;
const kiem = (dk: boolean, msg: string) => {
  if (!dk) {
    loi++;
    console.error('  ✗', msg);
  }
};

// Import động: import tĩnh bị kéo lên trước đoạn dọn biến môi trường ở trên.
async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { chonBoiCanh, saoChinhTheoCung } = await import('../lib/rag/boi-canh-la-so');
  const { lapKeHoach } = await import('../lib/rag/planner');
  const { traLoiCoCanCu } = await import('../lib/rag/tra-loi');

  /* ------------------------------------------------- 1. ảnh chụp chonBoiCanh */

  const TEP_ANH = join(__dirname, 'du-lieu', 'boi-canh-dong-bang.json');

  const mau = JSON.parse(readFileSync(join(__dirname, 'mau-ansao.json'), 'utf8')).mau as Record<string, string>;
  // 6 lá đầu (spec A0) — đủ cả nam/nữ, nhiều cục; 60 lá thì ảnh chụp tới 16MB.
  const dsLaSo: [string, LaSo][] = Object.keys(mau).slice(0, 6).map((k) => {
    const m = k.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/)!;
    return [k, lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' })];
  });

  // Câu chính của Behavior Contract (spec mục 7.1), đủ các khuôn A–E + tháng âm/dương.
  const CAU = [
    'Hiện tại tôi đang thất nghiệp, khi nào thì tìm được việc mới?',
    'Tháng 10 tôi tìm việc được không?',
    'Lúc nào cũng mệt, năm nay sức khỏe tôi thế nào?',
    'Năm nào cũng vất vả, năm nay tiền bạc ra sao?',
    'Tháng 10 âm năm nay công việc thế nào?',
    'Nên nhận việc công ty A hay ở lại công ty B?',
    'Vì sao tôi hay cãi nhau với mẹ?',
    'Tháng 6 năm nay tôi có nên chuyển nhà không?',
  ];
  const NAM_XEM = 2026;
  const THANG = [undefined, 10] as const;
  const FOCUSED = [false, true] as const;

  const anh: Record<string, unknown> = {};
  for (const [tenLa, laSo] of dsLaSo) {
    const saoTheoCung = saoChinhTheoCung(laSo);
    for (const cauHoi of CAU) {
      for (const thangXem of THANG) {
        const keHoach = lapKeHoach({ cauHoi, saoTheoCung, namXem: NAM_XEM, thangXem });
        for (const focused of FOCUSED) {
          const khoa = `${tenLa} | ${cauHoi} | thang=${thangXem ?? '-'} | focused=${focused}`;
          anh[khoa] = chonBoiCanh({
            laSo,
            keHoach,
            namXem: keHoach.namMucTieu ?? NAM_XEM,
            thangXem: (keHoach.thangMucTieu ?? thangXem) as number,
            focused,
          });
        }
      }
    }
  }

  if (process.argv.includes('--sinh')) {
    writeFileSync(TEP_ANH, JSON.stringify(anh, null, 1) + '\n', 'utf8');
    console.log(`Đã ghi ${Object.keys(anh).length} ảnh chụp → ${TEP_ANH}`);
    process.exit(0);
  }

  const daChup = JSON.parse(readFileSync(TEP_ANH, 'utf8')) as Record<string, unknown>;
  kiem(Object.keys(daChup).length === Object.keys(anh).length, `số ảnh chụp ${Object.keys(daChup).length} ≠ ${Object.keys(anh).length}`);
  let lech = 0;
  for (const [khoa, gt] of Object.entries(anh)) {
    if (!(khoa in daChup)) {
      kiem(false, `thiếu ảnh chụp: ${khoa}`);
      continue;
    }
    if (JSON.stringify(gt) !== JSON.stringify(daChup[khoa])) {
      if (lech++ < 5) kiem(false, `chonBoiCanh lệch ảnh chụp: ${khoa}`);
      else loi++;
    }
  }
  console.log(`1. chonBoiCanh: ${Object.keys(anh).length} ca, lệch ${lech}`);

  /* ------------------------------------- 2. cờ tắt: không có meta / vetFocused */

  // Model giả: một JSON đúng khuôn STANDARD. Mọi URL khác (không nên có) trả 500 để lộ ra ngay.
  const TRA_LOI_GIA = JSON.stringify({
    ketLuan: 'Năm nay công việc nghiêng về thuận.',
    tomTat: 'Năm nay công việc có đà đi lên.',
    yChinh: [{ noiDung: 'Cung Quan Lộc có sao tốt đỡ cho việc.', canCu: ['F002'] }],
    lienKet: 'Mệnh và Quan Lộc cùng thuận.',
    canNhac: [],
    buocTiepTheo: [],
    goiYTiep: ['Tiền bạc năm nay thế nào?'],
  });
  const urlDaGoi: string[] = [];
  globalThis.fetch = (async (url: string | URL | Request) => {
    const u = String(url instanceof Request ? url.url : url);
    urlDaGoi.push(u);
    if (u.includes('api.groq.com')) {
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: TRA_LOI_GIA }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response('khong co mang trong test', { status: 500 });
  }) as typeof fetch;

  const laSo = dsLaSo[0][1];
  for (const cauHoi of ['Năm nay công việc của tôi thế nào?', 'Tháng 10 tôi tìm việc được không?']) {
    const kq = (await traLoiCoCanCu({
      laSo,
      cauHoi,
      namXem: NAM_XEM,
      thangXem: 10,
      ghiNhatKy: false,
      dungModelPhanLoai: false,
    })) as unknown as Record<string, unknown>;
    kiem(kq.provider !== 'ma', `"${cauHoi}": cờ tắt mà đi đường mã Focused`);
    kiem(!('meta' in kq), `"${cauHoi}": cờ tắt mà kết quả có khoá meta`);
    kiem(!('vetFocused' in kq), `"${cauHoi}": cờ tắt mà kết quả có khoá vetFocused`);
    kiem(kq.coCauTruc !== null, `"${cauHoi}": model giả không đọc được thành câu trả lời có cấu trúc`);
  }
  kiem(urlDaGoi.length > 0 && urlDaGoi.every((u) => u.includes('api.groq.com')), `fetch lạ: ${urlDaGoi.filter((u) => !u.includes('api.groq.com')).join(', ')}`);
  console.log(`2. cờ tắt: traLoiCoCanCu không có meta/vetFocused (${urlDaGoi.length} lời gọi model giả)`);

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
