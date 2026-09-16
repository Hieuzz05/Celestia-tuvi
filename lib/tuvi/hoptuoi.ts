import { CHI, NGU_HANH, type NguHanh, nhomTamHop } from './constants';
import type { LaSo } from './ansao';

/**
 * So sánh hai lá số theo các tiêu chí truyền thống.
 *
 * Chỉ tính toán và mô tả dữ kiện — KHÔNG kết luận "hợp" hay "không hợp" bằng
 * một điểm số tổng. Tử vi truyền thống không quy về một con số, và đưa ra điểm
 * số cho chuyện hôn nhân là kiểu khẳng định mà công cụ này không nên làm.
 * Phần nhận định dành cho người đọc và phần luận giải AI.
 */

export type MucDo = 'thuan' | 'trung' | 'nghich';

export interface TieuChiSoSanh {
  ten: string;
  giaTriA: string;
  giaTriB: string;
  ketQua: string;
  mucDo: MucDo;
  giaiThich: string;
}

export interface KetQuaSoSanh {
  tenA: string;
  tenB: string;
  tieuChi: TieuChiSoSanh[];
}

/** Quan hệ sinh khắc giữa hai hành */
function quanHeHanh(a: NguHanh, b: NguHanh): { ketQua: string; mucDo: MucDo } {
  const sinh: Record<NguHanh, NguHanh> = {
    Kim: 'Thủy',
    Thủy: 'Mộc',
    Mộc: 'Hỏa',
    Hỏa: 'Thổ',
    Thổ: 'Kim',
  };
  const khac: Record<NguHanh, NguHanh> = {
    Kim: 'Mộc',
    Mộc: 'Thổ',
    Thổ: 'Thủy',
    Thủy: 'Hỏa',
    Hỏa: 'Kim',
  };

  if (a === b) return { ketQua: 'Tương hòa (cùng hành)', mucDo: 'thuan' };
  if (sinh[a] === b) return { ketQua: `${a} sinh ${b}`, mucDo: 'thuan' };
  if (sinh[b] === a) return { ketQua: `${b} sinh ${a}`, mucDo: 'thuan' };
  if (khac[a] === b) return { ketQua: `${a} khắc ${b}`, mucDo: 'nghich' };
  if (khac[b] === a) return { ketQua: `${b} khắc ${a}`, mucDo: 'nghich' };
  return { ketQua: 'Không sinh không khắc', mucDo: 'trung' };
}

/** Quan hệ giữa hai địa chi: tam hợp / lục hợp / lục xung / lục hại */
function quanHeChi(a: number, b: number): { ketQua: string; mucDo: MucDo } {
  const cach = ((b - a) % 12 + 12) % 12;

  if (a === b) return { ketQua: 'Cùng tuổi (đồng chi)', mucDo: 'trung' };
  if (cach === 6) return { ketQua: `Lục xung (${CHI[a]} xung ${CHI[b]})`, mucDo: 'nghich' };
  if (cach === 4 || cach === 8) {
    return { ketQua: `Tam hợp (${CHI[a]} – ${CHI[b]})`, mucDo: 'thuan' };
  }
  // Lục hợp: tổng hai chi (theo cách đánh Tý=0) bằng 1 hoặc 13
  const tong = a + b;
  if (tong === 1 || tong === 13) {
    return { ketQua: `Lục hợp (${CHI[a]} hợp ${CHI[b]})`, mucDo: 'thuan' };
  }
  // Lục hại: tổng bằng 7 hoặc 19
  if (tong === 7 || tong === 19) {
    return { ketQua: `Lục hại (${CHI[a]} hại ${CHI[b]})`, mucDo: 'nghich' };
  }
  return { ketQua: 'Bình thường, không hợp không xung', mucDo: 'trung' };
}

/** Sao nào cùng xuất hiện ở cung Phu Thê của cả hai lá số */
function saoChungCungPhuThe(a: LaSo, b: LaSo): string[] {
  const lay = (ls: LaSo) => {
    const cung = ls.cungs.find((c) => c.tenCung === 'Phu Thê');
    return new Set(
      (cung?.sao ?? []).filter((s) => s.loai === 'chinh-tinh').map((s) => s.ten)
    );
  };
  const sA = lay(a);
  const sB = lay(b);
  return [...sA].filter((s) => sB.has(s));
}

export function soSanhHaiLaSo(a: LaSo, b: LaSo): KetQuaSoSanh {
  const tieuChi: TieuChiSoSanh[] = [];

  // 1. Bản mệnh (nạp âm năm sinh)
  const hanhMenh = quanHeHanh(a.banMenh.hanh, b.banMenh.hanh);
  tieuChi.push({
    ten: 'Bản mệnh (nạp âm)',
    giaTriA: `${a.banMenh.ten} (${a.banMenh.hanh})`,
    giaTriB: `${b.banMenh.ten} (${b.banMenh.hanh})`,
    ketQua: hanhMenh.ketQua,
    mucDo: hanhMenh.mucDo,
    giaiThich:
      'Quan hệ ngũ hành giữa hai bản mệnh, tiêu chí được xem trọng nhất khi xét hợp tuổi.',
  });

  // 2. Địa chi năm sinh
  const chi = quanHeChi(a.chiNamIndex, b.chiNamIndex);
  tieuChi.push({
    ten: 'Địa chi năm sinh',
    giaTriA: CHI[a.chiNamIndex],
    giaTriB: CHI[b.chiNamIndex],
    ketQua: chi.ketQua,
    mucDo: chi.mucDo,
    giaiThich:
      'Tam hợp và lục hợp chủ về đồng thuận; lục xung, lục hại chủ về va chạm trong sinh hoạt.',
  });

  // 3. Cục
  const hanhCuc = quanHeHanh(a.cuc.hanh, b.cuc.hanh);
  tieuChi.push({
    ten: 'Cục',
    giaTriA: a.cuc.ten,
    giaTriB: b.cuc.ten,
    ketQua: hanhCuc.ketQua,
    mucDo: hanhCuc.mucDo,
    giaiThich: 'Cục phản ánh nhịp phát triển của mỗi người, sinh nhau thì dễ đồng hành.',
  });

  // 4. Âm dương
  const thuanLyA = a.amDuongThuanLy.includes('thuận');
  const thuanLyB = b.amDuongThuanLy.includes('thuận');
  tieuChi.push({
    ten: 'Âm Dương',
    giaTriA: `${a.amDuong} — ${a.amDuongThuanLy}`,
    giaTriB: `${b.amDuong} — ${b.amDuongThuanLy}`,
    ketQua: thuanLyA === thuanLyB ? 'Cùng chiều âm dương' : 'Khác chiều âm dương',
    mucDo: 'trung',
    giaiThich:
      'Khác chiều không phải điều xấu — hai người vận hành theo nhịp khác nhau, cần biết để dung hòa.',
  });

  // 5. Cung Mệnh của hai người có nằm trong tam hợp của nhau không
  const tamHopA = nhomTamHop(a.menhIndex);
  const tamHopB = nhomTamHop(b.menhIndex);
  tieuChi.push({
    ten: 'Cung Mệnh an tại',
    giaTriA: CHI[a.menhIndex],
    giaTriB: CHI[b.menhIndex],
    ketQua:
      a.menhIndex === b.menhIndex
        ? 'Đồng cung Mệnh'
        : tamHopA === tamHopB
          ? 'Mệnh hai người cùng nhóm tam hợp'
          : ((b.menhIndex - a.menhIndex + 12) % 12 === 6
              ? 'Mệnh hai người xung chiếu nhau'
              : 'Mệnh hai người không cùng nhóm'),
    mucDo:
      tamHopA === tamHopB
        ? 'thuan'
        : (b.menhIndex - a.menhIndex + 12) % 12 === 6
          ? 'nghich'
          : 'trung',
    giaiThich: 'Mệnh cùng nhóm tam hợp thì cách nghĩ gần nhau; xung chiếu thì hay nhìn ngược chiều.',
  });

  // 6. Chính tinh trùng nhau ở cung Phu Thê
  const chung = saoChungCungPhuThe(a, b);
  tieuChi.push({
    ten: 'Chính tinh cung Phu Thê',
    giaTriA:
      a.cungs
        .find((c) => c.tenCung === 'Phu Thê')
        ?.sao.filter((s) => s.loai === 'chinh-tinh')
        .map((s) => s.ten)
        .join(', ') || 'Vô chính diệu',
    giaTriB:
      b.cungs
        .find((c) => c.tenCung === 'Phu Thê')
        ?.sao.filter((s) => s.loai === 'chinh-tinh')
        .map((s) => s.ten)
        .join(', ') || 'Vô chính diệu',
    ketQua: chung.length > 0 ? `Cùng có: ${chung.join(', ')}` : 'Không có chính tinh trùng nhau',
    mucDo: chung.length > 0 ? 'thuan' : 'trung',
    giaiThich:
      'Cung Phu Thê mô tả hình mẫu người bạn đời mà mỗi người hướng tới; trùng sao là dấu hiệu kỳ vọng gần nhau.',
  });

  return {
    tenA: a.thongTin.hoTen?.trim() || 'Người thứ nhất',
    tenB: b.thongTin.hoTen?.trim() || 'Người thứ hai',
    tieuChi,
  };
}

/** Đếm số tiêu chí theo mức độ — dùng cho phần tóm tắt, không phải điểm số */
export function demMucDo(kq: KetQuaSoSanh): Record<MucDo, number> {
  const dem: Record<MucDo, number> = { thuan: 0, trung: 0, nghich: 0 };
  for (const t of kq.tieuChi) dem[t.mucDo]++;
  return dem;
}

export { NGU_HANH };
