/**
 * ĐO ĐỘ ĐÚNG — KIEN-TRUC-LUAN-GIAI.md mục 11.5.
 *
 *   npx tsx scripts/do-do-dung.ts <thư mục ra của do-thu-vien.ts> [--giam-khao a,b] [--song-song 6]
 *
 * Đọc chi-tiet.json (bản A, B của scripts/do-thu-vien.ts), dựng GÓI BẰNG CHỨNG CHUNG cho
 * mỗi cặp (lá số, câu), cho từng giám khảo chấm TỪNG BÀI riêng (không biết bản nào), rồi
 * so theo ngưỡng 11.5. Trước khi tin số của một giám khảo, kiểm nó bằng bài cài lỗi và
 * bài lệch lá.
 *
 * Gói bằng chứng có văn sách: kết quả chi tiết ghi vào thư mục ra (NGOÀI repo).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { batDauLuotThu } from './thu-chung';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const i = d.indexOf('=');
  if (i < 1 || d.trim().startsWith('#')) continue;
  const k = d.slice(0, i).trim();
  const v = d.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  if (v && !process.env[k]) process.env[k] = v;
}
batDauLuotThu('do-do-dung');
const thamSo = (ten: string, macDinh = '') => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 ? process.argv[i + 1] : macDinh;
};

type DuKien = { id: string; vaiTro: string; noiDung: string; sao: string[] };
type Nguon = { chunkId: string; noiDung: string };
type Bai = {
  khoa: string; id: string; cauHoi: string; luanGiai: string; viSao: string;
  duKien: DuKien[]; nguon: Nguon[]; thuVien?: { daChon: { id: string }[] };
};
const LOAI = ['co-can-cu', 'mau-thuan', 'chung-chung', 'khong-kiem-duoc'] as const;
type Loai = (typeof LOAI)[number];
type Cham = { loai: Record<Loai, number>; tong: number; viSaoSai: number; hong: boolean };

const CHINH_TINH = ['Tử Vi', 'Thiên Cơ', 'Thái Dương', 'Vũ Khúc', 'Thiên Đồng', 'Liêm Trinh', 'Thiên Phủ', 'Thái Âm', 'Tham Lang', 'Cự Môn', 'Thiên Tướng', 'Thiên Lương', 'Thất Sát', 'Phá Quân'];

async function main() {
  const thuMuc = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!thuMuc) throw new Error('Thiếu thư mục ra của do-thu-vien.ts');
  const giamKhao = thamSo('giam-khao', 'openai|gpt-5.6-luna,openai|gpt-4o-mini').split(',');
  const songSong = Number(thamSo('song-song', '6'));
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { docObjectJson } = await import('../lib/rag/doc-json');
  const { docThuVien } = await import('../lib/rag/thu-vien/kho');

  const { A, B } = JSON.parse(readFileSync(join(thuMuc, 'chi-tiet.json'), 'utf-8')) as { A: Bai[]; B: Bai[] };
  const thuVien = new Map((await docThuVien('su-nghiep')).map((m) => [m.id, m]));

  // ---- Gói bằng chứng CHUNG theo (lá, câu) ----
  const goi = new Map<string, { duKien: string; nguon: string; tenTrenLa: Set<string> }>();
  for (const a of A) {
    const b = B.find((x) => x.khoa === a.khoa)!;
    const doan = new Map<string, string>();
    for (const n of [...a.nguon, ...b.nguon]) doan.set(n.chunkId, n.noiDung);
    for (const t of b.thuVien?.daChon ?? []) for (const c of thuVien.get(t.id)?.canCu ?? []) if (!doan.has(c.chunkId)) doan.set(c.chunkId, c.trich);
    // Xáo thứ tự cố định để vị trí trong gói không lộ bản nào dùng đoạn nào
    const ds = [...doan.entries()].sort((x, y) => x[0].localeCompare(y[0])).map(([, v], i) => `N${String(i + 1).padStart(2, '0')}: ${v}`);
    goi.set(a.khoa, {
      duKien: a.duKien.map((d) => `${d.id} [${d.vaiTro}] ${d.noiDung}`).join('\n'),
      nguon: ds.join('\n\n'),
      tenTrenLa: new Set(a.duKien.flatMap((d) => [...d.sao, ...CHINH_TINH.filter((c) => d.noiDung.includes(c))])),
    });
  }

  const system = `Bạn là chuyên gia Tử Vi, kiểm ĐỘ ĐÚNG của MỘT bài luận giải so với GÓI BẰNG CHỨNG. Không chấm văn hay dở, không chấm độ dài.

1. Tách 5–10 NHẬN ĐỊNH chính trong BÀI LUẬN (khẳng định về con người / sự nghiệp của người này). Bỏ câu minh hoạ tình huống không mang khẳng định mới.
2. Mỗi nhận định vào đúng một loại:
   - "co-can-cu": dữ kiện lá số (F###) và/hoặc đoạn nguồn (N##) ủng hộ, đúng cấu hình của lá số này. Nghĩa chung của một sao có trong dữ kiện (phần nét chung / nghĩa ghi trong dữ kiện) cũng tính là căn cứ. Phải ghi mã căn cứ.
   - "mau-thuan": trái với dữ kiện, hoặc trái với đoạn nguồn nói về ĐÚNG cấu hình ấy (vd. nguồn nói sao này ở cung này là trở ngại mà bài nói là thuận lợi).
   - "chung-chung": đúng với gần như ai, không gắn gì riêng của lá số.
   - "khong-kiem-duoc": không có gì trong gói ủng hộ hay phản bác.
3. PHẦN VÌ SAO: liệt kê mọi tên sao / cung được nêu SAI so với dữ kiện (sao không có trên lá số, hoặc nói sao ở một cung mà dữ kiện cho thấy không phải).

Khắt khe và nhất quán. Chỉ trả JSON: {"nhanDinh":[{"y":"tóm tắt ngắn","loai":"co-can-cu|mau-thuan|chung-chung|khong-kiem-duoc","canCu":["F003","N02"]}],"viSaoSai":[{"ten":"...","lyDo":"..."}]}`;

  const tokens = { vao: 0, ra: 0 };
  const cham = async (gk: string, bai: { luanGiai: string; viSao: string; cauHoi: string }, khoaGoi: string): Promise<Cham> => {
    const g = goi.get(khoaGoi)!;
    const user = `CÂU HỎI: ${bai.cauHoi}\n\nDỮ KIỆN LÁ SỐ:\n${g.duKien}\n\nĐOẠN NGUỒN:\n${g.nguon}\n\nBÀI LUẬN:\n${bai.luanGiai}\n\nPHẦN VÌ SAO:\n${bai.viSao}`;
    for (let lan = 0; lan < 2; lan++) {
      try {
        const kq = await goiVoiFallback({ system, user, maxTokens: 2500, temperature: 0 }, gk, 150_000);
        tokens.vao += kq.tokensIn ?? 0;
        tokens.ra += kq.tokensOut ?? 0;
        const o = docObjectJson(kq.text) as { nhanDinh?: { loai?: string }[]; viSaoSai?: unknown[] } | null;
        if (!o?.nhanDinh?.length) continue;
        const loai = Object.fromEntries(LOAI.map((l) => [l, 0])) as Record<Loai, number>;
        for (const n of o.nhanDinh) if ((LOAI as readonly string[]).includes(String(n.loai))) loai[n.loai as Loai]++;
        return { loai, tong: LOAI.reduce((s, l) => s + loai[l], 0), viSaoSai: Array.isArray(o.viSaoSai) ? o.viSaoSai.length : 0, hong: false };
      } catch {
        /* thử lại một lần */
      }
    }
    return { loai: { 'co-can-cu': 0, 'mau-thuan': 0, 'chung-chung': 0, 'khong-kiem-duoc': 0 }, tong: 0, viSaoSai: 0, hong: true };
  };

  // ---- Bài cài lỗi và bài lệch lá (kiểm giám khảo) ----
  const tatCa = [...A, ...B];
  const caiLoi: { bai: Bai; khoa: string }[] = [];
  for (let i = 0; caiLoi.length < 12 && i < tatCa.length; i += 7) {
    const b = tatCa[i];
    const g = goi.get(b.khoa)!;
    const coTrong = CHINH_TINH.find((c) => b.viSao.includes(c) && g.tenTrenLa.has(c));
    const khong = CHINH_TINH.find((c) => !g.tenTrenLa.has(c) && !b.viSao.includes(c));
    if (coTrong && khong) caiLoi.push({ bai: { ...b, viSao: b.viSao.replace(coTrong, khong) }, khoa: b.khoa });
  }
  const lechLa: { bai: Bai; khoa: string }[] = [];
  for (let i = 0; lechLa.length < 12 && i < A.length; i += 5) {
    const b = A[i];
    const lai = A.find((x) => x.id === b.id && x.khoa !== b.khoa && x.khoa.slice(0, 3) !== b.khoa.slice(0, 3));
    if (lai) lechLa.push({ bai: b, khoa: lai.khoa });
  }

  const tongHop = (ds: Cham[]) => {
    const t = ds.filter((c) => !c.hong);
    const n = t.reduce((s, c) => s + c.tong, 0) || 1;
    const ti = (l: Loai) => Math.round((1000 * t.reduce((s, c) => s + c.loai[l], 0)) / n) / 10;
    return { bai: t.length, hong: ds.length - t.length, nhanDinh: n, coCanCu: ti('co-can-cu'), mauThuan: ti('mau-thuan'), chungChung: ti('chung-chung'), khongKiemDuoc: ti('khong-kiem-duoc'), viSaoSai: t.reduce((s, c) => s + c.viSaoSai, 0) };
  };

  const ketQua: Record<string, unknown> = {};
  for (const gk of giamKhao) {
    const viec: { nhom: string; bai: Bai; khoa: string }[] = [
      ...A.map((b) => ({ nhom: 'A', bai: b, khoa: b.khoa })),
      ...B.map((b) => ({ nhom: 'B', bai: b, khoa: b.khoa })),
      ...caiLoi.map((x) => ({ nhom: 'caiLoi', ...x })),
      ...lechLa.map((x) => ({ nhom: 'lechLa', ...x })),
    ];
    const ra = new Map<string, (Cham & { khoa: string })[]>();
    let k = 0;
    const tho = async () => {
      while (k < viec.length) {
        const v = viec[k++];
        const c = await cham(gk, v.bai, v.khoa);
        ra.set(v.nhom, [...(ra.get(v.nhom) ?? []), { ...c, khoa: v.bai.khoa }]);
      }
    };
    await Promise.all(Array.from({ length: songSong }, tho));

    const a = tongHop(ra.get('A') ?? []), b = tongHop(ra.get('B') ?? []);
    const cl = ra.get('caiLoi') ?? [], ll = tongHop(ra.get('lechLa') ?? []);
    // Bài thật tương ứng với bài lệch lá: chính các bài A ấy, chấm với gói ĐÚNG lá
    const thatCuaLech = tongHop((ra.get('A') ?? []).filter((c) => lechLa.some((x) => x.bai.khoa === c.khoa)));
    const batLoi = cl.filter((c) => !c.hong && c.viSaoSai > 0).length;
    const hopLe = batLoi >= Math.ceil((10 / 12) * cl.length) && thatCuaLech.coCanCu - ll.coCanCu >= 15;
    const dat = {
      '1_mauThuan_B<=A': b.mauThuan <= a.mauThuan,
      '2_coCanCu_B>=A+10': b.coCanCu >= a.coCanCu + 10,
      '3_chungChung_B<=A+3': b.chungChung <= a.chungChung + 3,
      '4_viSaoSai_B<=A': b.viSaoSai <= a.viSaoSai,
    };
    ketQua[gk] = {
      kiemGiamKhao: { caiLoi: `${batLoi}/${cl.length}`, coCanCuBaiThat: thatCuaLech.coCanCu, coCanCuLechLa: ll.coCanCu, hopLe },
      A: a, B: b, dat, datHet: Object.values(dat).every(Boolean),
    };
    console.log(`\n== ${gk}`);
    console.log(JSON.stringify(ketQua[gk], null, 1));
  }
  writeFileSync(join(thuMuc, 'do-dung.json'), JSON.stringify({ ketQua, tokens }, null, 1));
  console.log(`\nToken chấm: vào ${tokens.vao}, ra ${tokens.ra}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
