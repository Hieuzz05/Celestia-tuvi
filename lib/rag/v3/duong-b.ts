import { nhanDangThucThe } from '../thuc-the';
import { docObjectJson } from '../doc-json';
import type { DuKienV3 } from './du-kien';
import { LUAT_AN_TOAN_V3, LUAT_CAN_CU } from './prompt-v3';

/*
 * ĐƯỜNG B (CELES-38, 22/10/2026) — CHỈ cho bộ so mù A/B, sản phẩm không đi đường này.
 *
 * Đường A: một lượt gọi vừa lập dàn ý vừa viết bài, nên ý không căn cứ vẫn lọt vào bài dù dàn ý bị
 * kiểm. Đường B tách hai bước:
 *   1. Lập ý: model chỉ trả các ý kèm mã căn cứ + mức chắc. Máy lọc tất định: bỏ ý có mã lạ / không mã /
 *      nêu sao ngoài lá số; chỉ HẠ mức chắc theo số căn cứ, không bao giờ nâng.
 *   2. Diễn đạt: model chỉ được viết lại các ý đã giữ, đúng mức chắc. Sao được nêu ở "vì sao" thu hẹp
 *      về sao của các ý đã giữ — dùng lại luật sao-ngoai và vòng sửa có sẵn.
 * Phương án: D:\Celestia\PHUONG-AN-K3-duong-B-so-mu.md mục 1–2.
 */

export type MucChac = 'manh' | 'vua' | 'yeu';

export interface YLuan {
  y: string;
  canCu: string[];
  mucChac: MucChac;
  sao: string[];
}

const THU_TU: MucChac[] = ['yeu', 'vua', 'manh'];

export const SYSTEM_LAP_Y = [
  'Bạn là Celes, người luận giải Tử Vi của Celestia. Ở bước này bạn CHỈ lập ý, chưa viết bài. Viết tiếng Việt.',
  LUAT_CAN_CU,
  // Bước diễn đạt chỉ được nói lại ý đã lập — ý vượt luật an toàn phải bị chặn ngay từ đây
  `LUẬT AN TOÀN CHO TỪNG Ý:
${LUAT_AN_TOAN_V3}`,
  `ĐẦU RA — chỉ một object JSON hợp lệ, không rào code, không lời dẫn:
{
  "danY": [ { "y": "một nhận định ngắn, trả lời đúng câu hỏi", "canCu": ["F002", "E001"], "mucChac": "manh", "sao": ["Tử Vi"] } ]
}
- 3–7 ý. Mỗi ý ghi đủ mã căn cứ (F### dữ kiện, E### nguồn, T### thư viện); ý không có mã thì đừng viết.
- "mucChac": "manh" khi nhiều căn cứ cùng chiều và có nguồn nói đúng tổ hợp; "vua" khi có căn cứ nhưng chưa đủ dày; "yeu" khi chỉ một căn cứ mờ.
- "sao": tên các sao mà ý dựa vào, chỉ lấy từ DỮ KIỆN LÁ SỐ.`,
].join('\n\n');

export function docDanY(text: string): YLuan[] | null {
  const o = docObjectJson(text) as { danY?: unknown } | null;
  if (!o || !Array.isArray(o.danY)) return null;
  return (o.danY as unknown[])
    .filter((y): y is Record<string, unknown> => !!y && typeof y === 'object' && typeof (y as Record<string, unknown>).y === 'string')
    .map((y) => ({
      y: String(y.y).trim(),
      canCu: Array.isArray(y.canCu) ? (y.canCu as unknown[]).filter((x): x is string => typeof x === 'string') : [],
      mucChac: THU_TU.includes(y.mucChac as MucChac) ? (y.mucChac as MucChac) : 'yeu',
      sao: Array.isArray(y.sao) ? (y.sao as unknown[]).filter((x): x is string => typeof x === 'string') : [],
    }))
    .filter((y) => y.y);
}

/** Tên sao (chuẩn) xuất hiện trong một chuỗi — kèm bí danh để so với tập được phép */
function saoTrong(van: string) {
  return nhanDangThucThe(van).filter((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION');
}

const coTrong = (t: { ten: string; biDanh: string[] }, tap: Set<string>) => tap.has(t.ten) || t.biDanh.some((b) => tap.has(b));

/*
 * Trần mức chắc theo LOẠI căn cứ, không chỉ đếm mã (celes-domain 22/10): mạnh cần dữ kiện lá số (F) cùng
 * một nguồn (E/T) không phải bổ trợ; ý dựa cung chính / cách cục do engine tính thì sàn là vừa, kể cả
 * một mã; còn lại hai mã là vừa, một mã mờ là yếu. Mã bổ trợ không tính (luật 11).
 */
function tranMucChac(canCu: string[], maHoTro: Set<string>, maChinh: Set<string>): MucChac {
  const that = canCu.filter((m) => !maHoTro.has(m));
  const coF = that.some((m) => m.startsWith('F'));
  if (coF && that.some((m) => /^[ET]\d/.test(m))) return 'manh';
  if (that.length >= 2 || that.some((m) => maChinh.has(m))) return 'vua';
  return 'yeu';
}

export function kiemDanY(
  ds: YLuan[],
  vao: { maDuKien: Set<string>; maNguon: Set<string>; saoDuocPhep: Set<string>; maHoTro?: Set<string>; maChinh?: Set<string> }
): { giu: YLuan[]; bo: { y: string; lyDo: string }[] } {
  const giu: YLuan[] = [];
  const bo: { y: string; lyDo: string }[] = [];
  for (const y of ds) {
    const canCu = [...new Set(y.canCu)];
    if (!canCu.length) { bo.push({ y: y.y, lyDo: 'khong-ma' }); continue; }
    const la = canCu.filter((m) => !vao.maDuKien.has(m) && !vao.maNguon.has(m));
    if (la.length) { bo.push({ y: y.y, lyDo: `ma-la:${la.join(',')}` }); continue; }
    const saoNgoai = [...saoTrong(y.y), ...y.sao.flatMap((s) => saoTrong(s))].filter((t) => !coTrong(t, vao.saoDuocPhep));
    if (saoNgoai.length) { bo.push({ y: y.y, lyDo: `sao-ngoai:${saoNgoai.map((t) => t.ten).join(',')}` }); continue; }
    const tran = tranMucChac(canCu, vao.maHoTro ?? new Set(), vao.maChinh ?? new Set());
    const mucChac = THU_TU[Math.min(THU_TU.indexOf(y.mucChac), THU_TU.indexOf(tran))];
    giu.push({ y: y.y, canCu, mucChac, sao: y.sao.flatMap((s) => saoTrong(s).filter((t) => coTrong(t, vao.saoDuocPhep)).map((t) => t.ten)) });
  }
  return { giu, bo };
}

/**
 * Sao được nêu ở bước diễn đạt: sao ý đã khai + sao của các F mà ý dẫn + sao xung chiếu / tam hợp của
 * các cung ấy (luật 17 bắt nói lực kéo của xung chiếu, nên không được cấm nêu nó ở "vì sao").
 */
export function saoChoDienDat(giu: YLuan[], duKien: DuKienV3[]): Set<string> {
  const ma = new Set(giu.flatMap((y) => y.canCu));
  const dan = duKien.filter((d) => ma.has(d.id));
  const cung = new Set(dan.map((d) => d.cung).filter(Boolean));
  const tamPhuong = duKien.filter((d) => {
    const m = d.vaiTro.match(/^(?:xung chiếu|tam hợp) của (.+)$/);
    return Boolean(m && cung.has(m[1]));
  });
  return new Set([...giu.flatMap((y) => y.sao), ...dan.flatMap((d) => d.sao), ...tamPhuong.flatMap((d) => d.sao)]);
}

const LOI_MUC: Record<MucChac, string> = {
  manh: 'nói rõ, dứt khoát — nhưng vẫn là lời xu hướng, không hứa hẹn, không khẳng định chuyện sức khỏe / hôn nhân / con cái',
  vua: 'nói ở mức "khá rõ", "nghiêng về"',
  yeu: 'nói ở mức "có khả năng", "có dấu hiệu nhẹ" — không phóng thành kết luận',
};

export function khoiDienDat(giu: YLuan[]): string {
  return `DÀN Ý ĐÃ DUYỆT — bước này CHỈ diễn đạt các ý dưới đây thành bài:
${giu.map((y, i) => `${i + 1}. [${y.canCu.join(', ')}] [${LOI_MUC[y.mucChac]}] ${y.y}`).join('\n')}
- Không thêm ý mới, không thêm sao hay cung ngoài các ý này; giữ đúng mức chắc của từng ý. Hai ngoại lệ được thêm: câu "đây là góc nhìn từ lá số, không phải tư vấn tài chính" khi bàn đầu tư, và lực kéo của cung xung chiếu (luật 17) đối với cung đã có trong các ý.
- Luật an toàn trong phần luật vẫn đứng trên dàn ý: ý nào chạm giới hạn ấy thì nói ở mức xu hướng.
- Trường "danY" chép lại đúng các ý trên (y + canCu). Phần "vì sao" chỉ nêu sao của các ý trên.`;
}
