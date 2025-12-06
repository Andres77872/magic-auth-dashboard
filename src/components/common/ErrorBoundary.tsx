import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorIcon } from '@/components/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  message?: string;
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
    console.error('Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary" role="alert">
          <div className="error-boundary__content">
            <div className="error-boundary__icon" aria-hidden="true">
              <ErrorIcon size={48} />
            </div>
            <h2 className="error-boundary__title">
              {this.props.title || 'Something went wrong'}
            </h2>
            <p className="error-boundary__message">
              {this.props.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button 
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="btn btn-primary error-boundary__action"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 