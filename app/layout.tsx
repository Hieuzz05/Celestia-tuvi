import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono, Permanent_Marker } from "next/font/google";
import { NgonNguProvider } from "@/lib/i18n/context";
import { BoiCanhProvider } from "@/lib/store/boi-canh";
import { BangCamOn } from "@/components/support/BangCamOn";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";
import { GhiTrangTruoc } from '@/components/QuayLai';

// Kaio không có bản web miễn phí — Inter Tight 700 là một trong ba substitute mà
// design system chỉ định, dùng cho toàn bộ display headline từ 36px trở lên.
const displaySans = Inter_Tight({
  variable: "--font-display-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

// Eyebrow và nhãn kỹ thuật — giãn chữ 0.10em biến mono thành giọng nhãn, không phải code
const monoLabel = JetBrains_Mono({
  variable: "--font-mono-label",
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
});

// Lớp cá tính: ghi chú viết tay đặt trên dải gradient hero
const annotation = Permanent_Marker({
  variable: "--font-annotation",
  subsets: ["latin"],
  weight: ["400"],
});

// Mặt trước không nhắc AI, model hay trường phái — brand spec cấm đưa lớp kỹ
// thuật lên tiêu đề. Tiêu đề bán giá trị: bớt mơ hồ, thấy hướng đi.
export const metadata: Metadata = {
  metadataBase: new URL("https://celestia-tuvi.vercel.app"),
  title: {
    default: "Celestia — Hiểu mình. Rõ đường. Vững bước.",
    template: "%s — Celestia",
  },
  description:
    "Khi bạn chưa rõ đường, Celes giúp bạn nhìn thấy lối đi: một góc nhìn đủ rõ để hiểu mình, hiểu điều đang xảy ra và biết bước tiếp theo nên bắt đầu từ đâu.",
  openGraph: {
    type: "website",
    siteName: "Celestia",
    locale: "vi_VN",
    title: "Celestia — Hiểu mình. Rõ đường. Vững bước.",
    description:
      "Khi bạn chưa rõ đường, Celes giúp bạn nhìn thấy lối đi.",
  },
};

// Đặt theme trước khi trang vẽ lần đầu để không bị chớp nền sai màu.
// Mặc định là Ngày vì design system gốc là theme sáng.
const KHOI_TAO_THEME = `(function(){try{var t=localStorage.getItem('tuvi-ai:theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'night':'day';}document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t==='day'?'light':'dark';}catch(e){document.documentElement.setAttribute('data-theme','day');}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      data-theme="day"
      className={`${inter.variable} ${displaySans.variable} ${monoLabel.variable} ${annotation.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: KHOI_TAO_THEME }} />
      </head>
      {/* Không bọc max-width ở đây: các dải hero/CTA cần tràn hết chiều ngang,
          nên từng trang tự bọc nội dung bằng <Shell>. */}
      <body className="flex min-h-full flex-col">
        <NgonNguProvider>
          {/* Bối cảnh lá số nằm trên cùng: đổi route không được làm mất lá số
              đang xem hay lá số vừa nhập mà chưa lưu (spec v4 mục 13-14). */}
          <BoiCanhProvider>
            {/* Đặt trên cả thanh điều hướng: người vừa ủng hộ xong quay lại bằng
                đường nào cũng thấy, không phải chỉ khi ở màn thanh toán. */}
            <BangCamOn />
            <SiteNav />
            <GhiTrangTruoc />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </BoiCanhProvider>
        </NgonNguProvider>
      </body>
    </html>
  );
}
