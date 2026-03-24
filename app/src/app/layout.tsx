import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "AI 투자비서 — A증권사",
  description: "AI 기반 미국주식 브리핑 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-[#f7f8fa]">
        <div className="flex-1 pb-16">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
