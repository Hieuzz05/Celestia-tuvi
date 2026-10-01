import { goiVoiFallback } from '@/lib/ai/fallback';
import type { LaSo } from '@/lib/tuvi/ansao';
import { docObjectJson } from '../doc-json';
import { CAU_HOI_V3, CHU_DE_V3, PHIEN_BAN_KHUNG_V3, type CauHoiV3 } from './khung';
import { dungDuKien, hoiThoiDiem, PHIEN_BAN_DU_KIEN_V3, saoDuocPhep, type DuKienV3 } from './du-kien';
import { donTatDinh, kiemBai, type BaiV3, type LoiV3 } from './kiem-v3';
import { khoiDoDai, PHIEN_BAN_PROMPT_V3 } from './prompt-v3';
import { PHIEN_BAN_TRUY_HOI_V3, truyHoiChoCau, type BoNhoTruyHoi, type DoanV3 } from './truy-hoi-v3';
import { khoiDaNoi, kiemLapCum, kiemLapPhanKhac, type MucDaNoi } from './so-y';
import { NHAN_TIN_CAY } from '../uu-tien-nguon';
import { docMetaTaiLieu } from '../tai-lieu-meta';
import { dungKhoiThuVien } from '../thu-vien/cho-prompt';
import { saoCuaMuc, type MucThuVien } from '../thu-vien/kieu';
import { apCauSua, chonCauLoi, nhacSuaCucBo, suaCucBoDuoc } from './sua-cuc-bo';
import { heThongV3 } from './mau-giong';
import { docCauHinhV3 } from './cau-hinh';

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
  /** Thư viện: mục đã đưa vào prompt (T###) và mọi mục khớp — để đo lát cắt (mục 11.2) */
  thuVien?: { daChon: { ma: string; id: string; cung: string; sao: string[] }[]; khopHet: { id: string; sao: string[] }[]; nguocChieu: [string, string][] };
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
          ...(y.ghep === true && Array.isArray(y.sao) ? { sao: (y.sao as unknown[]).filter((x): x is string => typeof x === 'string') } : {}),
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
  TQ01: 'tinh-cach', TQ12: 'gia-dinh', TQ05: 'su-nghiep', TQ06: 'tien-bac', TQ07: 'tinh-duyen', TQ08: 'van-han', TQ09: 'van-han', TQ10: 'van-han',
};

/*
 * GIAO Ý (01/10/2026): đo lá số B (do-chat-luong-v3, bản gốc) — "quyết đoán, hợp được giao quyền" lặp ở 4 câu,
 * "người đi trước nâng đỡ" ở 5 câu, dù sổ ý đã đưa ba câu lượt đầu cho lượt sau. Chín câu lượt 2 sinh song song
 * nên không thấy nhau; mỗi ý chung giao cho MỘT câu chủ, các câu khác chỉ được gợi nửa câu.
 */
const Y_DA_CO_CHU =
  'Ý đã có câu riêng, ở đây chỉ được gợi nhiều nhất nửa câu: tính cách chung (câu "Tôi là người như thế nào?"), điểm mạnh và điều cần lưu ý chung (hai câu đầu trang), người đi trước / quý nhân nâng đỡ nói chung (câu về những người quanh mình) — sự nâng đỡ riêng của một năm hay một giai đoạn thì vẫn nói được.';

/**
 * PHẠM VI của từng câu tổng quan. Mười một câu hiện trên một màn hình nhưng
 * sinh song song, nên không câu nào biết câu kia nói gì. Đo ở lượt 2: năm câu
 * cùng kết bằng "đừng làm một mình", vì cách cục Tả Hữu có mặt trong dữ kiện
 * của cả năm. Chia phạm vi bằng mã rẻ hơn gộp mười một câu vào một lượt gọi.
 */
const PHAM_VI_TONG_QUAN: Record<string, string> = {
  TQ01: 'Chỉ nói con người: tính khí, cách ứng xử, mặt trong và mặt ngoài. Không bàn nghề, tiền, tình duyên, quý nhân. Ví dụ lấy từ đời sống rộng (gia đình, bạn bè, tình cảm, lúc một mình) — công việc tối đa một ví dụ phụ, không mô tả bằng phong cách làm việc.',
  TQ02: 'Chỉ MỘT điểm mạnh lớn nhất, nó hiện ra thế nào trong đời, và điều kiện để nó phát huy. Không kể thêm điểm yếu. Ví dụ lấy từ đời sống rộng (gia đình, bạn bè, tình cảm, lúc một mình) — công việc tối đa một ví dụ phụ, không mô tả bằng phong cách làm việc.',
  TQ03: 'Chỉ MỘT điều cần lưu ý nhất (kiểu sai lặp lại hoặc mặt đời yếu nhất) và dấu hiệu nhận ra. Không nhắc lại điểm mạnh. Ví dụ lấy từ đời sống rộng (gia đình, bạn bè, tình cảm, lúc một mình) — công việc tối đa một ví dụ phụ, không mô tả bằng phong cách làm việc.',
  // Bản đồ mạnh – yếu trên trang đã liệt kê đủ ba nhóm; bài kể lại danh sách thì hết chữ cho phần "vì sao" (giám khảo 3/5, 25/09/2026)
  TQ04: 'Bản đồ trên trang đã liệt kê đủ ba nhóm Thuận lợi / Ổn định / Cần chăm chút — không kể lại đủ mười hai mặt. Mở bằng tên hai mặt mạnh nhất và hai mặt cần chăm chút nhất (để đoạn văn tự đứng được khi đọc riêng), rồi nói vì sao hai mặt mạnh nhất lại mạnh và hai mặt cần chăm chút nhất cần chăm (bằng phần đời, dựa dữ kiện "vì sao"), hai đầu ấy hiện ra thế nào trong đời, rồi khép lại bằng chỗ mặt mạnh đỡ được mặt yếu (lời khuyên, nếu có, viết vào goiY).',
  TQ12: 'Chỉ nói bạn trong các mối quan hệ gần NGOÀI tình duyên: với cha mẹ / người đi trước, với anh chị em, với bạn bè và người cộng tác — cả người ngoài / người mới gặp — mỗi nhóm một câu riêng (HỌ là người thế nào với bạn, ai là chỗ dựa, vướng ở đâu). Câu này tả NGƯỜI QUANH bạn, không tả tính bạn: sao ở các cung này là nét của họ. Nhóm nào lá số không nổi bật thì nói ngắn là bình thường. Sao ở cung cha mẹ / anh chị em tả CHÍNH những người ấy (cha mẹ ra sao, anh chị em ra sao), không phải tính của bạn. Một phụ tinh lẻ chỉ đủ cho "có thể", không đủ cho "thường" — áp cho cả ý chính và gợi ý. Nhóm nào (kể cả người ngoài) có Tuần, Triệt, Hóa Kỵ, chính tinh hãm hay Đại Hao, Tiểu Hao thì phải có một ý nói chỗ vướng của nhóm ấy, và chính tinh hãm không được tả như khi sáng. Không mặc định bạn có anh chị em ("nếu có anh chị em") hay đã gặp một người cụ thể. Không bàn bạn đời, nghề, tiền; không tả lại tính cách chung.',
  TQ05: `Chỉ nói hướng nghề: nhóm nghề cụ thể và vai trò hợp. Không bàn tiền, tình duyên. ${Y_DA_CO_CHU}`,
  TQ06: `Chỉ nói tiền bạc: kiếm dễ hay khó, giữ được không, nguồn chính. Không nêu mốc tuổi hay năm. ${Y_DA_CO_CHU}`,
  TQ07: `Chỉ nói tình duyên: kiểu duyên, sớm hay muộn, người hợp. ${Y_DA_CO_CHU}`,
  TQ08: 'Chỉ nói giai đoạn 10 năm đang chạy: tên gọi giai đoạn, chủ đề chính, một lưu ý.',
  TQ09: `Chỉ nói năm xem: chủ đề năm, cơ hội và rủi ro nổi nhất, dựa trên vận năm trong dữ kiện; việc nên làm và nên tránh viết vào goiY. ${Y_DA_CO_CHU}`,
  TQ10: `Kể đường đời theo BA chặng lớn — tiền vận, trung vận, hậu vận — mỗi chặng một hai câu về xu hướng chung và điều đổi khác giữa các chặng. KHÔNG liệt kê từng giai đoạn 10 năm (phần đó thuộc Vận hạn chuyên sâu). ${Y_DA_CO_CHU}`,
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
// Cập nhật 30/09/2026 theo khung tinh gọn (khung 2026.09.5)
const CAU_GIU_MOC: Record<string, string> = {
  'tinh-cach': 'TC01', 'su-nghiep': 'SN03', 'tien-bac': 'TB03', 'tinh-duyen': 'TD02', 'con-cai': 'CC01',
  'gia-dinh': 'GD03', 'suc-khoe': 'SK02', 'ra-ngoai': 'RN01', 'van-han': 'VH01',
};

/**
 * Câu hỏi THẲNG về thời điểm ("Khi nào…", "năm nào", "sớm hay muộn"). Chạy thử 30/09/2026 lá
 * Hiếu: TD02 "Khi nào tôi dễ kết hôn?" mở bằng hai câu tả tính chất duyên, mốc nằm tận đoạn hai.
 */
const HOI_KHI_NAO = /khi nào|năm nào|sớm hay muộn/i;
const MO_BANG_MOC =
  'Câu hỏi hỏi THỜI ĐIỂM: câu đầu tiên phải nêu luôn mốc trả lời (khoảng tuổi hoặc giai đoạn đại vận, như một xu hướng) — không mở bằng câu tả tính chất rồi mới tới mốc.';

const MOC_PHU =
  'Mốc thời gian ở câu này chỉ là phần PHỤ: nêu tối đa một mốc khi dữ kiện vận chỉ rõ, trọng tâm vẫn là bản chất câu hỏi.';

function luatMoc(q: CauHoiV3): string {
  if (!hoiThoiDiem(q)) return '';
  // câu giữ dòng thời gian của chủ đề (CAU_GIU_MOC) thì không bị giới hạn một mốc
  const moDau = q.thoiDiem === 'phu' ? (CAU_GIU_MOC[q.chuDe] === q.id ? '' : MOC_PHU) : HOI_KHI_NAO.test(q.cauHoi) ? MO_BANG_MOC : '';
  const than = luatMocThan(q);
  return [moDau, than].filter(Boolean).join(' ');
}

function luatMocThan(q: CauHoiV3): string {
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
  'su-nghiep': 'Nói về CÔNG DANH: nghề, cách làm, đường lên, người nâng và điều cản trong công việc, học hành bằng cấp như một phần của con đường ấy. Không tả lại tính cách chung.',
  'tien-bac': 'Nói về chuyện TIỀN và TÀI SẢN: kiếm, giữ, tiêu, hao, tích sản, nhà cửa. Công việc chỉ xuất hiện như một nguồn tiền; không phân tích phong cách làm việc hay tính cách chung.',
  'tinh-duyen': 'Nói về đời sống TÌNH CẢM và chuyện gắn bó lâu dài: cách yêu, người đi cùng, những gì xảy ra giữa hai người. Không mặc định người đọc đã hay sẽ kết hôn. Công việc chỉ nhắc khi câu hỏi hỏi về ảnh hưởng qua lại.',
  'con-cai': 'Nói về CON CÁI và quan hệ cha mẹ – con; không tả lại tính cách chung của người đọc.',
  'gia-dinh': 'Nói về GIA ĐÌNH GỐC: cha mẹ, anh chị em, nền phúc dòng họ và hậu vận; không tả lại tính cách chung hay chuyện công việc của người đọc.',
  'suc-khoe': 'Nói về THỂ TRẠNG và các vùng sức khỏe; không kéo sang tính cách hay công việc, trừ khi đó là nguyên nhân trực tiếp của một rủi ro vừa luận.',
  'ra-ngoai': 'Nói về chuyện ĐI XA, ra ngoài xã hội và sống ở nơi khác; công việc chỉ nhắc như một lý do đi.',
  'van-han': 'Nói về NHỊP ĐỜI theo thời gian: chặng nào mở, chặng nào chững, năm nào đổi. Mỗi mốc chỉ gọi tên mặt đời nổi nhất ở mốc ấy — không tả lại tính cách, không luận lại từng chủ đề.',
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
  // 30/09/2026: khung 2026.09.5 không còn câu nào có chữ "đầu tư" nên câu an toàn không bao giờ gắn —
  // nay xét theo chủ đề tiền bạc + bài có nói tới đầu tư / vay / chứng khoán
  const veTien = q.chuDe === 'tien-bac' || q.id === 'TQ06';
  const noiDauTu = /đầu tư|vay |vay\.|cho vay|cổ phiếu|chứng khoán|tiền số|tiền ảo|lướt sóng|đòn bẩy/.test(s);
  if (veTien && noiDauTu && !s.includes('tư vấn tài chính')) luan = `${luan.trim()} ${AN_TOAN_TAI_CHINH}`;
  return { ...bai, luanGiai: luan };
}

export interface ChuanBiCau {
  duKien: DuKienV3[];
  tv: ReturnType<typeof dungKhoiThuVien> | null;
  nguon: DoanV3[];
  msTruyHoi: number;
  /** Cung chính để đánh dấu nguồn khớp: cung chính của chủ đề (chuyên sâu) hoặc cung đầu danh sách câu */
  cungChinhCau?: string;
}

/** Dữ kiện + thư viện + truy hồi của một câu — phần không gọi model viết */
export async function chuanBiCau(vao: { laSo: LaSo; q: CauHoiV3; namXem: number; nho: BoNhoTruyHoi; thuVien?: MucThuVien[] }): Promise<ChuanBiCau> {
  const { q } = vao;
  const duKien = dungDuKien(vao.laSo, q, vao.namXem);
  const cungChuDe = q.loai === 'chuyen-sau' ? (q.cungChinh ?? CHU_DE_V3.find((c) => c.id === q.chuDe)?.cungChinh) : undefined;
  const tv = vao.thuVien?.length
    ? dungKhoiThuVien({ laSo: vao.laSo, duKien, thuVien: vao.thuVien, cungChinh: cungChuDe, meta: await docMetaTaiLieu() })
    : null;
  const tRag = Date.now();
  const nguon = await truyHoiChoCau({
    chuDe: q.chuDe,
    chuDeTuKhoa: q.tuKhoa ?? TU_KHOA_TONG_QUAN[q.id],
    cungUuTien: cungChuDe,
    cauHoi: q.cauHoi,
    duKien,
    nho: vao.nho,
    // Thư viện đã khớp đủ thì bớt đoạn sách thô — giữ độ dài prompt (mục 8.7)
    soDoan: tv && tv.daChon.length >= 6 ? 4 : undefined,
  });
  const cungChinhCau =
    cungChuDe ??
    duKien.find((d) => d.vaiTro === 'cung chính' || d.vaiTro.endsWith('(chính)'))?.cung;
  return { duKien, tv, nguon, msTruyHoi: Date.now() - tRag, cungChinhCau };
}

/*
 * CHIA NGUỒN GIỮA CÁC CÂU CÙNG NHÓM (30/09/2026). Các câu của một chủ đề đọc chung cung chính nên
 * truy hồi trả về gần cùng một bộ đoạn sách; mỗi câu lại "dùng nguồn" (DUNG_NGUON) nên cùng một câu
 * sách thành cùng một nhận định ở ba, bốn câu. Chia tất định: đoạn trùng thuộc về câu mà nó KHỚP CUNG
 * CHÍNH, không thì câu xếp nó cao nhất, hoà thì câu đứng trước. Câu khác bỏ đoạn ấy, miễn còn đủ
 * TOI_THIEU_NGUON đoạn — thiếu nguồn còn tệ hơn lặp.
 */
const TOI_THIEU_NGUON = 4;

export function chiaNguon(ds: { q: CauHoiV3; cb: ChuanBiCau }[]): void {
  const chu = new Map<string, number>();
  const hang = (j: number, chunkId: string) => ds[j].cb.nguon.findIndex((n) => n.chunkId === chunkId);
  const khopChinh = (j: number, chunkId: string) => {
    const n = ds[j].cb.nguon.find((x) => x.chunkId === chunkId);
    return Boolean(n?.khopCung && n.khopCung === ds[j].cb.cungChinhCau);
  };
  ds.forEach((x, j) => {
    for (const n of x.cb.nguon) {
      const cu = chu.get(n.chunkId);
      if (cu === undefined) { chu.set(n.chunkId, j); continue; }
      const hon = (khopChinh(j, n.chunkId) && !khopChinh(cu, n.chunkId)) ||
        (khopChinh(j, n.chunkId) === khopChinh(cu, n.chunkId) && hang(j, n.chunkId) < hang(cu, n.chunkId));
      if (hon) chu.set(n.chunkId, j);
    }
  });
  ds.forEach((x, j) => {
    const giu = x.cb.nguon.filter((n) => chu.get(n.chunkId) === j || khopChinh(j, n.chunkId));
    const bo = x.cb.nguon.filter((n) => !giu.includes(n));
    // Bỏ từ đoạn xếp thấp nhất lên, dừng khi chạm mức tối thiểu
    const conLai = [...x.cb.nguon];
    for (const n of [...bo].reverse()) {
      if (conLai.length <= TOI_THIEU_NGUON) break;
      conLai.splice(conLai.indexOf(n), 1);
    }
    x.cb.nguon = conLai;
  });
}

/*
 * CUNG "NỀN" (30/09/2026): trong một chủ đề, mỗi cung có một câu CHỦ — câu liệt kê cung ấy sớm nhất
 * (vị trí thấp nhất trong danh sách cung, hoà thì câu đứng trước). Các câu khác vẫn nhận dữ kiện cung
 * đó, nhưng nhãn ghi "nền" để model không luận lại điều câu chủ đã luận.
 */
function cungNen(q: CauHoiV3): Set<string> {
  if (q.loai !== 'chuyen-sau') return new Set();
  const cd = CHU_DE_V3.find((c) => c.id === q.chuDe);
  const cungCua = (x: CauHoiV3) => (x.cung.length ? x.cung : [x.cungChinh ?? cd?.cungChinh ?? '']);
  const anhEm = CAU_HOI_V3.filter((x) => x.loai === 'chuyen-sau' && x.chuDe === q.chuDe);
  const nen = new Set<string>();
  cungCua(q).forEach((cung, viTri) => {
    if (viTri === 0) return; // cung đầu danh sách của chính câu này luôn là của nó
    const chu = anhEm
      .map((x, thuTu) => ({ x, viTri: cungCua(x).indexOf(cung), thuTu }))
      .filter((o) => o.viTri >= 0)
      .sort((a, b) => a.viTri - b.viTri || a.thuTu - b.thuTu)[0];
    if (chu && chu.x.id !== q.id) nen.add(cung);
  });
  return nen;
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
  /** Thư viện tri thức (KIEN-TRUC-LUAN-GIAI.md mục 8) — chỉ truyền cho câu thuộc lát cắt đã bật */
  thuVien?: MucThuVien[];
  /** Dữ kiện + nguồn đã chuẩn bị sẵn (luanNhieuCau chia nguồn giữa các câu trước khi viết) */
  chuanBi?: ChuanBiCau;
  /** Khối bối cảnh người đọc (boi-canh-doc.ts) — rỗng khi không có */
  boiCanh?: string;
}): Promise<KetQuaCauV3> {
  const t0 = Date.now();
  const { q } = vao;
  const { duKien, tv, nguon, msTruyHoi, cungChinhCau } = vao.chuanBi ?? (await chuanBiCau(vao));
  const phep = saoDuocPhep(duKien);
  const nen = cungNen(q);
  const cauHinh = await docCauHinhV3();
  const doDai = cauHinh.doDai[q.loai];

  /*
   * THỨ TỰ = TIỀN TỐ ĐỆM (26/09/2026): mọi khối CỐ ĐỊNH theo câu hỏi đứng liền sau phần luật, trước
   * mọi thứ đổi theo lá số (sổ ý, dữ kiện, nguồn). Nhà cung cấp đệm theo tiền tố giống nhau, nên
   * cùng một câu hỏi trên mọi lá số dùng chung ~5,8 nghìn token đầu (luật + khối câu hỏi) ở giá đệm.
   * Bản trước để sổ ý chen giữa, cắt tiền tố ngay trước "YẾU TỐ NÊN XÉT". Nội dung không đổi.
   */
  const user = [
    khoiDoDai(q.loai, doDai),
    `CÂU HỎI CỦA NGƯỜI ĐỌC: ${q.cauHoi}`,
    `NGƯỜI ĐỌC CẦN NHẬN ĐƯỢC: ${q.nhanDuoc}`,
    PHAM_VI_TONG_QUAN[q.id]
      ? `PHẠM VI CÂU NÀY: ${PHAM_VI_TONG_QUAN[q.id]}`
      : q.loai === 'chuyen-sau'
        ? `PHẠM VI CÂU NÀY:
${phamViChuyenSau(q)}`
        : '',
    q.yeuToThem ? `YẾU TỐ NÊN XÉT: ${q.yeuToThem}` : '',
    q.chiTiet
      ? `CHI TIẾT CỤ THỂ — CÓ NGUỒN THÌ NÓI: ${q.chiTiet}. Chỉ nêu khi một đoạn NGUỒN THAM CHIẾU nói rõ chi tiết ấy cho đúng tổ hợp khớp DỮ KIỆN LÁ SỐ, và ghi mã E của đoạn đó ở ý tương ứng trong dàn ý. Không có đoạn như vậy thì bỏ chi tiết ấy — không bịa, không đoán cho đủ.`
      : '',
    q.khongDuoc ? `KHÔNG ĐƯỢC: ${q.khongDuoc}` : '',
    vao.thuNghiem?.themVao?.(vao.laSo, q) ?? '',
    // Đổi theo người đọc nên đứng SAU mọi khối cố định theo câu hỏi (giữ tiền tố đệm của nhà cung cấp)
    vao.boiCanh ?? '',
    khoiDaNoi(q, vao.daNoi ?? []),
    `DỮ KIỆN LÁ SỐ (engine tính, không được sửa hay thêm):\n${duKien
      .map((d) => `${d.id} [${d.vaiTro}${d.cung && nen.has(d.cung) ? ' — NỀN: câu khác của chủ đề đi sâu cung này, ở đây chỉ dùng để đỡ ý' : ''}] ${d.noiDung}`)
      .join('\n')}`,
    tv?.khoi ?? '',
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
  const maNguon = new Set([...nguon.map((n) => n.id), ...(tv?.daChon.map((t) => t.ma) ?? [])]);
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
      ? [{ ma: 'ten-sach', moTa: `Nêu tên sách (${lo.join(', ')}) — bỏ tên sách, nói "sách xưa" hoặc chỉ nói điều sách nói.`, chan: true, cum: lo }]
      : [];
  };
  // Giọng giao việc có hạn — chủ dự án bỏ 25/09/2026 ("gây cảm giác ép buộc")
  const RE_GIAO_VIEC = /(trong|ngay|ngay trong) (tuần|tháng) (tới|này|sau)|tuần tới|ngay hôm nay|trong \d+ ngày tới/gi;
  const kiemGiaoViec = (b: BaiV3) => {
    const cum = [...new Set([...`${b.luanGiai} ${b.goiY ?? ''}`.matchAll(RE_GIAO_VIEC)].map((m) => m[0]))];
    return cum.length
      ? [{ ma: 'giao-viec', moTa: 'Lời khuyên đặt hạn kiểu "trong tuần tới / ngay hôm nay" — viết lại thành gợi ý ("bạn có thể…", "nên cân nhắc…"), không đặt hạn.', chan: true, cum }]
      : [];
  };
  // Tên luật lọt vào bài ("Câu 'đúng quá' là…", "Cảm giác rất đúng với bạn là:") — model chép nhãn của yêu cầu (đo 25/09/2026)
  const kiemNhanLuat = (b: BaiV3) => {
    const cum = [...new Set([...b.luanGiai.matchAll(/đúng quá|rất đúng với bạn|cảm giác rất đúng|lát cắt|khoảnh khắc|dữ kiện|tín hiệu (bất lợi|phụ trợ|chiếu)/gi)].map((m) => m[0]))];
    return cum.length
      ? [{ ma: 'nhan-luat', moTa: 'Bài dùng chữ nội bộ ("dữ kiện", "tín hiệu phụ trợ", "đúng quá", "lát cắt") — nói bằng lời người xem lá số: "lá số của bạn", "phần sức khỏe của bạn", hoặc nói thẳng điều đó.', chan: true, cum }]
      : [];
  };
  /*
   * MỨC TIN CẬY (26/09/2026): đoạn "bổ trợ" chỉ làm dày ngữ cảnh — một ý mà căn
   * cứ duy nhất là đoạn bổ trợ thì chưa đủ đứng thành nhận định.
   */
  const hoTro = new Set([
    ...nguon.filter((n) => n.mucTinCay === 'ho-tro').map((n) => n.id),
    ...(tv?.daChon.filter((t) => t.mucTinCay === 'ho-tro').map((t) => t.ma) ?? []),
  ]);
  const kiemHoTro = (b: BaiV3) => {
    const chiHoTro = b.danY.filter((y) => y.canCu.length && y.canCu.every((m) => hoTro.has(m)));
    return chiHoTro.length
      ? [{ ma: 'chi-bo-tro', moTa: `Ý "${chiHoTro[0].y}" chỉ dựa vào đoạn [tin cậy: bổ trợ] — thêm căn cứ từ dữ kiện lá số (F###) hoặc một đoạn nguồn khác, hoặc bỏ ý đó.`, chan: true }]
      : [];
  };
  // Luật ngầm lộ ra bài — chủ dự án 26/09/2026: nguồn chuyên gia Celes không ghi trên lá số
  const coLuatNgam = nguon.some((n) => n.an) || Boolean(tv?.daChon.some((t) => t.an));
  const kiemLuatNgam = (b: BaiV3) => {
    if (!coLuatNgam) return [];
    // Chỉ bắt kiểu viện dẫn ("theo chuyên gia", "ghi chú của…") — "làm chuyên gia" là lời thường ở câu nghề nghiệp
    const cum = [...new Set([...`${b.luanGiai} ${b.viSao} ${b.goiY ?? ''}`.matchAll(/(theo|của|ghi chú|nhận định|góc nhìn|kinh nghiệm)( của)?( các| một| giới)? chuyên gia|luật ngầm|luật nội bộ|tài liệu nội bộ/gi)].map((m) => m[0]))];
    return cum.length
      ? [{ ma: 'lo-luat-ngam', moTa: 'Bài nhắc tới "chuyên gia" / "ghi chú" / "nội bộ" — đoạn LUẬT NGẦM chỉ để định hướng, không được gọi tên hay nhắc tới. Nói thẳng nhận định như điều lá số cho thấy.', chan: true, cum }]
      : [];
  };
  // Năm được phép nêu: năm xem + mọi năm có trong dữ kiện và nguồn của câu này (kiem-v3 chặn năm ngoài tập)
  const namDuocNeu = new Set([
    String(vao.namXem),
    ...[...`${duKien.map((d) => d.noiDung).join(' ')} ${nguon.map((n) => n.noiDung).join(' ')} ${tv?.khoi ?? ''}`.matchAll(/\b(?:19|20)\d{2}\b/g)].map((m) => m[0]),
  ]);
  const kiem = (b: BaiV3) => [
    ...kiemBai({ bai: b, loai: q.loai, maDuKien, maNguon, saoDuocPhep: phep, hoiThoiDiem: hoiThoiDiem(q), heSoDoDai: vao.thuNghiem?.heSoDoDai, namDuocNeu, doDai, tranGoiY: cauHinh.tranGoiY }),
    ...kiemLapPhanKhac(b.luanGiai, vao.daNoi ?? [], q.id),
    ...kiemLapCum(b.luanGiai, vao.daNoi ?? [], q.loai === 'chuyen-sau' ? q.chuDe : 'tong-quan'),
    ...kiemTenSach(b),
    ...kiemGiaoViec(b),
    ...kiemNhanLuat(b),
    ...kiemHoTro(b),
    ...kiemLuatNgam(b),
  ];

  // System v3 kèm mẫu giọng chủ dự án sửa tay (Supabase) — giống nhau mọi lượt nên vẫn được đệm
  const system = vao.thuNghiem?.system ?? (await heThongV3());
  let soLanGoi = 0;
  let model = '';
  const token = { vao: 0, ra: 0, dem: 0 };
  const goi = async (u: string) => {
    soLanGoi += 1;
    const trongHan = Math.max(16_000, Math.min(vao.nganSachMs ?? 55_000, (vao.hanChot ?? Infinity) - Date.now()));
    const kq = await goiVoiFallback({ system, user: u, maxTokens: 6000, cacheKey: `v3:${q.id}` }, undefined, trongHan);
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
  /*
   * SỬA CỤC BỘ trước (sua-cuc-bo.ts): mọi lỗi chặn khoanh được vào câu thì chỉ gửi các câu ấy —
   * ~100 token ra thay vì ~1.100. Không sửa được / còn lỗi chặn thì đi tiếp đường sửa cả bài.
   */
  const cauLoi = suaCucBoDuoc(loi) ? chonCauLoi(bai, loi) : null;
  if (cauLoi && conLai > 12_000) {
    soLanGoi += 1;
    try {
      const trongHan = Math.max(12_000, Math.min(vao.nganSachMs ?? 55_000, (vao.hanChot ?? Infinity) - Date.now()));
      const kq = await goiVoiFallback(
        { system, user: `${user}\n\n${nhacSuaCucBo(cauLoi, loi)}`, maxTokens: 900, cacheKey: `v3:${q.id}` },
        undefined,
        trongHan
      );
      token.vao += kq.tokensIn ?? 0;
      token.ra += kq.tokensOut ?? 0;
      token.dem += kq.tokensDem ?? 0;
      const o = docObjectJson(kq.text) as { sua?: { id?: string; cau?: string }[] } | null;
      const sua = new Map((o?.sua ?? []).filter((x) => x.id && x.cau).map((x) => [x.id!, x.cau!]));
      if (sua.size) {
        const s = donTatDinh(apCauSua(bai, sua));
        const loiSau = kiem(s);
        if (loiSau.filter((l) => l.chan).length <= loi.filter((l) => l.chan).length) {
          bai = s;
          loi = loiSau;
        }
      }
    } catch {
      /* hỏng thì đi đường sửa cả bài bên dưới */
    }
  }
  if (loi.some((l) => l.chan) && (vao.hanChot ?? Infinity) - Date.now() > 20_000) {
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
    ...(tv
      ? {
          thuVien: {
            daChon: tv.daChon.map((t) => ({ ma: t.ma, id: t.khop.muc.id, cung: t.khop.cung, sao: saoCuaMuc(t.khop.muc) })),
            khopHet: tv.khopHet.map((k) => ({ id: k.muc.id, sao: saoCuaMuc(k.muc) })),
            nguocChieu: tv.nguocChieu,
          },
        }
      : {}),
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
  /** Thư viện tri thức + các câu được dùng nó (lát cắt đã bật) */
  thuVien?: { muc: MucThuVien[]; cau: Set<string> };
  /** Khối bối cảnh người đọc (boi-canh-doc.ts) — rỗng khi không có */
  boiCanh?: string;
}): Promise<KetQuaCauV3[]> {
  const nho: BoNhoTruyHoi = new Map();
  const ds = vao.ids.map((id) => CAU_HOI_V3.find((q) => q.id === id)).filter((q): q is CauHoiV3 => !!q);
  const ra: KetQuaCauV3[] = new Array(ds.length);
  const thuVienCua = (q: CauHoiV3) => (vao.thuVien?.cau.has(q.id) ? vao.thuVien.muc : undefined);
  // Chuẩn bị cả nhóm trước (không gọi model viết) để chia nguồn tất định; hỏng ở câu nào thì câu đó tự truy hồi lại
  const chuanBi: (ChuanBiCau | undefined)[] = await Promise.all(
    ds.map((q) => chuanBiCau({ laSo: vao.laSo, q, namXem: vao.namXem, nho, thuVien: thuVienCua(q) }).catch(() => undefined))
  );
  const du = ds.map((q, j) => ({ q, cb: chuanBi[j] })).filter((x): x is { q: CauHoiV3; cb: ChuanBiCau } => Boolean(x.cb));
  if (du.length > 1) chiaNguon(du);
  let i = 0;
  const tho = async () => {
    while (i < ds.length) {
      const j = i++;
      try {
        ra[j] = await luanMotCau({
          laSo: vao.laSo, q: ds[j], namXem: vao.namXem, nho, hanChot: vao.hanChot, thuNghiem: vao.thuNghiem, daNoi: vao.daNoi,
          thuVien: thuVienCua(ds[j]), chuanBi: chuanBi[j], boiCanh: vao.boiCanh,
        });
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
