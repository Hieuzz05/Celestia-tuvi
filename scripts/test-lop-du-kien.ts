/**
 * Lớp thời gian của dữ kiện — offline, tất định, không gọi model.
 *
 *   npx tsx scripts/test-lop-du-kien.ts          # kiểm
 *   npx tsx scripts/test-lop-du-kien.ts --vet    # in thêm trace dữ kiện 2026 / 2027 của lá đối chiếu
 *
 * Lỗi đã lọt (05/10/2026): Tang Tuế Điếu và Thiên Mã gặp Tuế Phá được dựng từ vòng Thái Tuế
 * của LÁ SỐ GỐC (an theo năm sinh), rồi vào bài vận hạn như căn cứ của NĂM XEM. Lá đối chiếu
 * Canh Thìn 2000 có Thái Tuế gốc ở Thìn, còn lưu Thái Tuế 2026 ở Ngọ — bài 2026 vẫn có cả một
 * mục "Việc ngoài ý muốn chen vào" dựng trên vòng của năm 2000, và đổi sang 2027 mục ấy y nguyên.
 *
 * Bài này canh ba điều:
 *  1. Không dữ kiện nào mang tổ hợp vòng Thái Tuế gốc như cách cục (mọi bề mặt dùng chonBoiCanh).
 *  2. Mọi dữ kiện có `lop`; dữ kiện `ban-menh` không đổi theo năm xem và không nhắc năm xem;
 *     dữ kiện lớp hạn mang đúng năm / tháng.
 *  3. Bài dài loại ý nhắc tên cách cục không có trong dữ kiện (đúng luật chat đang có).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

for (const k of Object.keys(process.env)) {
  if (/SUPABASE|_API_KEY$/.test(k)) delete process.env[k];
}

let loi = 0;
let soCa = 0;
const kiem = (dk: boolean, msg: string) => {
  soCa++;
  if (!dk) {
    loi++;
    console.error('  ✗', msg);
  }
};

const LOP_HOP_LE = new Set(['ban-menh', 'dai-han', 'tieu-han', 'luu-nien', 'nguyet-han']);
/** Tổ hợp đọc trên vòng Thái Tuế — chỉ có nghĩa với vòng của NĂM XEM, engine chưa an vòng ấy */
const VONG_THAI_TUE = ['Tang Tuế Điếu', 'Thiên Mã gặp Tuế Phá'];

async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { nhanDangCachCuc } = await import('../lib/tuvi/cach-cuc');
  const { chonBoiCanh, saoChinhTheoCung, tenCachCucCho } = await import('../lib/rag/boi-canh-la-so');
  const { keHoachBaiDai, cachCucNgoaiDuKien } = await import('../lib/rag/bai-dai');
  const { lapKeHoach } = await import('../lib/rag/planner');
  const { CHU_DE } = await import('../lib/ai/prompt');
  type ChuDeId = keyof typeof CHU_DE;

  /* ---------------------------------------- 1. lá đối chiếu: bài dài vận hạn 2026 vs 2027 */

  // Lá số của báo cáo so sánh Opus–Celes (D:\Celestia\la-so-canh-thin-2000-duong-nam.md)
  const doiChieu = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 20, phut: 30, gioiTinh: 'nam' });
  const dkNam = (nam: number, chuDe: ChuDeId = 'van-han') =>
    chonBoiCanh({ laSo: doiChieu, keHoach: keHoachBaiDai({ laSo: doiChieu, chuDe }).keHoach, namXem: nam, thangXem: 10 })
      .duKien;

  console.log('\n== 1. Lá đối chiếu 24/08/2000 20:30 nam — bài dài vận hạn ==');
  const d26 = dkNam(2026);
  const d27 = dkNam(2027);

  if (process.argv.includes('--vet')) {
    for (const [nam, ds] of [[2026, d26], [2027, d27]] as const) {
      console.log(`\n  -- ${nam}`);
      for (const f of ds) console.log(`  ${f.id} [${f.lop ?? '??'}] ${f.loai.padEnd(10)} ${f.noiDung.slice(0, 110)}`);
    }
    console.log('');
  }

  for (const [nam, ds] of [[2026, d26], [2027, d27]] as const) {
    const vong = ds.filter((f) => f.tenCachCuc && VONG_THAI_TUE.includes(f.tenCachCuc));
    kiem(vong.length === 0, `${nam}: còn tổ hợp vòng Thái Tuế gốc làm dữ kiện: ${vong.map((f) => `${f.id} ${f.tenCachCuc}`).join(', ')}`);
    const thieu = ds.filter((f) => !f.lop || !LOP_HOP_LE.has(f.lop));
    kiem(thieu.length === 0, `${nam}: dữ kiện thiếu / sai lớp: ${thieu.map((f) => f.id).join(', ')}`);
    const goc = ds.filter((f) => f.lop === 'ban-menh');
    const nhacNam = goc.filter((f) => /năm nay|\b20\d\d\b/i.test(f.noiDung));
    kiem(nhacNam.length === 0, `${nam}: dữ kiện bản mệnh nhắc năm: ${nhacNam.map((f) => f.id).join(', ')}`);
    const th = ds.find((f) => f.lop === 'tieu-han');
    kiem(!!th && th.noiDung.includes(`Năm ${nam}`), `${nam}: dữ kiện tiểu hạn phải mang đúng năm ${nam}`);
    const nh = ds.find((f) => f.lop === 'nguyet-han');
    kiem(!!nh && nh.noiDung.includes(`/${nam}`), `${nam}: dữ kiện nguyệt hạn phải mang đúng năm ${nam}`);
    kiem(ds.some((f) => f.lop === 'dai-han'), `${nam}: bài vận hạn phải có dữ kiện đại hạn`);
  }

  // Nền bản mệnh được phép giống nhau giữa hai năm — và PHẢI giống: nó không phụ thuộc năm xem
  const goc = (ds: typeof d26) => ds.filter((f) => f.lop === 'ban-menh').map((f) => f.noiDung);
  kiem(JSON.stringify(goc(d26)) === JSON.stringify(goc(d27)), 'nền bản mệnh phải y hệt giữa 2026 và 2027');
  // Phần đổi giữa hai năm phải nằm trọn trong lớp hạn
  const doi = d26
    .map((f, i) => [f, d27[i]] as const)
    .filter(([a, b]) => a.noiDung !== b?.noiDung)
    .map(([a]) => a);
  kiem(doi.length > 0 && doi.every((f) => f.lop !== 'ban-menh'), 'dữ kiện đổi giữa hai năm phải đều thuộc lớp hạn');
  // 2027 tiểu hạn sang cung khác (Dương Nam đi thuận) — căn cứ năm phải đổi thật, không chỉ đổi số năm
  const th26 = d26.find((f) => f.lop === 'tieu-han');
  const th27 = d27.find((f) => f.lop === 'tieu-han');
  kiem(!!th26 && !!th27 && th26.cung !== th27.cung, `tiểu hạn 2026 (${th26?.cung}) và 2027 (${th27?.cung}) phải khác cung`);

  // Cùng gốc: bài sự nghiệp của lá này cũng nhận hai tổ hợp ấy (lopHan có luu-nien)
  const sn = dkNam(2026, 'su-nghiep');
  kiem(
    !sn.some((f) => f.tenCachCuc && VONG_THAI_TUE.includes(f.tenCachCuc)),
    'bài sự nghiệp 2026: còn tổ hợp vòng Thái Tuế gốc'
  );

  /* ---------------------------------------- 2. quét 60 lá mẫu × mọi chủ đề bài dài + chat */

  console.log('== 2. Quét 60 lá mẫu × chủ đề bài dài × câu chat ==');
  const mau = JSON.parse(readFileSync(join(__dirname, 'mau-ansao.json'), 'utf8')).mau as Record<string, string>;
  const CAU_CHAT = ['Năm nay công việc của tôi thế nào?', 'Tháng 10 âm năm nay tiền bạc ra sao?', 'Tính cách tôi thế nào?'];
  let soLa = 0;
  let viPham = 0;
  let lechLop = 0;
  let banMenhCoHan = 0;
  for (const k of Object.keys(mau)) {
    const m = k.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/);
    if (!m) continue;
    const laSo = lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' });
    soLa++;

    // Engine: không cung trọng tâm nào phát tổ hợp vòng Thái Tuế gốc
    for (const c of laSo.cungs) {
      if (nhanDangCachCuc(laSo, c.tenCung).some((cc) => VONG_THAI_TUE.includes(cc.ten))) viPham++;
    }

    const goiDs: { lopHanCoHan: boolean; ds: ReturnType<typeof chonBoiCanh>['duKien'] }[] = [];
    for (const chuDe of Object.keys(CHU_DE) as ChuDeId[]) {
      const { keHoach } = keHoachBaiDai({ laSo, chuDe });
      goiDs.push({
        lopHanCoHan: keHoach.lopHan.some((l) => l !== 'ban-menh'),
        ds: chonBoiCanh({ laSo, keHoach, namXem: 2026, thangXem: 10 }).duKien,
      });
    }
    for (const cau of CAU_CHAT) {
      const keHoach = lapKeHoach({
        cauHoi: cau,
        saoTheoCung: saoChinhTheoCung(laSo),
        tenCachCuc: tenCachCucCho(laSo),
      });
      for (const focused of [false, true]) {
        goiDs.push({
          lopHanCoHan: keHoach.lopHan.some((l) => l !== 'ban-menh'),
          ds: chonBoiCanh({ laSo, keHoach, namXem: 2026, thangXem: 10, focused }).duKien,
        });
      }
    }
    for (const { lopHanCoHan, ds } of goiDs) {
      if (ds.some((f) => f.tenCachCuc && VONG_THAI_TUE.includes(f.tenCachCuc))) viPham++;
      if (ds.some((f) => !f.lop || !LOP_HOP_LE.has(f.lop))) lechLop++;
      if (ds.some((f) => f.lop === 'ban-menh' && /năm nay|\b20\d\d\b/i.test(f.noiDung))) lechLop++;
      // Luồng bản mệnh giữ phạm vi cũ: không hỏi hạn thì không có dữ kiện lớp hạn nào
      if (!lopHanCoHan && ds.some((f) => f.lop !== 'ban-menh')) banMenhCoHan++;
    }
  }
  kiem(soLa >= 60, `đọc được ${soLa} lá mẫu (cần ≥ 60)`);
  kiem(viPham === 0, `${viPham} lần tổ hợp vòng Thái Tuế gốc còn lọt (engine hoặc dữ kiện)`);
  kiem(lechLop === 0, `${lechLop} gói dữ kiện thiếu lớp hoặc dữ kiện bản mệnh nhắc năm`);
  kiem(banMenhCoHan === 0, `${banMenhCoHan} gói bản mệnh lại có dữ kiện lớp hạn`);

  /* ---------------------------------------- 3. bài dài: tên cách cục ngoài dữ kiện */

  console.log('== 3. Bài dài loại ý nhắc cách cục không có trong dữ kiện ==');
  const dkTaHuu = [{ id: 'F001', loai: 'cach-cuc' as const, lop: 'ban-menh' as const, noiDung: 'Cách cục Tả Hữu tại Mệnh.', tenCachCuc: 'Tả Hữu' }];
  kiem(
    JSON.stringify(cachCucNgoaiDuKien('Năm nay Tang Tuế Điếu báo nhiều chuyện phải đối đáp.', dkTaHuu)) ===
      JSON.stringify(['Tang Tuế Điếu']),
    'nhắc Tang Tuế Điếu khi dữ kiện không có → phải bị bắt'
  );
  kiem(
    cachCucNgoaiDuKien('thien ma gap tue pha nen de bi cat ngang', dkTaHuu).includes('Thiên Mã gặp Tuế Phá'),
    'bắt cả khi viết không dấu'
  );
  kiem(cachCucNgoaiDuKien('Bộ Tả Hữu cho thấy bạn có người phụ tá.', dkTaHuu).length === 0, 'cách cục có trong dữ kiện → không bắt');
  kiem(cachCucNgoaiDuKien('Năm nay bạn nên giữ nhịp làm việc đều.', dkTaHuu).length === 0, 'câu không nhắc cách cục → không bắt');
  // Tên lồng nhau: "Tuần và Triệt án ngữ" chứa "Triệt án ngữ" — không được bắt nhầm tên ngắn.
  const dkTuanTriet = [{ tenCachCuc: 'Tuần và Triệt án ngữ' }];
  kiem(
    cachCucNgoaiDuKien('Cung này có Tuần và Triệt án ngữ nên việc lộ ra chậm.', dkTuanTriet).length === 0,
    'tên lồng nhau "Tuần và Triệt án ngữ" → không bắt nhầm "Triệt án ngữ"'
  );
  kiem(
    JSON.stringify(cachCucNgoaiDuKien('Có Triệt án ngữ chặn đầu.', [{ tenCachCuc: 'Tuần án ngữ' }])) === '["Triệt án ngữ"]',
    'tên ngắn đứng riêng không có trong dữ kiện → vẫn bắt'
  );

  console.log(`\n${loi ? `✗ ${loi}/${soCa} ca hỏng` : `✓ ${soCa} ca xanh`}`);
  process.exit(loi ? 1 : 0);
}

main();
