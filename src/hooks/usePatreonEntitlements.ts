/**
 * usePatreonEntitlements
 *
 * ROOT-only paginated, server-filtered list of current Patreon entitlements.
 */

import { useCallback } from 'react';
import { patreonService } from '@/services/patreon.service';
import type { PaginationResponse } from '@/types/api.types';
import type { PatreonEntitlement } from '@/types/patreon.types';
import { usePatreonPagedList } from './usePatreonPagedList';

export interface PatreonEntitlementsFilters {
  limit: number;
  offset: number;
  status: string;
  linkStatus: string;
  search: string;
}

interface UsePatreonEntitlementsReturn {
  entitlements: PatreonEntitlement[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  error: string | null;
  filters: PatreonEntitlementsFilters;
  fetchEntitlements: (
    params?: Partial<PatreonEntitlementsFilters>
  ) => Promise<void>;
  setFilters: (filters: Partial<PatreonEntitlementsFilters>) => void;
}

export function usePatreonEntitlements(
  limit = 20
): UsePatreonEntitlementsReturn {
  const load = useCallback(
    (filters: PatreonEntitlementsFilters) =>
      patreonService.getEntitlements(filters),
    []
  );
  const list = usePatreonPagedList(
    load,
    { limit, offset: 0, status: '', linkStatus: '', search: '' },
    'Failed to load Patreon entitlements'
  );
  return {
    entitlements: list.items,
    pagination: list.pagination,
    isLoading: list.isLoading,
    error: list.error,
    filters: list.filters,
    fetchEntitlements: list.refetch,
    setFilters: list.setFilters,
  };
}

export default usePatreonEntitlements;
