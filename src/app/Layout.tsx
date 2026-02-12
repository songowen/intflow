import type { CSSProperties } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Globe, LogOut } from 'lucide-react';
import { isAuthenticated, logout } from '../features/auth/auth';

/** 헤더 버튼 공통 스타일 */
const btnBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 34,
  padding: '0 14px',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 9999,
  background: 'rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.9)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background 0.15s, box-shadow 0.15s',
};

export default function Layout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          position: 'sticky',
          top: 12,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 52,
          margin: '12px 16px 0',
          padding: '0 24px',
          borderRadius: 18,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          color: '#fff',
        }}
      >
        {/* 좌: 언어 선택 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Globe size={16} color="rgba(255,255,255,0.6)" />
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            style={{
              ...btnBase,
              appearance: 'none',
              WebkitAppearance: 'none',
              paddingRight: 28,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
            }}
          >
            <option value="ko" style={{ color: '#0f172a' }}>한국어</option>
            <option value="en" style={{ color: '#0f172a' }}>English</option>
          </select>
        </div>

        {/* 중: 타이틀 (홈 링크) */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 16, letterSpacing: 0.3, color: 'inherit',textDecoration: 'none', }}>
          <Home size={20} />
          {t('common.headerTitle')}
        </Link>

        {/* 우: 로그아웃 */}
        <div style={{ minWidth: 100, display: 'flex', justifyContent: 'flex-end' }}>
          {isAuthenticated() && (
            <button
              onClick={handleLogout}
              style={{ ...btnBase }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(96,165,250,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <LogOut size={15} />
              {t('common.logout')}
            </button>
          )}
        </div>
      </header>

      <main style={{ padding: '0 16px' }}>
        <Outlet />
      </main>
    </div>
  );
}
