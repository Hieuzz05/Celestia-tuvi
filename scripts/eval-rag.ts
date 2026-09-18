/**
 * Nghiệm thu kho tri thức — npx tsx scripts/eval-rag.ts [--sinh] [--so-sanh] [--chi-tiet]
 *
 * Trả lời ba câu hỏi, bằng số chứ không bằng cảm nhận:
 *
 *   1. Truy hồi có lấy ĐÚNG đoạn không?          (tầng 1, không gọi model, rẻ)
 *   2. Bài trả lời có THẬT SỰ dùng đoạn đó không? (tầng 2, cần --sinh)
 *   3. Có kho thì tốt hơn không kho ở chỗ nào?    (tầng 3, cần --so-sanh)
 *
 * Mặc định chỉ chạy tầng 1 vì nó không tốn tiền model, nên chạy được thường
 * xuyên. Hai tầng sau gọi model thật, mỗi tầng vài chục lượt.
 *
 * Bộ vàng nằm ở `lib/rag/bo-vang-rag.ts`. Mọi câu trong đó đều có đáp án nằm sẵn
 * trong kho dưới dạng chuỗi kiểm chứng được — nhờ vậy "AI có dùng kho không" trả
 * lời được bằng phép so chuỗi, không phải bằng việc đọc rồi thấy hay.
 */

import { readFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

const SINH = process.argv.includes('--sinh');
const SO_SANH = process.argv.includes('--so-sanh');
const CHI_TIET = process.argv.includes('--chi-tiet');

/** Bỏ dấu và hạ chữ thường, để so chuỗi không vấp vào cách gõ dấu */
function chuan(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

const coTu = (van: string, tu: string[]) => tu.some((t) => chuan(van).includes(chuan(t)));

/**
 * Chuỗi dài nhất mà bài trả lời chép nguyên từ nguồn, đo bằng số TỪ.
 *
 * Trùng vài từ là bình thường: tên sao, tên cung buộc phải trùng. Trùng cả một
 * mệnh đề dài thì không còn là dùng nguồn nữa, mà là chép nguồn.
 */
function chuoiChepDaiNhat(van: string, nguon: string[]): number {
  const tuVan = chuan(van).split(' ').filter(Boolean);
  const kho = nguon.map((n) => ' ' + chuan(n) + ' ');
  let daiNhat = 0;
  for (let i = 0; i < tuVan.length; i++) {
    // Chỉ cần biết có vượt ngưỡng không, nên dừng sớm ở 25 từ
    for (let n = daiNhat + 1; n <= 25 && i + n <= tuVan.length; n++) {
      const cum = ' ' + tuVan.slice(i, i + n).join(' ') + ' ';
      if (kho.some((k) => k.includes(cum))) daiNhat = n;
      else break;
    }
  }
  return daiNhat;
}

/**
 * Từ ngữ chuyên môn được phép nằm trong sách, nhưng KHÔNG được tới thẳng người
 * đọc. Khung luận §7 xếp chúng vào nhóm phải dịch sang lời thường.
 *
 * Danh sách cố ý ngắn và chỉ gồm từ không có nghĩa đời thường — "miếu viên",
 * "tọa thủ". Không đưa vào những từ mà người Việt vẫn dùng ngoài đời.
 */
const TU_CO_KHONG_DUOC_DE_NGUYEN = [
  'miếu viên',
  'tọa thủ',
  'hội chiếu',
  'củng chiếu',
  'xung chiếu',
  'tam phương tứ chính',
  'đồng cung thủ mệnh',
  'nhị hợp',
  'đắc địa hãm địa',
  'bần tiện cách',
  'phú quý cách',
];

function demTuCo(van: string): string[] {
  return TU_CO_KHONG_DUOC_DE_NGUYEN.filter((t) => chuan(van).includes(chuan(t)));
}

/**
 * Ngưỡng nghiệm thu.
 *
 * Đặt theo mức ĐO ĐƯỢC ngày 18/09/2026, hạ một nấc để chịu được dao động của
 * model. Đặt theo mong muốn thì lần nào cũng đỏ, mà đỏ thường xuyên thì cũng
 * như không có ngưỡng.
 *
 * Ba con số ở tầng 4 để ở mức tuyệt đối vì chúng là luật, không phải chất lượng:
 * chép nguyên văn nguồn, sót từ chuyên môn, thiếu lực ngược — cái nào cũng là
 * vi phạm khung luận, không phải "hơi kém".
 */
const NGUONG = {
  truyHoiTrungCuoi: 0.8,
  mrr: 0.55,
  baiCoTrichNguon: 1.0,
  /*
   * Đo được ba lượt liên tiếp: 50%, 80%, 50%. Chỉ số này dao động mạnh vì
   * gpt-4o-mini mỗi lượt trích một nguồn khác nhau, dù bài vẫn đúng. Đặt ngưỡng
   * ở SÀN đo được chứ không ở trung bình — ngưỡng nằm giữa vùng dao động thì
   * lần đỏ lần xanh, và một cổng lúc đỏ lúc xanh thì cũng như không có.
   */
  trichTrungDoan: 0.5,
  doiChungAmChoiDung: 1.0,
  chepDaiToiDa: 11,
  soBaiSotTuCo: 0,
  tyLeCoLucNguoc: 0.9,
  tyLeQuaCongNgonNgu: 0.9,
};

const truot: string[] = [];
function nguong(ten: string, dat: boolean, thucTe: string) {
  if (!dat) truot.push(`${ten} — ${thucTe}`);
  return `${thucTe}  ${dat ? '[đạt]' : '[TRƯỢT]'}`;
}

function bang(tieuDe: string, hang: [string, string][]) {
  console.log(`\n${tieuDe}`);
  const rong = Math.max(...hang.map(([k]) => k.length));
  for (const [k, v] of hang) console.log(`  ${k.padEnd(rong)}  ${v}`);
}

async function main() {
  const { BO_VANG_RAG, CAU_SO_SANH } = await import('../lib/rag/bo-vang-rag');
  const { lapKeHoach } = await import('../lib/rag/planner');
  const { truyHoi } = await import('../lib/rag/truy-hoi');
  const { saoChinhTheoCung } = await import('../lib/rag/boi-canh-la-so');
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { traLoiCoCanCu } = await import('../lib/rag/tra-loi');
  const { namAmHienTai, thangAmHienTai } = await import('../lib/tuvi/bay-gio');
  const { TEN_MODEL_EMBEDDING } = await import('../lib/ai/embedding');
  const { taoSupabaseAdmin } = await import('../lib/supabase/admin');

  const laSo = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 10, gioiTinh: 'nam' });
  const namXem = namAmHienTai();
  const thangXem = thangAmHienTai();

  const sb = taoSupabaseAdmin();
  let soDoanKho = 0;
  if (sb) {
    const { count } = await sb.from('knowledge_chunks').select('id', { count: 'exact', head: true });
    soDoanKho = count ?? 0;
  }

  console.log(`\nKho: ${soDoanKho} đoạn · embedding: ${TEN_MODEL_EMBEDDING}`);
  console.log(`Bộ vàng: ${BO_VANG_RAG.length} câu (${BO_VANG_RAG.filter((c) => c.the.includes('doi-chung-am')).length} đối chứng âm)\n`);

  // ================================================================ TẦNG 1
  console.log('='.repeat(72));
  console.log('TẦNG 1 — TRUY HỒI CÓ LẤY ĐÚNG ĐOẠN KHÔNG (không gọi model)');
  console.log('='.repeat(72));

  const coDap = BO_VANG_RAG.filter((c) => c.tuKhoaNguon.length > 0);
  const doiChungAm = BO_VANG_RAG.filter((c) => c.tuKhoaNguon.length === 0);

  let trungCuoi = 0;
  let trungUngVien = 0;
  const thuHang: number[] = [];
  const hongTruyHoi: string[] = [];

  for (const c of coDap) {
    const keHoach = lapKeHoach({ cauHoi: c.cauHoi, saoTheoCung: saoChinhTheoCung(laSo) });
    const kq = await truyHoi(keHoach, { soCuoi: 6 });

    const viTri = kq.daChon.findIndex((d) => coTu(d.noiDung, c.tuKhoaNguon));
    const coTrongUngVien = kq.ungVien.some((d) => coTu(d.noiDung, c.tuKhoaNguon));

    if (viTri >= 0) {
      trungCuoi += 1;
      thuHang.push(viTri + 1);
    }
    if (coTrongUngVien) trungUngVien += 1;
    else hongTruyHoi.push(c.cauHoi);

    const nhan = viTri >= 0 ? `ĐÚNG ở vị trí ${viTri + 1}` : coTrongUngVien ? 'chỉ có trong ứng viên, bị xếp rớt' : 'KHÔNG TÌM THẤY';
    console.log(`  ${nhan.padEnd(30)} ${c.cauHoi.slice(0, 58)}`);
    if (CHI_TIET && viTri >= 0) {
      console.log(`      ${kq.daChon[viTri].noiDung.replace(/\s+/g, ' ').slice(0, 110)}`);
    }
  }

  // Đối chứng âm: kho không có gì thì đừng giả vờ có
  console.log('\n  -- đối chứng âm (kho không chứa đáp án) --');
  const diemNgoaiPhamVi: number[] = [];
  for (const c of doiChungAm) {
    const keHoach = lapKeHoach({ cauHoi: c.cauHoi, saoTheoCung: saoChinhTheoCung(laSo) });
    const kq = await truyHoi(keHoach, { soCuoi: 6 });
    // Không đòi trả rỗng: truy hồi lai ghép luôn trả về thứ gì đó. Đòi là điểm
    // phải THẤP hơn hẳn câu trong phạm vi — nếu ngang nhau thì thứ hạng vô nghĩa.
    /*
     * Điểm vector chỉ có ở đoạn do nhánh vector lấy về. Đoạn chỉ khớp từ khoá thì
     * không có điểm này, và báo nó là 0 sẽ đọc thành "rất không liên quan" —
     * ngược hẳn sự thật. Lấy điểm vector cao nhất trong CẢ nhóm đã chọn, và nói
     * rõ khi không có.
     */
    const coDiem = kq.daChon.map((d) => d.diemVector).filter((x): x is number => typeof x === 'number');
    const diemV = coDiem.length ? Math.max(...coDiem) : null;
    console.log(
      `  tương đồng cao nhất ${diemV === null ? 'không có (chỉ khớp từ khoá)' : diemV.toFixed(3)}  ${c.cauHoi.slice(0, 44)}`
    );
    if (diemV !== null) diemNgoaiPhamVi.push(diemV);
  }

  const mrr = thuHang.length ? thuHang.reduce((t, v) => t + 1 / v, 0) / coDap.length : 0;
  const amCaoNhat = diemNgoaiPhamVi.length ? Math.max(...diemNgoaiPhamVi) : 0;
  bang('KẾT QUẢ TẦNG 1', [
    [
      'Trúng trong 6 đoạn cuối',
      nguong(
        'Recall@6',
        trungCuoi / coDap.length >= NGUONG.truyHoiTrungCuoi,
        `${trungCuoi}/${coDap.length} (${((trungCuoi / coDap.length) * 100).toFixed(0)}%, cần ${NGUONG.truyHoiTrungCuoi * 100}%)`
      ),
    ],
    ['Có trong nhóm ứng viên', `${trungUngVien}/${coDap.length} (${((trungUngVien / coDap.length) * 100).toFixed(0)}%)`],
    ['MRR (thứ hạng trung bình nghịch đảo)', nguong('MRR', mrr >= NGUONG.mrr, `${mrr.toFixed(3)} (cần ${NGUONG.mrr})`)],
    ['Mất hẳn, không truy hồi được', String(coDap.length - trungUngVien)],
    [
      'Tương đồng cao nhất của câu NGOÀI phạm vi',
      diemNgoaiPhamVi.length ? amCaoNhat.toFixed(3) : 'không câu nào lọt nhánh vector',
    ],
  ]);
  if (hongTruyHoi.length) {
    console.log('\n  Câu không truy hồi được:');
    for (const q of hongTruyHoi) console.log(`    - ${q}`);
  }

  if (!SINH && !SO_SANH) {
    console.log('\nThêm --sinh để đo bài trả lời, --so-sanh để đối chiếu có kho và không kho.\n');
    return;
  }

  // ================================================================ TẦNG 2
  if (SINH) {
    console.log('\n' + '='.repeat(72));
    console.log('TẦNG 2 — BÀI TRẢ LỜI CÓ THẬT SỰ DÙNG ĐOẠN ĐÓ KHÔNG (gọi model)');
    console.log('='.repeat(72));

    let coTrichNguon = 0;
    let trichDungDoan = 0;
    let dungChiTiet = 0;
    let coTheDo = 0;
    let tongY = 0;
    let tongYCoNguon = 0;

    for (const c of coDap) {
      const kq = await traLoiCoCanCu({
        laSo,
        cauHoi: c.cauHoi,
        namXem,
        thangXem,
        ghiNhatKy: false,
      });

      const y = kq.coCauTruc?.yChinh ?? [];
      const yCoNguon = y.filter((x) => (x.maNguon ?? []).length > 0);
      tongY += y.length;
      tongYCoNguon += yCoNguon.length;
      if (yCoNguon.length) coTrichNguon += 1;

      // Mã E### trích ra có trỏ vào đúng đoạn mang từ khoá không
      const theoMa = new Map(kq.goi.bangChung.map((e) => [e.id, e.noiDung]));
      const trichTrungDoan = yCoNguon.some((x) =>
        (x.maNguon ?? []).some((ma) => {
          const noi = theoMa.get(ma);
          return noi ? coTu(noi, c.tuKhoaNguon) : false;
        })
      );
      if (trichTrungDoan) trichDungDoan += 1;

      let nhanChiTiet = '-';
      if (c.tuKhoaTraLoi?.length) {
        coTheDo += 1;
        const co = coTu(kq.van, c.tuKhoaTraLoi);
        if (co) dungChiTiet += 1;
        nhanChiTiet = co ? 'CÓ' : 'không';
      }

      console.log(
        `  ý ${String(y.length).padStart(2)} · có nguồn ${String(yCoNguon.length).padStart(2)} · trích trúng đoạn ${trichTrungDoan ? 'CÓ ' : 'kh '} · nêu chi tiết ${nhanChiTiet.padEnd(6)} ${c.cauHoi.slice(0, 40)}`
      );
    }

    console.log('\n  -- đối chứng âm: có bịa nguồn cho câu ngoài phạm vi không --');
    let amKhongBia = 0;
    for (const c of doiChungAm) {
      const kq = await traLoiCoCanCu({ laSo, cauHoi: c.cauHoi, namXem, thangXem, ghiNhatKy: false });
      /*
       * Bắt cả hai dấu hiệu, vì chối đúng cách có hai kiểu:
       *  - nói thẳng là chưa đủ căn cứ
       *  - không đưa ra ý luận giải nào (yChinh rỗng) — im lặng đúng chỗ cũng là
       *    một câu trả lời hợp lệ, và còn tốt hơn nói vòng vo.
       * Bản đầu chỉ bắt chuỗi "chưa đủ căn cứ" nên báo trượt cho một bài thật ra
       * đã chối đúng bằng chữ "chưa CÓ đủ căn cứ".
       */
      const soY = kq.coCauTruc?.yChinh.length ?? 0;
      /*
       * Bắt KHÁI NIỆM chứ không bắt từng chuỗi: yêu cầu là "nói thẳng ngay đầu
       * bài rằng lá số không trả lời được chuyện này". Liệt kê từng cách diễn
       * đạt thì lần nào cũng thiếu một cách, rồi lại nới bộ đo cho vừa kết quả —
       * đó là tự lừa mình.
       */
      const noiThang =
        /lá số\s+(này\s+)?(không|chưa)/i.test(kq.van) ||
        /ch(ư|u)a (có )?đủ căn cứ|ngoài phạm vi|không thuộc|không nằm trong/i.test(kq.van);
      const noiKhongDu = noiThang || soY === 0;
      if (noiKhongDu) amKhongBia += 1;
      console.log(`  ${noiKhongDu ? `CHỐI ĐÚNG (${noiThang ? 'nói thẳng' : 'không đưa ý nào'})`.padEnd(28) : 'VẪN LUẬN GIẢI            '.padEnd(28)} ${c.cauHoi.slice(0, 44)}`);
      if (CHI_TIET) console.log(`      ${kq.van.replace(/\s+/g, ' ').slice(0, 150)}`);
    }

    bang('KẾT QUẢ TẦNG 2', [
      [
        'Bài có trích nguồn',
        nguong(
          'Tỉ lệ bài có nguồn',
          coTrichNguon / coDap.length >= NGUONG.baiCoTrichNguon,
          `${coTrichNguon}/${coDap.length}`
        ),
      ],
      ['Tỉ lệ ý có gắn nguồn', `${tongYCoNguon}/${tongY} (${tongY ? ((tongYCoNguon / tongY) * 100).toFixed(0) : 0}%)`],
      [
        'Trích trúng đúng đoạn mang đáp án',
        nguong(
          'Trích trúng đoạn',
          trichDungDoan / coDap.length >= NGUONG.trichTrungDoan,
          `${trichDungDoan}/${coDap.length} (cần ${NGUONG.trichTrungDoan * 100}%)`
        ),
      ],
      ['Nêu được chi tiết đặc thù', coTheDo ? `${dungChiTiet}/${coTheDo} (${((dungChiTiet / coTheDo) * 100).toFixed(0)}%)` : 'không có câu nào đo được'],
      [
        'Đối chứng âm chối đúng',
        nguong(
          'Đối chứng âm',
          amKhongBia / doiChungAm.length >= NGUONG.doiChungAmChoiDung,
          `${amKhongBia}/${doiChungAm.length}`
        ),
      ],
    ]);
  }

  // ================================================================ TẦNG 4
  if (SINH) {
    console.log('\n' + '='.repeat(72));
    console.log('TẦNG 4 — CHUYỂN HOÁ CHỨ KHÔNG CHÉP (gọi model)');
    console.log('='.repeat(72));
    console.log('Bám nguồn càng chặt càng kéo model về phía chép nguyên văn.');
    console.log('Chép nguyên văn là hỏng theo cách khác: đúng sách, đúng nguồn, mà người đọc không hiểu gì.\n');

    let tongChep = 0;
    let soChepDai = 0;
    let soCoTuCo = 0;
    let soCoLucNguoc = 0;
    let soQuaCongNgonNgu = 0;
    const tuCoGap = new Set<string>();

    for (const c of coDap) {
      const kq = await traLoiCoCanCu({ laSo, cauHoi: c.cauHoi, namXem, thangXem, ghiNhatKy: false });

      const nguon = kq.goi.bangChung.map((e) => e.noiDung);
      const chep = nguon.length ? chuoiChepDaiNhat(kq.van, nguon) : 0;
      tongChep += chep;
      // 12 từ liên tiếp trùng nguồn: đủ dài để là một mệnh đề, không còn là
      // chuyện trùng tên sao.
      if (chep >= 12) soChepDai += 1;

      const tuCo = demTuCo(kq.van);
      if (tuCo.length) {
        soCoTuCo += 1;
        for (const t of tuCo) tuCoGap.add(t);
      }

      const y = kq.coCauTruc?.yChinh ?? [];
      const coNguoc = y.some((x) => Boolean(x.luongNguoc));
      if (coNguoc) soCoLucNguoc += 1;
      if (kq.ngonNgu?.dat) soQuaCongNgonNgu += 1;

      console.log(
        `  chép dài nhất ${String(chep).padStart(2)} từ · lực ngược ${coNguoc ? 'CÓ ' : 'kh '} · cổng ngôn ngữ ${kq.ngonNgu?.dat ? 'đạt  ' : 'TRƯỢT'} · từ cổ ${tuCo.length ? tuCo.join(',') : '-'}`
      );
      if (CHI_TIET) console.log(`      ${kq.van.replace(/\s+/g, ' ').slice(0, 150)}`);
    }

    bang('KẾT QUẢ TẦNG 4', [
      ['Độ dài chép trung bình', `${(tongChep / coDap.length).toFixed(1)} từ`],
      [
        'Bài chép từ 12 từ liên tiếp trở lên',
        nguong('Không chép nguyên văn', soChepDai === 0, `${soChepDai}/${coDap.length}`),
      ],
      [
        'Bài còn sót từ chuyên môn chưa dịch',
        nguong(
          'Không sót từ chuyên môn',
          soCoTuCo <= NGUONG.soBaiSotTuCo,
          `${soCoTuCo}/${coDap.length}${tuCoGap.size ? ` (${[...tuCoGap].join(', ')})` : ''}`
        ),
      ],
      [
        'Bài có nêu lực ngược',
        nguong(
          'Luật counterweight',
          soCoLucNguoc / coDap.length >= NGUONG.tyLeCoLucNguoc,
          `${soCoLucNguoc}/${coDap.length}`
        ),
      ],
      [
        'Bài qua cổng ngôn ngữ',
        nguong(
          'Cổng ngôn ngữ',
          soQuaCongNgonNgu / coDap.length >= NGUONG.tyLeQuaCongNgonNgu,
          `${soQuaCongNgonNgu}/${coDap.length}`
        ),
      ],
    ]);
  }

  // ================================================================ TẦNG 3
  if (SO_SANH) {
    console.log('\n' + '='.repeat(72));
    console.log('TẦNG 3 — CÓ KHO SO VỚI KHÔNG KHO (cùng model, cùng câu hỏi)');
    console.log('='.repeat(72));
    console.log('Tắt kho bằng cách đặt số ứng viên về 0 — vẫn đi qua đúng đường đi đó.\n');

    for (const cauHoi of CAU_SO_SANH) {
      const vang = BO_VANG_RAG.find((c) => c.cauHoi === cauHoi);
      const nen = { laSo, cauHoi, namXem, thangXem, ghiNhatKy: false as const };

      const coKho = await traLoiCoCanCu(nen);
      const khongKho = await traLoiCoCanCu({
        ...nen,
        cauHinhTruyHoi: { soUngVienVector: 0, soUngVienTuKhoa: 0, soCuoi: 0 },
      });

      const doChiTiet = (van: string) =>
        vang?.tuKhoaTraLoi?.length ? (coTu(van, vang.tuKhoaTraLoi) ? 'CÓ' : 'không') : '-';

      console.log(`\n  HỎI: ${cauHoi}`);
      console.log(`    có kho  : ${coKho.goi.bangChung.length} nguồn · ${coKho.van.split(/\s+/).length} từ · nêu chi tiết: ${doChiTiet(coKho.van)}`);
      console.log(`    không kho: ${khongKho.goi.bangChung.length} nguồn · ${khongKho.van.split(/\s+/).length} từ · nêu chi tiết: ${doChiTiet(khongKho.van)}`);
      console.log(`    --- có kho ---\n      ${coKho.van.replace(/\s+/g, ' ').slice(0, 260)}`);
      console.log(`    --- không kho ---\n      ${khongKho.van.replace(/\s+/g, ' ').slice(0, 260)}`);
    }
  }

  if (truot.length) {
    console.log(`\n${truot.length} TIÊU CHÍ TRƯỢT:`);
    for (const t of truot) console.log(`  - ${t}`);
    console.log('');
    process.exit(1);
  }
  console.log('\nMỌI TIÊU CHÍ ĐỀU ĐẠT.\n');
}

main();
