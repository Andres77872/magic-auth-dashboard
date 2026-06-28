/**
 * usePatreonWebhooks
 *
 * ROOT-only paginated list hook for Patreon webhook deliveries.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { patreonService } from '@/services/patreon.service';
import type { PaginationResponse } from '@/types/api.types';
import type { PatreonWebhookDelivery } from '@/types/patreon.types';

export interface PatreonWebhooksFilters {
  limit: number;
  offset: number;
  status: string;
}

interface UsePatreonWebhooksReturn {
  deliveries: PatreonWebhookDelivery[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  error: string | null;
  filters: PatreonWebhooksFilters;
  fetchWebhooks: (params?: Partial<PatreonWebhooksFilters>) => Promise<void>;
  setFilters: (filters: Partial<PatreonWebhooksFilters>) => void;
}

export function usePatreonWebhooks(limit = 20): UsePatreonWebhooksReturn {
  const [deliveries, setDeliveries] = useState<PatreonWebhookDelivery[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<PatreonWebhooksFilters>({
    limit,
    offset: 0,
    status: '',
  });

  const filtersRef = useRef(filters);
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchWebhooks = useCallback(async (params?: Partial<PatreonWebhooksFilters>) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const query = { ...filtersRef.current, ...params };
      const result = await patreonService.getWebhooks(query);
      setDeliveries(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Patreon webhooks');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const setFilters = useCallback((newFilters: Partial<PatreonWebhooksFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      void fetchWebhooks();
    }
  }, [fetchWebhooks]);

  return { deliveries, pagination, isLoading, error, filters, fetchWebhooks, setFilters };
}

export default usePatreonWebhooks;
