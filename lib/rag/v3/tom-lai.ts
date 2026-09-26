import { goiVoiFallback } from '@/lib/ai/fallback';
import { docObjectJson } from '../doc-json';
import { nhanDangThucThe } from '../thuc-the';
import { CHU_DE_V3 } from './khung';
import { GIONG_VAN } from './prompt-v3';

/**
 * "TÓM LẠI" CUỐI MỖI CHỦ ĐỀ CHUYÊN SÂU (25/09/2026).
 *
 * Review của chủ dự án: tám câu trả lời đọc như tám mảnh rời — "đừng biến 8 câu
 * hỏi thành 8 phiên bản của cùng một kết luận; hãy biến chúng thành 8 lát cắt,
 * rồi cuối cùng ghép lại thành một chân dung duy nhất". Phần này làm việc ghép:
 * một đoạn 120–180 chữ theo đúng MẠCH của chủ đề, chỉ dùng những gì các câu đã
 * nói (không thêm nhận định mới, nên không cần truy hồi hay dữ kiện).
 *
 * Rẻ: một lượt gọi ngắn cho mỗi chủ đề, đầu vào là các bài đã viết; đệm lại cùng
 * lá số + năm + nhóm như các câu.
 */

const MACH: Record<string, string> = {
  'tinh-cach': 'bạn là kiểu người nào → điểm mạnh nhất → điều dễ khiến bạn trả giá → khi trưởng thành thay đổi ra sao → cuối cùng thường trở thành người thế nào',
  'su-nghiep': 'bạn tạo giá trị bằng gì → hợp đứng ở vị trí nào → đường đi lên thường ra sao → dễ mắc ở đâu → đỉnh của cái gì, khi nào → hiện tại đang ở chặng nào',
  'tien-bac': 'tiền đến bằng cách nào → có giữ được không → rủi ro hao tài lớn nhất ở đâu → khi nào bắt đầu tích được tài sản → hậu vận tài chính',
  'tinh-duyen': 'bạn yêu thế nào → dễ gặp và hợp với ai → người đi cùng lâu dài thường thế nào → khi nào duyên mạnh → thử thách lớn nhất → hôn nhân ảnh hưởng đời bạn ra sao',
  'suc-khoe': 'thể trạng chung → vùng cần lưu ý nhất → vấn đề thường theo kiểu nào (âm ỉ, tái phát hay đột ngột) → giai đoạn cần chú ý hơn',
  'nha-cua': 'duyên nhà cửa → nhà đến từ đâu → an cư sớm hay muộn → giai đoạn dễ có chuyện lớn về nhà đất',
  'van-han': 'kiểu cuộc đời theo thời gian → chặng hiện tại mang chủ đề gì → năm nay và vài năm tới đang dẫn tới đâu',
};
const MACH_CHUNG = 'bức tranh chung → điểm thuận → điểm dễ vướng → diễn biến theo thời gian → điều đáng nhớ nhất';
const NGAN = new Set(['con-cai', 'anh-em', 'gia-dinh']);

export async function viTomLai(vao: {
  chuDe: string;
  cau: { cauHoi: string; luanGiai: string }[];
}): Promise<{ tomLai: string; model: string } | null> {
  const ten = CHU_DE_V3.find((c) => c.id === vao.chuDe)?.ten ?? vao.chuDe;
  // Mục tiêu thấp hơn trần hiển thị: model viết dài hơn mức được bảo (đo 25/09: bảo 120–180 ra 228 từ)
  const [it, nhieu] = NGAN.has(vao.chuDe) ? [70, 110] : [100, 150];
  const system = `Bạn là Celes, người luận giải Tử Vi của Celestia, đang ngồi nói với chính người đọc. Viết tiếng Việt, gọi người đọc là "bạn".

Việc: viết phần "TÓM LẠI" cho chủ đề "${ten}" — ghép các câu trả lời bên dưới thành một đoạn nói liền mạch, không phải tóm tắt từng câu.
Mạch nên đi: ${MACH[vao.chuDe] ?? MACH_CHUNG}.

LUẬT:
- ${it}–${nhieu} từ, 1–2 đoạn văn liền, không gạch đầu dòng, không đánh số, không tiêu đề.
- Chỉ dùng những gì các câu trả lời đã nói — không thêm nhận định, mốc tuổi hay sự kiện mới.
- Không liệt kê lại từng câu theo thứ tự; nối chúng bằng quan hệ nhân quả ("vì… nên…", "chính điều đó…").
- KHÔNG nêu tên sao, tên cung, thuật ngữ tử vi. Không lời khuyên, không đặt hạn, không "bạn nên".
- Câu cuối nói điều quan trọng nhất về chủ đề này với riêng người đọc, bằng lời thường — không đúc kết đạo lý.

${GIONG_VAN}

Chỉ trả JSON: {"tomLai": "…"}`;
  const user = vao.cau.map((c, i) => `CÂU ${i + 1}: ${c.cauHoi}\n${c.luanGiai}`).join('\n\n');

  for (let lan = 0; lan < 2; lan++) {
    const kq = await goiVoiFallback({ system, user, maxTokens: 1200, temperature: 0.4 }, undefined, 40_000);
    const o = docObjectJson(kq.text) as { tomLai?: unknown } | null;
    const tomLai = typeof o?.tomLai === 'string' ? o.tomLai.replace(/\r/g, '').trim() : '';
    if (!tomLai) continue;
    // Tên sao lọt vào thì thử lại một lần (không xét tên cung: "Mệnh" trùng chữ thường "bản mệnh") — phần này đọc như lời kết, không phải bảng căn cứ
    const loThuatNgu = nhanDangThucThe(tomLai).some((t) => t.loai === 'STAR');
    if (loThuatNgu && lan === 0) continue;
    // Quá dài thì viết lại một lần — phần này là lời kết, không phải một bài thứ chín
    if (tomLai.split(/\s+/).length > nhieu + 40 && lan === 0) continue;
    return { tomLai, model: `${kq.provider}/${kq.model}` };
  }
  return null;
}
