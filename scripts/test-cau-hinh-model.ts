/**
 * Kiểm chuỗi model lưu trong database — npx tsx scripts/test-cau-hinh-model.ts
 *
 * Chạm database thật. Tự dọn sạch những dòng nó thêm vào.
 *
 * Điều cần chứng minh: bảng trống thì hệ thống đọc env như cũ (thêm bảng không
 * làm đổi gì), có dòng thì bảng là nguồn duy nhất, và API key đi vào database
 * rồi thì không quay ra ngoài dưới dạng đọc được.
 */

import { readFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

async function main() {
  const { maHoa, giaiMa, cheKey, coKhoaMaHoa } = await import('../lib/ai/ma-hoa');
  const { danhSachModelThuc, cauHinhChoQuanTri } = await import('../lib/ai/nguon-cau-hinh');
  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');

  let sai = 0;
  const kiem = (ten: string, ok: boolean, chiTiet?: unknown) => {
    if (!ok) sai += 1;
    console.log(`  ${ok ? 'OK  ' : 'SAI '} ${ten}${!ok && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`);
  };

  console.log('\n== MÃ HOÁ ==');
  kiem('Có CONFIG_SECRET', coKhoaMaHoa());
  const mau = 'sk-test-0123456789abcdef';
  const ma = maHoa(mau);
  kiem('Mã hoá rồi giải mã ra đúng chuỗi cũ', giaiMa(ma) === mau);
  kiem('Ciphertext không chứa chuỗi gốc', !ma.includes(mau), ma.slice(0, 40));
  kiem('Hai lần mã hoá cho hai ciphertext khác nhau', maHoa(mau) !== maHoa(mau));
  kiem('Chuỗi hỏng thì trả null, không ném lỗi', giaiMa('rac.rac.rac') === null);
  kiem('Che key giữ 4 đầu 4 cuối', cheKey(mau) === 'sk-t••••cdef', cheKey(mau));

  const supabase = taoSupabaseAdmin();
  if (!supabase) {
    console.log('\nDỪNG: chưa có SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const { count: banDau } = await supabase
    .from('ai_model_configs')
    .select('*', { count: 'exact', head: true });

  console.log('\n== BẢNG TRỐNG THÌ ĐỌC TỪ BIẾN MÔI TRƯỜNG ==');
  if ((banDau ?? 0) === 0) {
    const { tuDatabase, ds } = await danhSachModelThuc();
    kiem('Nguồn là biến môi trường', !tuDatabase);
    kiem(`Có ${ds.length} model từ env`, ds.length > 0, ds.map((m) => m.provider));
  } else {
    console.log(`  (bỏ qua — bảng đang có ${banDau} dòng)`);
  }

  console.log('\n== THÊM MỘT DÒNG THÌ BẢNG THÀNH NGUỒN DUY NHẤT ==');
  const { data: them, error: loiThem } = await supabase
    .from('ai_model_configs')
    .insert({
      provider: 'openai',
      model: 'kiem-thu-tu-dong',
      api_key_ma: maHoa('sk-kiem-thu-khong-dung-that'),
      uu_tien: 999,
      ghi_chu: 'dòng kiểm thử tự động — sẽ bị xoá',
    })
    .select('id')
    .single();
  kiem('Thêm được dòng', !loiThem, loiThem?.message);

  try {
    const { tuDatabase, ds } = await danhSachModelThuc();
    kiem('Nguồn chuyển sang database', tuDatabase);
    kiem(
      'Dòng vừa thêm có mặt',
      ds.some((m) => m.model === 'kiem-thu-tu-dong'),
      ds.map((m) => m.model)
    );

    const qt = await cauHinhChoQuanTri();
    const dong = qt.dong.find((x) => x.model === 'kiem-thu-tu-dong');
    kiem('Trang quản trị thấy dòng đó', Boolean(dong));
    kiem('Được đánh dấu là có key riêng', dong?.coKeyRieng === true);

    // Quan trọng nhất: không có đường nào để key đầy đủ ra ngoài
    const chuoi = JSON.stringify(qt);
    kiem('Dữ liệu gửi ra không chứa key đầy đủ', !chuoi.includes('sk-kiem-thu-khong-dung-that'));
    kiem('Cũng không chứa ciphertext', !chuoi.includes('api_key_ma'));
    kiem('Chỉ có dạng rút gọn', chuoi.includes('••••'));
  } finally {
    console.log('\n== DỌN DẸP ==');
    if (them?.id) await supabase.from('ai_model_configs').delete().eq('id', them.id);
    const { count } = await supabase
      .from('ai_model_configs')
      .select('*', { count: 'exact', head: true });
    kiem('Bảng trở về số dòng ban đầu', count === (banDau ?? 0), { truoc: banDau, sau: count });
  }

  console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} KIỂM TRA SAI\n`);
  process.exit(sai === 0 ? 0 : 1);
}

main();
