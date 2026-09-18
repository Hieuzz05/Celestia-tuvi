/**
 * Đối chiếu đầu ra với Chuẩn ngôn ngữ Celes — npx tsx scripts/test-chuan-ngon-ngu.ts
 *
 * Chỉ kiểm các bề mặt TẤT ĐỊNH nên chạy được offline, không tốn quota. Bề mặt
 * có model thì dùng scripts/test-rag-that.ts và test-ket-noi.ts.
 *
 * Tồn tại vì "viết giống AI quá" là thứ trôi lại rất nhanh: thêm một câu mẫu mới
 * vào bảng chữ là tỉ lệ lặp khuôn lại leo lên, mà không ai nhận ra cho tới khi
 * đọc liền tám khối.
 */

import { lapLaSo } from '../lib/tuvi/ansao';
import { docNhanh } from '../lib/tuvi/quick-read';
import { luanGiaiSau } from '../lib/tuvi/luan-giai-sau';
import { luanHan } from '../lib/tuvi/luan-han';
import { soatNgonNgu } from '../lib/rag/ngon-ngu';

const MAU: [number, number, number, number, 'nam' | 'nu'][] = [
  [12, 5, 1990, 10, 'nam'],
  [24, 8, 2000, 9, 'nam'],
  [3, 11, 1985, 21, 'nu'],
  [17, 2, 1996, 4, 'nu'],
  [28, 6, 1978, 15, 'nam'],
  [9, 9, 1993, 2, 'nu'],
  [1, 1, 2001, 23, 'nam'],
  [30, 12, 1988, 12, 'nu'],
];

/** Ngưỡng: quá nửa số khối mở cùng kiểu là người đọc nhận ra khuôn */
const TRAN_LAP_MO_DAU = 0.5;

let sai = 0;
const kiem = (ten: string, ok: boolean, chiTiet?: unknown) => {
  if (!ok) sai += 1;
  console.log(`  ${ok ? 'OK  ' : 'SAI '} ${ten}${!ok && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`);
};

console.log('\n== BÀI ĐỌC SÂU (8 lĩnh vực, template tất định) ==\n');

let lapCaoNhat = 0;
for (const [ngay, thang, nam, gio, gioiTinh] of MAU) {
  const laSo = lapLaSo({ ngay, thang, nam, gio, gioiTinh });
  const khoi = luanGiaiSau(laSo, 2026, 'vi');
  const van = khoi.flatMap((k) => [k.ketLuan, ...(k.doan ?? [])]).filter(Boolean);
  const kq = soatNgonNgu(van.join(' '), khoi.map((k) => k.ketLuan ?? ''));
  lapCaoNhat = Math.max(lapCaoNhat, kq.tyLeMoDauTrung);

  const nhan = `${ngay}/${thang}/${nam}`;
  kiem(
    `${nhan.padEnd(11)} qua cổng ngôn ngữ · lặp khuôn mở đầu ${(kq.tyLeMoDauTrung * 100).toFixed(0)}%`,
    kq.dat && kq.tyLeMoDauTrung < TRAN_LAP_MO_DAU,
    kq.loi.map((l) => `${l.mucDo}:${l.ma}${l.viDu ? `(${l.viDu})` : ''}`)
  );
}
console.log(`\n  Lặp khuôn mở đầu cao nhất: ${(lapCaoNhat * 100).toFixed(0)}% (trần ${TRAN_LAP_MO_DAU * 100}%)`);

console.log('\n== CÂU GHÉP KHÔNG ĐƯỢC GÃY ==\n');
{
  let caiHai = 0;
  let cutDuoi = 0;
  let viDu = '';
  for (const [ngay, thang, nam, gio, gioiTinh] of MAU) {
    const laSo = lapLaSo({ ngay, thang, nam, gio, gioiTinh });
    for (const k of luanGiaiSau(laSo, 2026, 'vi')) {
      for (const d of [k.ketLuan, ...(k.doan ?? [])].filter(Boolean)) {
        for (const cau of d.split(/(?<=[.!?])\s+/)) {
          // Vế ghép sẵn đã mang một gạch ngang; khuôn nào thêm vế đuôi nữa là
          // câu có hai, và chỗ nối thứ hai luôn đọc như bị chắp.
          if ((cau.match(/—/g) ?? []).length >= 2) {
            caiHai += 1;
            if (!viDu) viDu = cau.slice(0, 120);
          }
          // Câu kết thúc ngay sau dấu ngắt mệnh đề là dấu hiệu khuôn bị cắt cụt
          if (/[,;:—]\s*$/.test(cau.trim())) cutDuoi += 1;
        }
      }
    }
  }
  kiem('Không câu nào có hai gạch ngang', caiHai === 0, viDu);
  kiem('Không câu nào cụt sau dấu ngắt', cutDuoi === 0, cutDuoi);
}

console.log('\n== QUICK READ (/la-so) ==\n');
for (const [ngay, thang, nam, gio, gioiTinh] of MAU.slice(0, 4)) {
  const the = docNhanh(lapLaSo({ ngay, thang, nam, gio, gioiTinh }), 2026, undefined, 'vi');
  const van = the.flatMap((t) => [t.tieuDe, t.noiDung]).filter(Boolean);
  const kq = soatNgonNgu(van.join(' '), the.map((t) => t.noiDung));
  kiem(
    `${`${ngay}/${thang}/${nam}`.padEnd(11)} qua cổng · lặp khuôn ${(kq.tyLeMoDauTrung * 100).toFixed(0)}%`,
    kq.dat && kq.tyLeMoDauTrung < TRAN_LAP_MO_DAU,
    kq.loi.map((l) => l.ma)
  );
}

console.log('\n== HÀNH TRÌNH (luận hạn năm) ==\n');
for (const [ngay, thang, nam, gio, gioiTinh] of MAU.slice(0, 4)) {
  const bai = luanHan(lapLaSo({ ngay, thang, nam, gio, gioiTinh }), 'nam', 2026, 9, 'vi');
  // Lấy mọi chuỗi đủ dài trong kết quả — không phụ thuộc hình dạng cụ thể của bài
  const van = (JSON.stringify(bai).match(/"[^"]{25,}"/g) ?? []).map((x) => x.slice(1, -1));
  const kq = soatNgonNgu(van.join(' '), van.slice(0, 8));
  kiem(
    `${`${ngay}/${thang}/${nam}`.padEnd(11)} qua cổng`,
    kq.dat,
    kq.loi.map((l) => `${l.ma}${l.viDu ? `(${l.viDu})` : ''}`)
  );
}

console.log('\n== HAI LÁ SỐ KHÁC NHAU PHẢI KHÁC BỘ KHUNG CÂU ==\n');
{
  const a = luanGiaiSau(lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' }), 2026, 'vi');
  const b = luanGiaiSau(lapLaSo({ ngay: 3, thang: 11, nam: 1985, gio: 21, gioiTinh: 'nu' }), 2026, 'vi');
  // So phần MỞ ĐẦU của câu kết luận, chỗ khuôn lộ ra rõ nhất
  const mo = (ds: typeof a) => ds.map((k) => (k.ketLuan ?? '').slice(0, 14));
  const giongNhau = mo(a).filter((x, i) => x === mo(b)[i]).length;
  kiem(
    `Không phải mọi khối đều mở giống nhau giữa hai lá số (${giongNhau}/${a.length} trùng)`,
    giongNhau < a.length,
    { a: mo(a).slice(0, 3), b: mo(b).slice(0, 3) }
  );
}

console.log('\n== CÙNG MỘT LÁ SỐ ĐỌC LẠI PHẢI RA ĐÚNG BÀI CŨ ==\n');
{
  const x = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });
  const lan1 = JSON.stringify(luanGiaiSau(x, 2026, 'vi'));
  const lan2 = JSON.stringify(luanGiaiSau(x, 2026, 'vi'));
  kiem('Hai lần chạy cho kết quả giống hệt', lan1 === lan2);
}

console.log('\n== CỔNG NGÔN NGỮ KHÔNG ĐƯỢC BẮT NHẦM ==\n');
{
  const khongBat = (van: string, vi: string) => {
    const kq = soatNgonNgu(van, [van]);
    kiem(vi, kq.dat && kq.loi.length === 0, kq.loi.map((l) => l.ma));
  };
  khongBat(
    'Đây là xu hướng của giai đoạn, không phải một sự việc chắc chắn sẽ xảy ra.',
    'Câu miễn trừ có phủ định thì không bị coi là phán quyết'
  );
  khongBat(
    'Thiên Cơ tại cung Quan Lộc cho thấy nhịp làm việc linh hoạt.',
    'Tên sao Thiên Cơ không bị coi là từ huyền bí'
  );
  khongBat(
    'Cách làm đó không hợp lý với nhịp hiện tại của bạn.',
    '"không hợp lý" không bị coi là phán quyết "không hợp"'
  );

  const coBat = (van: string, ma: string, vi: string) => {
    const kq = soatNgonNgu(van, [van]);
    kiem(vi, kq.loi.some((l) => l.ma === ma), kq.loi.map((l) => l.ma));
  };
  coBat('Hai người chắc chắn sẽ không hợp nhau.', 'phan-quyet', 'Vẫn bắt được phán quyết thật');
  coBat('Theo tài liệu Tử Vi Đẩu Số, sao này chủ về tiền bạc.', 'lo-nguon-rag', 'Vẫn bắt được rò rỉ nguồn');
  coBat('Bạn là người sâu sắc, nhạy cảm, mạnh mẽ.', 'tinh-tu-barnum', 'Vẫn bắt được tính từ chung chung');
}

console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} KIỂM TRA SAI\n`);
process.exit(sai === 0 ? 0 : 1);
