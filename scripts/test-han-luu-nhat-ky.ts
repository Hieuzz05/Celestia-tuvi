/**
 * Hạn lưu nhật ký vận hành (PRIV-01, CEL-194) — npx tsx scripts/test-han-luu-nhat-ky.ts
 *
 * OFFLINE: không chạm database. Chạy trong CI.
 *
 * Bẫy chính: noi_dung_ai là bảng ĐỆM DÙNG CHUNG — một lệnh xoá trên bảng đó thiếu lọc be_mat là
 * xoá sạch đệm bài luận của mọi người. Bài này chặn đúng chuyện đó.
 */
import { lenhDonNhatKy, HAN_LUU_GIOI_HAN_KHACH_NGAY, HAN_LUU_NHAT_KY_NGAY } from '../lib/rag/don-nhat-ky';

let loi = 0;
function kiem(ten: string, dung: boolean) {
  console.log(`${dung ? 'PASS' : 'FAIL'}  ${ten}`);
  if (!dung) loi++;
}

const bayGio = new Date('2026-10-05T03:30:00Z');
const lenh = lenhDonNhatKy(bayGio);
const ngayTruoc = (iso: string) => Math.round((bayGio.getTime() - new Date(iso).getTime()) / 86400000);

const lenhDem = lenh.filter((l) => l.bang === 'noi_dung_ai');
kiem('noi_dung_ai: đúng MỘT lệnh, và lệnh đó lọc be_mat = gioi-han-khach', lenhDem.length === 1 && lenhDem[0].loc?.be_mat === 'gioi-han-khach');
kiem('noi_dung_ai: mọi lệnh trên bảng đệm chung đều có lọc be_mat', lenhDem.every((l) => !!l.loc?.be_mat));
kiem(`gioi-han-khach: hạn ${HAN_LUU_GIOI_HAN_KHACH_NGAY} ngày`, ngayTruoc(lenhDem[0].truoc) === 2);
for (const b of ['ai_requests', 'retrieval_runs'] as const) {
  const l = lenh.find((x) => x.bang === b);
  kiem(`${b}: hạn ${HAN_LUU_NHAT_KY_NGAY} ngày`, !!l && ngayTruoc(l.truoc) === 90);
}
kiem('không dọn usage_events / ai_usage_logs (sổ hạn mức, số tổng hợp)', lenh.every((l) => (l.bang as string) !== 'usage_events' && (l.bang as string) !== 'ai_usage_logs'));

console.log(loi ? `\nĐỎ — ${loi} ca hỏng` : '\nXANH');
process.exit(loi ? 1 : 0);
