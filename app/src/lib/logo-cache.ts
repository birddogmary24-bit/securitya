/**
 * localStorage 기반 종목 로고 URL 캐시
 * TTL: 24시간 — 로고는 거의 변하지 않으므로 충분
 */

const CACHE_KEY = "stock_logos";
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface LogoCache {
  logos: Record<string, string>;
  updatedAt: number;
}

function readCache(): LogoCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: LogoCache = JSON.parse(raw);
    if (Date.now() - parsed.updatedAt > TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(logos: Record<string, string>) {
  try {
    const cache: LogoCache = { logos, updatedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

/** 캐시에 로고 추가/업데이트 (기존 캐시에 merge) */
export function mergeLogos(newLogos: Record<string, string>) {
  const existing = readCache();
  const merged = { ...(existing?.logos ?? {}), ...newLogos };
  writeCache(merged);
}

/** 캐시에서 로고맵 반환. 없거나 만료 시 null */
export function getCachedLogos(): Record<string, string> | null {
  return readCache()?.logos ?? null;
}

/** 캐시 우선, miss 시 API 호출 후 캐시 저장 */
export async function getLogos(tickers?: string[]): Promise<Record<string, string>> {
  const cached = getCachedLogos();

  // 특정 티커 요청 시: 캐시에 모두 있으면 바로 반환
  if (tickers && cached) {
    const allHit = tickers.every((t) => t in cached);
    if (allHit) {
      const result: Record<string, string> = {};
      for (const t of tickers) {
        if (cached[t]) result[t] = cached[t];
      }
      return result;
    }
  }

  // 전체 요청 시: 캐시 있으면 바로 반환
  if (!tickers && cached) {
    return cached;
  }

  // Cache miss → API 호출
  try {
    const url = tickers
      ? `/api/stocks/logos?tickers=${tickers.join(",")}`
      : "/api/stocks/logos";
    const res = await fetch(url);
    const data = await res.json();
    const logos: Record<string, string> = data.logos ?? {};
    mergeLogos(logos);
    return logos;
  } catch {
    return cached ?? {};
  }
}
