import { lapLaSo } from '@/lib/tuvi/ansao';
import { doSangCuaSao } from '@/lib/tuvi/dosang';
import { boDau } from '../thuc-the';
import { BI_DANH_CUNG, TEN_TAT } from '../v3/truy-hoi-v3';
import { QUAN_HE, type CheDo, type MucThuVien } from './kieu';

/**
 * KIỂM TẤT ĐỊNH một mục vừa trích (KIEN-TRUC-LUAN-GIAI.md mục 7.3). Không nhờ
 * model: câu trích có thật chưa chắc quy tắc đúng — model có thể trích câu nói
 * về Mệnh mà ghi điều kiện là Quan Lộc. Trượt thì bỏ mục.
 */

let tuDien: Set<string> | null = null;
/** Mọi tên sao engine an được — dựng từ chính engine, không chép tay */
export function tuDienSao(): Set<string> {
  if (tuDien) return tuDien;
  const s = new Set<string>();
  for (let y = 1960; y < 2000; y += 7)
    for (let m = 1; m <= 12; m += 4)
      for (let g = 1; g < 24; g += 6)
        for (const gt of ['nam', 'nu'] as const)
          for (const c of lapLaSo({ ngay: 1 + ((y + m) % 27), thang: m, nam: y, gio: g, gioiTinh: gt }).cungs)
            for (const x of c.sao) s.add(x.ten);
  tuDien = s;
  return s;
}

/** Sao có độ sáng trong engine — điều kiện độ sáng cho sao khác là không khớp được */
export function coDoSang(ten: string): boolean {
  for (let i = 0; i < 12; i++) if (doSangCuaSao(ten, i)) return true;
  return false;
}

export const TEN_CUNG = [
  'Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc',
  'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ',
];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const TRANG_SINH = ['Trường Sinh', 'Mộc Dục', 'Quan Đới', 'Lâm Quan', 'Đế Vượng', 'Suy', 'Bệnh', 'Tử', 'Mộ', 'Tuyệt', 'Thai', 'Dưỡng'];

const chuan = (s: string) => boDau(s).replace(/\s+/g, ' ').trim();
/** Chuẩn để so NGUYÊN VĂN: bỏ dấu câu và gạch nối — sách OCR viết "Văn-Xương", "Phá-Quân", model chép "Văn Xương" */
const chuanSo = (s: string) => boDau(s).replace(/[^a-z0-9]+/g, ' ').trim();
/** Câu trích có nguyên văn trong văn bản không (bỏ dấu câu, gạch nối) */
export function coNguyenVan(trich: string, vanBan: string): boolean {
  return viTriNguyenVan(trich, vanBan) >= 0;
}

/**
 * Vị trí (theo chữ đã chuẩn) của câu trích trong văn bản, -1 nếu không có. Khớp đúng nguyên văn,
 * hoặc khớp GẦN: các chữ của câu trích xuất hiện theo đúng thứ tự trong một cửa sổ ≤ 1,25 lần độ
 * dài, sót không quá 10% — model hay chép thiếu / thừa một chữ (lượt thử 11.8: 16 / 48 trượt).
 * Vẫn là văn của sách: không có cửa sổ nào như vậy thì câu trích bị coi là bịa.
 */
export function viTriNguyenVan(trich: string, vanBan: string): number {
  const t = chuanSo(trich);
  const v = chuanSo(vanBan);
  if (t.length < 12) return -1;
  const dung = v.indexOf(t);
  if (dung >= 0) return dung;
  const tt = t.split(' '), vv = v.split(' ');
  const cuaSo = Math.ceil(tt.length * 1.25);
  const canKhop = Math.ceil(tt.length * 0.9);
  for (let i = 0; i < vv.length; i++) {
    if (vv[i] !== tt[0] && vv[i] !== tt[1]) continue;
    let j = 0, khop = 0;
    for (let k = i; k < Math.min(vv.length, i + cuaSo) && j < tt.length; k++) {
      if (vv[k] === tt[j]) { khop++; j++; }
      else if (j + 1 < tt.length && vv[k] === tt[j + 1]) { khop++; j += 2; }
    }
    if (khop >= canKhop) return vv.slice(0, i).join(' ').length + (i ? 1 : 0);
  }
  return -1;
}

/** Từ chỉ NHÓM sao — "gặp sát tinh" nhắc cả lục sát, không cần gọi tên từng sao */
const TU_NHOM: [RegExp, string[]][] = [
  [/(sat tinh|hung tinh|luc sat|sat dieu|ac tinh)/, ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp', 'Hóa Kỵ']],
  [/(cat tinh|luc cat|thien cat|phu tinh tot|van tinh|quy tinh)/, ['Tả Phù', 'Hữu Bật', 'Văn Xương', 'Văn Khúc', 'Thiên Khôi', 'Thiên Việt']],
  [/(tam hoa|khoa quyen loc|loc quyen khoa)/, ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa']],
];
function coTu(s: string, tu: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${tu.replace(/ /g, '[^a-z0-9]+')}($|[^a-z0-9])`).test(s);
}

/**
 * Các cách sách cổ gọi một sao: tên đủ, tên tắt ở TEN_TAT ("Vũ, Tướng"), và chữ
 * cuối của tên hai chữ ("Xương" cho Văn Xương, "Kình" cho Kình Dương, "Kỵ" cho
 * Hóa Kỵ). Rộng tay có chủ ý: đây là lưới chặn sai cung / sai sao, không phải
 * bộ lọc chính tả.
 */
function cachGoi(ten: string): string[] {
  const t = chuan(ten);
  const tu = t.split(' ');
  const ra = new Set([t, ...(TEN_TAT[ten] ?? [])]);
  if (tu.length === 2) {
    if (tu[1].length >= 2) ra.add(tu[1]);
    if (['ta', 'huu', 'kinh', 'loc', 'dao', 'hong', 'quoc', 'thai', 'tam', 'bat', 'an', 'long', 'phuong'].includes(tu[0])) ra.add(tu[0]);
  }
  return [...ra];
}

/**
 * Độ sáng theo đúng thang engine: chính tinh có M V D B H; phụ tinh chỉ có D (đắc)
 * hoặc H (hãm). Sách viết "Xương Khúc miếu" → với phụ tinh là D. Không chuẩn hoá thì
 * mục mang "M" cho Văn Xương không bao giờ khớp lá số nào.
 */
export function chuanDoSang(ten: string, ds: string[] | undefined): string[] | undefined {
  if (!ds?.length) return undefined;
  const chinhTinh = ['M', 'V', 'D', 'B', 'H'].some((m) => {
    for (let i = 0; i < 12; i++) if (doSangCuaSao(ten, i) === m && (m === 'M' || m === 'V' || m === 'B')) return true;
    return false;
  });
  const ra = chinhTinh ? ds : ds.map((m) => (m === 'B' || m === 'H' ? 'H' : 'D'));
  return [...new Set(ra.filter((m) => ['M', 'V', 'D', 'B', 'H'].includes(m)))];
}

const CHINH_TINH_TEN = ['Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh', 'Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát', 'Phá Quân'];

/** Từ độ sáng trên chữ CÓ DẤU — bỏ dấu thì "hãm" trùng "hàm" (tên sách "Tử vi hàm số"), "vượng" trùng "thịnh vượng" */
const TU_DO_SANG = /(miếu|vượng địa|miếu vượng|đắc địa|hãm địa|lạc hãm|\bhãm\b|sáng sủa)/i;

let dongCung: Set<string> | null = null;
/** Mọi cặp chính tinh engine từng an vào cùng một cung — dựng từ engine, không chép tay */
export function toHopDongCung(): Set<string> {
  if (dongCung) return dongCung;
  const s = new Set<string>();
  for (let y = 1960; y < 2000; y += 3)
    for (let m = 1; m <= 12; m += 2)
      for (const ngay of [1, 8, 15, 22, 29])
        for (const c of lapLaSo({ ngay: Math.min(ngay, 28), thang: m, nam: y, gio: 7, gioiTinh: 'nam' }).cungs) {
          const ct = c.sao.filter((x) => x.loai === 'chinh-tinh').map((x) => x.ten).sort();
          if (ct.length === 2) s.add(ct.join('+'));
        }
  dongCung = s;
  return s;
}

const MA_SANG: [RegExp, string[]][] = [
  [/miếu vượng|miếu địa|nhập miếu|miếu/i, ['M', 'V']],
  [/vượng địa/i, ['V']],
  [/đắc địa|đắc cách/i, ['D']],
  [/bình hòa|bình hoà/i, ['B']],
  [/hãm địa|lạc hãm|hãm/i, ['H']],
  [/sáng sủa/i, ['M', 'V', 'D']],
];

/**
 * Gán độ sáng bằng mã khi model quên (lượt thử 11.8: 13 / 66 mục trượt "bỏ độ sáng"): chữ độ
 * sáng đứng ngay sau tên một sao (≤ 25 ký tự) thì thuộc sao ấy; không có thì thuộc sao ĐẦU
 * TIÊN của điều kiện có độ sáng trong engine. Chỉ điền khi sao chưa có độ sáng.
 */
export function dienDoSang(dk: MucThuVien['dieuKien'], trich: string): void {
  if (!TU_DO_SANG.test(trich) || dk.sao.some((s) => s.doSang?.length)) return;
  const chu = trich.replace(/-/g, ' ');
  for (const s of dk.sao) {
    if (!coDoSang(s.ten)) continue;
    const i = chu.toLowerCase().indexOf(s.ten.toLowerCase());
    if (i < 0) continue;
    const sau = chu.slice(i + s.ten.length, i + s.ten.length + 25);
    const trung = MA_SANG.find(([re]) => re.test(sau));
    if (trung) s.doSang = chuanDoSang(s.ten, trung[1]);
  }
  if (dk.sao.some((s) => s.doSang?.length)) return;
  const dau = dk.sao.find((s) => coDoSang(s.ten));
  const trung = MA_SANG.find(([re]) => re.test(chu));
  if (dau && trung) dau.doSang = chuanDoSang(dau.ten, trung[1]);
}

/** Chữ độ sáng trên văn CÓ DẤU — bỏ dấu thì "miêu tả" thành "mieu", "ham muốn" thành "ham" */
const MA_SANG_CO_DAU: [RegExp, string[]][] = [
  [/(miếu vượng|nhập miếu|miếu địa|miếu)/gi, ['M', 'V']],
  [/vượng địa/gi, ['V']],
  [/đắc địa/gi, ['D']],
  [/bình hòa|bình hoà/gi, ['B']],
  [/(hãm địa|lạc hãm|hãm)/gi, ['H']],
];

/**
 * Độ sáng theo NGỮ CẢNH — sách hay viết đề mục "Hãm địa:" rồi mới tới các câu, nên câu trích không
 * có chữ độ sáng dù cả đoạn nói về sao hãm. Lấy chữ độ sáng GẦN NHẤT trong đề mục + 250 ký tự ngay
 * trước câu trích (trên văn gốc có dấu), gán cho sao đầu tiên có độ sáng trong engine. Chỉ khi mục
 * chưa có độ sáng nào.
 */
export function dienDoSangNguCanh(dk: MucThuVien['dieuKien'], deMuc: string | null, vanBanDoan: string, trich: string): void {
  if (dk.sao.some((s) => s.doSang?.length)) return;
  const dau = dk.sao.find((s) => coDoSang(s.ten));
  if (!dau) return;
  const van = vanBanDoan.replace(/-/g, ' ');
  const dauTrich = trich.replace(/-/g, ' ').slice(0, 20).toLowerCase();
  const i = dauTrich.length >= 8 ? van.toLowerCase().indexOf(dauTrich) : -1;
  const nguCanh = `${deMuc ?? ''} . ${i > 0 ? van.slice(Math.max(0, i - 250), i) : ''}`;
  let viTri = -1;
  let ma: string[] | null = null;
  for (const [re, m] of MA_SANG_CO_DAU) {
    for (const k of nguCanh.matchAll(re)) {
      if ((k.index ?? -1) > viTri) {
        viTri = k.index!;
        ma = m;
      }
    }
  }
  if (ma) dau.doSang = chuanDoSang(dau.ten, ma);
}

/** Cung trống mà đề mục nêu đúng MỘT cung ("TỨ QUAN LỘC CUNG") → lấy cung ấy (lượt 1: 43% mục để "mọi cung") */
export function cungTuDeMuc(duongDeMuc: string | null): string | null {
  const dm = chuan(duongDeMuc ?? '');
  const co = TEN_CUNG.filter((c) => coTu(dm, chuan(c)));
  return co.length === 1 ? co[0] : null;
}

export interface KetQuaKiemMuc {
  dat: boolean;
  lyDo: string[];
  /** Chế độ sau khi kiểm — không đủ dấu hiệu thì ép về add */
  cheDo: CheDo;
}

/** Chữ trong câu trích cho thấy tổ hợp LẬT / HOÁ GIẢI / ĐỔI nghĩa (mục 6.2) */
const DAU_HIEU: Record<Exclude<CheDo, 'add'>, RegExp> = {
  override: /(phan vi|trai lai|lai thanh|lai la|pha cach|hoa ra|nguoc lai|khong con)/,
  neutralize: /(giai|hoa giai|khong so|chang so|khong ky|chang ky|che|bot|giam)/,
  modify: /(neu|tuy|nhung|song|chi|kem|bot|giam|them|cang)/,
};

export function kiemMuc(
  m: Pick<MucThuVien, 'dieuKien' | 'y' | 'cheDo'> & { trich: string },
  doan: { noiDung: string; duongDeMuc: string | null }
): KetQuaKiemMuc {
  const lyDo: string[] = [];
  const noiDungChuan = chuanSo(doan.noiDung);
  const trichChuan = chuanSo(m.trich);
  const dict = tuDienSao();

  // 1. Câu trích có nguyên văn trong đoạn
  if (trichChuan.length < 12) lyDo.push('câu trích quá ngắn');
  const viTri = viTriNguyenVan(m.trich, doan.noiDung);
  if (viTri < 0) lyDo.push('câu trích không có nguyên văn trong đoạn');

  // 2. Tên sao, cung, quan hệ, độ sáng hợp lệ
  const dk = m.dieuKien;
  if (!dk.sao.length && !dk.nhom?.length) lyDo.push('điều kiện không có sao nào');
  for (const n of dk.nhom ?? []) {
    if (!(QUAN_HE as readonly string[]).includes(n.quanHe)) lyDo.push(`quan hệ lạ: ${n.quanHe}`);
    if (n.toiThieu < 1 || n.toiThieu > n.ten.length) lyDo.push('nhóm có số tối thiểu sai');
    for (const t of n.ten) if (!dict.has(t)) lyDo.push(`sao không có trong engine: ${t}`);
  }
  for (const s of [...dk.sao, ...(dk.khong ?? [])]) {
    if (!dict.has(s.ten)) lyDo.push(`sao không có trong engine: ${s.ten}`);
    if (!(QUAN_HE as readonly string[]).includes(s.quanHe)) lyDo.push(`quan hệ lạ: ${s.quanHe}`);
  }
  for (const s of dk.sao) if (s.doSang?.length && !coDoSang(s.ten)) lyDo.push(`${s.ten} không có độ sáng trong engine`);
  for (const c of dk.cung) if (!TEN_CUNG.includes(c)) lyDo.push(`cung lạ: ${c}`);
  for (const c of dk.chi ?? []) if (!CHI.includes(c)) lyDo.push(`chi lạ: ${c}`);
  for (const t of dk.thuocTinh?.trangSinh ?? []) if (!TRANG_SINH.includes(t)) lyDo.push(`tràng sinh lạ: ${t}`);

  // 2b. Chính tinh đồng cung phải là tổ hợp engine an được (lượt 1 có mục đòi đủ năm sao Tử Vũ Tướng Liêm Phủ tại một cung)
  const chinhTai = dk.sao.filter((s) => s.quanHe === 'o-cung' && CHINH_TINH_TEN.includes(s.ten)).map((s) => s.ten);
  if (chinhTai.length > 2) lyDo.push('quá hai chính tinh đồng cung');
  else if (chinhTai.length === 2 && !toHopDongCung().has([...chinhTai].sort().join('+'))) lyDo.push(`${chinhTai.join(' + ')} không bao giờ đồng cung`);

  // 2c. Câu trích nói độ sáng mà mục không mang độ sáng → mất đúng điều kiện đổi nghĩa (lượt 1: 8% mục có độ sáng)
  if (TU_DO_SANG.test(m.trich) && !dk.sao.some((s) => s.doSang?.length)) lyDo.push('bỏ độ sáng');

  // 3. Sao và cung trong điều kiện PHẢI được nhắc: câu trích + ~300 ký tự trước nó + đề mục
  const truoc = viTri >= 0 ? noiDungChuan.slice(Math.max(0, viTri - 300), viTri) : '';
  const ngu = `${chuan(doan.duongDeMuc ?? '')} ${truoc} ${trichChuan}`;
  for (const s of dk.sao) if (!cachGoi(s.ten).some((g) => coTu(ngu, g))) lyDo.push(`không thấy nhắc ${s.ten}`);
  const nhomNhac = TU_NHOM.filter(([re]) => re.test(ngu)).flatMap(([, ds]) => ds);
  for (const t of (dk.nhom ?? []).flatMap((n) => n.ten)) if (!nhomNhac.includes(t) && !cachGoi(t).some((g) => coTu(ngu, g))) lyDo.push(`không thấy nhắc ${t}`);
  for (const c of dk.cung) if (!(BI_DANH_CUNG[c] ?? [chuan(c)]).some((b) => coTu(ngu, b))) lyDo.push(`không thấy nhắc cung ${c}`);

  // 4. Câu nghĩa trung tính
  const soChu = m.y.trim().split(/\s+/).filter(Boolean).length;
  if (soChu < 4 || soChu > 45) lyDo.push(`câu nghĩa ${soChu} chữ (cần 4–45)`);
  if (/\bbạn\b/i.test(m.y)) lyDo.push('câu nghĩa có "bạn"');
  if (/\b(nên|hãy|cần phải)\b/i.test(m.y)) lyDo.push('câu nghĩa có lời khuyên');

  // 5. Chế độ khác add phải có dấu hiệu trong câu trích; không thì ép về add
  let cheDo: CheDo = m.cheDo;
  if (cheDo !== 'add' && !DAU_HIEU[cheDo].test(trichChuan)) cheDo = 'add';

  return { dat: lyDo.length === 0, lyDo, cheDo };
}

/** Khoá gộp: cùng điều kiện (không kể thứ tự sao) + cùng chiều */
export function khoaGop(m: Pick<MucThuVien, 'dieuKien' | 'nhan'>): string {
  const dk = m.dieuKien;
  const sao = dk.sao.map((s) => `${s.ten}@${s.quanHe}${s.doSang?.length ? `:${[...s.doSang].sort().join('')}` : ''}`).sort();
  const khong = (dk.khong ?? []).map((s) => `${s.ten}@${s.quanHe}`).sort();
  const nhom = (dk.nhom ?? []).map((n) => `${[...n.ten].sort().join('|')}@${n.quanHe}>=${n.toiThieu}`).sort();
  return JSON.stringify([[...dk.cung].sort(), [...(dk.chi ?? [])].sort(), sao, khong, nhom, dk.thuocTinh ?? {}, dk.gioiTinh ?? '', m.nhan.chieu]);
}

/** Khoá điều kiện, bỏ chiều — hai mục cùng khoá này mà khác chiều là mâu thuẫn */
export function khoaDieuKien(m: Pick<MucThuVien, 'dieuKien' | 'nhan'>): string {
  return khoaGop({ ...m, nhan: { ...m.nhan, chieu: 'trung' } });
}
