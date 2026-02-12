import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '../i18n/i18n';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        display: 'grid', placeItems: 'center',
        minHeight: '100vh', padding: 32, textAlign: 'center',
      }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>
            {i18n.t('common.errorTitle')}
          </p>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
            {i18n.t('common.errorMessage')}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 28px', borderRadius: 10, border: 'none',
              background: '#1e293b', color: '#fff', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            {i18n.t('common.reload')}
          </button>
        </div>
      </div>
    );
  }
}
