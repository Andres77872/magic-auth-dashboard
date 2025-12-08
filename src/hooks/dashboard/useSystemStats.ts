import { useState, useEffect, useCallback } from 'react';
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

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch comprehensive dashboard stats and system info in parallel
      const [dashboardResponse, systemInfoResponse] = await Promise.all([
        systemService.getDashboardStats(),
        systemService.getSystemInfo().catch(() => null),
      ]);
      
      // Build stats from dashboard response (primary source)
      if (dashboardResponse && dashboardResponse.totals) {
        const d = dashboardResponse;
        setStats({
          // Core totals
          totalUsers: d.totals?.users || 0,
          activeProjects: d.totals?.projects || 0,
          activeSessions: d.totals?.active_sessions || 0,
          userGroups: d.totals?.user_groups || 0,
          projectGroups: d.totals?.project_groups || 0,
          recentActivities: d.totals?.recent_activities || 0,
          
          // User breakdown
          rootUsers: d.user_breakdown?.root_users || 0,
          adminUsers: d.user_breakdown?.admin_users || 0,
          consumerUsers: d.user_breakdown?.consumer_users || 0,
          
          // Growth metrics
          newUsersWeek: d.recent_activity?.new_users_7d || 0,
          newProjectsWeek: d.recent_activity?.new_projects_7d || 0,
          activitiesWeek: d.recent_activity?.total_activities_7d || 0,
          userGrowthPercent: d.growth?.user_growth_7d || 0,
          projectGrowthPercent: d.growth?.project_growth_7d || 0,
          
          // Group averages
          avgUsersPerGroup: d.groups_summary?.avg_users_per_group || 0,
          avgProjectsPerGroup: d.groups_summary?.avg_projects_per_group || 0,
          
          // System info
          systemVersion: systemInfoResponse?.system?.version || '1.0.0',
          environment: systemInfoResponse?.system?.status || 'operational',
          authType: systemInfoResponse?.statistics?.authentication_type || 'group-based-jwt',
          
          // Health status
          systemHealthStatus: (d.system_health?.overall_status as 'healthy' | 'warning' | 'critical') || 'healthy',
        });
      } else if (systemInfoResponse?.success) {
        // Fallback to system info if dashboard stats unavailable
        setStats({
          totalUsers: systemInfoResponse.statistics?.total_users || 0,
          activeProjects: systemInfoResponse.statistics?.total_projects || 0,
          activeSessions: 0,
          userGroups: systemInfoResponse.statistics?.total_user_groups || 0,
          projectGroups: systemInfoResponse.statistics?.total_project_groups || 0,
          recentActivities: 0,
          rootUsers: 0,
          adminUsers: 0,
          consumerUsers: 0,
          newUsersWeek: 0,
          newProjectsWeek: 0,
          activitiesWeek: 0,
          userGrowthPercent: 0,
          projectGrowthPercent: 0,
          avgUsersPerGroup: 0,
          avgProjectsPerGroup: 0,
          systemVersion: systemInfoResponse.system?.version || 'Unknown',
          environment: systemInfoResponse.system?.status || 'Unknown',
          authType: systemInfoResponse.statistics?.authentication_type || 'Unknown',
          systemHealthStatus: 'healthy',
        });
      } else {
        setError('Failed to fetch system statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStats();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}

export default useSystemStats; 