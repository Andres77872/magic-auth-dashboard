import { useCallback } from 'react';
import { systemService } from '@/services';
import { useAsyncData } from '@/hooks/useAsyncData';

export type ApiStatus = 'checking' | 'online' | 'offline';

export interface UseApiStatusReturn {
  status: ApiStatus;
  /** Round trip of the last successful ping from this browser, in ms. */
  latencyMs: number | null;
}

/**
 * Whether the API answers from this browser, via the public `GET /system/ping`.
 * Works signed out. Re-checks on an interval while the tab is visible.
 */
export function useApiStatus(pollIntervalMs = 60_000): UseApiStatusReturn {
  const fetcher = useCallback(async (): Promise<number> => {
    const startedAt = performance.now();
    await systemService.ping();
    return Math.round(performance.now() - startedAt);
  }, []);
  const { data, error, isLoading } = useAsyncData(fetcher, {
    pollIntervalMs,
  });

  return {
    status: isLoading ? 'checking' : error ? 'offline' : 'online',
    latencyMs: error ? null : data,
  };
}

export default useApiStatus;
