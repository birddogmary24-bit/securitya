import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/stocks/logos
 * GET /api/stocks/logos?tickers=AAPL,MSFT,NVDA
 *
 * tickers 없으면 stock_profiles 전체 로고 반환
 */
export async function GET(request: NextRequest) {
  const tickersParam = request.nextUrl.searchParams.get("tickers");

  let query = supabase.from("stock_profiles").select("ticker, logo_url").not("logo_url", "is", null);

  if (tickersParam) {
    const tickerList = tickersParam.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean);
    if (tickerList.length === 0) {
      return Response.json({ logos: {} });
    }
    query = query.in("ticker", tickerList);
  }

  const { data: profiles } = await query.limit(1000);

  const logos: Record<string, string> = {};
  for (const p of profiles ?? []) {
    if (p.logo_url) logos[p.ticker] = p.logo_url;
  }

  return Response.json({ logos });
}
