// Máy canh "dấu AI" ở giao diện — chạy: node scripts/kiem-dau-ai.mjs
//
// Dùng sloplint của Hallmark (github.com/Nutlope/hallmark, MIT, chép nguyên vào scripts/hallmark/,
// không cài gói, không gọi dịch vụ) và chỉ lấy tầng FLOOR, tầng nặng nhất. Floor của sloplint
// không ghi ngoại lệ được, nên cổng là một DANH SÁCH NỀN (scripts/hallmark/nen.json) theo dấu vân
// gate + tệp + bằng chứng (không theo số dòng, dòng xê dịch): dấu nào ngoài danh sách là dấu mới,
// chặn. Sửa hết một dấu cũ thì chạy với --cap-nhat để rút nó khỏi nền; đừng thêm dấu mới vào nền.
//
// Bỏ qua có chủ đích (chủ dự án duyệt 25/10/2026, audit ở D:\Celestia\dot\hallmark\BAO-CAO-audit.md):
//   - trang / component chỉ quản trị mới thấy;
//   - gate 19 (gạch ngang): tiếng Việt dùng gạch là văn phong bình thường. Gạch ở bản EN
//     được canh riêng bên dưới vì sloplint không đọc lib/i18n/*.ts;
//   - gate 54 (eyebrow lặp tiêu đề): sloplint bắt theo TÊN class `eyebrow`, không theo nội dung,
//     mà chủ dự án đã quyết giữ eyebrow. Eyebrow lặp tiêu đề thì soát bằng mắt khi review;
//   - gate 20 (dấu Hallmark ở dòng đầu CSS) và 34 (overflow-x: clip — test-man-hinh đo scrollWidth);
//   - gate 48 trong globals.css: đó là tệp token, .hero-band / .dark-band tự khoá bộ token của dải;
//   - 7a ở @media print, 39a ở .field-input (viền + bóng là vòng focus của ô nhập, đã đo tương phản).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const NEN = 'scripts/hallmark/nen.json';
const CAP_NHAT = process.argv.includes('--cap-nhat');

const CHI_QUAN_TRI = /(^|[\\/])admin[\\/]|(^|[\\/])(QuanLyNguoiDung|NhatKySuDung|VietLaiQuanTri|ChamBaiAdmin)\.tsx$/;
const BO_GATE = new Set(['19', '20', '34', '54']);

let raw;
try {
  raw = execFileSync(process.execPath, ['scripts/hallmark/sloplint.mjs', 'app', 'components', '--scope', 'app', '--tier', 'floor', '--json'], {
    encoding: 'utf8',
    maxBuffer: 64 << 20,
  });
} catch (e) {
  raw = e.stdout; // có lỗi → mã thoát 1 nhưng stdout vẫn là JSON đầy đủ
}

const laGlobals = (f) => /(^|[\\/])app[\\/]globals\.css$/.test(f);
const tep = (f) => f.replace(process.cwd(), '.').replace(/\\/g, '/');

const loi = JSON.parse(raw).findings.filter((f) => {
  if (f.tier !== 'floor' || f.grade !== 'FAIL') return false;
  if (CHI_QUAN_TRI.test(f.file) || BO_GATE.has(String(f.gate))) return false;
  if (laGlobals(f.file) && (f.gate === '48' || f.gate === '7a' || f.gate === '39a')) return false;
  return true;
});

// Gạch dài (—) trong chữ tiếng Anh: dùng phẩy, hai chấm, chấm hoặc ngoặc.
const en = readFileSync('lib/i18n/en.ts', 'utf8').split('\n');
const gachEn = en.flatMap((dong, i) => (dong.includes('—') && !/^\s*(\/\/|\*)/.test(dong) ? [`./lib/i18n/en.ts:${i + 1} gạch dài trong chữ EN`] : []));

const dau = [...loi.map((f) => ({ van: `[${f.gate}] ${tep(f.file)} ${f.evidence}`, cho: `${tep(f.file)}:${f.line}` })), ...gachEn.map((g) => ({ van: `[19-en] ${g.replace(/:\d+ /, ' ')}`, cho: g.split(' ')[0] }))];
const vanHienTai = [...new Set(dau.map((d) => d.van))].sort();

if (CAP_NHAT) {
  writeFileSync(NEN, JSON.stringify(vanHienTai, null, 2) + '\n');
  console.log(`✓ Đã ghi ${vanHienTai.length} dấu vào ${NEN}. Xem diff: chỉ được BỚT dòng, không được thêm.`);
  process.exit(0);
}

const nen = new Set(JSON.parse(readFileSync(NEN, 'utf8')));
const moi = dau.filter((d) => !nen.has(d.van));
const daHet = [...nen].filter((v) => !vanHienTai.includes(v));

for (const d of moi) console.log(`  MỚI  ${d.cho}  ${d.van}`);
if (daHet.length) console.log(`\n  ${daHet.length} dấu trong nền đã sửa xong — chạy: node scripts/kiem-dau-ai.mjs --cap-nhat`);
if (moi.length) {
  console.log(`\n✗ ${moi.length} dấu AI tầng floor mới — sửa nó (cách sửa: node scripts/hallmark/sloplint.mjs <tệp> --scope app --json, xem trường "fix").`);
  process.exit(1);
}
console.log(`\n✓ Không có dấu AI tầng floor mới (nền còn ${nen.size} dấu cũ).`);
