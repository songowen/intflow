const API = import.meta.env.VITE_API_BASE_URL;

export function isAuthenticated(): boolean {
  const token = localStorage.getItem('access_token');
  const expiresAt = localStorage.getItem('expires_at');
  if (!token || !expiresAt) return false;
  return Date.now() < Number(expiresAt);
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('expires_at');
}

export function getToken(): string | null {
  if (!isAuthenticated()) return null;
  return localStorage.getItem('access_token');
}

// 서버 응답에 expires_in이 없으므로 CLAUDE.md 기준 3600초 사용
const DEFAULT_EXPIRES_IN = 3600;

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const data: LoginResponse = await res.json();
  const expiresIn = data.expires_in ?? DEFAULT_EXPIRES_IN;
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('expires_at', String(Date.now() + expiresIn * 1000));
}
