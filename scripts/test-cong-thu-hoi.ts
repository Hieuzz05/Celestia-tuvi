/**
 * Kiểm CỔNG THU HỒI (X3, CELES-27, T-06) — npx tsx scripts/test-cong-thu-hoi.ts
 *
 * Offline: đệm trong bộ nhớ, hàm viết câu / tóm lại / bức tranh giả, client Supabase giả. Không gọi model,
 * không chạm DB. Phủ phương án bản 2 §11: dấu mục, matcher (5a), đường viết lại trong xu-ly (S-A, câu chờ,
 * 502→200, sổ ý, lượt song song), tóm lại / bức tranh (S-B), sổ kết luận, kho.ts (cờ, chưa có bảng, lỗi tạm,
 * phạm vi), SQL chỉ thêm, và các lối từ chối của script.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { lapLaSo, type Cung } from '../lib/tuvi/ansao';
import { dungKhoiThuVien } from '../lib/rag/thu-vien/cho-prompt';
import { dauMuc } from '../lib/rag/thu-vien/dau';
import type { MucThuVien } from '../lib/rag/thu-vien/kieu';
import type { DuKienV3 } from '../lib/rag/v3/du-kien';
import { CAU_HOI_V3, dauMuc as dauMucV3, PHIEN_BAN_V3, type KetQuaCauV3, type luanNhieuCau } from '../lib/rag/v3';
import { anNoiBo, khoaDemV3, locBaiTheHeTruoc, LOGIC_V3, THE_HE_DEM, xuLyLuanGiaiV3, type CauTraRaV3, type MoiTruongV3 } from '../lib/rag/v3/xu-ly';
import { SO_CHU_DE_TOI_THIEU } from '../lib/rag/v3/buc-tranh';
import { soKetLuanV3 } from '../lib/rag/v3/so-ket-luan';
import { _datLaiThuHoiChoTest, docTapThuHoi } from '../lib/rag/thu-hoi/kho';
import { _thayAdminChoTest } from '../lib/supabase/admin';
import { phamViDem } from '../lib/moi-truong-dem';
import { docLenh, giaiPhamVi, type Lenh } from './thu-hoi-muc';

let sai = 0;
const kiem = (ten: string, dung: boolean, chiTiet?: unknown) => {
  if (!dung) sai++;
  console.log(`${dung ? 'ĐÚNG' : 'SAI '}  ${ten}${!dung && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet).slice(0, 400)}` : ''}`);
};

const D1 = 'aaaaaaaa';
const D2 = 'bbbbbbbb';
const TAP = new Set([D1]);

// ───────────────────────── 1. Dấu mục ─────────────────────────
{
  const m = { y: 'câu nghĩa', dieuKien: { cung: ['Mệnh'], sao: [{ ten: 'Tử Vi', quanHe: 'o-cung' as const }] } };
  const tay = createHash('sha1').update(`${m.y}\n${JSON.stringify(m.dieuKien)}`).digest('hex').slice(0, 8);
  kiem('dauMuc giữ nguyên công thức sau khi tách tệp', dauMuc(m) === tay);
  kiem('v3/index re-export cùng hàm dauMuc', dauMucV3 === dauMuc);
}

// ───────────────────────── 2. Matcher ─────────────────────────
{
  const laSoMa = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });
  const chinh = (c: Cung) => c.sao.find((s) => s.loai === 'chinh-tinh');
  const goc = laSoMa.cungs.find((c) => chinh(c))!;
  const saoGoc = chinh(goc)!.ten;
  const muc = (id: string, o: Partial<MucThuVien> = {}): MucThuVien => ({
    id, schemaVersion: 1, chuDe: ['su-nghiep'],
    dieuKien: { cung: [], sao: [{ ten: saoGoc, quanHe: 'o-cung' }] },
    y: `câu nghĩa của ${id}`,
    nhan: { chieu: 'cat', muc: 'vua', linhVuc: [] },
    cheDo: 'add', canCu: [], truongPhai: 'chung', duyet: 'chua', dotTrich: 'dot-thu',
    ...o,
  });
  const duKien: DuKienV3[] = [];
  const dung = (tv: MucThuVien[], thuHoi?: ReadonlySet<string>) =>
    dungKhoiThuVien({ laSo: laSoMa, duKien, thuVien: tv, cungChinh: goc.tenCung, meta: new Map(), thuHoi });
  const ids = (kq: ReturnType<typeof dung>) => kq.daChon.map((d) => d.khop.muc.id);

  const kho = Array.from({ length: 12 }, (_, i) => muc(`M${i}`));
  const goc0 = dung(kho);
  const thu = new Set([dauMuc(kho[0])]);
  const kq = dung(kho, thu);
  kiem('mục thu hồi không vào daChon', !ids(kq).includes('M0'), ids(kq));
  kiem('mục thu hồi ghi vào boThuHoi', kq.boThuHoi.includes('M0'));
  kiem('mục thu hồi không có dòng trong khối', !kq.khoi.includes('câu nghĩa của M0\n') && !kq.khoi.endsWith('câu nghĩa của M0'));
  kiem('trần không bị mục thu hồi chiếm', kq.daChon.length === goc0.daChon.length, [kq.daChon.length, goc0.daChon.length]);
  kiem('tập rỗng → y hệt trước', JSON.stringify(dung(kho, new Set())) === JSON.stringify({ ...goc0 }));

  // 5a: thu hồi mục LẬT đã duyệt → mục đích vẫn bị gỡ
  const lat = muc('LAT', { cheDo: 'override', dich: ['DICH'], duyet: 'da-duyet' });
  const kqLat = dung([muc('DICH'), lat, muc('KHAC')], new Set([dauMuc(lat)]));
  kiem('5a: mục lật bị thu hồi không vào daChon', !ids(kqLat).includes('LAT'), ids(kqLat));
  kiem('5a: mục đích vẫn bị gỡ', !ids(kqLat).includes('DICH') && kqLat.boBiLat.includes('DICH'), kqLat.boBiLat);
  kiem('5a: mục khác vẫn vào', ids(kqLat).includes('KHAC'));
}

// ───────────────────────── 3–4. xu-ly ─────────────────────────
const laSo = { ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' as const, namXem: 2026 };
const CD = 'tinh-duyen';
const idCd = CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === CD).map((q) => q.id);
const [C1, C2] = idCd;
const khoaCd = khoaDemV3({ ...laSo, nhom: CD })!;
const cuoiTom = `|tom-lai|k:${PHIEN_BAN_V3.khung}`;
const khoaTom = { chartHash: khoaCd.chartHash, khoaKy: `${khoaCd.khoaKy}${cuoiTom}` };

const cau = (id: string, o: Partial<CauTraRaV3> & { dau?: string[] } = {}): CauTraRaV3 => {
  const { dau, ...r } = o;
  return {
    id, cauHoi: CAU_HOI_V3.find((q) => q.id === id)!.cauHoi, luanGiai: `bài ${id}`, viSao: '', doRo: 'Rõ', chuaViet: false,
    lg: LOGIC_V3, yChinh: [`ý ${id}`],
    ...(dau ? { canCu: { thuVien: dau.map((d) => ({ ma: 'T001', id: 'X', dot: 'd', dau: d })), nguon: [] } } : {}),
    ...r,
  };
};

type VaoViet = Parameters<typeof luanNhieuCau>[0];

function moiTruong(o: { tap?: ReadonlySet<string>; hong?: boolean; tomHong?: boolean; khiViet?: () => void } = {}) {
  const bo = new Map<string, unknown>();
  const k = (x: { chartHash: string; khoaKy: string }) => `${x.chartHash}|${x.khoaKy}`;
  const goi: VaoViet[] = [];
  const goiTom: unknown[] = [];
  const goiBuc: unknown[] = [];
  const viet = (async (vao: VaoViet) => {
    goi.push(vao);
    o.khiViet?.();
    return vao.ids.map((id) => ({
      id, loai: 'chuyen-sau', cauHoi: CAU_HOI_V3.find((q) => q.id === id)!.cauHoi,
      luanGiai: o.hong ? '' : `mới ${id}`, viSao: '', goiY: '', doRo: 'Rõ',
      danY: [{ y: `ý mới ${id}` }], duKien: [], nguon: [], loiConLai: [], loiBanDau: [], soLanGoi: 1,
      token: { vao: 0, ra: 0, dem: 0 }, model: 'gia/gia', ms: 0, msTruyHoi: 0, dat: true,
      thuVien: { daChon: [{ ma: 'T001', id: 'Y', dot: 'd', dau: D2, cung: '', sao: [] }], khopHet: [], nguocChieu: [] },
    })) as unknown as KetQuaCauV3[];
  }) as unknown as typeof luanNhieuCau;
  const mt: MoiTruongV3 = {
    dem: {
      doc: async <T,>(x: { chartHash: string; khoaKy: string }) => (bo.has(k(x)) ? { noiDung: structuredClone(bo.get(k(x))) as T, provider: null, model: null, taoLuc: '' } : null),
      luu: async (x, noiDung) => void bo.set(k(x), structuredClone(noiDung)),
      docMoiNhat: async () => null,
      docNhieu: async <T,>(x: { chartHash: string }, tienTo: string, chua?: string) =>
        [...bo.entries()]
          .filter(([kk]) => kk.startsWith(`${x.chartHash}|${tienTo}`) && (!chua || kk.includes(chua)))
          .map(([kk, v]) => ({ khoaKy: kk.slice(x.chartHash.length + 1), noiDung: structuredClone(v) as T })),
    },
    canDangNhap: async () => null,
    laKhach: async () => false,
    xinLuotLaSoMoi: async () => ({ duocPhep: true, tran: 3 }),
    phienBanKho: async () => null,
    docThuVien: async () => [],
    quanTri: async () => null,
    docThuHoi: async () => o.tap ?? TAP,
    luanNhieuCau: viet,
    viTomLai: async (v) => (goiTom.push(v), o.tomHong ? null : { tomLai: 'tóm mới', model: 'gia/gia' }),
    viBucTranh: async (v) => (goiBuc.push(v), o.tomHong ? null : { bucTranh: 'tranh mới', model: 'gia/gia' }),
  };
  return { mt, bo, k, goi, goiTom, goiBuc };
}
const json = (kq: Awaited<ReturnType<typeof xuLyLuanGiaiV3>>) => ('json' in kq ? kq.json : ({} as Record<string, unknown>));
const st = (kq: Awaited<ReturnType<typeof xuLyLuanGiaiV3>>) => ('json' in kq ? kq.status : kq.traThang.status);
const CHO_PHEP_CHO = ['id', 'cauHoi', 'luanGiai', 'viSao', 'doRo', 'chuaViet', 'tamAn'].sort().join();

async function kiemXuLy() {
  kiem('chủ đề kiểm có ≥ 2 câu', idCd.length >= 2);
  // 3a. Đệm trúng, một câu dính → viết lại đúng câu đó; câu khác giữ đệm
  {
    const { mt, bo, k, goi } = moiTruong();
    bo.set(k(khoaCd), idCd.map((id) => cau(id, id === C1 ? { dau: [D1] } : {})));
    const kq = await xuLyLuanGiaiV3({ ...laSo, nhom: CD }, mt);
    const ra = (json(kq).cau ?? []) as Record<string, unknown>[];
    kiem('câu dính: viết lại đúng câu đó', goi.length === 1 && goi[0].ids.join() === C1, goi.map((g) => g.ids));
    kiem('lượt viết nhận tập thu hồi', goi[0]?.thuHoi?.has(D1) === true);
    kiem('câu khác giữ đệm', ra.find((c) => c.id === C2)?.luanGiai === `bài ${C2}`);
    kiem('câu dính trả bản mới', ra.find((c) => c.id === C1)?.luanGiai === `mới ${C1}`);
    const luu = (bo.get(k(khoaCd)) as CauTraRaV3[]).find((c) => c.id === C1)!;
    kiem('bản mới mang thayThuHoi', JSON.stringify(luu.thayThuHoi) === JSON.stringify([D1]), luu);
    kiem('không lộ thayThuHoi / canCu ra trình duyệt', ra.every((c) => !('thayThuHoi' in c) && !('canCu' in c)));
    // S-A: mở lần 2 → 0 lượt model
    await xuLyLuanGiaiV3({ ...laSo, nhom: CD }, mt);
    kiem('S-A: mở lần 2 sau khi viết lại sạch → 0 lượt model', goi.length === 1, goi.length);
  }
  // 3b. Viết hỏng → câu chờ; đệm còn bản gốc; thế hệ trước không lọt
  {
    const { mt, bo, k } = moiTruong({ hong: true });
    bo.set(k(khoaCd), idCd.map((id) => cau(id, id === C1 ? { dau: [D1], ghep: ['ý ghép bí mật'], kho: 'k1' } : {})));
    bo.set(k({ ...khoaCd, khoaKy: khoaCd.khoaKy.replace(`|th:${THE_HE_DEM}`, `|th:${THE_HE_DEM - 1}`) }), idCd.map((id) => cau(id, { luanGiai: `cũ ${id}` })));
    const kq = await xuLyLuanGiaiV3({ ...laSo, nhom: CD }, mt);
    const ra = (json(kq).cau ?? []) as Record<string, unknown>[];
    const c1 = ra.find((c) => c.id === C1)!;
    kiem('viết hỏng: câu chờ (tamAn, chưa viết)', st(kq) === 200 && c1.tamAn === true && c1.chuaViet === true && c1.luanGiai === '', c1);
    kiem('câu chờ chỉ có trường được phép', Object.keys(c1).sort().join() === CHO_PHEP_CHO, Object.keys(c1));
    kiem('thế hệ trước không lọt vào câu chờ', c1.luanGiai !== `cũ ${C1}`);
    const luu = (bo.get(k(khoaCd)) as CauTraRaV3[]).find((c) => c.id === C1)!;
    kiem('đệm còn bản gốc (hoàn tác còn bài)', luu.luanGiai === `bài ${C1}` && luu.canCu?.thuVien[0].dau === D1, luu);
  }
  // 3c. Cả nửa `chi` dính + viết hỏng → 200, không 502
  {
    const { mt, bo, k } = moiTruong({ hong: true });
    bo.set(k(khoaCd), idCd.map((id) => cau(id, id === C1 ? { dau: [D1] } : {})));
    const kq = await xuLyLuanGiaiV3({ ...laSo, nhom: CD, chi: [C1] }, mt);
    kiem('nửa chi toàn câu chờ → 200', st(kq) === 200 && (json(kq).cau as CauTraRaV3[])?.[0]?.tamAn === true, json(kq));
  }
  // 3d. Sổ ý không mang ý câu dính (cả anhEm lẫn daCo)
  {
    const { mt, bo, k, goi } = moiTruong();
    bo.set(k(khoaCd), [cau(C1, { dau: [D1], yChinh: ['Y-DINH-CUNG-NHOM'] })]);
    const khoaKhac = khoaDemV3({ ...laSo, nhom: 'tong-quan' })!;
    bo.set(k(khoaKhac), [cau(CAU_HOI_V3.find((q) => q.loai === 'tong-quan')!.id, { dau: [D1], yChinh: ['Y-DINH-NHOM-KHAC'] })]);
    await xuLyLuanGiaiV3({ ...laSo, nhom: CD, chi: [C2] }, mt);
    const daNoi = JSON.stringify(goi[0]?.daNoi ?? []);
    kiem('sổ ý: không có ý câu dính cùng nhóm (daCo)', goi.length === 1 && !daNoi.includes('Y-DINH-CUNG-NHOM'), daNoi);
    kiem('sổ ý: không có ý câu dính nhóm khác (anhEm)', !daNoi.includes('Y-DINH-NHOM-KHAC'), daNoi);
  }
  // 3e. Lượt song song ghi câu dính → không gộp
  {
    const ctx = moiTruong({
      khiViet: () => ctx.bo.set(ctx.k(khoaCd), [cau(C2, { dau: [D1], luanGiai: 'song song dính' })]),
    });
    await xuLyLuanGiaiV3({ ...laSo, nhom: CD, chi: [C1] }, ctx.mt);
    const luu = ctx.bo.get(ctx.k(khoaCd)) as CauTraRaV3[];
    kiem('lượt song song: câu dính không được gộp', !luu.some((c) => c.luanGiai === 'song song dính'), luu);
  }
  // 3f. locBaiTheHeTruoc + anNoiBo
  kiem('đường lùi thế hệ trước loại câu dính', !locBaiTheHeTruoc([cau(C1, { dau: [D1] })], TAP).has(C1));
  {
    const ra = anNoiBo([cau(C1, { dau: [D1], thayThuHoi: [D2] })])[0] as Record<string, unknown>;
    kiem('anNoiBo gỡ thayThuHoi + canCu', !('thayThuHoi' in ra) && !('canCu' in ra));
  }

  // 4. Tóm lại
  const tomLai = async (o: Parameters<typeof moiTruong>[0], dat: (bo: Map<string, unknown>, k: (x: { chartHash: string; khoaKy: string }) => string) => void) => {
    const ctx = moiTruong(o);
    dat(ctx.bo, ctx.k);
    const kq = await xuLyLuanGiaiV3({ ...laSo, nhom: CD, tomLai: true }, ctx.mt);
    return { ...ctx, kq, j: json(kq) };
  };
  {
    const r = await tomLai({}, (bo, k) => {
      bo.set(k(khoaCd), idCd.map((id) => cau(id)));
      bo.set(k(khoaTom), { tomLai: 'tóm cũ', lg: LOGIC_V3, dauTV: [D1] });
    });
    kiem('tóm lại có dauTV dính: không trả, ghép lại từ câu sạch', r.j.tomLai === 'tóm mới' && r.goiTom.length === 1, r.j);
    kiem('tóm lại mới mang dauTV', Array.isArray((r.bo.get(r.k(khoaTom)) as { dauTV?: unknown }).dauTV));
  }
  {
    const r = await tomLai({}, (bo, k) => {
      bo.set(k(khoaCd), idCd.map((id) => cau(id, id === C1 ? { dau: [D1] } : {})));
      bo.set(k(khoaTom), { tomLai: 'tóm cũ', lg: LOGIC_V3 });
    });
    kiem('tóm lại không dauTV + câu nhóm dính: không trả bản cũ (chưa đủ)', r.j.tomLai !== 'tóm cũ' && r.j.chuaDu === true, r.j);
  }
  {
    const r = await tomLai({}, (bo, k) => {
      bo.set(k(khoaCd), idCd.map((id) => cau(id, id === C1 ? { dau: [D2], thayThuHoi: [D1] } : {})));
      bo.set(k(khoaTom), { tomLai: 'tóm cũ', lg: LOGIC_V3 });
    });
    kiem('tóm lại cũ + câu đã viết lại (thayThuHoi): không trả bản cũ', r.j.tomLai !== 'tóm cũ', r.j);
    kiem('S-A: tóm lại ghép được từ câu đã viết lại sạch', r.j.tomLai === 'tóm mới', r.j);
    const dauTV = (r.bo.get(r.k(khoaTom)) as { dauTV: string[] }).dauTV;
    kiem('S-A: dauTV tóm lại mới không mang dấu đã thu hồi', !dauTV.includes(D1) && dauTV.includes(D2), dauTV);
  }
  {
    const r = await tomLai({ tomHong: true }, (bo, k) => {
      bo.set(k(khoaCd), idCd.map((id) => cau(id)));
      bo.set(k(khoaTom), { tomLai: 'tóm cũ', lg: LOGIC_V3, dauTV: [D1] });
    });
    kiem('tóm lại dính + viết hỏng: không trả bản cũ', r.j.tomLai !== 'tóm cũ' && st(r.kq) === 502, r.j);
  }
  {
    const r = await tomLai({}, (bo, k) => {
      bo.set(k(khoaCd), idCd.map((id) => cau(id)));
      bo.set(k(khoaTom), { tomLai: 'tóm cũ', lg: LOGIC_V3, dauTV: [D2] });
    });
    kiem('tóm lại không dính: trả đệm như cũ', r.j.tomLai === 'tóm cũ' && r.j.tuDem === true && r.goiTom.length === 0, r.j);
  }

  // 4b. Bức tranh
  const cds = [...new Set(CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau').map((q) => q.chuDe!))].slice(0, SO_CHU_DE_TOI_THIEU);
  const datBuc = (bo: Map<string, unknown>, k: (x: { chartHash: string; khoaKy: string }) => string, dauCau: string) => {
    for (const cd of cds) {
      const kc = khoaDemV3({ ...laSo, nhom: cd })!;
      const idc = CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === cd).map((q) => q.id);
      bo.set(k(kc), idc.map((id, i) => cau(id, i === 0 && cd === cds[0] ? { dau: [dauCau] } : {})));
      bo.set(k({ chartHash: kc.chartHash, khoaKy: `${kc.khoaKy}${cuoiTom}` }), { tomLai: `tóm ${cd}`, lg: LOGIC_V3 });
    }
  };
  const buc = (bo: Map<string, unknown>) => [...bo.entries()].find(([kk]) => kk.includes('|buc-tranh|'));
  {
    // S-B: tóm lại cũ không dauTV, câu nhóm dựa vào D2 (chưa thu hồi) → bức tranh mới mang D2
    const ctx = moiTruong({ tap: new Set() });
    datBuc(ctx.bo, ctx.k, D2);
    const j = json(await xuLyLuanGiaiV3({ ...laSo, bucTranh: true }, ctx.mt));
    const b = buc(ctx.bo)?.[1] as { dauTV?: string[] } | undefined;
    kiem('S-B: bức tranh mới từ tóm lại cũ mang dấu câu nhóm', j.bucTranh === 'tranh mới' && !!b?.dauTV?.includes(D2), { j, b });
    // Thu hồi D2 sau đó → bức tranh dính, tóm lại cũ dính → chủ đề đó vắng
    const ctx2 = moiTruong({ tap: new Set([D2]) });
    for (const [kk, v] of ctx.bo) ctx2.bo.set(kk, v);
    const j2 = json(await xuLyLuanGiaiV3({ ...laSo, bucTranh: true }, ctx2.mt));
    kiem('bức tranh dính: chủ đề có tóm lại dính vắng → chưa đủ, không trả đệm', j2.bucTranh === null && ctx2.goiBuc.length === 0, j2);
  }
  {
    const ctx = moiTruong({ tap: new Set([D1]), tomHong: true });
    datBuc(ctx.bo, ctx.k, D2);
    const khoaBuc = `nam:${laSo.namXem}|buc-tranh|th:${THE_HE_DEM}|k:${PHIEN_BAN_V3.khung}|${[...cds].sort().join('+')}`;
    ctx.bo.set(ctx.k({ chartHash: khoaCd.chartHash, khoaKy: khoaBuc }), { bucTranh: 'tranh cũ', lg: LOGIC_V3, dauTV: [D1] });
    const kq = await xuLyLuanGiaiV3({ ...laSo, bucTranh: true }, ctx.mt);
    kiem('bức tranh dính + viết hỏng: không trả bản cũ', json(kq).bucTranh !== 'tranh cũ' && st(kq) === 502, json(kq));
    const ctx3 = moiTruong({ tap: new Set([D1]) });
    for (const [kk, v] of ctx.bo) ctx3.bo.set(kk, v);
    ctx3.bo.set(ctx3.k({ chartHash: khoaCd.chartHash, khoaKy: khoaBuc }), { bucTranh: 'tranh cũ', lg: LOGIC_V3, dauTV: [D2] });
    const kq3 = await xuLyLuanGiaiV3({ ...laSo, bucTranh: true }, ctx3.mt);
    kiem('bức tranh không dính: trả đệm như cũ', json(kq3).bucTranh === 'tranh cũ' && ctx3.goiBuc.length === 0, json(kq3));
  }
}

// ───────────────────────── Client Supabase giả ─────────────────────────
type Ghi = { bang: string; loc: [string, unknown[]][] };
function clientGia(tra: (g: Ghi) => { data: unknown; error: unknown }) {
  const lich: Ghi[] = [];
  const c = {
    from(bang: string) {
      const g: Ghi = { bang, loc: [] };
      lich.push(g);
      const q: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'in', 'is', 'like', 'not', 'order', 'limit', 'range']) {
        q[m] = (...a: unknown[]) => (g.loc.push([m, a]), q);
      }
      q.then = (ok: (v: unknown) => unknown, loi?: (e: unknown) => unknown) => Promise.resolve(tra(g)).then(ok, loi);
      return q;
    },
  };
  return { client: c as unknown as SupabaseClient, lich };
}

async function kiemSoKetLuan() {
  const ns = phamViDem().ns;
  const tq = CAU_HOI_V3.filter((q) => q.loai === 'tong-quan').map((q) => q.id);
  const tienTo = `nam:${laSo.namXem}|nhom:`;
  const rows = [
    { khoa_ky: `${ns}${tienTo}${CD}|th:${THE_HE_DEM}${cuoiTom}`, noi_dung: { tomLai: 'Tóm lại dính mục đã thu hồi, câu này đủ dài để vào sổ.', dauTV: [D1] } },
    { khoa_ky: `${ns}${tienTo}con-cai|th:${THE_HE_DEM}${cuoiTom}`, noi_dung: { tomLai: 'Tóm lại sạch của con cái, câu này đủ dài để vào sổ.', dauTV: [D2] } },
    { khoa_ky: `${ns}${tienTo}tong-quan|th:${THE_HE_DEM}`, noi_dung: [cau(tq[0], { dau: [D1], yChinh: ['Ý tổng quan dính mục đã thu hồi, đủ dài.'] }), cau(tq[1], { yChinh: ['Ý tổng quan sạch, đủ dài để vào sổ kết luận.'] })] },
  ];
  const { client } = clientGia(() => ({ data: rows, error: null }));
  _thayAdminChoTest(client);
  const so = await soKetLuanV3('hash-thu', laSo.namXem, TAP);
  kiem('sổ kết luận: loại tóm lại dính', !so.some((x) => x.includes('dính')) && so.some((x) => x.includes('con cái')), so);
  kiem('sổ kết luận: giữ ý tổng quan sạch', so.some((x) => x.includes('tổng quan sạch')), so);
  const soRong = await soKetLuanV3('hash-thu', laSo.namXem, new Set());
  kiem('sổ kết luận: tập rỗng → như trước', soRong.length === 4, soRong);
  _thayAdminChoTest(null);
}

async function kiemKho() {
  const env = { ...process.env };
  const goc = Date.now;
  let gio = 1_000_000;
  Date.now = () => gio;
  const loiLog = console.error;
  const infoLog = console.info;
  console.error = () => {};
  console.info = () => {};
  try {
    for (const k of ['VERCEL', 'VERCEL_ENV', 'CELES_CONG_THU_HOI']) delete process.env[k];
    let n = 0;
    let che: 'ok' | 'chua-co' | 'loi' = 'ok';
    const { client, lich } = clientGia(() => {
      n++;
      if (che === 'chua-co') return { data: null, error: { code: 'PGRST205', message: 'Could not find the table' } };
      if (che === 'loi') return { data: null, error: { code: '57014', message: 'timeout' } };
      return { data: [{ dau: D1 }], error: null };
    });
    _thayAdminChoTest(client);
    _datLaiThuHoiChoTest();
    kiem('kho: cờ tắt → tập rỗng', (await docTapThuHoi()).size === 0);
    kiem('kho: cờ tắt → 0 truy vấn', n === 0);

    process.env.CELES_CONG_THU_HOI = '1';
    const t = await docTapThuHoi();
    kiem('kho: đọc được dấu', t.has(D1) && n === 1);
    const inArg = lich[0]?.loc.find(([m]) => m === 'in')?.[1];
    kiem('kho: lọc phạm vi (all, phamViDem của server)', JSON.stringify(inArg) === JSON.stringify(['pham_vi', ['all', phamViDem().phamViDem]]), inArg);
    kiem('kho: chỉ lệnh còn hiệu lực (huy_luc null)', lich[0]?.loc.some(([m, a]) => m === 'is' && a[0] === 'huy_luc' && a[1] === null));
    kiem('kho: đúng bảng', lich[0]?.bang === 'thu_hoi_muc_thu_vien');
    await docTapThuHoi();
    kiem('kho: RAM 60 giây → không truy vấn lại', n === 1);
    gio += 61_000;
    await docTapThuHoi();
    kiem('kho: hết 60 giây → đọc lại', n === 2);

    // Lỗi tạm: thử lại 1 lần, giữ tập tốt cũ
    gio += 61_000;
    che = 'loi';
    const tLoi = await docTapThuHoi();
    kiem('kho: lỗi tạm → thử lại đúng 1 lần', n === 4, n);
    kiem('kho: lỗi tạm → giữ tập tốt gần nhất', tLoi.has(D1));
    _datLaiThuHoiChoTest();
    const tLoi2 = await docTapThuHoi();
    kiem('kho: lỗi tạm, chưa có tập tốt → tập rỗng (mở cổng), không ném', tLoi2.size === 0);

    // Chưa có bảng: cổng tắt, nhớ 10 phút
    _datLaiThuHoiChoTest();
    che = 'chua-co';
    const m0 = n;
    const tc = await docTapThuHoi();
    kiem('kho: chưa có bảng → tập rỗng, không thử lại', tc.size === 0 && n === m0 + 1);
    gio += 5 * 60_000;
    await docTapThuHoi();
    kiem('kho: chưa có bảng → nhớ 10 phút', n === m0 + 1);

    // Production chỉ đọc 'all'
    _datLaiThuHoiChoTest();
    che = 'ok';
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    const nodeEnv = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    const tr = lich.length;
    await docTapThuHoi();
    const inProd = lich[tr]?.loc.find(([m]) => m === 'in')?.[1];
    kiem('kho: production chỉ đọc phạm vi all', JSON.stringify(inProd) === JSON.stringify(['pham_vi', ['all']]), inProd);
    (process.env as Record<string, string | undefined>).NODE_ENV = nodeEnv;

    // Thiếu khoá service-role → cổng tắt
    _thayAdminChoTest(null);
    _datLaiThuHoiChoTest();
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    kiem('kho: thiếu khoá service-role → tập rỗng, không ném', (await docTapThuHoi()).size === 0);
  } finally {
    Date.now = goc;
    console.error = loiLog;
    console.info = infoLog;
    for (const k of Object.keys(process.env)) if (!(k in env)) delete process.env[k];
    Object.assign(process.env, env);
    _thayAdminChoTest(null);
    _datLaiThuHoiChoTest();
  }
  const src = readFileSync('lib/rag/thu-hoi/kho.ts', 'utf-8');
  kiem('kho: chỉ đi qua client service-role (taoSupabaseAdmin)', src.includes('taoSupabaseAdmin') && !/createClient|supabase\/(client|server)/.test(src));
  const cong = readFileSync('lib/rag/thu-hoi/cong.ts', 'utf-8');
  kiem('cong.ts không import Supabase (app có thể kéo qua đồ thị import)', !/from ['"][^'"]*supabase/.test(cong));
}

function kiemSql() {
  const sql = readFileSync('supabase/va-thu-hoi-muc.sql', 'utf-8')
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .toLowerCase();
  kiem('SQL: create table if not exists', /create table if not exists thu_hoi_muc_thu_vien/.test(sql));
  kiem('SQL: mọi create đều if not exists', !/create (table|index)(?! if not exists)/.test(sql));
  kiem('SQL: bật RLS', /alter table thu_hoi_muc_thu_vien enable row level security/.test(sql));
  kiem('SQL: không drop / delete / truncate / policy / update', !/\b(drop|delete|truncate|policy|update|grant)\b/.test(sql));
}

async function kiemScript() {
  const loi = (a: string) => {
    const l = docLenh(a.split(' ').filter(Boolean));
    return 'loi' in l ? l.loi : '';
  };
  kiem('script: không cờ phạm vi → từ chối', !!loi('thu-hoi --dau aaaaaaaa'));
  kiem('script: all thiếu --ghi-production → từ chối', !!loi('thu-hoi --pham-vi all --dau aaaaaaaa --ap-dung --ly-do x'));
  kiem('script: hai phạm vi cùng lúc → từ chối', !!loi('xem --pham-vi all --preview-url https://x.vercel.app'));
  kiem('script: preview + --ghi-production → từ chối', !!loi('xem --preview-url https://x.vercel.app --ghi-production'));
  kiem('script: --pham-vi khác all → từ chối', !!loi('xem --pham-vi production'));
  kiem('script: dấu sai dạng → từ chối', !!loi('thu-hoi --preview-url https://x --dau xyz'));
  kiem('script: --id thiếu --chu-de → từ chối', !!loi('thu-hoi --preview-url https://x --id T1'));
  kiem('script: ghi thật thiếu lý do → từ chối', !!loi('thu-hoi --preview-url https://x --dau aaaaaaaa --ap-dung'));
  const kho = docLenh('thu-hoi --preview-url https://x --dau aaaaaaaa'.split(' ')) as Lenh;
  kiem('script: mặc định chạy khô', !('loi' in kho) && kho.apDung === false);
  kiem('script: all + --ghi-production hợp lệ (vẫn khô nếu thiếu --ap-dung)', !loi('thu-hoi --pham-vi all --ghi-production --dau aaaaaaaa'));
  const l = docLenh('xem --preview-url https://x.vercel.app'.split(' ')) as Lenh;
  let tuChoi = false;
  try {
    await giaiPhamVi(l, async () => ({ phamViDem: 'production' }));
  } catch {
    tuChoi = true;
  }
  kiem('script: preview-url trả production → từ chối', tuChoi);
  kiem('script: lấy phạm vi từ server bản xem thử', (await giaiPhamVi(l, async () => ({ phamViDem: 'preview:viec-x-1a2b3c4d' }))) === 'preview:viec-x-1a2b3c4d');
  const src = readFileSync('scripts/thu-hoi-muc.ts', 'utf-8');
  kiem('script: không đụng knowledge_chunks', !/from\(['"]knowledge_chunks/.test(src));
  kiem('script: gọi khaiBaoScript', src.includes('khaiBaoScript(process.argv)'));
}

async function main() {
  await kiemXuLy();
  await kiemSoKetLuan();
  await kiemKho();
  kiemSql();
  await kiemScript();
  console.log(sai ? `\n${sai} ca SAI` : '\nTất cả ĐÚNG');
  process.exit(sai ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
