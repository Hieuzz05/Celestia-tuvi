import { nhanDangThucThe, TU_DIEN_THUC_THE } from '../thuc-the';
import { DO_DAI_V3 } from './prompt-v3';

/**
 * KIỂM BÀI v3 — mọi luật đếm được thì kiểm bằng mã (AI-PHOI-HOP §10: model
 * không giữ nổi luật đếm được dù dặn hai lần).
 *
 * Trả về danh sách lỗi bằng lời người đọc được, vì chính danh sách này được
 * gửi lại cho model ở vòng sửa. "LEN_OUT_OF_RANGE" thì model không biết sửa gì;
 * "bài luận 356 từ, cần 170–280" thì biết.
 */

export interface BaiV3 {
  /** `ghep`: ý ghép nghĩa hai sao trở lên mà không đoạn nguồn nào nói về chính tổ hợp ấy — ghi lại để bổ sung kho */
  danY: { y: string; canCu: string[]; ghep?: boolean }[];
  luanGiai: string;
  viSao: string;
  /** Gợi ý tách khỏi bài luận (25/09/2026) */
  goiY?: string;
}

export interface LoiV3 {
  ma: string;
  moTa: string;
  /** Lỗi chặn = phải sửa; lỗi nhẹ = ghi nhận */
  chan: boolean;
}

export const TU_CAM = [
  'cơ chế vận hành', 'vận hành', 'cấu trúc nội tâm', 'xu hướng biểu hiện', 'năng lượng', 'nhị nguyên',
  'tối ưu hóa', 'tối ưu hoá', 'vũ trụ', 'định mệnh', 'số mệnh', 'tuyệt đối', 'chắc chắn sẽ', 'nhất định sẽ',
];

const THUAT_NGU = [
  'đại vận', 'tiểu hạn', 'lưu niên', 'nguyệt hạn', 'tam hợp', 'xung chiếu', 'vô chính diệu', 'chính tinh',
  'phụ tinh', 'miếu địa', 'hãm địa', 'tọa thủ', 'thân cư', 'cách cục', 'lá số tử vi',
];

const TU_NOI = [
  'Cũng vì vậy', 'Vì vậy', 'Điều này khiến', 'Mặt khác', 'Bởi thế', 'Bởi vậy', 'Nhưng điểm đáng chú ý',
  'Tuy nhiên', 'Tuy vậy', 'Ngược lại', 'Đặc biệt', 'Khi đi xa hơn', 'Đến giai đoạn', 'Nếu nhìn theo hướng',
];

const KY_TU_LA = /[^\s\p{Script=Latin}\p{P}\p{S}\p{N}\p{M}]+/gu;

const MOC_TUOI = /\d{2}\s*[–-]\s*\d{2}\s*tuổi|(trước|sau|từ|quanh|ngoài)\s+(khoảng\s+)?\d{2}\s*tuổi|tuổi\s+\d{2}(?!\d)/iu;

/**
 * Lời khuyên chung chung đo được ở lượt 7 (lá số A): cùng một câu khuyên xuất
 * hiện ở bốn, năm câu hỏi khác nhau vì nó đúng với bất cứ ai.
 */
const LOI_KHUYEN_CHUNG = [
  /dồn (toàn bộ|hết|tất cả)[^.]{0,30}(vào một|một chỗ)/iu,
  /gánh (mọi|hết|tất cả)[^.]{0,15}một mình/iu,
  /nhịp sinh hoạt (đều|bền)/iu,
  /(không|đừng) (nên )?quyết (định )?(vội|nóng)/iu,
];

export const demTu = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Tên riêng trong câu văn: chỉ tính khi viết HOA đúng như tên riêng, để "phúc đức" (lời thường) không bị bắt */
function tenRiengLo(van: string): string[] {
  const lo = new Set<string>();
  for (const t of nhanDangThucThe(van)) {
    if (!['STAR', 'TRANSFORMATION', 'FORMATION', 'PALACE'].includes(t.loai)) continue;
    const ten = [t.ten, ...t.biDanh].filter((x) => /[A-ZÀ-Ỹ]/.test(x[0] ?? ''));
    const hoa = ten.some((x) => {
      const re = new RegExp(`(^|[^\\p{L}])${x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}])`, 'u');
      const m = van.match(re);
      if (!m) return false;
      // Tên một chữ đứng đầu câu có thể chỉ là chữ thường viết hoa ("Tuần này…")
      if (!x.includes(' ')) {
        const i = (m.index ?? 0) + m[1].length;
        const truoc = van.slice(0, i).trimEnd();
        if (!truoc || /[.!?…:]$/.test(truoc)) return false;
      }
      return true;
    });
    if (hoa) lo.add(t.ten);
  }
  return [...lo];
}

export function kiemBai(vao: {
  bai: BaiV3;
  loai: 'tong-quan' | 'chuyen-sau';
  maDuKien: Set<string>;
  maNguon: Set<string>;
  saoDuocPhep: Set<string>;
  /** Câu có hỏi về thời điểm không — không hỏi thì bài không được gắn mốc tuổi */
  hoiThoiDiem?: boolean;
  /** Bộ thử nghiệm nới độ dài (vd 1.5) — sản phẩm không truyền */
  heSoDoDai?: number;
}): LoiV3[] {
  const { bai, loai } = vao;
  const loi: LoiV3[] = [];
  const g = DO_DAI_V3[loai];
  const h = vao.heSoDoDai ?? 1;
  const d = { ...g, luan: [g.luan[0], Math.round(g.luan[1] * h)] as const, viSao: g.viSao };
  const luan = bai.luanGiai.trim();
  const vs = bai.viSao.trim();

  if (!luan) loi.push({ ma: 'rong', moTa: 'Trường luanGiai rỗng.', chan: true });
  if (!vs) loi.push({ ma: 'rong-visao', moTa: 'Trường viSao rỗng.', chan: true });

  // Lệch nhẹ (≤15%) chỉ ghi nhận: một vòng sửa 15 giây để cắt năm từ là không đáng
  const n = demTu(luan);
  if (n < d.luan[0] || n > d.luan[1]) {
    const lech = n < d.luan[0] ? (d.luan[0] - n) / d.luan[0] : (n - d.luan[1]) / d.luan[1];
    loi.push({ ma: 'do-dai', moTa: `Bài luận dài ${n} từ, yêu cầu ${d.luan[0]}–${d.luan[1]} từ.`, chan: lech > 0.15 });
  }
  const soDoan = luan.split(/\n\s*\n/).filter((x) => x.trim()).length;
  if (soDoan < d.doan[0] || soDoan > d.doan[1]) {
    loi.push({ ma: 'so-doan', moTa: `Bài luận có ${soDoan} đoạn, yêu cầu ${d.doan[0] === d.doan[1] ? d.doan[0] : `${d.doan[0]}–${d.doan[1]}`} đoạn.`, chan: true });
  }
  const nv = demTu(vs);
  if (nv < d.viSao[0] || nv > d.viSao[1]) {
    loi.push({ ma: 'do-dai-visao', moTa: `Phần viSao dài ${nv} từ, yêu cầu ${d.viSao[0]}–${d.viSao[1]} từ.`, chan: nv > d.viSao[1] * 1.3 || nv < d.viSao[0] * 0.6 });
  }

  if (/^\s*([-•*]|\d+[.)])\s/m.test(luan) || /(^|\n)\s*(Đáp|Cụ thể|Khi nào|Cần biết)\s*:/.test(luan) || /[*#_]{1,}/.test(luan)) {
    loi.push({ ma: 'liet-ke', moTa: 'Bài luận còn gạch đầu dòng / nhãn / markdown.', chan: true });
  }
  if (/^\s*[-•*]\s/m.test(vs)) loi.push({ ma: 'liet-ke-visao', moTa: 'viSao phải là một đoạn liền, không gạch ý.', chan: true });

  const lo = tenRiengLo(luan);
  if (lo.length) loi.push({ ma: 'lo-ten', moTa: `Bài luận nêu tên sao/cung/cách cục: ${lo.join(', ')} — chỉ được nêu ở viSao.`, chan: true });
  const thuat = THUAT_NGU.filter((t) => luan.toLowerCase().includes(t));
  if (thuat.length) loi.push({ ma: 'thuat-ngu', moTa: `Bài luận dùng thuật ngữ: ${thuat.join(', ')}.`, chan: true });

  const cam = TU_CAM.filter((t) => luan.toLowerCase().includes(t) || vs.toLowerCase().includes(t));
  if (cam.length) loi.push({ ma: 'tu-cam', moTa: `Dùng từ cấm: ${cam.map((x) => `"${x}"`).join(', ')}.`, chan: true });

  // Model lẫn ngôn ngữ giữa câu: production 24/09/2026 có "cách làm cũ აღარ còn
  // thuyết phục" (chữ Georgia, nghĩa "không còn") nằm ngay thẻ đầu trang /la-so
  const la = [...new Set((luan + ' ' + vs).match(KY_TU_LA) ?? [])];
  if (la.length) loi.push({ ma: 'ky-tu-la', moTa: `Lẫn chữ không phải tiếng Việt: "${la.join('", "')}" — viết lại đúng chỗ đó bằng tiếng Việt.`, chan: true });

  const ma = [...new Set([...(luan + ' ' + vs).matchAll(/\b[FE]\d{3}\b|\bTQ\d{2}\b|\b[A-Z]{2}\d{2}\b/g)].map((m) => m[0]))];
  if (ma.length) loi.push({ ma: 'lo-ma', moTa: `Lộ mã nội bộ trong văn: ${ma.join(', ')}.`, chan: true });
  const viettat = [...new Set([...(luan + ' ' + vs).matchAll(/\b[A-ZĐ]{3,}\b/g)].map((m) => m[0]))].filter((x) => x !== 'AI');
  if (viettat.length) loi.push({ ma: 'viet-tat', moTa: `Viết tắt người đọc không hiểu: ${viettat.join(', ')}.`, chan: true });

  // viSao chỉ được nêu sao có trong dữ kiện của câu này
  // So khớp CÓ DẤU: bỏ dấu thì "Tử Phủ" (gọi tắt Tử Vi – Thiên Phủ) trùng "Tử Phù"
  // và bộ kiểm bắt oan — đo được ở lượt 3, ba câu đỏ vì đúng lỗi này.
  const saoVs = nhanDangThucThe(vs)
    .filter((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION')
    .filter((t) => [t.ten, ...t.biDanh].some((x) => vs.includes(x)));
  const ngoai = saoVs.filter((t) => !vao.saoDuocPhep.has(t.ten) && !t.biDanh.some((b) => vao.saoDuocPhep.has(b)));
  if (ngoai.length) loi.push({ ma: 'sao-ngoai', moTa: `viSao nêu sao không có trong dữ kiện câu này: ${ngoai.map((t) => t.ten).join(', ')}.`, chan: true });

  // "Bạn A. Bạn B. Bạn C." — giọng đọc kết quả mà quy tắc cấm
  const cau = luan.split(/(?<=[.!?])\s+/).filter((x) => x.trim());
  const moBan = cau.filter((x) => /^Bạn\s/.test(x.trim())).length;
  if (cau.length >= 4 && moBan >= 3 && moBan / cau.length > 0.45) {
    loi.push({ ma: 'mo-ban', moTa: `${moBan}/${cau.length} câu mở bằng "Bạn" — đọc như liệt kê kết quả; nối các ý bằng quan hệ nguyên nhân – hệ quả.`, chan: true });
  }

  // Lặp từ nối
  const lap = TU_NOI.map((w) => [w, (luan.match(new RegExp(w, 'g')) ?? []).length] as const).filter(([, k]) => k >= 3);
  if (lap.length) loi.push({ ma: 'lap-noi', moTa: `Lặp từ nối: ${lap.map(([w, k]) => `"${w}" ${k} lần`).join(', ')}.`, chan: true });

  // Mốc tuổi lọt vào câu không hỏi thời điểm — nguồn lặp lớn nhất giữa các câu
  if (vao.hoiThoiDiem === false) {
    const moc = luan.match(MOC_TUOI);
    if (moc) {
      loi.push({
        ma: 'moc-tuoi',
        moTa: `Câu này không hỏi về thời điểm mà bài vẫn gắn mốc tuổi ("${moc[0]}") — bỏ mốc tuổi, giai đoạn; phần thời điểm đã có câu khác trả lời.`,
        chan: true,
      });
    }
  }

  /*
   * Bài KHÔNG kết bằng lời khuyên (chủ dự án 25/09/2026: "không nên mỗi câu hỏi
   * đều có lời khuyên, tổng hợp thành một phần riêng"). Bản trước làm ngược lại —
   * chặn bài nào đoạn cuối không có chữ khuyên. Giờ câu cuối mở bằng lời khuyên
   * ("Bạn nên…", "Hãy…") thì chặn để chuyển sang trường goiY.
   */
  if (luan) {
    const cauCuoi = luan.replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).pop() ?? '';
    if (/^(vì vậy,?\s*|do đó,?\s*|vì thế,?\s*)?(bạn\s+(nên|hãy|cần|có thể thử)|hãy\s|đừng\s|nên\s)/iu.test(cauCuoi)) {
      loi.push({ ma: 'ket-loi-khuyen', moTa: 'Bài kết bằng lời khuyên — đổi câu cuối thành một điểm cần lưu ý hoặc câu khép ý; chuyển lời khuyên sang trường "goiY".', chan: true });
    }
  }

  // Lời khuyên dán được vào câu nào cũng đúng — ghi nhận để đo, chưa chặn
  const chung = LOI_KHUYEN_CHUNG.filter((re) => re.test(luan));
  if (chung.length) loi.push({ ma: 'khuyen-chung', moTa: `Lời khuyên chung chung, dễ lặp giữa các câu: ${chung.length} chỗ.`, chan: false });

  // Dàn ý phải có mã căn cứ thật
  const saiMa = bai.danY.flatMap((y) => y.canCu).filter((m) => !vao.maDuKien.has(m) && !vao.maNguon.has(m));
  if (saiMa.length) loi.push({ ma: 'ma-sai', moTa: `Dàn ý trích mã không tồn tại: ${[...new Set(saiMa)].join(', ')}.`, chan: false });
  const khongMa = bai.danY.filter((y) => !y.canCu.length).length;
  if (khongMa) loi.push({ ma: 'y-khong-ma', moTa: `${khongMa} ý trong dàn ý không có mã căn cứ.`, chan: false });

  return loi;
}

/** Sửa tất định những lỗi không cần model: mã lọt vào văn, markdown thừa */
export function donTatDinh(bai: BaiV3): BaiV3 {
  const don = (s: string) =>
    s
      .replace(/\s*[([](?:\s*[FE]\d{3}\s*[,;]?)+\s*[)\]]/g, '')
      .replace(/\b[FE]\d{3}\b/g, '')
      .replace(/[*#]+/g, '')
      .replace(/[ \t]+([.,;:])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  return { ...bai, luanGiai: don(bai.luanGiai), viSao: don(bai.viSao) };
}

/** Kiểm tra từ điển có đủ tên cung — phòng khi ai đó đổi thuc-the.ts */
export const SO_CUNG_TRONG_TU_DIEN = TU_DIEN_THUC_THE.filter((t) => t.loai === 'PALACE').length;
