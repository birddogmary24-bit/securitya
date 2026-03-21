"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BriefingCard from "@/components/BriefingCard";
import { DailyBriefing, StockHolding, Persona } from "@/lib/types";
import { getPortfolio } from "@/lib/portfolio";
import { getPersona } from "@/lib/persona";

function LoadingSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-4">
      <div className="skeleton h-6 w-48" />
      <div className="skeleton h-4 w-full" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-12">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-[#FEE500]"
          style={{
            animation: `pulse-dot 1.4s infinite ease-in-out`,
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}

function EmptyPortfolio() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#FEE500]/20 flex items-center justify-center mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FEE500" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-[#191919] mb-2">포트폴리오를 설정해주세요</h2>
      <p className="text-sm text-gray-400 mb-6">
        보유 종목을 등록하면 맞춤형 AI 브리핑을 받을 수 있어요
      </p>
      <button
        onClick={() => router.push("/portfolio")}
        className="bg-[#FEE500] text-[#191919] px-6 py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
      >
        종목 등록하기
      </button>
    </div>
  );
}

export default function HomePage() {
  const [portfolio, setPortfolio] = useState<StockHolding[]>([]);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPortfolio(getPortfolio());
    setPersona(getPersona());
  }, []);

  const fetchBriefing = useCallback(async (holdings: StockHolding[], userPersona: Persona | null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio: holdings, persona: userPersona }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "브리핑 생성 실패");
      }
      const data: DailyBriefing = await res.json();
      setBriefing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && portfolio.length > 0 && !briefing && !loading) {
      fetchBriefing(portfolio, persona);
    }
  }, [mounted, portfolio, persona, briefing, loading, fetchBriefing]);

  if (!mounted) return <LoadingSkeleton />;

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header title="AI 투자비서" />

      {portfolio.length === 0 ? (
        <EmptyPortfolio />
      ) : (
        <div className="px-4 py-4 space-y-4">
          {/* Date + source badge */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">{today}</p>
            {briefing && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                briefing.source === "gemini"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400"
              }`}>
                {briefing.source === "gemini" ? "✦ Gemini AI" : "⚠ Mock 데이터"}
              </span>
            )}
          </div>

          {/* Generated time + data source */}
          {briefing && (
            <div className="text-[11px] text-gray-400 space-y-0.5">
              <p>🕐 생성 시각: {briefing.generatedAt} KST</p>
              <p>📂 데이터 출처: {briefing.source === "gemini" ? `Gemini 1.5 Flash (AI 분석) · ${briefing.dataSource === "supabase" ? "Supabase DB" : "Mock 주가/뉴스"}` : "Mock 데이터 (실시간 미연동)"}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center">
              <LoadingDots />
              <p className="text-sm text-gray-400">AI가 브리핑을 생성하고 있어요...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <button
                onClick={() => fetchBriefing(portfolio, persona)}
                className="text-sm font-medium text-red-600 underline"
              >
                다시 시도
              </button>
            </div>
          ) : briefing ? (
            <>
              {/* Greeting */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <p className="text-[15px] font-medium text-[#191919] leading-relaxed">
                  {briefing.greeting}
                </p>
                <p className="text-[13px] text-gray-500 mt-2">{briefing.marketOverview}</p>
              </div>

              {/* Macro Alert */}
              {briefing.macroAlert && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-[13px] text-amber-700 font-medium">
                    <span className="mr-1">⚠️</span> {briefing.macroAlert}
                  </p>
                </div>
              )}

              {/* Briefing Cards */}
              <div className="space-y-3">
                {briefing.cards.map((card) => (
                  <BriefingCard key={card.ticker} card={card} />
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={() => fetchBriefing(portfolio, persona)}
                className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                브리핑 새로고침
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
