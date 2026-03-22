"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { SecFiling } from "@/lib/types";
import { getPortfolio } from "@/lib/portfolio";

const FILTER_TYPES = ["전체", "10-K", "10-Q", "8-K"] as const;
const DAILY_LIMIT = 5;

const typeColors: Record<string, string> = {
  "10-K": "bg-blue-100 text-blue-600",
  "10-Q": "bg-green-100 text-green-600",
  "8-K": "bg-orange-100 text-orange-600",
};

function getSummaryCount(): number {
  const today = new Date().toISOString().split("T")[0];
  const stored = localStorage.getItem("filing-summary-count");
  if (!stored) return 0;
  try {
    const { date, count } = JSON.parse(stored);
    return date === today ? count : 0;
  } catch {
    return 0;
  }
}

function incrementSummaryCount(): number {
  const today = new Date().toISOString().split("T")[0];
  const current = getSummaryCount();
  const next = current + 1;
  localStorage.setItem("filing-summary-count", JSON.stringify({ date: today, count: next }));
  return next;
}

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

  // AI 요약 상태
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [summaryCount, setSummaryCount] = useState(0);
  const [expandedFiling, setExpandedFiling] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setSummaryCount(getSummaryCount());
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

  const handleSummarize = useCallback(async (filing: SecFiling) => {
    const key = filing.accessionNumber;

    // 이미 요약이 있으면 토글만
    if (summaries[key]) {
      setExpandedFiling(expandedFiling === key ? null : key);
      return;
    }

    if (summaryCount >= DAILY_LIMIT) return;

    setSummarizing(key);
    setExpandedFiling(key);

    try {
      const res = await fetch("/api/filings/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: filing.url,
          filingType: filing.filingType,
          ticker: filing.ticker,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSummaries((prev) => ({ ...prev, [key]: data.summary }));
      const newCount = incrementSummaryCount();
      setSummaryCount(newCount);
    } catch (err) {
      setSummaries((prev) => ({
        ...prev,
        [key]: `요약 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
      }));
    } finally {
      setSummarizing(null);
    }
  }, [summaries, summaryCount, expandedFiling]);

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

  const remaining = DAILY_LIMIT - summaryCount;

  return (
    <div className="min-h-screen bg-[#f7f8fa] pb-20">
      <Header title="SEC 공시" />

      <div className="px-4 py-4 space-y-4">
        {/* Filter tabs + AI 잔여 횟수 */}
        <div className="flex items-center justify-between">
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
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            remaining > 0 ? "bg-blue-50 text-blue-500" : "bg-gray-100 text-gray-400"
          }`}>
            AI 요약 {remaining}/{DAILY_LIMIT}
          </span>
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
                  {tickerFilings.map((filing) => {
                    const key = filing.accessionNumber;
                    const hasSummary = !!summaries[key];
                    const isExpanded = expandedFiling === key;
                    const isSummarizing = summarizing === key;

                    return (
                      <div key={key}>
                        <div className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 mt-0.5 ${typeColors[filing.filingType] ?? "bg-gray-100 text-gray-600"}`}>
                              {filing.filingType}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-[#191919] leading-snug">{filing.title}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{filing.filedDate}</p>
                            </div>
                            <a
                              href={filing.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          </div>

                          {/* AI 요약 버튼 */}
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => handleSummarize(filing)}
                              disabled={isSummarizing || (!hasSummary && remaining <= 0)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                                isSummarizing
                                  ? "bg-gray-100 text-gray-400 cursor-wait"
                                  : hasSummary
                                    ? "bg-blue-50 text-blue-600"
                                    : remaining <= 0
                                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                      : "bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-[0.97]"
                              }`}
                            >
                              {isSummarizing ? (
                                <>
                                  <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                                  요약 중...
                                </>
                              ) : hasSummary ? (
                                <>
                                  <span>✦</span>
                                  {isExpanded ? "요약 접기" : "AI 요약 보기"}
                                </>
                              ) : remaining <= 0 ? (
                                "오늘 요약 횟수 소진"
                              ) : (
                                <>
                                  <span>✦</span>
                                  AI 요약
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* 요약 내용 */}
                        {isExpanded && summaries[key] && (
                          <div className="px-4 pb-3">
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-3 py-3">
                              <p className="text-[12px] text-[#191919] leading-relaxed whitespace-pre-wrap">
                                {summaries[key]}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
