/**
 * DEMO_DONG (thử, KHÔNG gộp) — 08/10/2026. Phương án: D:\Celestia\CELES-PHUONG-AN-DOC-VAN-v8.md
 *
 * Thước thứ hai, cạnh "thuận ↔ vướng": năm này phần đời đang hỏi YÊN hay ĐỘNG.
 * Chỉ xét lớp thời gian (đại vận, tiểu hạn, sao năm). Sao gốc năm nào cũng nằm đó nên không làm
 * một năm động hơn năm khác.
 *
 * Mã chỉ tính mức và căn cứ. Động hiện ra thành chuyện gì (đổi việc, chuyển trường, chuyển nhà…)
 * là việc của model, theo tuổi và hoàn cảnh.
 */
import { cungDaiVan, cungTieuHan, luuTinhTheoNam, tamPhuongTuChinh, type LaSo } from '@/lib/tuvi/ansao';
import { CHINH_TINH, TU_HOA } from '@/lib/tuvi/constants';

/** Sao "động" theo sách và nét động của nó. Trọng số: sao chủ động 2, sao làm bùng/cắt 1–1,5. */
const SAO_DONG: Record<string, { w: number; y: string }> = {
  'Thiên Mã': { w: 2, y: 'di chuyển, đổi chỗ, đổi việc' },
  'Phá Quân': { w: 2, y: 'phá cái cũ để làm cái mới' },
  'Thất Sát': { w: 1.5, y: 'quyết nhanh, cắt ngang thứ đang làm' },
  'Tham Lang': { w: 1, y: 'muốn thử cái mới, không chịu đứng yên' },
  'Hỏa Tinh': { w: 1, y: 'nóng vội, chuyện bùng lên đột ngột' },
  'Linh Tinh': { w: 1, y: 'bực dồn lâu rồi bật ra' },
  'Địa Không': { w: 1, y: 'hụt hẫng, mất chỗ bám bất ngờ' },
  'Địa Kiếp': { w: 1, y: 'mất mát, đứt đoạn bất ngờ' },
  'Hóa Kỵ': { w: 1.5, y: 'vướng, tắc, buộc phải gỡ' },
};
const LUU_DONG: Record<string, { w: number; y: string }> = {
  'Lưu Thiên Mã': { w: 2, y: 'năm có di chuyển, đổi chỗ' },
  'Lưu Thái Tuế': { w: 1, y: 'chuyện ở đây nổi lên, phải ra mặt giải quyết' },
  'Lưu Tang Môn': { w: 1, y: 'chuyện buồn, phải buông một thứ' },
  'Lưu Bạch Hổ': { w: 1, y: 'va chạm, giấy tờ, thị phi' },
  'Lưu Kình Dương': { w: 0.5, y: 'va chạm, căng' },
  'Lưu Đà La': { w: 0.5, y: 'chậm, dây dưa' },
};

/** Ngưỡng hiệu chỉnh trên phân phối nhiều lá số × nhiều năm (scripts/tam-hieu-chinh-dong.ts), KHÔNG theo đời ai. */
export const NGUONG_DONG = { co: 4.4, manh: 6.8 }; // p80 và p97 của 14.400 mẫu

export interface CanCuDong { ten: string; cho: string; y: string; diem: number }
export interface MucDong {
  muc: 'yen' | 'co' | 'manh';
  diem: number;
  canCu: CanCuDong[];
  giaiDoan: string;
}

const TEN_MUC = { yen: 'YÊN', co: 'CÓ XÊ DỊCH', manh: 'XÊ DỊCH MẠNH' } as const;

export function tinhDong(laSo: LaSo, tenCung: string, namXem: number): MucDong | null {
  const cung = laSo.cungs.find((c) => c.tenCung === tenCung);
  if (!cung) return null;
  const tuoi = namXem - laSo.thongTin.amLich.nam + 1;
  if (tuoi < 1) return null;
  const tp = tamPhuongTuChinh(cung.chiIndex);
  const gan = (i: number) => (i === cung.chiIndex ? 1 : tp.xungChieu === i ? 0.8 : tp.tamHop.includes(i) ? 0.5 : 0);
  const loai = (i: number) =>
    i === cung.chiIndex ? '' : tp.xungChieu === i ? ', chiếu thẳng về' : tp.tamHop.includes(i) ? ', hội về' : '';
  const ten = (i: number) => `Cung ${laSo.cungs[i].tenCung}`;
  const canCu: CanCuDong[] = [];

  const iNam = cungTieuHan(laSo, tuoi);
  const dv = cungDaiVan(laSo, tuoi);
  const trung = !!dv && dv.chiIndex === iNam;

  // Sao của cung tiểu hạn tô màu cả năm: ít nhất 0,6 kể cả khi không chạm cung đang hỏi.
  const heNam = Math.max(0.6, gan(iNam)) * (trung ? 1.5 : 1);
  for (const s of laSo.cungs[iNam].sao) {
    const d = SAO_DONG[s.ten];
    if (d) canCu.push({ ten: s.ten, cho: `${ten(iNam)}, nơi năm nay đi qua${loai(iNam)}`, y: d.y, diem: d.w * heNam });
  }
  if (trung) {
    canCu.push({ ten: 'Năm nay rơi đúng cung của chặng mười năm', cho: ten(iNam), y: 'việc của cả chặng mười năm dồn vào năm này', diem: 2 });
  }
  if (dv && tuoi === dv.daiVan!.tuTuoi) {
    canCu.push({ ten: 'Năm đầu một chặng mười năm mới', cho: ten(dv.chiIndex), y: 'bước sang một chặng mười năm khác', diem: 2 });
  }

  for (const s of luuTinhTheoNam(namXem)) {
    const d = LUU_DONG[s.ten];
    const g = gan(s.chiIndex);
    if (d && g) canCu.push({ ten: s.ten, cho: `${ten(s.chiIndex)}${loai(s.chiIndex)}`, y: d.y, diem: d.w * g });
  }

  // Hóa Kỵ của năm (theo can năm xem)
  const can = (((namXem + 6) % 10) + 10) % 10;
  const saoKy = TU_HOA[can][3];
  const oKy = laSo.cungs.find((c) => c.sao.some((x) => x.ten === saoKy));
  if (oKy) {
    const g = Math.max(gan(oKy.chiIndex), oKy.chiIndex === iNam ? 0.6 : 0);
    if (g) canCu.push({ ten: `Lưu Hóa Kỵ (vào ${saoKy})`, cho: `${ten(oKy.chiIndex)}${loai(oKy.chiIndex)}`, y: 'năm nay vướng, buộc phải gỡ', diem: 1.5 * g });
  }

  canCu.sort((a, b) => b.diem - a.diem);
  const diem = canCu.reduce((t, c) => t + c.diem, 0);
  const muc = diem >= NGUONG_DONG.manh ? 'manh' : diem >= NGUONG_DONG.co ? 'co' : 'yen';

  // Giai đoạn đời: đếm được, đúng cho mọi lá số.
  const chinh = (i: number) =>
    laSo.cungs[i].sao.filter((s) => (CHINH_TINH as readonly string[]).includes(s.ten)).map((s) => s.ten).join(', ') || 'không có chính tinh';
  let giaiDoan = `Năm ${namXem}, người hỏi ${tuoi} tuổi.`;
  if (dv?.daiVan) {
    giaiDoan += ` Đại vận ${dv.daiVan.tuTuoi}–${dv.daiVan.denTuoi} tuổi ở Cung ${dv.tenCung} (${chinh(dv.chiIndex)}), năm thứ ${tuoi - dv.daiVan.tuTuoi + 1} trong 10 năm.`;
    const truoc = laSo.cungs.find((c) => c.daiVan && c.daiVan.denTuoi === dv.daiVan!.tuTuoi - 1);
    if (truoc?.daiVan) giaiDoan += ` Đại vận trước (${truoc.daiVan.tuTuoi}–${truoc.daiVan.denTuoi} tuổi) ở Cung ${truoc.tenCung} (${chinh(truoc.chiIndex)}).`;
  }
  return { muc, diem, canCu: canCu.slice(0, 6), giaiDoan };
}

/**
 * Vòng 2 (08/10): nhãn "XÊ DỊCH MẠNH" / "YÊN" bị chép thẳng ra bài. Không đưa nhãn: đưa điều người hỏi
 * sẽ thấy. Tên cung trong căn cứ kéo model kể thêm sao khác ở cung đó (ngoài gói → bị chặn, có lượt ra
 * rỗng), nên nói rõ chỉ gọi tên sao ghi ở đây.
 */
const MO_TA_MUC = {
  manh: 'khó đứng yên như cũ: khả năng cao phần này đổi đi (chỗ, vai trò, hướng…), không chỉ là bận thêm.',
  co: 'có chuyển động: một phần đổi đi (cách làm, chỗ, người cùng làm…), chưa hẳn là đổi cả.',
  yen: 'phần lớn đi tiếp nếp đang có. Không vẽ ra thay đổi lớn cho năm này.',
} as const;

export function khoiDong(m: MucDong | null, phanDoi: string): string {
  if (!m) return '';
  const dong = m.canCu.map((c) => `- ${c.ten} (${c.cho}) — ${c.y}`).join('\n');
  return `

GIAI ĐOẠN ĐỜI CỦA NGƯỜI HỎI: ${m.giaiDoan}

NĂM NÀY Ở ${phanDoi.toUpperCase()} (đã tính từ lá số, không đảo): ${MO_TA_MUC[m.muc]}
${m.canCu.length ? `${m.muc === 'yen' ? 'Lớp năm có chạm tới, nhưng chưa đủ thành thay đổi' : 'Những gì làm năm này chuyển động'}:\n${dong}\nỞ các cung nhắc ở đây, chỉ gọi tên đúng những sao ghi ở đây và trong khối dữ kiện.` : ''}

CÁCH DÙNG:
- Có thay đổi hay không là chuyện khác với thuận hay vướng: năm thuận vẫn có thể là năm đổi lớn, năm vướng vẫn có thể đứng yên.
- Sao động nằm sẵn trong lá số gốc (không phải sao lưu, không nằm ở cung năm nay đi qua) là nếp năm nào cũng có, không phải chuyện riêng của năm này.
- ${m.muc === 'yen' ? 'Năm này không có thay đổi lớn ở phần đời đang hỏi. Câu đầu nói năm nay đi tiếp hướng đang có và điều chính của năm (thuận hay vướng ở đâu). Sao động ở cung gốc (như Thiên Mã gốc) chỉ nói như thói quen lâu nay ("bạn vốn hay…"), không đặt vào câu đầu như chuyện riêng của năm.' :'Câu đầu nói thay đổi đó bằng chuyện cụ thể; gọi tên ít nhất một sao ở trên như lý do, nói bằng lời thường như thầy nói với người hỏi.'}
- Thay đổi hiện ra thành chuyện gì là do người: cùng một bộ sao, người 17 tuổi, 27 tuổi, 57 tuổi gặp chuyện khác nhau; chặng đầu và chặng cuối một đại vận cũng khác. Tự cân theo tuổi, chặng đại vận và hoàn cảnh người hỏi đã kể, rồi ghi phần cân nhắc đó vào khóa "docGiaiDoan". Người đọc không thấy "docGiaiDoan", nên bài phải để lộ cân nhắc ấy: ít nhất một đoạn nói chuyện năm nay mang hình dạng gì ở tuổi này, chặng này, mà người ở tuổi khác sẽ không gặp y như vậy. Nói như xu hướng, không nói chắc một sự kiện.`;
}
