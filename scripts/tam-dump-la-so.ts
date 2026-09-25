/**
 * Tạm — in đủ 12 cung của một lá số (sao, độ sáng, tuần triệt, đại vận) + cách cục + hạn năm.
 *   npx tsx scripts/tam-dump-la-so.ts <ngay> <thang> <nam> <gio> <nam|nu> [namXem]
 * Dữ liệu sinh chỉ truyền qua tham số, không ghi vào file. Xoá sau khi dùng.
 */
import { lapLaSo, cungTieuHan, cungDaiVan, tamPhuongTuChinh } from '@/lib/tuvi/ansao';
import { nhanDangCachCuc } from '@/lib/tuvi/cach-cuc';

const [ngay, thang, nam, gio, gt, nx] = process.argv.slice(2);
const laSo = lapLaSo({ ngay: +ngay, thang: +thang, nam: +nam, gio: +gio, gioiTinh: gt as 'nam' | 'nu' });
const namXem = +(nx ?? 2026);
const tuoiAm = namXem - laSo.thongTin.amLich.nam + 1;
const t = laSo.thongTin;
console.log(`GT=${t.gioiTinh} canChiNam=${t.canChiNam} tuoiAm${namXem}=${tuoiAm} cuc=${laSo.cuc.ten} banMenh=${laSo.banMenh.ten} ${laSo.menhCucQuanHe} ${laSo.amDuongThuanLy} menhChu=${laSo.menhChu} thanChu=${laSo.thanChu} thanCu=${laSo.thanCuCung}`);
const byIdx = (i: number) => laSo.cungs.find((c) => c.chiIndex === i)!;
for (const c of [...laSo.cungs].sort((a, b) => (a.chiIndex - laSo.menhIndex + 12) % 12 - (b.chiIndex - laSo.menhIndex + 12) % 12)) {
  const g = (l: string) => c.sao.filter((s) => s.loai === l).map((s) => s.ten + (s.doSang ? `(${s.doSang})` : '')).join(', ');
  const tp = tamPhuongTuChinh(c.chiIndex);
  console.log(`\n[${c.tenCung}] ${c.can} ${c.chi}${c.laCungThan ? ' ·THÂN' : ''}${c.coTuan ? ' ·Tuần' : ''}${c.coTriet ? ' ·Triệt' : ''} · ĐV ${c.daiVan?.tuTuoi}-${c.daiVan?.denTuoi} · TS ${c.trangSinh}`);
  console.log(`  chinh: ${g('chinh-tinh') || '(vô chính diệu)'}`);
  console.log(`  hoa: ${g('tu-hoa')}`);
  console.log(`  phu: ${g('phu-tinh')}`);
  console.log(`  vong: ${g('vong-sao')}  kv: ${g('khong-vong')}`);
  console.log(`  tamHop: ${byIdx(tp.tamHop[0]).tenCung}, ${byIdx(tp.tamHop[1]).tenCung} · xung: ${byIdx(tp.xungChieu).tenCung}`);
}
const dv = cungDaiVan(laSo, tuoiAm);
console.log(`\nĐại vận hiện tại: ${dv?.tenCung} (${dv?.daiVan?.tuTuoi}-${dv?.daiVan?.denTuoi})`);
for (let y = namXem - 1; y <= namXem + 3; y++) {
  console.log(`Tiểu hạn ${y}: ${byIdx(cungTieuHan(laSo, y - laSo.thongTin.amLich.nam + 1)).tenCung}`);
}
console.log('\nCách cục:');
for (const cc of nhanDangCachCuc(laSo)) console.log(`  - ${cc.ten} [${cc.loai}] ${cc.dieuKien}`.slice(0, 300));
