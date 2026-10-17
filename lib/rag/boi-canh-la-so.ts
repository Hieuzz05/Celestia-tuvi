import {
  cungDaiVan,
  cungNguyetHan,
  cungTieuHan,
  luuTinhTheoNam,
  tamPhuongTuChinh,
  type Cung,
  type LaSo,
} from '@/lib/tuvi/ansao';
import { canChiCuaNam } from '@/lib/tuvi/bay-gio';
import { nhanDangCachCuc } from '@/lib/tuvi/cach-cuc';
import { PHU_TINH_TRONG_YEU } from '@/lib/tuvi/phu-tinh-trong-yeu';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
import { luuTuHoaTheoNam, tuHoaDaiVan, tuHoaGoc, type HoaHan } from '@/lib/tuvi/tu-hoa-han';
import type { KeHoachTruyVan } from './planner';

/**
 * Chart Context Selector — chọn dữ kiện, không đổ cả lá số.
 *
 * Một lá số đầy đủ là 12 cung × chục sao. Nhét hết vào prompt thì model phải tự
 * tìm chỗ nào liên quan, và nó tìm sai thường xuyên hơn ta tưởng. Tệ hơn: không
 * có cách nào kiểm tra câu trả lời có bám vào dữ kiện thật hay không, vì dữ kiện
 * nào cũng "có trong lá số".
 *
 * Nên mỗi dữ kiện được cấp một mã F001, F002... Model phải trích mã khi khẳng
 * định điều gì, và validator đối chiếu lại. Cái gì không có mã thì không phải là
 * điều lá số nói.
 */

export interface DuKienLaSo {
  id: string;
  loai:
    | 'cung'
    | 'menh'
    | 'than'
    | 'cuc'
    | 'cach-cuc'
    | 'dai-van'
    | 'luu-nien'
    | 'nguyet-han'
    | 'tam-hop'
    /** Lưu tinh năm ở cung đang hỏi — CHỈ đường Focused (CEL-186 Vé B), nối cuối danh sách */
    | 'luu-tinh'
    /** Lưu tứ hoá theo can năm xem — CHỈ khi cờ lớp hạn bật (CEL-200), nối cuối danh sách */
    | 'luu-tu-hoa'
    /** Tứ hoá theo can cung đại vận — CHỈ khi cờ lớp hạn bật (CEL-200), nối cuối danh sách */
    | 'tu-hoa-dai-van'
    | 'tu-hoa-goc';
  /**
   * Lớp nguồn THỜI GIAN của dữ kiện: nó đúng cho cả đời, hay chỉ cho một quãng.
   * Không vào prompt (prompt chỉ in `id. noiDung`); dùng cho trace và cho bài
   * kiểm `scripts/test-lop-du-kien.ts`. Luật: dữ kiện `ban-menh` không đổi theo
   * năm xem và không được nói thay cho năm xem. Lỗi 05/10/2026: vòng Thái Tuế
   * của lá số gốc từng vào bài vận hạn như căn cứ của năm đang xem.
   * Gán bằng `LOP_THEO_LOAI`, nên không chỗ nào tự đặt tay được.
   */
  lop: LopDuKien;
  /** Câu mô tả dữ kiện, viết đủ để đứng một mình */
  noiDung: string;
  cung?: string;
  sao?: string[];
  /** Chỉ dữ kiện loai 'cach-cuc': tên được phép gọi thẳng trong bài */
  tenCachCuc?: string;
}

export type LopDuKien = 'ban-menh' | 'dai-han' | 'tieu-han' | 'luu-nien' | 'nguyet-han';

/**
 * Loại dữ kiện quyết định lớp thời gian. Mọi cách cục engine phát ra đều được
 * dựng từ sao gốc, nên chúng thuộc `ban-menh`, kể cả cách cục `loai: 'han'`.
 * `luu-nien` (loại) là dữ kiện TIỂU HẠN, còn `luu-tinh` mới là sao lưu NIÊN.
 */
const LOP_THEO_LOAI: Record<DuKienLaSo['loai'], LopDuKien> = {
  cuc: 'ban-menh',
  menh: 'ban-menh',
  than: 'ban-menh',
  cung: 'ban-menh',
  'tam-hop': 'ban-menh',
  'cach-cuc': 'ban-menh',
  'dai-van': 'dai-han',
  'luu-nien': 'tieu-han',
  'luu-tinh': 'luu-nien',
  // Hai hệ tên lớp (L9, phương án CEL-200): ở đây theo `LopDuKien` — `luu-nien` là
  // sao lưu / lưu hoá của năm, `dai-han` là lớp đại vận. Không phải `LopHan` của planner.
  'tu-hoa-goc': 'ban-menh',
  'luu-tu-hoa': 'luu-nien',
  'tu-hoa-dai-van': 'dai-han',
  'nguyet-han': 'nguyet-han',
};

/** "Hóa Lộc vào Thiên Đồng (cung Phúc Đức), …" — đúng sao, đúng cung như bảng sự thật lớp hạn */
function moTaHoaHan(ds: HoaHan[]): string {
  return ds.map((h) => `${h.hoa} vào ${h.sao} (cung ${h.tenCung})`).join(', ');
}

function motTaCung(c: Cung): string {
  const chinh = c.sao.filter((s) => s.loai === 'chinh-tinh');
  const tuHoa = c.sao.filter((s) => s.loai === 'tu-hoa');
  // Chỉ phụ tinh đủ sức đổi cách đọc một cung. Đưa cả 6-8 phụ tinh vào dữ kiện
  // thì model chép nguyên danh sách ấy vào bài — đó chính là "kê sao dài dòng".
  // Framework §5.1: phụ tinh thật sự có trọng lượng, không dump toàn bộ.
  const phu = c.sao.filter(
    (s) => s.loai !== 'chinh-tinh' && s.loai !== 'tu-hoa' && PHU_TINH_TRONG_YEU.has(s.ten)
  );

  const phan: string[] = [];
  phan.push(
    chinh.length
      ? `có ${chinh.map((s) => (s.doSang ? `${s.ten} (${s.doSang})` : s.ten)).join(', ')}`
      : 'vô chính diệu'
  );
  if (tuHoa.length) phan.push(`${tuHoa.map((s) => s.ten).join(', ')}`);
  if (phu.length) phan.push(`phụ tinh ${phu.map((s) => s.ten).join(', ')}`);
  if (c.coTuan) phan.push('gặp Tuần');
  if (c.coTriet) phan.push('gặp Triệt');

  return `Cung ${c.tenCung} (${c.chi}) ${phan.join('; ')}.`;
}

export interface DauVaoBoiCanh {
  laSo: LaSo;
  keHoach: KeHoachTruyVan;
  namXem: number;
  thangXem: number;
  /**
   * Đường Focused (CEL-186 Vé B). Thiếu = đường cũ, đúng từng byte như trước:
   * mục mới chỉ NỐI VÀO CUỐI, nên mã F### của các mục cũ không dịch.
   */
  focused?: boolean;
  /**
   * Cửa sổ âm của tháng đang hỏi (CEL-186 v2 §3.3, chỉ Focused). Thiếu = đúng
   * từng byte như trước. Có thì lưu niên mỗi năm âm một lần, nguyệt hạn mỗi cửa
   * sổ một lần, chung một bộ đếm F###.
   */
  cuaSo?: { ma: string; namAm: number; thangAm: number; nhuan: boolean; tuNgay: string; denNgay: string }[];
  /**
   * Câu vận hạn cân theo lớp hạn (CEL-200, cờ server `CELES_LOP_HAN`). Thiếu = đúng
   * từng byte như trước: hai mục tứ hoá theo hạn chỉ NỐI VÀO CUỐI.
   */
  lopHanMoi?: boolean;
}

export interface BoiCanhLaSo {
  duKien: DuKienLaSo[];
  /** Sao theo từng cung — planner dùng để viết lại truy vấn */
  saoTheoCung: Record<string, string[]>;
  /** Chỉ khi có `cuaSo`: mã nguyệt hạn + lưu niên của từng cửa sổ */
  maTheoCuaSo?: Record<string, string[]>;
}

/** Sao đáng đưa vào truy vấn: chính tinh và Tứ Hóa. Phụ tinh để dành cho dữ kiện. */
/**
 * Tên cách cục để đưa vào truy vấn.
 *
 * Tách riêng khỏi `chonBoiCanh` vì planner cần nó TRƯỚC khi có kế hoạch, còn
 * `chonBoiCanh` lại cần kế hoạch để biết cung trọng tâm. Hai bên gọi cùng một
 * engine nên không lệch nhau; chỉ khác ở chỗ planner chưa biết cung trọng tâm
 * cuối cùng, nên nó nhận danh sách của cung được đoán trước.
 */
export function tenCachCucCho(laSo: LaSo, cungTrongTam?: string): string[] {
  return nhanDangCachCuc(laSo, cungTrongTam).map((c) => c.ten);
}

export function saoChinhTheoCung(laSo: LaSo): Record<string, string[]> {
  const ra: Record<string, string[]> = {};
  for (const c of laSo.cungs) {
    ra[c.tenCung] = c.sao
      .filter((s) => s.loai === 'chinh-tinh' || s.loai === 'tu-hoa')
      .map((s) => s.ten);
  }
  return ra;
}

export function chonBoiCanh({ laSo, keHoach, namXem, thangXem, focused, cuaSo, lopHanMoi }: DauVaoBoiCanh): BoiCanhLaSo {
  const duKien: DuKienLaSo[] = [];
  let dem = 0;
  const them = (d: Omit<DuKienLaSo, 'id' | 'lop'>) => {
    dem += 1;
    duKien.push({ id: `F${String(dem).padStart(3, '0')}`, lop: LOP_THEO_LOAI[d.loai], ...d });
  };

  const tim = (ten: string) => laSo.cungs.find((c) => c.tenCung === ten);

  // Nền của mọi câu trả lời: Mệnh và Cục. Luôn có mặt dù hỏi gì.
  them({
    loai: 'cuc',
    noiDung: `${laSo.cuc.ten} (${laSo.cuc.so}), bản mệnh ${laSo.banMenh.ten}, ${laSo.amDuongThuanLy}, ${laSo.menhCucQuanHe}.`,
  });

  const cungMenh = laSo.cungs[laSo.menhIndex];
  them({ loai: 'menh', noiDung: motTaCung(cungMenh), cung: 'Mệnh', sao: cungMenh.sao.map((s) => s.ten) });

  /*
   * Cách cục — đặt NGAY SAU Mệnh và TRƯỚC các cung theo chủ đề.
   *
   * Thứ tự trong prompt là thứ tự ưu tiên model đọc, và đây là thứ đáng đọc
   * trước: một tổ hợp có tên nói được nhiều hơn hẳn một danh sách sao rời. Để
   * nó nằm sau mười dữ kiện cung thì model đã dựng xong luận điểm bằng sao lẻ
   * trước khi đọc tới.
   *
   * Cách cục `loai: 'han'` (hiện chỉ còn Tuần/Triệt án ngữ) chỉ vào prompt khi
   * câu hỏi thật sự đang nói về một quãng thời gian. Nó vẫn là dữ kiện GỐC, mang
   * lớp `ban-menh`. Tổ hợp vòng Thái Tuế (Tang Tuế Điếu, Mã gặp Tuế Phá) đã gỡ
   * khỏi engine, vì vòng của lá số gốc là vòng của năm sinh, không phải của năm
   * đang xem. Xem `theoHan` trong `lib/tuvi/cach-cuc.ts`.
   */
  const xetHan = keHoach.lopHan.some((l) => l !== 'ban-menh');
  for (const cc of nhanDangCachCuc(laSo, keHoach.cungLienQuan[0])) {
    if (cc.loai === 'han' && !xetHan) continue;
    them({
      loai: 'cach-cuc',
      noiDung: `Cách cục ${cc.ten} tại ${cc.cung}. ${cc.dieuKien}`,
      cung: cc.cung,
      sao: cc.sao,
      tenCachCuc: cc.ten,
    });
  }

  if (laSo.thanCuCung && laSo.thanCuCung !== 'Mệnh') {
    them({ loai: 'than', noiDung: `Thân cư ${laSo.thanCuCung}.`, cung: laSo.thanCuCung });
  }

  // Các cung planner chỉ ra — trừ Mệnh vì đã có ở trên
  for (const ten of keHoach.cungLienQuan) {
    if (ten === 'Mệnh') continue;
    const c = tim(ten);
    if (!c) continue;
    them({ loai: 'cung', noiDung: motTaCung(c), cung: ten, sao: c.sao.map((s) => s.ten) });
  }

  // Tam phương tứ chính của cung chủ đề: tử vi không đọc một cung đơn lẻ, cung
  // xung chiếu và nhị hợp cũng góp phần. Chỉ lấy cung đầu tiên trong danh sách
  // để không phình thành nửa lá số.
  const cungChinh = keHoach.cungLienQuan[0] ? tim(keHoach.cungLienQuan[0]) : undefined;
  if (cungChinh) {
    const { xungChieu, tamHop } = tamPhuongTuChinh(cungChinh.chiIndex);
    const nhom = [xungChieu, ...tamHop]
      .map((i) => laSo.cungs.find((c) => c.chiIndex === i))
      .filter((c): c is Cung => !!c && c.tenCung !== cungChinh.tenCung);
    const net = nhom
      .map((c) => {
        const chinh = c.sao.filter((s) => s.loai === 'chinh-tinh').map((s) => s.ten);
        return `${c.tenCung}: ${chinh.length ? chinh.join(', ') : 'vô chính diệu'}`;
      })
      .join('; ');
    if (net) {
      them({
        loai: 'tam-hop',
        noiDung: `Tam phương tứ chính của ${cungChinh.tenCung} — ${net}.`,
        cung: cungChinh.tenCung,
      });
    }
  }

  // Lớp hạn: chỉ thêm lớp mà planner đã xác định là liên quan. Hỏi "tính cách
  // tôi thế nào" không cần lưu niên; hỏi "năm nay ra sao" thì cần.
  const tuoiAm = namXem - laSo.thongTin.amLich.nam + 1;

  if (keHoach.lopHan.includes('dai-van')) {
    const dv = cungDaiVan(laSo, tuoiAm);
    if (dv?.daiVan) {
      them({
        loai: 'dai-van',
        noiDung: `Đại vận ${dv.daiVan.tuTuoi}–${dv.daiVan.denTuoi} tuổi đóng tại ${motTaCung(dv).replace(/^Cung /, 'cung ')}`,
        cung: dv.tenCung,
      });
    }
  }

  const maTheoCuaSo: Record<string, string[]> | undefined = cuaSo?.length ? {} : undefined;
  if (cuaSo?.length) {
    const dm = (iso: string) => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;
    const maNam = new Map<number, string>();
    if (keHoach.lopHan.includes('luu-nien')) {
      for (const namAm of new Set(cuaSo.map((w) => w.namAm))) {
        const tuoi = namAm - laSo.thongTin.amLich.nam + 1;
        const c = laSo.cungs[cungTieuHan(laSo, tuoi)];
        if (!c) continue;
        them({
          loai: 'luu-nien',
          noiDung: `Năm ${namAm} (${tuoi} tuổi âm) tiểu hạn tại ${motTaCung(c).replace(/^Cung /, 'cung ')}`,
          cung: c.tenCung,
        });
        maNam.set(namAm, duKien[duKien.length - 1].id);
      }
    }
    for (const w of cuaSo) {
      const ma: string[] = [];
      if (keHoach.lopHan.includes('nguyet-han')) {
        const c = laSo.cungs[cungNguyetHan(laSo, w.namAm - laSo.thongTin.amLich.nam + 1, w.thangAm)];
        if (c) {
          them({
            loai: 'nguyet-han',
            noiDung: `Tháng ${w.thangAm}${w.nhuan ? ' nhuận' : ''} âm lịch năm ${canChiCuaNam(w.namAm)} (${dm(w.tuNgay)}–${dm(w.denNgay)} dương lịch): nguyệt hạn tại ${motTaCung(c).replace(/^Cung /, 'cung ')}`,
            cung: c.tenCung,
          });
          ma.push(duKien[duKien.length - 1].id);
        }
      }
      const mn = maNam.get(w.namAm);
      if (mn) ma.push(mn);
      maTheoCuaSo![w.ma] = ma;
    }
  } else {
    if (keHoach.lopHan.includes('luu-nien')) {
      const i = cungTieuHan(laSo, tuoiAm);
      const c = laSo.cungs[i];
      if (c) {
        them({
          loai: 'luu-nien',
          noiDung: `Năm ${namXem} (${tuoiAm} tuổi âm) tiểu hạn tại ${motTaCung(c).replace(/^Cung /, 'cung ')}`,
          cung: c.tenCung,
        });
      }
    }

    if (keHoach.lopHan.includes('nguyet-han')) {
      const i = cungNguyetHan(laSo, tuoiAm, thangXem);
      const c = laSo.cungs[i];
      if (c) {
        them({
          loai: 'nguyet-han',
          noiDung: `Tháng ${thangXem}/${namXem} nguyệt hạn tại ${motTaCung(c).replace(/^Cung /, 'cung ')}`,
          cung: c.tenCung,
        });
      }
    }
  }

  /*
   * Lưu tinh năm rơi đúng cung đang hỏi (N1, chỉ Focused).
   *
   * Khối hướng nghiêng nêu lưu tinh làm căn cứ, nhưng gói cũ không có mục nào
   * chứa chúng — câu nêu "Lưu Thiên Mã" không trỏ được về F### nào. Chỉ 9 lưu
   * tinh engine có. Lưu tứ hoá đi riêng ở mục `luu-tu-hoa` cuối hàm, sau cờ lớp hạn.
   */
  if (focused && cungChinh && keHoach.lopHan.some((l) => l === 'luu-nien' || l === 'nguyet-han')) {
    const luu = luuTinhTheoNam(namXem).filter((s) => s.chiIndex === cungChinh.chiIndex);
    if (luu.length) {
      them({
        loai: 'luu-tinh',
        noiDung: `Năm ${namXem} lưu tinh rơi vào cung ${cungChinh.tenCung}: ${luu.map((s) => s.ten).join(', ')}.`,
        cung: cungChinh.tenCung,
        sao: luu.map((s) => s.ten),
      });
    }
  }

  /*
   * Tứ hoá theo hạn (CEL-200): căn cứ của lớp hạn, ngang tầng sao lưu (chủ dự án
   * chốt 16/10/2026). Đặt lên sao của lá số gốc nên mỗi cặp (hoá, sao) có cung thật;
   * câu trả lời nhắc lưu Hóa phải trỏ được về mục này.
   */
  if (lopHanMoi && xetHan) {
    them({ loai: 'tu-hoa-goc', noiDung: `Tứ hoá gốc: ${moTaHoaHan(tuHoaGoc(laSo))}.` });
    for (const nam of new Set(cuaSo?.length ? cuaSo.map((w) => w.namAm) : [namXem])) {
      const ganCuaSo = () => {
        for (const w of cuaSo ?? []) if (w.namAm === nam) maTheoCuaSo?.[w.ma]?.push(duKien[duKien.length - 1].id);
      };
      if (keHoach.lopHan.some((l) => l === 'luu-nien' || l === 'nguyet-han')) {
        if (focused && cuaSo?.length) {
          const tinh = luuTinhTheoNam(nam);
          them({ loai: 'luu-tinh', noiDung: `Năm ${nam} lưu tinh: ${tinh.map((x) => `${x.ten} tại cung ${laSo.cungs[x.chiIndex].tenCung}`).join('; ')}.`, sao: tinh.map((x) => x.ten) });
          ganCuaSo();
        }
        const luu = luuTuHoaTheoNam(laSo, nam);
        if (luu.length) {
          them({ loai: 'luu-tu-hoa', noiDung: `Năm ${nam} (${canChiCuaNam(nam)}) lưu tứ hoá: ${moTaHoaHan(luu)}.`, sao: luu.map((h) => h.sao) });
          ganCuaSo();
        }
      }
      if (keHoach.lopHan.includes('dai-van')) {
        const tuoi = nam - laSo.thongTin.amLich.nam + 1;
        const dv = cungDaiVan(laSo, tuoi);
        const hoa = tuHoaDaiVan(laSo, tuoi);
        if (dv?.daiVan && hoa.length) {
          them({ loai: 'tu-hoa-dai-van', noiDung: `Đại vận ${dv.daiVan.tuTuoi}–${dv.daiVan.denTuoi} tuổi (can ${dv.can}), tại năm ${nam}: ${moTaHoaHan(hoa)}.`, cung: dv.tenCung, sao: hoa.map((h) => h.sao) });
          ganCuaSo();
        }
      }
    }
  }

  return maTheoCuaSo
    ? { duKien, saoTheoCung: saoChinhTheoCung(laSo), maTheoCuaSo }
    : { duKien, saoTheoCung: saoChinhTheoCung(laSo) };
}

/** Phiên bản engine tính — đi vào mọi bản ghi trace */
export const PHIEN_BAN_ENGINE = `${PHUONG_PHAP.id}@${PHUONG_PHAP.phienBan}`;
