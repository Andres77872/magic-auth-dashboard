import { forwardRef, useCallback, useEffect, useState, useId } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  id?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
  onClose?: (id: string) => void;
  className?: string;
}

const variantStyles: Record<ToastVariant, { icon: React.ReactNode }> = {
  success: { icon: <CheckCircle className="h-5 w-5 text-success" /> },
  error: { icon: <XCircle className="h-5 w-5 text-destructive" /> },
  warning: { icon: <AlertTriangle className="h-5 w-5 text-warning" /> },
  info: { icon: <Info className="h-5 w-5 text-info" /> },
};

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      id,
      message,
      variant = 'info',
      duration = 5000,
      action,
      onClose,
      className = '',
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const generatedId = useId();
    const toastId = id || generatedId;

    const handleClose = useCallback((): void => {
      setIsExiting(true);
      setTimeout(() => {
        onClose?.(toastId);
      }, 200);
    }, [onClose, toastId]);

    useEffect(() => {
      const enter = setTimeout(() => setIsVisible(true), 10);
      const timer =
        duration > 0 ? setTimeout(handleClose, duration) : undefined;
      return () => {
        clearTimeout(enter);
        if (timer) clearTimeout(timer);
      };
    }, [duration, handleClose]);

    const styles = variantStyles[variant];
    // Errors/warnings interrupt (assertive); success/info are announced politely.
    const isUrgent = variant === 'error' || variant === 'warning';

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start gap-3 rounded-md border bg-popover p-3.5 shadow-lg transition-all duration-200',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
          isExiting && 'opacity-0 translate-y-2',
          className
        )}
        role={isUrgent ? 'alert' : 'status'}
        aria-live={isUrgent ? 'assertive' : 'polite'}
      >
        <div className="shrink-0" aria-hidden="true">
          {styles.icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{message}</p>
          {action && (
            <button
              type="button"
              className="mt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          )}
        </div>

        <button
          type="button"
          className="shrink-0 rounded p-1 transition-colors hover:bg-accent"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export default Toast;
