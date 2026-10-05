/**
 * P0 — máy canh của lõi chẩn đoán (`scripts/p0/chan-doan-loi.ts`). Offline, không model, không DB.
 *
 * Khoá bốn điều mà một con số chẩn đoán sai sẽ làm lệch cả quyết định cải thiện:
 *   1. primaryCause = tầng hỏng SỚM NHẤT theo thứ tự TANG; các tầng sau vào secondaryCauses.
 *   2. Cờ INPUT_UNCERTAIN / NOT_YET_VERIFIABLE KHÔNG dừng chẩn đoán (vẫn ra tầng hỏng).
 *   3. Kỳ vọng PROPOSED chủ đề ngoài tập planner (vd hoc-tap) KHÔNG thành PLANNING_ERROR.
 *   4. Lượt dừng bằng mã không bị kết RETRIEVAL/SELECTION (nó không truy hồi).
 * Cùng bộ kiểm timeIntent ký hiệu và nhãn ngoài (judge / người).
 */
import { chanDoanLuot, kiemThoiGianKyHieu, TANG, type LuotVet, type DauVaoChanDoan } from './p0/chan-doan-loi';

let hong = 0;
const kiem = (ten: string, ok: boolean, chiTiet?: unknown) => {
  if (!ok) {
    hong++;
    console.log(`  ✗ ${ten}`, chiTiet !== undefined ? JSON.stringify(chiTiet) : '');
  } else console.log(`  ✓ ${ten}`);
};

const HOM_NAY = { nam: 2026, thangDuong: 10 };

const uv = (noiDung: string, diem: number, duocChon = false) => ({ chunkId: noiDung.slice(0, 8), noiDung, diemVector: diem, duocChon });

function luot(p: {
  chuDe?: string;
  thoiGian?: { loai: string; nam?: number; thang?: number };
  coChoHoiLai?: boolean;
  phamVi?: string;
  ungVien?: ReturnType<typeof uv>[];
  van?: string;
  provider?: string;
  claims?: { claim: string; evidenceIds?: string[] }[];
  duKien?: { id: string; loai?: string; noiDung: string }[];
  loi?: string | null;
  cauHoi?: string;
}): LuotVet {
  const chuDe = p.chuDe ?? 'su-nghiep';
  return {
    stt: 1,
    vao: { cauHoi: p.cauHoi ?? 'Năm nay công việc của tôi thế nào?', ngonNgu: 'vi' },
    ra: { van: p.van ?? 'Năm nay công việc ổn.', provider: p.provider ?? 'openai', model: 'm', banNhap: { claims: p.claims ?? [{ claim: 'x', evidenceIds: ['F001'] }] } },
    loi: p.loi ?? null,
    vet: {
      preview: { hieu: { chuDe, yDinh: 'xu-huong', khuon: 'D', thoiGian: p.thoiGian ?? { loai: 'nam', nam: 2026 }, coChoHoiLai: !!p.coChoHoiLai }, lan: [{ stt: 1, loi: [] }], loiRa: 'ok' },
      duKien: p.duKien ?? [{ id: 'F001', noiDung: 'Quan Lộc có Tử Vi' }],
      bangChung: [{ id: 'E001', chunkId: 'c1' }],
      truyHoi: p.provider === 'ma' ? undefined : [{ keHoach: { chuDe, phamViThoiGian: p.phamVi ?? 'nam', namMucTieu: 2026 }, ungVien: p.ungVien ?? [uv('Cung Quan Lộc chủ công danh', 0.7, true)] }],
    },
  };
}

const vao = (l: LuotVet, them: Partial<DauVaoChanDoan> = {}): DauVaoChanDoan => ({
  id: 'T',
  luot: l,
  laLuotCuoi: true,
  kyVong: { nguon: 'PROPOSED', luotCuoi: null },
  ngonNguCa: 'vi',
  homNay: HOM_NAY,
  ...them,
});

console.log('Lõi chẩn đoán P0');

// 0. Lượt sạch
{
  const r = chanDoanLuot(vao(luot({})));
  kiem('lượt sạch → NO_ERROR_FOUND', r.ketLuan === 'NO_ERROR_FOUND' && r.primaryCause === null, r);
}

// 1. primary = sớm nhất
{
  const l = luot({ ungVien: [uv('Cung Quan Lộc chủ công danh', 0.7, false), uv('Phúc Đức', 0.6, true)], van: '' });
  const r = chanDoanLuot(vao(l, { lechHopDong: ['chủ đề: ra "tai-chinh", cần "su-nghiep"'] }));
  kiem('PLANNING trước SELECTION trước WRITING', r.primaryCause === 'PLANNING_ERROR' && r.secondaryCauses.join() === 'SELECTION_MISS,WRITING_MISS', r);
  kiem('thứ tự TANG không đổi', TANG.join() === 'PLANNING_ERROR,ENGINE_FACT_ERROR,KNOWLEDGE_GAP,RETRIEVAL_MISS,SELECTION_MISS,WRITING_MISS');
}

// 2. Cờ không dừng chẩn đoán
{
  const r = chanDoanLuot(vao(luot({ coChoHoiLai: true, thoiGian: { loai: 'nam', nam: 2027 }, ungVien: [uv('Phúc Đức', 0.6, true)] })));
  kiem('cờ INPUT_UNCERTAIN + NOT_YET_VERIFIABLE', r.co.includes('INPUT_UNCERTAIN') && r.co.includes('NOT_YET_VERIFIABLE'), r.co);
  kiem('có cờ vẫn ra RETRIEVAL_MISS', r.primaryCause === 'RETRIEVAL_MISS', r);
  const g = chanDoanLuot(vao(luot({ phamVi: 'gan' })));
  kiem('phạm vi gan → NOT_YET_VERIFIABLE', g.co.includes('NOT_YET_VERIFIABLE'), g.co);
}

// 3. Chủ đề ngoài tập planner
{
  const r = chanDoanLuot(vao(luot({ chuDe: 'tong-quan' }), { kyVong: { nguon: 'PROPOSED', luotCuoi: { chuDe: 'hoc-tap' } } }));
  kiem('kỳ vọng hoc-tap không thành PLANNING_ERROR', r.primaryCause === null, r);
  const s = chanDoanLuot(vao(luot({ chuDe: 'tai-chinh', ungVien: [uv('Tài Bạch có Vũ Khúc', 0.7, true)] }), { kyVong: { nguon: 'PROPOSED', luotCuoi: { chuDe: 'su-nghiep' } } }));
  kiem('kỳ vọng PROPOSED trong tập, lệch → PLANNING_ERROR', s.primaryCause === 'PLANNING_ERROR', s);
}

// 4. Lượt mã
{
  const r = chanDoanLuot(vao(luot({ provider: 'ma', van: 'Bạn hỏi cho ai?', claims: [] })));
  kiem('lượt mã không RETRIEVAL/SELECTION/WRITING', r.primaryCause === null, r);
  const k = chanDoanLuot(vao(luot({ provider: 'ma', claims: [] }), { kyVong: { nguon: 'PROPOSED', luotCuoi: { chuDe: 'tai-chinh' } } }));
  kiem('lượt mã bỏ qua kỳ vọng PROPOSED', k.primaryCause === null, k);
}

// Tầng giữa
{
  kiem('không ứng viên → KNOWLEDGE_GAP', chanDoanLuot(vao(luot({ ungVien: [] }))).primaryCause === 'KNOWLEDGE_GAP');
  kiem('điểm thấp → KNOWLEDGE_GAP', chanDoanLuot(vao(luot({ ungVien: [uv('Quan Lộc', 0.3, true)] }))).primaryCause === 'KNOWLEDGE_GAP');
  const e = chanDoanLuot(vao(luot({ duKien: [{ id: 'F009', loai: 'luu-nien', noiDung: 'Lưu niên năm 2025 vào cung Quan Lộc' }] })));
  kiem('F lưu niên lệch năm → ENGINE_FACT_ERROR', e.primaryCause === 'ENGINE_FACT_ERROR', e);
  kiem('ngoại lệ → WRITING_MISS', chanDoanLuot(vao(luot({ loi: 'TypeError: x' }))).primaryCause === 'WRITING_MISS');
}

// Cắt ngang
{
  const r = chanDoanLuot(vao(luot({ claims: [{ claim: 'a' }, { claim: 'b', evidenceIds: ['E999'] }] })));
  kiem('claim không mã / mã ngoài gói → UNSUPPORTED_CLAIM', r.catNgang.includes('UNSUPPORTED_CLAIM') && r.primaryCause === null && r.ketLuan === 'CO_LOI', r);
  const en = chanDoanLuot(vao(luot({ van: 'Your career is stable. Công việc ổn.' }), { ngonNguCa: 'en' }));
  kiem('ca EN có văn Việt → ANSWER_OFF_TARGET', en.catNgang.includes('ANSWER_OFF_TARGET'), en);
  const ten = chanDoanLuot(vao(luot({ van: 'Your Quan Lộc palace holds Tử Vi, so work is steady.' }), { ngonNguCa: 'en' }));
  kiem('ca EN chỉ có tên riêng Việt → không OFF_TARGET', !ten.catNgang.includes('ANSWER_OFF_TARGET'), ten);
}

// Nhãn ngoài
{
  const r = chanDoanLuot(
    vao(luot({}), {
      nhan: {
        claim: [{ stt: 1, nhan: 'UNSUPPORTED', nguon: 'JUDGE_A' }],
        diemBatBuoc: [{ id: 'M2', nhan: 'MISSING', nguon: 'JUDGE_C' }],
        lech: { nhan: 'OFF', nguon: 'JUDGE_LECH' },
      },
    })
  );
  kiem('judge: UNSUPPORTED + MISSING + OFF', r.primaryCause === 'WRITING_MISS' && r.catNgang.length === 2 && r.phatHien.some((p) => p.nguon === 'JUDGE_C'), r);
  const n = chanDoanLuot(vao(luot({}), { nhan: { nguyenNhan: [{ loai: 'ENGINE_FACT_ERROR', bangChung: 'celes-domain xác nhận' }] } }));
  kiem('người gán thẳng nguyên nhân', n.primaryCause === 'ENGINE_FACT_ERROR' && n.phatHien[0].nguon === 'NGUOI', n);
}

// timeIntent ký hiệu
{
  const k = (ky: string, cau: string, ke: { phamViThoiGian?: string; namMucTieu?: number }, tg?: { loai: string; nam?: number; thang?: number }) =>
    kiemThoiGianKyHieu(ky, cau, HOM_NAY, ke, tg);
  kiem('current-year', k('current-year', '', {}, { loai: 'nam', nam: 2026 }) === null);
  kiem('next-year sai', k('next-year', '', {}, { loai: 'nam', nam: 2026 }) !== null);
  kiem('explicit-year', k('explicit-year', 'năm 2028 thế nào', {}, { loai: 'nam', nam: 2028 }) === null);
  kiem('next-month', k('next-month', '', {}, { loai: 'thang-duong', nam: 2026, thang: 11 }) === null);
  kiem('explicit-month', k('explicit-month', 'tháng 12 có gì', {}, { loai: 'thang-duong', nam: 2026, thang: 12 }) === null);
  kiem('near-future cần gan', k('near-future', '', { phamViThoiGian: 'nam' }) !== null && k('near-future', '', { phamViThoiGian: 'gan' }) === null);
  kiem('long-term cần giai-doan', k('long-term', '', { phamViThoiGian: 'giai-doan' }) === null);
  kiem('none', k('none', '', { phamViThoiGian: 'khong-ro' }) === null && k('none', '', { phamViThoiGian: 'nam' }) !== null);
}

console.log(hong ? `\n${hong} mục hỏng` : '\nĐạt hết.');
process.exit(hong ? 1 : 0);
