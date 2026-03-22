# Technical Architecture

> **최종 업데이트:** 2026-03-22
>
> 기술 요소별 도입 결정 및 적용 상태를 기록하는 문서.
> 개발 진행에 따라 상태를 업데이트할 것.

---

## 상태 범례

| 상태 | 의미 |
|------|------|
| ✅ 적용 완료 | 코드에 실제 구현됨 |
| 🔄 진행 중 | 작업 중 |
| 🔵 결정됨 | 도입 확정, 미구현 |
| ⚪ 검토 중 | 후보군, 미결정 |
| ❌ 제외 | 검토 후 미채택 |

---

## 1. 프론트엔드

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| Next.js 16 | ✅ 적용 완료 | SSR, 모바일 웹뷰 최적화, API Routes 통합 | App Router 구조 |
| Tailwind CSS 4 | ✅ 적용 완료 | 빠른 개발, 모바일 반응형 | 375px 기준 설계 |
| TypeScript | ✅ 적용 완료 | 타입 안전성 | strict 모드 |

---

## 2. 백엔드 / API

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| Next.js API Routes | ✅ 적용 완료 | 프론트와 통합, 빠른 프로토타입 | 8개 엔드포인트 운영 |
| FastAPI (Python) | ❌ 제외 | Phase 1 범위 초과 | Phase 2 RAG 구현 시 재검토 |

---

## 3. AI / LLM

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| Gemini 2.5 Flash | ✅ 적용 완료 | Google AI Studio Tier 1 (~$6/월) | 4단계 모델 fallback 체인 |
| Gemini 2.5 Flash-Lite | ✅ 적용 완료 | 공시 요약 등 비용 우선 작업 | fallback 2순위 |
| Claude API | ❌ 제외 | Gemini로 교체 결정 | 무료 크레딧 부족 |
| Prompt Engineering | ✅ 적용 완료 | 포트폴리오 + 페르소나 맥락 주입 | JSON 구조화 출력 |
| 종목별 AI 분석 사전 생성 | ✅ 적용 완료 | Cron에서 Tier 1+2 ~150종목 분석 사전 생성 | `generate-stock-analysis.ts` |
| RAG | 🔵 결정됨 | SEC 공시·뉴스 기반 답변 | Phase 2부터 구현 |
| Streaming 응답 | 🔵 결정됨 | Q&A 채팅 UX | Phase 4 |

---

## 4. 데이터 수집

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| Finnhub API (Free) | ✅ 적용 완료 | 주가·어닝·뉴스, 무료 60req/분 | 550종목 3-Tier 시스템 |
| SEC EDGAR API | ✅ 적용 완료 | 10-K/10-Q/8-K 원문 무료 | CIK 매핑 + 90일 수집 |
| Tier 3 On-demand | ✅ 적용 완료 | 미등록 종목 즉시 수집 | 24h TTL, 7일 활성 종목 배치 포함 |
| Mock 데이터 | ✅ 적용 완료 | Finnhub fallback용 | `mock-data.ts` |
| NewsAPI | ❌ 제외 | Finnhub으로 통합 (뉴스 포함) | 별도 연동 불필요 |
| yfinance | ❌ 제외 | Finnhub으로 충분 | |

---

## 5. 데이터베이스

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| Supabase (PostgreSQL) | ✅ 적용 완료 | 무료 티어, RLS 지원 | 15개 테이블 운영 중 |
| Pinecone | ⚪ 검토 중 | 관리형 벡터 DB | Phase 2 RAG |
| ChromaDB | ⚪ 검토 중 | 로컬 무료 | Pinecone 대안 |

---

## 6. 데이터 파이프라인 (Cron)

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| GitHub Actions | ✅ 적용 완료 | Vercel Hobby 10초 timeout 우회, 60분 실행 가능 | 2개 워크플로우 |
| `collect-finnhub.ts` | ✅ 적용 완료 | Finnhub 배치 수집 스크립트 (GitHub Actions 내 직접 실행) | 06:30 KST |
| `collect-sec.ts` | ✅ 적용 완료 | SEC 배치 수집 스크립트 | 07:30 KST |
| `generate-stock-analysis.ts` | ✅ 적용 완료 | 종목별 AI 분석 사전 생성 (Finnhub 수집 직후) | 06:30 KST 체인 |
| Vercel Cron | ❌ 제외 | Hobby 플랜 10초 timeout으로 대량 수집 불가 | GitHub Actions로 대체 |

### Cron 스케줄

| 워크플로우 | UTC | KST | 실행 내용 |
|-----------|-----|-----|----------|
| `cron-finnhub.yml` | 21:30 | 06:30 | Finnhub 수집 → AI 분석 생성 |
| `cron-sec.yml` | 22:30 | 07:30 | SEC EDGAR 수집 |

---

## 7. 캐싱 아키텍처

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| stock_analysis_cache | ✅ 적용 완료 | 종목별 AI 분석 사전 생성, 캐시 히트율 극대화 | ticker+analysis_date PK |
| market_overview_cache | ✅ 적용 완료 | 시장 전체 분석 (greeting, overview, macro) | analysis_date PK |
| briefing_cache | ✅ 적용 완료 | 레거시 — 요청별 전체 브리핑 캐시 (24h TTL) | 종목별 캐시로 대체 |
| data_freshness_key | ✅ 적용 완료 | 데이터 미변경 시 재생성 스킵 | SHA256 해싱 |

---

## 8. 벡터 임베딩

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| text-embedding-3-small (OpenAI) | ⚪ 검토 중 | 비용 저렴, 성능 우수 | Phase 2 결정 |
| Gemini Embeddings | ⚪ 검토 중 | LLM과 동일 벤더 통일 | Phase 2 결정 |

---

## 9. 배포 인프라

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| Vercel (Hobby) | ✅ 적용 완료 | Next.js 최적화, GitHub CI/CD 자동 연동 | `securitya.vercel.app` |
| GitHub | ✅ 적용 완료 | 소스 관리, CI/CD 트리거 | `birddogmary24-bit/securitya` |
| GitHub Actions | ✅ 적용 완료 | Cron 배치 실행 (데이터 수집 + AI 분석 생성) | 2개 워크플로우 |
| Railway | ❌ 제외 | Vercel로 통합 | |
| Fly.io | ❌ 제외 | Vercel로 통합 | |

---

## 10. 인증 / 보안

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| 포트폴리오 직접 입력 | ✅ 적용 완료 | 프로토타입 범위 — 실제 인증 대체 | localStorage |
| CRON_SECRET | ✅ 적용 완료 | Cron 엔드포인트 무단 호출 방지 | Bearer 토큰 방식 |
| Supabase RLS | ✅ 적용 완료 | 테이블별 행 수준 보안 | 공개 읽기 / 서비스 쓰기 |
| Supabase Auth | ⚪ 검토 중 | 실서비스 전환 시 | Phase 3 이후 |

---

## 11. 핵심 미결정 사항

| 항목 | 옵션 | 결정 기한 |
|------|------|-----------|
| 벡터 DB | Pinecone vs ChromaDB | Phase 2 시작 전 |
| 임베딩 모델 | OpenAI vs Gemini | Phase 2 시작 전 |
| briefing_cache 처리 | 삭제 vs 유지(레거시) | 종목별 캐시 안정화 후 |

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-21 | 초안 작성 — 전체 기술 스택 후보 정리 |
| 2026-03-21 | 2차 업데이트 — 실제 구현 반영 (Gemini, Supabase, Vercel Cron, CI/CD) |
| 2026-03-22 | 3차 업데이트 — Finnhub/SEC 구현, GitHub Actions 마이그레이션, Tier 재설계, 종목별 AI 캐시, 15개 테이블 |
