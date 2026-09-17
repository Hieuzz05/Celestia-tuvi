import {
  cungDaiVan,
  cungNguyetHan,
  cungTieuHan,
  luuTinhTheoNam,
  tamPhuongTuChinh,
  type Cung,
  type LaSo,
} from './ansao';
import { CHI, CHINH_TINH, type Sao } from './constants';
import { nhanPhuongPhap, PHUONG_PHAP } from './phuong-phap';
import { KHUON, type KhuonChu, type NgonNguDoc } from './quick-read-noi-dung';

/**
 * Luận hạn chi tiết — tầng "Xem chi tiết" của Hành trình (spec v4 mục 5-6).
 *
 * Điều spec chốt và tệp này tuân theo: **không suy diễn chỉ từ vị trí cung mà
 * Tiểu hạn / Nguyệt hạn đi vào.** Một kết luận ở đây được ghép từ nhiều lớp:
 *
 *   1. nền lá số gốc (chính tinh, phụ tinh trọng yếu, độ sáng, Tứ Hóa, Tuần/Triệt)
 *   2. lớp Đại hạn
 *   3. lớp năm — kèm lưu tinh chạy theo năm đang xem
 *   4. tam phương tứ chính của cung trọng tâm
 *   5. lớp tháng chồng lên năm
 *
 * "Nên tận dụng" và "Nên lưu ý" không phải lời chung chung: mỗi dòng đều đến từ
 * một sao cụ thể đang đóng ở một cung cụ thể trong các lớp trên. Nhịp hành động
 * đọc từ tương quan số lượng cát/hung sau khi đã trừ đi ảnh hưởng Tuần/Triệt.
 *
 * Phiên bản bộ quy tắc ghi kèm ở `phuongPhap` để kết quả tái lập được.
 */

export type CapLuanHan = 'giai-doan' | 'nam' | 'thang';

export interface YeuTo {
  /** Sao sinh ra dòng này */
  sao: string;
  /** Cung nó đang đóng */
  cung: string;
  /** Lớp nào mang nó tới: nền lá số, đại hạn, năm, tháng */
  lop: string;
  cau: string;
}

export interface NhomCanCu {
  nhan: string;
  dong: string[];
}

export interface LuanHan {
  cap: CapLuanHan;
  tieuDe: string;
  subline: string;
  chuDeChinh: string;
  tanDung: YeuTo[];
  luuY: YeuTo[];
  nhip: { nhan: string; mo: string };
  linhVuc: { id: string; nhan: string; cau: string }[];
  canCu: NhomCanCu[];
  /** Câu mở sẵn khi bấm "Hỏi Celes về giai đoạn này" */
  cauHoiGoiY: string;
  phuongPhap: string;
}

function dien(mau: string, gt: Record<string, string | number>): string {
  return mau.replace(/\{(\w+)\}/g, (_, k) => String(gt[k] ?? ''));
}

function tenCung(cung: Cung, k: KhuonChu) {
  return k.tenCung[cung.tenCung] ?? cung.tenCung;
}

function laChinhTinh(s: Sao) {
  return (CHINH_TINH as readonly string[]).includes(s.ten);
}

/** Độ sáng đủ để sao thể hiện được nét của nó */
const SANG_RO = new Set(['M', 'V', 'D', 'L']);

/**
 * Gom các yếu tố thuận / cản của một cung trong một lớp.
 *
 * Một sao cát nhưng hãm địa thì không tính là thuận — đó là chỗ nhiều bản luận
 * tự động hay sai: đếm tên sao mà bỏ qua độ sáng.
 */
function yeuToCuaCung(cung: Cung, lop: string, k: KhuonChu): { thuan: YeuTo[]; can: YeuTo[] } {
  const thuan: YeuTo[] = [];
  const can: YeuTo[] = [];
  const ten = tenCung(cung, k);
  const chuDe = k.chuDeCung[cung.tenCung] ?? ten;

  for (const s of cung.sao) {
    const trongYeu = laChinhTinh(s) || s.loai === 'tu-hoa';
    if (!trongYeu && s.tinhChat === 'trung') continue;

    const sang = s.doSang ? k.doSang[s.doSang] : undefined;
    const manh = !s.doSang || SANG_RO.has(s.doSang);
    const cau = sang
      ? `${s.ten} (${sang}) ${k.luanHan.taiO} ${ten} — ${chuDe}`
      : `${s.ten} ${k.luanHan.taiO} ${ten} — ${chuDe}`;
    const yt: YeuTo = { sao: s.ten, cung: ten, lop, cau };

    if (s.tinhChat === 'cat' && manh) thuan.push(yt);
    else if (s.tinhChat === 'hung' || (s.tinhChat === 'cat' && !manh)) can.push(yt);
    else if (laChinhTinh(s) && manh) thuan.push(yt);
    else if (laChinhTinh(s) && !manh) can.push(yt);
  }

  // Tuần/Triệt không phải sao xấu, nhưng làm nét của cung khó hiện ra đúng lúc —
  // xếp vào nhóm cần lưu ý chứ không phải nhóm cản.
  if (cung.coTuan || cung.coTriet) {
    const nhan = [cung.coTuan ? 'Tuần' : null, cung.coTriet ? 'Triệt' : null]
      .filter(Boolean)
      .join(' + ');
    can.push({
      sao: nhan,
      cung: ten,
      lop,
      cau: dien(k.luanHan.tuanTrietCau, { ten: nhan, cung: ten, chuDe }),
    });
  }

  return { thuan, can };
}

/** Lưu tinh của năm đang xem, đổ về từng cung */
function luuTinhTheoCung(namXem: number) {
  const theoCung = new Map<number, { ten: string; tinhChat?: Sao['tinhChat'] }[]>();
  for (const s of luuTinhTheoNam(namXem)) {
    if (!theoCung.has(s.chiIndex)) theoCung.set(s.chiIndex, []);
    theoCung.get(s.chiIndex)!.push({ ten: s.ten, tinhChat: s.tinhChat });
  }
  return theoCung;
}

function nhipTu(soThuan: number, soCan: number, k: KhuonChu) {
  const lech = soThuan - soCan;
  if (lech >= 2) return { nhan: k.luanHan.nhipTien, mo: k.luanHan.nhipTienMo };
  if (lech <= -2) return { nhan: k.luanHan.nhipThuHep, mo: k.luanHan.nhipThuHepMo };
  if (soCan > soThuan) return { nhan: k.luanHan.nhipRaSoat, mo: k.luanHan.nhipRaSoatMo };
  return { nhan: k.luanHan.nhipGiu, mo: k.luanHan.nhipGiuMo };
}

/**
 * Dựng một bài luận hạn.
 *
 * @param cap  đang xem quãng dài, một năm, hay một tháng
 * @param nam  năm đang xem (âm lịch, cùng hệ với engine)
 * @param thang tháng đang xem — chỉ dùng khi cap = 'thang'
 */
export function luanHan(
  laSo: LaSo,
  cap: CapLuanHan,
  nam: number,
  thang: number,
  ngonNgu: NgonNguDoc = 'vi'
): LuanHan {
  const k = KHUON[ngonNgu];
  const tuoi = nam - laSo.thongTin.amLich.nam + 1;

  const cungMenh = laSo.cungs[laSo.menhIndex];
  const cungDai = cungDaiVan(laSo, tuoi) ?? cungMenh;
  const cungNam = laSo.cungs[cungTieuHan(laSo, tuoi)];
  const cungThang = laSo.cungs[cungNguyetHan(laSo, tuoi, thang)];

  // Cung trọng tâm đổi theo cấp đang xem, nhưng các lớp dưới vẫn được tính vào
  const trongTam = cap === 'giai-doan' ? cungDai : cap === 'nam' ? cungNam : cungThang;

  const lopDangXet: string[] = [
    dien(k.luanHan.lopDaiVan, {
      tu: cungDai.daiVan?.tuTuoi ?? '',
      den: cungDai.daiVan?.denTuoi ?? '',
      cung: tenCung(cungDai, k),
    }),
    dien(k.luanHan.lopNam, { nam, cung: tenCung(cungNam, k) }),
    ...(cap === 'thang'
      ? [dien(k.luanHan.lopThang, { thang, cung: tenCung(cungThang, k) })]
      : []),
  ];

  // --- Gom yếu tố từ từng lớp ---
  const gom = [
    yeuToCuaCung(cungMenh, k.luanHan.nenLop, k),
    yeuToCuaCung(cungDai, lopDangXet[0], k),
    yeuToCuaCung(cungNam, lopDangXet[1], k),
    ...(cap === 'thang' ? [yeuToCuaCung(cungThang, lopDangXet[2], k)] : []),
  ];

  // Lưu tinh của năm đang xem, chỉ lấy những sao rơi đúng vào cung trọng tâm
  const luu = luuTinhTheoCung(nam).get(trongTam.chiIndex) ?? [];
  const thuanLuu: YeuTo[] = [];
  const canLuu: YeuTo[] = [];
  for (const s of luu) {
    const yt: YeuTo = {
      sao: s.ten,
      cung: tenCung(trongTam, k),
      lop: lopDangXet[1],
      cau: `${s.ten} ${k.luanHan.taiO} ${tenCung(trongTam, k)}`,
    };
    if (s.tinhChat === 'cat') thuanLuu.push(yt);
    else if (s.tinhChat === 'hung') canLuu.push(yt);
  }

  // Lấy xen kẽ giữa các lớp chứ không đổ hết lớp đầu: ba dòng cùng đến từ cung
  // Mệnh thì người đọc không thấy được rằng kết luận đang tổng hợp nhiều lớp.
  const xenKe = (ds: YeuTo[][], toiDa: number) => {
    const ra: YeuTo[] = [];
    for (let i = 0; ra.length < toiDa; i++) {
      const conHang = ds.some((d) => d.length > i);
      if (!conHang) break;
      for (const d of ds) {
        if (d[i] && ra.length < toiDa) ra.push(d[i]);
      }
    }
    return ra;
  };

  const tanDung = xenKe([...gom.map((g) => g.thuan), thuanLuu], 3);
  const luuY = xenKe([...gom.map((g) => g.can), canLuu], 3);

  const nhip = nhipTu(
    gom.reduce((n, g) => n + g.thuan.length, 0) + thuanLuu.length,
    gom.reduce((n, g) => n + g.can.length, 0) + canLuu.length,
    k
  );

  const chuDe = k.chuDeCung[trongTam.tenCung] ?? tenCung(trongTam, k);
  const tieuDe =
    cap === 'giai-doan'
      ? dien(k.luanHan.tieuDeGiaiDoan, { chuDe })
      : cap === 'nam'
        ? dien(k.luanHan.tieuDeNam, { nam, chuDe })
        : dien(k.luanHan.tieuDeThang, { thang, nam, chuDe });

  // --- Luận theo lĩnh vực: mỗi lĩnh vực đọc từ cung của nó, đối chiếu tam phương ---
  const { tamHop, xungChieu } = tamPhuongTuChinh(trongTam.chiIndex);
  const lienQuan = new Set([trongTam.chiIndex, ...tamHop, xungChieu]);

  const linhVuc = Object.entries(k.luanHan.linhVuc).map(([id, lv]) => {
    const cung = laSo.cungs.find((c) => c.tenCung === lv.cung);
    if (!cung) {
      return { id, nhan: lv.nhan, cau: dien(k.luanHan.linhVucTrong, { nhan: lv.nhan }) };
    }

    // Mọi lĩnh vực đều đọc được từ cung của chính nó. Việc quãng đang xét có
    // chạm vào cung đó hay không là một thông tin THÊM, không phải lý do để bỏ
    // trống: nói "không có gì nổi bật" cho năm trên sáu phần là vô dụng.
    const { thuan, can } = yeuToCuaCung(cung, lopDangXet[0], k);
    const trangThai =
      thuan.length > can.length
        ? k.luanHan.trangThaiThuan
        : can.length > thuan.length
          ? k.luanHan.trangThaiCan
          : k.luanHan.trangThaiCanBang;
    return {
      id,
      nhan: lv.nhan,
      cau: dien(k.luanHan.linhVucCo, {
        nhan: lv.nhan,
        cung: tenCung(cung, k),
        trangThai,
        them: lienQuan.has(cung.chiIndex) ? k.luanHan.chamVao : k.luanHan.khongChamVao,
      }),
    };
  });

  // --- Căn cứ, gom theo nhóm chứ không đổ dữ liệu thô ---
  const saoTrongTam = trongTam.sao.filter((s) => laChinhTinh(s) || s.loai === 'phu-tinh').slice(0, 6);
  const tuHoa = [cungMenh, cungDai, cungNam, cungThang].flatMap((c) =>
    c.sao.filter((s) => s.loai === 'tu-hoa').map((s) => `${s.ten} tại ${tenCung(c, k)}`)
  );
  const vongSao = [
    ...[cungMenh, cungDai, cungNam, cungThang]
      .filter((c) => c.coTuan || c.coTriet)
      .map(
        (c) =>
          `${[c.coTuan ? 'Tuần' : null, c.coTriet ? 'Triệt' : null].filter(Boolean).join(' + ')} tại ${tenCung(c, k)}`
      ),
    ...luu.map((s) => `${s.ten} tại ${tenCung(trongTam, k)}`),
  ];

  const canCu: NhomCanCu[] = [
    { nhan: k.luanHan.nhomLop, dong: lopDangXet },
    {
      nhan: k.luanHan.nhomCung,
      dong: [`${tenCung(trongTam, k)} (${CHI[trongTam.chiIndex]}) — ${chuDe}`],
    },
    {
      nhan: k.luanHan.nhomSao,
      dong: saoTrongTam.map((s) =>
        s.doSang ? `${s.ten} · ${k.doSang[s.doSang] ?? s.doSang}` : s.ten
      ),
    },
    {
      nhan: k.luanHan.nhomTamPhuong,
      dong: [
        ...tamHop.map((i) => `${tenCung(laSo.cungs[i], k)} (${CHI[i]})`),
        `${tenCung(laSo.cungs[xungChieu], k)} (${CHI[xungChieu]})`,
      ],
    },
    ...(tuHoa.length ? [{ nhan: k.luanHan.nhomTuHoa, dong: tuHoa }] : []),
    ...(vongSao.length ? [{ nhan: k.luanHan.nhomVongSao, dong: vongSao }] : []),
    {
      nhan: k.luanHan.nhomQuyTac,
      dong: [nhanPhuongPhap(), `${k.luanHan.quyTacMo}`, PHUONG_PHAP.lopHoTro.join(' · ')],
    },
  ].filter((n) => n.dong.length > 0);

  const cauHoiGoiY =
    cap === 'thang'
      ? `Tháng ${thang}/${nam} tôi nên chú ý điều gì nhất?`
      : cap === 'nam'
        ? `Năm ${nam} tôi nên ưu tiên điều gì?`
        : 'Giai đoạn này đang muốn nói gì với tôi?';

  return {
    cap,
    tieuDe,
    subline: k.luanHan.subline,
    chuDeChinh: chuDe,
    tanDung,
    luuY,
    nhip,
    linhVuc,
    canCu,
    cauHoiGoiY,
    phuongPhap: nhanPhuongPhap(),
  };
}
