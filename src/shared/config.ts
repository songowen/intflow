/** PROD(Vercel): /api 프록시 경유, DEV: .env 직접 연결 */
export const API_BASE = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL as string);

export const WS_BASE = import.meta.env.PROD
  ? `wss://${window.location.host}/api`
  : (import.meta.env.VITE_WS_BASE_URL as string);
