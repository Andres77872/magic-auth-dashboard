import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Authentication error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: 'var(--spacing-8)',
          textAlign: 'center',
          backgroundColor: 'var(--color-error-light)',
          border: '1px solid var(--color-error)',
          borderRadius: 'var(--border-radius-lg)',
          margin: 'var(--spacing-4)',
        }}>
          <h2 style={{ 
            color: 'var(--color-error)', 
            marginBottom: 'var(--spacing-4)' 
          }}>
            Authentication Error
          </h2>
          <p style={{ 
            color: 'var(--color-gray-700)', 
            marginBottom: 'var(--spacing-6)' 
          }}>
            Something went wrong with the authentication system.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: 'var(--spacing-2) var(--spacing-4)',
              backgroundColor: 'var(--color-primary-600)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 