import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tickersParam = searchParams.get("tickers");

  if (!tickersParam) {
    return Response.json({ error: "tickers 파라미터가 필요합니다." }, { status: 400 });
  }

  const tickers = tickersParam.split(",").map((t) => t.trim().toUpperCase());

  try {
    const { data, error } = await supabase
      .from("sec_filings")
      .select("*")
      .in("ticker", tickers)
      .order("filed_date", { ascending: false })
      .limit(50);

    if (error) throw error;

    const filings = (data ?? []).map((f) => ({
      id: f.id,
      ticker: f.ticker,
      cik: f.cik,
      filingType: f.filing_type,
      filedDate: f.filed_date,
      title: f.title,
      accessionNumber: f.accession_number,
      url: f.url,
    }));

    return Response.json({ filings });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
