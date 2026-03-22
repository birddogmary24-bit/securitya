/**
 * Rate-limited Finnhub API client.
 *
 * - Max 55 requests per 60-second sliding window.
 * - Retries once on HTTP 429.
 * - Functions return null or [] on error (never throw).
 */

const BASE_URL = "https://finnhub.io/api/v1";

function getApiKey(): string {
  return process.env.FINNHUB_API_KEY ?? "";
}

// ---------------------------------------------------------------------------
// Rate limiter state
// ---------------------------------------------------------------------------

const requestTimestamps: number[] = [];
const RATE_LIMIT_MAX = 55;
const RATE_LIMIT_WINDOW_MS = 60_000;

export function getRequestCount(): number {
  const now = Date.now();
  // Prune old timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
  return requestTimestamps.length;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("token", getApiKey());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rateLimitedFetch(url: string): Promise<Record<string, unknown> | Record<string, unknown>[] | null> {
  const now = Date.now();

  // Prune timestamps outside the window
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }

  // If at capacity, wait until the oldest request expires
  if (requestTimestamps.length >= RATE_LIMIT_MAX) {
    const waitMs = requestTimestamps[0] + RATE_LIMIT_WINDOW_MS - now + 50; // small buffer
    await sleep(waitMs);
    // Prune again after waiting
    const afterWait = Date.now();
    while (requestTimestamps.length > 0 && requestTimestamps[0] <= afterWait - RATE_LIMIT_WINDOW_MS) {
      requestTimestamps.shift();
    }
  }

  requestTimestamps.push(Date.now());

  const doFetch = async (): Promise<Response> => {
    return fetch(url);
  };

  let response = await doFetch();

  // Retry once on 429
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
    await sleep(waitMs);
    requestTimestamps.push(Date.now());
    response = await doFetch();
  }

  if (!response.ok) {
    return null;
  }

  try {
    const data = await response.json();
    return data as Record<string, unknown> | Record<string, unknown>[];
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Exported API functions
// ---------------------------------------------------------------------------

export async function fetchQuote(ticker: string): Promise<{
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  high: number;
  low: number;
  open: number;
} | null> {
  const url = buildUrl("/quote", { symbol: ticker });
  const data = await rateLimitedFetch(url);
  if (!data || Array.isArray(data)) return null;

  const c = data["c"] as number | undefined;
  if (c === undefined || c === 0) return null;

  return {
    ticker,
    price: (data["c"] as number) ?? 0,
    change: (data["d"] as number) ?? 0,
    changePercent: (data["dp"] as number) ?? 0,
    previousClose: (data["pc"] as number) ?? 0,
    high: (data["h"] as number) ?? 0,
    low: (data["l"] as number) ?? 0,
    open: (data["o"] as number) ?? 0,
  };
}

export async function fetchCompanyProfile(ticker: string): Promise<{
  ticker: string;
  name: string;
  sector: string;
  marketCap: number;
  logoUrl: string;
  websiteUrl: string;
} | null> {
  const url = buildUrl("/stock/profile2", { symbol: ticker });
  const data = await rateLimitedFetch(url);
  if (!data || Array.isArray(data)) return null;

  const name = data["name"] as string | undefined;
  if (!name) return null;

  return {
    ticker,
    name,
    sector: (data["finnhubIndustry"] as string) ?? "",
    marketCap: (data["marketCapitalization"] as number) ?? 0,
    logoUrl: (data["logo"] as string) ?? "",
    websiteUrl: (data["weburl"] as string) ?? "",
  };
}

export async function fetchCompanyNews(
  ticker: string,
  fromDate: string,
  toDate: string,
): Promise<
  {
    title: string;
    summary: string;
    source: string;
    url: string;
    imageUrl: string;
    publishedAt: string;
    relatedTickers: string[];
  }[]
> {
  const url = buildUrl("/company-news", { symbol: ticker, from: fromDate, to: toDate });
  const data = await rateLimitedFetch(url);
  if (!data || !Array.isArray(data)) return [];

  return data.slice(0, 5).map((item) => ({
    title: (item["headline"] as string) ?? "",
    summary: (item["summary"] as string) ?? "",
    source: (item["source"] as string) ?? "",
    url: (item["url"] as string) ?? "",
    imageUrl: (item["image"] as string) ?? "",
    publishedAt: item["datetime"]
      ? new Date(((item["datetime"] as number) ?? 0) * 1000).toISOString()
      : "",
    relatedTickers: [ticker],
  }));
}

export async function fetchGeneralNews(): Promise<
  {
    title: string;
    summary: string;
    source: string;
    url: string;
    imageUrl: string;
    publishedAt: string;
    relatedTickers: string[];
  }[]
> {
  const url = buildUrl("/news", { category: "general" });
  const data = await rateLimitedFetch(url);
  if (!data || !Array.isArray(data)) return [];

  return data.slice(0, 100).map((item) => ({
    title: (item["headline"] as string) ?? "",
    summary: (item["summary"] as string) ?? "",
    source: (item["source"] as string) ?? "",
    url: (item["url"] as string) ?? "",
    imageUrl: (item["image"] as string) ?? "",
    publishedAt: item["datetime"]
      ? new Date(((item["datetime"] as number) ?? 0) * 1000).toISOString()
      : "",
    relatedTickers: [],
  }));
}

export async function fetchBasicFinancials(ticker: string): Promise<{
  ticker: string;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
  week52High: number | null;
  week52Low: number | null;
  marketCap: number | null;
  beta: number | null;
} | null> {
  const url = buildUrl("/stock/metric", { symbol: ticker, metric: "all" });
  const data = await rateLimitedFetch(url);
  if (!data || Array.isArray(data)) return null;

  const metric = data["metric"] as Record<string, unknown> | undefined;
  if (!metric) return null;

  return {
    ticker,
    peRatio: (metric["peBasicExclExtraTTM"] as number) ?? null,
    pbRatio: (metric["pbQuarterly"] as number) ?? null,
    dividendYield: (metric["dividendYieldIndicatedAnnual"] as number) ?? null,
    week52High: (metric["52WeekHigh"] as number) ?? null,
    week52Low: (metric["52WeekLow"] as number) ?? null,
    marketCap: (metric["marketCapitalization"] as number) ?? null,
    beta: (metric["beta"] as number) ?? null,
  };
}

export async function fetchRecommendationTrends(ticker: string): Promise<{
  ticker: string;
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
} | null> {
  const url = buildUrl("/stock/recommendation", { symbol: ticker });
  const data = await rateLimitedFetch(url);
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const latest = data[0];
  return {
    ticker,
    buy: (latest["buy"] as number) ?? 0,
    hold: (latest["hold"] as number) ?? 0,
    sell: (latest["sell"] as number) ?? 0,
    strongBuy: (latest["strongBuy"] as number) ?? 0,
    strongSell: (latest["strongSell"] as number) ?? 0,
    period: (latest["period"] as string) ?? "",
  };
}

export async function fetchPriceTarget(ticker: string): Promise<{
  ticker: string;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
} | null> {
  const url = buildUrl("/stock/price-target", { symbol: ticker });
  const data = await rateLimitedFetch(url);
  if (!data || Array.isArray(data)) return null;

  const targetHigh = data["targetHigh"] as number | undefined;
  if (targetHigh === undefined) return null;

  return {
    ticker,
    targetHigh: (data["targetHigh"] as number) ?? 0,
    targetLow: (data["targetLow"] as number) ?? 0,
    targetMean: (data["targetMean"] as number) ?? 0,
    targetMedian: (data["targetMedian"] as number) ?? 0,
  };
}

export async function fetchUpgradesDowngrades(
  fromDate: string,
  toDate: string,
): Promise<
  {
    ticker: string;
    company: string;
    action: string;
    fromGrade: string;
    toGrade: string;
    gradedAt: string;
  }[]
> {
  const url = buildUrl("/upgrade-downgrade", { from: fromDate, to: toDate });
  const data = await rateLimitedFetch(url);
  if (!data || !Array.isArray(data)) return [];

  return data.map((item) => ({
    ticker: (item["symbol"] as string) ?? "",
    company: (item["company"] as string) ?? "",
    action: (item["action"] as string) ?? "",
    fromGrade: (item["fromGrade"] as string) ?? "",
    toGrade: (item["toGrade"] as string) ?? "",
    gradedAt: (item["gradeTime"] as string) ?? "",
  }));
}

export async function fetchInsiderTransactions(ticker: string): Promise<
  {
    ticker: string;
    personName: string;
    position: string;
    transactionType: string;
    shares: number;
    price: number;
    filedAt: string;
  }[]
> {
  const url = buildUrl("/stock/insider-transactions", { symbol: ticker });
  const data = await rateLimitedFetch(url);
  if (!data || Array.isArray(data)) return [];

  const transactions = data["data"] as Record<string, unknown>[] | undefined;
  if (!transactions || !Array.isArray(transactions)) return [];

  return transactions.slice(0, 10).map((item) => ({
    ticker,
    personName: (item["name"] as string) ?? "",
    position: (item["position"] as string) ?? "",
    transactionType: (item["transactionType"] as string) ?? "",
    shares: (item["share"] as number) ?? 0,
    price: (item["transactionPrice"] as number) ?? 0,
    filedAt: (item["filingDate"] as string) ?? "",
  }));
}

export async function fetchEarningsCalendar(
  fromDate: string,
  toDate: string,
): Promise<
  {
    ticker: string;
    reportDate: string;
    epsEstimate: number | null;
    epsActual: number | null;
    revenueEstimate: number | null;
    revenueActual: number | null;
    quarter: number | null;
  }[]
> {
  const url = buildUrl("/calendar/earnings", { from: fromDate, to: toDate });
  const data = await rateLimitedFetch(url);
  if (!data || Array.isArray(data)) return [];

  const calendar = data["earningsCalendar"] as Record<string, unknown>[] | undefined;
  if (!calendar || !Array.isArray(calendar)) return [];

  return calendar.map((item) => ({
    ticker: (item["symbol"] as string) ?? "",
    reportDate: (item["date"] as string) ?? "",
    epsEstimate: (item["epsEstimate"] as number) ?? null,
    epsActual: (item["epsActual"] as number) ?? null,
    revenueEstimate: (item["revenueEstimate"] as number) ?? null,
    revenueActual: (item["revenueActual"] as number) ?? null,
    quarter: (item["quarter"] as number) ?? null,
  }));
}

export async function fetchQuotesBatch(
  tickers: string[],
): Promise<
  ({
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
    high: number;
    low: number;
    open: number;
  } | null)[]
> {
  const results: ({
    ticker: string;
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
    high: number;
    low: number;
    open: number;
  } | null)[] = [];

  for (const ticker of tickers) {
    const quote = await fetchQuote(ticker);
    results.push(quote);
  }

  return results;
}
