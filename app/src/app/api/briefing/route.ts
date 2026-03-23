import { NextRequest } from "next/server";
import { StockHolding, BriefingCard, DailyBriefing, StockQuote, NewsItem, SecFiling } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { MOCK_QUOTES, MOCK_NEWS } from "@/lib/mock-data";

// --- 유틸리티 ---

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

function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

// --- 종목별 캐시 조회 ---

/** 종목별 캐시된 분석 조회 */
async function getCachedStockAnalysis(tickers: string[]): Promise<Record<string, {
  sentiment: string;
  summary: string;
  keyPoints: string[];
  proactiveSuggestion: string | null;
  relatedTickers: string[];
}>> {
  const today = todayKST();

  const { data } = await supabase
    .from("stock_analysis_cache")
    .select("*")
    .in("ticker", tickers)
    .eq("analysis_date", today);

  const result: Record<string, {
    sentiment: string;
    summary: string;
    keyPoints: string[];
    proactiveSuggestion: string | null;
    relatedTickers: string[];
  }> = {};
  for (const row of data ?? []) {
    result[row.ticker] = {
      sentiment: row.sentiment,
      summary: row.summary,
      keyPoints: row.key_points,
      proactiveSuggestion: row.proactive_suggestion,
      relatedTickers: row.related_tickers,
    };
  }
  return result;
}

/** 시장 전체 분석 조회 */
async function getCachedMarketOverview(): Promise<{
  greeting: string;
  marketOverview: string;
  macroAlert: string | null;
} | null> {
  const today = todayKST();

  const { data } = await supabase
    .from("market_overview_cache")
    .select("*")
    .eq("analysis_date", today)
    .single();

  if (!data) return null;
  return {
    greeting: data.greeting,
    marketOverview: data.market_overview,
    macroAlert: data.macro_alert,
  };
}

// --- 시장 데이터 조회 ---

async function fetchMarketData(tickers: string[]): Promise<{
  quotes: Record<string, StockQuote>;
  news: NewsItem[];
  filings: SecFiling[];
  logoUrls: Record<string, string>;
  dataSource: "supabase" | "mock";
}> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const [quotesRes, newsRes, filingsRes, profilesRes] = await Promise.all([
      supabase.from("stock_quotes").select("*").in("ticker", tickers),
      supabase.from("stock_news").select("*").order("published_at", { ascending: false }).limit(20),
      supabase.from("sec_filings").select("*").in("ticker", tickers)
        .gte("filed_date", thirtyDaysAgoStr).order("filed_date", { ascending: false }).limit(20),
      supabase.from("stock_profiles").select("ticker, logo_url").in("ticker", tickers),
    ]);

    const quotesData = quotesRes.data;
    const newsData = newsRes.data;

    if (quotesRes.error || newsRes.error || !quotesData?.length) {
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

    const filings: SecFiling[] = (filingsRes.data ?? []).map((f) => ({
      id: f.id,
      ticker: f.ticker,
      cik: f.cik,
      filingType: f.filing_type,
      filedDate: f.filed_date,
      title: f.title,
      accessionNumber: f.accession_number,
      url: f.url,
    }));

    const logoUrls: Record<string, string> = {};
    for (const p of profilesRes.data ?? []) {
      if (p.logo_url) logoUrls[p.ticker] = p.logo_url;
    }

    return { quotes, news, filings, logoUrls, dataSource: "supabase" };
  } catch {
    return { quotes: MOCK_QUOTES, news: MOCK_NEWS, filings: [], logoUrls: {}, dataSource: "mock" };
  }
}

// --- Fallback 카드 생성 (캐시 미스 시) ---

function buildSingleFallbackCard(
  holding: StockHolding,
  quotes: Record<string, StockQuote>,
  news: NewsItem[],
  filings: SecFiling[],
): BriefingCard {
  const quote = quotes[holding.ticker];
  const relatedNews = news.filter((n) => n.relatedTickers.includes(holding.ticker));
  const tickerFilings = filings.filter((f) => f.ticker === holding.ticker);

  const sentiment: "positive" | "negative" | "neutral" =
    quote && quote.changePercent > 1 ? "positive" :
    quote && quote.changePercent < -1 ? "negative" : "neutral";

  const summaryParts: string[] = [];
  if (quote) {
    const direction = quote.change >= 0 ? "상승" : "하락";
    summaryParts.push(`${holding.nameKr}은(는) 전일 대비 ${Math.abs(quote.changePercent).toFixed(2)}% ${direction}했습니다.`);
  }
  if (relatedNews.length > 0) summaryParts.push(relatedNews[0].summary);

  const keyPoints: string[] = [];
  if (relatedNews.length > 0) keyPoints.push(relatedNews[0].title);
  if (quote) keyPoints.push(`현재가 $${quote.price.toFixed(2)} (${quote.change >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%)`);

  return {
    ticker: holding.ticker,
    nameKr: holding.nameKr,
    sentiment,
    summary: summaryParts.join(" ") || `${holding.nameKr} 데이터를 확인 중입니다.`,
    keyPoints,
    proactivesuggestion: undefined,
    relatedNews: relatedNews.slice(0, 2),
    quote,
    recentFilings: tickerFilings.slice(0, 3),
  };
}

// --- POST 핸들러 ---

export async function POST(request: NextRequest) {
  try {
    const { portfolio, forceRefresh } = (await request.json()) as {
      portfolio: StockHolding[];
      persona?: unknown;
      forceRefresh?: boolean;
    };
    if (!portfolio || portfolio.length === 0) {
      return Response.json({ error: "포트폴리오가 비어있습니다." }, { status: 400 });
    }

    const tickers = portfolio.map((h) => h.ticker);

    // 1. 캐시된 종목별 분석 + 시장 분석 + 시장 데이터를 병렬 조회
    const [cachedAnalysis, marketOverview, marketData] = await Promise.all([
      forceRefresh ? Promise.resolve({} as Awaited<ReturnType<typeof getCachedStockAnalysis>>) : getCachedStockAnalysis(tickers),
      getCachedMarketOverview(),
      fetchMarketData(tickers),
    ]);

    const { quotes, news, filings, logoUrls, dataSource } = marketData;

    // 2. 캐시 HIT/MISS 분리
    const cachedTickers = Object.keys(cachedAnalysis);

    // 3. 포트폴리오 순서대로 카드 조합
    const cards: BriefingCard[] = portfolio.map((h) => {
      const logoUrl = logoUrls[h.ticker] || undefined;
      const analysis = cachedAnalysis[h.ticker];
      if (analysis) {
        // 캐시 HIT — 사전 생성된 AI 분석 사용
        return {
          ticker: h.ticker,
          nameKr: h.nameKr,
          logoUrl,
          sentiment: analysis.sentiment as "positive" | "negative" | "neutral",
          summary: analysis.summary,
          keyPoints: analysis.keyPoints,
          proactivesuggestion: analysis.proactiveSuggestion || undefined,
          relatedNews: news.filter((n) => n.relatedTickers.includes(h.ticker)).slice(0, 2),
          quote: quotes[h.ticker] || undefined,
          recentFilings: filings.filter((f) => f.ticker === h.ticker).slice(0, 3),
        };
      }
      // 캐시 MISS — fallback 카드
      const fallback = buildSingleFallbackCard(h, quotes, news, filings);
      fallback.logoUrl = logoUrl;
      return fallback;
    });

    // 4. 결과 조합
    const result: DailyBriefing = {
      date: new Date().toISOString().split("T")[0],
      generatedAt: getKSTString(),
      greeting: marketOverview?.greeting || "좋은 아침이에요! 밤사이 미국 시장 소식을 정리했어요.",
      marketOverview: marketOverview?.marketOverview || "시장 데이터를 분석 중입니다.",
      cards,
      macroAlert: marketOverview?.macroAlert || undefined,
      source: cachedTickers.length > 0 ? "gemini" : (dataSource === "supabase" ? "gemini" : "mock"),
      dataSource,
      cached: cachedTickers.length > 0,
      cachedAt: cachedTickers.length > 0 ? getKSTString() : undefined,
    };

    return Response.json(result);
  } catch (error) {
    console.error("Briefing generation error:", error);
    return Response.json(
      { error: `브리핑 생성 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
