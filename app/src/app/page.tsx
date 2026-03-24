"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BriefingCard from "@/components/BriefingCard";
import { DailyBriefing, StockHolding, Persona } from "@/lib/types";
import { getPortfolio } from "@/lib/portfolio";
import { getPersona } from "@/lib/persona";
import { mergeLogos } from "@/lib/logo-cache";

function LoadingSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-4">
      <div className="skeleton h-7 w-52" />
      <div className="skeleton h-5 w-full" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-52 w-full rounded-2xl" />
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
          className="w-3 h-3 rounded-full bg-[#B8733A]"
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
      <div className="w-20 h-20 rounded-full bg-[#FFF5EC] flex items-center justify-center mb-4 border border-[#B8733A]/20">
        <span className="text-3xl">🐶</span>
      </div>
      <h2 className="text-lg font-bold text-[#2C1810] mb-2">관심종목을 등록해주세요!</h2>
      <p className="text-[14px] text-gray-400 mb-6">
        종목을 등록하면 메리가 맞춤 브리핑을 해드릴게요
      </p>
      <button
        onClick={() => router.push("/portfolio")}
        className="bg-[#B8733A] text-white px-6 py-3 rounded-xl text-[14px] font-bold active:scale-[0.98] transition-transform shadow-sm"
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

  const fetchBriefing = useCallback(async (holdings: StockHolding[], userPersona: Persona | null, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio: holdings, persona: userPersona, forceRefresh }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "브리핑 생성 실패");
      }
      const data: DailyBriefing = await res.json();
      // 브리핑 응답의 로고 URL을 캐시에 저장
      const logos: Record<string, string> = {};
      for (const card of data.cards) {
        if (card.logoUrl) logos[card.ticker] = card.logoUrl;
      }
      if (Object.keys(logos).length > 0) mergeLogos(logos);
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
    <div className="min-h-screen bg-[#FDF8F3]">
      <Header title="사냥개 메리" />

      {portfolio.length === 0 ? (
        <EmptyPortfolio />
      ) : (
        <div className="px-4 py-4 space-y-4">
          {/* Date + source badge */}
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-gray-400">{today}</p>
            {briefing && (
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                briefing.source === "gemini"
                  ? "bg-[#FFF5EC] text-[#B8733A] border border-[#B8733A]/20"
                  : "bg-gray-100 text-gray-400"
              }`}>
                {briefing.source === "gemini" ? "Gemini AI" : "Mock"}
              </span>
            )}
          </div>

          {/* Generated time + data source */}
          {briefing && (
            <div className="text-[12px] text-gray-400 space-y-0.5">
              <p>생성: {briefing.generatedAt} KST{briefing.cached ? ` (캐시 · ${briefing.cachedAt})` : ""}</p>
              <p>출처: {briefing.source === "gemini" ? `Gemini 2.5 Flash · ${briefing.dataSource === "supabase" ? "Supabase DB" : "Mock"}` : "Mock 데이터"}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center">
              <LoadingDots />
              <p className="text-[14px] text-[#B8733A] font-medium">메리가 브리핑을 준비하고 있어요...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-[14px] text-red-600 mb-3">{error}</p>
              <button
                onClick={() => fetchBriefing(portfolio, persona)}
                className="text-[14px] font-semibold text-red-600 underline"
              >
                다시 시도
              </button>
            </div>
          ) : briefing ? (
            <>
              {/* Greeting */}
              <div className="bg-white rounded-2xl p-5 border border-[#B8733A]/10 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">🐶</span>
                  <div>
                    <p className="text-[16px] font-bold text-[#2C1810] leading-relaxed">
                      {briefing.greeting}
                    </p>
                    <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">{briefing.marketOverview}</p>
                  </div>
                </div>
              </div>

              {/* Macro Alert */}
              {briefing.macroAlert && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-[14px] text-amber-700 font-semibold">
                    <span className="mr-1">⚠️</span> {briefing.macroAlert}
                  </p>
                </div>
              )}

              {/* Briefing Cards */}
              <div className="space-y-4">
                {briefing.cards.map((card) => (
                  <BriefingCard key={card.ticker} card={card} />
                ))}
              </div>

              {/* Refresh */}
              <div className="flex gap-2">
                <button
                  onClick={() => fetchBriefing(portfolio, persona)}
                  className="flex-1 py-3 text-[14px] text-gray-400 hover:text-[#B8733A] transition-colors rounded-xl"
                >
                  브리핑 새로고침
                </button>
                {briefing.cached && (
                  <button
                    onClick={() => fetchBriefing(portfolio, persona, true)}
                    className="py-3 px-4 text-[14px] text-[#B8733A] hover:text-[#7A3E1A] transition-colors font-bold rounded-xl"
                  >
                    AI 새로 생성
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
