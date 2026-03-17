import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const bodyFont = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const metadata = {
  title: "My D-day Memo",
  description: "날짜가 있는 메모와 평상시 메모를 함께 정리하는 데스크톱용 D-day 메모 앱",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={`${bodyFont.className} bg-[#FFFDF7] text-zinc-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}
