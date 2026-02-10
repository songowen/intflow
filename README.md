# 스마트 농장: 실시간 통합 관제 대시보드

React + TypeScript + Vite 기반의 실시간 돈사 모니터링 대시보드입니다.

## 설치 및 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 프로덕션 빌드
```

## 환경변수 (.env)

프로젝트 루트에 `.env` 파일을 생성합니다.

```
VITE_API_BASE_URL=http://intflowserver2.iptime.org:60535
VITE_WS_BASE_URL=ws://intflowserver2.iptime.org:60535
```

## 구현 설명

### 화면 플로우

`/login` → `/dashboard` → `/pens/:penId`

### 상태 관리

- 전역 스토어 없이 `useState` + `useEffect` 로컬 상태로 관리
- 인증 토큰은 `localStorage` (`access_token`, `expires_at`)에 저장
- 토큰 만료 판단: `Date.now() < expires_at`

### REST API 방어 (`src/shared/api/http.ts`)

- `fetchWithTimeout`: AbortController 기반 10초 타임아웃
- `requestWithRetry`: 최대 3회 재시도, 1/2/4초 지수 백오프
- `coerceNumber/String/Array`: 서버 payload 손상(null, 타입 불일치, 필드 누락) 방어

### WebSocket 처리 (`src/shared/ws/resilientWs.ts`)

- 지수 백오프 재연결 (1s → 2s → 4s → … 최대 30s)
- `disposed` 플래그로 언마운트 시 재연결 방지 및 리소스 정리
- `readyState` 체크로 단일 연결 보장 (중복 connect 방지)

### i18n (`src/shared/i18n/`)

- `i18next` + `react-i18next` 사용
- `ko.json` / `en.json` 리소스 파일, 기본 언어 ko
- 언어 변경 시 `localStorage('lang')`에 저장 → 새로고침 후에도 유지
- 모든 UI 텍스트는 `t()` 함수로 렌더링 (하드코딩 없음)

### 라우팅 (`src/app/`)

- `AuthGuard`: 토큰 없거나 만료 → `/login` 리다이렉트
- `GuestGuard`: 로그인 상태에서 `/login` 접근 → `/dashboard` 리다이렉트

## 기술 스택

- React 19 + TypeScript
- Vite
- react-router-dom (라우팅)
- i18next / react-i18next (다국어)
- recharts (차트)
