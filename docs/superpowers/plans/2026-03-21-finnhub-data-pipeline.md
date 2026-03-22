# Finnhub 데이터 파이프라인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finnhub 무료 API로 1,000종목 실시간 데이터를 수집하고, Supabase에 캐싱하여 mock 데이터를 완전 교체한다.

**Architecture:** Finnhub API → 청크 기반 배치 수집 (60 req/분 내) → Supabase DB 캐싱 → Briefing API는 DB만 조회. Vercel Cron이 배치를 트리거하고, 각 실행에서 ~55 req씩 처리. batch_state 테이블로 진행 상태를 추적하여 여러 호출에 걸쳐 전체 종목 수집 완료.

**Tech Stack:** Finnhub REST API, Supabase (PostgreSQL), Next.js API Routes, Vercel Cron

---

## 제약 조건

| 제약 | 값 | 대응 |
|------|-----|------|
| Finnhub 무료 | 60 req/분 | 청크 배치 (55 req/호출) |
| Vercel Hobby 함수 | 60초 타임아웃 | 1회 호출 = 55 req 처리 |
| Vercel Hobby Cron | 최대 2개 | 1개는 배치 시작, 1개는 선택적 |

## 종목 티어

| 티어 | 수 | 수집 데이터 | 갱신 빈도 |
|------|-----|------------|----------|
| Tier 1 (핵심) | 50 | quote + news + financials + recommendations + price target + insider | 장중 30분, 장 외 1일 1회 |
| Tier 2 (인기) | 200 | quote + news | 장중 1시간, 장 외 1일 1회 |
| Tier 3 (일반) | 750 | quote only | 장 외 1일 1회 |

## 파일 구조

### 새로 생성

| 파일 | 역할 |
|------|------|
| `app/src/lib/finnhub.ts` | Finnhub API 클라이언트 (rate limiter 내장) |
| `app/src/lib/stock-tiers.ts` | 1,000종목 티어 분류 데이터 |
| `app/src/app/api/cron/finnhub-collect/route.ts` | 청크 기반 배치 수집 엔드포인트 |
| `supabase/migrations/003_finnhub_tables.sql` | 신규 테이블 DDL |

### 수정

| 파일 | 변경 내용 |
|------|----------|
| `app/src/lib/types.ts` | 신규 타입 추가 (CompanyProfile, BasicFinancials 등) |
| `app/src/app/api/briefing/route.ts` | fetchMarketData를 신규 테이블 포함하도록 확장 |
| `app/src/app/api/cron/collect-data/route.ts` | Finnhub 배치 트리거로 교체 |
| `app/vercel.json` | Cron 스케줄 업데이트 |

---

## Task 1: Supabase 테이블 생성

**Files:**
- Create: `supabase/migrations/003_finnhub_tables.sql`

- [ ] **Step 1: 마이그레이션 SQL 작성**

```sql
-- 종목 마스터 (Company Profile)
CREATE TABLE IF NOT EXISTS stock_profiles (
  ticker        text PRIMARY KEY,
  name          text,
  name_kr       text,
  sector        text,
  market_cap    bigint,
  logo_url      text,
  website_url   text,
  tier          int NOT NULL DEFAULT 3,  -- 1, 2, 3
  updated_at    timestamptz DEFAULT now()
);

-- 주가 캐시 (이미 존재하지만 재정의)
CREATE TABLE IF NOT EXISTS stock_quotes (
  ticker          text PRIMARY KEY,
  price           numeric,
  change          numeric,
  change_percent  numeric,
  previous_close  numeric,
  high            numeric,
  low             numeric,
  open            numeric,
  updated_at      timestamptz DEFAULT now()
);

-- 종목 뉴스 (이미 존재하지만 구조 개선)
CREATE TABLE IF NOT EXISTS stock_news (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tickers         text[],
  title           text NOT NULL,
  summary         text,
  source          text,
  url             text,
  image_url       text,
  published_at    timestamptz,
  sentiment       text DEFAULT 'neutral',
  category        text DEFAULT 'company',  -- 'company' | 'general'
  collected_date  date DEFAULT CURRENT_DATE,
  UNIQUE(url, collected_date)
);

-- 기본 재무지표
CREATE TABLE IF NOT EXISTS stock_financials (
  ticker          text PRIMARY KEY,
  pe_ratio        numeric,
  pb_ratio        numeric,
  dividend_yield  numeric,
  week52_high     numeric,
  week52_low      numeric,
  market_cap      bigint,
  beta            numeric,
  updated_at      timestamptz DEFAULT now()
);

-- 애널리스트 투자의견
CREATE TABLE IF NOT EXISTS stock_recommendations (
  ticker      text PRIMARY KEY,
  buy         int DEFAULT 0,
  hold        int DEFAULT 0,
  sell        int DEFAULT 0,
  strong_buy  int DEFAULT 0,
  strong_sell int DEFAULT 0,
  period      text,
  updated_at  timestamptz DEFAULT now()
);

-- 목표가
CREATE TABLE IF NOT EXISTS stock_price_targets (
  ticker        text PRIMARY KEY,
  target_high   numeric,
  target_low    numeric,
  target_mean   numeric,
  target_median numeric,
  updated_at    timestamptz DEFAULT now()
);

-- 투자등급 변경
CREATE TABLE IF NOT EXISTS stock_upgrades (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticker      text NOT NULL,
  company     text,          -- 증권사명
  action      text,          -- upgrade, downgrade, init, etc
  from_grade  text,
  to_grade    text,
  graded_at   date,
  collected_date date DEFAULT CURRENT_DATE,
  UNIQUE(ticker, company, graded_at)
);

-- 내부자 거래
CREATE TABLE IF NOT EXISTS stock_insider_transactions (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticker          text NOT NULL,
  person_name     text,
  position        text,
  transaction_type text,  -- buy, sell, etc
  shares          numeric,
  price           numeric,
  filed_at        date,
  collected_date  date DEFAULT CURRENT_DATE,
  UNIQUE(ticker, person_name, filed_at, transaction_type)
);

-- 어닝 캘린더
CREATE TABLE IF NOT EXISTS earnings_calendar (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticker      text NOT NULL,
  report_date date,
  eps_estimate numeric,
  eps_actual   numeric,
  revenue_estimate bigint,
  revenue_actual   bigint,
  quarter     text,
  UNIQUE(ticker, report_date)
);

-- 배치 진행 상태 추적
CREATE TABLE IF NOT EXISTS batch_state (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_type    text NOT NULL,        -- 'daily' | 'intraday'
  batch_date    date NOT NULL,
  current_offset int DEFAULT 0,       -- 현재까지 처리된 종목 수
  total_count   int NOT NULL,
  status        text DEFAULT 'pending', -- 'pending' | 'running' | 'completed'
  started_at    timestamptz DEFAULT now(),
  completed_at  timestamptz,
  UNIQUE(batch_type, batch_date)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_stock_news_published ON stock_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_news_category ON stock_news(category);
CREATE INDEX IF NOT EXISTS idx_stock_upgrades_date ON stock_upgrades(graded_at DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_date ON earnings_calendar(report_date);
CREATE INDEX IF NOT EXISTS idx_batch_state_date ON batch_state(batch_date, batch_type);
```

- [ ] **Step 2: Supabase 대시보드에서 SQL 실행**

Supabase → SQL Editor → 위 SQL 붙여넣기 → Run.

- [ ] **Step 3: 테이블 생성 확인**

Supabase → Table Editor에서 9개 테이블 확인:
stock_profiles, stock_quotes, stock_news, stock_financials, stock_recommendations, stock_price_targets, stock_upgrades, stock_insider_transactions, earnings_calendar, batch_state

---

## Task 2: 타입 정의 추가

**Files:**
- Modify: `app/src/lib/types.ts`

- [ ] **Step 1: 신규 인터페이스 추가**

types.ts 끝에 추가:

```typescript
export interface CompanyProfile {
  ticker: string;
  name: string;
  nameKr: string;
  sector: string;
  marketCap: number;
  logoUrl: string;
  websiteUrl: string;
  tier: 1 | 2 | 3;
}

export interface BasicFinancials {
  ticker: string;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
  week52High: number;
  week52Low: number;
  marketCap: number;
  beta: number | null;
}

export interface RecommendationTrend {
  ticker: string;
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

export interface PriceTarget {
  ticker: string;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
}

export interface UpgradeDowngrade {
  ticker: string;
  company: string;
  action: string;
  fromGrade: string;
  toGrade: string;
  gradedAt: string;
}

export interface InsiderTransaction {
  ticker: string;
  personName: string;
  position: string;
  transactionType: string;
  shares: number;
  price: number;
  filedAt: string;
}

export interface EarningsEvent {
  ticker: string;
  reportDate: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  quarter: string;
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/src/lib/types.ts
git commit -m "feat: add Finnhub data types (profiles, financials, recommendations, etc.)"
```

---

## Task 3: 종목 티어 데이터

**Files:**
- Create: `app/src/lib/stock-tiers.ts`

- [ ] **Step 1: 1,000종목 티어 분류 파일 생성**

```typescript
// 한국 개미투자자 인기 미국주식 1,000종목 (티어별 분류)
// Tier 1: 핵심 50개 — 한국인이 가장 많이 거래하는 종목
// Tier 2: 인기 200개 — 자주 언급/거래되는 종목
// Tier 3: 일반 750개 — 나머지 주요 종목

export interface TieredStock {
  ticker: string;
  name: string;
  nameKr: string;
  tier: 1 | 2 | 3;
}

export const TIER1_STOCKS: TieredStock[] = [
  { ticker: "AAPL", name: "Apple Inc.", nameKr: "애플", tier: 1 },
  { ticker: "MSFT", name: "Microsoft Corp.", nameKr: "마이크로소프트", tier: 1 },
  { ticker: "NVDA", name: "NVIDIA Corp.", nameKr: "엔비디아", tier: 1 },
  { ticker: "TSLA", name: "Tesla Inc.", nameKr: "테슬라", tier: 1 },
  { ticker: "AMZN", name: "Amazon.com Inc.", nameKr: "아마존", tier: 1 },
  { ticker: "GOOGL", name: "Alphabet Inc.", nameKr: "알파벳", tier: 1 },
  { ticker: "META", name: "Meta Platforms", nameKr: "메타", tier: 1 },
  { ticker: "AMD", name: "AMD Inc.", nameKr: "AMD", tier: 1 },
  { ticker: "NFLX", name: "Netflix Inc.", nameKr: "넷플릭스", tier: 1 },
  { ticker: "COIN", name: "Coinbase Global", nameKr: "코인베이스", tier: 1 },
  { ticker: "PLTR", name: "Palantir Technologies", nameKr: "팔란티어", tier: 1 },
  { ticker: "SOFI", name: "SoFi Technologies", nameKr: "소파이", tier: 1 },
  { ticker: "NIO", name: "NIO Inc.", nameKr: "니오", tier: 1 },
  { ticker: "BABA", name: "Alibaba Group", nameKr: "알리바바", tier: 1 },
  { ticker: "BA", name: "Boeing Co.", nameKr: "보잉", tier: 1 },
  { ticker: "DIS", name: "Walt Disney Co.", nameKr: "디즈니", tier: 1 },
  { ticker: "JPM", name: "JPMorgan Chase", nameKr: "JP모건", tier: 1 },
  { ticker: "V", name: "Visa Inc.", nameKr: "비자", tier: 1 },
  { ticker: "MA", name: "Mastercard Inc.", nameKr: "마스터카드", tier: 1 },
  { ticker: "CRM", name: "Salesforce Inc.", nameKr: "세일즈포스", tier: 1 },
  { ticker: "INTC", name: "Intel Corp.", nameKr: "인텔", tier: 1 },
  { ticker: "PYPL", name: "PayPal Holdings", nameKr: "페이팔", tier: 1 },
  { ticker: "SQ", name: "Block Inc.", nameKr: "블록(스퀘어)", tier: 1 },
  { ticker: "SHOP", name: "Shopify Inc.", nameKr: "쇼피파이", tier: 1 },
  { ticker: "UBER", name: "Uber Technologies", nameKr: "우버", tier: 1 },
  { ticker: "SNAP", name: "Snap Inc.", nameKr: "스냅", tier: 1 },
  { ticker: "RBLX", name: "Roblox Corp.", nameKr: "로블록스", tier: 1 },
  { ticker: "ROKU", name: "Roku Inc.", nameKr: "로쿠", tier: 1 },
  { ticker: "MARA", name: "Marathon Digital", nameKr: "마라톤디지털", tier: 1 },
  { ticker: "RIOT", name: "Riot Platforms", nameKr: "라이엇", tier: 1 },
  { ticker: "MU", name: "Micron Technology", nameKr: "마이크론", tier: 1 },
  { ticker: "AVGO", name: "Broadcom Inc.", nameKr: "브로드컴", tier: 1 },
  { ticker: "QCOM", name: "Qualcomm Inc.", nameKr: "퀄컴", tier: 1 },
  { ticker: "COST", name: "Costco Wholesale", nameKr: "코스트코", tier: 1 },
  { ticker: "WMT", name: "Walmart Inc.", nameKr: "월마트", tier: 1 },
  { ticker: "KO", name: "Coca-Cola Co.", nameKr: "코카콜라", tier: 1 },
  { ticker: "PEP", name: "PepsiCo Inc.", nameKr: "펩시코", tier: 1 },
  { ticker: "JNJ", name: "Johnson & Johnson", nameKr: "존슨앤존슨", tier: 1 },
  { ticker: "PFE", name: "Pfizer Inc.", nameKr: "화이자", tier: 1 },
  { ticker: "MRNA", name: "Moderna Inc.", nameKr: "모더나", tier: 1 },
  { ticker: "XOM", name: "Exxon Mobil", nameKr: "엑슨모빌", tier: 1 },
  { ticker: "CVX", name: "Chevron Corp.", nameKr: "셰브론", tier: 1 },
  { ticker: "BRK.B", name: "Berkshire Hathaway B", nameKr: "버크셔해서웨이", tier: 1 },
  { ticker: "UNH", name: "UnitedHealth Group", nameKr: "유나이티드헬스", tier: 1 },
  { ticker: "HD", name: "Home Depot", nameKr: "홈디포", tier: 1 },
  { ticker: "ABNB", name: "Airbnb Inc.", nameKr: "에어비앤비", tier: 1 },
  { ticker: "ARM", name: "Arm Holdings", nameKr: "ARM", tier: 1 },
  { ticker: "SMCI", name: "Super Micro Computer", nameKr: "슈퍼마이크로", tier: 1 },
  { ticker: "MSTR", name: "MicroStrategy", nameKr: "마이크로스트래티지", tier: 1 },
  { ticker: "IONQ", name: "IonQ Inc.", nameKr: "아이온큐", tier: 1 },
];

// Tier 2: 200종목 — 한국 투자자 자주 거래 종목
// 실제 구현 시 전체 200개 포함. 여기서는 대표 종목만 나열.
// 전체 리스트는 Finnhub company profile API로 초기 수집 후 DB에서 관리.
export const TIER2_STOCKS: TieredStock[] = [
  { ticker: "PANW", name: "Palo Alto Networks", nameKr: "팔로알토", tier: 2 },
  { ticker: "CRWD", name: "CrowdStrike", nameKr: "크라우드스트라이크", tier: 2 },
  { ticker: "SNOW", name: "Snowflake Inc.", nameKr: "스노우플레이크", tier: 2 },
  { ticker: "NET", name: "Cloudflare Inc.", nameKr: "클라우드플레어", tier: 2 },
  { ticker: "DDOG", name: "Datadog Inc.", nameKr: "데이터독", tier: 2 },
  { ticker: "ZS", name: "Zscaler Inc.", nameKr: "지스케일러", tier: 2 },
  { ticker: "OKTA", name: "Okta Inc.", nameKr: "옥타", tier: 2 },
  { ticker: "PINS", name: "Pinterest Inc.", nameKr: "핀터레스트", tier: 2 },
  { ticker: "LYFT", name: "Lyft Inc.", nameKr: "리프트", tier: 2 },
  { ticker: "RIVN", name: "Rivian Automotive", nameKr: "리비안", tier: 2 },
  { ticker: "LCID", name: "Lucid Group", nameKr: "루시드", tier: 2 },
  { ticker: "F", name: "Ford Motor", nameKr: "포드", tier: 2 },
  { ticker: "GM", name: "General Motors", nameKr: "GM", tier: 2 },
  { ticker: "T", name: "AT&T Inc.", nameKr: "AT&T", tier: 2 },
  { ticker: "VZ", name: "Verizon Communications", nameKr: "버라이즌", tier: 2 },
  { ticker: "ORCL", name: "Oracle Corp.", nameKr: "오라클", tier: 2 },
  { ticker: "IBM", name: "IBM Corp.", nameKr: "IBM", tier: 2 },
  { ticker: "CSCO", name: "Cisco Systems", nameKr: "시스코", tier: 2 },
  { ticker: "TXN", name: "Texas Instruments", nameKr: "텍사스인스트루먼트", tier: 2 },
  { ticker: "LRCX", name: "Lam Research", nameKr: "램리서치", tier: 2 },
  { ticker: "AMAT", name: "Applied Materials", nameKr: "어플라이드머티리얼즈", tier: 2 },
  { ticker: "KLAC", name: "KLA Corp.", nameKr: "KLA", tier: 2 },
  { ticker: "ASML", name: "ASML Holding", nameKr: "ASML", tier: 2 },
  { ticker: "TSM", name: "TSMC", nameKr: "TSMC", tier: 2 },
  { ticker: "ADBE", name: "Adobe Inc.", nameKr: "어도비", tier: 2 },
  { ticker: "NOW", name: "ServiceNow", nameKr: "서비스나우", tier: 2 },
  { ticker: "INTU", name: "Intuit Inc.", nameKr: "인튜이트", tier: 2 },
  { ticker: "ISRG", name: "Intuitive Surgical", nameKr: "인튜이티브서지컬", tier: 2 },
  { ticker: "REGN", name: "Regeneron Pharma", nameKr: "리제네론", tier: 2 },
  { ticker: "GILD", name: "Gilead Sciences", nameKr: "길리어드", tier: 2 },
  { ticker: "ABBV", name: "AbbVie Inc.", nameKr: "애브비", tier: 2 },
  { ticker: "LLY", name: "Eli Lilly", nameKr: "일라이릴리", tier: 2 },
  { ticker: "BMY", name: "Bristol-Myers Squibb", nameKr: "브리스톨마이어스", tier: 2 },
  { ticker: "ABT", name: "Abbott Laboratories", nameKr: "애보트", tier: 2 },
  { ticker: "TMO", name: "Thermo Fisher", nameKr: "써모피셔", tier: 2 },
  { ticker: "DHR", name: "Danaher Corp.", nameKr: "다나허", tier: 2 },
  { ticker: "MDT", name: "Medtronic", nameKr: "메드트로닉", tier: 2 },
  { ticker: "BAC", name: "Bank of America", nameKr: "뱅크오브아메리카", tier: 2 },
  { ticker: "WFC", name: "Wells Fargo", nameKr: "웰스파고", tier: 2 },
  { ticker: "GS", name: "Goldman Sachs", nameKr: "골드만삭스", tier: 2 },
  { ticker: "MS", name: "Morgan Stanley", nameKr: "모건스탠리", tier: 2 },
  { ticker: "C", name: "Citigroup", nameKr: "시티그룹", tier: 2 },
  { ticker: "AXP", name: "American Express", nameKr: "아멕스", tier: 2 },
  { ticker: "SCHW", name: "Charles Schwab", nameKr: "찰스슈왑", tier: 2 },
  { ticker: "BLK", name: "BlackRock", nameKr: "블랙록", tier: 2 },
  { ticker: "SPGI", name: "S&P Global", nameKr: "S&P글로벌", tier: 2 },
  { ticker: "CME", name: "CME Group", nameKr: "CME그룹", tier: 2 },
  { ticker: "ICE", name: "Intercontinental Exchange", nameKr: "ICE", tier: 2 },
  { ticker: "PG", name: "Procter & Gamble", nameKr: "P&G", tier: 2 },
  { ticker: "NKE", name: "Nike Inc.", nameKr: "나이키", tier: 2 },
  // ... 나머지 Tier 2 종목은 구현 시 전체 200개로 확장
];

// Tier 3: 750종목 — S&P 500 + 나스닥 100 기반
// 티어 3은 Finnhub stock list API로 자동 수집 후 DB에서 관리
// 초기에는 빈 배열, stock_profiles 테이블에서 tier=3으로 조회
export const TIER3_STOCKS: TieredStock[] = [];

// 헬퍼 함수
export function getAllStocks(): TieredStock[] {
  return [...TIER1_STOCKS, ...TIER2_STOCKS, ...TIER3_STOCKS];
}

export function getStocksByTier(tier: 1 | 2 | 3): TieredStock[] {
  return getAllStocks().filter((s) => s.tier === tier);
}

export function getTierForTicker(ticker: string): 1 | 2 | 3 {
  if (TIER1_STOCKS.some((s) => s.ticker === ticker)) return 1;
  if (TIER2_STOCKS.some((s) => s.ticker === ticker)) return 2;
  return 3;
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/src/lib/stock-tiers.ts
git commit -m "feat: add 1000-stock tier classification (T1:50, T2:200, T3:750)"
```

---

## Task 4: Finnhub API 클라이언트

**Files:**
- Create: `app/src/lib/finnhub.ts`

- [ ] **Step 1: Rate-limited Finnhub 클라이언트 작성**

```typescript
// Finnhub API 클라이언트 — 내장 rate limiter (60 req/분)

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const MAX_REQUESTS_PER_MINUTE = 55; // 60한도에서 여유 5

let requestCount = 0;
let windowStart = Date.now();

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  if (now - windowStart > 60_000) {
    requestCount = 0;
    windowStart = now;
  }

  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const waitMs = 60_000 - (now - windowStart) + 100;
    await new Promise((r) => setTimeout(r, waitMs));
    requestCount = 0;
    windowStart = Date.now();
  }

  requestCount++;
  const res = await fetch(url);

  if (res.status === 429) {
    // Rate limited — wait and retry
    await new Promise((r) => setTimeout(r, 2000));
    requestCount = 0;
    windowStart = Date.now();
    return rateLimitedFetch(url);
  }

  return res;
}

function buildUrl(path: string, params: Record<string, string>): string {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error("FINNHUB_API_KEY not set");
  const searchParams = new URLSearchParams({ ...params, token: apiKey });
  return `${FINNHUB_BASE}${path}?${searchParams}`;
}

// ── 개별 API 함수들 ──

export async function fetchQuote(ticker: string) {
  const url = buildUrl("/quote", { symbol: ticker });
  const res = await rateLimitedFetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.c === 0) return null; // 유효하지 않은 데이터
  return {
    ticker,
    price: data.c,           // current price
    change: data.d,           // change
    changePercent: data.dp,   // change percent
    previousClose: data.pc,   // previous close
    high: data.h,
    low: data.l,
    open: data.o,
  };
}

export async function fetchCompanyProfile(ticker: string) {
  const url = buildUrl("/stock/profile2", { symbol: ticker });
  const res = await rateLimitedFetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || !data.ticker) return null;
  return {
    ticker: data.ticker,
    name: data.name,
    sector: data.finnhubIndustry,
    marketCap: data.marketCapitalization,
    logoUrl: data.logo,
    websiteUrl: data.weburl,
  };
}

export async function fetchCompanyNews(ticker: string, fromDate: string, toDate: string) {
  const url = buildUrl("/company-news", { symbol: ticker, from: fromDate, to: toDate });
  const res = await rateLimitedFetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data || []).slice(0, 5).map((n: Record<string, unknown>) => ({
    title: n.headline as string,
    summary: n.summary as string,
    source: n.source as string,
    url: n.url as string,
    imageUrl: n.image as string,
    publishedAt: new Date((n.datetime as number) * 1000).toISOString(),
    relatedTickers: [ticker],
  }));
}

export async function fetchGeneralNews() {
  const url = buildUrl("/news", { category: "general" });
  const res = await rateLimitedFetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data || []).slice(0, 100).map((n: Record<string, unknown>) => ({
    title: n.headline as string,
    summary: n.summary as string,
    source: n.source as string,
    url: n.url as string,
    imageUrl: n.image as string,
    publishedAt: new Date((n.datetime as number) * 1000).toISOString(),
    relatedTickers: [] as string[],
  }));
}

export async function fetchBasicFinancials(ticker: string) {
  const url = buildUrl("/stock/metric", { symbol: ticker, metric: "all" });
  const res = await rateLimitedFetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const m = data?.metric;
  if (!m) return null;
  return {
    ticker,
    peRatio: m.peBasicExclExtraTTM ?? null,
    pbRatio: m.pbQuarterly ?? null,
    dividendYield: m.dividendYieldIndicatedAnnual ?? null,
    week52High: m["52WeekHigh"],
    week52Low: m["52WeekLow"],
    marketCap: m.marketCapitalization ?? null,
    beta: m.beta ?? null,
  };
}

export async function fetchRecommendationTrends(ticker: string) {
  const url = buildUrl("/stock/recommendation", { symbol: ticker });
  const res = await rateLimitedFetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.length === 0) return null;
  const latest = data[0]; // 가장 최근 월
  return {
    ticker,
    buy: latest.buy,
    hold: latest.hold,
    sell: latest.sell,
    strongBuy: latest.strongBuy,
    strongSell: latest.strongSell,
    period: latest.period,
  };
}

export async function fetchPriceTarget(ticker: string) {
  const url = buildUrl("/stock/price-target", { symbol: ticker });
  const res = await rateLimitedFetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || !data.targetMean) return null;
  return {
    ticker,
    targetHigh: data.targetHigh,
    targetLow: data.targetLow,
    targetMean: data.targetMean,
    targetMedian: data.targetMedian,
  };
}

export async function fetchUpgradesDowngrades(fromDate: string, toDate: string) {
  const url = buildUrl("/upgrade-downgrade", { from: fromDate, to: toDate });
  const res = await rateLimitedFetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data || []).map((u: Record<string, unknown>) => ({
    ticker: u.symbol as string,
    company: u.company as string,
    action: u.action as string,
    fromGrade: u.fromGrade as string,
    toGrade: u.toGrade as string,
    gradedAt: u.gradeTime as string,
  }));
}

export async function fetchInsiderTransactions(ticker: string) {
  const url = buildUrl("/stock/insider-transactions", { symbol: ticker });
  const res = await rateLimitedFetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.data || []).slice(0, 10).map((t: Record<string, unknown>) => ({
    ticker,
    personName: t.name as string,
    position: (t.position ?? "") as string,
    transactionType: t.transactionType as string,
    shares: t.share as number,
    price: t.price as number,
    filedAt: t.filingDate as string,
  }));
}

export async function fetchEarningsCalendar(fromDate: string, toDate: string) {
  const url = buildUrl("/calendar/earnings", { from: fromDate, to: toDate });
  const res = await rateLimitedFetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.earningsCalendar || []).map((e: Record<string, unknown>) => ({
    ticker: e.symbol as string,
    reportDate: e.date as string,
    epsEstimate: e.epsEstimate as number | null,
    epsActual: e.epsActual as number | null,
    revenueEstimate: e.revenueEstimate as number | null,
    revenueActual: e.revenueActual as number | null,
    quarter: `${e.year}Q${e.quarter}`,
  }));
}

// ── 배치 헬퍼: 여러 종목의 quote를 배열로 ──
export async function fetchQuotesBatch(tickers: string[]) {
  const results = [];
  for (const ticker of tickers) {
    const quote = await fetchQuote(ticker);
    if (quote) results.push(quote);
  }
  return results;
}

// ── API 요청 카운터 (디버깅용) ──
export function getRequestCount() {
  return requestCount;
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/src/lib/finnhub.ts
git commit -m "feat: add Finnhub API client with built-in rate limiter"
```

---

## Task 5: 배치 수집 엔드포인트 (청크 기반)

**Files:**
- Create: `app/src/app/api/cron/finnhub-collect/route.ts`

- [ ] **Step 1: 청크 기반 배치 수집 라우트 작성**

이 엔드포인트는 한 번 호출될 때 ~55개 API 요청을 처리하고, batch_state에 진행 상태를 저장한다.
여러 번 호출하면 전체 배치가 완료된다.

```typescript
import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { TIER1_STOCKS, TIER2_STOCKS } from "@/lib/stock-tiers";
import * as finnhub from "@/lib/finnhub";

const CHUNK_SIZE = 25; // 종목당 2 req (quote + 1 extra) = 50 req, 여유 10

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getToday();
  const { from: fromDate, to: toDate } = getDateRange();
  const allStocks = [...TIER1_STOCKS, ...TIER2_STOCKS];

  try {
    // 1. batch_state 조회/생성
    let { data: batch } = await supabase
      .from("batch_state")
      .select("*")
      .eq("batch_type", "daily")
      .eq("batch_date", today)
      .single();

    if (!batch) {
      const { data: newBatch } = await supabase
        .from("batch_state")
        .upsert({
          batch_type: "daily",
          batch_date: today,
          current_offset: 0,
          total_count: allStocks.length,
          status: "running",
        }, { onConflict: "batch_type,batch_date" })
        .select()
        .single();
      batch = newBatch;
    }

    if (batch?.status === "completed") {
      return Response.json({
        message: "오늘 배치 이미 완료",
        completedAt: batch.completed_at,
      });
    }

    const offset = batch?.current_offset ?? 0;
    const chunk = allStocks.slice(offset, offset + CHUNK_SIZE);

    if (chunk.length === 0) {
      // 모든 종목 처리 완료 — 글로벌 데이터 수집
      const [generalNews, earnings, upgrades] = await Promise.all([
        finnhub.fetchGeneralNews(),
        finnhub.fetchEarningsCalendar(fromDate, toDate),
        finnhub.fetchUpgradesDowngrades(fromDate, toDate),
      ]);

      // 시장 전체 뉴스 저장
      if (generalNews.length > 0) {
        const newsRows = generalNews.map((n) => ({
          tickers: [],
          title: n.title,
          summary: n.summary,
          source: n.source,
          url: n.url,
          image_url: n.imageUrl,
          published_at: n.publishedAt,
          category: "general",
          collected_date: today,
        }));
        await supabase.from("stock_news").upsert(newsRows, { onConflict: "url,collected_date" });
      }

      // 어닝 캘린더 저장
      if (earnings.length > 0) {
        const earningsRows = earnings.map((e) => ({
          ticker: e.ticker,
          report_date: e.reportDate,
          eps_estimate: e.epsEstimate,
          eps_actual: e.epsActual,
          revenue_estimate: e.revenueEstimate,
          revenue_actual: e.revenueActual,
          quarter: e.quarter,
        }));
        await supabase.from("earnings_calendar").upsert(earningsRows, { onConflict: "ticker,report_date" });
      }

      // 투자등급 변경 저장
      if (upgrades.length > 0) {
        const upgradeRows = upgrades.map((u) => ({
          ticker: u.ticker,
          company: u.company,
          action: u.action,
          from_grade: u.fromGrade,
          to_grade: u.toGrade,
          graded_at: u.gradedAt,
          collected_date: today,
        }));
        await supabase.from("stock_upgrades").upsert(upgradeRows, { onConflict: "ticker,company,graded_at" });
      }

      // 배치 완료 마킹
      await supabase
        .from("batch_state")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("batch_type", "daily")
        .eq("batch_date", today);

      return Response.json({
        message: "배치 완료",
        generalNews: generalNews.length,
        earnings: earnings.length,
        upgrades: upgrades.length,
      });
    }

    // 2. 청크 내 종목 처리
    let quotesProcessed = 0;
    let newsProcessed = 0;
    let extrasProcessed = 0;

    for (const stock of chunk) {
      // 모든 티어: 주가
      const quote = await finnhub.fetchQuote(stock.ticker);
      if (quote) {
        await supabase.from("stock_quotes").upsert({
          ticker: quote.ticker,
          price: quote.price,
          change: quote.change,
          change_percent: quote.changePercent,
          previous_close: quote.previousClose,
          high: quote.high,
          low: quote.low,
          open: quote.open,
          updated_at: new Date().toISOString(),
        }, { onConflict: "ticker" });
        quotesProcessed++;
      }

      // Tier 1, 2: 종목 뉴스
      if (stock.tier <= 2) {
        const news = await finnhub.fetchCompanyNews(stock.ticker, fromDate, toDate);
        if (news.length > 0) {
          const newsRows = news.map((n: Record<string, string | string[]>) => ({
            tickers: [stock.ticker],
            title: n.title,
            summary: n.summary,
            source: n.source,
            url: n.url,
            image_url: n.imageUrl,
            published_at: n.publishedAt,
            category: "company",
            collected_date: today,
          }));
          await supabase.from("stock_news").upsert(newsRows, { onConflict: "url,collected_date" });
          newsProcessed += news.length;
        }
      }

      // Tier 1만: 추가 데이터
      if (stock.tier === 1) {
        const [financials, recommendations, priceTarget, insider] = await Promise.all([
          finnhub.fetchBasicFinancials(stock.ticker),
          finnhub.fetchRecommendationTrends(stock.ticker),
          finnhub.fetchPriceTarget(stock.ticker),
          finnhub.fetchInsiderTransactions(stock.ticker),
        ]);

        if (financials) {
          await supabase.from("stock_financials").upsert({
            ticker: financials.ticker,
            pe_ratio: financials.peRatio,
            pb_ratio: financials.pbRatio,
            dividend_yield: financials.dividendYield,
            week52_high: financials.week52High,
            week52_low: financials.week52Low,
            market_cap: financials.marketCap,
            beta: financials.beta,
            updated_at: new Date().toISOString(),
          }, { onConflict: "ticker" });
          extrasProcessed++;
        }

        if (recommendations) {
          await supabase.from("stock_recommendations").upsert({
            ticker: recommendations.ticker,
            buy: recommendations.buy,
            hold: recommendations.hold,
            sell: recommendations.sell,
            strong_buy: recommendations.strongBuy,
            strong_sell: recommendations.strongSell,
            period: recommendations.period,
            updated_at: new Date().toISOString(),
          }, { onConflict: "ticker" });
        }

        if (priceTarget) {
          await supabase.from("stock_price_targets").upsert({
            ticker: priceTarget.ticker,
            target_high: priceTarget.targetHigh,
            target_low: priceTarget.targetLow,
            target_mean: priceTarget.targetMean,
            target_median: priceTarget.targetMedian,
            updated_at: new Date().toISOString(),
          }, { onConflict: "ticker" });
        }

        if (insider.length > 0) {
          const insiderRows = insider.map((t: Record<string, string | number>) => ({
            ticker: stock.ticker,
            person_name: t.personName,
            position: t.position,
            transaction_type: t.transactionType,
            shares: t.shares,
            price: t.price,
            filed_at: t.filedAt,
            collected_date: today,
          }));
          await supabase.from("stock_insider_transactions").upsert(
            insiderRows,
            { onConflict: "ticker,person_name,filed_at,transaction_type" }
          );
        }
      }
    }

    // 3. offset 업데이트
    const newOffset = offset + chunk.length;
    await supabase
      .from("batch_state")
      .update({ current_offset: newOffset, status: "running" })
      .eq("batch_type", "daily")
      .eq("batch_date", today);

    return Response.json({
      message: `청크 처리 완료`,
      processed: `${offset + 1}~${newOffset} / ${allStocks.length}`,
      quotesProcessed,
      newsProcessed,
      extrasProcessed,
      nextOffset: newOffset,
      remaining: allStocks.length - newOffset,
      requestCount: finnhub.getRequestCount(),
    });

  } catch (error) {
    console.error("Finnhub batch error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add app/src/app/api/cron/finnhub-collect/route.ts
git commit -m "feat: add chunked Finnhub batch collection endpoint"
```

---

## Task 6: Cron 스케줄 업데이트

**Files:**
- Modify: `app/vercel.json`
- Modify: `app/src/app/api/cron/collect-data/route.ts`

- [ ] **Step 1: vercel.json 업데이트**

```json
{
  "crons": [
    {
      "path": "/api/cron/finnhub-collect",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Vercel Hobby는 cron이 하루 1회만 보장. 매일 UTC 00:00 (KST 09:00) 실행.

- [ ] **Step 2: 기존 collect-data 라우트를 finnhub-collect 호출로 변경**

기존 `collect-data/route.ts`를 Finnhub 배치 트리거로 교체:

```typescript
import { NextRequest } from "next/server";

// 기존 mock 데이터 수집 → Finnhub 배치로 리다이렉트
export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const authHeader = request.headers.get("authorization");

  const res = await fetch(`${protocol}://${host}/api/cron/finnhub-collect`, {
    headers: authHeader ? { authorization: authHeader } : {},
  });

  return Response.json(await res.json());
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/vercel.json app/src/app/api/cron/collect-data/route.ts
git commit -m "feat: update cron to trigger Finnhub batch collection"
```

---

## Task 7: Briefing API에서 신규 데이터 활용

**Files:**
- Modify: `app/src/app/api/briefing/route.ts`

- [ ] **Step 1: fetchMarketData 확장**

`fetchMarketData` 함수에 financials, recommendations, price targets, upgrades, earnings 조회 추가:

기존 quotes, news, filings 쿼리 뒤에 추가:

```typescript
// 기존 쿼리 뒤에 추가
const { data: financialsData } = await supabase
  .from("stock_financials")
  .select("*")
  .in("ticker", tickers);

const { data: recommendationsData } = await supabase
  .from("stock_recommendations")
  .select("*")
  .in("ticker", tickers);

const { data: priceTargetsData } = await supabase
  .from("stock_price_targets")
  .select("*")
  .in("ticker", tickers);

const today = new Date().toISOString().split("T")[0];
const { data: upgradesData } = await supabase
  .from("stock_upgrades")
  .select("*")
  .in("ticker", tickers)
  .gte("graded_at", new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0])
  .order("graded_at", { ascending: false });

const nextWeek = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
const { data: earningsData } = await supabase
  .from("earnings_calendar")
  .select("*")
  .in("ticker", tickers)
  .gte("report_date", today)
  .lte("report_date", nextWeek);
```

- [ ] **Step 2: Gemini 프롬프트에 신규 데이터 포함**

프롬프트 빌드 시 추가 정보 포함:

```typescript
// 재무지표 섹션
const financialsInfo = (financialsData ?? [])
  .map((f) => `- ${f.ticker}: PER ${f.pe_ratio ?? "N/A"}, 배당수익률 ${f.dividend_yield ?? "N/A"}%, 52주 고가 $${f.week52_high}, 저가 $${f.week52_low}`)
  .join("\n");

// 애널리스트 의견 섹션
const recommendationsInfo = (recommendationsData ?? [])
  .map((r) => `- ${r.ticker}: 강력매수 ${r.strong_buy}, 매수 ${r.buy}, 보유 ${r.hold}, 매도 ${r.sell}`)
  .join("\n");

// 목표가 섹션
const priceTargetsInfo = (priceTargetsData ?? [])
  .map((p) => `- ${p.ticker}: 평균 목표가 $${p.target_mean} (최고 $${p.target_high}, 최저 $${p.target_low})`)
  .join("\n");

// 투자등급 변경
const upgradesInfo = (upgradesData ?? [])
  .map((u) => `- ${u.ticker}: ${u.company} → ${u.action} (${u.from_grade} → ${u.to_grade})`)
  .join("\n");

// 어닝 일정
const earningsInfo = (earningsData ?? [])
  .map((e) => `- ${e.ticker}: ${e.report_date} 실적 발표 예정 (EPS 예상: $${e.eps_estimate ?? "N/A"})`)
  .join("\n");
```

프롬프트에 섹션 추가:

```
## 재무지표
${financialsInfo || "조회된 재무지표 없음"}

## 월가 애널리스트 의견
${recommendationsInfo || "조회된 의견 없음"}

## 목표가
${priceTargetsInfo || "조회된 목표가 없음"}

## 최근 투자등급 변경
${upgradesInfo || "최근 변경 없음"}

## 향후 2주 실적 발표 일정
${earningsInfo || "예정된 발표 없음"}
```

- [ ] **Step 3: 커밋**

```bash
git add app/src/app/api/briefing/route.ts
git commit -m "feat: enrich briefing with financials, analyst ratings, earnings data"
```

---

## Task 8: FINNHUB_API_KEY 환경 변수 등록

- [ ] **Step 1: Finnhub에서 API 키 발급**

https://finnhub.io → 회원가입 → Dashboard → API Key 복사

- [ ] **Step 2: 로컬 .env에 추가**

```bash
echo "FINNHUB_API_KEY=your_key_here" >> app/.env.local
```

- [ ] **Step 3: Vercel 환경 변수 등록**

Vercel → securitya → Settings → Environment Variables → Add:
- Key: `FINNHUB_API_KEY`
- Value: (발급받은 키)
- Environment: **Production** ✅ + **Preview** ✅

- [ ] **Step 4: 배포 후 배치 수동 테스트**

```bash
curl https://securitya.vercel.app/api/cron/finnhub-collect
```

응답에서 quotesProcessed > 0 확인.

---

## Task 9: mock-data.ts 의존성 제거

**Files:**
- Modify: `app/src/app/api/briefing/route.ts`

- [ ] **Step 1: fallback 로직 정리**

mock-data import는 유지하되, Supabase에 데이터가 있으면 mock에 의존하지 않도록
fetchMarketData의 fallback 조건을 강화:
- stock_quotes에 1개 이상 데이터 있으면 → supabase 사용
- 아예 비어있으면 → mock fallback (초기 배치 전)

- [ ] **Step 2: 커밋**

```bash
git add app/src/app/api/briefing/route.ts
git commit -m "feat: prefer Supabase data over mock, fallback only when DB empty"
```

---

## Task 10: 배치 수동 트리거 (초기 데이터 적재)

- [ ] **Step 1: 로컬에서 배치 반복 실행으로 초기 데이터 적재**

```bash
# Tier 1 + Tier 2 전체를 처리하려면 여러 번 호출 필요
# 250 종목 / 25 chunk = 10번 호출
for i in {1..12}; do
  echo "=== Chunk $i ==="
  curl -s http://localhost:3000/api/cron/finnhub-collect | jq .
  sleep 65  # rate limit 대기
done
```

- [ ] **Step 2: Supabase에서 데이터 확인**

Supabase → Table Editor에서:
- stock_quotes: 250+ rows
- stock_news: 뉴스 다수
- stock_financials: Tier 1 종목 50개
- stock_recommendations: Tier 1 종목 50개

- [ ] **Step 3: 사이트에서 실제 데이터 확인**

https://securitya.vercel.app 접속 → 브리핑 새로고침
- source: "✦ Gemini AI" ✅
- dataSource: "Supabase" ✅ (not "Mock 데이터")

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "feat: complete Finnhub data pipeline — real stock data replaces mock"
```

---

## 확장 포인트 (후속 작업)

| 항목 | 설명 | 우선순위 |
|------|------|---------|
| Tier 3 자동 수집 | S&P 500 전체 종목 리스트를 Finnhub API로 가져와 stock_profiles에 등록 | 중 |
| 장중 갱신 | 외부 cron 서비스로 30분마다 finnhub-collect 호출 | 중 |
| Company Profile 초기 수집 | 1,000종목 로고/섹터 정보 1회 수집 | 중 |
| UI에 재무지표 표시 | BriefingCard에 PER/목표가/컨센서스 표시 | 후속 |
| 배치 모니터링 대시보드 | batch_state 기반 수집 현황 UI | 낮음 |
