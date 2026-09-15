import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "황금농부의 딸깍",
  description: "사내/관리자용 상세페이지 제작 자동화",
};

import { AuthProvider } from "@/components/providers/AuthProvider";
import { AuthGuard } from "@/components/providers/AuthGuard";
import { QuotaModal } from "@/components/ui/QuotaModal";
import { ApiKeyRequiredModal } from "@/components/ui/ApiKeyRequiredModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Korean Web Fonts - Google Fonts (reliable) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Do+Hyeon&family=Nanum+Gothic:wght@400;700;800&family=Nanum+Myeongjo:wght@400;700;800&family=Gowun+Dodum&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
          <QuotaModal />
          <ApiKeyRequiredModal />
        </AuthProvider>
      </body>
    </html>
  );
}
