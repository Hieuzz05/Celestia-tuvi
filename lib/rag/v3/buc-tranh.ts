import { goiVoiFallback } from '@/lib/ai/fallback';
import { docObjectJson } from '../doc-json';
import { nhanDangThucThe } from '../thuc-the';
import { CHU_DE_V3 } from './khung';
import { GIONG_VAN } from './prompt-v3';

/**
 * BỨC TRANH LỚN CỦA CUỘC ĐỜI (26/09/2026) — tầng cuối, sau khi người đọc đã
 * đọc đủ nhiều chủ đề (bản thiết kế của chủ dự án: "nơi Celes ghép 12 cung +
 * đại vận + lưu niên thành một narrative thống nhất").
 *
 * Đầu vào là phần TÓM LẠI của các chủ đề đã đọc + ý chính của phần tổng quan —
 * không đọc lại dữ kiện hay nguồn, nên rẻ (một lượt gọi) và không thêm được
 * nhận định nào các phần trước chưa nói.
 */
export const SO_CHU_DE_TOI_THIEU = 3;

export async function viBucTranh(vao: {
  tomLai: { chuDe: string; tomLai: string }[];
  tongQuan: { cauHoi: string; luanGiai: string }[];
}): Promise<{ bucTranh: string; model: string } | null> {
  const system = `Bạn là Celes, người luận giải Tử Vi của Celestia, đang ngồi nói với chính người đọc. Viết tiếng Việt, gọi người đọc là "bạn".

Việc: viết "BỨC TRANH LỚN CỦA CUỘC ĐỜI BẠN" — ghép các phần đã luận bên dưới thành một bài liền mạch, trả lời lần lượt sáu điều (không đánh số, không tiêu đề, viết thành văn liền):
1. Đây là kiểu cuộc đời nào (ổn định, nhiều chuyển động, muộn thành, tự thân, nhờ quan hệ…).
2. Lợi thế lớn nhất của người này.
3. Bài toán khó nhất cứ lặp lại trong đời.
4. Sự nghiệp – tiền – tình cảm nối với nhau thế nào.
5. Những bước ngoặt đáng chú ý theo thời gian.
6. Hiện tại người này đang đứng ở đâu.

LUẬT:
- 250–350 từ (tuyệt đối không quá 400), 3 đoạn văn liền — chọn lọc, không cố nói hết mọi chi tiết của các phần.
- Chỉ dùng những gì các phần bên dưới đã nói — không thêm nhận định, mốc tuổi, sự kiện mới.
- Nối bằng quan hệ nhân quả, không kể lại từng phần theo thứ tự.
- KHÔNG nêu tên sao, tên cung, thuật ngữ tử vi. Không lời khuyên, không "bạn nên".

${GIONG_VAN}

Chỉ trả JSON: {"bucTranh": "…"}`;
  const ten = (id: string) => CHU_DE_V3.find((c) => c.id === id)?.ten ?? id;
  const user = [
    'PHẦN TỔNG QUAN (ý chính):',
    ...vao.tongQuan.map((c) => `- ${c.cauHoi}: ${c.luanGiai}`),
    '',
    'TÓM LẠI CỦA CÁC CHỦ ĐỀ ĐÃ ĐỌC:',
    ...vao.tomLai.map((t) => `[${ten(t.chuDe)}] ${t.tomLai}`),
  ].join('\n');

  for (let lan = 0; lan < 2; lan++) {
    const kq = await goiVoiFallback({ system, user, maxTokens: 2200, temperature: 0.4 }, undefined, 45_000);
    const o = docObjectJson(kq.text) as { bucTranh?: unknown } | null;
    const bucTranh = typeof o?.bucTranh === 'string' ? o.bucTranh.replace(/\r/g, '').trim() : '';
    if (!bucTranh) continue;
    if (nhanDangThucThe(bucTranh).some((t) => t.loai === 'STAR') && lan === 0) continue;
    // Model viết dài hơn mức được bảo (đo 26/09: bảo 300–450 ra 622 từ) — quá 450 thì viết lại một lần
    if (bucTranh.split(/\s+/).length > 450 && lan === 0) continue;
    return { bucTranh, model: `${kq.provider}/${kq.model}` };
  }
  return null;
}
