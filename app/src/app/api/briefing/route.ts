import { NextRequest } from "next/server";
import { StockHolding, BriefingCard, DailyBriefing } from "@/lib/types";
import { MOCK_QUOTES, MOCK_NEWS } from "@/lib/mock-data";

function generateFallbackBriefing(portfolio: StockHolding[]): DailyBriefing {
  const tickers = portfolio.map((h) => h.ticker);

  const cards: BriefingCard[] = portfolio.map((holding) => {
    const quote = MOCK_QUOTES[holding.ticker];
    const news = MOCK_NEWS.filter((n) => n.relatedTickers.includes(holding.ticker));
    const macroNews = MOCK_NEWS.filter((n) => n.relatedTickers.length === 0);

    const sentiment: "positive" | "negative" | "neutral" =
      quote && quote.changePercent > 1 ? "positive" :
      quote && quote.changePercent < -1 ? "negative" : "neutral";

    const summaryParts: string[] = [];
    if (quote) {
      const direction = quote.change >= 0 ? "상승" : "하락";
      summaryParts.push(`${holding.nameKr}은(는) 전일 대비 ${Math.abs(quote.changePercent).toFixed(2)}% ${direction}했습니다.`);
    }
    if (news.length > 0) {
      summaryParts.push(news[0].summary);
    }

    // Check cross-impact
    const crossImpactTickers = MOCK_NEWS
      .filter((n) => n.relatedTickers.includes(holding.ticker) && n.relatedTickers.length > 1)
      .flatMap((n) => n.relatedTickers)
      .filter((t) => t !== holding.ticker && tickers.includes(t));

    const keyPoints: string[] = [];
    if (news.length > 0) keyPoints.push(news[0].title);
    if (crossImpactTickers.length > 0) {
      keyPoints.push(`연관 종목 영향: ${crossImpactTickers.join(", ")}`);
    }
    if (quote) {
      keyPoints.push(`현재가 $${quote.price.toFixed(2)} (${quote.change >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%)`);
    }

    let proactiveSuggestion: string | undefined;
    if (macroNews.length > 0) {
      proactiveSuggestion = `${macroNews[0].title} — 변동성 확대에 유의하세요.`;
    }
    if (sentiment === "negative" && quote && Math.abs(quote.changePercent) > 2) {
      proactiveSuggestion = `${holding.nameKr} ${Math.abs(quote.changePercent).toFixed(1)}% 하락 중 — 손절라인을 점검해보세요.`;
    }

    return {
      ticker: holding.ticker,
      nameKr: holding.nameKr,
      sentiment,
      summary: summaryParts.join(" "),
      keyPoints,
      proactivesuggestion: proactiveSuggestion,
      relatedNews: news.slice(0, 2),
      quote,
    };
  });

  const macroAlert = MOCK_NEWS.find((n) => n.relatedTickers.length === 0);

  return {
    date: new Date().toISOString().split("T")[0],
    greeting: "좋은 아침이에요! 밤사이 미국 시장 소식을 정리했어요.",
    marketOverview: "나스닥은 AI 반도체주 강세에 상승 마감했으나, FOMC 의사록 공개를 앞두고 변동성이 확대될 수 있습니다.",
    cards,
    macroAlert: macroAlert ? macroAlert.summary : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { portfolio } = (await request.json()) as { portfolio: StockHolding[] };

    if (!portfolio || portfolio.length === 0) {
      return Response.json({ error: "포트폴리오가 비어있습니다." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // If no API key, use fallback
    if (!apiKey) {
      const briefing = generateFallbackBriefing(portfolio);
      return Response.json(briefing);
    }

    // Try Claude API
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const anthropic = new Anthropic({ apiKey });

      const tickers = portfolio.map((h) => h.ticker);

      const relevantNews = MOCK_NEWS.filter(
        (n) => n.relatedTickers.some((t) => tickers.includes(t)) || n.relatedTickers.length === 0
      );

      const portfolioInfo = portfolio
        .map((h) => {
          const q = MOCK_QUOTES[h.ticker];
          return `- ${h.nameKr}(${h.ticker}): ${h.quantity}주 보유${q ? `, 현재가 $${q.price} (${q.change >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%)` : ""}`;
        })
        .join("\n");

      const newsInfo = relevantNews
        .map((n) => `- [${n.source}] ${n.title}: ${n.summary} (관련: ${n.relatedTickers.join(", ") || "매크로"})`)
        .join("\n");

      const prompt = `당신은 A증권사의 AI 투자 브리핑 어시스턴트입니다. 한국 개인 투자자를 위해 미국 주식 브리핑을 생성합니다.

## 사용자 포트폴리오
${portfolioInfo}

## 오늘의 주요 뉴스/이벤트
${newsInfo}

## 요청
위 포트폴리오와 뉴스를 바탕으로 오늘의 AI 브리핑을 생성해주세요. 반드시 아래 JSON 형식으로만 응답하세요.

## 출력 형식 (JSON)
{
  "greeting": "간단한 인사 (예: 좋은 아침이에요! 밤사이 시장 소식을 정리했어요.)",
  "marketOverview": "전체 시장 요약 1-2문장",
  "macroAlert": "매크로 이벤트 경고 (없으면 null)",
  "cards": [
    {
      "ticker": "종목 티커",
      "nameKr": "한국어 종목명",
      "sentiment": "positive|negative|neutral",
      "summary": "해당 종목의 오늘 핵심 요약 (2-3문장, 자연스러운 한국어)",
      "keyPoints": ["핵심 포인트 1", "핵심 포인트 2"],
      "proactiveSuggestion": "선제적 제안 또는 null",
      "relatedTickers": ["연쇄 영향 받는 다른 종목 티커"]
    }
  ]
}

## 규칙
- 포트폴리오에 있는 각 종목에 대해 카드를 생성
- 종목 간 연쇄 영향이 있으면 반드시 언급
- 선제적 제안은 실질적이고 구체적으로
- 투자 조언이 아닌 정보 제공에 집중
- JSON만 출력 (다른 텍스트 없이)`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type !== "text") {
        throw new Error("AI 응답 형식 오류");
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      const briefingData = JSON.parse(jsonMatch ? jsonMatch[0] : content.text);

      const cards: BriefingCard[] = (briefingData.cards || []).map((card: Record<string, unknown>) => {
        const ticker = card.ticker as string;
        return {
          ticker,
          nameKr: card.nameKr as string,
          sentiment: card.sentiment as "positive" | "negative" | "neutral",
          summary: card.summary as string,
          keyPoints: (card.keyPoints || []) as string[],
          proactivesuggestion: (card.proactiveSuggestion || null) as string | undefined,
          relatedNews: MOCK_NEWS.filter((n) => n.relatedTickers.includes(ticker)),
          quote: MOCK_QUOTES[ticker] || null,
        };
      });

      const briefing: DailyBriefing = {
        date: new Date().toISOString().split("T")[0],
        greeting: briefingData.greeting,
        marketOverview: briefingData.marketOverview,
        cards,
        macroAlert: briefingData.macroAlert || undefined,
      };

      return Response.json(briefing);
    } catch (aiError) {
      console.error("Claude API error, falling back:", aiError);
      const briefing = generateFallbackBriefing(portfolio);
      return Response.json(briefing);
    }
  } catch (error) {
    console.error("Briefing generation error:", error);
    return Response.json(
      { error: `브리핑 생성 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
