/**
 * Chỗ đặt linh vật Celes — npx tsx scripts/test-cho-dat-celes.ts
 *
 * OFFLINE. Giữ luật mục 12 (docs/chien-luoc/celes-visual-character-system.md):
 *   1. Mảng ảnh trong CelesMascot khớp 1-1 với `public/celes/*.webp`.
 *   2. Không ảnh khoá nào có tệp hay có tên trong mảng.
 *   3. Chỉ tệp trong DANH_SACH được dùng linh vật, và chỉ dùng ảnh ghi cạnh nó.
 *   4. Vùng nội dung (mệnh bàn, bài luận, dòng thời gian) không bao giờ import.
 *
 * Ảnh đúng LOẠI CHỖ (đầu trang / rỗng / chờ…) do `tsc` giữ qua `ANH_THEO_CHO`;
 * bài này giữ ảnh đúng MÀN. Thêm màn mới: sửa mục 12 trước, rồi DANH_SACH.
 * Danh sách là nguồn sự thật — đừng thêm kiểu "phải đúng N tệp".
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { TEN_ANH_CELES } from '../components/CelesMascot';

const GOC = join(__dirname, '..');

/** Tệp → ảnh được dùng ở tệp đó. Khớp bảng mục 12. */
const DANH_SACH: Record<string, readonly string[]> = {
  'app/hoi-dap/page.tsx': ['default', 'listening', 'thinking', 'serious'],
  'app/ho-so/page.tsx': ['sitting-neutral', 'neutral'],
  'app/la-so/page.tsx': ['thinking', 'leaning-closer', 'proud'],
  'app/luan-giai/page.tsx': ['reading', 'thinking'],
  'app/luan-giai/sau/page.tsx': ['curious'],
  'app/hop-tuoi/page.tsx': ['curious', 'thinking'],
  'app/tai-khoan/page.tsx': ['using-laptop'],
  'app/dang-nhap/page.tsx': ['waving'],
  'app/not-found.tsx': ['playing'],
  'app/error.tsx': ['concerned'],
  'app/global-error.tsx': ['concerned'],
  'components/landing/TrangChuNoiDung.tsx': ['tiny-smile'],
  'components/landing/CachHoatDongNoiDung.tsx': ['default'],
  'components/home/TrangHomeNoiDung.tsx': ['one-ear-up'],
  'components/laso/BuocNhapSinh.tsx': ['leaning-closer'],
  'components/luangiai/DangDocV3.tsx': ['thinking'],
  'components/hanhtrinh/TrangHanhTrinhNoiDung.tsx': ['moving'],
  'components/hanhtrinh/TrangChiTietNoiDung.tsx': ['curious', 'thinking', 'concerned'],
  'components/auth/CongDangNhap.tsx': ['waving'],
  'components/support/TrangUngHo.tsx': ['tiny-smile'],
  'components/support/TrangThanhToan.tsx': ['celebrate', 'default', 'concerned'],
};

/** Vùng nội dung — không được import linh vật, kể cả khi ai đó thêm vào DANH_SACH. */
const CAM: readonly string[] = [
  'components/laso/TuViChart.tsx',
  'components/laso/PalaceCell.tsx',
  'components/laso/CenterPanel.tsx',
  'components/laso/PalaceDrawer.tsx',
  'components/laso/BangLuanGiai.tsx',
  'components/luangiai/CauTraLoiV3.tsx',
  'components/luangiai/TongQuanV3.tsx',
  'components/luangiai/BucTranhLon.tsx',
  'components/hanhtrinh/DaiThoiGian.tsx',
  'components/MarkdownLuanGiai.tsx',
];

/** 14 artwork khoá có chủ đích (mục 12), kể cả bí danh (side-eye / looking-away…). Tên tệp kebab-case. */
const KHOA: readonly string[] = [
  'side-eye',
  'looking-away',
  'really',
  'not-buying-it',
  'suspicious',
  'caught-you',
  'wink',
  'looking-at-user',
  'has-receipts',
  'reading-focus',
  'excited',
  'found-something',
  'sad',
  'resting',
  'stretching',
  'lying-relaxed',
  'sleeping',
];

/** Định nghĩa component — không tính là nơi đặt. */
const BO_QUA = new Set(['components/CelesMascot.tsx']);

let loi = 0;
const sai = (s: string) => {
  loi++;
  console.log(`  ✗ ${s}`);
};

function quet(thuMuc: string, ra: string[] = []): string[] {
  for (const ten of readdirSync(thuMuc)) {
    const p = join(thuMuc, ten);
    if (statSync(p).isDirectory()) quet(p, ra);
    else if (/\.tsx?$/.test(ten)) ra.push(relative(GOC, p).split(sep).join('/'));
  }
  return ra;
}

// 1 + 2. Mảng ↔ thư mục, không ảnh khoá.
console.log('1. Ảnh trong mảng ↔ public/celes');
const tep = readdirSync(join(GOC, 'public/celes'))
  .filter((t) => t.endsWith('.webp'))
  .map((t) => t.replace(/\.webp$/, ''));
const mang = new Set<string>(TEN_ANH_CELES);
for (const t of tep) if (!mang.has(t)) sai(`public/celes/${t}.webp không có trong TEN_ANH_CELES`);
for (const t of mang) if (!tep.includes(t)) sai(`${t} có trong mảng nhưng thiếu public/celes/${t}.webp`);
if (mang.size !== TEN_ANH_CELES.length) sai('TEN_ANH_CELES có tên lặp');
console.log('2. Không ảnh khoá');
for (const k of KHOA) {
  if (mang.has(k)) sai(`ảnh khoá "${k}" có trong mảng`);
  if (tep.includes(k)) sai(`ảnh khoá "${k}" có tệp trong public/celes`);
}

// 3 + 4. Nơi đặt.
console.log('3. Chỉ tệp trong danh sách dùng linh vật, đúng ảnh');
const TEN_RE = new RegExp(`['"](${[...mang].join('|')})['"]`, 'g');
const dung: string[] = [];
for (const f of [...quet(join(GOC, 'app')), ...quet(join(GOC, 'components'))]) {
  if (BO_QUA.has(f)) continue;
  const nd = readFileSync(join(GOC, f), 'utf8');
  // Import hoặc thẻ — không bắt tên trong chú thích.
  if (!/import[^;]*\bCelesMascot\b|<CelesMascot\b/.test(nd)) continue;
  dung.push(f);

  if (CAM.includes(f)) {
    sai(`${f} là vùng nội dung — cấm linh vật`);
    continue;
  }
  const choPhep = DANH_SACH[f];
  if (!choPhep) {
    sai(`${f} dùng CelesMascot nhưng không có trong danh sách mục 12`);
    continue;
  }
  // Tên ảnh trong từng thẻ <CelesMascot …/> (gồm cả biểu thức `a ? 'x' : 'y'`).
  for (const the of nd.match(/<CelesMascot\b[\s\S]*?\/>/g) ?? []) {
    for (const [, ten] of the.matchAll(TEN_RE)) {
      if (!choPhep.includes(ten)) sai(`${f}: "${ten}" không có trong danh sách của tệp này`);
    }
  }
}
console.log('4. Vùng nội dung không import');
for (const f of CAM) if (!existsSync(join(GOC, f))) sai(`${f} không còn — sửa CAM theo tên mới`);

for (const f of Object.keys(DANH_SACH)) if (!dung.includes(f)) console.log(`  · ${f}: chưa đặt (được phép)`);

console.log(loi ? `\n${loi} lỗi` : `\nXanh — ${dung.length} tệp đặt linh vật, ${mang.size} ảnh`);
process.exit(loi ? 1 : 0);
