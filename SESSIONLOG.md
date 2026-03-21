# AI 미국주식 브리핑 서비스 — 세션 작업 로그

> **최종 업데이트:** 2026-03-21
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
- [ ] Phase 2: AI 공시 해석기 (SEC EDGAR) 개발 시작
