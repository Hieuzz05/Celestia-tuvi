import Link from 'next/link';
import type { Metadata } from 'next';
import { DarkBand, Section, SectionHeader, Shell, The } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Cách Celestia tính lá số — Celestia',
  description:
    'Phần nào trong Celestia được tính cố định, phần nào do AI diễn giải, và Celestia dựa trên tài liệu nào.',
};

/**
 * Trang câu chuyện thương hiệu + phương pháp tính.
 *
 * Đây là chỗ duy nhất trong phần dành cho người dùng được phép nói thuật ngữ và
 * công nghệ. Mọi màn khác đẩy hết những thứ đó xuống lớp "xem cách tính" — người
 * muốn biết thì vào đây đọc, người không quan tâm không bị chặn đường.
 */

const LOP_TINH = [
  {
    ten: 'Phần được tính cố định',
    mo: 'Chuyển ngày dương sang âm lịch, xác định Mệnh, Thân, Cục, rồi an toàn bộ sao lên 12 cung. Toàn bộ bước này chạy bằng công thức, không có AI tham gia. Cùng một ngày giờ sinh luôn ra cùng một lá số, hôm nay hay năm sau cũng vậy.',
  },
  {
    ten: 'Phần được diễn giải',
    mo: 'Ba góc nhìn ngắn bạn thấy ngay sau khi tạo lá số cũng được dựng bằng công thức từ chính dữ liệu trên, nên hiện ra tức thì. Chỉ những bài dài theo chủ đề và phần hỏi đáp mới dùng AI để viết lại thành câu chuyện liền mạch.',
  },
  {
    ten: 'Phần bạn kiểm chứng được',
    mo: 'Mỗi nhận định đều có nút mở ra xem nó dựa trên cung nào, sao nào, độ sáng ra sao. Nếu bạn biết Tử Vi, bạn đối chiếu được ngay. Nếu chưa biết, mỗi chi tiết đều kèm một dòng giải thích bằng lời thường.',
  },
];

const CAU_HOI = [
  {
    hoi: 'Celestia theo trường phái nào?',
    dap: 'Phần an sao lấy Nam phái làm chuẩn. Khi nói về vận hạn, Celestia đối chiếu thêm cách luận của Bắc phái, vì hai phái mạnh ở những chỗ khác nhau. Bạn không cần biết điều này để dùng — nó chỉ quyết định con số bên dưới được tính thế nào.',
  },
  {
    hoi: 'Vì sao lại cần giờ sinh?',
    dap: 'Giờ sinh quyết định cung Mệnh nằm ở đâu, mà gần như mọi thứ còn lại đều đọc từ đó. Lệch một canh giờ là lá số khác hẳn. Nếu bạn không chắc giờ sinh, Celestia sẽ nói rõ điều đó thay vì lặng lẽ đưa ra một kết quả có thể sai.',
  },
  {
    hoi: 'AI có tự bịa ra nội dung không?',
    dap: 'AI không được tự nghĩ ra dữ kiện lá số — nó chỉ nhận dữ liệu đã tính sẵn rồi viết lại. Khi bạn đã nạp tài liệu vào kho tri thức, phần trích dẫn sẽ ghi rõ lấy từ tài liệu nào, để phân biệt đâu là căn cứ có nguồn và đâu là kiến thức chung.',
  },
  {
    hoi: 'Celestia có đoán trước tương lai không?',
    dap: 'Không. Celestia mô tả xu hướng của một giai đoạn, không khẳng định sự việc sẽ xảy ra. Bạn nên đọc nó như một góc nhìn thêm trước khi tự quyết định, không phải như một lời phán.',
  },
];

export default function GioiThieuPage() {
  return (
    <>
      <Section>
        <Shell rong="hep">
          <SectionHeader
            cap="h1"
            eyebrow="CÁCH CELESTIA LÀM VIỆC"
            tieuDe="Dễ đọc ở trên, vẫn đầy đủ ở dưới"
            mo="Celestia không bắt bạn học thuật ngữ trước khi nhận được gì. Nhưng mọi thứ bạn đọc đều mở ra được tới tận cách tính — dưới đây là toàn bộ những gì đang chạy bên dưới."
          />
        </Shell>
      </Section>

      <Section className="pt-0">
        <Shell>
          <div className="grid gap-[16px] md:grid-cols-3">
            {LOP_TINH.map((l) => (
              <The key={l.ten} className="flex flex-col gap-[12px]">
                <h2 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {l.ten}
                </h2>
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {l.mo}
                </p>
              </The>
            ))}
          </div>
        </Shell>
      </Section>

      <Section className="pt-0">
        <Shell rong="hep">
          <SectionHeader eyebrow="CÂU HỎI THƯỜNG GẶP" tieuDe="Những điều nên biết trước" />
          <div className="mt-[32px] flex flex-col gap-[24px]">
            {CAU_HOI.map((c) => (
              <div key={c.hoi} className="flex flex-col gap-[8px]">
                <h3 className="text-[18px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {c.hoi}
                </h3>
                <p className="body-text" style={{ color: 'var(--fg-muted)' }}>
                  {c.dap}
                </p>
              </div>
            ))}
          </div>
        </Shell>
      </Section>

      <DarkBand className="py-[80px]">
        <Shell className="flex flex-wrap items-center justify-between gap-[32px]">
          <div className="max-w-[560px]">
            <p className="eyebrow mb-[16px]">THỬ XEM SAO</p>
            <h2 className="heading">Đọc thì lâu, xem thì nhanh hơn</h2>
            <p className="body-text mt-[16px]" style={{ color: 'var(--fg-muted)' }}>
              Tạo một lá số và tự xem phần căn cứ — nhanh hơn là đọc hết trang này.
            </p>
          </div>
          <Link href="/la-so" className="btn-primary">
            Tạo lá số miễn phí
          </Link>
        </Shell>
      </DarkBand>
    </>
  );
}
