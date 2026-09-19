/**
 * Thử một câu chat thật, in ra cả bài lẫn phần kiểm — npx tsx scripts/thu-chat.ts "câu hỏi"
 *
 * Khác `test-rag-that.ts`: tệp kia đo một câu cố định để làm hồi quy. Tệp này
 * để NHÌN — chạy đúng đường đi của người dùng rồi in ra bài, kèm các trường mới
 * (neuThi, hoiLai, goiYTiep) và kết quả kiểm duyệt, để đối chiếu bằng mắt khi
 * vừa sửa prompt.
 *
 * Gọi model thật, tốn quota. Không ghi nhật ký.
 */

import { readFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

const CAU_HOI = process.argv[2] ?? 'tôi vừa nhận được 1 offer, tôi nên nhận nó ko';

async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { traLoiCoCanCu } = await import('../lib/rag/tra-loi');
  const { namAmHienTai, thangAmHienTai } = await import('../lib/tuvi/bay-gio');
  const { bamLaSo } = await import('../lib/rag/nhat-ky');

  const laSo = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 20, gioiTinh: 'nam' });
  const chartHash = bamLaSo(24, 8, 2000, 20, 'nam');

  console.log(`\nCâu hỏi: "${CAU_HOI}"\n${'='.repeat(72)}`);

  const kq = await traLoiCoCanCu({
    laSo,
    cauHoi: CAU_HOI,
    namXem: namAmHienTai(),
    thangXem: thangAmHienTai(),
    ghiNhatKy: false,
    chartHash,
  });

  console.log('\n--- BÀI NGƯỜI ĐỌC NHẬN ---\n');
  console.log(kq.van);

  console.log(`\n${'-'.repeat(72)}\n--- PHẦN KIỂM ---`);
  console.log(`model      ${kq.provider}/${kq.model}`);
  console.log(`độ trễ     truy hồi ${kq.doTreMs.truyHoi}ms · model ${kq.doTreMs.model}ms`);
  console.log(`nguồn      ${kq.goi.bangChung.length} đoạn · kho trống: ${kq.khoTrong}`);
  console.log(`ý bị bỏ    ${kq.soYBiBo}`);

  const c = kq.coCauTruc;
  if (!c) {
    console.log('\nModel KHÔNG trả về JSON đọc được — bài trên là nguyên văn, chưa qua validator.');
    return;
  }

  console.log(`\nhoiLai     ${c.hoiLai ?? '(KHÔNG CÓ)'}`);
  console.log(`goiYTiep   ${c.goiYTiep?.length ? c.goiYTiep.join(' · ') : '(KHÔNG CÓ)'}`);
  console.log(`\nneuThi theo từng ý:`);
  for (const y of c.yChinh) {
    console.log(`  [${y.mucChacChan ?? '—'}] ${y.tieuDe || '(không tiêu đề)'}`);
    console.log(`     neuThi: ${y.neuThi ?? '(KHÔNG CÓ)'}`);
    console.log(`     lực ngược: ${y.luongNguoc ?? '(KHÔNG CÓ)'}`);
  }

  if (kq.kiemDuyet?.loi.length) {
    console.log(`\nValidator bắt ${kq.kiemDuyet.loi.length} lỗi:`);
    for (const l of kq.kiemDuyet.loi) console.log(`  [${l.mucDo}] ${l.ma} — ${l.moTa} (${l.tai})`);
  } else {
    console.log('\nValidator: sạch');
  }

  if (kq.ngonNgu?.loi.length) {
    console.log(`\nCổng ngôn ngữ bắt ${kq.ngonNgu.loi.length} lỗi:`);
    for (const l of kq.ngonNgu.loi) console.log(`  [${l.mucDo}] ${l.ma} — ${l.viDu ?? l.moTa}`);
  } else {
    console.log('Cổng ngôn ngữ: sạch');
  }
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
