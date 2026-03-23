# AI 미국주식 브리핑 서비스 — 개발 스펙

> **최종 업데이트:** 2026-03-22
>
> AI 미국주식 브리핑 서비스 프로토타입.
> A사 앱에서 웹뷰(Add-on) 방식으로 접근하는 웹 서비스.

---

## 프로젝트 개요

한국 투자자를 위한 AI 기반 미국주식 정보 서비스 프로토타입. 3가지 핵심 기능을 웹앱으로 구현하여, A사 앱 내 웹뷰로 제공하는 형태.

### 핵심 기능 3가지

#### 1. AI 종목 브리핑 (MVP 우선순위 1)
- 사용자 보유종목 기반 개인화 모닝 브리핑
- 밤사이 어닝/공시/뉴스를 교차 분석 → 포트폴리오 관점 요약
- 종목 간 연쇄 영향 분석 (NVDA 가이던스 → AMD 영향)
- **선제적 제안**: "오늘 밤 FOMC — 변동성 대비 손절라인 설정하시겠어요?"

#### 2. AI 공시 해석기
- SEC EDGAR 10-K/10-Q/8-K 자동 파싱 → 한국어 해석
- 핵심 지표 변동, 리스크 팩터 변화, 경영진 톤 분석
- 전분기/전년 대비 비교 자동 생성

#### 3. AI 투자 맥락 Q&A
- 한국어 대화형 종목 분석 (공시/어닝콜/뉴스 기반)
- 출처 인용 필수
- 커뮤니티 정보 검증 (팩트체크)
- 투자 조언 금지 가드레일

---

## UX Flow (A사 앱 → 웹뷰 Add-on)

```
A사 앱
  └─ 해외주식 탭
       └─ "AI 투자비서" 배너/버튼
            └─ WebView로 웹앱 로드
                 ├─ [홈] 오늘의 AI 브리핑 (포트폴리오 기반)
                 ├─ [공시] AI 공시 해석기 (종목별 SEC 공시 분석)
                 ├─ [Q&A] AI 투자 맥락 Q&A (채팅 인터페이스)
                 └─ [설정] 관심종목/알림 설정
```

### 화면 구성

| 화면 | 설명 |
|------|------|
| **홈 (브리핑)** | 카드형 종목별 브리핑 리스트. 각 카드에 요약 + 선제적 제안. 날짜별 히스토리 |
| **공시 해석** | 종목 선택 → 최신 공시 해석 목록. 공시 유형(10-K/Q/8-K) 필터 |
| **Q&A 채팅** | 채팅 UI. 질문 입력 → AI 답변(출처 인라인). 대화 히스토리 |
| **설정** | 관심종목 추가/삭제, 알림 시간 설정, 브리핑 빈도 |

### 프로토타입 범위 (데모용)
- 실제 A사 앱 연동은 불가 → **독립 웹앱으로 구현** (모바일 웹뷰 사이즈 최적화)
- 사용자 인증: 간단한 포트폴리오 입력 (종목 + 수량)으로 대체
- 실제 증권사 API 연동 없음 → 공개 API + 모의 데이터 혼합

---

## 기술 스택 (구현 완료)

| 영역 | 기술 | 상태 |
|------|------|------|
| **프론트엔드** | Next.js 16 + Tailwind CSS 4 | ✅ 모바일 375px 최적화 |
| **백엔드 API** | Next.js API Routes | ✅ 8개 엔드포인트 |
| **AI/LLM** | Gemini 2.5 Flash/Lite (Google AI Studio Tier 1) | ✅ 4단계 fallback 체인 + 종목별 AI 분석 사전 생성 |
| **데이터 수집** | Finnhub API (Free 60 req/min) | ✅ 550종목 3-Tier 시스템 (ETF 분리) |
| **공시 수집** | SEC EDGAR API | ✅ 10-K/10-Q/8-K 자동 수집 |
| **벡터 DB** | Pinecone 또는 ChromaDB | ⏳ Phase 2 (공시 RAG 파이프라인) |
| **배포** | Vercel (Hobby, CI/CD) | ✅ securitya.vercel.app |
| **DB** | Supabase (PostgreSQL) — 15개 테이블 | ✅ DATA-CATALOG.md 참조 |
| **Cron** | GitHub Actions (2개 워크플로우) | ✅ Finnhub+AI분석 06:30 KST / SEC 07:30 KST |

---

## 데이터 파이프라인 (구현 완료)

```
[GitHub Actions Cron — 매일 자동 실행]
  ├─ 06:30 KST: Finnhub 배치 수집 (collect-finnhub.ts) ✅
  │   ├─ 550종목 × 3-Tier (ETF 분리), Supabase 직접 저장
  │   └─ → AI 분석 사전 생성 (generate-stock-analysis.ts) ✅
  │       ├─ Tier 1+2 ~150종목 종목별 AI 분석
  │       ├─ stock_analysis_cache 저장
  │       └─ market_overview_cache 저장
  └─ 07:30 KST: SEC EDGAR 수집 (collect-sec.ts) ✅
      └─ CIK 매핑 → 10-K/10-Q/8-K 90일 내 (ETF 제외)

         ↓

[Supabase (PostgreSQL) — 15개 테이블] ✅
  ├─ stock_quotes — 주가 (Tier 1/2/3 전체)
  ├─ stock_news — 기업별 + 일반 시장 뉴스
  ├─ stock_financials — PER, PBR, 배당, 52주 고저
  ├─ stock_recommendations — 애널리스트 컨센서스
  ├─ stock_price_targets — 목표가
  ├─ stock_upgrades — 등급 변경
  ├─ stock_insider_transactions — 내부자 거래
  ├─ earnings_calendar — 어닝 일정
  ├─ sec_filings — SEC 공시 (10-K/Q/8-K)
  ├─ user_personas — 투자자 페르소나 (8개 특성)
  ├─ stock_profiles — 기업 프로필
  ├─ batch_state — Cron 배치 진행 추적
  ├─ briefing_cache — 레거시 브리핑 캐시 (종목별 캐시로 대체)
  ├─ stock_analysis_cache — 종목별 AI 분석 캐시 ✨
  └─ market_overview_cache — 시장 전체 분석 캐시 ✨

         ↓

[AI 분석 엔진] ✅
  Gemini (fallback 체인: 2.5-flash → 2.5-flash-lite → 2.0-flash → 2.0-flash-lite)
  ├─ 종목별 AI 분석 사전 생성 (Cron 06:30 KST)
  │   ├─ sentiment / summary / key_points / proactive_suggestion
  │   └─ data_freshness_key 기반 재생성 스킵
  ├─ 브리핑 요청 시 캐시된 분석 조합 → 즉시 반환
  ├─ SEC 공시 AI 한국어 요약 (하루 5회 제한)
  └─ 캐시 miss 종목: 실시간 데이터로 fallback

         ↓

[프론트엔드 — 4탭 구성] ✅
  ├─ [브리핑] 카드형 종목별 AI 브리핑 + 공시 표시
  ├─ [포트폴리오] 종목 검색/추가/수량 관리
  ├─ [공시] SEC 공시 목록 + 유형 필터 + AI 요약
  └─ [투자성향] 페르소나 슬라이더 설정
```

---

## API 엔드포인트 (구현 완료)

| 메서드 | 경로 | 설명 | 상태 |
|--------|------|------|------|
| POST | `/api/briefing` | 포트폴리오 기반 AI 브리핑 (종목별 캐시 조합, forceRefresh 옵션) | ✅ |
| POST/GET | `/api/persona` | 투자자 페르소나 저장/조회 | ✅ |
| GET | `/api/filings?tickers=` | SEC 공시 조회 (종목별 필터) | ✅ |
| POST | `/api/filings/summarize` | AI 공시 한국어 요약 (모델 fallback 체인) | ✅ |
| GET | `/api/stocks/search?q=` | 종목 검색 (Tier 1/2 로컬 + Tier 3 On-demand) | ✅ |
| GET | `/api/cron/finnhub-collect` | Finnhub 배치 수집 (레거시, GitHub Actions로 대체) | ✅ |
| GET | `/api/cron/sec-collect` | SEC EDGAR 공시 수집 (레거시, GitHub Actions로 대체) | ✅ |
| GET | `/api/cron/collect-data` | 레거시 (finnhub-collect 리다이렉트) | ✅ |

---

## 개발 우선순위 (Phase) — 최신: `PLAN.md` 참조

### Phase 1: 브리핑 MVP + 페르소나 ✅
1. ✅ 프로젝트 셋업 (Next.js 16 + Tailwind 4 + Supabase + Vercel)
2. ✅ 포트폴리오 입력 UI
3. ✅ 투자자 페르소나 온보딩 (8개 특성 슬라이더)
4. ✅ Finnhub 데이터 파이프라인 (550종목 3-Tier, ETF 분리, GitHub Actions)
5. ✅ SEC EDGAR 공시 수집 + AI 요약
6. ✅ LLM 브리핑 생성 (통합 프롬프트 + 모델 fallback)
7. ✅ 브리핑 카드 UI + 공시 표시
8. ✅ 배포

### Phase 2: 공시 RAG + 데이터 확장 + 댓글 시스템
→ 카드별 댓글, 공시 파싱 RAG, 전분기 비교, 경제 캘린더, 소셜 센티먼트, 댓글 고도화

### Phase 3: 크로스풀 인사이트 + 풀 론칭
→ 크로스풀 연결, 정보 검증 엔진, 뉴스 감성 분석

### Phase 4: AI Q&A 챗봇 — TBD

---

## 참고 문서
- `proposal-executive-summary.md` — 서비스 요약 (1~2페이지)
- `proposal-detailed.md` — 상세 제안서 (문제 정의, 경쟁 분석, 와이어프레임 등)
- 인사이트 재료: `/Users/wayne/.claude/plans/silly-whistling-parrot.md`

## 디자인 참고
- 모바일 웹뷰 최적화 (375px 기준)
- A사 디자인 톤 참고 (밝은 배경, 카드형 UI, 노란색 포인트)
- 브리핑 카드: 종목별 컬러 코딩 (🔴 부정 / 🟡 주의 / 🟢 긍정)
