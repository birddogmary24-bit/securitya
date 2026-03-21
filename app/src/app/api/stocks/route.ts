import { NextRequest } from "next/server";
import { MOCK_QUOTES } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const tickers = request.nextUrl.searchParams.get("tickers");

  if (!tickers) {
    return Response.json({ error: "tickers 파라미터가 필요합니다." }, { status: 400 });
  }

  const tickerList = tickers.split(",").map((t) => t.trim().toUpperCase());
  const quotes = tickerList
    .filter((t) => MOCK_QUOTES[t])
    .map((t) => MOCK_QUOTES[t]);

  return Response.json({ quotes });
}
