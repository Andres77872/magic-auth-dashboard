import { useCallback } from 'react';

/**
 * useToast Hook
 *
 * Simple wrapper for toast notifications.
 *
 * @example
 * ```tsx
 * const { showToast } = useToast();
 * showToast('Success!', 'success');
 * ```
 */
export function useToast() {
  const showToast = useCallback(
    (message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      // This is a simplified version - in production, use ToastContext
      console.log(`[${variant.toUpperCase()}]: ${message}`);
    },
    []
  );

  return {
    showToast,
  };
}

export default useToast;
