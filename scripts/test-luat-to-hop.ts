/**
 * Luật tổ hợp lớp hạn (lib/tuvi/luat-to-hop.ts) — offline, tất định, không gọi model.
 *
 *   npx tsx scripts/test-luat-to-hop.ts
 *
 * Hai phần:
 *  1. Bảng thật `LUAT_TO_HOP`: cấu trúc hợp lệ, tên sao có thật, và mỗi dòng phải khớp ít nhất
 *     một lần khi quét lá số — luật không bao giờ khớp là luật viết sai (bài học cách cục
 *     "Kình Dương đồng cung Thiên Mã", 0/6.912 lá), và tệp sách phải có trong NHOM_NGUON.
 *  2. Hàm khớp chạy trên bảng MẪU của bài này (không phải luật sách), lá đối chiếu 24/08/2000
 *     giờ Tuất nam, năm 2026 — vị trí viết tay:
 *       lưu Kỵ Liêm Trinh ở Tuất (Mệnh); Lưu Lộc Tồn Tỵ, Lưu Kình Ngọ, Lưu Đà Thìn (can Bính);
 *       Kình gốc ở Dậu (Lộc Tồn Canh ở Thân); tiểu hạn = đại vận = Tý, ở đó có đại vận Lộc
 *       (Tham Lang) và lưu Khoa (Văn Xương).
 */
import { lapLaSo, type LaSo } from '../lib/tuvi/ansao';
import { lopHan } from '../lib/tuvi/tu-hoa-han';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LUAT_TO_HOP, NHOM_NGUON, khopLuatToHop, kiemBangLuat, type LuatToHop } from '../lib/tuvi/luat-to-hop';

let loi = 0;
let soCa = 0;
const kiem = (dk: boolean, msg: string) => {
  soCa++;
  if (!dk) {
    loi++;
    console.error('  ✗', msg);
  }
};

const NGUON_MAU = [
  { sach: 'mau-a.md', dong: 1, trich: 'trích a' },
  { sach: 'mau-b.md', dong: 2, trich: 'trích b' },
];
const kyHanTp = () => ({ loai: 'hoa', hoa: 'Hóa Kỵ', nguon: 'han' }) as const;
const mau = (l: Partial<LuatToHop> & Pick<LuatToHop, 'ma' | 'thanhPhan'>): LuatToHop => ({
  phamVi: 'tam-phuong',
  apDung: ['cung-hoi'],
  chieu: 'can-tro',
  nghia: 'câu mẫu',
  nguon: NGUON_MAU,
  ...l,
});

function hamKhop() {
  const l = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 20, phut: 30, gioiTinh: 'nam' });
  const lh = lopHan(l, 2026);
  const MENH = 10;

  const kyKinhLuu = mau({
    ma: 'KY_KINH_LUU',
    thanhPhan: [
      { loai: 'hoa', hoa: 'Hóa Kỵ', nguon: 'han' },
      { loai: 'sao', ten: 'Kình Dương', lop: 'luu' },
    ],
  });
  const k1 = khopLuatToHop(l, lh, MENH, [kyKinhLuu]);
  kiem(k1.length === 1, `lưu Kỵ (Tuất) + Lưu Kình (Ngọ) cùng tam phương Mệnh → khớp, có ${k1.length}`);
  kiem(
    k1[0]?.viTri.map((v) => `${v.ten}@${v.chiIndex}`).join(',') === 'Hóa Kỵ (Liêm Trinh)@10,Lưu Kình Dương@6',
    `vị trí thành phần: ${k1[0]?.viTri.map((v) => `${v.ten}@${v.chiIndex}`).join(',')}`
  );
  kiem(khopLuatToHop(l, lh, MENH, [{ ...kyKinhLuu, phamVi: 'dong-cung' }]).length === 0, 'đồng cung: Kình lưu ở Ngọ không ở Tuất → không khớp');

  // Kình GỐC ở Dậu, ngoài tam phương Tuất → lop 'goc' không được bắt nhầm Lưu Kình ở Ngọ
  const kyKinhGoc = mau({ ma: 'KY_KINH_GOC', thanhPhan: [kyKinhLuu.thanhPhan[0], { loai: 'sao', ten: 'Kình Dương', lop: 'goc' }] });
  kiem(khopLuatToHop(l, lh, MENH, [kyKinhGoc]).length === 0, 'lop goc không lấy sao lưu');
  const kyKinhBatKy = mau({ ma: 'KY_KINH_BK', thanhPhan: [kyKinhLuu.thanhPhan[0], { loai: 'sao', ten: 'Kình Dương', lop: 'bat-ky' }] });
  kiem(khopLuatToHop(l, lh, MENH, [kyKinhBatKy]).length === 1, 'lop bat-ky lấy được sao lưu');

  // Hoá theo nguồn: Kỵ gốc là Thiên Đồng ở Sửu (ngoài tam phương Tuất) → nguon 'goc' không khớp
  const kyGoc = mau({ ma: 'KY_GOC', thanhPhan: [{ loai: 'hoa', hoa: 'Hóa Kỵ', nguon: 'goc' }, kyKinhLuu.thanhPhan[1]] });
  kiem(khopLuatToHop(l, lh, MENH, [kyGoc]).length === 0, 'nguon goc không lấy lưu Kỵ');

  // Tiểu hạn trùng đại vận ở Tý: một luật xét cả hai chỉ trả một lần, gắn loại đứng trước
  const locKhoa = mau({
    ma: 'LOC_KHOA_TY',
    phamVi: 'dong-cung',
    apDung: ['tieu-han', 'dai-van'],
    chieu: 'thuan',
    thanhPhan: [
      { loai: 'hoa', hoa: 'Hóa Lộc', nguon: 'dai-van' },
      { loai: 'hoa', hoa: 'Hóa Khoa', nguon: 'nam' },
    ],
  });
  const k2 = khopLuatToHop(l, lh, null, [locKhoa]);
  kiem(k2.length === 1 && k2[0].cungXet === 'tieu-han' && k2[0].chiIndex === 0, `trùng cung chỉ trả một lần: ${JSON.stringify(k2.map((k) => [k.cungXet, k.chiIndex]))}`);

  kiem(khopLuatToHop(l, lh, null, [{ ...locKhoa, apDung: ['nguyet-han'] }]).length === 0, 'không truyền tháng → không xét nguyệt hạn');
  kiem(khopLuatToHop(l, lh, null, [kyKinhLuu]).length === 0, 'cung hỏi null → không xét cung hỏi');
  kiem(khopLuatToHop(l, lopHan(l, 2002), null, [{ ...locKhoa, apDung: ['dai-van'] }]).length === 0, 'ngoài đại vận → không xét đại vận');

  // Xung chiếu: Lưu Đà La ở Thìn, xung chiếu Tuất
  const kyDa = mau({ ma: 'KY_DA_LUU', thanhPhan: [kyKinhLuu.thanhPhan[0], { loai: 'sao', ten: 'Đà La', lop: 'luu' }] });
  kiem(khopLuatToHop(l, lh, MENH, [kyDa]).length === 1, 'Lưu Đà ở cung xung chiếu → tam phương khớp');
  kiem(khopLuatToHop(l, lh, MENH, [{ ...kyDa, phamVi: 'dong-cung' }]).length === 0, 'Lưu Đà ở cung xung chiếu → đồng cung không khớp');

  // xung-chieu: sao gốc neo ở cung xét, sao lưu đồng cung hoặc xung.
  // Liêm Trinh gốc ở Tuất (10), Thất Sát gốc ở Thìn (4), Lưu Đà ở Thìn (4); Đà gốc ở Mùi (7)
  const liemDa = mau({
    ma: 'LIEM_DA_LUU',
    phamVi: 'xung-chieu',
    thanhPhan: [
      { loai: 'sao', ten: 'Liêm Trinh', lop: 'goc' },
      { loai: 'sao', ten: 'Đà La', lop: 'luu' },
    ],
  });
  kiem(khopLuatToHop(l, lh, MENH, [liemDa]).length === 1, 'xung-chieu: Liêm gốc ở Tuất + Lưu Đà xung từ Thìn → khớp');
  kiem(khopLuatToHop(l, lh, 4, [liemDa]).length === 0, 'xung-chieu: xét Thìn, Liêm gốc chỉ ở cung xung → KHÔNG khớp (lỗi cung trống)');
  const satDa = mau({ ...liemDa, ma: 'SAT_DA_LUU', thanhPhan: [{ loai: 'sao', ten: 'Thất Sát', lop: 'goc' }, liemDa.thanhPhan[1]] });
  kiem(khopLuatToHop(l, lh, 4, [satDa]).length === 1, 'xung-chieu: Thất Sát gốc + Lưu Đà cùng ở Thìn → khớp');
  const liemDaBk = mau({ ...liemDa, ma: 'LIEM_DA_BK', thanhPhan: [liemDa.thanhPhan[0], { loai: 'sao', ten: 'Đà La', lop: 'bat-ky' }] });
  const kBk = khopLuatToHop(l, lh, MENH, [liemDaBk]);
  kiem(
    kBk.length === 1 && kBk[0].viTri.map((v) => v.ten).join(',') === 'Liêm Trinh,Lưu Đà La',
    `xung-chieu bat-ky: Đà gốc ở Mùi bị loại, Lưu Đà ở cung xung được lấy: ${kBk[0]?.viTri.map((v) => v.ten).join(',')}`
  );
  // Đà gốc ở Mùi (7) là cung XUNG của Sửu; không có Đà nào ở Sửu, Lưu Đà ở Thìn → không được khớp
  const dongDaBk = mau({ ...liemDa, ma: 'DONG_DA_BK', thanhPhan: [{ loai: 'sao', ten: 'Thiên Đồng', lop: 'goc' }, liemDaBk.thanhPhan[1]] });
  kiem(khopLuatToHop(l, lh, 1, [dongDaBk]).length === 0, 'xung-chieu bat-ky: Đà gốc chỉ ở cung xung → KHÔNG khớp');
  // Hoá gốc cũng là neo: Kỵ gốc (Thiên Đồng) và lưu Lộc (Thiên Đồng) cùng ở Sửu (1)
  const kyLoc = mau({
    ma: 'KY_GOC_LOC_LUU',
    phamVi: 'xung-chieu',
    thanhPhan: [
      { loai: 'hoa', hoa: 'Hóa Kỵ', nguon: 'goc' },
      { loai: 'hoa', hoa: 'Hóa Lộc', nguon: 'nam' },
    ],
  });
  kiem(khopLuatToHop(l, lh, 1, [kyLoc]).length === 1, 'xung-chieu: Kỵ gốc + lưu Lộc cùng ở Sửu → khớp');
  kiem(khopLuatToHop(l, lh, 7, [kyLoc]).length === 0, 'xung-chieu: xét Mùi (xung Sửu), hoá gốc không ở đó → KHÔNG khớp');

  // kiemBangLuat bắt từng lỗi cấu trúc
  const loiCua = (x: LuatToHop) => kiemBangLuat([x]).join(' | ');
  kiem(kiemBangLuat([kyKinhLuu, locKhoa]).length === 0, 'bảng mẫu hợp lệ');
  kiem(kiemBangLuat([kyKinhLuu, kyKinhLuu]).some((e) => e.includes('trùng mã')), 'bắt trùng mã');
  kiem(loiCua({ ...kyKinhLuu, thanhPhan: [kyKinhLuu.thanhPhan[0]] }).includes('≥2 thành phần'), 'bắt tổ hợp một thành phần');
  kiem(loiCua(kyGoc).length === 0 && loiCua({ ...kyKinhGoc, thanhPhan: [{ loai: 'hoa', hoa: 'Hóa Kỵ', nguon: 'goc' }, kyKinhGoc.thanhPhan[1]] }).includes('hoá theo hạn'), 'bắt luật toàn sao gốc');
  kiem(loiCua({ ...kyKinhLuu, nguon: [NGUON_MAU[0], { ...NGUON_MAU[0], dong: 9 }] }).includes('≥2 nguồn'), 'bắt một sách ghi hai dòng');
  kiem(loiCua({ ...kyKinhLuu, nguon: [NGUON_MAU[0], { ...NGUON_MAU[1], dong: 0 }] }).includes('≥2 nguồn'), 'bắt nguồn không số dòng');
  kiem(loiCua({ ...kyKinhLuu, nguon: [NGUON_MAU[0], { ...NGUON_MAU[1], trich: ' ' }] }).includes('≥2 nguồn'), 'bắt nguồn không trích nguyên văn');
  const cungBo = [
    { sach: 'Tử Vi ứng dụng - Chính Tinh.md', dong: 1, trich: 'x' },
    { sach: 'Tử Vi ứng dụng - Phụ Tinh.md', dong: 2, trich: 'y' },
  ];
  kiem(loiCua({ ...kyKinhLuu, nguon: cungBo }).includes('≥2 nguồn'), 'bắt hai tệp cùng một bộ (Ứng dụng) tính là một nguồn');
  kiem(loiCua({ ...kyKinhLuu, nguon: [cungBo[0], { sach: 'Tử vi tổng hợp.md', dong: 3, trich: 'z' }] }) === '', 'hai nhóm khác nhau → hợp lệ');
  kiem(loiCua({ ...liemDa, thanhPhan: [kyHanTp(), { loai: 'sao', ten: 'Đà La', lop: 'luu' }] }).includes('neo'), 'bắt xung-chieu không có thành phần gốc');
  kiem(loiCua({ ...kyKinhLuu, nghia: ' ' }).includes('câu nghĩa'), 'bắt thiếu câu nghĩa');
  kiem(loiCua({ ...kyKinhLuu, apDung: [] }).includes('cung áp dụng'), 'bắt thiếu cung áp dụng');
  const kinhGoc = { loai: 'sao', ten: 'Kình Dương', lop: 'goc' } as const;
  const kyHan = kyKinhLuu.thanhPhan[0];
  kiem(loiCua({ ...kyKinhLuu, thanhPhan: [kyHan, kinhGoc, kinhGoc] }).includes('thành phần lặp'), 'bắt Kình gốc + Kình gốc');
  kiem(loiCua({ ...kyKinhLuu, thanhPhan: [kyHan, kinhGoc, { ...kinhGoc, lop: 'bat-ky' }] }).includes('thành phần lặp'), 'bắt Kình gốc + Kình bất kỳ');
  kiem(loiCua({ ...kyKinhLuu, thanhPhan: [kyHan, { loai: 'hoa', hoa: 'Hóa Kỵ', nguon: 'nam' }] }).includes('thành phần lặp'), 'bắt Kỵ theo hạn + lưu Kỵ');
  kiem(loiCua({ ...kyKinhLuu, thanhPhan: [kyHan, kinhGoc, { ...kinhGoc, lop: 'luu' }] }) === '', 'Kình gốc + Kình lưu là hai sao khác nhau → hợp lệ');
  kiem(loiCua({ ...kyKinhLuu, thanhPhan: [kyHan, { loai: 'hoa', hoa: 'Hóa Kỵ', nguon: 'goc' }] }) === '', 'Kỵ gốc + Kỵ theo hạn → hợp lệ');
}

function bangThat() {
  kiem(kiemBangLuat(LUAT_TO_HOP).length === 0, `bảng thật hợp lệ: ${kiemBangLuat(LUAT_TO_HOP).join(' | ')}`);
  for (const x of LUAT_TO_HOP)
    for (const s of x.nguon) kiem(s.sach in NHOM_NGUON, `${x.ma}: tệp sách lạ "${s.sach}" (không có trong NHOM_NGUON)`);

  doiChieuSach();

  const tenSao = new Set<string>();
  const dem = new Map<string, number>(LUAT_TO_HOP.map((x) => [x.ma, 0]));
  for (let nam = 1950; nam <= 2012; nam += 2) {
    for (const thang of [1, 3, 5, 7, 9, 11]) {
      for (let gio = 0; gio < 24; gio += 3) {
        for (const gioiTinh of ['nam', 'nu'] as const) {
          let la: LaSo;
          try {
            la = lapLaSo({ ngay: 1 + ((nam + thang + gio) % 28), thang, nam, gio, phut: 0, gioiTinh });
          } catch {
            continue;
          }
          for (const c of la.cungs) for (const s of c.sao) tenSao.add(s.ten);
          if (!LUAT_TO_HOP.length) continue;
          for (const namXem of [2025, 2026, 2027]) {
            const lh = lopHan(la, namXem, 1 + (nam % 12));
            for (const k of khopLuatToHop(la, lh, la.cungs.find((c) => c.tenCung === 'Mệnh')!.chiIndex))
              dem.set(k.luat.ma, (dem.get(k.luat.ma) ?? 0) + 1);
          }
        }
      }
    }
  }
  for (const x of LUAT_TO_HOP) {
    for (const tp of x.thanhPhan)
      if (tp.loai === 'sao') kiem(tenSao.has(tp.ten), `${x.ma}: không có sao tên "${tp.ten}" trên lá số nào`);
    kiem((dem.get(x.ma) ?? 0) > 0, `${x.ma}: quét không khớp lần nào → luật viết sai`);
  }
  console.log(`  bảng thật: ${LUAT_TO_HOP.length} luật${LUAT_TO_HOP.length ? `, khớp ${JSON.stringify(Object.fromEntries(dem))}` : ' (chờ duyệt)'}`);
}

/**
 * Mỗi nguồn: câu trích phải có nguyên văn ở đúng dòng, và phải gọi tên mọi sao của luật (sao
 * lưu thì kèm chữ «lưu»). Chỉ chạy khi máy có kho sách (CI không có → bỏ qua, ghi rõ). Bắt được
 * dẫn nhầm dòng / bịa trích; KHÔNG bắt được trích nói bộ sao rộng hơn (Tang Hổ thay cho Hổ) —
 * chỗ đó vẫn phải đọc bằng mắt khi duyệt.
 */
/** Sách hay gọi tắt một chữ; chỉ ghi chữ đủ phân biệt (không «la», «thiên») */
const TEN_GOI_TAT: Record<string, string[]> = {
  'Kình Dương': ['Kình'],
  'Đà La': ['Đà'],
  'Bạch Hổ': ['Hổ'],
  'Tang Môn': ['Tang'],
};

function doiChieuSach() {
  const kho = process.env.KHO_SACH_TUVI || 'D:/Tài liệu tử vi/markdown';
  if (!existsSync(kho)) {
    console.log(`  đối chiếu sách: bỏ qua (không có ${kho})`);
    return;
  }
  const chuan = (x: string) => x.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  let n = 0;
  for (const x of LUAT_TO_HOP)
    for (const s of x.nguon) {
      const tep = join(kho, s.sach);
      if (!existsSync(tep)) {
        kiem(false, `${x.ma}: không thấy tệp sách ${s.sach}`);
        continue;
      }
      const dong = readFileSync(tep, 'utf8').split(/\r?\n/)[s.dong - 1] ?? '';
      kiem(chuan(dong).includes(chuan(s.trich)), `${x.ma}: ${s.sach}:${s.dong} không có nguyên văn «${s.trich}»`);
      const t = chuan(s.trich);
      for (const tp of x.thanhPhan) {
        if (tp.loai !== 'sao') continue;
        const coTen = [tp.ten, ...(TEN_GOI_TAT[tp.ten] ?? [])].some((ten) => t.includes(chuan(ten)));
        kiem(coTen && (tp.lop !== 'luu' || t.includes('lưu')), `${x.ma}: trích ${s.sach}:${s.dong} không gọi tên ${tp.lop === 'luu' ? 'lưu ' : ''}${tp.ten}`);
      }
      n++;
    }
  console.log(`  đối chiếu sách: ${n} nguồn khớp nguyên văn`);
}

hamKhop();
bangThat();
console.log(`\n${loi ? `✗ ${loi}/${soCa} ca hỏng` : `✓ ${soCa} ca xanh`}`);
process.exit(loi ? 1 : 0);
