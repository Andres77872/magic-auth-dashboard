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
        // Helper function to map status
        const mapStatus = (status: string): HealthComponent['status'] => {
          const statusMap: Record<string, HealthComponent['status']> = {
            'healthy': 'healthy',
            'warning': 'warning',
            'critical': 'critical',
            'unhealthy': 'unhealthy',
            'degraded': 'degraded'
          };
          return statusMap[status] || 'critical';
        };
        
        // Data is at the top level of response, not nested under 'data'
        setHealth({
          status: mapStatus(response.status),
          timestamp: response.timestamp,
          components: {
            database: {
              status: mapStatus(response.components?.database?.status),
              message: response.components?.database?.message,
              response_time_ms: response.components?.database?.response_time_ms,
              connection_pool: response.components?.database?.connection_pool,
            },
            redis: {
              status: mapStatus(response.components?.redis?.status),
              message: response.components?.redis?.message,
              response_time_ms: response.components?.redis?.response_time_ms,
              memory_usage: response.components?.redis?.memory_usage,
            },
            group_system: {
              status: mapStatus(response.components?.group_system?.status),
              message: response.components?.group_system?.message,
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