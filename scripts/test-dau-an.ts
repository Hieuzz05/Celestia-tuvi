/**
 * Cổng chống lặp của dấu ấn Celes — OFFLINE, không chạm DB, không gọi model.
 *
 *   npx tsx scripts/test-dau-an.ts
 *
 * Chỉ quét tin TRỢ LÝ LIỀN TRƯỚC. Lặp xa hơn một lượt không chặn ở đây; chuyện
 * model bắt chước câu cũ nó đọc thấy trong lịch sử thì chỉ
 * `scripts/eval-chat-quyet-dinh.ts` đo được.
 */
import type { TinNhan } from '../lib/ai/prompt';
import { chonDauAn, type DauVaoDauAn } from '../lib/rag/dau-an';

const GOC: DauVaoDauAn = {
  chuDe: 'su-nghiep',
  yDinh: 'quyet-dinh',
  mucAnToan: 'NORMAL',
  chacChan: true,
  laCauNoi: false,
};

let loi = 0;
function kiem(ten: string, dung: boolean, chiTiet = '') {
  console.log(`${dung ? 'PASS' : 'FAIL'}  ${ten}${chiTiet ? ` — ${chiTiet}` : ''}`);
  if (!dung) loi++;
}

const cauSeChon = chonDauAn(GOC).cau;
kiem('mốc: không lịch sử thì có dấu ấn', cauSeChon !== null);
const cau = cauSeChon ?? '';

// Một câu khác chắc chắn là dấu ấn: lấy từ một yDinh khác.
const cauKhac = chonDauAn({ ...GOC, yDinh: 'giai-thich' }).cau ?? '';
kiem('mốc: câu đối chứng khác câu sẽ chọn', cauKhac !== '' && cauKhac !== cau);

const voiLichSu = (lichSu: TinNhan[]) => chonDauAn({ ...GOC, lichSu });

// 1. Trợ lý liền trước chứa đúng câu sẽ chọn → bỏ.
{
  const r = voiLichSu([
    { vaiTro: 'nguoi-dung', noiDung: 'Có nên đổi việc không?' },
    { vaiTro: 'tro-ly', noiDung: `Nên giữ.\n\n${cau}\n\nPhần còn lại.` },
  ]);
  kiem('1. liền trước chứa đúng câu → không dùng', r.cau === null && r.lyDo === 'lap-lien-truoc', `lyDo=${r.lyDo}`);
}

// 2. Trợ lý liền trước chứa một dấu ấn KHÁC → vẫn dùng.
{
  const r = voiLichSu([
    { vaiTro: 'nguoi-dung', noiDung: 'Vì sao tôi hay như vậy?' },
    { vaiTro: 'tro-ly', noiDung: `Mở đầu.\n\n${cauKhac}\n\nPhần còn lại.` },
  ]);
  kiem('2. liền trước chứa dấu ấn khác → vẫn dùng', r.cau === cau, `lyDo=${r.lyDo}`);
}

// 3. Không có tin trợ lý nào trước đó → vẫn dùng.
{
  const r = voiLichSu([{ vaiTro: 'nguoi-dung', noiDung: 'Xin chào' }]);
  kiem('3. không có tin trợ lý trước → vẫn dùng', r.cau === cau, `lyDo=${r.lyDo}`);
}

// 3b. Câu nằm ở tin trợ lý CŨ HƠN, tin liền trước thì không → vẫn dùng (chỉ quét một tin).
{
  const r = voiLichSu([
    { vaiTro: 'tro-ly', noiDung: `Cũ.\n\n${cau}` },
    { vaiTro: 'nguoi-dung', noiDung: 'Hỏi tiếp' },
    { vaiTro: 'tro-ly', noiDung: 'Câu trả lời không có dấu ấn.' },
    { vaiTro: 'nguoi-dung', noiDung: 'Hỏi nữa' },
  ]);
  kiem('3b. chỉ quét tin trợ lý liền trước', r.cau === cau, `lyDo=${r.lyDo}`);
}

console.log(loi === 0 ? '\nXANH' : `\nĐỎ: ${loi} lỗi`);
process.exit(loi === 0 ? 0 : 1);
