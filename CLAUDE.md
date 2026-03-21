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
| 프론트엔드 | Next.js + Tailwind CSS |
| 백엔드 API | Next.js API Routes |
| AI/LLM | Claude API (Anthropic) |
| 데이터 수집 | SEC EDGAR API, Finnhub, yfinance |
| 벡터 DB | Pinecone 또는 ChromaDB |
| DB | Supabase (PostgreSQL) |
| 배포 | Vercel (프론트) + Railway/Fly.io (백엔드) |

## 배포 설정

> 배포 확정 후 이 섹션을 업데이트할 것.

| Key | Value |
|-----|-------|
| 서비스 URL | 미정 |
| 배포 플랫폼 | Vercel (예정) |
| 환경 | Production |

## 환경 변수

```
ANTHROPIC_API_KEY=         # Claude API
FINNHUB_API_KEY=           # 주가/어닝 데이터
NEWS_API_KEY=              # 뉴스 데이터
PINECONE_API_KEY=          # 벡터 DB
SUPABASE_URL=              # DB
SUPABASE_ANON_KEY=         # DB 인증
```

## CI/CD

> GitHub Actions 설정 후 이 섹션을 업데이트할 것.

- 자동 배포: 미설정
- PR 검증: 미설정

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
