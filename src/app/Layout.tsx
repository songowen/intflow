import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAuthenticated, logout } from '../features/auth/auth';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'ko' ? 'en' : 'ko');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '8px 16px' }}>
        {isAuthenticated() && (
          <button onClick={handleLogout}>{t('common.logout')}</button>
        )}
        <button onClick={toggleLang}>{t('common.langToggle')}</button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
