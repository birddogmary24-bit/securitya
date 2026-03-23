# A증권사 AI 브리핑 — 프로젝트 설정

> **최종 업데이트:** 2026-03-22

## 프로젝트 구조

```
securitya/
  app/             # Next.js 웹앱 (프론트엔드 + API Routes)
  docs/            # 기획 문서, 제안서, 리서치
  CLAUDE.md        # 프로젝트 설정 (이 파일)
  PLAN.md          # 구현 계획
  PRD.md           # 제품 요구사항
  SESSIONLOG.md    # 세션별 작업 로그
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 16 + Tailwind CSS 4 |
| 백엔드 API | Next.js API Routes |
| AI/LLM | Gemini 2.5 Flash / 2.5 Flash-Lite (Google AI Studio, Tier 1) |
| 데이터 수집 | Finnhub API (Free, 60 req/min) — GitHub Actions Cron 배치 |
| 공시 수집 | SEC EDGAR API (무료, 청크 방식) — GitHub Actions Cron |
| DB | Supabase (PostgreSQL) — 15개 테이블 (상세: `docs/DATA-CATALOG.md`) |
| 벡터 DB | Pinecone 또는 ChromaDB (Phase 2) |
| 배포 | Vercel Hobby (웹 서비스 전용) |
| Cron | GitHub Actions — Finnhub+AI분석 06:30 KST / SEC 07:30 KST |
| 종목 수 | Tier 1 (50, 전체수집) + Tier 2 (100 개별주식, 전체수집) + Tier 3 (400 개별주식+ETF, quote+news) + On-demand |

## 배포 설정

| Key | Value |
|-----|-------|
| 서비스 URL | https://securitya.vercel.app |
| GitHub | github.com/birddogmary24-bit/securitya |
| 배포 플랫폼 | Vercel (Hobby) |
| CI/CD | GitHub main push → 자동 배포 |
| 환경 | Production |

## 환경 변수 (Vercel Production)

```
GEMINI_API_KEY=              # Gemini 2.5 Flash/Lite (Google AI Studio, Tier 1)
NEXT_PUBLIC_SUPABASE_URL=    # Supabase 프로젝트 URL
SUPABASE_SERVICE_ROLE_KEY=   # Supabase 서버 사이드 키 (secret)
CRON_SECRET=                 # Cron 엔드포인트 인증 키
FINNHUB_API_KEY=             # Finnhub 데이터 수집 (연동 완료)
```

## Supabase DB 스키마

```sql
-- 기존 테이블
stock_quotes: ticker(PK), price, change, change_percent, previous_close, high, low, open, updated_at
stock_news: tickers[], title, summary, source, url, published_at, sentiment, collected_date, image_url, category
user_personas: user_id(UNIQUE), swing, long_term, scalping, blue_chip, etf, small_cap, tech, dividend (각 int 1~5)

-- Finnhub 확장 테이블 (003_finnhub_tables.sql)
stock_profiles: ticker(PK), name, name_kr, sector, market_cap, logo_url, website_url, tier, last_accessed_at
stock_financials: ticker(PK), pe_ratio, pb_ratio, dividend_yield, week52_high, week52_low, market_cap, beta
stock_recommendations: ticker(PK), buy, hold, sell, strong_buy, strong_sell, period
stock_price_targets: ticker(PK), target_high, target_low, target_mean, target_median
stock_upgrades: ticker, company, action, from_grade, to_grade, graded_at
stock_insider_transactions: ticker, person_name, position, transaction_type, shares, price, filed_at
earnings_calendar: ticker, report_date, eps_estimate, eps_actual, revenue_estimate, revenue_actual, quarter
batch_state: batch_type, batch_date, current_offset, total_stocks, status

-- SEC EDGAR 테이블
sec_filings: ticker, cik, filing_type, filed_date, title, accession_number(UNIQUE), url

-- 캐시 테이블 (004_briefing_cache.sql) — 레거시, 종목별 캐시로 대체
briefing_cache: cache_key(UNIQUE), briefing_data(JSONB), data_freshness_key, created_at, expires_at(24h TTL)

-- 종목별 AI 분석 캐시 (005_stock_analysis_cache.sql)
stock_analysis_cache: ticker+analysis_date(PK), sentiment, summary, key_points(JSONB), proactive_suggestion, related_tickers(JSONB), data_freshness_key, generated_at
market_overview_cache: analysis_date(PK), greeting, market_overview, macro_alert, data_freshness_key, generated_at
```

> 전체 스키마 상세: `docs/DATA-CATALOG.md`

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/briefing` | POST | 포트폴리오 기반 AI 브리핑 (종목별 캐시 조합, forceRefresh 옵션) |
| `/api/persona` | POST/GET | 투자자 페르소나 저장/조회 |
| `/api/filings` | GET | SEC 공시 조회 (?tickers=AAPL,MSFT) |
| `/api/cron/finnhub-collect` | GET | Finnhub 데이터 배치 수집 (25종목/호출, 청크 방식) |
| `/api/cron/sec-collect` | GET | SEC EDGAR 공시 수집 (25종목/호출, 청크 방식) |
| `/api/filings/summarize` | POST | AI 공시 한국어 요약 (모델 fallback 체인) |
| `/api/stocks/search` | GET | 종목 검색 (?q=TICKER, Tier 3 on-demand 포함) |
| `/api/cron/collect-data` | GET | 레거시 데이터 수집 (finnhub-collect 리다이렉트) |

## CI/CD

- **자동 배포:** GitHub `main` push → Vercel 자동 빌드/배포
- **Cron:** GitHub Actions (`.github/workflows/`)
  - `cron-finnhub.yml` — `30 21 * * *` (매일 06:30 KST, UTC 21:30) — Finnhub 수집 + AI 분석 생성
  - `cron-sec.yml` — `30 22 * * *` (매일 07:30 KST, UTC 22:30) — SEC 공시 수집
- **GitHub Secrets 필요:** `CRON_SECRET`, `GEMINI_API_KEY`
- **PR 검증:** 미설정

## Custom Skills (Claude Code)

### 글로벌 설치 (모든 프로젝트 적용)
- **Superpowers** (`~/.claude/skills/`) — 2026-03-21 설치
  - brainstorming, writing-plans, executing-plans
  - subagent-driven-development, systematic-debugging
  - test-driven-development, requesting-code-review
  - verification-before-completion

### 프로젝트 로컬 스킬
- 없음 (필요 시 `.claude/skills/`에 추가)

## 참고 문서

- `docs/proposal-executive-summary.md` — 서비스 요약
- `docs/proposal-detailed.md` — 상세 제안서
- `docs/DEVELOPMENT-SPEC.md` — 기술 스펙 상세
- `docs/DATA-CATALOG.md` — DB 테이블 전체 스키마 카탈로그
- `docs/api-reference.md` — API 엔드포인트 상세
- `docs/competitor-analysis.md` — 경쟁사 분석
- `docs/superpowers-notes.md` — Superpowers 설치 및 사용 가이드
