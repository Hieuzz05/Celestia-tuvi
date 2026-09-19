/**
 * Đo chất lượng chat trên câu hỏi dạng QUYẾT ĐỊNH — npx tsx scripts/eval-chat-quyet-dinh.ts
 *
 *   --day-du     chạy cả 23 câu trên cả 3 lá số (69 lượt gọi model). Mặc định
 *                chỉ chạy 23 câu trên lá số thứ nhất, cộng 3 câu trên cả ba lá
 *                số cho phép đo hoán — 32 lượt.
 *   --chi-tiet   in cả bài trả lời, không chỉ in điểm.
 *   --xuat <tệp> ghi dữ liệu thô từng bài ra JSON, để dựng bảng Excel.
 *
 * GỌI MODEL THẬT. Không nằm trong checklist offline; chạy khi vừa sửa prompt,
 * schema đầu ra, hoặc lớp cách cục.
 *
 * Tám tiêu chí, tất cả chấm BẰNG LUẬT. Không có tiêu chí nào cần người đọc phán
 * xét — bộ đo phải chạy lại được và so được với lần trước, mà cảm nhận của người
 * thì không so được.
 *
 * Tiêu chí 7 và 8 thêm sau khi một bài lọt ra người dùng thật với câu:
 *
 *   "Năm 2026 nghiêng rõ về phía đẩy tới: bảy yếu tố đang đỡ so với hai yếu tố
 *    cản ở phần tình cảm."
 *
 * Sáu tiêu chí cũ đều cho câu ấy đi qua — nó có mốc số, có lời khuyên điều kiện,
 * có hỏi ngược, và không trùng bài nào. Không tiêu chí nào hỏi câu quan trọng
 * nhất: bài này có NÓI ĐƯỢC ĐIỀU GÌ về lá số này không. Đó là việc của 7 và 8.
 *
 * Tiêu chí 6 là phép đo quan trọng nhất và rẻ nhất: chạy CÙNG một câu hỏi trên
 * ba lá số khác nhau rồi đo trùng lặp 5-gram. Trùng cao nghĩa là bài không đọc
 * lá số, nó đọc câu hỏi — tức Barnum. Đây đúng là điểm yếu của sản phẩm đối
 * chiếu, nên nó vừa là thước đo vừa là thứ phải vượt.
 *
 * ĐỌC SỐ CHO ĐÚNG — bộ này NHIỄU, và biết trước thì đỡ đuổi theo bóng.
 *
 * Mẫu mặc định 23 bài, nên mỗi bài đáng khoảng 4 điểm phần trăm. Model lại
 * chạy có nhiệt độ: cùng một câu hỏi, hai lần chạy ra hai bài khác nhau. Đo
 * được bốn lần liên tiếp trên cùng một bản mã, tiêu chí 4 cho 86,7% · 84,6% ·
 * 85,7% · 69,2% — lần cuối tụt 16 điểm mà không có gì thay đổi liên quan.
 *
 * Nên:
 *   - Số dưới ngưỡng MỘT HAI điểm thì chạy lại, đừng sửa prompt.
 *   - Muốn kết luận thật thì chạy `--day-du` (69 bài) và chạy hai lần.
 *   - Tiêu chí 6 ổn định hơn hẳn các tiêu chí kia (1–5% qua cả bốn lần) vì nó
 *     đo sự KHÁC NHAU giữa các bài chứ không đo một thuộc tính của từng bài.
 */

import { readFileSync } from 'node:fs';

for (const d of readFileSync('.env.local', 'utf-8').split(/\r?\n/)) {
  const s = d.trim();
  if (!s || s.startsWith('#')) continue;
  const [k, ...p] = s.split('=');
  const v = p.join('=').trim();
  if (v) process.env[k.trim()] = v;
}

const dayDu = process.argv.includes('--day-du');
const chiTiet = process.argv.includes('--chi-tiet');
/** --xuat <đường dẫn>: ghi dữ liệu thô của mọi bài ra JSON, để dựng bảng Excel */
const xuat = (() => {
  const i = process.argv.indexOf('--xuat');
  return i !== -1 ? process.argv[i + 1] : null;
})();

// ---------------------------------------------------------------- ngưỡng
const NGUONG = {
  /** Bài có ít nhất một cách cục có tên VÀ được dịch ngay */
  cachCuc: 0.8,
  /** Bài có mốc thời gian bằng số */
  thoiGian: 0.7,
  /** Lời khuyên viết dạng điều kiện, trên tổng lời khuyên */
  neuThi: 0.8,
  /** Lực ngược nói về chính việc đang hỏi */
  luongNguocTrungDich: 0.7,
  /** Có câu hỏi ngược và nó hỏi dữ kiện đời thực */
  hoiLai: 0.8,
  /** Trùng lặp 5-gram giữa ba bài cho cùng một câu hỏi — CÀNG THẤP CÀNG TỐT */
  trungLapToiDa: 0.25,
  /**
   * Bài KHÔNG dùng tiếng lóng nội bộ của engine. Ngưỡng 100%, không phải 95%.
   *
   * Mọi tiêu chí khác ở đây đo mức độ HAY của bài. Tiêu chí này đo một lỗi đã
   * ra tới người dùng thật, và cổng ngôn ngữ đã chặn nó — nên một bài trượt
   * nghĩa là cổng thủng, không phải model kém hôm nay. Đặt ngưỡng dưới 100%
   * biến nó thành một con số để ngắm.
   */
  khongTiengLong: 1,
  /**
   * Bài nêu ĐÍCH DANH ít nhất hai dữ kiện lá số trong ba câu đầu.
   *
   * Đây là tiêu chí trung tâm của lần sửa này. "Năm 2026 nghiêng rõ về phía đẩy
   * tới" trượt vì nó không nêu tên gì; "tiểu hạn năm nay rơi vào phần bạn đời,
   * mà ở đó sẵn có Hồng Loan" thì đạt.
   *
   * BA CÂU ĐẦU, không phải cả bài: lý do phải đi LIỀN sau kết luận. Nêu tên ở
   * đoạn bốn thì người đọc đã đi qua câu quan trọng nhất mà không có gì để tin,
   * và với phần lớn người đọc thì bài kết thúc ở đó.
   *
   * Ngưỡng 80% chứ không 100%: có lá số mà engine không đọc ra dữ kiện nào cho
   * chủ đề đang hỏi, và ép 100% là ép model bịa tên sao vào đúng những bài ấy.
   */
  neuTenDuKien: 0.8,
};

// ---------------------------------------------------------------- tiện ích

function boDau(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}

/** Mốc thời gian nói bằng SỐ — "đại vận 25–34 tuổi", "năm 2026", "3 năm tới" */
const CO_MOC_SO =
  /\b\d{1,2}\s*[–—-]\s*\d{1,2}\s*tuổi|\b\d{1,2}\s*tuổi|\bnăm\s*\d{4}|\b\d{1,2}\s*năm\s*(?:tới|nữa|sau)/iu;

/** Cụm chỉ hành vi đời sống — dùng để biết tên cách cục đã được dịch chưa */
const CUM_DOI_SONG = [
  'lam', 'song', 'noi', 'nghi', 'chon', 'quyet', 'doi', 'giu', 'mat', 'thay',
  'can', 'muon', 'chiu', 'gap', 'di', 'o lai', 'bo', 'day', 'keo', 'dung',
  'hop', 'thich', 'ngai', 'de', 'kho', 'met', 'viec', 'nguoi', 'tien', 'nha',
  'quan he', 'gia dinh', 'suc khoe', 'ban', 'sep', 'dong nghiep', 'con',
];

function coLoiDoiSong(s: string): boolean {
  const kd = boDau(s);
  return CUM_DOI_SONG.some((t) => kd.includes(t));
}

/**
 * Tập 5-gram theo TỪ của một bài, SAU KHI bỏ phần tất định.
 *
 * Lối đi tiếp dựng từ bảng tra, nên hai lá số cùng chủ đề có đúng cùng một dòng
 * liên kết. Để nó trong phép đo thì tiêu chí 6 nhảy 2,5% lên 9,6% ngay khi thêm
 * tính năng ấy — mà không bài nào Barnum thêm chút nào.
 *
 * Barnum là khi PHẦN LUẬN giống nhau. Một dòng liên kết giống nhau lại là điều
 * mong muốn: nó phải tất định để model không bịa ra URL.
 */
function nam(s: string): Set<string> {
  const khongLink = s.replace(/\[[^\]]*\]\([^)]*\)/g, ' ');
  const tu = boDau(khongLink).split(/[^a-z0-9]+/).filter(Boolean);
  const ra = new Set<string>();
  for (let i = 0; i + 5 <= tu.length; i++) ra.add(tu.slice(i, i + 5).join(' '));
  return ra;
}

/** Tỉ lệ 5-gram dùng chung giữa hai bài, trên tập nhỏ hơn */
function trungLap(a: string, b: string): number {
  const x = nam(a);
  const y = nam(b);
  if (x.size === 0 || y.size === 0) return 0;
  let chung = 0;
  for (const g of x) if (y.has(g)) chung += 1;
  return chung / Math.min(x.size, y.size);
}

const pc = (a: number, b: number) => (b === 0 ? '—' : `${((a / b) * 100).toFixed(1)}%`);

/**
 * Chữ chỉ LỚP HẠN — được phép gọi thẳng tên, và là một dạng dữ kiện có tên.
 *
 * Chúng nằm trong nhóm thuật ngữ mà chuẩn ngôn ngữ cho gọi thẳng, cùng nhóm với
 * tên cách cục: người Việt hỏi tử vi vẫn dùng "đại vận", "tiểu hạn" ngoài đời,
 * khác hẳn "tọa thủ" hay "củng chiếu" vốn chỉ sống trong sách.
 *
 * Và chúng là thứ DUY NHẤT trả lời được câu hỏi "vì sao lại là năm nay".
 */
const CHU_LOP_HAN = /tiểu hạn|đại vận|lưu niên|nguyệt hạn|lưu [A-ZĐÀ-Ỹ]/u;

/** Ba câu đầu của một bài — chỗ lý do bắt buộc phải có mặt */
function baCauDau(van: string): string {
  return van
    .split(/(?<=[.!?])\s+/)
    .filter((c) => c.trim())
    .slice(0, 3)
    .join(' ');
}

interface DiemMotBai {
  cauHoi: string;
  chuDe: string;
  yDinh: string;
  van: string;
  coCachCucDaDich: boolean;
  coMocSo: boolean;
  soNeuThi: number;
  soKhuyenKhac: number;
  luongNguocTrungDich: boolean | null;
  hoiLaiDat: boolean;
  loiChan: string[];
  /** Cụm tiếng lóng engine mà cổng ngôn ngữ bắt được — rỗng là đạt */
  tiengLong: string[];
  /** Số dữ kiện CÓ TÊN trong ba câu đầu: tên sao, tên cách cục, tên lớp hạn */
  soTenDuKien: number;
  /** Chính những cái tên ấy — để người đọc bảng Excel kiểm lại được bằng mắt */
  tenDuKien: string[];
  /** Tên cung lọt ra mặt trước — cảnh báo, không chặn */
  cungLo: string[];
}

async function main() {
  const { lapLaSo } = await import('../lib/tuvi/ansao');
  const { traLoiCoCanCu } = await import('../lib/rag/tra-loi');
  const { namAmHienTai, thangAmHienTai } = await import('../lib/tuvi/bay-gio');
  const { TEN_CACH_CUC } = await import('../lib/tuvi/cach-cuc');
  const { BO_VANG_QUYET_DINH, LA_SO_DO } = await import('../lib/rag/bo-vang-quyet-dinh');
  const { nhanDangThucThe } = await import('../lib/rag/thuc-the');

  const namXem = namAmHienTai();
  const thangXem = thangAmHienTai();

  async function chay(laSoVao: (typeof LA_SO_DO)[number], c: (typeof BO_VANG_QUYET_DINH)[number]) {
    const laSo = lapLaSo(laSoVao);
    const kq = await traLoiCoCanCu({
      laSo,
      cauHoi: c.cauHoi,
      namXem,
      thangXem,
      ghiNhatKy: false,
      // Kế hoạch phải tái lập được giữa hai lần chạy eval
      dungModelPhanLoai: false,
    });

    const van = kq.van;
    const cc = kq.coCauTruc;

    // 1. Cách cục có tên và được dịch ngay
    const cau = van.split(/(?<=[.!?])\s+/).filter((x) => x.trim());
    let coCachCucDaDich = false;
    for (let i = 0; i < cau.length; i++) {
      const co = TEN_CACH_CUC.some((t) => boDau(cau[i]).includes(boDau(t)));
      if (!co) continue;
      const quanh = [cau[i - 1], cau[i], cau[i + 1]].filter(Boolean).join(' ');
      if (coLoiDoiSong(quanh)) {
        coCachCucDaDich = true;
        break;
      }
    }

    // 3. Lời khuyên dạng điều kiện trên tổng lời khuyên
    const soNeuThi = cc?.yChinh.filter((y) => y.neuThi).length ?? 0;
    const soKhuyenKhac = (cc?.buocTiepTheo?.length ?? 0) + (cc?.canNhac?.length ?? 0);

    // 4. Lực ngược có nói về chính việc đang hỏi không
    const luong = (cc?.yChinh ?? []).map((y) => y.luongNguoc).filter(Boolean).join(' ');
    const luongNguocTrungDich = luong
      ? c.tuDoiTuong.some((t) => boDau(luong).includes(boDau(t)))
      : null;

    // 5. Câu hỏi ngược có và hỏi đời thực
    const hoiLaiDat =
      !!cc?.hoiLai &&
      !(kq.kiemDuyet?.loi ?? []).some((l) => l.ma === 'hoi-lai-sai-vai');

    // 7. Tiếng lóng nội bộ của engine — cổng ngôn ngữ đã chặn, đây là phép đếm lại
    const tiengLong = (kq.ngonNgu?.loi ?? [])
      .filter((l) => l.ma === 'tieng-long-engine')
      .flatMap((l) => (l.viDu ?? '').split(', ').filter(Boolean));

    // Tên cung lọt ra mặt trước — cảnh báo, không chặn, nhưng phải đếm
    const cungLo = (kq.ngonNgu?.loi ?? [])
      .filter((l) => l.ma === 'lo-ten-cung')
      .flatMap((l) => (l.viDu ?? '').split(', ').filter(Boolean));

    /*
     * 8. Dữ kiện CÓ TÊN trong ba câu đầu.
     *
     * Ba nguồn tên, và cả ba đều là thứ chuẩn ngôn ngữ cho gọi thẳng:
     *   - tên sao và Tứ Hóa, qua từ điển thực thể
     *   - tên cách cục
     *   - tên lớp hạn (tiểu hạn, đại vận, lưu niên, và các sao lưu)
     *
     * Đếm theo TẬP, không theo lần xuất hiện: nhắc "Hóa Kỵ" ba lần vẫn là một
     * dữ kiện, và tính thành ba là thưởng cho việc lặp.
     */
    const dau = baCauDau(van);
    const ten = new Set<string>();
    for (const t of nhanDangThucThe(dau)) {
      if (t.loai === 'STAR' || t.loai === 'TRANSFORMATION') ten.add(t.id);
    }
    for (const t of TEN_CACH_CUC) if (boDau(dau).includes(boDau(t))) ten.add(t);
    const lop = dau.match(new RegExp(CHU_LOP_HAN, 'gu'));
    if (lop) for (const l of lop) ten.add(l.trim());

    return {
      cauHoi: c.cauHoi,
      chuDe: kq.goi.chuDe,
      yDinh: kq.goi.yDinh,
      van,
      coCachCucDaDich,
      coMocSo: CO_MOC_SO.test(van),
      soNeuThi,
      soKhuyenKhac,
      luongNguocTrungDich,
      hoiLaiDat,
      loiChan: (kq.kiemDuyet?.loi ?? []).filter((l) => l.mucDo === 'chan').map((l) => l.ma),
      tiengLong,
      soTenDuKien: ten.size,
      tenDuKien: [...ten],
      cungLo,
    } satisfies DiemMotBai;
  }

  // ------------------------------------------------ năm tiêu chí đầu
  const caCauHoi = BO_VANG_QUYET_DINH;
  const laSoChinh = LA_SO_DO[0];

  console.log(
    `\nBộ vàng chat quyết định — ${caCauHoi.length} câu` +
      (dayDu ? ` × ${LA_SO_DO.length} lá số` : ' trên lá số thứ nhất') +
      '\n'
  );

  const diem: DiemMotBai[] = [];
  const dsLaSo = dayDu ? LA_SO_DO : [laSoChinh];

  for (const ls of dsLaSo) {
    for (const c of caCauHoi) {
      process.stdout.write('.');
      diem.push(await chay(ls, c));
    }
  }
  console.log('\n');

  const n = diem.length;
  const soCachCuc = diem.filter((d) => d.coCachCucDaDich).length;
  const soMoc = diem.filter((d) => d.coMocSo).length;
  const tongNeuThi = diem.reduce((t, d) => t + d.soNeuThi, 0);
  const tongKhuyen = diem.reduce((t, d) => t + d.soNeuThi + d.soKhuyenKhac, 0);
  const coLuong = diem.filter((d) => d.luongNguocTrungDich !== null);
  const luongDat = coLuong.filter((d) => d.luongNguocTrungDich === true).length;
  const soHoiLai = diem.filter((d) => d.hoiLaiDat).length;
  const soLoiChan = diem.reduce((t, d) => t + d.loiChan.length, 0);
  const soSachTiengLong = diem.filter((d) => d.tiengLong.length === 0).length;
  const soNeuTen = diem.filter((d) => d.soTenDuKien >= 2).length;

  // ------------------------------------------------ tiêu chí 6: hoán lá số
  console.log('Đo hoán lá số (cùng câu hỏi, ba lá số khác nhau)…');
  const cauDoHoan = caCauHoi.slice(0, 3);
  const trung: { cauHoi: string; ti: number }[] = [];

  for (const c of cauDoHoan) {
    const bai: string[] = [];
    for (const ls of LA_SO_DO) {
      // Ở chế độ đầy đủ các bài này đã chạy rồi, nhưng chạy lại vẫn rẻ hơn là
      // dựng một lớp đệm chỉ để tiết kiệm ba lượt gọi.
      process.stdout.write('.');
      bai.push((await chay(ls, c)).van);
    }
    const cap = [trungLap(bai[0], bai[1]), trungLap(bai[0], bai[2]), trungLap(bai[1], bai[2])];
    trung.push({ cauHoi: c.cauHoi, ti: cap.reduce((a, b) => a + b, 0) / cap.length });
  }
  console.log('\n');

  const trungTB = trung.reduce((t, x) => t + x.ti, 0) / trung.length;

  // ------------------------------------------------ in kết quả
  let sai = 0;
  const dong = (ten: string, doDuoc: number, nguong: number, thap = false) => {
    const dat = thap ? doDuoc <= nguong : doDuoc >= nguong;
    if (!dat) sai += 1;
    const mui = thap ? '≤' : '≥';
    console.log(
      `  ${dat ? 'ĐẠT ' : 'HỎNG'} ${ten.padEnd(42)} ${(doDuoc * 100).toFixed(1).padStart(6)}%   (ngưỡng ${mui} ${(nguong * 100).toFixed(0)}%)`
    );
  };

  console.log('TÁM TIÊU CHÍ\n');
  dong('1. Có cách cục có tên, đã dịch nghĩa', soCachCuc / n, NGUONG.cachCuc);
  dong('2. Có mốc thời gian bằng số', soMoc / n, NGUONG.thoiGian);
  dong('3. Lời khuyên dạng điều kiện', tongKhuyen ? tongNeuThi / tongKhuyen : 0, NGUONG.neuThi);
  dong(
    '4. Lực ngược nói về chính việc đang hỏi',
    coLuong.length ? luongDat / coLuong.length : 0,
    NGUONG.luongNguocTrungDich
  );
  dong('5. Có câu hỏi ngược, hỏi đời thực', soHoiLai / n, NGUONG.hoiLai);
  dong('6. Trùng lặp 5-gram giữa ba lá số', trungTB, NGUONG.trungLapToiDa, true);
  dong('7. Không tiếng lóng nội bộ engine', soSachTiengLong / n, NGUONG.khongTiengLong);
  dong('8. Nêu ≥2 dữ kiện có tên ở 3 câu đầu', soNeuTen / n, NGUONG.neuTenDuKien);

  console.log(`\n  Phụ: ${soCachCuc}/${n} có cách cục · ${soMoc}/${n} có mốc số · ${soHoiLai}/${n} có hỏi ngược`);
  console.log(
    `  Phụ: trung bình ${(diem.reduce((t, d) => t + d.soTenDuKien, 0) / n).toFixed(1)} dữ kiện có tên / 3 câu đầu`
  );
  console.log(
    `  Phụ: ${diem.filter((d) => d.cungLo.length).length}/${n} bài lọt tên cung ra mặt trước (cảnh báo, không chặn)`
  );
  console.log(`  Phụ: ${tongNeuThi} lời khuyên điều kiện / ${tongKhuyen} tổng lời khuyên`);
  console.log(`  Phụ: lực ngược đo được trên ${coLuong.length}/${n} bài, ${pc(luongDat, coLuong.length)} trúng đích`);
  console.log(`  Phụ: validator chặn ${soLoiChan} ý trên ${n} bài`);

  console.log('\n  Trùng lặp từng câu:');
  for (const t of trung) console.log(`    ${(t.ti * 100).toFixed(1).padStart(5)}%  "${t.cauHoi}"`);

  if (chiTiet) {
    console.log(`\n${'='.repeat(72)}\nBÀI CHI TIẾT\n`);
    for (const d of diem) {
      console.log(`\n--- "${d.cauHoi}" ---`);
      console.log(
        `cách cục ${d.coCachCucDaDich ? 'có' : 'KHÔNG'} · mốc số ${d.coMocSo ? 'có' : 'KHÔNG'} · ` +
          `neuThi ${d.soNeuThi}/${d.soNeuThi + d.soKhuyenKhac} · ` +
          `lực ngược ${d.luongNguocTrungDich === null ? 'không có' : d.luongNguocTrungDich ? 'trúng' : 'lạc'} · ` +
          `hỏi ngược ${d.hoiLaiDat ? 'đạt' : 'KHÔNG'}`
      );
      console.log(d.van);
    }
  }

  /*
   * Xuất dữ liệu thô để dựng bảng Excel.
   *
   * Không dựng .xlsx thẳng từ đây: kéo một thư viện Excel vào dependencies của
   * ứng dụng chỉ để một script eval chạy tay là cái giá sai. Ghi JSON, rồi một
   * script riêng ngoài repo dựng bảng.
   */
  if (xuat) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(
      xuat,
      JSON.stringify(
        {
          chayLuc: new Date().toISOString(),
          namXem,
          thangXem,
          laSo: dsLaSo,
          nguong: NGUONG,
          bai: diem,
          trungLap: trung,
        },
        null,
        2
      ),
      'utf-8'
    );
    console.log(`\n  Đã ghi dữ liệu thô: ${xuat}`);
  }

  console.log(sai === 0 ? '\nTÁM TIÊU CHÍ ĐỀU ĐẠT\n' : `\n${sai}/8 TIÊU CHÍ CHƯA ĐẠT\n`);
  process.exit(sai === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
