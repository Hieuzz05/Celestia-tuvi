/**
 * Luật quan hệ giữa các sao + khối Tuần Triệt (lib/tuvi/luat-quan-he.ts) — offline, tất định.
 *
 *   npx tsx scripts/test-luat-quan-he.ts
 *
 * Ba phần:
 *  1. Bảng thật: `kiemBangQuanHe` / `kiemKhoiTuanTriet` sạch (mức theo số nhóm tác giả — Q1,
 *     ngoại lệ trỏ đúng, luật ngược chiều có phân ưu tiên), tệp sách có trong NHOM_NGUON, tên sao
 *     có thật trên lá số tổng hợp (quét, không phải lá người thật).
 *  2. Máy kiểm bắt được từng lỗi, trên luật mẫu của bài này.
 *  3. `doSangHieuDung` theo X7 (có trần).
 * Đối chiếu sách: mỗi câu trích phải có nguyên văn trong dòng `dong..den` của tệp. Chỉ chạy khi
 * máy có kho sách; CI không có kho → in CẢNH BÁO, phần này phải chạy tay trước khi duyệt bảng.
 * Không bắt câu trích phải gọi tên mọi sao của luật — câu sách hay gọi tắt bộ ("Sát Phá Tham").
 */
import { lapLaSo, type LaSo } from '../lib/tuvi/ansao';
import { doSangCuaSao } from '../lib/tuvi/dosang';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NHOM_NGUON } from '../lib/tuvi/luat-to-hop';
import {
  LUAT_CHUNG_SAO_GIAI,
  LUAT_QUAN_HE,
  TUAN_TRIET,
  doSangHieuDung,
  kiemBangQuanHe,
  kiemKhoiTuanTriet,
  soNhom,
  type LuatQuanHe,
  type NguonQuanHe,
} from '../lib/tuvi/luat-quan-he';

let loi = 0;
let soCa = 0;
const kiem = (dk: boolean, msg: string) => {
  soCa++;
  if (!dk) {
    loi++;
    console.error('  ✗', msg);
  }
};

/** Mọi nguồn của tệp, gắn nhãn để báo lỗi */
function moiNguon(): { nhan: string; x: NguonQuanHe }[] {
  const ra: { nhan: string; x: NguonQuanHe }[] = [];
  for (const l of LUAT_QUAN_HE) for (const x of [...l.nguon, ...l.nguonNguoc]) ra.push({ nhan: l.ma, x });
  const { theoSao, ...muc } = TUAN_TRIET;
  for (const [k, m] of Object.entries(muc)) for (const x of [...m.nguon, ...m.nguonNguoc]) ra.push({ nhan: `TUAN_TRIET.${k}`, x });
  for (const s of theoSao) for (const x of [...s.nguon, ...s.nguonNguoc]) ra.push({ nhan: s.ma, x });
  for (const g of LUAT_CHUNG_SAO_GIAI) for (const x of [...g.nguon, ...g.nguonNguoc]) ra.push({ nhan: g.ma, x });
  return ra;
}

function bangThat() {
  const lb = kiemBangQuanHe(LUAT_QUAN_HE);
  kiem(lb.length === 0, `bảng luật hợp lệ: ${lb.join(' | ')}`);
  const lt = kiemKhoiTuanTriet(TUAN_TRIET);
  kiem(lt.length === 0, `khối Tuần Triệt hợp lệ: ${lt.join(' | ')}`);
  for (const { nhan, x } of moiNguon()) {
    kiem(x.sach in NHOM_NGUON, `${nhan}: tệp sách lạ "${x.sach}" (không có trong NHOM_NGUON)`);
    kiem(x.dong > 0 && x.trich.trim().length > 0, `${nhan}: nguồn thiếu số dòng hoặc trích`);
  }

  // Tên sao: gom từ lá số tổng hợp
  const tenSao = new Set<string>();
  for (let nam = 1950; nam <= 2012; nam += 2)
    for (const thang of [1, 3, 5, 7, 9, 11])
      for (let gio = 0; gio < 24; gio += 3)
        for (const gioiTinh of ['nam', 'nu'] as const) {
          let la: LaSo;
          try {
            la = lapLaSo({ ngay: 1 + ((nam + thang + gio) % 28), thang, nam, gio, phut: 0, gioiTinh });
          } catch {
            continue;
          }
          for (const c of la.cungs) for (const s of c.sao) tenSao.add(s.ten);
        }
  const saoCua = (l: LuatQuanHe) => [
    ...l.chuDong.sao,
    ...(l.biTacDong === 'khong-ap-dung' ? [] : [...l.biTacDong.sao, ...l.biTacDong.tru]),
    ...(l.canKem === 'khong-ap-dung' ? [] : l.canKem.flat()),
    ...(l.nguong === 'khong-ap-dung' ? [] : l.nguong.tapSao),
    ...(l.dieuKienCung.biTacDong !== 'khong-ap-dung' && !Array.isArray(l.dieuKienCung.biTacDong) ? Object.keys(l.dieuKienCung.biTacDong) : []),
  ];
  for (const l of LUAT_QUAN_HE) for (const s of saoCua(l)) kiem(tenSao.has(s), `${l.ma}: không có sao tên "${s}" trên lá số tổng hợp nào`);
  for (const s of TUAN_TRIET.theoSao) for (const t of s.sao.sao) kiem(tenSao.has(t), `${s.ma}: không có sao tên "${t}"`);

  // Bảng sau duyệt C-B bản 2: các chỗ phải giữ đúng
  const theoMa = (ma: string) => LUAT_QUAN_HE.find((l) => l.ma === ma)!;
  kiem(theoMa('PHA_GAP_HOA_LINH').chacChan === 'thap' && theoMa('PHA_GAP_HOA_LINH').nguonNguoc.length > 0, 'Phá gặp Hỏa Linh: chắc chắn thấp, có nguồn ngược (KL 1629)');
  kiem(theoMa('TUONG_SO_KINH_DA').uuTien > theoMa('TUONG_CHE_SAT').uuTien, 'X4: Tướng sợ Kình Đà thắng Tướng chế sát');
  kiem(theoMa('TAM_HOA_GAP_KHONG_KIEP').uuTien > theoMa('KHOA_CHE_SAT').uuTien, 'Không Kiếp phá Khoa thắng Khoa chế sát');
  kiem(theoMa('PHU_SO_KY').muc === 'giam' && soNhom(theoMa('PHU_SO_KY').nguon) === 1, 'Phủ sợ Kỵ: một nhóm → mức giảm');
  const ky = theoMa('KY_GIAI_LIEM_THAM');
  kiem(ky.hanhMenh !== 'khong-ap-dung' && ky.hanhMenh.du[5][0] === 'Hỏa' && ky.hanhMenh.du[11][0] === 'Kim', 'X2: Kỵ giải Liêm Tham — Tỵ cần mệnh Hỏa, Hợi cần mệnh Kim');
  kiem(TUAN_TRIET.phamVi.lanCungKhac === false, 'X8: Tuần Triệt không lan sang cung khác');
  kiem(TUAN_TRIET.cungKimMoc.chacChan === 'thap', 'X6: cung Kim Mộc chỉ tăng cường độ, chắc chắn thấp');
  const phu = TUAN_TRIET.theoSao.find((s) => s.ma === 'TT_PHU')!;
  kiem(phu.tuan === 'mat' && phu.triet === 'giam', 'X10: Phủ gặp Tuần nặng, Triệt nhẹ (không bằng không)');
  kiem(soNhom(TUAN_TRIET.chanDau.nguon) >= 2, 'chặn đầu: Tổng hợp 1054 tường thuật Việt Viêm Tử → tính nhóm phu-toan-thu');

  // Đà La đắc ở tứ mộ (chủ dự án chốt 19/10/2026): luật "dùng sát đắc" phải khớp engine dosang.ts
  const daDac = [...Array(12).keys()].filter((c) => doSangCuaSao('Đà La', c) === 'D');
  const sat = theoMa('SAT_DUNG_KINH_DA').dieuKienCung.biTacDong;
  kiem(Array.isArray(sat) && sat.length === daDac.length && sat.every((c) => daDac.includes(c)), `Thất Sát dụng Kình Đà: cung Đà phải là cung Đà đắc trong engine (${daDac})`);
  const vcd = theoMa('DA_DAN_THAN_VCD');
  kiem(vcd.dieuKienCung.chuDong !== 'khong-ap-dung' && vcd.dieuKienCung.chuDong.every((c) => doSangCuaSao('Đà La', c) === 'H'), 'Đà Dần Thân vô chính diệu: là cách của Đà HÃM, không phải Đà đắc');
  kiem(vcd.bienDoi.tuan !== 'khong-doi' && vcd.bienDoi.triet !== 'khong-doi', 'Đà Dần Thân vô chính diệu: Tuần Triệt làm giảm cách (TH 2541)');
  const nn = theoMa('NHAT_NGUYET_SUU_MUI_DUNG_KY');
  kiem(nn.muc === 'lat' && nn.chacChan === 'cao' && nn.nguonNguoc.length === 0, 'Nhật Nguyệt Sửu Mùi gặp Kỵ: lật thành tốt, TH 4091 không phải câu bác');
  const ttNN = TUAN_TRIET.theoSao.find((s) => s.ma === 'TT_NHAT_NGUYET_SUU_MUI')!;
  kiem(ttNN.tuan === 'nang' && ttNN.triet === 'nang', 'Nhật Nguyệt Kỵ Sửu Mùi gặp Tuần Triệt: nâng thành cách lớn');
  kiem(theoMa('NHAT_NGUYET_KY_HONG_CACH').ngoaiLeCua === nn.ma, 'Kình Đà / Không Kiếp đồng cung làm hỏng cách Nhật Nguyệt Kỵ');

  console.log(`  bảng thật: ${LUAT_QUAN_HE.length} luật quan hệ, ${TUAN_TRIET.theoSao.length} dòng Tuần Triệt theo sao, ${moiNguon().length} nguồn`);
}

function mayKiem() {
  const NA = { sach: 'Tử vi tổng hợp.md', dong: 1, trich: 'a' };
  const NB = { sach: 'Tử Vi khảo luận.md', dong: 2, trich: 'b' };
  const NA2 = { sach: 'Tử Vi hàm số - Nguyễn Phát Lộc.md', dong: 3, trich: 'c' };
  const base = LUAT_QUAN_HE.find((l) => l.ma === 'PHU_SO_KHONG_KIEP')!;
  const mau = (x: Partial<LuatQuanHe>): LuatQuanHe => ({ ...base, ma: 'MAU', muc: 'chan', nguon: [NA, NB], ...x });
  const loiCua = (...ds: LuatQuanHe[]) => kiemBangQuanHe(ds).join(' | ');

  kiem(loiCua(mau({})) === '', 'luật mẫu hai nhóm, mức chặn → hợp lệ');
  kiem(loiCua(mau({ nguon: [NA, NA2] })).includes('một nhóm'), 'Tổng hợp + Hàm số cùng nhóm Nguyễn Phát Lộc → mức chặn bị bắt');
  kiem(loiCua(mau({ nguon: [NA, NA2], muc: 'giam' })) === '', 'một nhóm, mức giảm → hợp lệ');
  kiem(loiCua(mau({ nguon: [NA, { ...NB, tacGia: 'nguyen-phat-loc' }] })).includes('một nhóm'), 'tacGia gộp nguồn dẫn lại vào nhóm gốc');
  kiem(loiCua(mau({ nguon: [NA, { ...NB, dong: 0 }] })).includes('một nhóm'), 'nguồn không số dòng không được đếm');
  kiem(loiCua(mau({}), mau({})).includes('trùng mã'), 'bắt trùng mã');
  kiem(loiCua(mau({ muc: 'thu-hep' })).includes('ngoaiLeCua'), 'thu-hep thiếu ngoaiLeCua');
  kiem(loiCua(mau({ muc: 'thu-hep', ngoaiLeCua: 'KHONG_CO' })).includes('không có'), 'ngoaiLeCua trỏ tới luật không có');
  kiem(loiCua(mau({ ngoaiLeCua: 'MAU' })).includes('chính nó'), 'ngoaiLeCua trỏ vào chính nó');
  kiem(loiCua(mau({ nguon: [NA, { ...NB, den: 1 }] })).includes('khoảng dòng ngược'), 'bắt khoảng dòng ngược');
  kiem(loiCua(mau({ nghia: ' ' })).includes('câu nghĩa'), 'bắt thiếu câu nghĩa');

  // Ngược chiều cùng khớp: Phủ chế Không Kiếp (mẫu) ↔ Không Kiếp phá Phủ
  const che = mau({ ma: 'CHE', loai: 'CHE', chuDong: { sao: ['Thiên Phủ'], kieu: 'mot-trong' }, biTacDong: { sao: ['Địa Không'], kieu: 'mot-trong', tru: [] }, muc: 'giam' });
  const pha = mau({ ma: 'PHA' });
  kiem(loiCua(che, pha).includes('không phân uuTien'), 'bắt hai luật ngược chiều cùng ưu tiên');
  kiem(loiCua(che, { ...pha, uuTien: 2 }) === '', 'phân ưu tiên → hợp lệ');
  kiem(loiCua({ ...che, biTacDong: { sao: ['Địa Không'], kieu: 'mot-trong', tru: ['Địa Không'] } }, pha) === '', 'sao nằm trong tru → không tính là chồng');
  kiem(loiCua(che, { ...pha, viTri: 'cung-han' }) === '', 'một luật gốc, một luật hạn → không chồng');
  kiem(loiCua({ ...che, doSang: { chuDong: ['M', 'V'], biTacDong: 'bat-ky' } }, { ...pha, doSang: { chuDong: 'bat-ky', biTacDong: ['H'] } }) === '', 'độ sáng không giao → không chồng');

  // Khối Tuần Triệt: một nhóm không được ghi "mat"
  const ttMau = { ...TUAN_TRIET, theoSao: [{ ...TUAN_TRIET.theoSao[0], nguon: [NA, NA2], nguonNguoc: [] }] };
  kiem(kiemKhoiTuanTriet(ttMau).some((e) => e.includes('mat')), 'Tuần Triệt theo sao: một nhóm ghi mat bị bắt');
}

function doSang() {
  const ca: [Parameters<typeof doSangHieuDung>, ReturnType<typeof doSangHieuDung>, string][] = [
    [['M', false, false, true], 'M', 'không Tuần Triệt → giữ'],
    [['M', true, false, true], 'V', 'miếu + Tuần → hạ một bậc'],
    [['L', true, false, true], 'B', 'lợi + Tuần → bình'],
    [['M', false, true, true], 'B', 'miếu + Triệt mạnh → bình, không thành hãm'],
    [['M', false, true, false], 'V', 'Triệt hết thời mạnh → luận như Tuần'],
    [['H', true, false, true], 'B', 'hãm + Tuần → bình'],
    [['H', false, true, true], 'D', 'hãm + Triệt mạnh → đắc, không cao hơn'],
    [['H', false, true, false], 'B', 'hãm + Triệt đã yếu → như Tuần'],
    [['H', true, true, true], 'D', 'Tuần Triệt cùng cung → lấy vế Triệt'],
    [['B', true, true, true], 'B', 'bình giữ bình'],
    [[null, true, false, true], null, 'sao không có độ sáng → null'],
  ];
  for (const [vao, ra, ten] of ca) kiem(doSangHieuDung(...vao) === ra, `doSangHieuDung ${ten}: ${JSON.stringify(vao)} → ${doSangHieuDung(...vao)}, cần ${ra}`);
}

function doiChieuSach() {
  const kho = process.env.KHO_SACH_TUVI || 'D:/Tài liệu tử vi/markdown';
  if (!existsSync(kho)) {
    console.log(`  ⚠ CẢNH BÁO: không có kho sách ${kho} — CHƯA đối chiếu nguyên văn. Chạy tay trên máy có kho trước khi duyệt bảng.`);
    return;
  }
  const chuan = (x: string) => x.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const dem = new Map<string, string[]>();
  let n = 0;
  for (const { nhan, x } of moiNguon()) {
    const tep = join(kho, x.sach);
    if (!existsSync(tep)) {
      kiem(false, `${nhan}: không thấy tệp sách ${x.sach}`);
      continue;
    }
    if (!dem.has(tep)) dem.set(tep, readFileSync(tep, 'utf8').split(/\r?\n/));
    const doan = dem.get(tep)!.slice(x.dong - 1, x.den ?? x.dong).join(' ');
    kiem(chuan(doan).includes(chuan(x.trich)), `${nhan}: ${x.sach}:${x.dong}${x.den ? `–${x.den}` : ''} không có nguyên văn «${x.trich}»`);
    n++;
  }
  console.log(`  đối chiếu sách: ${n} nguồn đã so`);
}

bangThat();
mayKiem();
doSang();
doiChieuSach();
console.log(`\n${loi ? `✗ ${loi}/${soCa} ca hỏng` : `✓ ${soCa} ca xanh`}`);
process.exit(loi ? 1 : 0);
