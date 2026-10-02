/**
 * Độ sâu trả lời (CEL-186a) — OFFLINE, không chạm DB, không gọi model.
 *
 *   npx tsx scripts/test-do-sau.ts
 *
 * Khoá ba điều:
 *  1. `tinhDoSau` chọn đúng QUICK / STANDARD / DEEP và đúng lý do cho từng ca
 *     của bảng §29 — mỗi lý do có ít nhất một ca.
 *  2. Thứ tự ưu tiên: an toàn, chủ đề nặng, xin sâu, chip, giải thích, nhiều vế
 *     luôn thắng QUICK — kể cả câu ngoài tầm.
 *  3. Cờ: `CELES_QUICK_ANSWER` không đặt thì chỉ preview bật; production không
 *     tự bật. `CELES_TINH_NGHICH` không đặt thì theo cờ QUICK.
 */
import {
  quickAnswerBat,
  tinhDoSau,
  tinhNghichBat,
  type DauVaoDoSau,
  type DoSauTraLoi,
  type LyDoDoSau,
} from '../lib/rag/hop-dong-tra-loi';

let hong = 0;
function kiem(ten: string, dung: boolean, chiTiet?: unknown) {
  if (dung) console.log(`  ✓ ${ten}`);
  else {
    hong++;
    console.log(`  ✗ ${ten}${chiTiet === undefined ? '' : ` → ${JSON.stringify(chiTiet)}`}`);
  }
}

const GOC: DauVaoDoSau = {
  yDinh: 'co-khong',
  chuDe: 'tinh-cam',
  cauHoi: 'Năm nay tôi có người yêu không?',
  namXem: 2026,
  mucAnToan: 'NORMAL',
  laTiepTuChip: false,
  ngoaiTam: false,
  coNghieng: true,
  cap: 'nam',
};

const CA: Array<[string, Partial<DauVaoDoSau>, DoSauTraLoi, LyDoDoSau]> = [
  ['câu có/không tình cảm, có hướng', {}, 'QUICK', 'quick'],
  ['quyết định sự nghiệp', { yDinh: 'quyet-dinh', chuDe: 'su-nghiep', cauHoi: 'Tôi có nên đổi việc không?' }, 'QUICK', 'quick'],
  ['tài chính, không dấu', { chuDe: 'tai-chinh', cauHoi: 'toi co nen vay tien ko' }, 'QUICK', 'quick'],
  ['ngoài tầm', { cauHoi: 'chồng tôi có phải Nguyễn Duy Hiếu ko?', ngoaiTam: true, coNghieng: false, cap: null }, 'QUICK', 'ngoai-tam'],
  ['an toàn SENSITIVE', { mucAnToan: 'SENSITIVE' }, 'STANDARD', 'an-toan'],
  ['an toàn CRITICAL thắng ngoài tầm', { mucAnToan: 'CRITICAL', ngoaiTam: true }, 'STANDARD', 'an-toan'],
  ['chủ đề nặng', { cauHoi: 'Mẹ tôi vừa phẫu thuật, năm nay tôi có nên đổi việc không?' }, 'STANDARD', 'chu-de-nang'],
  ['xin phân tích sâu', { cauHoi: 'Phân tích chi tiết tình cảm năm nay của tôi' }, 'DEEP', 'xin-sau'],
  ['xin nói thêm', { cauHoi: 'Nói rõ hơn được không?' }, 'STANDARD', 'xin-them'],
  ['lượt từ chip', { laTiepTuChip: true }, 'STANDARD', 'tu-chip'],
  ['lượt từ chip thắng ngoài tầm', { laTiepTuChip: true, ngoaiTam: true }, 'STANDARD', 'tu-chip'],
  ['giai-thich', { yDinh: 'giai-thich' }, 'STANDARD', 'giai-thich'],
  ['tra-cuu', { yDinh: 'tra-cuu' }, 'STANDARD', 'giai-thich'],
  ['hỏi vì sao', { cauHoi: 'Vì sao năm nay tôi chưa có người yêu?' }, 'STANDARD', 'giai-thich'],
  ['hai dấu hỏi', { cauHoi: 'Tôi có người yêu không? Có cưới không?' }, 'STANDARD', 'nhieu-ve'],
  ['"… và có … không"', { cauHoi: 'Năm nay tôi đổi việc và có thăng chức không' }, 'STANDARD', 'nhieu-ve'],
  ['ý định mô tả', { yDinh: 'mo-ta' }, 'STANDARD', 'y-dinh'],
  ['ý định thời điểm', { yDinh: 'thoi-diem' }, 'STANDARD', 'y-dinh'],
  ['A hay B', { yDinh: 'quyet-dinh', cauHoi: 'Tôi nên ở lại hay nhảy việc?' }, 'STANDARD', 'a-hay-b'],
  ['chủ đề sức khoẻ', { chuDe: 'suc-khoe', cauHoi: 'Năm nay tôi có khoẻ không?' }, 'STANDARD', 'chu-de'],
  ['chủ đề gia đạo', { chuDe: 'gia-dao', cauHoi: 'Nhà tôi có yên không?' }, 'STANDARD', 'chu-de'],
  ['engine không chốt hướng', { coNghieng: false, cap: null }, 'STANDARD', 'khong-huong'],
  ['lớp giai đoạn', { cap: 'giai-doan' }, 'STANDARD', 'giai-doan'],
  ['hỏi năm khác', { cauHoi: 'Năm 2028 tôi có người yêu không?' }, 'STANDARD', 'nam-khac'],
  ['chiều xấu', { cauHoi: 'Năm nay tôi có ly hôn không?' }, 'STANDARD', 'chieu-xau'],
  ['chiều xấu: "có bị lỗ"', { chuDe: 'tai-chinh', cauHoi: 'Năm nay tôi có bị lỗ không?' }, 'STANDARD', 'chieu-xau'],
  ['phương án rời bỏ: nghỉ việc', { yDinh: 'quyet-dinh', chuDe: 'su-nghiep', cauHoi: 'Tôi có nên nghỉ việc không?' }, 'STANDARD', 'chieu-xau'],
  ['ngoài tầm kèm chuyện xấu', { cauHoi: 'Chồng tôi ngoại tình có phải với Trần Thị Lan không?', ngoaiTam: true }, 'STANDARD', 'chieu-xau'],
  ['hỏi về người khác', { cauHoi: 'Vợ tôi năm nay có thăng chức không?', chuDe: 'su-nghiep' }, 'STANDARD', 'nguoi-khac'],
  ['"hay không" chỉ là đuôi câu', { cauHoi: 'Năm nay tôi có người yêu hay không?' }, 'QUICK', 'quick'],
  ['"tôi và người yêu" là chuyện của người hỏi', { cauHoi: 'Tôi và người yêu có cưới không?' }, 'QUICK', 'quick'],
];

console.log('\n== BẢNG ĐỘ SÂU (§29) ==');
const lyDoDaGap = new Set<LyDoDoSau>();
for (const [ten, doi, doSau, lyDo] of CA) {
  const ra = tinhDoSau({ ...GOC, ...doi });
  lyDoDaGap.add(ra.lyDo);
  kiem(`${ten} → ${doSau}/${lyDo}`, ra.doSau === doSau && ra.lyDo === lyDo, ra);
}

const MOI_LY_DO: LyDoDoSau[] = [
  'an-toan', 'chu-de-nang', 'xin-sau', 'xin-them', 'tu-chip', 'giai-thich', 'nhieu-ve', 'ngoai-tam',
  'y-dinh', 'a-hay-b', 'chu-de', 'khong-huong', 'giai-doan', 'nam-khac', 'chieu-xau', 'nguoi-khac', 'quick',
];
kiem('mỗi lý do có ít nhất một ca', MOI_LY_DO.every((l) => lyDoDaGap.has(l)), MOI_LY_DO.filter((l) => !lyDoDaGap.has(l)));

console.log('\n== CỜ CELES_QUICK_ANSWER ==');
kiem('không đặt, production → tắt', !quickAnswerBat({ VERCEL_ENV: 'production' }));
kiem('không đặt, preview → bật', quickAnswerBat({ VERCEL_ENV: 'preview' }));
kiem('không đặt, máy dev → tắt', !quickAnswerBat({}));
kiem('"1" → bật', quickAnswerBat({ CELES_QUICK_ANSWER: '1', VERCEL_ENV: 'production' }));
kiem('"true" → bật', quickAnswerBat({ CELES_QUICK_ANSWER: 'true' }));
kiem('"0" trên preview → tắt', !quickAnswerBat({ CELES_QUICK_ANSWER: '0', VERCEL_ENV: 'preview' }));
kiem('"false" → tắt', !quickAnswerBat({ CELES_QUICK_ANSWER: 'false', VERCEL_ENV: 'preview' }));

console.log('\n== CỜ CELES_TINH_NGHICH ==');
kiem('không đặt → theo QUICK (preview bật)', tinhNghichBat({ VERCEL_ENV: 'preview' }));
kiem('không đặt → theo QUICK (production tắt)', !tinhNghichBat({ VERCEL_ENV: 'production' }));
kiem('"0" tắt riêng dù QUICK bật', !tinhNghichBat({ CELES_TINH_NGHICH: '0', CELES_QUICK_ANSWER: '1' }));
kiem('"1" bật', tinhNghichBat({ CELES_TINH_NGHICH: '1' }));

console.log(hong ? `\n✗ ${hong} ca hỏng` : '\n✓ Độ sâu: tất cả ca đạt');
if (hong) process.exit(1);
