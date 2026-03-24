import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/stocks/logos?tickers=AAPL,MSFT,NVDA
 * Returns a map of ticker → logoUrl from stock_profiles
 */
export async function GET(request: NextRequest) {
  const tickers = request.nextUrl.searchParams.get("tickers");
  if (!tickers) {
    return Response.json({ logos: {} });
  }

  const tickerList = tickers.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);
  if (tickerList.length === 0) {
    return Response.json({ logos: {} });
  }

  const { data: profiles } = await supabase
    .from("stock_profiles")
    .select("ticker, logo_url")
    .in("ticker", tickerList);

  const logos: Record<string, string> = {};
  for (const p of profiles ?? []) {
    if (p.logo_url) logos[p.ticker] = p.logo_url;
  }

  return Response.json({ logos });
}
