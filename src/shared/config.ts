/** PROD(Vercel): /api 프록시 경유, DEV: .env 직접 연결 */
export const API_BASE = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL as string);

/** PROD WS 경로: 코드에서 /ws/pens 등으로 연결하므로 prefix 없이 host만 */
export const WS_BASE = import.meta.env.PROD
  ? `wss://${window.location.host}`
  : (import.meta.env.VITE_WS_BASE_URL as string);
