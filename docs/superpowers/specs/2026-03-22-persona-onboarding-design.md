# 투자자 페르소나 온보딩 설계

> 2026-03-22

## 개요

포트폴리오 입력 직후 투자 성향(8개 특성, 1~5점)을 슬라이더로 입력받아 저장하고, AI 브리핑 프롬프트에 주입하여 개인화된 톤/관점/선제적 제안을 생성한다.

## UX 흐름

```
포트폴리오 저장 → 페르소나 미설정? → /persona 페이지 → 완료 → 브리핑 홈(/)
                  페르소나 있음?   → 브리핑 홈(/)
```

- 포트폴리오 저장 시 `localStorage`에서 페르소나 존재 여부 확인
- 없으면 `/persona`로 `router.push`
- 하단 네비에 설정 탭 추가하여 나중에 수정 가능

## UI (슬라이더 한 화면)

모바일 375px 최적화. 8개 특성을 한 화면에 슬라이더로 나열.

**8개 특성:**
- 스윙매매, 장기투자, 스캘핑, 우량주, ETF, 소형주, 테크주, 배당주

각 슬라이더: 1~5 범위, 기본값 3.

## DB (Supabase)

```sql
CREATE TABLE user_personas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL UNIQUE,
  swing       int NOT NULL DEFAULT 3 CHECK (swing BETWEEN 1 AND 5),
  long_term   int NOT NULL DEFAULT 3 CHECK (long_term BETWEEN 1 AND 5),
  scalping    int NOT NULL DEFAULT 3 CHECK (scalping BETWEEN 1 AND 5),
  blue_chip   int NOT NULL DEFAULT 3 CHECK (blue_chip BETWEEN 1 AND 5),
  etf         int NOT NULL DEFAULT 3 CHECK (etf BETWEEN 1 AND 5),
  small_cap   int NOT NULL DEFAULT 3 CHECK (small_cap BETWEEN 1 AND 5),
  tech        int NOT NULL DEFAULT 3 CHECK (tech BETWEEN 1 AND 5),
  dividend    int NOT NULL DEFAULT 3 CHECK (dividend BETWEEN 1 AND 5),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

- `user_id`: 첫 방문 시 UUID 생성, localStorage에 보관
- localStorage에도 페르소나 캐시하여 DB 호출 최소화

## 코드 변경

| 파일 | 변경 |
|------|------|
| `lib/types.ts` | `Persona` 인터페이스 추가 |
| **신규** `lib/persona.ts` | get/save/getUserId 유틸 (localStorage + Supabase) |
| **신규** `app/persona/page.tsx` | 페르소나 설정 페이지 (슬라이더 UI) |
| **신규** `components/PersonaForm.tsx` | 슬라이더 폼 컴포넌트 |
| **신규** `api/persona/route.ts` | 페르소나 CRUD API |
| `components/PortfolioForm.tsx` | 저장 후 페르소나 체크 → 리다이렉트 |
| `api/briefing/route.ts` | 요청에서 persona 받아 프롬프트에 주입 |
| `app/page.tsx` (홈) | 브리핑 요청 시 persona 포함 |
| `components/BottomNav.tsx` | 설정 탭 추가 |

## LLM 프롬프트 주입

```
[사용자 투자 성향]
- 스윙매매: 3/5, 장기투자: 4/5, 스캘핑: 1/5
- 우량주: 5/5, ETF: 4/5, 소형주: 2/5
- 테크주: 3/5, 배당주: 4/5

이 사용자의 투자 성향을 고려하여 브리핑 톤과 선제적 제안을 맞춤화하세요.
예: 장기투자 성향이 높으면 단기 변동보다 펀더멘털 변화에 초점.
예: 배당주 성향이 높으면 배당 관련 뉴스를 우선 언급.
```

## 스코프 외

- 보완적 관점 엔진 (Phase 2로 이관)
- 소셜 로그인/인증 (익명 UUID 사용)
