import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "새송탄로타리클럽 26-27년도 이사회",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "이사회",
    statusBarStyle: "default",
  },
  // appleWebApp.capable는 "mobile-web-app-capable"만 만드는데, iOS Safari는 아직
  // 구식 "apple-mobile-web-app-capable" 태그를 봐야 홈 화면 추가 시 브라우저 UI 없이
  // 앱처럼(standalone) 뜬다 — 최대 호환을 위해 둘 다 넣는다.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#17458F",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
