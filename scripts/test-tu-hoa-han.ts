/**
 * Bảng sự thật lớp hạn (lib/tuvi/tu-hoa-han.ts) — offline, tất định, không gọi model.
 *
 *   npx tsx scripts/test-tu-hoa-han.ts
 *
 * Đáp án KHÔNG lấy từ engine:
 *  - Bảng tứ hoá theo can chép từ sách (Tử Vi hàm số, Tử Vi khảo luận, Tử Vi nghiệm lý), ô có
 *    dị bản để null và không chấm — sổ chưa rõ ở D:\Celestia\ra-soat-cach-cuc.md.
 *  - Can năm đếm từ mốc 1984 = Giáp Tý; can cung theo ngũ hổ độn đếm tay.
 *  - Lá đối chiếu 24/08/2000 giờ Tuất nam (âm 25/7 Canh Thìn, Mệnh Tuất, Thổ ngũ cục), năm 2026
 *    (tuổi âm 27, Bính Ngọ) viết tay từng ô.
 *
 * Tứ hoá đại vận chưa có sách trong kho ghi (chủ dự án chốt vẫn làm, 16/10/2026): bài này canh
 * đúng cách tính đã chốt — can CỦA CUNG đại vận, không phải can năm sinh.
 */
import { lapLaSo, cungDaiVan, cungNguyetHan, type LaSo } from '../lib/tuvi/ansao';
import { lopHan, luuTuHoaTheoNam, tuHoaDaiVan, tuHoaTheoCan, type HoaHan } from '../lib/tuvi/tu-hoa-han';

let loi = 0;
let soCa = 0;
const kiem = (dk: boolean, msg: string) => {
  soCa++;
  if (!dk) {
    loi++;
    if (loi <= 30) console.error('  ✗', msg);
  }
};

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];

/** [Lộc, Quyền, Khoa, Kỵ] theo sách; null = sách lệch nhau, không chấm */
const TU_HOA_SACH: (string | null)[][] = [
  ['Liêm Trinh', 'Phá Quân', 'Vũ Khúc', 'Thái Dương'], // Giáp
  ['Thiên Cơ', 'Thiên Lương', 'Tử Vi', 'Thái Âm'], // Ất
  ['Thiên Đồng', 'Thiên Cơ', 'Văn Xương', 'Liêm Trinh'], // Bính
  ['Thái Âm', 'Thiên Đồng', 'Thiên Cơ', 'Cự Môn'], // Đinh
  ['Tham Lang', 'Thái Âm', null, 'Thiên Cơ'], // Mậu — Khoa: Hữu Bật / Thái Dương
  ['Vũ Khúc', 'Tham Lang', 'Thiên Lương', 'Văn Khúc'], // Kỷ
  ['Thái Dương', 'Vũ Khúc', null, null], // Canh — "Nhật Vũ Đồng Âm" (KH 927) / "Nhật Vũ Âm Đồng" (TĐ 124)
  ['Cự Môn', 'Thái Dương', 'Văn Khúc', 'Văn Xương'], // Tân
  ['Thiên Lương', 'Tử Vi', null, 'Vũ Khúc'], // Nhâm — Khoa: Tả Phù (KH, KL) / Thiên Phủ (NL 1979)
  ['Phá Quân', 'Cự Môn', 'Thái Âm', 'Tham Lang'], // Quý
];
const HOA = ['Hóa Lộc', 'Hóa Quyền', 'Hóa Khoa', 'Hóa Kỵ'];

const canNamDem = (nam: number) => (((nam - 1984) % 10) + 10) % 10;

function soVoiSach(ds: HoaHan[], can: number, nhan: string) {
  kiem(ds.length === 4, `${nhan}: phải đủ 4 hoá, có ${ds.length}`);
  ds.forEach((h, i) => {
    kiem(h.hoa === HOA[i], `${nhan}: vị trí ${i} phải là ${HOA[i]}, là ${h.hoa}`);
    const sach = TU_HOA_SACH[can][i];
    if (sach) kiem(h.sao === sach, `${nhan} can ${CAN[can]} ${HOA[i]}: sách ${sach}, engine ${h.sao}`);
  });
}

/**
 * Lá đối chiếu chấm cứng cả ba ô dị bản mà bảng sách để null: Canh Khoa = Thái Âm, Canh Kỵ =
 * Thiên Đồng (hoá chồng Đồng, Âm) và Mậu Khoa = Hữu Bật (Thiên Di). Đổi dị bản trong TU_HOA thì
 * ca này đỏ đúng chỗ — sửa đáp án theo quyết định mới, đừng nới bài.
 */
function laDoiChieu() {
  const l = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 20, phut: 30, gioiTinh: 'nam' });
  const lh = lopHan(l, 2026, 3);
  const tom = (ds: HoaHan[]) => ds.map((h) => `${h.hoa}:${h.sao}@${h.chiIndex}:${h.tenCung}`).join(' | ');

  kiem(lh.tuoiAm === 27, `tuổi âm 2026 = 27, là ${lh.tuoiAm}`);
  // Canh Thìn dương nam: tiểu hạn nhóm Thân Tý Thìn khởi Tuất, đi thuận → tuổi 27 ở Tý
  kiem(lh.tieuHan === 0, `tiểu hạn 2026 ở Tý, là ${lh.tieuHan}`);
  // Thổ ngũ cục, Mệnh Tuất, đi thuận: Tuất 5–14, Hợi 15–24, Tý 25–34
  kiem(lh.daiVan === 0, `đại vận tuổi 27 ở Tý, là ${lh.daiVan}`);
  kiem(lh.nguyetHan === cungNguyetHan(l, 27, 3), 'nguyệt hạn lấy đúng cungNguyetHan');
  kiem(lopHan(l, 2026).nguyetHan === null, 'không truyền tháng → nguyệt hạn null');

  // Bính Ngọ: Đồng Lộc, Cơ Quyền, Xương Khoa, Liêm Kỵ
  kiem(
    tom(lh.luuTuHoa) ===
      'Hóa Lộc:Thiên Đồng@1:Điền Trạch | Hóa Quyền:Thiên Cơ@5:Tật Ách | Hóa Khoa:Văn Xương@0:Phúc Đức | Hóa Kỵ:Liêm Trinh@10:Mệnh',
    `lưu tứ hoá 2026: ${tom(lh.luuTuHoa)}`
  );
  // Ngũ hổ độn năm Canh: Dần = Mậu → Tý = Mậu. Mậu: Tham Lộc, Âm Quyền, Hữu Bật Khoa, Cơ Kỵ
  kiem(
    tom(lh.tuHoaDaiVan) ===
      'Hóa Lộc:Tham Lang@0:Phúc Đức | Hóa Quyền:Thái Âm@11:Phụ Mẫu | Hóa Khoa:Hữu Bật@4:Thiên Di | Hóa Kỵ:Thiên Cơ@5:Tật Ách',
    `tứ hoá đại vận Tý (can Mậu): ${tom(lh.tuHoaDaiVan)}`
  );
  kiem(lh.tuHoaGoc.every((h) => h.nguon === 'goc') && lh.luuTuHoa.every((h) => h.nguon === 'nam'), 'nguồn hoá đánh đúng');

  const trung = lh.trung.map((t) =>
    t.loai === 'tieu-han-trung-dai-van' ? `TH=DV@${t.chiIndex}` : `${t.sao}@${t.chiIndex}:${t.hoa.map((h) => `${h.hoa}/${h.nguon}`).join('+')}`
  );
  kiem(trung.includes('TH=DV@0'), 'tiểu hạn trùng đại vận ở Tý');
  kiem(trung.includes('Thiên Cơ@5:Hóa Quyền/nam+Hóa Kỵ/dai-van'), 'hoá chồng Thiên Cơ: lưu Quyền + đại vận Kỵ');
  kiem(trung.includes('Thiên Đồng@1:Hóa Kỵ/goc+Hóa Lộc/nam'), 'hoá chồng Thiên Đồng: gốc Kỵ + lưu Lộc');
  kiem(trung.includes('Thái Âm@11:Hóa Khoa/goc+Hóa Quyền/dai-van'), 'hoá chồng Thái Âm: gốc Khoa + đại vận Quyền');
  kiem(trung.length === 4, `đúng 4 điểm trùng, có ${trung.length}: ${trung.join(' ; ')}`);

  // Đột biến: lấy can NĂM SINH (Canh) thay can cung đại vận (Mậu) → đáp án phải khác
  const saiCan = tuHoaTheoCan(l.canNamIndex).map((h) => h.sao).join(',');
  kiem(saiCan !== lh.tuHoaDaiVan.map((h) => h.sao).join(','), 'đột biến can năm sinh phải bị phân biệt với can đại vận');

  // Tuổi trước đại vận đầu (Thổ ngũ cục khởi 5) → không có tứ hoá đại vận
  kiem(tuHoaDaiVan(l, 3).length === 0 && lopHan(l, 2002).daiVan === null, 'tuổi 3 chưa vào đại vận → rỗng');
}

function quet() {
  let soLa = 0;
  let coDv = 0;
  for (let nam = 1950; nam <= 2012; nam += 3) {
    for (const thang of [1, 4, 7, 10, 12]) {
      for (const gio of [0, 3, 6, 9, 12, 15, 18, 21, 23]) {
        for (const gioiTinh of ['nam', 'nu'] as const) {
          const ngay = 1 + ((nam + thang * 3 + gio) % 28);
          let l: LaSo;
          try {
            l = lapLaSo({ ngay, thang, nam, gio, phut: 0, gioiTinh });
          } catch {
            continue;
          }
          soLa++;
          for (const namXem of [2024, 2026, 2031]) {
            const nhan = `${ngay}/${thang}/${nam} ${gio}h ${gioiTinh} xem ${namXem}`;
            const lh = lopHan(l, namXem);
            for (const h of [...lh.tuHoaGoc, ...lh.luuTuHoa, ...lh.tuHoaDaiVan])
              kiem(h.chiIndex >= 0 && h.chiIndex < 12 && h.tenCung !== '?', `${nhan}: ${h.sao} (${h.nguon}) không tìm thấy cung`);
            soVoiSach(luuTuHoaTheoNam(l, namXem), canNamDem(namXem), `${nhan} lưu`);

            const cung = cungDaiVan(l, lh.tuoiAm);
            if (!cung) {
              kiem(lh.daiVan === null && lh.tuHoaDaiVan.length === 0, `${nhan}: ngoài đại vận phải rỗng`);
            } else {
              coDv++;
              kiem(lh.daiVan === cung.chiIndex, `${nhan}: daiVan lệch cungDaiVan`);
              // Ngũ hổ độn đếm tay: can Dần = (canNam % 5) * 2 + 2, đi thuận theo chi
              const canCung = ((l.canNamIndex % 5) * 2 + 2 + ((cung.chiIndex - 2 + 12) % 12)) % 10;
              kiem(cung.can === CAN[canCung], `${nhan}: can cung đại vận ${cung.can}, đếm tay ${CAN[canCung]}`);
              soVoiSach(lh.tuHoaDaiVan, canCung, `${nhan} đại vận`);
            }
            for (const t of lh.trung) {
              if (t.loai === 'hoa-chong') {
                kiem(t.hoa.length >= 2 && t.hoa.some((h) => h.nguon !== 'goc'), `${nhan}: hoá chồng ${t.sao} phải có lớp hạn`);
              } else {
                kiem(t.chiIndex === lh.tieuHan && t.chiIndex === lh.daiVan, `${nhan}: TH=DV sai chỗ`);
              }
            }
            kiem(
              lh.trung.some((t) => t.loai === 'tieu-han-trung-dai-van') === (lh.daiVan === lh.tieuHan),
              `${nhan}: cờ tiểu hạn trùng đại vận lệch`
            );
          }
        }
      }
    }
  }
  kiem(soLa > 1500, `quét đủ lá (${soLa})`);
  kiem(coDv > soLa, `phần lớn ca có đại vận (${coDv})`);
  console.log(`  quét ${soLa} lá × 3 năm, ${coDv} ca có đại vận`);
}

laDoiChieu();
quet();
console.log(`\n${loi ? `✗ ${loi}/${soCa} ca hỏng` : `✓ ${soCa} ca xanh`}`);
process.exit(loi ? 1 : 0);
