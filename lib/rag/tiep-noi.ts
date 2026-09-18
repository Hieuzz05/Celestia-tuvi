import type { TinNhan } from '@/lib/ai/prompt';

/**
 * Trí nhớ hội thoại cho Hỏi Celes — §12.5 của khung luận.
 *
 * Bản cũ làm đúng một việc: cắt sáu lượt gần nhất rồi dán nguyên vào prompt.
 * Điều đó vi phạm hai câu trong §12.5 cùng lúc:
 *
 *   "Dùng just-in-time context; không nhét toàn bộ lịch sử chat vào mọi request."
 *   "Nếu câu hiện tại là follow-up, ưu tiên continuity thay vì tạo lại luận giải
 *    từ đầu."
 *
 * Sáu lượt dán thô vừa thừa vừa thiếu. Thừa vì phần lớn câu cũ không liên quan
 * tới câu đang hỏi, mà mỗi câu thừa là một chỗ để model bám nhầm. Thiếu vì điều
 * người dùng TỰ KỂ — đang làm nghề gì, đã có gia đình chưa, đang cân nhắc chuyện
 * gì — trôi mất khi nó lùi quá lượt thứ sáu, dù đó chính là thứ đáng nhớ nhất.
 *
 * Nên tách làm hai dòng riêng:
 *
 *  1. **Điều người đọc tự kể** gom từ TOÀN BỘ hội thoại, nhưng CHỈ từ lượt của
 *     người dùng. Không lấy từ lượt của Celes: suy đoán của model mà cất lại
 *     thành "điều người dùng đã nói" là cách nhanh nhất để một phỏng đoán biến
 *     thành sự thật sau vài lượt. §12.5 cấm thẳng điều này.
 *  2. **Mạch đang nói dở** chỉ giữ khi câu hiện tại thật sự là câu nối tiếp.
 *
 * Tất cả đều là luật thuần, không gọi model: một lượt chat đã tốn một lượt gọi,
 * thêm một lượt nữa chỉ để tóm tắt lịch sử là nhân đôi chi phí cho mỗi câu hỏi.
 */

export const PHIEN_BAN_TIEP_NOI = '2026.09.1';

function boDau(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}

/**
 * Dấu hiệu câu hiện tại đang nối tiếp câu trước.
 *
 * Toàn những cụm không thể đứng một mình: "vậy còn", "thế thì", "tại sao vậy".
 * Câu mở đầu một chủ đề mới gần như không bao giờ bắt đầu bằng chúng.
 */
const DAU_HIEU_NOI_TIEP = [
  'vay con',
  'the con',
  'con ',
  'vay thi',
  'the thi',
  'vay tai sao',
  'tai sao vay',
  'vi sao vay',
  'nghia la sao',
  'la sao',
  'noi ro hon',
  'giai thich them',
  'cu the hon',
  'vi du',
  'con gi nua',
  'y ban la',
  'y la',
  'nhu the nao',
  'sao lai',
];

/** Đại từ trỏ ngược — "điều đó", "chuyện này" chỉ có nghĩa khi có câu trước */
const TRO_NGUOC = ['dieu do', 'chuyen do', 'dieu nay', 'chuyen nay', 'cai do', 'cai nay', 'no co'];

export function laCauNoiTiep(cauHoi: string, lichSu: TinNhan[]): boolean {
  if (!lichSu.some((t) => t.vaiTro === 'tro-ly')) return false;

  const s = boDau(cauHoi.trim());
  if (DAU_HIEU_NOI_TIEP.some((d) => s.startsWith(d))) return true;
  if (TRO_NGUOC.some((d) => s.includes(d))) return true;

  // Câu rất ngắn sau một câu trả lời dài gần như luôn là câu hỏi nối
  return s.split(/\s+/).length <= 5;
}

/**
 * Điều người đọc TỰ KỂ, gom từ mọi lượt của họ.
 *
 * Bắt bằng mẫu câu chứ không bằng model: "tôi đang làm…", "tôi đã lấy vợ",
 * "tôi muốn…". Cố ý hẹp. Bắt rộng thì nhặt cả câu hỏi giả định của người dùng
 * ("nếu tôi nghỉ việc thì sao") và cất nó lại thành sự thật — sai nguy hiểm hơn
 * hẳn là bỏ sót.
 */
const MAU_TU_KE: RegExp[] = [
  /\btôi (?:đang|hiện) (?:làm|ở|sống|học|theo)\b[^.!?]{0,80}/gi,
  /\btôi (?:đã|vừa) (?:lấy|cưới|kết hôn|ly hôn|nghỉ việc|chuyển|sinh)\b[^.!?]{0,80}/gi,
  /\btôi (?:có|chưa có) (?:vợ|chồng|con|người yêu|gia đình)\b[^.!?]{0,60}/gi,
  /\btôi muốn\b[^.!?]{0,80}/gi,
  /\btôi (?:là|làm) (?:nghề|nhân viên|quản lý|giáo viên|kỹ sư|bác sĩ|kinh doanh)\b[^.!?]{0,60}/gi,
];

/** Câu giả định không phải điều đã xảy ra — "nếu tôi nghỉ việc thì sao" */
const GIA_DINH = /\b(?:nếu|giả sử|liệu|có nên|nên không)\b/i;

export function gomDieuTuKe(lichSu: TinNhan[], toiDa = 5): string[] {
  const ra: string[] = [];
  const daCo = new Set<string>();

  for (const t of lichSu) {
    // CHỈ lượt của người dùng. Suy đoán của Celes không phải điều người ta kể.
    if (t.vaiTro !== 'nguoi-dung') continue;

    for (const cau of t.noiDung.split(/(?<=[.!?])\s+/)) {
      if (GIA_DINH.test(cau)) continue;
      for (const mau of MAU_TU_KE) {
        mau.lastIndex = 0;
        for (const khop of cau.matchAll(mau)) {
          const y = khop[0].trim().replace(/\s{2,}/g, ' ');
          const khoa = boDau(y);
          if (y.length < 10 || daCo.has(khoa)) continue;
          daCo.add(khoa);
          ra.push(y);
        }
      }
    }
  }

  // Giữ điều mới nhất khi quá nhiều: hoàn cảnh cũ dễ đã hết đúng
  return ra.slice(-toiDa);
}

export interface BoiCanhHoiThoai {
  /** Điều người đọc tự kể — là bối cảnh, KHÔNG phải dữ kiện lá số */
  dieuTuKe: string[];
  /** Mạch đang nói dở, chỉ có khi câu hiện tại là câu nối */
  machDangNoi: TinNhan[];
  noiTiep: boolean;
}

/**
 * Chọn đúng phần lịch sử cần cho câu hỏi hiện tại.
 *
 * Câu nối tiếp thì giữ hai lượt gần nhất để model biết "điều đó" là điều gì.
 * Câu mở chủ đề mới thì KHÔNG giữ lượt nào: giữ lại chỉ khiến model kéo bài cũ
 * sang bài mới, mà người hỏi đã chuyển chuyện rồi.
 */
export function chonBoiCanhHoiThoai(cauHoi: string, lichSu: TinNhan[]): BoiCanhHoiThoai {
  const noiTiep = laCauNoiTiep(cauHoi, lichSu);
  return {
    dieuTuKe: gomDieuTuKe(lichSu),
    machDangNoi: noiTiep ? lichSu.slice(-2) : [],
    noiTiep,
  };
}
