/**
 * Kiểm `lib/tuvi/xet-cung.ts` (CEL-200, phương án 3a bản 7 bước C-C) trên lá số THẬT do engine an.
 *
 * Quét một mẫu lá số, ở mỗi lá tìm các ca chuyên gia đã nêu, rồi kiểm đầu ra:
 *  1. Thiên Lương hãm gặp Tuần / Triệt — độ sáng hiệu dụng và trần "lên ngang đắc".
 *  2. Nhật Nguyệt Sửu Mùi gặp Kỵ — thành cách; thêm Tuần Triệt thì nâng; Kình Đà / Không Kiếp đồng
 *     cung thì hỏng cách.
 *  3. Lộc Tồn ở Mệnh — Kình Đà giáp không bị báo là "hung không được cứu".
 *  4. Lộc Tồn gặp Không Kiếp hãm — không có luật nào cứu, phải nằm trong danh sách (ii).
 *  5. Phá Quân (không hãm) ở Thân gặp Không / Kiếp ở Dần Thân Tỵ Hợi — luật dụng khớp.
 *  6. Thiên Phủ gặp 0 / 1–3 / đủ 4 sát Kình Đà Hỏa Linh — chế được, rồi hết chế.
 * Mỗi ca phải gặp ít nhất một lần trong mẫu, không thì test đỏ (mẫu quét đã không còn phủ ca đó).
 *
 * Chạy: npx tsx scripts/test-xet-cung.ts — offline.
 */

import { lapLaSo, tamPhuongTuChinh, type LaSo } from '../lib/tuvi/ansao';
import { cungGiap } from '../lib/tuvi/ho-so-cung';
import { xetLaSo, type KetQuaCung } from '../lib/tuvi/xet-cung';

let loi = 0;
const dem: Record<string, number> = {};
function kiem(dk: boolean, mo: string) {
  if (!dk) {
    loi++;
    if (loi <= 30) console.error('  ✗ ' + mo);
  }
}
const gap = (ca: string) => (dem[ca] = (dem[ca] ?? 0) + 1);

const KINH_DA = ['Kình Dương', 'Đà La'];
const KHONG_KIEP = ['Địa Không', 'Địa Kiếp'];
const TU_SAT = [...KINH_DA, 'Hỏa Tinh', 'Linh Tinh'];
const DAN_THAN_TY_HOI = [2, 8, 5, 11];
const SUU_MUI = [1, 7];

const coSao = (la: LaSo, i: number, ten: string) => la.cungs[i].sao.some((s) => s.ten === ten);
const doSang = (la: LaSo, i: number, ten: string) => la.cungs[i].sao.find((s) => s.ten === ten)?.doSang ?? null;
const tamPhuong = (i: number) => {
  const tp = tamPhuongTuChinh(i);
  return [i, tp.xungChieu, ...tp.tamHop];
};
const cungCo = (la: LaSo, ten: string) => la.cungs.findIndex((c) => c.sao.some((s) => s.ten === ten));
const ketCung = (kq: ReturnType<typeof xetLaSo>, i: number): KetQuaCung => kq.cung.find((c) => c.chiIndex === i)!;

function* mau(): Generator<LaSo> {
  for (let nam = 1950; nam <= 2009; nam++)
    for (const thang of [1, 4, 7, 10])
      for (let gio = 0; gio < 24; gio += 2)
        for (const gioiTinh of ['nam', 'nu'] as const)
          yield lapLaSo({ ngay: 1 + ((nam * 7 + thang * 3 + gio) % 28), thang, nam, gio, phut: 0, gioiTinh });
}

let soLa = 0;
for (const la of mau()) {
  soLa++;
  const kq = xetLaSo(la);

  // Thứ tự sách: Phúc → Mệnh → Thân, không trùng
  const phuc = la.cungs.findIndex((c) => c.tenCung === 'Phúc Đức');
  const thuTuMongDoi = [...new Set([phuc, la.menhIndex, la.thanIndex])];
  kiem(JSON.stringify(kq.thuTu) === JSON.stringify(thuTuMongDoi), `thứ tự xét ${kq.thuTu} ≠ ${thuTuMongDoi}`);
  kiem(kq.han === null, 'không có năm xem thì không có danh sách (iv)');

  // (ii) chỉ trong tam phương tứ chính — giáp không phải "gặp"
  for (const h of kq.hungKhongCuu) {
    kiem(tamPhuong(h.chiIndex).includes(h.cungGoc), `hung không cứu ${h.sao} ở ngoài tam phương cung ${h.chiIndex}`);
    kiem(h.doSang === 'H' || h.sao === 'Hóa Kỵ', `hung không cứu ${h.sao} phải đang hãm hoặc là Hóa Kỵ`);
  }

  for (const k of kq.cung) {
    const c = la.cungs[k.chiIndex];
    // Sát hãm tọa thủ gặp Tuần Triệt: chỉ giảm hung, KHÔNG lên đắc (TH 4095 chỉ nói chính tinh cứu giải)
    for (const ten of TU_SAT)
      if (coSao(la, k.chiIndex, ten) && doSang(la, k.chiIndex, ten) === 'H' && (c.coTuan || c.coTriet)) {
        const h = kq.hungKhongCuu.find((x) => x.chiIndex === k.chiIndex && x.sao === ten && x.cungGoc === k.chiIndex);
        const cuu = k.khop.some((x) => x.trangThai === 'ap' && x.loai !== 'PHA' && (x.biTacDong.includes(ten) || (!x.biTacDong.length && x.chuDong.includes(ten))));
        if (cuu) continue;
        gap('sat-ham-tuan-triet');
        kiem(!!h && h.giam, `${ten} hãm gặp Tuần Triệt ở cung ${k.chiIndex}: vẫn hãm (giảm), không thành đắc`);
        kiem(!k.khop.some((x) => x.ma === 'SAT_DAC_HOP_HANH_MENH_VCD' && x.chuDong.includes(ten)), `${ten} hãm gặp Triệt không được mở luật sát đắc`);
      }
    // Tuần Triệt ở cung đang xét chắn sao chiếu vào
    if (c.coTuan || c.coTriet) {
      const vcd = !c.sao.some((x) => x.loai === 'chinh-tinh');
      const chieu = kq.hungKhongCuu.filter((h) => h.chiIndex === k.chiIndex && h.cungGoc !== k.chiIndex);
      if (vcd && c.coTriet) {
        gap('vcd-triet-chan-ca');
        kiem(!chieu.length, `cung vô chính diệu có Triệt (${k.chiIndex}): sao chiếu vào bị chắn hẳn, không vào (ii)`);
      } else if (chieu.length) {
        gap('tuan-triet-chan-bot');
        kiem(chieu.every((h) => h.giam), `cung ${k.chiIndex} có Tuần Triệt: sao hung chiếu vào phải ghi giảm`);
      }
    }
  }

  // Luật cứu thắng một luật PHÁ: phải để lại trần "chật vật", và luật PHÁ ghi thua bởi chính nó
  for (const k of kq.cung)
    for (const x of k.khop)
      if (x.thangPha) {
        gap('thang-pha');
        const pha = k.khop.find((y) => y.ma === x.thangPha);
        kiem(pha?.trangThai === 'thua-uu-tien' && pha.boi === x.ma, `${x.ma} thắng ${x.thangPha}: luật phá phải ghi thua`);
        kiem(x.trangThai !== 'ap' || kq.tranMuc.some((t) => t.chiIndex === k.chiIndex && t.ma === x.ma && t.ly === 'thang-chat-vat'), `${x.ma} thắng phá: thiếu trần chật vật`);
      }

  // 3. Lộc Tồn ở Mệnh: Kình Đà ở hai cung giáp không được báo
  if (coSao(la, la.menhIndex, 'Lộc Tồn')) {
    gap('loc-ton-menh');
    const giap = cungGiap(la.menhIndex);
    kiem(
      !kq.hungKhongCuu.some((h) => h.chiIndex === la.menhIndex && KINH_DA.includes(h.sao) && giap.includes(h.cungGoc)),
      'Lộc Tồn ở Mệnh: Kình Đà giáp bị báo là hung không cứu'
    );
    // 4. Lộc Tồn gặp Không / Kiếp hãm trong tam phương: không luật nào cứu
    const k = ketCung(kq, la.menhIndex);
    const daCuu = new Set(k.khop.filter((x) => x.trangThai === 'ap' && x.loai !== 'PHA').flatMap((x) => (x.biTacDong.length ? x.biTacDong : x.chuDong)));
    for (const c of tamPhuong(la.menhIndex))
      for (const ten of KHONG_KIEP) {
        if (!coSao(la, c, ten) || daCuu.has(ten)) continue;
        const coTT = la.cungs[c].coTuan || la.cungs[c].coTriet || la.cungs[la.menhIndex].coTuan || la.cungs[la.menhIndex].coTriet;
        if (doSang(la, c, ten) !== 'H' || coTT) continue;
        gap('loc-ton-khong-kiep');
        kiem(
          kq.hungKhongCuu.some((h) => h.chiIndex === la.menhIndex && h.sao === ten && h.cungGoc === c),
          `Lộc Tồn ở Mệnh gặp ${ten} hãm (cung ${c}): phải nằm trong (ii)`
        );
      }
  }

  // 1. Thiên Lương hãm ở cung đang xét gặp Tuần / Triệt (không năm xem → Triệt còn mạnh)
  for (const k of kq.cung) {
    const ct = k.chinhTinh.find((c) => c.ten === 'Thiên Lương');
    if (!ct || ct.doSangGoc !== 'H') continue;
    const { coTuan, coTriet } = la.cungs[k.chiIndex];
    if (coTriet) {
      gap('luong-ham-triet');
      kiem(ct.doSang === 'D', `Thiên Lương hãm gặp Triệt (cung ${k.chiIndex}): lên ngang đắc, được ${ct.doSang}`);
      kiem(kq.tranMuc.some((t) => t.chiIndex === k.chiIndex && t.ma === 'Thiên Lương' && t.ly === 'tran-do-sang'), 'Thiên Lương hãm gặp Triệt: phải có trần độ sáng');
    } else if (coTuan) {
      gap('luong-ham-tuan');
      kiem(ct.doSang === 'B', `Thiên Lương hãm gặp Tuần (cung ${k.chiIndex}): lên bình, được ${ct.doSang}`);
    } else kiem(ct.doSang === 'H', 'Thiên Lương hãm không Tuần Triệt: giữ hãm');
  }

  // 2. Nhật Nguyệt đồng cung Sửu Mùi gặp Hóa Kỵ gốc — xét như cung đang hỏi
  const nn = cungCo(la, 'Thái Dương');
  if (SUU_MUI.includes(nn) && coSao(la, nn, 'Thái Âm') && coSao(la, nn, 'Hóa Kỵ')) {
    const k = ketCung(xetLaSo(la, { cungHoi: nn }), nn);
    const dung = k.khop.find((x) => x.ma === 'NHAT_NGUYET_SUU_MUI_DUNG_KY');
    kiem(!!dung, `Nhật Nguyệt Kỵ ở ${nn}: luật dùng Kỵ phải khớp`);
    const hong = [...KINH_DA, ...KHONG_KIEP].some((s) => coSao(la, nn, s));
    const kqHoi = xetLaSo(la, { cungHoi: nn });
    if (hong) {
      gap('nhat-nguyet-ky-hong');
      kiem(dung?.trangThai === 'bi-ngoai-le' && dung.boi === 'NHAT_NGUYET_KY_HONG_CACH', 'Nhật Nguyệt Kỵ có sát đồng cung: phải hỏng cách');
      kiem(kqHoi.cachPha.some((c) => c.chiIndex === nn && c.ten === 'NHAT_NGUYET_SUU_MUI_DUNG_KY'), 'Nhật Nguyệt Kỵ hỏng cách: phải vào danh sách cách bị phá');
    } else {
      gap('nhat-nguyet-ky');
      kiem(dung?.trangThai === 'ap', `Nhật Nguyệt Kỵ không sát đồng cung: phải áp, được ${dung?.trangThai}`);
      kiem(kqHoi.cachThanh.some((c) => c.chiIndex === nn && c.ma === 'NHAT_NGUYET_SUU_MUI_DUNG_KY'), 'Nhật Nguyệt Kỵ: phải vào danh sách cách thành');
    }
    if (la.cungs[nn].coTuan || la.cungs[nn].coTriet) {
      gap('nhat-nguyet-ky-tuan-triet');
      const tt = k.tuanTrietTheoSao.find((t) => t.ma === 'TT_NHAT_NGUYET_SUU_MUI');
      kiem(!!tt && (tt.tuan === 'nang' || tt.triet === 'nang'), 'Nhật Nguyệt Kỵ gặp Tuần Triệt: dòng Tuần Triệt phải nâng');
    }
  }

  // 5. Phá Quân không hãm ở Thân, Không / Kiếp ở Dần Thân Tỵ Hợi trong tam phương
  if (coSao(la, la.thanIndex, 'Phá Quân') && doSang(la, la.thanIndex, 'Phá Quân') !== 'H') {
    const tp = tamPhuong(la.thanIndex);
    const coKK = tp.some((c) => DAN_THAN_TY_HOI.includes(c) && KHONG_KIEP.some((s) => coSao(la, c, s)));
    const pq = la.cungs[la.thanIndex];
    // Tuần Triệt ở cung Phá Quân có thể đổi bậc sáng hiệu dụng — tách ra để ca sạch
    if (coKK && !pq.coTuan && !pq.coTriet) {
      gap('pha-quan-than-kiep');
      const k = ketCung(kq, la.thanIndex).khop.find((x) => x.ma === 'PHA_DUNG_KHONG_KIEP');
      kiem(!!k, 'Phá Quân ở Thân gặp Không Kiếp Dần Thân Tỵ Hợi: luật dụng phải khớp');
      kiem(k?.doBen === 'khong-ben', 'Phá Quân dụng Không Kiếp: phát nhanh không bền');
      kiem(k?.tuoiTang === [1, 4, 7, 10].includes(la.chiNamIndex), 'Phá Quân dụng Không Kiếp: tuổi tứ mộ chỉ là cờ tăng');
      kiem(kq.tranMuc.some((t) => t.ma === 'PHA_DUNG_KHONG_KIEP' && t.ly === 'khong-ben') || k?.trangThai !== 'ap', 'không bền phải vào trần mức');
    }
  }

  // 6. Thiên Phủ: đếm tứ sát trong tam phương cung Thiên Phủ
  const phu = cungCo(la, 'Thiên Phủ');
  if (phu >= 0) {
    const n = TU_SAT.filter((s) => tamPhuong(phu).some((c) => coSao(la, c, s))).length;
    const kqPhu = xetLaSo(la, { cungHoi: phu });
    const k = ketCung(kqPhu, phu);
    // Tử Phủ đồng cung Dần Thân gặp sát mà thiếu Mệnh Cục tương sinh / Âm Dương thuận lý: chế không vững
    const tuPhuKV = k.khop.find((x) => x.ma === 'TU_PHU_CHE_TU_SAT' && x.trangThai === 'khong-vung');
    if (tuPhuKV) {
      gap('tu-phu-khong-vung');
      kiem(kqPhu.tranMuc.some((t) => t.ma === 'TU_PHU_CHE_TU_SAT' && t.ly === 'che-khong-vung'), 'Tử Phủ chế không vững phải vào trần mức');
    }
    kiem(!k.khop.some((x) => x.ma === 'TU_PHU_CHE_TU_SAT') || [2, 8].includes(phu), 'Tử Phủ chế tứ sát chỉ khi Tử Phủ đồng cung (Dần Thân)');
    const che = k.khop.find((x) => x.ma === 'PHU_CHE_TU_SAT');
    const het = k.khop.find((x) => x.ma === 'PHU_HET_CHE_DU_TU_SAT');
    const tuan = la.cungs[phu].coTuan;
    if (n === 0) {
      gap('phu-0-sat');
      kiem(!che && !het, 'Thiên Phủ không gặp sát: không luật chế nào khớp');
    } else if (n < 4) {
      gap(`phu-${n}-sat`);
      kiem(!!che && !het, `Thiên Phủ gặp ${n} sát: chế được, chưa hết chế`);
      kiem(che?.trangThai === (tuan ? 'mat-do-tuan-triet' : 'ap'), `Thiên Phủ gặp ${n} sát: trạng thái ${che?.trangThai} (Tuần: ${tuan})`);
    } else {
      gap('phu-4-sat');
      // Tử Phủ cùng tam phương, Mệnh Cục tương sinh + Âm Dương thuận lý: TU_PHU_CHE_TU_SAT (uuTien cao hơn) vẫn chế được
      const tuPhu = k.khop.find((x) => x.ma === 'TU_PHU_CHE_TU_SAT' && x.trangThai === 'ap');
      if (tuPhu) {
        gap('phu-4-sat-tu-phu');
        kiem(kqPhu.tranMuc.some((t) => t.ma === tuPhu.ma && t.ly === 'thang-chat-vat'), 'Tử Phủ thắng đủ 4 sát: chế được nhưng chật vật (TH 4077)');
      }
      kiem(
        !!het && (het.trangThai === 'ap' || (!!tuPhu && het.trangThai === 'thua-uu-tien' && het.boi === tuPhu.ma)),
        `Thiên Phủ gặp đủ 4 sát: luật hết chế phải áp (trừ khi Tử Phủ cùng chế), được ${het?.trangThai}`
      );
      kiem(!!che && che.trangThai === (tuan ? 'mat-do-tuan-triet' : 'bi-ngoai-le'), `Thiên Phủ gặp đủ 4 sát: luật chế phải bị tắt, được ${che?.trangThai}`);
    }
  }
}

// (iv) có năm xem: có cung đại vận / lưu niên / tiểu hạn, sao lưu chỉ vào phần khopHan
{
  const la = lapLaSo({ ngay: 12, thang: 5, nam: 1990, gio: 8, phut: 0, gioiTinh: 'nam' });
  const kq = xetLaSo(la, { namXem: 2026 });
  kiem(kq.han !== null && kq.han.namXem === 2026, 'có năm xem thì có danh sách (iv)');
  const vai = new Set(kq.han?.cung.flatMap((c) => c.vai));
  kiem(vai.has('dai-van') && vai.has('luu-nien') && vai.has('tieu-han'), `(iv) phải có đủ ba vai cung hạn, có ${[...vai]}`);
  kiem(kq.han?.cung.find((c) => c.vai.includes('luu-nien'))?.chiIndex === (2026 + 8) % 12, 'cung lưu niên 2026 là Ngọ');
  kiem(!!kq.han?.cung.every((c) => c.khopHan.every((k) => !c.khopGoc.some((g) => g.ma === k.ma && `${g.chuDong}` === `${k.chuDong}` && `${g.biTacDong}` === `${k.biTacDong}`))), '(iv) khopHan không lặp khopGoc');
}

const CA = ['thang-pha', 'sat-ham-tuan-triet', 'vcd-triet-chan-ca', 'tuan-triet-chan-bot', 'tu-phu-khong-vung', 'loc-ton-menh', 'loc-ton-khong-kiep', 'luong-ham-triet', 'luong-ham-tuan', 'nhat-nguyet-ky', 'nhat-nguyet-ky-hong', 'nhat-nguyet-ky-tuan-triet', 'pha-quan-than-kiep', 'phu-0-sat', 'phu-1-sat', 'phu-2-sat', 'phu-4-sat'];
for (const ca of CA) kiem((dem[ca] ?? 0) > 0, `mẫu ${soLa} lá không gặp ca "${ca}" — nới mẫu quét`);

console.log(`  ${soLa} lá; ca gặp: ${CA.map((c) => `${c}=${dem[c] ?? 0}`).join(', ')}`);
if (loi) {
  console.error(`\n✗ ${loi} lỗi`);
  process.exit(1);
}
console.log('\n✓ xét cung xanh');
