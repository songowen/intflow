# intflow Inc. 코딩테스트 과제 안내

## 1) 진행 방식

- 과제명: 스마트 농장: 실시간 통합 관제 대시보드 구축
- 진행 기간: 2026-02-13 23:59 (KST)
- 개발 환경: React (필수)
- 데이터 연동: REST API + WebSocket

## 2) 제공 자료

- 접속 아이디: `test9@example.com`
- 접속 비밀번호: `password9`

## 3) 구현 요구사항

- 화면 플로우: 로그인 > 대시보드 > 상세 그래프
- 다국어(i18n): 한국어/영어 지원, 새로고침 후에도 언어 설정 유지
- 로그인/로그아웃: 인증 가드(Auth Guard) 처리 필수
- 대시보드(돈사현황): 리스트 UI + WebSocket 실시간 데이터 갱신
- 상세 그래프: 돈방 클릭 시 이동, 초기 데이터(REST) + 실시간 포인트(WebSocket) 갱신

## 4) 제출

- 제출 방법: djpark@intflow.ai 이메일
- 제출물: GitHub 링크 또는 프로젝트 압축 파일
- README 필수 포함: 설치/실행 방법, .env 설정, 구현 설명(상태관리, WS, i18n)
- (선택) 테스트 코드, Storybook, CI/CD → 가산점

## 5) 평가 기준

- 완성도: 필수 기능(실시간, 상세, i18n) 작동 여부
- 안정성: 예외 처리, 재연결 로직, 리소스 정리(Unmount 시 구독 해제)
- 코드 품질: 컴포넌트 구조, 모듈화, 가독성, 타입 안전성(TypeScript 권장)
- UX: 로딩 상태, 에러 표시, 빈 값 처리

## 6) 유의사항

- 다국어 처리는 프론트엔드에서 독립적으로 구현 (서버 API 없음)

---

# Smart Pig Farm Mock API Documentation

## 서버 정보

- Base URL: `http://intflowserver2.iptime.org:60535`
- 프로토콜: HTTP/REST API + WebSocket
- 인증 방식: JWT Bearer Token

## 주의사항

이 서버는 **의도적으로 에러를 발생**시킵니다.

### 발생 가능한 에러 유형

| 유형 | 확률 | 내용 |
|---|---|---|
| HTTP 에러 | 5% | 500, 503, 504, 422 |
| 응답 지연 | 5% | 1~2초 랜덤 지연 |
| 데이터 손상 | 3% | 필드 null 변경, 타입 불일치(숫자→문자열), 필드 누락 |
| WS 연결 끊김 | 5% | 스트리밍 중 갑작스런 연결 종료 |

> 참고: 타임아웃 에러(30초+ 지연)는 테스트 편의를 위해 비활성화됨.

---

## API 엔드포인트

### 1. 인증 — POST /auth/login

> Form-Encoded 형식 사용

```
Content-Type: application/x-www-form-urlencoded
```

Request Body:
```
username=test1@example.com&password=password1
```

Response (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

- `access_token`: JWT 토큰 문자열
- `token_type`: 항상 `"bearer"`
- `expires_in`: 토큰 만료 시간 (3600초 = 1시간)

에러 응답:
- `401 Unauthorized`: 잘못된 credentials
- `422 Unprocessable Entity`: 요청 형식 오류

---

### 2. 돈사 목록 조회 — GET /pens

```
Authorization: Bearer {access_token}
```

Response (200 OK):
```json
{
  "piggeies": [
    {
      "piggery_id": "farm_001",
      "piggery_name": "중앙 농장",
      "total_pigs": 150,
      "pens": [
        {
          "pen_id": "room_001",
          "pen_name": "A동 1호",
          "current_pig_count": 50,
          "avg_activity_level": 65.3,
          "avg_feeding_time_minutes": 12.5,
          "avg_temperature_celsius": 23.2,
          "abnormal_pigs": [
            {
              "wid": 48,
              "thumbnail_url": "https://storage.googleapis.com/...",
              "activity": 43,
              "feeding_time": 17
            }
          ]
        }
      ]
    }
  ]
}
```

필드 설명:

| 필드 | 타입 | 설명 |
|---|---|---|
| `piggery_id` | string | 농장 고유 식별자 |
| `piggery_name` | string | 농장 이름 |
| `total_pigs` | int | 농장 전체 돼지 수 (마리) |
| `pen_id` | string | 돈사 고유 식별자 (WS 연결 시 사용) |
| `pen_name` | string | 돈사 이름 |
| `current_pig_count` | int | 현재 돈사 내 돼지 수 (마리) |
| `avg_activity_level` | float | 평균 활동량 (0-100) |
| `avg_feeding_time_minutes` | float | 평균 급이 시간 (분) |
| `avg_temperature_celsius` | float | 평균 체온 (℃) |
| `abnormal_pigs[].wid` | int | 돼지 고유 식별자 |
| `abnormal_pigs[].thumbnail_url` | string | 썸네일 이미지 URL |
| `abnormal_pigs[].activity` | int | 활동량 (0-100) |
| `abnormal_pigs[].feeding_time` | int | 급이 시간 (분) |

에러: `401 Unauthorized`, `500 Internal Server Error`

---

### 3. 돈사 상세 정보 조회 — GET /pens/{room_id}/detail

Path Parameters:
- `room_id`: 돈사 ID (**정수**, 예: 1, 2, 3) — `pen_id`에서 숫자 부분만 사용

Response (200 OK):
```json
{
  "id": 1,
  "name": "돈방 1",
  "time_series": [
    {
      "activity": 65,
      "feeding_time": 125
    }
  ]
}
```

- `id`: 돈사 ID (정수)
- `name`: 돈사 이름 (문자열)
- `time_series`: 시계열 데이터 배열 (최근 10개)
  - `activity`: 활동량 (0-100, 정수)
  - `feeding_time`: 급이 시간 (분, 정수)

> 참고: `timestamp` 필드는 제공되지 않음. 최근 10개만 제공 (시간 순서).

---

### 4. WebSocket 실시간 데이터 스트리밍 — WS /ws/pens/{pen_id}

돈사의 실시간 시계열 데이터 (1초마다 업데이트)

- `pen_id`: 돈사 ID (**정수**)

Connection:
```js
const ws = new WebSocket(`ws://intflowserver2.iptime.org:60535/ws/pens/${penId}?token=${token}`);
```

Message Format (Server → Client):
```json
{
  "pen_id": "room_001",
  "timestamp": "2026-02-09T06:30:00.123456Z",
  "data": {
    "activity": 75,
    "feeding_time": 120
  }
}
```

- 수신 주기: 1초(1000ms)

연결 종료 코드:
- `1000`: 정상 종료
- `1001`: [Injected Error] 의도적 연결 끊김
- `1008`: 인증 실패 (잘못된 토큰)

> 재연결 권장: 지수 백오프(exponential backoff) 전략

---

### 5. WebSocket 실시간 돈사 목록 스트리밍 — WS /ws/pens

전체 돈사 목록 실시간 업데이트 (2초마다)

Connection:
```js
const ws = new WebSocket(`ws://intflowserver2.iptime.org:60535/ws/pens?token=${token}`);
```

- Query Parameter: `token` (JWT access token, 필수)
- 수신 주기: 2초(2000ms)
- 메시지 구조: GET /pens 응답과 동일 (`piggeies` 배열)

연결 종료 코드: 4번과 동일 (1000/1001/1008)

---

## 평가 기준

1. 재시도 로직: 에러 발생 시 적절한 재시도 (exponential backoff)
2. 데이터 검증: 손상된 데이터에 대한 방어적 프로그래밍
3. 사용자 피드백: 에러 상황을 사용자에게 명확히 전달
4. 연결 복구: WebSocket 끊김 시 자동 재연결
5. 로딩 상태 관리: 비동기 작업 중 적절한 UI 표시

> **중요**: 이 문서에 명시되지 않은 동작은 버그가 아닌 **의도된 에러 시뮬레이션**일 수 있습니다.
