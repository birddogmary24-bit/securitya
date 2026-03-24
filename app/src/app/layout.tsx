import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "AI투자비서 사냥개 메리",
  description: "사냥개 메리가 말아주는 AI 투자 브리핑 서비스",
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
      <body className="min-h-full flex flex-col bg-[#FDF8F3]">
        <div className="flex-1 pb-16">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
