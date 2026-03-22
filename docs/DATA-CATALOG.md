# Data Table Catalog

> **최종 업데이트:** 2026-03-22
> **DB:** Supabase (PostgreSQL)
> **총 테이블:** 15개 (전체 적용 완료)

## 테이블 요약

| # | 테이블명 | 용도 | PK | 데이터 소스 | 수집 주기 |
|---|---------|------|-----|------------|----------|
| 1 | `user_personas` | 투자자 페르소나 | uuid | 사용자 입력 | 온보딩 시 |
| 2 | `stock_profiles` | 종목 기본 정보 | ticker | Finnhub | 배치 |
| 3 | `stock_quotes` | 실시간 주가 | ticker | Finnhub | 배치 (평일) |
| 4 | `stock_news` | 종목 뉴스 | id (identity) | Finnhub | 배치 (일 1회) |
| 5 | `stock_financials` | 재무 지표 | ticker | Finnhub | 배치 |
| 6 | `stock_recommendations` | 애널리스트 추천 | ticker | Finnhub | 배치 |
| 7 | `stock_price_targets` | 목표가 | ticker | Finnhub | 배치 |
| 8 | `stock_upgrades` | 등급 변경 | id (identity) | Finnhub | 배치 |
| 9 | `stock_insider_transactions` | 내부자 거래 | id (identity) | Finnhub | 배치 |
| 10 | `earnings_calendar` | 실적 발표 일정 | id (identity) | Finnhub | 배치 |
| 11 | `batch_state` | 배치 작업 상태 관리 | id (identity) | 시스템 내부 | 배치 실행 시 |
| 12 | `sec_filings` | SEC 공시 | uuid | SEC EDGAR | 별도 cron |
| 13 | `briefing_cache` | AI 브리핑 캐시 (레거시) | uuid | 시스템 내부 | 브리핑 생성 시 |
| 14 | `stock_analysis_cache` | 종목별 AI 분석 캐시 | ticker+analysis_date | AI 생성 (Cron) | 매일 06:30 KST |
| 15 | `market_overview_cache` | 시장 전체 분석 캐시 | analysis_date | AI 생성 (Cron) | 매일 06:30 KST |

## 상세 스키마

---

### 1. user_personas
> 투자자 성향 페르소나 (온보딩 설문 결과)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| user_id | text | NOT NULL, UNIQUE | 사용자 식별자 |
| swing | int | NOT NULL, DEFAULT 3, CHECK 1~5 | 스윙 트레이딩 성향 |
| long_term | int | NOT NULL, DEFAULT 3, CHECK 1~5 | 장기 투자 성향 |
| scalping | int | NOT NULL, DEFAULT 3, CHECK 1~5 | 스캘핑 성향 |
| blue_chip | int | NOT NULL, DEFAULT 3, CHECK 1~5 | 대형주 선호도 |
| etf | int | NOT NULL, DEFAULT 3, CHECK 1~5 | ETF 선호도 |
| small_cap | int | NOT NULL, DEFAULT 3, CHECK 1~5 | 중소형주 선호도 |
| tech | int | NOT NULL, DEFAULT 3, CHECK 1~5 | 기술주 선호도 |
| dividend | int | NOT NULL, DEFAULT 3, CHECK 1~5 | 배당주 선호도 |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

- **RLS:** service_role_all
- **마이그레이션:** `002_user_personas.sql`
- **사용 API:** `POST/GET /api/persona`

---

### 2. stock_profiles
> 종목 기본 정보 (회사명, 섹터, 시가총액 등)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| ticker | text | PK | 종목 코드 (e.g. AAPL) |
| name | text | | 회사명 (영문) |
| name_kr | text | | 회사명 (한글) |
| sector | text | | 섹터 |
| market_cap | numeric | | 시가총액 |
| logo_url | text | | 로고 이미지 URL |
| website_url | text | | 회사 웹사이트 |
| tier | int | CHECK 1~3 | 수집 우선순위 티어 |
| updated_at | timestamptz | DEFAULT now() | |

- **인덱스:** `idx_stock_profiles_sector`, `idx_stock_profiles_tier`
- **RLS:** 공개 읽기 / 서비스 쓰기
- **마이그레이션:** `003_finnhub_tables.sql`

---

### 3. stock_quotes
> 주가 데이터 (현재가, 변동률 등)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| ticker | text | PK | 종목 코드 |
| price | numeric | | 현재가 |
| change | numeric | | 변동 금액 |
| change_percent | numeric | | 변동률 (%) |
| previous_close | numeric | | 전일 종가 |
| high | numeric | | 고가 (003 추가) |
| low | numeric | | 저가 (003 추가) |
| open | numeric | | 시가 (003 추가) |
| updated_at | timestamptz | DEFAULT now() | |

- **RLS:** 공개 읽기 / 서비스 쓰기
- **마이그레이션:** 기존 테이블 + `003_finnhub_tables.sql` ALTER

---

### 4. stock_news
> 종목 관련 뉴스

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | bigint | PK (IDENTITY) | |
| tickers | text[] | | 관련 종목 배열 |
| title | text | NOT NULL | 뉴스 제목 |
| summary | text | | 요약 |
| source | text | | 출처 |
| url | text | | 원문 링크 |
| image_url | text | | 이미지 URL (003 추가) |
| published_at | timestamptz | | 발행일 |
| sentiment | text | DEFAULT 'neutral' | 감성 분석 결과 |
| category | text | DEFAULT 'company' | 카테고리 (003 추가) |
| collected_date | date | DEFAULT CURRENT_DATE | 수집일 |

- **UNIQUE:** `(url, collected_date)`
- **인덱스:** `idx_stock_news_published`, `idx_stock_news_category`
- **RLS:** 공개 읽기 / 서비스 쓰기

---

### 5. stock_financials
> 재무 지표 (PER, PBR, 배당수익률 등)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| ticker | text | PK | 종목 코드 |
| pe_ratio | numeric | | PER |
| pb_ratio | numeric | | PBR |
| dividend_yield | numeric | | 배당수익률 |
| week52_high | numeric | | 52주 최고가 |
| week52_low | numeric | | 52주 최저가 |
| market_cap | numeric | | 시가총액 |
| beta | numeric | | 베타 계수 |
| updated_at | timestamptz | DEFAULT now() | |

- **인덱스:** `idx_stock_financials_updated`
- **RLS:** 공개 읽기 / 서비스 쓰기
- **마이그레이션:** `003_finnhub_tables.sql`

---

### 6. stock_recommendations
> 애널리스트 투자 의견

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| ticker | text | PK | 종목 코드 |
| buy | int | | 매수 의견 수 |
| hold | int | | 보유 의견 수 |
| sell | int | | 매도 의견 수 |
| strong_buy | int | | 적극 매수 의견 수 |
| strong_sell | int | | 적극 매도 의견 수 |
| period | text | | 기간 |
| updated_at | timestamptz | DEFAULT now() | |

- **RLS:** 공개 읽기 / 서비스 쓰기
- **마이그레이션:** `003_finnhub_tables.sql`

---

### 7. stock_price_targets
> 애널리스트 목표 주가

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| ticker | text | PK | 종목 코드 |
| target_high | numeric | | 최고 목표가 |
| target_low | numeric | | 최저 목표가 |
| target_mean | numeric | | 평균 목표가 |
| target_median | numeric | | 중간 목표가 |
| updated_at | timestamptz | DEFAULT now() | |

- **RLS:** 공개 읽기 / 서비스 쓰기
- **마이그레이션:** `003_finnhub_tables.sql`

---

### 8. stock_upgrades
> 등급 변경 이력 (업그레이드/다운그레이드)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | bigint | PK (IDENTITY) | |
| ticker | text | NOT NULL | 종목 코드 |
| company | text | | 증권사 |
| action | text | | 변경 유형 |
| from_grade | text | | 이전 등급 |
| to_grade | text | | 변경 등급 |
| graded_at | date | | 등급 변경일 |
| collected_date | date | DEFAULT CURRENT_DATE | 수집일 |

- **UNIQUE:** `(ticker, company, graded_at)`
- **인덱스:** `idx_stock_upgrades_ticker`, `idx_stock_upgrades_graded_at`
- **RLS:** 공개 읽기 / 서비스 쓰기

---

### 9. stock_insider_transactions
> 내부자 거래 내역

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | bigint | PK (IDENTITY) | |
| ticker | text | NOT NULL | 종목 코드 |
| person_name | text | | 거래자 이름 |
| position | text | | 직위 |
| transaction_type | text | | 거래 유형 (매수/매도) |
| shares | numeric | | 거래 주식 수 |
| price | numeric | | 거래 가격 |
| filed_at | date | | 신고일 |
| collected_date | date | DEFAULT CURRENT_DATE | 수집일 |

- **UNIQUE:** `(ticker, person_name, filed_at, transaction_type)`
- **인덱스:** `idx_insider_tx_ticker`, `idx_insider_tx_filed_at`
- **RLS:** 공개 읽기 / 서비스 쓰기

---

### 10. earnings_calendar
> 실적 발표 일정 및 결과

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | bigint | PK (IDENTITY) | |
| ticker | text | NOT NULL | 종목 코드 |
| report_date | date | | 발표일 |
| eps_estimate | numeric | | EPS 추정치 |
| eps_actual | numeric | | EPS 실적 |
| revenue_estimate | bigint | | 매출 추정치 |
| revenue_actual | bigint | | 매출 실적 |
| quarter | text | | 분기 (e.g. Q1 2025) |

- **UNIQUE:** `(ticker, report_date)`
- **인덱스:** `idx_earnings_ticker`, `idx_earnings_report_date`
- **RLS:** 공개 읽기 / 서비스 쓰기

---

### 11. batch_state
> 배치 수집 작업 상태 관리

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | bigint | PK (IDENTITY) | |
| batch_type | text | NOT NULL | 배치 유형 |
| batch_date | date | NOT NULL | 배치 실행일 |
| current_offset | int | DEFAULT 0 | 현재 처리 위치 |
| total_count | int | | 전체 처리 대상 수 |
| status | text | DEFAULT 'pending' | 상태 (pending/running/completed) |
| started_at | timestamptz | | 시작 시각 |
| completed_at | timestamptz | | 완료 시각 |

- **UNIQUE:** `(batch_type, batch_date)`
- **인덱스:** `idx_batch_state_status`, `idx_batch_state_type`
- **RLS:** 공개 읽기 / 서비스 쓰기

---

### 12. sec_filings
> SEC EDGAR 공시 문서

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| ticker | text | NOT NULL | 종목 코드 |
| cik | text | NOT NULL | SEC CIK 번호 |
| filing_type | text | NOT NULL | 공시 유형 (10-K, 10-Q 등) |
| filed_date | date | NOT NULL | 제출일 |
| title | text | NOT NULL | 공시 제목 |
| accession_number | text | UNIQUE, NOT NULL | SEC 접수번호 |
| url | text | NOT NULL | 원문 링크 |
| collected_at | timestamptz | DEFAULT now() | 수집 시각 |

- **인덱스:** `idx_sec_filings_ticker`, `idx_sec_filings_filed_date`
- **마이그레이션:** `app/src/lib/sec-edgar.sql` (별도)

---

### 13. briefing_cache (레거시 — 종목별 캐시로 대체)
> AI 브리핑 결과 캐시 (동일 데이터 기간 내 Gemini 재호출 방지)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| cache_key | text | UNIQUE, NOT NULL | 포트폴리오+페르소나 SHA256 해시 (32자) |
| briefing_data | jsonb | NOT NULL | DailyBriefing 전체 JSON |
| data_freshness_key | text | NOT NULL | 데이터 갱신 시점 해시 (무효화 판단용) |
| created_at | timestamptz | DEFAULT NOW() | 캐시 생성 시각 |
| expires_at | timestamptz | DEFAULT NOW() + 24h | 만료 시각 |

- **인덱스:** `idx_briefing_cache_key` (cache_key), `idx_briefing_cache_expires` (expires_at)
- **RLS:** 전체 허용 (서비스 역할)
- **마이그레이션:** `supabase/migrations/004_briefing_cache.sql`
- **TTL:** 24시간, 3일 이상 만료 캐시 자동 삭제
- **무효화:** data_freshness_key 변경 시 (DB 데이터 갱신) 또는 forceRefresh 요청 시

---

### 14. stock_analysis_cache
> 종목별 AI 분석 사전 생성 캐시 (Cron에서 Tier 1+2 종목 대상 생성)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| ticker | text | NOT NULL, PK(1) | 종목 코드 |
| analysis_date | date | NOT NULL, PK(2) | 분석 날짜 |
| sentiment | text | NOT NULL, CHECK (positive/negative/neutral) | 종목 감성 |
| summary | text | NOT NULL | AI 분석 요약 |
| key_points | jsonb | NOT NULL | 핵심 포인트 배열 |
| proactive_suggestion | text | | 선제적 제안 |
| related_tickers | jsonb | | 관련 종목 배열 |
| data_freshness_key | text | NOT NULL | 데이터 신선도 해시 (변경 감지) |
| generated_at | timestamptz | DEFAULT NOW() | 생성 시각 |

- **PK:** `(ticker, analysis_date)`
- **인덱스:** `idx_stock_analysis_date` (analysis_date), `idx_stock_analysis_generated` (generated_at)
- **RLS:** 전체 허용 (서비스 역할)
- **마이그레이션:** `supabase/migrations/005_stock_analysis_cache.sql`
- **생성 스크립트:** `app/scripts/generate-stock-analysis.ts`
- **TTL:** 3일 이상 된 분석 자동 삭제

---

### 15. market_overview_cache
> 시장 전체 분석 캐시 (인사말, 시장 개요, 매크로 알림)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| analysis_date | date | PK | 분석 날짜 |
| greeting | text | NOT NULL | 인사말 (시간대별) |
| market_overview | text | NOT NULL | 시장 전체 개요 |
| macro_alert | text | | 매크로 경제 알림 |
| data_freshness_key | text | NOT NULL | 데이터 신선도 해시 |
| generated_at | timestamptz | DEFAULT NOW() | 생성 시각 |

- **PK:** `analysis_date`
- **RLS:** 전체 허용 (서비스 역할)
- **마이그레이션:** `supabase/migrations/005_stock_analysis_cache.sql`

---

## 테이블 관계 다이어그램

```
stock_profiles (ticker) ─┬─ stock_quotes (ticker)
                         ├─ stock_financials (ticker)
                         ├─ stock_recommendations (ticker)
                         ├─ stock_price_targets (ticker)
                         ├─ stock_upgrades (ticker)
                         ├─ stock_insider_transactions (ticker)
                         ├─ earnings_calendar (ticker)
                         ├─ stock_news (tickers[])
                         ├─ sec_filings (ticker)
                         └─ stock_analysis_cache (ticker) ✨

user_personas (user_id) ─── 사용자별 독립

batch_state ─── 시스템 내부 관리용

briefing_cache ─── 레거시 브리핑 캐시 (종목별 캐시로 대체)

stock_analysis_cache (ticker, analysis_date) ─── 종목별 AI 분석 ✨
market_overview_cache (analysis_date) ─── 시장 전체 분석 ✨
```

> **참고:** FK(외래키) 제약조건은 설정되어 있지 않으며, `ticker` 컬럼을 통해 논리적으로 연결됨.

## 마이그레이션 파일

| 파일 | 내용 |
|------|------|
| `supabase/migrations/002_user_personas.sql` | user_personas 생성 |
| `supabase/migrations/003_finnhub_tables.sql` | Finnhub 관련 9개 테이블 + stock_quotes/news ALTER |
| `app/src/lib/sec-edgar.sql` | sec_filings 생성 (수동 실행) |
| `supabase/migrations/004_briefing_cache.sql` | briefing_cache 생성 (레거시) |
| `supabase/migrations/005_stock_analysis_cache.sql` | stock_analysis_cache + market_overview_cache 생성 |

## API 연결

| API 엔드포인트 | 사용 테이블 |
|---------------|------------|
| `POST/GET /api/persona` | user_personas |
| `POST /api/briefing` | stock_analysis_cache, market_overview_cache, stock_quotes, stock_news, sec_filings, stock_financials, stock_recommendations, stock_price_targets, stock_upgrades, earnings_calendar |
| `GET /api/stocks/search` | stock_profiles |
| `GET /api/filings` | sec_filings |
| `GET /api/cron/finnhub-collect` | stock_profiles, stock_quotes, stock_news, stock_financials, stock_recommendations, stock_price_targets, stock_upgrades, stock_insider_transactions, earnings_calendar, batch_state |
| `GET /api/cron/sec-collect` | sec_filings |
