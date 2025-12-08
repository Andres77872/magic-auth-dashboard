import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      return (
        this.props.fallback || (
          <div
            className="flex min-h-[400px] items-center justify-center p-8"
            role="alert"
          >
            <div className="flex max-w-md flex-col items-center text-center">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                aria-hidden="true"
              >
                <AlertCircle className="h-8 w-8" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">
                {this.props.title || 'Something went wrong'}
              </h2>
              <p className="mb-6 text-muted-foreground">
                {this.props.message ||
                  'An unexpected error occurred. Please try again.'}
              </p>
              <Button
                variant="primary"
                onClick={() => this.setState({ hasError: false })}
              >
                Try again
              </Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 