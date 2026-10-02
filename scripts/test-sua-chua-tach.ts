/**
 * Lớp sửa câu không được làm sập xuống dòng — OFFLINE, không gọi model thật.
 *
 * Lỗi đã chạy trên prod: `tachCau` cắt câu bằng `split(/(?<=[.!?])\s+/)` rồi
 * `suaCauTiengLong` / `suaCauKeSao` ráp lại bằng `join(' ')`. Mọi `\n\n` thành
 * một dấu cách, tiêu đề và danh sách dính vào nhau — nhưng chỉ ở những bài có
 * câu phải sửa, nên không ai thấy.
 *
 * Bộ này khoá ba thứ:
 *   1. `rapManh(tachManh(x)) === x` trên một tập mẫu Markdown
 *   2. ranh giới câu / đoạn / tiêu đề / danh sách tách đúng chỗ
 *   3. chạy THẬT hai hàm sửa với fetch giả lập: câu được viết lại, xuống dòng
 *      hai bên còn nguyên
 *
 * Chạy: npx tsx scripts/test-sua-chua-tach.ts
 */

// Cấu hình model qua biến môi trường để không chạm database — như test-ai-fallback
process.env.OPENAI_API_KEY = 'key-openai';
process.env.AI_FALLBACK_ORDER = 'openai|gpt-4o-mini';
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

import { rapManh, suaCauKeSao, suaCauTiengLong, tachManh } from '../lib/rag/sua-chua';

let loi = 0;
function kiem(ten: string, dung: boolean, chiTiet = '') {
  if (dung) console.log(`  ✓ ${ten}`);
  else {
    loi++;
    console.log(`  ✗ ${ten}${chiTiet ? `\n      ${chiTiet}` : ''}`);
  }
}
const hien = (s: unknown) => JSON.stringify(s);

/** fetch giả: trả JSON viết lại mọi câu C1..Cn bằng `moi(i)` */
let soLanGoi = 0;
function datFetch(moi: (i: number, cauGoc: string) => string) {
  soLanGoi = 0;
  global.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    soLanGoi++;
    const body = JSON.parse(String(init?.body ?? '{}')) as { messages?: { role: string; content: string }[] };
    const user = body.messages?.find((m) => m.role === 'user')?.content ?? '';
    const cau = [...user.matchAll(/^C(\d+)\. (.*)$/gm)].map((m) => ({ id: `C${m[1]}`, moi: moi(Number(m[1]), m[2]) }));
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ cau }) } }],
        usage: { prompt_tokens: 10, completion_tokens: 10 },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;
}

console.log('\n1. Ráp lại đúng nguyên văn');
const MAU = [
  'A. B.',
  'A.\nB.',
  'A.\n\nB.',
  'Tóm tắt\n\n- Ý 1\n- Ý 2',
  '## Phần 1\n\nNội dung',
  'Một.\n\n\n\nHai.\n\n\n',
  '\n\n  Đầu có trắng.  \n',
  'Kết luận.\r\n\r\nTóm tắt.\r\n- Ý một.\r\n',
  '### Ý chính\nCâu một (có ngoặc.) Câu hai.” Câu ba.**\n\n1. Mục một. Câu tiếp.\n2) Mục hai\n> Trích dẫn.',
  'các\nyếu tố cản vẫn mạnh. Câu sau…  Câu cuối!',
  '    thụt lề\n  tiếp dòng.\n\t- gạch thụt',
  '',
  '   ',
  '***\n---\n',
];
for (const m of MAU) kiem(`round-trip ${hien(m)}`, rapManh(tachManh(m)) === m, hien(rapManh(tachManh(m))));

console.log('\n2. Tách đúng chỗ');
const cauCua = (s: string) => tachManh(s).filter((m) => m.loai === 'NOI_DUNG').map((m) => m.text);
const ngan = (s: string) => tachManh(s).filter((m) => m.loai === 'PHAN_CACH').map((m) => m.text);
kiem('"A. B." → hai câu, ngăn bằng một dấu cách', hien(cauCua('A. B.')) === hien(['A.', 'B.']) && hien(ngan('A. B.')) === hien([' ']));
kiem('"A.\\n\\nB." → giữ đúng \\n\\n', hien(ngan('A.\n\nB.')) === hien(['\n\n']));
kiem('tiêu đề tách khỏi câu sau dù không có dấu chấm', hien(cauCua('### Ý chính\nCâu một.')) === hien(['Ý chính', 'Câu một.']));
kiem('dấu đầu dòng là phần ngăn cách', hien(ngan('- Ý 1\n- Ý 2')) === hien(['- ', '\n- ']));
kiem('"1. Mục" không bị cắt sau "1."', hien(cauCua('1. Mục một\n2. Mục hai')) === hien(['Mục một', 'Mục hai']));
kiem('xuống dòng mềm giữ câu ngắt giữa chừng', hien(cauCua('các\nyếu tố cản mạnh.')) === hien(['các\nyếu tố cản mạnh.']));
kiem('"…" giữa câu không cắt câu (như bản tách cũ)', hien(cauCua('Có lúc… rồi lại thôi. Hết.')) === hien(['Có lúc… rồi lại thôi.', 'Hết.']));
kiem('dấu đóng sau dấu chấm đi theo câu', hien(cauCua('Một (a.) Hai.” Ba.** Bốn.')) === hien(['Một (a.)', 'Hai.”', 'Ba.**', 'Bốn.']));

async function chay() {
  console.log('\n3. suaCauTiengLong — câu được sửa, xuống dòng còn nguyên');
  const KHUON =
    'Năm nay chưa nên mua nhà.\n\n### Vì sao\nCác yếu tố cản vẫn khá mạnh. Hóa Kỵ đóng ở phần nền tảng.\n\n- Lực đỡ yếu ở nửa đầu năm.\n- Nửa sau dễ thở hơn.';
  datFetch((i) => `Câu viết lại số ${i}, đã bỏ hết tiếng lóng nội bộ.`);
  const ra = await suaCauTiengLong(KHUON, ['Hóa Kỵ']);
  kiem('có gọi model đúng một lần', soLanGoi === 1, `soLanGoi=${soLanGoi}`);
  kiem(
    'ra đúng khuôn, chỉ hai câu phạm bị thay',
    ra ===
      'Năm nay chưa nên mua nhà.\n\n### Vì sao\nCâu viết lại số 1, đã bỏ hết tiếng lóng nội bộ. Hóa Kỵ đóng ở phần nền tảng.\n\n- Câu viết lại số 2, đã bỏ hết tiếng lóng nội bộ.\n- Nửa sau dễ thở hơn.',
    hien(ra)
  );

  datFetch(() => 'C1. Câu mới\n\n- có xuống dòng lạ chen vào giữa câu.');
  const ra2 = await suaCauTiengLong('Kết luận.\n\nCác yếu tố cản vẫn mạnh.\n\nCâu cuối.', []);
  kiem(
    'câu model trả về được làm sạch, không chèn cấu trúc mới',
    ra2 === 'Kết luận.\n\nCâu mới có xuống dòng lạ chen vào giữa câu.\n\nCâu cuối.',
    hien(ra2)
  );

  datFetch(() => 'không nên tới đây');
  const tieuDe = '### Các yếu tố đang cản\nCâu thường không phạm.';
  kiem(
    'tiêu đề khớp tiếng lóng KHÔNG bị gửi đi viết lại thành câu',
    (await suaCauTiengLong(tieuDe, [])) === tieuDe && soLanGoi === 0,
    `soLanGoi=${soLanGoi}`
  );

  datFetch(() => 'Câu viết lại đã mất dấu đậm ở cuối.');
  const ra4 = await suaCauTiengLong('**Mở đậm. Các yếu tố cản vẫn mạnh.**\n\nSau.', []);
  kiem(
    'dấu ** lẻ của câu gốc được giữ lại, chữ đậm không loang',
    ra4 === '**Mở đậm. Câu viết lại đã mất dấu đậm ở cuối.**\n\nSau.',
    hien(ra4)
  );

  datFetch(() => 'không nên tới đây');
  const nguyen = 'Kết luận.\n\nKhông có gì phạm.';
  kiem('không có câu phạm → trả nguyên văn, 0 lượt gọi', (await suaCauTiengLong(nguyen, [])) === nguyen && soLanGoi === 0);

  console.log('\n4. suaCauKeSao — câu được sửa, xuống dòng còn nguyên');
  datFetch(() => 'Ở phần công việc, bạn vừa nghĩ nhanh vừa cân nhắc kỹ.');
  const vao = {
    a: 'Mở đầu.\n\nQuan Lộc có Thiên Cơ và Thái Âm cùng chiếu. Câu sau.\n\n- Ý cuối.',
    b: 'Khoá này không phạm.\n\nGiữ nguyên  hai   dấu cách.',
  };
  const ra3 = await suaCauKeSao(vao);
  kiem(
    'khoá có câu phạm: chỉ câu ấy đổi, \\n\\n và gạch đầu dòng còn nguyên',
    ra3.a === 'Mở đầu.\n\nỞ phần công việc, bạn vừa nghĩ nhanh vừa cân nhắc kỹ. Câu sau.\n\n- Ý cuối.',
    hien(ra3.a)
  );
  kiem('khoá không có câu phạm: trả đúng chuỗi gốc', ra3.b === vao.b, hien(ra3.b));

  console.log(loi ? `\n✗ ${loi} lỗi` : '\n✓ Tất cả đều qua');
  process.exit(loi ? 1 : 0);
}
chay();
