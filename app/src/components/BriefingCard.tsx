"use client";

import { BriefingCard as BriefingCardType } from "@/lib/types";

const sentimentConfig = {
  positive: { bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700", label: "긍정", dot: "bg-green-500" },
  negative: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", label: "부정", dot: "bg-red-500" },
  neutral: { bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700", label: "주의", dot: "bg-yellow-500" },
};

export default function BriefingCard({ card }: { card: BriefingCardType }) {
  const config = sentimentConfig[card.sentiment];
  const quote = card.quote;

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className="font-semibold text-[15px] text-[#191919]">{card.nameKr}</span>
          <span className="text-xs text-gray-400">{card.ticker}</span>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
          {config.label}
        </span>
      </div>

      {/* Quote */}
      {quote && (
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-[#191919]">${quote.price.toFixed(2)}</span>
          <span className={`text-sm font-medium ${quote.change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.change >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)
          </span>
        </div>
      )}

      {/* Summary */}
      <p className="text-[13px] text-gray-700 leading-relaxed">{card.summary}</p>

      {/* Key Points */}
      {card.keyPoints.length > 0 && (
        <ul className="space-y-1.5">
          {card.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
              <span className="text-gray-400 mt-0.5 shrink-0">&#8226;</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Proactive Suggestion */}
      {card.proactivesuggestion && (
        <div className="bg-[#FEE500]/20 rounded-xl px-3 py-2.5 border border-[#FEE500]/40">
          <p className="text-[12px] font-medium text-[#191919]">
            <span className="mr-1">💡</span> {card.proactivesuggestion}
          </p>
        </div>
      )}

      {/* Related News */}
      {card.relatedNews.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-gray-200/50">
          <p className="text-[11px] text-gray-400 font-medium">관련 뉴스</p>
          {card.relatedNews.slice(0, 2).map((news, i) => (
            <p key={i} className="text-[12px] text-gray-500 leading-snug">
              <span className="text-gray-400">[{news.source}]</span> {news.title}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
