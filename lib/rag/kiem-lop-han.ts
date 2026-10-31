/** CEL-200: kiểm lời lớp hạn. Thuần; chỉ nhận bảng sự thật đã hiện trong prompt. */
import type { LaSo } from '@/lib/tuvi/ansao';
import { lopHan, type HoaHan } from '@/lib/tuvi/tu-hoa-han';
import type { DuKienLaSo } from './boi-canh-la-so';
import { CUM_TIENG_LONG_CAM } from './chuan-ngon-ngu';
import { AN_DU_CAM } from './dau-an';
import { khoaTen, quetTen } from './focused/quet-ten';

export const PHIEN_BAN_VALIDATOR_LOP_HAN = '2026.10.1';
const chuan = (s: string) => s.normalize('NFC').toLowerCase().replaceAll('hoá', 'hóa');
const thoat = (s: string) => [...s].map((c) => '.*+?^${}()|[]'.includes(c) || c.charCodeAt(0) === 92 ? String.fromCharCode(92) + c : c).join('');
const cumCam = [...CUM_TIENG_LONG_CAM, 'chiếc xe', 'con đường', 'mặt đường', 'đường xấu', 'đường tốt', 'xe tốt', 'xe xấu', 'xe vững', 'xe yếu', 'chồng lớp', 'lớp nền', 'nền sẵn', 'lớp hạn', 'tín hiệu', 'lực cản', 'kho chưa có', 'không có tài liệu', 'không có nguồn', 'chưa có căn cứ trong kho'];
const CAM = new RegExp(`(?<![\\p{L}\\p{M}])(?:${cumCam.map(thoat).join('|')})(?![\\p{L}\\p{M}])`, 'iu');
/**
 * "nền tảng" là từ thường, không phải ẩn dụ "nền": doiTenCung tự viết Điền Trạch thành
 * "phần chỗ ở và nền tảng" (sua-chua.ts), nên câu nhà cửa nào cũng dính. Đo 31/10.
 */
const AN_DU_LOP_HAN = new RegExp(AN_DU_CAM.source.replace('nền|', 'nền(?!\\s+tảng)|'), AN_DU_CAM.flags);
export function loiChuLopHan(van: string): string | null {
  return van.match(CAM)?.[0] ?? van.match(AN_DU_LOP_HAN)?.[0] ?? null;
}

/** Q-nguon: thu hẹp kết luận, không tự thuật tình trạng kho. Đường tắt giữ nguyên. */
export function chuNguonLopHan(s: string, bat = false): string {
  if (!bat) return s;
  return s
    .replaceAll('(Không có nguồn nào trong kho tri thức khớp với câu hỏi này.)', '(Chỉ nhận định trong phạm vi dữ kiện lá số đã xác nhận.)')
    .replaceAll('hãy nói thẳng là chưa đủ căn cứ và thu hẹp kết luận lại', 'hãy thu hẹp kết luận và nói với mức chắc chắn tương ứng; không nói về việc thiếu tài liệu hay nguồn')
    .replace(/LƯU Ý: không có nguồn tham chiếu nào[^\n]*/gu, 'Chỉ mô tả điều dữ kiện lá số xác nhận; thu hẹp nhận định, không tự bổ sung học thuyết và không kể về kho hay tài liệu.')
    .replace(/Không có nguồn tham chiếu[^\n]*/gu, 'Chỉ nói trong phạm vi dữ kiện xác nhận, với mức chắc chắn vừa phải; không tự bổ sung học thuyết.');
}

export interface HoaTrongPrompt extends HoaHan { nam: number; ma: string; cuaSo: string[] }
export interface BangHoaLoi { hoa: HoaTrongPrompt[]; nam: number[]; cuaSo: Record<string, string[]> }
/** Không lấy d.sao làm bằng chứng: cặp phải xuất hiện nguyên văn trong noiDung. */
export function bangHoaChoLoi(laSo: LaSo, duKien: readonly DuKienLaSo[], nam: number[], cuaSo: Record<string, string[]> = {}): BangHoaLoi {
  const hoa: HoaTrongPrompt[] = [];
  for (const n of new Set(nam)) {
    const b = lopHan(laSo, n);
    for (const [loai, ds] of [['tu-hoa-goc', b.tuHoaGoc], ['luu-tu-hoa', b.luuTuHoa], ['tu-hoa-dai-van', b.tuHoaDaiVan]] as const) {
      for (const d of duKien.filter((x) => x.loai === loai)) {
        if (loai !== 'tu-hoa-goc' && !d.noiDung.startsWith(`Năm ${n} `) && !d.noiDung.includes(`năm ${n}:`)) continue;
        for (const h of ds) {
          if (!chuan(d.noiDung).includes(chuan(`${h.hoa} vào ${h.sao} (cung ${h.tenCung})`))) continue;
          hoa.push({ ...h, nam: n, ma: d.id, cuaSo: Object.keys(cuaSo).filter((w) => loai === 'tu-hoa-goc' || cuaSo[w].includes(d.id)) });
        }
      }
    }
  }
  return { hoa, nam: [...new Set(nam)], cuaSo };
}

const HOA_RE = /(?<![\p{L}\p{M}])(?:lưu\s+)?hóa\s+(?:lộc|quyền|khoa|kỵ)(?![\p{L}\p{M}])/giu;
const TEN_CUNG = ['Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc', 'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ'];

/** Đọc từng hoá trong MỘT câu (đã chuẩn hoá): gắn sao nào, lớp nào viết ra, cung / năm nào kèm theo. */
function docHoa(cau: string) {
  const ds = [...cau.matchAll(HOA_RE)];
  let lopKeThua: HoaHan['nguon'] | undefined;
  return ds.map((m, i) => {
    const tu = m.index!;
    const den = tu + m[0].length;
    const truoc = cau.slice(i ? ds[i - 1].index! + ds[i - 1][0].length : 0, tu);
    const sau = cau.slice(den, ds[i + 1]?.index ?? cau.length);
    const saoSau = quetTen(sau).filter((t) => t.loai === 'sao' && !t.ten.startsWith('Hóa '));
    const saoTruoc = quetTen(truoc).filter((t) => t.loai === 'sao' && !t.ten.startsWith('Hóa '));
    // Chọn hướng có quan hệ được viết rõ; không đoán sao từ tên hoá.
    // Cho phép tên lớp chen giữa ("Hóa Quyền đại vận vào Thái Âm"): đo 31/10 bắt nhầm câu đúng dữ kiện.
    // Tên lớp vẫn nằm trong `ve` nên phần nhận lớp bên dưới không đổi.
    const sauRo = /^\s*(?:(?:của\s+)?(?:đại vận|lưu niên|năm\s+(?:nay|\d{4})|(?:lá số\s+)?gốc|năm sinh)\s*,?\s+)?(?:(?:vào|trên|của|tại|ở|gắn với|ứng với|on|to|in|of)\s+)?(?:sao\s+)?/u.exec(sau)?.[0].length ?? 0;
    const tenSau = saoSau[0] && chuan(sau).slice(sauRo).startsWith(khoaTen(saoSau[0].ten)) ? saoSau[0].ten : null;
    const sao = tenSau ?? (saoTruoc.length === 1 ? saoTruoc[0].ten : null);
    const ve = truoc + ' ' + sau;
    const lopViet: HoaHan['nguon'] | undefined = m[0].startsWith('lưu') ? 'nam'
      : /đại vận|major period|decade/u.test(ve) ? 'dai-van'
      : /(?:lá số )?gốc|năm sinh|natal|birth/u.test(ve) ? 'goc'
      : /lưu niên|annual|yearly|(?:của|theo|thuộc)\s+(?:can\s+)?năm/u.test(ve) ? 'nam' : undefined;
    const nguon = lopViet ?? lopKeThua;
    if (nguon) lopKeThua = nguon;
    const cung = TEN_CUNG.filter((c) => new RegExp(`(?<![\\p{L}\\p{M}])${chuan(c)}(?![\\p{L}\\p{M}])`, 'u').test(ve));
    const namTrongVe = [...ve.matchAll(/(?<!\d)(?:19|20)\d{2}(?!\d)/gu)].map((x) => +x[0]);
    // Tên lớp đứng SÁT hoá ("lưu Hóa Kỵ đại vận"), khác chữ "đại vận" nói về sao khác cùng câu
    const lopSat = sau.slice(0, sauRo) + ' ' + (/(?:đại vận|lưu niên|gốc)\s*,?\s*$/u.exec(truoc)?.[0] ?? '');
    return { m, tu, den, sau, ve, lopSat, saoSau, tenSau, sao, nguon, lopViet, cung, namTrongVe };
  });
}

/**
 * Một hoá gắn nhiều sao ("Hóa Kỵ vào Liêm Trinh và Tử Vi"). Sao đứng sau "cùng / gặp / với" mà không
 * nhận hoá nào trong bảng là sao đi kèm, không tính. Đo 31/10 lần 6: "lưu Hóa Kỵ vào Liêm Trinh cùng
 * Kình Dương" bị chặn dù Kình Dương không nhận hoá.
 */
function ganNhieuSao(h: ReturnType<typeof docHoa>[number], bang: BangHoaLoi): boolean {
  const sau = chuan(h.sau);
  return !!h.tenSau && h.saoSau.slice(1).some((t) => bang.hoa.some((x) => khoaTen(x.sao) === khoaTen(t.ten))
    || !new RegExp(`(?:cùng|gặp|với)\\s+(?:sao\\s+)?${khoaTen(t.ten)}`, 'u').test(sau));
}

/**
 * Hóa không ghi lớp mà khớp đúng MỘT lớp trong bảng thì tự ghi lớp: "lưu Hóa Kỵ", "Hóa Kỵ đại vận",
 * "Hóa Quyền gốc". Tất định, không gọi model. Đo 31/10: 27/64 lần nhắc Hóa không ghi lớp, nên hoá
 * gốc, lưu năm và đại vận đứng cạnh nhau cùng một kiểu chữ, người đọc không tách được.
 * Khớp nhiều lớp hoặc không khớp thì để nguyên cho loiHoaLopHan xử.
 */
export function ghiLopHoa(van: string, bang: BangHoaLoi): string {
  const goc = van.normalize('NFC');
  const chu = chuan(goc); // giữ nguyên độ dài nên vị trí áp thẳng vào `goc`
  const chen: [number, string][] = [];
  for (const c of chu.matchAll(/[^.!?;\n]+/gu)) {
    for (const h of docHoa(c[0])) {
      if (h.nguon || !h.sao || ganNhieuSao(h, bang)) continue;
      const lop = new Set(bang.hoa.filter((x) => chuan(x.hoa) === h.m[0] && khoaTen(x.sao) === khoaTen(h.sao!)
        && (!h.cung.length || h.cung.every((cg) => cg === x.tenCung))).map((x) => x.nguon));
      if (lop.size !== 1) continue;
      const vt = c.index! + h.tu;
      const [n] = lop;
      if (n === 'nam') chen.push([vt, /(?:^|[.!?:\n])[\s#>*+-]*$/u.test(goc.slice(0, vt)) ? 'Lưu ' : 'lưu ']);
      else chen.push([c.index! + h.den, n === 'dai-van' ? ' đại vận' : ' gốc']);
    }
  }
  let ra = goc;
  for (const [vt, them] of chen.sort((a, b) => b[0] - a[0])) ra = ra.slice(0, vt) + them + ra.slice(vt);
  return ra;
}

/** Kiểm từng vế có hoá; mơ hồ thì viết lại, không ghép chéo hai cặp đúng riêng lẻ. */
export function loiHoaLopHan(van: string, bang: BangHoaLoi, canCu?: readonly string[], timeRefs?: readonly string[]): string | null {
  const chu = chuan(van);
  for (const cau of chu.split(/[.!?;\n]+/u)) {
    const ds = docHoa(cau);
    if (ds.length && /(?:theo|của|thuộc)\s+(?:can\s+)?(?:tháng|ngày)/u.test(cau)) return 'Không có bảng tứ hoá theo can tháng/ngày trong dữ kiện.';
    if (ds.length && /(?:của|theo|thuộc|tứ hóa)\s*(?:tứ hóa\s*)?(?:tiểu hạn|nguyệt hạn)/u.test(cau)) return 'Không có bảng tứ hoá riêng của tiểu hạn/nguyệt hạn; chỉ dùng hoá gốc, năm hoặc đại vận.';
    for (const h of ds) {
      const { m, lopSat, sao, nguon, cung, namTrongVe } = h;
      if (ganNhieuSao(h, bang)) return 'Một hoá đang gắn nhiều sao hoặc dùng quan hệ không định danh lại; viết rõ từng cặp đúng dữ kiện.';
      if (!sao) return `Nêu ${m[0]} phải gắn đúng sao như dữ kiện, không suy tên sao từ hoá.`;
      if (m[0].startsWith('lưu') && /đại vận/u.test(lopSat)) return 'Phân biệt lưu tứ hoá của năm với tứ hoá đại vận.';
      const maW = timeRefs?.filter((w) => w !== 'nam') ?? [];
      const mau = bang.hoa.filter((h) => chuan(h.hoa) === m[0].replace(/^lưu\s+/u, '') && khoaTen(h.sao) === khoaTen(sao)
        && (!nguon || h.nguon === nguon) && (!cung.length || cung.every((c) => c === h.tenCung))
        && (!canCu || canCu.includes(h.ma)) && (!maW.length || maW.every((w) => h.cuaSo.includes(w)))
        && (!namTrongVe.length || namTrongVe.every((n) => n === h.nam)));
      if (!nguon && new Set(mau.map((h) => h.nguon)).size > 1) return 'Quan hệ có ở nhiều lớp: nêu rõ hoá gốc, lưu hoá hay hoá đại vận đúng căn cứ.';
      if (!mau.length) return `${m[0]} và ${sao} phải đúng cung, lớp và thời điểm trong căn cứ đang dẫn.`;
      // Câu không chỉ năm trong tháng qua Tết phải đúng ở mọi năm đang đọc.
      if (!namTrongVe.length && !maW.length && bang.nam.some((n) => !mau.some((h) => h.nam === n))) {
        return `${m[0]} và ${sao} cần chỉ rõ thời điểm; không dùng quan hệ của một năm cho cả hai năm.`;
      }
    }
  }
  return null;
}
