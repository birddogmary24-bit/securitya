# Technical Architecture

> **최종 업데이트:** 2026-03-21
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
| Next.js API Routes | ✅ 적용 완료 | 프론트와 통합, 빠른 프로토타입 | `/api/briefing`, `/api/cron/collect-data` |
| FastAPI (Python) | ❌ 제외 | Phase 1 범위 초과 | Phase 2 RAG 구현 시 재검토 |

---

## 3. AI / LLM

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| Gemini 1.5 Flash | ✅ 적용 완료 | 무료 티어 충분, 한국어 성능 우수 | `@google/generative-ai` SDK |
| Claude API | ❌ 제외 | Gemini로 교체 결정 | 추후 재검토 가능 |
| Prompt Engineering | ✅ 적용 완료 | 포트폴리오 맥락 주입 | JSON 구조화 출력 |
| RAG | 🔵 결정됨 | SEC 공시·뉴스 기반 답변 | Phase 2부터 구현 |
| Streaming 응답 | 🔵 결정됨 | Q&A 채팅 UX | Phase 3 |

---

## 4. 데이터 수집

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| Mock 데이터 | ✅ 적용 완료 | Finnhub 연동 전 임시 | `mock-data.ts` → Supabase DB |
| Finnhub API | 🔵 결정됨 | 주가·어닝·뉴스, 무료 60req/분 | Phase 1 완료 전 교체 예정 |
| NewsAPI | ❌ 제외 | Finnhub으로 통합 (뉴스 포함) | 별도 연동 불필요 |
| SEC EDGAR API | 🔵 결정됨 | 10-K/10-Q/8-K 원문 무료 | Phase 2 |
| yfinance | ❌ 제외 | Finnhub으로 충분 | |
| 경제 캘린더 | 🔵 결정됨 | Finnhub 내장 기능 활용 | Phase 1 |

---

## 5. 데이터베이스

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| Supabase (PostgreSQL) | ✅ 적용 완료 | 무료 티어, RLS 지원 | `stock_quotes`, `stock_news` 운영 중 |
| Pinecone | ⚪ 검토 중 | 관리형 벡터 DB | Phase 2 RAG |
| ChromaDB | ⚪ 검토 중 | 로컬 무료 | Pinecone 대안 |

---

## 6. 데이터 파이프라인 (Cron)

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| Vercel Cron | ✅ 적용 완료 | 별도 인프라 없이 스케줄 실행 | 매일 06:00 KST (`0 21 * * *`) |
| `/api/cron/collect-data` | ✅ 적용 완료 | mock → DB 저장 (Finnhub 교체 예정) | Bearer 인증 |

---

## 7. 벡터 임베딩

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| text-embedding-3-small (OpenAI) | ⚪ 검토 중 | 비용 저렴, 성능 우수 | Phase 2 결정 |
| Gemini Embeddings | ⚪ 검토 중 | LLM과 동일 벤더 통일 | Phase 2 결정 |

---

## 8. 배포 인프라

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| Vercel | ✅ 적용 완료 | Next.js 최적화, GitHub CI/CD 자동 연동 | `securitya.vercel.app` |
| GitHub | ✅ 적용 완료 | 소스 관리, CI/CD 트리거 | `birddogmary24-bit/securitya` |
| Railway | ❌ 제외 | Vercel로 통합 | |
| Fly.io | ❌ 제외 | Vercel로 통합 | |
| GitHub Actions | ❌ 제외 | Vercel 자동 배포로 대체 | |

---

## 9. 인증 / 보안

| 기술 | 상태 | 결정 사유 | 비고 |
|------|------|-----------|------|
| 포트폴리오 직접 입력 | ✅ 적용 완료 | 프로토타입 범위 — 실제 인증 대체 | localStorage |
| CRON_SECRET | ✅ 적용 완료 | Cron 엔드포인트 무단 호출 방지 | Bearer 토큰 방식 |
| Supabase Auth | ⚪ 검토 중 | 실서비스 전환 시 | Phase 3 이후 |

---

## 10. 핵심 미결정 사항

| 항목 | 옵션 | 결정 기한 |
|------|------|-----------|
| 벡터 DB | Pinecone vs ChromaDB | Phase 2 시작 전 |
| 임베딩 모델 | OpenAI vs Gemini | Phase 2 시작 전 |
| Finnhub 연동 | mock-data.ts 교체 | Phase 1 완료 전 |

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-03-21 | 초안 작성 — 전체 기술 스택 후보 정리 |
| 2026-03-21 | 2차 업데이트 — 실제 구현 반영 (Gemini, Supabase, Vercel Cron, CI/CD) |
