/**
 * Script kiểm chứng engine an sao - chạy: npx tsx scripts/test-ansao.ts
 * In ra lá số dạng text để đối chiếu thủ công với các trang tử vi uy tín.
 */

import { lapLaSo, luuTinhTheoNam, viTriTuVi, type ThongTinSinh } from '../lib/tuvi/ansao';
import { doSangCuaSao } from '../lib/tuvi/dosang';
import { solarToLunar, lunarToSolar } from '../lib/tuvi/lunar';
import { CHI } from '../lib/tuvi/constants';

function inLaSo(input: ThongTinSinh) {
  const ls = lapLaSo(input);
  const t = ls.thongTin;
  console.log('='.repeat(70));
  console.log(
    `${t.hoTen ?? '(không tên)'} — ${t.ngay}/${t.thang}/${t.nam} ${String(t.gio).padStart(2, '0')}h — ${t.gioiTinh === 'nam' ? 'Nam' : 'Nữ'}`
  );
  console.log(
    `Âm lịch: ${t.amLich.ngay}/${t.amLich.thang}${t.amLich.nhuan ? ' (nhuận)' : ''}/${t.amLich.nam}`
  );
  console.log(
    `Can chi: năm ${t.canChiNam} | tháng ${t.canChiThang} | ngày ${t.canChiNgay} | giờ ${t.canChiGio}`
  );
  console.log(
    `${ls.amDuong} | Mệnh tại ${CHI[ls.menhIndex]} | Thân cư ${ls.thanCuCung} (${CHI[ls.thanIndex]})`
  );
  console.log(
    `Cục: ${ls.cuc.ten} | Bản Mệnh: ${ls.banMenh.ten} | ${ls.menhCucQuanHe} | ${ls.amDuongThuanLy}`
  );
  console.log(`Mệnh chủ: ${ls.menhChu} | Thân chủ: ${ls.thanChu}`);
  console.log('-'.repeat(70));
  for (const c of ls.cungs) {
    const flags = [
      c.laCungMenh ? 'MỆNH' : '',
      c.laCungThan ? 'THÂN' : '',
      c.coTuan ? 'Tuần' : '',
      c.coTriet ? 'Triệt' : '',
    ]
      .filter(Boolean)
      .join(',');
    const dv = c.daiVan ? `[${c.daiVan.tuTuoi}-${c.daiVan.denTuoi}]` : '';
    const chinh = c.sao
      .filter((s) => s.loai === 'chinh-tinh')
      .map((s) => s.ten)
      .join(', ');
    const khac = c.sao
      .filter((s) => s.loai !== 'chinh-tinh')
      .map((s) => s.ten)
      .join(', ');
    console.log(
      `${c.can} ${c.chi.padEnd(5)} | ${c.tenCung.padEnd(10)} ${dv.padEnd(9)} ${flags.padEnd(16)}`
    );
    console.log(`   Chính tinh: ${chinh || '(vô chính diệu)'}`);
    console.log(`   Phụ tinh  : ${khac}`);
  }

  // Kiểm tra tính toàn vẹn
  const tongSao = ls.cungs.reduce((s, c) => s + c.sao.length, 0);
  const chinhTinh = ls.cungs.reduce(
    (s, c) => s + c.sao.filter((x) => x.loai === 'chinh-tinh').length,
    0
  );
  console.log('-'.repeat(70));
  console.log(`Tổng số sao: ${tongSao} | Chính tinh: ${chinhTinh} (phải = 14)`);
  if (chinhTinh !== 14) throw new Error('SAI: số chính tinh phải bằng 14');
  const cungCoTuan = ls.cungs.filter((c) => c.coTuan).length;
  const cungCoTriet = ls.cungs.filter((c) => c.coTriet).length;
  if (cungCoTuan !== 2 || cungCoTriet !== 2) throw new Error('SAI: Tuần/Triệt phải chiếm 2 cung');
  return ls;
}

// --- Kiểm chứng bảng an Tử Vi theo cục & ngày (đối chiếu bảng tra truyền thống) ---
function kiemTraBangTuVi() {
  const kyVong: Record<number, Record<number, string>> = {
    2: { 1: 'Sửu', 2: 'Dần', 3: 'Dần', 4: 'Mão', 5: 'Mão' },
    3: { 1: 'Thìn', 2: 'Sửu', 3: 'Dần', 4: 'Tỵ', 5: 'Dần' },
    4: { 1: 'Hợi', 2: 'Thìn', 3: 'Sửu', 4: 'Dần', 5: 'Tý' },
    5: { 1: 'Ngọ', 2: 'Hợi', 3: 'Thìn', 4: 'Sửu', 5: 'Dần' },
    6: { 1: 'Dậu', 2: 'Ngọ', 3: 'Hợi', 4: 'Thìn', 5: 'Sửu' },
  };
  let loi = 0;
  for (const cucStr of Object.keys(kyVong)) {
    const cuc = Number(cucStr);
    for (const ngayStr of Object.keys(kyVong[cuc])) {
      const ngay = Number(ngayStr);
      const got = CHI[viTriTuVi(cuc, ngay)];
      const want = kyVong[cuc][ngay];
      if (got !== want) {
        console.log(`  SAI: cục ${cuc} ngày ${ngay} → ${got}, kỳ vọng ${want}`);
        loi++;
      }
    }
  }
  console.log(loi === 0 ? '✓ Bảng an Tử Vi khớp bảng tra truyền thống' : `✗ ${loi} lỗi`);
}

// --- Kiểm chứng chuyển đổi âm dương lịch với các mốc đã biết ---
function kiemTraLich() {
  const cases: [number, number, number, number, number, number][] = [
    // dd, mm, yyyy dương -> dd, mm, yyyy âm
    [10, 2, 2024, 1, 1, 2024], // Mùng 1 Tết Giáp Thìn
    [1, 1, 2000, 25, 11, 1999],
    [29, 1, 2025, 1, 1, 2025], // Mùng 1 Tết Ất Tỵ
    [17, 2, 2026, 1, 1, 2026], // Mùng 1 Tết Bính Ngọ
  ];
  let loi = 0;
  for (const [d, m, y, ld, lm, ly] of cases) {
    const r = solarToLunar(d, m, y);
    if (r.day !== ld || r.month !== lm || r.year !== ly) {
      console.log(`  SAI: ${d}/${m}/${y} → ${r.day}/${r.month}/${r.year}, kỳ vọng ${ld}/${lm}/${ly}`);
      loi++;
    }
    const back = lunarToSolar(r.day, r.month, r.year, r.isLeapMonth);
    if (!back || back.day !== d || back.month !== m || back.year !== y) {
      console.log(`  SAI round-trip: ${d}/${m}/${y} → ${JSON.stringify(back)}`);
      loi++;
    }
  }
  console.log(loi === 0 ? '✓ Chuyển đổi âm dương lịch khớp mốc đã biết' : `✗ ${loi} lỗi lịch`);
}

console.log('### Kiểm tra bảng an Tử Vi');
kiemTraBangTuVi();
console.log('\n### Kiểm tra lịch âm dương');
kiemTraLich();
console.log('\n### Lá số mẫu');
inLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 10, gioiTinh: 'nam', hoTen: 'Mẫu A' });
inLaSo({ ngay: 15, thang: 3, nam: 1990, gio: 23, gioiTinh: 'nu', hoTen: 'Mẫu B (giờ Tý sớm)' });

// --- Kiểm chứng các sao có vị trí cố định theo cung ---
function kiemTraSaoCoDinh() {
  const ls = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 9, gioiTinh: 'nam' });
  const cungCuaSao = (ten: string) =>
    ls.cungs.find((c) => c.sao.some((s) => s.ten === ten))?.tenCung ?? '(không có)';
  const kyVong: [string, string][] = [
    ['Thiên Thương', 'Nô Bộc'],
    ['Thiên Sứ', 'Tật Ách'],
  ];
  let loi = 0;
  for (const [sao, cung] of kyVong) {
    const thuc = cungCuaSao(sao);
    if (thuc !== cung) {
      console.log(`  SAI: ${sao} nằm ở ${thuc}, kỳ vọng ${cung}`);
      loi++;
    }
  }
  // Thiên La luôn tại Thìn, Địa Võng luôn tại Tuất
  const chiCuaSao = (ten: string) =>
    ls.cungs.find((c) => c.sao.some((s) => s.ten === ten))?.chi ?? '(không có)';
  for (const [sao, chi] of [['Thiên La', 'Thìn'], ['Địa Võng', 'Tuất']] as [string, string][]) {
    if (chiCuaSao(sao) !== chi) {
      console.log(`  SAI: ${sao} nằm ở ${chiCuaSao(sao)}, kỳ vọng ${chi}`);
      loi++;
    }
  }
  const tongSao = ls.cungs.reduce((t, c) => t + c.sao.length, 0);
  console.log(
    loi === 0
      ? `✓ Sao cố định theo cung đóng đúng chỗ (tổng ${tongSao} lượt an sao)`
      : `✗ ${loi} sao sai vị trí`
  );
}

console.log('\n### Kiểm tra sao cố định');
kiemTraSaoCoDinh();

/*
 * Đối chiếu tuvivietnam.vn ngày 24/09/2026 — ba lỗi đã sửa, giữ để khỏi tái
 * phát. Gọi thẳng hàm độ sáng / lưu tinh, không dùng ngày sinh của ai.
 */
function kiemTraDoiChieu24_09() {
  const loiDs: string[] = [];
  const muon = (ten: string, chi: number, kv: string) => {
    const ra = doSangCuaSao(ten, chi);
    if (ra !== kv) loiDs.push(`${ten} ở ${CHI[chi]}: ${ra}, kỳ vọng ${kv}`);
  };
  // Khốc Hư đắc Tý Ngọ Mão Dậu Mùi, hãm Dần Thìn Tỵ Thân Tuất Hợi
  for (const ten of ['Thiên Khốc', 'Thiên Hư']) {
    for (const c of [0, 3, 6, 7, 9]) muon(ten, c, 'D');
    for (const c of [2, 4, 5, 8, 10, 11]) muon(ten, c, 'H');
  }
  // Hóa Kỵ đắc tứ mộ
  for (const c of [1, 4, 7, 10]) muon('Hóa Kỵ', c, 'D');
  for (const c of [0, 2, 3, 5, 6, 8, 9, 11]) muon('Hóa Kỵ', c, 'H');
  // Lưu Tang Môn = Thái Tuế + 2, Lưu Bạch Hổ = Thái Tuế + 8 (2026 Bính Ngọ: Thân, Dần)
  const luu = luuTinhTheoNam(2026);
  const o = (ten: string) => luu.find((l) => l.ten === ten)?.chiIndex;
  if (o('Lưu Tang Môn') !== 8) loiDs.push(`Lưu Tang Môn 2026 ở ${o('Lưu Tang Môn')}, kỳ vọng Thân`);
  if (o('Lưu Bạch Hổ') !== 2) loiDs.push(`Lưu Bạch Hổ 2026 ở ${o('Lưu Bạch Hổ')}, kỳ vọng Dần`);
  for (const l of loiDs) console.log(`  SAI: ${l}`);
  console.log(loiDs.length ? `✗ ${loiDs.length} chỗ lệch` : '✓ Độ sáng Khốc/Hư/Hóa Kỵ và Lưu Tang Môn/Bạch Hổ đúng bảng');
  if (loiDs.length) process.exitCode = 1;
}

console.log('\n### Đối chiếu 24/09/2026');
kiemTraDoiChieu24_09();
