/**
 * Eval đường Focused (CEL-186 vé B) — npx tsx scripts/eval-focused.ts [--chi-ca] [--chi-barnum] [--xuat <tệp.json>]
 *
 * GỌI MODEL THẬT. KHÔNG nằm trong CI. Chỉ chạy SAU KHI fix `noi_dung_ai` đã vào main và chủ dự án
 * cho chạy (phương án mục 9 + quyết định #7, #8). Trước đó chỉ được viết, không được chạy.
 *
 * Bắt buộc đặt trước khi chạy (thiếu là script từ chối):
 *   AI_GHIM_MODEL='<provider>|<model>'   đúng model Production; MỌI lời gọi (planner, lời chính,
 *                                        thử lại, sửa câu) chỉ dùng model này, không lùi (S2)
 *   AI_TRAN_USD=<số ≤ 2>                 trần tiền cứng cho cả lượt chạy (cờ #8: tổng eval vé B ≤ $2)
 *   AI_GIA_VAO_USD, AI_GIA_RA_USD        giá model ghim, USD cho 1 triệu token vào / ra
 * Vượt trần → `VuotNganSachError` ném TRƯỚC lời gọi → script dừng cả bộ, in số tiền đã tính và ca
 * đang dở, ghi phần đã có ra tệp `--xuat`. Bộ đếm tiền sống trong TIẾN TRÌNH: chạy tách `--chi-ca` rồi
 * `--chi-thang`: chỉ chạy bộ câu hỏi MỘT tháng × 6 lá số (luật ≥ 1 câu nguyệt hạn + tỉ lệ thử lại).
 * `--cham-lai <tệp.json>`: chấm lại Barnum từ tệp `--xuat` đã có, KHÔNG gọi model, không cần ghim / trần.
 * `--chi-barnum` thì mỗi lần tính lại từ 0 — đặt AI_TRAN_USD mỗi lần sao cho TỔNG ≤ $2 (ví dụ 1 + 1).
 * Embedding truy hồi gọi thẳng, không qua trần (~$0,0001 cả bộ). Ghim model Gemini free tier sẽ vướng
 * hạn mức ngày (`lib/ai/usage.ts`) → "Tất cả model đều không dùng được". Model Production thật: xem /admin/models.
 *
 * Chạy NGAY TRONG TIẾN TRÌNH (S3): gọi `traLoiCoCanCu` tuần tự từng ca, cờ CELES_FOCUSED_CHAT=1 đặt
 * trong tiến trình — không qua HTTP Preview, không cần env Preview. `ghiNhatKy:false`, `AI_NHAN=test`
 * (token ghi riêng dòng "<model>@test"). Lá số đóng băng (`mau-ansao.json`), không dữ liệu người dùng.
 * Không có `chartHash` nên `daNoiTruoc` luôn rỗng ở đây — trên Preview thì có thể KHÔNG rỗng (dùng
 * chung Supabase với Production, cờ #10); đừng so con số "lặp lại điều đã nói" giữa hai nơi.
 *
 * 6 CÂU CANONICAL: phương án không ghi nguyên văn, nên dùng chung với 6 câu Barnum ở `BARNUM`
 * (câu 1 là câu đích danh "sắp tới tôi có người yêu ko? tương lai gần"). Chủ dự án sửa ở đó.
 *
 * Ca bổ sung 10 (hết câu có căn cứ → thử lại 1 lần → 502) KHÔNG đo ở đây: model thật không ép được
 * — nó có test offline tất định trong `scripts/test-focused.ts`. Ở đây chỉ đo TỈ LỆ 502 thật.
 *
 * Mọi tiêu chí chấm bằng luật. Giọng (6 câu canonical) do bien-tap-vi và chủ dự án đọc từ tệp --xuat.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lapLaSo, type LaSo } from '../lib/tuvi/ansao';
import { bayGioAm, type ThoiDiemAm } from '../lib/tuvi/bay-gio';
import { phienBanHienTai, traLoiCoCanCu, type DauVaoTraLoi, type KetQuaTraLoi } from '../lib/rag/tra-loi';
import { traLoiFocused, type KetQuaFocused } from '../lib/rag/focused/tra-loi-focused';
import { tapTenTuGoi, goiCoPhucDuc, quetTen, khoaTen } from '../lib/rag/focused/quet-ten';
import { tenModelThay, tenNgoaiModelThay } from './oracle-ten-prompt';
import { KHUYEN, KHUYEN_DAU_CAU, PHAN_QUYET, PHAN_TRAM, soAmTiet } from '../lib/rag/focused/kiem';
import { coThangNhuan } from '../lib/rag/focused/thang-am';
import { NHAN_CHU_DE, type ChuDe } from '../lib/rag/planner';
import { tienDaTinh, tokenDaDung, VuotNganSachError } from '../lib/ai/fallback';
import type { TinNhan } from '../lib/ai/prompt';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  // Biến đặt ở dòng lệnh thắng .env.local — ghim / trần không được bị tệp ghi đè.
  if (v && process.env[k.trim()] === undefined) process.env[k.trim()] = v;
}

const arg = (k: string) => {
  const i = process.argv.indexOf(k);
  return i !== -1 ? process.argv[i + 1] : null;
};
const xuat = arg('--xuat');
const chiThang = process.argv.includes('--chi-thang');
const chayCa = !chiThang && !process.argv.includes('--chi-barnum');
const chayBarnum = !chiThang && !process.argv.includes('--chi-ca');
const chamLai = arg('--cham-lai');

/* ------------------------------------------------------------- cổng chạy */

const thieu = chamLai ? [] : ['AI_GHIM_MODEL', 'AI_TRAN_USD', 'AI_GIA_VAO_USD', 'AI_GIA_RA_USD'].filter((k) => !process.env[k]?.trim());
if (thieu.length) {
  console.error(`Thiếu ${thieu.join(', ')} — eval vé B phải ghim model Production và đặt trần tiền (cờ #8).`);
  process.exit(2);
}
if (Number(process.env.AI_TRAN_USD) > 2) {
  console.error(`AI_TRAN_USD=${process.env.AI_TRAN_USD} vượt $2 — cờ #8 giới hạn tổng chi eval vé B ở $2.`);
  process.exit(2);
}
process.env.CELES_FOCUSED_CHAT = '1';
process.env.AI_NHAN = 'test';

/* --------------------------------------------------------------- ngưỡng */

const NGUONG = {
  /** Mục 9: lật chiều kết luận trên bản thô */
  latChieuTho: 0.1,
  /** NORMAL: 2–4 câu, 55–120 âm tiết, có ≥ 1 câu có căn cứ */
  hinhDangNormal: 0.9,
  duPhong: 0.25,
  /** Chủ dự án 03/10/2026: thử lại > 15% TỔNG số ca thì dừng trước Production, điều tra nguyên nhân */
  thuLai: 0.15,
  loi502: 0.03,
  /** Barnum 3: ghép mù theo tên căn cứ — tính trên ca PHÂN ĐỊNH ĐƯỢC (chủ dự án 04/10/2026, không hạ) */
  ghepMu: 0.8,
  /** Barnum 2: trùng 5-gram phần lời (đã bỏ tên) giữa hai lá số — "phải thấp" */
  trungLoi: 0.25,
};

/* --------------------------------------------------------------- lá số */

const mau = JSON.parse(readFileSync(join(__dirname, 'mau-ansao.json'), 'utf8')).mau as Record<string, string>;
const khoa = Object.keys(mau);
const lapTu = (k: string): LaSo => {
  const m = k.match(/^(\d+)\/(\d+)\/(\d+) (\d+)h (nam|nu)$/)!;
  return lapLaSo({ ngay: +m[1], thang: +m[2], nam: +m[3], gio: +m[4], gioiTinh: m[5] as 'nam' | 'nu' });
};
// 6 lá số rải đều trong bộ đóng băng — cố định giữa các lần chạy để so được.
const SAU_LA_SO = Array.from({ length: 6 }, (_, i) => khoa[Math.floor((i * khoa.length) / 6)]);

const bayGio = bayGioAm();
const NAM = bayGio.nam;
const THANG = bayGio.thang;
const thangDaQua = Math.max(1, THANG - 2);
// Tháng nhuận gần nhất về trước (2025 có tháng 6 nhuận) — câu hỏi lại nhuận là mã, không tốn tiền.
const NHUAN = (() => {
  for (let n = NAM; n >= NAM - 5; n--) for (let t = 1; t <= 12; t++) if (coThangNhuan(n, t)) return { nam: n, thang: t };
  return { nam: 2025, thang: 6 };
})();

/* --------------------------------------------------------------- ca */

interface Ca {
  ma: string;
  cauHoi: string;
  /** Khuôn mong đợi ở `phienBan.focused` */
  khuon?: string;
  /** Chủ đề mong đợi ở `goi.chuDe` */
  chuDe?: ChuDe;
  /** Lượt trước (chuỗi chip): câu người dùng → lấy văn trả lời thật làm tin trợ lý */
  truoc?: string[];
  laTiepTuChip?: boolean;
  mucAnToan?: DauVaoTraLoi['mucAnToan'];
  /** Hỏi theo tháng → cần ≥ 1 mã nguyệt hạn (N1) */
  thang?: boolean;
  /** Tiêm "bây giờ" (N4) — đi thẳng traLoiFocused */
  bayGio?: ThoiDiemAm;
  namXem?: number;
  /** Người được phép nêu (có trong câu hỏi / ngữ cảnh) */
  nguoi?: string[];
}

const BARNUM = [
  'sắp tới tôi có người yêu ko? tương lai gần',
  'Năm nay công việc của tôi thế nào?',
  'Tiền bạc năm nay của tôi ra sao?',
  'Sức khỏe của tôi năm nay thế nào?',
  'Năm nay chuyện nhà cửa, gia đạo của tôi thế nào?',
  'Năm nay tôi có nên học thêm để chuyển hướng không?',
];

const CA: Ca[] = [
  // 6 canonical
  { ma: 'canon-1-dich-danh', cauHoi: BARNUM[0], khuon: 'A', chuDe: 'tinh-cam' },
  { ma: 'canon-2', cauHoi: BARNUM[1], chuDe: 'su-nghiep' },
  { ma: 'canon-3', cauHoi: BARNUM[2], chuDe: 'tai-chinh' },
  { ma: 'canon-4', cauHoi: BARNUM[3], chuDe: 'suc-khoe' },
  { ma: 'canon-5', cauHoi: BARNUM[4] },
  { ma: 'canon-6', cauHoi: BARNUM[5], khuon: 'C' },
  // A ×2
  { ma: 'A-mong-muon', cauHoi: 'Năm nay tôi có được thăng chức không?', khuon: 'A', chuDe: 'su-nghiep' },
  { ma: 'A-xau', cauHoi: 'Năm nay tôi có bị mất tiền không?', khuon: 'A', chuDe: 'tai-chinh' },
  // B gần
  { ma: 'B-gan', cauHoi: 'Mấy tháng tới công việc của tôi thế nào?', khuon: 'B', chuDe: 'su-nghiep' },
  // C ×2
  { ma: 'C-chuyen', cauHoi: 'Năm nay tôi có nên chuyển sang công ty mới không?', khuon: 'C' },
  { ma: 'C-nghi-viec', cauHoi: 'Tôi đang tính nghỉ việc, năm nay có ổn không?', khuon: 'C' },
  // D, D′ (đã bỏ → phải ra D, cờ #5), năm cụ thể, tháng đã qua, tháng 11 âm gần (tiêm mốc)
  { ma: 'D', cauHoi: 'Khi nào tôi lấy chồng?', khuon: 'D' },
  { ma: 'D-phay-da-bo', cauHoi: 'Tháng nào đáng chú ý hơn?', khuon: 'D' },
  { ma: 'nam-cu-the', cauHoi: `Năm ${NAM + 2} tiền bạc của tôi thế nào?`, chuDe: 'tai-chinh' },
  { ma: 'thang-da-qua', cauHoi: `Tháng ${thangDaQua} âm vừa rồi công việc của tôi thế nào?`, thang: true },
  { ma: 'thang-11-gan', cauHoi: 'Sắp tới công việc của tôi thế nào?', bayGio: { nam: NAM, thang: 11, ngay: 10 } },
  // E
  { ma: 'E', cauHoi: 'Tôi nên ở lại công ty hay chuyển việc?', khuon: 'E' },
  // F1 ×2
  { ma: 'F1-vo-chong', cauHoi: 'Tôi với chồng tôi năm nay có hợp nhau không?', khuon: 'F1', nguoi: ['chồng'] },
  { ma: 'F1-bo', cauHoi: 'Tôi với bố có hợp nhau không?', khuon: 'F1', nguoi: ['bố'] },
  // F2 ×2 (không gọi model)
  { ma: 'F2-bo-suc-khoe', cauHoi: 'Bố tôi năm nay sức khỏe thế nào?', khuon: 'F2', nguoi: ['bố'] },
  { ma: 'F2-con-thi', cauHoi: 'Con tôi năm nay thi đại học có đỗ không?', khuon: 'F2', nguoi: ['con'] },
  // Xưng "con / em" về chính mình
  { ma: 'xung-con', cauHoi: 'con nghĩ công việc của con năm nay thế nào?', chuDe: 'su-nghiep' },
  { ma: 'xung-em', cauHoi: 'em muốn biết năm nay tình cảm của em ra sao?', chuDe: 'tinh-cam' },
  // SENSITIVE ×2
  { ma: 'SENS-1', cauHoi: 'Năm nay sức khỏe của tôi có đáng lo không?', mucAnToan: 'SENSITIVE' },
  { ma: 'SENS-2', cauHoi: 'Tôi vừa chia tay, năm nay tình cảm còn hy vọng không?', mucAnToan: 'SENSITIVE' },
  // Chuỗi chip ×2 (ca bổ sung 5, 6)
  { ma: 'chip-tinh-cam', cauHoi: 'Sang năm thì sao?', truoc: ['Năm nay tình cảm của tôi thế nào?'], laTiepTuChip: true, chuDe: 'tinh-cam' },
  { ma: 'chip-cong-viec', cauHoi: 'Sang năm thì sao?', truoc: ['Năm nay công việc của tôi thế nào?'], laTiepTuChip: true, chuDe: 'su-nghiep' },
  // G
  { ma: 'G-giai-thich', cauHoi: 'Cung Mệnh của tôi nói gì về tính cách?', khuon: 'G' },
  { ma: 'G-tra-cuu', cauHoi: 'Thiên Phủ là sao gì?', khuon: 'G' },
  // DEEP + quyết định
  { ma: 'DEEP-quyet-dinh', cauHoi: 'Phân tích kỹ giúp tôi: năm nay có nên mở cửa hàng riêng không?', khuon: 'C' },
  // Câu âm "kỹ sư" — không được bật DEEP
  { ma: 'am-ky-su', cauHoi: 'Tôi là kỹ sư, năm nay công việc có thuận không?', khuon: 'A' },

  // Ca bổ sung 1–9 (10 là offline, xem đầu tệp); 5–6 là hai chuỗi chip ở trên, 7 là tháng đã qua.
  { ma: 'bs1-con-toi', cauHoi: 'con tôi năm nay thế nào?', nguoi: ['con'] },
  { ma: 'bs3-bo-suc-khoe', cauHoi: 'bố tôi sức khỏe thế nào?', khuon: 'F2', nguoi: ['bố'] },
  { ma: 'bs4-ban-than', cauHoi: 'bản thân tôi năm nay công việc có ổn không?', chuDe: 'su-nghiep' },
  { ma: 'bs8-thang-12', cauHoi: 'Tháng 12 âm sắp tới tiền bạc của tôi thế nào?', thang: true, bayGio: { nam: NAM, thang: 11, ngay: 20 } },
  { ma: 'bs9-nhuan', cauHoi: `Tháng ${NHUAN.thang} nhuận năm ${NHUAN.nam} công việc của tôi thế nào?`, namXem: NHUAN.nam },
];

// Bộ câu MỘT tháng (chủ dự án 04/10/2026): bản cuối phải còn ≥ 1 câu nguyệt hạn, thử lại ≤ 15%.
const THANG_SAU = THANG < 12 ? THANG + 1 : 12;
const CA_THANG: Ca[] = [
  { ma: 'thang-sau', cauHoi: `Tháng ${THANG_SAU} âm công việc của tôi thế nào?`, thang: true, chuDe: 'su-nghiep' },
  { ma: 'thang-nay', cauHoi: 'Tháng này tiền bạc của tôi ra sao?', thang: true, chuDe: 'tai-chinh' },
  { ma: 'thang-tinh-cam', cauHoi: 'Tháng sau chuyện tình cảm của tôi thế nào?', thang: true, chuDe: 'tinh-cam' },
  { ma: 'thang-da-qua', cauHoi: `Tháng ${thangDaQua} âm vừa rồi công việc của tôi thế nào?`, thang: true, chuDe: 'su-nghiep' },
  // "Tháng N" trơn = tháng DƯƠNG (chủ dự án 04/10/2026) — ca chủ dự án thử trên Preview.
  { ma: 'thang-duong-qua', cauHoi: 'Tháng 6 năm 2025 công việc của tôi thế nào?', thang: true, chuDe: 'su-nghiep' },
];

/* ----------------------------------------------------------- đo một bài */

const NGUOI = ['vợ', 'chồng', 'người yêu', 'con cái', 'con trai', 'con gái', 'bố', 'mẹ', 'cha', 'anh chị em', 'anh trai', 'chị gái', 'em trai', 'em gái', 'sếp', 'cấp trên', 'đồng nghiệp', 'bạn bè'];
const reTu = (s: string) => new RegExp(`(?<![\\p{L}\\p{M}])${s}(?![\\p{L}\\p{M}])`, 'iu');
/**
 * Bỏ những chỗ trùng chữ nhưng không phải nêu thêm người (eval 03/10, 8/18 ca
 * là báo nhầm): nhãn phần đời ("phần cha mẹ", "phần bạn bè và đồng nghiệp"),
 * từ ghép ("công bố"), và cặp có chính người được hỏi ("chuyện vợ chồng" khi
 * hỏi về chồng, "cha mẹ" khi hỏi về bố).
 */
const NHAN_PHAN = /phần (?:cha mẹ|bố mẹ|con cái|anh chị em|vợ chồng|bạn bè(?: và đồng nghiệp)?|đồng nghiệp)/giu;
function boChuKhongPhaiNguoi(c: string, duoc: ReadonlySet<string>): string {
  let r = c.replace(NHAN_PHAN, ' ').replace(/công bố/giu, ' ');
  if (duoc.has('vợ') || duoc.has('chồng')) r = r.replace(/vợ chồng/giu, ' ');
  if (duoc.has('bố') || duoc.has('mẹ') || duoc.has('cha')) r = r.replace(/(?:cha|bố) mẹ/giu, ' ');
  return r;
}
const tachCau = (s: string) => s.split(/(?<=[.!?…])\s+|\n+/u).map((x) => x.trim()).filter(Boolean);

interface Do {
  ma: string;
  laSo: string;
  cauHoi: string;
  khuon: string;
  khuonDung: boolean | null;
  chuDe: string;
  chuDeDung: boolean | null;
  provider: string;
  model: string;
  van: string;
  chip: string[];
  loi502: boolean;
  tenNgoaiGoi: string[];
  khuyenHo: string[];
  nguoiLa: string[];
  n1: boolean | null;
  soCau: number;
  amTiet: number;
  canCu: number;
  hinhDangNormal: boolean | null;
  thuLai: boolean;
  /** Lý do lần thử lại (het-cau, json-gay, qua-dai); null khi không thử lại */
  lyDoThuLai: string | null;
  /** Số lần gọi model của lượt — phải ≤ 2 (thử lại đúng một lần) */
  lanGoi: number;
  duPhong: boolean;
  /** Lý do guard thay câu chốt (để đọc vì sao dùng dự phòng) */
  lyDoThayChot: string | null;
  latChieuTho: boolean;
  tenDaNeu: string[];
  tenLopNam: string[];
  tapTen: string[];
}

function cham(ma: string, laSoKhoa: string, ca: Ca, kq: KetQuaFocused): Do {
  const goi = kq.goi;
  // Mục G (04/10/2026): tập đo là chữ prompt THẬT đã in (oracle render), không dùng chung hàm với guard.
  const traCuu = goi.yDinh === 'tra-cuu';
  const dauVaoPrompt = kq.vetFocused?.dauVaoPrompt;
  const tap = dauVaoPrompt ? tenModelThay(dauVaoPrompt, traCuu) : new Set<string>();
  const pd = goiCoPhucDuc(goi.duKien);
  // Phần do model viết (đã qua guard) — miễn trừ SENSITIVE và câu mã không chấm khuyên / độ dài.
  // Câu chốt dự phòng do mã viết (cờ #1) — không chấm như lời model.
  const phanModel = [kq.vetFocused?.dungDuPhong ? '' : kq.coCauTruc?.ketLuan ?? '', ...(kq.coCauTruc?.yChinh ?? []).map((y) => y.noiDung)].filter(Boolean);
  const laMa = kq.provider === 'ma';
  const khuon = kq.phienBan.focused ?? '?';
  const nguoiDuoc = new Set([...(ca.nguoi ?? []), ...NGUOI.filter((n) => reTu(n).test([ca.cauHoi, ...(ca.truoc ?? [])].join(' ')))]);
  const maNguyet = new Set(goi.duKien.filter((d) => d.loai === 'nguyet-han').map((d) => d.id));
  const maLopNam = goi.duKien.filter((d) => d.loai === 'luu-nien' || d.loai === 'luu-tinh');
  const tenLopNamTap = tapTenTuGoi(maLopNam);
  const tenDaNeu = [...new Set(phanModel.flatMap((c) => quetTen(c, pd).map((t) => khoaTen(t.ten))))];
  // Độ dài tính cả câu mã (mục 9 luật 10); chỉ chấm hình dạng ở NORMAL nên không vướng miễn trừ.
  const soCau = laMa ? 0 : tachCau(kq.van).length;
  const amTiet = laMa ? 0 : soAmTiet(kq.van);
  const canCu = (kq.coCauTruc?.yChinh ?? []).filter((y) => (y.maDuKien ?? []).length > 0).length;
  const vet = kq.vetFocused;
  const normal = !laMa && (ca.mucAnToan ?? 'NORMAL') === 'NORMAL' && khuon !== 'G' && !/kỹ giúp|chi tiết/iu.test(ca.cauHoi);
  return {
    ma,
    laSo: laSoKhoa,
    cauHoi: ca.cauHoi,
    khuon,
    khuonDung: ca.khuon ? khuon === ca.khuon : null,
    chuDe: goi.chuDe,
    // goi.chuDe là nhãn hiển thị ("Tình cảm"), ca.chuDe là mã planner ("tinh-cam").
    chuDeDung: ca.chuDe ? goi.chuDe === NHAN_CHU_DE[ca.chuDe] : null,
    provider: kq.provider,
    model: kq.model,
    van: kq.van,
    chip: kq.coCauTruc?.goiYTiep ?? [],
    loi502: !kq.van,
    tenNgoaiGoi: laMa ? [] : dauVaoPrompt ? tenNgoaiModelThay(phanModel, dauVaoPrompt, traCuu) : ['(vết thiếu prompt — không đo được)'],
    khuyenHo: phanModel.filter((c) => KHUYEN.test(c) || KHUYEN_DAU_CAU.test(c) || PHAN_QUYET.test(c) || PHAN_TRAM.test(c)),
    nguoiLa: NGUOI.filter((n) => !nguoiDuoc.has(n) && phanModel.some((c) => reTu(n).test(boChuKhongPhaiNguoi(c, nguoiDuoc)))),
    n1: ca.thang && !laMa ? (kq.coCauTruc?.yChinh ?? []).some((y) => (y.maDuKien ?? []).some((m) => maNguyet.has(m))) : null,
    soCau,
    amTiet,
    canCu,
    hinhDangNormal: normal && kq.van ? soCau >= 2 && soCau <= 4 && amTiet >= 55 && amTiet <= 120 && canCu >= 1 : null,
    thuLai: !!vet?.thuLai,
    lyDoThuLai: vet?.thuLai ?? null,
    lanGoi: vet?.lanGoi ?? 0,
    duPhong: !!vet?.dungDuPhong,
    lyDoThayChot: vet?.lyDoThayChot ?? null,
    latChieuTho: !!vet?.lyDoThayChot && /nguoc|thieu-chieu/u.test(vet.lyDoThayChot),
    tenDaNeu,
    tenLopNam: tenDaNeu.filter((t) => tenLopNamTap.has(t)),
    tapTen: [...tap],
  };
}

/* ------------------------------------------------------------- chạy */

const ketQua: Do[] = [];
let dangDo = '';

async function hoi(laSo: LaSo, ca: Ca, lichSu: TinNhan[] = []): Promise<KetQuaFocused> {
  const vao: DauVaoTraLoi = {
    laSo,
    cauHoi: ca.cauHoi,
    namXem: ca.namXem ?? ca.bayGio?.nam ?? NAM,
    thangXem: ca.bayGio?.thang ?? THANG,
    lichSu,
    laTiepTuChip: ca.laTiepTuChip,
    mucAnToan: ca.mucAnToan,
    ghiNhatKy: false,
  };
  // Tiêm "bây giờ" chỉ có ở traLoiFocused; lá số đóng băng không có sổ kết luận → [] đúng như route.
  if (ca.bayGio) return traLoiFocused(vao, phienBanHienTai, async () => [], ca.bayGio);
  return (await traLoiCoCanCu(vao)) as KetQuaTraLoi as KetQuaFocused;
}

async function chayMotCa(laSoKhoa: string, ca: Ca, ma: string) {
  dangDo = `${ma} · ${laSoKhoa}`;
  const laSo = lapTu(laSoKhoa);
  const lichSu: TinNhan[] = [];
  for (const t of ca.truoc ?? []) {
    const kqTruoc = await hoi(laSo, { ma: 'truoc', cauHoi: t }, lichSu);
    lichSu.push({ vaiTro: 'nguoi-dung', noiDung: t }, { vaiTro: 'tro-ly', noiDung: kqTruoc.van });
  }
  const kq = await hoi(laSo, ca, lichSu);
  const d = cham(ma, laSoKhoa, ca, kq);
  ketQua.push(d);
  console.log(`  ${ma.padEnd(22)} ${d.khuon.padEnd(3)} ${d.loi502 ? '502' : `${d.soCau}c/${d.amTiet}at/${d.canCu}cc`}  $${tienDaTinh().toFixed(3)}`);
}

/* ------------------------------------------------------------- Barnum */

function nGram(s: string, n = 5): Set<string> {
  const tu = s.toLowerCase().split(/[^\p{L}\p{M}\d]+/u).filter(Boolean);
  const ra = new Set<string>();
  for (let i = 0; i + n <= tu.length; i++) ra.add(tu.slice(i, i + n).join(' '));
  return ra;
}
const jaccard = (a: Set<string>, b: Set<string>) => {
  const giao = [...a].filter((x) => b.has(x)).length;
  return a.size + b.size - giao ? giao / (a.size + b.size - giao) : 0;
};
const boTen = (d: Do) => {
  let s = d.van;
  for (const t of d.tapTen) s = s.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu'), ' ');
  return s;
};

function chamBarnum(bai: Do[], doiNam: [Do, Do][]) {
  const theoCau = new Map<string, Do[]>();
  for (const d of bai) theoCau.set(d.cauHoi, [...(theoCau.get(d.cauHoi) ?? []), d]);
  let truot = 0, tongTen = 0, dungMu = 0, saiMu = 0, chuaPhanDinh = 0, tongMu = 0, dungCu = 0;
  const trung: number[] = [];
  for (const nhom of theoCau.values()) {
    for (const a of nhom) {
      if (!a.van || a.provider === 'ma') continue;
      // 1. Đổi gói: tên trong bài lá số A, kiểm bằng danh sách tên của lá số B.
      for (const b of nhom) {
        if (b === a) continue;
        const tapB = new Set(b.tapTen);
        tongTen += a.tenDaNeu.length;
        truot += a.tenDaNeu.filter((t) => !tapB.has(t)).length;
      }
      // 3. Ghép mù (chủ dự án 04/10/2026): mỗi tên nặng theo độ HIẾM giữa các lá số
      //    ứng viên — log(n / số lá số có tên đó). Tên lá số nào cũng có nặng 0, không
      //    phân biệt được gì. Không tên hiếm nào, hoặc hoà ở đỉnh có lá số đúng → "chưa
      //    phân định" (không tính sai). Đỉnh duy nhất khác lá số đúng → sai.
      if (a.tenDaNeu.length) {
        tongMu += 1;
        const n = nhom.length;
        const nang = (t: string) => Math.log(n / Math.max(1, nhom.filter((b) => b.tapTen.includes(t)).length));
        const diem = nhom.map((b) => a.tenDaNeu.filter((t) => b.tapTen.includes(t)).reduce((x, t) => x + nang(t), 0));
        const dinh = Math.max(...diem);
        const oDinh = nhom.filter((_, i) => diem[i] >= dinh - 1e-9);
        const coDung = oDinh.some((b) => b.laSo === a.laSo);
        if (dinh <= 1e-9 || (oDinh.length > 1 && coDung)) chuaPhanDinh += 1;
        else if (coDung) dungMu += 1;
        else saiMu += 1;
        // Cách cũ (đếm tên / cỡ gói) giữ để so.
        const cu = nhom.map((b) => a.tenDaNeu.filter((t) => b.tapTen.includes(t)).length / Math.max(1, b.tapTen.length));
        if (nhom[cu.indexOf(Math.max(...cu))].laSo === a.laSo) dungCu += 1;
      }
    }
    // 2. Phần lời sau khi bỏ tên, từng cặp lá số.
    for (let i = 0; i < nhom.length; i++)
      for (let j = i + 1; j < nhom.length; j++) if (nhom[i].van && nhom[j].van) trung.push(jaccard(nGram(boTen(nhom[i])), nGram(boTen(nhom[j]))));
  }
  // 4. Đổi năm: tên lớp năm phải đổi.
  const namDoi = doiNam.filter(([a, b]) => a.tenLopNam.length + b.tenLopNam.length > 0);
  const namGiongHet = namDoi.filter(([a, b]) => a.tenLopNam.join('|') === b.tenLopNam.join('|')).length;
  return {
    tiLeTenTruotKhiDoiGoi: tongTen ? truot / tongTen : 0,
    trungLoiTrungBinh: trung.length ? trung.reduce((x, y) => x + y, 0) / trung.length : 0,
    /** Trên ca phân định được: đúng / (đúng + sai) */
    ghepMu: dungMu + saiMu ? dungMu / (dungMu + saiMu) : 0,
    ghepMuDung: dungMu,
    ghepMuSai: saiMu,
    ghepMuChuaPhanDinh: chuaPhanDinh,
    ghepMuTong: tongMu,
    /** Tỉ lệ ca phân định được, báo riêng */
    tiLePhanDinh: tongMu ? (dungMu + saiMu) / tongMu : 0,
    /** Cách cũ (đếm tên chia cỡ gói, hoà lấy lá số đầu) — chỉ để so */
    ghepMuCachCu: tongMu ? dungCu / tongMu : 0,
    doiNamCoTenLopNam: namDoi.length,
    doiNamGiongHet: namGiongHet,
  };
}

/* --------------------------------------------------------------- tổng */

const tiLe = (ds: Do[], f: (d: Do) => boolean | null) => {
  const co = ds.filter((d) => f(d) !== null);
  return { dat: co.filter((d) => f(d) === true).length, tong: co.length };
};

function tongKet(barnum: ReturnType<typeof chamBarnum> | null) {
  const model = ketQua.filter((d) => d.provider !== 'ma');
  const pct = (x: { dat: number; tong: number }) => (x.tong ? x.dat / x.tong : 0);
  const dong: [string, string, boolean][] = [];
  const them = (ten: string, gt: string, dat: boolean) => dong.push([ten, gt, dat]);

  const tenNgoai = model.filter((d) => d.tenNgoaiGoi.length).length;
  them('Tên ngoài gói (bản cuối)', `${tenNgoai}/${model.length}`, tenNgoai === 0);
  const lat = tiLe(model, (d) => d.latChieuTho);
  them('Lật chiều trên bản thô', `${lat.dat}/${lat.tong}`, pct(lat) <= NGUONG.latChieuTho);
  const khuyen = model.filter((d) => d.khuyenHo.length).length;
  them('Khuyên / chọn hộ (C2/E1, bản cuối)', `${khuyen}`, khuyen === 0);
  const la = ketQua.filter((d) => d.nguoiLa.length).length;
  them('Người không có trong câu hỏi', `${la}`, la === 0);
  const n1 = tiLe(ketQua, (d) => d.n1);
  them('N1: hỏi tháng có mã nguyệt hạn', `${n1.dat}/${n1.tong}`, n1.dat === n1.tong);
  const hd = tiLe(ketQua, (d) => d.hinhDangNormal);
  them('NORMAL 2–4 câu · 55–120 âm tiết · ≥1 căn cứ', `${hd.dat}/${hd.tong}`, pct(hd) >= NGUONG.hinhDangNormal);
  const dp = tiLe(model, (d) => d.duPhong);
  them('Câu chốt dự phòng', `${dp.dat}/${dp.tong}`, pct(dp) <= NGUONG.duPhong);
  // Mẫu số là TỔNG số ca (kể cả lượt trả bằng mã), theo quyết định chủ dự án.
  const soThuLai = ketQua.filter((d) => d.thuLai).length;
  const tiLeThuLai = ketQua.length ? soThuLai / ketQua.length : 0;
  const theoLyDo = Object.entries(
    ketQua.reduce<Record<string, number>>((a, d) => (d.lyDoThuLai ? { ...a, [d.lyDoThuLai]: (a[d.lyDoThuLai] ?? 0) + 1 } : a), {})
  ).map(([k, n]) => `${k} ${n}`).join(', ');
  them(
    `Thử lại (≤ ${NGUONG.thuLai * 100}% tổng ca)`,
    `${soThuLai}/${ketQua.length} = ${(tiLeThuLai * 100).toFixed(1)}%${theoLyDo ? ` (${theoLyDo})` : ''}`,
    tiLeThuLai <= NGUONG.thuLai
  );
  const quaHaiLan = ketQua.filter((d) => d.lanGoi > 2).length;
  them('Gọi model quá 2 lần một lượt', `${quaHaiLan}`, quaHaiLan === 0);
  const e5 = tiLe(ketQua, (d) => d.loi502);
  them('502', `${e5.dat}/${e5.tong}`, pct(e5) <= NGUONG.loi502);
  const kh = tiLe(ketQua, (d) => d.khuonDung);
  them('Đúng khuôn', `${kh.dat}/${kh.tong}`, kh.dat === kh.tong);
  const cd = tiLe(ketQua, (d) => d.chuDeDung);
  them('Đúng chủ đề (gồm chip kế thừa)', `${cd.dat}/${cd.tong}`, cd.dat === cd.tong);
  if (barnum) {
    them('Barnum 1: tên trượt khi đổi gói (cao = bài bám lá số)', `${(barnum.tiLeTenTruotKhiDoiGoi * 100).toFixed(1)}%`, true);
    them('Barnum 2: trùng lời đã bỏ tên', `${(barnum.trungLoiTrungBinh * 100).toFixed(1)}%`, barnum.trungLoiTrungBinh <= NGUONG.trungLoi);
    them(
      'Barnum 3: ghép mù (trên ca phân định được)',
      `${barnum.ghepMuDung}/${barnum.ghepMuDung + barnum.ghepMuSai} = ${(barnum.ghepMu * 100).toFixed(1)}%`,
      barnum.ghepMu >= NGUONG.ghepMu
    );
    them(
      'Barnum 3: tỉ lệ phân định được (báo riêng)',
      `${barnum.ghepMuDung + barnum.ghepMuSai}/${barnum.ghepMuTong} = ${(barnum.tiLePhanDinh * 100).toFixed(1)}% · cách cũ ${(barnum.ghepMuCachCu * 100).toFixed(1)}%`,
      true
    );
    them('Barnum 4: đổi năm mà tên lớp năm giữ nguyên', `${barnum.doiNamGiongHet}/${barnum.doiNamCoTenLopNam}`, barnum.doiNamGiongHet === 0);
  }

  console.log('\n=== TỔNG ===');
  for (const [ten, gt, dat] of dong) console.log(`${dat ? 'ĐẠT ' : 'TRƯỢT'}  ${ten.padEnd(52)} ${gt}`);
  console.log(`Tiền đã tính: $${tienDaTinh().toFixed(4)} / $${process.env.AI_TRAN_USD} · token ${tokenDaDung()}`);
  if (tiLeThuLai > NGUONG.thuLai) {
    console.log(`
DỪNG TRƯỚC PRODUCTION — tỉ lệ thử lại ${(tiLeThuLai * 100).toFixed(1)}% > ${NGUONG.thuLai * 100}%. Điều tra nguyên nhân trước khi đi tiếp.`);
  }
  return dong;
}

function ghi(barnum: unknown, dong: unknown, dung: string | null) {
  if (!xuat) return;
  writeFileSync(
    xuat,
    JSON.stringify({ luc: new Date().toISOString(), model: process.env.AI_GHIM_MODEL, tien: tienDaTinh(), dungTai: dung, laSo: SAU_LA_SO, ketQua, barnum, tong: dong }, null, 2)
  );
  console.log(`Đã ghi ${xuat}`);
}

/** Chấm lại Barnum từ tệp đã xuất — không gọi model. */
function chamLaiTuTep(tep: string) {
  const cu = JSON.parse(readFileSync(tep, 'utf8')) as { ketQua: Do[] };
  const bai = cu.ketQua.filter((d) => /^barnum-\d+$/.test(d.ma));
  const doiNam: [Do, Do][] = cu.ketQua
    .filter((d) => d.ma === 'doi-nam')
    .map((b) => [bai.find((d) => d.laSo === b.laSo && d.cauHoi === BARNUM[1])!, b] as [Do, Do])
    .filter(([a]) => !!a);
  const kq = chamBarnum(bai, doiNam);
  console.log(`Chấm lại Barnum từ ${tep} (${bai.length} bài, ${doiNam.length} cặp đổi năm) — không gọi model`);
  console.log(JSON.stringify(kq, null, 2));
  const dat = kq.ghepMu >= NGUONG.ghepMu && kq.trungLoiTrungBinh <= NGUONG.trungLoi && kq.doiNamGiongHet === 0;
  console.log(`Barnum 3 ${kq.ghepMu >= NGUONG.ghepMu ? 'ĐẠT' : 'TRƯỢT'}: ${(kq.ghepMu * 100).toFixed(1)}% trên ${kq.ghepMuDung + kq.ghepMuSai} ca phân định được · tỉ lệ phân định ${(kq.tiLePhanDinh * 100).toFixed(1)}%`);
  process.exit(dat ? 0 : 1);
}

async function main() {
  if (chamLai) return chamLaiTuTep(chamLai);
  console.log(`Model ghim ${process.env.AI_GHIM_MODEL} · trần $${process.env.AI_TRAN_USD} · năm âm ${NAM} tháng ${THANG}`);
  let barnum: ReturnType<typeof chamBarnum> | null = null;
  try {
    if (chiThang) {
      console.log(`\n--- ${CA_THANG.length} câu một tháng × ${SAU_LA_SO.length} lá số ---`);
      for (const ca of CA_THANG) for (const k of SAU_LA_SO) await chayMotCa(k, ca, ca.ma);
    }
    if (chayCa) {
      console.log(`\n--- ${CA.length} ca trên lá số ${SAU_LA_SO[0]} ---`);
      for (const ca of CA) await chayMotCa(SAU_LA_SO[0], ca, ca.ma);
    }
    if (chayBarnum) {
      console.log('\n--- Barnum 6 câu × 6 lá số (+ đổi năm) ---');
      const truoc = ketQua.length;
      for (const [i, cau] of BARNUM.entries())
        for (const k of SAU_LA_SO) await chayMotCa(k, { ma: `barnum-${i + 1}`, cauHoi: cau }, `barnum-${i + 1}`);
      const bai = ketQua.slice(truoc);
      // 4. Cùng lá số, đổi năm hiện tại ↔ năm +5: câu công việc trên cả 6 lá số.
      const doiNam: [Do, Do][] = [];
      for (const k of SAU_LA_SO) {
        const nay = bai.find((d) => d.laSo === k && d.cauHoi === BARNUM[1])!;
        await chayMotCa(k, { ma: 'doi-nam', cauHoi: `Năm ${NAM + 5} công việc của tôi thế nào?`, namXem: NAM }, 'doi-nam');
        doiNam.push([nay, ketQua[ketQua.length - 1]]);
      }
      barnum = chamBarnum(bai, doiNam);
    }
  } catch (e) {
    if (e instanceof VuotNganSachError) {
      console.error(`\nDỪNG — ${e.message}\nCa đang dở: ${dangDo}`);
      const dong = tongKet(barnum);
      ghi(barnum, dong, dangDo);
      process.exit(3);
    }
    throw e;
  }
  const dong = tongKet(barnum);
  ghi(barnum, dong, null);
  process.exit(dong.every(([, , dat]) => dat) ? 0 : 1);
}

void main();
