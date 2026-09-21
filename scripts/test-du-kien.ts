/**
 * Nghiệm thu khối DỮ KIỆN CỦA PHẦN ĐANG HỎI — npx tsx scripts/test-du-kien.ts
 *
 * Chạy OFFLINE. Không chạm database, không gọi model, nên nằm được trong
 * checklist trước khi commit.
 *
 * Bộ này ra đời từ một lỗi đã tới người dùng thật:
 *
 *   Hỏi:      "Có ai đang để ý bạn không?"
 *   Nhận về:  "Năm 2026 nghiêng rõ về phía đẩy tới: bảy yếu tố đang đỡ so với
 *              hai yếu tố cản ở phần tình cảm."
 *
 * Câu ấy không sai. Nó chỉ không nói gì — và nó không phải model bịa ra, nó là
 * ví dụ "Đúng" mà chính prompt dạy, dán lên một cái nhãn mà chính engine đưa
 * sẵn. Hai chỗ đã sửa. Bộ này giữ cho chúng không quay lại.
 *
 * Ba việc phải đo, và mỗi việc chặn một đường quay lại khác nhau:
 *
 *   1. Khối prompt KHÔNG chứa con số đếm và KHÔNG chứa nhãn hướng chép được.
 *      → chặn đường engine đưa sẵn chữ cho model dán.
 *   2. Dữ kiện phải CÓ TÊN và có nghĩa đời sống đi kèm, và với câu hỏi theo
 *      năm thì phải có ít nhất một dữ kiện của lớp năm.
 *      → chặn đường bài trả lời cho 2026 giống hệt bài cho 2031.
 *   3. Cổng ngôn ngữ phải CHẶN đúng câu đã lọt ra hôm trước.
 *      → chặn đường lỗi cũ đi lại lần nữa bằng bất kỳ lối nào.
 */

import { readFileSync } from 'node:fs';

import { lapLaSo, type GioiTinh } from '../lib/tuvi/ansao';
import { khoiNghiengVe, tinhNghiengVe } from '../lib/rag/nghieng-ve';
import { soatNgonNgu } from '../lib/rag/ngon-ngu';
import { doiTenCung } from '../lib/rag/sua-chua';
import type { ChuDe, LopHan } from '../lib/rag/planner';

let sai = 0;
function kiem(ten: string, ok: boolean, chiTiet?: unknown) {
  if (!ok) sai += 1;
  console.log(
    `  ${ok ? 'OK  ' : 'SAI '} ${ten}${!ok && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`
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

const CHU_DE: ChuDe[] = ['su-nghiep', 'tai-chinh', 'tinh-cam', 'gia-dao', 'suc-khoe'];
const THEO_NAM: LopHan[] = ['luu-nien'];

/** Chữ engine dùng để hạch toán — không cái nào được có mặt trong khối prompt */
const TIENG_LONG = [
  'đẩy tới',
  'yếu tố đỡ',
  'yếu tố cản',
  'yếu tố đang đỡ',
  'tương quan',
  'hai lực ngang nhau',
];

console.log('\n== KHỐI PROMPT KHÔNG ĐƯỢC CHỨA SỔ SÁCH NỘI BỘ ==\n');

let soKhoi = 0;
const loLong: string[] = [];
const loSo: string[] = [];
const loTenCung: string[] = [];

for (const [ngay, thang, nam, gio, gioiTinh] of MAU) {
  const laSo = lapLaSo({ ngay, thang, nam, gio, gioiTinh });
  for (const chuDe of CHU_DE) {
    const n = tinhNghiengVe({ laSo, chuDe, lopHan: THEO_NAM, namXem: 2026, thangXem: 6 });
    if (!n) continue;
    const khoi = khoiNghiengVe(n);
    soKhoi += 1;

    /*
     * Chỉ soi phần DỮ LIỆU, tức là phần trước mục "CÁCH VIẾT".
     *
     * Từ mục ấy trở xuống là chỗ khối cố ý in lại nguyên văn câu sai để model
     * nhận ra nó — "Viết sai: …" và mục CẤM. Soi cả khối thì ba luật dưới luôn
     * đỏ, và một bộ đo luôn đỏ là bộ đo không ai đọc.
     */
    const phanDuLieu = khoi.split('CÁCH VIẾT —')[0];

    for (const t of TIENG_LONG) if (phanDuLieu.includes(t)) loLong.push(`${chuDe}: ${t}`);

    if (/\d+\s*(?:dữ kiện|yếu tố)|yếu tố.*\/.*yếu tố/u.test(phanDuLieu)) {
      loSo.push(`${chuDe}: có con số đếm`);
    }

    /*
     * Tên cung — luật cấm ở mọi dạng, và `phanDoi` đã thay được.
     *
     * TRỪ "Phúc Đức", vì nó là HAI thứ cùng tên: một cung, và sao thứ mười của
     * vòng Thái Tuế. Bản trước bắt tên trần nên mọi lá số có sao ấy đều đỏ —
     * khối chỉ đang liệt kê một dữ kiện đúng chỗ của nó. Với nó thì phải có
     * chữ chỉ cung đứng trước mới tính là lọt.
     */
    const TEN_CUNG_RIENG = /\b(?:Phu Thê|Quan Lộc|Tài Bạch|Điền Trạch|Tật Ách|Phụ Mẫu)\b/u;
    const PHUC_DUC_LA_CUNG = /(?:cung|phần|vào|ở|tại)\s+Phúc Đức\b/u;
    if (TEN_CUNG_RIENG.test(phanDuLieu) || PHUC_DUC_LA_CUNG.test(phanDuLieu)) {
      loTenCung.push(`${chuDe}: lọt tên cung`);
    }
  }
}

kiem(`${soKhoi} khối dựng được`, soKhoi >= 30, { soKhoi });
kiem('0 khối chứa tiếng lóng engine', loLong.length === 0, loLong.slice(0, 4));
kiem('0 khối chứa con số đếm dữ kiện', loSo.length === 0, loSo.slice(0, 4));
kiem('0 khối lọt tên cung', loTenCung.length === 0, loTenCung.slice(0, 4));

console.log('\n== DỮ KIỆN PHẢI CÓ TÊN VÀ CÓ NGHĨA ==\n');

const thieuY: string[] = [];
let thieuLopNam = 0;
let coLopNam = 0;
let tongDauMoc = 0;

for (const [ngay, thang, nam, gio, gioiTinh] of MAU) {
  const laSo = lapLaSo({ ngay, thang, nam, gio, gioiTinh });
  for (const chuDe of CHU_DE) {
    const n = tinhNghiengVe({ laSo, chuDe, lopHan: THEO_NAM, namXem: 2026, thangXem: 6 });
    if (!n) continue;
    tongDauMoc += n.dauMoc.length;
    for (const d of n.dauMoc) {
      // Nghĩa đời sống phải đủ dài để là một mệnh đề, không phải một nhãn
      if (!d.ten.trim() || d.y.trim().length < 20) thieuY.push(`${d.ten}: "${d.y}"`);
    }
    if (n.dauMoc.some((d) => d.lop === 'nam')) coLopNam += 1;
    else thieuLopNam += 1;
  }
}

kiem('Mọi dữ kiện đều có tên và nghĩa đời sống', thieuY.length === 0, thieuY.slice(0, 4));
kiem('Trung bình ≥ 3 dữ kiện mỗi khối', tongDauMoc / soKhoi >= 3, {
  tb: (tongDauMoc / soKhoi).toFixed(1),
});

/*
 * Lưu tinh chỉ rơi vào 7 trong 12 cung, nên không phải khối nào cũng có dữ kiện
 * lớp năm — ép 100% là ép engine bịa ra thứ không có. Đo tỉ lệ thay vì chặn
 * từng khối: dưới 30% thì lớp năm coi như không được đọc, và bài trả lời cho
 * 2026 sẽ giống hệt bài cho 2031.
 */
const tiLopNam = coLopNam / soKhoi;
kiem(
  `≥ 30% khối có dữ kiện chạy theo năm (đo được ${(tiLopNam * 100).toFixed(0)}%)`,
  tiLopNam >= 0.3,
  { coLopNam, thieuLopNam }
);

console.log('\n== ĐỔI NĂM PHẢI ĐỔI DỮ KIỆN ==\n');

const ls = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });
const khac: number[] = [];
for (const chuDe of CHU_DE) {
  const a = tinhNghiengVe({ laSo: ls, chuDe, lopHan: THEO_NAM, namXem: 2026, thangXem: 6 });
  const b = tinhNghiengVe({ laSo: ls, chuDe, lopHan: THEO_NAM, namXem: 2031, thangXem: 6 });
  if (!a || !b) continue;
  khac.push(khoiNghiengVe(a) === khoiNghiengVe(b) ? 0 : 1);
}
kiem(
  'Hỏi 2026 và hỏi 2031 không ra cùng một khối',
  khac.some((x) => x === 1),
  { soKhac: khac.filter(Boolean).length, tong: khac.length }
);

console.log('\n== ĐỌC LẠI PHẢI RA ĐÚNG KHỐI CŨ ==\n');
kiem(
  'Hai lần chạy cho kết quả giống hệt',
  JSON.stringify(tinhNghiengVe({ laSo: ls, chuDe: 'tinh-cam', lopHan: THEO_NAM, namXem: 2026, thangXem: 6 })) ===
    JSON.stringify(tinhNghiengVe({ laSo: ls, chuDe: 'tinh-cam', lopHan: THEO_NAM, namXem: 2026, thangXem: 6 }))
);

console.log('\n== CỔNG NGÔN NGỮ PHẢI CHẶN ĐÚNG CÂU ĐÃ LỌT ==\n');

const CAU_DA_LOT =
  'Năm 2026 nghiêng rõ về phía đẩy tới: bảy yếu tố đang đỡ so với hai yếu tố cản ở phần tình cảm, và một trong số đó là cách bạn thể hiện sự ổn định trong mối quan hệ.';

const kq = soatNgonNgu(CAU_DA_LOT, [CAU_DA_LOT]);
kiem('Câu đã lọt hôm trước giờ bị CHẶN', !kq.dat, kq.loi.map((l) => l.ma));
kiem(
  'Chặn đúng vì tiếng lóng engine',
  kq.loi.some((l) => l.ma === 'tieng-long-engine' && l.mucDo === 'chan'),
  kq.loi
);

/*
 * Và phải KHÔNG bắt nhầm câu viết đúng.
 *
 * Một cổng chặn bắt nhầm sẽ bị người sửa học cách bỏ qua, và lúc đó nó vô dụng
 * hơn cả không có. Câu dưới nói cùng một nội dung, bằng tên dữ kiện.
 */
const CAU_VIET_DUNG =
  'Năm 2026 chuyện này nghiêng về phía có: tiểu hạn năm nay rơi đúng vào phần bạn đời, mà ở đó sẵn có Hồng Loan — chuyện đôi lứa đến theo đường tự nhiên, ít phải sắp đặt. Lưu Thiên Mã cũng chạy qua đây trong năm, nên phần này khó đứng yên.';

const kq2 = soatNgonNgu(CAU_VIET_DUNG, [CAU_VIET_DUNG]);
kiem('Câu viết đúng KHÔNG bị chặn', kq2.dat, kq2.loi.map((l) => `${l.ma}/${l.mucDo}`));

// Câu chứa "năm yếu tố" phải bị bắt, nhưng "năm 2026" thì không
kiem(
  'Bắt "năm yếu tố", không bắt "năm 2026"',
  !soatNgonNgu('Có năm yếu tố đang đỡ.', ['x']).dat &&
    soatNgonNgu('Năm 2026 là quãng bạn đổi chỗ làm.', ['x']).dat
);

console.log('\n== ĐỔI TÊN CUNG THÀNH PHẦN ĐỜI ==\n');

/*
 * Phép thay này TẤT ĐỊNH, nên nó phải đúng 100% — khác các tiêu chí đo model.
 *
 * Hai nhóm phải tách bạch: nhóm PHẢI đổi, và nhóm KHÔNG được đụng tới. Nhóm
 * thứ hai quan trọng ngang nhóm thứ nhất: "bản Mệnh" là nạp âm năm sinh và
 * "Mệnh chủ" là một khái niệm khác hẳn, còn "số mệnh" với "vận mệnh" là tiếng
 * Việt bình thường. Một bộ sửa làm hỏng câu đúng thì tệ hơn là không có.
 */
const PHAI_DOI = [
  'tiểu hạn năm nay rơi đúng vào phần Điền Trạch, nơi có Liêm Trinh',
  'cách cục Nhật Nguyệt tịnh minh tại Mệnh, cho thấy bạn thu hút tài chính',
  'Sát Phá Tham tại Phu Thê cho thấy bạn dễ thay đổi',
  'đọc từ cung Quan Lộc và cung Tài Bạch',
  'Phúc Đức của bạn có Thiên Lương',
  /*
   * Bốn dạng dưới do BÀI DÀI sinh ra, không phải chat.
   *
   * Mỗi bề mặt có thói quen câu chữ riêng: chat hay viết "tại X", bài dài hay
   * viết "hội về X", "tọa X", "đóng tại X". Bộ kiểm chỉ mang mẫu của một bề mặt
   * thì luật trông như đã đủ trong khi bề mặt kia vẫn rò — đúng chuyện vừa xảy
   * ra với "Tử Phủ Vũ Tướng Liêm hội về Mệnh".
   */
  'Tử Phủ Vũ Tướng Liêm hội về Mệnh — nghĩa là bạn dựng nền lâu dài.',
  'Thiên Cơ tọa Mệnh cho thấy nhịp làm việc linh hoạt.',
  'Thiên Di có Thất Sát kéo bạn vào tình huống cần quyết nhanh.',
  'Cách cục này đóng tại Mệnh.',
];
const KHONG_DUOC_DUNG = [
  'bản Mệnh của bạn là Dương Liễu Mộc, và Mệnh chủ là Tham Lang',
  'số mệnh không quyết định tất cả, vận mệnh cũng vậy',
  'bạn phù hợp nghề tự do, không hợp việc bàn giấy',
];

const conTenCung =
  /\b(?:Phụ Mẫu|Phúc Đức|Điền Trạch|Quan Lộc|Nô Bộc|Thiên Di|Tật Ách|Tài Bạch|Tử Tức|Phu Thê|Huynh Đệ)|(?:cung|phần|tại|ở|hội về|tọa|thủ|đóng tại|về)\s+Mệnh/u;

const conSot = PHAI_DOI.filter((t) => conTenCung.test(doiTenCung(t)));
kiem('Mọi tên cung đều được đổi', conSot.length === 0, conSot);

const doiOan = KHONG_DUOC_DUNG.filter((t) => doiTenCung(t) !== t);
kiem('Không đụng vào câu không có tên cung', doiOan.length === 0, doiOan);

// Câu sau khi đổi không được gãy: hai lần sở hữu là lỗi đã gặp một lần
const gay = PHAI_DOI.map(doiTenCung).filter(
  (t) => /của bạn của bạn|phần phần|ở ở/u.test(t)
);
kiem('Câu sau khi đổi không gãy', gay.length === 0, gay);

console.log('\n== CẤP ĐỀ MỤC PHẢI NẰM TRONG THỨ BỘ VẼ BIẾT ==\n');

/*
 * `MarkdownLuanGiai` chỉ biết `#`, `##`, `###`. Cấp nào ngoài ba mức đó sẽ hiện
 * nguyên dấu thăng trước mặt người đọc — dấu hiệu lộ liễu nhất của chữ máy sinh
 * chưa qua khâu nào, và đúng lỗi người dùng bắt được.
 *
 * Đây là một HỢP ĐỒNG giữa bên sinh chữ và bên vẽ chữ, mà hợp đồng không ai
 * kiểm thì sớm muộn một bên đổi. Quét mã nguồn thay vì quét đầu ra: chuỗi khuôn
 * nằm trong mã, nên bắt được kể cả khi nhánh ấy chưa lần nào chạy.
 */
const CAP_BO_VE_BIET = new Set(['#', '##', '###']);
const capLa: string[] = [];
for (const tep of ['lib/rag/bai-dai.ts', 'lib/rag/tra-loi.ts']) {
  const ma = readFileSync(tep, 'utf-8');
  for (const m of ma.matchAll(/`(#{1,6})\s/g)) {
    if (!CAP_BO_VE_BIET.has(m[1])) capLa.push(`${tep}: ${m[1]}`);
  }
}
kiem('Không nơi nào sinh cấp đề mục bộ vẽ không biết', capLa.length === 0, capLa);

console.log('\n== MỘT KHỐI THẬT, ĐỂ ĐỌC BẰNG MẮT ==\n');
const mau = tinhNghiengVe({ laSo: ls, chuDe: 'tinh-cam', lopHan: THEO_NAM, namXem: 2026, thangXem: 6 });
console.log(khoiNghiengVe(mau));

console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} MỤC SAI\n`);
process.exit(sai === 0 ? 0 : 1);
