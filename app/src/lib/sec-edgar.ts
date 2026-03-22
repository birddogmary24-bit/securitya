import { SecFiling } from "./types";

const SEC_USER_AGENT = "KakaoPaySecurityAI admin@example.com";
const FILING_TYPES = ["10-K", "10-Q", "8-K"];
const MAX_DAYS = 90;

// 티커 → CIK 매핑 캐시
let cikCache: Record<string, string> | null = null;

export async function fetchCIKMap(): Promise<Record<string, string>> {
  if (cikCache) return cikCache;

  const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers: { "User-Agent": SEC_USER_AGENT },
  });

  if (!res.ok) throw new Error(`CIK map fetch failed: ${res.status}`);

  const data: Record<string, { cik_str: number; ticker: string; title: string }> = await res.json();
  const map: Record<string, string> = {};

  for (const entry of Object.values(data)) {
    // CIK를 10자리 zero-padded 문자열로 변환
    map[entry.ticker.toUpperCase()] = String(entry.cik_str).padStart(10, "0");
  }

  cikCache = map;
  return map;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchRecentFilings(
  ticker: string,
  cik: string
): Promise<SecFiling[]> {
  const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
  const res = await fetch(url, {
    headers: { "User-Agent": SEC_USER_AGENT },
  });

  if (!res.ok) {
    console.error(`EDGAR fetch failed for ${ticker} (CIK ${cik}): ${res.status}`);
    return [];
  }

  const data = await res.json();
  const recent = data.filings?.recentFilings ?? data.filings?.recent;

  if (!recent?.form) return [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_DAYS);
  const cutoff = cutoffDate.toISOString().split("T")[0];

  const filings: SecFiling[] = [];

  for (let i = 0; i < recent.form.length; i++) {
    const form: string = recent.form[i];
    const filedDate: string = recent.filingDate[i];
    const accessionNumber: string = recent.accessionNumber[i];
    const primaryDoc: string = recent.primaryDocument?.[i] ?? "";
    const description: string = recent.primaryDocDescription?.[i] ?? form;

    // 10-K, 10-Q, 8-K만 필터
    if (!FILING_TYPES.includes(form)) continue;
    // 90일 이내만
    if (filedDate < cutoff) break;

    const accessionClean = accessionNumber.replace(/-/g, "");
    const filingUrl = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${accessionClean}/${primaryDoc}`;

    filings.push({
      ticker,
      cik,
      filingType: form,
      filedDate,
      title: description,
      accessionNumber,
      url: filingUrl,
    });
  }

  return filings;
}

export async function collectSECFilings(
  tickers: string[]
): Promise<{ filings: SecFiling[]; errors: string[] }> {
  const cikMap = await fetchCIKMap();
  const allFilings: SecFiling[] = [];
  const errors: string[] = [];

  for (const ticker of tickers) {
    const cik = cikMap[ticker.toUpperCase()];
    if (!cik) {
      errors.push(`CIK not found for ${ticker}`);
      continue;
    }

    try {
      const filings = await fetchRecentFilings(ticker, cik);
      allFilings.push(...filings);
    } catch (err) {
      errors.push(`${ticker}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Rate limit: 1초 간격 (안전 마진)
    await sleep(1000);
  }

  return { filings: allFilings, errors };
}

/** 청크 단위 SEC 수집 (Vercel 10초 timeout 대응, sleep 200ms) */
export async function collectSECFilingsChunked(
  tickers: string[]
): Promise<{ filings: SecFiling[]; errors: string[] }> {
  const cikMap = await fetchCIKMap();
  const allFilings: SecFiling[] = [];
  const errors: string[] = [];

  for (const ticker of tickers) {
    const cik = cikMap[ticker.toUpperCase()];
    if (!cik) {
      errors.push(`CIK not found for ${ticker}`);
      continue;
    }

    try {
      const filings = await fetchRecentFilings(ticker, cik);
      allFilings.push(...filings);
    } catch (err) {
      errors.push(`${ticker}: ${err instanceof Error ? err.message : String(err)}`);
    }

    await sleep(200);
  }

  return { filings: allFilings, errors };
}
