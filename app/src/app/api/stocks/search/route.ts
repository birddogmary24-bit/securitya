import { NextRequest } from "next/server";
import { getAllStocks } from "@/lib/stock-tiers";
import { getOrFetchTier3Stock } from "@/lib/tier3-ondemand";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/stocks/search?q=TICKER
 *
 * 1. Tier 1/2에서 검색
 * 2. 결과가 없으면 Finnhub에서 Tier 3으로 on-demand 조회
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 1) {
    return Response.json({ results: [] });
  }

  const upperQuery = query.toUpperCase();
  const allStocks = getAllStocks();

  // Tier 1/2에서 검색
  const localResults = allStocks
    .filter(
      (s) =>
        s.ticker.includes(upperQuery) ||
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.nameKr.includes(query)
    )
    .slice(0, 20);

  // 로고 URL 조회
  const resultTickers = localResults.map((s) => s.ticker);
  const { data: profiles } = await supabase
    .from("stock_profiles")
    .select("ticker, logo_url")
    .in("ticker", resultTickers);
  const logoMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    if (p.logo_url) logoMap[p.ticker] = p.logo_url;
  }

  // 정확한 티커 매치가 없고, 쿼리가 티커 형식(영문 1~5자)이면 Tier 3 시도
  const exactMatch = allStocks.find((s) => s.ticker === upperQuery);
  if (!exactMatch && /^[A-Z]{1,5}$/.test(upperQuery)) {
    const tier3Stock = await getOrFetchTier3Stock(upperQuery);
    if (tier3Stock) {
      return Response.json({
        results: [
          { ticker: tier3Stock.ticker, name: tier3Stock.name, nameKr: tier3Stock.nameKr, tier: 3, logoUrl: tier3Stock.logoUrl },
          ...localResults.map((s) => ({ ticker: s.ticker, name: s.name, nameKr: s.nameKr, tier: s.tier, logoUrl: logoMap[s.ticker] })),
        ],
      });
    }
  }

  return Response.json({
    results: localResults.map((s) => ({
      ticker: s.ticker,
      name: s.name,
      nameKr: s.nameKr,
      tier: s.tier,
      logoUrl: logoMap[s.ticker],
    })),
  });
}
