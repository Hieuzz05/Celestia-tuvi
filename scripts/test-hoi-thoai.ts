/**
 * Nghiệm thu trí nhớ hội thoại — npx tsx scripts/test-hoi-thoai.ts
 *
 * Chạm DATABASE THẬT nhưng KHÔNG gọi model. Ghi vào bảng `chat_messages` bằng
 * một khoá phiên riêng rồi xoá sạch ở cuối, nên nó không đụng hội thoại của ai.
 *
 * Bốn thứ cần chắc, và không thứ nào đọc được từ mã nguồn:
 *
 *  1. Bảng `chat_messages` có thật, đúng tên cột, ghi vào được.
 *  2. Đọc ra ĐÚNG THỨ TỰ. Đây là chỗ dễ sai nhất: muốn lấy N lượt gần nhất thì
 *     phải sắp NGƯỢC rồi lật lại, mà sắp xuôi rồi `limit` cũng chạy trơn tru và
 *     cho ra đoạn ĐẦU cuộc trò chuyện — sai mà không có lỗi nào báo.
 *  3. Hai lá số khác nhau không lẫn vào nhau.
 *  4. Xoá là xoá thật.
 *
 * Chạy bằng service role vì script không có phiên đăng nhập của trình duyệt.
 * Điều đó nghĩa là nó KHÔNG kiểm được RLS — phần ấy phải kiểm bằng tay, xem
 * mục hướng dẫn trong `supabase/DA-CHAY.md`.
 */

import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

let sai = 0;
function kiem(ten: string, ok: boolean, chiTiet?: unknown) {
  if (!ok) sai += 1;
  console.log(
    `  ${ok ? 'OK  ' : 'SAI '} ${ten}${!ok && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`
  );
}

async function main() {
  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');
  const { bamLaSo } = await import('../lib/rag/nhat-ky');

  const sb = taoSupabaseAdmin();
  if (!sb) throw new Error('Thiếu SUPABASE_SERVICE_ROLE_KEY');

  // Khoá phiên riêng cho lần chạy này, để không đụng dữ liệu thật
  const phienA = `test-${randomUUID().slice(0, 8)}`;
  const phienB = `test-${randomUUID().slice(0, 8)}`;

  // Cần một user_id có thật vì cột tham chiếu auth.users
  const { data: ds } = await sb.auth.admin.listUsers({ perPage: 1 });
  const userId = ds?.users[0]?.id;
  if (!userId) throw new Error('Database chưa có tài khoản nào để chạy thử');

  const don = async () => {
    await sb.from('chat_messages').delete().in('phien', [phienA, phienB]);
  };

  try {
    console.log('\n== GHI VÀ ĐỌC ==\n');

    // 12 lượt để vượt qua mốc 20 dòng khi nhân đôi
    const luot: { vai_tro: string; noi_dung: string }[] = [];
    for (let i = 1; i <= 12; i++) {
      luot.push({ vai_tro: 'nguoi-dung', noi_dung: `hỏi ${i}` });
      luot.push({ vai_tro: 'tro-ly', noi_dung: `đáp ${i}` });
    }

    /*
     * Chèn ĐÚNG CÁCH `luuLuot` chèn: cả cặp trong một lệnh, `tao_luc` đặt tường
     * minh và lệch nhau 1ms.
     *
     * Bản đầu của bài kiểm này chèn từng cặp rồi chờ 12ms — tức là nó tự né
     * đúng cái lỗi nó phải bắt. Một bài kiểm đi đường khác với mã thật thì nó
     * chỉ chứng minh được rằng đường khác ấy chạy được.
     */
    for (let i = 0; i < luot.length; i += 2) {
      const luc = Date.now() + i * 10;
      const { error } = await sb.from('chat_messages').insert([
        { user_id: userId, phien: phienA, ...luot[i], tao_luc: new Date(luc).toISOString() },
        { user_id: userId, phien: phienA, ...luot[i + 1], tao_luc: new Date(luc + 1).toISOString() },
      ]);
      if (error) throw new Error(`Ghi hỏng: ${error.message}`);
    }

    await sb
      .from('chat_messages')
      .insert([{ user_id: userId, phien: phienB, vai_tro: 'nguoi-dung', noi_dung: 'lá số khác' }]);

    const doc = async (phien: string, soLuot = 20) => {
      const { data } = await sb
        .from('chat_messages')
        .select('vai_tro, noi_dung')
        .eq('phien', phien)
        .order('tao_luc', { ascending: false })
        .limit(soLuot);
      return ((data ?? []) as { vai_tro: string; noi_dung: string }[]).reverse();
    };

    const a = await doc(phienA);
    kiem('Ghi và đọc lại được', a.length > 0, { soDong: a.length });
    kiem('Lấy đúng 20 lượt gần nhất', a.length === 20, { soDong: a.length });

    // Đây là phép kiểm quan trọng nhất của cả tệp
    kiem(
      'Lượt CUỐI là lượt MỚI NHẤT, không phải lượt đầu cuộc trò chuyện',
      a[a.length - 1]?.noi_dung === 'đáp 12',
      { cuoi: a[a.length - 1]?.noi_dung }
    );
    kiem('Lượt đầu đã bị cắt vì quá 20', !a.some((x) => x.noi_dung === 'hỏi 1'), {
      dau: a[0]?.noi_dung,
    });
    /*
     * Trong TỪNG CẶP, "hỏi" phải đứng trước "đáp".
     *
     * Đây là phép kiểm bắt được lỗi cùng-mốc-thời-gian: nếu hai dòng của một
     * cặp có cùng `tao_luc` thì thứ tự trả về là tuỳ Postgres, và bài kiểm này
     * sẽ đỏ lúc được lúc không — đúng kiểu lỗi khó chịu nhất.
     */
    const lechCap = a.filter((x, i) => i % 2 === 0 && x.vai_tro !== 'nguoi-dung');
    kiem('Trong mỗi cặp, "hỏi" đứng trước "đáp"', lechCap.length === 0, {
      lech: lechCap.map((x) => x.noi_dung),
    });
    kiem(
      'Không có lượt nào lặp lại',
      new Set(a.map((x) => x.noi_dung)).size === a.length
    );

    console.log('\n== HAI LÁ SỐ KHÔNG LẪN VÀO NHAU ==\n');
    const b = await doc(phienB);
    kiem('Lá số B chỉ thấy lượt của chính nó', b.length === 1, { soDong: b.length });
    kiem('Lá số A không thấy lượt của B', !a.some((x) => x.noi_dung === 'lá số khác'));

    console.log('\n== BẰM Ở MÁY CHỦ VÀ Ở TRÌNH DUYỆT PHẢI GIỐNG NHAU ==\n');
    const mayChu = bamLaSo(24, 8, 2000, 20, 'nam');
    // Bản trình duyệt dùng Web Crypto; ở đây dựng lại bằng cùng công thức để
    // đối chiếu. Lệch nhau là mạch hội thoại rẽ làm hai mà không ai thấy.
    const trinhDuyet = createHash('sha256')
      .update('24-8-2000-20-nam')
      .digest('hex')
      .slice(0, 16);
    kiem('Hai bên cho ra cùng một khoá', mayChu === trinhDuyet, { mayChu, trinhDuyet });

    console.log('\n== XOÁ ==\n');
    await sb.from('chat_messages').delete().eq('phien', phienA);
    const sauXoa = await doc(phienA);
    kiem('Xoá là xoá thật', sauXoa.length === 0, { conLai: sauXoa.length });
  } finally {
    await don();
  }

  console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} MỤC SAI\n`);
  process.exit(sai === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
