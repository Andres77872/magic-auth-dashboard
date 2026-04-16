import { useCallback, useEffect, useState } from 'react';
import { systemService } from '@/services';

export interface CacheStats {
  total_keys: number;
  memory_used_mb: number;
  hit_rate: number;
  miss_rate: number;
}

interface UseSystemCacheStatsReturn {
  cacheStats: CacheStats | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useSystemCacheStats(
  enabled: boolean,
  refreshInterval = 30000
): UseSystemCacheStatsReturn {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCacheStats = useCallback(async () => {
    if (!enabled) {
      setCacheStats(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await systemService.getCacheStats();
      if (response.success && response.data) {
        setCacheStats(response.data.cache_statistics || response.data);
      }
    } catch {
      // Optional dashboard data: preserve current behavior and fail silently.
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCacheStats(null);
      setIsLoading(false);
      return;
    }

    void fetchCacheStats();
    const interval = setInterval(() => {
      void fetchCacheStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, fetchCacheStats, refreshInterval]);

  return {
    cacheStats,
    isLoading,
    refetch: fetchCacheStats,
  };
}

export default useSystemCacheStats;
