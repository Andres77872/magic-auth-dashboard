import { forwardRef, useEffect, useState, useId } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToastVariant, ToastAction } from '../types';

export interface ToastProps {
  id?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
  onClose?: (id: string) => void;
  className?: string;
}

const variantStyles: Record<ToastVariant, { container: string; icon: React.ReactNode }> = {
  success: {
    container: 'border-success/50 bg-success/10',
    icon: <CheckCircle className="h-5 w-5 text-success" />,
  },
  error: {
    container: 'border-destructive/50 bg-destructive/10',
    icon: <XCircle className="h-5 w-5 text-destructive" />,
  },
  warning: {
    container: 'border-warning/50 bg-warning/10',
    icon: <AlertTriangle className="h-5 w-5 text-warning" />,
  },
  info: {
    container: 'border-info/50 bg-info/10',
    icon: <Info className="h-5 w-5 text-info" />,
  },
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

    useEffect(() => {
      setTimeout(() => setIsVisible(true), 10);

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [duration]);

    const handleClose = () => {
      setIsExiting(true);
      setTimeout(() => {
        onClose?.(toastId);
      }, 300);
    };

    const styles = variantStyles[variant];

    return (
      <div 
        ref={ref} 
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300',
          styles.container,
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
          isExiting && 'opacity-0 translate-y-2',
          className
        )} 
        role="alert" 
        aria-live="polite"
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
          className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
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
