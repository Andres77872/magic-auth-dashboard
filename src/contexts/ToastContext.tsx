import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { ReactNode } from 'react';

export interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  dismissible?: boolean;
}

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
}

/**
 * ToastProvider Component
 *
 * Manages a queue of toast notifications with automatic dismissal.
 * Supports up to maxToasts visible at once (default: 3).
 *
 * Features:
 * - Auto-dismiss after duration
 * - Pause on hover
 * - Stack from top-right
 * - Queue management
 *
 * @example
 * ```tsx
 * <ToastProvider maxToasts={3}>
 *   <App />
 * </ToastProvider>
 * ```
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 3,
  defaultDuration = 5000,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Auto-dismiss timers live in a ref, not state: keeping them out of the
  // render cycle avoids re-running effects (and cancelling other toasts'
  // timers) every time the set of pending timers changes.
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (toastData: Omit<Toast, 'id'>): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const toast: Toast = {
        id,
        duration: defaultDuration,
        dismissible: true,
        ...toastData,
      };

      setToasts((prev) => {
        // If we're at max capacity, remove the oldest toast
        const newToasts = prev.length >= maxToasts ? prev.slice(1) : prev;
        return [...newToasts, toast];
      });

      // Auto-dismiss after duration
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, toast.duration);

        timersRef.current.set(id, timer);
      }

      return id;
    },
    [defaultDuration, maxToasts, removeToast]
  );

  const clearAllToasts = useCallback(() => {
    // Clear all timers
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};

/**
 * useToast Hook
 *
 * Access the toast notification system.
 *
 * @example
 * ```tsx
 * const { addToast, removeToast } = useToast();
 *
 * // Success notification
 * addToast({
 *   message: 'Project created successfully',
 *   variant: 'success',
 *   duration: 3000,
 * });
 *
 * // Error notification
 * addToast({
 *   message: 'Failed to save changes',
 *   variant: 'error',
 *   duration: 5000,
 * });
 * ```
 */
export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

ToastProvider.displayName = 'ToastProvider';
