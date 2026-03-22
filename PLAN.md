# 구현 계획: AI 미국주식 브리핑 서비스

> **최종 업데이트:** 2026-03-22
>
> A증권사 AI Content PM 채용 과제 프로토타입.
> 상세 기술 스펙: `docs/DEVELOPMENT-SPEC.md`

---

## Phase 1: 브리핑 MVP + 페르소나 + 댓글 시스템
**목표:** 페르소나 기반 AI 종목 브리핑 + AI 정보 기반 댓글·토론 시스템

1. **프로젝트 셋업** ✅
   - Next.js 16 + Tailwind CSS 4 초기 설정
   - Supabase DB 연결 (stock_quotes, stock_news)
   - Vercel 환경 변수 구성

2. **포트폴리오 입력 UI** ✅
   - 종목 + 수량 입력 화면 (모바일 375px)
   - localStorage 상태 관리

3. **투자자 페르소나 온보딩** ✅ (2026-03-22)
   - ✅ 8가지 투자 특성 1~5점 슬라이더 UI
   - ✅ 특성: 스윙매매, 장기투자, 스캘핑, 우량주, ETF, 소형주, 테크주, 배당주
   - ✅ 페르소나 저장 (localStorage + Supabase `user_personas`)
   - ✅ 포트폴리오 저장 → 페르소나 미설정 시 `/persona`로 리다이렉트
   - ✅ BottomNav에 "투자성향" 탭 추가

4. **데이터 수집 파이프라인** ✅ (2026-03-22)
   - ✅ Supabase DB + Vercel Cron 구조 완성
   - ✅ mock-data.ts → DB 저장 흐름 구현
   - ✅ Finnhub API 연동 — 1,000종목 3단계 Tier 시스템
     - Tier 1 (50종목): 주가 + 뉴스 + 재무 + 애널리스트 + 목표가 + 내부자거래
     - Tier 2 (200종목): 주가 + 뉴스
     - Tier 3 (750종목): 주가만
   - ✅ Vercel Cron 청크 배치 (25종목/호출, batch_state 추적)
   - ✅ 9개 신규 Supabase 테이블 생성 (`003_finnhub_tables.sql`)

5. **SEC EDGAR 데이터 수집** ✅ (2026-03-22)
   - ✅ 10-K / 10-Q / 8-K 원문 자동 수집 (`sec-edgar.ts`)
   - ✅ CIK 매핑 + 90일 내 공시 필터링
   - ✅ 별도 Cron 엔드포인트 (`/api/cron/sec-collect`)
   - ✅ 보유종목 관련 공시 → 브리핑 프롬프트에 자동 반영
   - ✅ 공시 목록 UI (`/filings` 페이지 + 유형 필터)
   - ✅ AI 공시 한국어 요약 (`/api/filings/summarize` + 모델 fallback 체인)
   - ✅ 하루 5회 요약 제한 (localStorage 카운터)

6. **LLM 브리핑 생성** ✅ (강화 2026-03-22)
   - ✅ Gemini 2.5 Flash/Lite 연동 + 4단계 모델 fallback 체인
   - ✅ 포트폴리오 기반 개인화 프롬프트
   - ✅ 선제적 제안 생성
   - ✅ 페르소나 프롬프트 주입 (`buildPersonaPrompt`)
   - ✅ SEC 공시 + 재무지표 + 애널리스트 의견 + 목표가 + 등급변경 + 어닝일정 프롬프트 통합
   - ⏳ 보완적 관점 판단 엔진 (Phase 2 예정)

7. **브리핑 카드 UI** ✅ (강화 2026-03-22)
   - ✅ 카드형 종목별 브리핑 리스트
   - ✅ 종목별 컬러 코딩 (🔴/🟡/🟢)
   - ✅ AI/Mock 뱃지, KST 생성 시각, 데이터 출처 표기
   - ✅ 카드 내 최근 SEC 공시 표시 (유형 뱃지 + 링크)
   - ⏳ 카드별 댓글 기능 (Pool 3 기본)

8. **배포** ✅
   - Vercel CI/CD (GitHub main push → 자동 배포)
   - URL: https://securitya.vercel.app

---

## Phase 2: 공시 해석 고도화 + 데이터 확장 + 댓글 고도화
**목표:** 공시 RAG 파이프라인 + 추가 데이터 소스 확장 + 댓글 시스템 고도화

9. **공시 파싱 + RAG 파이프라인**
   - 문서 청킹 → 임베딩 → 벡터 DB 저장
   - 관련 섹션 검색 (MD&A, Risk Factors 등)

10. **공시 해석 UI + 댓글**
    - 종목 선택 → 최신 공시 해석 목록
    - 공시 유형 필터 (10-K/Q/8-K)
    - 공시 해석 결과에 댓글 기능

11. **전분기 비교 기능**
    - 핵심 지표 YoY/QoQ 자동 비교

12. **경제 캘린더**
    - FOMC, 고용지표, 어닝 일정 수집
    - 선제적 제안의 근거 데이터로 활용

13. **소셜 센티먼트**
    - Reddit(WallStreetBets), X 감성 분석
    - 브리핑에 소셜 반응 반영

14. **댓글 고도화**
    - AI 팩트체크 자동화
    - 인기 토론 알고리즘

---

## Phase 3: 크로스풀 인사이트 + 감성 분석 + 풀 론칭
**목표:** 3개 풀 간 크로스 인사이트 생성 + 감성 분석 도입 + 전체 사용자 확대

15. **크로스풀 연결**
    - 인기 댓글 토론 주제를 브리핑에 반영
    - 댓글 다수 의견을 AI 분석에 참고 표시

16. **정보 검증 엔진**
    - 커뮤니티 정보에 대해 공식 출처 매칭
    - 신뢰도 표시

17. **뉴스 감성 분석 (bullish/bearish)**
    - Finnhub `/news-sentiment` Free 플랜 제공 여부 재확인
    - 미제공 시 대안 탐색 (LLM 기반 자체 분석, 외부 API 등)

---

## Phase 4: AI 투자 맥락 Q&A 챗봇
**목표:** 대화형 AI 투자 어시스턴트 — TBD

---

## 현재 상태

| Phase | 상태 | 비고 |
|-------|------|------|
| Phase 1 | 🔄 진행 중 | 댓글 시스템만 남음. 페르소나/Finnhub/SEC EDGAR 완료 |
| Phase 2 | ⏳ 미시작 | 공시 RAG + 경제 캘린더 + 소셜 센티먼트 + 댓글 고도화 |
| Phase 3 | ⏳ 미시작 | 크로스풀 인사이트 |
| Phase 4 | ⏳ 미시작 | AI Q&A 챗봇 (TBD) |
