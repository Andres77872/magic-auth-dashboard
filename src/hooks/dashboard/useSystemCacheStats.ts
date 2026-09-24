import { useCallback } from 'react';
import { systemService } from '@/services/system.service';
import { useAsyncData } from '@/hooks/useAsyncData';

/** `GET /system/cache/stats` → `cache_statistics`: Redis key counts per cache category. */
export interface CacheStats {
  sessions: number;
  access_checks: number;
  permission_checks: number;
  user_types: number;
  role_checks: number;
  api_keys: number;
  total_keys: number;
}

interface UseSystemCacheStatsReturn {
  cacheStats: CacheStats | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useSystemCacheStats(
  enabled: boolean,
  refreshInterval = 30_000
): UseSystemCacheStatsReturn {
  const fetcher = useCallback(async (): Promise<CacheStats | null> => {
    const response = (await systemService.getCacheStats()) as unknown as {
      cache_statistics?: CacheStats | null;
    };
    return response.cache_statistics ?? null;
  }, []);
  const { data, isLoading, refetch } = useAsyncData(fetcher, {
    enabled,
    pollIntervalMs: refreshInterval,
  });
  return { cacheStats: data, isLoading, refetch };
}

export default useSystemCacheStats;
