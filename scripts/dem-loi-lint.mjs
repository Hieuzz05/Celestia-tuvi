// Chạy eslint và chặn nếu số lỗi vượt mốc — chạy: node scripts/dem-loi-lint.mjs
//
// eslint thoát mã 1 ngay khi có lỗi, nên không dùng mã thoát của nó làm cổng được:
// repo đang mang sẵn vài lỗi set-state-in-effect đã cân nhắc. Cổng thật là "không
// được nhiều hơn mốc". Sửa bớt được lỗi nào thì HẠ mốc xuống, đừng bao giờ nâng lên.
import { execFileSync } from 'node:child_process';

const MOC = 5;

let raw;
try {
  raw = execFileSync('npx', ['eslint', '.', '-f', 'json'], { encoding: 'utf8', maxBuffer: 64 << 20, shell: true });
} catch (e) {
  raw = e.stdout; // có lỗi lint → mã thoát 1 nhưng stdout vẫn là JSON đầy đủ
}
const ketQua = JSON.parse(raw);
const loi = ketQua.flatMap((f) =>
  f.messages.filter((m) => m.severity === 2).map((m) => `${f.filePath.replace(process.cwd(), '.')}:${m.line} ${m.ruleId}`)
);

for (const l of loi) console.log('  ' + l);
if (loi.length > MOC) {
  console.log(`\n✗ ${loi.length} lỗi lint, mốc là ${MOC} — lỗi mới do thay đổi vừa rồi, sửa nó.`);
  process.exit(1);
}
console.log(`\n✓ ${loi.length} lỗi lint (mốc ${MOC})${loi.length < MOC ? ` — đã giảm, hạ MOC xuống ${loi.length}` : ''}`);
