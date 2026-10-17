/**
 * Nghiệm thu lớp cách cục — npx tsx scripts/test-cach-cuc.ts
 *
 * Chạy OFFLINE, không chạm database, không gọi model. Nằm trong checklist trước
 * khi commit nên phải nhanh và phải luôn xanh.
 *
 * Ba tầng đo, theo đúng thứ tự từ rẻ tới đắt:
 *
 *  1. **Từng luật có sống không.** Một luật không bao giờ phát ra là luật viết
 *     sai, không phải luật hiếm — đã bắt được đúng một lỗi như thế: bản đầu bắt
 *     "Kình Dương đồng cung Thiên Mã", mà hai sao ấy không bao giờ gặp nhau
 *     trong engine này. Tầng này quét diện rộng và báo đỏ khi có luật 0%.
 *
 *  2. **Ràng buộc mà spec đặt ra** trên đúng 8 lá số mẫu của
 *     `test-chuan-ngon-ngu.ts`: mỗi lá số ≥ 2 cách cục, không lá số nào > 8.
 *     Trần 8 là để prompt không loãng; sàn 2 là để bài đọc có ít nhất hai chỗ
 *     tựa vào chứ không chỉ một.
 *
 *  3. **Cách cục phải PHÂN BIỆT được hai lá số.** Đây là mục đích tồn tại của
 *     cả lớp này: nếu lá số nào cũng ra một tập thì nó không thêm được gì so
 *     với bản mô tả chung chung mà nó sinh ra để thay thế.
 *
 * Một điều spec đòi mà tệp này CỐ Ý không hứa: "hai lá số khác nhau không bao
 * giờ ra cùng một tập cách cục". Điều đó không đạt được bằng bất kỳ bộ luật hữu
 * hạn nào — 16 cách cục cho ra tối đa 2^16 tập, còn số lá số thì lớn hơn nhiều,
 * nên trùng là chuyện của nguyên lý chuồng bồ câu chứ không phải lỗi. Thay vào
 * đó đo TỈ LỆ PHÂN BIỆT trên một mẫu rộng và đặt sàn cho nó.
 */

import { lapLaSo, type Cung, type GioiTinh, type LaSo } from '../lib/tuvi/ansao';
import { nhanDangCachCuc, TEN_CACH_CUC, TEN_CHI_DE_CHAN } from '../lib/tuvi/cach-cuc';

let sai = 0;
function kiem(ten: string, ok: boolean, chiTiet?: unknown) {
  if (!ok) sai += 1;
  console.log(
    `  ${ok ? 'OK  ' : 'SAI '} ${ten}${!ok && chiTiet !== undefined ? ` — ${JSON.stringify(chiTiet)}` : ''}`
  );
}

/** Đúng 8 lá số mẫu của test-chuan-ngon-ngu.ts — hai bộ đo nói về cùng một tập lá số */
const MAU: [number, number, number, number, GioiTinh][] = [
  [12, 5, 1990, 10, 'nam'],
  [24, 8, 2000, 9, 'nam'],
  [3, 11, 1985, 21, 'nu'],
  [17, 2, 1996, 4, 'nu'],
  [28, 6, 1978, 15, 'nam'],
  [9, 9, 1993, 2, 'nu'],
  [1, 1, 2001, 23, 'nam'],
  [30, 12, 1988, 12, 'nu'],
];

// ------------------------------------------------ 1. Từng luật có sống không

/*
 * Điều kiện theo sách cho ba cách đã sửa 16/10/2026, viết lại ĐỘC LẬP với engine
 * để làm đáp án. Chuẩn là Tử Vi hàm số (HS) dòng 814-815, đối chiếu Khảo luận và
 * Ảo bí. Engine phát mà đáp án không thoả là luật sai; đáp án thoả mà engine
 * không phát (khi chưa chạm trần 8) là luật thiếu.
 */
const coSao = (c: Cung | undefined, ten: string) => !!c?.sao.some((s) => s.ten === ten);
const chiCua = (laSo: LaSo, ten: string) => laSo.cungs.find((c) => coSao(c, ten))?.chi;
const theoChi = (laSo: LaSo, i: number) => laSo.cungs.find((c) => c.chiIndex === ((i % 12) + 12) % 12);

const DUNG_SACH: Record<string, (laSo: LaSo, g: Cung) => boolean> = {
  // HS 814 + Ảo bí 5568: Sửu thì Nhật Tỵ Nguyệt Dậu, Mùi thì Nhật Mão Nguyệt Hợi
  NHAT_NGUYET_TINH_MINH: (laSo, g) => {
    const d = chiCua(laSo, 'Thái Dương');
    const a = chiCua(laSo, 'Thái Âm');
    return (g.chi === 'Sửu' && d === 'Tỵ' && a === 'Dậu') || (g.chi === 'Mùi' && d === 'Mão' && a === 'Hợi');
  },
  // HS 815: Thiên Tướng tọa thủ, Kình Dương và Liêm Trinh giáp hai bên
  HINH_TU_GIAP_AN: (laSo, g) => {
    if (!coSao(g, 'Thiên Tướng')) return false;
    const t = theoChi(laSo, g.chiIndex - 1);
    const s = theoChi(laSo, g.chiIndex + 1);
    return (coSao(t, 'Kình Dương') && coSao(s, 'Liêm Trinh')) || (coSao(t, 'Liêm Trinh') && coSao(s, 'Kình Dương'));
  },
  // HS 815: cung ở Ngọ, Kình tọa thủ, Thiên Hình và Thiên Mã hợp chiếu
  MA_DAU_DOI_KIEM: (laSo, g) => {
    if (g.chi !== 'Ngọ' || !coSao(g, 'Kình Dương')) return false;
    const bon = [g.chiIndex, g.chiIndex + 4, g.chiIndex + 8, g.chiIndex + 6].map((i) => theoChi(laSo, i));
    return bon.some((c) => coSao(c, 'Thiên Hình')) && bon.some((c) => coSao(c, 'Thiên Mã'));
  },
};
const saiSach: string[] = [];
const thieuSach: string[] = [];
const demSach = new Map<string, number>();
const tenDaPhat = new Set<string>();

console.log('\n== TỪNG LUẬT CÓ PHÁT RA ĐƯỢC KHÔNG ==\n');

const dem = new Map<string, number>();
const tap = new Set<string>();
const soLuong: number[] = [];
let n = 0;

for (let nam = 1970; nam <= 2005; nam++) {
  for (const thang of [1, 3, 5, 7, 9, 11]) {
    for (const ngay of [3, 12, 21, 28]) {
      /*
       * Giờ phải có cả chi chẵn lẫn lẻ. Bản trước quét 1h, 9h, 17h (Sửu, Tỵ,
       * Dậu: cả ba lẻ), mà Mệnh lệch chẵn lẻ với Tả Phù / Hữu Bật đúng bằng chỉ
       * số giờ, nên Tả Hữu không bao giờ vào được tam phương Mệnh hay Quan và
       * cả nửa không gian lá số không được quét. Bắt được 16/10/2026.
       */
      for (const gio of [1, 7, 13, 19]) {
        const laSo = lapLaSo({
          ngay,
          thang,
          nam,
          gio,
          gioiTinh: (n % 2 ? 'nu' : 'nam') as GioiTinh,
        });
        const cc = nhanDangCachCuc(laSo, 'Quan Lộc');
        n += 1;
        soLuong.push(cc.length);
        tap.add(cc.map((c) => c.ma).sort().join(','));
        for (const c of cc) dem.set(c.ma, (dem.get(c.ma) ?? 0) + 1);
        for (const c of cc) tenDaPhat.add(c.ten);

        const nhanLa = `${ngay}/${thang}/${nam} ${gio}h`;
        const gocs = [laSo.cungs[laSo.menhIndex], laSo.cungs.find((c) => c.tenCung === 'Quan Lộc')!];
        for (const [ma, dung] of Object.entries(DUNG_SACH)) {
          const phat = cc.filter((c) => c.ma === ma);
          for (const c of phat) {
            const g = laSo.cungs.find((x) => x.tenCung === c.cung);
            if (!g || !dung(laSo, g)) saiSach.push(`${ma} @ ${nhanLa} ${c.cung}`);
          }
          if (gocs.some((g) => dung(laSo, g))) {
            demSach.set(ma, (demSach.get(ma) ?? 0) + 1);
            if (!phat.length && cc.length < 8) thieuSach.push(`${ma} @ ${nhanLa}`);
          }
        }
      }
    }
  }
}

// Mã của mọi luật đang có, lấy từ chính lần quét — cộng với những mã chưa ra
// lần nào thì không biết được từ đây, nên đối chiếu ngược với TEN_CACH_CUC.
const soTen = TEN_CACH_CUC.length;
kiem(
  `Quét ${n} lá số, bảng tên có ${soTen} mục`,
  soTen >= 16,
  { soTen }
);

/*
 * Đối chiếu theo TÊN với TEN_CACH_CUC. Bản trước lọc `dem` tìm mục bằng 0,
 * nhưng `dem` chỉ chứa mã đã phát ít nhất một lần, nên bài này không thể đỏ.
 */
const chet = TEN_CACH_CUC.filter((t) => !tenDaPhat.has(t) && !TEN_CHI_DE_CHAN.includes(t));
kiem('Không luật nào phát 0 lần trong mẫu', chet.length === 0, chet);

kiem('Cách đã phát đều thoả điều kiện sách (HS 814-815)', saiSach.length === 0, saiSach.slice(0, 5));
kiem('Lá số thoả điều kiện sách thì có phát (khi chưa chạm trần)', thieuSach.length === 0, thieuSach.slice(0, 5));
console.log(`  Số lá thoả điều kiện sách: ${JSON.stringify(Object.fromEntries(demSach))}`);

// Luật phát quá dày cũng đáng ngờ: cái gì ai cũng có thì không phân biệt được ai
const quaDay = [...dem.entries()].filter(([, d]) => d / n > 0.75).map(([m, d]) => `${m} ${((d / n) * 100).toFixed(0)}%`);
kiem('Không luật nào phát trên 75% số lá số', quaDay.length === 0, quaDay);

console.log('\n  Tần suất:');
for (const [m, d] of [...dem].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${m.padEnd(24)} ${((d / n) * 100).toFixed(1)}%`);
}

// ------------------------------------------------ 2. Ràng buộc của spec

console.log('\n== RÀNG BUỘC TRÊN 8 LÁ SỐ MẪU ==\n');

const tapMau: string[] = [];
for (const [ngay, thang, nam, gio, gioiTinh] of MAU) {
  const laSo = lapLaSo({ ngay, thang, nam, gio, gioiTinh });
  const cc = nhanDangCachCuc(laSo, 'Quan Lộc');
  const nhan = `${ngay}/${thang}/${nam} ${gio}h ${gioiTinh}`;
  tapMau.push(cc.map((c) => c.ma).sort().join(','));

  kiem(`${nhan}: ${cc.length} cách cục (cần 2–8)`, cc.length >= 2 && cc.length <= 8, {
    ma: cc.map((c) => c.ma),
  });

  // Điều kiện phải tự đứng được trong prompt: quá ngắn là không nêu được vì sao thoả
  const cut = cc.filter((c) => c.dieuKien.length < 60).map((c) => c.ma);
  kiem(`${nhan}: mọi điều kiện đều nêu rõ vì sao thoả`, cut.length === 0, cut);

  // Tên phát ra phải nằm trong bảng tên — validator đối chiếu đúng bảng này
  const laVeTen = cc.filter((c) => !TEN_CACH_CUC.includes(c.ten)).map((c) => c.ten);
  kiem(`${nhan}: tên nằm trong TEN_CACH_CUC`, laVeTen.length === 0, laVeTen);
}

// ------------------------------------------------ 3. Có phân biệt được không

console.log('\n== CÓ PHÂN BIỆT ĐƯỢC HAI LÁ SỐ KHÔNG ==\n');

kiem(
  `8 lá số mẫu ra 8 tập khác nhau`,
  new Set(tapMau).size === tapMau.length,
  { soTapKhacNhau: new Set(tapMau).size }
);

const tiLePhanBiet = tap.size / n;
kiem(
  `Tỉ lệ tập phân biệt trên ${n} lá số ≥ 20% (đo ${(tiLePhanBiet * 100).toFixed(1)}%)`,
  tiLePhanBiet >= 0.2,
  { soTap: tap.size, n }
);

const trungBinh = soLuong.reduce((a, b) => a + b, 0) / n;
kiem(
  `Trung bình 2–8 cách cục mỗi lá số (đo ${trungBinh.toFixed(2)})`,
  trungBinh >= 2 && trungBinh <= 8
);

const duoiSan = soLuong.filter((x) => x < 2).length;
kiem(
  `Dưới 10% số lá số có ít hơn 2 cách cục (đo ${((duoiSan / n) * 100).toFixed(1)}%)`,
  duoiSan / n < 0.1,
  { duoiSan, n }
);

console.log(sai === 0 ? '\nTẤT CẢ ĐỀU ĐÚNG\n' : `\n${sai} MỤC SAI\n`);
process.exit(sai === 0 ? 0 : 1);
