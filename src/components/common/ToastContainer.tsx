import React from 'react';
import { useToast } from '@/contexts/ToastContext';
import { Toast } from '../primitives';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="animate-in slide-in-from-right-5 fade-in-0">
          <Toast
            id={toast.id}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration || 0}
            onClose={toast.dismissible ? removeToast : undefined}
          />
        </div>
      ))}
    </div>
  );
};

ToastContainer.displayName = 'ToastContainer';
