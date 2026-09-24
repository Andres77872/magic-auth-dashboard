import { useCallback } from 'react';
import { useToast as useToastContext } from '@/contexts/ToastContext';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export function useToast(): {
  showToast: (message: string, variant?: ToastVariant) => void;
} {
  const { addToast } = useToastContext();

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      addToast({ message, variant });
    },
    [addToast]
  );

  return { showToast };
}

export default useToast;
