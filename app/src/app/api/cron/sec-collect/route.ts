import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { collectSECFilings } from "@/lib/sec-edgar";
import { POPULAR_STOCKS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tickers = POPULAR_STOCKS.map((s) => s.ticker);
    const { filings, errors } = await collectSECFilings(tickers);

    let inserted = 0;
    if (filings.length > 0) {
      const rows = filings.map((f) => ({
        ticker: f.ticker,
        cik: f.cik,
        filing_type: f.filingType,
        filed_date: f.filedDate,
        title: f.title,
        accession_number: f.accessionNumber,
        url: f.url,
      }));

      const { error: upsertError } = await supabase
        .from("sec_filings")
        .upsert(rows, { onConflict: "accession_number" });

      if (upsertError) {
        errors.push(`DB upsert failed: ${upsertError.message}`);
      } else {
        inserted = rows.length;
      }
    }

    return Response.json({
      success: true,
      message: `SEC 공시 수집 완료 — ${inserted}건${errors.length ? ` (오류 ${errors.length}건)` : ""}`,
      inserted,
      errors,
      collectedAt: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
    });
  } catch (error) {
    console.error("SEC collection error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
