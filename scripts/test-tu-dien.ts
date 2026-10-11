/**
 * Từ điển thuật ngữ (CEL-075) — offline, chạy trong CI.
 *
 * Từ điển không có chữ riêng: nó ghép lời từ bản đọc nhanh bằng khuôn. Bài này
 * canh những chỗ ghép có thể gãy im lặng khi ai đó sửa bảng chữ gốc:
 *   1. Không còn chỗ trống `{...}` nào lọt ra mặt trước.
 *   2. Mỗi lời giải nghĩa là câu: viết hoa đầu, có dấu kết.
 *   3. Neo (id) không trùng — trùng là bấm mục lục nhảy sai chỗ.
 *   4. Hai ngôn ngữ có cùng số mục trong mỗi nhóm.
 *   5. Không có chữ cấm ở mặt trước (AGENTS.md "Ngôn ngữ ở mặt trước").
 */
import { dungTuDien, locTuDien } from '../lib/tu-dien';
import { vi } from '../lib/i18n/vi';
import { en } from '../lib/i18n/en';

const CAM = [/an sao/i, /nam phái/i, /bắc phái/i, /copy json/i, /quản trị/i];
let loi = 0;
const hong = (s: string) => {
  loi++;
  console.error('  ✗ ' + s);
};

const ban = { vi: dungTuDien('vi', vi.tuDien), en: dungTuDien('en', en.tuDien) };

for (const [nn, ds] of Object.entries(ban)) {
  const daCo = new Set<string>();
  for (const n of ds) {
    if (n.muc.length === 0) hong(`${nn}/${n.nhom}: nhóm rỗng`);
    for (const m of n.muc) {
      const chu = `${m.ten} ${m.nghia}`;
      if (/[{}]/.test(chu)) hong(`${nn}/${m.id}: còn chỗ trống — ${m.nghia}`);
      if (!/^[\p{Lu}0-9]/u.test(m.nghia)) hong(`${nn}/${m.id}: không viết hoa đầu — ${m.nghia}`);
      if (!/[.!?…]$/.test(m.nghia)) hong(`${nn}/${m.id}: thiếu dấu kết — ${m.nghia}`);
      if (daCo.has(m.id)) hong(`${nn}: trùng neo ${m.id}`);
      daCo.add(m.id);
      for (const c of CAM) if (c.test(chu)) hong(`${nn}/${m.id}: chữ cấm ${c} — ${chu}`);
    }
  }
}

ban.vi.forEach((n, i) => {
  const e = ban.en[i];
  if (e.nhom !== n.nhom || e.muc.length !== n.muc.length)
    hong(`nhóm ${n.nhom}: vi ${n.muc.length} mục, en ${e?.muc.length} mục`);
});

// Tìm không phân biệt dấu: "tu vi" phải ra Tử Vi
const tim = locTuDien(ban.vi, 'tu vi').flatMap((n) => n.muc.map((m) => m.ten));
if (!tim.includes('Tử Vi')) hong('tìm "tu vi" không ra Tử Vi');
if (locTuDien(ban.vi, 'zzzz-khong-co').length !== 0) hong('tìm chuỗi vô nghĩa vẫn ra kết quả');

const tong = ban.vi.reduce((s, n) => s + n.muc.length, 0);
if (loi) {
  console.error(`\nĐỎ — ${loi} lỗi`);
  process.exit(1);
}
console.log(`Xanh — từ điển ${tong} mục, ${ban.vi.length} nhóm, vi/en khớp`);
