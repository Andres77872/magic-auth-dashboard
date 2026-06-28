import { useState, useEffect, useCallback } from 'react';
import { billingService } from '@/services';
import { useUserType } from '@/hooks';
import type { BillingMetrics } from '@/types/billing.types';

interface UseBillingMetricsReturn {
  metrics: BillingMetrics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Aggregate billing counts for dashboard widgets. Only fetched for admin+ users (the
 * `/admin/billing/metrics` endpoint is admin-gated); consumers get an idle empty state
 * (the consuming panel renders nothing for them).
 */
export function useBillingMetrics(): UseBillingMetricsReturn {
  const { isAdminOrHigher } = useUserType();
  const [metrics, setMetrics] = useState<BillingMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(isAdminOrHigher);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback((): void => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!isAdminOrHigher) return;
    let active = true;
    void (async (): Promise<void> => {
      try {
        const res = await billingService.getMetrics();
        if (active) {
          setMetrics(res.metrics ?? null);
          setError(null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load billing metrics');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [isAdminOrHigher, version]);

  return { metrics, isLoading, error, refetch };
}

export default useBillingMetrics;
