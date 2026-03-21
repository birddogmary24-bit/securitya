# A증권사 AI 브리핑 — 프로젝트 설정

> **최종 업데이트:** 2026-03-21

## 프로젝트 구조

```
kakaopaysecurity/
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
| AI/LLM | Gemini 1.5 Flash (Google AI Studio) |
| 데이터 수집 | mock-data.ts → 추후 Finnhub API 교체 예정 |
| DB | Supabase (PostgreSQL) — stock_quotes, stock_news |
| 벡터 DB | Pinecone 또는 ChromaDB (Phase 2) |
| 배포 | Vercel (CI/CD — GitHub main push 자동 배포) |
| Cron | Vercel Cron — 매일 06:00 KST 데이터 수집 |

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
GEMINI_API_KEY=              # Gemini 1.5 Flash (Google AI Studio)
NEXT_PUBLIC_SUPABASE_URL=    # Supabase 프로젝트 URL
SUPABASE_SERVICE_ROLE_KEY=   # Supabase 서버 사이드 키 (secret)
CRON_SECRET=                 # Cron 엔드포인트 인증 키
FINNHUB_API_KEY=             # 주가/어닝 데이터 (미연동 — Phase 1 완료 전 추가)
```

## Supabase DB 스키마

```sql
-- 주가 데이터 (cron이 주기적으로 upsert)
stock_quotes: ticker, price, change, change_percent, previous_close, updated_at

-- 뉴스 데이터 (cron이 일 1회 insert)
stock_news: tickers[], title, summary, source, url, published_at, sentiment, collected_date
```

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/briefing` | POST | 포트폴리오 기반 AI 브리핑 생성 |
| `/api/cron/collect-data` | GET | 데이터 수집 (Authorization: Bearer {CRON_SECRET}) |

## CI/CD

- **자동 배포:** GitHub `main` push → Vercel 자동 빌드/배포
- **Cron:** `vercel.json` — `0 21 * * *` (매일 06:00 KST)
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

- `docs/proposal-executive-summary.md` — 과제 제출용 요약
- `docs/proposal-detailed.md` — 면접 대비 상세 제안서
- `docs/DEVELOPMENT-SPEC.md` — 기술 스펙 상세
- `docs/competitor-analysis.md` — 경쟁사 분석
- `docs/superpowers-notes.md` — Superpowers 설치 및 사용 가이드
