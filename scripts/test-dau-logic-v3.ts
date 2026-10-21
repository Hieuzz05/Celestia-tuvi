/**
 * Kiểm dấu logic `lg` của luận giải V3 — npx tsx scripts/test-dau-logic-v3.ts
 *
 * K2 (22/10/2026, quyết định 10.19 C): sửa logic thì bài V3 viết lại khi mở, sửa giọng thì không. Câu mang
 * dấu lệch coi như thiếu; bản cũ giữ để hiện tạm. Bộ này chỉ kiểm các đường KHÔNG gọi model (đệm trong bộ
 * nhớ): dấu đúng thì trả từ đệm, khách hết lượt vẫn được bài cũ thay vì 429, tóm lại lệch dấu mà câu chưa
 * viết lại thì giữ bản cũ, và dấu không ra trình duyệt. Không chạm DB.
 */
import { CAU_HOI_V3, PHIEN_BAN_V3 } from '../lib/rag/v3';
import { anNoiBo, khoaDemV3, LOGIC_V3, xuLyLuanGiaiV3, type CauTraRaV3, type MoiTruongV3 } from '../lib/rag/v3/xu-ly';

let sai = 0;
const kiem = (ten: string, dung: boolean, chiTiet?: unknown) => {
  if (!dung) sai++;
  console.log(`${dung ? 'ĐÚNG' : 'SAI '}  ${ten}${!dung && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`);
};

const laSo = { ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam', namXem: 2026 };

function moiTruong(o: { khach?: boolean; conLuot?: boolean } = {}) {
  const bo = new Map<string, unknown>();
  const k = (x: { chartHash: string; khoaKy: string }) => `${x.chartHash}|${x.khoaKy}`;
  const goiLuot = { n: 0 };
  const mt: MoiTruongV3 = {
    dem: {
      doc: async <T,>(x: { chartHash: string; khoaKy: string }) => (bo.has(k(x)) ? { noiDung: bo.get(k(x)) as T, provider: null, model: null, taoLuc: '' } : null),
      luu: async (x, noiDung) => void bo.set(k(x), structuredClone(noiDung)),
      docMoiNhat: async () => null,
      docNhieu: async () => [],
    },
    canDangNhap: async () => null,
    laKhach: async () => o.khach ?? false,
    xinLuotLaSoMoi: async () => (goiLuot.n++, { duocPhep: o.conLuot ?? true, tran: 3 }),
    phienBanKho: async () => null,
    docThuVien: async () => [],
    quanTri: async () => null,
  };
  return { mt, bo, k, goiLuot };
}

const cauCua = (id: string, lg?: string): CauTraRaV3 => ({
  id, cauHoi: CAU_HOI_V3.find((q) => q.id === id)!.cauHoi, luanGiai: `bài ${id} ${lg ?? 'không dấu'}`, viSao: '', doRo: 'Rõ', chuaViet: false, lg,
});

const st = (kq: Awaited<ReturnType<typeof xuLyLuanGiaiV3>>) => ('json' in kq ? kq.status : kq.traThang.status);
const idTq = CAU_HOI_V3.filter((q) => q.loai === 'tong-quan').map((q) => q.id);
const khoaTq = khoaDemV3({ ...laSo, nhom: 'tong-quan' })!;

async function main() {
  // 1. Dấu đúng: trả từ đệm, không xin lượt, dấu không ra trình duyệt
  {
    const { mt, bo, k, goiLuot } = moiTruong({ khach: true, conLuot: false });
    bo.set(k(khoaTq), idTq.map((id) => cauCua(id, LOGIC_V3)));
    const kq = await xuLyLuanGiaiV3({ ...laSo, nhom: 'tong-quan' }, mt);
    const json = 'json' in kq ? kq.json : {};
    const cau = (json.cau ?? []) as Record<string, unknown>[];
    kiem('dấu đúng: trả từ đệm', st(kq) === 200 && json.tuDem === true && cau.length === idTq.length, json);
    kiem('dấu đúng: không xin lượt khách', goiLuot.n === 0);
    kiem('dấu lg không ra trình duyệt', cau.every((c) => !('lg' in c)));
  }

  // 2. Dấu lệch + khách hết lượt: trả bài cũ, không 429
  {
    const { mt, bo, k } = moiTruong({ khach: true, conLuot: false });
    bo.set(k(khoaTq), idTq.map((id) => cauCua(id, 'logic-cu')));
    const kq = await xuLyLuanGiaiV3({ ...laSo, nhom: 'tong-quan' }, mt);
    const json = 'json' in kq ? kq.json : {};
    const cau = (json.cau ?? []) as CauTraRaV3[];
    kiem('dấu lệch, khách hết lượt: 200 kèm bài cũ', st(kq) === 200 && cau.length === idTq.length && cau.every((c) => c.luanGiai.includes('logic-cu')), json);
  }

  // 3. Thiếu hẳn một câu + khách hết lượt: vẫn 429 như trước (không có bài cũ để trả)
  {
    const { mt, bo, k } = moiTruong({ khach: true, conLuot: false });
    bo.set(k(khoaTq), idTq.slice(1).map((id) => cauCua(id, 'logic-cu')));
    const kq = await xuLyLuanGiaiV3({ ...laSo, nhom: 'tong-quan' }, mt);
    kiem('thiếu hẳn câu, khách hết lượt: vẫn 429', st(kq) === 429);
  }

  // 4. Tóm lại
  const cd = CAU_HOI_V3.find((q) => q.loai === 'chuyen-sau')!.chuDe!;
  const idCd = CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === cd).map((q) => q.id);
  const khoaCd = khoaDemV3({ ...laSo, nhom: cd })!;
  const khoaTom = { chartHash: khoaCd.chartHash, khoaKy: `${khoaCd.khoaKy}|tom-lai|k:${PHIEN_BAN_V3.khung}` };
  {
    const { mt, bo, k } = moiTruong();
    bo.set(k(khoaCd), idCd.map((id) => cauCua(id, LOGIC_V3)));
    bo.set(k(khoaTom), { tomLai: 'tóm đúng dấu', lg: LOGIC_V3 });
    const kq = await xuLyLuanGiaiV3({ ...laSo, nhom: cd, tomLai: true }, mt);
    kiem('tóm lại đúng dấu: trả từ đệm', 'json' in kq && kq.json.tomLai === 'tóm đúng dấu' && kq.json.tuDem === true);
  }
  {
    const { mt, bo, k } = moiTruong();
    bo.set(k(khoaCd), idCd.map((id) => cauCua(id, 'logic-cu')));
    bo.set(k(khoaTom), { tomLai: 'tóm cũ', lg: 'logic-cu' });
    const kq = await xuLyLuanGiaiV3({ ...laSo, nhom: cd, tomLai: true }, mt);
    kiem('tóm lại lệch dấu, câu chưa viết lại: giữ tóm lại cũ (không ghép từ câu cũ)', 'json' in kq && kq.json.tomLai === 'tóm cũ', 'json' in kq ? kq.json : kq);
  }
  {
    const { mt, bo, k } = moiTruong();
    bo.set(k(khoaCd), idCd.map((id) => cauCua(id, 'logic-cu')));
    const kq = await xuLyLuanGiaiV3({ ...laSo, nhom: cd, tomLai: true }, mt);
    kiem('chưa có tóm lại, câu lệch dấu: chưa đủ (không viết tóm lại từ câu logic cũ)', 'json' in kq && kq.json.chuaDu === true, 'json' in kq ? kq.json : kq);
  }

  // 5. anNoiBo gỡ dấu
  const ra = anNoiBo([cauCua(idTq[0], LOGIC_V3)])[0] as Record<string, unknown>;
  kiem('anNoiBo gỡ lg', !('lg' in ra));

  console.log(sai ? `\n${sai} ca SAI` : '\nTất cả đúng.');
  process.exit(sai ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
