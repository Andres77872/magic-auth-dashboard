/**
 * usePatreonEntitlements
 *
 * ROOT-only paginated list hook for current Patreon entitlements.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { patreonService } from '@/services/patreon.service';
import type { PaginationResponse } from '@/types/api.types';
import type { PatreonEntitlement } from '@/types/patreon.types';

export interface PatreonEntitlementsFilters {
  limit: number;
  offset: number;
  status: string;
}

interface UsePatreonEntitlementsReturn {
  entitlements: PatreonEntitlement[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  error: string | null;
  filters: PatreonEntitlementsFilters;
  fetchEntitlements: (params?: Partial<PatreonEntitlementsFilters>) => Promise<void>;
  setFilters: (filters: Partial<PatreonEntitlementsFilters>) => void;
}

export function usePatreonEntitlements(limit = 20): UsePatreonEntitlementsReturn {
  const [entitlements, setEntitlements] = useState<PatreonEntitlement[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<PatreonEntitlementsFilters>({
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

  const fetchEntitlements = useCallback(
    async (params?: Partial<PatreonEntitlementsFilters>) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);
      try {
        const query = { ...filtersRef.current, ...params };
        const result = await patreonService.getEntitlements(query);
        setEntitlements(result.items);
        setPagination(result.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Patreon entitlements');
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    []
  );

  const setFilters = useCallback((newFilters: Partial<PatreonEntitlementsFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      void fetchEntitlements();
    }
  }, [fetchEntitlements]);

  return { entitlements, pagination, isLoading, error, filters, fetchEntitlements, setFilters };
}

export default usePatreonEntitlements;
