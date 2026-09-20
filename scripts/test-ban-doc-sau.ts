/**
 * Nghiệm thu BẢN ĐỌC SÂU — npx tsx scripts/test-ban-doc-sau.ts
 *
 *   --sinh   gọi model thật, dựng một bài đầy đủ rồi đo (4 lượt, ~150 giây)
 *
 * Mặc định chạy OFFLINE: kiểm cấu trúc, hình học gương và bảng tiêu chí —
 * những thứ không cần model và phải luôn đúng. Phần đo nội dung chỉ chạy khi
 * có cờ `--sinh`, vì nó tốn tiền và mất hai phút rưỡi.
 *
 * Đo đúng những tiêu chí nghiệm thu spec mục 10 đặt cho tầng Bản đọc sâu:
 * mục 11 (đủ 12 phần), 12 (ngân sách từ), 14 (12/12 khối gương), 15 (12/12
 * phần có tham chiếu ngoài chặng), 17 (tiêu chí sâu phải có lực ngược),
 * 20 (sổ bao phủ), 25–27 (ràng buộc an toàn).
 */

import { readFileSync } from 'node:fs';

import {
  CHANG,
  CHANG_CUA_MUC,
  CUNG_CUA_MUC,
  GUONG,
  GUONG_NOI_BO,
  MUC_CUA_CUNG,
  TAM_HOP,
  THU_TU_CHANG,
  type MucId,
} from '../lib/tuvi/chang-cung';
import { TIEU_CHI_SAU, TONG_TIEU_CHI_SAU } from '../lib/tuvi/tieu-chi-sau';

const sinh = process.argv.includes('--sinh');

let sai = 0;
function kiem(ten: string, ok: boolean, chiTiet?: unknown) {
  if (!ok) sai += 1;
  console.log(
    `  ${ok ? 'OK  ' : 'SAI '} ${ten}${!ok && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`
  );
}

console.log('\n== BẢNG TIÊU CHÍ ==\n');

const mucIds = Object.keys(CUNG_CUA_MUC) as MucId[];
kiem('Đủ 12 phần', mucIds.length === 12);
kiem('Bảng tiêu chí phủ đủ 12 phần', mucIds.every((m) => TIEU_CHI_SAU[m]?.length > 0));
kiem(`Tổng 77 tiêu chí (đếm ${TONG_TIEU_CHI_SAU})`, TONG_TIEU_CHI_SAU === 77);

/*
 * Mỗi phần đúng MỘT tiêu chí gương.
 *
 * Không phải "ít nhất một": hai khối đảo màu trong một phần thì cả hai mất tác
 * dụng, vì cái làm mắt dừng lại là sự khác biệt, không phải màu nền.
 */
const saiGuong = mucIds.filter((m) => TIEU_CHI_SAU[m].filter((t) => t.laGuong).length !== 1);
kiem('Mỗi phần đúng 1 tiêu chí gương', saiGuong.length === 0, saiGuong);

const thieuNhan = mucIds.filter((m) => TIEU_CHI_SAU[m].some((t) => !t.nhan.trim()));
kiem('Mọi tiêu chí đều có nhãn', thieuNhan.length === 0, thieuNhan);

console.log('\n== HÌNH HỌC BỐN CHẶNG, MƯỜI HAI TẤM GƯƠNG ==\n');

kiem('Đúng 4 chặng', THU_TU_CHANG.length === 4);
kiem(
  'Mỗi chặng đúng 3 phần',
  THU_TU_CHANG.every((c) => CHANG[c].muc.length === 3)
);

// Gom gương thành cặp — mỗi quan hệ đúng một lần
const daCo = new Set<string>();
const cap: [MucId, MucId][] = [];
for (const m of mucIds) {
  const doi = MUC_CUA_CUNG[GUONG[CUNG_CUA_MUC[m]]];
  if (!doi) continue;
  const khoa = [m, doi].sort().join('|');
  if (daCo.has(khoa)) continue;
  daCo.add(khoa);
  cap.push([m, doi]);
}
kiem(`Đúng 6 cặp gương (đếm ${cap.length})`, cap.length === 6);

const bacCau = cap.filter(([a, b]) => CHANG_CUA_MUC[a] !== CHANG_CUA_MUC[b]);
kiem(`4 cặp bắc cầu giữa chặng (đếm ${bacCau.length})`, bacCau.length === 4, bacCau);
kiem(`2 cặp gương nội bộ (đếm ${cap.length - bacCau.length})`, cap.length - bacCau.length === 2);

kiem(
  'GUONG_NOI_BO khớp với hình học thật',
  GUONG_NOI_BO.every(([a, b]) => CHANG_CUA_MUC[a] === CHANG_CUA_MUC[b]),
  GUONG_NOI_BO
);

/*
 * Spec mục 10.15: 12/12 phần phải có ít nhất một cung tham chiếu nằm NGOÀI
 * chặng của nó. Đây là thứ làm bài không đọc tuyến tính được — kiểm bằng hình
 * học, không cần đợi model viết.
 */
const trongChang = mucIds.filter((m) => {
  const goc = CUNG_CUA_MUC[m];
  return ![...TAM_HOP[goc], GUONG[goc]].some((cung) => {
    const khac = MUC_CUA_CUNG[cung];
    return khac ? CHANG_CUA_MUC[khac] !== CHANG_CUA_MUC[m] : false;
  });
});
kiem('12/12 phần có tham chiếu ngoài chặng', trongChang.length === 0, trongChang);

// Gương phải đối xứng: A soi qua B thì B soi qua A
const lechGuong = mucIds.filter((m) => {
  const doi = MUC_CUA_CUNG[GUONG[CUNG_CUA_MUC[m]]];
  return !doi || MUC_CUA_CUNG[GUONG[CUNG_CUA_MUC[doi]]] !== m;
});
kiem('Quan hệ gương đối xứng hai chiều', lechGuong.length === 0, lechGuong);

if (!sinh) {
  console.log(
    '\n  Phần đo NỘI DUNG cần gọi model thật (4 lượt, ~150 giây).' +
      '\n  Chạy `npx tsx scripts/test-ban-doc-sau.ts --sinh` khi vừa sửa prompt.\n'
  );
  console.log(sai === 0 ? 'TẤT CẢ ĐỀU ĐÚNG\n' : `${sai} MỤC SAI\n`);
  process.exit(sai === 0 ? 0 : 1);
}

// ---------------------------------------------------------------- đo nội dung
for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

/** Câu định bệnh — spec mục 10.25 cấm tuyệt đối ở phần sức khoẻ */
const DINH_BENH =
  /mắc bệnh|bị bệnh|chẩn đoán|ung thư|tiểu đường|huyết áp cao|bệnh lý|khối u|phải mổ|thọ yểu|tuổi thọ|sống đến/iu;

/**
 * Từ phủ định đứng trước cụm bị cấm — câu đó đang nói NGƯỢC LẠI điều bị cấm.
 *
 * Lần chạy đầu bộ này bắt đúng câu miễn trừ:
 *   "…đây chỉ là khuynh hướng tham khảo, KHÔNG PHẢI CHẨN ĐOÁN."
 * Tức là nó chặn chính câu làm phần sức khoẻ trở nên an toàn.
 *
 * `ngon-ngu.ts` đã ghi lại cái hố này cho `demCoPhuDinh` và nói rõ hậu quả:
 * bắt nhầm kiểu ấy thì người sửa sẽ đi GỠ BỎ lời miễn trừ để làm hài lòng cái
 * máy — tức là bộ đo tự tay làm sản phẩm kém an toàn đi.
 */
const PHU_DINH_TRUOC = /(?:không phải|không phải là|chứ không phải|không nhằm|không thay thế)\s*$/iu;

/** Câu có thật sự định bệnh không, hay chỉ đang nói rằng mình KHÔNG định bệnh */
function laCauDinhBenh(cau: string): boolean {
  const m = DINH_BENH.exec(cau);
  if (!m) return false;
  return !PHU_DINH_TRUOC.test(cau.slice(0, m.index));
}

async function do_() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { sinhBanDocSau, soBaoPhu, soatBanDocSau } = await import('../lib/rag/ban-doc-sau');
  const { namAmHienTai, thangAmHienTai } = await import('../lib/tuvi/bay-gio');

  console.log('\n== SINH BÀI THẬT ==\n');
  const laSo = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 20, gioiTinh: 'nam' });
  const t0 = Date.now();
  const bai = await sinhBanDocSau({
    laSo,
    namXem: namAmHienTai(),
    thangXem: thangAmHienTai(),
    khiXongChang: (c) =>
      console.log(`  ✓ ${c.thuTu}. ${c.tieuDe} — ${((Date.now() - t0) / 1000).toFixed(0)}s`),
  });

  if (!bai) {
    kiem('Dựng được bài', false);
    console.log(`\n${sai} MỤC SAI\n`);
    process.exit(1);
  }

  console.log('\n== NGHIỆM THU NỘI DUNG ==\n');

  const so = soBaoPhu(bai);
  /*
   * Gọi TÊN phần bị rụng, đừng chỉ đếm.
   *
   * Lần chạy trước bộ này báo "11" ba lần liền mà không nói phần nào — và ba
   * dòng ấy là CÙNG một lỗi đếm ba lần, không phải ba lỗi. Một con số không
   * sửa được gì; một cái tên thì sửa được ngay.
   */
  const rung = bai.chang.flatMap((c) => c.muc).filter((m) => m.thieuCanCu);
  kiem('Sổ bao phủ đạt', so.dat, { ...so, rung: rung.map((m) => m.id) });
  kiem(
    'Đủ 12 phần dựng được',
    so.soMuc === 12,
    rung.length ? `rụng: ${rung.map((m) => m.id).join(', ')}` : so.soMuc
  );
  kiem('12/12 phần có khối gương', so.soGuong === 12, so.soGuong);

  const muc = bai.chang.flatMap((c) => c.muc).filter((m) => !m.thieuCanCu);

  // Ngân sách từ: spec 420–560, +20% khi nổi bật, −20% khi mờ. Cho biên 15%
  // vì model không đếm từ chính xác được — nhưng lệch xa thì là lỗi prompt.
  const daiLoi = muc.filter((m) => {
    const tong = m.tieuChi.reduce((t, x) => t + x.soTu, 0);
    return tong < 330 || tong > 780;
  });
  kiem(
    'Mọi phần trong ngân sách từ',
    daiLoi.length === 0,
    daiLoi.map((m) => [m.id, m.tieuChi.reduce((t, x) => t + x.soTu, 0)])
  );

  // Spec mục 10.17: tiêu chí sâu phải có lực ngược
  const tiLucNguoc =
    muc.flatMap((m) => m.tieuChi).filter((t) => t.luongNguoc).length /
    Math.max(muc.flatMap((m) => m.tieuChi).length, 1);
  kiem(
    `≥70% tiêu chí có lực ngược (đo ${(tiLucNguoc * 100).toFixed(0)}%)`,
    tiLucNguoc >= 0.7
  );

  const gate = soatBanDocSau(bai);
  kiem(
    'Không lỗi chặn ở cổng ngôn ngữ',
    gate.loi.every((l) => l.mucDo !== 'chan'),
    gate.loi.filter((l) => l.mucDo === 'chan')
  );

  console.log('\n== AN TOÀN NỘI DUNG ==\n');

  const tatAch = muc.find((m) => m.id === 'tat-ach');
  const vanTatAch = tatAch
    ? [tatAch.ketLuan, ...tatAch.tieuChi.map((t) => t.noiDung)].join(' ')
    : '';
  const cauDinhBenh = vanTatAch
    .split(/(?<=[.!?])\s+/)
    .filter(laCauDinhBenh);
  kiem(
    'Phần sức khoẻ không có câu định bệnh',
    cauDinhBenh.length === 0,
    cauDinhBenh.map((c) => c.slice(0, 110))
  );

  /*
   * Và phải CÓ lời miễn trừ y tế.
   *
   * Spec mục 10.25 đòi hai thứ, không phải một: không định bệnh, VÀ bắt buộc
   * render disclaimer. Chỉ đo vế cấm thì một bài im lặng hoàn toàn về giới hạn
   * của mình vẫn qua được — mà im lặng ở chỗ này mới là chỗ nguy.
   */
  kiem(
    'Phần sức khoẻ có lời miễn trừ y tế',
    /tham khảo|không phải chẩn đoán|không thay thế|không nhằm chẩn/iu.test(vanTatAch),
    vanTatAch.slice(0, 120)
  );

  const phuMau = muc.find((m) => m.id === 'phu-mau');
  const vanPhuMau = phuMau
    ? [phuMau.ketLuan, ...phuMau.tieuChi.map((t) => t.noiDung)].join(' ')
    : '';
  kiem(
    'Phần cha mẹ không luận thọ yểu',
    !/thọ yểu|tuổi thọ|sống đến|mất sớm|ra đi sớm/iu.test(vanPhuMau)
  );

  // Tên cung không được lọt vào kết luận — spec mục 10.5 áp cho cả hai tầng
  const loTenCung = muc.filter((m) =>
    /\b(?:Phụ Mẫu|Phúc Đức|Điền Trạch|Quan Lộc|Nô Bộc|Thiên Di|Tật Ách|Tài Bạch|Tử Tức|Phu Thê|Huynh Đệ)\b/u.test(
      m.ketLuan
    )
  );
  kiem(
    '0 tên cung trong câu kết luận',
    loTenCung.length === 0,
    loTenCung.map((m) => m.id)
  );

  console.log(`\n  Tổng thời gian: ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  console.log(
    `  Số từ mỗi phần: ${muc.map((m) => m.tieuChi.reduce((t, x) => t + x.soTu, 0)).join(', ')}`
  );
  console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} MỤC SAI\n`);
  process.exit(sai === 0 ? 0 : 1);
}

void do_();
