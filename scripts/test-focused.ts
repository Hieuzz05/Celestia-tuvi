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

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { lapLaSo, type LaSo } from '../lib/tuvi/ansao';
import { PHUONG_PHAP } from '../lib/tuvi/phuong-phap';
import { chonBoiCanh, saoChinhTheoCung } from '../lib/rag/boi-canh-la-so';
import { tinhNghiengVe, khoiNghiengVe } from '../lib/rag/nghieng-ve';
import { lapKeHoach, PHIEN_BAN_PLANNER } from '../lib/rag/planner';
import { PHIEN_BAN_CHU } from '../lib/rag/phien-ban-chu';
import { CHUAN_NGON_NGU_CELES } from '../lib/rag/chuan-ngon-ngu';
import { VAN_PHONG_CELES_CHAT } from '../lib/rag/van-phong';
import { CHU_TRUU_TUONG } from '../lib/rag/chu-truu-tuong';
import { PHIEN_BAN_NGON_NGU } from '../lib/rag/ngon-ngu';
import { PHIEN_BAN_VALIDATOR } from '../lib/rag/kiem-duyet';
import { nhanDangDoiTuong, ghepKeHoach, cauGhep } from '../lib/rag/focused/doi-tuong';
import { coThangNhuan, khoangDuong, soVoiBayGio, laCuoiNamAm, ngayCuoiThangAm, ngayCuoiNamAm, cuaSoAmCuaThangDuong, cuaSoCuaThangAm, trangThaiThangDuong } from '../lib/rag/focused/thang-am';
import { chanChuaHopTuoi, chanTruocSinh, tuoiAmTai, TUOI_NGUOI_LON } from '../lib/rag/focused/gioi-han';
import { lapKeHoachChinh, lapKeHoachFocused } from '../lib/rag/focused/ke-thua';
import { phanKhuon, laXinSau, tachHaiVe, boiCanhThoiGian, laHoiKhiNao, thangTiengAnh } from '../lib/rag/focused/phan-loai';
import {
  cauVanRieng,
  chipLaSoCuaNguoiDuocHoi,
  chipQuanHe,
  hoiLaiVanRieng,
  chipHaiVe,
  cauNhuanChuaTach,
  chipCuoiNam,
} from '../lib/rag/focused/cau-ma';
import { CAU_NGOAI_TAM, CAU_NGOAI_TAM_EN } from '../lib/rag/focused/ngoai-tam';
import {
  CHIP_DU_PHONG,
  MIEN_TRU_TAM_LY_EN,
  chonNgonNgu,
  datMienTruTheoNgonNgu,
  loiDiTheoNgonNgu,
} from '../lib/rag/focused/ngon-ngu';
import { datMienTruTamLy } from '../lib/rag/an-toan';
import { loiDiTiep } from '../lib/rag/hinh-dang-tra-loi';
import { goiCoPhucDuc, khoaTen, quetTen, tapTenTuGoi, tenNgoaiTap, tenCungTrongCau } from '../lib/rag/focused/quet-ten';
import type { ThangDangHoi } from '../lib/rag/focused/phan-loai';

/** Tháng đang hỏi dựng từ hàm thật (spec v2 §3.1–3.2), cho các test cần một ThangDangHoi. */
const HOM_NAY_TEST = new Date(Date.UTC(2026, 9, 4));
function thangDuongTest(nam: number, thang: number): ThangDangHoi {
  return {
    muc: { loai: 'thang-duong', nam, thang },
    trangThai: trangThaiThangDuong(nam, thang, HOM_NAY_TEST),
    cuaSo: cuaSoAmCuaThangDuong(nam, thang, HOM_NAY_TEST),
  };
}
function thangAmTest(namAm: number, thangAm: number, nhuan = false): ThangDangHoi {
  const cuaSo = cuaSoCuaThangAm(namAm, thangAm, nhuan, HOM_NAY_TEST);
  return { muc: { loai: 'thang-am', namAm, thangAm, nhuan }, trangThai: cuaSo[0]?.trangThai ?? 'da-qua', cuaSo };
}
import { kiemBaTang, kiemCung, chonChip, soAmTiet, tinhMocHopLe, MOC_NHO_HON_NAM, type NguCanhKiem } from '../lib/rag/focused/kiem';
import { CLAIM_TOI_DA, docBanNhap, type BanNhap } from '../lib/rag/focused/hop-dong';
import { tenModelThay, tenNgoaiModelThay, tenTrongChu } from './oracle-ten-prompt';
import { dungPromptFocused, khoiNghiengFocused, khoiMoc, lopCoTrongGoi, tenDuocGoiTrongLuot } from '../lib/rag/focused/prompt';
import { chayFocused } from '../lib/rag/focused/chay';
import { dungGoiBangChung } from '../lib/rag/bang-chung';
import { type KetQuaFocused, focusedBat, themLopChoThang, traLoiFocused, tuoiTrongGoi } from '../lib/rag/focused/tra-loi-focused';
import { phienBanHienTai, traLoiCoCanCu } from '../lib/rag/tra-loi';
import { ghiVetPreview } from '../lib/rag/focused/vet';
import { nhomCuaHuong } from '../lib/rag/focused/chot-huong';
import type { NghiengVe } from '../lib/rag/nghieng-ve';
import type { DuKienLaSo } from '../lib/rag/boi-canh-la-so';

const hong: string[] = [];
const kiem = (dk: boolean, loi: string) => {
  if (!dk) hong.push(loi);
};
/** Câu EN còn chữ Việt (ngoài tên sao được phép giữ nguyên) là lộ câu Việt cho người dùng EN. */
const conChuViet = (s: string, tenGiu: string[] = []) =>
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/iu.test(
    tenGiu.reduce((x, t) => x.split(t).join(''), s)
  );

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
/** Mốc hợp lệ của một lượt "năm nay" 2026, không tháng — cho ngữ cảnh kiểm dựng tay. */
const MOC_2026 = (() => {
  const m = tinhMocHopLe({ cauHoi: '', thoiGian: { namHieuLuc: 2026, thang: null, cuoiNam: false }, namSinh: [], vanGoi: [] });
  return { mocHopLeAnswer: m.answer, mocHopLeChip: m.chip };
})();
/** Mã lỗi `kiemCung` của MỘT câu đặt làm `answer`, claim đúng hướng dẫn mã đầu tiên của gói. */
const maCau = (cau: string, x: NguCanhKiem) =>
  kiemCung(
    {
      answer: cau,
      claims: [{ claim: 'x', evidenceIds: [...x.maHopLe].slice(0, 1), direction: x.nghieng ? nhomCuaHuong(x.nghieng.huong) : undefined }],
      suggestedQuestions: [],
    },
    x
  ).map((l) => l.ma);
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
  // Chuyện riêng của người kia (bệnh, nghề) dù có "tôi" vẫn là vận riêng; tình cảm với tôi là quan hệ.
  { cau: 'Mẹ tôi bao giờ đỡ bệnh?', cung: 'Phụ Mẫu', loai: 'van-rieng' },
  { cau: 'Chồng tôi có thương tôi không?', cung: 'Phu Thê', loai: 'quan-he' },
  { cau: 'Sếp tôi có cất nhắc tôi không?', cung: 'Phụ Mẫu', loai: 'quan-he' },
  { cau: 'Chồng tôi có được cất nhắc không?', cung: 'Phu Thê', loai: 'van-rieng' },
  { cau: 'Chồng em có giúp em kiếm tiền không?', cung: 'Phu Thê', loai: 'quan-he' },
  // Âm tính: đại từ xưng, "bản thân", người chung chung — là chính người hỏi.
  { cau: 'Bản thân tôi năm nay thế nào?', cung: null },
  { cau: 'ban than toi nam nay the nao', cung: null },
  { cau: 'Con năm nay có lấy được chồng không ạ?', cung: null },
  { cau: 'Con nghĩ công việc của con năm nay sao ạ?', cung: null },
  { cau: 'Em có người yêu không?', cung: null },
  { cau: 'Tôi có nên chuyển việc không?', cung: null },
  { cau: 'Năm nay tôi có con không?', cung: null },
  { cau: 'Anh ấy có thật lòng không?', cung: null },
  // "vợ / chồng" đứng sau từ chỉ họ hàng là người khác, không phải bạn đời.
  { cau: 'Mẹ chồng tôi năm nay sức khỏe thế nào?', cung: null },
  { cau: 'Bố vợ tôi có khó tính không?', cung: null },
  { cau: 'me chong toi nam nay the nao', cung: null },
  { cau: 'Con chồng tôi có ngoan không?', cung: null },
  { cau: 'Bạn chồng tôi có tốt không?', cung: null },
  // "tôi với <người>": chỉ người ruột, bỏ "anh / em" trần và "mẹ chồng".
  { cau: 'Tôi với mẹ chồng có hợp không?', cung: null },
  { cau: 'Tôi với anh ấy có hợp không?', cung: null },
  { cau: 'Tôi với bố mẹ chồng có hợp không?', cung: null },
  { cau: 'Tôi với con người đó có hợp không?', cung: null },
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
    // Không có định danh sở hữu vẫn là quan hệ hai người (eval 03/10: từng ra A).
    ['Tôi với bố có hợp nhau không?', 'F1'],
    ['Tôi và mẹ năm nay có hợp không?', 'F1'],
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

  // F2 hỏi lại (04/10): chip 2 → F1 đúng cung lục thân; chip 1 = câu gốc trên chủ lá số,
  // MỘT chạm trả lời được câu gốc — giữ chủ đề, không ra F2 lần nữa.
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
    const cm = hoiLaiVanRieng(cau, dt);
    kiem(!cm.goiModel, `F2 "${cau}" không được gọi model`);
    kiem(cm.loiDi.length > 0 === coLoi, `F2 "${cau}" lối sang hai lá số sai`);
    kiem(cm.chip.length === 2, `F2 "${cau}" cần hai chip: ${cm.chip.join(' | ')}`);
    const quanHe = cm.chip[1];
    const kq = lapKeHoachFocused({ ...vao, cauHoi: quanHe, laTiepTuChip: true, lichSu: [nd(cau)] });
    const pl = phanKhuon({ cauHoi: quanHe, keHoach: kq.keHoach, doiTuong: kq.doiTuong });
    kiem(pl.khuon === 'F1', `chip "${quanHe}" ra khuôn ${pl.khuon}, cần F1`);
    kiem(kq.keHoach.cungLienQuan[0] === cung, `chip "${quanHe}" cung đầu ${kq.keHoach.cungLienQuan[0]}, cần ${cung}`);
    kiem(!kq.keHoach.cungLienQuan.includes('Tài Bạch'), `chip "${quanHe}" còn Tài Bạch`);
  }
  // Câu F2 nguyên văn duyệt 04/10: "luận", không "đoán", không khẳng định lá số là của ai.
  kiem(/luận vận riêng/u.test(cauVanRieng()) && !/đoán|là của bạn,/u.test(cauVanRieng()), `F2 câu sai: ${cauVanRieng()}`);
  kiem(!/[À-ỹ]/u.test(cauVanRieng('en').replace(/’/g, '')), 'F2 EN lẫn chữ Việt');
  for (const [cau, chipCan, chuDe] of [
    ['Mẹ tôi năm nay sức khỏe thế nào?', 'Người có lá số này năm nay sức khỏe thế nào?', 'suc-khoe'],
    ['Năm nay con gái tôi học hành ra sao?', 'Năm nay người có lá số này học hành ra sao?', 'su-nghiep'],
    ['Bố của tôi có giàu không?', 'Người có lá số này có giàu không?', 'tai-chinh'],
    ['mẹ mình năm nay sức khỏe thế nào', 'Người có lá số này năm nay sức khỏe thế nào', 'suc-khoe'],
  ] as const) {
    const dt = nhanDangDoiTuong(cau);
    if (!dt || dt.loai !== 'van-rieng') {
      hong.push(`"${cau}" phải là vận riêng`);
      continue;
    }
    const chip = chipLaSoCuaNguoiDuocHoi(cau, dt);
    kiem(chip === chipCan, `F2 chip câu gốc "${cau}" ra "${chip}", cần "${chipCan}"`);
    if (!chip) continue;
    kiem(hoiLaiVanRieng(cau, dt).chip[0] === chip, `F2 "${cau}" chip đầu không phải câu gốc`);
    // Một chạm: không còn người được hỏi → không F2 lần hai, chủ đề là chủ đề câu gốc hỏi.
    const kq = lapKeHoachFocused({ ...vao, cauHoi: chip, laTiepTuChip: true, lichSu: [nd(cau)] });
    const pl = phanKhuon({ cauHoi: chip, keHoach: kq.keHoach, doiTuong: kq.doiTuong });
    kiem(pl.khuon !== 'F2' && !kq.doiTuong, `chip "${chip}" vẫn ra F2 — vòng hỏi lại`);
    kiem(kq.keHoach.chuDe === chuDe, `chip "${chip}" ra ${kq.keHoach.chuDe}, cần ${chuDe}`);
  }

  // E: chip hai vế giữ chủ đề của câu gốc.
  const cauE = 'Tôi nên nghỉ việc hay ở lại?';
  const hv = tachHaiVe(cauE);
  if (!hv) hong.push(`"${cauE}" phải tách được hai vế`);
  else {
    for (const chip of chipHaiVe(hv)) {
      const kq = lapKeHoachFocused({ ...vao, cauHoi: chip, laTiepTuChip: true, lichSu: [nd(cauE)] });
      kiem(kq.keHoach.chuDe === 'su-nghiep', `chip E "${chip}" ra ${kq.keHoach.chuDe}, cần su-nghiep`);
    }
  }

  // D (đi qua model từ 04/10): chip năm sau giữ chủ đề của câu "khi nào".
  const cauD = 'Khi nào tôi lấy chồng?';
  for (const chip of chipCuoiNam(2026, [])) {
    const kq = lapKeHoachFocused({ ...vao, cauHoi: chip, laTiepTuChip: true, lichSu: [nd(cauD)] });
    kiem(kq.keHoach.chuDe === 'tinh-cam', `chip D "${chip}" ra ${kq.keHoach.chuDe}, cần tinh-cam`);
  }

  // N3 hai bước: câu gốc → chip "Sang năm" → chip "Tháng này". Lịch sử là đúng thứ
  // client gửi (câu chip là lượt người dùng, xen câu trả lời của Celes). Chủ đề phải
  // giữ qua CẢ HAI chip, và trục thời gian là của chip đang bấm.
  const tl = (noiDung: string) => ({ vaiTro: 'tro-ly' as const, noiDung });
  for (const [cauGoc, chuDe, cung] of [
    ['Tình cảm sắp tới?', 'tinh-cam', 'Phu Thê'],
    ['Công việc sắp tới?', 'su-nghiep', 'Quan Lộc'],
  ] as const) {
    const chip1 = 'Sang năm thì sao?';
    const chip2 = 'Tháng này thì sao?';
    const b1 = lapKeHoachFocused({ ...vao, cauHoi: chip1, laTiepTuChip: true, lichSu: [nd(cauGoc), tl('Năm nay khá thuận.')] }).keHoach;
    kiem(b1.chuDe === chuDe && b1.cungLienQuan[0] === cung, `N3 bước 1 "${cauGoc}" → ${b1.chuDe}/${b1.cungLienQuan[0]}`);
    kiem(b1.namMucTieu === 2027, `N3 bước 1 "${cauGoc}" năm ${b1.namMucTieu}, cần 2027`);
    const lich2 = [nd(cauGoc), tl('Năm nay khá thuận.'), nd(chip1), tl('Sang năm có phần vướng hơn.')];
    const b2 = lapKeHoachFocused({ ...vao, cauHoi: chip2, laTiepTuChip: true, lichSu: lich2 }).keHoach;
    kiem(b2.chuDe === chuDe && b2.cungLienQuan[0] === cung, `N3 hai bước "${cauGoc}" mất chủ đề: ${b2.chuDe}/${b2.cungLienQuan[0]}`);
    kiem(b2.namMucTieu !== 2027, `N3 bước 2 "${cauGoc}" vẫn giữ năm của chip trước: ${b2.namMucTieu}`);
    // Route có thể nhét câu đang hỏi vào cuối lịch sử — vẫn phải ra như trên.
    const b2b = lapKeHoachFocused({ ...vao, cauHoi: chip2, laTiepTuChip: true, lichSu: [...lich2, nd(chip2)] }).keHoach;
    kiem(b2b.chuDe === chuDe, `N3 hai bước (lịch sử có câu đang hỏi) "${cauGoc}" ra ${b2b.chuDe}`);
  }

  // Cửa sổ âm của tháng dương (spec v2 §3.2): mọi tháng âm chồng lên, theo thứ tự, phủ kín tháng.
  {
    const ngay = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
    const tom = (ws: ReturnType<typeof cuaSoAmCuaThangDuong>) =>
      ws.map((w) => `${w.ma}:${w.namAm}/${w.thangAm}${w.nhuan ? 'n' : ''}:${w.tuNgay.slice(5)}..${w.denNgay.slice(5)}:${w.soNgay}:${w.trangThai}`).join(' ');
    const w10 = cuaSoAmCuaThangDuong(2026, 10, ngay(2026, 10, 4));
    kiem(
      tom(w10) === 'W1:2026/8:10-01..10-09:9:dang W2:2026/9:10-10..10-31:22:toi',
      `cửa sổ 10/2026 sai: ${tom(w10)}`
    );
    const w2 = cuaSoAmCuaThangDuong(2026, 2, ngay(2026, 10, 4));
    kiem(
      tom(w2) === 'W1:2025/12:02-01..02-16:16:da-qua W2:2026/1:02-17..02-28:12:da-qua',
      `cửa sổ 2/2026 (qua Tết) sai: ${tom(w2)}`
    );
    const w7 = cuaSoAmCuaThangDuong(2025, 7, ngay(2026, 10, 4));
    kiem(
      w7.length === 2 && !w7[0].nhuan && w7[0].thangAm === 6 && w7[1].nhuan && w7[1].thangAm === 6,
      `cửa sổ 7/2025 (nhuận) sai: ${tom(w7)}`
    );
    // Có tháng dương nằm trọn trong một tháng âm (mồng 1 âm rơi đúng ngày 1 dương): một cửa sổ phủ đủ tháng.
    let mot: ReturnType<typeof cuaSoAmCuaThangDuong> | null = null;
    for (let y = 2020; y <= 2035 && !mot; y++)
      for (let m = 1; m <= 12 && !mot; m++) {
        const ws = cuaSoAmCuaThangDuong(y, m, ngay(2026, 10, 4));
        if (ws.length === 1) mot = ws;
      }
    kiem(!!mot && mot[0].tuNgay.endsWith('-01') && mot[0].soNgay >= 28, `không có tháng một cửa sổ: ${mot && tom(mot)}`);
    // Mọi tháng 2020–2035: các cửa sổ liền nhau, cộng đủ số ngày.
    for (let y = 2020; y <= 2035; y++)
      for (let m = 1; m <= 12; m++) {
        const ws = cuaSoAmCuaThangDuong(y, m);
        const tong = ws.reduce((a, w) => a + w.soNgay, 0);
        if (tong !== new Date(Date.UTC(y, m, 0)).getUTCDate() || ws.length > 3)
          hong.push(`cửa sổ ${m}/${y} không phủ kín: ${tom(ws)}`);
      }
    const am9 = cuaSoCuaThangAm(2026, 9, false, ngay(2026, 10, 4));
    kiem(am9.length === 1 && am9[0].tuNgay === '2026-10-10' && am9[0].trangThai === 'toi', `cửa sổ tháng 9 âm 2026 sai: ${tom(am9)}`);
    kiem(cuaSoCuaThangAm(2026, 6, true).length === 0, 'tháng 6 nhuận 2026 không có mà vẫn ra cửa sổ');
    kiem(
      trangThaiThangDuong(2026, 10, ngay(2026, 10, 4)) === 'dang' &&
        trangThaiThangDuong(2026, 9, ngay(2026, 10, 4)) === 'da-qua' &&
        trangThaiThangDuong(2027, 1, ngay(2026, 10, 4)) === 'toi',
      'trạng thái tháng dương sai'
    );
  }

  // Tên tháng tiếng Anh (§3.1): "may" viết thường / "May I…" đầu câu không phải tháng 5.
  for (const [cau, can] of [
    ['Will I find a job this October?', '2026/10'],
    ['How is my work in Oct?', '2026/10'],
    ['What about October 2027?', '2027/10'],
    ['Will next March be good for money?', '2027/3'],
    ['Will I get a job in May?', '2026/5'],
    ['How does my career look in May 2027?', '2027/5'],
    ['May I ask about my career?', '-'],
    ['may I find a job soon?', '-'],
    ['I may change jobs, is that wise?', '-'],
  ] as const) {
    const r = thangTiengAnh(cau, 2026);
    const ra = r ? `${r.nam}/${r.thang}` : '-';
    kiem(ra === can, `tháng tiếng Anh "${cau}" ra ${ra}, cần ${can}`);
  }

  // Mục tiêu thời gian của lượt (§3.1). bayGio = 10/8 âm 2026 (20/9/2026 dương).
  for (const [cauHoi, can] of [
    ['Tháng 6 năm 2025 công việc của tôi thế nào?', 'thang-duong 2025/6 | 2025/5 2025/6 | 2025'],
    ['Tháng 8 năm 2025 công việc của tôi thế nào?', 'thang-duong 2025/8 | 2025/6n 2025/7 | 2025'],
    ['Tháng 6 âm năm 2025 công việc của tôi thế nào?', 'thang-am 2025/6 | 2025/6 | 2025'],
    ['Tháng 6 âm lịch năm 2025 công việc của tôi thế nào?', 'thang-am 2025/6 | 2025/6 | 2025'],
    ['Tháng 6 nhuận năm 2025 công việc của tôi thế nào?', 'thang-am 2025/6n | 2025/6n | 2025'],
    ['Tháng 1 năm 2026 công việc của tôi thế nào?', 'thang-duong 2026/1 | 2025/11 2025/12 | 2025'],
    ['Tháng 11 công việc của tôi thế nào?', 'thang-duong 2026/11 | 2026/9 2026/10 | 2026'],
    ['Tháng 7/2025 công việc của tôi thế nào?', 'thang-duong 2025/7 | 2025/6 2025/6n | 2025'],
    ['Tháng này công việc của tôi thế nào?', 'thang-duong 2026/9 | 2026/7 2026/8 | 2026'],
    ['Tháng tới công việc của tôi thế nào?', 'thang-duong 2026/10 | 2026/8 2026/9 | 2026'],
  ] as const) {
    const kh = lapKeHoachFocused({ ...vao, cauHoi }).keHoach;
    const bc = boiCanhThoiGian({ cauHoi, keHoach: kh, namXem: 2026, bayGio });
    const t = bc.thang;
    const ra = t
      ? `${t.muc.loai} ${t.muc.loai === 'thang-duong' ? `${t.muc.nam}/${t.muc.thang}` : `${t.muc.namAm}/${t.muc.thangAm}${t.muc.nhuan ? 'n' : ''}`} | ${t.cuaSo
          .map((w) => `${w.namAm}/${w.thangAm}${w.nhuan ? 'n' : ''}`)
          .join(' ')} | ${bc.namHieuLuc}`
      : `không tháng | ${bc.namHieuLuc}`;
    kiem(ra === can, `"${cauHoi}" ra "${ra}", cần "${can}"`);
  }
  // Tiếng Anh: planner không bắt tháng, boiCanhThoiGian vẫn ra tháng dương.
  {
    const cauHoi = 'Will I find a job this October?';
    const kh = lapKeHoachFocused({ ...vao, cauHoi }).keHoach;
    const bc = boiCanhThoiGian({ cauHoi, keHoach: kh, namXem: 2026, bayGio });
    kiem(bc.thang?.muc.loai === 'thang-duong' && bc.thang.muc.thang === 10 && bc.thang.cuaSo.length === 2, `"${cauHoi}" không ra tháng 10 dương`);
    const kh2 = lapKeHoachFocused({ ...vao, cauHoi: 'May I ask how my career looks?' }).keHoach;
    kiem(!boiCanhThoiGian({ cauHoi: 'May I ask how my career looks?', keHoach: kh2, namXem: 2026, bayGio }).thang, '"May I ask…" bị hiểu là tháng 5');
  }
  // Nhuận mà năm không có → tháng thường + cờ khongCoNhuan.
  {
    const cauHoi = 'Tháng 6 nhuận năm 2026 công việc của tôi thế nào?';
    const kh = lapKeHoachFocused({ ...vao, cauHoi }).keHoach;
    const bc = boiCanhThoiGian({ cauHoi, keHoach: kh, namXem: 2026, bayGio });
    kiem(
      bc.thang?.muc.loai === 'thang-am' && !bc.thang.muc.nhuan && bc.thang.khongCoNhuan === true && bc.thang.cuaSo.length === 1,
      `"${cauHoi}" phải đọc tháng 6 thường + khongCoNhuan: ${JSON.stringify(bc.thang)}`
    );
  }
  // Câu nhuận: chọn "nhuận" → câu duyệt + chip tháng âm thường; chip đọc lại đúng tháng âm thường, giữ chủ đề.
  {
    const goc = 'Tháng 6 nhuận năm 2025 công việc của tôi thế nào?';
    const kh = lapKeHoachFocused({ ...vao, cauHoi: goc }).keHoach;
    const bc = boiCanhThoiGian({ cauHoi: goc, keHoach: kh, namXem: 2026, bayGio });
    const r = cauNhuanChuaTach(bc.thang!, 2026);
    kiem(!r.goiModel && r.chip.length === 1 && r.chip[0] === 'Tháng 6 âm năm 2025', `chip nhuận sai: ${r.chip.join(' | ')}`);
    const k = lapKeHoachFocused({ ...vao, cauHoi: r.chip[0], laTiepTuChip: true, lichSu: [nd(goc)] }).keHoach;
    const b = boiCanhThoiGian({ cauHoi: r.chip[0], keHoach: k, namXem: 2026, bayGio });
    kiem(
      b.thang?.muc.loai === 'thang-am' && !b.thang.muc.nhuan && b.thang.muc.thangAm === 6 && b.namHieuLuc === 2025,
      `chip "${r.chip[0]}" ra ${JSON.stringify(b.thang?.muc)}`
    );
    kiem(k.chuDe === 'su-nghiep', `chip "${r.chip[0]}" mất chủ đề: ${k.chuDe}`);
  }
  // Tháng dương có phần rơi vào tháng nhuận: nói rõ quãng ngày, không chip, không "hai tháng" / "tách".
  {
    const cauHoi = 'Tháng 8 năm 2025 công việc của tôi thế nào?';
    const kh = lapKeHoachFocused({ ...vao, cauHoi }).keHoach;
    const bc = boiCanhThoiGian({ cauHoi, keHoach: kh, namXem: 2026, bayGio });
    const r = cauNhuanChuaTach(bc.thang!, 2026);
    kiem(
      !r.goiModel && r.chip.length === 0 && r.cau.includes('quãng từ 1/8 đến 22/8 của tháng 8/2025 thuộc tháng 6 nhuận âm lịch') &&
        !/hai tháng|tách/u.test(r.cau),
      `câu nhuận từ tháng dương sai: ${r.cau}`
    );
    const en = cauNhuanChuaTach(bc.thang!, 2026, 'en').cau;
    kiem(!conChuViet(en), `câu nhuận tháng dương EN còn chữ Việt: ${en}`);
  }
  // Tháng 6 âm thầm, am hiểu: không phải âm lịch.
  for (const cauHoi of ['Tháng 6 âm thầm mình cố gắng, công việc năm 2025 thế nào?']) {
    const kh = lapKeHoachFocused({ ...vao, cauHoi }).keHoach;
    const bc = boiCanhThoiGian({ cauHoi, keHoach: kh, namXem: 2026, bayGio });
    kiem(!kh.thangMucTieu || bc.thang?.muc.loai === 'thang-duong', `"${cauHoi}" bị hiểu là tháng âm`);
  }
  // Một bộ đếm F### qua nhiều cửa sổ; lưu niên mỗi năm âm một lần; mã theo cửa sổ đúng năm.
  {
    const laSo = dsLaSo[0];
    const kh = { ...lapKeHoachFocused({ ...vao, cauHoi: 'Tháng 2 năm 2026 công việc của tôi thế nào?' }).keHoach };
    const khDu = { ...kh, lopHan: [...new Set([...kh.lopHan, 'dai-van', 'luu-nien', 'nguyet-han'] as const)] };
    const cuaSo = cuaSoAmCuaThangDuong(2026, 2);
    const bc = chonBoiCanh({ laSo, keHoach: khDu, namXem: cuaSo[0].namAm, thangXem: cuaSo[0].thangAm, focused: true, cuaSo });
    const ids = bc.duKien.map((d) => d.id);
    kiem(new Set(ids).size === ids.length && ids.every((id, i) => id === `F${String(i + 1).padStart(3, '0')}`), `F### không liền mạch: ${ids.join(',')}`);
    const ln = bc.duKien.filter((d) => d.loai === 'luu-nien');
    const nh = bc.duKien.filter((d) => d.loai === 'nguyet-han');
    kiem(ln.length === 2 && nh.length === 2, `qua Tết phải có 2 lưu niên + 2 nguyệt hạn: ${ln.length}/${nh.length}`);
    kiem(
      !!bc.maTheoCuaSo && bc.maTheoCuaSo.W1.includes(nh[0].id) && bc.maTheoCuaSo.W1.includes(ln[0].id) && bc.maTheoCuaSo.W2.includes(nh[1].id) && bc.maTheoCuaSo.W2.includes(ln[1].id),
      `maTheoCuaSo sai: ${JSON.stringify(bc.maTheoCuaSo)}`
    );
    kiem(/^Tháng 12 âm lịch năm Ất Tỵ \(1\/2–16\/2 dương lịch\): nguyệt hạn tại cung /u.test(nh[0].noiDung), `nhãn nguyệt hạn W1 sai: ${nh[0].noiDung}`);
    // Không truyền cửa sổ: không có maTheoCuaSo (A0 giữ nguyên ở test-boi-canh-dong-bang).
    kiem(!('maTheoCuaSo' in chonBoiCanh({ laSo, keHoach: khDu, namXem: 2026, thangXem: 8, focused: true })), 'không cửa sổ mà vẫn có maTheoCuaSo');
  }

  // N4 chip sang năm đứng đầu, không trùng.
  const n4 = chipCuoiNam(2026, ['Sang năm Đinh Mùi thì sao?', 'Còn tiền bạc thì sao?']);
  kiem(n4[0] === 'Sang năm Đinh Mùi thì sao?' && n4.length === 2, `N4 chip sai: ${n4.join(' | ')}`);
}

/* ------------------------------------------------------ quét tên (luật 1) */

{
  const ten = (c: string) => quetTen(c).map((t) => `${t.loai}:${t.ten}`);
  const co = (c: string, x: string) => kiem(ten(c).includes(x), `quét "${c}" thiếu ${x}: ${ten(c).join(', ')}`);
  const khong = (c: string, x: string) => kiem(!ten(c).some((t) => t.endsWith(`:${x}`)), `quét "${c}" bắt nhầm ${x}`);
  co('Năm nay Lưu Thiên Mã chạy qua phần này.', 'luu:Lưu Thiên Mã');
  khong('Năm nay Lưu Thiên Mã chạy qua phần này.', 'Thiên Mã');
  co('Có Lưu Hoá Kỵ ở đây.', 'luu-hoa:Lưu Hóa Kỵ');
  co('Có Triệt chắn ở đầu.', 'tuan-triet:Triệt');
  khong('Tuần tới bạn bận.', 'Tuần');
  khong('Xử lý triệt để chuyện này.', 'Triệt');
  khong('Bạn có thiên phú về nghề này.', 'Thiên Phủ');
  co('Hoả Linh đồng cung làm nóng nảy.', 'ghep:Hoả Linh');
  kiem(tenCungTrongCau('Phần Quan Lộc của bạn khá vững.').length === 1, 'không bắt tên cung Quan Lộc');
  kiem(tenCungTrongCau('Có Phúc Đức ở đây.', true).length === 0, 'Phúc Đức là sao (có trong gói) vẫn bị coi là cung');

  const duKien: DuKienLaSo[] = [
    { id: 'F001', loai: 'cung', noiDung: 'Quan Lộc có Tả Phù, Hữu Bật, Thiên Phủ.', cung: 'Quan Lộc', sao: ['Tả Phù', 'Hữu Bật', 'Thiên Phủ'] },
  ];
  const tap = tapTenTuGoi(duKien);
  kiem(tenNgoaiTap('Tả Hữu đứng cạnh nên có người đỡ.', tap).length === 0, 'Tả Hữu bị chặn dù đủ Tả Phù + Hữu Bật');
  kiem(tenNgoaiTap('Thất Sát làm bạn nóng vội.', tap).includes('Thất Sát'), 'Thất Sát ngoài gói không bị chặn');
}

/* --------------------------------------------------------- guard (mục 6) */

{
  const duKien: DuKienLaSo[] = [
    { id: 'F001', loai: 'cung', noiDung: 'Quan Lộc có Thiên Phủ, Hóa Khoa.', cung: 'Quan Lộc', sao: ['Thiên Phủ', 'Hóa Khoa'] },
    { id: 'F002', loai: 'luu-nien', noiDung: 'Tiểu hạn năm 2026 vào Quan Lộc, có Đà La.', cung: 'Quan Lộc', sao: ['Đà La'] },
    { id: 'F003', loai: 'dai-van', noiDung: 'Đại vận 33–42 tuổi ở Quan Lộc.', cung: 'Quan Lộc' },
  ];
  const nghieng: NghiengVe = {
    huong: 'thuan-nhe', cap: 'nam', cung: 'Quan Lộc', phanDoi: 'công việc', cham: { daiVan: true, nam: true, thang: false },
    namXem: 2026, khoangTuoi: '33–42 tuổi',
    dauMoc: [
      { ten: 'Thiên Phủ', lop: 'nen', huong: 'do', trong: 3, y: 'giữ được nền' },
      { ten: 'Hóa Khoa', lop: 'nen', huong: 'do', trong: 2, y: 'có tiếng tốt' },
      { ten: 'Đà La', lop: 'nam', huong: 'can', trong: 2, y: 'chậm, vướng' },
      { ten: 'Thất Sát', lop: 'thang', huong: 'can', trong: 1, y: 'gấp' },
    ],
    cachCuc: [], canNang: { do: 5, can: 3 },
  };
  const ctx = (them: Partial<NguCanhKiem> = {}): NguCanhKiem => {
    const goc = {
      cauHoi: 'Năm nay công việc tôi có thuận không?',
      phanLoai: { khuon: 'A', loaiSuKien: 'mong-muon', sau: false } as NguCanhKiem['phanLoai'],
      mucAnToan: 'NORMAL' as const, chuDe: 'su-nghiep' as const, doiTuong: null,
      tapTen: tapTenTuGoi(duKien), phucDucLaSao: false, maHopLe: new Set(duKien.map((d) => d.id)), maNguonHopLe: new Set(['E001']),
      nghieng, thoiGian: { namHieuLuc: 2026, thang: null, cuoiNam: false } as NguCanhKiem['thoiGian'], tuoiHopLe: [[33, 42]] as [number, number][],
      cauMa: [], chipTruoc: [], ...them,
    };
    const m = tinhMocHopLe({ cauHoi: goc.cauHoi, thoiGian: goc.thoiGian, namSinh: [1990], vanGoi: duKien.map((d) => d.noiDung) });
    return { mocHopLeAnswer: m.answer, mocHopLeChip: m.chip, ...goc };
  };
  // Answer Contract v2 — bảng 5.1 (commit E): mỗi mã một ca trượt, một ca qua. Không sửa văn.
  const claimTot = [{ claim: 'Công việc năm nay khá thuận', evidenceIds: ['F001'], direction: 'thuan' as const }];
  const ma = (answer: string, x: NguCanhKiem = ctx(), claims: BanNhap['claims'] = claimTot) =>
    kiemCung({ answer, claims, suggestedQuestions: [] }, x).map((l) => l.ma);
  const qua = 'Thiên Phủ ở đây giúp bạn giữ được nền trong công việc.';
  kiem(ma(qua).length === 0, `câu sạch bị chặn: ${ma(qua)}`);
  const truot: [string, string][] = [
    ['Thất Sát khiến bạn nóng vội.', 'TEN_NGOAI_GOI'],
    ['Lưu Hóa Kỵ năm nay làm chậm việc.', 'LUU_HOA'],
    ['Thiên Âm năm nay đỡ cho bạn.', 'TEN_BIA'],
    ['Năm 2028 mọi việc mở ra.', 'MOC_BIA'],
    ['Tháng 5 là quãng đáng chú ý.', 'MOC_BIA'],
    ['Tới 50 tuổi mới yên.', 'MOC_BIA'],
    ['Khả năng thăng chức gần 100%.', 'PHAN_TRAM'],
    ['Năm nay chắc chắn bạn sẽ có việc.', 'CHAC_CHAN_GIA'],
    // CEL-191 §7 (a): danh sách đóng của tầng B.
    ['Năm nay chắc chắn sẽ có việc.', 'CHAC_CHAN_GIA'],
    ['Năm sau bạn nhất định sẽ cưới.', 'CHAC_CHAN_GIA'],
    ['Chuyện đó sẽ xảy ra.', 'CHAC_CHAN_GIA'],
    ['Không có gì phải lo, việc tốt sẽ xảy ra.', 'CHAC_CHAN_GIA'],
    ['Theo tài liệu, năm nay công việc ổn.', 'LO_NGUON'],
    ['Theo Bắc phái, năm nay công việc ổn.', 'LO_NGUON'],
    ['Theo F001, năm nay công việc ổn.', 'LO_MA'],
  ];
  for (const [c, x] of truot) kiem(ma(c).includes(x as never), `"${c}" không ra ${x}: ${ma(c)}`);
  // CEL-194 — T### nghiệm lý. Cờ tắt (không có maNghiemLyHopLe): T là mã lạ, "T001" trong văn không bị bắt (y như cũ).
  {
    const coT = ctx({ maNghiemLyHopLe: new Set(['T001']) });
    const claimT = (ids: string[]) => [{ claim: 'Công việc năm nay khá thuận', evidenceIds: ids, direction: 'thuan' as const }];
    kiem(ma(qua, coT, claimT(['T001', 'F001'])).length === 0, `T + F phải qua: ${ma(qua, coT, claimT(['T001', 'F001']))}`);
    kiem(ma(qua, coT, claimT(['T001'])).includes('T_THIEU_F'), 'claim chỉ dẫn T phải ra T_THIEU_F');
    kiem(ma(qua, coT, claimT(['T001', 'E001'])).includes('T_THIEU_F'), 'claim dẫn T + E (không F) phải ra T_THIEU_F');
    kiem(ma(qua, coT, claimT(['T002', 'F001'])).includes('MA_KHONG_HOP_LE'), 'T ngoài gói phải ra MA_KHONG_HOP_LE');
    kiem(ma(qua, ctx(), claimT(['T001', 'F001'])).includes('MA_KHONG_HOP_LE'), 'cờ tắt: T001 là mã lạ');
    kiem(ma('Theo T001, năm nay công việc ổn.', coT, claimT(['T001', 'F001'])).includes('LO_MA'), 'LO_MA phải bắt T###');
    kiem(ma('Theo NL-SU-NGHIEP, năm nay ổn.', coT, claimT(['T001', 'F001'])).includes('LO_MA'), 'LO_MA phải bắt mã NL-');
    kiem(!ma('Theo T001, năm nay công việc ổn.').includes('LO_MA'), 'cờ tắt: validator phải y như cũ với T###');
  }
  // Tên quét theo câu: chữ hoa đầu câu thứ hai không phải tên riêng; claim cũng bị quét.
  kiem(!ma('Năm nay khá thuận. Suy cho cùng, nền vẫn vững.').some((x) => x.startsWith('TEN')), `"Suy…" đầu câu bị coi là tên: ${ma('Năm nay khá thuận. Suy cho cùng, nền vẫn vững.')}`);
  kiem(ma(qua, ctx(), [{ ...claimTot[0], claim: 'Thất Sát làm việc gấp' }]).includes('TEN_NGOAI_GOI'), 'tên lạ trong claim lọt');
  kiem(ma('Quãng 35 tuổi là lúc vững nhất.').length === 0, `tuổi trong đại vận bị chặn: ${ma('Quãng 35 tuổi là lúc vững nhất.')}`);
  // Eval I: chữ thường bỏ dấu trùng cụm hệ phái — không phải nhắc nguồn.
  for (const c of ['Điều làm bạn mệt không hẳn là thiếu tiền, mà là tiền bạc phải chia nhiều nơi.', 'Cả năm phải giữ nhịp đều.']) {
    kiem(!ma(c).includes('LO_NGUON'), `"${c}" bị LO_NGUON nhầm`);
  }
  // Delta #3: rào đón không phải phán chắc.
  for (const c of ['Celes không chắc chắn chuyện này, còn tùy bạn.', 'Không thể nào biết trước mọi chuyện.', 'Việc đó sẽ không đến ngay.',
    // Eval mù I: phủ định xa hơn một từ, cùng vế câu — từng ra 502.
    'Điều làm bạn lo không hẳn là dấu hiệu chắc chắn bị cho nghỉ.',
    'Điều này không phải dấu hiệu chắc chắn bạn bị cho nghỉ.',
    'Đây không phải căn cứ để kết luận khoản vay chắc chắn mất.',
    'Điều này không có nghĩa là chắc chắn mất tiền, mà là khoản vay khó đòi.',
    'Đây không đủ để kết luận chắc chắn rằng khoản vay mất.',
    'Celes chưa có đủ căn cứ để khẳng định một thay đổi nhà cụ thể sẽ xảy ra.',
    'Lá số không có căn cứ để nói chắc chắn chuyện này.',
    'Điều này không đồng nghĩa với việc chắc chắn nhận việc ngay trong tháng.',
    // CEL-191 §7 (b)
    'Celes không thể chắc chắn bạn sẽ đổi việc.',
    'Điều này không đồng nghĩa là chắc chắn bạn sẽ mất tiền.',
    'Chuyện này chưa chắc chắn sẽ tới.']) {
    kiem(!ma(c).includes('CHAC_CHAN_GIA'), `"${c}" bị CHAC_CHAN_GIA nhầm`);
  }
  // CEL-191 §7 (c): giọng chắc nhưng không phải lời tiên tri — không chặn, chỉ ghi điểm C.
  for (const c of ['Chắc chắn là bạn nên nghỉ ngơi một chút.', 'Năm nay việc tới, điều đó nhất định.',
    'Không phải lo, năm nay chắc chắn có việc.', 'Đây không phải dấu hiệu xấu mà chắc chắn là lúc đổi nghề.']) {
    const k = kiemBaTang({ answer: c, claims: claimTot, suggestedQuestions: [] }, ctx());
    kiem(k.chan.length === 0, `"${c}" bị chặn: ${k.chan.map((l) => l.ma)}`);
    kiem(k.do.some((d) => d.ma === 'PHAN_QUYET'), `"${c}" không có điểm C PHAN_QUYET: ${JSON.stringify(k.do)}`);
  }
  // Mọi lỗi chặn mang tầng A hoặc B; mã C không bao giờ lọt vào `chan`.
  {
    const k = kiemBaTang({ answer: 'Theo F001, chắc chắn sẽ ổn. Tóm lại, năm nay ổn.', claims: claimTot, suggestedQuestions: [] }, ctx());
    kiem(k.chan.every((l) => l.tang === 'A' || l.tang === 'B') && k.chan.some((l) => l.tang === 'A') && k.chan.some((l) => l.tang === 'B'), `tầng sai: ${JSON.stringify(k.chan)}`);
    kiem(k.do.some((d) => d.ma === 'GIONG_BAO_CAO'), `thiếu điểm GIONG_BAO_CAO: ${JSON.stringify(k.do)}`);
  }
  // Mốc: tháng 10/2026 dương phủ tháng 8 và 9 âm; tháng kế (11) không lạ; hỏi "năm nay" mà nói "sang 2027" là lệch (delta #6).
  const tgT9 = { namHieuLuc: 2026, cuoiNam: false, thang: thangDuongTest(2026, 10) };
  const ctxT9 = ctx({ cauHoi: 'Tháng 10 công việc tôi thế nào?', thoiGian: tgT9 });
  kiem(!ma('Từ giữa tháng 10, việc dễ thở hơn.', ctxT9).includes('MOC_BIA'), `tháng đang hỏi bị MOC_BIA: ${ma('Từ giữa tháng 10, việc dễ thở hơn.', ctxT9)}`);
  // Hỏi tháng 9 âm (10/10 – 8/11 dương): tháng dương cuối cửa sổ không lạ.
  const ctxAm9 = ctx({ cauHoi: 'Tháng 9 âm công việc tôi thế nào?', thoiGian: { namHieuLuc: 2026, cuoiNam: false, thang: thangAmTest(2026, 9) } });
  kiem(!ma('Từ giữa tháng 10 tới đầu tháng 11, việc dễ thở hơn.', ctxAm9).includes('MOC_BIA'), `tháng dương cuối cửa sổ bị MOC_BIA: ${ma('Từ giữa tháng 10 tới đầu tháng 11, việc dễ thở hơn.', ctxAm9)}`);
  kiem(ma('Tháng 12 việc mới rõ.', ctxT9).includes('MOC_BIA'), 'tháng ngoài cửa sổ không ra MOC_BIA');
  kiem(ma('Năm nay ổn, sang 2027 còn tốt hơn.').includes('MOC_BIA'), 'answer "sang 2027" khi hỏi năm nay không ra MOC_BIA');
  kiem(!ma('Bạn sinh năm 1990, năm nay nền vẫn vững.').includes('MOC_BIA'), 'năm sinh bị coi là mốc lạ');
  kiem(!ma('Năm 2025 bạn hỏi thì nền vẫn vững.', ctx({ cauHoi: 'Năm 2025 công việc tôi thế nào?' })).includes('MOC_BIA'), 'năm người dùng gõ bị coi là mốc lạ');
  const chipMoc = chonChip(['Sang năm 2027 thì sao?', 'Năm 2029 thì sao?', 'Còn tiền bạc thì sao?'], ctx());
  kiem(chipMoc.includes('Sang năm 2027 thì sao?') && !chipMoc.includes('Năm 2029 thì sao?'), `chip mốc sai: ${chipMoc.join(' | ')}`);
  const chipT9 = chonChip(['Tháng 11 thì sao?', 'Tháng 12 thì sao?'], ctxT9);
  kiem(chipT9.includes('Tháng 11 thì sao?'), `chip tháng kế bị bỏ: ${chipT9.join(' | ')}`);
  const chipKhaiBao = chonChip(['Còn tiền bạc', 'Còn tình cảm thì sao?'], ctx());
  kiem(!chipKhaiBao.includes('Còn tiền bạc') && chipKhaiBao.includes('Còn tình cảm thì sao?'), `chip khai báo lọt: ${chipKhaiBao.join(' | ')}`);
  // MOC_NHO_HON_NAM: chỉ khuôn D.
  const D = { khuon: 'D' as const, loaiSuKien: 'trung-tinh' as const, sau: false };
  kiem(ma('Cuối năm việc mới rõ.', ctx({ phanLoai: D })).includes('MOC_NHO_HON_NAM'), 'D nói "cuối năm" không bị chặn');
  kiem(!ma('Cuối năm việc mới rõ.').includes('MOC_NHO_HON_NAM'), 'A nói "cuối năm" bị chặn');
  // CHON_HO: chỉ C / E.
  const E = { khuon: 'E' as const, loaiSuKien: 'trung-tinh' as const, sau: false, haiVe: ['công ty A', 'công ty B'] as [string, string] };
  const C = { khuon: 'C' as const, loaiSuKien: 'trung-tinh' as const, sau: false };
  const B = { khuon: 'B' as const, loaiSuKien: 'trung-tinh' as const, sau: false };
  kiem(ma('Bạn nên chọn công ty A.', ctx({ phanLoai: E })).includes('CHON_HO'), 'E "Bạn nên chọn công ty A" không bị chặn');
  kiem(ma('Công ty A hợp hơn với nhịp của bạn.', ctx({ phanLoai: E })).includes('CHON_HO'), 'E "A hợp hơn" không bị chặn');
  kiem(ma('Bạn nên chuyển nhà năm nay.', ctx({ phanLoai: C })).includes('CHON_HO'), 'C "Bạn nên chuyển nhà" không bị chặn');
  kiem(!ma('Hãy giữ sức khoẻ.', ctx({ phanLoai: C })).includes('CHON_HO'), 'C "Hãy giữ sức khoẻ" bị CHON_HO');
  kiem(!ma('Bạn nên chú ý quãng này.', ctx({ phanLoai: B })).includes('CHON_HO'), 'B bị CHON_HO');
  kiem(!ma('Việc chậm, nên phải chờ thêm.', ctx({ phanLoai: C })).includes('CHON_HO'), '"nên" liên từ bị coi là chọn hộ');
  // NGUOC_HUONG: claims[0].direction so hướng engine; G không có hướng.
  const G = { khuon: 'G' as const, loaiSuKien: 'trung-tinh' as const, sau: false };
  kiem(ma(qua, ctx(), [{ ...claimTot[0], direction: 'vuong' }]).includes('NGUOC_HUONG'), 'chiều ngược không ra NGUOC_HUONG');
  kiem(ma(qua, ctx(), [{ ...claimTot[0], direction: undefined }]).includes('NGUOC_HUONG'), 'thiếu chiều không ra NGUOC_HUONG');
  kiem(!ma(qua, ctx({ phanLoai: G }), [{ ...claimTot[0], direction: undefined }]).includes('NGUOC_HUONG'), 'G bị đòi chiều');
  // THIEU_THANG: hỏi tháng mà không claim nào dẫn dữ kiện tháng.
  const daQua = ctx({ thoiGian: { namHieuLuc: 2026, thang: thangAmTest(2026, 3), cuoiNam: false } });
  const ctxThang = { ...daQua, maNguyetHan: new Set(['F002']) };
  kiem(ma(qua, ctxThang).includes('THIEU_THANG'), 'hỏi tháng mà không dẫn nguyệt hạn không ra THIEU_THANG');
  kiem(!ma(qua, ctxThang, [{ ...claimTot[0], evidenceIds: ['F001', 'F002'] }]).includes('THIEU_THANG'), 'dẫn nguyệt hạn vẫn ra THIEU_THANG');
  // Hai nửa khác chiều (spec v2 §3.3, 5.1): claim về một W phải đúng chiều W ấy; mỗi W cần một claim dẫn căn cứ của nó.
  {
    const haiNua = ctx({
      cauHoi: 'Tháng 10 công việc tôi thế nào?',
      nghieng: null,
      thoiGian: { namHieuLuc: 2026, cuoiNam: false, thang: thangDuongTest(2026, 10) },
      huongThang: { kieu: 'hai-nua', theoCuaSo: [{ cuaSo: 'W1', nhom: 'vuong' }, { cuaSo: 'W2', nhom: 'thuan' }] },
      maTheoCuaSo: { W1: ['F002', 'F001'], W2: ['F003', 'F001'] },
    });
    const dung = [
      { claim: 'Đầu tháng còn vướng', evidenceIds: ['F002'], direction: 'vuong' as const, timeRefs: ['W1'] },
      { claim: 'Phần sau dễ thở hơn', evidenceIds: ['F003'], direction: 'thuan' as const, timeRefs: ['W2'] },
    ];
    kiem(ma(qua, haiNua, dung).length === 0, `hai nửa đúng chiều vẫn bị chặn: ${ma(qua, haiNua, dung)}`);
    kiem(ma(qua, haiNua, [dung[0], { ...dung[1], direction: 'vuong' }]).includes('NGUOC_HUONG'), 'W2 sai chiều không ra NGUOC_HUONG');
    kiem(ma(qua, haiNua, [dung[0], { ...dung[1], direction: undefined }]).includes('NGUOC_HUONG'), 'W2 thiếu chiều không ra NGUOC_HUONG');
    kiem(ma(qua, haiNua, [dung[0]]).includes('THIEU_THANG'), 'thiếu claim cho W2 không ra THIEU_THANG');
    // Claim nói chung cả tháng (không timeRefs W) không bị ép chiều của một nửa.
    kiem(
      !ma(qua, haiNua, [...dung, { claim: 'Cả tháng cần kiên nhẫn', evidenceIds: ['F001'], direction: 'ngang' as const }]).includes('NGUOC_HUONG'),
      'claim chung cả tháng bị ép chiều một nửa'
    );
  }
  // Văn phong là EVAL: tháng đã qua nói "sẽ", "nghiêng về" ở G, tên cung — không chặn.
  kiem(ma('Quãng đó sẽ có người giúp.', daQua).length === 0, `"sẽ" ở tháng đã qua bị chặn: ${ma('Quãng đó sẽ có người giúp.', daQua)}`);
  kiem(!ma('Tháng 3 có Thiên Phủ đỡ.', daQua).includes('MOC_BIA'), 'tháng hiệu lực bị coi là mốc lạ');
  kiem(ma('Phần Quan Lộc của bạn khá vững.').length === 0, 'tên cung bị chặn cứng (phải là EVAL)');
  // SCHEMA ngoài phạm vi: đúng một câu, claims rỗng.
  const ngoai = (answer: string, claims: BanNhap['claims'] = []) => kiemCung({ answer, claims, suggestedQuestions: [], outOfScope: true }, ctx()).map((l) => l.ma);
  kiem(ngoai('Đây không phải chuyện lá số nói tới.').length === 0, 'ngoài phạm vi một câu bị chặn');
  kiem(ngoai('Câu một. Câu hai.').includes('SCHEMA'), 'ngoài phạm vi hai câu không ra SCHEMA');
  kiem(ngoai('Một câu.', claimTot).includes('SCHEMA'), 'ngoài phạm vi có claims không ra SCHEMA');

  // Hợp đồng v2 (spec 2.2 + 5.1, phần tối thiểu ở commit D): đọc bản nháp, validator cứng.
  const banTot: BanNhap = {
    answer: 'Năm nay công việc khá thuận. Thiên Phủ giữ được nền cho bạn, còn Đà La làm vài việc chậm hơn dự tính.',
    claims: [{ claim: 'Công việc năm nay khá thuận', evidenceIds: ['F001', 'E001'], direction: 'thuan' }],
    suggestedQuestions: ['Còn tiền bạc thì sao?'],
  };
  const maLoi = (b: BanNhap | null) => kiemCung(b, ctx()).map((l) => l.ma);
  kiem(maLoi(banTot).length === 0, `bản sạch bị chặn: ${maLoi(banTot)}`);
  kiem(maLoi(null).join() === 'SCHEMA', `bản không đọc được không ra SCHEMA: ${maLoi(null)}`);
  kiem(maLoi({ ...banTot, answer: '' }).includes('SCHEMA'), 'answer rỗng không ra SCHEMA');
  const maLa = maLoi({ ...banTot, claims: [{ claim: 'x', evidenceIds: ['F999'] }] });
  kiem(maLa.includes('MA_KHONG_HOP_LE') && maLa.includes('KHONG_CAN_CU'), `mã lạ: ${maLa}`);
  const motMaLa = maLoi({ ...banTot, claims: [{ claim: 'x', evidenceIds: ['F001', 'E777'] }] });
  kiem(motMaLa.includes('MA_KHONG_HOP_LE') && !motMaLa.includes('KHONG_CAN_CU'), `một mã lạ bên mã thật: ${motMaLa}`);
  kiem(maLoi({ ...banTot, claims: [] }).includes('KHONG_CAN_CU'), 'claims rỗng không ra KHONG_CAN_CU');
  kiem(maLoi({ ...banTot, claims: [{ claim: 'x', evidenceIds: [] }] }).includes('KHONG_CAN_CU'), 'claim không mã không ra KHONG_CAN_CU');
  kiem(maLoi({ ...banTot, answer: 'Đây không phải chuyện lá số nói tới.', claims: [], outOfScope: true }).length === 0, 'ngoài phạm vi vẫn bị đòi căn cứ');
  kiem(maLoi({ ...banTot, claims: [{ claim: 'x', evidenceIds: ['E001'], direction: 'thuan' }] }).length === 0, 'claim chỉ dẫn E### hợp lệ bị chặn');
  for (const lo of ['Theo F001, năm nay công việc ổn.', 'Nguồn E012 nói năm nay ổn.', 'Quãng W1 khá thuận.']) {
    const l = kiemCung({ ...banTot, answer: lo }, ctx());
    kiem(l.some((x) => x.ma === 'LO_MA'), `"${lo}" không ra LO_MA`);
  }
  // CEL-191: giọng báo cáo tách khỏi LO_MA, xuống tầng C — không chặn, có điểm.
  for (const bc of ['Dựa trên các dữ kiện, năm nay ổn.', 'Tóm lại, năm nay ổn.']) {
    const k = kiemBaTang({ ...banTot, answer: bc }, ctx());
    kiem(k.chan.length === 0 && k.do.some((d) => d.ma === 'GIONG_BAO_CAO'), `"${bc}": chan=${k.chan.map((l) => l.ma)} do=${JSON.stringify(k.do)}`);
  }
  const doanLo = kiemCung({ ...banTot, answer: 'Năm nay công việc khá thuận, theo F001 thì nền vững.' }, ctx()).find((x) => x.ma === 'LO_MA');
  kiem(!!doanLo?.doan?.includes('F001') && (doanLo.doan.length ?? 0) <= 60, `LO_MA thiếu đoạn quanh mã: ${doanLo?.doan}`);
  for (const sach of ['Năm 2026 công việc ổn.', 'Việc bạn dự kiến làm có nền đỡ.', 'Mã F0010 không phải mã nội bộ.']) {
    kiem(!maLoi({ ...banTot, answer: sach }).includes('LO_MA'), `"${sach}" bị LO_MA nhầm`);
  }
  // Đọc bản nháp: trường sai kiểu bị bỏ, không đoán thay.
  const d1 = docBanNhap(
    '```json\n{"answer":" A. ","claims":[{"claim":"B","evidenceIds":["F001"],"direction":"lạ"},{"claim":""},"x"],"suggestedQuestions":["C?",3],"outOfScope":"có","hoanCanhNhanRa":["đang thất nghiệp","một nhãn dài hơn sáu từ thì bị bỏ đi"]}\n```'
  );
  kiem(
    !!d1 && d1.answer === 'A.' && d1.claims.length === 1 && d1.claims[0].direction === undefined && d1.suggestedQuestions.join('|') === 'C?' &&
      !d1.outOfScope && d1.hoanCanhNhanRa?.join('|') === 'đang thất nghiệp',
    `docBanNhap đọc sai: ${JSON.stringify(d1)}`
  );
  kiem(docBanNhap('không phải json') === null, 'docBanNhap nhận văn xuôi');
  kiem(docBanNhap('{"answer":"x","claims":[],"suggestedQuestions":[],"outOfScope":true}')?.outOfScope === true, 'docBanNhap mất outOfScope');
  const dai200 = docBanNhap(`{"answer":"x","claims":[{"claim":"${'a'.repeat(300)}","evidenceIds":["F001"],"direction":"vuong"}]}`);
  kiem(dai200?.claims[0].claim.length === CLAIM_TOI_DA && dai200.claims[0].direction === 'vuong', 'claim không bị cắt ở 200 ký tự');
  kiem(docBanNhap('{"claims":[]}')?.answer === '' && maLoi(docBanNhap('{"claims":[]}')).includes('SCHEMA'), 'thiếu answer không ra SCHEMA');
  // Chip: luật lọc giữ nguyên trên `suggestedQuestions`.
  const chip = chonChip(['Năm nay công việc tôi có thuận không?', 'Bạn nên làm gì?', 'Tháng nào tốt hơn?', 'Còn tiền bạc thì sao?', 'Tên người đó là gì?'], ctx());
  kiem(chip.length >= 2 && chip.length <= 3, `số chip sai: ${chip.join(' | ')}`);
  kiem(!chip.some((c) => /nên|Tháng nào|Tên/u.test(c) || c === ctx().cauHoi), `chip bẩn lọt: ${chip.join(' | ')}`);
  kiem(chip.includes('Còn tiền bạc thì sao?'), 'chip hợp lệ bị bỏ');
  const E2 = { khuon: 'E' as const, loaiSuKien: 'trung-tinh' as const, sau: false, haiVe: ['ở lại', 'nhảy việc'] as [string, string] };
  const chipE = chonChip(['Còn tiền bạc thì sao?'], ctx({ phanLoai: E2, chipMa: ['Ở lại thì sao?', 'Nhảy việc thì sao?'] }));
  kiem(chipE.join('|') === 'Ở lại thì sao?|Nhảy việc thì sao?', `E chip sai: ${chipE.join(' | ')}`);
  // Prompt v2: schema mới, không còn trần độ dài; ghim EN; khối viết lại.
  {
    const goiP = dungGoiBangChung(ctx().cauHoi, lapKeHoachFocused({ cauHoi: ctx().cauHoi, lichSu: [], saoTheoCung: saoChinhTheoCung(dsLaSo[0]), namXem: 2026, thangXem: 8 }).keHoach, duKien, []);
    const dv = {
      goi: goiP, cauHoiGoc: ctx().cauHoi, lichSu: [], daNoiTruoc: [], nghieng, phanLoai: ctx().phanLoai,
      mucAnToan: 'NORMAL' as const, moc: { bayGio, thoiGian: ctx().thoiGian }, laTiepTuChip: false, cauMa: [],
    };
    const p = dungPromptFocused(dv);
    kiem(/"answer"/u.test(p.system) && /"claims"/u.test(p.system) && /"suggestedQuestions"/u.test(p.system), 'SYSTEM thiếu schema v2');
    kiem(!/"cauChot"|"cau"|"goiYTiep"|"chieuCauChot"/u.test(p.system + p.user), 'prompt còn schema cũ');
    kiem(!/55–120|Dài hơn sẽ bị cắt|6–7 câu|1–2 căn cứ/u.test(p.system + p.user), 'prompt còn trần độ dài');
    kiem(p.system.includes('Trả lời đủ ý câu hỏi, không lặp ý, không kể lại câu hỏi.'), 'thiếu câu độ dài 8.1');
    kiem(!p.system.startsWith('Write'), 'VI bị ghim EN');
    kiem(dungPromptFocused({ ...dv, ngonNgu: 'en' }).system.startsWith('Write `answer` and `suggestedQuestions` entirely in English.'), 'EN không ghim ngôn ngữ');
    kiem(dungPromptFocused({ ...dv, phanLoai: { ...dv.phanLoai, sau: true } }).user.includes('Người hỏi muốn nghe kỹ.'), 'thiếu câu "nghe kỹ"');
    const vl = dungPromptFocused({ ...dv, vietLai: { answer: 'Bản cũ.', loi: [{ ma: 'LO_MA', tang: 'A', chiTiet: 'văn có mã nội bộ "F001"', doan: 'theo F001 thì' }] } }).user;
    kiem(vl.includes('Viết lại TOÀN BỘ câu trả lời.') && vl.includes('văn có mã nội bộ "F001"') && vl.includes('theo F001 thì') && vl.includes('Bản cũ.'), 'khối viết lại thiếu lỗi / đoạn / bản cũ');
    kiem(!p.user.includes('Viết lại TOÀN BỘ'), 'lần một có khối viết lại');

    // H (8.2): một nguồn giọng. "nêu tên" bị cấm ở dạng khuôn "nêu tên rồi/thì dịch";
    // câu spec bắt thêm ("Không bắt buộc nêu tên sao…") tự chứa chữ đó nên không cấm trần.
    const sys = p.system.toLowerCase();
    for (const cam of ['nêu tên rồi dịch', 'nêu tên thì dịch', 'nêu tên sao / hạn rồi dịch', 'kết bằng lời khuyên', 'tối đa một tên sao']) {
      kiem(!(sys + p.user.toLowerCase()).includes(cam), `prompt Focused còn "${cam}"`);
    }
    kiem(p.system.includes(VAN_PHONG_CELES_CHAT.split('\n')[0]), 'SYSTEM thiếu dòng đầu VAN_PHONG_CELES_CHAT');
    kiem(p.system.includes(VAN_PHONG_CELES_CHAT), 'SYSTEM thiếu nguyên khối VAN_PHONG_CELES_CHAT');
    kiem(p.system.includes('Không bắt buộc nêu tên sao. Nếu nêu, nói ý nghĩa đời thường trước, tên sau, và tên phải có trong DỮ KIỆN.'), 'thiếu câu tên sao 8.2');
    kiem(!p.system.includes('GIỌNG CELES TRONG LƯỢT NÀY'), 'SYSTEM còn KHOI_GIONG_CELES');
    kiem(!p.system.includes('QUY TẮC VIẾT'), 'SYSTEM còn khối quy-tac-luan-giai-chung');
    kiem(p.system.includes('không luận thọ yểu') && p.system.includes('bỏ phán quyết cực đoan'), 'SYSTEM thiếu LUAT_MIEN_CHAT');
  }

  // Câu do mã viết: chữ đã duyệt (chủ dự án 04/10), không lộ "dữ kiện", EN không còn chữ Việt.
  const mocNhuan = thangAmTest(2025, 6, true);
  const mocQua = thangAmTest(2026, 3);
  const dtMe = nhanDangDoiTuong('Mẹ tôi năm nay thế nào?');
  const cauMaVi = [
    ...(dtMe ? [cauVanRieng()] : []), ...CAU_NGOAI_TAM,
    cauNhuanChuaTach(mocNhuan, 2026).cau,
  ];
  for (const c of cauMaVi) kiem(!/dữ kiện/iu.test(c), `câu mã còn "dữ kiện": ${c}`);
  const cauMaEn: string[] = [
    ...CAU_NGOAI_TAM_EN, MIEN_TRU_TAM_LY_EN,
    cauNhuanChuaTach(mocNhuan, 2026, 'en').cau, ...cauNhuanChuaTach(mocNhuan, 2026, 'en').chip,
    chipCuoiNam(2026, [], 'en').join(' '),
    ...chipHaiVe(['nghỉ việc', 'ở lại'], 'en'),
    ...CHIP_DU_PHONG.en,
    ...(dtMe ? [cauVanRieng('en'), chipQuanHe(dtMe, 'en')] : []),
    ...loiDiTheoNgonNgu(loiDiTiep({ chuDe: 'su-nghiep', lopHan: ['luu-nien'], yDinh: 'co-khong' }), 'en').map((l) => l.nhan),
  ];
  for (const c of cauMaEn) kiem(!conChuViet(c), `câu mã EN còn chữ Việt: ${c}`);
  kiem(datMienTruTheoNgonNgu('Body.', 'en', datMienTruTamLy).endsWith(MIEN_TRU_TAM_LY_EN), 'miễn trừ EN sai');
  kiem(datMienTruTheoNgonNgu('Thân.', 'vi', datMienTruTamLy) === datMienTruTamLy('Thân.'), 'miễn trừ VI bị đổi');
  kiem(chonNgonNgu('en', null) === 'en' && chonNgonNgu(undefined, 'en') === 'en', 'chonNgonNgu không nhận en');
  kiem(chonNgonNgu('fr', 'xx') === 'vi' && chonNgonNgu(undefined, null) === 'vi', 'chonNgonNgu không về vi mặc định');

  // Ngôn ngữ: chip dự phòng theo ngôn ngữ người dùng.
  const chipEn = chonChip([], ctx({ ngonNgu: 'en' }));
  kiem(chipEn.length === 2 && chipEn.every((c) => CHIP_DU_PHONG.en.includes(c)), `chip dự phòng EN sai: ${chipEn.join(' | ')}`);
  kiem(chonChip([], ctx()).every((c) => CHIP_DU_PHONG.vi.includes(c)), 'chip dự phòng VI sai');
  kiem(chonChip([], ctx()).length === 2, 'không bù chip khi model trả rỗng');
  const dai = 'Công việc năm nay của tôi có gặp trở ngại lớn không?';
  kiem(!chonChip([dai, 'Còn tiền bạc thì sao?'], ctx()).includes(dai), 'chip quá 40 ký tự lọt qua');
  const chipCam = chonChip(['Có nên đổi cách kiếm tiền?', 'Đại vận này bào mòn ở điểm nào?', 'Còn tiền bạc thì sao?'], ctx());
  kiem(!chipCam.some((c) => /Có nên|Đại vận/.test(c)), `chip khuyên / thuật ngữ lọt qua: ${chipCam.join(' | ')}`);
  const n4 = chonChip(['Còn tiền bạc thì sao?'], ctx({ chipCuoiNam: (x) => chipCuoiNam(2026, x) }));
  kiem(n4[0].startsWith('Sang năm'), `N4 chip không đứng đầu: ${n4.join(' | ')}`);
  kiem(soAmTiet('Năm nay, công việc ổn.') === 5, 'đếm âm tiết sai');

  // Prompt: chỉ in lớp có F### trong gói (4.4) — Thất Sát (lớp tháng) không có
  const khoi = khoiNghiengFocused(nghieng, { duKien }, 'A');
  kiem(khoi.includes('Đà La') && !khoi.includes('Thất Sát'), 'khối nghiêng in lớp không có trong gói');
  kiem(khoi.includes('"thuan"'), 'khối nghiêng thiếu chiều đã chốt');
  kiem(khoiNghiengFocused(nghieng, { duKien }, 'G') === '', 'G vẫn có khối nghiêng');
  kiem(lopCoTrongGoi({ duKien }).has('nam'), 'lopCoTrongGoi bỏ sót lớp năm');

  /* Guard tên đọc đúng chữ prompt in ra (SỬA LỖI 04/10/2026). `d.sao` là metadata
     model không thấy — tự nó không cấp quyền gọi tên, kể cả qua đầu mốc in vào khối nghiêng. */
  {
    const ctxTen = (tap: Set<string>, n: NghiengVe | null = null): NguCanhKiem => ({
      cauHoi: 'Sức khỏe năm nay của tôi thế nào?', phanLoai: { khuon: 'B', loaiSuKien: 'trung-tinh', sau: false },
      mucAnToan: 'NORMAL', chuDe: 'suc-khoe', doiTuong: null, tapTen: tap, phucDucLaSao: false,
      maHopLe: new Set(['F001', 'F002']), maNguonHopLe: new Set(), nghieng: n, thoiGian: { namHieuLuc: 2026, thang: null, cuoiNam: false },
      tuoiHopLe: [], cauMa: [], chipTruoc: [], ...MOC_2026,
    });
    const nThienY: NghiengVe = {
      ...nghieng, phanDoi: 'sức khỏe', cachCuc: ['Sát Phá Tham'],
      dauMoc: [
        { ten: 'Thiên Y', lop: 'nen', huong: 'do', trong: 1, y: 'có người đỡ khi cơ thể mệt' },
        { ten: 'Thiên Phủ', lop: 'nen', huong: 'do', trong: 2, y: 'giữ được nền' },
        { ten: 'Đà La', lop: 'nam', huong: 'can', trong: 2, y: 'chậm, vướng' },
      ],
    };
    const cauThienY = 'Khi thấy mệt bạn vẫn tìm được chỗ đỡ; Thiên Y giữ lại phần này.';
    const lyTen = (tap: Set<string>) => maCau(cauThienY, ctxTen(tap, nThienY));

    // (1) d.sao có Thiên Y, noiDung không → câu nhắc Thiên Y bị loại; khối in đầu mốc KHÔNG tên.
    const dkMeta: DuKienLaSo[] = [
      { id: 'F001', loai: 'cung', noiDung: 'Tật Ách có Thiên Phủ.', cung: 'Tật Ách', sao: ['Thiên Phủ', 'Thiên Y'] },
      { id: 'F002', loai: 'luu-nien', noiDung: 'Tiểu hạn năm 2026 vào Tật Ách, có Đà La.', cung: 'Tật Ách', sao: ['Đà La'] },
    ];
    const r1 = tenDuocGoiTrongLuot({ goi: { duKien: dkMeta }, nghieng: nThienY, khuon: 'B' });
    kiem(!r1.tapTen.has(khoaTen('Thiên Y')), '(1) Thiên Y chỉ ở d.sao vẫn được phép');
    kiem(lyTen(r1.tapTen).includes('TEN_NGOAI_GOI'), `(1) câu nhắc Thiên Y (chỉ ở d.sao) lọt guard: ${lyTen(r1.tapTen).join(',')}`);
    const khoi1 = khoiNghiengFocused(nThienY, { duKien: dkMeta }, 'B');
    kiem(!khoi1.includes('Thiên Y') && khoi1.includes('có người đỡ khi cơ thể mệt') && khoi1.includes('KHÔNG gọi tên'),
      `(1) đầu mốc chỉ ở d.sao phải in nét, không in tên: ${khoi1}`);
    kiem(!r1.tenHien.includes('Thiên Y'), '(1) lớp sửa tên được mồi Thiên Y');

    // (2) noiDung có Thiên Y → được phép, đầu mốc in kèm tên.
    const dkChu: DuKienLaSo[] = [{ ...dkMeta[0], noiDung: 'Tật Ách có Thiên Phủ; phụ tinh Thiên Y.' }, dkMeta[1]];
    const r2 = tenDuocGoiTrongLuot({ goi: { duKien: dkChu }, nghieng: nThienY, khuon: 'B' });
    kiem(lyTen(r2.tapTen).length === 0, `(2) Thiên Y có trong chữ dữ kiện bị chặn: ${lyTen(r2.tapTen).join(',')}`);
    kiem(khoiNghiengFocused(nThienY, { duKien: dkChu }, 'B').includes('- Thiên Y ('), '(2) đầu mốc có tên trong chữ không in tên');

    // (3) Tên chỉ nằm trong khối nghiêng thực sự in (cách cục) → được phép; khuôn G không in khối → không.
    kiem(r1.tapTen.has(khoaTen('Sát Phá Tham')), '(3) cách cục in trong khối nghiêng không được phép');
    const rG = tenDuocGoiTrongLuot({ goi: { duKien: dkMeta }, nghieng: nThienY, khuon: 'G' });
    kiem(!rG.tapTen.has(khoaTen('Sát Phá Tham')), '(3) khuôn G không in khối mà cách cục vẫn được phép');
    // Tra cứu đích danh: câu hỏi là mặt chữ model thấy.
    const rTc = tenDuocGoiTrongLuot({ goi: { duKien: dkMeta }, nghieng: nThienY, khuon: 'B', cauTraCuu: 'Thiên Y là sao gì?' });
    kiem(rTc.tapTen.has(khoaTen('Thiên Y')), '(3) tra cứu đích danh Thiên Y bị chặn');

    // (4) Tên ngoài toàn bộ prompt → loại. Thất Sát: không ở chữ, không ở khối, không ở câu hỏi.
    kiem(maCau('Thất Sát làm bạn dễ quá sức.', ctxTen(r2.tapTen, nThienY)).includes('TEN_NGOAI_GOI'), '(4) Thất Sát ngoài prompt lọt guard');
    // Đầu mốc lớp vắng (lớp tháng, gói không có F### tháng) không in → tên không được phép dù có ở d.sao.
    const nThang: NghiengVe = { ...nThienY, dauMoc: [...nThienY.dauMoc, { ten: 'Thiên Hình', lop: 'thang', huong: 'can', trong: 1, y: 'dễ va chạm' }] };
    const dkThang: DuKienLaSo[] = [dkChu[0], { ...dkChu[1], sao: ['Đà La', 'Thiên Hình'] }];
    kiem(!tenDuocGoiTrongLuot({ goi: { duKien: dkThang }, nghieng: nThang, khuon: 'B' }).tapTen.has(khoaTen('Thiên Hình')), '(4) đầu mốc lớp vắng vẫn được gọi tên');

  }

  // (5) Hồi quy thật từ A/B 04/10/2026: lá số 22/5/2026 16h nữ. Phá Toái (Tài Bạch) và Thiên Y
  // (Tật Ách) chỉ có ở d.sao nhưng lọt guard qua đầu mốc in tên. Câu lấy nguyên văn bản A/B.
  {
    const laSo = lapLaSo({ ngay: 22, thang: 5, nam: 2026, gio: 16, gioiTinh: 'nu' });
    const ca: [string, string, string][] = [
      ['Năm nay tôi có bị mất tiền không?', 'Phá Toái', 'Điều cần để ý là một việc tưởng gần xong có thể phát sinh khoản sửa lại, do Phá Toái làm phần cuối dễ vướng.'],
      ['Tiền bạc năm nay của tôi ra sao?', 'Phá Toái', 'Cự Môn khiến chuyện tiền bạc cần nói rõ từ đầu, còn Phá Toái làm khâu cuối dễ phát sinh lỗi hoặc khoản phải sửa.'],
      ['Sức khỏe của tôi năm nay thế nào?', 'Thiên Y', 'Điểm còn mở là khả năng tự chăm sóc vẫn có, nên khi nhận ra dấu hiệu bất ổn, bạn thường tìm được cách hỗ trợ phù hợp; Thiên Y giữ lại phần này.'],
    ];
    for (const [cauHoi, ten, cau] of ca) {
      const kh = themLopChoThang(lapKeHoachFocused({ cauHoi, lichSu: [], saoTheoCung: saoChinhTheoCung(laSo), namXem: 2026, thangXem: 8 }).keHoach);
      const pl = phanKhuon({ cauHoi, keHoach: kh, doiTuong: null });
      const { duKien: dk } = chonBoiCanh({ laSo, keHoach: kh, namXem: 2026, thangXem: 8, focused: true });
      const n = tinhNghiengVe({ laSo, chuDe: kh.chuDe, lopHan: kh.lopHan, namXem: 2026, thangXem: 8, focused: true });
      const k = khoaTen(ten);
      // Tiền đề của lỗi: tên ở d.sao, không ở chữ, và là đầu mốc của khối nghiêng.
      kiem(dk.some((d) => (d.sao ?? []).some((s) => khoaTen(s) === k)) && !dk.some((d) => d.noiDung.includes(ten)) && !!n?.dauMoc.some((d) => d.ten === ten),
        `(5) tiền đề ${ten} đổi — engine/dữ kiện đã khác, xem lại ca hồi quy`);
      const { tapTen: tap } = tenDuocGoiTrongLuot({ goi: { duKien: dk }, nghieng: n, khuon: pl.khuon });
      kiem(!tap.has(k), `(5) ${ten} (chỉ ở d.sao) vẫn được phép — "${cauHoi}"`);
      kiem(!khoiNghiengFocused(n, { duKien: dk }, pl.khuon).includes(ten), `(5) khối nghiêng còn in tên ${ten}`);
      const ly = maCau(cau, {
        cauHoi, phanLoai: pl, mucAnToan: 'NORMAL', chuDe: kh.chuDe, doiTuong: null, tapTen: tap, phucDucLaSao: goiCoPhucDuc(dk),
        maHopLe: new Set(dk.map((d) => d.id)), maNguonHopLe: new Set(), nghieng: n, thoiGian: { namHieuLuc: 2026, thang: null, cuoiNam: false },
        tuoiHopLe: [], cauMa: [], chipTruoc: [], ...MOC_2026,
      });
      kiem(ly.includes('TEN_NGOAI_GOI'), `(5) câu A/B nhắc ${ten} lọt guard: ${ly.join(',')}`);
    }
  }

  /* GROUND-04 / F — ORACLE ĐỘC LẬP (final hardening 04/10/2026). Tập "model thấy" dựng
     bằng cách RENDER prompt thật rồi quét tên trên chữ in ra (scripts/oracle-ten-prompt.ts);
     KHÔNG gọi tenDuocGoiTrongLuot để dựng tập kỳ vọng. Guard ⊆ oracle trên mọi ca; mở lại
     cửa sau d.sao thì oracle phải bắt. */
  {
    const laSoOr = [dsLaSo[0], dsLaSo[3] ?? dsLaSo[1], lapLaSo({ ngay: 22, thang: 5, nam: 2026, gio: 16, gioiTinh: 'nu' })];
    const cauOr = [
      'Năm nay công việc của tôi thế nào?', 'Tiền bạc năm nay của tôi ra sao?', 'Sức khỏe của tôi năm nay thế nào?',
      'Chuyện tình cảm của tôi năm nay ra sao?', 'Tháng 9 âm năm nay công việc của tôi thế nào?', 'Tôi có nên chuyển việc năm nay không?',
      'Tính cách của tôi thế nào?', 'Thiên Y là sao gì?', 'Tháng 11 năm nay tiền bạc của tôi ra sao?',
      'Tháng 7 âm năm nay sức khỏe của tôi thế nào?',
    ];
    let soCa = 0, soDotBienBat = 0, soChiMeta = 0;
    for (const laSo of laSoOr) {
      for (const cauHoi of cauOr) {
        const kh = themLopChoThang(lapKeHoachFocused({ cauHoi, lichSu: [], saoTheoCung: saoChinhTheoCung(laSo), namXem: 2026, thangXem: 8 }).keHoach);
        const pl = phanKhuon({ cauHoi, keHoach: kh, doiTuong: null });
        const { duKien: dk } = chonBoiCanh({ laSo, keHoach: kh, namXem: 2026, thangXem: 8, focused: true });
        const n = tinhNghiengVe({ laSo, chuDe: kh.chuDe, lopHan: kh.lopHan, namXem: 2026, thangXem: 8, focused: true });
        const traCuu = kh.yDinh === 'tra-cuu';
        // Mốc thật như route (phan-bien 04/10 L3: trước đây tháng luôn null nên khối tháng không được render).
        const tgOr = boiCanhThoiGian({ cauHoi, keHoach: kh, namXem: 2026, bayGio });
        const p = {
          goi: dungGoiBangChung(cauHoi, kh, dk, []), cauHoiGoc: cauHoi, lichSu: [], daNoiTruoc: [], nghieng: n,
          phanLoai: pl, mucAnToan: 'NORMAL' as const, moc: { bayGio, thoiGian: tgOr },
          laTiepTuChip: false, cauMa: [],
        };
        const thay = tenModelThay(p, traCuu);
        const { tapTen: tap } = tenDuocGoiTrongLuot({ goi: { duKien: dk }, nghieng: n, khuon: pl.khuon, cauTraCuu: traCuu ? cauHoi : undefined });
        soCa += 1;
        const thua = [...tap].filter((t) => !thay.has(t));
        kiem(thua.length === 0, `GROUND-04 oracle: guard cho gọi tên model không thấy [${thua.join(', ')}] — "${cauHoi}"`);
        // Đột biến: mở lại cửa sau d.sao. Oracle phải thấy tập lệch ở ít nhất một ca.
        const dotBien = new Set([...tap, ...dk.flatMap((d) => (d.sao ?? []).map(khoaTen))]);
        const batDuoc = [...dotBien].some((t) => !thay.has(t));
        if (batDuoc) soDotBienBat += 1;
        const coChiMeta = [...new Set(dk.flatMap((d) => d.sao ?? []))].some((t) => !thay.has(khoaTen(t)) && quetTen(`Có ${t} ở đây.`).some((x) => khoaTen(x.ten) === khoaTen(t)));
        // Ca nào CÓ tên chỉ-metadata thì đột biến phải lộ ngay ở ca đó, không chỉ "ở một ca nào đó".
        kiem(!coChiMeta || batDuoc, `GROUND-04 đột biến d.sao không bị bắt ở ca có tên chỉ-metadata — "${cauHoi}"`);
        // Tên chỉ có ở d.sao (oracle không thấy) → câu nhắc nó phải bị guard bỏ.
        const ctx: NguCanhKiem = {
          cauHoi, phanLoai: pl, mucAnToan: 'NORMAL', chuDe: kh.chuDe, doiTuong: null, tapTen: tap, phucDucLaSao: goiCoPhucDuc(dk),
          maHopLe: new Set(dk.map((d) => d.id)), maNguonHopLe: new Set(), nghieng: n, thoiGian: tgOr,
          tuoiHopLe: [], cauMa: [], chipTruoc: [], ...MOC_2026,
        };
        for (const ten of new Set(dk.flatMap((d) => d.sao ?? []))) {
          if (thay.has(khoaTen(ten)) || !quetTen(`Có ${ten} ở đây.`).some((t) => khoaTen(t.ten) === khoaTen(ten))) continue;
          soChiMeta += 1;
          const ly = maCau(`Phần này chậm lại vì ${ten} làm bạn dè dặt hơn.`, ctx);
          kiem(ly.includes('TEN_NGOAI_GOI'), `GROUND-02 oracle: ${ten} chỉ ở d.sao mà câu nhắc nó lọt guard — "${cauHoi}"`);
        }
      }
    }
    kiem(soDotBienBat > 0, `GROUND-04 đột biến d.sao không bị oracle bắt ở ca nào (${soCa} ca)`);
    kiem(soChiMeta > 0, 'GROUND-02 oracle: bộ ca không có tên nào chỉ ở d.sao — ca kiểm rỗng');
    // G: thước đo "tên ngoài gói" của eval dùng oracle render, không dùng chung tập với guard.
    {
      const cauHoi = 'Sức khỏe của tôi năm nay thế nào?';
      const kh = lapKeHoachFocused({ cauHoi, lichSu: [], saoTheoCung: saoChinhTheoCung(dsLaSo[0]), namXem: 2026, thangXem: 8 }).keHoach;
      const nG: NghiengVe = {
        ...(tinhNghiengVe({ laSo: dsLaSo[0], chuDe: kh.chuDe, lopHan: kh.lopHan, namXem: 2026, thangXem: 8, focused: true }) as NghiengVe),
        cachCuc: ['Sát Phá Tham'],
        dauMoc: [
          { ten: 'Thiên Y', lop: 'nen', huong: 'do', trong: 1, y: 'có người đỡ khi cơ thể mệt' },
          { ten: 'Thiên Phủ', lop: 'nen', huong: 'do', trong: 2, y: 'giữ được nền' },
        ],
      };
      const dkG: DuKienLaSo[] = [{ id: 'F001', loai: 'cung', noiDung: 'Tật Ách có Thiên Phủ.', cung: 'Tật Ách', sao: ['Thiên Phủ', 'Thiên Y'] }];
      const pG = {
        goi: dungGoiBangChung(cauHoi, kh, dkG, []), cauHoiGoc: cauHoi, lichSu: [], daNoiTruoc: [], nghieng: nG,
        phanLoai: { khuon: 'B' as const, loaiSuKien: 'trung-tinh' as const, sau: false }, mucAnToan: 'NORMAL' as const,
        moc: { bayGio, thoiGian: { namHieuLuc: 2026, thang: null, cuoiNam: false } }, laTiepTuChip: false, cauMa: [],
      };
      const ngoai = tenNgoaiModelThay(['Thiên Y giữ lại phần này.'], pG, false);
      kiem(ngoai.includes('Thiên Y'), `G: tên chỉ ở d.sao không bị thước đo eval bắt: ${ngoai.join(',')}`);
      kiem(tenNgoaiModelThay(['Thiên Phủ giữ nền cho bạn.'], pG, false).length === 0, 'G: tên đã in trong chữ dữ kiện bị báo ngoài gói');
      kiem(tenNgoaiModelThay(['Thế Sát Phá Tham khiến bạn hay quá sức.'], pG, false).length === 0, 'G: cách cục in trong khối nghiêng bị báo ngoài gói');
      kiem(tenNgoaiModelThay(['Thiên Y là sao giải bệnh.'], { ...pG, cauHoiGoc: 'Thiên Y là sao gì?' }, true).length === 0, 'G: tra cứu đích danh bị báo ngoài gói');
      kiem(tenTrongChu('Cách cục đọc được ở phần này: Sát Phá Tham, Cơ Nguyệt Đồng Lương.', false).has(khoaTen('Cơ Nguyệt Đồng Lương')), 'G: oracle không đọc được dòng cách cục');
    }
    console.log(`oracle prompt: ${soCa} ca, đột biến d.sao bị bắt ở ${soDotBienBat} ca, ${soChiMeta} câu tên chỉ-metadata bị loại`);
  }

  const moc = khoiMoc({
    bayGio: { nam: 2026, thang: 8, ngay: 10 } as never,
    thoiGian: { namHieuLuc: 2026, thang: thangAmTest(2026, 3), cuoiNam: false },
  });
  kiem(moc.includes('ĐÃ QUA') && moc.includes('Bính Ngọ') && moc.includes('còn 4 tháng'), `khối mốc thiếu: ${moc}`);
  // Khối THỜI GIAN (spec v2 §3.4): cùng chiều thì nói gộp, không giảng lịch; khác chiều thì tả hai phần, nêu mốc ngày.
  {
    const bg = { nam: 2026, thang: 8, ngay: 23 } as never; // 4/10/2026
    const tg = { namHieuLuc: 2026, thang: thangDuongTest(2026, 10), cuoiNam: false };
    const gop = khoiMoc({ bayGio: bg, thoiGian: tg, huongThang: { kieu: 'mot-chieu', nhom: 'thuan', cuaSo: ['W1', 'W2'] }, maTheoCuaSo: { W1: ['F004', 'F002'], W2: ['F005', 'F002'] } });
    kiem(
      gop.includes('tháng 10/2026 dương lịch') && gop.includes('phủ hai tháng âm') && gop.includes('W1: 01/10–09/10, thuộc tháng 8 âm') &&
        gop.includes('W2: 10/10–31/10, thuộc tháng 9 âm') && gop.includes('CÙNG CHIỀU') && gop.includes('KHÔNG giải thích âm/dương lịch') &&
        gop.includes('căn cứ F005, F002'),
      `khối thời gian cùng chiều sai:\n${gop}`
    );
    const tach = khoiMoc({
      bayGio: bg, thoiGian: tg,
      huongThang: { kieu: 'hai-nua', theoCuaSo: [{ cuaSo: 'W1', nhom: 'vuong' }, { cuaSo: 'W2', nhom: 'thuan' }] },
      maTheoCuaSo: { W1: ['F004', 'F002'], W2: ['F005', 'F002'] },
    });
    kiem(
      tach.includes('KHÁC CHIỀU') && tach.includes('đến khoảng 9/10') && tach.includes('"timeRefs"') && tach.includes('chiều: vướng') &&
        tach.includes('Không cộng, không chấm điểm'),
      `khối thời gian khác chiều sai:\n${tach}`
    );
    const mot = khoiMoc({ bayGio: bg, thoiGian: { namHieuLuc: 2026, thang: thangAmTest(2026, 9), cuoiNam: false }, huongThang: { kieu: 'mot-chieu', nhom: 'ngang', cuaSo: ['W1'] } });
    kiem(mot.includes('tháng 9 âm lịch năm 2026 (10/10/2026–08/11/2026 dương lịch)') && mot.includes('nói về cả tháng'), `khối thời gian tháng âm sai:\n${mot}`);
  }
  // D đọc mức năm: khối mốc không tự mời "còn N tháng" / "Sau Tết" (celes-domain 04/10).
  const mocD = khoiMoc(
    { bayGio: { nam: 2026, thang: 8 } as never, thoiGian: { namHieuLuc: 2026, thang: null, cuoiNam: false } as never, doiDaiVanSauTet: true },
    'D'
  );
  kiem(mocD.includes('Bính Ngọ') && !/còn \d+ tháng|Sau Tết/u.test(mocD), `khối mốc D còn mốc nhỏ hơn năm: ${mocD}`);

  // "Khi nào" thật → D; cụm thói quen ("… nào cũng", "chưa bao giờ") không phải hỏi mốc (eval 04/10 ca 05).
  for (const [cau, d] of [
    ['Khi nào tôi có việc mới?', true],
    ['khi nao toi co viec moi', true],
    ['Năm 2027 tháng nào tôi có việc?', true],
    ['Năm nào cũng vất vả, năm nay tiền bạc ra sao?', false],
    ['Lúc nào cũng mệt, năm nay sức khỏe tôi thế nào?', false],
    ['Tôi chưa bao giờ có người yêu, năm nay có không?', false],
    ['nam nao cung vat va, nam nay tien bac ra sao', false],
    ['Chưa bao giờ có người yêu, khi nào tôi mới có?', true],
  ] as const) {
    kiem(laHoiKhiNao(cau) === d, `laHoiKhiNao("${cau}") phải ${d}`);
  }
  for (const [cau, bat] of [
    ['Cuối năm công việc mở hơn.', true],
    ['Sau Tết bạn dễ có việc.', true],
    ['Quý ba là lúc thuận.', true],
    ['Mùa thu dễ có tin vui.', true],
    ['Vài tháng tới đường việc mở.', true],
    ['Năm 2026 mở hơn cho việc mới.', false],
    ['Lượt này chưa chọn ra tháng nào.', false],
    ['Việc học theo mùa thi dễ căng.', false],
  ] as const) {
    kiem(MOC_NHO_HON_NAM.test(cau) === bat, `MOC_NHO_HON_NAM("${cau}") phải ${bat}`);
  }

}

/* ------------------------------------------- 4. nối vào tra-loi (mục 8) */

{
  // Hàm thuần của phần nối.
  const tuoi = tuoiTrongGoi({
    duKien: [
      { id: 'F001', loai: 'dai-van', noiDung: 'Đại vận 33–42 tuổi đóng tại cung Quan Lộc' },
      { id: 'F002', loai: 'luu-nien', noiDung: 'Năm 2026 (37 tuổi âm) tiểu hạn tại cung Tài Bạch' },
    ] as DuKienLaSo[],
  });
  kiem(JSON.stringify(tuoi) === '[[33,42],[37,37]]', `tuoiTrongGoi sai: ${JSON.stringify(tuoi)}`);

  // N1: tháng thêm đại vận + lưu niên, trên BẢN SAO; câu không phải tháng giữ nguyên đối tượng.
  const khThang = lapKeHoach({ cauHoi: 'Tháng 10 công việc của tôi thế nào?', saoTheoCung: saoChinhTheoCung(dsLaSo[0]) });
  const lopCu = [...khThang.lopHan];
  const n1 = themLopChoThang(khThang);
  kiem(khThang.phamViThoiGian === 'thang' && (n1.lopHan.includes('dai-van') && n1.lopHan.includes('luu-nien')), 'N1 không thêm lớp');
  kiem(JSON.stringify(khThang.lopHan) === JSON.stringify(lopCu), 'N1 sửa thẳng kế hoạch gốc');
  const khNam = lapKeHoach({ cauHoi: 'Tính cách tôi thế nào?', saoTheoCung: saoChinhTheoCung(dsLaSo[0]) });
  kiem(themLopChoThang(khNam) === khNam, 'N1 chạm câu không phải tháng');
}

/* -------------------- 5. FINAL HARDENING 04/10/2026 — docs/chien-luoc/CEL-186-INVARIANTS.md */

{
  const tre = lapLaSo({ ngay: 22, thang: 5, nam: 2026, gio: 16, gioiTinh: 'nu' });
  const lon = dsLaSo[0]; // 12/5/1990 nam
  const keHoachVa = (laSo: LaSo, cauHoi: string, namXem = 2026) => {
    const kh = lapKeHoachFocused({ cauHoi, lichSu: [], saoTheoCung: saoChinhTheoCung(laSo), namXem, thangXem: 8 }).keHoach;
    return { kh, tg: boiCanhThoiGian({ cauHoi, keHoach: kh, namXem, bayGio }) };
  };

  // TIME-03: ngày cuối tháng âm — biên của mọi phép so trước sinh.
  kiem(ngayCuoiThangAm(2025, 6)?.toISOString().slice(0, 10) === '2025-07-24', `ngày cuối tháng 6 âm 2025: ${ngayCuoiThangAm(2025, 6)?.toISOString()}`);
  kiem(ngayCuoiThangAm(2025, 6, true)?.toISOString().slice(0, 10) === '2025-08-22', `ngày cuối tháng 6 nhuận 2025: ${ngayCuoiThangAm(2025, 6, true)?.toISOString()}`);
  kiem(ngayCuoiThangAm(2026, 3, true) === null, 'tháng nhuận không tồn tại phải null');
  kiem(ngayCuoiNamAm(2025)?.toISOString().slice(0, 10) === '2026-02-16', `ngày cuối năm âm 2025: ${ngayCuoiNamAm(2025)?.toISOString()}`);
  // TIME-04: quy đổi chồng lấn chọn tất định — hai lần gọi cùng kết quả.
  kiem(JSON.stringify(cuaSoAmCuaThangDuong(2026, 1, HOM_NAY_TEST)) === JSON.stringify(cuaSoAmCuaThangDuong(2026, 1, HOM_NAY_TEST)), 'cửa sổ tháng dương không tất định');

  // AGE-01 — bảng biên trước sinh (lá số 22/5/2026).
  for (const [cauHoi, chan] of [
    ['Tháng 6 năm 2025 công việc của tôi thế nào?', true], // ca thật A/B
    ['Năm 2025 sức khỏe của tôi thế nào?', true], // năm trước năm sinh
    ['Tháng 3 năm 2026 sức khỏe của tôi thế nào?', true], // cùng năm, tháng dương trước tháng sinh
    ['Tháng 3 âm năm 2026 sức khỏe của tôi thế nào?', true], // tháng 3 âm 2026 hết 16/5 < 22/5
    ['Tháng 5 năm 2026 sức khỏe của tôi thế nào?', false], // tháng chứa ngày sinh vẫn đọc
    ['Tháng 6 năm 2026 sức khỏe của tôi thế nào?', false],
    ['Năm 2026 sức khỏe của tôi thế nào?', false],
    ['Sức khỏe của tôi thế nào?', false], // không gọi mốc
  ] as const) {
    const { kh, tg } = keHoachVa(tre, cauHoi);
    const c = chanTruocSinh(tre, tg, kh, 'vi');
    kiem(!!c === chan, `AGE-01 "${cauHoi}" chặn=${!!c}, cần ${chan}`);
    if (c) kiem(!c.goiModel && c.chip.length === 1 && c.cau.includes('22/5/2026') && c.cau.includes('trước ngày sinh'), `AGE-01 câu sai: ${c.cau}`);
  }
  // AGE-01 EN: năm tiếng Anh vào namMucTieu ở lớp Focused; câu không gọi năm giữ nguyên.
  for (const [cauHoi, nam] of [
    ['How was my health in 2025?', 2025],
    ['Will 2027 be good for my career?', 2027],
    ['How is my career this year?', undefined],
    ['Năm 2025 sức khỏe của tôi thế nào?', 2025],
  ] as const) {
    const kh = lapKeHoachChinh({ cauHoi, namXem: 2026, thangXem: 8 } as never);
    kiem(kh.namMucTieu === nam, `AGE-01 năm EN "${cauHoi}" ra ${kh.namMucTieu}, cần ${nam}`);
  }
  // AGE-01 × lá số người lớn: không chặn mốc sau sinh.
  kiem(!chanTruocSinh(lon, keHoachVa(lon, 'Tháng 6 năm 2025 công việc của tôi thế nào?').tg, keHoachVa(lon, 'Tháng 6 năm 2025 công việc của tôi thế nào?').kh, 'vi'), 'AGE-01 chặn nhầm lá số 1990');
  kiem(!!chanTruocSinh(lon, keHoachVa(lon, 'Năm 1985 tôi thế nào?', 2026).tg, keHoachVa(lon, 'Năm 1985 tôi thế nào?', 2026).kh, 'vi'), 'AGE-01 năm 1985 trên lá số 1990 không chặn');
  {
    const { kh, tg } = keHoachVa(tre, 'Tháng 6 năm 2025 công việc của tôi thế nào?');
    const en = chanTruocSinh(tre, tg, kh, 'en');
    kiem(!!en && !conChuViet(en.cau), `AGE-01 EN còn chữ Việt: ${en?.cau}`);
  }

  // AGE-02 — 0 tuổi hỏi chuyện người lớn: chặn; chuyện học / tính cách / sức khoẻ: không.
  for (const [cauHoi, chan] of [
    ['Năm nay công việc của tôi thế nào?', true],
    ['Năm nay tôi có người yêu không?', true],
    ['Bao giờ tôi kết hôn?', true],
    ['Chồng tôi năm nay thế nào?', true],
    ['Năm nay tôi có thăng chức không?', true],
    ['Tính cách của tôi thế nào?', false],
    ['Sức khỏe năm nay của tôi thế nào?', false],
    ['Năm nay tôi học hành thế nào?', false],
    ['Bố tôi năm nay thế nào?', false],
  ] as const) {
    const { kh, tg } = keHoachVa(tre, cauHoi);
    const c = chanChuaHopTuoi(tre, tg, cauHoi, kh, nhanDangDoiTuong(cauHoi), 'vi');
    kiem(!!c === chan, `AGE-02 "${cauHoi}" (chủ đề ${kh.chuDe}) chặn=${!!c}, cần ${chan}`);
    // Lá số người lớn không bao giờ bị chặn vì tuổi.
    const l = keHoachVa(lon, cauHoi);
    kiem(!chanChuaHopTuoi(lon, l.tg, cauHoi, l.kh, nhanDangDoiTuong(cauHoi), 'vi'), `AGE-02 chặn nhầm người lớn: "${cauHoi}"`);
  }
  kiem(tuoiAmTai(tre, 2026) === 1 && TUOI_NGUOI_LON === 15, 'AGE-02 tuổi âm năm sinh phải là 1');
  {
    const { kh, tg } = keHoachVa(tre, 'Năm nay công việc của tôi thế nào?');
    const c = chanChuaHopTuoi(tre, tg, 'Năm nay công việc của tôi thế nào?', kh, null, 'en');
    kiem(!!c && !conChuViet(c.cau) && c.chip.every((x) => !conChuViet(x)), `AGE-02 EN còn chữ Việt: ${c?.cau} | ${c?.chip.join('|')}`);
    // AGE-03: năm 2045 lá số này 20 tuổi âm → đọc chuyện việc làm bình thường.
    const sau = keHoachVa(tre, 'Năm 2045 công việc của tôi thế nào?');
    kiem(!chanChuaHopTuoi(tre, sau.tg, 'Năm 2045 công việc của tôi thế nào?', sau.kh, null, 'vi'), 'AGE-03 năm 2045 (20 tuổi) vẫn chặn');
  }
  // phan-bien 04/10 S1/S3/L2/L6: lá số trẻ — câu cả đời, câu về người lớn khác, câu học, lượt hai.
  {
    const con = lapLaSo({ ngay: 10, thang: 3, nam: 2016, gio: 8, gioiTinh: 'nam' });
    for (const [cauHoi, chan] of [
      ['Sau này cháu hợp nghề gì, sự nghiệp ra sao?', false], // S1 giai-doan
      ['Tôi hợp nghề gì?', false], // thiên hướng
      ['Cả đời tình duyên của tôi thế nào?', false], // giai-doan
      ['Bố tôi năm nay công việc thế nào?', false], // S3 người khác → F2
      ['Bố mẹ tôi có ly hôn không?', false], // S3 Phụ Mẫu
      ['Chị tôi sắp lấy chồng, năm nay thế nào?', false], // S3
      ['Năm nay công việc của tôi thế nào?', true],
      ['Năm nay tôi có người yêu không?', true],
    ] as const) {
      const { kh, tg } = keHoachVa(con, cauHoi);
      const c = chanChuaHopTuoi(con, tg, cauHoi, kh, nhanDangDoiTuong(cauHoi), 'vi');
      kiem(!!c === chan, `AGE-02 lá số 2016 "${cauHoi}" (${kh.phamViThoiGian}/${kh.chuDe}) chặn=${!!c}, cần ${chan}`);
    }
    // L6: "work" trần trong câu học không bị chặn.
    const hoc = keHoachVa(con, 'Will my studies work out this year?');
    kiem(!chanChuaHopTuoi(con, hoc.tg, 'Will my studies work out this year?', hoc.kh, null, 'en'), 'AGE-02 EN "work out" bị chặn');
    // L2: lượt hai (theoChuDe = false) chỉ xét từ khoá — chủ đề do model đoán không làm chặn.
    const quy = keHoachVa(con, 'Năm nay tôi có gặp quý nhân không?');
    kiem(!chanChuaHopTuoi(con, quy.tg, 'Năm nay tôi có gặp quý nhân không?', { ...quy.kh, chuDe: 'su-nghiep' }, null, 'vi', false), 'AGE-02 lượt hai chặn theo chủ đề model');
  }
  // phan-bien 04/10 S2: lá số sinh sau hôm nay, câu không gọi mốc → không chặn; gọi mốc trước sinh → chặn.
  {
    const sap = lapLaSo({ ngay: 15, thang: 3, nam: 2027, gio: 8, gioiTinh: 'nu' });
    const a = keHoachVa(sap, 'Tính cách của tôi thế nào?');
    kiem(!chanTruocSinh(sap, a.tg, a.kh, 'vi'), 'AGE-01 lá số tương lai chặn câu không có mốc');
    const b = keHoachVa(sap, 'Năm nay công việc của tôi thế nào?');
    kiem(!!chanTruocSinh(sap, b.tg, b.kh, 'vi'), 'AGE-01 lá số tương lai không chặn "năm nay"');
  }
  // Ca chéo tháng × trước sinh × tuổi: trước sinh thắng (không kể tuổi khi chưa sinh).
  {
    const cauHoi = 'Tháng 3 năm 2026 tôi có người yêu không?';
    const { kh, tg } = keHoachVa(tre, cauHoi);
    kiem(!!chanTruocSinh(tre, tg, kh, 'vi'), 'chéo tháng × trước sinh: không chặn');
  }

  // PERSON-03 đã bỏ (04/10): "chồng tôi" trên lá số nam đi đường thường, không dừng lượt.
  // Chip "bạn đời của tôi" vẫn đọc đúng cung Phu Thê.
  {
    const { kh } = keHoachVa(lon, 'Chuyện bạn đời của tôi năm nay thế nào?');
    kiem(kh.chuDe === 'tinh-cam' && kh.cungLienQuan[0] === 'Phu Thê', `chip bạn đời ra ${kh.chuDe}/${kh.cungLienQuan[0]}`);
  }

  // TOPIC-01..03.
  const chuDeVa = (cauHoi: string) => {
    const kh = lapKeHoachChinh({ cauHoi, saoTheoCung: saoChinhTheoCung(lon), namXem: 2026, thangXem: 8 });
    return `${kh.chuDe}/${kh.cungLienQuan[0] ?? ''}`;
  };
  for (const [cauHoi, can] of [
    ['Bản thân tôi năm nay công việc thế nào?', /^su-nghiep\//u],
    ['Ban than toi nam nay cong viec the nao?', /^su-nghiep\//u],
    ['Bản thân tôi là người thế nào?', /^tong-quan\//u],
    ['Nhà cửa năm nay của tôi thế nào?', /^gia-dao\/Điền Trạch$/u],
    ['Chỗ ở của tôi năm nay có ổn không?', /^gia-dao\/Điền Trạch$/u],
    ['Năm nay tôi có nên chuyển nhà không?', /^gia-dao\/Điền Trạch$/u],
    ['Năm nay tôi có mua được nhà không?', /^tai-chinh\//u],
    ['Năm nay tôi có nên vay mua nhà không?', /^tai-chinh\//u],
    ['Đầu tư bất động sản năm nay thế nào?', /^tai-chinh\//u],
    ['Nhà cửa và tiền bạc của tôi năm nay?', /^tai-chinh\//u],
    // phan-bien 04/10 L4: gõ không dấu "vay" (vậy) / "thuan tien" không phải chữ tiền.
    ['nha cua toi nam nay the nao vay', /^gia-dao\/Điền Trạch$/u],
    ['cho o nam nay co thuan tien khong', /^gia-dao\/Điền Trạch$/u],
  ] as const) {
    const ra = chuDeVa(cauHoi);
    kiem(can.test(ra), `TOPIC "${cauHoi}" ra ${ra}`);
  }

}

async function kiemNoi() {
  const laSo = dsLaSo[0];
  const vaoGoc = { laSo, namXem: 2026, thangXem: 8, ghiNhatKy: false, dungModelPhanLoai: false } as const;
  const cu = process.env.CELES_FOCUSED_CHAT;
  try {
    // Cờ đọc MỖI lượt, không chụp lúc nạp mô-đun.
    process.env.CELES_FOCUSED_CHAT = '0';
    kiem(!focusedBat(), 'cờ "0" vẫn bật Focused');
    delete process.env.CELES_FOCUSED_CHAT;
    kiem(!focusedBat(), 'thiếu cờ vẫn bật Focused');
    process.env.CELES_FOCUSED_CHAT = '1';
    kiem(focusedBat(), 'cờ "1" không bật Focused');

    // F2 đi trọn đường qua traLoiCoCanCu: hỏi lại, không truy hồi, không gọi model, KHÔNG tính lượt.
    const f2 = (await traLoiCoCanCu({ ...vaoGoc, cauHoi: 'Bố tôi năm nay sức khỏe thế nào?' })) as KetQuaFocused;
    kiem(f2.provider === 'ma' && f2.model === 'focused-f2', `F2 ra ${f2.provider}/${f2.model}`);
    kiem(f2.khongTinhLuot === true, 'F2 hỏi lại mà vẫn tính lượt');
    kiem(!!f2.van && f2.van.startsWith('Để Celes không luận vận riêng'), `F2 văn sai: ${f2.van.slice(0, 60)}`);
    kiem(!/Lá số này là của bạn/u.test(f2.van), 'F2 còn câu cũ "Lá số này là của bạn"');
    kiem((f2.coCauTruc?.goiYTiep ?? [])[0] === 'Người có lá số này năm nay sức khỏe thế nào?', `F2 chip đầu: ${f2.coCauTruc?.goiYTiep?.[0]}`);
    kiem((f2.coCauTruc?.goiYTiep ?? []).some((c) => c.includes('hợp nhau')), 'F2 thiếu chip quan hệ');
    // Route đọc mấy trường này ở nhánh quản trị — thiếu là 502 (mục 13.3).
    kiem(Array.isArray(f2.goi.duKien) && Array.isArray(f2.goi.bangChung), 'F2 gói thiếu trường');
    kiem(!!f2.phienBan.engine && !!f2.phienBan.phuongPhap && f2.phienBan.focused === 'F2', 'F2 phienBan thiếu khoá');
    kiem(f2.kiemDuyet === null && f2.runId === null, 'F2 có kiểm duyệt / runId');

    // D không còn dừng bằng mã: hai câu trong ảnh UAT 04/10 phải đi tiếp tới truy hồi / model.
    // (Offline không có model nên lượt có thể hỏng sau đó — chỉ cần KHÔNG phải câu mã.)
    for (const cauHoi of ['Khi nào tôi có việc mới?', 'hiện tại tôi đang thất nghiệp, khi nào thì tìm đc việc mới']) {
      const r = await traLoiCoCanCu({ ...vaoGoc, cauHoi }).catch(() => null);
      kiem(!r || r.provider !== 'ma', `"${cauHoi}" vẫn dừng bằng mã: ${r?.model}`);
    }

    // AGE-01/02 đầu-cuối: dừng bằng mã TRƯỚC truy hồi (gói rỗng), không model, hoàn lượt.
    {
      const tre = lapLaSo({ ngay: 22, thang: 5, nam: 2026, gio: 16, gioiTinh: 'nu' });
      for (const [vao, model] of [
        [{ ...vaoGoc, laSo: tre, cauHoi: 'Tháng 6 năm 2025 công việc của tôi thế nào?' }, 'focused-truoc-sinh'],
        [{ ...vaoGoc, laSo: tre, cauHoi: 'Năm nay công việc của tôi thế nào?' }, 'focused-chua-hop-tuoi'],
        [{ ...vaoGoc, laSo: tre, cauHoi: 'Năm nay tôi có người yêu không?' }, 'focused-chua-hop-tuoi'],
        [{ ...vaoGoc, laSo: tre, cauHoi: 'This year, how is my work going?', ngonNgu: 'en' as const }, 'focused-chua-hop-tuoi'],
        // UAT U18: năm gọi bằng tiếng Anh — planner chỉ đọc tiếng Việt, lớp Focused tự đọc năm.
        [{ ...vaoGoc, laSo: tre, cauHoi: 'How was my health in 2025?', ngonNgu: 'en' as const }, 'focused-truoc-sinh'],
      ] as const) {
        const r = await traLoiFocused(vao, phienBanHienTai, async () => [], bayGio);
        kiem(r.provider === 'ma' && r.model === model && r.khongTinhLuot === true && r.goi.duKien.length === 0,
          `"${vao.cauHoi}" ra ${r.provider}/${r.model} hoàn=${r.khongTinhLuot} dữ kiện=${r.goi.duKien.length}`);
        if ('ngonNgu' in vao) kiem(!conChuViet(r.van), `EN câu mã còn chữ Việt: ${r.van}`);
      }
      // Chip kế thừa × mốc tường minh: chip "Năm nay" nối sau câu trước sinh vẫn bị xét lại (năm 2026 hợp lệ).
      const chip = await traLoiFocused(
        { ...vaoGoc, laSo: tre, cauHoi: 'Sức khỏe năm nay thế nào?', laTiepTuChip: true, lichSu: [{ vaiTro: 'nguoi-dung', noiDung: 'Tháng 6 năm 2025 sức khỏe của tôi thế nào?' }] },
        phienBanHienTai, async () => [], bayGio
      ).catch(() => null);
      kiem(!chip || chip.model !== 'focused-truoc-sinh', `chip năm nay sau câu trước sinh vẫn bị chặn trước sinh: ${chip?.model}`);
    }

    // L2: SENSITIVE nối miễn trừ cả ở lượt trả bằng mã.
    const nhay = await traLoiCoCanCu({ ...vaoGoc, cauHoi: 'Bố tôi năm nay sức khỏe thế nào?', mucAnToan: 'SENSITIVE' });
    kiem(nhay.van.length > f2.van.length && nhay.van.startsWith(f2.van), 'F2 SENSITIVE thiếu lời miễn trừ');

    // Tháng 8/2025 dương phần lớn là tháng 6 nhuận → dừng bằng câu mã, không chip, không đọc tháng thường.
    const nh = await traLoiFocused(
      { ...vaoGoc, namXem: 2025, cauHoi: 'Tháng 8 năm 2025 công việc của tôi thế nào?' },
      phienBanHienTai,
      async () => [],
      bayGio
    );
    kiem(
      nh.model === 'focused-nhuan-chua-tach' && (nh.coCauTruc?.goiYTiep ?? []).length === 0 && nh.goi.duKien.length === 0,
      `8/2025 ra ${nh.model}`
    );

    // Đã chọn tháng nhuận (chip hoặc gõ thẳng): engine chưa tách nguyệt hạn tháng
    // nhuận → fail closed bằng câu mã, KHÔNG truy hồi / gọi model / đọc tháng thường.
    const goc6 = 'Tháng 6 năm 2025 công việc của tôi thế nào?';
    for (const [cauHoi, lichSu] of [
      ['Tháng 6 nhuận năm 2025', [{ vaiTro: 'nguoi-dung' as const, noiDung: goc6 }]],
      ['Tháng 6 nhuận năm 2025 công việc của tôi thế nào?', []],
    ] as const) {
      const r = await traLoiFocused({ ...vaoGoc, namXem: 2025, cauHoi, laTiepTuChip: lichSu.length > 0, lichSu: [...lichSu] }, phienBanHienTai, async () => [], bayGio);
      kiem(r.provider === 'ma' && r.model === 'focused-nhuan-chua-tach', `"${cauHoi}" ra ${r.provider}/${r.model}, cần fail closed`);
      kiem(
        r.van ===
          'Tháng 6 nhuận năm 2025 cần được đọc riêng với tháng 6 thường. Hiện Celes chưa tách được hai mốc này, nên chưa luận tháng nhuận để tránh đọc nhầm.',
        `"${cauHoi}" văn sai: ${r.van}`
      );
      kiem(r.goi.duKien.length === 0, `"${cauHoi}" vẫn có dữ kiện — đã đọc tháng thường`);
      kiem((r.coCauTruc?.goiYTiep ?? []).join('|') === 'Tháng 6 âm năm 2025', `"${cauHoi}" chip sai: ${(r.coCauTruc?.goiYTiep ?? []).join('|')}`);
    }
    // Chip "Tháng 6" (thường) vẫn đi đường đọc bình thường, không bị chặn.
    {
      const chipThuong = 'Tháng 6 âm năm 2025';
      const k = lapKeHoachFocused({ cauHoi: chipThuong, laTiepTuChip: true, lichSu: [{ vaiTro: 'nguoi-dung', noiDung: goc6 }], saoTheoCung: saoChinhTheoCung(laSo), namXem: 2025, thangXem: 8 }).keHoach;
      const b = boiCanhThoiGian({ cauHoi: chipThuong, keHoach: k, namXem: 2025, bayGio });
      kiem(
        b.thang?.muc.loai === 'thang-am' && !b.thang.muc.nhuan && b.thang.muc.thangAm === 6,
        `chip thường "${chipThuong}" ra ${JSON.stringify(b.thang?.muc)}`
      );
    }

    // Ca bổ sung 10 (spec 5.3): trượt luật cứng → viết lại TOÀN bài đúng một lần → vẫn trượt thì văn rỗng (502 + hoàn lượt).
    const cauHoi = 'Năm nay công việc của tôi thế nào?';
    const kh = lapKeHoachFocused({ cauHoi, lichSu: [], saoTheoCung: saoChinhTheoCung(laSo), namXem: 2026, thangXem: 8 }).keHoach;
    const dk = [{ id: 'F001', loai: 'cung' as const, noiDung: 'Quan Lộc có Thiên Phủ.', cung: 'Quan Lộc' }];
    const thoiGian = { namHieuLuc: 2026, thang: null, cuoiNam: false };
    const phanLoai = { khuon: 'A' as const, loaiSuKien: 'trung-tinh' as const, sau: false };
    const promptGia = {
      goi: dungGoiBangChung(cauHoi, kh, dk, []), cauHoiGoc: cauHoi, lichSu: [], daNoiTruoc: [], nghieng: null,
      phanLoai, mucAnToan: 'NORMAL' as const, moc: { bayGio, thoiGian }, laTiepTuChip: false, cauMa: [],
    };
    const ctxGia: NguCanhKiem = {
      cauHoi, phanLoai, mucAnToan: 'NORMAL', chuDe: 'su-nghiep', doiTuong: null,
      tapTen: tapTenTuGoi(dk), phucDucLaSao: false, maHopLe: new Set(['F001']), maNguonHopLe: new Set(), nghieng: null,
      thoiGian, tuoiHopLe: [], cauMa: [], chipTruoc: [], ...MOC_2026,
    };
    const traGia = (ds: object[], users: string[]) => {
      let i = 0;
      return async (req: { user: string }) => {
        users.push(req.user);
        const text = JSON.stringify(ds[Math.min(i++, ds.length - 1)]);
        return { text, provider: 'gemini', model: 'gia', tokensIn: 7, tokensOut: 3, daThuHong: [] };
      };
    };
    const banMaLa = { answer: 'Năm nay công việc khá ổn.', claims: [{ claim: 'ổn', evidenceIds: ['F999'] }], suggestedQuestions: [] };
    const banSach = { answer: 'Năm nay công việc khá ổn, có nền đỡ.', claims: [{ claim: 'ổn', evidenceIds: ['F001'], direction: 'thuan' }], suggestedQuestions: ['Còn tiền bạc thì sao?'] };
    {
      const users: string[] = [];
      const kq10 = await chayFocused({ prompt: promptGia, ctx: ctxGia, goi: traGia([banMaLa], users) as never });
      kiem(users.length === 2 && kq10.vet.lanGoi === 2, `ca 10 gọi ${users.length} lần, cần đúng 2`);
      kiem(kq10.van === '' && kq10.banNhap === null && kq10.vet.thuLai === 'MA_KHONG_HOP_LE,KHONG_CAN_CU', `ca 10 ra văn "${kq10.van.slice(0, 40)}" / thuLai ${kq10.vet.thuLai}`);
      kiem(users[1].includes('Viết lại TOÀN BỘ') && !users[0].includes('Viết lại TOÀN BỘ'), 'lần hai không mang khối viết lại');
      kiem(kq10.vet.lan.length === 2 && kq10.vet.lan[0].tokVao === 7 && kq10.vet.lan[1].loi.length > 0, `vết lần gọi: ${JSON.stringify(kq10.vet.lan)}`);
    }
    {
      const users: string[] = [];
      const kq = await chayFocused({ prompt: promptGia, ctx: ctxGia, goi: traGia([banMaLa, banSach], users) as never });
      kiem(users.length === 2 && kq.van === banSach.answer && kq.vet.loi.length === 0, `viết lại sạch không ra văn: "${kq.van}"`);
      kiem(kq.chip.includes('Còn tiền bạc thì sao?') && kq.banNhap?.claims[0].direction === 'thuan', `viết lại sạch: chip/claims sai ${kq.chip}`);
    }
    {
      const users: string[] = [];
      const kq = await chayFocused({ prompt: promptGia, ctx: ctxGia, goi: traGia([banSach], users) as never });
      kiem(users.length === 1 && kq.van === banSach.answer && kq.vet.thuLai === null, `bản sạch vẫn viết lại: ${users.length}`);
      // CEL-191 §7: bản nháp chỉ có lỗi tầng C → trả nguyên văn, không viết lại, không 502, vết có điểm C.
      const usersC: string[] = [];
      const banC = { ...banSach, answer: 'Tóm lại, năm nay công việc khá ổn, chắc chắn là có nền đỡ.' };
      const kqC = await chayFocused({ prompt: promptGia, ctx: ctxGia, goi: traGia([banC], usersC) as never });
      kiem(usersC.length === 1 && kqC.van === banC.answer && kqC.vet.thuLai === null && kqC.vet.loi.length === 0, `chỉ lỗi C mà vẫn viết lại / 502: ${usersC.length} "${kqC.van}"`);
      kiem(kqC.vet.diemC.some((d) => d.ma === 'GIONG_BAO_CAO') && kqC.vet.diemC.some((d) => d.ma === 'PHAN_QUYET'), `vết thiếu điểm C: ${JSON.stringify(kqC.vet.diemC)}`);
      const bd = await chayFocused({ prompt: promptGia, ctx: ctxGia, goi: traGia([{ ...banSach, answer: '**Năm nay** công việc khá ổn.' }], []) as never });
      kiem(bd.van === 'Năm nay công việc khá ổn.', `markdown không bị bỏ: ${bd.van}`);
      const cm = await chayFocused({ prompt: promptGia, ctx: { ...ctxGia, cauMa: ['Câu mã.'] }, goi: traGia([banSach], []) as never });
      kiem(cm.van === `Câu mã.\n\n${banSach.answer}`, `câu mã không đứng đầu: ${JSON.stringify(cm.van)}`);
      const nh = await chayFocused({ prompt: promptGia, ctx: { ...ctxGia, mucAnToan: 'SENSITIVE' }, goi: traGia([banSach], []) as never });
      kiem(nh.van === datMienTruTamLy(banSach.answer), 'SENSITIVE thiếu miễn trừ');
    }
    {
      // JSON gãy hai lần → 502.
      const users: string[] = [];
      const goiGay = async (req: { user: string }) => (users.push(req.user), { text: 'không phải json', provider: 'gemini', model: 'gia', tokensIn: 1, tokensOut: 1, daThuHong: [] });
      const kq = await chayFocused({ prompt: promptGia, ctx: ctxGia, goi: goiGay as never });
      kiem(users.length === 2 && kq.van === '' && kq.vet.thuLai === 'SCHEMA', `JSON gãy: ${users.length} lần / ${kq.vet.thuLai}`);
    }
    {
      // Còn < 16 giây thì không viết lại.
      const users: string[] = [];
      const kq = await chayFocused({ prompt: promptGia, ctx: ctxGia, batDau: Date.now() - 40_000, goi: traGia([banMaLa], users) as never });
      kiem(users.length === 1 && kq.van === '', `hết giờ vẫn viết lại: ${users.length}`);
    }

    // Vết Preview (CEL-186 v2, commit A — spec 5.4).
    {
      const dong: string[] = [];
      const ghi = (d: string) => dong.push(d);
      // (1) Production thật: không ghi, kể cả khi lỡ đặt cờ vết.
      kiem(
        !ghiVetPreview(f2.vetPreview, { VERCEL: '1', VERCEL_ENV: 'production', CELES_FOCUSED_TRACE: '1' }, ghi) && dong.length === 0,
        'vết Preview ghi ở Production'
      );
      kiem(!ghiVetPreview(f2.vetPreview, { VERCEL: '1', VERCEL_ENV: 'preview' }, ghi) && dong.length === 0, 'vết ghi khi không có cờ');
      kiem(ghiVetPreview(f2.vetPreview, { VERCEL: '1', VERCEL_ENV: 'preview', CELES_FOCUSED_TRACE: '1' }, ghi) && dong.length === 1, 'vết không ghi ở Preview có cờ');
      kiem(dong[0]?.startsWith('[focused-vet] {'), `dòng vết sai dạng: ${dong[0]?.slice(0, 30)}`);
      kiem(f2.vetPreview?.loiRa === 'ma-focused-f2' && f2.vetPreview.hieu.coChoHoiLai, `vết F2: ${f2.vetPreview?.loiRa}`);

      // (2)+(3) Lượt đi trọn qua model giả: câu hỏi / câu trả lời mang chuỗi đánh dấu; vết không được chứa.
      const DAU_HOI = 'ZZDAUHOIZZ';
      const DAU_TRA = 'ZZTRALOIZZ';
      const fetchCu = globalThis.fetch;
      const khoaCu = process.env.GROQ_API_KEY;
      process.env.GROQ_API_KEY = 'khoa-gia-test';
      globalThis.fetch = (async (url: string | URL | Request) => {
        const u = String(url instanceof Request ? url.url : url);
        if (!u.includes('api.groq.com')) return new Response('khong co mang', { status: 500 });
        const text = JSON.stringify({
          answer: `Năm nay công việc khá thuận ${DAU_TRA}. Có sao tốt đỡ ${DAU_TRA}.`,
          claims: [{ claim: `Công việc có sao tốt đỡ ${DAU_TRA}`, evidenceIds: ['F001'], direction: 'thuan' }],
          suggestedQuestions: ['Tiền bạc năm nay thế nào?'],
        });
        return new Response(
          JSON.stringify({ choices: [{ message: { content: text }, finish_reason: 'stop' }], usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as typeof fetch;
      try {
        const r = await traLoiFocused(
          { ...vaoGoc, cauHoi: `Năm nay công việc của tôi ra sao? ${DAU_HOI}`, requestId: 'req-test' },
          phienBanHienTai,
          async () => [],
          bayGio
        );
        const v = r.vetPreview;
        kiem(!!v, 'lượt qua model không có vetPreview');
        if (v) {
          const chuoi = JSON.stringify(v);
          for (const cam of [DAU_HOI, DAU_TRA, 'công việc của tôi', 'sao tốt đỡ']) kiem(!chuoi.includes(cam), `vết chứa "${cam}"`);
          for (const khoa of ['"claim"', '"doan"', '"chiTiet"', '"nhan"', '"vai"', '"cauHoi"', '"van"', '"noiDung"']) kiem(!chuoi.includes(khoa), `vết có khoá ${khoa}`);
          for (const k of ['requestId', 'phienBan', 'loiRa', 'hieu', 'hoanCanhSo', 'maDuKien', 'maNguon', 'chunkIds', 'lan', 'msTong', 'msTruyHoi'] as const) {
            kiem(k in v, `vết thiếu ${k}`);
          }
          for (const k of ['chuDe', 'yDinh', 'khuon', 'coDoiTuong', 'thoiGian', 'nguon', 'giaiThichLuotTruoc', 'coChoHoiLai'] as const) kiem(k in v.hieu, `vết.hieu thiếu ${k}`);
          kiem(v.requestId === 'req-test' && v.lan.length >= 1 && v.lan[0].tokVao === 100 && v.lan[0].tokRa === 20, `vết lần gọi: ${JSON.stringify(v.lan)}`);
          kiem(v.loiRa === (r.van ? 'ok' : '502'), `vết loiRa ${v.loiRa} lệch văn`);
          if (r.van) kiem(!!v.ketQua && v.ketQua.soKyTu === r.van.length, 'vết thiếu ketQua khi ok');
        }
        // Văn trả lời không đổi vì có vết: cùng đầu vào, vết tắt/bật ra cùng văn.
        process.env.CELES_FOCUSED_TRACE = '1';
        const r2 = await traLoiFocused({ ...vaoGoc, cauHoi: `Năm nay công việc của tôi ra sao? ${DAU_HOI}` }, phienBanHienTai, async () => [], bayGio);
        kiem(r2.van === r.van, 'cờ vết làm đổi văn trả lời');
      } finally {
        delete process.env.CELES_FOCUSED_TRACE;
        globalThis.fetch = fetchCu;
        if (khoaCu === undefined) delete process.env.GROQ_API_KEY;
        else process.env.GROQ_API_KEY = khoaCu;
      }
    }

    // Cờ tắt: không lượt nào được mang dấu Focused. Đi tới truy hồi là chạm mạng,
    // nên chỉ kiểm phần đồng bộ — phienBanHienTai không có khoá focused.
    process.env.CELES_FOCUSED_CHAT = '0';
    kiem(!('focused' in phienBanHienTai()), 'phienBanHienTai của STANDARD mang khoá focused');
  } finally {
    if (cu === undefined) delete process.env.CELES_FOCUSED_CHAT;
    else process.env.CELES_FOCUSED_CHAT = cu;
  }
}

/* ------------------------------------------- bộ mù không lọt vào lib (spec 7.3) */

{
  // Bộ mù và Behavior Contract chỉ đo, không được thành khuôn prompt: không tệp lib/ nào import
  // chúng, và không câu hỏi nào của bộ mù xuất hiện nguyên văn trong lib/.
  const tep = (readdirSync('lib', { recursive: true }) as string[]).filter((f) => /\.tsx?$/.test(f)).map((f) => join('lib', f));
  const mu = readFileSync('scripts/eval-mu-focused.ts', 'utf-8');
  const khoiCau = mu.slice(mu.indexOf('const CAU_MU'), mu.indexOf('];', mu.indexOf('const CAU_MU')));
  const cauMu = [...khoiCau.matchAll(/'([^']{12,})'/g)].map((m) => m[1]);
  kiem(cauMu.length === 12, `bộ mù phải có 12 câu, đọc được ${cauMu.length}`);
  for (const f of tep) {
    const noi = readFileSync(f, 'utf-8');
    kiem(!/eval-mu-focused|hop-dong-focused/.test(noi), `${f} import bộ đo (eval-mu-focused / hop-dong-focused)`);
    for (const c of cauMu) kiem(!noi.includes(c), `${f} chứa câu hỏi của bộ mù: "${c.slice(0, 30)}…"`);
  }
}

/* ------------------------------------------------------------------- kết */

void kiemNoi()
  .catch((e) => hong.push(`phần nối ném lỗi: ${e instanceof Error ? e.stack : e}`))
  .then(() => {
    if (hong.length) {
      console.log(`HỎNG ${hong.length}:`);
      for (const l of hong.slice(0, 40)) console.log(`  - ${l}`);
      process.exit(1);
    }
    console.log(`Tất cả đạt. ${dsLaSo.length} lá số × ${CAU_CO.length} câu; lưu tinh ${soLuuTinh}, cân bằng ${soCanBang}.`);
  });
