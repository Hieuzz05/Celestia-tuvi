import Link from 'next/link';
import type { Metadata } from 'next';
import { DarkBand, Section, SectionHeader, Shell, The } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Câu chuyện Celestia',
  description:
    'Vì sao Celestia tồn tại, Celes là ai, và những gì Celes sẽ không bao giờ làm.',
};

/**
 * Câu chuyện thương hiệu.
 *
 * Tách khỏi trang "Cách hoạt động": trang kia trả lời "Celes dựa vào đâu", trang
 * này trả lời "vì sao có Celes". Gộp hai thứ vào một trang thì phần nào cũng bị
 * cắt ngắn và không thuyết phục được ai.
 */

const KHONG_LAM = [
  {
    ten: 'Không phán số phận',
    mo: 'Celes nói về xu hướng của một giai đoạn, không khẳng định điều gì chắc chắn sẽ xảy ra. Bạn vẫn là người quyết định.',
  },
  {
    ten: 'Không doạ để bán',
    mo: 'Không có "hạn nặng", không có "hoá giải gấp". Nếu một giai đoạn khó, Celes nói rõ khó ở chỗ nào và có thể làm gì.',
  },
  {
    ten: 'Không nói vo',
    mo: 'Mỗi nhận định đều mở ra được để xem nó dựa trên đâu. Không mở ra được thì Celes không nói.',
  },
];

export default function CauChuyenPage() {
  return (
    <>
      <Section>
        <Shell rong="hep">
          <SectionHeader
            cap="h1"
            eyebrow="CÂU CHUYỆN CELESTIA"
            tieuDe="Khi bạn chưa rõ đường, Celes giúp bạn nhìn thấy lối đi"
          />
          <div className="mt-[32px] flex flex-col gap-[20px]">
            <p className="body-lg" style={{ color: 'var(--fg)' }}>
              Phần lớn những lúc bế tắc, chúng ta không thiếu thông tin. Chúng ta đã nghĩ rất nhiều
              rồi mà vẫn không biết nên tiếp tục, dừng lại hay bắt đầu lại.
            </p>
            <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
              Celestia ra đời cho đúng khoảnh khắc đó. Không phải để đưa thêm một lời khuyên nữa vào
              đống lời khuyên bạn đã nghe, mà để giúp bạn nhìn vấn đề từ một góc khác — bình tĩnh
              hơn, rõ hơn, và gần với chính bạn hơn.
            </p>
            <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
              <b style={{ color: 'var(--fg)' }}>Celestia</b> là nơi bạn đến.{' '}
              <b style={{ color: 'var(--fg)' }}>Celes</b> là người bạn trò chuyện cùng — một người
              bạn để lắng nghe, một người thầy để soi sáng, và một người đồng hành ở những ngã rẽ.
            </p>
          </div>
        </Shell>
      </Section>

      <Section className="pt-0">
        <Shell rong="hep">
          <SectionHeader eyebrow="ĐIỀU CELES KHÔNG LÀM" tieuDe="Giới hạn được đặt ra từ đầu" />
          <div className="mt-[32px] grid gap-[16px] md:grid-cols-3">
            {KHONG_LAM.map((k) => (
              <The key={k.ten} className="flex flex-col gap-[10px]">
                <h2 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {k.ten}
                </h2>
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {k.mo}
                </p>
              </The>
            ))}
          </div>
        </Shell>
      </Section>

      <DarkBand className="py-[80px]">
        <Shell className="flex flex-wrap items-center justify-between gap-[32px]">
          <div className="max-w-[560px]">
            <p className="eyebrow mb-[16px]">HIỂU MÌNH · RÕ ĐƯỜNG · VỮNG BƯỚC</p>
            <h2 className="heading">Bắt đầu từ chính bạn</h2>
            <p className="body-text mt-[16px]" style={{ color: 'var(--fg-muted)' }}>
              Vài phút là đủ để thấy Celes nhìn ra điều gì.
            </p>
          </div>
          <Link href="/la-so" className="btn-primary">
            Bắt đầu cùng Celes
          </Link>
        </Shell>
      </DarkBand>
    </>
  );
}
