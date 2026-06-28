import { useState, useEffect } from 'react';
import { systemService } from '@/services';
import { useAuth, useUserType } from '@/hooks';
import type { SystemHealthData } from '@/types/dashboard.types';
import type { HealthComponent } from '@/types/system.types';

interface UseSystemHealthReturn {
  health: SystemHealthData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSystemHealth(): UseSystemHealthReturn {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { isRoot } = useUserType();

  const fetchHealth = async () => {
    if (!isAuthenticated || !isRoot) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await systemService.getSystemHealth();
      
      if (response.success) {
        // Pass the full components map through untouched so the health monitor
        // can surface every check the API returns (email, patreon, billing, …),
        // not just the three it used to cherry-pick. Status tolerance for
        // unknown/new values lives in the shared `statusTone` helper.
        // Data is at the top level of the response, not nested under 'data'.
        setHealth({
          status: response.status ?? 'unhealthy',
          timestamp: response.timestamp,
          components: (response.components ?? {}) as Record<string, HealthComponent>,
        });
      } else {
        setError(response.message || 'Failed to fetch system health');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isRoot) {
      setIsLoading(false);
      return;
    }

    fetchHealth();

    // Set up auto-refresh every 10 seconds for health monitoring
    const interval = setInterval(fetchHealth, 10000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, isRoot]);

  return {
    health,
    isLoading,
    error,
    refetch: fetchHealth,
  };
}

export default useSystemHealth; 