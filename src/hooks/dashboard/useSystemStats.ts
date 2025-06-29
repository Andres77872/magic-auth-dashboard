import { useState, useEffect } from 'react';
import { systemService } from '@/services';
import { useAuth } from '@/hooks';
import type { DashboardStats } from '@/types/dashboard.types';

interface UseSystemStatsReturn {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSystemStats(): UseSystemStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchStats = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await systemService.getSystemInfo();
      
      if (response.success && response.data) {
        const data = response.data as any;
        
        setStats({
          totalUsers: data.statistics?.total_users || 0,
          activeProjects: data.statistics?.total_projects || 0,
          activeSessions: data.statistics?.active_sessions || 0,
          userGroups: 0, // This would need a separate endpoint or be added to system info
          systemVersion: data.system?.version || 'Unknown',
          environment: data.system?.environment || 'Unknown',
          rootUsers: data.statistics?.root_users,
          adminUsers: data.statistics?.admin_users,
          consumerUsers: data.statistics?.consumer_users,
        });
      } else {
        setError(response.message || 'Failed to fetch system statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

export default useSystemStats; 