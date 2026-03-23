"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StockHolding, POPULAR_STOCKS } from "@/lib/types";
import { getAllStocks } from "@/lib/stock-tiers";
import { getPortfolio, savePortfolio } from "@/lib/portfolio";
import { hasPersona } from "@/lib/persona";
import StockLogo from "./StockLogo";

export default function PortfolioForm() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<StockHolding[]>([]);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPortfolio(getPortfolio());
  }, []);

  // 검색 시 250종목 전체에서 검색, 미검색 시 인기 10종목 표시
  const allStocksList = getAllStocks().map((s) => ({
    ticker: s.ticker,
    name: s.name,
    nameKr: s.nameKr,
    quantity: 0,
  }));

  const filteredStocks = (search ? allStocksList : POPULAR_STOCKS).filter(
    (s) =>
      !portfolio.some((p) => p.ticker === s.ticker) &&
      (s.ticker.toLowerCase().includes(search.toLowerCase()) ||
        s.nameKr.includes(search) ||
        s.name.toLowerCase().includes(search.toLowerCase()))
  );

  function addStock(stock: StockHolding) {
    const updated = [...portfolio, { ...stock, quantity: 1 }];
    setPortfolio(updated);
    setSearch("");
  }

  function removeStock(ticker: string) {
    setPortfolio(portfolio.filter((h) => h.ticker !== ticker));
  }

  function updateQuantity(ticker: string, qty: number) {
    setPortfolio(
      portfolio.map((h) => (h.ticker === ticker ? { ...h, quantity: Math.max(1, qty) } : h))
    );
  }

  function handleSave() {
    savePortfolio(portfolio);
    if (!hasPersona()) {
      router.push("/persona");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Current Portfolio */}
      <div>
        <h3 className="text-sm font-semibold text-[#191919] mb-3">내 보유종목</h3>
        {portfolio.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl">
            보유종목을 추가해주세요
          </div>
        ) : (
          <div className="space-y-2">
            {portfolio.map((holding) => (
              <div
                key={holding.ticker}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <StockLogo ticker={holding.ticker} logoUrl={holding.logoUrl} size={36} />
                  <div>
                    <p className="text-sm font-medium text-[#191919]">{holding.nameKr}</p>
                    <p className="text-xs text-gray-400">{holding.ticker}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => updateQuantity(holding.ticker, holding.quantity - 1)}
                      className="px-2 py-1 text-gray-400 text-sm"
                    >
                      -
                    </button>
                    <span className="px-2 text-sm font-medium min-w-[32px] text-center">
                      {holding.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(holding.ticker, holding.quantity + 1)}
                      className="px-2 py-1 text-gray-400 text-sm"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeStock(holding.ticker)}
                    className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search & Add */}
      <div>
        <h3 className="text-sm font-semibold text-[#191919] mb-3">종목 추가</h3>
        <input
          type="text"
          placeholder="종목명 또는 티커 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#FEE500] focus:ring-1 focus:ring-[#FEE500]/50 placeholder:text-gray-300"
        />
        <div className="mt-2 space-y-1">
          {filteredStocks.slice(0, 8).map((stock) => (
            <button
              key={stock.ticker}
              onClick={() => addStock(stock)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <StockLogo ticker={stock.ticker} size={32} />
                <div>
                  <p className="text-sm text-[#191919]">{stock.nameKr}</p>
                  <p className="text-xs text-gray-400">{stock.ticker}</p>
                </div>
              </div>
              <span className="text-[#FEE500] text-lg">+</span>
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={portfolio.length === 0}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
          portfolio.length === 0
            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
            : saved
            ? "bg-green-500 text-white"
            : "bg-[#FEE500] text-[#191919] active:scale-[0.98]"
        }`}
      >
        {saved ? "저장 완료!" : "포트폴리오 저장"}
      </button>
    </div>
  );
}
