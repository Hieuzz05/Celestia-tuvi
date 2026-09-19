/**
 * Bốn chặng, mười hai tấm gương — khung trình bày của bài luận 12 cung.
 *
 * Vấn đề nó giải. Mọi sản phẩm tử vi trên mạng đọc tuyến tính theo vòng cung:
 * Mệnh → Phụ Mẫu → Phúc Đức → … Người đọc nhận ra ngay đây là phần mềm tra
 * cứu, và tên cung chiếm hết tiêu đề. Celes vẫn phải phủ đủ 12, nhưng không
 * được đọc như một danh mục.
 *
 * Nên tách hẳn ba tầng, và chỉ tầng đầu là thứ người dùng thấy:
 *
 *   Trình bày  4 CHẶNG theo chủ đề đời sống        ← mục lục
 *   Đọc        mỗi phần đọc bản cung + 2 tam hợp + 1 gương
 *   Engine     12 cung × đầy đủ lớp dữ kiện
 *
 * Tam hợp `(i, i+4, i+8)` và xung chiếu `(i, i+6)` VẪN là xương sống của việc
 * đọc. Chúng chỉ không còn là cách gom nhóm để trình bày.
 *
 * Vì nhóm chặng không trùng nhóm tam hợp, các cung gương bắc cầu GIỮA các
 * chặng — và đó chính là cơ chế khâu bài lại với nhau. Đếm được: trung bình
 * 2,4 trên 3 cung tham chiếu của mỗi phần nằm ngoài chặng của nó, và 12/12
 * phần đều có ít nhất một. Bài đọc vì thế KHÔNG THỂ tuyến tính: ngay khi đọc
 * "Thế giới bên trong bạn", Celes đã phải kéo dữ kiện từ công việc, tiền bạc,
 * quan hệ và gia đình.
 */

export type ChangId = 'ben-trong' | 'con-duong' | 'sat-canh' | 'de-lai';

export type MucId =
  | 'menh' | 'phuc-duc' | 'tat-ach'          // chặng 1
  | 'quan-loc' | 'tai-bach' | 'thien-di'     // chặng 2
  | 'phu-the' | 'huynh-de' | 'no-boc'        // chặng 3
  | 'phu-mau' | 'dien-trach' | 'tu-tuc';     // chặng 4

export interface CauHinhChang {
  thuTu: 1 | 2 | 3 | 4;
  /** Thứ tự canonical, dùng khi điểm nổi bật hoà nhau */
  cung: [string, string, string];
  muc: [MucId, MucId, MucId];
  tieuDe: string;
  subtitle: string;
}

/**
 * Bốn chặng tạo một CUNG ĐƯỜNG KỂ CHUYỆN: bên trong → ra ngoài → cùng người
 * khác → truyền lại. Đây là lý do thứ tự chặng cố định 1→4 và không bao giờ
 * được sắp lại theo điểm nổi bật — sắp lại là biến cung đường thành danh mục,
 * đúng thứ khung này sinh ra để tránh.
 */
export const CHANG: Record<ChangId, CauHinhChang> = {
  'ben-trong': {
    thuTu: 1,
    cung: ['Mệnh', 'Phúc Đức', 'Tật Ách'],
    muc: ['menh', 'phuc-duc', 'tat-ach'],
    tieuDe: 'Thế giới bên trong bạn',
    subtitle:
      'Bạn là người thế nào, điều gì diễn ra bên trong và đâu là giới hạn bạn cần hiểu về chính mình.',
  },
  'con-duong': {
    thuTu: 2,
    cung: ['Quan Lộc', 'Tài Bạch', 'Thiên Di'],
    muc: ['quan-loc', 'tai-bach', 'thien-di'],
    tieuDe: 'Con đường bạn gây dựng',
    subtitle:
      'Công việc, tiền bạc, cơ hội và cách bạn tạo nên một vị trí cho mình trong thế giới bên ngoài.',
  },
  'sat-canh': {
    thuTu: 3,
    cung: ['Phu Thê', 'Huynh Đệ', 'Nô Bộc'],
    muc: ['phu-the', 'huynh-de', 'no-boc'],
    tieuDe: 'Những người sát cánh cùng bạn',
    subtitle:
      'Từ người thân, tình yêu đến bạn bè và cộng sự — những mối quan hệ tạo nên thế giới quanh bạn.',
  },
  'de-lai': {
    thuTu: 4,
    cung: ['Phụ Mẫu', 'Điền Trạch', 'Tử Tức'],
    muc: ['phu-mau', 'dien-trach', 'tu-tuc'],
    tieuDe: 'Từ nơi bạn đến, đến điều bạn để lại',
    subtitle: 'Điều bạn nhận từ trước, mái nhà bạn tạo và điều bạn sẽ để lại.',
  },
};

/** Thứ tự chặng, luôn 1→4 */
export const THU_TU_CHANG: ChangId[] = ['ben-trong', 'con-duong', 'sat-canh', 'de-lai'];

/** Cung gốc của mỗi phần */
export const CUNG_CUA_MUC: Record<MucId, string> = {
  menh: 'Mệnh',
  'phuc-duc': 'Phúc Đức',
  'tat-ach': 'Tật Ách',
  'quan-loc': 'Quan Lộc',
  'tai-bach': 'Tài Bạch',
  'thien-di': 'Thiên Di',
  'phu-the': 'Phu Thê',
  'huynh-de': 'Huynh Đệ',
  'no-boc': 'Nô Bộc',
  'phu-mau': 'Phụ Mẫu',
  'dien-trach': 'Điền Trạch',
  'tu-tuc': 'Tử Tức',
};

/** Chiều ngược của CUNG_CUA_MUC */
export const MUC_CUA_CUNG: Record<string, MucId> = Object.fromEntries(
  Object.entries(CUNG_CUA_MUC).map(([m, c]) => [c, m as MucId])
) as Record<string, MucId>;

/** Chặng của mỗi phần */
export const CHANG_CUA_MUC: Record<MucId, ChangId> = Object.fromEntries(
  THU_TU_CHANG.flatMap((c) => CHANG[c].muc.map((m) => [m, c]))
) as Record<MucId, ChangId>;

/**
 * Xung chiếu — cung gương của mỗi cung.
 *
 * Bất biến, độc lập với cách chia chặng: nó là quan hệ `(i, i+6)` trên vòng 12
 * cung, không phải một lựa chọn trình bày. Viết ra thành bảng thay vì tính
 * bằng chỉ số để chỗ dùng đọc được ngay là cặp nào soi cặp nào.
 */
export const GUONG: Record<string, string> = {
  'Mệnh': 'Thiên Di',
  'Thiên Di': 'Mệnh',
  'Tài Bạch': 'Phúc Đức',
  'Phúc Đức': 'Tài Bạch',
  'Quan Lộc': 'Phu Thê',
  'Phu Thê': 'Quan Lộc',
  'Huynh Đệ': 'Nô Bộc',
  'Nô Bộc': 'Huynh Đệ',
  'Tật Ách': 'Phụ Mẫu',
  'Phụ Mẫu': 'Tật Ách',
  'Điền Trạch': 'Tử Tức',
  'Tử Tức': 'Điền Trạch',
};

/** Tam hợp — hai cung còn lại cùng tam hợp `(i, i+4, i+8)`. Cũng bất biến. */
export const TAM_HOP: Record<string, [string, string]> = {
  'Mệnh': ['Tài Bạch', 'Quan Lộc'],
  'Tài Bạch': ['Mệnh', 'Quan Lộc'],
  'Quan Lộc': ['Mệnh', 'Tài Bạch'],
  'Huynh Đệ': ['Tật Ách', 'Điền Trạch'],
  'Tật Ách': ['Huynh Đệ', 'Điền Trạch'],
  'Điền Trạch': ['Huynh Đệ', 'Tật Ách'],
  'Phu Thê': ['Thiên Di', 'Phúc Đức'],
  'Thiên Di': ['Phu Thê', 'Phúc Đức'],
  'Phúc Đức': ['Phu Thê', 'Thiên Di'],
  'Tử Tức': ['Nô Bộc', 'Phụ Mẫu'],
  'Nô Bộc': ['Tử Tức', 'Phụ Mẫu'],
  'Phụ Mẫu': ['Tử Tức', 'Nô Bộc'],
};

/**
 * Hai cặp gương NỘI BỘ — cả hai đầu gương cùng nằm trong một chặng.
 *
 * Bốn gương còn lại bắc cầu giữa các chặng, và đó là chỗ viết câu chuyển chặng.
 * Hai cặp này thì không bắc cầu đi đâu, nên chặng 3 và chặng 4 tự khép lại
 * bằng chúng. Hệ quả khi viết: hai khối gương của một cặp phải là một CẶP ĐỐI
 * THOẠI — một bên nêu sức kéo, bên kia nêu chiều ngược — chứ không được nói
 * cùng một điều hai lần.
 */
export const GUONG_NOI_BO: [MucId, MucId][] = [
  ['huynh-de', 'no-boc'],
  ['dien-trach', 'tu-tuc'],
];

const TAP_GUONG_NOI_BO = new Set(GUONG_NOI_BO.flat());

/** Gương của phần này có nằm cùng chặng không */
export function laGuongNoiBo(muc: MucId): boolean {
  return TAP_GUONG_NOI_BO.has(muc);
}

/**
 * Ba cung tham chiếu của một phần: hai cung tam hợp và một cung gương.
 *
 * Đây là thứ làm mỗi phần không đọc một mình. Không có nó thì bài quay về
 * đúng kiểu đọc từng cung rời mà cả khung này sinh ra để tránh.
 */
export function cungThamChieu(muc: MucId): { tamHop: [string, string]; guong: string } {
  const goc = CUNG_CUA_MUC[muc];
  return { tamHop: TAM_HOP[goc], guong: GUONG[goc] };
}

/** Các cung tham chiếu của phần này nằm ngoài chặng của nó — dùng cho sổ bao phủ */
export function thamChieuNgoaiChang(muc: MucId): string[] {
  const chang = CHANG_CUA_MUC[muc];
  const trongChang = new Set(CHANG[chang].cung);
  const { tamHop, guong } = cungThamChieu(muc);
  return [...tamHop, guong].filter((c) => !trongChang.has(c));
}
