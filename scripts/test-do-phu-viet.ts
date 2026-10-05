/**
 * P0 §14 — độ phủ tầng viết: hàm thuần `doPhuCa` / `tongHop`. Offline.
 *   npx tsx scripts/test-do-phu-viet.ts
 */
import { doPhuCa, tongHop, type BanGhiCa, type KetJudge } from './p0/do-phu-viet';

let hong = 0;
const kiem = (dk: boolean, ten: string) => {
  if (!dk) {
    hong++;
    console.log(`  ✗ ${ten}`);
  }
};
console.log('P0 §14 độ phủ tầng viết');

const b: BanGhiCa = {
  ca: { id: 'P01', tap: 'PILOT' },
  luot: [
    { stt: 1, ra: { van: 'x', banNhap: { claims: [{ evidenceIds: ['F001'] }] } }, vet: { preview: { maDuKien: ['F001'] } } },
    {
      stt: 2,
      ra: { van: 'y', banNhap: { claims: [{ evidenceIds: ['F001', 'E001'] }, { evidenceIds: ['E002'] }, { evidenceIds: ['F009'] }] } },
      vet: { preview: { maDuKien: ['F001', 'F002', 'F003', 'F004'] } },
    },
  ],
};
const j: KetJudge[] = [
  { loai: 'C', ca: 'P01', luot: 2, ket: { diem: [{ nhan: 'COVERED' }, { nhan: 'MISSING' }] } },
  { loai: 'C', ca: 'P01', luot: 1, ket: { diem: [{ nhan: 'MISSING' }] } },
  { loai: 'A', ca: 'P01', luot: 2, ket: { claims: [{ nhan: 'SUPPORTED' }, { nhan: 'UNSUPPORTED' }] } },
];
const d = doPhuCa(b, j);
kiem(d.soClaim === 3 && d.claimCoF === 2 && d.claimChiE === 1, `đếm claim: ${JSON.stringify(d)}`);
kiem(d.fTrongGoi === 4 && d.fDuocDan === 1, 'F ngoài gói (F009) không tính vào độ phủ');
kiem(d.diem.COVERED === 1 && d.diem.MISSING === 1, 'chỉ lấy nhãn judge của lượt CUỐI');
kiem(!d.trong, 'không trống');
const t = tongHop([d, doPhuCa({ ca: { id: 'P02', tap: 'PILOT' }, luot: [{ stt: 1, ra: { van: '' } }] })]);
kiem(t.soCa === 2 && t.trong === 1 && t.doPhuDuKien === '25.0%' && t.diemCovered === '50.0%', `tổng hợp: ${JSON.stringify(t)}`);
kiem(tongHop([]).claimCoF === '—', 'tập rỗng không chia cho 0');

console.log(hong ? `\n${hong} mục hỏng` : 'Tất cả đạt.');
process.exit(hong ? 1 : 0);
