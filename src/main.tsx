import {StrictMode, Component, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Error boundary to prevent white screen on runtime errors
class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean; error: string}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = {hasError: false, error: ''};
  }

  static getDerivedStateFromError(error: Error) {
    return {hasError: true, error: error.message};
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#0a0010',
          color: '#f472b6',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '20px',
          gap: '16px'
        }}>
          <div style={{fontSize: '48px'}}>💔</div>
          <h1 style={{fontSize: '18px', fontWeight: 'bold'}}>页面遇到了一点小故障</h1>
          <p style={{fontSize: '12px', color: '#a1a1aa', maxWidth: '400px'}}>{this.state.error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#be185d',
              color: 'white',
              border: 'none',
              padding: '8px 24px',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            点击刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
