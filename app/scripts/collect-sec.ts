/**
 * SEC EDGAR 공시 수집 스크립트 (GitHub Actions 직접 실행용)
 *
 * 실행: npx tsx scripts/collect-sec.ts
 * 필요 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { TIER1_STOCKS, TIER2_STOCKS } from "../src/lib/stock-tiers";
import { supabase } from "../src/lib/supabase";
import { collectSECFilings } from "../src/lib/sec-edgar";

// ETF는 SEC 공시가 없으므로 제외
const ETF_TICKERS = new Set([
  "SPY", "QQQ", "ARKK", "SOXL", "TQQQ", "SCHD", "JEPI", "SOXS", "SQQQ",
  "VOO", "VTI", "IWM", "XLF", "XLE", "XLK", "XLV", "XLI", "XLC", "XLP",
  "XLU", "XLB", "XLRE", "XBI", "TLT", "BND", "AGG", "HYG", "LQD", "TIP",
  "SHY", "IEF", "GLD", "SLV", "USO", "UNG", "PDBC", "DBA", "EEM", "EFA",
  "VWO", "INDA", "MCHI", "BOTZ", "ROBO", "HACK", "TAN", "LIT", "ICLN",
  "ARKG", "ARKW", "ARKF", "ARKQ", "VIG", "DVY", "HDV", "DIVO", "QYLD",
  "UPRO", "SPXU", "UVXY", "SVXY", "LABU", "LABD", "FNGU", "FNGD",
  "JEPQ", "SPLG", "DIA", "KWEB", "SMH", "SOXX", "IBIT", "FBTC", "BITB",
]);

async function main() {
  const allStocks = [...TIER1_STOCKS, ...TIER2_STOCKS];
  const tickers = allStocks
    .map((s) => s.ticker)
    .filter((t) => !ETF_TICKERS.has(t));

  console.log(`=== SEC EDGAR 공시 수집 시작 ===`);
  console.log(`대상: ${tickers.length}종목 (ETF ${ETF_TICKERS.size}개 제외)`);

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
      console.error(`DB upsert failed: ${upsertError.message}`);
    } else {
      inserted = rows.length;
    }
  }

  console.log(`\n=== 수집 완료 ===`);
  console.log(`공시: ${inserted}건 저장`);
  if (errors.length > 0) {
    console.log(`오류: ${errors.length}건`);
    errors.slice(0, 10).forEach((e) => console.log(`  - ${e}`));
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
