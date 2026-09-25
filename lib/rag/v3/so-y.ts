import type { LoiV3 } from './kiem-v3';
import { CAU_HOI_V3, CHU_DE_V3, type CauHoiV3 } from './khung';

/**
 * SỔ Ý ĐÃ NÓI — chống lặp GIỮA các phần luận của cùng một lá số (25/09/2026).
 *
 * Vì sao có: rà lá số A (tổng quan + 6 chủ đề, 46 câu) thấy cùng một ý đi qua
 * mười mấy câu — "khó chịu nhỏ âm ỉ rồi phản ứng nhanh" 15 lần, "thấy thiếu dù
 * đã đủ" 9 lần, "trước 30 tuổi bị chặn" 15 lần, "35–44 nhà cửa làm lại" 9 lần,
 * lời khuyên "tìm người cùng gánh" gần như câu nào cũng có. Chủ dự án: "đã đọc
 * cái này rồi, sao xuất hiện nhiều thế, không có gì mới hơn à".
 *
 * Nguyên nhân: mỗi câu sinh độc lập, và các câu nhận chung những dữ kiện toàn lá
 * số (chính tinh Mệnh, đại vận đang chạy, Tuần/Triệt, chuỗi đại vận). Chia phạm
 * vi trong một nhóm (PHAM_VI_TONG_QUAN, phamViChuyenSau) không với tới nhóm khác.
 *
 * Cách làm: trước khi viết một câu, đưa cho Celes các ý chính + lời khuyên mà
 * những phần ĐÃ SINH của cùng lá số + năm đã nói, kèm luật "không kể lại, chỉ
 * được gợi nửa câu làm dẫn chứng". Viết xong kiểm bằng mã những câu lặp gần
 * nguyên văn để vòng sửa chỉ đích. Không cấm hẳn — dẫn chứng ngắn vẫn được.
 */

export interface MucDaNoi {
  id: string;
  /** Nhóm của câu đã nói: 'tong-quan' hoặc id chủ đề chuyên sâu */
  nhom: string;
  cauHoi: string;
  /** Ý chính (dàn ý khi sinh; bài cũ không có thì lấy câu mở mỗi đoạn) */
  yChinh: string[];
  luanGiai: string;
}

/** Câu tổng quan nào là bản TÓM TẮT của chủ đề chuyên sâu nào */
export const TONG_QUAN_CUA_CHU_DE: Record<string, string> = {
  TQ01: 'tinh-cach', TQ02: 'tinh-cach', TQ03: 'tinh-cach',
  TQ05: 'su-nghiep', TQ06: 'tien-bac', TQ07: 'tinh-duyen',
  TQ08: 'van-han', TQ09: 'van-han', TQ10: 'van-han',
};

const tachCau = (s: string) =>
  s
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

/** Câu mở của từng đoạn — ý chính của bài cũ chưa lưu dàn ý */
export function yChinhTuBai(luanGiai: string): string[] {
  return luanGiai
    .split(/\n\s*\n/)
    .map((d) => tachCau(d)[0])
    .filter(Boolean);
}

/** Câu cuối bài — nơi Celes đặt lời khuyên */
const loiKhuyenCua = (luanGiai: string) => tachCau(luanGiai).at(-1) ?? '';

const catTu = (s: string, n: number) => {
  const t = s.split(/\s+/);
  return t.length <= n ? s : `${t.slice(0, n).join(' ')}…`;
};

function tenNhom(nhom: string) {
  return nhom === 'tong-quan' ? 'Tổng quan' : (CHU_DE_V3.find((c) => c.id === nhom)?.ten ?? nhom);
}

/**
 * Khối prompt "đã nói ở phần khác" cho câu `q`. Rỗng nếu chưa có gì.
 * Trần độ dài: tổng quan đủ 10 câu + vài chủ đề là ~60 ý — cắt mỗi ý 28 từ, và
 * với chủ đề KHÁC chỉ lấy hai ý đầu mỗi câu để khối không nuốt hết ngữ cảnh.
 */
export function khoiDaNoi(q: CauHoiV3, daNoi: MucDaNoi[]): string {
  const ds = daNoi.filter((d) => d.id !== q.id && d.luanGiai);
  if (!ds.length) return '';
  const chuDeCau = q.loai === 'chuyen-sau' ? q.chuDe : null;

  const dong: string[] = [];
  const nhomThuTu = [...new Set(ds.map((d) => d.nhom))].sort((a, b) => (a === 'tong-quan' ? -1 : b === 'tong-quan' ? 1 : 0));
  for (const nhom of nhomThuTu) {
    const cua = ds.filter((d) => d.nhom === nhom);
    const cungNhom = nhom === (chuDeCau ?? 'tong-quan');
    for (const d of cua) {
      const tomTatCuaChuDeNay = chuDeCau && TONG_QUAN_CUA_CHU_DE[d.id] === chuDeCau;
      const y = (cungNhom || tomTatCuaChuDeNay || nhom === 'tong-quan' ? d.yChinh : d.yChinh.slice(0, 2)).map((x) => catTu(x, 28));
      if (!y.length) continue;
      dong.push(`[${tenNhom(nhom)} · ${d.cauHoi}]${tomTatCuaChuDeNay ? ' (bản tóm tắt của chính chủ đề này)' : ''} ${y.join(' | ')}`);
    }
  }
  const loiKhuyen = [...new Set(ds.map((d) => catTu(loiKhuyenCua(d.luanGiai), 24)).filter(Boolean))].slice(0, 24);

  return [
    'ĐÃ NÓI Ở CÁC PHẦN KHÁC CỦA LÁ SỐ NÀY — người đọc đọc cả trang lá số, nên đã gặp những ý sau:',
    ...dong,
    loiKhuyen.length ? `LỜI KHUYÊN ĐÃ DÙNG: ${loiKhuyen.map((l) => `"${l}"`).join(' ; ')}` : '',
    `LUẬT CHỐNG LẶP GIỮA CÁC PHẦN:
1. Không triển khai lại các ý trên, không dùng lại ví dụ hay tình huống đã dùng, không dùng lại lời khuyên đã dùng (kể cả đổi chữ).
2. Một ý trên là căn cứ cần cho câu này thì chỉ gợi lại tối đa NỬA CÂU (vd. "nét cẩn trọng ấy") rồi đi ngay sang điều MỚI.
3. Mục ghi "bản tóm tắt của chính chủ đề này" thì được đào sâu hơn — thêm nguyên nhân, biểu hiện khác, hệ quả, điều kiện — nhưng không nhắc lại câu chữ hay ví dụ của bản tóm tắt.
4. Dữ kiện câu này trùng với những gì đã nói thì chọn góc CHƯA ai nói: biểu hiện riêng trong đúng phần đời của câu hỏi, một điều kiện hay một hệ quả cụ thể của riêng nó.`,
  ]
    .filter(Boolean)
    .join('\n');
}

/* -------------------------------------------------------------------------- */
/* Kiểm lặp gần nguyên văn — bắt bằng mã để vòng sửa chỉ đích                  */
/* -------------------------------------------------------------------------- */

const tu = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

const cumBon = (w: string[]) => {
  const ra = new Set<string>();
  for (let i = 0; i + 4 <= w.length; i++) ra.add(w.slice(i, i + 4).join(' '));
  return ra;
};

/**
 * Một câu của bài mới có ≥ 55% cụm bốn chữ trùng một bài đã có (và đủ dài để
 * không bắt nhầm câu nối) thì là lặp gần nguyên văn. Hai câu như vậy trở lên,
 * hoặc lời khuyên cuối lặp, thì chặn để sửa.
 */
export function kiemLapPhanKhac(luanGiai: string, daNoi: MucDaNoi[], idCau: string): LoiV3[] {
  const khac = daNoi.filter((d) => d.id !== idCau && d.luanGiai);
  if (!khac.length) return [];
  const kho = khac.map((d) => ({ d, cum: cumBon(tu(d.luanGiai)) }));
  const cau = tachCau(luanGiai);
  const lap: { cau: string; noi: string }[] = [];
  cau.forEach((c) => {
    const cc = [...cumBon(tu(c))];
    if (cc.length < 6) return;
    for (const { d, cum } of kho) {
      const trung = cc.filter((x) => cum.has(x)).length / cc.length;
      if (trung >= 0.55) {
        lap.push({ cau: c, noi: `${tenNhom(d.nhom)} · ${d.cauHoi}` });
        return;
      }
    }
  });
  const cuoi = cau.at(-1) ?? '';
  const khuyenLap = lap.some((l) => l.cau === cuoi);
  if (lap.length >= 2 || khuyenLap) {
    return [
      {
        ma: 'lap-phan-khac',
        moTa: `Lặp gần nguyên văn với phần khác của lá số — viết lại bằng ý mới, không dùng lại câu chữ: ${lap
          .slice(0, 3)
          .map((l) => `"${catTu(l.cau, 18)}" (đã có ở ${l.noi})`)
          .join('; ')}.`,
        chan: true,
      },
    ];
  }
  return [];
}

/** Dựng sổ từ các bản ghi đã cất của route (mỗi nhóm một mảng câu) */
export function dungSoY(
  banGhi: { nhom: string; cau: { id: string; cauHoi: string; luanGiai: string; yChinh?: string[]; chuaViet?: boolean }[] }[]
): MucDaNoi[] {
  const ra: MucDaNoi[] = [];
  for (const b of banGhi)
    for (const c of b.cau) {
      if (c.chuaViet || !c.luanGiai) continue;
      ra.push({
        id: c.id,
        nhom: b.nhom,
        cauHoi: c.cauHoi || CAU_HOI_V3.find((q) => q.id === c.id)?.cauHoi || c.id,
        yChinh: c.yChinh?.length ? c.yChinh : yChinhTuBai(c.luanGiai),
        luanGiai: c.luanGiai,
      });
    }
  return ra;
}
