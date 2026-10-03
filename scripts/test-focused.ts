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
import { coThangNhuan, khoangDuong, soVoiBayGio, laCuoiNamAm, thangAmChuYeu } from '../lib/rag/focused/thang-am';
import { lapKeHoachFocused } from '../lib/rag/focused/ke-thua';
import { phanKhuon, laXinSau, tachHaiVe, boiCanhThoiGian } from '../lib/rag/focused/phan-loai';
import {
  CAU_CUOI_NAM,
  CAU_HAI_VE,
  CAU_KHI_NAO,
  CAU_VAN_RIENG,
  cauVanRieng,
  cauHaiVe,
  cauKhiNao,
  cauNhuanChuaTach,
  chipCuoiNam,
  cauThangDaQua,
  cauThangDuong,
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
import { kiemMotCau, kiemLuot, chonChip, doiNayThanhDo, soAmTiet, type NguCanhKiem, type BanThoFocused } from '../lib/rag/focused/kiem';
import { docFocused, khoiNghiengFocused, khoiMoc, lopCoTrongGoi, tenDuocGoiTrongLuot } from '../lib/rag/focused/prompt';
import { ghepVan, chayFocused } from '../lib/rag/focused/chay';
import { cauChotDuPhong, mocChoCauChot } from '../lib/rag/focused/chot-huong';
import { dungGoiBangChung } from '../lib/rag/bang-chung';
import { focusedBat, mocChoChot, themLopChoThang, traLoiFocused, tuoiTrongGoi } from '../lib/rag/focused/tra-loi-focused';
import { phienBanHienTai, traLoiCoCanCu } from '../lib/rag/tra-loi';
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

  // "Tháng N" trơn = tháng N DƯƠNG (chủ dự án 04/10/2026); đọc tháng âm phủ phần lớn tháng ấy.
  // "âm" / "âm lịch" = tháng âm; không nói "nhuận" thì là tháng thường, không hỏi lại.
  {
    const q = thangAmChuYeu(2025, 6);
    kiem(q.nam === 2025 && q.thang === 5 && !q.nhuan && q.khoang === '27/5 – 24/6', `quy đổi 6/2025 sai: ${JSON.stringify(q)}`);
    const q8 = thangAmChuYeu(2025, 8);
    kiem(q8.thang === 6 && q8.nhuan, `8/2025 phải rơi vào tháng 6 nhuận: ${JSON.stringify(q8)}`);
    const q1 = thangAmChuYeu(2026, 1);
    kiem(q1.nam === 2025 && q1.thang === 11, `1/2026 phải là tháng 11 âm năm 2025: ${JSON.stringify(q1)}`);
  }
  for (const [cauHoi, can] of [
    ['Tháng 6 năm 2025 công việc của tôi thế nào?', { nam: 2025, thang: 5, nhuan: null, duong: 6 }],
    ['Tháng 8 năm 2025 công việc của tôi thế nào?', { nam: 2025, thang: 6, nhuan: 'nhuan', duong: 8 }],
    ['Tháng 6 âm năm 2025 công việc của tôi thế nào?', { nam: 2025, thang: 6, nhuan: 'thuong', duong: null }],
    ['Tháng 6 âm lịch năm 2025 công việc của tôi thế nào?', { nam: 2025, thang: 6, nhuan: 'thuong', duong: null }],
    ['Tháng 6 nhuận năm 2025 công việc của tôi thế nào?', { nam: 2025, thang: 6, nhuan: 'nhuan', duong: null }],
    ['Tháng 1 năm 2026 công việc của tôi thế nào?', { nam: 2025, thang: 11, nhuan: null, duong: 1 }],
    ['Tháng 11 công việc của tôi thế nào?', { nam: 2026, thang: 10, nhuan: null, duong: 11 }],
  ] as const) {
    const kh = lapKeHoachFocused({ ...vao, cauHoi }).keHoach;
    const bc = boiCanhThoiGian({ cauHoi, keHoach: kh, namXem: 2026, bayGio });
    const ra = { nam: bc.thang?.nam, thang: bc.thang?.thang, nhuan: bc.thang?.nhuan, duong: bc.thang?.duong?.thang ?? null };
    kiem(
      ra.nam === can.nam && ra.thang === can.thang && ra.nhuan === can.nhuan && ra.duong === can.duong && bc.namHieuLuc === can.nam,
      `"${cauHoi}" ra ${JSON.stringify(ra)} / năm ${bc.namHieuLuc}, cần ${JSON.stringify(can)}`
    );
  }
  // Chip tháng âm thường do câu nhuận đặt phải đọc lại đúng tháng âm thường, giữ chủ đề.
  {
    const goc = 'Tháng 6 nhuận năm 2025 công việc của tôi thế nào?';
    const kh = lapKeHoachFocused({ ...vao, cauHoi: goc }).keHoach;
    const bc = boiCanhThoiGian({ cauHoi: goc, keHoach: kh, namXem: 2026, bayGio });
    const r = cauNhuanChuaTach(bc.thang!, 2026);
    kiem(!r.goiModel && r.chip.length === 1 && r.chip[0] === 'Tháng 6 âm năm 2025', `chip nhuận sai: ${r.chip.join(' | ')}`);
    const k = lapKeHoachFocused({ ...vao, cauHoi: r.chip[0], laTiepTuChip: true, lichSu: [nd(goc)] }).keHoach;
    const b = boiCanhThoiGian({ cauHoi: r.chip[0], keHoach: k, namXem: 2026, bayGio });
    kiem(b.thang?.nhuan === 'thuong' && b.thang.thang === 6 && !b.thang.duong && b.namHieuLuc === 2025, `chip "${r.chip[0]}" ra ${JSON.stringify(b.thang)}`);
    kiem(k.chuDe === 'su-nghiep', `chip "${r.chip[0]}" mất chủ đề: ${k.chuDe}`);
  }
  // Câu quy đổi tháng dương: nêu tháng dương, tháng âm, khoảng ngày; tháng qua gộp ý N2.
  {
    const mocDuongQua = { nam: 2025, thang: 5, trangThai: 'da-qua' as const, nhuan: null, duong: { nam: 2025, thang: 6, khoang: '27/5 – 24/6', ro: true } };
    kiem(
      cauThangDuong(mocDuongQua) ===
        'Tháng 6/2025 đã qua. Phần lớn tháng đó nằm trong tháng 5 âm lịch (từ 27/5 đến 24/6 dương lịch), nên phần dưới đọc lại xu hướng của tháng âm ấy, không coi đây là dự báo cho thời gian sắp tới.',
      `câu tháng dương đã qua sai: ${cauThangDuong(mocDuongQua)}`
    );
    const mocDuongToi = { nam: 2026, thang: 10, trangThai: 'toi' as const, nhuan: null, duong: { nam: 2026, thang: 11, khoang: '9/11 – 8/12', ro: true } };
    kiem(
      cauThangDuong(mocDuongToi) === 'Tháng 11/2026 phần lớn nằm trong tháng 10 âm lịch (từ 9/11 đến 8/12 dương lịch), nên Celes đọc theo tháng âm ấy.',
      `câu tháng dương sắp tới sai: ${cauThangDuong(mocDuongToi)}`
    );
    const mocNhuanDuong = { nam: 2025, thang: 6, trangThai: 'da-qua' as const, nhuan: 'nhuan' as const, duong: { nam: 2025, thang: 8, khoang: '25/7 – 22/8', ro: true } };
    const nhuanDuong = cauNhuanChuaTach(mocNhuanDuong, 2026);
    kiem(
      !nhuanDuong.goiModel && nhuanDuong.chip.length === 0 && nhuanDuong.cau.startsWith('Tháng 8/2025 phần lớn rơi vào tháng 6 nhuận âm lịch (từ 25/7 đến 22/8 dương lịch)'),
      `câu nhuận từ tháng dương sai: ${nhuanDuong.cau}`
    );
    for (const c of [cauThangDuong(mocDuongQua, 'en'), cauThangDuong(mocDuongToi, 'en'), cauNhuanChuaTach(mocNhuanDuong, 2026, 'en').cau]) {
      kiem(!conChuViet(c), `câu tháng dương EN còn chữ Việt: ${c}`);
    }
    kiem(
      mocChoChot({ namHieuLuc: 2025, cuoiNam: false, thang: mocDuongQua } as never, { phamViThoiGian: 'thang' }, bayGio) === 'Tháng đó',
      'mốc chốt tháng dương sai'
    );
    // Chia gần đều: không nói "phần lớn". Năm âm khác năm dương: nêu năm âm.
    const mocVat = { nam: 2025, thang: 11, trangThai: 'toi' as const, nhuan: null, duong: { nam: 2026, thang: 1, khoang: '20/12 – 18/1', ro: false } };
    kiem(
      cauThangDuong(mocVat) ===
        'Tháng 1/2026 vắt qua hai tháng âm; Celes đọc theo tháng có phần dài hơn là tháng 11 âm lịch năm 2025 (từ 20/12 đến 18/1 dương lịch).',
      `câu tháng dương vắt hai tháng sai: ${cauThangDuong(mocVat)}`
    );
    for (const c of [cauThangDuong(mocVat, 'en'), cauThangDuong({ ...mocVat, trangThai: 'da-qua' }, 'en'), cauNhuanChuaTach({ ...mocNhuanDuong, duong: { ...mocNhuanDuong.duong, ro: false } }, 2026, 'en').cau]) {
      kiem(!conChuViet(c) && !/most of/i.test(c), `câu vắt hai tháng EN sai: ${c}`);
    }
    kiem(!/phần lớn/u.test(cauThangDuong({ ...mocVat, trangThai: 'da-qua' })), 'chia gần đều mà vẫn nói "phần lớn"');
    // Tháng 6 âm thầm, am hiểu: không phải âm lịch.
    for (const cauHoi of ['Tháng 6 âm thầm mình cố gắng, công việc năm 2025 thế nào?']) {
      const kh = lapKeHoachFocused({ ...vao, cauHoi }).keHoach;
      const bc = boiCanhThoiGian({ cauHoi, keHoach: kh, namXem: 2026, bayGio });
      kiem(!kh.thangMucTieu || !!bc.thang?.duong, `"${cauHoi}" bị hiểu là tháng âm`);
    }
    // Tháng đã qua: "tháng này / quãng này" → "đó".
    const doi = doiNayThanhDo('Quãng này công việc mở ra, tháng này dễ vướng.');
    kiem(doi === 'Quãng đó công việc mở ra, tháng đó dễ vướng.', `đổi "này" sai: ${doi}`);
    kiem(doiNayThanhDo('Cách này ổn, tháng nàyy') === 'Cách này ổn, tháng nàyy', 'đổi "này" chạm nhầm chữ khác');
  }

  // N2 nêu đúng tháng, năm; N4 chip sang năm đứng đầu, không trùng.
  const n2 = cauThangDaQua({ nam: 2026, thang: 3, trangThai: 'da-qua', nhuan: null });
  kiem(
    n2 ===
      'Bạn đang hỏi lại tháng 3 âm lịch năm 2026 — mốc này đã qua. Phần dưới sẽ đọc lại xu hướng của tháng đó, không coi đây là dự báo cho thời gian sắp tới.',
    `N2 lệch chữ đã duyệt: ${n2}`
  );
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
  const ctx = (them: Partial<NguCanhKiem> = {}): NguCanhKiem => ({
    cauHoi: 'Năm nay công việc tôi có thuận không?',
    phanLoai: { khuon: 'A', loaiSuKien: 'mong-muon', sau: false },
    mucAnToan: 'NORMAL', chuDe: 'su-nghiep', doiTuong: null,
    tapTen: tapTenTuGoi(duKien), phucDucLaSao: false, maHopLe: new Set(duKien.map((d) => d.id)),
    nghieng, thoiGian: { namHieuLuc: 2026, thang: null, cuoiNam: false }, tuoiHopLe: [[33, 42]],
    cauMa: [], chipTruoc: [], ...them,
  });
  const ly = (c: string, x: NguCanhKiem = ctx(), chot = false) => kiemMotCau(c, x, chot);

  // Mỗi luật: một câu qua, một câu trượt.
  const qua = 'Thiên Phủ ở đây giúp bạn giữ được nền trong công việc.';
  kiem(ly(qua).length === 0, `câu sạch bị chặn: ${ly(qua).join(',')}`);
  const truot: [string, string][] = [
    ['Thất Sát khiến bạn nóng vội.', 'ten-ngoai-goi'],
    ['Lưu Hóa Kỵ năm nay làm chậm việc.', 'luu-hoa'],
    ['Phần Quan Lộc của bạn khá vững.', 'ten-cung'],
    ['Dựa trên các dữ kiện, công việc ổn.', 'giong-may'],
    ['Năm nay chắc chắn bạn được thăng chức.', 'phan-quyet'],
    ['Bạn nên nhận lời mời này.', 'khuyen'],
    ['Hãy giữ nhịp làm việc.', 'khuyen'],
    ['Năm 2028 mọi việc mở ra.', 'moc-la'],
    ['Tháng 5 là quãng đáng chú ý.', 'moc-la'],
    ['Tới 50 tuổi mới yên.', 'moc-la'],
  ];
  for (const [c, x] of truot) kiem(ly(c).includes(x as never), `"${c}" không ra ${x}: ${ly(c).join(',')}`);
  kiem(!ly('Chuyện này không chắc chắn, còn tùy bạn.').includes('phan-quyet'), '"không chắc chắn" bị coi là phán');
  kiem(!ly('Việc chậm, nên phải chờ thêm.').includes('khuyen'), '"nên" liên từ bị coi là khuyên');
  kiem(ly('Quãng 35 tuổi là lúc vững nhất.').length === 0, `tuổi trong đại vận bị chặn: ${ly('Quãng 35 tuổi là lúc vững nhất.')}`);
  const G = { khuon: 'G' as const, loaiSuKien: 'trung-tinh' as const, sau: false };
  kiem(ly('Phần này nghiêng về thuận.', ctx({ phanLoai: G })).includes('nghieng-ve'), 'G nói "nghiêng về" không bị chặn');
  const daQua = ctx({ thoiGian: { namHieuLuc: 2026, thang: { nam: 2026, thang: 3, trangThai: 'da-qua', nhuan: null }, cuoiNam: false } });
  kiem(ly('Quãng đó sẽ có người giúp.', daQua).includes('tuong-lai'), 'tháng đã qua nói "sẽ" không bị chặn');
  kiem(!ly('Tháng 3 có Thiên Phủ đỡ.', daQua).includes('moc-la'), 'tháng hiệu lực bị coi là mốc lạ');
  const E = { khuon: 'E' as const, loaiSuKien: 'trung-tinh' as const, sau: false, haiVe: ['ở lại', 'nhảy việc'] as [string, string] };
  kiem(ly('Ở lại sẽ hợp hơn với bạn.', ctx({ phanLoai: E })).includes('khuyen'), 'E chọn hộ "ở lại hợp hơn" không bị chặn');
  kiem(ly('Năm nay khá thuận nhờ Thiên Phủ.', ctx(), true).length === 0, 'câu chốt có tên dauMoc bị chặn');

  // Lượt: câu chốt ngược hướng → dự phòng; câu không mã bị cắt trước; NORMAL ≤ 4 câu.
  const ban: BanThoFocused = {
    cauChot: 'Năm nay công việc khá vướng.',
    chieuCauChot: 'vuong',
    cau: [
      { noiDung: qua, maDuKien: ['F001'], phia: 'thuan' },
      { noiDung: 'Đà La năm nay làm vài việc chậm hơn dự tính.', maDuKien: ['F002'], phia: 'can' },
      { noiDung: 'Hóa Khoa cho bạn tiếng tốt ở chỗ làm.', maDuKien: ['F001'], phia: 'thuan' },
      { noiDung: 'Người xung quanh dễ thấy bạn đáng tin.', maDuKien: [], phia: 'nen' },
      { noiDung: 'Có Thiên Phủ nên bạn ít khi bị cuốn theo.', maDuKien: ['F999'], phia: 'thuan' },
    ],
    goiYTiep: ['Năm nay công việc tôi có thuận không?', 'Bạn nên làm gì?', 'Tháng nào tốt hơn?', 'Còn tiền bạc thì sao?', 'Tên người đó là gì?'],
  };
  const k = kiemLuot(ban, ctx());
  kiem(k.dungDuPhong && k.cauChot !== ban.cauChot && k.lyDoThayChot === 'nguoc-huong', `câu chốt ngược hướng không thay: ${k.lyDoThayChot} ${k.cauChot}`);
  kiem(k.soCau <= 4, `NORMAL quá 4 câu: ${k.soCau}`);
  kiem(k.cau.every((c) => c.coCanCu), 'câu không căn cứ còn sót sau khi cắt');
  kiem(!k.cau.some((c) => c.maDuKien.includes('F999')), 'mã F### lạ không bị bỏ');
  kiem(k.thuLai === null, `lượt hợp lệ bị đòi thử lại: ${k.thuLai}`);
  kiem(k.chip.length >= 2 && k.chip.length <= 3, `số chip sai: ${k.chip.join(' | ')}`);
  kiem(!k.chip.some((c) => /nên|Tháng nào|Tên/u.test(c) || c === ctx().cauHoi), `chip bẩn lọt: ${k.chip.join(' | ')}`);
  kiem(k.chip.includes('Còn tiền bạc thì sao?'), 'chip hợp lệ bị bỏ');
  const motPhia = kiemLuot(
    {
      ...ban,
      cauChot: 'Năm nay công việc khá thuận.',
      chieuCauChot: 'thuan',
      cau: [
        { noiDung: 'Đà La năm nay làm vài việc chậm.', maDuKien: ['F002'], phia: 'can' },
        { noiDung: 'Đà La cũng khiến giấy tờ dây dưa.', maDuKien: ['F002'], phia: 'can' },
      ],
    },
    ctx()
  );
  kiem(motPhia.cau.filter((c) => c.phia === 'can').length === 1, 'hướng thuận giữ hơn một câu cản');
  const khongHuong = ctx({ nghieng: null, phanLoai: G });
  const het = kiemLuot({ cauChot: '', cau: [{ noiDung: 'Bạn nên nghỉ việc.', maDuKien: ['F001'], phia: 'nen' }], goiYTiep: [] }, khongHuong);
  kiem(het.thuLai === 'het-cau', `hết câu không đòi thử lại: ${het.thuLai}`);
  const g = kiemLuot({ cauChot: 'Bạn nên làm vậy.', cau: [{ noiDung: qua, maDuKien: ['F001'], phia: 'nen' }], goiYTiep: [] }, khongHuong);
  kiem(g.cauChot === qua && g.cau.length === 0, `G không đẩy câu căn cứ lên: "${g.cauChot}"`);
  const eL = kiemLuot(
    { ...ban, cauChot: 'Ở lại tốt hơn.' },
    ctx({ phanLoai: E, nghieng: null, cauMa: ['Câu mã một.'], chipMa: ['Ở lại thì sao?', 'Nhảy việc thì sao?'] })
  );
  kiem(eL.cauChot === '' && eL.soCau <= 4, `E: câu chốt model còn hoặc quá dài: "${eL.cauChot}" ${eL.soCau}`);
  kiem(eL.chip.join('|') === 'Ở lại thì sao?|Nhảy việc thì sao?', `E chip sai: ${eL.chip.join(' | ')}`);
  // Ngoài phạm vi (b): một câu chốt, không câu thân — không đòi thử lại.
  const ngoai = kiemLuot({ cauChot: 'Phần này Celes chưa đọc được từ lá số.', cau: [], goiYTiep: [], ngoaiPhamVi: true }, khongHuong);
  kiem(ngoai.thuLai === null && ngoai.cauChot !== '', `ngoài phạm vi bị đòi thử lại: ${ngoai.thuLai} "${ngoai.cauChot}"`);
  const ngoaiGia = kiemLuot({ cauChot: 'Bạn nên nghỉ.', cau: [{ noiDung: 'Bạn nên nghỉ việc.', maDuKien: ['F001'], phia: 'nen' }], goiYTiep: [], ngoaiPhamVi: true }, khongHuong);
  kiem(ngoaiGia.thuLai === 'het-cau', `cờ ngoài phạm vi kèm câu thân lách được thử lại: ${ngoaiGia.thuLai}`);
  // Câu mã đã kết luận (danh tính bạn đời) thì bỏ câu chốt của model.
  const boChot = kiemLuot(ban, ctx({ cauMa: ['Câu mã kết luận.'], boChotModel: true }));
  kiem(boChot.cauChot !== ban.cauChot && !boChot.dungDuPhong, `boChotModel vẫn giữ câu chốt model / dự phòng: "${boChot.cauChot}"`);
  // Cung lục thân: câu dự phòng không gán nét sao thành tính cách người hỏi.
  const dtPhuThe = nhanDangDoiTuong('Chồng tôi có thương tôi không?');
  const duPhongDt = cauChotDuPhong({ nghieng, chuDe: 'tinh-cam', cauHoi: 'Chồng tôi có thương tôi không?', doiTuong: dtPhuThe });
  kiem(!duPhongDt.includes('cho thấy bạn') && duPhongDt.includes('Thiên Phủ'), `dự phòng lục thân sai: ${duPhongDt}`);
  // Không có mốc phía chính thì không nêu mốc phía ngược.
  const chiCan = { ...nghieng, dauMoc: nghieng.dauMoc.filter((d) => d.huong === 'can') };
  kiem(mocChoCauChot(chiCan).length === 0, `mốc ngược phía đứng sau hướng thuận: ${mocChoCauChot(chiCan).map((d) => d.ten)}`);
  kiem(!cauChotDuPhong({ nghieng: chiCan, chuDe: 'su-nghiep', cauHoi: ctx().cauHoi }).includes('Đà La'), 'dự phòng hướng thuận nêu Đà La');

  // Dự phòng chỉ nêu TÊN + HƯỚNG (chủ dự án 04/10). Nét `y` là nét chung của sao —
  // "Tang Môn cho thấy bạn dễ phải chia tay" trong câu hỏi tiền bạc là lỗi chặn.
  const tangMon: NghiengVe = {
    ...nghieng,
    huong: 'can-nhe',
    dauMoc: [
      { ten: 'Tang Môn', lop: 'nam', huong: 'can', trong: 3, y: 'dễ gặp chuyện phải chia tay, tiễn đi' },
      { ten: 'Thiên Phủ', lop: 'nen', huong: 'do', trong: 2, y: 'giữ được nền' },
    ],
  };
  for (const [chuDe, cauHoi, cum, cumEn] of [
    ['tai-chinh', 'Năm nay tiền bạc của tôi thế nào?', 'tiền bạc', 'money'],
    ['su-nghiep', 'Năm nay công việc của tôi thế nào?', 'công việc', 'work'],
    ['tinh-cam', 'Năm nay tình cảm của tôi thế nào?', 'chuyện tình cảm', 'your love life'],
    ['suc-khoe', 'Năm nay sức khỏe của tôi thế nào?', 'sức khỏe', 'health'],
  ] as const) {
    const c = cauChotDuPhong({ nghieng: tangMon, chuDe, cauHoi, moc: 'Năm nay' });
    kiem(
      c === `Năm nay, ${cum} có phần vướng nhỉnh hơn, nhưng chưa phải thế khó: Tang Môn kéo phần này lại, còn Thiên Phủ đỡ cho phần này.`,
      `dự phòng ${chuDe} sai: ${c}`
    );
    kiem(!/cho thấy|bạn dễ|chia tay|tiễn đi|giữ được nền|tính/iu.test(c), `dự phòng ${chuDe} còn nghĩa chung / gán tính cách: ${c}`);
    const en = cauChotDuPhong({ nghieng: tangMon, chuDe, cauHoi, moc: 'This year', ngonNgu: 'en' });
    kiem(
      en === `This year, ${cumEn} leans a little toward snags, though nothing severe: Tang Môn holds it back, while Thiên Phủ supports it.`,
      `dự phòng EN ${chuDe} sai: ${en}`
    );
    kiem(!conChuViet(en, ['Tang Môn', 'Thiên Phủ']), `dự phòng EN ${chuDe} còn chữ Việt: ${en}`);
  }
  // Người khác (cung lục thân): cùng dạng tên + hướng, không gán tính cách người kia.
  const dtBo = nhanDangDoiTuong('Tôi với bố tôi có hợp nhau không?');
  const duPhongBo = cauChotDuPhong({ nghieng: tangMon, chuDe: 'gia-dao', cauHoi: 'Tôi với bố tôi có hợp nhau không?', doiTuong: dtBo });
  kiem(
    duPhongBo.includes('Tang Môn kéo phần này lại') && !/cho thấy|chia tay|tiễn đi|bố bạn|ông ấy/iu.test(duPhongBo),
    `dự phòng người khác sai: ${duPhongBo}`
  );
  kiem(!cauChotDuPhong({ nghieng: tangMon, chuDe: 'tai-chinh', cauHoi: 'Tiền bạc?', doiTuong: dtBo, ngonNgu: 'en' }).includes('quan hệ'), 'dự phòng EN người khác còn chữ Việt');

  // Hỏi MỘT tháng: bản cuối phải còn ≥ 1 câu dựa vào nguyệt hạn, không thì thử lại (chủ dự án 04/10).
  const thang9 = ctx({
    thoiGian: { namHieuLuc: 2026, thang: { nam: 2026, thang: 9, trangThai: 'toi', nhuan: null }, cuoiNam: false },
    maHopLe: new Set(['F001', 'F002', 'F003', 'F004']),
    maNguyetHan: new Set(['F004']),
  });
  const cauNen = { noiDung: qua, maDuKien: ['F001'], phia: 'thuan' as const };
  const cauThang = { noiDung: 'Tháng 9 có Thiên Phủ đỡ thêm cho việc đang làm.', maDuKien: ['F004'], phia: 'thuan' as const };
  const thieu = kiemLuot({ ...ban, cau: [cauNen] }, thang9);
  kiem(thieu.thuLai === 'thieu-nguyet-han', `tháng thiếu câu nguyệt hạn không đòi thử lại: ${thieu.thuLai}`);
  const du = kiemLuot({ ...ban, cau: [cauNen, cauThang] }, thang9);
  kiem(du.thuLai === null, `tháng có câu nguyệt hạn vẫn đòi thử lại: ${du.thuLai}`);
  // Cắt độ dài không được cắt mất câu nguyệt hạn duy nhất (nằm cuối, chỗ cắt trước).
  const dai6 = kiemLuot({ ...ban, cau: [cauNen, cauNen, cauNen, cauNen, cauThang] }, thang9);
  kiem(dai6.cau.some((c) => c.maDuKien.includes('F004')) && dai6.thuLai !== 'thieu-nguyet-han', `cắt độ dài làm mất câu nguyệt hạn: ${dai6.thuLai}`);
  // Câu không hỏi tháng: luật không chạm.
  kiem(kiemLuot({ ...ban, cau: [cauNen] }, ctx({ maNguyetHan: new Set(['F004']) })).thuLai === null, 'câu không hỏi tháng bị đòi nguyệt hạn');
  // Gói không có mã nguyệt hạn: không đòi (cùng điều kiện với dòng dặn trong prompt) — tránh 502 chắc chắn.
  kiem(kiemLuot({ ...ban, cau: [cauNen] }, { ...thang9, maNguyetHan: new Set() }).thuLai === null, 'gói không có nguyệt hạn vẫn đòi thử lại');
  // "dữ kiện" là chữ nội bộ: câu model có chữ này bị bỏ; "dự kiến" thì không.
  const cauDuKien = { noiDung: 'Dữ kiện tháng 9 có Thiên Phủ đỡ cho công việc của bạn.', maDuKien: ['F004'], phia: 'thuan' as const };
  kiem(!kiemLuot({ ...ban, cau: [cauNen, cauDuKien] }, ctx()).cau.some((c) => c.noiDung === cauDuKien.noiDung), 'câu có "dữ kiện" lọt qua');
  const cauDuKien2 = { noiDung: 'Việc bạn dự kiến làm có Thiên Phủ đỡ thêm.', maDuKien: ['F001'], phia: 'thuan' as const };
  kiem(kiemLuot({ ...ban, cau: [cauNen, cauDuKien2] }, ctx()).cau.some((c) => c.noiDung === cauDuKien2.noiDung), 'câu "dự kiến" bị bỏ nhầm');

  // Câu do mã viết: chữ đã duyệt (chủ dự án 04/10), không lộ "dữ kiện", EN không còn chữ Việt.
  kiem(
    CAU_KHI_NAO.vi ===
      'Lá số hiện chưa đủ để chọn ra một năm hay một tháng tốt nhất nếu chưa đặt các mốc cạnh nhau. Bạn có thể chọn một mốc cụ thể để Celes đọc riêng.',
    `câu khi nào lệch chữ đã duyệt: ${CAU_KHI_NAO.vi}`
  );
  const mocNhuan = { nam: 2025, thang: 6, trangThai: 'da-qua' as const, nhuan: 'nhuan' as const };
  const mocQua = { nam: 2026, thang: 3, trangThai: 'da-qua' as const, nhuan: null };
  const dtMe = nhanDangDoiTuong('Mẹ tôi năm nay thế nào?');
  const cauMaVi = [
    CAU_KHI_NAO.vi, CAU_HAI_VE.vi, CAU_VAN_RIENG.vi, CAU_CUOI_NAM.vi, ...CAU_NGOAI_TAM,
    cauNhuanChuaTach(mocNhuan, 2026).cau, cauThangDaQua(mocQua),
    cauChotDuPhong({ nghieng: tangMon, chuDe: 'tai-chinh', cauHoi: 'Tiền bạc?', moc: 'Năm nay' }),
  ];
  for (const c of cauMaVi) kiem(!/dữ kiện/iu.test(c), `câu mã còn "dữ kiện": ${c}`);
  const cauMaEn: string[] = [
    CAU_KHI_NAO.en, CAU_HAI_VE.en, CAU_VAN_RIENG.en, CAU_CUOI_NAM.en, ...CAU_NGOAI_TAM_EN, MIEN_TRU_TAM_LY_EN,
    cauNhuanChuaTach(mocNhuan, 2026, 'en').cau, ...cauNhuanChuaTach(mocNhuan, 2026, 'en').chip,
    cauThangDaQua(mocQua, 'en'), cauThangDaQua({ ...mocQua, nhuan: 'nhuan' }, 'en'),
    ...cauKhiNao('en').chip, chipCuoiNam(2026, [], 'en').join(' '),
    cauHaiVe(['nghỉ việc', 'ở lại'], 'en').cau, ...cauHaiVe(['nghỉ việc', 'ở lại'], 'en').chip,
    ...CHIP_DU_PHONG.en,
    ...(dtMe ? [cauVanRieng(dtMe, 'en').cau, ...cauVanRieng(dtMe, 'en').chip] : []),
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
  const nhieu = { ...ban, cau: Array.from({ length: 9 }, () => ({ noiDung: qua, maDuKien: ['F001'], phia: 'nen' as const })) };
  kiem(kiemLuot(nhieu, ctx({ mucAnToan: 'SENSITIVE' })).cau.length === 9, 'SENSITIVE bị cắt');
  kiem(kiemLuot(nhieu, ctx({ phanLoai: { khuon: 'A', loaiSuKien: 'mong-muon', sau: true } })).soCau <= 8, 'DEEP quá 8 câu');
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
      maHopLe: new Set(['F001', 'F002']), nghieng: n, thoiGian: { namHieuLuc: 2026, thang: null, cuoiNam: false },
      tuoiHopLe: [], cauMa: [], chipTruoc: [],
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
    const lyTen = (tap: Set<string>) => kiemMotCau(cauThienY, ctxTen(tap, nThienY), false);

    // (1) d.sao có Thiên Y, noiDung không → câu nhắc Thiên Y bị loại; khối in đầu mốc KHÔNG tên.
    const dkMeta: DuKienLaSo[] = [
      { id: 'F001', loai: 'cung', noiDung: 'Tật Ách có Thiên Phủ.', cung: 'Tật Ách', sao: ['Thiên Phủ', 'Thiên Y'] },
      { id: 'F002', loai: 'luu-nien', noiDung: 'Tiểu hạn năm 2026 vào Tật Ách, có Đà La.', cung: 'Tật Ách', sao: ['Đà La'] },
    ];
    const r1 = tenDuocGoiTrongLuot({ goi: { duKien: dkMeta }, nghieng: nThienY, khuon: 'B' });
    kiem(!r1.tapTen.has(khoaTen('Thiên Y')), '(1) Thiên Y chỉ ở d.sao vẫn được phép');
    kiem(lyTen(r1.tapTen).includes('ten-ngoai-goi'), `(1) câu nhắc Thiên Y (chỉ ở d.sao) lọt guard: ${lyTen(r1.tapTen).join(',')}`);
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
    kiem(kiemMotCau('Thất Sát làm bạn dễ quá sức.', ctxTen(r2.tapTen, nThienY), false).includes('ten-ngoai-goi'), '(4) Thất Sát ngoài prompt lọt guard');
    // Đầu mốc lớp vắng (lớp tháng, gói không có F### tháng) không in → tên không được phép dù có ở d.sao.
    const nThang: NghiengVe = { ...nThienY, dauMoc: [...nThienY.dauMoc, { ten: 'Thiên Hình', lop: 'thang', huong: 'can', trong: 1, y: 'dễ va chạm' }] };
    const dkThang: DuKienLaSo[] = [dkChu[0], { ...dkChu[1], sao: ['Đà La', 'Thiên Hình'] }];
    kiem(!tenDuocGoiTrongLuot({ goi: { duKien: dkThang }, nghieng: nThang, khuon: 'B' }).tapTen.has(khoaTen('Thiên Hình')), '(4) đầu mốc lớp vắng vẫn được gọi tên');

    // Câu chốt dự phòng (mã viết) chỉ gọi đầu mốc có tên trong chữ: tập chốt lọc theo tapTen.
    const kqDp = kiemLuot({ cauChot: 'Năm nay sức khỏe chắc chắn tốt.', chieuCauChot: 'thuan', cau: [], goiYTiep: [], ngoaiPhamVi: false } as BanThoFocused,
      { ...ctxTen(r1.tapTen, nThienY), phanLoai: { khuon: 'A', loaiSuKien: 'trung-tinh', sau: false } });
    kiem(!kqDp.cauChot.includes('Thiên Y'), `(4) câu chốt dự phòng gọi tên chỉ có ở d.sao: ${kqDp.cauChot}`);
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
      const ly = kiemMotCau(cau, {
        cauHoi, phanLoai: pl, mucAnToan: 'NORMAL', chuDe: kh.chuDe, doiTuong: null, tapTen: tap, phucDucLaSao: goiCoPhucDuc(dk),
        maHopLe: new Set(dk.map((d) => d.id)), nghieng: n, thoiGian: { namHieuLuc: 2026, thang: null, cuoiNam: false },
        tuoiHopLe: [], cauMa: [], chipTruoc: [],
      }, false);
      kiem(ly.includes('ten-ngoai-goi'), `(5) câu A/B nhắc ${ten} lọt guard: ${ly.join(',')}`);
    }
  }

  const moc = khoiMoc({
    bayGio: { nam: 2026, thang: 8 } as never,
    thoiGian: { namHieuLuc: 2026, thang: { nam: 2026, thang: 3, trangThai: 'da-qua', nhuan: null }, cuoiNam: false },
  });
  kiem(moc.includes('ĐÃ QUA') && moc.includes('Bính Ngọ') && moc.includes('còn 4 tháng'), `khối mốc thiếu: ${moc}`);
  const doc = docFocused('```json\n{"cauChot":"A.","chieuCauChot":"thuan","cau":[{"noiDung":"B.","maDuKien":["F001"],"phia":"lạ"}],"goiYTiep":["C?"]}\n```');
  kiem(!!doc && doc.cau[0].phia === 'nen' && doc.chieuCauChot === 'thuan', 'docFocused đọc sai');
  kiem(docFocused('không phải json') === null, 'docFocused nhận văn xuôi');
  const ghep = ghepVan(['Mã.'], { cauChot: 'Chốt.', cau: [{ noiDung: 'Một.', maDuKien: [], phia: 'nen', coCanCu: true }] }, false);
  kiem(ghep === 'Mã. Chốt.\n\nMột.', `ghép văn sai: ${JSON.stringify(ghep)}`);
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

  const tgNam = { namHieuLuc: 2026, thang: null, cuoiNam: false };
  kiem(mocChoChot(tgNam, { phamViThoiGian: 'nam' }, bayGio) === 'Năm nay', 'mốc chốt năm nay sai');
  kiem(mocChoChot({ ...tgNam, namHieuLuc: 2027 }, { phamViThoiGian: 'nam' }, bayGio) === 'Năm 2027', 'mốc chốt năm khác sai');
  kiem(mocChoChot(tgNam, { phamViThoiGian: 'tong' as never }, bayGio) === undefined, 'câu không mốc mà có tiền tố thời gian');
  kiem(
    mocChoChot({ ...tgNam, thang: { nam: 2026, thang: 3, trangThai: 'da-qua', nhuan: null } }, { phamViThoiGian: 'thang' }, bayGio) ===
      'Tháng 3 âm',
    'mốc chốt tháng sai'
  );
  kiem(
    mocChoChot({ ...tgNam, cuoiNam: true }, { phamViThoiGian: 'gan' }, { nam: 2026, thang: 11, ngay: 2 }) ===
      'Từ giờ đến hết năm Bính Ngọ',
    'mốc chốt cuối năm sai'
  );

  // N1: tháng thêm đại vận + lưu niên, trên BẢN SAO; câu không phải tháng giữ nguyên đối tượng.
  const khThang = lapKeHoach({ cauHoi: 'Tháng 10 công việc của tôi thế nào?', saoTheoCung: saoChinhTheoCung(dsLaSo[0]) });
  const lopCu = [...khThang.lopHan];
  const n1 = themLopChoThang(khThang);
  kiem(khThang.phamViThoiGian === 'thang' && (n1.lopHan.includes('dai-van') && n1.lopHan.includes('luu-nien')), 'N1 không thêm lớp');
  kiem(JSON.stringify(khThang.lopHan) === JSON.stringify(lopCu), 'N1 sửa thẳng kế hoạch gốc');
  const khNam = lapKeHoach({ cauHoi: 'Tính cách tôi thế nào?', saoTheoCung: saoChinhTheoCung(dsLaSo[0]) });
  kiem(themLopChoThang(khNam) === khNam, 'N1 chạm câu không phải tháng');
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

    // F2 / D đi trọn đường qua traLoiCoCanCu: không truy hồi, không gọi model.
    const f2 = await traLoiCoCanCu({ ...vaoGoc, cauHoi: 'Bố tôi năm nay sức khỏe thế nào?' });
    kiem(f2.provider === 'ma' && f2.model === 'focused-f2', `F2 ra ${f2.provider}/${f2.model}`);
    kiem(!!f2.van && f2.van.startsWith('Lá số này là của bạn'), `F2 văn sai: ${f2.van.slice(0, 60)}`);
    kiem((f2.coCauTruc?.goiYTiep ?? []).some((c) => c.includes('hợp nhau')), 'F2 thiếu chip quan hệ');
    // Route đọc mấy trường này ở nhánh quản trị — thiếu là 502 (mục 13.3).
    kiem(Array.isArray(f2.goi.duKien) && Array.isArray(f2.goi.bangChung), 'F2 gói thiếu trường');
    kiem(!!f2.phienBan.engine && !!f2.phienBan.phuongPhap && f2.phienBan.focused === 'F2', 'F2 phienBan thiếu khoá');
    kiem(f2.kiemDuyet === null && f2.runId === null, 'F2 có kiểm duyệt / runId');

    const d = await traLoiCoCanCu({ ...vaoGoc, cauHoi: 'Khi nào tôi lấy chồng?' });
    kiem(d.provider === 'ma' && d.model === 'focused-d', `D ra ${d.provider}/${d.model}`);
    kiem(!(d.coCauTruc?.goiYTiep ?? []).some((c) => /tháng nào/i.test(c)), 'D còn chip "Tháng nào" (#5)');

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
      kiem(b.thang?.nhuan === 'thuong' && b.thang.thang === 6, `chip thường "${chipThuong}" ra ${b.thang?.nhuan}`);
    }

    // Ca bổ sung 10: không còn câu có căn cứ → thử lại ĐÚNG một lần → văn rỗng (route trả 502 + hoàn lượt).
    const cauHoi = 'Năm nay công việc của tôi thế nào?';
    const kh = lapKeHoachFocused({ cauHoi, lichSu: [], saoTheoCung: saoChinhTheoCung(laSo), namXem: 2026, thangXem: 8 }).keHoach;
    const dk = [{ id: 'F001', loai: 'cung' as const, noiDung: 'Quan Lộc có Thiên Phủ.', cung: 'Quan Lộc' }];
    const thoiGian = { namHieuLuc: 2026, thang: null, cuoiNam: false };
    const phanLoai = { khuon: 'A' as const, loaiSuKien: 'trung-tinh' as const, sau: false };
    let soLanGoi = 0;
    const kq10 = await chayFocused({
      prompt: {
        goi: dungGoiBangChung(cauHoi, kh, dk, []), cauHoiGoc: cauHoi, lichSu: [], daNoiTruoc: [], nghieng: null,
        phanLoai, mucAnToan: 'NORMAL', moc: { bayGio, thoiGian }, laTiepTuChip: false, cauMa: [],
      },
      ctx: {
        cauHoi, phanLoai, mucAnToan: 'NORMAL', chuDe: 'su-nghiep', doiTuong: null,
        tapTen: tapTenTuGoi(dk), phucDucLaSao: false, maHopLe: new Set(['F001']), nghieng: null,
        thoiGian, tuoiHopLe: [], cauMa: [], chipTruoc: [],
      },
      tenSua: [],
      goi: async () => {
        soLanGoi += 1;
        // Mọi câu trỏ mã không có trong gói → bị cắt hết → "het-cau".
        const text = JSON.stringify({ cauChot: 'Năm nay công việc khá ổn.', cau: [{ noiDung: 'Thiên Phủ giữ nền cho bạn.', maDuKien: ['F999'], phia: 'thuan' }], chieu: 'thuan', goiYTiep: [] });
        return { text, provider: 'gemini', model: 'gia', tokensIn: 1, tokensOut: 1, daThuHong: [] };
      },
    });
    kiem(soLanGoi === 2 && kq10.vet.lanGoi === 2, `ca 10 gọi ${soLanGoi} lần, cần đúng 2`);
    kiem(kq10.van === '' && kq10.vet.thuLai === 'het-cau', `ca 10 ra văn "${kq10.van.slice(0, 40)}" / thuLai ${kq10.vet.thuLai}`);

    // Hỏi MỘT tháng mà hai lần đều không có câu nguyệt hạn → văn rỗng (502 + hoàn lượt).
    {
      const dkT = [...dk, { id: 'F002', loai: 'nguyet-han' as const, noiDung: 'Tháng 9 âm: nguyệt hạn ở Quan Lộc.', cung: 'Quan Lộc' }];
      const tgT = { namHieuLuc: 2026, thang: { nam: 2026, thang: 9, trangThai: 'toi' as const, nhuan: null }, cuoiNam: false };
      let lan = 0;
      const kqT = await chayFocused({
        prompt: {
          goi: dungGoiBangChung(cauHoi, kh, dkT, []), cauHoiGoc: cauHoi, lichSu: [], daNoiTruoc: [], nghieng: null,
          phanLoai, mucAnToan: 'NORMAL', moc: { bayGio, thoiGian: tgT }, laTiepTuChip: false, cauMa: [],
        },
        ctx: {
          cauHoi, phanLoai, mucAnToan: 'NORMAL', chuDe: 'su-nghiep', doiTuong: null,
          tapTen: tapTenTuGoi(dkT), phucDucLaSao: false, maHopLe: new Set(['F001', 'F002']), nghieng: null,
          thoiGian: tgT, tuoiHopLe: [], cauMa: [], chipTruoc: [], maNguyetHan: new Set(['F002']),
        },
        tenSua: [],
        goi: async () => {
          lan += 1;
          const text = JSON.stringify({ cauChot: 'Tháng 9 công việc khá ổn.', cau: [{ noiDung: 'Quan Lộc có Thiên Phủ giữ nền.', maDuKien: ['F001'], phia: 'thuan' }], chieu: 'thuan', goiYTiep: [] });
          return { text, provider: 'gemini', model: 'gia', tokensIn: 1, tokensOut: 1, daThuHong: [] };
        },
      });
      kiem(lan === 2, `tháng thiếu nguyệt hạn gọi ${lan} lần, cần 2`);
      kiem(kqT.van === '' && kqT.vet.thuLai === 'thieu-nguyet-han', `tháng thiếu nguyệt hạn ra "${kqT.van.slice(0, 40)}" / ${kqT.vet.thuLai}`);
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
