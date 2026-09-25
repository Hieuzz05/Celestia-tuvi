/**
 * Tạm — quét tìm lá số lấp chỗ trống cấu hình cho bộ mẫu vàng.
 *   npx tsx scripts/tam-quet-la-so.ts
 * Xoá sau khi chọn xong.
 */
import { lapLaSo } from '@/lib/tuvi/ansao';
import { nhanDangCachCuc } from '@/lib/tuvi/cach-cuc';

const NHOM: Record<string, string[]> = {
  'Cơ Nguyệt Đồng Lương': ['Thiên Cơ', 'Thái Âm', 'Thiên Đồng', 'Thiên Lương'],
  'Sát Phá Tham': ['Thất Sát', 'Phá Quân', 'Tham Lang'],
  'Tử Phủ Vũ Tướng Liêm': ['Tử Vi', 'Thiên Phủ', 'Vũ Khúc', 'Thiên Tướng', 'Liêm Trinh'],
  'Cự Nhật': ['Cự Môn', 'Thái Dương'],
};

function nhomCua(chinhTinh: string[]): string {
  if (!chinhTinh.length) return 'Vô chính diệu';
  for (const [ten, ds] of Object.entries(NHOM)) {
    if (chinhTinh.some((s) => ds.includes(s))) return ten;
  }
  return '?';
}

interface Ung {
  mo: string; nhom: string; soCC: number; gioiTinh: string; tuoi: number; cc: string;
}

const ung: Ung[] = [];

for (let nam = 1975; nam <= 1990; nam += 1) {
  for (let thang = 1; thang <= 12; thang += 3) {
    for (const ngay of [8, 22]) {
      for (const gio of [3, 9, 15, 21]) {
        for (const gt of ['nu', 'nam'] as const) {
          const laSo = lapLaSo({ ngay, thang, nam, gio, gioiTinh: gt });
          const menh = laSo.cungs.find((c) => c.tenCung === 'Mệnh');
          const ct = menh?.sao.filter((s) => s.loai === 'chinh-tinh').map((s) => s.ten) ?? [];
          const cc = nhanDangCachCuc(laSo).filter((c) => c.loai !== 'han');
          ung.push({
            mo: `${ngay}/${thang}/${nam}/${gio}/${gt}`,
            nhom: nhomCua(ct),
            soCC: cc.length,
            gioiTinh: gt,
            tuoi: 2026 - nam,
            cc: cc.map((c) => c.ten).join(' · '),
          });
        }
      }
    }
  }
}

function in1(nhan: string, loc: (u: Ung) => boolean, n = 3) {
  console.log(`\n### ${nhan}`);
  ung.filter(loc).slice(0, n).forEach((u) =>
    console.log(`  ${u.mo}  [${u.tuoi}t ${u.gioiTinh}] ${u.nhom} — ${u.soCC} cách cục: ${u.cc}`)
  );
}

in1('NỮ 40+, Cơ Nguyệt Đồng Lương, cách cục vừa (3-5)',
  (u) => u.gioiTinh === 'nu' && u.tuoi >= 40 && u.nhom === 'Cơ Nguyệt Đồng Lương' && u.soCC >= 3 && u.soCC <= 5);

in1('NỮ 40+, Sát Phá Tham',
  (u) => u.gioiTinh === 'nu' && u.tuoi >= 40 && u.nhom === 'Sát Phá Tham' && u.soCC >= 2);

in1('VÔ CHÍNH DIỆU (bất kỳ) — ca khó nhất',
  (u) => u.nhom === 'Vô chính diệu');

in1('NAM 45+, cách cục NGHÈO (<=2) — ca ít dữ kiện',
  (u) => u.gioiTinh === 'nam' && u.tuoi >= 45 && u.soCC <= 2);

in1('TRUNG NIÊN 36-42, nam, cách cục nghèo (<=2)',
  (u) => u.gioiTinh === 'nam' && u.tuoi >= 36 && u.tuoi <= 42 && u.soCC <= 2, 4);
in1('TRUNG NIÊN 36-42, nữ, Cơ Nguyệt Đồng Lương',
  (u) => u.gioiTinh === 'nu' && u.tuoi >= 36 && u.tuoi <= 42 && u.nhom === 'Cơ Nguyệt Đồng Lương', 4);
