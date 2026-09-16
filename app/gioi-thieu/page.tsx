import Link from 'next/link';
import type { Metadata } from 'next';
import {
  BuocSo,
  DarkBand,
  Eyebrow,
  GhiChuTay,
  HeroBand,
  HuyHieuOk,
  IconDongHo,
  IconHaiNguoi,
  IconKhien,
  IconLaSo,
  IconMuiTenPhai,
  IconNguoiDung,
  IconSach,
  IconSao,
  IconTiaSet,
  IconTroChuyen,
  NhanPill,
  OIcon,
  Section,
  SectionHeader,
  Shell,
  The,
  TheTrichDan,
  TheTrungBay,
} from '@/components/ui';

export const metadata: Metadata = {
  title: 'Giới thiệu — Celestia',
  description:
    'Celestia lập lá số Tử Vi theo Nam phái, đối chiếu Bắc phái cho vận hạn, rồi để AI luận giải bằng giọng hiện đại.',
};

const PHAN_LOAI = ['AN SAO', 'ĐẠI VẬN', 'TIỂU HẠN', 'HỢP TUỔI', 'HỎI ĐÁP'];

const TINH_NANG = [
  {
    icon: <IconLaSo />,
    ten: 'An sao Nam phái',
    mo: '108 sao trên 12 cung, đủ chính tinh, phụ tinh, tứ hóa, Tuần Triệt và độ sáng — đối chiếu từng cung với lá số chuẩn.',
  },
  {
    icon: <IconDongHo />,
    ten: 'Vận hạn theo năm',
    mo: 'Đại vận, tiểu hạn, nguyệt hạn và lưu tinh theo năm xem. Phần luận vận hạn đối chiếu thêm Bắc phái.',
  },
  {
    icon: <IconTroChuyen />,
    ten: 'Hỏi đáp trên lá số',
    mo: 'Chọn một lá số đã lưu rồi hỏi tự do. AI đọc thẳng dữ liệu an sao chứ không đoán từ ngày sinh.',
  },
  {
    icon: <IconHaiNguoi />,
    ten: 'So hai lá số',
    mo: 'Đối chiếu tuổi vợ chồng hay cộng sự: phần bảng do engine tính, phần nhận định do AI viết.',
  },
  {
    icon: <IconSach />,
    ten: 'Kho tri thức riêng',
    mo: 'Nạp tài liệu tử vi của bạn, AI trích dẫn đúng đoạn đã dùng thay vì nói vo.',
  },
  {
    icon: <IconTiaSet />,
    ten: 'Nhiều model, tự chuyển',
    mo: 'Hết lượt miễn phí ở model này thì tự nhảy sang model kế tiếp, không dừng giữa chừng.',
  },
];

const BUOC = [
  { tieuDe: 'Nhập ngày giờ sinh', mo: 'Dương lịch, giờ theo canh — hệ tự quy đổi sang âm lịch.' },
  { tieuDe: 'Xem lá số an sao', mo: 'Mệnh bàn 12 cung hiện ngay, rê chuột để soi tam phương tứ chính.' },
  { tieuDe: 'Bấm luận giải', mo: 'Chọn model rồi để AI đọc lá số và viết bằng giọng hiện đại.' },
];

/*
 * Nội dung mẫu cho khối trích dẫn.
 *
 * Đây KHÔNG phải đánh giá của người dùng thật — sản phẩm chưa có ai đánh giá.
 * Dựng sẵn ba thẻ để thấy bố cục, và khối này ghi rõ là nội dung minh hoạ; thay
 * bằng lời thật rồi mới bỏ dòng ghi chú đó đi.
 */
const TRICH_DAN = [
  {
    ten: 'Lá số',
    vaiTro: 'Chỗ đặt lời người dùng',
    trichDan:
      'Một câu về việc đọc lá số xong có hiểu gì không. Thay bằng lời thật của người đã dùng.',
  },
  {
    ten: 'Đối chiếu',
    vaiTro: 'Chỗ đặt lời người dùng',
    trichDan:
      'Một câu về việc an sao có khớp với bản an tay hay không. Thay bằng lời thật của người đã dùng.',
  },
  {
    ten: 'Vận hạn',
    vaiTro: 'Chỗ đặt lời người dùng',
    trichDan:
      'Một câu về phần vận hạn và so tuổi. Thay bằng lời thật của người đã dùng.',
  },
];
export default function GioiThieuPage() {
  return (
    <>
      {/* ---------- Dải hero: gradient hoàng hôn tràn hết chiều ngang ---------- */}
      <HeroBand className="pt-[80px] pb-[96px]">
        <Shell rong="hep" className="text-center">
          <Eyebrow className="mb-[16px]">LẬP LÁ SỐ TỬ VI · NAM PHÁI LÀM CHUẨN</Eyebrow>
          <h1 className="display">
            Lá số của bạn, giải bằng tiếng người
          </h1>
          <p className="body-lg mx-auto mt-[24px] max-w-[560px]" style={{ color: 'var(--fg)' }}>
            An sao chuẩn Nam phái, đối chiếu Bắc phái khi luận vận hạn, rồi để AI viết lại bằng giọng
            đời thường — không bắt bạn học thuộc tên sao trước.
          </p>

          <div className="mt-[32px] flex flex-wrap items-center justify-center gap-[16px]">
            <Link href="/" className="btn-primary">
              Lập lá số miễn phí
            </Link>
            <Link href="/hoi-dap" className="btn-outline">
              Celestia hợp với tôi chứ?
            </Link>
          </div>

          <div className="mt-[24px] flex justify-center">
            <HuyHieuOk>Không cần thẻ, không giới hạn số lá số</HuyHieuOk>
          </div>
        </Shell>

        {/* Hàng thẻ trưng bày nhô lên nền gradient */}
        <Shell className="mt-[48px]">
          <div className="relative">
            <span className="absolute -top-[44px] right-[8%] hidden lg:block">
              <GhiChuTay huong="duoi" xoay={-4}>
                Giao diện thật, dựng ngay trên trình duyệt
              </GhiChuTay>
            </span>

            <div className="grid gap-[16px] md:grid-cols-3">
              <TheTrungBay>
                <XemTruocMenhBan />
              </TheTrungBay>
              <TheTrungBay>
                <XemTruocLuanGiai />
              </TheTrungBay>
              <TheTrungBay>
                <XemTruocHoiDap />
              </TheTrungBay>
            </div>
          </div>
        </Shell>
      </HeroBand>

      {/* ---------- Chip phân loại ---------- */}
      <Section gon>
        <Shell className="flex flex-wrap items-center justify-center gap-[8px]">
          {PHAN_LOAI.map((p) => (
            <NhanPill key={p}>{p}</NhanPill>
          ))}
        </Shell>
      </Section>

      {/* ---------- Tính năng ---------- */}
      <Section className="pt-0">
        <Shell>
          <SectionHeader
            canGiua
            eyebrow="TRỌN BỘ MỘT CHỖ"
            tieuDe="Từ an sao tới luận giải, không nhảy qua công cụ khác"
            mo="Phần tính toán chạy bằng engine thuần, phần diễn giải mới gọi AI — nhờ vậy con số luôn ổn định kể cả khi model đổi."
          />

          <div className="mt-[48px] grid gap-[16px] md:grid-cols-2 lg:grid-cols-3">
            {TINH_NANG.map((t) => (
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

      {/* ---------- Hàng icon tích hợp ---------- */}
      <Section gon className="pt-0">
        <Shell className="text-center">
          <Eyebrow>CHẠY TRÊN CÁC MODEL MIỄN PHÍ</Eyebrow>
          <div className="mt-[24px] flex flex-wrap items-center justify-center gap-[24px]">
            <OIcon nhan="Gemini">
              <IconSao />
            </OIcon>
            <OIcon nhan="Groq">
              <IconTiaSet />
            </OIcon>
            <OIcon nhan="Cerebras">
              <IconDongHo />
            </OIcon>
            <OIcon nhan="OpenRouter">
              <IconMuiTenPhai />
            </OIcon>
            <OIcon nhan="OpenAI">
              <IconTroChuyen />
            </OIcon>
            <OIcon nhan="Anthropic">
              <IconKhien />
            </OIcon>
          </div>
          <Link href="/admin" className="link-text mt-[24px] inline-flex items-center gap-[6px]">
            Xem tất cả và tự cấu hình
            <IconMuiTenPhai size={16} />
          </Link>
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

      {/* ---------- Lời chứng thực ---------- */}
      <Section className="pt-0">
        <Shell>
          <SectionHeader
            canGiua
            eyebrow="NỘI DUNG MINH HOẠ"
            tieuDe="Chỗ dành cho lời người dùng"
            mo="Ba thẻ dưới đây là chỗ trống dựng sẵn, chưa phải đánh giá thật."
          />
          <div className="mt-[48px] grid gap-[16px] md:grid-cols-3">
            {TRICH_DAN.map((t) => (
              <TheTrichDan key={t.ten} ten={t.ten} vaiTro={t.vaiTro} trichDan={t.trichDan} />
            ))}
          </div>
        </Shell>
      </Section>

      {/* ---------- Dải CTA tối cuối trang ---------- */}
      <DarkBand className="py-[80px]">
        <Shell className="flex flex-wrap items-center justify-between gap-[32px]">
          <div className="max-w-[560px]">
            <p className="eyebrow mb-[16px]">SẴN SÀNG CHƯA?</p>
            <h2 className="heading">
              Lập lá số đầu tiên ngay bây giờ
            </h2>
            <p className="body-text mt-[16px]" style={{ color: 'var(--fg-muted)' }}>
              Chỉ cần ngày, giờ sinh và giới tính. Mọi thứ còn lại Celestia lo — kể cả việc đổi
              model khi một nhà cung cấp hết lượt miễn phí.
            </p>
          </div>

          <div className="flex flex-col items-start gap-[12px]">
            <Link href="/" className="btn-primary">
              Lập lá số miễn phí
            </Link>
            <Link href="/dang-nhap" className="link-text inline-flex items-center gap-[6px]">
              <IconNguoiDung size={16} />
              Đã có tài khoản? Đăng nhập
            </Link>
          </div>
        </Shell>
      </DarkBand>
    </>
  );
}

/* ---------------------------------------------------------------------------
 * Ba khối xem trước trong hàng thẻ trưng bày.
 *
 * Design system yêu cầu thẻ trưng bày chứa giao diện thật của sản phẩm chứ không
 * phải ảnh trang trí, nên đây là UI dựng lại bằng chính token của hệ — luôn đúng
 * theme Ngày/Đêm, không bao giờ lệch như ảnh chụp màn hình.
 * ------------------------------------------------------------------------- */

const CUNG_MAU = [
  'Tỵ', 'Ngọ', 'Mùi', 'Thân',
  'Thìn', '', '', 'Dậu',
  'Mão', '', '', 'Tuất',
  'Dần', 'Sửu', 'Tý', 'Hợi',
];

function XemTruocMenhBan() {
  return (
    <div className="flex flex-col gap-[10px] p-[16px]">
      <span className="eyebrow">MỆNH BÀN</span>
      <div className="grid grid-cols-4 gap-[2px]">
        {CUNG_MAU.map((c, i) => (
          <div
            key={i}
            className="flex h-[38px] items-start justify-end p-[4px] text-[9px]"
            style={{
              background: c ? 'var(--chart-cell)' : 'var(--chart-han)',
              boxShadow: 'inset 0 0 0 1px var(--line)',
              color: 'var(--fg-muted)',
            }}
          >
            {c}
          </div>
        ))}
      </div>
      <span className="caption">12 cung · 108 sao · độ sáng đầy đủ</span>
    </div>
  );
}

function XemTruocLuanGiai() {
  return (
    <div className="flex flex-col gap-[10px] p-[16px]">
      <span className="eyebrow">LUẬN GIẢI</span>
      <p className="text-[13px] leading-[1.6]" style={{ color: 'var(--fg)' }}>
        Mệnh an tại Tỵ có <b>Thiên Cơ miếu</b> — bạn nghĩ nhanh, thích gỡ rối, nhưng dễ đổi ý giữa
        chừng.
      </p>
      <div className="flex flex-col gap-[4px]">
        {[100, 84, 92, 60].map((w, i) => (
          <span
            key={i}
            className="h-[6px] rounded-full"
            style={{ width: `${w}%`, background: 'var(--line)' }}
          />
        ))}
      </div>
      <span className="caption">Trích từ kho tri thức · Nam phái</span>
    </div>
  );
}

function XemTruocHoiDap() {
  return (
    <div className="flex flex-col gap-[10px] p-[16px]">
      <span className="eyebrow">HỎI ĐÁP</span>
      <span
        className="self-end rounded-[var(--radius-cards)] px-[12px] py-[8px] text-[12px]"
        style={{ background: 'var(--fg)', color: 'var(--bg)' }}
      >
        Năm nay chuyển việc được không?
      </span>
      <span
        className="self-start rounded-[var(--radius-cards)] px-[12px] py-[8px] text-[12px]"
        style={{ boxShadow: 'inset 0 0 0 1px var(--line)', color: 'var(--fg)' }}
      >
        Quan Lộc năm nay có Thái Tuế chiếu…
      </span>
      <span className="caption">Hỏi trên lá số đã lưu</span>
    </div>
  );
}
