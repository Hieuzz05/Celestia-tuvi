/**
 * ĐO CHẤT LƯỢNG LUẬN GIẢI v3 theo PHIÊN ĐỌC — npx tsx scripts/do-chat-luong-v3.ts [tuỳ chọn]
 *
 *   --la-so "d m y h nam|nu"      lá số (bắt buộc; KHÔNG commit ngày sinh người thật vào repo)
 *   --nhom tong-quan,tinh-cach,…  thứ tự mở như người đọc (mặc định: tổng quan + 4 chủ đề)
 *   --so-y 0|1                    tắt/bật sổ ý chống lặp giữa các phần (mặc định 1)
 *   --ra <tệp.json>               nơi ghi kết quả (nên để ngoài repo)
 *   --nhan <chữ>                  nhãn lượt chạy, in cùng điểm
 *   --chi TQ04,SN01               TIẾT KIỆM: chỉ sinh lại đúng những câu thay đổi chạm tới
 *   --tu <tệp.json>               TIẾT KIỆM: lấy các câu còn lại từ một lượt đã có (không sinh lại bản mốc)
 *   --khong-cham 1                chỉ đo lặp bằng embedding + RAG, bỏ giám khảo (nhanh)
 *   --cham-lai <tệp.json>         chỉ chấm lại phiên đã có trong tệp (không sinh)
 *   --giam-khao provider|model    giám khảo chất lượng (mặc định gemini; hỏng thì lùi và in cảnh báo)
 *
 * Giả lập đúng thứ tự trang /la-so gọi: tổng quan ba thẻ đầu → bảy câu còn lại →
 * từng chủ đề người đọc mở. Sổ ý giữ trong bộ nhớ (không đụng DB), đúng như
 * route dựng từ bản đã cất.
 *
 * Chấm hai tầng, giám khảo là model KHÁC model viết (ưu tiên gemini):
 *   - Cả phiên: liệt kê các Ý lặp giữa các câu (một ý xuất hiện ở ≥2 câu, không
 *     tính nhắc nửa câu làm dẫn chứng) → số cụm lặp, số lần lặp thừa.
 *   - Từng câu (1–5): tự nhiên như người đang xem lá số, cụ thể/không chung chung,
 *     giá trị cho người đọc, và có điều MỚI so với các câu trước.
 * Tận dụng RAG đếm bằng mã: tỉ lệ ý trong dàn ý có trích E###, số đoạn nguồn được dùng.
 */
import { readFileSync, writeFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

const thamSo = (ten: string, macDinh = '') => {
  const i = process.argv.indexOf(`--${ten}`);
  return i > 0 ? process.argv[i + 1] : macDinh;
};

async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { luanNhieuCau, CAU_HOI_V3 } = await import('../lib/rag/v3');
  const { dungSoY } = await import('../lib/rag/v3/so-y');
  const { goiVoiFallback } = await import('../lib/ai/fallback');
  const { docObjectJson } = await import('../lib/rag/doc-json');

  const [ngay, thang, nam, gio, gt] = thamSo('la-so').split(/\s+/);
  if (!gt) throw new Error('Thiếu --la-so "d m y h nam|nu"');
  const laSo = lapLaSo({ ngay: +ngay, thang: +thang, nam: +nam, gio: +gio, gioiTinh: gt as 'nam' | 'nu' });
  const namXem = 2026;
  const nhomMo = thamSo('nhom', 'tong-quan,tinh-cach,su-nghiep,tien-bac,van-han').split(',');
  const bat = thamSo('so-y', '1') !== '0';
  const ra = thamSo('ra', 'do-chat-luong.json');
  const nhan = thamSo('nhan', bat ? 'so-y' : 'khong-so-y');

  type Cau = { id: string; nhom: string; cauHoi: string; luanGiai: string; viSao?: string; goiY?: string; yChinh: string[]; danY: { y: string; canCu: string[] }[]; soNguon: number; dat: boolean; ms: number; token?: { vao: number; ra: number; dem: number } };
  const phien: Cau[] = [];
  const daSinh = new Set<string>();
  const t0 = Date.now();

  const chay = async (nhom: string, ids: string[]) => {
    const daNoi = bat ? dungSoY([...new Set(phien.map((c) => c.nhom))].map((n) => ({ nhom: n, cau: phien.filter((c) => c.nhom === n) }))) : [];
    const kq = await luanNhieuCau({ laSo, ids, namXem, songSong: ids.length, daNoi });
    for (const k of kq) daSinh.add(k.id);
    for (const k of kq)
      phien.push({
        id: k.id, nhom, cauHoi: k.cauHoi, luanGiai: k.luanGiai, viSao: k.viSao, goiY: k.goiY, yChinh: k.danY.map((y) => y.y), danY: k.danY,
        soNguon: k.nguon.length, dat: k.dat, ms: k.ms, token: k.token,
      });
    console.log(`  ${nhom.padEnd(11)} ${ids.length} câu · ${Math.round((Date.now() - t0) / 1000)}s · đạt ${kq.filter((k) => k.dat).length}/${kq.length}`);
  };

  const chi = thamSo('chi') ? thamSo('chi').split(',') : null;
  const tu = thamSo('tu');
  // --tu: các câu KHÔNG nằm trong --chi lấy nguyên từ lượt cũ — vừa làm ngữ cảnh sổ ý, vừa không tốn lượt gọi
  if (tu) phien.push(...(JSON.parse(readFileSync(tu, 'utf-8')).phien as Cau[]).filter((c) => !chi || !chi.includes(c.id)));
  const loc = (ids: string[]) => (chi ? ids.filter((id) => chi.includes(id)) : ids);
  const chamLai = thamSo('cham-lai');
  if (chamLai) phien.push(...(JSON.parse(readFileSync(chamLai, 'utf-8')).phien as Cau[]));
  for (const nhom of chamLai ? [] : nhomMo) {
    if (nhom === 'tong-quan') {
      // Ba thẻ đầu trang (THE_DAU trong components/luangiai/TongQuanV3.tsx)
      const dau = ['TQ02', 'TQ03', 'TQ08'];
      const a = loc(dau);
      const b = loc(CAU_HOI_V3.filter((q) => q.loai === 'tong-quan' && !dau.includes(q.id)).map((q) => q.id));
      if (a.length) await chay('tong-quan', a);
      if (b.length) await chay('tong-quan', b);
    } else {
      const ids = loc(CAU_HOI_V3.filter((q) => q.loai === 'chuyen-sau' && q.chuDe === nhom).map((q) => q.id));
      if (!ids.length) continue;
      // --hai-dot 1: nửa đầu chạy trước, nửa sau nhận sổ ý của nửa đầu (thử chống lặp giữa các câu cùng chủ đề)
      if (thamSo('hai-dot', '') === '1' && ids.length >= 4) {
        const giua = Math.ceil(ids.length / 2);
        await chay(nhom, ids.slice(0, giua));
        await chay(nhom, ids.slice(giua));
      } else await chay(nhom, ids);
    }
  }

  /* ------------------------------- Token ------------------------------- */
  // Chỉ tính câu SINH trong lượt này — câu lấy lại bằng --tu không tốn gì
  const tk = phien.filter((c) => c.token && daSinh.has(c.id)).reduce((a, c) => ({ vao: a.vao + (c.token?.vao ?? 0), ra: a.ra + (c.token?.ra ?? 0), dem: a.dem + (c.token?.dem ?? 0) }), { vao: 0, ra: 0, dem: 0 });
  console.log(`  token sinh: vào ${tk.vao.toLocaleString('vi')} (đệm ${tk.vao ? Math.round((tk.dem / tk.vao) * 100) : 0}%) · ra ${tk.ra.toLocaleString('vi')}`);

  /* ----------------------------- RAG bằng mã ----------------------------- */
  const yTong = phien.flatMap((c) => c.danY);
  const yCoNguon = yTong.filter((y) => y.canCu.some((m) => /^E\d+/.test(m))).length;
  const nguonDung = new Set(phien.flatMap((c) => c.danY.flatMap((y) => y.canCu.filter((m) => /^E\d+/.test(m)).map((m) => `${c.id}:${m}`)))).size;
  const nguonCo = phien.reduce((a, c) => a + c.soNguon, 0);

  // Ghi bài trước khi chấm: giám khảo hỏng thì vẫn giữ được lượt sinh để chấm lại (--cham-lai)
  if (!chamLai) writeFileSync(ra, JSON.stringify({ phien }, null, 1));

  /*
   * LẶP Ý bằng embedding — khách quan, lặp lại được. Mỗi câu (≥ 8 chữ) của bài
   * thứ j so với mọi câu của các bài ĐỌC TRƯỚC nó (i < j): độ giống lớn nhất.
   * Tỉ lệ câu vượt ngưỡng = phần người đọc gặp lại điều đã đọc.
   */
  const { embedLoTaiLieu } = await import('../lib/ai/embedding');
  const cauCua = phien.map((c) =>
    c.luanGiai
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      // Câu an toàn bắt buộc (tư vấn tài chính, chẩn đoán) lặp là đúng luật — không tính
      .filter((x) => x.split(' ').length >= 8 && !/tư vấn tài chính|chẩn đoán|người có chuyên môn/.test(x))
  );
  const phang = cauCua.flatMap((ds, j) => ds.map((t) => ({ j, t })));
  const vec = (await embedLoTaiLieu(phang.map((x) => x.t))).vectors;
  const cos = (a: number[], b: number[]) => {
    let d = 0, na = 0, nb = 0;
    for (let k = 0; k < a.length; k++) { d += a[k] * b[k]; na += a[k] * a[k]; nb += b[k] * b[k]; }
    return d / Math.sqrt(na * nb);
  };
  const maxTruoc: number[] = [];
  const capLap: { sim: number; a: string; b: string }[] = [];
  phang.forEach((x, i) => {
    if (!vec[i]) return;
    let m = 0, k = -1;
    phang.forEach((y, h) => {
      if (y.j >= x.j || !vec[h]) return;
      const c = cos(vec[i], vec[h]);
      if (c > m) { m = c; k = h; }
    });
    if (x.j > 0) { maxTruoc.push(m); if (k >= 0) capLap.push({ sim: m, a: `${phien[x.j].id}: ${x.t}`, b: `${phien[phang[k].j].id}: ${phang[k].t}` }); }
  });
  const tiLe = (n: number) => (maxTruoc.length ? Math.round((maxTruoc.filter((m) => m >= n).length / maxTruoc.length) * 100) : 0);
  const embLap = { soCau: maxTruoc.length, tren70: tiLe(0.7), tren75: tiLe(0.75), tren80: tiLe(0.8), tb: Math.round((maxTruoc.reduce((a, b) => a + b, 0) / Math.max(1, maxTruoc.length)) * 1000) / 1000 };
  console.log('  lặp (embedding):', JSON.stringify(embLap));

  if (thamSo('khong-cham', '') === '1') {
    console.log(JSON.stringify({ nhan, soCau: phien.length, dat: phien.filter((c) => c.dat).length, embLap, ragTiLeYCoNguon: yTong.length ? Math.round((yCoNguon / yTong.length) * 100) : 0, ragNguonDung: nguonDung }));
    writeFileSync(ra, JSON.stringify({ embLap, capLap: capLap.sort((a, b) => b.sim - a.sim).slice(0, 40), phien }, null, 1));
    return;
  }

  /* ------------------------------ Giám khảo ------------------------------ */
  const bai = phien
    .filter((c) => c.luanGiai)
    .map((c, i) => `#${i + 1} [${c.id} · ${c.cauHoi}]\n${c.luanGiai}`)
    .join('\n\n');
  const system = `Bạn là biên tập viên khó tính chấm bài luận giải tử vi viết cho người đọc phổ thông. Các bài dưới đây là MỘT phiên đọc của cùng một người trên cùng một lá số, đọc lần lượt từ #1 trở đi. Chỉ trả JSON hợp lệ.`;
  // Hai lượt nhỏ thay vì một lượt lớn: một lượt 39 bài + hai việc hay quá giờ và bị lùi sang chính model viết
  // Giám khảo phải KHÁC model viết (model đầu chuỗi fallback). gemini hay 503 lúc đông → mặc định groq
  const uuTienGiamKhao = thamSo('giam-khao', 'gemini|gemini-3.6-flash');
  const modelViet = thamSo('model-viet', 'openai|gpt-5.6-luna');
  const giamKhao = async (viec: string) => {
    for (let lan = 0; lan < 2; lan++) {
      const g = await goiVoiFallback({ system, user: `${bai}

${viec}`, maxTokens: 9000, temperature: 0 }, uuTienGiamKhao, 170_000);
      if (`${g.provider}|${g.model}` !== modelViet || lan === 1) {
        if (`${g.provider}|${g.model}` === modelViet) console.warn('  (CẢNH BÁO: giám khảo = model viết — điểm chất lượng chỉ để tham khảo)');
        return { g, o: docObjectJson(g.text) as Record<string, unknown> | null };
      }
      console.warn(`  (giám khảo lùi sang ${g.provider}/${g.model} — thử lại)`);
    }
    throw new Error('không tới được');
  };
  const [v1, v2] = await Promise.all([
    giamKhao(`VIỆC — Ý LẶP: liệt kê các Ý (không phải chữ) được TRIỂN KHAI ở từ 2 bài trở lên. Nhắc ngắn (nửa câu) để dẫn chứng thì KHÔNG tính; bài chuyên sâu đào sâu hơn một ý tổng quan bằng nguyên nhân/biểu hiện MỚI cũng KHÔNG tính. Mỗi cụm: mô tả ý ngắn + danh sách số bài (#).
JSON: {"lap":[{"y":"…","bai":[1,4,9]}]}`),
    giamKhao(`VIỆC — CHẤM TỪNG BÀI (1–5, 5 là tốt nhất):
 - tuNhien: đọc như một người thật đang xem lá số và nói chuyện với mình, mượt, không khuôn sáo, không giọng máy.
 - cuThe: nhận định cụ thể, nhận ra được trong đời; không chung chung kiểu dán vào ai cũng đúng.
 - giaTri: người đọc biết thêm điều hữu ích / làm được gì sau khi đọc.
 - moi: có điều MỚI so với các bài đọc trước nó (bài #1 luôn 5).
 - nhanXet: một câu chỉ ra điểm yếu nhất của bài (nếu có).
JSON: {"cham":[{"bai":1,"tuNhien":4,"cuThe":4,"giaTri":4,"moi":5,"nhanXet":"…"}]}`),
  ]);
  const g = v1.g;
  const cham = { lap: (v1.o?.lap ?? []) as { y: string; bai: number[] }[], cham: (v2.o?.cham ?? []) as { bai: number; tuNhien: number; cuThe: number; giaTri: number; moi: number; nhanXet?: string }[] };

  const lap = cham?.lap ?? [];
  const dsCham = cham?.cham ?? [];
  const tb = (k: 'tuNhien' | 'cuThe' | 'giaTri' | 'moi') =>
    dsCham.length ? Math.round((dsCham.reduce((a, c) => a + (Number(c[k]) || 0), 0) / dsCham.length) * 100) / 100 : 0;
  const lanLapThua = lap.reduce((a, c) => a + Math.max(0, (c.bai?.length ?? 0) - 1), 0);
  const tomTat = {
    nhan,
    soCau: phien.length,
    dat: phien.filter((c) => c.dat).length,
    giay: Math.round((Date.now() - t0) / 1000),
    giamKhao: `${g.provider}/${g.model}`,
    cumLap: lap.length,
    cumLap3: lap.filter((c) => (c.bai?.length ?? 0) >= 3).length,
    lanLapThua,
    tuNhien: tb('tuNhien'),
    cuThe: tb('cuThe'),
    giaTri: tb('giaTri'),
    moi: tb('moi'),
    ragTiLeYCoNguon: yTong.length ? Math.round((yCoNguon / yTong.length) * 100) : 0,
    ragNguonDung: nguonDung,
    ragNguonCo: nguonCo,
    embLap,
  };
  console.log(JSON.stringify(tomTat, null, 1));
  writeFileSync(ra, JSON.stringify({ tomTat, lap, cham: dsCham, capLap: capLap.sort((a, b) => b.sim - a.sim).slice(0, 40), phien }, null, 1));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
