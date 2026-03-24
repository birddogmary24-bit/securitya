"use client";

import { useState } from "react";
import Link from "next/link";
import { BriefingCard as BriefingCardType } from "@/lib/types";
import StockLogo from "./StockLogo";

const sentimentConfig = {
  positive: {
    border: "border-[#B8733A]/30",
    badge: "bg-green-50 text-green-700 border border-green-200",
    label: "긍정",
    dot: "bg-green-500",
    tooltip: "최근 뉴스·지표가 전반적으로 긍정적이에요. 상승 흐름이 감지됩니다!",
  },
  negative: {
    border: "border-red-200/50",
    badge: "bg-red-50 text-red-700 border border-red-200",
    label: "부정",
    dot: "bg-red-500",
    tooltip: "최근 부정적 신호가 감지됐어요. 하락 리스크에 주의가 필요합니다.",
  },
  neutral: {
    border: "border-amber-200/50",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    label: "주의",
    dot: "bg-amber-500",
    tooltip: "방향성이 뚜렷하지 않아요. 추가 정보를 기다리며 관망하는 것도 방법!",
  },
};

function SentimentTooltip({ sentiment }: { sentiment: "positive" | "negative" | "neutral" }) {
  const [open, setOpen] = useState(false);
  const config = sentimentConfig[sentiment];

  return (
    <div className="relative inline-flex items-center gap-1">
      <span className={`text-[12px] px-2.5 py-1 rounded-full font-semibold ${config.badge}`}>
        {config.label}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center hover:bg-gray-300 transition-colors"
        aria-label="센티먼트 설명"
      >
        i
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-56 bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-[12px] text-gray-600 leading-relaxed">
            {config.tooltip}
          </div>
        </>
      )}
    </div>
  );
}

export default function BriefingCard({ card }: { card: BriefingCardType }) {
  const [expanded, setExpanded] = useState(false);
  const config = sentimentConfig[card.sentiment];
  const quote = card.quote;

  // 키 서머리 문장 생성
  const keySummary = quote
    ? `${card.nameKr}은(는) 전일대비 ${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}% ${quote.changePercent >= 0 ? "상승" : "하락"}했어요`
    : null;

  // 유머 제안 (sentiment 기반)
  const humorAction = card.sentiment === "positive"
    ? "사거에요? 🐕"
    : card.sentiment === "negative"
    ? "팔거에요? 🐕"
    : "홀딩해요? 🐕";

  // 상세 콘텐츠 존재 여부
  const hasDetail = card.summary || card.keyPoints.length > 0 || card.proactivesuggestion ||
    (card.recentFilings && card.recentFilings.length > 0) || card.relatedNews.length > 0;

  return (
    <div className={`rounded-2xl border ${config.border} bg-white p-5 shadow-sm`}>
      {/* Header: Logo + Name + Ticker + Sentiment */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StockLogo ticker={card.ticker} logoUrl={card.logoUrl} size={36} />
          <div>
            <span className="font-bold text-[17px] text-[#2C1810]">{card.nameKr}</span>
            <span className="text-[13px] text-gray-400 ml-2">{card.ticker}</span>
          </div>
          <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
        </div>
        <SentimentTooltip sentiment={card.sentiment} />
      </div>

      {/* Key Summary - 항상 표시 */}
      {keySummary && (
        <p className="text-[16px] font-extrabold text-[#2C1810] leading-snug mt-3">
          {keySummary}
        </p>
      )}

      {/* Quote: Price + Change - 항상 표시 */}
      {quote && (
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-xl font-bold text-[#2C1810]">${quote.price.toFixed(2)}</span>
          <span className={`text-[14px] font-semibold ${quote.change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.change >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)
          </span>
        </div>
      )}

      {/* 요약 한줄 미리보기 (접힌 상태) */}
      {!expanded && card.summary && (
        <p className="text-[13px] text-gray-500 mt-2 line-clamp-2">{card.summary}</p>
      )}

      {/* 더보기/접기 버튼 */}
      {hasDetail && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-[13px] font-semibold text-[#B8733A] hover:text-[#7A3E1A] transition-colors flex items-center gap-1"
        >
          {expanded ? "접기" : "상세 보기"}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {/* 펼쳐지는 상세 콘텐츠 */}
      {expanded && (
        <div className="space-y-4 mt-3 pt-3 border-t border-gray-100">
          {/* Summary (AI 분석) */}
          {card.summary && (
            <p className="text-[14px] text-gray-700 leading-relaxed">{card.summary}</p>
          )}

          {/* Key Points */}
          {card.keyPoints.length > 0 && (
            <ul className="space-y-2">
              {card.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] text-gray-600">
                  <span className="text-[#B8733A] mt-0.5 shrink-0">&#8226;</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Proactive Suggestion - 메리의 한마디 */}
          {card.proactivesuggestion && (
            <div className="bg-[#FFF5EC] rounded-xl px-4 py-3 border border-[#B8733A]/20">
              <p className="text-[13px] font-medium text-[#2C1810]">
                <span className="mr-1">🐶</span> {card.proactivesuggestion}
              </p>
              <p className="text-[12px] text-[#B8733A] font-bold mt-1.5">{humorAction}</p>
            </div>
          )}

          {/* SEC Filings */}
          {card.recentFilings && card.recentFilings.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-[12px] text-gray-400 font-semibold">최신 공시</p>
              {card.recentFilings.slice(0, 2).map((filing, i) => {
                const typeColor =
                  filing.filingType === "10-K" ? "bg-blue-50 text-blue-600 border border-blue-200" :
                  filing.filingType === "10-Q" ? "bg-green-50 text-green-600 border border-green-200" :
                  "bg-orange-50 text-orange-600 border border-orange-200";
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-semibold shrink-0 ${typeColor}`}>
                      {filing.filingType}
                    </span>
                    <p className="text-[13px] text-gray-500 leading-snug">
                      {filing.title} ({filing.filedDate})
                    </p>
                  </div>
                );
              })}
              <Link
                href={`/filings?ticker=${card.ticker}`}
                className="text-[12px] text-[#B8733A] font-semibold hover:underline"
              >
                공시 전체보기 &rarr;
              </Link>
            </div>
          )}

          {/* Related News - 링크 클릭 가능 */}
          {card.relatedNews.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-[12px] text-gray-400 font-semibold">관련 뉴스</p>
              {card.relatedNews.slice(0, 2).map((news, i) => (
                <div key={i} className="text-[13px] text-gray-600 leading-snug">
                  <span className="text-gray-400">[{news.source}]</span>{" "}
                  {news.url ? (
                    <a
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#B8733A] hover:underline"
                    >
                      {news.title}
                    </a>
                  ) : (
                    <span>{news.title}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
