/**
 * Chạy thật phần Kết nối — npx tsx scripts/test-ket-noi.ts [y-dinh]
 *
 * Gọi model thật. Điều cần chứng minh không phải "chạy được", mà là **hai ý định
 * khác nhau cho ra hai bài khác nhau** — đó là toàn bộ lý do lớp ý định tồn tại.
 * Nếu bài tình cảm và bài làm ăn giống nhau thì lớp này vô nghĩa.
 */

import { readFileSync } from 'node:fs';

for (const dong of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = dong.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { luanKetNoi } = await import('../lib/ket-noi/tra-loi');
  const { dungDuKienCap } = await import('../lib/ket-noi/du-kien-cap');
  const { lapKeHoachKetNoi } = await import('../lib/ket-noi/ke-hoach');
  const { DANH_SACH_Y_DINH } = await import('../lib/ket-noi/y-dinh');
  type YDinhKetNoi = import('../lib/ket-noi/y-dinh').YDinhKetNoi;

  const A = lapLaSo({ ngay: 20, thang: 5, nam: 1995, gio: 9, gioiTinh: 'nam', hoTen: 'An' });
  const B = lapLaSo({ ngay: 14, thang: 8, nam: 1997, gio: 15, gioiTinh: 'nu', hoTen: 'Linh' });

  const saoTheoCung = (ls: typeof A) => {
    const ra: Record<string, string[]> = {};
    for (const c of ls.cungs) {
      ra[c.tenCung] = c.sao
        .filter((s) => s.loai === 'chinh-tinh' || s.loai === 'tu-hoa')
        .map((s) => s.ten);
    }
    return ra;
  };

  // --- Phần offline: ý định phải cho ra bối cảnh khác nhau ---
  console.log('\n== KẾ HOẠCH THEO TỪNG Ý ĐỊNH (không gọi model) ==\n');
  const cungTheoYDinh = new Map<string, string[]>();
  for (const y of DANH_SACH_Y_DINH) {
    const k = lapKeHoachKetNoi({
      yDinh: y.id,
      cauHoi: y.id === 'khac' ? 'Hai người có nên ở chung nhà không?' : undefined,
      saoA: saoTheoCung(A),
      saoB: saoTheoCung(B),
      tenA: 'An',
      tenB: 'Linh',
    });
    const duKien = dungDuKienCap({
      laSoA: A,
      laSoB: B,
      tenA: 'An',
      tenB: 'Linh',
      yDinh: y.id,
      cungThem: k.cung,
    });
    cungTheoYDinh.set(y.id, k.cung);
    console.log(`  ${y.nhan.padEnd(22)} cung: ${k.cung.join(', ')}`);
    console.log(`  ${''.padEnd(22)} ${duKien.length} dữ kiện cặp · ${k.muc.length} mục · từ khoá: ${k.truyVanTuKhoa.slice(0, 70)}…`);
  }

  const tinhCam = cungTheoYDinh.get('tinh-cam') ?? [];
  const lamAn = cungTheoYDinh.get('lam-an') ?? [];
  const khacNhau = tinhCam.some((c) => !lamAn.includes(c)) && lamAn.some((c) => !tinhCam.includes(c));
  console.log(`\n  ${khacNhau ? 'OK  ' : 'SAI '} Tình cảm và Làm ăn đọc những cung khác nhau`);

  // --- Phần gọi model thật ---
  const chon = (process.argv[2] as YDinhKetNoi) || 'tinh-cam';
  console.log(`\n== GỌI MODEL THẬT — ý định "${chon}" ==\n`);

  const kq = await luanKetNoi({
    laSoA: A,
    laSoB: B,
    tenA: 'An',
    tenB: 'Linh',
    yDinh: chon,
    cauHoi: chon === 'tinh-cam' ? 'Hai người có phù hợp để tiến xa hơn không?' : undefined,
  });

  console.log(`Model        : ${kq.provider}/${kq.model}`);
  console.log(`Dữ kiện cặp  : ${kq.canCu.duKien.length}`);
  console.log(`Có nguồn RAG : ${kq.canCu.coNguon ? 'có' : 'kho trống'}`);
  console.log(`Số mục       : ${kq.muc.filter((m) => m.noiDung).length}/${kq.muc.length}`);
  console.log(`Trả câu hỏi  : ${kq.cauHoiCuaBan ? 'có' : 'không'}`);
  console.log(`Kiểm duyệt   : ${kq.kiemDuyet.dat ? 'ĐẠT' : 'KHÔNG ĐẠT'}`);
  for (const l of kq.kiemDuyet.loi) console.log(`   - ${l}`);
  console.log(`Ngôn ngữ     : ${kq.ngonNgu?.dat ? 'đạt' : 'CÓ LỖI CHẶN'}`);
  for (const l of kq.ngonNgu?.loi ?? []) console.log(`   [${l.mucDo}] ${l.ma}${l.viDu ? ` — ${l.viDu}` : ''}`);

  // Bắt phần trăm hợp nhau: spec cấm tuyệt đối
  const van = [kq.dangChuY.noiDung, ...kq.muc.map((m) => m.noiDung)].join(' ');
  const coPhanTram = /\d+\s*%/.test(van);
  console.log(`Có % hợp nhau: ${coPhanTram ? 'CÓ — SAI' : 'không'}`);

  console.log(`\n--- ${kq.dangChuY.tieuDe} ---\n${kq.dangChuY.noiDung}\n`);
  for (const m of kq.muc) {
    console.log(`### ${m.tieuDe}  [chắc: ${m.mucChacChan ?? '—'}]`);
    console.log(`${m.noiDung || '(trống)'}`);
    if (m.luongNguoc) console.log(`↺ ${m.luongNguoc}`);
    console.log('');
  }
  if (kq.cauHoiCuaBan) {
    console.log(`### Câu hỏi của bạn\n${kq.cauHoiCuaBan.cauHoi}\n→ ${kq.cauHoiCuaBan.traLoi}\n`);
  }
  console.log(`Cách nối: ${kq.canCu.cachNoi ?? '(không có)'}\n`);
}

main();
