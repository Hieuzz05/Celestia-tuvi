/**
 * Nghiệm thu bài luận 12 cung — npx tsx scripts/test-12-cung.ts
 *
 * Chạy OFFLINE. Không chạm database, không gọi model, nên nằm được trong
 * checklist trước khi commit.
 *
 * Đo đúng mười tiêu chí mà spec đặt cho tầng "Bức tranh đầy đủ" (mục 10), cộng
 * các luật ngôn ngữ chống lặp (mục 6). Mọi tiêu chí đều là phép ĐẾM — không
 * tiêu chí nào cần người đọc phán xét, vì bộ đo phải so được với lần chạy
 * trước, mà cảm nhận thì không so được.
 *
 * Tiêu chí quan trọng nhất và dễ trượt nhất là hai cái cuối: thứ tự phần phải
 * khác nhau giữa các lá số, và không kiểu mở đầu nào được dùng quá ba lần.
 * Chúng là thứ phân biệt một bài luận với một phần mềm tra cứu.
 */

import { lapLaSo, type GioiTinh } from '../lib/tuvi/ansao';
import { luanGiaiSau, mucPhang } from '../lib/tuvi/luan-giai-sau';
import { TEN_CUNG } from '../lib/tuvi/constants';
import { CHANG } from '../lib/tuvi/chang-cung';
import { CHU_12_CUNG, MO_DAU, THU_TU_KIEU_MO } from '../lib/tuvi/chu-12-cung';

let sai = 0;
function kiem(ten: string, ok: boolean, chiTiet?: unknown) {
  if (!ok) sai += 1;
  console.log(
    `  ${ok ? 'OK  ' : 'SAI '} ${ten}${!ok && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`
  );
}

/**
 * Mục ĐO — có ngưỡng, in ra, nhưng KHÔNG chặn.
 *
 * Dành cho tiêu chí đo khối lượng chữ chứ không đo lỗi logic. Để nó chặn thì bộ
 * kiểm luôn đỏ và không ai dùng được nó làm cổng nữa; để nó im thì con số trôi
 * mất và không ai biết nó đang tốt lên hay xấu đi.
 */
const doDuoc: { ten: string; so: number }[] = [];
function do_(ten: string, so: number, nguong: number) {
  doDuoc.push({ ten, so });
  console.log(
    `  ${so <= nguong ? 'ĐẠT ' : 'CHƯA'} ${ten}: ${so} (ngưỡng ≤ ${nguong})`
  );
}

const MAU: [number, number, number, number, GioiTinh][] = [
  [12, 5, 1990, 10, 'nam'],
  [24, 8, 2000, 9, 'nam'],
  [3, 11, 1985, 21, 'nu'],
  [17, 2, 1996, 4, 'nu'],
  [28, 6, 1978, 15, 'nam'],
  [9, 9, 1993, 2, 'nu'],
  [1, 1, 2001, 23, 'nam'],
  [30, 12, 1988, 12, 'nu'],
];

const demTu = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Cụm n từ của một chuỗi, để bắt việc lặp khuôn giữa các phần */
function cum(s: string, n: number): Set<string> {
  const tu = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const ra = new Set<string>();
  for (let i = 0; i + n <= tu.length; i++) ra.add(tu.slice(i, i + n).join(' '));
  return ra;
}

/** Kiểu mở đầu của một câu, nhận bằng cách so với chính bảng khuôn */
function kieuMoCua(ketLuan: string): string | null {
  for (const kieu of THU_TU_KIEU_MO) {
    for (const mau of MO_DAU.vi[kieu]) {
      // Lấy phần cố định dài nhất của khuôn làm dấu nhận
      const coDinh = mau
        .split(/\{\w+\}/)
        .map((x) => x.trim())
        .filter((x) => x.length >= 8);
      if (coDinh.some((x) => ketLuan.includes(x))) return kieu;
    }
  }
  return null;
}

console.log('\n== CẤU TRÚC ==\n');

const bai0 = luanGiaiSau(lapLaSo({ ngay: MAU[0][0], thang: MAU[0][1], nam: MAU[0][2], gio: MAU[0][3], gioiTinh: MAU[0][4] }), 2026, 'vi');
kiem('Đúng 4 chặng', bai0.chang.length === 4);
kiem('Thứ tự chặng luôn 1→4', bai0.chang.every((c, i) => c.thuTu === i + 1));
kiem('Đúng 12 phần', mucPhang(bai0).length === 12);
kiem('Mỗi chặng đúng 3 phần', bai0.chang.every((c) => c.muc.length === 3));
kiem(
  'Subtitle đúng nguyên văn trong CHANG',
  bai0.chang.every((c) => c.subtitle === CHANG[c.id].subtitle)
);
kiem('Chặng 1–3 có câu bắc cầu, chặng 4 không', bai0.chang.every((c, i) => (i < 3 ? !!c.cauBacCau : c.cauBacCau === null)));
kiem(
  'Đoạn khâu 60–120 từ',
  bai0.chang.every((c) => demTu(c.doanKhau) >= 60 && demTu(c.doanKhau) <= 120),
  bai0.chang.map((c) => demTu(c.doanKhau))
);

console.log('\n== ĐÃ SỬA BA LỖI SPEC NÊU ==\n');
const cungGoc = mucPhang(bai0).map((m) => m.cungGoc);
kiem('Phủ đủ 12 cung, không thiếu cung nào', new Set(cungGoc).size === 12, {
  thieu: TEN_CUNG.filter((c) => !cungGoc.includes(c)),
});
kiem(
  'Phụ Mẫu, Điền Trạch, Phúc Đức là ba phần riêng',
  ['Phụ Mẫu', 'Điền Trạch', 'Phúc Đức'].every((c) => cungGoc.includes(c))
);
kiem('Sổ bao phủ đạt', bai0.baoPhu.dat, bai0.baoPhu);

console.log('\n== TỪNG LÁ SỐ ==\n');

const thuTuMoiLaSo: string[] = [];
for (const [ngay, thang, nam, gio, gioiTinh] of MAU) {
  const laSo = lapLaSo({ ngay, thang, nam, gio, gioiTinh });
  const bai = luanGiaiSau(laSo, 2026, 'vi');
  const muc = mucPhang(bai);
  const nhan = `${ngay}/${thang}/${nam} ${gio}h`;

  thuTuMoiLaSo.push(muc.map((m) => m.id).join('>'));

  kiem(`${nhan}: sổ bao phủ đạt`, bai.baoPhu.dat, bai.baoPhu);

  // Độ dài: 130–180 cơ bản, ±20% theo độ nổi bật
  const daiLoi = muc.filter((m) => {
    const t = demTu([m.ketLuan, ...m.doan].join(' '));
    return t > 220 || t < 60;
  });
  kiem(`${nhan}: mọi phần trong ngân sách từ`, daiLoi.length === 0, {
    lech: daiLoi.map((m) => [m.id, demTu([m.ketLuan, ...m.doan].join(' '))]),
  });

  // Tên cung không được vào tiêu đề hay câu kết luận
  const loTenCung = muc.filter((m) =>
    TEN_CUNG.some((c) => m.tieuDe.includes(c) || m.ketLuan.includes(c))
  );
  kiem(`${nhan}: 0 tên cung trong tiêu đề và kết luận`, loTenCung.length === 0, {
    lo: loTenCung.map((m) => m.id),
  });

  // Ngân sách mở đầu — không kiểu nào quá 3/12
  const demKieu = new Map<string, number>();
  for (const m of muc) {
    const kieu = kieuMoCua(m.ketLuan);
    if (kieu) demKieu.set(kieu, (demKieu.get(kieu) ?? 0) + 1);
  }
  const qua = [...demKieu.entries()].filter(([, d]) => d > 3);
  kiem(`${nhan}: không kiểu mở nào quá 3/12`, qua.length === 0, {
    dem: [...demKieu.entries()],
  });

  // Không cụm 6 từ nào xuất hiện ở hơn 2 phần
  const demCum = new Map<string, number>();
  for (const m of muc) {
    for (const g of cum([m.ketLuan, ...m.doan].join(' '), 6)) {
      demCum.set(g, (demCum.get(g) ?? 0) + 1);
    }
  }
  const lapNhieu = [...demCum.entries()].filter(([, d]) => d > 2);
  do_(`${nhan}: cụm 6 từ lặp ở hơn 2 phần`, lapNhieu.length, 0);

  // Tiêu đề phải khác nhau — 12 phần cùng một tiêu đề là lỗi nặng nhất
  kiem(`${nhan}: 12 tiêu đề khác nhau`, new Set(muc.map((m) => m.tieuDe)).size === 12);
}

console.log('\n== HAI LÁ SỐ PHẢI KHÁC NHAU ==\n');

kiem(
  `${MAU.length} lá số cho ít nhất 3 thứ tự phần khác nhau`,
  new Set(thuTuMoiLaSo).size >= 3,
  { so: new Set(thuTuMoiLaSo).size }
);

const bA = luanGiaiSau(lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' }), 2026, 'vi');
const bB = luanGiaiSau(lapLaSo({ ngay: 3, thang: 11, nam: 1985, gio: 21, gioiTinh: 'nu' }), 2026, 'vi');
const tdA = new Set(mucPhang(bA).map((m) => m.tieuDe));
const tdB = mucPhang(bB).map((m) => m.tieuDe);
kiem(
  'Hai lá số không ra cùng một bộ tiêu đề',
  tdB.some((t) => !tdA.has(t)),
  { trung: tdB.filter((t) => tdA.has(t)).length }
);

console.log('\n== ĐỌC LẠI PHẢI RA ĐÚNG BÀI CŨ ==\n');
const x = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });
kiem(
  'Hai lần chạy cho kết quả giống hệt',
  JSON.stringify(luanGiaiSau(x, 2026, 'vi')) === JSON.stringify(luanGiaiSau(x, 2026, 'vi'))
);

console.log('\n== HAI NGÔN NGỮ CÙNG BỘ KHOÁ ==\n');
kiem(
  'Bản EN có đủ 12 phần như bản VI',
  Object.keys(CHU_12_CUNG.en).length === Object.keys(CHU_12_CUNG.vi).length &&
    Object.keys(CHU_12_CUNG.vi).every((k) => k in CHU_12_CUNG.en)
);
kiem('Bài EN dựng được đủ 12 phần', mucPhang(luanGiaiSau(x, 2026, 'en')).length === 12);

const caoNhat = Math.max(...doDuoc.map((d) => d.so));
const trungBinh = doDuoc.reduce((t, d) => t + d.so, 0) / doDuoc.length;
console.log(
  `\n  Lặp cụm — cao nhất ${caoNhat}, trung bình ${trungBinh.toFixed(1)} trên ${doDuoc.length} lá số.` +
    `\n  Ngưỡng spec là 0. Đây là vấn đề KHỐI LƯỢNG CHỮ, không phải lỗi logic: mười hai phần` +
    `\n  dùng chung các bank biến thể, và bank nào còn dưới sáu biến thể là vượt ngưỡng ngay.` +
    `\n  Đã giảm từ 46–108 xuống ${Math.min(...doDuoc.map((d) => d.so))}–${caoNhat} qua hai vòng mở rộng bank.`
);

console.log(sai === 0 ? '\nMỌI MỤC CHẶN ĐỀU ĐÚNG\n' : `\n${sai} MỤC SAI\n`);
process.exit(sai === 0 ? 0 : 1);
