/**
 * THỬ NGHIỆM ĐỘ RÕ — so ba cách viết trên CÙNG lá số, CÙNG câu hỏi, chấm MÙ.
 *
 *   npx tsx scripts/thu-nghiem-do-ro.ts --ra <tệp.json> --la-so "d m y h gt" [--la-so "..."] [--ids TQ02,TQ03,...]
 *
 *   A — prompt hiện tại (sản phẩm)
 *   B — "thẳng thắn, có căn cứ": cân hai mặt ở mức cả bài; thứ bậc cung (engine) đưa
 *       vào mọi câu; ví dụ "kinh doanh" sửa thành rõ mà không tuyệt đối; danh sách
 *       cấm an toàn giữ nguyên
 *   C — như cũ nhưng luận sâu hơn: thêm biểu hiện, tình huống, điều kiện; dài tới 1,5 lần
 *
 * Giám khảo (ưu tiên gemini, khác model viết) thấy dữ kiện lá số, ba bài bị xáo
 * thứ tự và bỏ nhãn. Dữ liệu sinh chỉ đi qua tham số dòng lệnh. GỌI MODEL THẬT.
 */
import { readFileSync, writeFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v && !process.env[k.trim()]) process.env[k.trim()] = v;
}

const thamSo = (ten: string) => process.argv.flatMap((a, i) => (a === ten ? [process.argv[i + 1]] : []));

const NHUONG = /\b(nhưng|tuy nhiên|tuy vậy|song|mặt khác|đôi lúc|đôi khi|có lúc|dù vậy)\b/iu;
const THU_BAC = /(mạnh nhất|yếu nhất|nổi bật nhất|đáng để ý nhất|lớn nhất|quan trọng nhất|chỗ yếu|thế mạnh|điểm yếu|không phải thế mạnh)/iu;

async function main() {
  const ra = thamSo('--ra')[0];
  const laSoDs = thamSo('--la-so');
  if (!ra || !laSoDs.length) throw new Error('Thiếu --ra hoặc --la-so');
  const ids = (thamSo('--ids')[0] ?? 'TQ02,TQ03,TQ06,SN03,TB02,TD04').split(',');
  const CHON = (thamSo('--bien')[0] ?? 'A,B,C').split(',') as ('A' | 'B' | 'C' | 'D')[];

  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { luanNhieuCau } = await import('../lib/rag/v3');
  const { SYSTEM_V3 } = await import('../lib/rag/v3/prompt-v3');
  const { diemTungCung } = await import('../lib/rag/v3/du-kien');
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { docObjectJson } = await import('../lib/rag/doc-json');

  // ---------- Biến thể B ----------
  const thay = (s: string, a: string, b: string) => {
    if (!s.includes(a)) throw new Error(`Không thấy đoạn cần thay: ${a.slice(0, 60)}`);
    return s.replace(a, b);
  };
  let sysB = SYSTEM_V3;
  sysB = thay(
    sysB,
    'Thay vì "Bạn không hợp kinh doanh." nên viết "Bạn không phải kiểu người cần vội vàng kinh doanh từ sớm."',
    'Thay vì "Bạn tuyệt đối không được kinh doanh." nên viết "Kinh doanh không phải thế mạnh của bạn; nếu làm thì nên có một cộng sự giữ tiền." — rõ ràng, nhưng không tuyệt đối.'
  );
  sysB = thay(
    sysB,
    '6. Cân cả hai mặt: điểm thuận và điểm cần lưu ý đều phải có căn cứ.',
    '6. Cân hai mặt ở mức CẢ BÀI, không trong từng câu. Đoạn nói chỗ mạnh thì nói rõ là mạnh; đoạn nói chỗ yếu thì nói rõ là yếu, kèm việc cụ thể để tránh — không bắt một câu khen bù ngay sau. Không dùng khuôn "đây là điểm giúp bạn…, nhưng đôi lúc cũng khiến bạn…" cho mọi đặc điểm. Cả hai mặt vẫn phải có căn cứ.'
  );
  sysB = thay(sysB, 'chỉ giữ xu hướng ở mức ôn hòa', 'nói xu hướng rõ ràng nhưng không cực đoan');
  sysB += `

THỨ BẬC — dùng khối "THỨ BẬC LÁ SỐ" trong phần dữ kiện. Khi câu hỏi chạm tới, nói thẳng phần nào là thế mạnh nhất, phần nào là chỗ phải để ý nhất của lá số NÀY, như một người luận giàu kinh nghiệm vẫn nói ("chỗ yếu nhất lá số của bạn là chuyện tiền"). Rõ ràng nhưng KHÔNG phán số mệnh: không "sẽ nghèo", "sẽ ly hôn", "tuyệt đối", "chắc chắn"; danh sách cấm ở phần An toàn giữ nguyên.`;

  const thuBac = (laSo: ReturnType<typeof lapLaSo>) => {
    const ds = diemTungCung(laSo);
    const nhom = (m: string) =>
      ds.filter((d) => d.muc === m).sort((a, b) => b.diem - a.diem).map((d) => d.linhVuc).join(', ');
    return `THỨ BẬC LÁ SỐ (engine chấm 12 mặt đời theo luật, xếp từ mạnh tới yếu trong CHÍNH lá số này): Mạnh nhất: ${nhom('Mạnh')}. Bình: ${nhom('Bình')}. Cần gắng nhất: ${nhom('Cần gắng')}.`;
  };

  const SAU =
    'LUẬN SÂU HƠN: mỗi ý thêm biểu hiện cụ thể trong đời, một tình huống người đọc nhận ra được, và điều kiện khi nào nó mạnh lên hay yếu đi. Được phép dài tới khoảng 1,5 lần mức độ dài nêu ở trên. Giữ nguyên mọi quy tắc khác.';

  const BIEN_THE = {
    A: {},
    B: { system: sysB, themVao: (laSo: ReturnType<typeof lapLaSo>) => thuBac(laSo) },
    C: {
      heSoDoDai: 1.5,
      themVao: () => SAU,
    },
    D: {
      heSoDoDai: 1.5,
      system: sysB,
      themVao: (laSo: ReturnType<typeof lapLaSo>) => `${thuBac(laSo)}

${SAU}`,
    },
  } as const;

  const ketQua: Record<string, unknown>[] = [];
  for (const chuoi of laSoDs) {
    const [ng, th, na, gi, gt] = chuoi.split(' ');
    const laSo = lapLaSo({ ngay: +ng, thang: +th, nam: +na, gio: +gi, gioiTinh: gt as 'nam' | 'nu' });
    const theoBien: Record<string, Awaited<ReturnType<typeof luanNhieuCau>>> = {};
    await Promise.all(
      CHON.map(async (b) => {
        theoBien[b] = await luanNhieuCau({ laSo, ids, namXem: 2026, songSong: 3, thuNghiem: BIEN_THE[b] as never });
        console.log(`xong ${chuoi.split(' ').slice(3).join(' ')}… biến thể ${b}`);
      })
    );

    for (const id of ids) {
      const bai = (b: string) => theoBien[b].find((k) => k.id === id)!;
      const thuTu = CHON.slice().sort(() => Math.random() - 0.5);
      const nhanMu = ['X', 'Y', 'Z', 'W'].slice(0, CHON.length);
      const dk = bai('A').duKien.map((d) => `${d.id} [${d.vaiTro}] ${d.noiDung}`).join('\n');
      const system = `Bạn là giám khảo khó tính đánh giá bài luận giải Tử Vi cho người đọc phổ thông. Chấm MÙ các bài cùng trả lời một câu hỏi trên cùng một lá số. Trả về DUY NHẤT JSON.`;
      const user = `CÂU HỎI: ${bai('A').cauHoi}

DỮ KIỆN LÁ SỐ (đúng, do engine tính):
${dk.slice(0, 6000)}

${thuTu.map((b, i) => `=== BÀI ${nhanMu[i]} ===\n${bai(b).luanGiai}`).join('\n\n')}

Chấm từng bài 1–5:
- roRang: nói thẳng điều gì mạnh, điều gì yếu, có thứ bậc; đọc xong biết mình nên làm gì, tránh gì. (1 = vòng vo, khen chê bù trừ, không rút ra được gì)
- cuThe: có tình huống, biểu hiện, điều kiện cụ thể nhận ra được trong đời.
- bamCanCu: nhận định đi ra từ dữ kiện trên, không suy diễn quá đà.
- viPham: 1 nếu bài phán số mệnh (sẽ nghèo, sẽ ly hôn, tuyệt đối, chắc chắn sẽ, nói bệnh/thọ yểu), 0 nếu không.
Rồi xếp hạng: nếu bạn là người đọc muốn hiểu mình và biết nên làm gì, bài nào hữu ích nhất → kém nhất.
KHÔNG cho điểm cao hơn chỉ vì bài dài hơn hay kể nhiều mốc hơn — chấm chất lượng từng câu: rõ, đúng, dùng được.
JSON: {${nhanMu.map((n) => `"${n}":{"roRang":n,"cuThe":n,"bamCanCu":n,"viPham":0}`).join(',')},"xepHang":[${nhanMu.map((n) => `"${n}"`).join(',')}],"lyDo":"1-2 câu"}`;
      let cham: Record<string, unknown> | null = null;
      try {
        const g = await goiVoiFallback({ system, user, maxTokens: 6000, temperature: 0 }, 'gemini|gemini-3.6-flash');
        cham = docObjectJson(g.text) as Record<string, unknown> | null;
        if (cham) cham.giamKhao = `${g.provider}/${g.model}`;
      } catch (e) {
        cham = { loi: (e as Error).message.slice(0, 200) };
      }
      const giaiMa: Record<string, unknown> = {};
      if (cham && !cham.loi) {
        thuTu.forEach((b, i) => (giaiMa[b] = cham![nhanMu[i]]));
        giaiMa.xepHang = ((cham.xepHang as string[]) ?? []).map((x) => thuTu[nhanMu.indexOf(x)]);
        giaiMa.lyDo = cham.lyDo;
        giaiMa.giamKhao = cham.giamKhao;
      }
      const soDo = (b: string) => {
        const t = bai(b).luanGiai;
        const cau = t.split(/(?<=[.!?])\s+/).filter((x) => x.split(/\s+/).length >= 4);
        return {
          tu: t.split(/\s+/).length,
          nhuong: cau.length ? Math.round((cau.filter((c) => NHUONG.test(c)).length / cau.length) * 100) : 0,
          thuBac: THU_BAC.test(t),
          dat: bai(b).dat,
        };
      };
      ketQua.push({
        laSo: chuoi.split(' ').slice(3).join(' '),
        id,
        cauHoi: bai('A').cauHoi,
        do: Object.fromEntries(CHON.map((b) => [b, soDo(b)])),
        cham: giaiMa,
        bai: Object.fromEntries(CHON.map((b) => [b, bai(b).luanGiai])),
      });
      console.log(id, 'xếp hạng:', (giaiMa.xepHang as string[] | undefined)?.join(' > ') ?? JSON.stringify(cham).slice(0, 120));
    }
  }
  writeFileSync(ra, JSON.stringify(ketQua, null, 1));

  // ---------- Tổng hợp ----------
  const tb = (b: string, k: string) => {
    const v = ketQua.map((x) => ((x.cham as Record<string, Record<string, number>>)[b] ?? {})[k]).filter((n) => typeof n === 'number');
    return v.length ? (v.reduce((a, c) => a + c, 0) / v.length).toFixed(2) : '-';
  };
  const hang = (b: string) => {
    const v = ketQua.map((x) => ((x.cham as { xepHang?: string[] }).xepHang ?? []).indexOf(b)).filter((i) => i >= 0);
    return { nhat: v.filter((i) => i === 0).length, tb: v.length ? (v.reduce((a, c) => a + c + 1, 0) / v.length).toFixed(2) : '-' };
  };
  console.log('\nBiến thể | rõ ràng | cụ thể | bám căn cứ | vi phạm | hạng TB | số lần nhất | nhượng bộ % | có thứ bậc | số từ TB | đạt luật');
  for (const b of CHON) {
    const d = ketQua.map((x) => (x.do as Record<string, { tu: number; nhuong: number; thuBac: boolean; dat: boolean }>)[b]);
    const h = hang(b);
    console.log(
      `${b} | ${tb(b, 'roRang')} | ${tb(b, 'cuThe')} | ${tb(b, 'bamCanCu')} | ${tb(b, 'viPham')} | ${h.tb} | ${h.nhat}/${ketQua.length} | ${Math.round(d.reduce((a, c) => a + c.nhuong, 0) / d.length)} | ${d.filter((c) => c.thuBac).length}/${d.length} | ${Math.round(d.reduce((a, c) => a + c.tu, 0) / d.length)} | ${d.filter((c) => c.dat).length}/${d.length}`
    );
  }
}
main();
