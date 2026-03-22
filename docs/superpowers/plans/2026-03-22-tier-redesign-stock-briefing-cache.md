# 티어 재설계 + Cron 시간 변경 + 종목별 AI 분석 캐시

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 3티어 구조를 재설계하고(ETF 분리, Tier 2 전체수집 확대), Cron 시간을 06:30 KST로 변경하며, 종목별 AI 분석을 사전 생성하여 브리핑 응답 속도를 <1초로 개선

**Architecture:** 기존 Tier 2(500개)를 거래금액순 개별주식 100개(새 Tier 2, 전체 6종 수집)와 나머지 ~400개(새 Tier 3, quote+news만)로 분리. ETF는 Tier 3에 포함되어 quote+news만 수집. Cron을 UTC 21:30(KST 06:30)으로 변경하여 미국 장 마감 후 자동 실행. Finnhub 수집 완료 후 Tier 1+2 개별주식(150개)에 대해 Gemini로 종목별 분석을 사전 생성하여 `stock_analysis_cache` 테이블에 저장. 브리핑 API는 캐시된 종목별 분석을 조합하여 즉시 응답.

**Tech Stack:** TypeScript, Next.js API Routes, Supabase (PostgreSQL), Gemini 2.5 Flash, GitHub Actions Cron, Finnhub API

---

## 변경 대상 파일 맵

| 파일 | 변경 | 설명 |
|------|------|------|
| `app/src/lib/stock-tiers.ts` | **Major Modify** | 3티어 재설계, ETF 식별 플래그 추가, 거래금액순 정렬 |
| `app/scripts/collect-finnhub.ts` | **Modify** | 새 티어 구조 반영, Tier 2도 전체 수집 |
| `app/scripts/collect-sec.ts` | **Modify** | 새 티어 구조 import 변경 |
| `app/scripts/generate-stock-analysis.ts` | **Create** | 종목별 AI 분석 사전 생성 스크립트 |
| `app/src/app/api/cron/finnhub-collect/route.ts` | **Modify** | 새 티어 구조 반영 |
| `app/src/app/api/briefing/route.ts` | **Major Modify** | 캐시된 종목별 분석 조합 방식으로 전환 |
| `app/src/lib/tier3-ondemand.ts` | **Modify** | Tier 3→4(on-demand) 번호 변경 반영 |
| `app/src/app/api/stocks/search/route.ts` | **Modify** | 새 티어 타입 반영 |
| `supabase/migrations/005_stock_analysis_cache.sql` | **Create** | 종목별 AI 분석 캐시 테이블 |
| `.github/workflows/cron-finnhub.yml` | **Modify** | 시간 변경 + AI 분석 생성 단계 추가 |
| `.github/workflows/cron-sec.yml` | **Modify** | 시간 변경 |
| `CLAUDE.md` | **Modify** | 새 티어 구조, Cron 시간, 테이블 스키마 반영 |
| `docs/DATA-CATALOG.md` | **Modify** | 새 테이블 스키마 추가 |

---

### Task 1: 티어 데이터 구조 재설계 (`stock-tiers.ts`)

**Files:**
- Modify: `app/src/lib/stock-tiers.ts`

핵심: 기존 `TIER2_STOCKS` (500개)를 개별주식/ETF로 분리하고, 거래금액순 상위 100개 개별주식을 새 Tier 2로 승격

- [ ] **Step 1: TieredStock 인터페이스에 `isEtf` 필드 추가**

```typescript
export interface TieredStock {
  ticker: string;
  name: string;
  nameKr: string;
  tier: 1 | 2 | 3;
  isEtf?: boolean;  // ETF 여부 (true면 financials/recommendations 수집 제외)
}
```

- [ ] **Step 2: ETF 종목에 `isEtf: true` 추가**

기존 Tier 2에서 ETF로 분류할 종목 목록 (약 75개):
- SPY, QQQ, ARKK, SOXL, TQQQ, SCHD, JEPI, SOXS, SQQQ, VOO, VTI, IWM
- XLF, XLE, XLK, XLV, XLI, XLC, XLP, XLU, XLB, XLRE, XBI
- TLT, BND, AGG, HYG, LQD, TIP, SHY, IEF
- GLD, SLV, USO, UNG, PDBC, DBA
- EEM, EFA, VWO, INDA, MCHI
- BOTZ, ROBO, HACK, TAN, LIT, ICLN, ARKG, ARKW, ARKF, ARKQ
- VIG, DVY, HDV, DIVO, QYLD
- UPRO, SPXU, UVXY, SVXY, LABU, LABD, FNGU, FNGD
- JEPQ, SPLG, DIA, KWEB, SMH, SOXX, IBIT, FBTC, BITB

모든 ETF 항목에 `isEtf: true` 추가. 예:
```typescript
{ ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', nameKr: 'S&P500 ETF', tier: 3, isEtf: true },
```

- [ ] **Step 3: 거래금액순 상위 100개 개별주식 선별 후 Tier 2로 설정**

기존 `TIER2_STOCKS` 중 ETF가 아닌 개별주식을 한국 투자자 거래금액 기준으로 상위 100개 선별:

**새 TIER2_STOCKS (100개 개별주식) — 거래금액순:**

> ⚠️ BA, MSTR은 이미 Tier 1이므로 제외. 아래 목록은 Tier 2에서만 선별.

ASML, TSM, LRCX, AMAT, ADBE, NOW, RBLX, SNAP, ROKU, CRWD,
PANW, SNOW, NET, SPOT, TTD, DASH, RIVN, LCID, F, GM,
PDD, JD, BIDU, CPNG, GS, MS, WFC, C, HOOD, BLK,
ISRG, REGN, GILD, ABBV, AMGN, ORCL, IBM, CSCO, DELL, PG,
MCD, SBUX, BKNG, CMG, LULU, ENPH, FSLR, PLUG, CAT, GE,
RTX, LMT, HON, AFRM, NU, EA, TTWO, U, SE, DDOG,
ZS, OKTA, MDB, TWLO, ETSY, DKNG, LI, XPEV, FUTU, GME,
AMC, UPST, AI, BBAI, RGTI, QUBT, MRVL, ON, ADI, NXPI,
APP, ANET, VRT, VST, CEG, OKLO, RKLB, SOUN, HIMS, CAVA,
DUOL, JOBY, ONON, ASTS, CLSK, IREN, CORZ, CELH, COIN은T1, SOFI는T1

> Note: 정확한 100개는 구현 시점에 한투/키움 거래 데이터 기반으로 확정. 위는 참고용 초안. 반드시 Tier 1과 중복되지 않도록 검증할 것.

- [ ] **Step 4: 나머지 개별주식 + 모든 ETF를 TIER3_STOCKS로 이동**

기존 `TIER2_STOCKS`에서 새 Tier 2에 포함되지 않은 개별주식 (~300개) + ETF (~75개) = ~375개를 `TIER3_STOCKS` 배열로 이동.

```typescript
// ─────────────────────────────────────────────
// Tier 3: 나머지 개별주식 + ETF (quote + news만 수집)
// ─────────────────────────────────────────────
export const TIER3_STOCKS: TieredStock[] = [
  // ETF (~75개)
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', nameKr: 'S&P500 ETF', tier: 3, isEtf: true },
  // ...
  // 나머지 개별주식 (~300개)
  { ticker: 'TLRY', name: 'Tilray Brands Inc.', nameKr: '틸레이', tier: 3 },
  // ...
];
```

- [ ] **Step 5: 헬퍼 함수 업데이트**

```typescript
/** Tier 1+2 개별주식만 반환 (AI 분석 대상) */
export function getAnalysisTargetStocks(): TieredStock[] {
  return [...TIER1_STOCKS, ...TIER2_STOCKS].filter(s => !s.isEtf);
}

/** ETF 여부 확인 */
export function isEtfTicker(ticker: string): boolean {
  const all = getAllStocks();
  return all.find(s => s.ticker === ticker.toUpperCase())?.isEtf === true;
}

/** 전체 수집 대상 (Tier 1 + 2, 6종 API) */
export function getFullCollectionStocks(): TieredStock[] {
  return [...TIER1_STOCKS, ...TIER2_STOCKS].filter(s => !s.isEtf);
}

/** 기본 수집 대상 (Tier 3, quote+news만) */
export function getBasicCollectionStocks(): TieredStock[] {
  return TIER3_STOCKS;
}
```

- [ ] **Step 6: 타입 변경 반영 — `CompanyProfile`의 tier 타입 업데이트**

`app/src/lib/types.ts`에서:
```typescript
// 기존: tier: 1 | 2 | 3;
// on-demand는 여전히 tier 3으로 DB에 저장 (코드상 구분)
tier: 1 | 2 | 3;  // 변경 없음 (DB 레벨에서는 3이 Tier 3 + on-demand 모두 포함)
```

- [ ] **Step 7: 빌드 확인**

Run: `cd app && npx tsc --noEmit`
Expected: 컴파일 에러 없음

- [ ] **Step 8: Commit**

```bash
git add app/src/lib/stock-tiers.ts app/src/lib/types.ts
git commit -m "refactor: redesign 3-tier stock structure with ETF separation"
```

---

### Task 2: Finnhub 수집 스크립트 — 새 티어 구조 반영

**Files:**
- Modify: `app/scripts/collect-finnhub.ts`
- Modify: `app/src/app/api/cron/finnhub-collect/route.ts`

핵심: Tier 2도 전체 6종 수집으로 확대, ETF는 quote+news만

- [ ] **Step 1: `collect-finnhub.ts` 수정 — 수집 로직 변경**

```typescript
import { TIER1_STOCKS, TIER2_STOCKS, TIER3_STOCKS, getFullCollectionStocks, getBasicCollectionStocks } from "../src/lib/stock-tiers";

// 기존: const tier1Tickers = new Set(TIER1_STOCKS.map((s) => s.ticker));
// 변경: 전체 수집 대상 = Tier 1 + Tier 2 (ETF 제외)
const fullCollectionTickers = new Set(getFullCollectionStocks().map(s => s.ticker));

// main() 내부:
const fullStocks = getFullCollectionStocks();    // Tier 1+2 개별주식 (~150개)
const basicStocks = getBasicCollectionStocks();  // Tier 3 (나머지 + ETF, ~375개)
const allStocks = [...fullStocks, ...basicStocks];

// 루프 내:
// 기존: if (isTier1) { financials, recommendations, ... }
// 변경: if (fullCollectionTickers.has(ticker)) { financials, recommendations, ... }
```

- [ ] **Step 2: `finnhub-collect/route.ts` (Vercel API) 동일하게 수정**

```typescript
import { getFullCollectionStocks, getBasicCollectionStocks } from "@/lib/stock-tiers";

// 기존: const tier1Tickers = new Set(TIER1_STOCKS.map((s) => s.ticker));
// 변경:
const fullCollectionTickers = new Set(getFullCollectionStocks().map(s => s.ticker));

// 루프 내:
// if (fullCollectionTickers.has(ticker)) { ... full collection ... }
```

- [ ] **Step 3: 빌드 확인**

Run: `cd app && npx tsc --noEmit`
Expected: 컴파일 에러 없음

- [ ] **Step 4: Commit**

```bash
git add app/scripts/collect-finnhub.ts app/src/app/api/cron/finnhub-collect/route.ts
git commit -m "feat: expand Tier 2 to full 6-API collection, ETF basic only"
```

---

### Task 3: SEC 수집 스크립트 — 새 티어 구조 반영

**Files:**
- Modify: `app/scripts/collect-sec.ts`

- [ ] **Step 1: `collect-sec.ts` ETF 필터링을 `isEtf` 기반으로 변경**

```typescript
import { TIER1_STOCKS, TIER2_STOCKS, TIER3_STOCKS } from "../src/lib/stock-tiers";

// 기존: 하드코딩된 ETF_TICKERS Set 제거
// 변경: isEtf 플래그 활용
const allStocks = [...TIER1_STOCKS, ...TIER2_STOCKS, ...TIER3_STOCKS];
const tickers = allStocks
  .filter((s) => !s.isEtf)
  .map((s) => s.ticker);
```

- [ ] **Step 2: Commit**

```bash
git add app/scripts/collect-sec.ts
git commit -m "refactor: use isEtf flag instead of hardcoded ETF set in SEC collector"
```

---

### Task 4: Cron 스케줄 변경 (09:00 → 06:30 KST)

**Files:**
- Modify: `.github/workflows/cron-finnhub.yml`
- Modify: `.github/workflows/cron-sec.yml`

- [ ] **Step 1: `cron-finnhub.yml` 시간 변경**

```yaml
on:
  schedule:
    - cron: '30 21 * * *'  # UTC 21:30 = KST 06:30 (서머타임: ET 17:30, 겨울: ET 16:30)
  workflow_dispatch:
```

timeout도 40분으로 유지 (1,660 calls ÷ 55 req/min ≈ 30분).

- [ ] **Step 2: `cron-sec.yml` 시간 변경**

Finnhub 완료 후 실행되도록 1시간 뒤:
```yaml
on:
  schedule:
    - cron: '30 22 * * *'  # UTC 22:30 = KST 07:30
  workflow_dispatch:
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/cron-finnhub.yml .github/workflows/cron-sec.yml
git commit -m "chore: change cron to 06:30 KST (post US market close)"
```

---

### Task 5: 종목별 AI 분석 캐시 테이블 생성

**Files:**
- Create: `supabase/migrations/005_stock_analysis_cache.sql`

- [ ] **Step 1: 마이그레이션 SQL 작성**

```sql
-- 005_stock_analysis_cache.sql
-- 종목별 AI 분석 사전 생성 캐시

CREATE TABLE IF NOT EXISTS stock_analysis_cache (
  ticker TEXT NOT NULL,
  analysis_date DATE NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  summary TEXT NOT NULL,              -- 종목 핵심 요약 (2-3문장, 한국어)
  key_points JSONB NOT NULL,          -- ["포인트1", "포인트2", ...]
  proactive_suggestion TEXT,          -- 선제적 제안 (nullable)
  related_tickers JSONB,              -- ["MSFT", "GOOGL", ...] 연관 종목
  data_freshness_key TEXT NOT NULL,   -- 데이터 갱신 시점 해시
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (ticker, analysis_date)
);

-- 날짜별 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_stock_analysis_date ON stock_analysis_cache (analysis_date);

-- 만료 데이터 정리용 (3일 이상)
CREATE INDEX IF NOT EXISTS idx_stock_analysis_generated ON stock_analysis_cache (generated_at);

-- RLS 설정
ALTER TABLE stock_analysis_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on stock_analysis_cache"
  ON stock_analysis_cache FOR ALL
  USING (true) WITH CHECK (true);

-- 시장 전체 분석 캐시 (greeting, marketOverview, macroAlert)
CREATE TABLE IF NOT EXISTS market_overview_cache (
  analysis_date DATE PRIMARY KEY,
  greeting TEXT NOT NULL,
  market_overview TEXT NOT NULL,
  macro_alert TEXT,
  data_freshness_key TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE market_overview_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on market_overview_cache"
  ON market_overview_cache FOR ALL
  USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Supabase에 마이그레이션 적용**

Supabase 대시보드 SQL Editor에서 실행하거나:
```bash
# 로컬 Supabase CLI가 설정되어 있다면:
supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/005_stock_analysis_cache.sql
git commit -m "feat: add stock_analysis_cache and market_overview_cache tables"
```

---

### Task 6: 종목별 AI 분석 생성 스크립트

**Files:**
- Create: `app/scripts/generate-stock-analysis.ts`

핵심: Finnhub 수집 완료 후 Tier 1+2 개별주식(150개)에 대해 Gemini로 종목별 분석 생성

- [ ] **Step 1: 스크립트 작성**

```typescript
/**
 * 종목별 AI 분석 사전 생성 스크립트 (GitHub Actions에서 Finnhub 수집 후 실행)
 *
 * - Tier 1+2 개별주식 (약 150개) 대상
 * - Gemini 2.5 Flash로 종목별 분석 생성
 * - stock_analysis_cache 테이블에 저장
 * - market_overview_cache에 시장 전체 분석 저장
 *
 * 실행: npx tsx scripts/generate-stock-analysis.ts
 * 환경변수: GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { getAnalysisTargetStocks } from "../src/lib/stock-tiers";
import { supabase } from "../src/lib/supabase";
import crypto from "crypto";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
const BATCH_SIZE = 2;  // 동시 Gemini 호출 수 (무료 Tier 10 RPM 대응)
const DELAY_MS = 13000; // 배치 간 딜레이 (2req/13sec ≈ 9.2 RPM, 안전 마진 포함)

function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/** DB 데이터의 freshness 해시 생성 (특정 종목) */
async function getTickerFreshnessKey(ticker: string): Promise<string> {
  const [quotesRes, newsRes, filingsRes] = await Promise.all([
    supabase.from("stock_quotes").select("updated_at").eq("ticker", ticker).limit(1),
    supabase.from("stock_news").select("published_at")
      .contains("tickers", [ticker]).order("published_at", { ascending: false }).limit(1),
    supabase.from("sec_filings").select("filed_date")
      .eq("ticker", ticker).order("filed_date", { ascending: false }).limit(1),
  ]);

  const parts = [
    quotesRes.data?.[0]?.updated_at ?? "no-quote",
    newsRes.data?.[0]?.published_at ?? "no-news",
    filingsRes.data?.[0]?.filed_date ?? "no-filing",
  ];
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16);
}

/** 이미 최신 분석이 있는지 확인 */
async function hasUpToDateAnalysis(ticker: string, date: string, freshnessKey: string): Promise<boolean> {
  const { data } = await supabase
    .from("stock_analysis_cache")
    .select("data_freshness_key")
    .eq("ticker", ticker)
    .eq("analysis_date", date)
    .limit(1)
    .single();

  return data?.data_freshness_key === freshnessKey;
}

/** 종목 데이터를 DB에서 조회 */
async function fetchStockData(ticker: string) {
  const [quote, financials, recommendations, priceTargets, news, filings] = await Promise.all([
    supabase.from("stock_quotes").select("*").eq("ticker", ticker).single(),
    supabase.from("stock_financials").select("*").eq("ticker", ticker).single(),
    supabase.from("stock_recommendations").select("*").eq("ticker", ticker).single(),
    supabase.from("stock_price_targets").select("*").eq("ticker", ticker).single(),
    supabase.from("stock_news").select("*")
      .contains("tickers", [ticker]).order("published_at", { ascending: false }).limit(5),
    supabase.from("sec_filings").select("*")
      .eq("ticker", ticker).order("filed_date", { ascending: false }).limit(3),
  ]);

  return {
    quote: quote.data,
    financials: financials.data,
    recommendations: recommendations.data,
    priceTargets: priceTargets.data,
    news: news.data ?? [],
    filings: filings.data ?? [],
  };
}

/** 단일 종목 분석 프롬프트 */
function buildSingleStockPrompt(ticker: string, nameKr: string, data: Awaited<ReturnType<typeof fetchStockData>>): string {
  const q = data.quote;
  const f = data.financials;
  const r = data.recommendations;
  const pt = data.priceTargets;

  const quoteInfo = q
    ? `현재가 $${q.price} (${q.change >= 0 ? "+" : ""}${q.change_percent?.toFixed(2)}%), 전일 $${q.previous_close}`
    : "시세 정보 없음";

  const financialsInfo = f
    ? `PER ${f.pe_ratio ?? "N/A"}, 배당수익률 ${f.dividend_yield ?? "N/A"}%, 52주 고가 $${f.week52_high ?? "N/A"} 저가 $${f.week52_low ?? "N/A"}, 베타 ${f.beta ?? "N/A"}`
    : "재무지표 없음";

  const recsInfo = r
    ? `강력매수 ${r.strong_buy ?? 0}, 매수 ${r.buy ?? 0}, 보유 ${r.hold ?? 0}, 매도 ${r.sell ?? 0}, 강력매도 ${r.strong_sell ?? 0}`
    : "의견 없음";

  const targetInfo = pt
    ? `평균 $${pt.target_mean ?? "N/A"} (최고 $${pt.target_high ?? "N/A"}, 최저 $${pt.target_low ?? "N/A"})`
    : "목표가 없음";

  const newsInfo = data.news.length > 0
    ? data.news.map((n: Record<string, unknown>) => `- [${n.source}] ${n.title}: ${n.summary}`).join("\n")
    : "최근 뉴스 없음";

  const filingsInfo = data.filings.length > 0
    ? data.filings.map((f: Record<string, unknown>) => `- ${f.filing_type}: ${f.title} (${f.filed_date})`).join("\n")
    : "최근 공시 없음";

  return `당신은 한국 개인투자자를 위한 미국 주식 분석 AI입니다.
아래 데이터를 바탕으로 ${nameKr}(${ticker})의 오늘 분석을 JSON으로 생성하세요.

## 시세
${quoteInfo}

## 재무지표
${financialsInfo}

## 월가 애널리스트 의견
${recsInfo}

## 목표가
${targetInfo}

## 최근 뉴스
${newsInfo}

## 최근 SEC 공시
${filingsInfo}

## 출력 형식 (JSON만 출력, 다른 텍스트 없이)
{
  "sentiment": "positive|negative|neutral",
  "summary": "핵심 요약 2-3문장 (자연스러운 한국어)",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2"],
  "proactiveSuggestion": "선제적 제안 또는 null",
  "relatedTickers": ["연관 종목 티커"]
}

## 규칙
- 투자 조언이 아닌 정보 제공에 집중
- 수치는 정확하게 인용
- 선제적 제안은 구체적으로
- JSON만 출력`;
}

/** Gemini API 호출 (모델 fallback) */
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Model ${modelName} failed: ${msg}`);
      if (msg.includes("429") || msg.includes("404") || msg.includes("not found")) continue;
      throw err;
    }
  }
  throw new Error("All Gemini models exhausted");
}

/** 시장 전체 분석 생성 */
async function generateMarketOverview(date: string): Promise<void> {
  // 글로벌 뉴스 + 주요 지수 데이터 조회
  const { data: generalNews } = await supabase
    .from("stock_news")
    .select("title, summary")
    .eq("category", "general")
    .order("published_at", { ascending: false })
    .limit(10);

  const newsContext = (generalNews ?? [])
    .map((n: Record<string, unknown>) => `- ${n.title}: ${n.summary}`)
    .join("\n");

  const prompt = `당신은 한국 개인투자자를 위한 미국 시장 분석 AI입니다.
아래 최근 시장 뉴스를 바탕으로 오늘의 시장 개요를 JSON으로 생성하세요.

## 최근 시장 뉴스
${newsContext || "뉴스 데이터 없음"}

## 출력 형식 (JSON만 출력)
{
  "greeting": "간단한 인사 (예: 좋은 아침이에요! 밤사이 시장 소식을 정리했어요.)",
  "marketOverview": "전체 시장 요약 1-2문장",
  "macroAlert": "매크로 이벤트 경고 (없으면 null)"
}

## 규칙
- 자연스러운 한국어
- JSON만 출력`;

  const text = await callGemini(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

  const freshnessKey = crypto.createHash("sha256")
    .update(newsContext || "no-news")
    .digest("hex").slice(0, 16);

  await supabase.from("market_overview_cache").upsert(
    {
      analysis_date: date,
      greeting: parsed.greeting,
      market_overview: parsed.marketOverview,
      macro_alert: parsed.macroAlert || null,
      data_freshness_key: freshnessKey,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "analysis_date" }
  );

  console.log("Market overview generated");
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const today = todayKST();
  const stocks = getAnalysisTargetStocks();

  console.log(`=== 종목별 AI 분석 생성 시작: ${today} ===`);
  console.log(`대상: ${stocks.length}종목 (Tier 1+2 개별주식)`);

  // 1. 시장 전체 분석 생성
  await generateMarketOverview(today);

  // 2. 종목별 분석 생성 (배치)
  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (stock) => {
        // freshness 체크 — 이미 최신이면 스킵
        const freshnessKey = await getTickerFreshnessKey(stock.ticker);
        if (await hasUpToDateAnalysis(stock.ticker, today, freshnessKey)) {
          skipped++;
          return;
        }

        // DB에서 종목 데이터 조회
        const data = await fetchStockData(stock.ticker);

        // Gemini로 분석 생성
        const prompt = buildSingleStockPrompt(stock.ticker, stock.nameKr, data);
        const text = await callGemini(prompt);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);

        // DB에 저장
        await supabase.from("stock_analysis_cache").upsert(
          {
            ticker: stock.ticker,
            analysis_date: today,
            sentiment: parsed.sentiment,
            summary: parsed.summary,
            key_points: parsed.keyPoints,
            proactive_suggestion: parsed.proactiveSuggestion || null,
            related_tickers: parsed.relatedTickers || [],
            data_freshness_key: freshnessKey,
            generated_at: new Date().toISOString(),
          },
          { onConflict: "ticker,analysis_date" }
        );

        generated++;
      })
    );

    // 에러 카운트
    for (const r of results) {
      if (r.status === "rejected") {
        errors++;
        console.error(`  Error: ${r.reason}`);
      }
    }

    if ((i + BATCH_SIZE) < stocks.length) {
      const progress = Math.min(i + BATCH_SIZE, stocks.length);
      console.log(`[${progress}/${stocks.length}] generated=${generated} skipped=${skipped} errors=${errors}`);
      await sleep(DELAY_MS);
    }
  }

  // 3. 오래된 캐시 정리 (3일 이상)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  await supabase.from("stock_analysis_cache")
    .delete()
    .lt("generated_at", threeDaysAgo.toISOString());
  await supabase.from("market_overview_cache")
    .delete()
    .lt("generated_at", threeDaysAgo.toISOString());

  console.log(`\n=== 분석 생성 완료 ===`);
  console.log(`Generated: ${generated}, Skipped: ${skipped}, Errors: ${errors}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

- [ ] **Step 2: GitHub Actions에 분석 생성 단계 추가**

`.github/workflows/cron-finnhub.yml`에 추가:

```yaml
      - name: Collect Finnhub data
        env:
          FINNHUB_API_KEY: ${{ secrets.FINNHUB_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: cd app && npx tsx scripts/collect-finnhub.ts

      - name: Generate stock analysis cache
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: cd app && npx tsx scripts/generate-stock-analysis.ts
```

timeout을 60분으로 늘리기 (Finnhub 30분 + AI 분석 ~15분 + 버퍼):
```yaml
    timeout-minutes: 60
```

- [ ] **Step 3: Commit**

```bash
git add app/scripts/generate-stock-analysis.ts .github/workflows/cron-finnhub.yml
git commit -m "feat: add stock analysis pre-generation script with Gemini"
```

---

### Task 7: 브리핑 API — 캐시된 종목별 분석 조합 방식으로 전환

**Files:**
- Modify: `app/src/app/api/briefing/route.ts`

핵심: 기존의 "전체 포트폴리오를 Gemini에 보내서 한 번에 생성" → "캐시된 종목별 분석을 DB에서 조회 + 조합"

- [ ] **Step 1: `buildSingleFallbackCard` 헬퍼 함수 추가 (기존 `buildFallbackBriefing`에서 추출)**

기존 `buildFallbackBriefing`의 카드 생성 로직을 단일 종목용으로 분리:

```typescript
/** 단일 종목 fallback 카드 생성 (캐시 미스 시 사용) */
function buildSingleFallbackCard(
  holding: StockHolding,
  quotes: Record<string, StockQuote>,
  news: NewsItem[],
  filings: SecFiling[],
): BriefingCard {
  const quote = quotes[holding.ticker];
  const relatedNews = news.filter((n) => n.relatedTickers.includes(holding.ticker));
  const tickerFilings = filings.filter((f) => f.ticker === holding.ticker);

  const sentiment: "positive" | "negative" | "neutral" =
    quote && quote.changePercent > 1 ? "positive" :
    quote && quote.changePercent < -1 ? "negative" : "neutral";

  const summaryParts: string[] = [];
  if (quote) {
    const direction = quote.change >= 0 ? "상승" : "하락";
    summaryParts.push(`${holding.nameKr}은(는) 전일 대비 ${Math.abs(quote.changePercent).toFixed(2)}% ${direction}했습니다.`);
  }
  if (relatedNews.length > 0) summaryParts.push(relatedNews[0].summary);

  const keyPoints: string[] = [];
  if (relatedNews.length > 0) keyPoints.push(relatedNews[0].title);
  if (quote) keyPoints.push(`현재가 $${quote.price.toFixed(2)} (${quote.change >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%)`);

  return {
    ticker: holding.ticker,
    nameKr: holding.nameKr,
    sentiment,
    summary: summaryParts.join(" ") || `${holding.nameKr} 데이터를 확인 중입니다.`,
    keyPoints,
    relatedNews: relatedNews.slice(0, 2),
    quote,
    recentFilings: tickerFilings.slice(0, 3),
  };
}
```

- [ ] **Step 2: 캐시된 종목별 분석 + 시장 분석 조회 함수 추가**

```typescript
/** 종목별 캐시된 분석 조회 */
async function getCachedStockAnalysis(tickers: string[]): Promise<Record<string, {
  sentiment: string;
  summary: string;
  keyPoints: string[];
  proactiveSuggestion: string | null;
  relatedTickers: string[];
}>> {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

  const { data } = await supabase
    .from("stock_analysis_cache")
    .select("*")
    .in("ticker", tickers)
    .eq("analysis_date", today);

  const result: Record<string, any> = {};
  for (const row of data ?? []) {
    result[row.ticker] = {
      sentiment: row.sentiment,
      summary: row.summary,
      keyPoints: row.key_points,
      proactiveSuggestion: row.proactive_suggestion,
      relatedTickers: row.related_tickers,
    };
  }
  return result;
}

/** 시장 전체 분석 조회 */
async function getCachedMarketOverview(): Promise<{
  greeting: string;
  marketOverview: string;
  macroAlert: string | null;
} | null> {
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

  const { data } = await supabase
    .from("market_overview_cache")
    .select("*")
    .eq("analysis_date", today)
    .single();

  if (!data) return null;
  return {
    greeting: data.greeting,
    marketOverview: data.market_overview,
    macroAlert: data.macro_alert,
  };
}
```

- [ ] **Step 3: POST 핸들러 재구성**

새 흐름:
1. 포트폴리오 종목의 캐시된 분석 조회
2. 캐시에 있는 종목 → 즉시 조합
3. 캐시에 없는 종목(Tier 3/on-demand) → 기존처럼 Gemini 실시간 호출
4. 페르소나는 greeting 톤 조정에만 사용 (종목 분석은 공통)

```typescript
export async function POST(request: NextRequest) {
  try {
    const { portfolio, persona, forceRefresh } = (await request.json()) as {
      portfolio: StockHolding[];
      persona?: Persona;
      forceRefresh?: boolean;
    };
    if (!portfolio || portfolio.length === 0) {
      return Response.json({ error: "포트폴리오가 비어있습니다." }, { status: 400 });
    }

    const tickers = portfolio.map((h) => h.ticker);

    // 1. 캐시된 종목별 분석 + 시장 분석 조회
    const [cachedAnalysis, marketOverview, marketData] = await Promise.all([
      forceRefresh ? {} : getCachedStockAnalysis(tickers),
      getCachedMarketOverview(),
      fetchMarketData(tickers),
    ]);

    const { quotes, news, filings } = marketData;

    // 2. 캐시 HIT된 종목과 MISS된 종목 분리
    const cachedTickers = Object.keys(cachedAnalysis);
    const uncachedPortfolio = portfolio.filter(h => !cachedTickers.includes(h.ticker));

    // 3. 캐시 HIT 종목 → BriefingCard 조합
    const cachedCards: BriefingCard[] = portfolio
      .filter(h => cachedTickers.includes(h.ticker))
      .map(h => {
        const analysis = cachedAnalysis[h.ticker];
        return {
          ticker: h.ticker,
          nameKr: h.nameKr,
          sentiment: analysis.sentiment as "positive" | "negative" | "neutral",
          summary: analysis.summary,
          keyPoints: analysis.keyPoints,
          proactivesuggestion: analysis.proactiveSuggestion || undefined,
          relatedNews: news.filter(n => n.relatedTickers.includes(h.ticker)).slice(0, 2),
          quote: quotes[h.ticker] || undefined,
          recentFilings: filings.filter(f => f.ticker === h.ticker).slice(0, 3),
        };
      });

    // 4. 카드 합치기 (포트폴리오 순서 유지)
    // 캐시 HIT → 캐시 카드 사용, MISS → fallback 카드 생성
    const allCards = portfolio.map(h => {
      return cachedCards.find(c => c.ticker === h.ticker)
        || buildSingleFallbackCard(h, quotes, news, filings);
    });

    // 6. 결과 조합
    const result: DailyBriefing = {
      date: new Date().toISOString().split("T")[0],
      generatedAt: getKSTString(),
      greeting: marketOverview?.greeting || "좋은 아침이에요! 밤사이 미국 시장 소식을 정리했어요.",
      marketOverview: marketOverview?.marketOverview || "시장 데이터를 분석 중입니다.",
      cards: allCards,
      macroAlert: marketOverview?.macroAlert || undefined,
      source: "gemini",
      dataSource: marketData.dataSource,
      cached: cachedTickers.length > 0,
      cachedAt: cachedTickers.length > 0 ? getKSTString() : undefined,
    };

    return Response.json(result);
  } catch (error) {
    console.error("Briefing generation error:", error);
    return Response.json(
      { error: `브리핑 생성 오류: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: 기존 포트폴리오 단위 캐시 코드 정리**

더 이상 `briefing_cache` 테이블 기반의 포트폴리오 단위 캐시는 불필요.
`buildCacheKey`, `getDataFreshnessKey` (전체용), `getCachedBriefing`, `saveBriefingCache` 함수 제거.

> `briefing_cache` 테이블 자체는 나중에 정리. 코드에서 참조만 제거.

- [ ] **Step 5: 빌드 확인**

Run: `cd app && npx tsc --noEmit`
Expected: 컴파일 에러 없음

- [ ] **Step 6: Commit**

```bash
git add app/src/app/api/briefing/route.ts
git commit -m "feat: switch briefing to per-stock cached analysis assembly"
```

---

### Task 8: 기타 참조 파일 업데이트

**Files:**
- Modify: `app/src/lib/tier3-ondemand.ts`
- Modify: `app/src/app/api/stocks/search/route.ts`
- Modify: `app/src/components/PortfolioForm.tsx` (if needed)

- [ ] **Step 1: `tier3-ondemand.ts` — 새 티어 구조 반영**

기존 로직은 동일 (on-demand로 Finnhub 조회 → DB 캐시).
`getTierForTicker` 반환값이 1, 2, 3 중 하나이므로 로직 변경 불필요.
단, 이제 Tier 3에 실제 종목이 있으므로 on-demand는 `getTierForTicker`가 null인 경우에만 작동.

```typescript
// 기존: if (existingTier === 1 || existingTier === 2) return null;
// 변경: Tier 1/2/3 모두 이미 관리되는 종목
const existingTier = getTierForTicker(upperTicker);
if (existingTier !== null) return null; // 이미 관리되는 종목
```

- [ ] **Step 2: `search/route.ts` — Tier 3 검색 포함 확인**

`getAllStocks()`가 이미 TIER3_STOCKS를 포함하므로 검색 로직 변경 불필요.
on-demand 호출 조건만 확인:
```typescript
// 기존: Tier 1/2에 없으면 on-demand
// 변경: Tier 1/2/3에 없으면 on-demand (getAllStocks에 이미 포함)
// → 변경 불필요 (getAllStocks가 3티어 모두 반환)
```

- [ ] **Step 3: 빌드 확인**

Run: `cd app && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add app/src/lib/tier3-ondemand.ts app/src/app/api/stocks/search/route.ts
git commit -m "refactor: update tier references for new 3-tier structure"
```

---

### Task 9: 문서 업데이트

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/DATA-CATALOG.md`

- [ ] **Step 1: CLAUDE.md 업데이트**

기술 스택 테이블:
```
| 종목 수 | Tier 1 (50) + Tier 2 (100 개별주식) + Tier 3 (375 개별주식+ETF) + On-demand |
```

Cron 섹션:
```
- `cron-finnhub.yml` — `30 21 * * *` (매일 06:30 KST, UTC 21:30) — Finnhub 수집 + AI 분석 생성
- `cron-sec.yml` — `30 22 * * *` (매일 07:30 KST, UTC 22:30) — SEC 공시 수집
```

DB 스키마에 추가:
```sql
-- 종목별 AI 분석 캐시 (005_stock_analysis_cache.sql)
stock_analysis_cache: ticker+analysis_date(PK), sentiment, summary, key_points(JSONB), proactive_suggestion, related_tickers(JSONB), data_freshness_key, generated_at
market_overview_cache: analysis_date(PK), greeting, market_overview, macro_alert, data_freshness_key, generated_at
```

- [ ] **Step 2: DATA-CATALOG.md 업데이트**

새 테이블 스키마 추가.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/DATA-CATALOG.md
git commit -m "docs: update for tier redesign, cron timing, and analysis cache"
```

---

## 실행 후 검증 체크리스트

- [ ] `cd app && npx tsc --noEmit` — 빌드 에러 없음
- [ ] `TIER1_STOCKS.length` = 50, `TIER2_STOCKS.length` = 100, `TIER3_STOCKS.length` ≈ 375
- [ ] `getFullCollectionStocks().length` ≈ 150 (Tier 1+2 개별주식)
- [ ] `getBasicCollectionStocks().length` ≈ 375 (Tier 3)
- [ ] ETF가 `TIER3_STOCKS`에만 있고 `isEtf: true`
- [ ] GitHub Actions cron이 `30 21 * * *` (UTC)로 설정
- [ ] `generate-stock-analysis.ts` 로컬 실행 테스트 (환경변수 필요)
- [ ] `/api/briefing` 호출 시 캐시된 분석 조합으로 응답
- [ ] 캐시 없는 종목은 fallback으로 처리
