# 외부 API 레퍼런스

> 기능 설계 및 개발 시 참조용.
> 각 API의 플랜별 제공 범위, 제한사항 정리.

---

## Finnhub Stock API

- 공식 사이트: finnhub.io
- 사용 플랜: **Free** ($0/month)
- Rate Limit: **60 API calls/minute**
- License: Personal Use

### 플랜 비교 (Free vs All-In-One)

| 항목 | Free ($0) | All-In-One ($3,500/mo) |
|------|-----------|------------------------|
| Rate Limit | 60 calls/min | Market 900, Fundamental 300 calls/min |
| Billing | - | Annually |

---

### Fundamental Data

| 항목 | Free | All-In-One |
|------|------|------------|
| Coverage | US | Global |
| Company Profile | v2 | v1 (more info) |
| Standardized Financial Statements | X | 30+ years (annual/quarterly) |
| Financials As Reported | O | O |
| Dividends | X | 30 years |
| SEC Filings | O | O |
| Filings Sentiment | X | O |
| Ownership | X | Full list of shareholders |
| Company News | 1 year + real-time | 20 years + real-time |
| Key Metrics | O | O |
| Press Releases | X | 20 years + real-time |
| Company Executives | X | Full list with compensation |

### US Market Data

| 항목 | Free | All-In-One |
|------|------|------------|
| Coverage | US | US |
| OHLC | X | 30+ years |
| Tick Data | X | 30+ years |
| Websocket | 50 symbols | Unlimited |
| Survivorship-bias Free | X | O |
| Pattern Recognition Algorithm | X | O |
| Support/Resistance Detection | X | O |

### International Market Data

| 항목 | Free | All-In-One |
|------|------|------------|
| TSX, LSE, Euronext, Deutsche Borse | X | Tick-level data |
| OHLC | X | 25+ years |

> *LSE data is delayed by 15 minutes. Other international markets support end-of-day data only.

### Estimates

| 항목 | Free | All-In-One |
|------|------|------------|
| Coverage | US | Global |
| Recommendation Trends | O | O |
| Price Target | X | O |
| EPS Surprises | 4 quarters | 20+ years |
| Earnings Calendar | 1 month + real-time (US) | 20 years + real-time |
| EPS Estimates | X | 20+ years historical & 5 years forward |
| Revenue Estimates | X | 20+ years historical & 5 years forward |
| EBITDA Estimates | X | 10+ years historical & 5 years forward |
| EBIT Estimates | X | 10+ years historical & 5 years forward |
| Upgrade/Downgrade | X | 20 years + real-time |

### ETFs and Indices

| 항목 | Free | All-In-One |
|------|------|------------|
| Coverage | US | Global |
| Indices Constituents | X | O |
| Indices Historical Constituents | X | O |
| ETFs Profile | X | O |
| ETFs Holdings | X | O |
| ETFs Industry Exposure | X | O |
| ETFs Country Exposure | X | O |
| Mutual Funds Holdings | X | O |

### Alternative Data

| 항목 | Free | All-In-One |
|------|------|------------|
| Covid-19 | O | O |
| Social Sentiment | X | O |
| USPTO Patents | O | O |
| Visa Application | O | O |
| Senate Lobbying | O | O |
| USA Spending | O | O |
| Investment Themes | X | O |
| Supply Chain | X | O |
| ESG Scores | X | O |
| Company Earnings Quality | X | O |
| Earnings Call Transcripts | X | X |

### Global Bonds Data

| 항목 | Free | All-In-One |
|------|------|------------|
| Global Bonds | X | US Gov / FINRA Trace Corporate / International |
| Bond Profile | X | O |
| Bond Price | X | O |
| Bond Tick Data | X | FINRA Trace (BTDS & 144A) |

### Economic Data

| 항목 | Free | All-In-One |
|------|------|------------|
| Country's Metadata | O | O |
| Economic Calendar | X | O |
| Historical Economic Data | X | O |

---

### Free 플랜에서 사용 가능한 API 요약

프로토타입 개발에 활용 가능한 Free 엔드포인트:

| 카테고리 | 엔드포인트 | 용도 |
|----------|-----------|------|
| **Quote** | `/quote` | 실시간 주가 (현재가, 변동률) |
| **Company Profile** | `/stock/profile2` | 종목 기본 정보 (이름, 로고, 섹터) |
| **Company News** | `/company-news` | 종목별 뉴스 (1년치 + 실시간) |
| **Financials As Reported** | `/stock/financials-reported` | SEC 제출 재무제표 원본 |
| **SEC Filings** | `/stock/filings` | SEC 공시 목록 (10-K/Q/8-K) |
| **Key Metrics** | `/stock/metric` | 핵심 재무 지표 |
| **Recommendation Trends** | `/stock/recommendation` | 애널리스트 투자의견 추이 |
| **EPS Surprises** | `/stock/earnings` | 최근 4분기 EPS 실적 vs 예상 |
| **Earnings Calendar** | `/calendar/earnings` | 1개월 어닝 캘린더 |
| **Country Metadata** | `/country` | 국가 메타데이터 |

---

### Rate Limit 전략 (Free 플랜)

- 60 calls/min = **1 call/sec**
- 일일 이론상 최대: 60 × 60 × 24 = **86,400 calls/day**
- Vercel Hobby 함수 실행 제한: **60초** → 단일 cron으로 최대 ~60 calls
- 실시간 요청: 사용자 요청 시 on-demand fetch → DB 캐시 우선, API fallback
- Websocket: 최대 50 symbols 실시간 스트리밍 가능 (Phase 2+)

---

## 데이터 수집 설계

### 종목 등급 시스템 (현행)

종목을 3등급으로 분류하여 수집 빈도와 범위를 차등 적용. ETF는 `isEtf` 플래그로 분리.

| 등급 | 기준 | 종목 수 | 수집 범위 |
|------|------|---------|----------|
| **Tier 1** | 대형 인기주, 한국인 투자자 선호 | 50 | 전체수집 (quote+news+financials+recommendations+targets+insider+earnings) |
| **Tier 2** | 개별주식 (ETF 제외) | 100 | 전체수집 (Tier 1과 동일) |
| **Tier 3** | 나머지 개별주식 + ETF | ~400 | quote + news |
| **On-demand** | 사용자 검색 시 즉시 수집 | 가변 | Finnhub 즉시 수집 → DB 캐싱 (24h TTL) |

> 등급 기준은 `stock_profiles` 테이블의 `tier` 필드로 관리. On-demand 종목은 7일 내 활성 시 배치 수집에 자동 포함.

### 엔드포인트별 수집 전략

| 엔드포인트 | 호출 단위 | 등급 | 빈도 | 비고 |
|-----------|----------|------|------|------|
| `/quote` | 종목당 1 call | A+B+C | 매일 | 현재가, 변동률, 전일종가 |
| `/company-news` | 종목당 1 call (여러 기사 리턴) | A+B | 매일 | DB 저장 시 종목당 최대 5건으로 제한 |
| `/stock/profile2` | 종목당 1 call | 전체 | **월 1회** | 거의 안 변함. 캐시 |
| `/calendar/earnings` | **1 call에 전체 종목** | 공통 | 매일 | symbol 파라미터 생략 시 전체 리턴 |
| `/stock/recommendation` | 종목당 1 call | A | 주 1회 | 애널리스트 투자의견 |
| `/stock/earnings` | 종목당 1 call | A | 주 1회 | EPS 서프라이즈 (최근 4분기) |
| `/stock/metric` | 종목당 1 call | A | 주 1회 | 핵심 재무 지표 |

### 일일 API 호출량 산출

| 구분 | 계산 | calls/일 |
|------|------|---------|
| Quote (A+B+C) | 50 + 200 + 750 | 1,000 |
| News (A+B) | 50 + 200 | 250 |
| Earnings Calendar | 1 | 1 |
| Profile (월1회, 일할) | 1,000 ÷ 30 | ~34 |
| Recommendation (주1회, 일할) | 50 ÷ 7 | ~8 |
| Earnings/Metric (주1회, 일할) | (50+50) ÷ 7 | ~15 |
| **합계** | | **~1,308 calls/일** |

소요 시간: 1,308 calls ÷ 60 calls/min = **약 22분**

### 배치 실행 전략: GitHub Actions (현행)

Vercel Hobby 제약(함수 10초)으로 대량 수집 불가.
**GitHub Actions**에서 TypeScript 스크립트를 직접 실행, Supabase에 저장.

#### 왜 GitHub Actions인가

| 항목 | Vercel Hobby | GitHub Actions |
|------|-------------|---------------|
| 비용 | $0 | $0 (2,000분/월) |
| 실행 시간 제한 | 60초 | **6시간** |
| Cron 개수 | 2개 | 무제한 |
| 1,308 calls (22분) | ❌ 불가 | ✅ 여유 |

#### 실행 스케줄 (현행)

| 워크플로우 | 스케줄 (UTC) | KST | 실행 내용 |
|-----------|-------------|-----|----------|
| `cron-finnhub.yml` | `30 21 * * *` | 06:30 KST | `collect-finnhub.ts` → `generate-stock-analysis.ts` |
| `cron-sec.yml` | `30 22 * * *` | 07:30 KST | `collect-sec.ts` |

> Finnhub 수집 후 즉시 AI 분석 생성 (Tier 1+2 ~150종목, Gemini 2.5 Flash)

#### Vercel Cron 역할 변경

Vercel cron은 기존 역할(데이터 수집) 대신 **경량 작업**만 담당:
- 브리핑 캐시 워밍, 헬스체크 등
- 기존 `/api/cron/collect-data` → mock fallback 전용으로 유지

#### GitHub Actions 워크플로우 구조

```
.github/workflows/cron-finnhub.yml
steps:
  1. Setup Node.js + Install dependencies
  2. Run collect-finnhub.ts (Finnhub API → Supabase 직접 저장)
  3. Run generate-stock-analysis.ts (Gemini AI → stock_analysis_cache)

.github/workflows/cron-sec.yml
steps:
  1. Setup Node.js + Install dependencies
  2. Run collect-sec.ts (SEC EDGAR → Supabase 직접 저장)
```

환경 변수 (GitHub Secrets): `FINNHUB_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`

### DB 스키마 (현행 — 15개 테이블)

> 상세: `docs/DATA-CATALOG.md`

| 테이블 | 용도 | 갱신 주기 |
|--------|------|----------|
| `stock_profiles` | 종목 마스터 (tier, isEtf 포함) | 배치 |
| `stock_quotes` | 가격 정보 | 매일 |
| `stock_news` | 종목별 뉴스 | 매일 |
| `stock_financials` | PER, PBR, 배당, 52주 고저, 베타 | 배치 |
| `stock_recommendations` | 애널리스트 컨센서스 | 배치 |
| `stock_price_targets` | 목표가 | 배치 |
| `stock_upgrades` | 등급 변경 이력 | 배치 |
| `stock_insider_transactions` | 내부자 거래 | 배치 |
| `earnings_calendar` | 어닝 일정 | 배치 |
| `sec_filings` | SEC 공시 (10-K/Q/8-K) | 매일 |
| `user_personas` | 투자자 페르소나 | 온보딩 시 |
| `batch_state` | 배치 작업 상태 | 배치 실행 시 |
| `briefing_cache` | 레거시 브리핑 캐시 | 종목별 캐시로 대체 |
| `stock_analysis_cache` | 종목별 AI 분석 캐시 **✨** | 매일 06:30 KST |
| `market_overview_cache` | 시장 전체 분석 캐시 **✨** | 매일 06:30 KST |

### 미구현 / 홀딩 항목

| 항목 | 상태 | 사유 |
|------|------|------|
| **OHLC 가격 추이 차트** | ❌ 미구현 | Free 플랜에서 `/stock/candle` 미제공 |
| **뉴스 감성 분석 (bullish/bearish)** | ⏳ Phase 3 홀딩 | Free 플랜 제공 미확인. 대안 탐색 예정 |
| **공시 감성 분석** (Filings Sentiment) | ❌ 미구현 | Free 플랜 미제공, 개발 스코프 외 |
| **애널리스트 목표가** (Price Target) | ❌ 미구현 | Free 플랜 미제공 (Key Metrics에서 일부 대체) |
| **어닝 추정치** (EPS/Revenue Estimates) | ❌ 미구현 | Free 플랜 미제공, 개발 스코프 외 |

---

## 서비스 API 엔드포인트 (현행)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/briefing` | 포트폴리오 기반 AI 브리핑 (종목별 캐시 조합, forceRefresh 옵션) |
| POST/GET | `/api/persona` | 투자자 페르소나 저장/조회 |
| GET | `/api/filings?tickers=` | SEC 공시 조회 (종목별 필터) |
| POST | `/api/filings/summarize` | AI 공시 한국어 요약 (모델 fallback 체인) |
| GET | `/api/stocks/search?q=` | 종목 검색 (Tier 1/2 로컬 + Tier 3 On-demand) |
| GET | `/api/cron/finnhub-collect` | Finnhub 배치 수집 (레거시, GitHub Actions로 대체) |
| GET | `/api/cron/sec-collect` | SEC EDGAR 수집 (레거시, GitHub Actions로 대체) |
| GET | `/api/cron/collect-data` | 레거시 (finnhub-collect 리다이렉트) |

## 스크립트 (GitHub Actions용)

| 스크립트 | 용도 |
|---------|------|
| `app/scripts/collect-finnhub.ts` | Finnhub 550종목 배치 수집 (Supabase 직접 저장) |
| `app/scripts/collect-sec.ts` | SEC EDGAR 공시 수집 (ETF 제외) |
| `app/scripts/generate-stock-analysis.ts` | Tier 1+2 ~150종목 AI 분석 사전 생성 (Gemini 2.5 Flash) |
