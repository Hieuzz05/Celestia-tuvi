import Link from 'next/link';
import { themVe } from '@/components/QuayLai';

/**
 * "MUỐN ĐI SÂU HƠN?" (26/09/2026) — những câu tò mò kiểu người xem Tử Vi hay hỏi,
 * dẫn sang Hỏi Celes với câu hỏi điền sẵn. Tĩnh, không tốn lượt gọi; `ve` đưa người
 * đọc về đúng chủ đề đang đọc.
 */
const TO_MO: Record<string, string[]> = {
  'tinh-cach': ['Điều gì khiến tôi dễ mất bình tĩnh nhất?', 'Tôi hợp sống ở môi trường như thế nào để là chính mình?', 'Người thân nhất có thật sự hiểu tôi không?'],
  'su-nghiep': ['Tôi có nên nhảy việc trong một, hai năm tới không?', 'Bao giờ tôi dễ được giao quyền lớn hơn?', 'Tôi có hợp tự kinh doanh sau này không?'],
  'tien-bac': ['Tôi có số giàu không?', 'Có dễ mất một khoản tiền lớn không?', 'Bao giờ tài chính của tôi bật mạnh nhất?', 'Tôi có nhờ được bạn đời về tiền bạc không?'],
  'tinh-duyen': ['Người tôi đang quen có hợp để đi lâu dài không?', 'Năm nào tôi dễ gặp người quan trọng?', 'Hôn nhân của tôi có dễ gặp người thứ ba không?'],
  'con-cai': ['Con tôi có hợp với tôi không?', 'Giai đoạn nào thuận để có con?', 'Con tôi hợp học theo hướng nào?'],
  'gia-dinh': ['Tôi có được nhờ cha mẹ không?', 'Về sau trách nhiệm với cha mẹ có nặng không?', 'Tôi nên sống gần hay xa gia đình?'],
  'suc-khoe': ['Năm nay sức khỏe tôi cần chú ý gì?', 'Giai đoạn nào tôi dễ mệt nhất?', 'Tôi có dễ gặp tai nạn khi đi lại không?'],
  'ra-ngoai': ['Tôi có nên đi nước ngoài làm việc không?', 'Đi xa có làm tôi khá lên không?', 'Tôi có định cư ở nơi khác không?'],
  'van-han': ['Năm nay việc lớn nhất của tôi là gì?', 'Ba năm tới tôi nên chuẩn bị gì?', 'Tháng nào trong năm cần cẩn thận nhất?'],
};

export function DiSauHon({ chuDe, ve }: { chuDe: string; ve: string }) {
  const ds = TO_MO[chuDe];
  if (!ds?.length) return null;
  return (
    <section className="flex flex-col gap-[12px]" aria-labelledby="di-sau-hon">
      <h2 id="di-sau-hon" className="text-[17px] font-semibold" style={{ color: 'var(--fg)' }}>
        Muốn đi sâu hơn?
      </h2>
      <ul className="flex flex-wrap gap-[8px]">
        {ds.map((cau) => (
          <li key={cau}>
            <Link
              href={themVe(`/hoi-dap?q=${encodeURIComponent(cau)}`, ve)}
              className="inline-flex min-h-[44px] items-center rounded-full border px-[16px] text-[14px] transition-colors hover:border-[var(--accent)]"
              style={{ borderColor: 'var(--line)', color: 'var(--fg)' }}
            >
              {cau}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
