import {
  cungDaiVan,
  cungNguyetHan,
  cungTieuHan,
  tamPhuongTuChinh,
  type Cung,
  type LaSo,
} from '@/lib/tuvi/ansao';
import { PHUONG_PHAP } from '@/lib/tuvi/phuong-phap';
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
  loai: 'cung' | 'menh' | 'than' | 'cuc' | 'dai-van' | 'luu-nien' | 'nguyet-han' | 'tam-hop';
  /** Câu mô tả dữ kiện, viết đủ để đứng một mình */
  noiDung: string;
  cung?: string;
  sao?: string[];
}

function motTaCung(c: Cung): string {
  const chinh = c.sao.filter((s) => s.loai === 'chinh-tinh');
  const tuHoa = c.sao.filter((s) => s.loai === 'tu-hoa');
  const phu = c.sao.filter((s) => s.loai !== 'chinh-tinh' && s.loai !== 'tu-hoa');

  const phan: string[] = [];
  phan.push(
    chinh.length
      ? `có ${chinh.map((s) => (s.doSang ? `${s.ten} (${s.doSang})` : s.ten)).join(', ')}`
      : 'vô chính diệu'
  );
  if (tuHoa.length) phan.push(`${tuHoa.map((s) => s.ten).join(', ')}`);
  if (phu.length) phan.push(`phụ tinh ${phu.slice(0, 6).map((s) => s.ten).join(', ')}`);
  if (c.coTuan) phan.push('gặp Tuần');
  if (c.coTriet) phan.push('gặp Triệt');

  return `Cung ${c.tenCung} (${c.chi}) ${phan.join('; ')}.`;
}

export interface DauVaoBoiCanh {
  laSo: LaSo;
  keHoach: KeHoachTruyVan;
  namXem: number;
  thangXem: number;
}

export interface BoiCanhLaSo {
  duKien: DuKienLaSo[];
  /** Sao theo từng cung — planner dùng để viết lại truy vấn */
  saoTheoCung: Record<string, string[]>;
}

/** Sao đáng đưa vào truy vấn: chính tinh và Tứ Hóa. Phụ tinh để dành cho dữ kiện. */
export function saoChinhTheoCung(laSo: LaSo): Record<string, string[]> {
  const ra: Record<string, string[]> = {};
  for (const c of laSo.cungs) {
    ra[c.tenCung] = c.sao
      .filter((s) => s.loai === 'chinh-tinh' || s.loai === 'tu-hoa')
      .map((s) => s.ten);
  }
  return ra;
}

export function chonBoiCanh({ laSo, keHoach, namXem, thangXem }: DauVaoBoiCanh): BoiCanhLaSo {
  const duKien: DuKienLaSo[] = [];
  let dem = 0;
  const them = (d: Omit<DuKienLaSo, 'id'>) => {
    dem += 1;
    duKien.push({ id: `F${String(dem).padStart(3, '0')}`, ...d });
  };

  const tim = (ten: string) => laSo.cungs.find((c) => c.tenCung === ten);

  // Nền của mọi câu trả lời: Mệnh và Cục. Luôn có mặt dù hỏi gì.
  them({
    loai: 'cuc',
    noiDung: `${laSo.cuc.ten} (${laSo.cuc.so}), bản mệnh ${laSo.banMenh.ten}, ${laSo.amDuongThuanLy}, ${laSo.menhCucQuanHe}.`,
  });

  const cungMenh = laSo.cungs[laSo.menhIndex];
  them({ loai: 'menh', noiDung: motTaCung(cungMenh), cung: 'Mệnh', sao: cungMenh.sao.map((s) => s.ten) });

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

  return { duKien, saoTheoCung: saoChinhTheoCung(laSo) };
}

/** Phiên bản engine tính — đi vào mọi bản ghi trace */
export const PHIEN_BAN_ENGINE = `${PHUONG_PHAP.id}@${PHUONG_PHAP.phienBan}`;
