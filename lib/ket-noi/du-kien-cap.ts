import { tamPhuongTuChinh, type Cung, type LaSo } from '@/lib/tuvi/ansao';
import { CAU_HINH_Y_DINH, type YDinhKetNoi } from './y-dinh';

/**
 * Dữ kiện của một CẶP, không phải hai bộ dữ kiện rời.
 *
 * Đặt hai lá số cạnh nhau rồi để model tự so là cách chắc chắn nhất để nó so
 * bừa. Ở đây ta tính sẵn những phép so có ý nghĩa — cùng cung ấy hai người có gì
 * khác nhau, chi năm sinh đứng ở thế nào so với nhau, mệnh của người này rơi vào
 * cung nào trên lá số người kia — rồi cấp mã PF### cho từng dữ kiện để validator
 * đối chiếu được.
 *
 * Nguyên tắc như bên luận giải một người: không dồn cả hai lá số vào prompt. Chỉ
 * những cung mà ý định đang cần.
 */

export interface DuKienCap {
  id: string;
  loai: 'nguoi-a' | 'nguoi-b' | 'doi-chieu' | 'nen';
  noiDung: string;
  cung?: string;
}

const TEN_CHI_TAM_HOP: Record<number, string> = {
  0: 'Thân Tý Thìn',
  1: 'Hợi Mão Mùi',
  2: 'Dần Ngọ Tuất',
  3: 'Tỵ Dậu Sửu',
};

function net(c: Cung): string {
  const chinh = c.sao.filter((s) => s.loai === 'chinh-tinh');
  const tuHoa = c.sao.filter((s) => s.loai === 'tu-hoa');
  const phu = c.sao.filter((s) => s.loai !== 'chinh-tinh' && s.loai !== 'tu-hoa');

  const phan: string[] = [
    chinh.length
      ? chinh.map((s) => (s.doSang ? `${s.ten} (${s.doSang})` : s.ten)).join(', ')
      : 'vô chính diệu',
  ];
  if (tuHoa.length) phan.push(tuHoa.map((s) => s.ten).join(', '));
  if (phu.length) phan.push(`phụ tinh ${phu.slice(0, 5).map((s) => s.ten).join(', ')}`);
  if (c.coTuan) phan.push('gặp Tuần');
  if (c.coTriet) phan.push('gặp Triệt');
  return phan.join('; ');
}

const mod12 = (n: number) => ((n % 12) + 12) % 12;

export interface DauVaoDuKienCap {
  laSoA: LaSo;
  laSoB: LaSo;
  tenA: string;
  tenB: string;
  yDinh: YDinhKetNoi;
  /** Cung bổ sung do planner suy từ câu hỏi tự do */
  cungThem?: string[];
}

export function dungDuKienCap({
  laSoA,
  laSoB,
  tenA,
  tenB,
  yDinh,
  cungThem = [],
}: DauVaoDuKienCap): DuKienCap[] {
  const ra: DuKienCap[] = [];
  let dem = 0;
  const them = (d: Omit<DuKienCap, 'id'>) => {
    dem += 1;
    ra.push({ id: `PF${String(dem).padStart(3, '0')}`, ...d });
  };

  const cung = [...new Set([...CAU_HINH_Y_DINH[yDinh].cung, ...cungThem])];
  const tim = (ls: LaSo, ten: string) => ls.cungs.find((c) => c.tenCung === ten);

  // Nền: mệnh, cục, âm dương — cần cho mọi ý định
  for (const [ten, ls] of [
    [tenA, laSoA],
    [tenB, laSoB],
  ] as const) {
    them({
      loai: 'nen',
      noiDung: `${ten}: ${ls.cuc.ten}, bản mệnh ${ls.banMenh.ten}, ${ls.amDuongThuanLy}, Thân cư ${ls.thanCuCung}.`,
    });
  }

  // Từng cung theo ý định, hai người nối nhau để model đọc là so sánh chứ không
  // phải hai bài mô tả rời
  for (const ten of cung) {
    const ca = tim(laSoA, ten);
    const cb = tim(laSoB, ten);
    if (!ca || !cb) continue;
    them({
      loai: 'doi-chieu',
      cung: ten,
      noiDung: `Cung ${ten} — ${tenA} (${ca.chi}): ${net(ca)}. ${tenB} (${cb.chi}): ${net(cb)}.`,
    });
  }

  // Quan hệ chi năm sinh: cùng tam hợp, xung nhau, hay không dính gì. Đây là
  // phép so cặp cơ bản nhất và cũng là thứ engine tính chắc chắn nhất.
  const chiA = laSoA.chiNamIndex;
  const chiB = laSoB.chiNamIndex;
  const nhomA = mod12(chiA) % 4;
  const nhomB = mod12(chiB) % 4;
  const xung = mod12(chiA + 6) === chiB;
  const quanHe = xung
    ? 'hai chi xung chiếu nhau'
    : nhomA === nhomB
      ? `cùng tam hợp ${TEN_CHI_TAM_HOP[nhomA] ?? ''}`.trim()
      : 'chi năm sinh không cùng tam hợp và cũng không xung';
  them({
    loai: 'doi-chieu',
    noiDung: `Chi năm sinh: ${tenA} ${laSoA.thongTin.canChiNam}, ${tenB} ${laSoB.thongTin.canChiNam} — ${quanHe}.`,
  });

  // Mệnh người này rơi vào cung nào trên lá số người kia. Đây là phép chiếu chéo
  // nói được "trong đời người kia, mình đóng vai trò gì" — thứ mà so hai bảng
  // riêng lẻ không cho ra.
  for (const [tenNguon, lsNguon, tenDich, lsDich] of [
    [tenA, laSoA, tenB, laSoB],
    [tenB, laSoB, tenA, laSoA],
  ] as const) {
    const cungMenhNguon = lsNguon.cungs[lsNguon.menhIndex];
    const roiVao = lsDich.cungs.find((c) => c.chiIndex === cungMenhNguon.chiIndex);
    if (roiVao) {
      them({
        loai: 'doi-chieu',
        cung: roiVao.tenCung,
        noiDung: `Cung Mệnh của ${tenNguon} (${cungMenhNguon.chi}) rơi vào cung ${roiVao.tenCung} trên lá số ${tenDich}.`,
      });
    }
  }

  // Tam phương tứ chính của cung trọng tâm — chỉ cung đầu tiên, để không phình
  // thành nửa lá số của cả hai người
  const trongTam = cung[0];
  for (const [ten, ls] of [
    [tenA, laSoA],
    [tenB, laSoB],
  ] as const) {
    const c = tim(ls, trongTam);
    if (!c) continue;
    const { xungChieu, tamHop } = tamPhuongTuChinh(c.chiIndex);
    const quanh = [xungChieu, ...tamHop]
      .map((i) => ls.cungs.find((x) => x.chiIndex === i))
      .filter((x): x is Cung => !!x && x.tenCung !== c.tenCung)
      .map((x) => {
        const chinh = x.sao.filter((s) => s.loai === 'chinh-tinh').map((s) => s.ten);
        return `${x.tenCung}: ${chinh.length ? chinh.join(', ') : 'vô chính diệu'}`;
      })
      .join('; ');
    if (quanh) {
      them({
        loai: ten === tenA ? 'nguoi-a' : 'nguoi-b',
        cung: trongTam,
        noiDung: `Tam phương tứ chính của ${trongTam} trên lá số ${ten} — ${quanh}.`,
      });
    }
  }

  return ra;
}
