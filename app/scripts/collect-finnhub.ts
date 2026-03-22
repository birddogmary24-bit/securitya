/**
 * Finnhub 데이터 수집 스크립트 (GitHub Actions 직접 실행용)
 *
 * Vercel 경유 없이 직접 Finnhub API → Supabase 수집.
 * Vercel Hobby 10초 timeout 제약 없음.
 *
 * 실행: npx tsx scripts/collect-finnhub.ts
 * 필요 환경변수: FINNHUB_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { TIER1_STOCKS, TIER2_STOCKS } from "../src/lib/stock-tiers";
import { supabase } from "../src/lib/supabase";
import {
  fetchQuote,
  fetchCompanyNews,
  fetchGeneralNews,
  fetchBasicFinancials,
  fetchRecommendationTrends,
  fetchPriceTarget,
  fetchUpgradesDowngrades,
  fetchInsiderTransactions,
  fetchEarningsCalendar,
  getRequestCount,
} from "../src/lib/finnhub";

const tier1Tickers = new Set(TIER1_STOCKS.map((s) => s.ticker));

function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function dateNDaysLater(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

async function main() {
  const today = todayKST();
  const allStocks = [...TIER1_STOCKS, ...TIER2_STOCKS];
  const fromDate = dateNDaysAgo(7);
  const toDate = today;

  console.log(`=== Finnhub 수집 시작: ${today} ===`);
  console.log(`총 ${allStocks.length}종목 (Tier1: ${TIER1_STOCKS.length}, Tier2: ${TIER2_STOCKS.length})`);

  let quotesOk = 0;
  let newsOk = 0;
  let financialsOk = 0;
  let recsOk = 0;
  let ptOk = 0;
  let insiderOk = 0;
  let errors = 0;

  for (let i = 0; i < allStocks.length; i++) {
    const stock = allStocks[i];
    const { ticker } = stock;
    const isTier1 = tier1Tickers.has(ticker);
    const progress = `[${i + 1}/${allStocks.length}]`;

    try {
      // Quote (all tiers)
      const quote = await fetchQuote(ticker);
      if (quote) {
        const { error } = await supabase.from("stock_quotes").upsert(
          {
            ticker: quote.ticker,
            price: quote.price,
            change: quote.change,
            change_percent: quote.changePercent,
            previous_close: quote.previousClose,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "ticker" }
        );
        if (!error) quotesOk++;
      }

      // News (all tiers)
      const news = await fetchCompanyNews(ticker, fromDate, toDate);
      if (news.length > 0) {
        const rows = news.map((n) => ({
          category: "company",
          tickers: [ticker],
          title: n.title,
          summary: n.summary,
          source: n.source,
          url: n.url,
          image_url: n.imageUrl,
          published_at: n.publishedAt,
          collected_date: today,
        }));
        const { error } = await supabase
          .from("stock_news")
          .upsert(rows, { onConflict: "url,collected_date" });
        if (!error) newsOk += rows.length;
      }

      // Tier 1 only: financials, recommendations, price target, insider
      if (isTier1) {
        const financials = await fetchBasicFinancials(ticker);
        if (financials) {
          const { error } = await supabase.from("stock_financials").upsert(
            {
              ticker: financials.ticker,
              pe_ratio: financials.peRatio,
              pb_ratio: financials.pbRatio,
              dividend_yield: financials.dividendYield,
              week52_high: financials.week52High,
              week52_low: financials.week52Low,
              market_cap: financials.marketCap,
              beta: financials.beta,
            },
            { onConflict: "ticker" }
          );
          if (!error) financialsOk++;
        }

        const recs = await fetchRecommendationTrends(ticker);
        if (recs) {
          const { error } = await supabase.from("stock_recommendations").upsert(
            {
              ticker: recs.ticker,
              buy: recs.buy,
              hold: recs.hold,
              sell: recs.sell,
              strong_buy: recs.strongBuy,
              strong_sell: recs.strongSell,
              period: recs.period,
            },
            { onConflict: "ticker" }
          );
          if (!error) recsOk++;
        }

        const pt = await fetchPriceTarget(ticker);
        if (pt) {
          const { error } = await supabase.from("stock_price_targets").upsert(
            {
              ticker: pt.ticker,
              target_high: pt.targetHigh,
              target_low: pt.targetLow,
              target_mean: pt.targetMean,
              target_median: pt.targetMedian,
            },
            { onConflict: "ticker" }
          );
          if (!error) ptOk++;
        }

        const insider = await fetchInsiderTransactions(ticker);
        if (insider.length > 0) {
          const rows = insider.map((t) => ({
            ticker: t.ticker,
            person_name: t.personName,
            position: t.position,
            transaction_type: t.transactionType,
            shares: t.shares,
            price: t.price,
            filed_at: t.filedAt,
          }));
          const { error } = await supabase
            .from("stock_insider_transactions")
            .upsert(rows, { onConflict: "ticker,person_name,filed_at,transaction_type" });
          if (!error) insiderOk += rows.length;
        }
      }

      if ((i + 1) % 50 === 0) {
        console.log(`${progress} ${ticker} ✓ (API calls: ${getRequestCount()})`);
      }
    } catch (err) {
      errors++;
      console.error(`${progress} ${ticker} ✗ ${err}`);
    }
  }

  // Global data
  console.log("\n--- 글로벌 데이터 수집 ---");

  const generalNews = await fetchGeneralNews();
  if (generalNews.length > 0) {
    const rows = generalNews.map((n) => ({
      category: "general",
      tickers: [] as string[],
      title: n.title,
      summary: n.summary,
      source: n.source,
      url: n.url,
      image_url: n.imageUrl,
      published_at: n.publishedAt,
      collected_date: today,
    }));
    await supabase.from("stock_news").upsert(rows, { onConflict: "url,collected_date" });
    console.log(`General news: ${rows.length}건`);
  }

  const earningsFrom = today;
  const earningsTo = dateNDaysLater(7);
  const earnings = await fetchEarningsCalendar(earningsFrom, earningsTo);
  if (earnings.length > 0) {
    const rows = earnings.map((e) => ({
      ticker: e.ticker,
      report_date: e.reportDate,
      eps_estimate: e.epsEstimate,
      eps_actual: e.epsActual,
      revenue_estimate: e.revenueEstimate,
      revenue_actual: e.revenueActual,
      quarter: e.quarter,
    }));
    await supabase.from("earnings_calendar").upsert(rows, { onConflict: "ticker,report_date" });
    console.log(`Earnings calendar: ${rows.length}건`);
  }

  const upgrades = await fetchUpgradesDowngrades(fromDate, toDate);
  if (upgrades.length > 0) {
    const rows = upgrades.map((u) => ({
      ticker: u.ticker,
      company: u.company,
      action: u.action,
      from_grade: u.fromGrade,
      to_grade: u.toGrade,
      graded_at: u.gradedAt,
    }));
    await supabase.from("stock_upgrades").upsert(rows, { onConflict: "ticker,company,graded_at" });
    console.log(`Upgrades/downgrades: ${rows.length}건`);
  }

  console.log(`\n=== 수집 완료 ===`);
  console.log(`Quotes: ${quotesOk}, News: ${newsOk}, Financials: ${financialsOk}`);
  console.log(`Recommendations: ${recsOk}, Price targets: ${ptOk}, Insider: ${insiderOk}`);
  console.log(`Errors: ${errors}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
