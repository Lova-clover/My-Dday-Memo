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
    default: "나만의 D-DAY",
    template: "%s | 나만의 D-DAY",
  },
  description: "모바일과 데스크톱에서 함께 쓰는 나만의 D-DAY 메모 보드",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/my-dday-logo.png",
    apple: "/my-dday-logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "나만의 D-DAY",
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
