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
      
      if (response.success) {
        // Data is at the top level of response, not nested under 'data'
        setStats({
          totalUsers: response.statistics?.total_users || 0,
          activeProjects: response.statistics?.total_projects || 0,
          activeSessions: 0, // Not available in current API response
          userGroups: response.statistics?.total_user_groups || 0,
          projectGroups: response.statistics?.total_project_groups || 0,
          systemVersion: response.system?.version || 'Unknown',
          environment: response.system?.status || 'Unknown',
          authType: response.statistics?.authentication_type || 'Unknown',
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