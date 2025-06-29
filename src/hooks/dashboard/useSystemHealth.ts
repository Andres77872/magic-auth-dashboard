import { useState, useEffect } from 'react';
import { systemService } from '@/services';
import { useAuth, useUserType } from '@/hooks';
import type { SystemHealthData } from '@/types/dashboard.types';

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
      
      if (response.success && response.data) {
        const data = response.data as any;
        
        // Map the API response to our expected format
        setHealth({
          status: data.status === 'healthy' ? 'healthy' : 
                  data.status === 'warning' ? 'warning' : 'critical',
          timestamp: data.timestamp,
          components: {
            database: {
              status: data.components?.database?.status === 'healthy' ? 'healthy' :
                      data.components?.database?.status === 'warning' ? 'warning' : 'critical',
              response_time_ms: data.components?.database?.response_time_ms,
              connection_pool: data.components?.database?.connection_pool,
            },
            cache: {
              status: data.components?.cache?.status === 'healthy' ? 'healthy' :
                      data.components?.cache?.status === 'warning' ? 'warning' : 'critical',
              response_time_ms: data.components?.cache?.response_time_ms,
              memory_usage: data.components?.cache?.memory_usage,
            },
            authentication: {
              status: data.components?.authentication?.status === 'healthy' ? 'healthy' :
                      data.components?.authentication?.status === 'warning' ? 'warning' : 'critical',
              active_sessions: data.components?.authentication?.active_sessions,
            },
          },
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