/**
 * Gọi model thật qua toàn bộ đường đi có căn cứ — npx tsx scripts/test-rag-that.ts
 *
 * Tốn quota, nên không nằm trong bộ kiểm tra thường. Chạy khi sửa prompt hoặc
 * đổi model: đây là chỗ duy nhất biết được model có bám khuôn JSON và có chịu
 * trích mã F###/E### hay không. Hai thứ đó mà hỏng thì validator chặn sạch, và
 * chỉ chạy thật mới thấy.
 */

import { readFileSync } from 'node:fs';

// tsx không tự đọc .env.local như Next.js nên phải nạp tay
for (const dong of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const sach = dong.trim();
  if (!sach || sach.startsWith('#')) continue;
  const [khoa, ...phan] = sach.split('=');
  const giaTri = phan.join('=').trim();
  if (giaTri) process.env[khoa.trim()] = giaTri;
}

async function main() {
  const CAU_HOI = process.argv.slice(2).join(' ') || 'Năm nay tôi có nên đổi việc không?';

  // Nạp sau khi đã có biến môi trường — các module đọc key ngay khi khởi tạo
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { traLoiCoCanCu } = await import('../lib/rag/tra-loi');

  const laSo = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam', hoTen: 'Thử' });

  console.log(`\nCâu hỏi: ${CAU_HOI}\n`);

  const kq = await traLoiCoCanCu({
    laSo,
    cauHoi: CAU_HOI,
    namXem: 2026,
    thangXem: 9,
    ghiNhatKy: false,
  });

  console.log(`Model        : ${kq.provider}/${kq.model}`);
  console.log(`Chủ đề       : ${kq.goi.chuDe}`);
  console.log(`Cung liên quan: ${kq.goi.cungLienQuan.join(', ')}`);
  console.log(`Dữ kiện      : ${kq.goi.duKien.length} (${kq.goi.duKien.map((d) => d.id).join(' ')})`);
  console.log(`Nguồn        : ${kq.goi.bangChung.length}${kq.khoTrong ? ' (kho trống)' : ''}`);
  console.log(`Độ trễ       : truy hồi ${kq.doTreMs.truyHoi}ms · model ${kq.doTreMs.model}ms`);
  console.log(`Đọc được JSON: ${kq.coCauTruc ? 'CÓ' : 'KHÔNG'}`);

  if (kq.coCauTruc) {
    console.log(`Số ý         : ${kq.coCauTruc.yChinh.length} (bỏ ${kq.soYBiBo})`);
    const coTrich = kq.coCauTruc.yChinh.filter((y) => y.maDuKien.length || y.maNguon.length).length;
    console.log(`Ý có trích mã: ${coTrich}/${kq.coCauTruc.yChinh.length}`);
  }

  if (kq.kiemDuyet) {
    console.log(`Kiểm duyệt   : ${kq.kiemDuyet.dat ? 'ĐẠT' : 'KHÔNG ĐẠT'} · phủ sóng nguồn ${(kq.kiemDuyet.phuSong * 100).toFixed(0)}%`);
    for (const l of kq.kiemDuyet.loi) {
      console.log(`   [${l.mucDo}] ${l.ma}${l.tai ? ` @ "${l.tai}"` : ''} — ${l.moTa}`);
    }
  }

  console.log('\n---- BÀI ----\n');
  console.log(kq.van);
  console.log('');
}

main();
