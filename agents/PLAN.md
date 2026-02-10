# Plan (small tasks)

0. 프로젝트 실행 확인
   - npm i / npm run dev
   - .env에 VITE_API_BASE_URL, VITE_WS_BASE_URL 설정

1. Router + AuthGuard skeleton
   - /login /dashboard /pens/:penId
   - 토큰 없거나 만료면 /login
   - 공용 레이아웃(상단에 언어 토글 자리)

2. i18n init + language toggle + persist
   - ko/en 리소스
   - localStorage로 언어 유지
   - UI 텍스트 하드코딩 금지(키만 사용)

3. http.ts: timeout + retry + coerce helpers
   - fetchWithTimeout(기본 10s)
   - requestWithRetry(최대 3회, 1/2/4s)
   - 데이터 손상 대비 coerce(숫자/문자열/배열 기본값 처리)

4. resilientWs.ts: reconnect + cleanup
   - 지수 백오프 재연결(max 30s)
   - 단일 연결 보장(중복 connect 방지)
   - close/onmessage 핸들러 및 타이머 cleanup

5. Login page
   - POST /auth/login (x-www-form-urlencoded)
   - token 저장(access_token, expires_at)
   - 실패 시 에러 표시, 성공 시 /dashboard 이동
   - 로그아웃 처리

6. Dashboard
   - REST GET /pens 초기 로딩
   - WS /ws/pens?token=... 로 2초마다 갱신
   - payload 보정(coerce) 후 렌더
   - 카드 클릭 -> /pens/:penId 이동

7. Detail page (charts)
   - REST GET /pens/{room_id}/detail 로 초기 10개
   - WS /ws/pens/{pen_id}?token=... 로 1초마다 push
   - 최근 10개 유지(shift/push)
   - activity / feeding_time 라인차트 2개

8. UI polish (minimal)
   - Loading / Error / Empty 컴포넌트 적용
   - 재시도 중/오프라인/재연결 상태 최소 표시(선택)

9. QA checklist pass
   - 요구사항 전부 수동 검증
   - 엣지 케이스(HTTP 에러/지연/손상, WS 끊김, 만료 토큰) 확인