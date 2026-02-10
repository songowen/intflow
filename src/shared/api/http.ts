const DEFAULT_TIMEOUT = 10_000;
const BACKOFF = [1_000, 2_000, 4_000];

// --- coerce 유틸: 서버 payload 손상 대비 안전 변환 ---

export function coerceNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function coerceString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function coerceArray<T>(v: unknown, fallback: T[] = []): T[] {
  return Array.isArray(v) ? v : fallback;
}

// --- fetchWithTimeout: AbortController 기반 타임아웃 ---

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeout = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// --- requestWithRetry: 최대 3회 재시도 (1/2/4s backoff) ---

export async function requestWithRetry<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeout = DEFAULT_TIMEOUT,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= BACKOFF.length; attempt++) {
    try {
      const res = await fetchWithTimeout(input, init, timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (attempt < BACKOFF.length) {
        // 재시도 전 backoff 대기 (1/2/4초)
        await new Promise((r) => setTimeout(r, BACKOFF[attempt]));
      }
    }
  }

  throw lastError;
}
