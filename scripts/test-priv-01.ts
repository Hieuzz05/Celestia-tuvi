/**
 * PRIV-01 — máy canh: trace Production không giữ văn người dùng. Offline, không DB.
 *
 * Production (`che_do = 'that'`) KHÔNG được lưu: câu hỏi thô, truy vấn (chứa câu người dùng), văn
 * trả lời, trích đoạn / mô tả của validator, băm lá số không muối. Được giữ: ID, mã, số, phiên bản,
 * model, độ trễ. `thu_nghiem` (admin thử truy hồi, người chạy là quản trị viên) vẫn giữ văn.
 *
 * Kiểm trên DÒNG sắp chèn (hàm thuần trong nhat-ky.ts) + quét nguồn: không lối gọi nào truyền
 * `cauHoi` / `chartHash` vào `ghiVetTraLoi` (kiểu đã bỏ hai trường, tsc cũng chặn).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { AN, dongLanTruyHoi, dongVetTraLoi, rutGonKiemDuyet } from '../lib/rag/nhat-ky';
import type { KeHoachTruyVan } from '../lib/rag/planner';
import type { KetQuaTruyHoi } from '../lib/rag/truy-hoi';

let hong = 0;
const kiem = (ten: string, ok: boolean, chiTiet?: unknown) => {
  if (!ok) {
    hong++;
    console.log(`  ✗ ${ten}`, chiTiet !== undefined ? JSON.stringify(chiTiet).slice(0, 400) : '');
  } else console.log(`  ✓ ${ten}`);
};

const CAU = 'Chồng tôi ngoại tình, năm sau có nên ly hôn không?';
const keHoach = {
  chuDe: 'tinh-cam',
  yDinh: 'quyet-dinh',
  thucThe: [{ id: 'cung-phu-the' }],
  cungLienQuan: ['Phu Thê'],
  phamViThoiGian: 'nam',
  phienBan: 'p',
  truyVan: CAU,
} as unknown as KeHoachTruyVan;
const kq = { truyVan: `${CAU} Phu Thê`, cauHinh: { soCuoi: 6 }, phienBan: 't', doTreMs: 12, ungVien: [] } as unknown as KetQuaTruyHoi;

console.log('PRIV-01');

const chuoi = (o: unknown) => JSON.stringify(o);

{
  const d = dongLanTruyHoi(keHoach, kq, { requestId: 'r1', cauHoi: CAU });
  kiem('that: cau_hoi là chuỗi canh', d.cau_hoi === AN, d.cau_hoi);
  kiem('that: truy_van là chuỗi canh', d.truy_van === AN, d.truy_van);
  kiem('that: không còn mảnh câu người dùng ở đâu trong dòng', !chuoi(d).includes('ngoại tình') && !chuoi(d).includes('ly hôn'), d);
  kiem('that: giữ ID / chủ đề / phiên bản / độ trễ', d.request_id === 'r1' && chuoi(d.bo_loc).includes('tinh-cam') && d.do_tre_ms === 12);
  const t = dongLanTruyHoi(keHoach, kq, { cauHoi: CAU, cheDo: 'thu_nghiem', nguoiChay: 'admin' });
  kiem('thu_nghiem: admin vẫn thấy câu và truy vấn', t.cau_hoi === CAU && t.truy_van === kq.truyVan);
}

{
  const kd = {
    dat: false,
    phuSong: 0.5,
    phienBan: 'v',
    loi: [{ ma: 'LO_NGUON', mucDo: 'chan' as const, moTa: `Câu "chồng bạn sẽ bỏ đi" không có nguồn`, tai: 'Ý 1: hôn nhân' }],
  };
  const d = dongVetTraLoi({ requestId: 'r1', userId: 'u1', runId: 'x', phienBan: { a: '1' }, provider: 'openai', model: 'm', doTreMs: 9, kiemDuyet: kd });
  kiem('ai_requests: cau_hoi null', d.cau_hoi === null);
  kiem('ai_requests: chart_hash null', d.chart_hash === null);
  kiem('ai_requests: kiểm duyệt chỉ mã/số/phiên bản', chuoi(d.ket_qua_kiem_duyet) === chuoi({ dat: false, phuSong: 0.5, phienBan: 'v', loi: [{ ma: 'LO_NGUON', mucDo: 'chan' }] }), d.ket_qua_kiem_duyet);
  kiem('ai_requests: giữ id, model, độ trễ, đạt', d.request_id === 'r1' && d.user_id === 'u1' && d.model === 'm' && d.do_tre_ms === 9 && d.dat === false);
  kiem('rút gọn kiểm duyệt rỗng', rutGonKiemDuyet(undefined) === null);
}

{
  // Quét nguồn: mọi `ghiVetTraLoi({ … })` không truyền cauHoi / chartHash.
  const tep: string[] = [];
  const di = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) di(p);
      else if (/\.tsx?$/.test(f)) tep.push(p);
    }
  };
  di('app');
  di('lib');
  const sai: string[] = [];
  for (const p of tep) {
    const s = readFileSync(p, 'utf-8');
    for (const m of s.matchAll(/ghiVetTraLoi\(\{([\s\S]*?)\}\);/g)) if (/\b(cauHoi|chartHash)\b/.test(m[1])) sai.push(p);
  }
  kiem('không lối gọi ghiVetTraLoi nào truyền cauHoi / chartHash', sai.length === 0, sai);
}

console.log(hong ? `\n${hong} mục hỏng` : '\nĐạt hết.');
process.exit(hong ? 1 : 0);
