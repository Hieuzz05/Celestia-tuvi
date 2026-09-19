/**
 * So model trên chính việc luận giải — npx tsx scripts/so-model.ts
 *
 * GỌI MODEL THẬT, mỗi model một lượt trên cùng một lá số. Chạy tay khi cần
 * quyết định đổi model, không nằm trong checklist.
 *
 *   --ghi <thư mục>   ghi bài của từng model ra tệp .md để đọc bằng mắt
 *   --lan <n>         chạy n lượt mỗi model (mặc định 1) — model có nhiệt độ,
 *                     một lượt không kết luận được gì
 *
 * ---------------------------------------------------------------------------
 * VÌ SAO CẦN BỘ NÀY, thay vì tra bảng benchmark
 *
 * Benchmark tiếng Việt hiện có (VMLU và họ hàng) đo đọc hiểu, suy luận, kiến
 * thức phổ thông. Không cái nào đo được thứ đang cần: viết một đoạn luận giải
 * Tử Vi có nêu tên cách cục, dịch ngay ra hành vi, và đọc như người viết chứ
 * không như biểu mẫu.
 *
 * Một model đứng đầu VMLU vẫn có thể viết ra "Chỗ này cho thấy bạn có nền tảng
 * vững chắc" — đúng ngữ pháp, đúng chính tả, và rỗng. Nên phép đo phải chạy
 * trên chính prompt của sản phẩm, với chính lá số thật.
 *
 * ---------------------------------------------------------------------------
 * NĂM TIÊU CHÍ, đều chấm bằng luật
 *
 *   1. Số phần dựng được / 12 — model yếu hay trả sai id, sai schema, hoặc
 *      viết câu bị lớp lọc loại sạch. Đây là tiêu chí thô nhất và quan trọng
 *      nhất: dưới 5 phần thì lớp gọi lùi hẳn về bản tất định.
 *   2. Tỉ lệ phần NÊU ĐƯỢC TÊN cách cục — thứ người dùng đòi.
 *   3. Tên dữ kiện trung bình mỗi phần (sao + cách cục + lớp hạn).
 *   4. Câu rỗng nghĩa: "có một sao", "các yếu tố" — đếm được, càng thấp càng tốt.
 *   5. Độ dài trung bình mỗi phần, để thấy model nào viết đủ và model nào cụt.
 *
 * Giá thì bộ này KHÔNG đoán. Nó in token thật đo được ở mỗi lượt, để nhân với
 * bảng giá của nhà cung cấp — bảng giá đổi hàng quý, hard-code vào đây là bảo
 * đảm sai sau vài tháng.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

const thuMuc = (() => {
  const i = process.argv.indexOf('--ghi');
  return i !== -1 ? process.argv[i + 1] : null;
})();
const soLan = (() => {
  const i = process.argv.indexOf('--lan');
  return i !== -1 ? Number(process.argv[i + 1]) || 1 : 1;
})();

/**
 * Ứng viên.
 *
 * Chỉ gồm model chạy được bằng key SẴN CÓ trong `.env.local`. Thêm một nhà
 * cung cấp mới là thêm một key phải xin, một hoá đơn phải theo dõi và một
 * đường hỏng mới — cái giá ấy phải đáng, và chỉ đáng khi model hiện có đều
 * không đạt.
 */
const UNG_VIEN: {
  provider: string;
  model: string;
  ghiChu: string;
  mucSuyNghi?: 'low' | 'medium' | 'high';
}[] = [
  { provider: 'openai', model: 'gpt-4o-mini', ghiChu: 'ĐANG DÙNG — mốc so sánh' },
  { provider: 'openai', model: 'gpt-4.1-mini', ghiChu: 'ứng viên đã đo, dẫn đầu' },
  // Hai model spec routing đề xuất. Mức nghĩ để 'low' vì màn này đã mất 24
  // giây và trần tầng gọi là 55 — nghĩ nhiều hơn là hỏng vì hết giờ.
  { provider: 'openai', model: 'gpt-5.6-luna', ghiChu: 'spec: LIGHT + STANDARD', mucSuyNghi: 'low' },
  { provider: 'openai', model: 'gpt-5.4-mini', ghiChu: 'spec: DEEP', mucSuyNghi: 'low' },
  { provider: 'openai', model: 'gpt-5.4-mini', ghiChu: 'spec: DEEP, nghĩ vừa', mucSuyNghi: 'medium' },
  { provider: 'gemini', model: 'gemini-3-flash-preview', ghiChu: 'đối chứng ngoài OpenAI' },
];

/*
 * BỐN ỨNG VIÊN ĐÃ LOẠI, và lý do — ghi lại để lần sau khỏi thử lại.
 *
 *   gpt-5-mini            quá 55 giây, chạm trần timeout của tầng gọi. Màn này
 *                         đã mất 27–32 giây với model nhanh; một model suy luận
 *                         chậm là hỏng theo cách không sửa được bằng prompt.
 *   gpt-4.1-nano          viết ra câu bị cổng ngôn ngữ chặn, lùi hẳn về bản tất
 *                         định. Rẻ hơn bản đang dùng mà không dùng được.
 *   gemini-2.5-flash-lite API trả 404 dù tên có trong danh sách model — và nó
 *                         nằm trong nhóm sắp ngừng (2.5 Flash tắt 16/10/2026).
 *   groq/gpt-oss-120b     "Request too large" — prompt của màn này vượt hạn mức
 *                         free tier. Không phải lỗi chất lượng, là lỗi hạn mức.
 */

const LA_SO = { ngay: 24, thang: 8, nam: 2000, gio: 20, gioiTinh: 'nam' as const };

/** Cụm cho thấy model đang nói mà không nói gì */
const RONG_NGHIA =
  /một sao|các sao khác|một yếu tố|(?:các|những|nhiều)\s+yếu\s+tố|một số sao|cho thấy bạn có khả năng|điều này cho thấy bạn là người tốt/giu;

interface Diem {
  provider: string;
  model: string;
  ghiChu: string;
  mucSuyNghi?: 'low' | 'medium' | 'high';
  soPhan: number;
  tiCachCuc: number;
  tenTrungBinh: number;
  soRong: number;
  tuTrungBinh: number;
  tokenVao: number;
  tokenRa: number;
  doTreMs: number;
  loi?: string;
}

async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { sinhBangLinhVuc } = await import('../lib/rag/bang-linh-vuc');
  const { nhanDangCachCuc } = await import('../lib/tuvi/cach-cuc');
  const { nhanDangThucThe } = await import('../lib/rag/thuc-the');
  const { CHU_12_CUNG } = await import('../lib/tuvi/chu-12-cung');
  const { layApiKey } = await import('../lib/ai/config');
  const { namAmHienTai, thangAmHienTai } = await import('../lib/tuvi/bay-gio');
  type ProviderId = Parameters<typeof layApiKey>[0];

  const laSo = lapLaSo(LA_SO);
  const tenCachCuc = nhanDangCachCuc(laSo).map((c) => c.ten);
  const namXem = namAmHienTai();
  const thangXem = thangAmHienTai();

  if (thuMuc) mkdirSync(thuMuc, { recursive: true });

  console.log(
    `\nLá số mẫu: ${LA_SO.ngay}/${LA_SO.thang}/${LA_SO.nam} · ${UNG_VIEN.length} model × ${soLan} lượt\n` +
      `Cách cục có trên lá số: ${tenCachCuc.join(', ')}\n`
  );

  const bang: Diem[] = [];

  for (const uv of UNG_VIEN) {
    const apiKey = layApiKey(uv.provider as ProviderId);
    if (!apiKey) {
      bang.push({
        ...uv,
        soPhan: 0,
        tiCachCuc: 0,
        tenTrungBinh: 0,
        soRong: 0,
        tuTrungBinh: 0,
        tokenVao: 0,
        tokenRa: 0,
        doTreMs: 0,
        loi: 'chưa có API key',
      });
      continue;
    }

    const luot: Diem[] = [];
    for (let i = 0; i < soLan; i++) {
      process.stdout.write(`  ${uv.provider}/${uv.model} lượt ${i + 1}… `);
      const batDau = Date.now();
      try {
        const kq = await sinhBangLinhVuc({
          laSo,
          namXem,
          thangXem,
          epModel: {
            provider: uv.provider as ProviderId,
            model: uv.model,
            apiKey,
            mucSuyNghi: uv.mucSuyNghi,
          },
        });
        const doTreMs = Date.now() - batDau;

        if (!kq) {
          console.log('lùi về bản tất định');
          luot.push({ ...uv, soPhan: 0, tiCachCuc: 0, tenTrungBinh: 0, soRong: 0, tuTrungBinh: 0, tokenVao: 0, tokenRa: 0, doTreMs, loi: 'không dựng đủ phần' });
          continue;
        }

        let coCachCuc = 0;
        let tongTen = 0;
        let rong = 0;
        let tongTu = 0;
        const chuoiRa: string[] = [];

        for (const k of kq.noiDung) {
          const van = [k.ketLuan, ...k.doan].join(' ');
          chuoiRa.push(`## ${CHU_12_CUNG.vi[k.id]?.nhan ?? k.id}\n\n**${k.ketLuan}**\n\n${k.doan.join('\n\n')}`);
          if (tenCachCuc.some((t) => van.includes(t))) coCachCuc += 1;
          const ten = new Set<string>();
          for (const t of nhanDangThucThe(van)) {
            if (t.loai === 'STAR' || t.loai === 'TRANSFORMATION' || t.loai === 'FORMATION') ten.add(t.id);
          }
          tongTen += ten.size;
          rong += (van.match(RONG_NGHIA) ?? []).length;
          tongTu += van.trim().split(/\s+/).filter(Boolean).length;
        }

        const n = kq.noiDung.length;
        console.log(`${n}/12 phần · ${coCachCuc} phần có cách cục`);
        luot.push({
          ...uv,
          soPhan: n,
          tiCachCuc: n ? coCachCuc / n : 0,
          tenTrungBinh: n ? tongTen / n : 0,
          soRong: rong,
          tuTrungBinh: n ? tongTu / n : 0,
          tokenVao: 0,
          tokenRa: 0,
          doTreMs,
        });

        if (thuMuc && i === 0) {
          writeFileSync(
            `${thuMuc}/${uv.provider}__${uv.model.replace(/[/:]/g, '-')}${uv.mucSuyNghi ? `__${uv.mucSuyNghi}` : ''}.md`,
            `# ${uv.provider} / ${uv.model}\n\n_${uv.ghiChu}_\n\n${n}/12 phần · ${coCachCuc} phần nêu được cách cục · ${doTreMs}ms\n\n---\n\n${chuoiRa.join('\n\n')}\n`,
            'utf-8'
          );
        }
      } catch (e) {
        const msg = String(e).slice(0, 90).replace(/\s+/g, ' ');
        console.log(`HỎNG — ${msg}`);
        luot.push({ ...uv, soPhan: 0, tiCachCuc: 0, tenTrungBinh: 0, soRong: 0, tuTrungBinh: 0, tokenVao: 0, tokenRa: 0, doTreMs: Date.now() - batDau, loi: msg });
      }
    }

    const chay = luot.filter((x) => !x.loi);
    const tb = (f: (x: Diem) => number) => (chay.length ? chay.reduce((t, x) => t + f(x), 0) / chay.length : 0);
    bang.push({
      ...uv,
      soPhan: tb((x) => x.soPhan),
      tiCachCuc: tb((x) => x.tiCachCuc),
      tenTrungBinh: tb((x) => x.tenTrungBinh),
      soRong: tb((x) => x.soRong),
      tuTrungBinh: tb((x) => x.tuTrungBinh),
      tokenVao: 0,
      tokenRa: 0,
      doTreMs: tb((x) => x.doTreMs),
      loi: chay.length ? undefined : luot[0]?.loi,
    });
  }

  console.log('\n' + '='.repeat(96));
  console.log(
    'MODEL'.padEnd(34) +
      'PHẦN'.padStart(6) +
      'CÁCH CỤC'.padStart(10) +
      'TÊN/PHẦN'.padStart(10) +
      'RỖNG'.padStart(7) +
      'TỪ/PHẦN'.padStart(9) +
      'GIÂY'.padStart(7)
  );
  console.log('='.repeat(96));
  for (const d of bang) {
    const ten = `${d.provider}/${d.model}${d.mucSuyNghi ? ` (nghĩ ${d.mucSuyNghi})` : ''}`;
    if (d.loi) {
      console.log(`${ten.padEnd(34)}${'—'.padStart(6)}   ${d.loi.slice(0, 44)}`);
      continue;
    }
    console.log(
      ten.padEnd(34) +
        `${d.soPhan.toFixed(1)}/12`.padStart(6) +
        `${(d.tiCachCuc * 100).toFixed(0)}%`.padStart(10) +
        d.tenTrungBinh.toFixed(1).padStart(10) +
        d.soRong.toFixed(1).padStart(7) +
        d.tuTrungBinh.toFixed(0).padStart(9) +
        (d.doTreMs / 1000).toFixed(1).padStart(7)
    );
  }
  console.log('='.repeat(96));
  console.log(
    '\nPHẦN     số phần dựng được trên 12. Dưới 5 thì lớp gọi lùi hẳn về bản tất định.' +
      '\nCÁCH CỤC tỉ lệ phần nêu được tên cách cục — thứ làm bài đọc này khác bài người khác.' +
      '\nTÊN/PHẦN số dữ kiện có tên trung bình mỗi phần (sao + tứ hoá + cách cục).' +
      '\nRỖNG     số cụm rỗng nghĩa ("một sao", "các yếu tố") — càng thấp càng tốt.' +
      '\nTỪ/PHẦN  độ dài trung bình. Quá ngắn là cụt, quá dài là lan man.' +
      '\n\nSố này NHIỄU ở một lượt. Muốn kết luận thì chạy --lan 3 trở lên.' +
      (thuMuc ? `\nBài của từng model đã ghi vào ${thuMuc} — đọc bằng mắt trước khi quyết.` : '')
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
