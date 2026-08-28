import "./globals.css";

export const metadata = {
  title: "새송탄로타리클럽 이사회 성원보고·전자결재",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
