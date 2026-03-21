# 구현 계획: AI 미국주식 브리핑 서비스

> **최종 업데이트:** 2026-03-21
>
> A증권사 AI Content PM 채용 과제 프로토타입.
> 상세 기술 스펙: `docs/DEVELOPMENT-SPEC.md`

---

## Phase 1: 브리핑 MVP
**목표:** AI 종목 브리핑 핵심 기능 동작 확인

1. **프로젝트 셋업** ✅
   - Next.js 16 + Tailwind CSS 4 초기 설정
   - Supabase DB 연결 (stock_quotes, stock_news)
   - Vercel 환경 변수 구성

2. **포트폴리오 입력 UI** ✅
   - 종목 + 수량 입력 화면 (모바일 375px)
   - localStorage 상태 관리

3. **데이터 수집 파이프라인** 🔄
   - ✅ Supabase DB + Vercel Cron 구조 완성
   - ✅ mock-data.ts → DB 저장 흐름 구현
   - ⏳ Finnhub API 실시간 연동 (mock 교체 예정)
   - ⏳ 경제 캘린더 (Finnhub 내장)

4. **LLM 브리핑 생성** ✅
   - Gemini 1.5 Flash 연동 (`@google/generative-ai`)
   - 포트폴리오 기반 개인화 프롬프트
   - 선제적 제안 생성

5. **브리핑 카드 UI** ✅
   - 카드형 종목별 브리핑 리스트
   - 종목별 컬러 코딩 (🔴/🟡/🟢)
   - AI/Mock 뱃지, KST 생성 시각, 데이터 출처 표기

6. **배포** ✅
   - Vercel CI/CD (GitHub main push → 자동 배포)
   - URL: https://securitya.vercel.app

---

## Phase 2: AI 공시 해석기
**목표:** SEC EDGAR 공시 자동 파싱 및 한국어 해석

7. **SEC EDGAR 데이터 수집**
   - 10-K / 10-Q / 8-K 원문 자동 수집

8. **공시 파싱 + RAG 파이프라인**
   - 문서 청킹 → 임베딩 → 벡터 DB 저장
   - 관련 섹션 검색 (MD&A, Risk Factors 등)

9. **공시 해석 UI**
   - 종목 선택 → 최신 공시 해석 목록
   - 공시 유형 필터 (10-K/Q/8-K)

10. **전분기 비교 기능**
    - 핵심 지표 YoY/QoQ 자동 비교

---

## Phase 3: AI 투자 맥락 Q&A
**목표:** 대화형 종목 분석 + 정보 검증

11. **채팅 UI**
    - 스트리밍 응답 인터페이스
    - 대화 히스토리 유지

12. **멀티소스 RAG**
    - 공시 + 뉴스 + 어닝콜 통합 검색
    - 소스 우선순위 및 충돌 처리

13. **출처 인용 시스템**
    - 답변 내 인라인 출처 표시
    - 원문 링크 제공

14. **가드레일**
    - 투자 조언 금지 필터
    - 할루시네이션 방지 (출처 없는 주장 차단)

---

## 현재 상태

| Phase | 상태 | 비고 |
|-------|------|------|
| Phase 1 | 🔄 진행 중 | Finnhub 실시간 연동만 남음 |
| Phase 2 | ⏳ 미시작 | SEC EDGAR RAG 파이프라인 |
| Phase 3 | ⏳ 미시작 | 대화형 Q&A |
