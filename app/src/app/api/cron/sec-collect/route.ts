import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { collectSECFilingsChunked } from "@/lib/sec-edgar";
import { TIER1_STOCKS, TIER2_STOCKS } from "@/lib/stock-tiers";

export const dynamic = "force-dynamic";

function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

const SEC_CHUNK_SIZE = 10; // Vercel Hobby 10초 timeout 대응

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = todayKST();

    // ETF 티커는 SEC 공시가 없으므로 제외
    const ETF_TICKERS = new Set([
      "SPY", "QQQ", "ARKK", "SOXL", "TQQQ", "SCHD", "JEPI", "SOXS", "SQQQ",
      "VOO", "VTI", "IWM", "XLF", "XLE", "XLK", "XLV", "XLI", "XLC", "XLP",
      "XLU", "XLB", "XLRE", "XBI", "TLT", "BND", "AGG", "HYG", "LQD", "TIP",
      "SHY", "IEF", "GLD", "SLV", "USO", "UNG", "PDBC", "DBA", "EEM", "EFA",
      "VWO", "INDA", "MCHI", "BOTZ", "ROBO", "HACK", "TAN", "LIT", "ICLN",
      "ARKG", "ARKW", "ARKF", "ARKQ", "VIG", "DVY", "HDV", "DIVO", "QYLD",
      "UPRO", "SPXU", "UVXY", "SVXY", "LABU", "LABD", "FNGU", "FNGD",
    ]);

    const allStocks = [...TIER1_STOCKS, ...TIER2_STOCKS]
      .filter((s) => !ETF_TICKERS.has(s.ticker));
    const allTickers = allStocks.map((s) => s.ticker);

    // batch_state 조회/생성
    const { data: batchRows } = await supabase
      .from("batch_state")
      .select("*")
      .eq("batch_type", "sec_daily")
      .eq("batch_date", today)
      .limit(1);

    let batch = batchRows?.[0];

    if (!batch) {
      const { data: newBatch, error: createErr } = await supabase
        .from("batch_state")
        .upsert(
          {
            batch_type: "sec_daily",
            batch_date: today,
            current_offset: 0,
            total_count: allTickers.length,
            status: "in_progress",
          },
          { onConflict: "batch_type,batch_date" }
        )
        .select()
        .single();

      if (createErr) {
        return Response.json({ error: createErr.message }, { status: 500 });
      }
      batch = newBatch;
    }

    if (batch.status === "completed") {
      return Response.json({
        status: "already_completed",
        batch_date: today,
        message: "Today's SEC batch already completed.",
      });
    }

    const currentOffset = batch.current_offset as number;
    const chunk = allTickers.slice(currentOffset, currentOffset + SEC_CHUNK_SIZE);

    if (chunk.length === 0) {
      await supabase
        .from("batch_state")
        .update({ status: "completed" })
        .eq("batch_type", "sec_daily")
        .eq("batch_date", today);

      return Response.json({
        status: "completed",
        batch_date: today,
        total_tickers: allTickers.length,
      });
    }

    // 청크 수집
    const { filings, errors } = await collectSECFilingsChunked(chunk);

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
        items: f.items || null,
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

    // offset 업데이트
    const newOffset = currentOffset + chunk.length;
    await supabase
      .from("batch_state")
      .update({ current_offset: newOffset })
      .eq("batch_type", "sec_daily")
      .eq("batch_date", today);

    return Response.json({
      status: "in_progress",
      batch_date: today,
      chunk_offset: currentOffset,
      chunk_size: chunk.length,
      new_offset: newOffset,
      total_tickers: allTickers.length,
      remaining: allTickers.length - newOffset,
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
