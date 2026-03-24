"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StockHolding } from "@/lib/types";
import { getAllStocks } from "@/lib/stock-tiers";
import { getPortfolio, savePortfolio } from "@/lib/portfolio";
import { hasPersona } from "@/lib/persona";
import { getLogos } from "@/lib/logo-cache";
import StockLogo from "./StockLogo";

const PAGE_SIZE = 50;

export default function PortfolioForm() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<StockHolding[]>([]);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);
  const [logoMap, setLogoMap] = useState<Record<string, string>>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // 캐시 우선 로고 조회 (24h TTL, miss 시에만 API 호출)
  const fetchLogos = useCallback(async () => {
    try {
      const logos = await getLogos();
      setLogoMap(logos);
    } catch {
      // 로고 로드 실패해도 UI는 정상 동작
    }
  }, []);

  useEffect(() => {
    setPortfolio(getPortfolio());
    fetchLogos();
  }, [fetchLogos]);

  // 검색 시 필터링, 미검색 시 전체 목록
  const allStocksList = getAllStocks().map((s) => ({
    ticker: s.ticker,
    name: s.name,
    nameKr: s.nameKr,
    quantity: 0,
  }));

  const filteredStocks = allStocksList.filter(
    (s) =>
      !portfolio.some((p) => p.ticker === s.ticker) &&
      (!search ||
        s.ticker.toLowerCase().includes(search.toLowerCase()) ||
        s.nameKr.includes(search) ||
        s.name.toLowerCase().includes(search.toLowerCase()))
  );

  // 검색어 변경 시 visibleCount 리셋
  const handleSearch = (value: string) => {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  };

  const visibleStocks = filteredStocks.slice(0, visibleCount);
  const hasMore = visibleCount < filteredStocks.length;

  function addStock(stock: StockHolding) {
    const updated = [...portfolio, { ...stock, quantity: 1, logoUrl: logoMap[stock.ticker] }];
    setPortfolio(updated);
    setSearch("");
    setVisibleCount(PAGE_SIZE);
  }

  function removeStock(ticker: string) {
    setPortfolio(portfolio.filter((h) => h.ticker !== ticker));
  }

  function handleSave() {
    const withLogos = portfolio.map((h) => ({
      ...h,
      logoUrl: h.logoUrl || logoMap[h.ticker],
    }));
    savePortfolio(withLogos);
    if (!hasPersona()) {
      router.push("/persona");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Current Portfolio */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h3 className="text-[15px] font-bold text-[#2C1810] mb-3">내 관심종목</h3>
        {portfolio.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-[14px] bg-[#FDF8F3] rounded-xl">
            관심종목을 추가해주세요
          </div>
        ) : (
          <div className="space-y-2">
            {portfolio.map((holding) => (
              <div
                key={holding.ticker}
                className="flex items-center justify-between bg-[#FDF8F3] rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <StockLogo ticker={holding.ticker} logoUrl={holding.logoUrl || logoMap[holding.ticker]} size={40} />
                  <div>
                    <p className="text-[14px] font-bold text-[#2C1810]">{holding.nameKr}</p>
                    <p className="text-[13px] text-gray-400">{holding.ticker}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeStock(holding.ticker)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search & Add */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <h3 className="text-[15px] font-bold text-[#2C1810] mb-3">종목 추가</h3>
        <input
          type="text"
          placeholder="종목명 또는 티커 검색"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#B8733A] focus:ring-1 focus:ring-[#B8733A]/50 placeholder:text-gray-300"
        />
        <div className="mt-2 space-y-1">
          {visibleStocks.map((stock) => (
            <button
              key={stock.ticker}
              onClick={() => addStock(stock)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[#FDF8F3] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <StockLogo ticker={stock.ticker} logoUrl={logoMap[stock.ticker]} size={36} />
                <div>
                  <p className="text-[14px] text-[#2C1810] font-medium">{stock.nameKr}</p>
                  <p className="text-[13px] text-gray-400">{stock.ticker}</p>
                </div>
              </div>
              <span className="text-[#B8733A] text-xl font-bold">+</span>
            </button>
          ))}
          {hasMore && (
            <button
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="w-full py-3 text-[14px] font-medium text-gray-500 hover:text-[#B8733A] transition-colors"
            >
              더보기 ({filteredStocks.length - visibleCount}개 남음)
            </button>
          )}
        </div>
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-14 left-0 right-0 z-40 max-w-[430px] mx-auto px-4 pb-3 pt-2 bg-gradient-to-t from-[#FDF8F3] via-[#FDF8F3] to-transparent">
        <button
          onClick={handleSave}
          disabled={portfolio.length === 0}
          className={`w-full py-3.5 rounded-xl text-[14px] font-bold transition-all ${
            portfolio.length === 0
              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
              : saved
              ? "bg-green-500 text-white"
              : "bg-[#B8733A] text-white active:scale-[0.98] shadow-sm"
          }`}
        >
          {saved ? "저장 완료!" : "관심종목 저장"}
        </button>
      </div>
    </div>
  );
}
