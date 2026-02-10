# Project: Intflow Coding Assignment (Token-minimal mode)

## Output rules (MUST)
- 설명/해설 금지. 출력은 오직:
  1) 변경 파일 목록
  2) Unified diff
- 전체 파일 통째로 붙여넣기 금지(요청받지 않는 한). 필요한 최소 라인만 패치.
- 한 번 작업은 작게 유지(권장: <= 80 lines diff / 태스크 1개 단위).

## Language rules (MUST)
- 코드 주석은 반드시 한국어로 작성한다. (영문 주석 금지)
- 주석은 꼭 필요한 곳만 작성한다(재시도/재연결/토큰만료 등 비직관 로직).
- 사용자에게 보이는 UI 텍스트는 반드시 i18n 키로만 렌더링한다. (하드코딩 금지)
- i18n 리소스는 ko/en을 모두 제공한다.
  - ko: 자연스러운 한국어
  - en: 자연스러운 영어
- 기본 언어는 ko를 권장하며, 새로고침 후에도 선택 언어가 유지되어야 한다(localStorage).

## Dependencies
- 새 라이브러리 추가 금지(명시 요구가 없는 한).
- 허용: react-router-dom, i18next, react-i18next, recharts
- 가능하면 native fetch + 최소 유틸 사용.
- Exception: lucide-react (icons) is allowed.

## Architecture boundaries (MUST)
- HTTP 방어 로직은 오직 여기만:
  - src/shared/api/http.ts
    - timeout(AbortController), retry(1/2/4s), 기본 payload coercion/validation
- WebSocket 방어 로직은 오직 여기만:
  - src/shared/ws/resilientWs.ts
    - exponential backoff(max 30s), single-connection guard, cleanup on unmount
- Feature 코드는 여기만:
  - src/features/auth/**
  - src/features/pens/**
  - src/features/penDetail/**
- Routing은 여기만(프로젝트 구조에 따라 둘 중 하나):
  - src/app/router.tsx
  - 또는 src/app/App.tsx(이미 존재하면 그쪽)

## Requirements mapping (high level)
- Login: POST /auth/login (Content-Type: application/x-www-form-urlencoded)
- Token storage: localStorage access_token, expires_at(epoch ms). 만료 처리 필수(3600초 기반).
- Auth guard: 토큰 없거나 만료면 /login 리다이렉트
- i18n: ko/en, 새로고침 유지(localStorage)
- Dashboard:
  - REST: GET /pens 로 초기 데이터
  - WS: /ws/pens?token=... 로 2초마다 전체 업데이트
- Detail:
  - REST: GET /pens/{room_id}/detail 로 최근 10개
  - WS: /ws/pens/{pen_id}?token=... 로 1초마다 포인트 추가(최대 10개 유지)
- Defensive coding(가산점):
  - 서버는 의도적으로 HTTP 지연/에러/데이터 손상/WS 끊김을 섞어서 발생시킨다.
  - 재시도/타임아웃/데이터 보정/재연결/cleanup이 반드시 필요하다.

## Environment
- VITE_API_BASE_URL (e.g. http://intflowserver2.iptime.org:60535)
- VITE_WS_BASE_URL (e.g. ws://intflowserver2.iptime.org:60535)