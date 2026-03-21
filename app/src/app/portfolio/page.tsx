"use client";

import Header from "@/components/Header";
import PortfolioForm from "@/components/PortfolioForm";

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header title="포트폴리오 설정" />
      <div className="px-4 py-4">
        <p className="text-xs text-gray-400 mb-4">
          보유 종목을 등록하면 맞춤형 AI 브리핑을 받을 수 있어요
        </p>
        <PortfolioForm />
      </div>
    </div>
  );
}
