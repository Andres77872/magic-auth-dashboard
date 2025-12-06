import { forwardRef, useEffect, useState, useId } from 'react';
import type { ToastVariant, ToastAction } from '../types';
import './Toast.css';

export interface ToastProps {
  id?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
  onClose?: (id: string) => void;
  className?: string;
}

const icons = {
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
    </svg>
  ),
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

    const classes = [
      'toast',
      `toast-${variant}`,
      isVisible && 'toast-visible',
      isExiting && 'toast-exiting',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} role="alert" aria-live="polite">
        <div className="toast-icon" aria-hidden="true">
          {icons[variant]}
        </div>

        <div className="toast-body">
          <p className="toast-message">{message}</p>
          {action && (
            <button
              type="button"
              className="toast-action"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          )}
        </div>

        <button
          type="button"
          className="toast-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

export default Toast;
