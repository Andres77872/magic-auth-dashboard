import { useCallback } from 'react';
import { useToast as useToastContext } from '@/contexts/ToastContext';

export function useToast() {
  const { addToast } = useToastContext();

  const showToast = useCallback(
    (message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      addToast({ message, variant });
    },
    [addToast]
  );

  return { showToast };
}

export default useToast;
