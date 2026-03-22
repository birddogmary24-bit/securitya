import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { TIER1_STOCKS, TIER2_STOCKS } from "@/lib/stock-tiers";
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
} from "@/lib/finnhub";

const CHUNK_SIZE = 25;

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

const tier1Tickers = new Set(TIER1_STOCKS.map((s) => s.ticker));

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = todayKST();
    const allStocks = [...TIER1_STOCKS, ...TIER2_STOCKS];

    // Check / create batch_state for today
    const { data: batchRows } = await supabase
      .from("batch_state")
      .select("*")
      .eq("batch_type", "daily")
      .eq("batch_date", today)
      .limit(1);

    let batch = batchRows?.[0];

    if (!batch) {
      const { data: newBatch, error: createErr } = await supabase
        .from("batch_state")
        .upsert(
          {
            batch_type: "daily",
            batch_date: today,
            current_offset: 0,
            total_count: allStocks.length,
            status: "in_progress",
          },
          { onConflict: "batch_type,batch_date" }
        )
        .select()
        .single();

      if (createErr) {
        console.error("batch_state create error:", createErr);
        return Response.json({ error: createErr.message }, { status: 500 });
      }
      batch = newBatch;
    }

    // If already completed, return early
    if (batch.status === "completed") {
      return Response.json({
        status: "already_completed",
        batch_date: today,
        message: "Today's batch already completed.",
      });
    }

    const currentOffset = batch.current_offset as number;
    const chunk = allStocks.slice(currentOffset, currentOffset + CHUNK_SIZE);

    // If chunk is empty, all per-stock work is done — collect global data
    if (chunk.length === 0) {
      const fromDate = dateNDaysAgo(7);
      const toDate = todayKST();

      // General news
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
        const { error } = await supabase
          .from("stock_news")
          .upsert(rows, { onConflict: "url,collected_date" });
        if (error) console.error("general news upsert error:", error);
      }

      // Earnings calendar (7 days forward)
      const earningsFrom = todayKST();
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
        const { error } = await supabase
          .from("earnings_calendar")
          .upsert(rows, { onConflict: "ticker,report_date" });
        if (error) console.error("earnings calendar upsert error:", error);
      }

      // Upgrades / downgrades (past 7 days)
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
        const { error } = await supabase
          .from("stock_upgrades")
          .upsert(rows, { onConflict: "ticker,company,graded_at" });
        if (error) console.error("upgrades upsert error:", error);
      }

      // Mark batch completed
      await supabase
        .from("batch_state")
        .update({ status: "completed" })
        .eq("batch_type", "daily")
        .eq("batch_date", today);

      return Response.json({
        status: "completed",
        batch_date: today,
        general_news: generalNews.length,
        earnings: earnings.length,
        upgrades: upgrades.length,
        api_requests_used: getRequestCount(),
      });
    }

    // Process per-stock chunk
    const fromDate = dateNDaysAgo(7);
    const toDate = todayKST();
    let quotesProcessed = 0;
    let newsProcessed = 0;
    let financialsProcessed = 0;
    let recommendationsProcessed = 0;
    let priceTargetsProcessed = 0;
    let insiderProcessed = 0;

    for (const stock of chunk) {
      const { ticker } = stock;
      const isTier1 = tier1Tickers.has(ticker);

      // ALL tiers: quote
      const quote = await fetchQuote(ticker);
      if (quote) {
        const { error } = await supabase
          .from("stock_quotes")
          .upsert(
            {
              ticker: quote.ticker,
              price: quote.price,
              change: quote.change,
              change_percent: quote.changePercent,
              previous_close: quote.previousClose,
              high: quote.high,
              low: quote.low,
              open: quote.open,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "ticker" }
          );
        if (error) console.error(`quote upsert error (${ticker}):`, error);
        else quotesProcessed++;
      }

      // Tier 1 & 2: company news
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
        if (error) console.error(`news upsert error (${ticker}):`, error);
        else newsProcessed += rows.length;
      }

      // Tier 1 only: financials, recommendations, price target, insider transactions
      if (isTier1) {
        const financials = await fetchBasicFinancials(ticker);
        if (financials) {
          const { error } = await supabase
            .from("stock_financials")
            .upsert(
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
          if (error) console.error(`financials upsert error (${ticker}):`, error);
          else financialsProcessed++;
        }

        const recs = await fetchRecommendationTrends(ticker);
        if (recs) {
          const { error } = await supabase
            .from("stock_recommendations")
            .upsert(
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
          if (error) console.error(`recommendations upsert error (${ticker}):`, error);
          else recommendationsProcessed++;
        }

        const pt = await fetchPriceTarget(ticker);
        if (pt) {
          const { error } = await supabase
            .from("stock_price_targets")
            .upsert(
              {
                ticker: pt.ticker,
                target_high: pt.targetHigh,
                target_low: pt.targetLow,
                target_mean: pt.targetMean,
                target_median: pt.targetMedian,
              },
              { onConflict: "ticker" }
            );
          if (error) console.error(`price target upsert error (${ticker}):`, error);
          else priceTargetsProcessed++;
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
            .upsert(rows, {
              onConflict: "ticker,person_name,filed_at,transaction_type",
            });
          if (error) console.error(`insider upsert error (${ticker}):`, error);
          else insiderProcessed += rows.length;
        }
      }
    }

    // Update batch_state offset
    const newOffset = currentOffset + chunk.length;
    await supabase
      .from("batch_state")
      .update({ current_offset: newOffset })
      .eq("batch_type", "daily")
      .eq("batch_date", today);

    return Response.json({
      status: "in_progress",
      batch_date: today,
      chunk_offset: currentOffset,
      chunk_size: chunk.length,
      new_offset: newOffset,
      total_stocks: allStocks.length,
      remaining: allStocks.length - newOffset,
      processed: {
        quotes: quotesProcessed,
        news: newsProcessed,
        financials: financialsProcessed,
        recommendations: recommendationsProcessed,
        price_targets: priceTargetsProcessed,
        insider_transactions: insiderProcessed,
      },
      api_requests_used: getRequestCount(),
    });
  } catch (error) {
    console.error("Finnhub collection error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
