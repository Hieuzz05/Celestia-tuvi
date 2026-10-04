/**
 * ĐƯỜNG FOCUSED — điều phối một lượt chat (CEL-186 vé B, mục 8 + 15).
 *
 * `traLoiCoCanCu` rẽ sang đây khi `CELES_FOCUSED_CHAT=1`. Trả đúng kiểu
 * `KetQuaTraLoi` để route không phải biết có hai đường: `van` rỗng vẫn là tín
 * hiệu hỏng (502 + hoàn lượt), `coCauTruc.goiYTiep` vẫn là chip.
 *
 * Thứ tự:
 *   kế hoạch (luật, kế thừa chủ đề qua chip) → phân khuôn → mốc thời gian
 *   → trước ngày sinh / chưa hợp tuổi (ngoại lệ tạm): câu mã, KHÔNG tính lượt
 *   → F2 (hỏi lại, KHÔNG tính lượt) / tháng nhuận: câu mã, KHÔNG truy hồi, KHÔNG gọi model
 *   → mọi khuôn khác, kể cả D ("khi nào"), đi qua model (chủ dự án 04/10)
 *   → kế hoạch lượt hai (tên cách cục, có thể gọi model phân loại)
 *   → N1 → bối cảnh lá số → truy hồi → gói → nghiêng → prompt → chạy + guard.
 *
 * Không đụng khoá đệm: đường này không đọc, không ghi `noi_dung_ai` ngoài
 * hai lần ĐỌC sổ kết luận mà đường STANDARD cũng đọc.
 */

import { bayGioAm, type ThoiDiemAm } from '@/lib/tuvi/bay-gio';
import { cungDaiVan } from '@/lib/tuvi/ansao';
import type { TinNhan } from '@/lib/ai/prompt';
import { datMienTruTamLy, doAnToan } from '../an-toan';
import { dungGoiBangChung, type GoiBangChung, type TraLoiCoCauTruc } from '../bang-chung';
import { chonBoiCanh, saoChinhTheoCung, tenCachCucCho } from '../boi-canh-la-so';
import { loiDiTiep } from '../hinh-dang-tra-loi';
import { tinhNghiengVe, type NghiengVe } from '../nghieng-ve';
import { ghiLanTruyHoi } from '../nhat-ky';
import { lapKeHoachDayDu, type KeHoachTruyVan, type LopHan } from '../planner';
import { truyHoi } from '../truy-hoi';
import type { DauVaoTraLoi, KetQuaTraLoi } from '../tra-loi';
import { chipHaiVe, cauNhuanChuaTach, chipCuoiNam, hoiLaiVanRieng, type CauMa } from './cau-ma';
import { chayFocused, type VetFocused } from './chay';
import { chanChuaHopTuoi, chanTruocSinh } from './gioi-han';
import { lapKeHoachFocused } from './ke-thua';
import { cauKetLuanNgoaiTam, nhanDangNgoaiTam } from './ngoai-tam';
import { datMienTruTheoNgonNgu, loiDiTheoNgonNgu, type NgonNgu } from './ngon-ngu';
import { tinhMocHopLe, type NguCanhKiem } from './kiem';
import type { BanNhap } from './hop-dong';
import { gopHuongThang, nhomCuaHuong, type HuongThang, type NhomHuong } from './chot-huong';
import { boiCanhThoiGian, phanKhuon, type BoiCanhThoiGian, type PhanLoai } from './phan-loai';
import { tenDuocGoiTrongLuot, type MocTinhSan } from './prompt';
import { goiCoPhucDuc } from './quet-ten';
import { demAmTiet, usdUocTinh, type ThoiGianVet, type VetPreview } from './vet';

/** Ghi vào `phienBan` của vết, KHÔNG vào khoá đệm nào (mục 8). */
export const PHIEN_BAN_FOCUSED = 'focused-2026.10.13';

export const focusedBat = () => process.env.CELES_FOCUSED_CHAT === '1';

/* ------------------------------------------------------------ tiện ích */

/** Khoảng tuổi được phép nêu: đại vận và tuổi âm của năm có trong gói. */
export function tuoiTrongGoi(goi: Pick<GoiBangChung, 'duKien'>): [number, number][] {
  const ra: [number, number][] = [];
  for (const d of goi.duKien) {
    if (d.loai === 'dai-van') {
      const m = /(\d+)\s*[–-]\s*(\d+)\s*tuổi/u.exec(d.noiDung);
      if (m) ra.push([Number(m[1]), Number(m[2])]);
    } else if (d.loai === 'luu-nien') {
      const m = /\((\d+)\s*tuổi âm\)/u.exec(d.noiDung);
      if (m) ra.push([Number(m[1]), Number(m[1])]);
    }
  }
  return ra;
}

/**
 * N1: hỏi một tháng thì đọc cả nền đại vận và năm của tháng ấy. Sao chép kế
 * hoạch, không sửa planner (mục 14.8).
 */
export function themLopChoThang(keHoach: KeHoachTruyVan): KeHoachTruyVan {
  if (keHoach.phamViThoiGian !== 'thang') return keHoach;
  const lop = new Set<LopHan>(keHoach.lopHan);
  lop.add('dai-van');
  lop.add('luu-nien');
  return { ...keHoach, lopHan: [...lop] };
}

/**
 * Chip lượt trước không nằm trong lịch sử (route chỉ gửi văn), nên lấy câu
 * người dùng vừa hỏi — đó là chip họ vừa bấm, hoặc câu họ đã tự gõ. Gợi lại
 * đúng câu ấy thì không còn "đi sâu một lớp".
 */
function chipTruocTu(lichSu: readonly TinNhan[]): string[] {
  return lichSu
    .filter((t) => t.vaiTro === 'nguoi-dung')
    .slice(-3)
    .map((t) => t.noiDung.trim());
}

/** Sau Tết của năm đang đọc, người hỏi bước sang đại vận khác. */
function doiDaiVanSauTet(laSo: DauVaoTraLoi['laSo'], namHieuLuc: number): boolean {
  const tuoi = namHieuLuc - laSo.thongTin.amLich.nam + 1;
  const nay = cungDaiVan(laSo, tuoi);
  const sau = cungDaiVan(laSo, tuoi + 1);
  return !!nay && !!sau && nay.tenCung !== sau.tenCung;
}

/**
 * Kết quả kèm vết của vòng gọi model (`vetFocused`, lượt trả bằng mã không có) và vết
 * Preview (`vetPreview`, mọi lượt — route ghi nó qua `ghiVetPreview`, spec 5.4).
 */
export type KetQuaFocused = KetQuaTraLoi & {
  vetFocused?: VetFocused;
  vetPreview?: VetPreview;
  /** Bản nháp đã qua validator — chỉ bộ đo đọc (claims, chiều) */
  banNhap?: BanNhap;
  /** Chiều engine đã chốt của lượt — bộ đo so với `claims[0].direction` */
  huongEngine?: NhomHuong;
};

/** Mục tiêu thời gian cho vết: chỉ loại và số. Không nêu tháng = năm hiệu lực (spec v2 §3.1). */
function thoiGianVet(tg: BoiCanhThoiGian): ThoiGianVet {
  return tg.thang ? tg.thang.muc : { loai: 'nam', nam: tg.namHieuLuc };
}

/** Cửa sổ âm cho vết: mã, số, chiều — không ngày. */
function cuaSoVet(tg: BoiCanhThoiGian, h?: HuongThang | null): VetPreview['cuaSo'] {
  if (!tg.thang) return undefined;
  return tg.thang.cuaSo.map((w) => {
    const nhom = !h ? undefined : h.kieu === 'mot-chieu' ? h.nhom : h.theoCuaSo.find((x) => x.cuaSo === w.ma)?.nhom;
    return { ma: w.ma, thangAm: w.thangAm, nhuan: w.nhuan, soNgay: w.soNgay, ...(nhom ? { nhom } : {}) };
  });
}

const phienBanFocused = (base: Record<string, string>, khuon: PhanLoai['khuon']) => ({
  ...base,
  focused: khuon,
  phienBanFocused: PHIEN_BAN_FOCUSED,
});

/* ---------------------------------------------------------- điều phối */

export async function traLoiFocused(
  vao: DauVaoTraLoi,
  phienBan: () => Record<string, string>,
  docSoKetLuan: (namHieuLuc: number) => Promise<string[]>,
  bayGio: ThoiDiemAm = bayGioAm()
): Promise<KetQuaFocused> {
  const batDau = Date.now();
  const nn: NgonNgu = vao.ngonNgu === 'en' ? 'en' : 'vi';
  const lichSu = vao.lichSu ?? [];
  const mucAnToan = vao.mucAnToan ?? doAnToan(vao.cauHoi).muc;
  const saoTheoCung = saoChinhTheoCung(vao.laSo);
  const dauVaoKeHoach = {
    cauHoi: vao.cauHoi,
    laTiepTuChip: vao.laTiepTuChip,
    lichSu,
    saoTheoCung,
    namXem: vao.namXem,
    thangXem: vao.thangXem,
  };

  // Lượt một: chỉ luật, đủ để phân khuôn và bắt F2 trước mọi việc tốn kém.
  const so = lapKeHoachFocused(dauVaoKeHoach);
  const phanLoaiSo = phanKhuon({ cauHoi: vao.cauHoi, keHoach: so.keHoach, doiTuong: so.doiTuong });
  const thoiGianSo = boiCanhThoiGian({ cauHoi: vao.cauHoi, keHoach: so.keHoach, namXem: vao.namXem, bayGio });

  const vetHieu = (kh: KeHoachTruyVan, khuon: PhanLoai['khuon'], coDoiTuong: boolean, tg: BoiCanhThoiGian, nguon: string) => ({
    chuDe: kh.chuDe,
    yDinh: kh.yDinh,
    khuon,
    coDoiTuong,
    thoiGian: thoiGianVet(tg),
    nguon,
    giaiThichLuotTruoc: false,
    coChoHoiLai: khuon === 'F2',
  });
  const nguonSo = so.keThuaTu ? 'ke-thua' : 'luat';

  const traNgay = (cm: CauMa, model: string, khuon: PhanLoai['khuon'], khongTinhLuot = false): KetQuaFocused => {
    const van = mucAnToan === 'SENSITIVE' ? datMienTruTheoNgonNgu(cm.cau, nn, datMienTruTamLy) : cm.cau;
    const coCauTruc: TraLoiCoCauTruc = { ketLuan: cm.cau, tomTat: cm.cau, yChinh: [], goiYTiep: cm.chip };
    return {
      van,
      loiDi: cm.loiDi,
      coCauTruc,
      // Gói rỗng nhưng đủ trường: nhánh quản trị ở route đọc `goi.duKien`, `phienBan.engine`.
      goi: dungGoiBangChung(vao.cauHoi, so.keHoach, [], []),
      kiemDuyet: null,
      ngonNgu: null,
      soYBiBo: 0,
      provider: 'ma',
      model,
      runId: null,
      khoTrong: false,
      phienBan: phienBanFocused(phienBan(), khuon),
      doTreMs: { truyHoi: 0, model: 0, tong: Date.now() - batDau },
      ...(khongTinhLuot ? { khongTinhLuot: true } : {}),
      vetPreview: {
        requestId: vao.requestId ?? '',
        phienBan: PHIEN_BAN_FOCUSED,
        loiRa: `ma-${model}`,
        hieu: vetHieu(so.keHoach, khuon, !!so.doiTuong, thoiGianSo, nguonSo),
        hoanCanhSo: 0,
        ...(thoiGianSo.thang ? { cuaSo: cuaSoVet(thoiGianSo) } : {}),
        maDuKien: [],
        maNguon: [],
        chunkIds: [],
        lan: [],
        msTong: Date.now() - batDau,
        msTruyHoi: 0,
      },
    };
  };

  // AGE-01 (dữ kiện) / AGE-02 (ngoại lệ tạm, đóng băng): dừng bằng mã, không tính lượt.
  // Mọi lối dừng ở tệp này phải có trong danh sách của `scripts/test-loi-chi-ma.ts`.
  // `luotMot`: chủ đề lượt một là của luật (tất định); lượt hai có thể do model phân loại — không chặn theo chủ đề nữa.
  const gioiHan = (tg: BoiCanhThoiGian, kh: KeHoachTruyVan, dt: typeof so.doiTuong, khuon: PhanLoai['khuon'], luotMot: boolean) => {
    const truoc = chanTruocSinh(vao.laSo, tg, kh, nn);
    if (truoc) return traNgay(truoc, 'focused-truoc-sinh', khuon, true);
    const tuoi = chanChuaHopTuoi(vao.laSo, tg, vao.cauHoi, kh, dt, nn, luotMot);
    if (tuoi) return traNgay(tuoi, 'focused-chua-hop-tuoi', khuon, true);
    return null;
  };

  const chanSo = gioiHan(thoiGianSo, so.keHoach, so.doiTuong, phanLoaiSo.khuon, true);
  if (chanSo) return chanSo;

  // F2: chưa biết lá số đang mở là của ai — hỏi lại, không tính lượt; chip đầu là câu gốc trên chủ lá số.
  if (phanLoaiSo.khuon === 'F2' && so.doiTuong) {
    return traNgay(hoiLaiVanRieng(vao.cauHoi, so.doiTuong, nn), 'focused-f2', 'F2', true);
  }
  // Có cửa sổ tháng nhuận: engine chưa tách nguyệt hạn tháng nhuận → dừng, KHÔNG đọc tháng thường
  // thay vào, không tính lượt (spec v2 §3.3).
  if (thoiGianSo.thang?.cuaSo.some((w) => w.nhuan)) {
    return traNgay(cauNhuanChuaTach(thoiGianSo.thang, bayGio.nam, nn), 'focused-nhuan-chua-tach', phanLoaiSo.khuon, true);
  }

  // Lượt hai: tên cách cục của cung trọng tâm, như đường STANDARD.
  const tenCachCuc = tenCachCucCho(vao.laSo, so.keHoach.cungLienQuan[0]);
  const hai = lapKeHoachFocused({ ...dauVaoKeHoach, tenCachCuc });
  let keHoachGoc = hai.keHoach;
  // Chỉ câu tự đứng, chưa rõ chủ đề mới nhờ model phân loại. Câu có người được
  // hỏi hay câu kế thừa đã chắc chủ đề — để model đoán lại là mở lại cờ #2.
  if (!keHoachGoc.chacChan && !hai.doiTuong && !hai.keThuaTu && vao.dungModelPhanLoai !== false) {
    keHoachGoc = await lapKeHoachDayDu({
      cauHoi: vao.cauHoi,
      saoTheoCung,
      tenCachCuc,
      namXem: vao.namXem,
      thangXem: vao.thangXem,
    });
  }
  const doiTuong = hai.doiTuong;
  const nguonKeHoach = hai.keThuaTu ? 'ke-thua' : keHoachGoc === hai.keHoach ? 'luat' : 'model-phan-loai';
  const thoiGian = boiCanhThoiGian({ cauHoi: vao.cauHoi, keHoach: keHoachGoc, namXem: vao.namXem, bayGio });
  // Tháng mà planner bỏ sót ("this October"): đọc như câu hỏi một tháng. Sao chép, không sửa planner.
  if (thoiGian.thang && keHoachGoc.phamViThoiGian !== 'thang') {
    keHoachGoc = {
      ...keHoachGoc,
      phamViThoiGian: 'thang',
      lopHan: [...new Set<LopHan>([...keHoachGoc.lopHan, 'nguyet-han'])],
    };
  }
  const phanLoai = phanKhuon({ cauHoi: vao.cauHoi, keHoach: keHoachGoc, doiTuong });
  // Lưới thứ hai: kế hoạch đầy đủ (model phân loại) có thể ra tháng khác lượt một.
  const chanHai = gioiHan(thoiGian, keHoachGoc, doiTuong, phanLoai.khuon, false);
  if (chanHai) return chanHai;
  if (thoiGian.thang?.cuaSo.some((w) => w.nhuan)) {
    return traNgay(cauNhuanChuaTach(thoiGian.thang, bayGio.nam, nn), 'focused-nhuan-chua-tach', phanLoai.khuon, true);
  }
  const keHoach = themLopChoThang(keHoachGoc);

  const namHieuLuc = thoiGian.namHieuLuc;
  const cuaSo = thoiGian.thang?.cuaSo;
  const thangHieuLuc = cuaSo?.[0]?.thangAm ?? vao.thangXem;

  const { duKien, maTheoCuaSo } = chonBoiCanh({
    laSo: vao.laSo,
    keHoach,
    namXem: namHieuLuc,
    thangXem: thangHieuLuc,
    focused: true,
    ...(cuaSo?.length ? { cuaSo } : {}),
  });

  const kqTruyHoi = await truyHoi(keHoach, vao.cauHinhTruyHoi);
  const runId =
    vao.ghiNhatKy === false
      ? null
      : await ghiLanTruyHoi(keHoach, kqTruyHoi, {
          requestId: vao.requestId,
          cauHoi: vao.cauHoi,
          namHieuLuc,
          thangHieuLuc,
        });

  const goi = dungGoiBangChung(vao.cauHoi, keHoach, duKien, kqTruyHoi.daChon);
  const daNoiTruoc = await docSoKetLuan(namHieuLuc);

  // Hướng theo từng cửa sổ âm (spec v2 §3.3): cùng chiều → một hướng; khác chiều → hai nửa,
  // không có hướng chung cho claims[0], mỗi nửa kiểm theo timeRefs.
  const nghiengDs: { cuaSo: string; n: NghiengVe }[] =
    phanLoai.khuon === 'G'
      ? []
      : (cuaSo?.length ? cuaSo : [null]).flatMap((w) => {
          const n = tinhNghiengVe({
            laSo: vao.laSo,
            chuDe: keHoach.chuDe,
            lopHan: keHoach.lopHan,
            namXem: w?.namAm ?? namHieuLuc,
            thangXem: w?.thangAm ?? thangHieuLuc,
            cungChinh: doiTuong?.cung,
            focused: true,
          });
          return n ? [{ cuaSo: w?.ma ?? '', n }] : [];
        });
  const huongThang: HuongThang | null = cuaSo?.length
    ? gopHuongThang(nghiengDs.map((x) => ({ cuaSo: x.cuaSo, huong: x.n.huong })))
    : null;
  const nghieng: NghiengVe | null = huongThang?.kieu === 'hai-nua' ? null : (nghiengDs[0]?.n ?? null);

  // Tên được phép gọi: chỉ những gì prompt của lượt này thực sự in — chữ dữ kiện, khối
  // nghiêng (đầu mốc có tên, cách cục), câu tra cứu. `d.sao` không cấp quyền (xem `nghiengHienThi`).
  // Nhiều cửa sổ: hợp tên của mọi cửa sổ.
  const tapTen = new Set<string>();
  for (const x of nghiengDs.length ? nghiengDs.map((y) => y.n) : [null]) {
    const { tapTen: t } = tenDuocGoiTrongLuot({
      goi,
      nghieng: x,
      khuon: phanLoai.khuon,
      cauTraCuu: keHoach.yDinh === 'tra-cuu' ? vao.cauHoi : undefined,
    });
    for (const ten of t) tapTen.add(ten);
  }

  // Câu mã đứng đầu và chip mã. Spec v2 bỏ câu E / N2 / N4 do mã viết: model tự
  // nói giới hạn của quyết định, tháng đã qua, quãng cuối năm (prompt.ts).
  const cauMa: string[] = [];
  const chipMa = phanLoai.khuon === 'E' && phanLoai.haiVe ? chipHaiVe(phanLoai.haiVe, nn) : undefined;
  // Hỏi danh tính bạn đời ("chồng tôi có phải tên X"): câu đã duyệt (brief §11) đứng
  // đầu. Giữ là câu mã vì nó chỉ nói GIỚI HẠN ("lá số không xác nhận được tên"), không kết luận.
  const ngoaiTam = nhanDangNgoaiTam(vao.cauHoi);
  if (ngoaiTam) cauMa.unshift(cauKetLuanNgoaiTam(vao.cauHoi, ngoaiTam, nn));

  const mocHopLe = tinhMocHopLe({
    cauHoi: vao.cauHoi,
    thoiGian,
    namSinh: [vao.laSo.thongTin.nam, vao.laSo.thongTin.amLich.nam],
    vanGoi: [...goi.duKien.map((d) => d.noiDung), ...goi.bangChung.map((e) => e.noiDung)],
  });
  const ctx: NguCanhKiem = {
    cauHoi: vao.cauHoi,
    phanLoai,
    mucAnToan,
    chuDe: keHoach.chuDe,
    doiTuong,
    tapTen,
    phucDucLaSao: goiCoPhucDuc(goi.duKien),
    maHopLe: new Set(goi.duKien.map((d) => d.id)),
    maNguonHopLe: new Set(goi.bangChung.map((e) => e.id)),
    nghieng,
    thoiGian,
    tuoiHopLe: tuoiTrongGoi(goi),
    mocHopLeAnswer: mocHopLe.answer,
    mocHopLeChip: mocHopLe.chip,
    cauMa,
    chipMa,
    // D đọc mức năm: lối đi tiếp là năm sau, không phải một tháng.
    chipCuoiNam:
      thoiGian.cuoiNam || (phanLoai.khuon === 'D' && namHieuLuc === bayGio.nam)
        ? (g) => chipCuoiNam(bayGio.nam, g, nn)
        : undefined,
    chipTruoc: chipTruocTu(lichSu),
    maNguyetHan: new Set(goi.duKien.filter((d) => d.loai === 'nguyet-han').map((d) => d.id)),
    ...(huongThang ? { huongThang } : {}),
    ...(maTheoCuaSo ? { maTheoCuaSo } : {}),
    ngonNgu: nn,
  };

  const moc: MocTinhSan = {
    bayGio,
    thoiGian,
    doiDaiVanSauTet: thoiGian.cuoiNam ? doiDaiVanSauTet(vao.laSo, namHieuLuc) : undefined,
    huongThang,
    maTheoCuaSo,
  };

  const truocModel = Date.now();
  const kq = await chayFocused({
    prompt: {
      goi,
      cauHoiGoc: vao.cauHoi,
      lichSu,
      daNoiTruoc,
      nghieng,
      phanLoai,
      mucAnToan,
      moc,
      laTiepTuChip: vao.laTiepTuChip === true,
      cauMa,
      ngonNgu: nn,
    },
    ctx,
    batDau,
  });
  const doTreModel = Date.now() - truocModel;

  const lan = kq.vet.lan;
  const vetPreview: VetPreview = {
    requestId: vao.requestId ?? '',
    phienBan: PHIEN_BAN_FOCUSED,
    loiRa: kq.van ? 'ok' : '502',
    hieu: vetHieu(
      keHoach,
      phanLoai.khuon,
      !!doiTuong,
      thoiGian,
      nguonKeHoach
    ),
    hoanCanhSo: 0,
    ...(thoiGian.thang ? { cuaSo: cuaSoVet(thoiGian, huongThang) } : {}),
    maDuKien: goi.duKien.map((d) => d.id),
    maNguon: goi.bangChung.map((e) => e.id),
    chunkIds: kqTruyHoi.daChon.map((d) => d.chunkId),
    lan,
    ...(lan[0]?.loi.length ? { lyDoVietLai: lan[0].loi.map((l) => l.ma) } : {}),
    ...(kq.van && kq.banNhap
      ? {
          ketQua: {
            soKyTu: kq.van.length,
            soAmTiet: demAmTiet(kq.van),
            soClaim: kq.banNhap.claims.length,
            maClaim: [...new Set(kq.banNhap.claims.flatMap((c) => c.evidenceIds))],
            soChip: kq.chip.length,
          },
        }
      : {}),
    msTong: Date.now() - batDau,
    msTruyHoi: kqTruyHoi.doTreMs,
    usdUocTinh: usdUocTinh(lan),
  };

  const ban = kq.banNhap;
  const coCauTruc: TraLoiCoCauTruc | null = ban
    ? {
        ketLuan: ban.claims[0]?.claim,
        tomTat: ban.claims[0]?.claim || cauMa.join(' '),
        // Route đọc `yChinh` cho phần căn cứ của quản trị; Focused không có mức chắc chắn (mục 13.9).
        // `claims` không hiển thị — chỉ là căn cứ của bài (spec 2.2).
        yChinh: ban.claims.map((c) => ({
          tieuDe: '',
          noiDung: c.claim,
          maDuKien: c.evidenceIds.filter((m) => m.startsWith('F')),
          maNguon: c.evidenceIds.filter((m) => m.startsWith('E')),
        })),
        goiYTiep: kq.chip,
      }
    : null;

  return {
    van: kq.van,
    loiDi: kq.van
      ? loiDiTheoNgonNgu(
          loiDiTiep({
            chuDe: keHoach.chuDe,
            lopHan: keHoach.lopHan,
            yDinh: keHoach.yDinh,
            cungTrongTam: keHoach.cungLienQuan[0],
          }),
          nn
        )
      : [],
    coCauTruc,
    goi,
    kiemDuyet: null,
    ngonNgu: null,
    soYBiBo: 0,
    provider: kq.provider,
    model: kq.model,
    runId,
    khoTrong: kqTruyHoi.khoTrong,
    phienBan: phienBanFocused(phienBan(), phanLoai.khuon),
    doTreMs: { truyHoi: kqTruyHoi.doTreMs, model: doTreModel, tong: Date.now() - batDau },
    // Chỉ cho scripts/eval-focused.ts đọc (thử lại, dự phòng, chiều thô). Route chọn trường, không gửi khoá này.
    vetFocused: kq.vet,
    vetPreview,
    ...(ban ? { banNhap: ban } : {}),
    ...(nghieng ? { huongEngine: nhomCuaHuong(nghieng.huong) } : {}),
  };
}
