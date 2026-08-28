import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "새송탄로타리클럽 26-27년도 이사회",
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
