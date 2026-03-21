import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { MOCK_QUOTES, MOCK_NEWS } from "@/lib/mock-data";

// Vercel Cron 또는 외부 cron이 호출하는 엔드포인트
// Finnhub 연동 전까지는 mock 데이터를 DB에 저장
export async function GET(request: NextRequest) {
  // 보안: CRON_SECRET으로 인증
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. 주가 데이터 upsert
    const quotes = Object.values(MOCK_QUOTES).map((q) => ({
      ticker: q.ticker,
      price: q.price,
      change: q.change,
      change_percent: q.changePercent,
      previous_close: q.previousClose,
      updated_at: new Date().toISOString(),
    }));

    const { error: quotesError } = await supabase
      .from("stock_quotes")
      .upsert(quotes, { onConflict: "ticker" });

    if (quotesError) throw new Error(`Quotes upsert failed: ${quotesError.message}`);

    // 2. 뉴스 데이터 insert (오늘 날짜 기준 중복 방지)
    const today = new Date().toISOString().split("T")[0];
    const news = MOCK_NEWS.map((n) => ({
      tickers: n.relatedTickers,
      title: n.title,
      summary: n.summary,
      source: n.source,
      url: n.url,
      published_at: n.publishedAt,
      sentiment: n.sentiment ?? "neutral",
      collected_date: today,
    }));

    // 오늘 이미 수집된 뉴스가 있으면 스킵
    const { data: existing } = await supabase
      .from("stock_news")
      .select("id")
      .eq("collected_date", today)
      .limit(1);

    if (!existing || existing.length === 0) {
      const { error: newsError } = await supabase.from("stock_news").insert(news);
      if (newsError) throw new Error(`News insert failed: ${newsError.message}`);
    }

    return Response.json({
      success: true,
      message: `수집 완료 — 주가 ${quotes.length}개, 뉴스 ${existing?.length ? "스킵(오늘 수집됨)" : `${news.length}개`}`,
      collectedAt: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
    });
  } catch (error) {
    console.error("Data collection error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
