import { NextRequest } from "next/server";
import { StockHolding, BriefingCard, DailyBriefing, StockQuote, NewsItem, Persona, PERSONA_TRAITS, SecFiling } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { MOCK_QUOTES, MOCK_NEWS } from "@/lib/mock-data";

function buildPersonaPrompt(persona: Persona): string {
  const lines = PERSONA_TRAITS.map(
    (t) => `- ${t.label}: ${persona[t.key]}/5`
  );
  return `\n## 사용자 투자 성향\n${lines.join("\n")}\n\n이 사용자의 투자 성향을 고려하여 브리핑 톤과 선제적 제안을 맞춤화하세요.\n예: 장기투자 성향이 높으면 단기 변동보다 펀더멘털 변화에 초점.\n예: 배당주 성향이 높으면 배당 관련 뉴스를 우선 언급.\n예: 스캘핑 성향이 높으면 단기 가격 변동과 기술적 지표에 초점.`;
}

function getKSTString(): string {
  return new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Supabase에서 주가/뉴스/공시 가져오기, 실패하면 mock fallback
async function fetchMarketData(tickers: string[]): Promise<{
  quotes: Record<string, StockQuote>;
  news: NewsItem[];
  filings: SecFiling[];
  financials: Record<string, unknown>[];
  recommendations: Record<string, unknown>[];
  priceTargets: Record<string, unknown>[];
  upgrades: Record<string, unknown>[];
  earnings: Record<string, unknown>[];
  dataSource: "supabase" | "mock";
}> {
  try {
    const { data: quotesData, error: quotesError } = await supabase
      .from("stock_quotes")
      .select("*")
      .in("ticker", tickers);

    const { data: newsData, error: newsError } = await supabase
      .from("stock_news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(20);

    // SEC 공시 조회 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: filingsData } = await supabase
      .from("sec_filings")
      .select("*")
      .in("ticker", tickers)
      .gte("filed_date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("filed_date", { ascending: false })
      .limit(20);

    const { data: financialsData } = await supabase
      .from("stock_financials")
      .select("*")
      .in("ticker", tickers);

    const { data: recommendationsData } = await supabase
      .from("stock_recommendations")
      .select("*")
      .in("ticker", tickers);

    const { data: priceTargetsData } = await supabase
      .from("stock_price_targets")
      .select("*")
      .in("ticker", tickers);

    const { data: upgradesData } = await supabase
      .from("stock_upgrades")
      .select("*")
      .in("ticker", tickers)
      .gte("graded_at", new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0])
      .order("graded_at", { ascending: false });

    const nextWeek = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: earningsData } = await supabase
      .from("earnings_calendar")
      .select("*")
      .in("ticker", tickers)
      .gte("report_date", todayStr)
      .lte("report_date", nextWeek);

    if (quotesError || newsError || !quotesData?.length) {
      throw new Error("Supabase data unavailable");
    }

    const quotes: Record<string, StockQuote> = {};
    for (const q of quotesData) {
      quotes[q.ticker] = {
        ticker: q.ticker,
        price: q.price,
        change: q.change,
        changePercent: q.change_percent,
        previousClose: q.previous_close,
      };
    }

    const news: NewsItem[] = (newsData ?? []).map((n) => ({
      title: n.title,
      summary: n.summary,
      source: n.source,
      url: n.url ?? "#",
      publishedAt: n.published_at,
      relatedTickers: n.tickers ?? [],
      sentiment: n.sentiment,
    }));

    const filings: SecFiling[] = (filingsData ?? []).map((f) => ({
      id: f.id,
      ticker: f.ticker,
      cik: f.cik,
      filingType: f.filing_type,
      filedDate: f.filed_date,
      title: f.title,
      accessionNumber: f.accession_number,
      url: f.url,
    }));

    return {
      quotes, news, filings,
      financials: (financialsData ?? []) as Record<string, unknown>[],
      recommendations: (recommendationsData ?? []) as Record<string, unknown>[],
      priceTargets: (priceTargetsData ?? []) as Record<string, unknown>[],
      upgrades: (upgradesData ?? []) as Record<string, unknown>[],
      earnings: (earningsData ?? []) as Record<string, unknown>[],
      dataSource: "supabase",
    };
  } catch {
    return { quotes: MOCK_QUOTES, news: MOCK_NEWS, filings: [], financials: [], recommendations: [], priceTargets: [], upgrades: [], earnings: [], dataSource: "mock" };
  }
}

function buildFallbackBriefing(
  portfolio: StockHolding[],
  quotes: Record<string, StockQuote>,
  news: NewsItem[],
  filings: SecFiling[],
  dataSource: "supabase" | "mock"
): DailyBriefing {
  const tickers = portfolio.map((h) => h.ticker);

  const cards: BriefingCard[] = portfolio.map((holding) => {
    const quote = quotes[holding.ticker];
    const relatedNews = news.filter((n) => n.relatedTickers.includes(holding.ticker));
    const tickerFilings = filings.filter((f) => f.ticker === holding.ticker);
    const macroNews = news.filter((n) => n.relatedTickers.length === 0);

    const sentiment: "positive" | "negative" | "neutral" =
      quote && quote.changePercent > 1 ? "positive" :
      quote && quote.changePercent < -1 ? "negative" : "neutral";

    const summaryParts: string[] = [];
    if (quote) {
      const direction = quote.change >= 0 ? "상승" : "하락";
      summaryParts.push(`${holding.nameKr}은(는) 전일 대비 ${Math.abs(quote.changePercent).toFixed(2)}% ${direction}했습니다.`);
    }
    if (relatedNews.length > 0) summaryParts.push(relatedNews[0].summary);

    const crossImpactTickers = news
      .filter((n) => n.relatedTickers.includes(holding.ticker) && n.relatedTickers.length > 1)
      .flatMap((n) => n.relatedTickers)
      .filter((t) => t !== holding.ticker && tickers.includes(t));

    const keyPoints: string[] = [];
    if (relatedNews.length > 0) keyPoints.push(relatedNews[0].title);
    if (crossImpactTickers.length > 0) keyPoints.push(`연관 종목 영향: ${crossImpactTickers.join(", ")}`);
    if (quote) keyPoints.push(`현재가 $${quote.price.toFixed(2)} (${quote.change >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%)`);

    let proactiveSuggestion: string | undefined;
    if (macroNews.length > 0) proactiveSuggestion = `${macroNews[0].title} — 변동성 확대에 유의하세요.`;
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
      relatedNews: relatedNews.slice(0, 2),
      quote,
      recentFilings: tickerFilings.slice(0, 3),
    };
  });

  const macroAlert = news.find((n) => n.relatedTickers.length === 0);
  return {
    date: new Date().toISOString().split("T")[0],
    generatedAt: getKSTString(),
    greeting: "좋은 아침이에요! 밤사이 미국 시장 소식을 정리했어요.",
    marketOverview: "나스닥은 AI 반도체주 강세에 상승 마감했으나, FOMC 의사록 공개를 앞두고 변동성이 확대될 수 있습니다.",
    cards,
    macroAlert: macroAlert?.summary,
    source: dataSource === "supabase" ? "gemini" : "mock",
  };
}

export async function POST(request: NextRequest) {
  try {
    const { portfolio, persona } = (await request.json()) as { portfolio: StockHolding[]; persona?: Persona };
    if (!portfolio || portfolio.length === 0) {
      return Response.json({ error: "포트폴리오가 비어있습니다." }, { status: 400 });
    }

    const tickers = portfolio.map((h) => h.ticker);
    const { quotes, news, filings, financials, recommendations, priceTargets, upgrades, earnings, dataSource } = await fetchMarketData(tickers);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(buildFallbackBriefing(portfolio, quotes, news, filings, dataSource));
    }

    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const BRIEFING_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

      const portfolioInfo = portfolio.map((h) => {
        const q = quotes[h.ticker];
        return `- ${h.nameKr}(${h.ticker}): ${h.quantity}주 보유${q ? `, 현재가 $${q.price} (${q.change >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%)` : ""}`;
      }).join("\n");

      const relevantNews = news.filter(
        (n) => n.relatedTickers.some((t) => tickers.includes(t)) || n.relatedTickers.length === 0
      );
      const newsInfo = relevantNews
        .map((n) => `- [${n.source}] ${n.title}: ${n.summary} (관련: ${n.relatedTickers.join(", ") || "매크로"})`)
        .join("\n");

      const dataLabel = dataSource === "supabase" ? "Supabase DB (수집된 실시간 데이터)" : "Mock 데이터 (DB 미연동)";

      const personaSection = persona ? buildPersonaPrompt(persona) : "";

      // SEC 공시 정보
      const filingsInfo = filings.length > 0
        ? filings
            .map((f) => `- ${f.ticker}: ${f.filingType} — ${f.title} (${f.filedDate})`)
            .join("\n")
        : "최근 30일 내 관련 공시 없음";

      // 재무지표
      const financialsInfo = financials.length > 0
        ? financials
            .map((f) => `- ${f.ticker}: PER ${f.pe_ratio ?? "N/A"}, 배당수익률 ${f.dividend_yield ?? "N/A"}%, 52주 고가 $${f.week52_high ?? "N/A"}, 저가 $${f.week52_low ?? "N/A"}`)
            .join("\n")
        : null;

      // 월가 애널리스트 의견
      const recommendationsInfo = recommendations.length > 0
        ? recommendations
            .map((r) => `- ${r.ticker}: 강력매수 ${r.strong_buy ?? 0}, 매수 ${r.buy ?? 0}, 보유 ${r.hold ?? 0}, 매도 ${r.sell ?? 0}`)
            .join("\n")
        : null;

      // 목표가
      const priceTargetsInfo = priceTargets.length > 0
        ? priceTargets
            .map((p) => `- ${p.ticker}: 평균 목표가 $${p.target_mean ?? "N/A"} (최고 $${p.target_high ?? "N/A"}, 최저 $${p.target_low ?? "N/A"})`)
            .join("\n")
        : null;

      // 최근 투자등급 변경
      const upgradesInfo = upgrades.length > 0
        ? upgrades
            .map((u) => `- ${u.ticker}: ${u.company} → ${u.action} (${u.from_grade} → ${u.to_grade})`)
            .join("\n")
        : null;

      // 향후 2주 실적 발표 일정
      const earningsInfo = earnings.length > 0
        ? earnings
            .map((e) => `- ${e.ticker}: ${e.report_date} 실적 발표 예정 (EPS 예상: $${e.eps_estimate ?? "N/A"})`)
            .join("\n")
        : null;

      const prompt = `당신은 AI 투자 브리핑 어시스턴트입니다. 한국 개인 투자자를 위해 미국 주식 브리핑을 생성합니다.
데이터 출처: ${dataLabel}
${personaSection}

## 사용자 포트폴리오
${portfolioInfo}

## 최근 SEC 공시
${filingsInfo}

## 재무지표
${financialsInfo || "조회된 재무지표 없음"}

## 월가 애널리스트 의견
${recommendationsInfo || "조회된 의견 없음"}

## 목표가
${priceTargetsInfo || "조회된 목표가 없음"}

## 최근 투자등급 변경
${upgradesInfo || "최근 변경 없음"}

## 향후 2주 실적 발표 일정
${earningsInfo || "예정된 발표 없음"}

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

      let text = "";
      for (const modelName of BRIEFING_MODELS) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          text = result.response.text();
          break;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`Briefing model ${modelName} failed: ${msg}`);
          if (msg.includes("429") || msg.includes("404") || msg.includes("not found")) continue;
          throw err;
        }
      }
      if (!text) throw new Error("All AI models exhausted");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const briefingData = JSON.parse(jsonMatch ? jsonMatch[0] : text);

      const cards: BriefingCard[] = (briefingData.cards || []).map((card: Record<string, unknown>) => {
        const ticker = card.ticker as string;
        return {
          ticker,
          nameKr: card.nameKr as string,
          sentiment: card.sentiment as "positive" | "negative" | "neutral",
          summary: card.summary as string,
          keyPoints: (card.keyPoints || []) as string[],
          proactivesuggestion: (card.proactiveSuggestion || null) as string | undefined,
          relatedNews: news.filter((n) => n.relatedTickers.includes(ticker)).slice(0, 2),
          quote: quotes[ticker] || null,
          recentFilings: filings.filter((f) => f.ticker === ticker).slice(0, 3),
        };
      });

      return Response.json({
        date: new Date().toISOString().split("T")[0],
        generatedAt: getKSTString(),
        greeting: briefingData.greeting,
        marketOverview: briefingData.marketOverview,
        cards,
        macroAlert: briefingData.macroAlert || undefined,
        source: "gemini",
        dataSource,
      } as DailyBriefing);

    } catch (aiError) {
      console.error("Gemini API error, falling back:", aiError);
      return Response.json(buildFallbackBriefing(portfolio, quotes, news, filings, dataSource));
    }
  } catch (error) {
    console.error("Briefing generation error:", error);
    return Response.json(
      { error: `브리핑 생성 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
