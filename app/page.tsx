import Link from 'next/link';
import type { Metadata } from 'next';
import { LaSoMau } from '@/components/landing/LaSoMau';
import {
  BuocSo,
  DarkBand,
  Eyebrow,
  GhiChuTay,
  HeroBand,
  IconDongHo,
  IconHaiNguoi,
  IconKhien,
  IconLaSo,
  IconMuiTenPhai,
  IconSao,
  IconTroChuyen,
  Section,
  SectionHeader,
  Shell,
  The,
} from '@/components/ui';

export const metadata: Metadata = {
  title: 'Celestia — Một góc nhìn mới về chính bạn',
  description:
    'Celestia biến lá số phức tạp thành những điều bạn có thể hiểu và áp dụng vào đời sống: bản thân, công việc, tình cảm và giai đoạn bạn đang đi qua.',
};

/**
 * Landing công khai.
 *
 * Trang này bán cảm giác "tôi sẽ hiểu được điều gì về mình", không bán công nghệ:
 * không nhắc trường phái, model AI hay nhà cung cấp — những thứ đó không phải giá
 * trị của người dùng, và để ở mặt trước thì người mới không biết trang này giúp
 * được gì cho mình.
 */

const BA_GIA_TRI = [
  {
    icon: <IconSao />,
    ten: 'Hiểu bản thân',
    mo: 'Thứ bạn thường làm tốt, thứ bạn hay vướng, và điều khiến bạn thấy đủ hoặc thấy thiếu.',
  },
  {
    icon: <IconDongHo />,
    ten: 'Hiểu thời điểm',
    mo: 'Giai đoạn bạn đang đi qua đang nghiêng về chủ đề nào, và điều gì dễ nổi lên trong năm nay.',
  },
  {
    icon: <IconHaiNguoi />,
    ten: 'Hiểu mối quan hệ',
    mo: 'Hai người dễ đồng điệu ở đâu, và ở đâu thì cần thêm thời gian để hiểu nhau.',
  },
];

const VI_SAO_TIN = [
  {
    icon: <IconLaSo />,
    ten: 'Được tính nhất quán',
    mo: 'Cùng một ngày giờ sinh luôn cho ra cùng một lá số. Phần tính toán không đổi theo cách bạn đặt câu hỏi.',
  },
  {
    icon: <IconKhien />,
    ten: 'Có căn cứ',
    mo: 'Mỗi nhận định đều mở ra được để xem nó dựa trên phần nào của lá số, thay vì bắt bạn tin suông.',
  },
  {
    icon: <IconTroChuyen />,
    ten: 'Có thể xem sâu',
    mo: 'Bạn đọc bản dễ hiểu trước. Khi muốn đi tới tận thuật ngữ gốc, mọi lớp bên dưới vẫn còn nguyên đó.',
  },
];

const BUOC = [
  {
    tieuDe: 'Cho biết bạn sinh khi nào',
    mo: 'Ngày và giờ sinh — mất chưa tới một phút.',
  },
  {
    tieuDe: 'Nhận góc nhìn đầu tiên',
    mo: 'Ba điều đáng chú ý về bạn, viết bằng tiếng thường, không cần đăng ký.',
  },
  {
    tieuDe: 'Đi sâu khi bạn muốn',
    mo: 'Theo chủ đề bạn đang quan tâm, hoặc hỏi thẳng điều đang băn khoăn.',
  },
];

export default function TrangChu() {
  return (
    <>
      {/* ---------- Dải hero: gradient hoàng hôn tràn hết chiều ngang ---------- */}
      <HeroBand className="pt-[80px] pb-[96px]">
        <Shell rong="hep" className="text-center">
          <Eyebrow className="mb-[16px]">MỘT GÓC NHÌN MỚI VỀ CHÍNH BẠN</Eyebrow>
          <h1 className="display">Lá số của bạn, giải bằng tiếng người</h1>
          <p className="body-lg mx-auto mt-[24px] max-w-[560px]" style={{ color: 'var(--fg)' }}>
            Celestia biến lá số phức tạp thành những điều bạn có thể hiểu và áp dụng vào đời sống —
            về bản thân, công việc, tình cảm và giai đoạn bạn đang đi qua.
          </p>

          <div className="mt-[32px] flex flex-wrap items-center justify-center gap-[16px]">
            <Link href="/la-so" className="btn-primary">
              Tạo lá số miễn phí
            </Link>
            <Link href="/la-so?mau=1" className="btn-outline">
              Xem một lá số mẫu
            </Link>
          </div>

          <p className="caption mt-[16px]">Không cần tài khoản để xem góc nhìn đầu tiên.</p>
        </Shell>

        {/* Xem trước một góc nhìn thật, kèm nút mở căn cứ */}
        <Shell className="mt-[48px]">
          <div className="relative">
            <span className="absolute -top-[40px] right-[6%] hidden lg:block">
              <GhiChuTay huong="duoi" xoay={-4}>
                Bấm thử &ldquo;Vì sao?&rdquo;
              </GhiChuTay>
            </span>
            <LaSoMau />
          </div>
        </Shell>
      </HeroBand>

      {/* ---------- Ba giá trị ---------- */}
      <Section>
        <Shell>
          <SectionHeader
            canGiua
            eyebrow="CELESTIA GIÚP ĐƯỢC GÌ"
            tieuDe="Ba câu hỏi bạn có thể mang tới đây"
          />
          <div className="mt-[48px] grid gap-[16px] md:grid-cols-3">
            {BA_GIA_TRI.map((t) => (
              <The key={t.ten} className="flex flex-col gap-[12px]">
                <span style={{ color: 'var(--fg)' }}>{t.icon}</span>
                <h3 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {t.ten}
                </h3>
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {t.mo}
                </p>
              </The>
            ))}
          </div>
        </Shell>
      </Section>

      {/* ---------- Ba bước ---------- */}
      <Section className="pt-0">
        <Shell>
          <SectionHeader
            canGiua
            eyebrow="BẮT ĐẦU TRONG MỘT PHÚT"
            tieuDe="Ba bước, không cần tài khoản"
          />
          <div className="mx-auto mt-[48px] grid max-w-[900px] gap-[24px] md:grid-cols-3">
            {BUOC.map((b, i) => (
              <BuocSo key={b.tieuDe} so={i + 1} tieuDe={b.tieuDe} mo={b.mo} />
            ))}
          </div>
        </Shell>
      </Section>

      {/* ---------- Vì sao tin được ---------- */}
      <Section className="pt-0">
        <Shell>
          <SectionHeader
            canGiua
            eyebrow="VÌ SAO TIN ĐƯỢC"
            tieuDe="Dễ đọc, nhưng luôn mở ra xem được căn cứ"
            mo="Người mới nhận một câu chuyện rõ ràng. Người đã biết Tử Vi vẫn lần được tới cung, sao và cách tính."
          />
          <div className="mt-[48px] grid gap-[16px] md:grid-cols-3">
            {VI_SAO_TIN.map((t) => (
              <The key={t.ten} className="flex flex-col gap-[12px]">
                <span style={{ color: 'var(--fg)' }}>{t.icon}</span>
                <h3 className="text-[20px] font-semibold" style={{ color: 'var(--fg)' }}>
                  {t.ten}
                </h3>
                <p className="body-sm" style={{ color: 'var(--fg-muted)' }}>
                  {t.mo}
                </p>
              </The>
            ))}
          </div>
          <p className="mt-[32px] text-center">
            <Link href="/gioi-thieu" className="link-text inline-flex items-center gap-[6px]">
              Xem cách Celestia tính lá số
              <IconMuiTenPhai size={16} />
            </Link>
          </p>
        </Shell>
      </Section>

      {/* ---------- Dải CTA tối cuối trang ---------- */}
      <DarkBand className="py-[80px]">
        <Shell className="flex flex-wrap items-center justify-between gap-[32px]">
          <div className="max-w-[560px]">
            <p className="eyebrow mb-[16px]">SẴN SÀNG CHƯA?</p>
            <h2 className="heading">Bắt đầu từ thông tin của bạn</h2>
            <p className="body-text mt-[16px]" style={{ color: 'var(--fg-muted)' }}>
              Chỉ cần ngày và giờ sinh. Góc nhìn đầu tiên hiện ngay, đọc xong rồi bạn mới cần quyết
              định có lưu lại hay không.
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
