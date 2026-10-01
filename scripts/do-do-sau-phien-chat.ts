/**
 * Đo độ sâu phiên chat — npx tsx scripts/do-do-sau-phien-chat.ts
 *
 * Chạm DATABASE THẬT, KHÔNG gọi model. Chỉ ĐỌC, không ghi gì.
 *
 * Vì sao có tệp này: `docs/chien-luoc/ca-nhan-hoa-celes.md` mục 17 đặt điều
 * kiện tiên quyết cho Phase 2 — "Trước khi làm lớp học dần (Phase 2 lớp 3),
 * phải đo tỉ lệ phiên chat có quá 1 lượt và quá 3 lượt. Ít quá thì lớp đó gần
 * như không chạy." Luật đếm 3-lần-đổi-mặc-định không có cơ sở nào cho tới khi
 * con số này tồn tại.
 *
 * ĐẾM LƯỢT NGƯỜI DÙNG, KHÔNG ĐẾM TIN NHẮN TRỢ LÝ. Mỗi lượt hỏi sinh ra hai
 * dòng (`nguoi-dung` + `tro-ly`); đếm cả hai là nhân đôi mọi con số và một
 * phiên một lượt trông như phiên hai lượt.
 *
 * `vai_tro` nhận ĐÚNG hai giá trị `'nguoi-dung'` và `'tro-ly'` — xem ràng buộc
 * check ở `supabase/schema.sql:101`. Viết `where vai_tro = 'user'` thì truy vấn
 * vẫn chạy và trả về 0 ở mọi dòng, không lỗi nào báo ra.
 *
 * Phiên = (user_id, phien). `phien` là băm lá số do trình duyệt đặt
 * (`lib/store/hoi-thoai.ts:42`), nên nó KHÔNG hết hạn theo thời gian: hai lượt
 * hỏi cách nhau một tháng trên cùng lá số vẫn là một "phiên". Con số dưới đây
 * vì thế là CẬN TRÊN của độ sâu hội thoại thật.
 *
 * Chạy bằng service role vì script không có phiên đăng nhập trình duyệt.
 */

import { readFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

/** Một dòng tin nhắn, chỉ các cột cần cho phép đếm */
interface Dong {
  user_id: string;
  phien: string;
  vai_tro: string;
  tao_luc: string;
}

/**
 * Đọc hết bảng theo trang.
 *
 * PostgREST trả tối đa 1000 dòng cho một `.select()` trần trụi — bẫy đã ghi ở
 * `docs/bay/ai-rag.md`. Bảng chat lớn hơn thế là lặng lẽ mất đuôi, và mất đuôi
 * ở đây nghĩa là bỏ sót đúng những phiên dài mà phép đo này đi tìm.
 */
async function docHet(
  sb: import('@supabase/supabase-js').SupabaseClient,
  tuNgay: string
): Promise<Dong[]> {
  const ra: Dong[] = [];
  const buoc = 1000;
  for (let tu = 0; ; tu += buoc) {
    const { data, error } = await sb
      .from('chat_messages')
      .select('user_id, phien, vai_tro, tao_luc')
      .gte('tao_luc', tuNgay)
      .order('tao_luc', { ascending: true })
      .range(tu, tu + buoc - 1);
    if (error) throw new Error(`Đọc chat_messages hỏng: ${error.message}`);
    const lo = (data ?? []) as Dong[];
    ra.push(...lo);
    if (lo.length < buoc) return ra;
  }
}

/** Số ngày trước hôm nay, dạng ISO để so với `tao_luc` */
function moc(soNgay: number): string {
  return new Date(Date.now() - soNgay * 86_400_000).toISOString();
}

function phanTram(phan: number, tong: number): string {
  if (!tong) return '—';
  return `${((100 * phan) / tong).toFixed(1)}%`;
}

/** In một cửa sổ thời gian: tổng phiên, tỉ lệ ≥2/≥3/≥4, và phân phối đầy đủ */
function inCuaSo(nhan: string, dong: Dong[]): { tong: number; tu3: number } {
  // Chỉ lượt NGƯỜI DÙNG. Tin nhắn trợ lý không phải một lần người ta chọn hỏi.
  const luot = new Map<string, number>();
  for (const d of dong) {
    if (d.vai_tro !== 'nguoi-dung') continue;
    const khoa = `${d.user_id}|${d.phien}`;
    luot.set(khoa, (luot.get(khoa) ?? 0) + 1);
  }

  const dem = [...luot.values()];
  const tong = dem.length;
  const tuN = (n: number) => dem.filter((x) => x >= n).length;

  console.log(`\n=== ${nhan} ===`);
  console.log(`  Tổng số phiên có ít nhất một lượt hỏi: ${tong}`);
  if (!tong) {
    console.log('  (không có dữ liệu trong cửa sổ này)');
    return { tong: 0, tu3: 0 };
  }
  for (const n of [2, 3, 4]) {
    console.log(`  Phiên có ≥ ${n} lượt hỏi: ${tuN(n)}  (${phanTram(tuN(n), tong)})`);
  }

  // Phân phối đầy đủ: "≥3 = 18%" không nói được bằng việc nhìn thấy đuôi nằm ở đâu
  console.log('\n  Phân phối số lượt hỏi mỗi phiên:');
  const nhom = new Map<number, number>();
  for (const x of dem) nhom.set(x, (nhom.get(x) ?? 0) + 1);
  const khoaSap = [...nhom.keys()].sort((a, b) => a - b);
  for (const k of khoaSap) {
    const c = nhom.get(k)!;
    const cot = '#'.repeat(Math.max(1, Math.round((40 * c) / tong)));
    console.log(`    ${String(k).padStart(3)} lượt: ${String(c).padStart(5)}  ${phanTram(c, tong)}  ${cot}`);
  }

  return { tong, tu3: tuN(3) };
}

async function main() {
  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');
  const sb = taoSupabaseAdmin();
  if (!sb) throw new Error('Thiếu SUPABASE_SERVICE_ROLE_KEY — xem .env.local');

  console.log('Đo độ sâu phiên chat — chỉ đọc, không ghi, không gọi model.');

  const ket: Record<string, { tong: number; tu3: number }> = {};
  for (const ngay of [30, 90]) {
    const dong = await docHet(sb, moc(ngay));
    ket[`${ngay}`] = inCuaSo(`${ngay} ngày gần nhất`, dong);
  }

  // Toàn bộ lịch sử: hai cửa sổ trên có thể rỗng nếu chat mới mở gần đây
  const tatCa = await docHet(sb, new Date(0).toISOString());
  ket.all = inCuaSo('Toàn bộ lịch sử', tatCa);

  console.log('\n--- Kết luận cho Phase 2 ---');
  const c = ket['30'].tong ? ket['30'] : ket.all;
  if (!c.tong) {
    console.log('  Chưa có phiên chat nào. Luật 3-lần-đổi-mặc-định KHÔNG có cơ sở để làm.');
  } else {
    const ti = (100 * c.tu3) / c.tong;
    console.log(`  Tỉ lệ phiên đạt ≥3 lượt hỏi: ${ti.toFixed(1)}%`);
    console.log(
      ti < 10
        ? '  → Dưới 10%: lớp học dần gần như không chạy. Mục 17 nói hoãn, và số liệu đồng ý.'
        : '  → Đủ để bàn tiếp, NHƯNG vẫn vướng hạn mức 5 câu/ngày nếu nút lái tiêu quota.'
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
