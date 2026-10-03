/**
 * Bộ kiểm đường Focused (CEL-186 vé B) — npx tsx scripts/test-focused.ts
 *
 * OFFLINE: không chạm database, không gọi model. Chạy được trong CI.
 *
 * Hai loại kiểm, giá khác nhau:
 *   - CỜ TẮT KHÔNG ĐỔI GÌ: đường cũ (STANDARD) phải đúng từng byte như trước khi
 *     có Focused. Hỏng ở đây là đổi bài của mọi người dùng đang chạy thật.
 *   - Hành vi riêng của Focused: người được hỏi, tháng nhuận, nghiêng về.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { lapLaSo, type LaSo } from '../lib/tuvi/ansao';
import { PHUONG_PHAP } from '../lib/tuvi/phuong-phap';
import { chonBoiCanh, saoChinhTheoCung } from '../lib/rag/boi-canh-la-so';
import { tinhNghiengVe, khoiNghiengVe } from '../lib/rag/nghieng-ve';
import { lapKeHoach, PHIEN_BAN_PLANNER } from '../lib/rag/planner';
import { PHIEN_BAN_CHU } from '../lib/rag/phien-ban-chu';
import { CHUAN_NGON_NGU_CELES } from '../lib/rag/chuan-ngon-ngu';
import { CHU_TRUU_TUONG } from '../lib/rag/chu-truu-tuong';
import { PHIEN_BAN_NGON_NGU } from '../lib/rag/ngon-ngu';
import { PHIEN_BAN_VALIDATOR } from '../lib/rag/kiem-duyet';
import { nhanDangDoiTuong, ghepKeHoach, cauGhep } from '../lib/rag/focused/doi-tuong';
import { coThangNhuan, khoangDuong, soVoiBayGio, laCuoiNamAm } from '../lib/rag/focused/thang-am';
import { lapKeHoachFocused } from '../lib/rag/focused/ke-thua';
import { phanKhuon, laXinSau, tachHaiVe, boiCanhThoiGian } from '../lib/rag/focused/phan-loai';
import { cauVanRieng, cauHaiVe, cauHoiNhuan, cauKhiNao, chipCuoiNam, cauThangDaQua } from '../lib/rag/focused/cau-ma';

const hong: string[] = [];
const kiem = (dk: boolean, loi: string) => {
  if (!dk) hong.push(loi);
};

/* ----------------------------------------------- 1. phiên bản chữ không đổi */

/*
 * L3 (mục 15): không ghim chuỗi cứng — main có quyền đổi chuẩn và nâng băm.
 * Dựng lại băm từ chính các hằng nguồn rồi so với giá trị đang export: thêm
 * `export` cho hằng nào cũng không được làm đổi đầu vào băm.
 */
const dungLai = createHash('sha1')
  .update(
    [
      CHUAN_NGON_NGU_CELES,
      CHU_TRUU_TUONG.map(([a, b]) => `${a}>${b}`).join(','),
      PHIEN_BAN_NGON_NGU,
      PHIEN_BAN_VALIDATOR,
      PHIEN_BAN_PLANNER,
      PHUONG_PHAP.phienBan,
    ].join('|')
  )
  .digest('hex')
  .slice(0, 8);
kiem(dungLai === PHIEN_BAN_CHU, `băm dựng lại ${dungLai} ≠ PHIEN_BAN_CHU ${PHIEN_BAN_CHU} — đầu vào băm đã trôi`);

/* ---------------------------------------------- 2. cờ tắt: không đổi từng byte */

const mau = JSON.parse(readFileSync(join(__dirname, 'mau-ansao.json'), 'utf8')).mau as Record<string, string>;
const dsLaSo: LaSo[] = Object.keys(mau).map((k) => {
  const m = k.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/)!;
  return lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' });
});

const CAU_CO = [
  'Năm nay công việc của tôi thế nào?',
  'Tháng 5 tiền bạc ra sao?',
  'Tình cảm năm 2027 có ổn không?',
  'Con tôi năm nay thế nào?',
  'Sức khỏe tháng này?',
  'Bố tôi sức khỏe năm nay?',
];

let soLuuTinh = 0;
let soCanBang = 0;
for (const laSo of dsLaSo) {
  for (const cauHoi of CAU_CO) {
    const namXem = 2026;
    const thangXem = 8;
    const kh = lapKeHoach({ cauHoi, saoTheoCung: saoChinhTheoCung(laSo), namXem, thangXem });

    const bcGoc = JSON.stringify(chonBoiCanh({ laSo, keHoach: kh, namXem, thangXem }));
    const bcTat = JSON.stringify(chonBoiCanh({ laSo, keHoach: kh, namXem, thangXem, focused: false }));
    kiem(bcGoc === bcTat, `chonBoiCanh focused:false ≠ không truyền — "${cauHoi}"`);
    kiem(!bcGoc.includes('"luu-tinh"'), `mục lưu tinh lọt vào đường cũ — "${cauHoi}"`);

    const vao = { laSo, chuDe: kh.chuDe, lopHan: kh.lopHan, namXem, thangXem };
    const nGoc = tinhNghiengVe(vao);
    const nTat = tinhNghiengVe({ ...vao, focused: false });
    kiem(JSON.stringify(nGoc) === JSON.stringify(nTat), `tinhNghiengVe focused:false ≠ không truyền — "${cauHoi}"`);
    kiem(khoiNghiengVe(nGoc) === khoiNghiengVe(nTat), `khoiNghiengVe lệch khi cờ tắt — "${cauHoi}"`);

    // Đường Focused: mục lưu tinh nối vào CUỐI, mã F### của mục cũ không dịch.
    const bcFo = chonBoiCanh({ laSo, keHoach: kh, namXem, thangXem, focused: true });
    const cu = JSON.parse(bcGoc);
    if (JSON.stringify(bcFo.duKien.slice(0, cu.duKien.length)) !== JSON.stringify(cu.duKien)) {
      hong.push(`Focused đổi thứ tự / nội dung mục cũ — "${cauHoi}"`);
    }
    if (bcFo.duKien.some((m) => m.loai === 'luu-tinh')) soLuuTinh++;

    // Focused cân bằng: phải nêu được cả hai phía nếu lá số có cả hai.
    const nFo = tinhNghiengVe({ ...vao, focused: true });
    if (nFo && nGoc && nFo.huong === 'can-bang') {
      soCanBang++;
      for (const phia of ['do', 'can'] as const) {
        // Thiếu một phía chỉ được khi phía đó vắng cả ở đường cũ.
        if (!nFo.dauMoc.some((d) => d.huong === phia) && nGoc.dauMoc.some((d) => d.huong === phia)) {
          hong.push(`Focused cân bằng thiếu phía "${phia}" dù lá số có — "${cauHoi}"`);
        }
      }
    }
  }
}
kiem(soLuuTinh > 0, 'không ca nào có mục lưu tinh trên đường Focused — nhánh lưu tinh chết');
kiem(soCanBang > 0, 'không ca nào ra cân bằng — kiểm "đủ hai phía" không được chạy');

/* ----------------------------------------------------- 3. tháng âm và nhuận */

// 2023 nhuận tháng 2, 2025 nhuận tháng 6; 2026, 2027 không nhuận.
kiem(coThangNhuan(2023, 2), '2023 phải có tháng 2 nhuận');
kiem(coThangNhuan(2025, 6), '2025 phải có tháng 6 nhuận');
for (const nam of [2026, 2027]) {
  for (let t = 1; t <= 12; t++) kiem(!coThangNhuan(nam, t), `${nam} không nhuận nhưng coThangNhuan(${t}) = true`);
}
kiem(!coThangNhuan(2025, 5), '2025 tháng 5 không nhuận');
kiem(khoangDuong(2026, 3, true) === null, 'khoangDuong tháng nhuận không tồn tại phải là null');
const thuong = khoangDuong(2025, 6);
const nhuan = khoangDuong(2025, 6, true);
kiem(!!thuong && !!nhuan && thuong !== nhuan, `2025 tháng 6 thường và nhuận phải ra hai khoảng khác nhau (${thuong} / ${nhuan})`);

const bayGio = { nam: 2026, thang: 8, ngay: 12 };
kiem(soVoiBayGio(2026, 3, bayGio) === 'da-qua', 'tháng 3/2026 phải là đã qua');
kiem(soVoiBayGio(2026, 8, bayGio) === 'dang', 'tháng 8/2026 phải là đang');
kiem(soVoiBayGio(2026, 10, bayGio) === 'toi', 'tháng 10/2026 phải là tới');
kiem(soVoiBayGio(2025, 12, bayGio) === 'da-qua', 'tháng 12/2025 phải là đã qua');
kiem(!laCuoiNamAm(bayGio) && laCuoiNamAm({ nam: 2026, thang: 11, ngay: 2 }), 'laCuoiNamAm sai mốc tháng 11');

/* ------------------------------------------------- 4. người được hỏi (L1) */

interface CaDoiTuong {
  cau: string;
  cung: string | null;
  loai?: 'quan-he' | 'van-rieng';
}

const CA_DOI_TUONG: CaDoiTuong[] = [
  { cau: 'Con tôi năm nay thế nào?', cung: 'Tử Tức', loai: 'quan-he' },
  { cau: 'Con gái tôi năm nay thi đại học có đỗ không?', cung: 'Tử Tức', loai: 'van-rieng' },
  { cau: 'Bố tôi năm nay sức khỏe thế nào?', cung: 'Phụ Mẫu', loai: 'van-rieng' },
  { cau: 'Mẹ của mình có hợp với mình không?', cung: 'Phụ Mẫu', loai: 'quan-he' },
  { cau: 'Anh trai tôi có giúp được gì cho tôi không?', cung: 'Huynh Đệ', loai: 'quan-he' },
  { cau: 'Chồng em năm nay có thăng chức không?', cung: 'Phu Thê', loai: 'van-rieng' },
  { cau: 'Vợ tôi với tôi năm nay có hay cãi nhau không?', cung: 'Phu Thê', loai: 'quan-he' },
  { cau: 'Người yêu tôi có thăng chức không?', cung: 'Phu Thê', loai: 'van-rieng' },
  { cau: 'Bạn thân tôi có phản tôi không?', cung: 'Nô Bộc', loai: 'quan-he' },
  { cau: 'Sếp tôi có ưu ái tôi không?', cung: 'Phụ Mẫu', loai: 'quan-he' },
  { cau: 'con toi nam nay the nao', cung: 'Tử Tức', loai: 'quan-he' },
  { cau: 'ban than toi co phan toi khong', cung: 'Nô Bộc', loai: 'quan-he' },
  // Âm tính: đại từ xưng, "bản thân", người chung chung — là chính người hỏi.
  { cau: 'Bản thân tôi năm nay thế nào?', cung: null },
  { cau: 'ban than toi nam nay the nao', cung: null },
  { cau: 'Con năm nay có lấy được chồng không ạ?', cung: null },
  { cau: 'Con nghĩ công việc của con năm nay sao ạ?', cung: null },
  { cau: 'Em có người yêu không?', cung: null },
  { cau: 'Tôi có nên chuyển việc không?', cung: null },
  { cau: 'Năm nay tôi có con không?', cung: null },
  { cau: 'Anh ấy có thật lòng không?', cung: null },
];

for (const ca of CA_DOI_TUONG) {
  const dt = nhanDangDoiTuong(ca.cau);
  if (ca.cung === null) {
    kiem(dt === null, `"${ca.cau}" không hỏi người khác, nhận nhầm ${dt?.vai}/${dt?.cung}`);
    continue;
  }
  if (!dt) {
    hong.push(`"${ca.cau}" phải nhận ra ${ca.cung}, ra null`);
    continue;
  }
  kiem(dt.cung === ca.cung, `"${ca.cau}" ra cung ${dt.cung}, cần ${ca.cung}`);
  if (ca.loai) kiem(dt.loai === ca.loai, `"${ca.cau}" ra loại ${dt.loai}, cần ${ca.loai}`);

  // Hợp đồng ghép kế hoạch: mọi trường từ câu gốc, cung lục thân đứng đầu,
  // không lẫn cung của chính người hỏi.
  const laSo = dsLaSo[0];
  const vao = { saoTheoCung: saoChinhTheoCung(laSo), namXem: 2026, thangXem: 8 };
  const goc = lapKeHoach({ ...vao, cauHoi: ca.cau });
  const ghep = lapKeHoach({ ...vao, cauHoi: cauGhep(ca.cau, dt) });
  const kq = ghepKeHoach(goc, ghep, dt);
  kiem(kq.cungLienQuan[0] === dt.cung, `"${ca.cau}" cung đầu ${kq.cungLienQuan[0]}, cần ${dt.cung}`);
  kiem(
    !kq.cungLienQuan.some((c) => c === 'Quan Lộc' || c === 'Tài Bạch' || c === 'Tật Ách'),
    `"${ca.cau}" còn cung riêng của người hỏi: ${kq.cungLienQuan.join(', ')}`
  );
  const { cungLienQuan: _a, ...conGoc } = goc;
  const { cungLienQuan: _b, ...conKq } = kq;
  kiem(JSON.stringify(conGoc) === JSON.stringify(conKq), `"${ca.cau}" ghép kế hoạch đổi trường ngoài cungLienQuan`);
}

/* ---------------------------------------------- kế thừa chủ đề qua chip (cờ #2) */

{
  const vao = { saoTheoCung: saoChinhTheoCung(dsLaSo[0]), namXem: 2026, thangXem: 8 };
  const nd = (noiDung: string) => ({ vaiTro: 'nguoi-dung' as const, noiDung });
  const tl = (noiDung: string) => ({ vaiTro: 'tro-ly' as const, noiDung });
  const CA_KE_THUA: { truoc: string; chip: string; chuDe: string; cung?: string; nam?: number; thang?: number; keThua: boolean }[] = [
    // Ca eval 5, 6
    { truoc: 'Năm nay chuyện tình cảm của tôi thế nào?', chip: 'Sang năm Đinh Mùi thì sao?', chuDe: 'tinh-cam', cung: 'Phu Thê', nam: 2027, keThua: true },
    { truoc: 'Công việc của tôi năm nay ra sao?', chip: 'Sang năm Đinh Mùi thì sao?', chuDe: 'su-nghiep', cung: 'Quan Lộc', nam: 2027, keThua: true },
    // Năm trần: thời gian phải lấy từ câu gốc
    { truoc: 'Năm nay chuyện tình cảm của tôi thế nào?', chip: '2027 thì sao?', chuDe: 'tinh-cam', cung: 'Phu Thê', nam: 2027, keThua: true },
    { truoc: 'Công việc của tôi năm nay ra sao?', chip: 'Tháng tới thì sao?', chuDe: 'su-nghiep', cung: 'Quan Lộc', thang: 9, keThua: true },
    { truoc: 'Tôi đang phân vân nghỉ việc hay ở lại', chip: 'Ở lại thì sao?', chuDe: 'su-nghiep', cung: 'Quan Lộc', keThua: true },
    // Câu mới tự có chủ đề: tin câu mới
    { truoc: 'Năm nay chuyện tình cảm của tôi thế nào?', chip: 'Còn tiền bạc thì sao?', chuDe: 'tai-chinh', keThua: false },
    // Người được hỏi đi theo nguồn
    { truoc: 'Con tôi năm nay học hành thế nào?', chip: 'Sang năm Đinh Mùi thì sao?', chuDe: '*', cung: 'Tử Tức', nam: 2027, keThua: true },
    { truoc: 'Anh tôi có giàu không?', chip: 'Tôi với anh tôi có hợp nhau không?', chuDe: '*', cung: 'Huynh Đệ', keThua: false },
  ];
  for (const ca of CA_KE_THUA) {
    const kq = lapKeHoachFocused({
      ...vao,
      cauHoi: ca.chip,
      laTiepTuChip: true,
      lichSu: [nd(ca.truoc), tl('...'), nd(ca.chip)],
    });
    const ten = `"${ca.truoc}" → "${ca.chip}"`;
    kiem(!!kq.keThuaTu === ca.keThua, `${ten}: kế thừa ${!!kq.keThuaTu}, cần ${ca.keThua}`);
    if (ca.chuDe !== '*') kiem(kq.keHoach.chuDe === ca.chuDe, `${ten}: chủ đề ${kq.keHoach.chuDe}, cần ${ca.chuDe}`);
    if (ca.cung) kiem(kq.keHoach.cungLienQuan[0] === ca.cung, `${ten}: cung đầu ${kq.keHoach.cungLienQuan[0]}, cần ${ca.cung}`);
    if (ca.nam) kiem(kq.keHoach.namMucTieu === ca.nam, `${ten}: năm ${kq.keHoach.namMucTieu}, cần ${ca.nam}`);
    if (ca.thang) kiem(kq.keHoach.thangMucTieu === ca.thang, `${ten}: tháng ${kq.keHoach.thangMucTieu}, cần ${ca.thang}`);
  }
  // Câu dài không có chủ đề, không phải chip: không kế thừa.
  const dai = lapKeHoachFocused({
    ...vao,
    cauHoi: 'Nhìn chung mấy năm tới cuộc đời tôi sẽ đi theo hướng nào nhỉ?',
    lichSu: [nd('Công việc của tôi năm nay ra sao?')],
  });
  kiem(!dai.keThuaTu, 'câu dài tự đứng không được kế thừa chủ đề cũ');
  // Không lịch sử: không kế thừa, không vỡ.
  kiem(!lapKeHoachFocused({ ...vao, cauHoi: 'Sang năm thì sao?', laTiepTuChip: true }).keThuaTu, 'không lịch sử mà vẫn kế thừa');
}

/* ------------------------------------------------------------ phân khuôn */

{
  const vao = { saoTheoCung: saoChinhTheoCung(dsLaSo[0]), namXem: 2026, thangXem: 8 };
  const CA_KHUON: [string, string][] = [
    ['Năm nay tôi có người yêu không?', 'A'],
    ['Có chuyển việc hay không?', 'A'],
    ['Khi nào tôi lấy chồng?', 'D'],
    ['Tháng nào tôi nên khai trương?', 'D'],
    ['Tôi nên nghỉ việc hay ở lại?', 'E'],
    ['Nên mua nhà hay thuê nhà thì tốt hơn?', 'E'],
    ['Bố tôi năm nay sức khỏe thế nào?', 'F2'],
    ['Tôi với bố tôi có hợp nhau không?', 'F1'],
    ['Tính cách của tôi thế nào?', 'G'],
  ];
  for (const [cau, khuon] of CA_KHUON) {
    const kq = lapKeHoachFocused({ ...vao, cauHoi: cau });
    const pl = phanKhuon({ cauHoi: cau, keHoach: kq.keHoach, doiTuong: kq.doiTuong });
    kiem(pl.khuon === khuon, `"${cau}" ra khuôn ${pl.khuon}, cần ${khuon}`);
  }
  kiem(laXinSau('Phân tích kỹ giúp tôi'), '"Phân tích kỹ" phải là DEEP');
  kiem(!laXinSau('Tôi là kỹ sư, năm nay thế nào?'), '"kỹ sư" không được thành DEEP');
}

/* --------------------------------------------- câu do mã: chip đi đúng đường */

{
  const vao = { saoTheoCung: saoChinhTheoCung(dsLaSo[0]), namXem: 2026, thangXem: 8 };
  const nd = (noiDung: string) => ({ vaiTro: 'nguoi-dung' as const, noiDung });
  const bayGio = { nam: 2026, thang: 8, ngay: 10 };

  // F2 → chip quan hệ → F1, đúng cung lục thân, không đọc cung tiền của người hỏi.
  for (const [cau, cung, coLoi] of [
    ['Anh tôi có giàu không?', 'Huynh Đệ', false],
    ['Bố tôi năm nay sức khỏe thế nào?', 'Phụ Mẫu', false],
    ['Chồng tôi có thăng chức không?', 'Phu Thê', true],
  ] as const) {
    const dt = nhanDangDoiTuong(cau);
    if (!dt || dt.loai !== 'van-rieng') {
      hong.push(`"${cau}" phải là vận riêng`);
      continue;
    }
    const cm = cauVanRieng(dt);
    kiem(!cm.goiModel, `F2 "${cau}" không được gọi model`);
    kiem(cm.loiDi.length > 0 === coLoi, `F2 "${cau}" lối sang hai lá số sai`);
    const kq = lapKeHoachFocused({ ...vao, cauHoi: cm.chip[0], laTiepTuChip: true, lichSu: [nd(cau)] });
    const pl = phanKhuon({ cauHoi: cm.chip[0], keHoach: kq.keHoach, doiTuong: kq.doiTuong });
    kiem(pl.khuon === 'F1', `chip "${cm.chip[0]}" ra khuôn ${pl.khuon}, cần F1`);
    kiem(kq.keHoach.cungLienQuan[0] === cung, `chip "${cm.chip[0]}" cung đầu ${kq.keHoach.cungLienQuan[0]}, cần ${cung}`);
    kiem(!kq.keHoach.cungLienQuan.includes('Tài Bạch'), `chip "${cm.chip[0]}" còn Tài Bạch`);
  }

  // E: chip hai vế giữ chủ đề của câu gốc.
  const cauE = 'Tôi nên nghỉ việc hay ở lại?';
  const hv = tachHaiVe(cauE);
  if (!hv) hong.push(`"${cauE}" phải tách được hai vế`);
  else {
    for (const chip of cauHaiVe(hv).chip) {
      const kq = lapKeHoachFocused({ ...vao, cauHoi: chip, laTiepTuChip: true, lichSu: [nd(cauE)] });
      kiem(kq.keHoach.chuDe === 'su-nghiep', `chip E "${chip}" ra ${kq.keHoach.chuDe}, cần su-nghiep`);
    }
  }

  // D: chip năm giữ chủ đề, không còn chip "tháng nào".
  const cauD = 'Khi nào tôi lấy chồng?';
  const d = cauKhiNao();
  kiem(!d.chip.some((c) => /tháng nào/i.test(c)), 'D còn chip "tháng nào" (quyết định #5)');
  for (const chip of d.chip) {
    const kq = lapKeHoachFocused({ ...vao, cauHoi: chip, laTiepTuChip: true, lichSu: [nd(cauD)] });
    kiem(kq.keHoach.chuDe === 'tinh-cam', `chip D "${chip}" ra ${kq.keHoach.chuDe}, cần tinh-cam`);
  }

  // Tháng nhuận: hai chip phân giải được, không hỏi lại lần hai. 2025 có tháng 6 nhuận.
  for (const [nam, thang] of [[2025, 6], [2023, 2]] as const) {
    const cauGoc = `Tháng ${thang} năm ${nam} công việc của tôi thế nào?`;
    const kh = lapKeHoachFocused({ ...vao, cauHoi: cauGoc }).keHoach;
    const bc = boiCanhThoiGian({ cauHoi: cauGoc, keHoach: kh, namXem: 2026, bayGio });
    if (bc.thang?.nhuan !== 'can-hoi') {
      hong.push(`"${cauGoc}" phải hỏi lại nhuận, ra ${bc.thang?.nhuan}`);
      continue;
    }
    const hoi = cauHoiNhuan(bc.thang, 2026);
    kiem(!hoi.goiModel, 'hỏi lại nhuận không được gọi model');
    const can = ['thuong', 'nhuan'];
    hoi.chip.forEach((chip, i) => {
      const k = lapKeHoachFocused({ ...vao, cauHoi: chip, laTiepTuChip: true, lichSu: [nd(cauGoc)] }).keHoach;
      const b = boiCanhThoiGian({ cauHoi: chip, keHoach: k, namXem: 2026, bayGio });
      kiem(b.thang?.nhuan === can[i], `chip "${chip}" ra ${b.thang?.nhuan}, cần ${can[i]}`);
      kiem(b.namHieuLuc === nam, `chip "${chip}" đọc năm ${b.namHieuLuc}, cần ${nam}`);
      kiem(k.chuDe === 'su-nghiep', `chip "${chip}" mất chủ đề: ${k.chuDe}`);
    });
  }

  // N2 nêu đúng tháng, năm; N4 chip sang năm đứng đầu, không trùng.
  const n2 = cauThangDaQua({ nam: 2026, thang: 3, trangThai: 'da-qua', nhuan: null });
  kiem(n2.startsWith('Bạn đang hỏi tháng 3 âm lịch năm 2026.'), `N2 sai: ${n2}`);
  const n4 = chipCuoiNam(2026, ['Sang năm Đinh Mùi thì sao?', 'Còn tiền bạc thì sao?']);
  kiem(n4[0] === 'Sang năm Đinh Mùi thì sao?' && n4.length === 2, `N4 chip sai: ${n4.join(' | ')}`);
}

/* ------------------------------------------------------------------- kết */

if (hong.length) {
  console.log(`HỎNG ${hong.length}:`);
  for (const l of hong.slice(0, 40)) console.log(`  - ${l}`);
  process.exit(1);
}
console.log(`Tất cả đạt. ${dsLaSo.length} lá số × ${CAU_CO.length} câu; lưu tinh ${soLuuTinh}, cân bằng ${soCanBang}.`);
