import { useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Eye, EyeOff, AlertCircle, Loader } from 'lucide-react';
import { login } from '../auth';

/* ── 스타일 ── */

const page: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 30%, #38bdf8 70%, #bae6fd 100%)',
  padding: 24,
};

const card: CSSProperties = {
  width: '100%',
  maxWidth: 400,
  background: '#fff',
  borderRadius: 18,
  boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
  padding: '40px 36px 36px',
};

const inputWrap: CSSProperties = {
  position: 'relative',
  marginBottom: 20,
};

const label: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#334155',
  marginBottom: 6,
};

const input: CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 14px',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  fontSize: 14,
  color: '#1e293b',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
};

const submitBtn: CSSProperties = {
  width: '100%',
  height: 46,
  border: 'none',
  borderRadius: 10,
  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'opacity 0.15s',
};

const eyeBtn: CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#94a3b8',
  display: 'flex',
  padding: 0,
};

const errorBox: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 10,
  padding: '10px 14px',
  marginBottom: 20,
  fontSize: 13,
  color: '#dc2626',
};

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      <div style={card}>
        {/* 로고 + 타이틀 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            marginBottom: 14,
          }}>
            <Home size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
            {t('common.headerTitle')}
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
            {t('login.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 이메일 */}
          <div style={inputWrap}>
            <span style={label}>{t('login.username')}</span>
            <input
              type="email"
              placeholder={t('login.usernamePlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={input}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* 비밀번호 */}
          <div style={inputWrap}>
            <span style={label}>{t('login.password')}</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ ...input, paddingRight: 42 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <button type="button" style={eyeBtn} onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 에러 */}
          {error && (
            <div style={errorBox}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            style={{ ...submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {loading ? t('login.loading') : t('login.submit')}
          </button>
        </form>
      </div>

      {/* 스피너 애니메이션 */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
