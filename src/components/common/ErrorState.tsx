import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  variant?: 'inline' | 'card' | 'fullpage';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: {
    container: 'py-6 px-4',
    icon: '[&>svg]:h-6 [&>svg]:w-6',
    title: 'text-sm',
    message: 'text-xs',
    button: 'sm' as const,
  },
  md: {
    container: 'py-10 px-6',
    icon: '[&>svg]:h-8 [&>svg]:w-8',
    title: 'text-base',
    message: 'text-sm',
    button: 'md' as const,
  },
  lg: {
    container: 'py-16 px-8',
    icon: '[&>svg]:h-12 [&>svg]:w-12',
    title: 'text-lg',
    message: 'text-base',
    button: 'lg' as const,
  },
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  icon,
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  isRetrying = false,
  variant = 'card',
  size = 'md',
  className,
  children,
}) => {
  const sizes = sizeClasses[size];

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
    >
      <div
        className={cn(
          'mb-4 flex items-center justify-center rounded-full bg-destructive/10 p-3 text-destructive',
          sizes.icon
        )}
        aria-hidden="true"
      >
        {icon || <AlertCircle />}
      </div>

      <h3 className={cn('font-semibold text-foreground', sizes.title)}>
        {title}
      </h3>

      {message && (
        <p className={cn('mt-2 max-w-md text-muted-foreground', sizes.message)}>
          {message}
        </p>
      )}

      {children && <div className="mt-4">{children}</div>}

      {onRetry && (
        <div className="mt-6">
          <Button
            variant="outline"
            size={sizes.button}
            onClick={onRetry}
            disabled={isRetrying}
            className="gap-2"
          >
            <RefreshCw
              size={16}
              className={cn(isRetrying && 'animate-spin')}
            />
            {isRetrying ? 'Retrying...' : retryLabel}
          </Button>
        </div>
      )}
    </div>
  );

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'rounded-lg border border-destructive/20 bg-destructive/5',
          className
        )}
        role="alert"
      >
        {content}
      </div>
    );
  }

  if (variant === 'fullpage') {
    return (
      <div
        className={cn(
          'flex min-h-[400px] w-full items-center justify-center',
          className
        )}
        role="alert"
      >
        {content}
      </div>
    );
  }

  return (
    <Card className={cn('border-destructive/20', className)} role="alert">
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  );
};

ErrorState.displayName = 'ErrorState';

export default ErrorState;
