/**
 * usePatreonSyncJobs
 *
 * ROOT-only paginated list hook for Patreon sync jobs.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { patreonService } from '@/services/patreon.service';
import type { PaginationResponse } from '@/types/api.types';
import type { PatreonSyncJob } from '@/types/patreon.types';

export interface PatreonSyncJobsFilters {
  limit: number;
  offset: number;
  status: string;
}

interface UsePatreonSyncJobsReturn {
  jobs: PatreonSyncJob[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  error: string | null;
  filters: PatreonSyncJobsFilters;
  fetchSyncJobs: (params?: Partial<PatreonSyncJobsFilters>) => Promise<void>;
  setFilters: (filters: Partial<PatreonSyncJobsFilters>) => void;
}

export function usePatreonSyncJobs(limit = 20): UsePatreonSyncJobsReturn {
  const [jobs, setJobs] = useState<PatreonSyncJob[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<PatreonSyncJobsFilters>({
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

  const fetchSyncJobs = useCallback(async (params?: Partial<PatreonSyncJobsFilters>) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const query = { ...filtersRef.current, ...params };
      const result = await patreonService.getSyncJobs(query);
      setJobs(result.items);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Patreon sync jobs');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const setFilters = useCallback((newFilters: Partial<PatreonSyncJobsFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      void fetchSyncJobs();
    }
  }, [fetchSyncJobs]);

  return { jobs, pagination, isLoading, error, filters, fetchSyncJobs, setFilters };
}

export default usePatreonSyncJobs;
