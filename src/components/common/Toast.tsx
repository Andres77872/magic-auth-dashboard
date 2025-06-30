import React, { useEffect, useState } from 'react';
import { CheckIcon, ErrorIcon, WarningIcon, InfoIcon, CloseIcon } from '@/components/icons';

export interface ToastProps {
  id: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({
  id,
  message,
  variant = 'info',
  duration = 5000,
  onClose,
  action,
}: ToastProps): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss
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
      onClose?.(id);
    }, 300); // Animation duration
  };

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckIcon size="medium" />;
      case 'error':
        return <ErrorIcon size="medium" />;
      case 'warning':
        return <WarningIcon size="medium" />;
      case 'info':
        return <InfoIcon size="medium" />;
    }
  };

  const toastClasses = [
    'toast',
    `toast-${variant}`,
    isVisible ? 'toast-visible' : '',
    isExiting ? 'toast-exiting' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={toastClasses} role="alert" aria-live="polite">
      <div className="toast-icon">
        {getIcon()}
      </div>
      
      <div className="toast-content">
        <p className="toast-message">{message}</p>
        {action && (
          <button
            className="toast-action"
            onClick={action.onClick}
            type="button"
          >
            {action.label}
          </button>
        )}
      </div>
      
      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="Close notification"
        type="button"
      >
        <CloseIcon size="small" />
      </button>
    </div>
  );
}

export default Toast; 