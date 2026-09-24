/**
 * usePatreonSyncJobs
 *
 * ROOT-only paginated list of Patreon sync jobs, optionally filtered by status.
 */

import { useCallback } from 'react';
import { patreonService } from '@/services/patreon.service';
import type { PaginationResponse } from '@/types/api.types';
import type { PatreonSyncJob } from '@/types/patreon.types';
import { usePatreonPagedList } from './usePatreonPagedList';

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
  const load = useCallback(
    (filters: PatreonSyncJobsFilters) => patreonService.getSyncJobs(filters),
    []
  );
  const list = usePatreonPagedList(
    load,
    { limit, offset: 0, status: '' },
    'Failed to load Patreon sync jobs'
  );
  return {
    jobs: list.items,
    pagination: list.pagination,
    isLoading: list.isLoading,
    error: list.error,
    filters: list.filters,
    fetchSyncJobs: list.refetch,
    setFilters: list.setFilters,
  };
}

export default usePatreonSyncJobs;
