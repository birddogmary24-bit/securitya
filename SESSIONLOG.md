# AI 미국주식 브리핑 서비스 — 세션 작업 로그

> **최종 업데이트:** 2026-03-22 (13차 세션)
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
securitya/
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
- [x] proposal 문서 동기화 (Finnhub/SEC 구현 반영) ← 6차 세션 완료
- [x] 전체 문서 최신화 완료 여부 점검 ← 6차 세션 완료

---

## 2026-03-22 | 6차 세션 — 전체 문서 최신화 + Phase 1 현황 정리

### 작업 요약
5차 세션(Finnhub + SEC EDGAR)에서 구현한 내용을 전체 문서에 반영. PLAN.md 구현 현황 업데이트, CLAUDE.md DB/API/Cron 갱신, PRD.md에 구현 현황 섹션 신설, SESSIONLOG.md 5차 세션 기록 추가. 피드백 메모리 저장(문서 변경 시 자동 커밋/푸시).

### 주요 작업

| # | 작업 | 내용 |
|---|------|------|
| 1 | PLAN.md 최신화 | #3 페르소나 ✅, #4 Finnhub ✅, #5 SEC EDGAR ✅, #6 LLM 강화 ✅, #7 카드 강화 ✅ 반영. 완료일/시각 추가 |
| 2 | CLAUDE.md 최신화 | DB 12개 테이블, API 6개 엔드포인트, Cron 2개(Finnhub/SEC), FINNHUB_API_KEY 연동완료, 참고문서 추가 |
| 3 | PRD.md 최신화 | 섹션 10 "구현 현황" 신설 — 12개 기능별 상태/완료일 테이블. 변경 이력에 시각 추가 |
| 4 | SESSIONLOG.md | 5차 세션 로그 작성 (Finnhub 파이프라인 + SEC EDGAR + 13개 작업 상세) |
| 5 | 피드백 메모리 | "문서 변경 시 확인 없이 바로 commit & push" 저장 |

### 현재 Phase 1 상태 요약

| 항목 | 상태 |
|------|------|
| 프로젝트 셋업 | ✅ |
| 포트폴리오 UI | ✅ |
| 페르소나 온보딩 | ✅ |
| Finnhub 파이프라인 | ✅ |
| SEC EDGAR 수집 | ✅ |
| LLM 브리핑 (통합 프롬프트) | ✅ |
| 브리핑 카드 + 공시 표시 | ✅ |
| 공시 목록 UI | ✅ |
| 4탭 BottomNav | ✅ |
| 배포 | ✅ |
| **카드별 댓글 (Pool 3)** | **⏳ 미구현** |

### 다음 세션 시작 전 확인 사항

- [x] Cron 실행 결과 확인 ← 7차 세션에서 SEC 37건 수집 확인
- [ ] 브리핑 카드에 댓글 기능 추가 (Phase 1 유일한 남은 작업)
- [x] proposal-executive-summary / proposal-detailed에 Finnhub/SEC 구현 반영 ← 7차 세션 완료

---

## 2026-03-22 | 7차 세션 — AI 공시 요약 + 모델 fallback 체인 + Tier 1 전환

### 작업 요약
SEC EDGAR 공시 AI 한국어 요약 기능 구현. Gemini 1.5 시리즈 종료 + 무료 쿼터 소진 대응으로 모델 fallback 체인 도입 및 Google AI Studio Tier 1(유료) 전환. 전체 문서 최신화.

### 주요 작업

| # | 작업 | 내용 |
|---|------|------|
| 1 | SEC 수집 수동 테스트 | `/api/cron/sec-collect` 수동 호출 → 37건 정상 수집 확인 |
| 2 | SEC 크론 독립 분리 | `collect-data` 리다이렉트 변경으로 SEC를 `/api/cron/sec-collect`로 분리 |
| 3 | AI 공시 요약 API | `/api/filings/summarize` — SEC 원문 fetch → Gemini 한국어 요약 |
| 4 | AI 요약 UI | 공시 목록에 "AI 요약" 버튼, 인라인 요약, 하루 5회 제한 (localStorage) |
| 5 | Gemini 모델 마이그레이션 | 1.5-flash(종료) → 2.0-flash(쿼터 소진) → 2.5-flash-lite 순차 대응 |
| 6 | 모델 fallback 체인 | 요약/브리핑 API 모두 4단계 fallback (429/404 시 자동 다음 모델) |
| 7 | Google AI Studio Tier 1 | 무료 쿼터 소진 → Ksecurity001 프로젝트 유료 전환 |
| 8 | Supabase lazy 초기화 | Proxy 패턴으로 빌드 시 환경변수 없어도 동작하도록 개선 |
| 9 | 전체 문서 최신화 | SESSIONLOG, PLAN, CLAUDE, PRD, DEVELOPMENT-SPEC 업데이트 |

### 모델 fallback 체인 (최종)

| | 요약 API (저렴 우선) | 브리핑 API (품질 우선) |
|--|---------------------|---------------------|
| 1순위 | gemini-2.5-flash-lite | gemini-2.5-flash |
| 2순위 | gemini-2.0-flash-lite | gemini-2.5-flash-lite |
| 3순위 | gemini-2.5-flash | gemini-2.0-flash |
| 4순위 | gemini-2.0-flash | gemini-2.0-flash-lite |

### 비용 예상 (Tier 1, 일 100회 기준)

| 용도 | 모델 | 월 비용 |
|------|------|--------|
| 공시 요약 | 2.5-flash-lite | ~$2 |
| 브리핑 생성 | 2.5-flash | ~$4 |
| **합계** | | **~$6/월** |

### 신규/수정 파일

| 파일 | 상태 | 역할 |
|------|------|------|
| `app/src/app/api/filings/summarize/route.ts` | 신규 | AI 공시 요약 API (fallback 체인) |
| `app/src/app/api/cron/sec-collect/route.ts` | 신규 | SEC EDGAR 독립 크론 |
| `app/src/app/filings/page.tsx` | 수정 | AI 요약 버튼 + 일 5회 제한 + 인라인 요약 |
| `app/src/app/api/briefing/route.ts` | 수정 | 모델 fallback 체인 적용 |
| `app/src/lib/supabase.ts` | 수정 | lazy 초기화 Proxy 패턴 |
| `app/vercel.json` | 수정 | sec-collect 크론 추가 |

### 다음 세션 시작 전 확인 사항

- [ ] 브리핑 카드에 댓글 기능 추가 (Phase 1 유일한 남은 작업)
- [ ] 2026-06-01 전에 2.0 모델 완전 제거 (현재 fallback으로 대응 중)
- [ ] 공시 요약 품질 모니터링

---

## 2026-03-22 | 8차 세션 — 전체 문서 최신화 (PLAN/CLAUDE/PRD/SPEC/SESSIONLOG)

### 작업 요약
4~7차 세션에서 구현한 모든 내용을 프로젝트 문서에 반영. PLAN.md 구현 현황 갱신, CLAUDE.md 기술스택/DB/API 최신화, PRD.md 구현 현황 테이블+기술 아키텍처 갱신, DEVELOPMENT-SPEC.md 전면 최신화, 피드백 메모리 저장.

### 주요 작업

| # | 작업 | 내용 |
|---|------|------|
| 1 | PLAN.md | #3~#7 모두 ✅ 반영, 완료일/시각 추가, Phase 1 "댓글만 남음" 표기 |
| 2 | CLAUDE.md | 기술스택(Gemini 2.5), DB(12개 테이블), API(7개), Cron(2개), 환경변수 갱신 |
| 3 | PRD.md | 섹션 10 구현 현황 갱신 (AI 공시 요약, fallback 체인, Tier 1 유료 전환 추가), 기술 아키텍처 전면 재작성 |
| 4 | DEVELOPMENT-SPEC.md | 기술스택/데이터파이프라인/API/Phase 전면 최신화 (초기 기획 → 현행 구현 반영) |
| 5 | SESSIONLOG.md | 5~8차 세션 로그 정리 |
| 6 | 피드백 메모리 | "문서 변경 시 확인 없이 바로 commit & push" 저장 |

### 다음 세션 시작 전 확인 사항

- [x] Phase 1 완료 — 댓글은 Phase 2로 이동
- [ ] Phase 2 시작: 카드별 댓글 기능 (Pool 3)
- [ ] 공시 요약 품질 모니터링
- [ ] proposal-executive-summary / proposal-detailed 구현 현황 반영

---

## 2026-03-22 | 9차 세션 — 브리핑 캐시 시스템 구현

### 작업 요약
AI 브리핑 결과를 Supabase에 캐싱하여, 동일 데이터 기간 내 재호출 시 Gemini API를 호출하지 않고 즉시 반환. 토큰 비용 절감 + 응답 속도 대폭 개선.

### 배경/문제
- 동일 포트폴리오로 브리핑을 반복 조회하면 매번 Gemini API 호출 → 토큰 낭비 + 느린 응답
- Finnhub/SEC 데이터가 갱신되지 않은 기간에는 브리핑 내용이 동일 → 캐싱 가능

### 주요 작업

| # | 작업 | 내용 |
|---|------|------|
| 1 | DB 마이그레이션 | `004_briefing_cache.sql` — `briefing_cache` 테이블 (cache_key, data_freshness_key, briefing_data JSONB, expires_at) |
| 2 | 캐시 키 설계 | 포트폴리오(ticker+quantity 정렬) + 페르소나를 SHA256 해싱 → 32자 고정 키. 종목 수 확장에 무관 |
| 3 | 데이터 신선도 키 | `stock_quotes.updated_at`, `stock_news.published_at`, `sec_filings.filed_date` 최신값 조합 해싱 → 데이터 변경 감지 |
| 4 | 캐시 로직 (API) | 요청 → cache_key + freshness_key 생성 → 캐시 HIT면 즉시 반환, MISS면 Gemini 호출 후 저장 |
| 5 | 강제 새로고침 | `forceRefresh: true` 파라미터로 캐시 무시 가능 |
| 6 | 캐시 정리 | 저장 시 3일 이상 만료 캐시 자동 삭제, TTL 24시간 |
| 7 | 타입 확장 | `DailyBriefing`에 `cached`, `cachedAt` 필드 추가 |
| 8 | 프론트엔드 UX | 캐시된 브리핑이면 "캐시 · 저장 시각" 표시 + "AI 새로 생성" 버튼 노출 |
| 9 | 문서 동기화 | SESSIONLOG, CLAUDE.md, DATA-CATALOG, PLAN.md, DEVELOPMENT-SPEC 최신화 |

### 캐시 무효화 전략

| 조건 | 동작 |
|------|------|
| 동일 cache_key + 동일 freshness_key + 미만료 | 캐시 HIT → 즉시 반환 |
| DB 데이터 갱신 (Cron 실행 후) | freshness_key 변경 → 캐시 MISS → 새로 생성 |
| 24시간 경과 | expires_at 만료 → 캐시 MISS |
| 사용자 "AI 새로 생성" 클릭 | forceRefresh=true → 캐시 무시 |

### 성능 개선 예상

| 항목 | 캐시 없음 | 캐시 HIT |
|------|----------|----------|
| 응답 시간 | 3~8초 (Gemini API) | ~200ms (DB 조회) |
| Gemini 토큰 | 매 요청 소모 | 0 |
| 비용 (월 100회 기준) | ~$4 | ~$1 (첫 생성만) |

### 신규/수정 파일

| 파일 | 상태 | 역할 |
|------|------|------|
| `supabase/migrations/004_briefing_cache.sql` | 신규 | 캐시 테이블 생성 SQL |
| `app/src/app/api/briefing/route.ts` | 수정 | 캐시 유틸 함수 + POST 핸들러에 캐시 체크/저장 로직 |
| `app/src/lib/types.ts` | 수정 | DailyBriefing에 cached, cachedAt 필드 추가 |
| `app/src/app/page.tsx` | 수정 | 캐시 표시 UI + forceRefresh 지원 + "AI 새로 생성" 버튼 |

### 다음 세션 시작 전 확인 사항

- [ ] Supabase에서 `004_briefing_cache.sql` 실행
- [ ] 캐시 동작 확인 (첫 요청 → 캐시 저장, 두 번째 → 캐시 HIT)
- [ ] Phase 2 시작: 카드별 댓글 기능 (Pool 3)
- [ ] proposal 문서에 캐시 기능 반영

---

## 2026-03-22 | 10차 세션 — PLAN.md Phase 2 상세화

### 작업 요약
PLAN.md의 Phase 2 항목(9~15번)이 너무 간략했던 것을 proposal-detailed.md 수준으로 상세화. 각 항목에 구체적 구현 범위, 데이터 소스, UX 동작 방식 추가.

### 주요 작업

| # | 작업 | 내용 |
|---|------|------|
| 1 | 현황 확인 | 전체 Phase 진행 상태 + 미커밋 변경사항 점검 |
| 2 | Phase 2 상세화 | PLAN.md 항목 9~15번 상세 설명 추가 |

### 상세화 내역

| 항목 | 추가된 내용 |
|------|-----------|
| 9. 카드별 댓글 | 댓글 테이블 스키마, 페르소나 뱃지 표시, 투자조언 필터링 |
| 10. 공시 RAG | 청킹 대상 섹션(MD&A, Risk Factors), 벡터 DB, RAG 흐름 |
| 11. 공시 해석 UI | AI 핵심 포인트 요약, 투자 시사점 제시 |
| 12. 전분기 비교 | 구체적 지표(매출, EPS), 가이던스 vs 실적 괴리 분석 |
| 13. 경제 캘린더 | FOMC/NFP/CPI 등 이벤트 목록, 캘린더 UI |
| 14. 소셜 센티먼트 | bullish/bearish 추이, Pool 2 매핑 |
| 15. 댓글 고도화 | 팩트체크 동작 방식, 신뢰도 표시, 출처 기반 토론 |

### 수정 파일

| 파일 | 상태 | 역할 |
|------|------|------|
| `PLAN.md` | 수정 | Phase 2 항목 9~15번 상세화 |
| `SESSIONLOG.md` | 수정 | 10차 세션 기록 추가 |

### 다음 세션 시작 전 확인 사항

- [x] Supabase에서 `004_briefing_cache.sql` 실행 (9차 세션 잔여) ← 11차 세션 완료
- [x] 캐시 동작 확인 (9차 세션 잔여) ← 종목별 캐시로 대체 (12차 세션)
- [ ] Phase 2 구현 시작 시 우선순위 결정 (9~15번 중 어디부터)

---

## 2026-03-22 | 11차 세션 — 550종목 확장, GitHub Actions 마이그레이션, Tier 3 On-demand, 성능 최적화

### 작업 요약
종목 550개로 확장 (Tier 1: 50 + Tier 2: 500 → 이후 12차에서 재설계). GitHub Actions로 Cron 마이그레이션 (Vercel Hobby 10초 timeout 우회). Tier 3 On-demand 수집 기능 구현. 브리핑 API 병렬 쿼리 성능 최적화.

### 주요 작업

| # | 작업 | 내용 |
|---|------|------|
| 1 | 550종목 확장 | `stock-tiers.ts` — Tier 1 (50) + Tier 2 (500)으로 확장 |
| 2 | GitHub Actions 마이그레이션 | `.github/workflows/cron-finnhub.yml`, `cron-sec.yml` — Vercel Cron API 호출 → GitHub Actions 내 직접 실행 |
| 3 | Vercel timeout 우회 | `collect-finnhub.ts`, `collect-sec.ts` — ts-node로 GitHub Actions 내 직접 실행하는 독립 스크립트 |
| 4 | Tier 3 On-demand | `tier3-ondemand.ts` — 미등록 종목 검색 시 Finnhub 즉시 수집 + DB 캐싱 (24h TTL) |
| 5 | 종목 검색 API | `/api/stocks/search` — Tier 1/2 로컬 검색 + Finnhub On-demand fallback |
| 6 | PortfolioForm 확장 | 포트폴리오 종목 검색을 전체 550종목 대상으로 확장 |
| 7 | 브리핑 병렬 쿼리 | `fetchMarketData` 내 Supabase 쿼리 병렬화 (`Promise.all`) + 타이밍 로그 |
| 8 | Vercel Cron 제거 | `vercel.json`에서 cron 설정 제거 (GitHub Actions로 완전 이전) |
| 9 | stock-list.md 확장 | 550종목 전체 리스트 문서화 |
| 10 | Tier 3 배치 연동 | 활성 On-demand 종목 (7일 이내 접근)을 배치 수집에 포함 |

### 신규 파일

| 파일 | 역할 |
|------|------|
| `app/scripts/collect-finnhub.ts` | Finnhub 배치 수집 스크립트 (GitHub Actions용) |
| `app/scripts/collect-sec.ts` | SEC 배치 수집 스크립트 (GitHub Actions용) |
| `app/src/lib/tier3-ondemand.ts` | Tier 3 On-demand 수집 + DB 캐싱 |
| `app/src/app/api/stocks/search/route.ts` | 종목 검색 API |
| `.github/workflows/cron-finnhub.yml` | Finnhub Cron (GitHub Actions) |
| `.github/workflows/cron-sec.yml` | SEC Cron (GitHub Actions) |

### GitHub Actions Cron 스케줄

| 워크플로우 | UTC | KST | 설명 |
|-----------|-----|-----|------|
| `cron-finnhub.yml` | 21:00 | 06:00 | Finnhub 수집 (→ 12차에서 06:30으로 변경) |
| `cron-sec.yml` | 22:00 | 07:00 | SEC EDGAR 수집 (→ 12차에서 07:30으로 변경) |

### 다음 세션 시작 전 확인 사항

- [x] GitHub Actions Cron 실행 결과 확인
- [x] On-demand 수집 동작 확인
- [x] Tier 재설계 검토 (ETF 분리, Tier 2 축소)

---

## 2026-03-22 | 12차 세션 — Tier 재설계 (ETF 분리), 종목별 AI 분석 캐시, Cron 타이밍 변경

### 작업 요약
3-Tier 종목 구조 재설계 (ETF 분리 + Tier 2 100종목으로 축소). Cron 타이밍을 06:30/07:30 KST로 변경. 종목별 AI 분석 사전 생성 캐시 구현 (`stock_analysis_cache` + `market_overview_cache`). 브리핑 API를 캐시 조합 방식으로 전면 리팩터링.

### 배경/문제
- 기존 1,000종목은 API 호출량 과다 + ETF에 재무데이터 수집 불필요
- briefing_cache는 포트폴리오+페르소나 조합별 → 캐시 히트율 낮음
- Cron 09:00 KST는 출근 후 → 출근 전 07:00에 브리핑 확인 불가

### 주요 작업

| # | 작업 | 내용 |
|---|------|------|
| 1 | Tier 구조 재설계 | `stock-tiers.ts` — Tier 1 (50) + Tier 2 (100 개별주식) + Tier 3 (~400 개별주식+ETF). `isEtf` 플래그 도입 |
| 2 | Finnhub 수집 스크립트 업데이트 | `collect-finnhub.ts` — Tier 1+2 개별주식 전체수집, Tier 3는 quote+news만 |
| 3 | SEC 수집 스크립트 업데이트 | `collect-sec.ts` — `isEtf` 종목 SEC 수집 제외 |
| 4 | Cron 타이밍 변경 | Finnhub: 06:30 KST (UTC 21:30), SEC: 07:30 KST (UTC 22:30) |
| 5 | stock_analysis_cache 테이블 | `005_stock_analysis_cache.sql` — ticker+analysis_date PK, sentiment/summary/key_points/proactive_suggestion |
| 6 | market_overview_cache 테이블 | 같은 마이그레이션 — analysis_date PK, greeting/market_overview/macro_alert |
| 7 | AI 분석 생성 스크립트 | `generate-stock-analysis.ts` — Tier 1+2 ~150종목 AI 분석 사전 생성 (배치 2, 13초 딜레이, 10 RPM) |
| 8 | 브리핑 API 리팩터링 | `briefing/route.ts` — 기존 실시간 Gemini 호출 → 캐시된 종목별 분석 조합으로 전면 변경 |
| 9 | Cron 워크플로우 연결 | `cron-finnhub.yml` — collect → generate-stock-analysis 순차 실행 |
| 10 | On-demand 업데이트 | `tier3-ondemand.ts` — managed tiers (1/2/3) 전부 스킵하도록 수정 |

### 신규 파일

| 파일 | 역할 |
|------|------|
| `supabase/migrations/005_stock_analysis_cache.sql` | stock_analysis_cache + market_overview_cache 테이블 |
| `app/scripts/generate-stock-analysis.ts` | 종목별 AI 분석 사전 생성 스크립트 |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `app/src/lib/stock-tiers.ts` | 전면 재설계: 50+100+400, isEtf 플래그, ETF 분리 |
| `app/scripts/collect-finnhub.ts` | Tier 1+2 전체수집, Tier 3 기본수집 |
| `app/scripts/collect-sec.ts` | isEtf 종목 제외 |
| `.github/workflows/cron-finnhub.yml` | 06:30 KST + generate-stock-analysis 단계 추가 |
| `.github/workflows/cron-sec.yml` | 07:30 KST |
| `app/src/app/api/briefing/route.ts` | 캐시 조합 방식으로 전면 리팩터링 (150→417줄 축소) |
| `app/src/lib/tier3-ondemand.ts` | managed tiers 전부 스킵 |

### 종목별 AI 분석 캐시 구조

```
[Cron 06:30 KST]
  collect-finnhub.ts (Finnhub 데이터 수집)
    ↓
  generate-stock-analysis.ts (AI 분석 사전 생성)
    ├─ stock_analysis_cache (Tier 1+2 ~150종목)
    │   ticker, analysis_date, sentiment, summary, key_points,
    │   proactive_suggestion, related_tickers, data_freshness_key
    └─ market_overview_cache (시장 전체 1건)
        analysis_date, greeting, market_overview, macro_alert

[브리핑 요청 시]
  /api/briefing
    → 포트폴리오 종목의 캐시된 분석 조회
    → 캐시 없는 종목은 실시간 데이터로 fallback
    → 조합하여 즉시 반환
```

### DB 현황 (Supabase, 15개 테이블)

```
기존 13개 + 신규 2개:
  stock_analysis_cache — 종목별 AI 분석 캐시
  market_overview_cache — 시장 전체 분석 캐시
```

### 배포 체크리스트

- [x] Supabase에서 `005_stock_analysis_cache.sql` 실행 — 완료
- [x] GitHub Secrets에 `GEMINI_API_KEY` 추가 — 완료
- [x] main 브랜치 머지 + 푸시 → Vercel 자동 배포
- [ ] GitHub Actions Cron 첫 실행 확인 (06:30 KST) → AI 분석 캐시 생성 확인
- [ ] 브리핑 캐시 조합 동작 확인 (캐시 HIT 시 <1초 응답)
- [ ] Phase 2 구현 시작 시 우선순위 결정

---

## 2026-03-22 | 13차 세션 — 문서 최신화 + 배포 체크리스트 완료

### 작업 요약
12차 세션에서 구현한 Tier 재설계 + 종목별 AI 캐시 + Cron 타이밍 변경의 배포 후속 작업 완료. Supabase 마이그레이션 실행, GitHub Secrets 설정, main 머지/푸시, 전체 문서 최신화 확인.

### 주요 작업

| # | 작업 | 내용 |
|---|------|------|
| 1 | Supabase 마이그레이션 실행 | `005_stock_analysis_cache.sql` — stock_analysis_cache + market_overview_cache 생성 |
| 2 | GitHub Secrets 설정 | `GEMINI_API_KEY` 추가 (Cron AI 분석 생성용) |
| 3 | main 머지 + 푸시 | `feat/tier-redesign-stock-analysis-cache` → main (7 commits, fast-forward) |
| 4 | 전체 문서 최신화 확인 | PLAN, DECISIONS, TECHNICAL-ARCHITECTURE, DATA-CATALOG, DEVELOPMENT-SPEC, CLAUDE.md — 12차에서 이미 반영 완료 확인 |
| 5 | SESSIONLOG 배포 체크리스트 | Supabase/Secrets 완료 체크, Cron 첫 실행 대기 항목 추가 |

### 다음 세션 시작 전 확인 사항

- [ ] GitHub Actions Cron 첫 실행 확인 (06:30 KST) → AI 분석 캐시 생성 확인
- [ ] 브리핑 캐시 조합 동작 확인 (캐시 HIT 시 <1초 응답)
- [ ] Phase 2 구현 시작 시 우선순위 결정
