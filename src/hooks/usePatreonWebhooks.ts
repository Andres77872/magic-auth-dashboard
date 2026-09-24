/**
 * usePatreonWebhooks
 *
 * ROOT-only paginated list of recorded Patreon webhook deliveries, optionally
 * filtered by delivery status.
 */

import { useCallback } from 'react';
import { patreonService } from '@/services/patreon.service';
import type { PaginationResponse } from '@/types/api.types';
import type { PatreonWebhookDelivery } from '@/types/patreon.types';
import { usePatreonPagedList } from './usePatreonPagedList';

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
  const load = useCallback(
    (filters: PatreonWebhooksFilters) => patreonService.getWebhooks(filters),
    []
  );
  const list = usePatreonPagedList(
    load,
    { limit, offset: 0, status: '' },
    'Failed to load Patreon webhook deliveries'
  );
  return {
    deliveries: list.items,
    pagination: list.pagination,
    isLoading: list.isLoading,
    error: list.error,
    filters: list.filters,
    fetchWebhooks: list.refetch,
    setFilters: list.setFilters,
  };
}

export default usePatreonWebhooks;
