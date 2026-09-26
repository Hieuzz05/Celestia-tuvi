import { goiVoiFallback } from '@/lib/ai/fallback';
import type { LaSo } from '@/lib/tuvi/ansao';
import { docObjectJson } from '../doc-json';
import { CAU_HOI_V3, CHU_DE_V3, PHIEN_BAN_KHUNG_V3, type CauHoiV3 } from './khung';
import { dungDuKien, hoiThoiDiem, PHIEN_BAN_DU_KIEN_V3, saoDuocPhep, type DuKienV3 } from './du-kien';
import { donTatDinh, kiemBai, type BaiV3, type LoiV3 } from './kiem-v3';
import { khoiDoDai, PHIEN_BAN_PROMPT_V3, SYSTEM_V3 } from './prompt-v3';
import { PHIEN_BAN_TRUY_HOI_V3, truyHoiChoCau, type BoNhoTruyHoi, type DoanV3 } from './truy-hoi-v3';
import { khoiDaNoi, kiemLapCum, kiemLapPhanKhac, type MucDaNoi } from './so-y';
import { NHAN_TIN_CAY } from '../uu-tien-nguon';

/**
 * LUỒNG LUẬN GIẢI v3 — Tổng quan + Chuyên sâu, mỗi câu hỏi một lượt gọi.
 *
 *   engine (ma trận cung) → dữ kiện F### → RAG theo từng cung → E###
 *   → Celes viết (dàn ý có mã → bài luận → vì sao) → kiểm bằng mã
 *   → nếu có lỗi chặn: MỘT vòng sửa có chỉ đích → kiểm lại → dọn tất định
 *
 * Mỗi câu độc lập nên chạy song song được và hết giờ chỉ mất đúng câu ấy —
 * đúng chỗ bản đọc sâu cũ gãy (TRANG-THAI "Đang vướng": chặng sau chạm trần
 * 55 giây là cả phần trống).
 */

export const PHIEN_BAN_V3 = {
  khung: PHIEN_BAN_KHUNG_V3,
  duKien: PHIEN_BAN_DU_KIEN_V3,
  truyHoi: PHIEN_BAN_TRUY_HOI_V3,
  prompt: PHIEN_BAN_PROMPT_V3,
};

/** Biến thể prompt cho bộ thử nghiệm (scripts/thu-nghiem-do-ro.ts) — không dùng trong sản phẩm */
export interface ThuNghiemV3 {
  system?: string;
  themVao?: (laSo: LaSo, q: CauHoiV3) => string;
  heSoDoDai?: number;
}

export interface KetQuaCauV3 {
  id: string;
  loai: CauHoiV3['loai'];
  cauHoi: string;
  luanGiai: string;
  viSao: string;
  /** Gợi ý tách khỏi bài luận — trang gom thành phần "Gợi ý của Celes" */
  goiY: string;
  doRo: 'Rõ' | 'Khá rõ' | 'Gợi ý';
  danY: BaiV3['danY'];
  duKien: DuKienV3[];
  nguon: DoanV3[];
  /** Lỗi còn lại sau vòng sửa — rỗng nghĩa là qua hết luật đếm được */
  loiConLai: LoiV3[];
  /** Lỗi của bản đầu, trước khi sửa — để đo prompt chứ không chỉ đo đầu ra */
  loiBanDau: LoiV3[];
  soLanGoi: number;
  /** Token của mọi lượt gọi cho câu này (vào / ra / phần vào được nhà cung cấp đệm) — để đo chi phí */
  token: { vao: number; ra: number; dem: number };
  model: string;
  ms: number;
  msTruyHoi: number;
  dat: boolean;
}

function docBai(text: string): BaiV3 | null {
  const o = docObjectJson(text) as Record<string, unknown> | null;
  if (!o || typeof o.luanGiai !== 'string' || typeof o.viSao !== 'string') return null;
  const danY = Array.isArray(o.danY)
    ? (o.danY as unknown[])
        .filter((y): y is Record<string, unknown> => !!y && typeof y === 'object')
        .map((y) => ({
          y: typeof y.y === 'string' ? y.y : '',
          canCu: Array.isArray(y.canCu) ? (y.canCu as unknown[]).filter((x): x is string => typeof x === 'string') : [],
          ...(y.ghep === true ? { ghep: true } : {}),
        }))
    : [];
  return {
    danY,
    luanGiai: o.luanGiai.replace(/\r/g, '').trim(),
    viSao: o.viSao.replace(/\s*\n+\s*/g, ' ').trim(),
    goiY: typeof o.goiY === 'string' ? o.goiY.replace(/\s+/g, ' ').trim() : '',
  };
}

function doRoCua(q: CauHoiV3, dk: DuKienV3[], nguon: DoanV3[]): KetQuaCauV3['doRo'] {
  if (q.cung[0] === 'TH' || q.van.includes('nguyet')) return 'Gợi ý';
  const chinh = dk.find((d) => d.vaiTro.includes('(chính)') || d.vaiTro === 'cung chính');
  const vcd = chinh?.noiDung.includes('không có chính tinh');
  const khop = nguon.filter((n) => n.khopCung && n.khopSao.length).length;
  if (vcd) return 'Khá rõ';
  return khop >= 2 ? 'Rõ' : 'Khá rõ';
}

/** Câu tổng quan nào hỏi về mặt đời nào — để truy hồi dùng đúng từ khoá */
const TU_KHOA_TONG_QUAN: Record<string, string> = {
  TQ01: 'tinh-cach', TQ05: 'su-nghiep', TQ06: 'tien-bac', TQ07: 'tinh-duyen', TQ08: 'van-han', TQ09: 'van-han', TQ10: 'van-han',
};

/**
 * PHẠM VI của từng câu tổng quan. Mười một câu hiện trên một màn hình nhưng
 * sinh song song, nên không câu nào biết câu kia nói gì. Đo ở lượt 2: năm câu
 * cùng kết bằng "đừng làm một mình", vì cách cục Tả Hữu có mặt trong dữ kiện
 * của cả năm. Chia phạm vi bằng mã rẻ hơn gộp mười một câu vào một lượt gọi.
 */
const PHAM_VI_TONG_QUAN: Record<string, string> = {
  TQ01: 'Chỉ nói con người: tính khí, cách ứng xử, mặt trong và mặt ngoài. Không bàn nghề, tiền, tình duyên, quý nhân Ví dụ lấy từ đời sống rộng (gia đình, bạn bè, tình cảm, lúc một mình) — công việc tối đa một ví dụ phụ, không mô tả bằng phong cách làm việc.',
  TQ02: 'Chỉ MỘT điểm mạnh lớn nhất, nó hiện ra thế nào trong đời, và kết bằng cách dùng điểm mạnh ấy cho đúng chỗ. Không kể thêm điểm yếu Ví dụ lấy từ đời sống rộng (gia đình, bạn bè, tình cảm, lúc một mình) — công việc tối đa một ví dụ phụ, không mô tả bằng phong cách làm việc.',
  TQ03: 'Chỉ MỘT điều cần lưu ý nhất (kiểu sai lặp lại hoặc mặt đời yếu nhất) và dấu hiệu nhận ra. Không nhắc lại điểm mạnh Ví dụ lấy từ đời sống rộng (gia đình, bạn bè, tình cảm, lúc một mình) — công việc tối đa một ví dụ phụ, không mô tả bằng phong cách làm việc.',
  // Bản đồ mạnh – yếu trên trang đã liệt kê đủ ba nhóm; bài kể lại danh sách thì hết chữ cho phần "vì sao" (giám khảo 3/5, 25/09/2026)
  TQ04: 'Bản đồ trên trang đã liệt kê đủ ba nhóm Thuận lợi / Ổn định / Cần chăm chút — không kể lại đủ mười hai mặt. Mở bằng tên hai mặt mạnh nhất và hai mặt cần chăm chút nhất (để đoạn văn tự đứng được khi đọc riêng), rồi nói vì sao hai mặt mạnh nhất lại mạnh và hai mặt cần chăm chút nhất cần chăm (bằng phần đời, dựa dữ kiện "vì sao"), hai đầu ấy hiện ra thế nào trong đời, rồi kết bằng một lời khuyên dùng mặt mạnh để đỡ mặt yếu.',
  TQ05: 'Chỉ nói hướng nghề: nhóm nghề cụ thể và vai trò hợp. Không bàn tiền, tình duyên.',
  TQ06: 'Chỉ nói tiền bạc: kiếm dễ hay khó, giữ được không, nguồn chính, mốc thay đổi nếu dữ kiện có.',
  TQ07: 'Chỉ nói tình duyên: kiểu duyên, sớm hay muộn, người hợp.',
  TQ08: 'Chỉ nói giai đoạn 10 năm đang chạy: tên gọi giai đoạn, chủ đề chính, một lưu ý.',
  TQ09: 'Chỉ nói năm xem: chủ đề năm, một hai việc nên làm và nên tránh, dựa trên vận năm trong dữ kiện.',
  TQ10: 'Kể đường đời theo BA chặng lớn — tiền vận, trung vận, hậu vận — mỗi chặng một hai câu về xu hướng chung và điều đổi khác giữa các chặng. KHÔNG liệt kê từng giai đoạn 10 năm (phần đó thuộc Vận hạn chuyên sâu).',
  TQ11: 'Chỉ gợi ý 2–3 phần nên xem sâu trước và lý do ngắn cho từng phần.',
};

/**
 * PHẠM VI của một câu chuyên sâu, dựng từ chính khung: các câu cùng chủ đề
 * sinh song song nên không câu nào biết câu kia nói gì. Đo 24/09/2026 (lá số
 * A, 19 câu): chữ gần như không trùng (<2% câu) nhưng Ý lặp dày — cùng một
 * nét tính cách, cùng một mốc tuổi, cùng một lời khuyên đi qua bốn năm câu.
 * Nói cho mỗi câu biết các câu anh em lo phần nào là cách rẻ nhất để chia ý.
 */
/**
 * Câu GIỮ DÒNG THỜI GIAN của từng chủ đề (25/09/2026). Đo lá số A: chủ đề Tiền
 * bạc có ba câu (TB02, TB06, TB07) cùng kể lại "35–44 nhà cửa làm lại, 45–54
 * sáng nhất" — mỗi câu đều nhận chuỗi đại vận. Chỉ câu này kể đủ các mốc; câu
 * khác trong chủ đề nêu tối đa một mốc trả lời đúng câu hỏi của nó.
 */
// Cập nhật 26/09/2026 theo khung mới (khung 2026.09.3)
const CAU_GIU_MOC: Record<string, string> = {
  'tinh-cach': 'TC08', 'su-nghiep': 'SN07', 'tien-bac': 'TB06', 'tinh-duyen': 'TD06', 'con-cai': 'CC02',
  'gia-dinh': 'GD05', 'anh-em': 'AE02', 'quy-nhan': 'QN03', 'phuc-duc': 'PD05', 'suc-khoe': 'SK05',
  'nha-cua': 'NC05', 'ra-ngoai': 'RN02', 'hoc-van': 'HV06', 'van-han': 'VH02',
};

function luatMoc(q: CauHoiV3): string {
  if (!hoiThoiDiem(q)) return '';
  const giu = CAU_GIU_MOC[q.chuDe];
  if (giu === q.id) {
    return q.chuDe === 'van-han'
      ? ''
      : 'Câu này giữ dòng thời gian của chủ đề: ở mỗi mốc chỉ nói điều xảy ra với ĐÚNG phần đời của chủ đề này. Không gọi tên chủ đề chung của giai đoạn (kiểu "giai đoạn nhà cửa", "đoạn đời sống tinh thần") và không kể lại dòng đời chung — phần đó thuộc Vận hạn. Chỉ nêu những mốc thật sự làm phần đời này đổi khác, không cần đủ mọi giai đoạn.';
  }
  const cauGiu = giu && CAU_HOI_V3.find((x) => x.id === giu);
  return cauGiu
    ? `Các mốc giai đoạn của chủ đề này do câu "${cauGiu.cauHoi}" kể — câu này nêu tối đa MỘT mốc, đúng mốc trả lời câu hỏi của nó.`
    : '';
}

/**
 * LĂNG KÍNH của từng chủ đề (26/09/2026). Review chương Tính cách lá số Hiếu:
 * "khoảng 40% đã trượt sang năng lực / phong cách làm việc" — bản chất tả bằng
 * "sắp xếp ai làm gì", người khác nhìn tôi thành "đồng nghiệp nhìn tôi", gợi ý
 * thành tư vấn nghề. Nguyên nhân: dữ kiện Mệnh của nhiều lá số là bộ sao "điều
 * hành", model kéo mọi chủ đề về công việc. Mỗi chủ đề giữ đúng phần đời của nó;
 * công việc chỉ là MỘT nơi ví dụ, không phải khung chính.
 */
const LANG_KINH: Record<string, string> = {
  'tinh-cach':
    'Nói về CON NGƯỜI khi bỏ hết nghề nghiệp, chức danh và trách nhiệm ra ngoài: điều họ sống vì, cần gì để thấy yên, dễ tổn thương bởi gì, cách đối xử với chính mình và với người khác. Ví dụ phải trải qua nhiều nơi — gia đình, bạn bè, tình yêu, tiền bạc, lúc ở một mình, khi gặp biến cố. Công việc tối đa MỘT ví dụ phụ trong cả bài; KHÔNG dùng từ vựng quản lý (điều phối, quyền quyết định, nguồn lực, đầu mối, tiến độ, giao việc, cả nhóm).',
  'tien-bac': 'Nói về chuyện TIỀN: kiếm, giữ, tiêu, hao, tích sản. Công việc chỉ xuất hiện như một nguồn tiền; không phân tích phong cách làm việc hay tính cách chung.',
  'tinh-duyen': 'Nói về đời sống TÌNH CẢM và hôn nhân: cách yêu, người đi cùng, những gì xảy ra giữa hai người. Công việc chỉ nhắc khi câu hỏi hỏi về ảnh hưởng qua lại.',
  'con-cai': 'Nói về CON CÁI và quan hệ cha mẹ – con; không tả lại tính cách chung của người đọc.',
  'gia-dinh': 'Nói về CHA MẸ và gia đình gốc; không tả lại tính cách chung hay chuyện công việc của người đọc.',
  'anh-em': 'Nói về ANH CHỊ EM; không tả lại tính cách chung của người đọc.',
  'quy-nhan': 'Nói về NHỮNG NGƯỜI XUNG QUANH: ai giúp, ai kéo, vì sao; không tả lại tính cách chung.',
  'phuc-duc': 'Nói về NỀN PHÚC, đường thoát khi gặp khó và hậu vận; không kéo sang công việc.',
  'suc-khoe': 'Nói về THỂ TRẠNG và các vùng sức khỏe; không kéo sang tính cách hay công việc, trừ khi đó là nguyên nhân trực tiếp của một rủi ro vừa luận.',
  'nha-cua': 'Nói về NHÀ CỬA, nơi ở và tài sản cố định; không kéo sang tính cách chung.',
  'ra-ngoai': 'Nói về chuyện ĐI XA, ra ngoài xã hội và sống ở nơi khác; công việc chỉ nhắc như một lý do đi.',
  'hoc-van': 'Nói về HỌC HÀNH, thi cử, bằng cấp; không biến thành lời khuyên phương pháp học hay tư vấn nghề.',
};

function phamViChuyenSau(q: CauHoiV3): string {
  const anhEm = CAU_HOI_V3.filter((x) => x.loai === 'chuyen-sau' && x.chuDe === q.chuDe && x.id !== q.id);
  const ten = CHU_DE_V3.find((c) => c.id === q.chuDe)?.ten ?? q.chuDe;
  const dong = [
    `Đây là một trong ${anhEm.length + 1} câu của chủ đề "${ten}"; người đọc đọc liền các câu trên cùng một trang. Chỉ đi sâu đúng trọng tâm câu này.`,
    LANG_KINH[q.chuDe] ? `LĂNG KÍNH CHỦ ĐỀ (áp cho cả bài luận và trường goiY): ${LANG_KINH[q.chuDe]}` : '',
    anhEm.length
      ? `Những phần sau đã có câu khác trả lời — KHÔNG triển khai lại ở đây; nếu buộc phải chạm tới thì tối đa nửa câu làm cầu nối:\n${anhEm
          .map((x) => `- ${x.cauHoi} (${x.nhanDuoc})`)
          .join('\n')}`
      : '',
    hoiThoiDiem(q)
      ? luatMoc(q)
      : 'Câu này KHÔNG hỏi về thời điểm: không nêu mốc tuổi, giai đoạn mười năm hay năm cụ thể.',
    q.chuDe === 'tinh-cach'
      ? ''
      : 'Không tả lại tính cách chung của người này — phần đó thuộc chủ đề Tính cách. Nét tính cách chỉ được dùng một vế để giải thích một biểu hiện riêng của câu này.',
    // 25/09/2026 (chủ dự án): không câu nào kết bằng lời khuyên — gợi ý tách sang trường goiY, trang gom thành phần riêng
    'Bài KHÔNG kết bằng lời khuyên: đoạn cuối khép lại bằng một điểm cần lưu ý hoặc hệ quả rút ra từ phần luận. Gợi ý (nếu có) viết vào trường "goiY".',
  ];
  return dong.filter(Boolean).join('\n');
}

const AN_TOAN_SUC_KHOE = 'Đây là xu hướng để tham khảo, không phải chẩn đoán; chuyện sức khỏe cụ thể cần người có chuyên môn xem.';
const AN_TOAN_TAI_CHINH = 'Đây là góc nhìn từ lá số, không phải tư vấn tài chính.';

function datAnToan(q: CauHoiV3, bai: BaiV3): BaiV3 {
  const s = bai.luanGiai.toLowerCase();
  let luan = bai.luanGiai;
  // Sức khỏe: KHÔNG gắn câu an toàn vào từng câu nữa (26/09/2026 — sáu câu cùng một đuôi là đúng kiểu lời chung chủ dự án chê);
  // trang chuyên sâu hiện MỘT dòng lưu ý ở đầu chủ đề Sức khỏe
  void AN_TOAN_SUC_KHOE;
  if (/đầu tư/.test(q.cauHoi.toLowerCase()) && !s.includes('tư vấn tài chính')) luan = `${luan.trim()} ${AN_TOAN_TAI_CHINH}`;
  return { ...bai, luanGiai: luan };
}

export async function luanMotCau(vao: {
  laSo: LaSo;
  q: CauHoiV3;
  namXem: number;
  nho: BoNhoTruyHoi;
  nganSachMs?: number;
  /**
   * Mốc (Date.now()) mà cả request phải xong trước. Route trên Vercel sống tối
   * đa 60 giây; đo trên máy: nhóm tổng quan 11 câu xong ở giây 47 lần đầu. Còn
   * ít hơn 20 giây thì bỏ vòng sửa, giữ bản đầu — bản đầu lệch luật nhẹ vẫn hơn
   * cả nhóm chết vì quá trần.
   */
  hanChot?: number;
  /** CHỈ dùng cho bộ thử nghiệm — thay system prompt, thêm khối vào user, nới độ dài. Sản phẩm không truyền. */
  thuNghiem?: ThuNghiemV3;
  /** Sổ ý các phần ĐÃ SINH của cùng lá số + năm — chống lặp giữa các phần (xem so-y.ts) */
  daNoi?: MucDaNoi[];
}): Promise<KetQuaCauV3> {
  const t0 = Date.now();
  const { q } = vao;
  const duKien = dungDuKien(vao.laSo, q, vao.namXem);
  const tRag = Date.now();
  const nguon = await truyHoiChoCau({
    chuDe: q.chuDe,
    chuDeTuKhoa: TU_KHOA_TONG_QUAN[q.id],
    cungUuTien: q.loai === 'chuyen-sau' ? CHU_DE_V3.find((c) => c.id === q.chuDe)?.cungChinh : undefined,
    cauHoi: q.cauHoi,
    duKien,
    nho: vao.nho,
  });
  const msTruyHoi = Date.now() - tRag;
  const phep = saoDuocPhep(duKien);
  // Cung chính để đánh dấu nguồn khớp: cung chính của chủ đề (chuyên sâu) hoặc cung đầu danh sách câu
  const cungChinhCau =
    (q.loai === 'chuyen-sau' ? CHU_DE_V3.find((c) => c.id === q.chuDe)?.cungChinh : undefined) ??
    duKien.find((d) => d.vaiTro === 'cung chính' || d.vaiTro.endsWith('(chính)'))?.cung;

  const user = [
    khoiDoDai(q.loai),
    vao.thuNghiem?.themVao?.(vao.laSo, q) ?? '',
    `CÂU HỎI CỦA NGƯỜI ĐỌC: ${q.cauHoi}`,
    `NGƯỜI ĐỌC CẦN NHẬN ĐƯỢC: ${q.nhanDuoc}`,
    PHAM_VI_TONG_QUAN[q.id]
      ? `PHẠM VI CÂU NÀY: ${PHAM_VI_TONG_QUAN[q.id]}`
      : q.loai === 'chuyen-sau'
        ? `PHẠM VI CÂU NÀY:
${phamViChuyenSau(q)}`
        : '',
    khoiDaNoi(q, vao.daNoi ?? []),
    q.yeuToThem ? `YẾU TỐ NÊN XÉT: ${q.yeuToThem}` : '',
    q.khongDuoc ? `KHÔNG ĐƯỢC: ${q.khongDuoc}` : '',
    `DỮ KIỆN LÁ SỐ (engine tính, không được sửa hay thêm):\n${duKien.map((d) => `${d.id} [${d.vaiTro}] ${d.noiDung}`).join('\n')}`,
    `NGUỒN THAM CHIẾU (trích sách, chỉ dùng đoạn nói đúng tổ hợp sao – cung của lá số này):\n${
      nguon.length
        ? nguon
            .map(
              (n) =>
                // Không đưa tên sách vào nhãn: model chép lại nó vào phần "vì sao" ("Theo cách đọc của Tử Vi Hàm Số…")
                // Luật ngầm không mang cả đề mục — đề mục của ghi chú chuyên gia hay tự xưng tên mình.
                `${n.id} [${n.an ? 'LUẬT NGẦM' : (n.duongDeMuc ?? 'đoạn sách')}] [tin cậy: ${NHAN_TIN_CAY[n.mucTinCay] ?? n.mucTinCay}]${n.khopCung && n.khopCung === cungChinhCau ? ' [KHỚP CUNG CHÍNH]' : ''}\n${n.noiDung}`
            )
            .join('\n\n')
        : '(Kho không có đoạn nào khớp — thu hẹp kết luận, chỉ dựa vào phần Nghĩa nền trong dữ kiện.)'
    }`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const maDuKien = new Set(duKien.map((d) => d.id));
  const maNguon = new Set(nguon.map((n) => n.id));
  /*
   * Tên sách lọt vào bài (25/09/2026): luật trình bày cấm nêu tên sách, nhưng rà
   * phần "vì sao" thấy "Theo cách đọc của Tử Vi Hàm Số…". Bắt bằng tên tài liệu của
   * chính các đoạn nguồn được cấp (đủ ba chữ trở lên để không bắt nhầm "Tử Vi").
   */
  const tenSach = [...new Set(nguon.map((n) => n.tieuDe.trim()))].filter((t) => t.split(/\s+/).length >= 3);
  const kiemTenSach = (b: BaiV3) => {
    const chu = `${b.luanGiai} ${b.viSao}`.toLowerCase();
    const lo = tenSach.filter((t) => chu.includes(t.toLowerCase()));
    return lo.length
      ? [{ ma: 'ten-sach', moTa: `Nêu tên sách (${lo.join(', ')}) — bỏ tên sách, nói "sách xưa" hoặc chỉ nói điều sách nói.`, chan: true }]
      : [];
  };
  // Giọng giao việc có hạn — chủ dự án bỏ 25/09/2026 ("gây cảm giác ép buộc")
  const kiemGiaoViec = (b: BaiV3) =>
    /(trong|ngay|ngay trong) (tuần|tháng) (tới|này|sau)|tuần tới|ngay hôm nay|trong \d+ ngày tới/i.test(`${b.luanGiai} ${b.goiY ?? ''}`)
      ? [{ ma: 'giao-viec', moTa: 'Lời khuyên đặt hạn kiểu "trong tuần tới / ngay hôm nay" — viết lại thành gợi ý ("bạn có thể…", "nên cân nhắc…"), không đặt hạn.', chan: true }]
      : [];
  // Tên luật lọt vào bài ("Câu 'đúng quá' là…", "Cảm giác rất đúng với bạn là:") — model chép nhãn của yêu cầu (đo 25/09/2026)
  const kiemNhanLuat = (b: BaiV3) =>
    /đúng quá|rất đúng với bạn|cảm giác rất đúng|lát cắt|khoảnh khắc|dữ kiện|tín hiệu (bất lợi|phụ trợ|chiếu)/i.test(b.luanGiai)
      ? [{ ma: 'nhan-luat', moTa: 'Bài dùng chữ nội bộ ("dữ kiện", "tín hiệu phụ trợ", "đúng quá", "lát cắt") — nói bằng lời người xem lá số: "lá số của bạn", "phần sức khỏe của bạn", hoặc nói thẳng điều đó.', chan: true }]
      : [];
  /*
   * MỨC TIN CẬY (26/09/2026): đoạn "bổ trợ" chỉ làm dày ngữ cảnh — một ý mà căn
   * cứ duy nhất là đoạn bổ trợ thì chưa đủ đứng thành nhận định.
   */
  const hoTro = new Set(nguon.filter((n) => n.mucTinCay === 'ho-tro').map((n) => n.id));
  const kiemHoTro = (b: BaiV3) => {
    const chiHoTro = b.danY.filter((y) => y.canCu.length && y.canCu.every((m) => hoTro.has(m)));
    return chiHoTro.length
      ? [{ ma: 'chi-bo-tro', moTa: `Ý "${chiHoTro[0].y}" chỉ dựa vào đoạn [tin cậy: bổ trợ] — thêm căn cứ từ dữ kiện lá số (F###) hoặc một đoạn nguồn khác, hoặc bỏ ý đó.`, chan: true }]
      : [];
  };
  // Luật ngầm lộ ra bài — chủ dự án 26/09/2026: nguồn chuyên gia Celes không ghi trên lá số
  const coLuatNgam = nguon.some((n) => n.an);
  const kiemLuatNgam = (b: BaiV3) =>
    // Chỉ bắt kiểu viện dẫn ("theo chuyên gia", "ghi chú của…") — "làm chuyên gia" là lời thường ở câu nghề nghiệp
    coLuatNgam && /(theo|của|ghi chú|nhận định|góc nhìn|kinh nghiệm)( của)?( các| một| giới)? chuyên gia|luật ngầm|luật nội bộ|tài liệu nội bộ/i.test(`${b.luanGiai} ${b.viSao} ${b.goiY ?? ''}`)
      ? [{ ma: 'lo-luat-ngam', moTa: 'Bài nhắc tới "chuyên gia" / "ghi chú" / "nội bộ" — đoạn LUẬT NGẦM chỉ để định hướng, không được gọi tên hay nhắc tới. Nói thẳng nhận định như điều lá số cho thấy.', chan: true }]
      : [];
  const kiem = (b: BaiV3) => [
    ...kiemBai({ bai: b, loai: q.loai, maDuKien, maNguon, saoDuocPhep: phep, hoiThoiDiem: hoiThoiDiem(q), heSoDoDai: vao.thuNghiem?.heSoDoDai }),
    ...kiemLapPhanKhac(b.luanGiai, vao.daNoi ?? [], q.id),
    ...kiemLapCum(b.luanGiai, vao.daNoi ?? [], q.loai === 'chuyen-sau' ? q.chuDe : 'tong-quan'),
    ...kiemTenSach(b),
    ...kiemGiaoViec(b),
    ...kiemNhanLuat(b),
    ...kiemHoTro(b),
    ...kiemLuatNgam(b),
  ];

  let soLanGoi = 0;
  let model = '';
  const token = { vao: 0, ra: 0, dem: 0 };
  const goi = async (u: string) => {
    soLanGoi += 1;
    const trongHan = Math.max(16_000, Math.min(vao.nganSachMs ?? 55_000, (vao.hanChot ?? Infinity) - Date.now()));
    const kq = await goiVoiFallback({ system: vao.thuNghiem?.system ?? SYSTEM_V3, user: u, maxTokens: 6000 }, undefined, trongHan);
    model = `${kq.provider}/${kq.model}`;
    token.vao += kq.tokensIn ?? 0;
    token.ra += kq.tokensOut ?? 0;
    token.dem += kq.tokensDem ?? 0;
    return docBai(kq.text);
  };

  let bai = await goi(user);
  if (!bai) bai = await goi(user); // JSON gãy: thử lại nguyên lượt một lần
  if (!bai) {
    return {
      id: q.id, loai: q.loai, cauHoi: q.cauHoi, luanGiai: '', viSao: '', goiY: '', doRo: 'Gợi ý', danY: [], duKien, nguon,
      loiConLai: [{ ma: 'khong-doc-duoc', moTa: 'Model không trả JSON đọc được sau hai lượt.', chan: true }],
      loiBanDau: [], soLanGoi, token, model, ms: Date.now() - t0, msTruyHoi, dat: false,
    };
  }
  bai = donTatDinh(bai);
  const loiBanDau = kiem(bai);

  /*
   * MỘT vòng sửa, có chỉ đích. Gửi lại chính bài vừa viết cùng danh sách lỗi
   * bằng lời, và dặn giữ nguyên nội dung. Không viết lại từ đầu: viết lại là
   * lại tung xúc xắc với toàn bộ bài, trong khi chỉ một hai chỗ hỏng.
   */
  let loi = loiBanDau;
  const conLai = (vao.hanChot ?? Infinity) - Date.now();
  if (loi.some((l) => l.chan) && conLai > 20_000) {
    const sua = await goi(
      `${user}\n\nBÀI VỪA VIẾT (JSON):\n${JSON.stringify(bai)}\n\nLỖI CẦN SỬA — sửa ĐÚNG những lỗi này, giữ nguyên các ý và căn cứ, trả lại đủ JSON:\n${loi
        .filter((l) => l.chan)
        .map((l) => `- ${l.moTa}`)
        .join('\n')}`
    );
    if (sua) {
      const s = donTatDinh(sua);
      const loiSau = kiem(s);
      // Chỉ nhận bản sửa nếu nó không tệ hơn
      if (loiSau.filter((l) => l.chan).length <= loi.filter((l) => l.chan).length) {
        bai = s;
        loi = loiSau;
      }
    }
  }
  bai = datAnToan(q, bai);

  return {
    id: q.id,
    loai: q.loai,
    cauHoi: q.cauHoi,
    luanGiai: bai.luanGiai,
    viSao: bai.viSao,
    goiY: bai.goiY ?? '',
    doRo: doRoCua(q, duKien, nguon),
    danY: bai.danY,
    duKien,
    nguon,
    loiConLai: loi,
    loiBanDau,
    soLanGoi,
    token,
    model,
    ms: Date.now() - t0,
    msTruyHoi,
    dat: !loi.some((l) => l.chan),
  };
}

/** Chạy nhiều câu với giới hạn song song — nhà cung cấp chung hạn mức cho cả hai máy */
export async function luanNhieuCau(vao: {
  laSo: LaSo;
  ids: string[];
  namXem: number;
  songSong?: number;
  hanChot?: number;
  thuNghiem?: ThuNghiemV3;
  daNoi?: MucDaNoi[];
  khiXong?: (k: KetQuaCauV3) => void;
}): Promise<KetQuaCauV3[]> {
  const nho: BoNhoTruyHoi = new Map();
  const ds = vao.ids.map((id) => CAU_HOI_V3.find((q) => q.id === id)).filter((q): q is CauHoiV3 => !!q);
  const ra: KetQuaCauV3[] = new Array(ds.length);
  let i = 0;
  const tho = async () => {
    while (i < ds.length) {
      const j = i++;
      try {
        ra[j] = await luanMotCau({ laSo: vao.laSo, q: ds[j], namXem: vao.namXem, nho, hanChot: vao.hanChot, thuNghiem: vao.thuNghiem, daNoi: vao.daNoi });
      } catch (e) {
        ra[j] = {
          id: ds[j].id, loai: ds[j].loai, cauHoi: ds[j].cauHoi, luanGiai: '', viSao: '', goiY: '', doRo: 'Gợi ý', danY: [],
          duKien: [], nguon: [], loiBanDau: [], soLanGoi: 0, token: { vao: 0, ra: 0, dem: 0 }, model: '', ms: 0, msTruyHoi: 0, dat: false,
          loiConLai: [{ ma: 'loi-goi', moTa: (e as Error).message.slice(0, 200), chan: true }],
        };
      }
      vao.khiXong?.(ra[j]);
    }
  };
  await Promise.all(Array.from({ length: vao.songSong ?? 4 }, tho));
  return ra;
}

export { CAU_HOI_V3 };
