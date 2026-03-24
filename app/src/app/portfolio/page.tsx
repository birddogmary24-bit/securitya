"use client";

import Header from "@/components/Header";
import PortfolioForm from "@/components/PortfolioForm";

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <Header title="관심종목 설정" />
      <div className="px-4 py-4">
        <p className="text-[13px] text-gray-400 mb-4">
          관심 종목을 등록하면 메리가 맞춤 브리핑을 해드릴게요
        </p>
        <PortfolioForm />
      </div>
    </div>
  );
}
