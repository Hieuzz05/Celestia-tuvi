/**
 * Tạm — soi nhanh cấu hình của một vài lá số để chọn bộ mẫu vàng.
 *
 * KHÔNG nhúng dữ liệu sinh vào tệp. Truyền qua tham số dòng lệnh:
 *   npx tsx scripts/tam-doi-chieu-la-so.ts 24/8/2000/20/nam 19/8/2000/1/nu
 *
 * Xoá tệp này sau khi chọn xong bộ mẫu.
 */
import { lapLaSo } from '@/lib/tuvi/ansao';
import { nhanDangCachCuc } from '@/lib/tuvi/cach-cuc';
import { doNoiBat } from '@/lib/tuvi/do-noi-bat';
import { CUNG_CUA_MUC, type MucId } from '@/lib/tuvi/chang-cung';

const MUC: MucId[] = Object.keys(CUNG_CUA_MUC) as MucId[];

const dsThamSo = process.argv.slice(2);
if (!dsThamSo.length) {
  console.error('Cách dùng: npx tsx scripts/tam-doi-chieu-la-so.ts ngay/thang/nam/gio/gioiTinh ...');
  process.exit(1);
}

for (const [i, tho] of dsThamSo.entries()) {
  const [ngay, thang, nam, gio, gioiTinh] = tho.split('/');
  const laSo = lapLaSo({
    ngay: Number(ngay),
    thang: Number(thang),
    nam: Number(nam),
    gio: Number(gio),
    gioiTinh: gioiTinh === 'nu' ? 'nu' : 'nam',
  });

  const cc = nhanDangCachCuc(laSo).filter((c) => c.loai !== 'han');
  const menh = laSo.cungs.find((c) => c.tenCung === 'Mệnh');
  const chinhTinh = menh?.sao.filter((s) => s.loai === 'chinh-tinh').map((s) => s.ten) ?? [];
  const diem = MUC.map((m) => [m, doNoiBat(laSo, m, 2026).diem] as const).sort((a, b) => b[1] - a[1]);

  console.log(`\n=== Lá số #${i + 1} (${tho}) ===`);
  console.log(`  Mệnh tại ${menh?.chi ?? '?'} — chính tinh: ${chinhTinh.join(', ') || '(vô chính diệu)'}`);
  console.log(`  Thân cư: ${laSo.cungs.find((c) => c.laCungThan)?.tenCung ?? '?'}`);
  console.log(`  Cách cục (${cc.length}): ${cc.map((c) => c.ten).join(' · ') || '(không có)'}`);
  console.log(`  Nổi bật nhất: ${diem.slice(0, 4).map(([m, d]) => `${m} ${d}`).join(' | ')}`);
  console.log(`  Mờ nhất:      ${diem.slice(-3).map(([m, d]) => `${m} ${d}`).join(' | ')}`);
}
