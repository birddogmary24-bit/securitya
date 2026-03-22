# AI 미국주식 브리핑 서비스 — 세션 작업 로그

> **최종 업데이트:** 2026-03-22
>
> 새 세션 시작 시 이 파일을 먼저 읽고 시작할 것.
> 작업 완료 후 이 파일에 내용을 추가할 것.

---

## 2026-03-21 | 1차 세션 — 프로젝트 초기 셋업, 기획 문서 완성, Superpowers 설치

### 작업 요약
A증권사 AI Content PM 채용 과제 착수. 기획 문서 2종(executive summary, detailed proposal) 완성. Superpowers 글로벌 설치. 프로젝트 문서 구조 정비.

### 주요 작업

| # | 작업 | 내용 |
|---|------|------|
| 1 | 기획 문서 작성 | `proposal-executive-summary.md` — 과제 제출용 1~2p 요약 |
| 2 | 기획 문서 작성 | `proposal-detailed.md` — 면접 대비 상세 제안서 (문제정의, 경쟁분석, 와이어프레임) |
| 3 | 개발 스펙 작성 | `DEVELOPMENT-SPEC.md` — 기술스택, API, Phase별 개발 계획 |
| 4 | 경쟁사 분석 | `competitor-analysis.md` — 토스, 미래에셋 등 경쟁 서비스 분석 |
| 5 | Superpowers 설치 | GitHub 클론 → `~/.claude/skills/` 글로벌 복사 (전 프로젝트 적용) |
| 6 | 문서 구조 정비 | 프로젝트 루트에 CLAUDE.md / PLAN.md / PRD.md / SESSIONLOG.md 신규 생성 |
| 7 | 기존 문서 이동 | 기획/리서치 문서 → `docs/` 폴더로 이동 |

### Superpowers 설치 내역

| 항목 | 내용 |
|------|------|
| 설치 방법 | `git clone https://github.com/obra/superpowers.git ~/.claude/plugins/superpowers` |
| 적용 범위 | 글로벌 (`~/.claude/skills/`) |
| 설치된 스킬 | brainstorming, writing-plans, executing-plans, subagent-driven-development, systematic-debugging, test-driven-development, requesting-code-review, verification-before-completion 외 |
| 참고 문서 | `docs/superpowers-notes.md` |

### 프로젝트 문서 구조 (정비 후)

```
kakaopaysecurity/
  CLAUDE.md           ← 프로젝트 설정, 스킬, CI/CD 기록
  PLAN.md             ← Phase별 구현 계획
  PRD.md              ← 제품 요구사항 정의서
  SESSIONLOG.md       ← 세션별 작업 로그 (이 파일)
  app/                ← Next.js 웹앱
  docs/
    proposal-executive-summary.md
    proposal-detailed.md
    DEVELOPMENT-SPEC.md
    competitor-analysis.md
    superpowers-notes.md
```

### 다음 세션 시작 전 확인 사항

- [x] Phase 1 개발 시작: Next.js 프로젝트 셋업 (`app/` 디렉토리) ← 2차 세션 완료
- [x] 환경 변수 설정 ← Vercel 환경변수로 관리
- [x] Supabase DB 연결 ← 2차 세션 완료

---

## 2026-03-21 | 2차 세션 — 프로토타입 개발, GitHub/Vercel 배포, Supabase DB 파이프라인 구축

### 작업 요약
Next.js 프로토타입 개발 완료. 전체 문서 익명화(A증권사). GitHub 퍼블릭 레포 생성 및 Vercel CI/CD 연동. AI를 Gemini 1.5 Flash로 결정. Supabase DB + Cron 파이프라인 구조 구축.

### 주요 작업

| # | 작업 | 내용 |
|---|------|------|
| 1 | 익명화 | 전체 문서/코드에서 회사명 → A증권사 처리 |
| 2 | GitHub 배포 | `birddogmary24-bit/securitya` 퍼블릭 레포 생성, 초기 커밋 |
| 3 | Vercel CI/CD | GitHub 연동 → `main` push 시 자동 배포. URL: `securitya.vercel.app` |
| 4 | AI 모델 결정 | Claude API → **Gemini 1.5 Flash** 로 변경 (`@google/generative-ai`) |
| 5 | Supabase 연동 | `stock_quotes`, `stock_news` 테이블 설계 및 생성 |
| 6 | Cron 파이프라인 | `/api/cron/collect-data` 엔드포인트 구현 (mock → DB 저장) |
| 7 | 브리핑 API 개선 | Supabase DB 우선 조회 → fallback mock 구조로 개선 |
| 8 | UI 개선 | AI/Mock 뱃지, KST 생성 시각, 데이터 출처 표기 추가 |
| 9 | Vercel Cron | `vercel.json` — 매일 06:00 KST 자동 데이터 수집 스케줄 |

### 배포 현황

| 항목 | 내용 |
|------|------|
| GitHub | `github.com/birddogmary24-bit/securitya` |
| Vercel URL | `https://securitya.vercel.app` |
| CI/CD | GitHub `main` push → Vercel 자동 배포 |
| AI | Gemini 1.5 Flash (Google AI Studio) |
| DB | Supabase — `stock_quotes`, `stock_news` 테이블 운영 중 |
| Cron | 매일 21:00 UTC (06:00 KST) 자동 실행 |

### 환경변수 (Vercel Production)

| Key | 용도 |
|-----|------|
| `GEMINI_API_KEY` | Gemini 1.5 Flash |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서버 사이드 접근 |
| `CRON_SECRET` | Cron 엔드포인트 인증 |

### 현재 아키텍처

```
[Vercel Cron - 매일 06:00 KST]
mock-data.ts (→ 추후 Finnhub으로 교체)
        ↓
Supabase DB (stock_quotes, stock_news)
        ↓
/api/briefing → Gemini 1.5 Flash AI 분석
        ↓
securitya.vercel.app 브리핑 화면
```

### 다음 세션 시작 전 확인 사항

- [ ] Finnhub API 연동 — mock-data.ts → 실시간 주가/뉴스 교체
- [ ] Cron 주기 조정 (현재 1일 1회 → 필요 시 변경)
- [x] Phase 2: AI 공시 해석기 (SEC EDGAR) 개발 시작 ← PLAN.md에 Phase 1로 통합

---

## 2026-03-22 | 3차 세션 — Proposal 대폭 개편 (페르소나 + 3 정보 풀 + 댓글 시스템)

### 작업 요약
Proposal 전면 개편. 3가지 새 컨셉(투자자 페르소나, 3가지 정보 풀 프레임워크, 구조화된 댓글·토론 시스템) 통합. AI Q&A 챗봇은 Phase 4로 분리(TBD). 총 5개 문서 수정.

### 주요 변경 사항

| # | 변경 | 내용 |
|---|------|------|
| 1 | **투자자 페르소나 시스템 추가** | 온보딩 시 8가지 투자 특성(스윙매매, 장기투자, 스캘핑, 우량주, ETF, 소형주, 테크주, 배당주) 1~5점 자가 평가. 확증편향 깨기 — AI가 보완적 관점 선제적 제안 |
| 2 | **3가지 정보 풀 프레임워크** | Pool 1(공식 데이터: SEC 공시, 실적), Pool 2(공개 정보: 뉴스, Reddit, X), Pool 3(집단 지성: AI 정보 기반 댓글·토론). 기존 "3가지 벽"에 대한 해법으로 매핑 |
| 3 | **기능 3 재구성** | "AI Q&A + 커뮤니티" → "구조화된 집단 지성 — AI 정보 기반 댓글·토론 시스템" (횡단 기능). 별도 탭이 아니라 모든 AI 정보 콘텐츠에 댓글 적용 |
| 4 | **AI Q&A 챗봇 분리** | 기능 4 / Phase 4로 분리 (TBD) |
| 5 | **Phase 재배치** | Phase 1: 브리핑+페르소나+댓글, Phase 2: 공시해석+댓글고도화, Phase 3: 크로스풀+풀론칭, Phase 4: AI Q&A 챗봇(TBD) |

### 수정된 파일

| 파일 | 주요 변경 |
|------|----------|
| `docs/proposal-detailed.md` | 새 섹션 4(솔루션 프레임워크) 추가, 기능 1 페르소나 통합, 기능 3 횡단 댓글 시스템으로 재구성, 검증 지표/실행 방안 업데이트 |
| `docs/proposal-executive-summary.md` | 솔루션 프레임워크 간략 추가, 기능 3→횡단 댓글, 기능 4 Q&A TBD, Phase 4행 추가 |
| `PRD.md` | 솔루션 프레임워크, UX Flow(온보딩+댓글), 기술 아키텍처(페르소나 엔진+Pool 3) 업데이트 |
| `docs/competitor-analysis.md` | 비교 매트릭스에 "투자자 페르소나 개인화", "구조화된 AI 기반 커뮤니티" 2행 추가 |
| `PLAN.md` | Phase 1에 페르소나+댓글 포함, SEC EDGAR Phase 1 통합, Phase 4(AI Q&A TBD) 추가 |

### 핵심 설계 결정

| 결정 | 이유 |
|------|------|
| 페르소나는 별도 기능이 아닌 기능 1의 엔진 | 선제적 제안을 개인 맞춤으로 만드는 기반 |
| Pool 3는 별도 커뮤니티 탭 ❌ → 모든 AI 정보에 댓글 | 브리핑/공시/뉴스 등 AI가 전달하는 모든 정보에 토론 가능 |
| AI Q&A 챗봇은 Phase 4로 분리 | 우선순위 조정. 댓글 시스템이 더 먼저 |
| Pool 3를 Phase 1 MVP에 포함 | 공격적이지만 초기 리텐션 확보 + 차별화 |

### 다음 세션 시작 전 확인 사항

- [x] 투자자 페르소나 온보딩 UI 구현 ← 4차 세션 완료
- [ ] 브리핑 카드에 댓글 기능 추가
- [ ] 페르소나 기반 LLM 프롬프트 개선 (보완적 관점 판단 엔진)
- [ ] Finnhub API 연동

---

## 2026-03-22 | 4차 세션 — PLAN.md 조정 + 투자자 페르소나 온보딩 구현

### 작업 요약
PLAN.md Phase 재조정(경제 캘린더/소셜 센티먼트 → Phase 2, SEC EDGAR → Phase 1, 브리핑 히스토리 삭제). 투자자 페르소나 온보딩 기능 풀스택 구현 완료(DB 테이블 + API + UI + LLM 프롬프트 주입).

### 주요 작업

| # | 작업 | 내용 |
|---|------|------|
| 1 | PLAN.md Phase 조정 | #4 경제캘린더 → Phase 2, #5 소셜센티먼트 → Phase 2(신규), #10 브리핑히스토리 삭제, #13 SEC EDGAR → Phase 1 |
| 2 | Supabase 테이블 생성 | `user_personas` 테이블 — 8개 투자 특성 (1~5점), UUID user_id, RLS 설정 |
| 3 | 타입 정의 | `Persona` 인터페이스, `PERSONA_TRAITS` 배열, `DEFAULT_PERSONA` 상수 추가 |
| 4 | 유틸 함수 | `persona.ts` — getUserId, getPersona, savePersona, hasPersona |
| 5 | API 라우트 | `/api/persona` — POST(upsert), GET(조회). Supabase 연동 |
| 6 | 페르소나 UI | `PersonaForm.tsx` (슬라이더 8개 한 화면) + `/persona` 페이지 |
| 7 | 포트폴리오 연결 | 포트폴리오 저장 시 페르소나 미설정이면 `/persona`로 리다이렉트 |
| 8 | LLM 프롬프트 주입 | `buildPersonaPrompt()` — 투자 성향을 Gemini 프롬프트에 주입 |
| 9 | 홈 페이지 연동 | 브리핑 요청 시 persona 데이터 함께 전송 |
| 10 | BottomNav 업데이트 | "투자성향" 탭 추가 (사용자 아이콘) |

### 신규/수정 파일

| 파일 | 상태 | 역할 |
|------|------|------|
| `supabase/migrations/002_user_personas.sql` | 신규 | DB 테이블 생성 SQL |
| `app/src/lib/persona.ts` | 신규 | 페르소나 localStorage 유틸 |
| `app/src/app/api/persona/route.ts` | 신규 | 페르소나 CRUD API |
| `app/src/components/PersonaForm.tsx` | 신규 | 슬라이더 폼 컴포넌트 |
| `app/src/app/persona/page.tsx` | 신규 | 페르소나 설정 페이지 |
| `app/src/lib/types.ts` | 수정 | Persona 인터페이스 추가 |
| `app/src/components/PortfolioForm.tsx` | 수정 | 저장 후 페르소나 리다이렉트 |
| `app/src/app/page.tsx` | 수정 | 브리핑에 persona 전달 |
| `app/src/components/BottomNav.tsx` | 수정 | 투자성향 탭 추가 |
| `app/src/app/api/briefing/route.ts` | 수정 | 페르소나 프롬프트 주입 |
| `docs/superpowers/specs/2026-03-22-persona-onboarding-design.md` | 신규 | 설계 문서 |

### 현재 아키텍처 (페르소나 추가 후)

```
[포트폴리오 저장] → 페르소나 미설정? → /persona (슬라이더 8개)
                                          ↓
                                    localStorage + Supabase(user_personas)
                                          ↓
[홈 페이지] → /api/briefing (portfolio + persona)
                    ↓
              Gemini 프롬프트에 투자 성향 주입
                    ↓
              개인화된 브리핑 카드 렌더링
```

| 11 | 문서 동기화 | CLAUDE.md(DB 스키마/API 추가), proposal-executive-summary.md(Phase 테이블 업데이트), proposal-detailed.md(Phase 1에 SEC EDGAR 포함, Phase 2에 경제캘린더/소셜센티먼트 이동) |
| 12 | Vercel 배포 | git commit & push → main 자동 배포 |

### 다음 세션 시작 전 확인 사항

- [x] Vercel 배포 후 실제 동작 확인
- [ ] 브리핑 카드에 댓글 기능 추가
- [ ] 페르소나 기반 보완적 관점 엔진 (Phase 2 예정)
- [x] Finnhub API 연동 ← 5차 세션 완료

---

## 2026-03-22 | 5차 세션 — Finnhub 1,000종목 파이프라인 + SEC EDGAR 공시 수집 + 공시 UI

### 작업 요약
Finnhub API를 활용한 1,000종목 데이터 수집 파이프라인 구축 (3단계 Tier 시스템, Vercel Cron 청크 배치). SEC EDGAR 공시(10-K/10-Q/8-K) 자동 수집 + 공시 목록 UI 구현. 브리핑 프롬프트에 공시/재무/애널리스트/목표가/어닝일정 데이터 통합.

### 주요 작업

| # | 작업 | 내용 | 시각 |
|---|------|------|------|
| 1 | Finnhub 데이터 파이프라인 | `finnhub.ts` — rate-limited API 클라이언트 (55 req/60s), 10개 함수 (quote, profile, news, financials, recommendations, priceTarget, upgrades, insider, earnings, quoteBatch) | 오후 |
| 2 | 1,000종목 Tier 시스템 | `stock-tiers.ts` — Tier 1(50종목: 풀 데이터), Tier 2(200종목: 주가+뉴스), Tier 3(750종목: 주가만) | 오후 |
| 3 | Finnhub Cron 엔드포인트 | `/api/cron/finnhub-collect` — 25종목/호출 청크 배치, `batch_state` 테이블로 진행 추적 | 오후 |
| 4 | Finnhub DB 마이그레이션 | `003_finnhub_tables.sql` — 9개 신규 테이블 + stock_quotes/stock_news 컬럼 추가 | 오후 |
| 5 | Vercel 환경변수 | FINNHUB_API_KEY 추가, 재배포 트리거 | 오후 |
| 6 | SEC EDGAR 수집 | `sec-edgar.ts` — CIK 매핑 + 90일 공시 필터링 (10-K/10-Q/8-K) | 저녁 |
| 7 | SEC Cron 엔드포인트 | `/api/cron/sec-collect` — 별도 SEC 수집 Cron | 저녁 |
| 8 | 공시 목록 UI | `/filings` 페이지 — 유형 필터, 종목별 그룹핑, SEC.gov 링크 | 저녁 |
| 9 | 공시 API | `/api/filings` — 티커별 공시 조회 (GET ?tickers=) | 저녁 |
| 10 | 브리핑 프롬프트 강화 | 공시 + 재무지표 + 애널리스트 의견 + 목표가 + 등급변경 + 어닝일정 통합 | 저녁 |
| 11 | 브리핑 카드 강화 | 카드 내 최근 SEC 공시 표시 (유형 뱃지 + 링크) | 저녁 |
| 12 | BottomNav 확장 | "공시" 탭 추가 (4탭: 브리핑/포트폴리오/공시/투자성향) | 저녁 |
| 13 | batch_state 버그 수정 | 컬럼명 불일치 수정 (`current_offset` 등) | 밤 |

### 신규 파일

| 파일 | 역할 |
|------|------|
| `app/src/lib/finnhub.ts` | Finnhub API 클라이언트 (rate limiter 내장) |
| `app/src/lib/stock-tiers.ts` | 1,000종목 Tier 정의 (Tier 1: 50, Tier 2: 200, Tier 3: 750) |
| `app/src/lib/sec-edgar.ts` | SEC EDGAR CIK 매핑 + 공시 수집 |
| `app/src/lib/sec-edgar.sql` | sec_filings 테이블 스키마 |
| `app/src/app/api/cron/finnhub-collect/route.ts` | Finnhub 배치 수집 Cron |
| `app/src/app/api/cron/sec-collect/route.ts` | SEC EDGAR 수집 Cron |
| `app/src/app/api/filings/route.ts` | 공시 조회 API |
| `app/src/app/filings/page.tsx` | 공시 목록 UI 페이지 |
| `supabase/migrations/003_finnhub_tables.sql` | 9개 신규 테이블 마이그레이션 |
| `docs/superpowers/plans/2026-03-21-finnhub-data-pipeline.md` | 구현 계획서 |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/src/lib/types.ts` | SecFiling, CompanyProfile, BasicFinancials, RecommendationTrend, PriceTarget, UpgradeDowngrade, InsiderTransaction, EarningsEvent 인터페이스 추가 |
| `app/src/lib/supabase.ts` | Supabase 클라이언트 확장 |
| `app/src/app/api/briefing/route.ts` | fetchMarketData 확장 (공시/재무/애널리스트/목표가/등급/어닝), 프롬프트 강화 |
| `app/src/components/BriefingCard.tsx` | 카드 내 최근 공시 표시 섹션 추가 |
| `app/src/components/BottomNav.tsx` | "공시" 탭 + FilingsIcon 추가 |
| `app/vercel.json` | Cron 스케줄 변경 (finnhub 00:00 UTC, sec 01:00 UTC) |

### Vercel Cron 스케줄

| 엔드포인트 | UTC | KST | 설명 |
|-----------|-----|-----|------|
| `/api/cron/finnhub-collect` | 00:00 | 09:00 | Finnhub 1,000종목 배치 (청크 방식) |
| `/api/cron/sec-collect` | 01:00 | 10:00 | SEC EDGAR 공시 수집 |

### DB 현황 (Supabase, 12개 테이블)

```
기존: stock_quotes, stock_news, user_personas
신규: stock_profiles, stock_financials, stock_recommendations,
      stock_price_targets, stock_upgrades, stock_insider_transactions,
      earnings_calendar, batch_state, sec_filings
```

### 다음 세션 시작 전 확인 사항

- [ ] Cron 실행 결과 확인 (Finnhub/SEC 데이터 정상 수집 여부)
- [ ] 브리핑 카드에 댓글 기능 추가 (Phase 1 남은 작업)
- [ ] proposal 문서 동기화 (Finnhub/SEC 구현 반영)
- [ ] 전체 문서 최신화 완료 여부 점검
