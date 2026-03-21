# Superpowers — 개요 및 현재 프로젝트 적용 효과

> **최종 업데이트:** 2026-03-21

## Superpowers란?

[GitHub: obra/superpowers](https://github.com/obra/superpowers)

Claude Code를 "바로 코드 짜는 AI"에서 **"브레인스토밍 → 계획 → 실행" 순서를 지키는 AI**로 바꿔주는 오픈소스 스킬 프레임워크.

비개발자도 체계적인 개발 워크플로우를 가질 수 있도록 설계된 agentic 방법론.

---

## 설치 방법

### 공식 마켓플레이스 (권장)

```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

설치 후 Claude Code 재시작.

### GitHub 직접 클론

```bash
git clone https://github.com/obra/superpowers.git ~/.claude/plugins/superpowers
```

### 글로벌 설치 (모든 프로젝트 적용)

`--global` 플래그 사용.

---

## 주요 슬래시 커맨드

| 커맨드 | 역할 |
|--------|------|
| `/superpowers:brainstorm` | 요구사항 탐색 & 설계 |
| `/superpowers:write-plan` | 구현 계획 작성 |
| `/superpowers:execute-plan` | 계획 기반 실행 + 코드리뷰 |

---

## 현재 프로젝트 기준 차이점

### 예시: "SEC 공시 파싱 + RAG 파이프라인 만들어줘" 요청 시

**Superpowers 없을 때**
- 요청 즉시 코드 작성 시작
- 중간에 방향 수정하면 대부분 갈아엎어야 함

**Superpowers 있을 때**
- 먼저 설계 질문: 10-K/Q/8-K 중 MVP 우선순위? ChromaDB vs Pinecone? 청킹 단위?
- 답변 → 계획서 작성 → 확인 → 코드 작성 순서

---

## 이 프로젝트에서 효과가 큰 기능

| 기능 | 이유 |
|------|------|
| **SEC EDGAR RAG 파이프라인** | 벡터DB 선택, 청킹 전략, 임베딩 모델 설계를 먼저 잡아야 나중에 교체 비용 없음 |
| **가드레일 / 할루시네이션 방지** | 코드 다 짜고 끼워넣으면 구조 전체를 건드려야 함. 설계 단계에서 결정 필요 |
| **멀티소스 Q&A (공시 + 뉴스 + 어닝콜)** | 소스 우선순위, 충돌 처리, 출처 인용 방식을 먼저 합의하고 만드는 게 안전 |

---

## 도입 시점 권장

- Phase 1 브리핑 MVP → 지금 없어도 무방
- **Phase 2~3 (RAG, 스트리밍 Q&A, 멀티소스)** → 본격 개발 시작 전 설치 권장
