/**
 * usePatreonPagedList
 *
 * Shared state for the ROOT Patreon admin lists (entitlements, tier map, sync
 * jobs, webhook deliveries): server-side filters + pagination where the LATEST
 * request always wins. A filter or page change made while a previous load is in
 * flight is applied, and the older response is discarded instead of overwriting it.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PaginationResponse } from '@/types/api.types';

export interface PagedResult<TItem> {
  items: TItem[];
  pagination: PaginationResponse;
}

export interface UsePatreonPagedListReturn<TItem, TFilters> {
  items: TItem[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  error: string | null;
  filters: TFilters;
  /** Reload with the current filters, optionally overriding some of them. */
  refetch: (overrides?: Partial<TFilters>) => Promise<void>;
  /** Update filters and reload. */
  setFilters: (filters: Partial<TFilters>) => void;
}

export function usePatreonPagedList<TItem, TFilters extends object>(
  load: (filters: TFilters) => Promise<PagedResult<TItem>>,
  initialFilters: TFilters,
  errorFallback: string
): UsePatreonPagedListReturn<TItem, TFilters> {
  const [items, setItems] = useState<TItem[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<TFilters>(initialFilters);

  const filtersRef = useRef<TFilters>(initialFilters);
  const requestRef = useRef(0);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const run = useCallback(
    async (next: TFilters): Promise<void> => {
      const requestId = ++requestRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const result = await loadRef.current(next);
        if (requestId !== requestRef.current) return;
        setItems(result.items);
        setPagination(result.pagination);
      } catch (err) {
        if (requestId !== requestRef.current) return;
        setError(err instanceof Error ? err.message : errorFallback);
      } finally {
        if (requestId === requestRef.current) setIsLoading(false);
      }
    },
    [errorFallback]
  );

  const refetch = useCallback(
    (overrides?: Partial<TFilters>): Promise<void> => {
      const next = { ...filtersRef.current, ...overrides };
      filtersRef.current = next;
      setFiltersState(next);
      return run(next);
    },
    [run]
  );

  const setFilters = useCallback(
    (partial: Partial<TFilters>): void => {
      void refetch(partial);
    },
    [refetch]
  );

  useEffect(() => {
    void (async (): Promise<void> => {
      await run(filtersRef.current);
    })();
  }, [run]);

  return { items, pagination, isLoading, error, filters, refetch, setFilters };
}

export default usePatreonPagedList;
