/**
 * Đọc bài luận giải dài qua đường đi mới — npx tsx scripts/test-bai-dai.ts [chuDe] [provider|model]
 *
 * Gọi model thật. In cả bài để đọc bằng mắt, kèm ba con số đo được:
 *   - tỉ lệ câu có tên sao (chỉ số "kê sao dài dòng")
 *   - kết quả kiểm duyệt tất định (mã bịa, sao bịa)
 *   - kết quả cổng ngôn ngữ (khuôn lặp, từ thô, phán quyết)
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
  const chuDe = (process.argv[2] ?? 'tong-quan') as import('../lib/ai/prompt').ChuDeId;
  // Đối số 3: ép một model trong chuỗi, dạng "gemini|gemini-3.6-flash"
  const uuTienModel = process.argv[3];
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { luanBaiDai } = await import('../lib/rag/bai-dai');
  const { nhanDangThucThe } = await import('../lib/rag/thuc-the');

  const laSo = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });
  const t0 = Date.now();
  const kq = await luanBaiDai({ laSo, chuDe, namXem: 2026, thangXem: 9, ghiNhatKy: false, uuTienModel });

  const cau = kq.van.split(/(?<=[.!?])\s+/).filter((c) => c.length > 20);
  const cauCoSao = cau.filter((c) => nhanDangThucThe(c).some((t) => t.loai === 'STAR')).length;

  console.log(`MODEL ${kq.provider}/${kq.model} · ${Date.now() - t0}ms · ${kq.van.split(/\s+/).length} từ`);
  for (const h of kq.daThuHong) console.log(`  đã rơi: ${h.provider}/${h.model} — ${h.loi.slice(0, 110)}`);
  console.log(`Dữ kiện đưa vào: ${kq.goi.duKien.length} (không phải 12 cung) · nguồn: ${kq.goi.bangChung.length}`);
  console.log(`Đọc được JSON: ${kq.coCauTruc ? 'CÓ' : 'KHÔNG'}`);
  if (kq.coCauTruc) {
    console.log(
      `Cấu trúc: ${kq.coCauTruc.baDieu.length} điều nhớ · ${kq.coCauTruc.diemManh.length} điểm mạnh · ${kq.coCauTruc.choDeKet.length} chỗ kẹt · ghép lại: ${kq.coCauTruc.ghepLai ? 'có' : 'KHÔNG'} · mang theo: ${kq.coCauTruc.mangTheo.length}`
    );
    const coLucNguoc = [kq.coCauTruc.cauTruc, ...kq.coCauTruc.diemManh, ...kq.coCauTruc.choDeKet].filter((y) => y.luongNguoc).length;
    console.log(`Ý có lực ngược: ${coLucNguoc}`);
  }
  console.log(`Câu có tên sao: ${cauCoSao}/${cau.length} (${Math.round((cauCoSao / cau.length) * 100)}%)`);
  console.log(`Kiểm duyệt: ${kq.kiemDuyet.dat ? 'ĐẠT' : 'KHÔNG'} · bỏ ${kq.kiemDuyet.soYBiBo} ý`);
  for (const l of kq.kiemDuyet.loi) console.log(`   - ${l}`);
  console.log(
    `Ngôn ngữ: ${kq.ngonNgu?.dat ? 'đạt' : 'KHÔNG'} · lặp khuôn ${((kq.ngonNgu?.tyLeMoDauTrung ?? 0) * 100).toFixed(0)}% · ${kq.ngonNgu?.loi.map((l) => l.ma + (l.viDu ? `(${l.viDu})` : '')).join(', ') || 'sạch'}`
  );
  console.log('\n' + '─'.repeat(72) + '\n');
  console.log(kq.van);
  console.log('');
}

main();
