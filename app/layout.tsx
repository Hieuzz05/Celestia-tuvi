import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono, Permanent_Marker } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Celestia — Lập lá số & luận giải Tử Vi",
  description:
    "Celestia — lập lá số Tử Vi theo Nam phái, luận giải hiện đại bằng AI.",
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
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
