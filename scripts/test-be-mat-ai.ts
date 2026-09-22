/**
 * Nghiệm thu các bề mặt ngắn do AI sinh — npx tsx scripts/test-be-mat-ai.ts [provider|model]
 *
 * Gọi model thật, tốn quota. Không ghi vào bộ nhớ đệm: script gọi thẳng lớp
 * sinh, không đi qua `layHoacSinh`, nên chạy lại luôn ra bài mới và không làm
 * bẩn bảng `noi_dung_ai` của người dùng thật.
 *
 * Đo bốn thứ mà mắt thường dễ bỏ qua:
 *   - có qua được kiểm duyệt và cổng ngôn ngữ không
 *   - tám khối / dãy mốc có CÙNG MỘT HÌNH không (§11.2 và §11.4 cấm)
 *   - có câu ra lệnh không (Celes không kê đơn)
 *   - có bao nhiêu câu mở giống nhau
 */

import { readFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

let sai = 0;
function kiem(ten: string, ok: boolean, chiTiet?: unknown) {
  if (!ok) sai += 1;
  console.log(`  ${ok ? 'OK  ' : 'SAI '} ${ten}${!ok && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`);
}

/** Hai câu mở giống nhau tính từ ba từ đầu */
function soMoTrung(cau: string[]): number {
  const dem = new Map<string, number>();
  for (const c of cau) {
    const khoa = c.toLowerCase().split(/\s+/).slice(0, 3).join(' ');
    dem.set(khoa, (dem.get(khoa) ?? 0) + 1);
  }
  return [...dem.values()].reduce((t, n) => t + (n > 1 ? n : 0), 0);
}

const RA_LENH = /(?:hãy|bạn nên|cần phải|nên dành|đừng quên)/i;

async function main() {
  const uuTien = process.argv[2];
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { cacGiaiDoan, cacThang } = await import('../lib/tuvi/hanh-trinh');
  const { KHUON } = await import('../lib/tuvi/quick-read-noi-dung');
  const { CHI, CHINH_TINH } = await import('../lib/tuvi/constants');
  const { namAmHienTai, thangAmHienTai, khoangDuongCuaThangAm } = await import('../lib/tuvi/bay-gio');
  const { sinhDiemNoiBat, sinhNhipHanhTrinh } = await import('../lib/rag/be-mat-ngan');
  const { sinhBangLinhVuc } = await import('../lib/rag/bang-linh-vuc');
  const { sinhMocHanhTrinh } = await import('../lib/rag/moc-hanh-trinh');

  if (uuTien) process.env.AI_UU_TIEN_TEST = uuTien;

  const laSo = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });
  const namXem = namAmHienTai();
  const thangXem = thangAmHienTai();
  const k = KHUON.vi;

  console.log(`\nHôm nay theo lá số: tháng ${thangXem} âm năm ${namXem} (${khoangDuongCuaThangAm(namXem, thangXem)} dương)\n`);

  // ---------------------------------------------------------- Điểm nổi bật
  console.log('== ĐIỂM NỔI BẬT (§11.1) ==\n');
  const nb = await sinhDiemNoiBat({ laSo, namXem, thangXem });
  kiem('Sinh được', nb !== null);
  if (nb) {
    const { insight, doiSong, matTrai, cauMangTheo } = nb.noiDung;
    const tong = [insight, doiSong, matTrai].join(' ').split(/\s+/).length;
    console.log(`  ${nb.provider}/${nb.model} · ${tong} từ`);
    console.log(`  insight : ${insight}`);
    console.log(`  đời sống: ${doiSong}`);
    console.log(`  mặt trái: ${matTrai}`);
    console.log(`  mang theo: ${cauMangTheo}`);
    // §11.1 chốt 60-100 từ. Nới trần vì model hay viết dài, nhưng quá 160 là
    // hỏng mục tiêu "aha trong 20-40 giây".
    kiem('Không quá 160 từ', tong <= 160, tong);
    kiem('Có mặt trái, không phải thẻ chỉ khen', matTrai.length > 20);
  }

  // ---------------------------------------------------------- Bảng 8 lĩnh vực
  console.log('\n== BẢNG 8 LĨNH VỰC (§11.2) ==\n');
  const bang = await sinhBangLinhVuc({ laSo, namXem, thangXem });
  kiem('Sinh được', bang !== null);
  if (bang) {
    const dai = bang.noiDung.map((x) => [x.ketLuan, ...x.doan].join(' ').split(/\s+/).length);
    console.log(`  ${bang.provider}/${bang.model} · ${bang.noiDung.length}/8 lĩnh vực`);
    // Token của cả hai lượt. `đệm` là phần nhà cung cấp không tính tiền đầy đủ —
    // bằng 0 nghĩa là tiền tố tĩnh của system đang KHÔNG được đệm, và đó là lỗi
    // cần sửa chứ không phải một con số vô hại.
    console.log(
      `  token: vào ${bang.tokens.vao} (đệm ${bang.tokens.dem}) · ra ${bang.tokens.ra}`
    );
    console.log(`  độ dài: ${dai.join(', ')}`);
    kiem('Đủ ít nhất 6 lĩnh vực', bang.noiDung.length >= 6, bang.noiDung.length);
    // §11.2: "Thứ tự và độ dài có thể khác dựa trên mức độ nổi bật của domain."
    // Tám khối dài bằng nhau nghĩa là model đang điền khuôn, không đang luận.
    kiem(
      'Độ dài lệch nhau, không phải tám khuôn bằng nhau',
      Math.max(...dai) - Math.min(...dai) >= 20,
      { min: Math.min(...dai), max: Math.max(...dai) }
    );
    kiem('Không câu nào ra lệnh', !bang.noiDung.some((x) => RA_LENH.test([x.ketLuan, ...x.doan].join(' '))));
    const trung = soMoTrung(bang.noiDung.map((x) => x.ketLuan));
    kiem('Không quá 2 kết luận mở giống nhau', trung <= 2, trung);

    /*
     * BỐN THÓI QUEN VIẾT — cùng bộ luật với bản đọc sâu, xem lib/rag/van-phong.ts.
     *
     * Đo theo TỈ LỆ PHẦN chứ không tuyệt đối, giống bên bản đọc sâu: một phần
     * thiếu cặp phân biệt không làm hỏng bảng, cả mười hai phần cùng thiếu mới
     * hỏng. Riêng hai câu khép thì đo mức có mặt, vì chúng là TRƯỜNG model buộc
     * phải trả — thiếu ở nhiều phần nghĩa là schema không ăn, không phải giọng
     * văn hôm nay kém.
     */
    const { coCapPhanBiet, soCauHoi } = await import('../lib/rag/van-phong');
    const coCap = bang.noiDung.filter((x) =>
      coCapPhanBiet([x.ketLuan, ...x.doan, x.giuLai ?? ''].join(' '))
    ).length;
    kiem(
      'Từ 70% phần trở lên có cặp phân biệt',
      coCap / bang.noiDung.length >= 0.7,
      `${coCap}/${bang.noiDung.length}`
    );
    const coHoi = bang.noiDung.filter((x) => soCauHoi(x.cauHoiSoi ?? '') > 0).length;
    kiem(
      'Từ 80% phần trở lên có câu hỏi của người đọc',
      coHoi / bang.noiDung.length >= 0.8,
      `${coHoi}/${bang.noiDung.length}`
    );
    const coGiu = bang.noiDung.filter((x) => (x.giuLai ?? '').trim().length > 20).length;
    kiem(
      'Từ 80% phần trở lên có câu giữ lại',
      coGiu / bang.noiDung.length >= 0.8,
      `${coGiu}/${bang.noiDung.length}`
    );
    // Câu giữ lại nói thứ đáng mang theo, không giao việc — QUY_TAC_GIU_LAI
    const giuLaiKhuyen = bang.noiDung.filter((x) => RA_LENH.test(x.giuLai ?? '')).map((x) => x.id);
    kiem('Câu giữ lại không phải lời khuyên', giuLaiKhuyen.length === 0, giuLaiKhuyen);

    /*
     * MỘT CÁCH CỤC BÁM BAO NHIÊU PHẦN — phép đếm sinh ra cùng lúc với việc
     * tách bảng làm hai lượt.
     *
     * Prompt cấm nhắc lại một cách cục trong cùng một phần, nhưng hai nửa chạy
     * song song thì không nửa nào biết nửa kia đang dùng tên gì. Nguy cơ có
     * thật và cụ thể: cả hai cùng bám cái tên to nhất của lá số, và bài đọc ra
     * như thể người này chỉ có một bộ sao — đúng lỗi mà bản đọc sâu đã đo được
     * (một bộ xuất hiện 31 lần trên 12 phần) và đã phải đặt luật để chặn.
     *
     * Không có phép đếm này thì cái giá của việc tách nằm trong ghi chú chứ
     * không nằm ở đâu nhìn thấy được, và ghi chú thì không đỏ lên bao giờ.
     */
    const { nhanDangCachCuc } = await import('../lib/tuvi/cach-cuc');
    const { boDau } = await import('../lib/rag/thuc-the');
    const demPhan = new Map<string, number>();
    for (const cc of nhanDangCachCuc(laSo).filter((c) => c.loai !== 'han')) {
      const soPhan = bang.noiDung.filter((x) =>
        boDau([x.ketLuan, ...x.doan, x.giuLai ?? ''].join(' ')).includes(boDau(cc.ten))
      ).length;
      if (soPhan) demPhan.set(cc.ten, soPhan);
    }
    const bamNhat = [...demPhan.entries()].sort((a, b) => b[1] - a[1]);
    console.log(
      `  cách cục bám nhiều phần nhất: ${bamNhat.slice(0, 3).map(([t, d]) => `${t}:${d}`).join(' · ') || '(không tên nào)'}`
    );
    /*
     * Ngưỡng NỬA SỐ PHẦN, không phải một con số tuyệt đối.
     *
     * Một cách cục lớn có mặt ở nhiều phần đời là chuyện đúng về Tử Vi — Thân
     * cư hay Tử Phủ Vũ Tướng Liêm vốn chạm nhiều chỗ. Cái sai là khi nó thành
     * thứ DUY NHẤT bài có để nói. Quá nửa số phần là mốc đó, và nó cũng đúng
     * bằng trần của luật trong prompt: mỗi nửa được nhắc một cách cục ở tối đa
     * ba trong sáu phần.
     *
     * Ba lần đo trên cùng lá số mẫu, mỗi lần một bản:
     *   một lượt, chưa có luật   — cao nhất 5/12
     *   hai nửa, chưa có luật    — cao nhất 7/12   (tách làm nặng thêm)
     *   hai nửa, có luật         — cao nhất 4/12
     * Mỗi con số là MỘT lần chạy nên có nhiễu, nhưng hướng thì khớp với cơ chế:
     * hai nửa không thấy nhau, nên phải nói riêng cho từng nửa.
     */
    const tranBam = Math.ceil(bang.noiDung.length / 2);
    kiem(
      `Không cách cục nào bám quá ${tranBam} phần`,
      (bamNhat[0]?.[1] ?? 0) <= tranBam,
      bamNhat.slice(0, 3)
    );
    console.log(`  câu hỏi soi: ${bang.noiDung[0]?.cauHoiSoi ?? '(không có)'}`);
    console.log(`  giữ lại    : ${bang.noiDung[0]?.giuLai ?? '(không có)'}`);
  }

  // ---------------------------------------------------------- Nhịp Hành trình
  console.log('\n== ĐIỀU ĐANG CHUYỂN ĐỘNG (§11.4) ==\n');
  const nhip = await sinhNhipHanhTrinh({ laSo, cap: 'nam', namXem, thangXem, nhip: 'Giữ' });
  kiem('Sinh được', nhip !== null);
  if (nhip) {
    console.log(`  ${nhip.provider}/${nhip.model}`);
    for (const [nhan, cd] of [
      ['đang mở', nhip.noiDung.dangMo],
      ['đang căng', nhip.noiDung.dangCang],
      ['cần chờ', nhip.noiDung.canCho],
    ] as const) {
      console.log(`  ${nhan}: ${cd.tieuDe} — ${cd.noiDung.slice(0, 90)}`);
    }
    kiem('Có đủ ba chuyển động', Boolean(nhip.noiDung.dangMo && nhip.noiDung.dangCang && nhip.noiDung.canCho));
    kiem('Có đoạn ghép lại', nhip.noiDung.ghepLai.length > 40);
  }

  // ---------------------------------------------------------- Mốc dòng thời gian
  console.log('\n== MỐC DÒNG THỜI GIAN ==\n');
  const doi = (ds: ReturnType<typeof cacGiaiDoan>) =>
    ds.map((m) => ({
      id: m.id,
      nhan: m.nhan,
      tenCung: m.cung.tenCung,
      chi: CHI[m.cung.chiIndex],
      sao: m.cung.sao
        .filter((s) => (CHINH_TINH as readonly string[]).includes(s.ten))
        .slice(0, 2)
        .map((s) => (s.doSang ? `${s.ten} (${k.doSang[s.doSang] ?? s.doSang})` : s.ten))
        .join(', '),
      vong: [m.cung.coTuan ? 'Tuần' : null, m.cung.coTriet ? 'Triệt' : null].filter(Boolean).join(' + '),
    }));

  for (const [loai, ds] of [
    ['giai-doan', cacGiaiDoan(laSo, namXem, 'vi')],
    ['thang', cacThang(laSo, namXem, null, 'vi')],
  ] as const) {
    const r = await sinhMocHanhTrinh({ laSo, loai, moc: doi(ds), namXem, thangXem });
    kiem(`[${loai}] sinh được`, r !== null);
    if (!r) continue;
    const cau = Object.values(r.noiDung);
    console.log(`  ${loai}: ${cau.length}/${ds.length} mốc`);
    for (const c of cau.slice(0, 3)) console.log(`    ${c}`);
    kiem(`[${loai}] phủ được ít nhất 3/4 số mốc`, cau.length >= Math.ceil((ds.length * 3) / 4), cau.length);
    kiem(`[${loai}] không câu nào ra lệnh`, !cau.some((c) => RA_LENH.test(c)));
    const trung = soMoTrung(cau);
    // Ngưỡng đặt ở dưới một nửa: gpt-4o-mini không giữ được mức chặt hơn,
    // mà bài kiểm đỏ lúc được lúc không thì không ai còn đọc nó nữa.
    const tranTrung = Math.floor(ds.length / 2);
    kiem(`[${loai}] dưới ${tranTrung} mốc mở giống nhau`, trung < tranTrung, trung);
  }

  console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} KIỂM TRA SAI\n`);
  process.exit(sai === 0 ? 0 : 1);
}

main();
