import { CHI, CHINH_TINH } from './constants';
import {
  canChiCuaNam,
  cungDaiVan,
  cungNguyetHan,
  cungTieuHan,
  type Cung,
  type LaSo,
} from './ansao';
import { KHUON, type KhuonChu, type NgonNguDoc } from './quick-read-noi-dung';
import type { CanCu, GocNhin } from './quick-read';

/**
 * Hành trình — đọc lá số ra một dòng thời gian: giai đoạn dài → năm → tháng.
 *
 * Không gọi AI, cùng lý do với Quick Read: người dùng bấm qua lại giữa các mốc
 * rất nhanh, mà mỗi lần bấm phải chờ model 15-45 giây thì không ai bấm tiếp.
 * Toàn bộ nội dung ở đây dựng thẳng từ engine an sao.
 *
 * Ngôn ngữ mặt trước không có chữ "vận hạn", "đại vận", "tiểu hạn" — brand spec
 * xếp chúng vào lớp chuyên môn. Ở màn này chúng là "giai đoạn", "năm", "tháng";
 * tên kỹ thuật chỉ hiện trong phần căn cứ khi người dùng chủ động mở ra.
 */

export type LoaiMoc = 'giai-doan' | 'nam' | 'thang';

export interface MocHanhTrinh {
  id: string;
  loai: LoaiMoc;
  /** Nhãn ngắn trên dải thời gian: "41–50 tuổi", "2026", "Tháng 3" */
  nhan: string;
  /** Dòng phụ nhỏ dưới nhãn: khoảng năm, can chi, tuổi âm… */
  phu: string;
  /** Chủ đề bằng lời đời thường */
  chuDe: string;
  cung: Cung;
  dangDienRa: boolean;
  canCu: CanCu[];
}

function dien(mau: string, gt: Record<string, string | number>): string {
  return mau.replace(/\{(\w+)\}/g, (_, k) => String(gt[k] ?? ''));
}

/** Tuổi âm (tuổi mụ) tại một năm dương — cách lá số đếm tuổi */
export function tuoiAmTaiNam(laSo: LaSo, nam: number): number {
  return nam - laSo.thongTin.amLich.nam + 1;
}

function tenCung(cung: Cung, k: KhuonChu): string {
  return k.tenCung[cung.tenCung] ?? cung.tenCung;
}

/**
 * Chọn một khuôn câu theo hạt lấy từ chính lá số — không ngẫu nhiên, vì mốc
 * đọc lại phải ra đúng chữ cũ thì người dùng mới đối chiếu được.
 */
function chonKhuon(bienThe: readonly string[], hat: number): string {
  return bienThe[((hat % bienThe.length) + bienThe.length) % bienThe.length];
}

/** Bỏ chủ ngữ đầu câu — nét sao viết sẵn dạng "bạn …" */
function boChuNgu(cau: string) {
  return cau.replace(/^(?:bạn|you)\s+/i, '');
}

/*
 * Một mốc trước đây chỉ có đúng "Nghiêng về {chuDe}.". Mười mốc xếp dọc nhau
 * thành mười dòng cùng một khuôn, và không dòng nào nói quãng ấy cho người đọc
 * cái gì — chỉ nói nó thuộc về đề tài nào. Thêm một câu lấy từ chính tinh đóng
 * ở cung đó: cùng kho chữ mà bảng tám lĩnh vực vẫn dùng, nên không phải bịa
 * thêm luật nào.
 */
function chuDeCua(cung: Cung, k: KhuonChu): string {
  const chuDe = k.chuDeCung[cung.tenCung];
  if (!chuDe) return k.hanhTrinh.chuDeTrong;

  const mo = dien(chonKhuon(k.hanhTrinh.chuDeCo, cung.chiIndex), { chuDe });
  const chinh = cung.sao.find((s) => (CHINH_TINH as readonly string[]).includes(s.ten));
  const net = chinh ? k.netSao[chinh.ten]?.manh : undefined;
  if (!net) return mo;

  return `${mo} ${dien(chonKhuon(k.hanhTrinh.chuDeNet, cung.chiIndex), { net: boChuNgu(net) })}`;
}

/** Căn cứ chung cho mọi mốc: sao nào đóng ở cung đó, có Tuần/Triệt không */
function canCuCung(cung: Cung, k: KhuonChu): CanCu[] {
  const ra: CanCu[] = [];

  for (const s of cung.sao.filter((x) => x.loai === 'chinh-tinh').slice(0, 2)) {
    const sang = s.doSang ? k.doSang[s.doSang] : undefined;
    ra.push({
      nhan: sang ? dien(k.canCu.saoDong, { sao: s.ten, sang }) : s.ten,
      giaiThich: sang
        ? dien(k.canCu.saoDongY, { sao: s.ten, sang })
        : dien(k.canCu.saoDongTrong, { sao: s.ten }),
    });
  }

  if (cung.coTuan || cung.coTriet) {
    const ten = [cung.coTuan ? 'Tuần' : null, cung.coTriet ? 'Triệt' : null]
      .filter(Boolean)
      .join(' + ');
    ra.push({
      nhan: dien(k.canCu.tuanTriet, { ten }),
      giaiThich: dien(k.canCu.tuanTrietY, { ten }),
    });
  }

  return ra;
}

/**
 * Các giai đoạn 10 năm của cả đời, xếp theo tuổi.
 *
 * Đọc thẳng từ `daiVan` đã an sẵn trên từng cung thay vì tính lại: chiều thuận
 * nghịch phụ thuộc âm dương nam nữ và engine đã xử lý đúng ở đó rồi.
 */
export function cacGiaiDoan(laSo: LaSo, namXem: number, ngonNgu: NgonNguDoc = 'vi'): MocHanhTrinh[] {
  const k = KHUON[ngonNgu];
  const tuoi = tuoiAmTaiNam(laSo, namXem);
  const namSinhAm = laSo.thongTin.amLich.nam;

  return laSo.cungs
    .filter((c) => c.daiVan)
    .sort((a, b) => a.daiVan!.tuTuoi - b.daiVan!.tuTuoi)
    .map((cung) => {
      const { tuTuoi, denTuoi } = cung.daiVan!;
      return {
        id: `giai-doan-${tuTuoi}`,
        loai: 'giai-doan' as const,
        nhan: dien(k.hanhTrinh.giaiDoanNhan, { tu: tuTuoi, den: denTuoi }),
        phu: dien(k.hanhTrinh.giaiDoanPhu, {
          tuNam: namSinhAm + tuTuoi - 1,
          denNam: namSinhAm + denTuoi - 1,
        }),
        chuDe: chuDeCua(cung, k),
        cung,
        dangDienRa: tuoi >= tuTuoi && tuoi <= denTuoi,
        canCu: [
          {
            nhan: dien(k.canCu.giaiDoanTuoi, {
              tu: tuTuoi,
              den: denTuoi,
              cung: tenCung(cung, k),
            }),
            giaiThich: dien(k.canCu.giaiDoanTuoiY, {
              cung: tenCung(cung, k),
              chi: CHI[cung.chiIndex],
            }),
          },
          ...canCuCung(cung, k),
        ],
      };
    });
}

/**
 * Một dải năm quanh năm đang xem — phần "đi tới, đi lui" của màn Hành trình.
 *
 * Chặn dưới ở năm sinh: lá số không đọc được quãng trước khi sinh, mà để dải
 * chạy quá đó thì bấm lùi vài lần là rơi vào ô trống không giải thích nổi.
 */
export function cacNam(
  laSo: LaSo,
  namGiua: number,
  namHienTai: number,
  ngonNgu: NgonNguDoc = 'vi',
  soNam = 7
): MocHanhTrinh[] {
  const k = KHUON[ngonNgu];
  const dau = Math.max(laSo.thongTin.amLich.nam, namGiua - Math.floor(soNam / 2));

  return Array.from({ length: soNam }, (_, i) => dau + i).map((nam) => {
    const tuoi = tuoiAmTaiNam(laSo, nam);
    const cung = laSo.cungs[cungTieuHan(laSo, tuoi)];
    return {
      id: `nam-${nam}`,
      loai: 'nam' as const,
      nhan: String(nam),
      phu: `${canChiCuaNam(nam)} · ${dien(k.hanhTrinh.tuoiAm, { tuoi })}`,
      chuDe: chuDeCua(cung, k),
      cung,
      dangDienRa: nam === namHienTai,
      canCu: [
        {
          nhan: dien(k.canCu.namUngVao, { nam, cung: tenCung(cung, k) }),
          giaiThich: dien(k.canCu.namUngVaoY, { nam, tuoi, cung: tenCung(cung, k) }),
        },
        ...canCuCung(cung, k),
      ],
    };
  });
}

/** Mười hai tháng của một năm, theo cách lá số chia tháng */
export function cacThang(
  laSo: LaSo,
  nam: number,
  thangHienTai: number | null,
  ngonNgu: NgonNguDoc = 'vi'
): MocHanhTrinh[] {
  const k = KHUON[ngonNgu];
  const tuoi = tuoiAmTaiNam(laSo, nam);

  return Array.from({ length: 12 }, (_, i) => i + 1).map((thang) => {
    const cung = laSo.cungs[cungNguyetHan(laSo, tuoi, thang)];
    return {
      id: `thang-${nam}-${thang}`,
      loai: 'thang' as const,
      nhan: dien(k.hanhTrinh.thangNhan, { thang }),
      phu: CHI[cung.chiIndex],
      chuDe: chuDeCua(cung, k),
      cung,
      dangDienRa: thang === thangHienTai,
      canCu: [
        {
          nhan: dien(k.canCu.thangUngVao, { thang, cung: tenCung(cung, k) }),
          giaiThich: dien(k.canCu.thangUngVaoY, { thang, nam, cung: tenCung(cung, k) }),
        },
        ...canCuCung(cung, k),
      ],
    };
  });
}

/**
 * "Điều đang chuyển động" — ba lớp thời gian chồng lên nhau, đọc thành một đoạn.
 *
 * Trả về đúng hình dạng GocNhin để dùng lại thẻ của Quick Read: nhờ vậy nút
 * "Muốn biết vì sao không?" hoạt động y hệt ở mọi màn. Đó là tương tác chữ ký
 * của sản phẩm, mỗi chỗ một kiểu là hỏng.
 */
export function nhipHienTai(
  laSo: LaSo,
  nam: number,
  thang: number,
  ngonNgu: NgonNguDoc = 'vi'
): GocNhin {
  const k = KHUON[ngonNgu];
  const tuoi = tuoiAmTaiNam(laSo, nam);
  const giaiDoan = cungDaiVan(laSo, tuoi);
  const cungNam = laSo.cungs[cungTieuHan(laSo, tuoi)];
  const cungThang = laSo.cungs[cungNguyetHan(laSo, tuoi, thang)];
  const chuDe = (c: Cung) => k.chuDeCung[c.tenCung];

  const cau = [
    giaiDoan && chuDe(giaiDoan)
      ? dien(k.hanhTrinh.nhipGiaiDoan, {
          tu: giaiDoan.daiVan?.tuTuoi ?? '',
          den: giaiDoan.daiVan?.denTuoi ?? '',
          chuDe: chuDe(giaiDoan)!,
        })
      : null,
    chuDe(cungNam) ? dien(k.hanhTrinh.nhipNam, { nam, chuDe: chuDe(cungNam)! }) : null,
    chuDe(cungThang) ? dien(k.hanhTrinh.nhipThang, { thang, chuDe: chuDe(cungThang)! }) : null,
    k.giaiDoan.nhacXuHuong,
  ].filter(Boolean) as string[];

  return {
    id: 'moc-hanh-trinh',
    nhomChu: k.hanhTrinh.nhipNhom,
    tieuDe: dien(k.hanhTrinh.nhipTieuDe, { thang, nam }),
    noiDung: cau.join(' '),
    canCu: [
      ...(giaiDoan
        ? [
            {
              nhan: dien(k.canCu.giaiDoanTuoi, {
                tu: giaiDoan.daiVan?.tuTuoi ?? '',
                den: giaiDoan.daiVan?.denTuoi ?? '',
                cung: tenCung(giaiDoan, k),
              }),
              giaiThich: dien(k.canCu.giaiDoanTuoiY, {
                cung: tenCung(giaiDoan, k),
                chi: CHI[giaiDoan.chiIndex],
              }),
            },
          ]
        : []),
      {
        nhan: dien(k.canCu.namUngVao, { nam, cung: tenCung(cungNam, k) }),
        giaiThich: dien(k.canCu.namUngVaoY, { nam, tuoi, cung: tenCung(cungNam, k) }),
      },
      {
        nhan: dien(k.canCu.thangUngVao, { thang, cung: tenCung(cungThang, k) }),
        giaiThich: dien(k.canCu.thangUngVaoY, { thang, nam, cung: tenCung(cungThang, k) }),
      },
    ],
  };
}

/** Chuyển một mốc thành GocNhin để dùng chung thẻ có nút mở căn cứ */
export function mocThanhGocNhin(moc: MocHanhTrinh, nhomChu: string): GocNhin {
  return {
    id: 'moc-hanh-trinh',
    nhomChu,
    tieuDe: `${moc.nhan} · ${moc.phu}`,
    noiDung: moc.chuDe,
    canCu: moc.canCu,
  };
}
