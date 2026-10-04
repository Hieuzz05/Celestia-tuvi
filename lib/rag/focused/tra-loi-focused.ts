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

import { bayGioAm, canChiCuaNam, type ThoiDiemAm } from '@/lib/tuvi/bay-gio';
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
import { CAU_CUOI_NAM, cauHaiVe, cauNhuanChuaTach, cauThangDaQua, cauThangDuong, chipCuoiNam, hoiLaiVanRieng, type CauMa } from './cau-ma';
import { chayFocused, type VetFocused } from './chay';
import { chanChuaHopTuoi, chanTruocSinh } from './gioi-han';
import { lapKeHoachFocused } from './ke-thua';
import { cauKetLuanNgoaiTam, nhanDangNgoaiTam } from './ngoai-tam';
import { datMienTruTheoNgonNgu, loiDiTheoNgonNgu, type NgonNgu } from './ngon-ngu';
import type { NguCanhKiem } from './kiem';
import { boiCanhThoiGian, phanKhuon, type BoiCanhThoiGian, type PhanLoai } from './phan-loai';
import { tenDuocGoiTrongLuot, type MocTinhSan } from './prompt';
import { goiCoPhucDuc } from './quet-ten';

/** Ghi vào `phienBan` của vết, KHÔNG vào khoá đệm nào (mục 8). */
export const PHIEN_BAN_FOCUSED = 'focused-2026.10.10';

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

/** Tiền tố thời gian cho câu chốt dự phòng — rỗng khi câu không có mốc. */
export function mocChoChot(
  tg: BoiCanhThoiGian,
  keHoach: Pick<KeHoachTruyVan, 'phamViThoiGian'>,
  bayGio: ThoiDiemAm,
  nn: NgonNgu = 'vi'
): string | undefined {
  const en = nn === 'en';
  // Tháng dương: câu mở đầu do mã viết đã nêu tháng, năm — chốt không lặp lại.
  if (tg.thang?.duong) return en ? 'That month' : 'Tháng đó';
  if (tg.thang) {
    const nhuan = tg.thang.nhuan === 'nhuan';
    return en
      ? `In ${nhuan ? 'leap ' : ''}lunar month ${tg.thang.thang}`
      : `Tháng ${tg.thang.thang} âm${nhuan ? ' nhuận' : ''}`;
  }
  if (tg.cuoiNam) return en ? 'From now until the end of this lunar year' : `Từ giờ đến hết năm ${canChiCuaNam(bayGio.nam)}`;
  const pv = keHoach.phamViThoiGian;
  if (pv === 'nam' || pv === 'gan') {
    if (tg.namHieuLuc === bayGio.nam) return en ? 'This year' : 'Năm nay';
    return en ? `In ${tg.namHieuLuc}` : `Năm ${tg.namHieuLuc}`;
  }
  return undefined;
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

/** Kết quả kèm vết của vòng gọi model — lượt trả bằng mã không có vết. */
export type KetQuaFocused = KetQuaTraLoi & { vetFocused?: VetFocused };

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

  const traNgay = (cm: CauMa, model: string, khuon: PhanLoai['khuon'], khongTinhLuot = false): KetQuaTraLoi => {
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
  // Đã chọn tháng nhuận: engine chưa tách nguyệt hạn tháng nhuận → dừng, KHÔNG đọc tháng thường thay vào.
  if (thoiGianSo.thang?.nhuan === 'nhuan') {
    return traNgay(cauNhuanChuaTach(thoiGianSo.thang, bayGio.nam, nn), 'focused-nhuan-chua-tach', phanLoaiSo.khuon);
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
  const phanLoai = phanKhuon({ cauHoi: vao.cauHoi, keHoach: keHoachGoc, doiTuong });
  const thoiGian = boiCanhThoiGian({ cauHoi: vao.cauHoi, keHoach: keHoachGoc, namXem: vao.namXem, bayGio });
  // Lưới thứ hai: kế hoạch đầy đủ (model phân loại) có thể ra tháng khác lượt một.
  const chanHai = gioiHan(thoiGian, keHoachGoc, doiTuong, phanLoai.khuon, false);
  if (chanHai) return chanHai;
  if (thoiGian.thang?.nhuan === 'nhuan') {
    return traNgay(cauNhuanChuaTach(thoiGian.thang, bayGio.nam, nn), 'focused-nhuan-chua-tach', phanLoai.khuon);
  }
  const keHoach = themLopChoThang(keHoachGoc);

  const namHieuLuc = thoiGian.namHieuLuc;
  const thangHieuLuc = thoiGian.thang?.thang ?? vao.thangXem;

  const { duKien } = chonBoiCanh({
    laSo: vao.laSo,
    keHoach,
    namXem: namHieuLuc,
    thangXem: thangHieuLuc,
    focused: true,
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

  const nghieng: NghiengVe | null =
    phanLoai.khuon === 'G'
      ? null
      : tinhNghiengVe({
          laSo: vao.laSo,
          chuDe: keHoach.chuDe,
          lopHan: keHoach.lopHan,
          namXem: namHieuLuc,
          thangXem: thangHieuLuc,
          cungChinh: doiTuong?.cung,
          focused: true,
        });

  // Tên được phép gọi: chỉ những gì prompt của lượt này thực sự in — chữ dữ kiện, khối
  // nghiêng (đầu mốc có tên, cách cục), câu tra cứu. `d.sao` không cấp quyền (xem `nghiengHienThi`).
  const { tapTen, tenHien } = tenDuocGoiTrongLuot({
    goi,
    nghieng,
    khuon: phanLoai.khuon,
    cauTraCuu: keHoach.yDinh === 'tra-cuu' ? vao.cauHoi : undefined,
  });

  // Câu mã đứng đầu (E, N2, N4) và chip mã.
  const cauMa: string[] = [];
  let chipMa: string[] | undefined;
  if (phanLoai.khuon === 'E' && phanLoai.haiVe) {
    const e = cauHaiVe(phanLoai.haiVe, nn);
    cauMa.push(e.cau);
    chipMa = e.chip;
  }
  // Tháng dương: nói rõ đang đọc tháng âm nào (gộp luôn ý "đã qua"). Tháng âm nói rõ: câu N2 đã duyệt.
  if (thoiGian.thang?.duong) cauMa.push(cauThangDuong(thoiGian.thang, nn));
  else if (thoiGian.thang?.trangThai === 'da-qua') cauMa.push(cauThangDaQua(thoiGian.thang, nn));
  if (thoiGian.cuoiNam) cauMa.push(CAU_CUOI_NAM[nn]);
  // Hỏi danh tính bạn đời ("chồng tôi có phải tên X"): câu kết luận đã duyệt
  // (brief §11) đứng đầu và thay câu chốt model — model không được xác nhận tên.
  const ngoaiTam = nhanDangNgoaiTam(vao.cauHoi);
  if (ngoaiTam) cauMa.unshift(cauKetLuanNgoaiTam(vao.cauHoi, ngoaiTam, nn));

  const ctx: NguCanhKiem = {
    cauHoi: vao.cauHoi,
    phanLoai,
    mucAnToan,
    chuDe: keHoach.chuDe,
    doiTuong,
    tapTen,
    phucDucLaSao: goiCoPhucDuc(goi.duKien),
    maHopLe: new Set(goi.duKien.map((d) => d.id)),
    nghieng,
    thoiGian,
    tuoiHopLe: tuoiTrongGoi(goi),
    mocChot: mocChoChot(thoiGian, keHoach, bayGio, nn),
    cauMa,
    chipMa,
    // D đọc mức năm: lối đi tiếp là năm sau, không phải một tháng.
    chipCuoiNam:
      thoiGian.cuoiNam || (phanLoai.khuon === 'D' && namHieuLuc === bayGio.nam)
        ? (g) => chipCuoiNam(bayGio.nam, g, nn)
        : undefined,
    chipTruoc: chipTruocTu(lichSu),
    boChotModel: !!ngoaiTam,
    maNguyetHan: new Set(goi.duKien.filter((d) => d.loai === 'nguyet-han').map((d) => d.id)),
    ngonNgu: nn,
  };

  const moc: MocTinhSan = {
    bayGio,
    thoiGian,
    doiDaiVanSauTet: thoiGian.cuoiNam ? doiDaiVanSauTet(vao.laSo, namHieuLuc) : undefined,
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
    },
    ctx,
    tenSua: tenHien,
    batDau,
  });
  const doTreModel = Date.now() - truocModel;

  const coCauTruc: TraLoiCoCauTruc | null = kq.kiem
    ? {
        ketLuan: kq.kiem.cauChot || undefined,
        tomTat: kq.kiem.cauChot || cauMa.join(' '),
        // Route đọc `yChinh` cho phần căn cứ của quản trị; Focused không có mức chắc chắn (mục 13.9).
        yChinh: kq.kiem.cau.map((c) => ({ tieuDe: '', noiDung: c.noiDung, maDuKien: c.maDuKien, maNguon: [] })),
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
    soYBiBo: kq.kiem?.bo.length ?? 0,
    provider: kq.provider,
    model: kq.model,
    runId,
    khoTrong: kqTruyHoi.khoTrong,
    phienBan: phienBanFocused(phienBan(), phanLoai.khuon),
    doTreMs: { truyHoi: kqTruyHoi.doTreMs, model: doTreModel, tong: Date.now() - batDau },
    // Chỉ cho scripts/eval-focused.ts đọc (thử lại, dự phòng, chiều thô). Route chọn trường, không gửi khoá này.
    vetFocused: kq.vet,
  };
}
