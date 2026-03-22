/**
 * 종목별 AI 분석 사전 생성 스크립트 (GitHub Actions에서 Finnhub 수집 후 실행)
 *
 * - Tier 1+2 개별주식 (약 150개) 대상
 * - Gemini 2.5 Flash로 종목별 분석 생성
 * - stock_analysis_cache 테이블에 저장
 * - market_overview_cache에 시장 전체 분석 저장
 *
 * 실행: npx tsx scripts/generate-stock-analysis.ts
 * 환경변수: GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { getAnalysisTargetStocks } from "../src/lib/stock-tiers";
import { supabase } from "../src/lib/supabase";
import crypto from "crypto";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
const BATCH_SIZE = 2;    // 동시 Gemini 호출 수 (무료 Tier 10 RPM 대응)
const DELAY_MS = 13000;  // 배치 간 딜레이 (2req/13sec ≈ 9.2 RPM)

function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** DB 데이터의 freshness 해시 생성 (특정 종목) */
async function getTickerFreshnessKey(ticker: string): Promise<string> {
  const [quotesRes, newsRes, filingsRes] = await Promise.all([
    supabase.from("stock_quotes").select("updated_at").eq("ticker", ticker).limit(1),
    supabase.from("stock_news").select("published_at")
      .contains("tickers", [ticker]).order("published_at", { ascending: false }).limit(1),
    supabase.from("sec_filings").select("filed_date")
      .eq("ticker", ticker).order("filed_date", { ascending: false }).limit(1),
  ]);

  const parts = [
    quotesRes.data?.[0]?.updated_at ?? "no-quote",
    newsRes.data?.[0]?.published_at ?? "no-news",
    filingsRes.data?.[0]?.filed_date ?? "no-filing",
  ];
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16);
}

/** 이미 최신 분석이 있는지 확인 */
async function hasUpToDateAnalysis(ticker: string, date: string, freshnessKey: string): Promise<boolean> {
  const { data } = await supabase
    .from("stock_analysis_cache")
    .select("data_freshness_key")
    .eq("ticker", ticker)
    .eq("analysis_date", date)
    .limit(1)
    .single();

  return data?.data_freshness_key === freshnessKey;
}

/** 종목 데이터를 DB에서 조회 */
async function fetchStockData(ticker: string) {
  const [quote, financials, recommendations, priceTargets, news, filings] = await Promise.all([
    supabase.from("stock_quotes").select("*").eq("ticker", ticker).single(),
    supabase.from("stock_financials").select("*").eq("ticker", ticker).single(),
    supabase.from("stock_recommendations").select("*").eq("ticker", ticker).single(),
    supabase.from("stock_price_targets").select("*").eq("ticker", ticker).single(),
    supabase.from("stock_news").select("*")
      .contains("tickers", [ticker]).order("published_at", { ascending: false }).limit(5),
    supabase.from("sec_filings").select("*")
      .eq("ticker", ticker).order("filed_date", { ascending: false }).limit(3),
  ]);

  return {
    quote: quote.data,
    financials: financials.data,
    recommendations: recommendations.data,
    priceTargets: priceTargets.data,
    news: news.data ?? [],
    filings: filings.data ?? [],
  };
}

type StockData = Awaited<ReturnType<typeof fetchStockData>>;

/** 단일 종목 분석 프롬프트 */
function buildSingleStockPrompt(ticker: string, nameKr: string, data: StockData): string {
  const q = data.quote;
  const f = data.financials;
  const r = data.recommendations;
  const pt = data.priceTargets;

  const quoteInfo = q
    ? `현재가 $${q.price} (${q.change >= 0 ? "+" : ""}${q.change_percent?.toFixed(2)}%), 전일 $${q.previous_close}`
    : "시세 정보 없음";

  const financialsInfo = f
    ? `PER ${f.pe_ratio ?? "N/A"}, 배당수익률 ${f.dividend_yield ?? "N/A"}%, 52주 고가 $${f.week52_high ?? "N/A"} 저가 $${f.week52_low ?? "N/A"}, 베타 ${f.beta ?? "N/A"}`
    : "재무지표 없음";

  const recsInfo = r
    ? `강력매수 ${r.strong_buy ?? 0}, 매수 ${r.buy ?? 0}, 보유 ${r.hold ?? 0}, 매도 ${r.sell ?? 0}, 강력매도 ${r.strong_sell ?? 0}`
    : "의견 없음";

  const targetInfo = pt
    ? `평균 $${pt.target_mean ?? "N/A"} (최고 $${pt.target_high ?? "N/A"}, 최저 $${pt.target_low ?? "N/A"})`
    : "목표가 없음";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const newsInfo = data.news.length > 0
    ? data.news.map((n: any) => `- [${n.source}] ${n.title}: ${n.summary}`).join("\n")
    : "최근 뉴스 없음";

  const filingsInfo = data.filings.length > 0
    ? data.filings.map((f: any) => `- ${f.filing_type}: ${f.title} (${f.filed_date})`).join("\n")
    : "최근 공시 없음";
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return `당신은 한국 개인투자자를 위한 미국 주식 분석 AI입니다.
아래 데이터를 바탕으로 ${nameKr}(${ticker})의 오늘 분석을 JSON으로 생성하세요.

## 시세
${quoteInfo}

## 재무지표
${financialsInfo}

## 월가 애널리스트 의견
${recsInfo}

## 목표가
${targetInfo}

## 최근 뉴스
${newsInfo}

## 최근 SEC 공시
${filingsInfo}

## 출력 형식 (JSON만 출력, 다른 텍스트 없이)
{
  "sentiment": "positive|negative|neutral",
  "summary": "핵심 요약 2-3문장 (자연스러운 한국어)",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2"],
  "proactiveSuggestion": "선제적 제안 또는 null",
  "relatedTickers": ["연관 종목 티커"]
}

## 규칙
- 투자 조언이 아닌 정보 제공에 집중
- 수치는 정확하게 인용
- 선제적 제안은 구체적으로
- JSON만 출력`;
}

/** Gemini API 호출 (모델 fallback) */
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Model ${modelName} failed: ${msg}`);
      if (msg.includes("429") || msg.includes("404") || msg.includes("not found")) continue;
      throw err;
    }
  }
  throw new Error("All Gemini models exhausted");
}

/** 시장 전체 분석 생성 */
async function generateMarketOverview(date: string): Promise<void> {
  const { data: generalNews } = await supabase
    .from("stock_news")
    .select("title, summary")
    .eq("category", "general")
    .order("published_at", { ascending: false })
    .limit(10);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const newsContext = (generalNews ?? [])
    .map((n: any) => `- ${n.title}: ${n.summary}`)
    .join("\n");
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const prompt = `당신은 한국 개인투자자를 위한 미국 시장 분석 AI입니다.
아래 최근 시장 뉴스를 바탕으로 오늘의 시장 개요를 JSON으로 생성하세요.

## 최근 시장 뉴스
${newsContext || "뉴스 데이터 없음"}

## 출력 형식 (JSON만 출력)
{
  "greeting": "간단한 인사 (예: 좋은 아침이에요! 밤사이 시장 소식을 정리했어요.)",
  "marketOverview": "전체 시장 요약 1-2문장",
  "macroAlert": "매크로 이벤트 경고 (없으면 null)"
}

## 규칙
- 자연스러운 한국어
- JSON만 출력`;

  const text = await callGemini(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

  const freshnessKey = crypto.createHash("sha256")
    .update(newsContext || "no-news")
    .digest("hex").slice(0, 16);

  await supabase.from("market_overview_cache").upsert(
    {
      analysis_date: date,
      greeting: parsed.greeting,
      market_overview: parsed.marketOverview,
      macro_alert: parsed.macroAlert || null,
      data_freshness_key: freshnessKey,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "analysis_date" }
  );

  console.log("Market overview generated");
}

async function main() {
  const today = todayKST();
  const stocks = getAnalysisTargetStocks();

  console.log(`=== 종목별 AI 분석 생성 시작: ${today} ===`);
  console.log(`대상: ${stocks.length}종목 (Tier 1+2 개별주식)`);

  // 1. 시장 전체 분석 생성
  try {
    await generateMarketOverview(today);
  } catch (err) {
    console.error("Market overview generation failed:", err);
  }

  // 2. 종목별 분석 생성 (배치)
  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (stock) => {
        // freshness 체크 — 이미 최신이면 스킵
        const freshnessKey = await getTickerFreshnessKey(stock.ticker);
        if (await hasUpToDateAnalysis(stock.ticker, today, freshnessKey)) {
          skipped++;
          return;
        }

        // DB에서 종목 데이터 조회
        const data = await fetchStockData(stock.ticker);

        // Gemini로 분석 생성
        const prompt = buildSingleStockPrompt(stock.ticker, stock.nameKr, data);
        const text = await callGemini(prompt);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

        // DB에 저장
        await supabase.from("stock_analysis_cache").upsert(
          {
            ticker: stock.ticker,
            analysis_date: today,
            sentiment: parsed.sentiment,
            summary: parsed.summary,
            key_points: parsed.keyPoints,
            proactive_suggestion: parsed.proactiveSuggestion || null,
            related_tickers: parsed.relatedTickers || [],
            data_freshness_key: freshnessKey,
            generated_at: new Date().toISOString(),
          },
          { onConflict: "ticker,analysis_date" }
        );

        generated++;
      })
    );

    for (const r of results) {
      if (r.status === "rejected") {
        errors++;
        console.error(`  Error: ${r.reason}`);
      }
    }

    const progress = Math.min(i + BATCH_SIZE, stocks.length);
    console.log(`[${progress}/${stocks.length}] generated=${generated} skipped=${skipped} errors=${errors}`);

    if ((i + BATCH_SIZE) < stocks.length) {
      await sleep(DELAY_MS);
    }
  }

  // 3. 오래된 캐시 정리 (4일 이상 — 금요일 캐시가 월요일까지 유지)
  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  await supabase.from("stock_analysis_cache")
    .delete()
    .lt("generated_at", fourDaysAgo.toISOString());
  await supabase.from("market_overview_cache")
    .delete()
    .lt("generated_at", fourDaysAgo.toISOString());

  console.log(`\n=== 분석 생성 완료 ===`);
  console.log(`Generated: ${generated}, Skipped: ${skipped}, Errors: ${errors}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
