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
import { nhanDangThucThe, tenBiaChan } from '../lib/rag/thuc-the';
import { laCauCanh } from '../lib/rag/cau-canh';
import { coCapPhanBiet, soCauHoi } from '../lib/rag/van-phong';
import { CAU_RA_LENH } from '../lib/rag/chuan-ngon-ngu';
import { demChuTruuTuong } from '../lib/rag/chu-truu-tuong';
import { boCauTenBia } from '../lib/rag/chuan-ngon-ngu';
import { soatNgonNgu } from '../lib/rag/ngon-ngu';

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

/* -------------------------------------------------------------------------- */
console.log('\n== NHẬN DẠNG TÊN SAO BỊA ==\n');

/*
 * Bộ ca này có cả ca ÂM — những câu PHẢI đi qua sạch.
 *
 * Phép đo chỉ cấm thì rất dễ làm cho "đúng": cấm hết thì không còn lỗi nào, và
 * bài cũng không còn gì. Bốn ca âm dưới đây là bốn chỗ một phép đo cẩu thả sẽ
 * bắt nhầm — "Hỏa Tinh" và "Hoa Cái" rụng xuống thành "hoa" nếu bỏ dấu trước
 * khi so, còn "Văn Xương Văn Khúc" là hai tên thật đứng liền nhau.
 */
const caBia: [string, string | null][] = [
  ['Hóa Triệt đứng ở đó.', 'Hóa Triệt'],
  ['Hoá Tuần chiếu về.', 'Hoá Tuần'],
  ['Hóa Kỵ và Triệt cùng một chỗ.', null],
  ['Hỏa Tinh với Hoa Cái ngồi cạnh Đào Hoa.', null],
  ['Văn Xương Văn Khúc giáp mệnh.', null],
  ['Kình Dương Đà La ép hai bên.', null],
  ['Bạn Thấy Rằng Mọi Thứ Đều Ổn.', null],
  // Hai ca bịa BẮT ĐƯỢC TRÊN BÀI THẬT, không phải ca nghĩ ra
  ['Thiên Âm Hóa Khoa từ cha mẹ.', 'Thiên Âm'],
  ['Tài Vi gặp Triệt cho thấy nguồn tiền đến chậm.', 'Tài Vi'],
  // Hai ca âm cũng bắt được trên bài thật — phép đo cũ tự dựng ra rồi tự báo
  ['bộ Tử Phủ Vũ Tướng Liêm tạo nhu cầu dựng nền.', null],
  ['Thân\nCái có sẵn là khí chất.', null],
];
const lechBia = caBia.filter(([cau, mong]) => {
  const ra = tenBiaChan(cau);
  return mong === null ? ra.length > 0 : !ra.includes(mong);
});
kiem('Bắt đúng tên bịa, không bắt nhầm tên thật', lechBia.length === 0, lechBia);

kiem(
  'Câu có tên bịa bị bỏ, câu sạch giữ nguyên',
  boCauTenBia('Hóa Triệt đứng ở đó. Tử Vi ở cung kia.') === 'Tử Vi ở cung kia.' &&
    boCauTenBia('Tử Vi ở cung kia.') === 'Tử Vi ở cung kia.'
);

kiem(
  'Cổng ngôn ngữ đặt tên bịa ở mức CHẶN',
  soatNgonNgu('Hóa Triệt đứng ở đó và bạn nên để ý điều này.', []).loi.some(
    (l) => l.ma === 'ten-sao-bia' && l.mucDo === 'chan'
  )
);

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
const PHU_DINH_TRUOC =
  /(?:không phải|không phải là|chứ không phải|không nhằm|không thay thế|không nên hiểu thành(?: một)?|chứ không|không phải một)\s*$/iu;

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
  const { nhanDangCachCuc } = await import('../lib/tuvi/cach-cuc');
  const tenCachCuc = nhanDangCachCuc(laSo).map((c) => c.ten);

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

  /*
   * Mọi tỉ lệ dưới đây đo trên tiêu chí CÓ CHỮ, không trên tiêu chí được trả về.
   *
   * Từ A1 (KIEN-TRUC-LUAN-GIAI.md), model được phép đánh dấu một tiêu chí là
   * lá số im lặng và để trống. Đếm những tiêu chí ấy vào mẫu số là phạt bài vì
   * đã thành thật — và đó đúng là áp lực đẩy nó quay lại viết cho đủ.
   */
  const tieuChiCoChu = muc.flatMap((m) => m.tieuChi).filter((t) => !t.thieuCanCu);
  const soImLang = muc.flatMap((m) => m.tieuChi).filter((t) => t.thieuCanCu).length;

  // Spec mục 10.17: tiêu chí sâu phải có lực ngược
  const tiLucNguoc =
    tieuChiCoChu.filter((t) => t.luongNguoc).length / Math.max(tieuChiCoChu.length, 1);
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

  /*
   * CÂU BẮC CẦU PHẢI TRỎ ĐÚNG CHẶNG SAU.
   *
   * Lỗi thật đọc được trên bài: cuối chặng 2 viết "chặng sau sẽ đi sâu vào
   * phần bên trong", trong khi chặng 3 là "Những người sát cánh". Model bịa ra
   * đích đến vì prompt chỉ bảo "viết một câu dẫn sang chặng sau" mà không nói
   * chặng sau là gì — cái giá của việc sinh từng chặng một.
   *
   * Câu bắc cầu sai đích tệ hơn không có câu bắc cầu: nó hứa một thứ rồi đưa
   * người đọc sang thứ khác.
   *
   * Đo thô bằng từ khoá của chặng kế tiếp. Thô nhưng bắt đúng loại lỗi này:
   * câu dẫn khi sai thì nói về một chủ đề hoàn toàn khác.
   */
  const TU_KHOA_CHANG: Record<string, RegExp> = {
    'ben-trong': /bên trong|nội tâm|thấy yên|an yên|chính mình/iu,
    'con-duong': /công việc|sự nghiệp|tiền|gây dựng|vị trí|bước ra ngoài/iu,
    'sat-canh': /người|quan hệ|bạn đời|cộng sự|sát cánh|đồng hành/iu,
    'de-lai': /gốc|cha mẹ|nhà|để lại|thế hệ|nơi bạn đến/iu,
  };
  const bacCauSai = bai.chang.filter((c) => {
    const sau = THU_TU_CHANG[THU_TU_CHANG.indexOf(c.id) + 1];
    if (!sau || !c.cauBacCau) return false;
    return !TU_KHOA_CHANG[sau].test(c.cauBacCau);
  });
  kiem(
    'Câu bắc cầu trỏ đúng chặng kế tiếp',
    bacCauSai.length === 0,
    bacCauSai.map((c) => `${c.id}: ${c.cauBacCau?.slice(0, 90)}`)
  );

  /*
   * Một cách cục không được chiếm cả bài.
   *
   * Đo trên bài thật: "Tử Phủ Vũ Tướng Liêm" có mặt ở gần như mười hai phần.
   * Mỗi chặng là một lượt gọi riêng và không lượt nào biết lượt khác đã viết
   * gì, nên cả bốn cùng bám vào cách cục lớn nhất.
   *
   * KHÔNG cấm lặp: một cách cục lớn có mặt ở nhiều phần đời là chuyện đúng về
   * Tử Vi. Ngưỡng 9/12 bắt trường hợp nó chiếm gần hết bài — lúc ấy một lá số
   * hơn hai chục dữ kiện bị thu lại còn một.
   */
  const demTen = new Map<string, number>();
  for (const m of muc) {
    const van = [m.ketLuan, ...m.tieuChi.map((t) => t.noiDung)].join(' ');
    for (const ten of new Set(tenCachCuc)) {
      if (van.includes(ten)) demTen.set(ten, (demTen.get(ten) ?? 0) + 1);
    }
  }
  const chiemBai = [...demTen.entries()].filter(([, d]) => d > 9);
  kiem('Không cách cục nào xuất hiện ở hơn 9/12 phần', chiemBai.length === 0, chiemBai);

  /*
   * ... và phép đo trên KHÔNG ĐỦ, nên có thêm phép đo dưới.
   *
   * Phép trên hỏi "có mặt ở mấy phần" — một câu hỏi nhị phân. Bài đo được
   * "Tử Phủ Vũ Tướng Liêm" 31 lần và "Khốc Hư" 25 lần trên mười hai phần, mà
   * vẫn qua, vì có mặt ở tám phần thì tám vẫn nhỏ hơn chín. Một cái tên nhắc
   * ba lần trong cùng một phần và nhắc một lần đều đếm ra đúng con số 1.
   *
   * Ngân sách: trung bình một lần mỗi phần cho cả bài. Prompt đòi chặt hơn
   * (một lần mỗi phần VÀ không có mặt ở cả ba phần của chặng), nên ngưỡng ở
   * đây là mức sàn để bắt lỗi, không phải mức mong muốn.
   */
  const demLan = new Map<string, number>();
  const vanCacPhan = muc
    .map((m) => [m.ketLuan, ...m.tieuChi.flatMap((t) => [t.noiDung, t.luongNguoc ?? ''])].join(' '))
    .join(' ');
  for (const ten of new Set(tenCachCuc)) {
    const d = vanCacPhan.split(ten).length - 1;
    if (d) demLan.set(ten, d);
  }
  const lapNhieu = [...demLan.entries()].filter(([, d]) => d > muc.length);
  kiem(
    `Không tên nào nhắc quá ${muc.length} lần trong cả bài`,
    lapNhieu.length === 0,
    lapNhieu.sort((a, b) => b[1] - a[1])
  );

  /*
   * MỖI TIÊU CHÍ CHỈ NÊU TÊN SAO Ở MỘT CÂU.
   *
   * Đây là luật chống cái khuôn [tên sao] + động từ + [danh từ trừu tượng].
   * Đo tỉ lệ chứ không đo tuyệt đối: một tiêu chí lỡ nêu tên ở hai câu không
   * làm hỏng bài, cả bài cùng làm vậy mới hỏng.
   */
  const tatCaTieuChi = tieuChiCoChu;
  const quaMotCau = tatCaTieuChi.filter((t) => {
    const cau = [t.noiDung, t.luongNguoc ?? '']
      .join(' ')
      .split(/(?<=[.!?;])\s+/)
      .filter((c) => c.trim().length > 10);
    const coTen = cau.filter((c) =>
      nhanDangThucThe(c).some((x) => x.loai === 'STAR' || x.loai === 'TRANSFORMATION' || x.loai === 'FORMATION')
    );
    return coTen.length > 1;
  });
  const tyLeMotCau = 1 - quaMotCau.length / tatCaTieuChi.length;
  /*
   * NGƯỠNG 70% LÀ SÀN CHỐNG TỤT, KHÔNG PHẢI MỨC MONG MUỐN.
   *
   * Đây là phép đo trên một bộ sinh ngẫu nhiên, nên nó có phương sai. Đo được
   * qua các lượt: khuôn câu 80%+ rồi 75%; nhịp 60% (trước khi đổi cách ra
   * luật) rồi 80%+ rồi 77%. Dải thật nằm khoảng 75–85%.
   *
   * Đặt ngưỡng 80% là đặt nó giữa dải ấy, và một cái cổng bật tắt theo nhiễu
   * thì chỉ dạy người đọc log thói quen chạy lại cho tới khi xanh — lúc đó nó
   * thôi đo được gì. Ngưỡng ở đây thấp hơn sàn quan sát được, để nó chỉ đỏ khi
   * có thứ THẬT SỰ tụt. Mức muốn đạt vẫn là 80%+ và vẫn phải sửa bằng prompt,
   * không phải bằng cách hạ con số này thêm lần nữa.
   */
  kiem(
    'Từ 70% tiêu chí trở lên chỉ nêu tên sao ở một câu',
    tyLeMotCau >= 0.7,
    `${Math.round(tyLeMotCau * 100)}% — ${quaMotCau.length}/${tatCaTieuChi.length} tiêu chí nêu tên ở nhiều câu`
  );

  /*
   * NHỊP CÂU.
   *
   * Bài đo được câu trung bình 21,7 từ, chỉ 9% số câu dưới 12 từ. Văn đều một
   * nhịp thì không sai chỗ nào mà đọc không đọng lại chỗ nào.
   *
   * Đếm câu ngắn chứ không đếm độ dài trung bình: trung bình che mất chuyện
   * cần biết. Một bài toàn câu 21 từ và một bài xen câu 6 từ với câu 35 từ cho
   * cùng một số trung bình, mà đọc khác hẳn nhau.
   *
   * Đo THEO TIÊU CHÍ chứ không đo tỉ lệ cả bài, vì luật trong prompt viết theo
   * tiêu chí. Bản đầu ra luật bằng tỉ lệ cả bài ("cứ năm câu có một câu ngắn")
   * và model không nhúc nhích: 9% lên 10%. Nó viết từng tiêu chí một, không có
   * cách nào tự đếm một tỉ lệ nó không nhìn thấy. Tỉ lệ cả bài vẫn in ra để
   * đọc, nhưng thứ quyết định đạt hay không là luật model thật sự làm được.
   */
  const ngan = (c: string) => c.trim().split(/\s+/).length < 12;
  const coCauNgan = tatCaTieuChi.filter((t) =>
    [t.noiDung, t.luongNguoc ?? '']
      .join(' ')
      .split(/(?<=[.!?;])\s+/)
      .filter((c) => c.trim().length > 10)
      .some(ngan)
  );
  const tyLeCoNgan = coCauNgan.length / tatCaTieuChi.length;
  const cauCaBai = vanCacPhan.split(/(?<=[.!?;])\s+/).filter((c) => c.trim().length > 10);
  const tyLeNgan = cauCaBai.filter(ngan).length / cauCaBai.length;
  /*
   * CÂU LỰC NGƯỢC KHÔNG MỞ ĐẦU BẰNG TÊN SAO.
   *
   * Bài cũ có 76 câu lực ngược, phần lớn mở bằng một cái tên. Từng câu một thì
   * không sai gì; xếp cạnh nhau thì chúng thành một cột đều đặn, và cú vặn ý
   * biến thành một mục trong danh sách.
   *
   * Chỉ đo CHỮ MỞ ĐẦU, không đo cả câu: nêu tên trong thân câu lực ngược là
   * chuyện bình thường và đúng.
   */
  const luongNguoc = tatCaTieuChi.map((t) => t.luongNguoc ?? '').filter((x) => x.trim());
  const moBangTen = luongNguoc.filter((x) => {
    const dau = x.trim().split(/\s+/).slice(0, 4).join(' ');
    return nhanDangThucThe(dau).some(
      (e) => e.loai === 'STAR' || e.loai === 'TRANSFORMATION' || e.loai === 'FORMATION'
    );
  });
  const tyLeMoTen = moBangTen.length / Math.max(1, luongNguoc.length);
  kiem(
    'Dưới 20% câu lực ngược mở đầu bằng tên sao',
    tyLeMoTen < 0.2,
    `${Math.round(tyLeMoTen * 100)}% (${moBangTen.length}/${luongNguoc.length})`
  );

  /*
   * MỖI PHẦN CÓ ÍT NHẤT MỘT CÂU CẢNH.
   *
   * Đây là mục khác biệt thật so với sản phẩm đối chiếu: bài của ta đã dịch
   * tên sao sang hành vi, nhưng dịch sang hành vi TRỪU TƯỢNG rồi dừng. Xem
   * ghi chú đầu `cau-canh.ts` để biết phép đo này xấp xỉ ở chỗ nào.
   *
   * Đo theo PHẦN chứ không theo tiêu chí: bắt mọi tiêu chí đều có cảnh là ép
   * bài thành một chuỗi tiểu phẩm. Một cảnh cho mỗi phần đời là đủ để người
   * đọc có chỗ đặt mình vào.
   */
  const tieuChiCoCanh = tatCaTieuChi.filter((t) =>
    [t.noiDung, t.luongNguoc ?? '']
      .join(' ')
      .split(/(?<=[.!?;])\s+/)
      .some(laCauCanh)
  );
  const tyLeCanh = tieuChiCoCanh.length / tatCaTieuChi.length;
  kiem(
    'Từ 70% tiêu chí trở lên có câu cảnh cụ thể',
    tyLeCanh >= 0.7,
    `${Math.round(tyLeCanh * 100)}% (${tieuChiCoCanh.length}/${tatCaTieuChi.length})`
  );

  /*
   * CHỮ TRỪU TƯỢNG.
   *
   * Chủ dự án nói thẳng: không được có chữ nào trừu tượng, khó hiểu cho người
   * đọc. Nên đây là phép ĐẾM TUYỆT ĐỐI, không phải tỉ lệ — mỗi lần dùng là một
   * chỗ người đọc trượt qua mà không đọng lại gì.
   *
   * Ngưỡng 12 = trung bình một lần mỗi phần. Không đặt 0: vài chữ trong bảng
   * có lúc là chữ đúng và không có chữ thay nào gọn hơn. Nhưng 12 đã là mức
   * rất chặt so với nền đo được — bài cũ riêng "nền", "năng lực", "nhịp",
   * "cấu trúc" đã hơn một trăm lần.
   */
  const chuTruu = demChuTruuTuong(vanCacPhan);
  const tongChuTruu = chuTruu.reduce((a, [, d]) => a + d, 0);
  kiem(
    'Chữ trừu tượng dưới 12 lần trong cả bài',
    tongChuTruu < 12,
    `${tongChuTruu} lần — ${chuTruu
      .slice(0, 6)
      .map(([c, d]) => `${c}:${d}`)
      .join(', ')}`
  );

  // Ngưỡng 70%: cùng lý do với phép đo trên, xem ghi chú ở đó
  kiem(
    'Từ 70% tiêu chí trở lên có ít nhất một câu ngắn',
    tyLeCoNgan >= 0.7,
    `${Math.round(tyLeCoNgan * 100)}% tiêu chí — cả bài ${Math.round(tyLeNgan * 100)}% câu dưới 12 từ`
  );
  const vanCaBai = bai.chang
    .flatMap((c) => c.muc)
    .flatMap((m) => [m.ketLuan, ...m.tieuChi.flatMap((t) => [t.noiDung, t.luongNguoc ?? ''])])
    .join(' ');
  const biaTrongBai = tenBiaChan(vanCaBai);
  kiem('Không tên sao bịa trong cả bài', biaTrongBai.length === 0, biaTrongBai);

  /*
   * BỐN THÓI QUEN VIẾT — xem lib/rag/van-phong.ts.
   *
   * Chúng rút từ một bản CON NGƯỜI viết lại: chủ dự án giữ nguyên mọi nhận
   * định của máy, chỉ đổi cách nói, và bản ấy đọc hay hơn hẳn. Cái hay không
   * nằm ở chữ đẹp mà ở vài thói quen lặp đi lặp lại — nên đếm được.
   *
   * Đo theo TỈ LỆ PHẦN, không đo tuyệt đối: một phần thiếu cặp phân biệt
   * không làm hỏng bài, cả mười hai phần cùng thiếu mới hỏng.
   */
  const vanMoiPhan = muc.map((m) =>
    [m.ketLuan, m.giuLai, m.cauHoiSoi, ...m.tieuChi.flatMap((t) => [t.noiDung, t.luongNguoc ?? ''])].join(' ')
  );
  const coCap = vanMoiPhan.filter(coCapPhanBiet).length;
  kiem(
    'Từ 70% phần trở lên có cặp phân biệt',
    coCap / muc.length >= 0.7,
    `${coCap}/${muc.length}`
  );
  const coHoi = muc.filter((m) => soCauHoi(m.cauHoiSoi) > 0).length;
  kiem('Mọi phần có câu hỏi của người đọc', coHoi === muc.length, `${coHoi}/${muc.length}`);
  const coGiu = muc.filter((m) => m.giuLai.trim().length > 20).length;
  kiem('Mọi phần có câu giữ lại', coGiu === muc.length, `${coGiu}/${muc.length}`);
  /*
   * Câu giữ lại KHÔNG được là lời khuyên. Nó là điều đáng mang theo, không
   * phải việc phải làm — xem QUY_TAC_GIU_LAI.
   */
  const giuLaiKhuyen = muc.filter((m) => CAU_RA_LENH.test(m.giuLai)).map((m) => m.id);
  kiem('Câu giữ lại không phải lời khuyên', giuLaiKhuyen.length === 0, giuLaiKhuyen.join(', '));


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
  /*
   * ĐỘ NỔI BẬT ↔ SỐ TỪ — tiêu chí nghiệm thu của A1.
   *
   * A1 đổi ngân sách từ ĐÍCH thành TRẦN. Nghiệm thu không phải "bài ngắn đi"
   * mà là "phần lá số nói ít thì ngắn đi, phần nói nhiều thì không". Một con
   * số tổng không phân biệt được hai chuyện đó — in từng cặp thì phân biệt
   * được bằng mắt trong ba giây.
   */
  console.log(
    `  Độ nổi bật → số từ: ${muc
      .map((m) => `${m.id} ${m.doNoiBat}→${m.tieuChi.reduce((t, x) => t + x.soTu, 0)}`)
      .join(' · ')}`
  );
  console.log(
    `  Tiêu chí lá số im lặng (A1): ${soImLang}/${muc.flatMap((m) => m.tieuChi).length}`
  );
  console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} MỤC SAI\n`);
  process.exit(sai === 0 ? 0 : 1);
}

void do_();
