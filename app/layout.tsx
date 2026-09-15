import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteNav } from "@/components/SiteNav";
import "./globals.css";

// Ivy Presto không có bản web miễn phí — Playfair Display là substitute didone
// mà design system đã chỉ định, chỉ dùng cho heading từ 28px trở lên.
const playfair = Playfair_Display({
  variable: "--font-display-serif",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Celestia — Lập lá số & luận giải Tử Vi",
  description:
    "Celestia — lập lá số Tử Vi theo Nam phái, luận giải hiện đại bằng AI.",
};

// Đặt theme trước khi trang vẽ lần đầu để không bị chớp nền sai màu
const KHOI_TAO_THEME = `(function(){try{var t=localStorage.getItem('tuvi-ai:theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'day':'night';}document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t==='day'?'light':'dark';}catch(e){document.documentElement.setAttribute('data-theme','night');}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      data-theme="night"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: KHOI_TAO_THEME }} />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="mx-auto w-full max-w-[1216px] px-[24px]">
          <SiteNav />
          {children}
          <footer
            className="no-print border-t py-[40px] text-[13px]"
            style={{ color: "var(--fg-muted)", borderColor: "var(--line)" }}
          >
            Kết quả an sao và luận giải mang tính tham khảo, không thay thế tư vấn chuyên môn.
          </footer>
        </div>
      </body>
    </html>
  );
}
