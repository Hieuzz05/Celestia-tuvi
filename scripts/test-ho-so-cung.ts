/**
 * Hồ sơ cung (lib/tuvi/ho-so-cung.ts) — offline, tất định, không gọi model.
 *
 *   npx tsx scripts/test-ho-so-cung.ts
 *
 * Ba phần:
 *  1. Bảng tay: địa lợi (Tử Vi hàm số 424–441), chặn đầu / theo gót (nghiệm lý 1974 :381–383,
 *     không phân nam nữ), nhị hợp, giáp.
 *  2. Lá đối chiếu 24/08/2000 giờ Tuất nam (Canh Thìn, Bạch Lạp Kim), năm 2026 — vị trí viết tay:
 *     Mệnh ở Tuất; lưu Kỵ Liêm Trinh ở Tuất; Lưu Kình Ngọ, Lưu Đà Thìn; tiểu hạn = đại vận = Tý.
 *  3. Quét lá: bất biến trên mọi cung, và mỗi nhánh (vô chính diệu, Nhật Nguyệt sáng chiếu,
 *     tháo gỡ ở đại vận, chặn đầu, theo gót) phải gặp ít nhất một lần — nhánh không bao giờ
 *     chạy là nhánh viết sai.
 */

import { lapLaSo, tamPhuongTuChinh } from '../lib/tuvi/ansao';
import {
  cungGiap,
  cungNhiHop,
  diaLoi,
  hoSoCung,
  hoSoLa,
  kieuTuanTriet,
  laVoChinhDieu,
} from '../lib/tuvi/ho-so-cung';

let loi = 0;
let soCa = 0;
const kiem = (dk: boolean, msg: string) => {
  soCa++;
  if (!dk) {
    loi++;
    console.error('  ✗', msg);
  }
};

function bangTay() {
  kiem(diaLoi('Thổ', 4) === 'vuong', 'Thổ ở Thìn phải vượng địa');
  kiem(diaLoi('Thổ', 1) === 'vuong' && diaLoi('Thổ', 7) === 'vuong' && diaLoi('Thổ', 10) === 'vuong', 'Thổ ở Sửu Mùi Tuất phải vượng');
  kiem(diaLoi('Thổ', 3) === 'tuyet', 'Thổ ở Mão phải tuyệt địa');
  kiem(diaLoi('Thổ', 6) === 'sinh' && diaLoi('Thổ', 5) === 'bai', 'Thổ: sinh Ngọ, bại Tỵ');
  kiem(diaLoi('Mộc', 11) === 'sinh' && diaLoi('Mộc', 3) === 'vuong' && diaLoi('Mộc', 0) === 'bai' && diaLoi('Mộc', 8) === 'tuyet', 'Mộc: Hợi Mão Tý Thân');
  kiem(diaLoi('Hỏa', 2) === 'sinh' && diaLoi('Hỏa', 6) === 'vuong' && diaLoi('Hỏa', 3) === 'bai' && diaLoi('Hỏa', 11) === 'tuyet', 'Hỏa: Dần Ngọ Mão Hợi');
  kiem(diaLoi('Kim', 5) === 'sinh' && diaLoi('Kim', 9) === 'vuong' && diaLoi('Kim', 6) === 'bai' && diaLoi('Kim', 2) === 'tuyet', 'Kim: Tỵ Dậu Ngọ Dần');
  kiem(diaLoi('Thủy', 8) === 'sinh' && diaLoi('Thủy', 0) === 'vuong' && diaLoi('Thủy', 9) === 'bai' && diaLoi('Thủy', 5) === 'tuyet', 'Thủy: Thân Tý Dậu Tỵ');
  kiem(diaLoi('Mộc', 6) === 'binh-thuong', 'Mộc ở Ngọ ngoài bảng → bình thường');

  // Giáp (0) dương, Thìn (4) dương; Ất (1) âm, Mão (3) âm
  kiem(kieuTuanTriet(0, 4) === 'chan-dau', 'tuổi dương, cung dương → chặn đầu');
  kiem(kieuTuanTriet(1, 3) === 'chan-dau', 'tuổi âm, cung âm → chặn đầu');
  kiem(kieuTuanTriet(0, 3) === 'theo-got', 'tuổi dương, cung âm → theo gót');
  kiem(kieuTuanTriet(1, 4) === 'theo-got', 'tuổi âm, cung dương → theo gót');

  const hop: [number, number][] = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  for (const [a, b] of hop) kiem(cungNhiHop(a) === b && cungNhiHop(b) === a, `nhị hợp ${a}–${b}`);
  kiem(cungGiap(0)[0] === 11 && cungGiap(0)[1] === 1, 'giáp Tý là Hợi và Sửu');
}

function laDoiChieu() {
  const la = lapLaSo({ ngay: 24, thang: 8, nam: 2000, gio: 20, phut: 30, gioiTinh: 'nam' });
  kiem(la.menhIndex === 10, `lá đối chiếu: Mệnh phải ở Tuất, đang ở ${la.menhIndex}`);
  kiem(la.banMenh.hanh === 'Kim', 'lá đối chiếu: Bản Mệnh Kim');
  const hs = hoSoCung(la, 10, 2026);
  kiem(hs.diaLoi === 'binh-thuong', 'Kim mệnh ở Tuất: ngoài bảng → bình thường');
  const l = hs.lopHan!;
  kiem(!!l, 'có năm xem thì có lớp hạn');
  kiem(l.tuHoa.some((h) => h.hoa === 'Hóa Kỵ' && h.sao === 'Liêm Trinh' && h.nguon === 'nam' && h.viTri === 'toa-thu'), 'lưu Kỵ Liêm Trinh toạ Mệnh');
  kiem(l.saoLuu.some((s) => s.ten === 'Lưu Đà La' && s.viTri === 'xung-chieu'), 'Lưu Đà ở Thìn xung chiếu Tuất');
  kiem(l.saoLuu.some((s) => s.ten === 'Lưu Kình Dương' && s.viTri === 'tam-hop'), 'Lưu Kình ở Ngọ tam hợp Tuất');
  kiem(!l.laCungDaiVan && !l.laCungTieuHan, 'Tuất không phải cung hạn năm 2026');
  const ty = hoSoCung(la, 0, 2026).lopHan!;
  kiem(ty.laCungDaiVan && ty.laCungTieuHan, 'Tý là cả đại vận lẫn tiểu hạn năm 2026');
  kiem(hoSoCung(la, 10).lopHan === null, 'không năm xem thì không lớp hạn');
}

function quetLa() {
  const dem = { voChinh: 0, muon: 0, nhat: 0, nguyet: 0, caHai: 0, thaoGo: 0, khongThaoGo: 0, chanDau: 0, theoGot: 0, diaLoi: { sinh: 0, vuong: 0, bai: 0, tuyet: 0 } };
  let soLa = 0;
  for (let nam = 1950; nam <= 2010; nam += 3)
    for (let thang = 1; thang <= 12; thang += 2)
      for (let gio = 0; gio < 24; gio += 4)
        for (const gioiTinh of ['nam', 'nu'] as const) {
          const la = lapLaSo({ ngay: 1 + ((nam + thang + gio) % 28), thang, nam, gio, phut: 0, gioiTinh });
          soLa++;
          const lb = hoSoLa(la);
          // Chiều đại vận khớp với cách engine đặt đại vận thứ hai
          if (/thuận/.test(la.amDuongThuanLy) !== (lb.chieuDaiVan === 'thuan')) kiem(false, `${nam}/${thang} ${gio}h ${gioiTinh}: thuận lý lệch chiều đại vận`);
          if (lb.tuoiDuong !== /^(Giáp|Bính|Mậu|Canh|Nhâm) /.test(la.thongTin.canChiNam)) kiem(false, `${nam}/${thang} ${gio}h ${gioiTinh}: tuổi dương sai`);
          const sau = la.cungs[(la.menhIndex + (lb.chieuDaiVan === 'thuan' ? 1 : 11)) % 12];
          if (sau.daiVan?.tuTuoi !== la.cuc.so + 10) kiem(false, `${nam}/${thang} ${gio}h ${gioiTinh}: chiều đại vận lệch engine`);

          const namXem = la.thongTin.amLich.nam + 35;
          for (const cung of la.cungs) {
            const hs = hoSoCung(la, cung.chiIndex, namXem);
            const tp = tamPhuongTuChinh(cung.chiIndex);
            const tong = [cung.chiIndex, tp.xungChieu, ...tp.tamHop, cungNhiHop(cung.chiIndex), ...cungGiap(cung.chiIndex)]
              .reduce((n, i) => n + la.cungs[i].sao.length, 0);
            const ma = `${nam}/${thang} ${gio}h ${gioiTinh} cung ${cung.chiIndex}`;
            if (hs.sao.length !== tong) kiem(false, `${ma}: số sao ${hs.sao.length} ≠ ${tong}`);
            if (hs.sao.filter((s) => s.viTri === 'toa-thu').length !== cung.sao.length) kiem(false, `${ma}: thiếu sao toạ thủ`);

            for (const x of hs.sao) {
              const g = la.cungs[x.cungGoc];
              if (x.cungGocCoTuan !== g.coTuan || x.cungGocCoTriet !== g.coTriet) kiem(false, `${ma}: Tuần Triệt cung gốc sai (${x.ten})`);
              if (x.kyDongCung !== g.sao.some((y) => y.ten === 'Hóa Kỵ')) kiem(false, `${ma}: Kỵ đồng cung sai (${x.ten})`);
            }
            const [gTruoc, gSau] = cungGiap(cung.chiIndex);
            if (hs.giap.truoc.sao.join() !== la.cungs[gTruoc].sao.map((y) => y.ten).join() || hs.giap.sau.sao.join() !== la.cungs[gSau].sao.map((y) => y.ten).join()) kiem(false, `${ma}: sao giáp sai`);
            if (hs.nhiHop !== cungNhiHop(cung.chiIndex)) kiem(false, `${ma}: nhị hợp sai`);
            const xetDl = cung.laCungMenh || cung.laCungThan || cung.tenCung === 'Phúc Đức';
            if (xetDl !== (hs.diaLoi !== 'khong-ap-dung')) kiem(false, `${ma}: địa lợi áp sai cung`);
            if (xetDl && hs.diaLoi !== diaLoi(la.banMenh.hanh, cung.chiIndex)) kiem(false, `${ma}: địa lợi lệch bảng`);
            if (hs.diaLoi !== 'khong-ap-dung' && hs.diaLoi !== 'binh-thuong') dem.diaLoi[hs.diaLoi]++;

            if (laVoChinhDieu(cung) !== (hs.voChinhDieu !== null)) kiem(false, `${ma}: vô chính diệu sai`);
            if (hs.voChinhDieu) {
              dem.voChinh++;
              if (hs.voChinhDieu.muon.some((s) => s.loai !== 'chinh-tinh' || s.cungGoc !== tp.xungChieu)) kiem(false, `${ma}: mượn sai cung`);
              if (hs.voChinhDieu.muon.length) dem.muon++;
              const { nhatSangChieu: n, nguyetSangChieu: g } = hs.voChinhDieu;
              if (n) dem.nhat++;
              if (g) dem.nguyet++;
              if (n && g) dem.caHai++;
            }

            const coTT = cung.coTuan || cung.coTriet;
            if (coTT !== (hs.tuanTriet.kieu !== null)) kiem(false, `${ma}: kiểu Tuần Triệt sai`);
            if (hs.tuanTriet.kieu === 'chan-dau') dem.chanDau++;
            if (hs.tuanTriet.kieu === 'theo-got') dem.theoGot++;
            if (!cung.laCungMenh && hs.tuanTriet.thaoGoTaiDaiVan !== 'khong-ap-dung') kiem(false, `${ma}: tháo gỡ chỉ cho Mệnh`);
            if (cung.laCungMenh) {
              // Viết lại điều kiện theo câu sách, không chép mã: Mệnh đúng một cái, Mệnh + đại vận gộp đủ cả hai
              const dv = la.cungs.find((c) => c.daiVan && namXem - la.thongTin.amLich.nam + 1 >= c.daiVan.tuTuoi && namXem - la.thongTin.amLich.nam + 1 <= c.daiVan.denTuoi);
              const motCai = Number(cung.coTuan) + Number(cung.coTriet) === 1;
              const mongDoi = !motCai ? 'khong-ap-dung' : !!dv && (cung.coTuan || dv.coTuan) && (cung.coTriet || dv.coTriet);
              if (hs.tuanTriet.thaoGoTaiDaiVan !== mongDoi) kiem(false, `${ma}: tháo gỡ ${hs.tuanTriet.thaoGoTaiDaiVan} ≠ ${mongDoi}`);
              if (hoSoCung(la, cung.chiIndex).tuanTriet.thaoGoTaiDaiVan !== 'khong-ap-dung') kiem(false, `${ma}: không năm xem mà vẫn tính tháo gỡ`);
            }
            if (hs.tuanTriet.thaoGoTaiDaiVan === true) dem.thaoGo++;
            if (hs.tuanTriet.thaoGoTaiDaiVan === false) dem.khongThaoGo++;

            for (const h of hs.lopHan!.tuHoa) if (h.nguon === 'goc') kiem(false, `${ma}: tứ hoá gốc lọt vào lớp hạn`);
          }
        }
  console.log(`  quét ${soLa} lá:`, JSON.stringify(dem));
  kiem(dem.voChinh > 0 && dem.muon > 0, 'phải gặp vô chính diệu có chính tinh mượn');
  // Quét thực tế: cung vô chính diệu có Nguyệt sáng chiếu thì Nhật cũng sáng chiếu (do vị trí an
  // hai sao), nên chỉ đòi gặp "Nhật sáng một mình" và "cả hai" — đủ để thấy hai cờ tách nhau.
  kiem(dem.nhat > dem.caHai && dem.caHai > 0, 'phải gặp Nhật sáng riêng và cả hai cùng sáng chiếu cung vô chính diệu');
  kiem(dem.thaoGo > 0 && dem.khongThaoGo > 0, 'phải gặp cả Mệnh được tháo gỡ và không');
  kiem(dem.chanDau > 0 && dem.theoGot > 0, 'phải gặp cả chặn đầu và theo gót');
  for (const [k, v] of Object.entries(dem.diaLoi)) kiem(v > 0, `phải gặp địa lợi ${k}`);
}

bangTay();
laDoiChieu();
quetLa();
console.log(`\n${loi ? `✗ ${loi}/${soCa} ca hỏng` : `✓ ${soCa} ca xanh`}`);
process.exit(loi ? 1 : 0);
