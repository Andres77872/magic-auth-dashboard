import { useCallback } from 'react';
import { billingService } from '@/services/billing.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useUserType } from '@/hooks/useUserType';
import type { BillingMetrics } from '@/types/billing.types';

interface UseBillingMetricsReturn {
  metrics: BillingMetrics | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Aggregate billing counts (`GET /admin/billing/metrics`). Root gets
 * platform-wide counts, admins counts over the groups they fully own. Not
 * fetched for other users.
 */
export function useBillingMetrics(): UseBillingMetricsReturn {
  const { isAdminOrHigher } = useUserType();
  const fetcher = useCallback(() => billingService.getMetrics(), []);
  const { data, isLoading, isRefreshing, error, refetch } = useAsyncData(
    fetcher,
    { enabled: isAdminOrHigher }
  );
  const refresh = useCallback((): void => {
    void refetch();
  }, [refetch]);
  return { metrics: data, isLoading, isRefreshing, error, refetch: refresh };
}

export default useBillingMetrics;
