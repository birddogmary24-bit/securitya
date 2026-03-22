"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { SecFiling } from "@/lib/types";
import { getPortfolio } from "@/lib/portfolio";

const FILTER_TYPES = ["전체", "10-K", "10-Q", "8-K"] as const;

const typeColors: Record<string, string> = {
  "10-K": "bg-blue-100 text-blue-600",
  "10-Q": "bg-green-100 text-green-600",
  "8-K": "bg-orange-100 text-orange-600",
};

export default function FilingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8fa]"><Header title="SEC 공시" /><div className="flex items-center justify-center py-20"><p className="text-sm text-gray-400">로딩 중...</p></div></div>}>
      <FilingsContent />
    </Suspense>
  );
}

function FilingsContent() {
  const searchParams = useSearchParams();
  const tickerParam = searchParams.get("ticker");

  const [filings, setFilings] = useState<SecFiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("전체");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const portfolio = getPortfolio();
    if (portfolio.length === 0) {
      setLoading(false);
      return;
    }

    const tickers = tickerParam
      ? [tickerParam.toUpperCase()]
      : portfolio.map((h) => h.ticker);

    fetch(`/api/filings?tickers=${tickers.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setFilings(data.filings);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [mounted, tickerParam]);

  const filtered =
    filter === "전체"
      ? filings
      : filings.filter((f) => f.filingType === filter);

  // 종목별 그룹핑
  const grouped = filtered.reduce<Record<string, SecFiling[]>>((acc, f) => {
    if (!acc[f.ticker]) acc[f.ticker] = [];
    acc[f.ticker].push(f);
    return acc;
  }, {});

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f7f8fa] pb-20">
      <Header title="SEC 공시" />

      <div className="px-4 py-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {FILTER_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filter === type
                  ? "bg-[#191919] text-white"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Ticker filter indicator */}
        {tickerParam && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">필터:</span>
            <span className="text-xs bg-[#FEE500]/30 text-[#191919] px-2 py-0.5 rounded-full font-medium">
              {tickerParam.toUpperCase()}
            </span>
            <a href="/filings" className="text-xs text-blue-500 underline">전체 보기</a>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-gray-400">공시 데이터 로딩 중...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-gray-500 mb-1">공시 데이터가 없어요</h2>
            <p className="text-xs text-gray-400">
              포트폴리오 종목의 최근 공시가 수집되면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([ticker, tickerFilings]) => (
              <div key={ticker} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Ticker header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-[15px] text-[#191919]">{ticker}</span>
                  <span className="text-xs text-gray-400">{tickerFilings.length}건</span>
                </div>

                {/* Filing list */}
                <div className="divide-y divide-gray-50">
                  {tickerFilings.map((filing) => (
                    <a
                      key={filing.accessionNumber}
                      href={filing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 mt-0.5 ${typeColors[filing.filingType] ?? "bg-gray-100 text-gray-600"}`}>
                          {filing.filingType}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[#191919] leading-snug">{filing.title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{filing.filedDate}</p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
