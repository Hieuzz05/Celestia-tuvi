/**
 * ĐƯỜNG FOCUSED — điều phối một lượt chat (CEL-186 vé B, mục 8 + 15).
 *
 * `traLoiCoCanCu` rẽ sang đây khi `CELES_FOCUSED_CHAT=1`. Trả đúng kiểu
 * `KetQuaTraLoi` để route không phải biết có hai đường: `van` rỗng vẫn là tín
 * hiệu hỏng (502 + hoàn lượt), `coCauTruc.goiYTiep` vẫn là chip.
 *
 * Thứ tự:
 *   kế hoạch (luật, kế thừa chủ đề qua chip) → phân khuôn → mốc thời gian
 *   → F2 / D / hỏi lại nhuận: trả ngay bằng câu mã, KHÔNG truy hồi, KHÔNG gọi model
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
import { CAU_CUOI_NAM, cauHaiVe, cauHoiNhuan, cauKhiNao, cauThangDaQua, cauVanRieng, chipCuoiNam, type CauMa } from './cau-ma';
import { chayFocused } from './chay';
import { lapKeHoachFocused } from './ke-thua';
import type { NguCanhKiem } from './kiem';
import { boiCanhThoiGian, phanKhuon, type BoiCanhThoiGian, type PhanLoai } from './phan-loai';
import type { MocTinhSan } from './prompt';
import { goiCoPhucDuc, khoaTen, tapTenTuGoi } from './quet-ten';

/** Ghi vào `phienBan` của vết, KHÔNG vào khoá đệm nào (mục 8). */
export const PHIEN_BAN_FOCUSED = 'focused-2026.10.1';

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
  bayGio: ThoiDiemAm
): string | undefined {
  if (tg.thang) return `Tháng ${tg.thang.thang}${tg.thang.nhuan === 'nhuan' ? ' nhuận' : ''} âm`;
  if (tg.cuoiNam) return `Từ giờ đến hết năm ${canChiCuaNam(bayGio.nam)}`;
  const pv = keHoach.phamViThoiGian;
  if (pv === 'nam' || pv === 'gan') return tg.namHieuLuc === bayGio.nam ? 'Năm nay' : `Năm ${tg.namHieuLuc}`;
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
): Promise<KetQuaTraLoi> {
  const batDau = Date.now();
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

  // Lượt một: chỉ luật, đủ để phân khuôn và bắt F2 / D trước mọi việc tốn kém.
  const so = lapKeHoachFocused(dauVaoKeHoach);
  const phanLoaiSo = phanKhuon({ cauHoi: vao.cauHoi, keHoach: so.keHoach, doiTuong: so.doiTuong });
  const thoiGianSo = boiCanhThoiGian({ cauHoi: vao.cauHoi, keHoach: so.keHoach, namXem: vao.namXem, bayGio });

  const traNgay = (cm: CauMa, model: string, khuon: PhanLoai['khuon']): KetQuaTraLoi => {
    const van = mucAnToan === 'SENSITIVE' ? datMienTruTamLy(cm.cau) : cm.cau;
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
    };
  };

  if (phanLoaiSo.khuon === 'F2' && so.doiTuong) return traNgay(cauVanRieng(so.doiTuong), 'focused-f2', 'F2');
  if (phanLoaiSo.khuon === 'D') return traNgay(cauKhiNao(), 'focused-d', 'D');
  if (thoiGianSo.thang?.nhuan === 'can-hoi') {
    return traNgay(cauHoiNhuan(thoiGianSo.thang, bayGio.nam), 'focused-nhuan', phanLoaiSo.khuon);
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

  const tapTen = tapTenTuGoi(goi.duKien, keHoach.yDinh === 'tra-cuu' ? [vao.cauHoi] : []);
  // Prompt chỉ thấy đầu mốc mà guard cho phép gọi tên — đưa tên rồi bỏ câu là tự làm khó mình.
  const nghiengPrompt = nghieng
    ? { ...nghieng, dauMoc: nghieng.dauMoc.filter((d) => tapTen.has(khoaTen(d.ten))) }
    : null;

  // Câu mã đứng đầu (E, N2, N4) và chip mã.
  const cauMa: string[] = [];
  let chipMa: string[] | undefined;
  if (phanLoai.khuon === 'E' && phanLoai.haiVe) {
    const e = cauHaiVe(phanLoai.haiVe);
    cauMa.push(e.cau);
    chipMa = e.chip;
  }
  if (thoiGian.thang?.trangThai === 'da-qua') cauMa.push(cauThangDaQua(thoiGian.thang));
  if (thoiGian.cuoiNam) cauMa.push(CAU_CUOI_NAM);

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
    mocChot: mocChoChot(thoiGian, keHoach, bayGio),
    cauMa,
    chipMa,
    chipCuoiNam: thoiGian.cuoiNam ? (g) => chipCuoiNam(bayGio.nam, g) : undefined,
    chipTruoc: chipTruocTu(lichSu),
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
      nghieng: nghiengPrompt,
      phanLoai,
      mucAnToan,
      moc,
      laTiepTuChip: vao.laTiepTuChip === true,
      cauMa,
    },
    ctx,
    tenSua: nghiengPrompt ? [...nghiengPrompt.dauMoc.map((d) => d.ten), ...nghiengPrompt.cachCuc] : [],
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
      ? loiDiTiep({
          chuDe: keHoach.chuDe,
          lopHan: keHoach.lopHan,
          yDinh: keHoach.yDinh,
          cungTrongTam: keHoach.cungLienQuan[0],
        })
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
  };
}
