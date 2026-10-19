/**
 * Bảng luật quan hệ giữa các sao — dụng, chế, giải, phá — và khối luật Tuần Triệt.
 *
 * Phương án `D:\Celestia\PHUONG-AN-3a-ban7-ma.md` (bản 2, bước C-B). Nội dung lấy từ bảng đếm
 * `D:\Celestia\BANG-DEM-NGUON-C-B.md` bản 2, chủ dự án duyệt 18/10/2026: cách đếm theo tác giả
 * gốc, các chỗ hoà X1–X10, không nạp lời phán nặng (chỉ nạp chiều), thêm luật mục E.
 *
 * Tệp này CHỈ là dữ liệu + hàm kiểm + một hàm tính độ sáng hiệu dụng. Chưa nối vào đâu. Bước
 * C-C (`xet-cung.ts`) đọc nó; C-D đưa kết quả thành căn cứ nội bộ. Nhãn hướng vẫn do engine tính
 * (Q3); luật ở đây là căn cứ, KHÔNG vào lời bài luận (không có câu "sao X xấu nhưng có Y giải").
 * Nguồn sách chỉ sống trong mã và test: không hiển thị, không đưa vào prompt.
 *
 * Luật mức theo số nhóm tác giả (Q1, 18/10/2026):
 *  - ≥2 nhóm độc lập (`NHOM_NGUON`, hoặc `tacGia` khi sách dẫn lại người khác): mọi mức;
 *  - 1 nhóm: chỉ `giam`, `giam-luat`, `thu-hep` — không chặn hẳn, không lật ngược;
 *  - sách nói ngược: ghi `nguonNguoc`, không tự thắng; chỗ hoà đã được chủ dự án duyệt.
 * `kiemBangQuanHe` máy canh luật này.
 *
 * Hàm thuần, không đọc biến môi trường, không import `lib/rag`: web và app cùng đọc qua `@tuvi/*`.
 */

import type { NguHanh } from './constants';
import type { DoSang } from './dosang';
import { NHOM_NGUON, type NguonSach } from './luat-to-hop';

import type { KhongApDung } from './ho-so-cung';
const KAD = 'khong-ap-dung' as const;

/** Nguồn của luật quan hệ: có thể là một khoảng dòng, và có thể ghi tác giả gốc khi sách dẫn lại */
export interface NguonQuanHe extends NguonSach {
  /** Dòng cuối của khoảng (gồm cả nó). Câu trích phải nằm trong các dòng `dong..den` nối lại */
  den?: number;
  /**
   * Nhóm tác giả gốc khi sách dẫn lại người khác để tán thành hoặc tường thuật — vd Tử vi tổng
   * hợp 1054 tường thuật thuyết của Việt Viêm Tử → 'phu-toan-thu'. Không ghi = theo `NHOM_NGUON`.
   */
  tacGia?: string;
}

/**
 * - `DUNG`: sao chủ động dùng được sao kia, sao hung thành trợ lực (Sát Phá Tham dụng sát).
 * - `CHE`: sao chủ động kìm sao hung.
 * - `GIAI`: sao chủ động giải bớt hoạ của sao / bộ sao kia.
 * - `PHA`: sao hung làm hỏng cát, hoặc làm hỏng khả năng chế / giải của sao kia.
 */
export type LoaiQuanHe = 'DUNG' | 'CHE' | 'GIAI' | 'PHA';

/**
 * Tác dụng lên bên bị tác động.
 *  - `giam`: yếu đi (hung bớt hung với DUNG/CHE/GIAI; cát bớt cát với PHA).
 *  - `chan`: mất hẳn tác dụng.
 *  - `lat`: đổi chiều (DUNG: sát thành trợ lực; PHA: cát / trung tính thành hại).
 *  - `giam-luat`: luật `ngoaiLeCua` chỉ còn một phần hiệu lực.
 *  - `thu-hep`: luật `ngoaiLeCua` ngừng áp; KHÔNG phán thêm hung / cát.
 */
export type MucQuanHe = 'giam' | 'chan' | 'lat' | 'giam-luat' | 'thu-hep';
export const MUC_MOT_NHOM: readonly MucQuanHe[] = ['giam', 'giam-luat', 'thu-hep'];

/** Một nhóm sao: `mot-trong` = có một sao là đủ; `tat-ca` = tổ hợp, phải đủ mặt (Tử Phủ đồng cung) */
export interface TapSao {
  sao: string[];
  kieu: 'mot-trong' | 'tat-ca';
}

/** `bat-ky` hoặc danh sách độ sáng được nhận */
export type DieuKienDoSang = 'bat-ky' | DoSang[];

/**
 * Tuần / Triệt đóng ở cung của sao chủ động thì quan hệ đổi ra sao.
 * `theo-chung` = theo khối `TUAN_TRIET` (độ sáng hiệu dụng), không có câu sách riêng cho cặp này.
 */
export type BienDoi = 'mat' | 'giam' | 'nang' | 'dao-thanh-hai' | 'khong-doi' | 'theo-chung';

/** Vị trí giữa hai bên. `cung-han`: sao chủ động ở cung hạn, bên bị tác động là cách của Mệnh / Tài / Quan */
export type ViTriQuanHe = 'dong-cung' | 'tam-phuong' | 'cung-han';

/** Điều kiện cả lá, tra từ `hoSoLa` / `hoSoCung` */
export type DieuKienLa =
  | 'menh-cuc-tuong-sinh'
  | 'am-duong-thuan-ly'
  | 'menh-vo-chinh-dieu'
  | 'sat-hop-hanh-menh'
  | 'menh-than'
  | 'tuy-menh-than-phuc'
  | 'cach-menh-tai-quan';

export interface LuatQuanHe {
  ma: string;
  loai: LoaiQuanHe;
  chuDong: TapSao;
  /** `tru`: danh sách âm — sao KHÔNG chịu tác động dù thuộc nhóm (Phủ không chế được Không Kiếp) */
  biTacDong: (TapSao & { tru: string[] }) | KhongApDung;
  viTri: ViTriQuanHe;
  /** Cung (chiIndex) được nhận cho từng bên, tách khỏi độ sáng; theo từng sao khi mỗi sao một danh sách */
  dieuKienCung: { chuDong: number[] | KhongApDung; biTacDong: Record<string, number[]> | number[] | KhongApDung };
  doSang: { chuDong: DieuKienDoSang; biTacDong: DieuKienDoSang };
  /** Nhóm HOẶC: mỗi phần tử là một nhóm, cần ít nhất một sao của mỗi nhóm đi kèm */
  canKem: string[][] | KhongApDung;
  /** Luật chỉ là điều kiện / bổ trợ cho luật khác, không tự đứng */
  khongDuocDungMotMinh: boolean;
  /** Ngưỡng đếm: đủ bao nhiêu sao của `tapSao` trong `phamVi` thì mức đổi theo `bac` */
  nguong: { tapSao: string[]; phamVi: 'dong-cung' | 'tam-phuong'; bac: { tu: number; muc: MucQuanHe }[] } | KhongApDung;
  bienDoi: { tuan: BienDoi; triet: BienDoi };
  /** Lớp của sao chủ động: gốc, theo hạn (sao lưu / hoá theo hạn), hay lớp nào cũng được */
  lop: 'goc' | 'han' | 'bat-ky';
  /** Tuổi: chi năm sinh (0 = Tý). `tang` = làm luật mạnh thêm; `bat-buoc` = thiếu thì luật không áp */
  tuoi: { chiNamSinh: number[]; vaiTro: 'tang' | 'bat-buoc' } | KhongApDung;
  /** Hành Bản Mệnh theo cung của bên bị tác động: `du` áp đủ, `khongAp` luật ngừng; còn lại áp mức giảm */
  hanhMenh: { du: Record<number, NguHanh[]>; khongAp: Record<number, NguHanh[]> } | KhongApDung;
  dieuKienLa: DieuKienLa[] | KhongApDung;
  /** Câu sách chỉ nói một lĩnh vực (vd sức khoẻ) → luật chỉ áp ở lĩnh vực đó. Không ghi = mọi lĩnh vực */
  linhVuc?: ('suc-khoe' | 'tai-loc' | 'cong-danh')[];
  muc: MucQuanHe;
  doBen: 'ben' | 'khong-ben' | KhongApDung;
  /** Hai luật ngược chiều cùng khớp: số lớn thắng */
  uuTien: number;
  ngoaiLeCua: string | KhongApDung;
  /** Câu nghĩa nội bộ, ngắn — KHÔNG đưa nguyên văn vào bài luận */
  nghia: string;
  nguon: NguonQuanHe[];
  nguonNguoc: NguonQuanHe[];
  chacChan: 'cao' | 'thap';
}

// ---------------------------------------------------------------------------------------------
// Tên tệp sách, tập sao, cung

const KL = 'Tử Vi khảo luận.md';
const NLTT = 'Tử Vi nghiệm lý toàn thư - Thiên Lương.md';
const NL74 = 'Tử vi nghiệm lý 1974 - Thiên Lương.md';
const HS = 'Tử Vi hàm số - Nguyễn Phát Lộc.md';
const TH = 'Tử vi tổng hợp.md';
const AB = 'Tử Vi ảo bí - Việt Viêm Tử.md';
const CK = 'Chìa khóa Tử Vi.md';
const DS = 'Tử Vi đẩu số toàn thư - Vũ Tài Lục.md';
const BT = 'Tử Vi Bổ Túc - Nguyễn Mạnh Bảo.md';
const TD = 'Tự Điển Tử Vi - Đắc Lộc.md';

const n = (sach: string, dong: number, trich: string, them: Partial<NguonQuanHe> = {}): NguonQuanHe => ({ sach, dong, trich, ...them });

const KINH_DA = ['Kình Dương', 'Đà La'];
const HOA_LINH = ['Hỏa Tinh', 'Linh Tinh'];
const KHONG_KIEP = ['Địa Không', 'Địa Kiếp'];
/** "Tứ sát" theo nghĩa hẹp của Tổng hợp / Khảo luận: Kình Đà Hỏa Linh (KHÔNG gồm Không Kiếp — X3) */
const TU_SAT = [...KINH_DA, ...HOA_LINH];
const LUC_SAT = [...TU_SAT, ...KHONG_KIEP];
const TAM_HOA = ['Hóa Khoa', 'Hóa Quyền', 'Hóa Lộc'];

const DAN_THAN_TY_HOI = [2, 8, 5, 11];
const TU_MO = [4, 10, 1, 7];
const SUU_MUI = [1, 7];
const TY_HOI = [5, 11];
const MAO_DAU = [3, 9];
const KHONG_HAM: DoSang[] = ['M', 'V', 'D', 'L', 'B'];
const DAC_TRO_LEN: DoSang[] = ['M', 'V', 'D'];

const mot = (...sao: string[]): TapSao => ({ sao, kieu: 'mot-trong' });
const du = (...sao: string[]): TapSao => ({ sao, kieu: 'tat-ca' });
const bi = (t: TapSao, tru: string[] = []) => ({ ...t, tru });
const KHONG_DIEU_KIEN_CUNG = { chuDong: KAD, biTacDong: KAD } as const;
const BAT_KY = { chuDong: 'bat-ky', biTacDong: 'bat-ky' } as const;
const TT_CHUNG = { tuan: 'theo-chung', triet: 'theo-chung' } as const;

// ---------------------------------------------------------------------------------------------
// Bảng luật

export const LUAT_QUAN_HE: readonly LuatQuanHe[] = [
  // ----- B1. Sát Phá Tham dụng sát -----
  // Điều kiện sát đắc: NLTT 455, 458 + Đẩu số 1174. Chính tinh hãm thì không dụng: NLTT 459,
  // Đẩu số 1174, Ảo bí 4300. Tuổi Thìn Tuất Sửu Mùi / sát hợp hành Mệnh: NLTT 458, 460, Ảo bí 4287.
  {
    ma: 'PHA_DUNG_KHONG_KIEP',
    loai: 'DUNG',
    chuDong: mot('Phá Quân'),
    biTacDong: bi(mot(...KHONG_KIEP)),
    viTri: 'tam-phuong',
    dieuKienCung: { chuDong: KAD, biTacDong: DAN_THAN_TY_HOI },
    doSang: { chuDong: KHONG_HAM, biTacDong: 'bat-ky' },
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: { chiNamSinh: TU_MO, vaiTro: 'tang' },
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'lat',
    doBen: 'khong-ben',
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Phá Quân không hãm dùng được Không Kiếp đắc địa: sát thành trợ lực, phát nhanh nhưng không bền.',
    nguon: [
      n(KL, 2482, 'Phá quân giải trừ được ác tính của Không Kiếp'),
      n(NLTT, 457, 'Như Không Kiếp chịu sự điều động của Phá Quân'),
      n(NLTT, 458, 'Phá Quân được Không Kiếp ở Dần Thân Tỵ Hợi'),
      n(NLTT, 455, 'Địa không Địa Kiếp - (Hoả) đắc đại ở Tỵ Hợi, Dần Thân'),
      n(NLTT, 459, 'Trái lại khi họ ở thế hãm'),
      n(AB, 4293, 'Bộ Sát Phá Tham không sợ hung sát tinh lắm'),
      n(AB, 4300, 'Khi ngộ hãm địa, ảnh hưởng của Sát Phá Tham rất hung họa'),
      n(KL, 1586, 'có giầu sang cũng chẳng bền'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'SAT_DUNG_KINH_DA',
    loai: 'DUNG',
    chuDong: mot('Thất Sát'),
    biTacDong: bi(mot(...KINH_DA)),
    viTri: 'tam-phuong',
    // Kình Đà cùng đắc ở tứ mộ (khớp dosang.ts — chủ dự án chốt 19/10/2026: Đà hành Kim, tứ mộ Thổ sinh
    // Kim). NLTT 458 ghi Đà ở Dần Thân Tỵ Hợi là phía thiểu số; ở đó Đà có cách riêng (DA_DAN_THAN_VCD…)
    dieuKienCung: { chuDong: KAD, biTacDong: TU_MO },
    doSang: { chuDong: KHONG_HAM, biTacDong: 'bat-ky' },
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: { chiNamSinh: TU_MO, vaiTro: 'tang' },
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'lat',
    doBen: 'khong-ben',
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thất Sát không hãm dùng được Kình Đà đắc địa (tứ mộ): sát thành trợ lực, không bền.',
    nguon: [
      n(KL, 2618, 'Kình Đà  đắc địa gặp quan thầy là Thất sát ở Mệnh thì phát mạnh'),
      n(KL, 2482, 'Thất sát giải trừ Kình Đà'),
      n(KL, 2481, 'Thất Sát là thầy Kình Đà nên chế ngự được Kình Đà'),
      n(NLTT, 457, 'Kình Đà chấp nhận sự hướng dẫn của Thất Sát'),
      n(NLTT, 458, 'Kình Dương ở tứ mộ'),
      n(DS, 584, 'Thất Sát Phá Quân chuyên ỷ Dương Linh chi ngược'),
      n(KL, 1586, 'không ngán Kình Đà'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  // Đà La hãm ở Dần Thân Tỵ Hợi vẫn có cách riêng (chuyen-gia-tu-vi soát 19/10/2026)
  {
    ma: 'DA_DAN_THAN_VCD',
    loai: 'DUNG',
    chuDong: mot('Đà La'),
    biTacDong: KAD,
    viTri: 'dong-cung',
    dieuKienCung: { chuDong: [2, 8], biTacDong: KAD },
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    // Tổng hợp 2541 + 3287 nói Tuần Triệt làm mất cách, nhưng chỉ một nhóm → giảm (Q1), không 'mat'
    bienDoi: { tuan: 'giam', triet: 'giam' },
    lop: 'goc',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: ['menh-vo-chinh-dieu'],
    muc: 'lat',
    doBen: KAD,
    uuTien: 2,
    ngoaiLeCua: KAD,
    nghia: 'Đà La ở Dần Thân tại Mệnh (hoặc Phúc) vô chính diệu: hãm mà thành cách quý; Tuần Triệt đóng đó thì mất hay.',
    nguon: [
      n(TH, 2541, 'Đà la ở Dần Thân, vô chính diệu thì đắc cách quí hiển cả về văn lẫn võ'),
      n(TH, 3287, 'Đà La ở Dần Thân vô chính diệu, không có Tuần Triệt đồng cung'),
      n(KL, 1874, 'Đà Dần Thân Vô chính diệu: phúc thọ may mắn'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'DA_HAM_GAP_QUYEN',
    loai: 'DUNG',
    chuDong: mot('Hóa Quyền'),
    biTacDong: bi(mot('Đà La')),
    viTri: 'tam-phuong',
    dieuKienCung: { chuDong: KAD, biTacDong: DAN_THAN_TY_HOI },
    doSang: BAT_KY,
    // Khảo luận: Đà Lực Quyền; Tự điển: Đà hãm ngộ (Tả Hữu) Lộc Quyền
    canKem: [['Hóa Lộc', 'Lực Sĩ']],
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'goc',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'lat',
    doBen: KAD,
    uuTien: 2,
    ngoaiLeCua: KAD,
    nghia: 'Đà La hãm ở Dần Thân Tỵ Hợi gặp Hóa Quyền kèm Hóa Lộc hoặc Lực Sĩ: phản thành có quyền hành; thêm Tả Hữu thì phát về võ.',
    nguon: [
      n(KL, 1867, 'Đà Lực Quyền ở Dần Thâm Tỉ Hợi: có quyền hành'),
      n(TD, 548, 'Đà la hãm địa ở Dần, Thân, Tị, Hợi ngộ Tả, Hữu, Lộc Quyền == Võ phát công danh'),
    ],
    nguonNguoc: [],
    // Sách không nói Quyền phải đồng cung hay chỉ tam hợp → để tam phương, chắc chắn thấp
    chacChan: 'thap',
  },
  {
    ma: 'THAM_DUNG_HOA_LINH',
    loai: 'DUNG',
    chuDong: mot('Tham Lang'),
    biTacDong: bi(mot(...HOA_LINH)),
    viTri: 'tam-phuong',
    dieuKienCung: { chuDong: KAD, biTacDong: [2, 3, 4, 5, 6] },
    doSang: { chuDong: KHONG_HAM, biTacDong: 'bat-ky' },
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: { chiNamSinh: TU_MO, vaiTro: 'tang' },
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'lat',
    doBen: 'khong-ben',
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Tham Lang không hãm dùng được Hỏa Linh đắc địa: sát thành trợ lực.',
    nguon: [
      n(KL, 2482, 'Tham lang giải trừ Hỏa Linh'),
      n(NLTT, 457, 'Linh Hoả tuân theo nghiêm lệnh của Tham Lang'),
      n(NLTT, 455, 'Hoả tinh Linh tinh –(Hoả) đắc địa ở Dần Mão Thìn Tỵ Ngọ'),
      n(DS, 1174, 'Tham Lang nhập miếu ngộ Hoả Linh thì ở vũ chức nắm đại quyên'),
      n(AB, 4298, 'Tham ngộ Hỏa thành phú ông cách'),
      n(TH, 4047, 'chớ nên vội cho rằng có họa bởi vì nết sát hung tinh đi liền với cách Sát'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'THAT_SAT_DU_TU_SAT',
    loai: 'PHA',
    chuDong: du(...TU_SAT),
    biTacDong: bi(mot('Thất Sát')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: { tapSao: TU_SAT, phamVi: 'tam-phuong', bac: [{ tu: 4, muc: 'lat' }] },
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'lat',
    doBen: KAD,
    uuTien: 2,
    ngoaiLeCua: 'SAT_DUNG_KINH_DA',
    // Lời phán ("giảm thọ", "chết trận") không nạp — chỉ nạp chiều
    nghia: 'Thất Sát gặp đủ Kình Đà Hỏa Linh thì hết chế, nghiêng hung; sát hãm thì nặng hơn.',
    nguon: [
      n(KL, 2481, 'nếu gặp cùng một lúc Kình Đà, Hỏa Linh (Tứ Sát)'),
      n(DS, 588, 'Thất Sát trùng phùng Tứ Sát'),
      n(DS, 588, 'gặp  Hoả Linh ở hãm địa'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'PHA_GAP_HOA_LINH',
    loai: 'PHA',
    chuDong: mot(...HOA_LINH),
    biTacDong: bi(mot('Phá Quân')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Phá Quân gặp Hỏa Linh thêm hung bạo.',
    nguon: [n(KL, 2485, 'Phá quân + Hao (Hỏa Linh) thêm hung bạo')],
    // Cùng cuốn lại nói Phá Quân cần Song Hao — chữ "Hao" không chắc
    nguonNguoc: [n(KL, 1629, 'Phá quân cần  Song Hao')],
    chacChan: 'thap',
  },

  // ----- B2. Thiên Phủ, Tử Vi, Tử Phủ -----
  {
    ma: 'PHU_CHE_TU_SAT',
    loai: 'CHE',
    chuDong: mot('Thiên Phủ'),
    biTacDong: bi(mot(...TU_SAT), KHONG_KIEP),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    // Từng sao riêng hoặc 2–3 sao vẫn chế; đủ 4 thì luật PHU_HET_CHE_DU_TU_SAT tắt luật này (S7)
    nguong: { tapSao: TU_SAT, phamVi: 'tam-phuong', bac: [{ tu: 1, muc: 'giam' }] },
    bienDoi: { tuan: 'mat', triet: 'giam' },
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Phủ kìm được Kình Đà Hỏa Linh, kể cả khi gặp hai ba sao; không kìm được Không Kiếp.',
    nguon: [
      n(TH, 4074, 'Phủ có khả năng mạnh hơn Tử -Vi trong việc đối chọi với sát tinh'),
      n(HS, 2145, 'Thiên Phủ chế được hung tinh của sát tinh hạng vừa như Kình, Đà, Linh hay Hỏa'),
      n(KL, 1326, 'tính hung hăng của Kình Đà, Hỏa Linh'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'PHU_HET_CHE_DU_TU_SAT',
    loai: 'PHA',
    chuDong: du(...TU_SAT),
    biTacDong: bi(mot('Thiên Phủ')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: { tapSao: TU_SAT, phamVi: 'tam-phuong', bac: [{ tu: 4, muc: 'thu-hep' }] },
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'thu-hep',
    doBen: KAD,
    uuTien: 2,
    ngoaiLeCua: 'PHU_CHE_TU_SAT',
    nghia: 'Thiên Phủ gặp đủ bốn sao Kình Đà Hỏa Linh thì không còn kìm được.',
    nguon: [
      n(TH, 4075, 'Nếu chẳng may Phủ gặp cả bốn (tứ hung) thì mất nhiều uy lực'),
      n(HS, 2145, 'nếu Thiên Phủ gặp đủ cả 4 sao, Thiên Phủ không chế nổi'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'PHU_SO_KHONG_KIEP',
    loai: 'PHA',
    chuDong: mot(...KHONG_KIEP),
    biTacDong: bi(mot('Thiên Phủ')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    // Sách nói "chưa phải địch thủ", "chiết giảm đáng kể" — kìm không nổi, chưa phải mất hẳn
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Phủ gặp Không Kiếp thì không kìm nổi, sức giữ giảm đáng kể.',
    nguon: [
      n(TH, 4076, 'Lẽ dĩ nhiên Phủ chưa phải là địch thủ của Địa Không, Địa Kiếp'),
      n(KL, 1326, 'Không Kiếp hãm thì kho Thiên phủ tan tành và trống rỗng'),
      n(KL, 1330, 'Thiên phủ sợ gặp Hóa kỉ và Không Kiếp'),
      n(AB, 4280, 'Cách Tử-Phủ tuy kỵ Kiếp Không'),
      n(HS, 2144, 'Bấy giờ, uy quyền, tài lộc bị chiết giảm đáng kể'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'PHU_SO_THIEN_KHONG',
    loai: 'PHA',
    chuDong: mot('Thiên Không'),
    biTacDong: bi(mot('Thiên Phủ')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Phủ gặp Thiên Không thì giảm sức giữ và kìm.',
    nguon: [
      n(TH, 4076, 'Thái Tứ Lang còn cho rằng Phủ hua sao Thiên Không'),
      n(KL, 1326, 'nếu bị Tuần không, Thiên không'),
      n(KL, 1330, 'Thiên không, Không Kiếp hội hợp thì cùng khổ suốt đời'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'PHU_SO_KY',
    loai: 'PHA',
    chuDong: mot('Hóa Kỵ'),
    biTacDong: bi(mot('Thiên Phủ')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Phủ gặp Hóa Kỵ thì giảm sức giữ.',
    nguon: [n(KL, 1330, 'Thiên phủ sợ gặp Hóa kỉ')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'TU_VI_CHE_HOA_LINH',
    loai: 'CHE',
    chuDong: mot('Tử Vi'),
    biTacDong: bi(mot(...HOA_LINH), [...KINH_DA, ...KHONG_KIEP]),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Tử Vi chỉ kìm được Hỏa Linh.',
    nguon: [
      n(TH, 4064, 'Đối chọi với sát tinh, Tử -Vi chỉ khắc được Hỏa, Linh mà thôi'),
      n(TH, 4075, 'Duy T Vi chỉ khắc phục được Hỏa Linh'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'TU_VI_GIAI_KEM_CUNG',
    loai: 'GIAI',
    chuDong: mot('Tử Vi'),
    biTacDong: KAD,
    viTri: 'tam-phuong',
    dieuKienCung: { chuDong: [11, 0, 3, 9], biTacDong: KAD },
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: true,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam-luat',
    doBen: KAD,
    uuTien: 2,
    ngoaiLeCua: 'TU_VI_CHE_HOA_LINH',
    nghia: 'Tử Vi ở Hợi, Tý, Mão, Dậu thì sức giải kém đi nhiều.',
    nguon: [n(HS, 2271, 'ở bốn cung Hợi, Tý, Mão, Dậu, Tử - Vi không còn rực rỡ')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'TU_VI_BI_VAY',
    loai: 'PHA',
    chuDong: mot(...KINH_DA, ...KHONG_KIEP),
    biTacDong: bi(mot('Tử Vi')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Tử Vi gặp Kình Đà Không Kiếp thì như bị vây, vẫn đứng được nhưng vất vả.',
    nguon: [n(TH, 4065, 'Tử -Vi ví như bị vây hãm một cách hiểm nghèo')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'TU_PHU_CHE_TU_SAT',
    loai: 'CHE',
    chuDong: du('Tử Vi', 'Thiên Phủ'),
    biTacDong: bi(mot(...TU_SAT), KHONG_KIEP),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: { chuDong: DAC_TRO_LEN, biTacDong: 'bat-ky' },
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: { tuan: 'mat', triet: 'giam' },
    lop: 'goc',
    tuoi: KAD,
    hanhMenh: KAD,
    // S8: chỉ vững khi Mệnh–Cục tương sinh, âm dương thuận lý
    dieuKienLa: ['menh-cuc-tuong-sinh', 'am-duong-thuan-ly'],
    muc: 'giam',
    doBen: KAD,
    // Bộ riêng thắng luật chung: thắng TU_VI_BI_VAY và PHU_HET_CHE_DU_TU_SAT (TH 4077: chế cả khi bốn sao "phối hợp")
    uuTien: 3,
    ngoaiLeCua: KAD,
    nghia: 'Tử Phủ đồng cung kìm được Kình Đà Hỏa Linh, chỉ vững khi Mệnh–Cục tương sinh và âm dương thuận lý.',
    nguon: [
      n(TH, 4077, 'chế hóa được Kình, Đà, Hỏa,Linh phối hợp'),
      n(TH, 4077, 'chỉ vững trãi nếu được đắc cách Mệnh cục, tương sinh. Âm Dương thuận lý'),
      n(TH, 894, 'cách Tử Phủ Vũ Tướng hội họp nhau sẽ chế cái xấu của nhiều sát tinh hạng nặng'),
    ],
    // X3: người chú giải Chìa khóa nói Tử Phủ "mới sợ" tứ sát (theo nghĩa có Không Kiếp)
    nguonNguoc: [n(CK, 756, 'Tử Vi - Thiên Phủ "Mới sợ" tứ sát tinh này')],
    chacChan: 'cao',
  },
  {
    ma: 'TU_PHU_HAN_KHONG_KIEP',
    loai: 'PHA',
    chuDong: mot(...KHONG_KIEP),
    biTacDong: bi(mot('Tử Vi', 'Thiên Phủ')),
    viTri: 'cung-han',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: ['cach-menh-tai-quan'],
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    // Chỉ Ảo bí nói đúng mệnh đề hạn (một nhóm) → mức giảm
    nghia: 'Mệnh Tài Quan có cách Tử Phủ, hạn gặp Không Kiếp thì kém đi rõ.',
    nguon: [
      n(AB, 4366, 'Mạnh Tài Quan có cách Tử-Phủ, đi đến hạn hành có Không Kiếp thời tối kỵ'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },

  // ----- B3. Thiên Tướng -----
  {
    ma: 'TUONG_CHE_SAT',
    loai: 'CHE',
    chuDong: mot('Thiên Tướng'),
    biTacDong: bi(mot(...LUC_SAT)),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: { chuDong: DAC_TRO_LEN, biTacDong: 'bat-ky' },
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    // Tổng hợp 4062: gặp Tuần Triệt thì mất uy lực cứu giải (X9: mức giảm, không dùng chữ nặng)
    bienDoi: { tuan: 'giam', triet: 'giam' },
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Tướng đắc địa trở lên kìm được sát tinh, không sợ Không Kiếp.',
    nguon: [
      n(TH, 4059, 'Tướng đắc địa trở lên chế khắc được sát tinh'),
      n(CK, 755, 'Sao Thiên Tướng "không sợ" Không, Kiếp, Kình, Đà và Thiên Không'),
      n(KL, 2473, 'Thiên tướng không sợ Không Kiếp'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'TUONG_SO_KINH_DA',
    loai: 'PHA',
    chuDong: mot(...KINH_DA),
    biTacDong: bi(mot('Thiên Tướng')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    // X4: thắng TUONG_CHE_SAT ở phần Kình Đà
    uuTien: 2,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Tướng gặp Kình Đà thì giảm sức kìm.',
    nguon: [
      n(TH, 4062, 'Thiên Tướng chỉ ngại Kình Dương'),
      n(KL, 2473, 'sợ Kình Đà'),
    ],
    nguonNguoc: [n(CK, 755, 'Sao Thiên Tướng "không sợ" Không, Kiếp, Kình, Đà')],
    chacChan: 'cao',
  },
  {
    ma: 'TUONG_SO_HINH',
    loai: 'PHA',
    chuDong: mot('Thiên Hình'),
    biTacDong: bi(mot('Thiên Tướng')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    // Cùng một câu sách với Tuần Triệt; TT_TUONG để giảm (X9) nên Hình cũng giảm
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Tướng gặp Thiên Hình thì giảm sức giải.',
    nguon: [
      n(TH, 4062, 'Còn với Tuần Triệt và Thiên Hình, Thiên Tướng không những mất uy lức cứu giải'),
      n(KL, 2473, 'sợ Tuần Triệt Thiên Hình'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'TUONG_XUONG_KHOA',
    loai: 'CHE',
    chuDong: mot('Thiên Tướng'),
    biTacDong: bi(mot(...LUC_SAT)),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: { chuDong: DAC_TRO_LEN, biTacDong: 'bat-ky' },
    canKem: [['Văn Xương', 'Hóa Khoa']],
    khongDuocDungMotMinh: true,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'goc',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: ['menh-than'],
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Tướng đắc ở Mệnh Thân có Văn Xương hoặc Hóa Khoa đi kèm thì gặp sát vẫn đứng được.',
    nguon: [
      n(CK, 755, 'Văn Xương, Thiên Tướng thực tham Khoa'),
      n(CK, 755, 'Nhược phùng tứ sát Đồng, Thân, Mệnh'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'TUONG_VU_KHUC',
    loai: 'CHE',
    chuDong: du('Thiên Tướng', 'Vũ Khúc'),
    biTacDong: bi(mot(...LUC_SAT)),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'goc',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    // Bộ riêng thắng luật chung: thắng TUONG_SO_KINH_DA (TH 4058: chống sát dù sát đắc hay hãm)
    uuTien: 3,
    ngoaiLeCua: KAD,
    nghia: 'Vũ Khúc đồng cung Thiên Tướng thì sức chống sát mạnh thêm, dù sát đắc hay hãm.',
    nguon: [n(TH, 4058, 'khi Vũ khúc đồng cung với Thiên Tướng thì khả năng chống đỡ với sát tinh càng mạnh thêm')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'TUONG_HAM_GAP_SAT',
    loai: 'PHA',
    chuDong: mot(...LUC_SAT),
    biTacDong: bi(mot('Thiên Tướng')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: { chuDong: 'bat-ky', biTacDong: ['H'] },
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Tướng hãm gặp sát thì địa vị dễ lung lay.',
    nguon: [n(DS, 1176, 'bị Dương Đà, Linh Hỏa, Không Kiếp dễ mất chức')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'TUONG_CHE_LIEM_PHA',
    loai: 'CHE',
    chuDong: mot('Thiên Tướng'),
    biTacDong: bi(mot('Liêm Trinh', 'Phá Quân')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'goc',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Tướng kìm Liêm Trinh, giữ Phá Quân trong khuôn.',
    nguon: [n(KL, 2473, 'Thiên tướng canh chừng Phá quân, chế ngự Liêm trinh')],
    nguonNguoc: [],
    chacChan: 'cao',
  },

  // ----- B4. Cơ Nguyệt Đồng Lương, Thiên Đồng -----
  {
    ma: 'CNDL_GAP_HOA_LINH',
    loai: 'PHA',
    chuDong: mot(...HOA_LINH),
    biTacDong: bi(du('Thiên Cơ', 'Thái Âm', 'Thiên Đồng', 'Thiên Lương')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'chan',
    doBen: KAD,
    // Thắng LUONG_KIM_HUNG / NHAT_NGUYET_CHE_TU_SAT ở phần Hỏa Linh
    uuTien: 2,
    ngoaiLeCua: KAD,
    nghia: 'Cách Cơ Nguyệt Đồng Lương gặp Hỏa Linh là phá cách.',
    nguon: [
      n(BT, 491, 'Cơ Nguyệt đồng Lương tối kỵ Hỏa Linh xâm  phá'),
      n(AB, 4304, 'Nhưng tối kỵ Hỏa Linh xâm phá'),
      n(AB, 4367, 'Cơ Nguyệt Đồng Lương tối kỵ Hỏa Linh'),
      n(AB, 2541, 'Đồng Lương tối kỵ Hỏa Linh nếu gặp Hỏa Linh thành phá cách'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'CO_LUONG_GAP_HOA_LINH',
    loai: 'PHA',
    chuDong: mot(...HOA_LINH),
    biTacDong: bi(mot('Thiên Cơ', 'Thiên Lương')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    // Thắng LUONG_KIM_HUNG ở phần Hỏa Linh
    uuTien: 2,
    ngoaiLeCua: KAD,
    nghia: 'Trong bộ Cơ Nguyệt Đồng Lương, Thiên Cơ và Thiên Lương chịu Hỏa Linh nặng nhất.',
    nguon: [n(AB, 4304, 'Cơ Lương ngộ Hỏa Linh là tối pham vi như cây gặp lửa')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'SAT_DAC_HOP_HANH_MENH_VCD',
    loai: 'DUNG',
    chuDong: mot(...LUC_SAT),
    biTacDong: KAD,
    viTri: 'dong-cung',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: { chuDong: DAC_TRO_LEN, biTacDong: 'bat-ky' },
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'goc',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: ['menh-vo-chinh-dieu', 'sat-hop-hanh-menh'],
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Mệnh vô chính diệu hành Hỏa hoặc Kim có sát đắc địa hợp hành thì sát bớt hung, thành chỗ dựa.',
    nguon: [n(NLTT, 460, 'chỉ có mệnh vô chính diệu Hoả và Kim. một khi có sát tinh đắc địa hợp hành với Mệnh')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'DONG_GAP_HOA_HINH_KY',
    loai: 'PHA',
    chuDong: mot('Hỏa Tinh', 'Thiên Hình', 'Hóa Kỵ'),
    biTacDong: bi(mot('Thiên Đồng')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    linhVuc: ['suc-khoe'],
    nghia: 'Thiên Đồng gặp Hỏa Tinh, Hình, Kỵ thì cần giữ sức khoẻ đường tiêu hoá.',
    nguon: [n(KL, 1259, 'nếu gặp Hỏa tinh, Hình Kỉ dễ bị bệnh tật ở đường tiêu hóa')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'DONG_NGO_DUNG_KINH',
    loai: 'DUNG',
    chuDong: mot('Thiên Đồng'),
    biTacDong: bi(mot('Kình Dương')),
    viTri: 'dong-cung',
    dieuKienCung: { chuDong: [6], biTacDong: [6] },
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'goc',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'lat',
    // Ảo bí 5393 (một nhóm): phú quý không vững bền
    doBen: 'khong-ben',
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Đồng ở Ngọ gặp Kình Dương thì thành uy danh, nhưng không bền.',
    nguon: [
      n(DS, 2199, 'Thiên Đồng Ngọ vị, hỉ Dương nhẫn uy trấn biên ải'),
      n(AB, 5393, 'dù có Kình tại Mệnh, vẫn thành cách tốt đẹp'),
      n(AB, 5393, 'duy không được vững bền'),
      n(TD, 1349, 'Đồng cư ngọ ngộ Kình anh hùng một phương'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },

  // ----- B5. Kỵ, Khoa và các sao giải nhỏ -----
  {
    ma: 'KY_GIAI_LIEM_THAM',
    loai: 'GIAI',
    chuDong: mot('Hóa Kỵ'),
    biTacDong: bi(du('Liêm Trinh', 'Tham Lang')),
    viTri: 'dong-cung',
    dieuKienCung: { chuDong: KAD, biTacDong: TY_HOI },
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    // X2 theo NLTT 238: Tỵ cần mệnh Hỏa, Hợi cần mệnh Kim; ngược lại thì luật ngừng (không phán thêm hung)
    hanhMenh: { du: { 5: ['Hỏa'], 11: ['Kim'] }, khongAp: { 5: ['Kim'], 11: ['Hỏa'] } },
    dieuKienLa: KAD,
    // Đưa hung về mức khá, KHÔNG thành tốt
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Hóa Kỵ đồng cung Liêm Tham ở Tỵ Hợi giải được phần lớn cái hung, đưa về mức khá.',
    nguon: [
      n(HS, 2919, 'hoá giải nhiều hung họa do Liêm Tham Tỉ Hợi gây nên'),
      n(HS, 1413, 'Liêm Tham Tỉ Hợi: bị tù hình. Gặp Hóa kỉ hay Tuần Triệt thì giải được'),
      n(KL, 2132, 'Hóa kỉ đồng cung với Liêm Tham tại Tỉ Hợi thì chế khắc được tai họa'),
      n(NLTT, 238, 'Hội với Liêm Tham ở Tỵ hợp cách phải là người Hoả mệnh, hoặc Liêm Tham ở Hợi phải là người Kim mệnh'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'LIEM_THAM_CO_KINH_DA_HINH',
    loai: 'PHA',
    chuDong: mot('Thiên Hình'),
    biTacDong: bi(du('Liêm Trinh', 'Tham Lang')),
    viTri: 'dong-cung',
    dieuKienCung: { chuDong: KAD, biTacDong: TY_HOI },
    doSang: BAT_KY,
    // Hàm số 1414 "Liêm Hinh, Kỉ, Kình hay Đà": Hình cùng Kình hoặc Đà, không phải một sao là đủ
    canKem: [KINH_DA],
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'thu-hep',
    doBen: KAD,
    uuTien: 2,
    ngoaiLeCua: 'KY_GIAI_LIEM_THAM',
    nghia: 'Liêm Tham ở Tỵ Hợi có Hóa Kỵ mà thêm Thiên Hình cùng Kình hoặc Đà thì Kỵ không giải được nữa.',
    nguon: [n(HS, 1414, 'Liêm Hinh, Kỉ, Kình hay Đà: bị ám sát, lưu huyết thanh toán')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'KHOA_CHE_SAT',
    loai: 'CHE',
    chuDong: mot('Hóa Khoa'),
    biTacDong: bi(mot(...LUC_SAT)),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: ['tuy-menh-than-phuc'],
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Hóa Khoa kìm được sát tinh, tới đâu còn tuỳ Mệnh, Thân, Phúc tốt hay xấu.',
    nguon: [
      n(HS, 2882, 'Hoá Khoa còn có khả năng chế ngự được sát tinh ( Kình, Đà, Không Kiếp, Hỏa Linh...)'),
      n(HS, 2882, 'còn tùy thuộc vào sự tốt xấu của Mệnh, Thân, phúc'),
      n(KL, 2121, 'chế  ngự được các sát tinh Kình Đà, Không Kiếp, Hỏa Linh'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'KHOA_CUNG_HOA_YEU',
    loai: 'GIAI',
    chuDong: mot('Hóa Khoa'),
    biTacDong: KAD,
    viTri: 'tam-phuong',
    dieuKienCung: { chuDong: [5, 6], biTacDong: KAD },
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: true,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam-luat',
    doBen: KAD,
    uuTien: 2,
    ngoaiLeCua: 'KHOA_CHE_SAT',
    nghia: 'Hóa Khoa ở cung Hỏa (Tỵ, Ngọ) có thể yếu sức hơn.',
    nguon: [n(HS, 2883, 'có thể Hoá Khoa kém sinh lực nhất')],
    nguonNguoc: [],
    chacChan: 'thap',
  },
  {
    ma: 'THIEN_GIAI_DA_KIEP',
    loai: 'GIAI',
    chuDong: mot('Thiên Giải'),
    biTacDong: bi(mot('Đà La', 'Địa Kiếp')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Giải giải bớt Đà La, Địa Kiếp.',
    nguon: [n(BT, 492, 'Có đà Kiếp mà gặp Thiên giải thì có thể giải được')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'NGUYET_DUC_PHA_QUAN_HAM',
    loai: 'GIAI',
    chuDong: mot('Nguyệt Đức'),
    biTacDong: bi(mot('Phá Quân')),
    viTri: 'dong-cung',
    dieuKienCung: { chuDong: KAD, biTacDong: MAO_DAU },
    doSang: { chuDong: 'bat-ky', biTacDong: ['H'] },
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'goc',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Phá Quân hãm ở Mão Dậu gặp Nguyệt Đức thì tính hiền hơn.',
    nguon: [n(BT, 492, 'Phá Quân hãm địa ư Mão Dậu, băng Nguyệt đức dĩ từ nhân')],
    nguonNguoc: [],
    chacChan: 'cao',
  },

  // ----- E. Luật thêm (duyệt cùng lô 18/10/2026) -----
  {
    ma: 'VU_KHUC_GIAI_SAT',
    loai: 'GIAI',
    chuDong: mot('Vũ Khúc'),
    biTacDong: bi(mot(...LUC_SAT)),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: { chuDong: DAC_TRO_LEN, biTacDong: 'bat-ky' },
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'goc',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Vũ Khúc miếu, vượng, đắc là sao giải mạnh nhất.',
    nguon: [
      n(TH, 4052, 'Đây là sao giải họa mạnh nhất'),
      n(TH, 4051, 'Trong số chính tinh miếu, vượng và đắc địa'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'LUONG_KIM_HUNG',
    loai: 'CHE',
    chuDong: mot('Thiên Lương'),
    biTacDong: bi(mot(...LUC_SAT)),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'goc',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Thiên Lương kìm được hung tinh, không giải hẳn.',
    nguon: [n(TH, 4082, 'Thiên Lương chỉ kìm chế được hung tinh mà thôi')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'NHAT_NGUYET_CHE_TU_SAT',
    loai: 'CHE',
    chuDong: mot('Thái Dương', 'Thái Âm'),
    biTacDong: bi(mot(...TU_SAT), KHONG_KIEP),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: { chuDong: DAC_TRO_LEN, biTacDong: 'bat-ky' },
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'goc',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Nhật Nguyệt sáng kìm được Kình Đà Hỏa Linh như Thiên Phủ, nhưng thua Không Kiếp.',
    nguon: [n(TH, 4092, 'Nhật Nguyệt có hiệu lực như Thiên Phủ đối với Kình, Đà, Hỏa, Linh')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'NHAT_NGUYET_SUU_MUI_DUNG_KY',
    loai: 'DUNG',
    chuDong: du('Thái Dương', 'Thái Âm'),
    biTacDong: bi(mot('Hóa Kỵ')),
    viTri: 'dong-cung',
    dieuKienCung: { chuDong: SUU_MUI, biTacDong: SUU_MUI },
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    // Tổng hợp 4091 KHÔNG bác: câu đó thu hẹp (tốt cho trí tuệ, hại mắt) → nằm ở lời dặn sức khoẻ.
    // Có Tuần/Triệt: cách lớn (TT_NHAT_NGUYET_SUU_MUI nâng); không có: sáng nhưng công danh chưa toại.
    muc: 'lat',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Nhật Nguyệt đồng cung ở Sửu Mùi gặp Hóa Kỵ gốc: Kỵ làm Nhật Nguyệt sáng ra, thành tốt; thêm Tuần Triệt thì thành cách lớn, thiếu Tuần Triệt thì công danh chưa toại. Sức khoẻ cần giữ mắt và thần kinh.',
    nguon: [
      n(HS, 2916, 'Riêng ở Sửu Mùi đồng chung với Nhật Nguyệt'),
      n(HS, 2916, 'Nhưng hay bị đau mắt hoặc đau thần kinh'),
      n(HS, 1653, 'Thái Âm ở Sửu Mùi gặp Tuần Triệt án ngữ, thêm Hóa Kỉ càng hay'),
      n(KL, 2131, 'Hóa kỉ đi với Nhật nguyệt tại Sửu Mùi làm Nhật Nguyệt rất sáng'),
      n(KL, 2461, 'Hóa Kỉ (chỉ ở Sửu Mùi)'),
      n(KL, 1373, 'Nhật Nguyệt đồng cung Sửu Mùi không gặp Tuần Triệt : bất đắc chí'),
      n(TH, 4091, 'Độ sáng của cặp m'),
      n(TH, 4092, 'Giá trị của Nhật Nguyệt trong trường hợp này tương đương với Tử Phủ đồng cung'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'NHAT_NGUYET_KY_HONG_CACH',
    loai: 'PHA',
    chuDong: mot(...KINH_DA, ...KHONG_KIEP),
    biTacDong: bi(du('Thái Dương', 'Thái Âm')),
    viTri: 'dong-cung',
    dieuKienCung: { chuDong: SUU_MUI, biTacDong: SUU_MUI },
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'thu-hep',
    doBen: KAD,
    uuTien: 2,
    ngoaiLeCua: 'NHAT_NGUYET_SUU_MUI_DUNG_KY',
    nghia: 'Cách Nhật Nguyệt Kỵ ở Sửu Mùi hỏng khi Kình Đà đồng cung hoặc Không Kiếp lấn át: sinh tranh cãi, tật mắt.',
    nguon: [
      n(TH, 4092, 'Kiếp lấn át'),
      n(DS, 775, 'Đồng cung với Nhật Nguyệt bị mục tật'),
      n(KL, 2131, 'đi với Thái tuế, Kình Đà thì gây tranh cãi, kiện cáo'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'NHAT_NGUYET_HAN_KINH_DA',
    loai: 'PHA',
    chuDong: mot(...KINH_DA),
    biTacDong: bi(mot('Thái Dương', 'Thái Âm')),
    viTri: 'cung-han',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: ['cach-menh-tai-quan'],
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Mệnh Tài Quan có cách Nhật Nguyệt, hạn gặp Kình Đà thì kém.',
    nguon: [n(AB, 4367, 'Mạnh Tài Quan có cách Nhật Nguyệt, kỵ hạn hành Dương Đà')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'SAT_PHA_THAM_HAM_CAN_KHOA',
    loai: 'GIAI',
    chuDong: mot('Hóa Khoa'),
    biTacDong: bi(mot('Thất Sát', 'Phá Quân', 'Tham Lang')),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: { chuDong: 'bat-ky', biTacDong: ['H'] },
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    doBen: KAD,
    uuTien: 1,
    ngoaiLeCua: KAD,
    nghia: 'Sát Phá Tham hãm địa rất cần Hóa Khoa để giải bớt.',
    nguon: [n(AB, 4302, 'hãm địa rất cần gặp Hóa-Khoa để giải cứu')],
    nguonNguoc: [],
    chacChan: 'cao',
  },
  {
    ma: 'TAM_HOA_GAP_KHONG_KIEP',
    loai: 'PHA',
    chuDong: mot(...KHONG_KIEP),
    biTacDong: bi(mot(...TAM_HOA)),
    viTri: 'tam-phuong',
    dieuKienCung: KHONG_DIEU_KIEN_CUNG,
    doSang: BAT_KY,
    canKem: KAD,
    khongDuocDungMotMinh: false,
    nguong: KAD,
    bienDoi: TT_CHUNG,
    lop: 'bat-ky',
    tuoi: KAD,
    hanhMenh: KAD,
    dieuKienLa: KAD,
    muc: 'giam',
    // Khảo luận 2128 chỉ nói Quyền "không bền" — không gán cho cả ba
    doBen: KAD,
    // Thắng KHOA_CHE_SAT ở phần Không Kiếp: Khoa chế sát "tới đâu còn tuỳ", còn Không Kiếp xung
    // Khoa Quyền Lộc thì Bổ Túc nói "mất hết ảnh hưởng"
    uuTien: 2,
    ngoaiLeCua: KAD,
    nghia: 'Khoa Quyền Lộc gặp Không Kiếp thì cái tốt mất nhiều, riêng Quyền có mà không bền.',
    nguon: [
      n(BT, 491, 'Có Khoa Quyền Lộc Mã thì nên phòng Không Kiếp ám xung mất hết ảnh hưởng'),
      n(KL, 2128, 'Hóa quyền Không Kiếp: có uy quyền nhưng không bền'),
    ],
    nguonNguoc: [],
    chacChan: 'cao',
  },
];

// ---------------------------------------------------------------------------------------------
// Khối Tuần Triệt

/** Một điều về Tuần Triệt, có nguồn — không có sao chủ động nên không dùng `LuatQuanHe` */
export interface MucTuanTriet {
  nghia: string;
  nguon: NguonQuanHe[];
  nguonNguoc: NguonQuanHe[];
  chacChan: 'cao' | 'thap';
}

/** Tuần / Triệt đóng ở cung của một sao (hay một bộ) thì sao đó đổi ra sao */
export interface TuanTrietTheoSao extends MucTuanTriet {
  ma: string;
  sao: TapSao;
  tuan: BienDoi;
  triet: BienDoi;
  /** Cung của sao; `khong-ap-dung` = mọi cung */
  cung: number[] | KhongApDung;
  doSang: DieuKienDoSang;
  /** Chỉ khi cung đó là Tài Bạch (Phủ sợ Tuần ở Tài hơn ở Mệnh Thân) */
  tenCung: string[] | KhongApDung;
}

export interface KhoiTuanTriet {
  /** Giảm cả tốt lẫn xấu của sao đồng cung */
  chung: MucTuanTriet;
  /** Sao đồng cung bị đổi tính, sao chiếu vào bị chắn bớt; KHÔNG lan sang cung khác (X8) */
  phamVi: MucTuanTriet & { dongCung: 'doi-tinh'; chieuVao: 'chan-bot'; lanCungKhac: false };
  /** Tuần Triệt cùng một cung: cộng hưởng, không triệt tiêu nhau */
  dongCung: MucTuanTriet & { kieu: 'cong-huong' };
  /** Triệt mạnh hơn Tuần; Triệt mạnh đến khoảng 30 tuổi, sau đó luận như Tuần */
  cuongDo: MucTuanTriet & { trietManhDenTuoi: number };
  /** X7: đảo chiều có trần — xem `doSangHieuDung` */
  daoChieu: MucTuanTriet;
  /** X6: Triệt ở cung Kim (Thân Dậu), Tuần ở cung Mộc (Dần Mão) mạnh nhất — chỉ tăng cường độ, chiều theo X7 */
  cungKimMoc: MucTuanTriet & { triet: number[]; tuan: number[] };
  /** X5: cung vô chính diệu — Triệt chắn cả sát lẫn cát từ ngoài; Tuần che sát, nhẹ hơn */
  voChinhDieu: MucTuanTriet & { triet: 'chan-ca-hai-chieu'; tuan: 'che-sat' };
  /** Chặn đầu nặng hơn theo gót; tỉ lệ chỉ để hướng dẫn, trên dưới một nửa, không làm số cứng */
  chanDau: MucTuanTriet & { tiLe: 'huong-dan-tren-duoi-mot-nua' };
  theoSao: TuanTrietTheoSao[];
}

const tt = (nghia: string, nguon: NguonQuanHe[], nguonNguoc: NguonQuanHe[] = [], chacChan: 'cao' | 'thap' = 'cao'): MucTuanTriet => ({
  nghia,
  nguon,
  nguonNguoc,
  chacChan,
});

export const TUAN_TRIET: KhoiTuanTriet = {
  chung: tt('Tuần Triệt làm giảm cả cái tốt lẫn cái xấu của sao đồng cung.', [
    n(KL, 2670, 'Tuần Triệt là hai sao cản phá có tác dụng làm giảm cái tốt cũng như giảm cái xấu của các sao'),
    n(AB, 4813, 'cư nơi miếu địa, mà gặp Triệt Tuần là hết ảnh hưởng'),
    n(HS, 4236, 'Tuần làm cho sao bớt tốt chớ không làm cho xấu hẳn đi'),
  ]),
  phamVi: {
    ...tt(
      'Tuần Triệt đổi tính sao đồng cung và chắn bớt sao chiếu vào; không phán cung khác bị ảnh hưởng.',
      [
        n(TH, 1058, 'chỉ làm đảo nghĩa các sao đồng cung mà thôi'),
        n(CK, 1238, 'tựa như tấm bình phong che các Sao xấu ở ngoài chiếu vào'),
        n(KL, 2012, 'che chắn không cho các hung tinh bên ngoài xâm nhập'),
      ],
      [n(AB, 4805, 'lại còn ảnh hưởng ở các cung xung chiếu, và tam hợp nữa')]
    ),
    dongCung: 'doi-tinh',
    chieuVao: 'chan-bot',
    lanCungKhac: false,
  },
  dongCung: {
    ...tt('Tuần và Triệt cùng một cung thì ảnh hưởng chồng lên nhau, không triệt tiêu nhau.', [
      n(HS, 4237, 'khi Tuần và Triệt đồng cung, không có sự đối kháng mà chỉ có sự phối hợp tác hóa'),
      n(NL74, 380, 'không phải là Tuần Triệt phá nhau'),
    ]),
    kieu: 'cong-huong',
  },
  cuongDo: {
    ...tt('Triệt mạnh hơn Tuần; Triệt mạnh đến khoảng 30 tuổi, sau đó luận như Tuần. Tuần đều suốt đời.', [
      n(HS, 4236, 'Triệt, vì ảnh hưởng mạnh và quyết liệt hơn'),
      n(HS, 4236, 'Khi Triệt giảm dần hiệu lực, mức độ ảnh hưởng sẽ luận như sao tuần'),
      n(HS, 4248, 'Tuần ảnh hưởng suốt đời, còn Triệt chỉ mạnh cho đến khoảng 30 tuổi'),
      n(NL74, 380, 'Mệnh bị Triệt đời phải chịu nhiều khó khăn lúc niên thiếu'),
    ]),
    trietManhDenTuoi: 30,
  },
  daoChieu: tt(
    'Sao hãm gặp Tuần lên khoảng bình; gặp Triệt còn mạnh lên ngang đắc, không cao hơn. Sao miếu vượng đắc gặp Tuần bớt tốt; gặp Triệt mất phần lớn cái tốt.',
    [
      n(TH, 4096, 'mà chỉ có thể chỉ tương đương với sao đắc địa'),
      n(AB, 4813, 'Chính tinh cư nơi hãm địa thời ảnh hưởng thật dữ, nhưng nếu gặp Triệt Tuần thì trái lại là tốt'),
      n(KL, 2671, 'Chính tinh  đắc địa gặp Tuần Triệt thì trở thành chính tinh hãm địa'),
    ],
    // Tuần không đảo chiều — vì vậy vế Tuần chỉ lên bình / hạ một bậc
    [n(HS, 4236, 'Tuần vì ảnh hưởng nhẹ, vừa phải nên làm cho sao xấu bớt xấu chớ không làm thành tốt lên')]
  ),
  cungKimMoc: {
    ...tt(
      'Triệt ở Thân Dậu, Tuần ở Dần Mão là lúc Tuần Triệt mạnh nhất, cả chiều đỡ lẫn chiều hại.',
      [
        n(KL, 2672, 'Dần, Mão, Thân, Dậu là miếu địa của Tuần Triệt nên khi Triệt đáo Kim cung (Thân Dậu), Tuần du Mộc vị (Dần Mão)'),
        n(AB, 4289, 'vì Triệt đáo kim cung, Tuần làm mộc địa miếu vượng áp chế rồi'),
      ],
      [],
      'thap'
    ),
    triet: [8, 9],
    tuan: [2, 3],
  },
  voChinhDieu: {
    ...tt('Cung vô chính diệu gặp Triệt: chắn cả sát lẫn cát từ ngoài vào, kết quả tuỳ phía ngoài. Gặp Tuần: che sát, nhẹ hơn.', [
      n(KL, 2012, 'Tuần Triệt cón bảo vệ cho những cung vô chính diệu'),
      n(AB, 5308, 'nếu được Triệt tinh án ngữ tại bản cung'),
      n(CK, 1238, 'gặp Triệt thì tối nguy, tựa như cái cửa chắn cả ngoài lẫn trong'),
      n(CK, 1238, 'hoặc gặp Tuần thì hay'),
    ]),
    triet: 'chan-ca-hai-chieu',
    tuan: 'che-sat',
  },
  chanDau: {
    ...tt('Tuần Triệt chặn đầu nặng hơn theo gót; chỉ dùng làm hướng dẫn, không làm tỉ lệ cứng.', [
      n(NL74, 379, 'thì ảnh hưởng đương đầu phải là nặng quá bán (70%)'),
      n(TH, 1054, 'sẽ phải chịu thiệt đến 8/10 vì bị Tuần, Triệt chận đầu', { tacGia: 'phu-toan-thu' }),
      n(TH, 1094, 'chỉ nên xem như có tính cách hướng dẫn cho việc luận đoán'),
    ]),
    tiLe: 'huong-dan-tren-duoi-mot-nua',
  },
  theoSao: [
    {
      ma: 'TT_PHU',
      sao: mot('Thiên Phủ'),
      // X10: Tuần nặng, Triệt nhẹ — không ghi Triệt bằng không
      tuan: 'mat',
      triet: 'giam',
      cung: KAD,
      doSang: 'bat-ky',
      tenCung: KAD,
      ...tt(
        'Thiên Phủ gặp Tuần thì kho rỗng; gặp Triệt chỉ sứt mẻ ít.',
        [n(KL, 1325, 'Thiên phủ rất sợ Tuần mà lại không sợ Triệt'), n(AB, 4798, 'sợ Tuần mà không sợ Triệt lắm')],
        [
          n(HS, 2144, 'Thiên Phủ rất kỉ các sao Không Kiếp, Tuần, Triệt'),
          n(KL, 1330, 'Thiên phủ gặp Tuần Triệt án ngữ'),
          // Ảo bí: Tuần hại Phủ rõ ở Tài, ở Mệnh Thân không đáng ngại lắm (một nhóm — ghi nhận, chưa thu hẹp)
          n(AB, 4280, 'ở Mạnh Thân không đáng ngại lắm'),
        ]
      ),
    },
    {
      ma: 'TT_TU_VI',
      sao: mot('Tử Vi'),
      // X9: nghiêng phía sợ, mức giảm
      tuan: 'giam',
      triet: 'giam',
      cung: KAD,
      doSang: 'bat-ky',
      tenCung: KAD,
      ...tt(
        'Tử Vi gặp Tuần Triệt thì giảm sức.',
        [n(KL, 1325, 'Tử vi lại rất sợ Triệt'), n(HS, 2272, 'Càng bất lợi hơn nếu Tử - Vi bị Tuần Triệt')],
        [n(AB, 4794, 'Tử Phủ Vũ Tướng không sợ Triệt tuần lắm')]
      ),
    },
    {
      ma: 'TT_TU_PHU_TUAN',
      sao: du('Tử Vi', 'Thiên Phủ'),
      // Ảo bí tự nói ngược (4280, 4794) → giảm, không mất
      tuan: 'giam',
      triet: 'theo-chung',
      cung: KAD,
      doSang: 'bat-ky',
      tenCung: KAD,
      ...tt('Tử Phủ đồng cung gặp Tuần thì giảm sức giải.', [
        n(AB, 5307, 'Tử Phủ đồng cung, Đế vô quyền sở, nan giải tai ương, do như Tuần không xâm nhập'),
        n(KL, 1325, 'Thiên phủ rất sợ Tuần'),
      ], [n(AB, 4280, 'Cách Tử-Phủ tuy kỵ Kiếp Không, nhưng không sợ lắm 2 sao Triệt Tuần'), n(AB, 4794, 'Tử Phủ Vũ Tướng không sợ Triệt tuần lắm')]),
    },
    {
      ma: 'TT_TUONG',
      sao: mot('Thiên Tướng'),
      tuan: 'giam',
      triet: 'giam',
      cung: KAD,
      doSang: 'bat-ky',
      tenCung: KAD,
      ...tt(
        'Thiên Tướng gặp Tuần Triệt thì giảm sức giải.',
        [
          n(TH, 4062, 'Thiên Tướng chỉ ngại Kình Dương, Thiên Hình và 2 sao Tuần, Triệt'),
          n(KL, 2473, 'sợ Tuần Triệt'),
          n(KL, 2671, 'Thiên tướng ngộ Triệt'),
        ],
        [n(AB, 4794, 'Tử Phủ Vũ Tướng không sợ Triệt tuần lắm')]
      ),
    },
    {
      ma: 'TT_THAT_SAT',
      sao: mot('Thất Sát'),
      // X1: hoà theo độ sáng — miếu vượng gặp Triệt giảm uy (không "mất hẳn"); hãm gặp Triệt bớt
      // hung (theo daoChieu); Tuần nhẹ hơn Triệt. Khảo luận chỉ dùng để chặn lật hẳn.
      tuan: 'giam',
      triet: 'giam',
      cung: KAD,
      doSang: ['M', 'V', 'D'],
      tenCung: KAD,
      ...tt(
        'Thất Sát sáng gặp Triệt thì giảm uy; gặp Tuần giảm nhẹ hơn.',
        [
          n(AB, 4288, 'nếu ngộ Triệt ở Thân Dậu, Tuần tại Dần Mão tối kỵ'),
          n(NLTT, 917, 'Tai hại nhất là khuôn khổ cứng rắn như Sát Phá Tham'),
        ],
        [n(KL, 2481, 'Thất sát gặp Tuần, Triệt, Không Kiếp vẫn bình thường'), n(KL, 1586, 'Thất sát không sợ Tuần Triệt')]
      ),
    },
    {
      ma: 'TT_SAT_PHA_THAM_HAM',
      sao: mot('Thất Sát', 'Phá Quân', 'Tham Lang'),
      tuan: 'theo-chung',
      triet: 'nang',
      cung: KAD,
      doSang: ['H'],
      tenCung: KAD,
      ...tt('Sát Phá Tham hãm gặp Triệt thì bớt hung.', [
        n(AB, 4299, 'Cách Sát Phá Tham khi cư nơi hãm địa rất cần gặp Triệt xung phá để giải hung nguy'),
        n(AB, 4806, 'khi gặp được một sao triệt cũng khá bình yên được'),
        n(TH, 4096, 'Cho dù hãm địa mà bị Tuần, Triệt'),
      ], [n(AB, 4367, 'Tham Sát bị Triệt Tuần thời khắc hãm')]),
    },
    {
      ma: 'TT_THAM_LANG',
      sao: mot('Tham Lang'),
      tuan: 'giam',
      triet: 'mat',
      cung: KAD,
      doSang: ['M', 'V', 'D', 'L', 'B'],
      tenCung: KAD,
      ...tt('Tham Lang gặp Triệt thì mất uy; gặp Tuần ít hại.', [
        n(AB, 4290, 'sao Tham-lang tối kỵ Triệt mà không sợ Tuần lắm'),
        n(NLTT, 917, 'Triệt lại khác là bao vây triệt hạ'),
      ], [n(AB, 4367, 'Tham Sát bị Triệt Tuần thời khắc hãm')]),
    },
    {
      ma: 'TT_PHA_QUAN',
      sao: mot('Phá Quân'),
      tuan: 'khong-doi',
      triet: 'khong-doi',
      cung: KAD,
      // Phá hãm gặp Triệt theo TT_SAT_PHA_THAM_HAM
      doSang: ['M', 'V', 'D', 'L', 'B'],
      tenCung: KAD,
      ...tt('Phá Quân không sợ Tuần Triệt.', [n(AB, 4291, 'Sao Phá – quân không sợ Triệt Tuần'), n(KL, 1629, 'Phá quân không sợ Tuần Triệt')]),
    },
    {
      ma: 'TT_THIEN_DONG',
      sao: mot('Thiên Đồng'),
      tuan: 'khong-doi',
      triet: 'khong-doi',
      cung: KAD,
      doSang: 'bat-ky',
      tenCung: KAD,
      ...tt('Thiên Đồng không sợ Tuần Triệt.', [
        n(AB, 4303, 'Thiên-đồng không sợ Triệt Tuần vì thuộc hành Thủy'),
        n(KL, 1258, 'Thiên đồng không sợ Tuần Triệt'),
      ]),
    },
    {
      ma: 'TT_CO_LUONG',
      sao: mot('Thiên Cơ', 'Thiên Lương'),
      tuan: 'giam',
      triet: 'giam',
      cung: KAD,
      doSang: 'bat-ky',
      tenCung: KAD,
      ...tt('Thiên Cơ, Thiên Lương gặp Tuần Triệt bị nặng.', [n(AB, 4303, 'Hai sao Cơ Lương ngộ Triệt Tuần là bị phạm nằng')]),
    },
    {
      ma: 'TT_LIEM_THAM_TY_HOI',
      sao: du('Liêm Trinh', 'Tham Lang'),
      // Một nhóm (Hàm số) → không nâng (Q1); sao hãm gặp Tuần Triệt đã được đỡ theo daoChieu
      tuan: 'theo-chung',
      triet: 'theo-chung',
      cung: TY_HOI,
      doSang: 'bat-ky',
      tenCung: KAD,
      ...tt('Liêm Tham ở Tỵ Hợi gặp Tuần Triệt thì giải được bớt khi đến hạn.', [
        n(HS, 1413, 'Liêm Tham Tỉ Hợi: bị tù hình. Gặp Hóa kỉ hay Tuần Triệt thì giải được'),
      ]),
    },
    {
      ma: 'TT_NHAT_NGUYET_SUU_MUI',
      // Câu sách đi cùng Hóa Kỵ đồng cung. Ba nhóm (Nguyễn Phát Lộc, Khảo luận, Chìa khoá) → nâng
      sao: du('Thái Dương', 'Thái Âm', 'Hóa Kỵ'),
      tuan: 'nang',
      triet: 'nang',
      cung: SUU_MUI,
      doSang: 'bat-ky',
      tenCung: KAD,
      ...tt('Nhật Nguyệt đồng cung ở Sửu Mùi có Hóa Kỵ, gặp Tuần Triệt thì sáng thêm, thành cách lớn.', [
        n(TH, 4092, 'đồng cung ở Sửu, Mùi có Tuần Triệt án ngữ'),
        n(HS, 2916, 'nếu được thêm Tuần triệt án ngữ thì rất rực rỡ'),
        n(KL, 2461, 'Hãm địa mà gặp Tuần Triệt, Hóa Kỉ (chỉ ở Sửu Mùi)'),
        n(KL, 1373, 'Nhật Nguyệt đồng cung Sửu Mùi không gặp Tuần Triệt : bất đắc chí'),
        n(CK, 1135, 'Nhật, Nguyệt Sửu, Mùi, ái ngộ Tuần không'),
      ]),
    },
    {
      ma: 'TT_TAM_HOA',
      sao: mot(...TAM_HOA),
      tuan: 'giam',
      triet: 'giam',
      cung: KAD,
      doSang: 'bat-ky',
      tenCung: KAD,
      ...tt('Khoa Quyền Lộc gặp Tuần Triệt thì công danh trắc trở; tứ chính có cách Lộc gặp Tuần thì mất cái tốt.', [
        n(KL, 2128, 'Khoa  Quyền Lộc Tuần Triệt công danh trắc trở'),
        n(AB, 4811, 'có sao tốt hợp Lộc cách mà gặp Tuần cũng phá hết tốt'),
      ]),
    },
  ],
};

/** Luật chung về sao giải (B6) — điều kiện đặt lên chính sao giải, xét tại cung nó đóng */
export const LUAT_CHUNG_SAO_GIAI: readonly (MucTuanTriet & { ma: string })[] = [
  {
    ma: 'GIAI_DONG_CUNG_MANH_HON_CHIEU',
    // S9: chiếu từ tam phương tứ chính vẫn giải, chỉ yếu hơn đồng cung
    ...tt('Sao giải đồng cung mạnh hơn sao giải chiếu từ tam phương tứ chính; chiếu vẫn giải, yếu hơn.', [
      n(HS, 737, 'Các sao tọa thủ ở cung nào ảnh hưởng đến cung đó mạnh hơn các sao chiếu vào cung đó'),
      n(HS, 2884, 'phối chiêu vào cung Mệnh, Thân thì khả năng cứu giải càng được gia tăng gấp bội'),
    ]),
  },
  {
    ma: 'GIAI_CHINH_TINH_CAN_SANG',
    ...tt('Chính tinh chỉ cứu giải khi miếu, vượng, đắc và không bị Tuần Triệt; hãm thì kém hẳn.', [
      n(TH, 4095, 'Miếu Vượng hay đắc Địa và không bị Tuần Triệt án ngữ'),
      n(TH, 4096, 'Nếu hãm địa, khả năng cứu giải cũng khôn kém hẳn'),
    ]),
  },
];

// ---------------------------------------------------------------------------------------------
// Hàm

/** Nhóm tác giả của một nguồn: `tacGia` nếu sách dẫn lại người khác, không thì theo tệp */
export function nhomCua(x: NguonQuanHe): string {
  return x.tacGia ?? NHOM_NGUON[x.sach] ?? x.sach;
}

/** Số nhóm tác giả độc lập của một danh sách nguồn (chỉ đếm nguồn có số dòng và trích) */
export function soNhom(ds: readonly NguonQuanHe[]): number {
  return new Set(ds.filter((x) => x.sach && x.dong > 0 && x.trich.trim()).map(nhomCua)).size;
}

const THU_TU: DoSang[] = ['H', 'B', 'L', 'D', 'V', 'M'];
const hang = (d: DoSang) => THU_TU.indexOf(d);

/**
 * Độ sáng hiệu dụng sau Tuần Triệt (X7, có trần). `trietConManh`: Triệt còn trong thời mạnh
 * (khoảng trước 30 tuổi, Hàm số 4248); hết thời mạnh thì Triệt luận như Tuần. Tuần và Triệt cùng
 * đóng thì cộng hưởng — lấy vế Triệt.
 *  - Hãm + Tuần → Bình. Hãm + Triệt mạnh → Đắc (không cao hơn, Tổng hợp 4096).
 *  - Sáng (Lợi trở lên) + Tuần → hạ một bậc, không dưới Bình (Tuần không làm xấu hẳn).
 *  - Sáng + Triệt mạnh → Bình (mất phần lớn cái tốt, không thành hãm).
 *  - Bình giữ nguyên. Sao không có bảng độ sáng (null) giữ null.
 */
export function doSangHieuDung(
  doSang: DoSang | null | undefined,
  tuan: boolean,
  triet: boolean,
  trietConManh: boolean
): DoSang | null {
  if (!doSang) return null;
  if (!tuan && !triet) return doSang;
  const manh = triet && trietConManh;
  if (doSang === 'B') return 'B';
  if (doSang === 'H') return manh ? 'D' : 'B';
  if (manh) return 'B';
  return THU_TU[Math.max(hang('B'), hang(doSang) - 1)];
}

/** Hai luật ngược chiều có thể cùng khớp: một bên dùng / chế / giải sao hung, bên kia là sao hung phá lại */
function giao(a: string[], b: string[]): boolean {
  return a.some((x) => b.includes(x));
}
function nhanTacDong(l: LuatQuanHe): string[] {
  return l.biTacDong === KAD ? [] : l.biTacDong.sao.filter((s) => !(l.biTacDong as { tru: string[] }).tru.includes(s));
}
export function cungKhopNguocChieu(a: LuatQuanHe, b: LuatQuanHe): boolean {
  if ((a.loai === 'PHA') === (b.loai === 'PHA')) return false;
  // Một luật nói lá gốc, một luật nói hạn → hai bối cảnh khác nhau, không đụng
  if ((a.viTri === 'cung-han') !== (b.viTri === 'cung-han')) return false;
  if (!(giao(a.chuDong.sao, nhanTacDong(b)) && giao(nhanTacDong(a), b.chuDong.sao))) return false;
  // Điều kiện độ sáng của cùng một bên không giao nhau → không thể cùng khớp (Tướng đắc ↔ Tướng hãm)
  return giaoDoSang(a.doSang.chuDong, b.doSang.biTacDong) && giaoDoSang(a.doSang.biTacDong, b.doSang.chuDong);
}
function giaoDoSang(x: DieuKienDoSang, y: DieuKienDoSang): boolean {
  return x === 'bat-ky' || y === 'bat-ky' || x.some((d) => y.includes(d));
}

/** Lỗi của bảng luật quan hệ. Rỗng = hợp lệ. Bài CI gọi trên `LUAT_QUAN_HE` */
export function kiemBangQuanHe(bang: readonly LuatQuanHe[]): string[] {
  const loi: string[] = [];
  const maDaCo = new Set<string>();
  for (const l of bang) {
    const m = l.ma || '(không mã)';
    if (!l.ma) loi.push(`${m}: thiếu mã`);
    else if (maDaCo.has(l.ma)) loi.push(`${m}: trùng mã`);
    maDaCo.add(l.ma);
    if (!l.chuDong.sao.length) loi.push(`${m}: thiếu sao chủ động`);
    if (!l.nghia.trim()) loi.push(`${m}: thiếu câu nghĩa`);
    const sn = soNhom(l.nguon);
    if (sn < 1) loi.push(`${m}: thiếu nguồn có số dòng và trích`);
    if (sn < 2 && !MUC_MOT_NHOM.includes(l.muc)) loi.push(`${m}: một nhóm tác giả chỉ được mức giảm (Q1), đang là ${l.muc}`);
    if (l.nguong !== KAD && sn < 2 && l.nguong.bac.some((b) => !MUC_MOT_NHOM.includes(b.muc)))
      loi.push(`${m}: một nhóm tác giả, bậc ngưỡng vượt mức giảm`);
    // Luật ngoại lệ vẫn được phán chiều riêng (Thất Sát đủ tứ sát: tắt luật dụng VÀ lật hung)
    if ((l.muc === 'thu-hep' || l.muc === 'giam-luat') && l.ngoaiLeCua === KAD) loi.push(`${m}: mức ${l.muc} phải có ngoaiLeCua`);
    if (l.ngoaiLeCua === l.ma) loi.push(`${m}: ngoaiLeCua trỏ vào chính nó`);
    if (l.ngoaiLeCua !== KAD && !bang.some((x) => x.ma === l.ngoaiLeCua)) loi.push(`${m}: ngoaiLeCua trỏ tới luật không có (${l.ngoaiLeCua})`);
    for (const x of [...l.nguon, ...l.nguonNguoc]) if (x.den !== undefined && x.den < x.dong) loi.push(`${m}: khoảng dòng ngược ${x.dong}–${x.den}`);
  }
  for (let i = 0; i < bang.length; i++)
    for (let j = i + 1; j < bang.length; j++) {
      const a = bang[i];
      const b = bang[j];
      if (!cungKhopNguocChieu(a, b)) continue;
      if (a.ngoaiLeCua === b.ma || b.ngoaiLeCua === a.ma) continue;
      if (a.uuTien === b.uuTien) loi.push(`${a.ma} ↔ ${b.ma}: ngược chiều cùng khớp mà không phân uuTien`);
    }
  return loi;
}

/** Lỗi của khối Tuần Triệt: `mat` / `dao-thanh-hai` / `nang` cần ≥2 nhóm (Q1) */
export function kiemKhoiTuanTriet(k: KhoiTuanTriet): string[] {
  const loi: string[] = [];
  const muc = [k.chung, k.phamVi, k.dongCung, k.cuongDo, k.daoChieu, k.cungKimMoc, k.voChinhDieu, k.chanDau];
  muc.forEach((x, i) => {
    if (soNhom(x.nguon) < 1) loi.push(`TUAN_TRIET mục ${i}: thiếu nguồn`);
  });
  const ma = new Set<string>();
  for (const s of k.theoSao) {
    if (ma.has(s.ma)) loi.push(`${s.ma}: trùng mã`);
    ma.add(s.ma);
    const sn = soNhom(s.nguon);
    if (sn < 1) loi.push(`${s.ma}: thiếu nguồn`);
    for (const v of [s.tuan, s.triet])
      if (sn < 2 && (v === 'mat' || v === 'dao-thanh-hai' || v === 'nang')) loi.push(`${s.ma}: một nhóm tác giả không được ghi ${v} (Q1)`);
  }
  return loi;
}
