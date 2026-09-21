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

import { readdirSync, readFileSync } from 'node:fs';
import { lapLaSo } from '../lib/tuvi/ansao';
import { docNhanh } from '../lib/tuvi/quick-read';
import { KHUON } from '../lib/tuvi/quick-read-noi-dung';
import { luanGiaiSau, mucPhang } from '../lib/tuvi/luan-giai-sau';
import { luanHan } from '../lib/tuvi/luan-han';
import { CHUAN_NGON_NGU_CELES } from '../lib/rag/chuan-ngon-ngu';
import { CHU_TRUU_TUONG, demChuTruuTuong } from '../lib/rag/chu-truu-tuong';
import { boDau, TU_DIEN_THUC_THE } from '../lib/rag/thuc-the';
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
  const khoi = mucPhang(luanGiaiSau(laSo, 2026, 'vi'));
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
    for (const k of mucPhang(luanGiaiSau(laSo, 2026, 'vi'))) {
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
  // Trang chi tiết Hành trình dùng cùng kho nét sao, nên dính cùng một bẫy
  for (const [ngay, thang, nam, gio, gioiTinh] of MAU) {
    const laSo = lapLaSo({ ngay, thang, nam, gio, gioiTinh });
    for (const cap of ['giai-doan', 'nam', 'thang'] as const) {
      const b = luanHan(laSo, cap, 2026, 9, 'vi');
      const dong = [
        b.tieuDe,
        ...b.tanDung.map((y) => y.cau),
        ...b.luuY.map((y) => y.cau),
        ...b.linhVuc.map((l) => l.cau),
      ];
      for (const d of dong.filter(Boolean)) {
        for (const cau of d.split(/(?<=[.!?])\s+/)) {
          if ((cau.match(/—/g) ?? []).length >= 2) {
            caiHai += 1;
            if (!viDu) viDu = cau.slice(0, 120);
          }
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
  const a = mucPhang(luanGiaiSau(lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' }), 2026, 'vi'));
  const b = mucPhang(luanGiaiSau(lapLaSo({ ngay: 3, thang: 11, nam: 1985, gio: 21, gioiTinh: 'nu' }), 2026, 'vi'));
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
  const lan1 = JSON.stringify(mucPhang(luanGiaiSau(x, 2026, 'vi')));
  const lan2 = JSON.stringify(mucPhang(luanGiaiSau(x, 2026, 'vi')));
  kiem('Hai lần chạy cho kết quả giống hệt', lan1 === lan2);
}

console.log('\n== CỔNG NGÔN NGỮ KHÔNG ĐƯỢC BẮT NHẦM ==\n');
{
  /*
   * CHUẨN KHÔNG ĐƯỢC KÊ ĐƠN MỘT CHỮ MÀ CHÍNH NÓ CẤM.
   *
   * Bắt được ngay lần đầu chạy: bảng chữ trừu tượng cấm "xu hướng", trong khi
   * ba dòng phía trên cùng prompt lại dạy model viết "Bạn có xu hướng…". Model
   * nhận hai lệnh ngược nhau trong một lần đọc, và không có cách nào tuân cả
   * hai. Kiểu mâu thuẫn này không gây lỗi ở đâu cả — nó chỉ làm đầu ra tệ đi
   * một cách không giải thích được.
   *
   * Chỉ soi VẾ PHẢI của mũi tên, tức phần chuẩn bảo PHẢI viết thế nào. Chữ cấm
   * nằm trong ví dụ xấu được trích dẫn là chuyện đúng, không phải va chạm.
   */
  const keDon = CHUAN_NGON_NGU_CELES.split('\n')
    .filter((d: string) => d.includes('→') || d.includes(' -> '))
    .map((d: string) => d.split(/→| -> /).slice(1).join(' '));
  const vaCham = CHU_TRUU_TUONG.filter(([c]) =>
    keDon.some((d) => boDau(d).includes(boDau(c)))
  ).map(([c]) => c);
  kiem('Chuẩn ngôn ngữ không kê đơn chữ mà chính nó cấm', vaCham.length === 0, vaCham);

  /*
   * MỌI KHOÁ ĐỆM PHẢI MANG PHIÊN BẢN CHỮ.
   *
   * Quét mã nguồn chứ không chạy thử, vì thứ cần chặn là một dòng ai đó viết
   * SAU NÀY. Đếm được lúc thêm phép kiểm này: chỉ 2 trên 7 bề mặt có phiên bản
   * prompt trong khoá, nên tám lần bump phiên bản trong một phiên làm việc
   * không tới được người dùng nào đang có đệm.
   *
   * Hỏng kiểu này im lặng tuyệt đối: đệm trả về bài cũ, và bài cũ vẫn là một
   * bài hợp lệ. Không có lỗi nào để thấy.
   */
  /*
   * MỌI SAO TRONG TỪ ĐIỂN PHẢI CÓ NÉT ĐỜI SỐNG.
   *
   * Engine bỏ qua sao không có nét — luật đúng, vì đưa một cái tên không giải
   * nghĩa được vào prompt là mở đường cho model tự nghĩ nghĩa. Nhưng hệ quả
   * không ai thấy: sao CÓ trên lá số mà chưa bao giờ được đọc tới. Trước lần
   * bổ sung này có 48 ngôi như vậy, trong đó cả mười hai sao vòng Thái Tuế —
   * tức là nền của mọi câu luận theo năm đều trống.
   *
   * Không có phép đếm thì chuyện đó im lặng mãi: bài vẫn ra, vẫn đúng ngữ
   * pháp, chỉ là mỏng hơn mức lá số cho phép.
   */
  const CHINH_TINH_TEN = new Set([
    'Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh', 'Thiên Phủ',
    'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát', 'Phá Quân',
  ]);
  const thieuNet = TU_DIEN_THUC_THE.filter(
    (t) =>
      t.loai === 'STAR' && !CHINH_TINH_TEN.has(t.ten) && !KHUON.vi.netPhuTinh[t.ten]
  ).map((t) => t.ten);
  kiem('Mọi phụ tinh đều có nét đời sống (tiếng Việt)', thieuNet.length === 0, thieuNet);

  const thieuNetEn = TU_DIEN_THUC_THE.filter(
    (t) => t.loai === 'STAR' && !CHINH_TINH_TEN.has(t.ten) && !KHUON.en.netPhuTinh[t.ten]
  ).map((t) => t.ten);
  kiem('Mọi phụ tinh đều có nét đời sống (tiếng Anh)', thieuNetEn.length === 0, thieuNetEn);

  const netXau = Object.entries(KHUON.vi.netPhuTinh)
    .filter(([, v]) => demChuTruuTuong(v).length)
    .map(([k]) => k);
  kiem('Nét phụ tinh không dùng chữ trừu tượng', netXau.length === 0, netXau);

  /*
   * THANG KHOẢNG CÁCH SÁU BẬC.
   *
   * Quét mã nguồn vì thứ cần chặn là một dòng ai đó viết sau này. Mã từng có
   * 20 giá trị rời nhau, và không có phép đếm nào thì nó cứ thế dài ra: mỗi
   * màn mới thêm một con số, không ai thấy gì sai vì từng chỗ đều hợp lý.
   *
   * Mệnh bàn (components/laso) miễn trừ — sơ đồ hình học, xem ghi chú trong
   * globals.css.
   */
  const BAC = new Set([4, 8, 12, 16, 24, 32]);
  const ngoaiThang: string[] = [];
  const quet = (thuMuc: string) => {
    for (const f of readdirSync(thuMuc, { recursive: true, encoding: 'utf-8' })) {
      // Windows trả về dấu gạch ngược; dựng ký tự bằng mã để khỏi vướng thoát chuỗi
      const duong = `${thuMuc}/${String(f).split(String.fromCharCode(92)).join('/')}`;
      if (duong.includes('components/laso/')) continue;
      if (!/\.tsx?$/.test(duong)) continue;
      let ma: string;
      try {
        ma = readFileSync(duong, 'utf-8');
      } catch {
        continue; // thư mục
      }
      for (const m of ma.matchAll(/\bgap(?:-x|-y)?-\[(\d+)px\]/g)) {
        if (!BAC.has(Number(m[1]))) ngoaiThang.push(`${duong}: ${m[0]}`);
      }
    }
  };
  quet('app');
  quet('components');
  kiem(
    'Mọi khoảng cách nằm trong thang sáu bậc',
    ngoaiThang.length === 0,
    [...new Set(ngoaiThang)].slice(0, 6).join(' | ')
  );

  const thieuPhienBan: string[] = [];
  for (const f of readdirSync('app/api', { recursive: true, encoding: 'utf-8' })) {
    if (!String(f).endsWith('route.ts')) continue;
    const ma = readFileSync(`app/api/${f}`, 'utf-8');
    for (const d of ma.split('\n')) {
      if (!/khoaKy\s*[:=]/.test(d)) continue;
      if (d.includes('kyCoPhienBan') || d.includes('khoaBangLinhVuc')) continue;
      if (/khoaKy,\s*$/.test(d.trim())) continue; // chỉ truyền biến đã dựng ở trên
      thieuPhienBan.push(`${f}: ${d.trim().slice(0, 70)}`);
    }
  }
  kiem('Mọi khoá đệm đi qua hàm gắn phiên bản chữ', thieuPhienBan.length === 0, thieuPhienBan);

  const khongBat = (van: string, vi: string) => {
    const kq = soatNgonNgu(van, [van]);
    kiem(vi, kq.dat && kq.loi.length === 0, kq.loi.map((l) => l.ma));
  };
  khongBat(
    'Đây là xu hướng của giai đoạn, không phải một sự việc chắc chắn sẽ xảy ra.',
    'Câu miễn trừ có phủ định thì không bị coi là phán quyết'
  );
  /*
   * Câu mẫu cố ý KHÔNG chứa tên cung.
   *
   * Bản đầu viết "Thiên Cơ tại cung Quan Lộc…", và luật 'lo-ten-cung' thêm sau
   * bắt đúng nó. Luật bắt đúng — chính câu mẫu mới là câu vi phạm, vì chuẩn
   * ngôn ngữ cấm tên cung ở mọi dạng. Sửa câu mẫu, không nới luật.
   */
  khongBat(
    'Thiên Cơ đóng ở phần công việc cho thấy nhịp làm việc linh hoạt.',
    'Tên sao Thiên Cơ không bị coi là từ huyền bí'
  );
  // Và chính luật ấy phải bắt được khi tên cung lọt ra thật
  kiem(
    'Tên cung lọt ra mặt trước thì bị cảnh báo',
    soatNgonNgu('Nhịp làm việc của bạn đọc từ cung Quan Lộc.', ['x']).loi.some(
      (l) => l.ma === 'lo-ten-cung'
    )
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
