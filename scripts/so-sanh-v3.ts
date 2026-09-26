/**
 * SO SÁNH MÙ TỪNG CẶP hai lượt đo — npx tsx scripts/so-sanh-v3.ts <x.json> <y.json> [tuỳ chọn]
 *
 *   --giam-khao a,b,c   chuỗi giám khảo theo thứ tự RẺ → ĐẮT (mặc định groq → gpt-4o-mini → luna)
 *   --chi TQ04,SN01     chỉ chấm các câu này (câu còn lại không đổi thì không tốn lượt chấm)
 *   --lo 3              số cặp mỗi lượt gọi (groq cần 3 vì giới hạn token/phút)
 *   --du                chấm ĐỦ mọi giám khảo, không dừng sớm — bắt buộc khi đo nghiệm thu
 *                       (KIEN-TRUC-LUAN-GIAI.md 11.2 #4: 3 giám khảo × đủ 60 cặp)
 *
 * Điểm tuyệt đối 1–5 dao động ±0,2 giữa hai lần chấm cùng một bài; so từng cặp
 * nhạy hơn. Nhưng MỘT giám khảo vẫn dao động tới ±30% (đo 25/09/2026: đổi chữ
 * tiêu chí là 69% → 38% trên cùng hai tệp) — nên chấm bằng nhiều giám khảo.
 *
 * TIẾT KIỆM (25/09/2026): giám khảo chạy lần lượt, và DỪNG SỚM khi hai giám khảo
 * đầu cùng chiều rõ ràng (cả hai ≥ 60% hoặc cả hai ≤ 40%) — giám khảo đắt (luna,
 * cũng là model viết) chỉ được gọi khi hai giám khảo rẻ không thống nhất. Giám
 * khảo chỉ trả mã chọn, không viết lý do (phần ra là phần đắt nhất). Cặp nào hai
 * bản trùng nguyên văn (câu lấy lại bằng --tu) thì bỏ, không tốn lượt chấm.
 */
import { readFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

type Cau = { id: string; cauHoi: string; luanGiai: string };

const thamSo = (ten: string, macDinh = '') => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 ? process.argv[i + 1] : macDinh;
};

async function main() {
  const [fx, fy] = process.argv.slice(2).filter((a) => a.endsWith('.json'));
  const chuoi = thamSo('giam-khao', 'groq|openai/gpt-oss-120b,openai|gpt-4o-mini,openai|gpt-5.6-luna').split(',');
  const chi = thamSo('chi') ? thamSo('chi').split(',') : null;
  const lo = Number(thamSo('lo', '3'));
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { docObjectJson } = await import('../lib/rag/doc-json');
  const X: Cau[] = JSON.parse(readFileSync(fx, 'utf-8')).phien;
  const Y: Cau[] = JSON.parse(readFileSync(fy, 'utf-8')).phien;
  const cap = X.map((x) => ({ x, y: Y.find((y) => y.id === x.id) })).filter(
    (c): c is { x: Cau; y: Cau } =>
      Boolean(c.y && c.x.luanGiai && c.y.luanGiai && c.x.luanGiai !== c.y.luanGiai && (!chi || chi.includes(c.x.id)))
  );
  // Xáo thứ tự cố định theo id để chạy lại ra cùng một đề
  const daoCho = (id: string) => [...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 2 === 1;

  const system =
    'Bạn là biên tập viên khó tính chấm bài luận giải tử vi cho người đọc phổ thông. Với mỗi câu hỏi có hai bản (1 và 2) viết cho CÙNG một lá số. Chọn bản tốt hơn theo: đọc như một người thật đang ngồi xem lá số của người đọc và nói chuyện với họ (không như bài trắc nghiệm tính cách), mượt; cụ thể, không chung chung; có giá trị (người đọc hiểu thêm về mình). Nếu ngang nhau thật sự thì ghi 0. Chỉ trả JSON.';

  const tongToken = { vao: 0, ra: 0 };
  const chamBoi = async (giamKhao: string) => {
    const kq: { id: string; yThang: number }[] = [];
    let thucTe = '';
    for (let k = 0; k < cap.length; k += lo) {
      const phan = cap.slice(k, k + lo);
      const user =
        phan
          .map((c, j) => {
            const [b1, b2] = daoCho(c.x.id) ? [c.y.luanGiai, c.x.luanGiai] : [c.x.luanGiai, c.y.luanGiai];
            return `### Câu ${j + 1}: ${c.x.cauHoi}\n[Bản 1]\n${b1}\n\n[Bản 2]\n${b2}`;
          })
          .join('\n\n') + `\n\nJSON: {"chon":[{"cau":1,"tot":1|2|0}]}`;
      const g = await goiVoiFallback({ system, user, maxTokens: 400, temperature: 0 }, giamKhao, 150_000);
      tongToken.vao += g.tokensIn ?? 0;
      tongToken.ra += g.tokensOut ?? 0;
      thucTe = `${g.provider}|${g.model}`;
      const o = docObjectJson(g.text) as { chon?: { cau: number; tot: number }[] } | null;
      for (const ch of o?.chon ?? []) {
        const c = phan[ch.cau - 1];
        if (!c) continue;
        kq.push({ id: c.x.id, yThang: ch.tot === 0 ? 0.5 : (ch.tot === 2) !== daoCho(c.x.id) ? 1 : 0 });
      }
    }
    const ti = kq.length ? Math.round((kq.reduce((a, c) => a + c.yThang, 0) / kq.length) * 100) : 50;
    // Tỉ lệ thắng BỎ HOÀ (ngưỡng nghiệm thu 11.2 #4): thắng / (thắng + thua)
    const thang = kq.filter((c) => c.yThang === 1).length;
    const thua = kq.filter((c) => c.yThang === 0).length;
    const tiBoHoa = thang + thua ? Math.round((100 * thang) / (thang + thua)) : 50;
    return { ti, tiBoHoa, thang, thua, hoa: kq.length - thang - thua, n: kq.length, thucTe };
  };

  const du = process.argv.includes('--du');
  const ket: { giamKhao: string; ti: number; tiBoHoa: number; thang: number; thua: number; hoa: number; n: number }[] = [];
  for (const gk of chuoi) {
    const r = await chamBoi(gk);
    // Giám khảo lùi sang model khác (vd. groq hết hạn mức → luna) thì ghi đúng model đã chấm
    ket.push({ giamKhao: r.thucTe || gk, ti: r.ti, tiBoHoa: r.tiBoHoa, thang: r.thang, thua: r.thua, hoa: r.hoa, n: r.n });
    console.log(`  ${(r.thucTe || gk).padEnd(34)} Y thắng ${r.ti}% (${r.n} cặp) · bỏ hoà ${r.tiBoHoa}% (${r.thang}/${r.thua}/${r.hoa})`);
    if (!du && ket.length >= 2) {
      const [a, b] = ket.slice(-2);
      if ((a.ti >= 60 && b.ti >= 60) || (a.ti <= 40 && b.ti <= 40)) {
        console.log('  → hai giám khảo cùng chiều rõ ràng, dừng sớm');
        break;
      }
    }
  }
  const tb = Math.round(ket.reduce((a, c) => a + c.ti, 0) / ket.length);
  const tbBoHoa = Math.round(ket.reduce((a, c) => a + c.tiBoHoa, 0) / ket.length);
  console.log(JSON.stringify({ soCap: cap.length, yThangTrungBinh: tb, yThangBoHoaTrungBinh: tbBoHoa, giamKhao: ket, tokenCham: tongToken }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
