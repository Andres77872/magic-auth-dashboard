/**
 * usePatreonTierMap
 *
 * ROOT-only read of the Patreon tier map (the server mirrors its configuration
 * into this table before listing it). Server-paginated, optionally filtered to
 * active or inactive entries.
 */

import { useCallback } from 'react';
import { patreonService } from '@/services/patreon.service';
import type { PaginationResponse } from '@/types/api.types';
import type { PatreonTierMapEntry } from '@/types/patreon.types';
import { usePatreonPagedList } from './usePatreonPagedList';

export interface PatreonTierMapFilters {
  limit: number;
  offset: number;
  /** '' = all, 'true' = active only, 'false' = inactive only. */
  active: '' | 'true' | 'false';
}

interface UsePatreonTierMapReturn {
  entries: PatreonTierMapEntry[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  error: string | null;
  filters: PatreonTierMapFilters;
  refetch: (params?: Partial<PatreonTierMapFilters>) => Promise<void>;
  setFilters: (filters: Partial<PatreonTierMapFilters>) => void;
}

export function usePatreonTierMap(limit = 100): UsePatreonTierMapReturn {
  const load = useCallback(
    (filters: PatreonTierMapFilters) =>
      patreonService.getTierMap({
        limit: filters.limit,
        offset: filters.offset,
        active: filters.active === '' ? undefined : filters.active === 'true',
      }),
    []
  );
  const list = usePatreonPagedList(
    load,
    { limit, offset: 0, active: '' },
    'Failed to load Patreon tier map'
  );
  return {
    entries: list.items,
    pagination: list.pagination,
    isLoading: list.isLoading,
    error: list.error,
    filters: list.filters,
    refetch: list.refetch,
    setFilters: list.setFilters,
  };
}

export default usePatreonTierMap;
