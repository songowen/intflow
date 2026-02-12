import { Component, type ErrorInfo, type ReactNode } from 'react';

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
            문제가 발생했습니다
          </p>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
            예상치 못한 오류가 발생했습니다. 페이지를 새로고침해 주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 28px', borderRadius: 10, border: 'none',
              background: '#1e293b', color: '#fff', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }
}
