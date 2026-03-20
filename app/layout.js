import { Noto_Sans_KR } from "next/font/google";
import PwaRegister from "../components/pwa-register";
import "./globals.css";

const bodyFont = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "짱귀요미 오리 D-day",
    template: "%s | 짱귀요미 오리 D-day",
  },
  description: "모바일 감성은 그대로 두고, 데스크톱에서는 더 넓고 정돈된 D-day + 메모 보드로 쓰는 오리 메모 앱",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/duck-hero.png",
    apple: "/duck-hero.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "오리 D-day",
  },
};

export const viewport = {
  themeColor: "#f6c86e",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={bodyFont.className}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
