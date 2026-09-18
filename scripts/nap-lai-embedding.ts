/**
 * Sinh lại vector cho kho tri thức — npx tsx scripts/nap-lai-embedding.ts [--tat-ca]
 *
 * Mặc định chỉ điền cho đoạn CHƯA có vector.
 * `--tat-ca` xoá hết vector cũ rồi sinh lại toàn bộ.
 *
 * Khi nào cần `--tat-ca`: mỗi lần đổi `EMBEDDING_PROVIDER` hoặc `EMBEDDING_MODEL`.
 *
 * Vector của hai model khác nhau nằm trong hai không gian khác nhau. Trộn chúng
 * trong cùng một cột không làm hỏng gì thấy được: không lỗi, không cảnh báo, truy
 * vấn vẫn chạy và vẫn trả về kết quả. Chỉ là kết quả vô nghĩa. Đây là kiểu sai
 * đắt nhất, vì nó chỉ lộ ra ở chất lượng bài luận giải vài tuần sau.
 *
 * Script gọi API thật và ghi vào database thật.
 */

import { readFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

const TAT_CA = process.argv.includes('--tat-ca');
/** Số đoạn đọc về mỗi lần từ database — không liên quan tới kích thước lô embed */
const TRANG = 200;
/** Số dòng ghi cùng lúc. Cao hơn làm rớt kết nối trên đường truyền dân dụng. */
const SONG_SONG = 4;

interface Doan {
  id: string;
  noi_dung: string;
}

async function main() {
  const { embedLoTaiLieu, TEN_MODEL_EMBEDDING, NHA_CUNG_CAP_EMBEDDING } = await import(
    '../lib/ai/embedding'
  );

  const U = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const K = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!U || !K) {
    console.log('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }
  const H = { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json' };

  /**
   * Gọi lại khi mạng rớt.
   *
   * Ghi vài trăm dòng liên tiếp qua đường truyền dân dụng thì kiểu gì cũng có
   * lần đứt. Hỏng cả lượt nạp vì một lần đứt là phí, nhất là khi vector đã sinh
   * xong rồi và đã trả tiền để có nó.
   */
  const guiLai = async (url: string, init: RequestInit, lanThu = 0): Promise<Response> => {
    try {
      return await fetch(url, init);
    } catch (e) {
      if (lanThu >= 4) throw e;
      await new Promise((r) => setTimeout(r, 2 ** lanThu * 1000));
      return guiLai(url, init, lanThu + 1);
    }
  };

  const demDong = async (dieuKien: string) => {
    const r = await fetch(`${U}/rest/v1/knowledge_chunks?select=id${dieuKien}`, {
      headers: { ...H, Prefer: 'count=exact', Range: '0-0' },
    });
    return Number(r.headers.get('content-range')?.split('/')[1] ?? 0);
  };

  const tong = await demDong('');
  const thieu = await demDong('&embedding=is.null');

  console.log(`\nModel embedding: ${TEN_MODEL_EMBEDDING}`);
  console.log(`Kho hiện có   : ${tong} đoạn, ${thieu} đoạn chưa có vector`);
  console.log(`Chế độ        : ${TAT_CA ? 'SINH LẠI TOÀN BỘ' : 'chỉ điền chỗ còn thiếu'}\n`);

  if (TAT_CA) {
    console.log('Xoá vector cũ...');
    // Xoá theo lô: một lệnh PATCH cho cả bảng dễ chạm trần thời gian của PostgREST
    for (;;) {
      const r = await guiLai(`${U}/rest/v1/knowledge_chunks?select=id&embedding=not.is.null&limit=500`, {
        headers: H,
      });
      const ds = (await r.json()) as { id: string }[];
      if (!ds.length) break;
      await guiLai(`${U}/rest/v1/knowledge_chunks?id=in.(${ds.map((x) => x.id).join(',')})`, {
        method: 'PATCH',
        headers: H,
        body: JSON.stringify({ embedding: null }),
      });
      process.stdout.write(`\r  đã xoá ${ds.length} vector...`);
    }
    console.log('\r  xong.                    ');
  }

  const canLam = await demDong('&embedding=is.null');
  if (!canLam) {
    console.log('Không còn đoạn nào cần sinh vector.\n');
    return;
  }

  console.log(`Bắt đầu sinh vector cho ${canLam} đoạn.\n`);
  const batDau = Date.now();
  let daXong = 0;

  for (;;) {
    const r = await guiLai(
      `${U}/rest/v1/knowledge_chunks?select=id,noi_dung&embedding=is.null&limit=${TRANG}&order=id`,
      { headers: H }
    );
    const doan = (await r.json()) as Doan[];
    if (!doan.length) break;

    const kq = await embedLoTaiLieu(doan.map((d) => d.noi_dung));

    // Ghi song song: mỗi vector là một dòng riêng nên không tranh nhau. Bốn luồng
    // thay vì tám — tám luồng làm rớt kết nối trên đường truyền dân dụng.
    for (let i = 0; i < kq.vectors.length; i += SONG_SONG) {
      await Promise.all(
        kq.vectors.slice(i, i + SONG_SONG).map((v, j) =>
          guiLai(`${U}/rest/v1/knowledge_chunks?id=eq.${doan[i + j].id}`, {
            method: 'PATCH',
            headers: H,
            body: JSON.stringify({ embedding: v }),
          })
        )
      );
    }

    daXong += kq.vectors.length;
    const giay = (Date.now() - batDau) / 1000;
    process.stdout.write(
      `\r  ${daXong}/${canLam} đoạn · ${giay.toFixed(0)}s · ${(daXong / giay).toFixed(0)} đoạn/giây   `
    );

    if (kq.hetNgay) {
      console.log(
        `\n\nDỪNG: đã cạn hạn mức của cả ngày. Còn ${canLam - daXong} đoạn.` +
          (NHA_CUNG_CAP_EMBEDDING === 'gemini'
            ? '\nĐổi sang EMBEDDING_PROVIDER=openai thì không còn trần ngày.'
            : '')
      );
      process.exit(1);
    }
    if (kq.choGiay) {
      process.stdout.write(`\n  chạm hạn mức theo phút, chờ ${kq.choGiay}s...\n`);
      await new Promise((r2) => setTimeout(r2, kq.choGiay! * 1000));
    }
    // Không sinh được vector nào mà cũng không báo chờ: dừng để khỏi lặp vô hạn
    if (!kq.vectors.length && !kq.choGiay) {
      console.log('\n\nDỪNG: một lượt không sinh được vector nào.');
      process.exit(1);
    }
  }

  const conThieu = await demDong('&embedding=is.null');
  console.log(`\n\nXONG. Còn thiếu: ${conThieu} đoạn.\n`);
  process.exit(conThieu === 0 ? 0 : 1);
}

main();
