import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services';
import { useAuth } from '@/hooks';

interface AdminDashboardStats {
  totals: {
    users: number;
    projects: number;
    active_sessions: number;
    recent_activities: number;
  };
  recent_activity: {
    new_users_7d: number;
    new_projects_7d: number;
    total_activities_7d: number;
  };
  user_breakdown: {
    root_users: number;
    admin_users: number;
    consumer_users: number;
  };
  growth: {
    user_growth_7d: number;
    project_growth_7d: number;
  };
  system_health: {
    database: {
      status: string;
      response_time_ms: number;
    };
    redis: {
      status: string;
      response_time_ms: number;
    };
    overall_status: string;
  };
  generated_at: string;
}

interface UseAdminStatsReturn {
  stats: AdminDashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdminStats(): UseAdminStatsReturn {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Use the REAL admin API endpoint
      const response = await adminService.getDashboardStats();
      
      if (response.success && response.data) {
        setStats(response.data as AdminDashboardStats);
      } else {
        setError(response.message || 'Failed to fetch admin statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStats();

    // Set up auto-refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

export default useAdminStats;
