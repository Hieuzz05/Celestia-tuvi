/**
 * ĐO ĐỘ ĐÚNG LƯỢT 2 — KIEN-TRUC-LUAN-GIAI.md mục 11.6 (có đáp án thật).
 *
 *   npx tsx scripts/do-nhan-dien.ts <thư mục ra của do-thu-vien.ts> [--giam-khao a,b] [--song-song 6] [--chi-bai-luan]
 *
 * --chi-bai-luan (lượt 3, 11.6): không đưa phần "vì sao" — nó nêu thẳng tên sao nên dò tên là
 * ra lá số (lượt 2 chạm trần 100%); bài luận không có tên sao, giám khảo phải nhận qua nội dung.
 *
 * 1. Nhận diện lá số: giám khảo nhận dữ kiện của HAI lá số (lá thật + lá mồi cùng câu),
 *    đoán bài viết cho lá nào. Bài bám đúng lá số thì dễ nhận ra; đoán bừa = 50%.
 * 2. Sao lạ trong phần "vì sao": đếm bằng mã — sao được nêu mà không có trên lá số.
 */
import { readFileSync, writeFileSync } from 'node:fs';
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

type Bai = { khoa: string; id: string; cauHoi: string; luanGiai: string; viSao: string; duKien: { id: string; vaiTro: string; noiDung: string }[] };

async function main() {
  const thuMuc = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!thuMuc) throw new Error('Thiếu thư mục ra của do-thu-vien.ts');
  const giamKhao = thamSo('giam-khao', 'openai|gpt-5.6-luna,openai|gpt-4o-mini').split(',');
  const songSong = Number(thamSo('song-song', '6'));
  const chiBaiLuan = process.argv.includes('--chi-bai-luan');
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { docObjectJson } = await import('../lib/rag/doc-json');
  const { nhanDangThucThe } = await import('../lib/rag/thuc-the');
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { A, B } = JSON.parse(readFileSync(join(thuMuc, 'chi-tiet.json'), 'utf-8')) as { A: Bai[]; B: Bai[] };

  // ---- 2. Sao lạ (tất định) ----
  const la = boLaSo(12).map((l) => lapLaSo(l));
  const saoCuaLa = (khoa: string) => {
    const l = la[Number(khoa.slice(1, 3)) - 1];
    return new Set(l.cungs.flatMap((c) => c.sao.map((s) => s.ten)));
  };
  const saoLa = (ds: Bai[]) => {
    let dem = 0;
    const viDu: string[] = [];
    for (const b of ds) {
      const co = saoCuaLa(b.khoa);
      const neu = [...new Set(nhanDangThucThe(b.viSao).filter((t) => t.loai === 'STAR' || t.loai === 'TRANSFORMATION').map((t) => t.ten))];
      const la = neu.filter((t) => !co.has(t));
      dem += la.length;
      if (la.length && viDu.length < 6) viDu.push(`${b.khoa}: ${la.join(', ')}`);
    }
    return { dem, viDu };
  };
  const saoLaA = saoLa(A), saoLaB = saoLa(B);

  // ---- 1. Nhận diện lá số ----
  const facts = (b: Bai) => b.duKien.map((d) => `${d.id} [${d.vaiTro}] ${d.noiDung}`).join('\n');
  const moiCua = (b: Bai, ds: Bai[]) => {
    const so = Number(b.khoa.slice(1, 3));
    const moi = ((so - 1 + 6) % 12) + 1; // lá cách 6 — cố định, luôn khác lá thật
    return ds.find((x) => x.khoa === `L${String(moi).padStart(2, '0')}-${b.id}`)!;
  };
  const dao = (khoa: string) => [...khoa].reduce((a, c) => a + c.charCodeAt(0), 0) % 2 === 1;
  const system =
    'Bạn là chuyên gia Tử Vi. Có HAI lá số (LÁ 1, LÁ 2) cùng một câu hỏi, và MỘT bài luận kèm phần "vì sao". Bài được viết cho đúng một trong hai lá. Đọc kỹ dữ kiện từng lá (sao, cung, cách cục, độ sáng) và đối chiếu với nội dung bài. Trả JSON {"la":1|2}.';

  const tokens = { vao: 0, ra: 0 };
  const ketQua: Record<string, unknown> = {};
  for (const gk of giamKhao) {
    const viec = [...A.map((b) => ({ nhom: 'A', b, moi: moiCua(b, A) })), ...B.map((b) => ({ nhom: 'B', b, moi: moiCua(b, A) }))];
    const dung: Record<string, number[]> = { A: [], B: [] };
    let k = 0;
    const tho = async () => {
      while (k < viec.length) {
        const { nhom, b, moi } = viec[k++];
        const that = dao(b.khoa + nhom) ? 2 : 1;
        const [la1, la2] = that === 1 ? [facts(b), facts(moi)] : [facts(moi), facts(b)];
        const user = `CÂU HỎI: ${b.cauHoi}\n\nLÁ 1:\n${la1}\n\nLÁ 2:\n${la2}\n\nBÀI LUẬN:\n${b.luanGiai}${chiBaiLuan ? '' : `\n\nPHẦN VÌ SAO:\n${b.viSao}`}`;
        let ra = -1;
        for (let lan = 0; lan < 2 && ra < 0; lan++) {
          try {
            const g = await goiVoiFallback({ system, user, maxTokens: 50, temperature: 0 }, gk, 120_000);
            tokens.vao += g.tokensIn ?? 0;
            tokens.ra += g.tokensOut ?? 0;
            const o = docObjectJson(g.text) as { la?: number } | null;
            if (o?.la === 1 || o?.la === 2) ra = o.la === that ? 1 : 0;
          } catch {
            /* thử lại */
          }
        }
        if (ra >= 0) dung[nhom].push(ra);
      }
    };
    await Promise.all(Array.from({ length: songSong }, tho));
    const ti = (x: number[]) => (x.length ? Math.round((1000 * x.reduce((s, v) => s + v, 0)) / x.length) / 10 : 0);
    const a = ti(dung.A), b = ti(dung.B);
    const chamTran = a >= 97 && b >= 97;
    ketQua[gk] = { nhanDienA: `${a}% (${dung.A.length} bài)`, nhanDienB: `${b}% (${dung.B.length} bài)`, hopLe: a >= 60, chamTran, datB_A_cong5: !chamTran && b >= a + 5 };
    console.log(`== ${gk}: A ${a}% · B ${b}% · hợp lệ ${a >= 60} · chạm trần ${chamTran} · B ≥ A+5: ${!chamTran && b >= a + 5}`);
  }
  const kq = { ketQua, saoLa: { A: saoLaA, B: saoLaB, datB_le_A: saoLaB.dem <= saoLaA.dem }, tokens };
  writeFileSync(join(thuMuc, chiBaiLuan ? 'nhan-dien-chi-bai-luan.json' : 'nhan-dien.json'), JSON.stringify(kq, null, 1));
  console.log(JSON.stringify(kq.saoLa));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
