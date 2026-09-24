import { useCallback } from 'react';
import { systemService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { SystemHealthData } from '@/types/dashboard.types';

interface UseSystemHealthOptions {
  enabled?: boolean;
  pollIntervalMs?: number;
}

interface UseSystemHealthReturn {
  health: SystemHealthData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  updatedAt: Date | null;
  refetch: () => Promise<void>;
}

/** Component health from `GET /system/health` (available to any signed-in operator). */
export function useSystemHealth({
  enabled = true,
  pollIntervalMs = 30_000,
}: UseSystemHealthOptions = {}): UseSystemHealthReturn {
  const { isAuthenticated } = useAuth();
  const fetcher = useCallback(async (): Promise<SystemHealthData> => {
    const response = await systemService.getSystemHealth();
    return {
      status: response.status ?? 'unhealthy',
      timestamp: response.timestamp,
      components: response.components ?? {},
    };
  }, []);
  const { data, ...state } = useAsyncData(fetcher, {
    enabled: enabled && isAuthenticated,
    pollIntervalMs,
  });
  return { health: data, ...state };
}

export default useSystemHealth;
