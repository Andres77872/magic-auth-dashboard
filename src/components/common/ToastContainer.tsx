import React from 'react';
import { useToast } from '@/contexts/ToastContext';
import Toast from './Toast';

/**
 * ToastContainer Component
 * 
 * Renders all active toasts from the ToastContext.
 * Should be placed at the root level of the app (e.g., in App.tsx).
 * 
 * Features:
 * - Stacks toasts from top-right
 * - Fixed positioning
 * - Supports up to maxToasts (configured in ToastProvider)
 * - Auto-dismissal
 * - Pause on hover (handled by individual Toast components)
 * 
 * @example
 * ```tsx
 * // In App.tsx
 * <ToastProvider>
 *   <ToastContainer />
 *   <YourApp />
 * </ToastProvider>
 * ```
 */
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="toast-container"
      style={{
        position: 'fixed',
        top: 'var(--spacing-4)',
        right: 'var(--spacing-4)',
        zIndex: 'var(--z-index-toast, 9999)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2)',
        maxWidth: '420px',
        width: '100%',
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
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
