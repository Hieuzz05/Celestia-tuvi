/**
 * Máy canh T-02 (tích hợp đợt 1, 22/10/2026) — npx tsx scripts/test-khong-nut-tao-moi.ts
 *
 * K2 (quyết định 10.19 C) gỡ nút "Tạo bản mới" ở Tổng quan, Lá số, Đọc sâu: người dùng bấm là xả đệm,
 * sinh bài khác, tốn lượt model. Bộ này chặn nút hay lối xả đệm quay lại qua một lần sửa sau:
 *   1. Giao diện app/la-so, app/luan-giai, components/luangiai (trừ VietLaiQuanTri.tsx, chỉ cho quản trị)
 *      không còn chữ "Tạo bản mới" hay `taoMoi: true`.
 *   2. API luận giải V3: `vietLai` từ người không phải quản trị bị từ chối; `taoMoi` (trường cũ) bị bỏ
 *      qua — bài đã đệm vẫn trả từ đệm. Không chạm DB, không gọi model.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { CAU_HOI_V3 } from '../lib/rag/v3';
import { khoaDemV3, LOGIC_V3, xuLyLuanGiaiV3, type CauTraRaV3, type MoiTruongV3 } from '../lib/rag/v3/xu-ly';

let sai = 0;
const kiem = (ten: string, dung: boolean, chiTiet?: unknown) => {
  if (!dung) sai++;
  console.log(`${dung ? 'ĐÚNG' : 'SAI '}  ${ten}${!dung && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`);
};

// 1. Quét giao diện
const GOC = join(__dirname, '..');
const BO_QUA = new Set(['VietLaiQuanTri.tsx']);
function tep(thuMuc: string): string[] {
  return readdirSync(thuMuc).flatMap((t) => {
    const p = join(thuMuc, t);
    if (statSync(p).isDirectory()) return tep(p);
    return /\.(tsx?|jsx?)$/.test(t) && !BO_QUA.has(t) ? [p] : [];
  });
}
const CAM = [/Tạo bản mới/i, /taoMoi\s*:\s*true/];
const dsTep = ['app/la-so', 'app/luan-giai', 'components/luangiai'].flatMap((d) => tep(join(GOC, d)));
kiem('có tệp giao diện để quét', dsTep.length > 5, dsTep.length);
const vet = dsTep.flatMap((p) =>
  readFileSync(p, 'utf8')
    .split('\n')
    .flatMap((dong, i) => (CAM.some((r) => r.test(dong)) ? [`${relative(GOC, p)}:${i + 1}`] : []))
);
kiem('giao diện không còn "Tạo bản mới" / taoMoi: true', vet.length === 0, vet);

// 2. Hành vi API
const laSo = { ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam', namXem: 2026 };
const idTq = CAU_HOI_V3.filter((q) => q.loai === 'tong-quan').map((q) => q.id);
const khoaTq = khoaDemV3({ ...laSo, nhom: 'tong-quan' })!;

function moiTruong(quanTri: boolean) {
  const bo = new Map<string, unknown>();
  const k = (x: { chartHash: string; khoaKy: string }) => `${x.chartHash}|${x.khoaKy}`;
  const mt: MoiTruongV3 = {
    dem: {
      doc: async <T,>(x: { chartHash: string; khoaKy: string }) => (bo.has(k(x)) ? { noiDung: bo.get(k(x)) as T, provider: null, model: null, taoLuc: '' } : null),
      luu: async (x, noiDung) => void bo.set(k(x), structuredClone(noiDung)),
      docMoiNhat: async () => null,
      docNhieu: async () => [],
    },
    canDangNhap: async () => null,
    laKhach: async () => false,
    xinLuotLaSoMoi: async () => ({ duocPhep: true, tran: 3 }),
    phienBanKho: async () => null,
    docThuVien: async () => [],
    quanTri: async () => (quanTri ? ({ id: 'qt' } as never) : null),
  };
  bo.set(
    k(khoaTq),
    idTq.map((id): CauTraRaV3 => ({ id, cauHoi: CAU_HOI_V3.find((q) => q.id === id)!.cauHoi, luanGiai: `bài ${id}`, viSao: '', doRo: 'Rõ', chuaViet: false, lg: LOGIC_V3 }))
  );
  return mt;
}
const st = (kq: Awaited<ReturnType<typeof xuLyLuanGiaiV3>>) => ('json' in kq ? kq.status : kq.traThang.status);

async function main() {
  {
    const kq = await xuLyLuanGiaiV3({ ...laSo, nhom: 'tong-quan', vietLai: true }, moiTruong(false));
    kiem('vietLai từ người thường: 403, không xả đệm', st(kq) === 403);
  }
  {
    const kq = await xuLyLuanGiaiV3({ ...laSo, nhom: 'tong-quan', taoMoi: true } as never, moiTruong(false));
    kiem('taoMoi (trường cũ) bị bỏ qua: vẫn trả từ đệm', st(kq) === 200 && 'json' in kq && kq.json.tuDem === true, 'json' in kq ? kq.json : kq);
  }
  console.log(sai ? `\n${sai} ca SAI` : '\nTất cả đúng.');
  process.exit(sai ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
