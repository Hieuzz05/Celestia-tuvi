/**
 * Chạy luận giải v3 GIỐNG HỆT lúc người dùng mở trang, trên một lá số:
 *
 *   npx tsx scripts/test-luan-giai-v3.ts <ngày> <tháng> <năm> <giờ> <nam|nu> --ra <tệp.json>
 *        [--tq] [--cs] [--chu-de su-nghiep,tien-bac] [--nam 2026] [--dem-that]
 *
 * Không có --tq / --cs thì chạy cả hai. Mỗi lượt gọi đi qua `xuLyLuanGiaiV3` — ĐÚNG hàm
 * mà app/api/luan-giai-v3/route.ts gọi — theo ĐÚNG trình tự các trang gửi yêu cầu:
 *
 *   1. Tổng quan: ba câu thẻ đầu (THE_DAU, TongQuanV3.tsx), xong mới tới tám câu còn lại.
 *   2. Mỗi chủ đề chuyên sâu, lần lượt: nửa đầu các câu, rồi nửa sau, rồi "Tóm lại"
 *      (app/luan-giai/sau/page.tsx). Chủ đề mở sau thấy sổ ý của chủ đề mở trước.
 *   3. Bức tranh lớn (BucTranhLon.tsx), khi đã đủ số chủ đề.
 *
 * Nên thư viện nghề, sổ ý, hạn chót 52 giây, tóm lại, bức tranh lớn — mọi thứ route làm —
 * đều có mặt. Khác route ĐÚNG ba chỗ, đều không đổi chữ được viết:
 *   - Đệm nằm trong BỘ NHỚ của tiến trình: không ghi gì vào database, không đè bài
 *     người dùng đang đọc. Mặc định đệm rỗng = lá số mở lần đầu.
 *     --dem-that: ĐỌC (không ghi) đệm thật của lá số này, như người đã từng mở nó.
 *   - Cổng đăng nhập mở sẵn (coi như đã đăng nhập).
 *   - Không phải khách, nên không đếm lượt lá số mới của IP.
 *
 * Kho tri thức và thư viện nghề đọc từ Supabase thật (chỉ đọc). Dữ liệu sinh chỉ đi qua
 * tham số dòng lệnh, không ghi vào tệp nào trong repo. GỌI MODEL THẬT: tốn hạn mức miễn
 * phí dùng chung với người dùng và máy kia (AI-PHOI-HOP §8).
 */
import { readFileSync, writeFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
}

const arg = (ten: string) => {
  const i = process.argv.indexOf(ten);
  return i !== -1 ? process.argv[i + 1] : undefined;
};

async function main() {
  const [ngay, thang, nam, gio, gt] = process.argv.slice(2);
  const ra = arg('--ra');
  if (!ra || !gt) throw new Error('Thiếu tham số — xem đầu tệp');
  const { xuLyLuanGiaiV3 } = await import('../lib/rag/v3/xu-ly');
  const { CAU_HOI_V3, PHIEN_BAN_V3 } = await import('../lib/rag/v3');
  const { CHU_DE_V3 } = await import('../lib/rag/v3/khung');
  const { THE_DAU } = await import('../components/luangiai/TongQuanV3');
  const noiDungAi = await import('../lib/rag/noi-dung-ai');
  const { phienBanKho } = await import('../lib/rag/tai-lieu-meta');
  const { docThuVien } = await import('../lib/rag/thu-vien/kho');
  type MoiTruongV3 = import('../lib/rag/v3/xu-ly').MoiTruongV3;
  type KetQuaCauV3 = import('../lib/rag/v3').KetQuaCauV3;

  const namXem = Number(arg('--nam') ?? 2026);
  const coTq = process.argv.includes('--tq');
  const coCs = process.argv.includes('--cs');
  const chayTq = coTq || !coCs;
  const chayCs = coCs || !coTq;
  const chuDe = arg('--chu-de')?.split(',') ?? CHU_DE_V3.map((c) => c.id);
  const demThat = process.argv.includes('--dem-that');

  // Đệm trong bộ nhớ, cùng khoá và cùng luật tiền tố như bảng noi_dung_ai
  type Ban = { noiDung: unknown; provider: string | null; model: string | null; taoLuc: string };
  const bo = new Map<string, Ban>();
  const k4 = (k: { chartHash: string; beMat: string; khoaKy: string; ngonNgu: string }) => `${k.chartHash}\u0000${k.beMat}\u0000${k.ngonNgu}\u0000${k.khoaKy}`;
  const moiTruong: MoiTruongV3 = {
    dem: {
      doc: async <T,>(k: Parameters<MoiTruongV3['dem']['doc']>[0]) => {
        const b = bo.get(k4(k));
        if (b) return b as { noiDung: T; provider: string | null; model: string | null; taoLuc: string };
        return demThat ? noiDungAi.docNoiDung<T>(k) : null;
      },
      luu: async (k, noiDung, meta) => {
        bo.set(k4(k), { noiDung: structuredClone(noiDung), provider: meta.provider ?? null, model: meta.model ?? null, taoLuc: new Date().toISOString() });
      },
      docMoiNhat: async (k, tienTo) => (demThat ? noiDungAi.docNoiDungMoiNhat(k, tienTo) : null),
      docNhieu: async <T,>(k: Parameters<MoiTruongV3['dem']['docNhieu']>[0], tienTo: string, chua?: string) => {
        const dau = `${k.chartHash}\u0000${k.beMat}\u0000${k.ngonNgu}\u0000`;
        const trong = [...bo.entries()]
          .filter(([kk]) => kk.startsWith(dau))
          .map(([kk, b]) => ({ khoaKy: kk.slice(dau.length), noiDung: b.noiDung as T }))
          .filter((r) => r.khoaKy.startsWith(tienTo) && (!chua || r.khoaKy.slice(tienTo.length).includes(chua)));
        const that = demThat ? await noiDungAi.docNhieuTheoTienTo<T>(k, tienTo, chua) : [];
        const co = new Set(trong.map((r) => r.khoaKy));
        return [...trong, ...that.filter((r) => !co.has(r.khoaKy))].slice(0, 60);
      },
    },
    canDangNhap: async () => null,
    laKhach: async () => false,
    quanTri: async () => ({}),
    xinLuotLaSoMoi: async () => ({ duocPhep: true, tran: 0 }),
    phienBanKho,
    docThuVien,
    quanSat: (k) => {
      cauXong.push(k);
      console.log(
        `  ${k.dat ? '✓' : '✗'} ${k.id} ${k.model} ${Math.round(k.ms / 1000)}s gọi=${k.soLanGoi} nguồn=${k.nguon.length} ` +
          `lỗi đầu=${k.loiBanDau.filter((l) => l.chan).length} còn=${k.loiConLai.filter((l) => l.chan).length}` +
          (k.loiConLai.length ? ` | ${k.loiConLai.map((l) => l.moTa).join(' ; ')}` : '')
      );
    },
  };
  const cauXong: KetQuaCauV3[] = [];
  const luot: { yeuCau: Record<string, unknown>; status: number; giay: number; traVe: Record<string, unknown> }[] = [];
  const laSo = { ngay: +ngay, thang: +thang, nam: +nam, gio: +gio, gioiTinh: gt, namXem };
  const goi = async (them: Record<string, unknown>) => {
    const t = Date.now();
    const kq = await xuLyLuanGiaiV3({ ...laSo, ...them }, moiTruong);
    const status = 'traThang' in kq ? kq.traThang.status : kq.status;
    const traVe = 'traThang' in kq ? { loi: 'bị cổng chặn' } : kq.json;
    luot.push({ yeuCau: them, status, giay: Math.round((Date.now() - t) / 1000), traVe });
    console.log(`→ ${JSON.stringify(them)} · ${status} · ${Math.round((Date.now() - t) / 1000)}s${traVe.loi ? ` · ${traVe.loi}` : ''}`);
    return { status, traVe };
  };

  const t0 = Date.now();
  if (chayTq) {
    const idDau = THE_DAU.map((x) => x.id);
    const dau = await goi({ nhom: 'tong-quan', chi: idDau, taoMoi: false });
    if (!dau.traVe.gioiHanKhach) {
      await goi({ nhom: 'tong-quan', chi: CAU_HOI_V3.filter((q) => q.loai === 'tong-quan' && !idDau.includes(q.id)).map((q) => q.id), taoMoi: false });
    }
  }
  if (chayCs) {
    for (const cd of chuDe) {
      const ids = CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === cd).map((q) => q.id);
      if (!ids.length) throw new Error(`Không có chủ đề ${cd}`);
      const giua = ids.length >= 4 ? Math.ceil(ids.length / 2) : ids.length;
      const a = await goi({ nhom: cd, chi: ids.slice(0, giua), taoMoi: false });
      if (a.status !== 200) continue;
      if (ids.length > giua) {
        const b = await goi({ nhom: cd, chi: ids.slice(giua), taoMoi: false });
        if (b.status !== 200) continue;
      }
      await goi({ nhom: cd, tomLai: true, taoMoi: false });
    }
    await goi({ nhom: 'tinh-cach', bucTranh: true });
  }

  const giay = Math.round((Date.now() - t0) / 1000);
  writeFileSync(ra, JSON.stringify({ phienBan: PHIEN_BAN_V3, namXem, demThat, giay, luot, ketQua: cauXong }, null, 1));
  const dat = cauXong.filter((k) => k.dat).length;
  console.log(`\nXONG ${luot.length} lượt gọi · ${dat}/${cauXong.length} câu đạt luật đếm được · ${giay}s · ghi ${ra}`);
}
main();
