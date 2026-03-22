/**
 * Tier 3 On-demand 종목 관리
 *
 * - Tier 1/2에 없는 종목 요청 시 Finnhub API로 실시간 조회
 * - 결과를 DB에 tier=3으로 캐시 (last_accessed_at 갱신)
 * - TTL(24시간) 초과 시 자동 재조회
 */

import { supabase } from "./supabase";
import { fetchQuote, fetchCompanyProfile, fetchCompanyNews } from "./finnhub";
import { getTierForTicker, TieredStock } from "./stock-tiers";

const TTL_HOURS = 24;

/** TTL 만료 여부 확인 */
function isExpired(updatedAt: string | null): boolean {
  if (!updatedAt) return true;
  const updated = new Date(updatedAt).getTime();
  const now = Date.now();
  return now - updated > TTL_HOURS * 60 * 60 * 1000;
}

/** Tier 3 종목 조회 (없으면 Finnhub에서 가져와서 DB에 저장) */
export async function getOrFetchTier3Stock(
  ticker: string
): Promise<TieredStock | null> {
  const upperTicker = ticker.toUpperCase();

  // Tier 1/2/3에 있으면 그냥 반환 (on-demand 불필요)
  const existingTier = getTierForTicker(upperTicker);
  if (existingTier !== null) {
    return null; // 이미 관리되는 종목
  }

  // DB에서 조회
  const { data: existing } = await supabase
    .from("stock_profiles")
    .select("ticker, name, name_kr, updated_at")
    .eq("ticker", upperTicker)
    .single();

  // DB에 있고 TTL 이내면 last_accessed_at만 갱신 후 반환
  if (existing && !isExpired(existing.updated_at)) {
    await supabase
      .from("stock_profiles")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("ticker", upperTicker);

    return {
      ticker: existing.ticker,
      name: existing.name ?? upperTicker,
      nameKr: existing.name_kr ?? upperTicker,
      tier: 3,
    };
  }

  // Finnhub에서 프로필 조회
  const profile = await fetchCompanyProfile(upperTicker);
  if (!profile) return null; // 유효하지 않은 티커

  const now = new Date().toISOString();

  // stock_profiles에 upsert
  await supabase.from("stock_profiles").upsert(
    {
      ticker: upperTicker,
      name: profile.name,
      name_kr: profile.name, // 한국어명 없으면 영문명 사용
      sector: profile.sector,
      market_cap: profile.marketCap,
      logo_url: profile.logoUrl,
      website_url: profile.websiteUrl,
      tier: "3",
      updated_at: now,
      last_accessed_at: now,
    },
    { onConflict: "ticker" }
  );

  // 시세도 함께 수집
  const quote = await fetchQuote(upperTicker);
  if (quote) {
    await supabase.from("stock_quotes").upsert(
      {
        ticker: upperTicker,
        price: quote.price,
        change: quote.change,
        change_percent: quote.changePercent,
        previous_close: quote.previousClose,
        updated_at: now,
        last_accessed_at: now,
      },
      { onConflict: "ticker" }
    );
  }

  return {
    ticker: upperTicker,
    name: profile.name,
    nameKr: profile.name,
    tier: 3,
  };
}

/** TTL 만료된 Tier 3 종목의 시세를 갱신 */
export async function refreshExpiredTier3Quote(ticker: string): Promise<void> {
  const upperTicker = ticker.toUpperCase();

  const { data: quoteRow } = await supabase
    .from("stock_quotes")
    .select("updated_at")
    .eq("ticker", upperTicker)
    .single();

  if (!quoteRow || !isExpired(quoteRow.updated_at)) return;

  const quote = await fetchQuote(upperTicker);
  if (quote) {
    const now = new Date().toISOString();
    await supabase.from("stock_quotes").upsert(
      {
        ticker: upperTicker,
        price: quote.price,
        change: quote.change,
        change_percent: quote.changePercent,
        previous_close: quote.previousClose,
        updated_at: now,
        last_accessed_at: now,
      },
      { onConflict: "ticker" }
    );
  }
}

/** 최근 7일 내 활성 Tier 3 종목 목록 조회 (Cron에서 사용) */
export async function getActiveTier3Tickers(): Promise<string[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data } = await supabase
    .from("stock_profiles")
    .select("ticker")
    .eq("tier", "3")
    .gte("last_accessed_at", sevenDaysAgo.toISOString());

  return data?.map((row) => row.ticker) ?? [];
}
