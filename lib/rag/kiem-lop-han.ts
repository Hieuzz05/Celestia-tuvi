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
const cumCam = [...CUM_TIENG_LONG_CAM, 'chiếc xe', 'con đường', 'mặt đường', 'đường xấu', 'đường tốt', 'xe tốt', 'xe xấu', 'xe vững', 'xe yếu', 'chồng lớp', 'tín hiệu', 'lực cản', 'kho chưa có', 'không có tài liệu', 'không có nguồn', 'chưa có căn cứ trong kho'];
const CAM = new RegExp(`(?<![\\p{L}\\p{M}])(?:${cumCam.map(thoat).join('|')})(?![\\p{L}\\p{M}])`, 'iu');
export function loiChuLopHan(van: string): string | null {
  return van.match(CAM)?.[0] ?? van.match(AN_DU_CAM)?.[0] ?? null;
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

/** Kiểm từng vế có hoá; mơ hồ thì viết lại, không ghép chéo hai cặp đúng riêng lẻ. */
export function loiHoaLopHan(van: string, bang: BangHoaLoi, canCu?: readonly string[], timeRefs?: readonly string[]): string | null {
  const chu = chuan(van);
  const hoaRE = /(?<![\p{L}\p{M}])(?:lưu\s+)?hóa\s+(?:lộc|quyền|khoa|kỵ)(?![\p{L}\p{M}])/giu;
  for (const cau of chu.split(/[.!?;\n]+/u)) {
    const ds = [...cau.matchAll(hoaRE)];
    let lopKeThua: HoaHan['nguon'] | undefined;
    if (ds.length && /(?:theo|của|thuộc)\s+(?:can\s+)?(?:tháng|ngày)/u.test(cau)) return 'Không có bảng tứ hoá theo can tháng/ngày trong dữ kiện.';
    if (ds.length && /(?:của|theo|thuộc|tứ hóa)\s*(?:tứ hóa\s*)?(?:tiểu hạn|nguyệt hạn)/u.test(cau)) return 'Không có bảng tứ hoá riêng của tiểu hạn/nguyệt hạn; chỉ dùng hoá gốc, năm hoặc đại vận.';
    for (let i = 0; i < ds.length; i++) {
      const m = ds[i];
      const tu = m.index!;
      const den = tu + m[0].length;
      const truoc = cau.slice(i ? ds[i - 1].index! + ds[i - 1][0].length : 0, tu);
      const sau = cau.slice(den, ds[i + 1]?.index ?? cau.length);
      const saoSau = quetTen(sau).filter((t) => t.loai === 'sao' && !t.ten.startsWith('Hóa '));
      const saoTruoc = quetTen(truoc).filter((t) => t.loai === 'sao' && !t.ten.startsWith('Hóa '));
      // Chọn hướng có quan hệ được viết rõ; không đoán sao từ tên hoá.
      const sauRo = /^\s*(?:(?:vào|trên|của|tại|ở|gắn với|ứng với|on|to|in|of)\s+)?(?:sao\s+)?/u.exec(sau)?.[0].length ?? 0;
      const tenSau = saoSau[0] && chuan(sau).slice(sauRo).startsWith(khoaTen(saoSau[0].ten)) ? saoSau[0].ten : null;
      const sao = tenSau ?? (saoTruoc.length === 1 ? saoTruoc[0].ten : null);
      if (tenSau && saoSau.length > 1) return 'Một hoá đang gắn nhiều sao hoặc dùng quan hệ không định danh lại; viết rõ từng cặp đúng dữ kiện.';
      if (!sao) return `Nêu ${m[0]} phải gắn đúng sao như dữ kiện, không suy tên sao từ hoá.`;
      const ve = truoc + ' ' + sau;
      if (m[0].startsWith('lưu') && /đại vận/u.test(ve)) return 'Phân biệt lưu tứ hoá của năm với tứ hoá đại vận.';
      const nguon: HoaHan['nguon'] | undefined = m[0].startsWith('lưu') ? 'nam'
        : /đại vận|major period|decade/u.test(ve) ? 'dai-van'
        : /(?:lá số )?gốc|năm sinh|natal|birth/u.test(ve) ? 'goc'
        : /lưu niên|annual|yearly|(?:của|theo|thuộc)\s+(?:can\s+)?năm/u.test(ve) ? 'nam' : lopKeThua;
      if (nguon) lopKeThua = nguon;
      const cung = ['Mệnh', 'Phụ Mẫu', 'Phúc Đức', 'Điền Trạch', 'Quan Lộc', 'Nô Bộc', 'Thiên Di', 'Tật Ách', 'Tài Bạch', 'Tử Tức', 'Phu Thê', 'Huynh Đệ'].filter((c) => new RegExp(`(?<![\\p{L}\\p{M}])${chuan(c)}(?![\\p{L}\\p{M}])`, 'u').test(ve));
      const namTrongVe = [...(truoc + ' ' + sau).matchAll(/(?<!\d)(?:19|20)\d{2}(?!\d)/gu)].map((x) => +x[0]);
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
