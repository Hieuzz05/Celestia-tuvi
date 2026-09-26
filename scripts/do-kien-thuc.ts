/**
 * NGHIỆM THU KIẾN THỨC — KIEN-TRUC-LUAN-GIAI.md mục 11.7.
 *
 *   npx tsx scripts/do-kien-thuc.ts <thư mục ra của do-thu-vien.ts> [--ban A,B,B2] [--giam-khao a,b] [--song-song 6]
 *
 * 1. ĐÁP ÁN KIẾN THỨC cho mỗi (lá, câu), dựng độc lập với các bản: engine liệt kê cấu hình
 *    trọng yếu; gpt-5.6-luna viết 5–8 điểm bài đúng phải nói + 2–4 điều không được nói, từ
 *    kiến thức của model + HỢP đoạn sách mọi bản đã dùng. Lưu dap-an.json, chạy lại dùng lại.
 * 2. CHẤM KIẾN THỨC từng bài (chỉ bài luận người đọc thấy), không biết bản: dat / thieu / sai.
 * 3. KIỂM GIÁM KHẢO: 12 bài cài lỗi (đảo nghĩa một điểm bắt buộc) phải bị chấm `sai` ≥ 10/12;
 *    chấm lại 20 bài, trùng kết quả từng điểm ≥ 80%.
 *
 * Cách viết chấm riêng: scripts/so-sanh-v3.ts A.json B2.json --du
 * Đầu ra có văn sách → thư mục NGOÀI repo.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { boLaSo } from './lat-cat-su-nghiep';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const i = d.indexOf('=');
  if (i < 1 || d.trim().startsWith('#')) continue;
  const k = d.slice(0, i).trim();
  const v = d.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k]) process.env[k] = v;
}
const thamSo = (ten: string, macDinh = '') => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 ? process.argv[i + 1] : macDinh;
};

type Bai = {
  khoa: string; id: string; cauHoi: string; luanGiai: string;
  duKien: { id: string; vaiTro: string; noiDung: string }[];
  nguon: { chunkId: string; noiDung: string }[];
  thuVien?: { daChon: { id: string }[] };
};
type DapAn = { diem: { id: string; noiDung: string; sao: string[]; muc: 'bat-buoc' | 'nen-co' }[]; khongDuoc: { id: string; noiDung: string }[] };
type KetQuaCham = { diem: Record<string, 'dat' | 'thieu' | 'sai'>; viPham: number; saiKhac: number; hong: boolean };

const CHINH = ['Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh', 'Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát', 'Phá Quân'];
const NHOM: Record<string, string[]> = {
  'lục cát': ['Tả Phù', 'Hữu Bật', 'Văn Xương', 'Văn Khúc', 'Thiên Khôi', 'Thiên Việt'],
  'lục sát': ['Kình Dương', 'Đà La', 'Hỏa Tinh', 'Linh Tinh', 'Địa Không', 'Địa Kiếp'],
  'tứ hoá': ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'],
  'khác': ['Lộc Tồn', 'Thiên Mã'],
};
const TEN_SANG: Record<string, string> = { M: 'miếu', V: 'vượng', D: 'đắc', B: 'bình', H: 'hãm' };

async function main() {
  const thuMuc = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!thuMuc) throw new Error('Thiếu thư mục ra');
  const banTen = thamSo('ban', 'A,B,B2').split(',');
  const giamKhao = thamSo('giam-khao', 'openai|gpt-5.6-luna,openai|gpt-4o-mini').split(',');
  const songSong = Number(thamSo('song-song', '6'));
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { docObjectJson } = await import('../lib/rag/doc-json');
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { nhanDangCachCuc } = await import('../lib/tuvi/cach-cuc');
  const { docThuVien } = await import('../lib/rag/thu-vien/kho');

  // ---- Nạp các bản ----
  const goc = JSON.parse(readFileSync(join(thuMuc, 'chi-tiet.json'), 'utf-8')) as { A: Bai[]; B: Bai[] };
  const ban: Record<string, Bai[]> = { A: goc.A, B: goc.B };
  for (const t of banTen) if (!ban[t]) ban[t] = (JSON.parse(readFileSync(join(thuMuc, `chi-tiet-${t}.json`), 'utf-8')) as { B: Bai[] }).B;
  const thuVien = new Map((await docThuVien('su-nghiep')).map((m) => [m.id, m]));
  const la = boLaSo(12).map((l) => lapLaSo(l));

  // ---- Cấu hình trọng yếu (engine) ----
  const cauHinh = (khoa: string) => {
    const l = la[Number(khoa.slice(1, 3)) - 1];
    const theoChi = (i: number) => l.cungs.find((c) => c.chiIndex === ((i % 12) + 12) % 12)!;
    const ql = l.cungs.find((c) => c.tenCung === 'Quan Lộc')!;
    const menh = l.cungs.find((c) => c.tenCung === 'Mệnh')!;
    const chinh = (c: typeof ql) => c.sao.filter((s) => CHINH.includes(s.ten)).map((s) => `${s.ten}${s.doSang ? ` (${TEN_SANG[s.doSang] ?? s.doSang})` : ''}`);
    const tp = [ql, theoChi(ql.chiIndex + 4), theoChi(ql.chiIndex + 8), theoChi(ql.chiIndex + 6)];
    const dong = [
      `Quan Lộc (${ql.chi}): ${chinh(ql).join(', ') || `vô chính diệu, mượn ${chinh(theoChi(ql.chiIndex + 6)).join(', ')}`}${ql.coTuan ? ' · có Tuần' : ''}${ql.coTriet ? ' · có Triệt' : ''} · Tràng Sinh: ${ql.trangSinh}`,
      `Mệnh (${menh.chi}): ${chinh(menh).join(', ') || 'vô chính diệu'}`,
      ...Object.entries(NHOM).map(([ten, ds]) => {
        const co = tp.flatMap((c) => c.sao.filter((s) => ds.includes(s.ten)).map((s) => `${s.ten}${s.doSang ? ` (${TEN_SANG[s.doSang]})` : ''} ở ${c.tenCung}`));
        return `${ten} trong tam phương Quan Lộc: ${co.join(', ') || 'không có'}`;
      }),
      `Cách cục liên quan: ${nhanDangCachCuc(l, 'Quan Lộc').map((c) => c.ten).join(', ') || 'không'}`,
    ];
    return dong.join('\n');
  };

  // ---- Gói nguồn CHUNG: hợp đoạn sách mọi bản + câu trích sau mục thư viện ----
  const khoaDs = ban.A.map((b) => b.khoa);
  const nguonChung = (khoa: string) => {
    const doan = new Map<string, string>();
    for (const t of banTen) {
      const b = ban[t].find((x) => x.khoa === khoa);
      for (const n of b?.nguon ?? []) doan.set(n.chunkId, n.noiDung);
      for (const d of b?.thuVien?.daChon ?? []) for (const c of thuVien.get(d.id)?.canCu ?? []) if (!doan.has(c.chunkId)) doan.set(c.chunkId, c.trich);
    }
    return [...doan.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, v], i) => `N${String(i + 1).padStart(2, '0')}: ${v}`).join('\n\n');
  };

  const tokens = { vao: 0, ra: 0 };
  const goi = async (system: string, user: string, gk: string, maxTokens: number) => {
    for (let lan = 0; lan < 2; lan++) {
      try {
        const g = await goiVoiFallback({ system, user, maxTokens, temperature: 0 }, gk, 150_000);
        tokens.vao += g.tokensIn ?? 0;
        tokens.ra += g.tokensOut ?? 0;
        const o = docObjectJson(g.text);
        if (o) return o;
      } catch {
        /* thử lại */
      }
    }
    return null;
  };
  const chayDong = async <T>(ds: T[], f: (x: T) => Promise<void>) => {
    let k = 0;
    await Promise.all(Array.from({ length: songSong }, async () => { while (k < ds.length) await f(ds[k++]); }));
  };

  // ---- 1. Đáp án ----
  const tepDapAn = join(thuMuc, 'dap-an.json');
  const dapAn: Record<string, DapAn> = existsSync(tepDapAn) ? JSON.parse(readFileSync(tepDapAn, 'utf-8')) : {};
  const heDapAn = `Bạn là chuyên gia Tử Vi (Nam phái). Soạn ĐÁP ÁN KIẾN THỨC để chấm bài luận trả lời một câu hỏi sự nghiệp của đúng lá số dưới đây.
Dựa vào kiến thức Tử Vi của bạn VÀ các đoạn sách được cấp. Chỉ nói về ĐÚNG cấu hình lá số này: độ sáng (miếu / vượng / đắc / bình / hãm đổi nghĩa rất nhiều), sao đi cùng trong tam phương (lục cát, lục sát, tứ hoá, Lộc Tồn, Mã), Tuần / Triệt, vô chính diệu, phá cách, phản vi kỳ cách.
- "diem": 5–8 điểm kiến thức một bài ĐÚNG phải nói để trả lời câu hỏi, xếp từ quan trọng nhất. Mỗi điểm viết bằng lời đời thường về công việc (bài được chấm KHÔNG nêu tên sao), kèm "sao" căn cứ và "muc": "bat-buoc" (thiếu là sai trọng tâm) hoặc "nen-co".
- "khongDuoc": 2–4 sai lầm điển hình với cấu hình này (vd. luận sao hãm như sao miếu; bỏ qua sát tinh đi cùng; nói ngược nghĩa một cách cục).
Chỉ trả JSON: {"diem":[{"id":"K1","noiDung":"...","sao":["..."],"muc":"bat-buoc"}],"khongDuoc":[{"id":"X1","noiDung":"..."}]}`;
  const canDapAn = khoaDs.filter((k) => !dapAn[k]?.diem?.length);
  console.log(`Đáp án: có sẵn ${khoaDs.length - canDapAn.length}, cần soạn ${canDapAn.length}`);
  await chayDong(canDapAn, async (khoa) => {
    const a = ban.A.find((x) => x.khoa === khoa)!;
    const o = (await goi(heDapAn, `CÂU HỎI: ${a.cauHoi}\n\nCẤU HÌNH TRỌNG YẾU (engine tính):\n${cauHinh(khoa)}\n\nDỮ KIỆN LÁ SỐ:\n${a.duKien.map((d) => `${d.id} [${d.vaiTro}] ${d.noiDung}`).join('\n')}\n\nĐOẠN SÁCH:\n${nguonChung(khoa)}`, 'openai|gpt-5.6-luna', 3000)) as DapAn | null;
    if (o?.diem?.length) dapAn[khoa] = { diem: o.diem, khongDuoc: o.khongDuoc ?? [] };
  });
  writeFileSync(tepDapAn, JSON.stringify(dapAn, null, 1));

  // ---- 2. Chấm kiến thức ----
  const heCham = `Bạn chấm KIẾN THỨC (KHÔNG chấm văn, không chấm độ dài) của một bài luận tử vi so với ĐÁP ÁN của chuyên gia.
- Mỗi điểm K trong đáp án: "dat" nếu bài nói đúng ý ấy (lời khác vẫn tính), "thieu" nếu bài không nhắc, "sai" nếu bài nói NGƯỢC ý ấy.
- Mỗi điều X "không được nói": viPham true nếu bài phạm.
- "saiKhac": các nhận định trong bài trái kiến thức Tử Vi với cấu hình này mà đáp án không nêu (liệt kê ngắn; không có thì mảng rỗng).
Khắt khe, nhất quán. Chỉ trả JSON: {"diem":[{"id":"K1","kq":"dat|thieu|sai"}],"khongDuoc":[{"id":"X1","viPham":false}],"saiKhac":[]}`;
  const cham = async (gk: string, khoa: string, luanGiai: string): Promise<KetQuaCham> => {
    const da = dapAn[khoa];
    if (!da) return { diem: {}, viPham: 0, saiKhac: 0, hong: true };
    const user = `ĐÁP ÁN:\n${da.diem.map((d) => `${d.id} [${d.muc}] ${d.noiDung}`).join('\n')}\nKHÔNG ĐƯỢC NÓI:\n${da.khongDuoc.map((x) => `${x.id} ${x.noiDung}`).join('\n')}\n\nCẤU HÌNH TRỌNG YẾU:\n${cauHinh(khoa)}\n\nBÀI LUẬN:\n${luanGiai}`;
    const o = (await goi(heCham, user, gk, 1200)) as { diem?: { id: string; kq: string }[]; khongDuoc?: { viPham?: boolean }[]; saiKhac?: unknown[] } | null;
    if (!o?.diem?.length) return { diem: {}, viPham: 0, saiKhac: 0, hong: true };
    const diem: KetQuaCham['diem'] = {};
    for (const d of o.diem) if (['dat', 'thieu', 'sai'].includes(d.kq)) diem[d.id] = d.kq as 'dat' | 'thieu' | 'sai';
    return { diem, viPham: (o.khongDuoc ?? []).filter((x) => x.viPham).length, saiKhac: Array.isArray(o.saiKhac) ? o.saiKhac.length : 0, hong: false };
  };
  const diemKT = (khoa: string, r: KetQuaCham) => {
    const da = dapAn[khoa];
    let co = 0, toiDa = 0;
    for (const d of da.diem) {
      const w = d.muc === 'bat-buoc' ? 2 : 1;
      toiDa += w;
      if (r.diem[d.id] === 'dat') co += w;
    }
    return toiDa ? co / toiDa : 0;
  };

  // ---- 3. Bài cài lỗi: đảo nghĩa điểm bắt buộc đầu tiên ----
  const tepCaiLoi = join(thuMuc, 'cai-loi-kien-thuc.json');
  let caiLoi: { khoa: string; diemId: string; luanGiai: string }[] = existsSync(tepCaiLoi) ? JSON.parse(readFileSync(tepCaiLoi, 'utf-8')) : [];
  if (!caiLoi.length) {
    const chon = khoaDs.filter((_, i) => i % 5 === 0).slice(0, 12);
    await chayDong(chon, async (khoa) => {
      const da = dapAn[khoa];
      const k = da?.diem.find((d) => d.muc === 'bat-buoc');
      if (!k) return;
      const a = ban.A.find((x) => x.khoa === khoa)!;
      const o = (await goi('Bạn sửa một bài luận để tạo bài kiểm tra. Làm đúng MỘT việc: làm cho bài nói NGƯỢC điểm kiến thức được chỉ định — sửa câu đang nói điểm ấy, hoặc nếu bài chưa nói thì chèn một câu nói ngược vào chỗ hợp lý. Giữ nguyên mọi phần khác, giữ giọng văn. Chỉ trả JSON {"luanGiai":"..."}', `ĐIỂM CẦN ĐẢO: ${k.noiDung}\n\nBÀI:\n${a.luanGiai}`, 'openai|gpt-5.6-luna', 2000)) as { luanGiai?: string } | null;
      if (o?.luanGiai && o.luanGiai !== a.luanGiai) caiLoi.push({ khoa, diemId: k.id, luanGiai: o.luanGiai });
    });
    writeFileSync(tepCaiLoi, JSON.stringify(caiLoi, null, 1));
  }
  caiLoi = caiLoi.slice(0, 12);

  // ---- Chấm ----
  const ketQua: Record<string, unknown> = {};
  for (const gk of giamKhao) {
    const theoBan: Record<string, { khoa: string; r: KetQuaCham }[]> = {};
    const viec = [
      ...banTen.flatMap((t) => ban[t].map((b) => ({ nhom: t, khoa: b.khoa, luanGiai: b.luanGiai }))),
      ...caiLoi.map((c) => ({ nhom: 'caiLoi', khoa: c.khoa, luanGiai: c.luanGiai })),
      ...ban.A.slice(0, 20).map((b) => ({ nhom: 'chamLai', khoa: b.khoa, luanGiai: b.luanGiai })),
    ];
    await chayDong(viec, async (v) => {
      const r = await cham(gk, v.khoa, v.luanGiai);
      (theoBan[v.nhom] ??= []).push({ khoa: v.khoa, r });
    });
    // Kiểm giám khảo
    const batLoi = caiLoi.filter((c) => theoBan.caiLoi?.find((x) => x.khoa === c.khoa)?.r.diem[c.diemId] === 'sai').length;
    let trung = 0, tongDiem = 0;
    for (const x of theoBan.chamLai ?? []) {
      const lan1 = theoBan.A?.find((y) => y.khoa === x.khoa)?.r;
      if (!lan1 || lan1.hong || x.r.hong) continue;
      for (const id of Object.keys(lan1.diem)) {
        tongDiem++;
        if (lan1.diem[id] === x.r.diem[id]) trung++;
      }
    }
    const nhatQuan = tongDiem ? Math.round((1000 * trung) / tongDiem) / 10 : 0;
    const hopLe = batLoi >= Math.ceil((10 / 12) * caiLoi.length) && nhatQuan >= 80;
    const tong: Record<string, { KT: number; loiMoiBai: number; sai: number; viPham: number; saiKhac: number; bai: number; batBuocDat: number }> = {};
    for (const t of banTen) {
      const ds = (theoBan[t] ?? []).filter((x) => !x.r.hong && dapAn[x.khoa]);
      const kt = ds.reduce((s, x) => s + diemKT(x.khoa, x.r), 0) / (ds.length || 1);
      const sai = ds.reduce((s, x) => s + Object.values(x.r.diem).filter((v) => v === 'sai').length, 0);
      const viPham = ds.reduce((s, x) => s + x.r.viPham, 0);
      const saiKhac = ds.reduce((s, x) => s + x.r.saiKhac, 0);
      const bb = ds.flatMap((x) => dapAn[x.khoa].diem.filter((d) => d.muc === 'bat-buoc').map((d) => x.r.diem[d.id] === 'dat'));
      tong[t] = {
        KT: Math.round(1000 * kt) / 10,
        loiMoiBai: Math.round((100 * (sai + viPham + saiKhac)) / (ds.length || 1)) / 100,
        sai, viPham, saiKhac, bai: ds.length,
        batBuocDat: Math.round((1000 * bb.filter(Boolean).length) / (bb.length || 1)) / 10,
      };
    }
    const a = tong.A;
    const nguong = Object.fromEntries(
      banTen.filter((t) => t !== 'A').map((t) => [t, { KT_ge_A_cong10: tong[t].KT >= a.KT + 10, loi_le_A: tong[t].loiMoiBai <= a.loiMoiBai, dat: tong[t].KT >= a.KT + 10 && tong[t].loiMoiBai <= a.loiMoiBai }])
    );
    ketQua[gk] = { kiemGiamKhao: { caiLoi: `${batLoi}/${caiLoi.length}`, nhatQuan: `${nhatQuan}%`, hopLe }, ban: tong, nguong };
    console.log(`\n== ${gk}`);
    console.log(JSON.stringify(ketQua[gk], null, 1));
  }
  writeFileSync(join(thuMuc, 'kien-thuc.json'), JSON.stringify({ ketQua, tokens }, null, 1));
  console.log(`Token: vào ${tokens.vao}, ra ${tokens.ra}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
