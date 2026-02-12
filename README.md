# 스마트 농장: 실시간 통합 관제 대시보드 구축

실시간 돈사 모니터링 관제 대시보드입니다.
REST API와 WebSocket을 통해 돈사별 환경 데이터를 실시간으로 수집·표시하며, 이상 개체 감지 및 시계열 차트를 제공합니다.

### 화면 플로우

```
/login → /dashboard → /pens/:penId
```

### 기술 스택

| 분류 | 라이브러리 | 버전 |
|------|-----------|------|
| UI | React + ReactDOM | 19.2 |
| 언어 | TypeScript | 5.9 |
| 번들러 | Vite | 7.3 |
| 라우팅 | react-router-dom | 7.13 |
| 다국어 | i18next + react-i18next | 25.8 / 16.5 |
| 차트 | recharts | 3.7 |
| 아이콘 | lucide-react | 0.563 |
| E2E 테스트 | Playwright | 1.58 |

---

## 실행 방법

권장: **Node 18+**

```bash
# 의존성 설치
npm install

# 개발 서버 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# E2E 테스트 (Playwright)
npm run test:e2e
```

---

## 환경변수 (.env)

프로젝트 루트에 `.env` 파일을 생성합니다.

```env
# REST API 서버 주소
VITE_API_BASE_URL=http://intflowserver2.iptime.org:60535

# WebSocket 서버 주소
VITE_WS_BASE_URL=ws://intflowserver2.iptime.org:60535
```

> Vite 프록시는 사용하지 않으며, 환경변수로 직접 서버 주소를 지정합니다.

---

## 기능 구현 설명

### 1. 인증 (Authentication)

**파일:** `src/features/auth/auth.ts`

- `POST /auth/login` — `Content-Type: application/x-www-form-urlencoded`, `URLSearchParams`로 `{ username, password }` 전송
- 로그인 성공 시 `localStorage`에 저장:
  - `access_token` — JWT 토큰
  - `expires_at` — 만료 시각 (epoch ms, 기본 3600초 기반 계산)
- 토큰 만료 판단: `Date.now() < Number(expires_at)`
- 로그아웃: `localStorage`에서 두 키 삭제 후 `/login`으로 이동

### 2. 라우팅 가드 (Routing Guard)

**파일:** `src/app/AuthGuard.tsx`, `src/app/GuestGuard.tsx`, `src/app/router.tsx`

- **AuthGuard** — 토큰 없거나 만료 시 `/login`으로 리다이렉트
- **GuestGuard** — 이미 로그인된 상태에서 `/login` 접근 시 `/dashboard`로 리다이렉트
- 보호 대상 라우트: `/dashboard`, `/pens/:penId`

### 3. 대시보드 (Dashboard)

**파일:** `src/features/pens/pages/DashboardPage.tsx`

- **REST:** `GET /pens` (`Authorization: Bearer` 헤더) → 돈사(piggery) 목록 초기 로드
- **WebSocket:** `/ws/pens?token=...` → 약 2초마다 전체 돈사 데이터 업데이트
- 돈사(piggery) 단위 탭 UI, 각 돈방(pen)별 카드에 재고/활동량/급이시간/온도 표시
- 이상 개체 목록 확장/축소 + 상세 모달
- 돈방 클릭 시 `pen_id`에서 숫자 부분을 추출하여 `/pens/:penId`로 이동
- 서버 키 오타 방어: `piggeies` / `piggeries` 두 키 모두 처리

### 4. 상세 페이지 (Detail)

**파일:** `src/features/penDetail/pages/PenDetailPage.tsx`

- **REST:** `GET /pens/{penId}/detail` → 최근 10개 시계열 데이터 초기 로드
- **WebSocket:** `/ws/pens/{penId}?token=...` → 약 1초마다 새 데이터 포인트 수신
- 최대 10개 포인트 유지: 오래된 것 제거 후 새 포인트 추가 (`slice(-(MAX_POINTS - 1))`)
- recharts `LineChart`로 활동량(Activity) / 급이시간(Feeding Time) 추이 차트 렌더링

### 5. 다국어 (i18n)

**파일:** `src/shared/i18n/i18n.ts`, `src/shared/i18n/ko.json`, `src/shared/i18n/en.json`

- `i18next` + `react-i18next` 사용
- 기본 언어: `ko` (한국어)
- 헤더의 언어 선택 드롭다운으로 ko/en 전환
- 언어 변경 시 `localStorage('lang')`에 저장 → 새로고침 후에도 유지
- 모든 UI 텍스트는 `t()` 함수로 렌더링

---

## 안정성 / 예외 처리

> 서버는 **의도적으로** HTTP 지연, 5xx/4xx 에러, 데이터 손상(null/타입 불일치/필드 누락), WebSocket 끊김을 발생시킵니다.
> 이에 대응하기 위해 아래 방어 로직을 구현했습니다.

### HTTP 방어 (`src/shared/api/http.ts`)

| 방어 항목 | 구현 |
|-----------|------|
| 타임아웃 | `AbortController` 기반 10초 타임아웃 (`fetchWithTimeout`) |
| 재시도 | 최대 3회, 1 / 2 / 4초 지수 백오프 (`requestWithRetry`) |
| 데이터 보정 | `coerceNumber(v)` — `NaN`/`null` → `0` |
| | `coerceString(v)` — 비문자열 → `''` |
| | `coerceArray(v)` — 비배열 → `[]` |

### WebSocket 방어 (`src/shared/ws/resilientWs.ts`)

| 방어 항목 | 구현 |
|-----------|------|
| 자동 재연결 | 지수 백오프: 1s → 2s → 4s → 8s → … 최대 30s |
| 중복 연결 방지 | `readyState` 체크로 단일 연결 보장 |
| Unmount cleanup | `disposed` 플래그 + `clearTimeout` + `ws.close()` |
| JSON 파싱 실패 | try/catch로 raw data fallback |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── router.tsx          # 라우트 정의
│   ├── Layout.tsx           # 공통 레이아웃 (글래스 헤더 + 언어/로그아웃)
│   ├── AuthGuard.tsx        # 인증 필요 라우트 보호
│   └── GuestGuard.tsx       # 비로그인 전용 라우트 보호
├── features/
│   ├── auth/
│   │   ├── auth.ts          # 로그인/로그아웃/토큰 관리
│   │   └── pages/LoginPage.tsx
│   ├── pens/
│   │   └── pages/DashboardPage.tsx
│   └── penDetail/
│       └── pages/PenDetailPage.tsx
├── shared/
│   ├── api/http.ts          # HTTP timeout + retry + coerce 유틸
│   ├── ws/resilientWs.ts    # WebSocket 지수 백오프 재연결
│   ├── i18n/
│   │   ├── i18n.ts          # i18next 초기화
│   │   ├── ko.json          # 한국어 리소스
│   │   └── en.json          # 영어 리소스
│   ├── types/ws.ts          # API/WS 타입 정의
│   └── ui/
│       ├── ErrorBoundary.tsx # 전역 에러 바운더리
│       ├── MetricPill.tsx    # 지표 표시 컴포넌트
│       └── Skeleton.tsx      # 로딩 스켈레톤
└── main.tsx                  # 앱 엔트리포인트
```

---

## CI (GitHub Actions)

**파일:** `.github/workflows/ci.yml`

`main`/`master` 브랜치 push 및 PR 시 자동 실행:

1. **Checkout** → 코드 체크아웃
2. **Setup Node** → Node 20 + npm 캐시
3. **Install** → `npm ci`
4. **Typecheck** → `npm run typecheck` (있을 경우)
5. **Build** → `npm run build` (tsc + vite)

---

## QA 체크리스트

- [o] 로그인 → 대시보드 정상 진입
- [o] 새로고침 후 로그인 상태 유지
- [o] 로그아웃 → `/login` 리다이렉트
- [o] 대시보드 돈사 탭 전환 + 실시간 데이터 갱신
- [o] 돈방 클릭 → 상세 페이지 차트 렌더링
- [o] 상세 페이지 실시간 데이터 포인트 추가 (최대 10개)
- [o] 한국어/영어 전환 + 새로고침 후 언어 유지
- [o] WS 끊김 후 자동 재연결 (지수 백오프)
- [o] `npm run build` 성공 (tsc + vite)
- [o] E2E 테스트 통과 (`npm run test:e2e`)
