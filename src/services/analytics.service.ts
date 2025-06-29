import { apiClient } from './api.client';
import type {
  ActivityResponse,
  ActivityFilters,
  UserAnalyticsData,
  ProjectAnalyticsData,
  ExportOptions,
  ExportData
} from '@/types/analytics.types';
import type { PaginationParams } from '@/types/api.types';

export class AnalyticsService {
  /**
   * Get recent activity feed with filtering and pagination
   */
  async getRecentActivity(
    options: {
      filters?: ActivityFilters;
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<ActivityResponse> {
    const { filters = {}, limit = 10, cursor } = options;
    
    const params: Record<string, any> = {
      limit,
      ...(cursor && { cursor }),
      ...(filters.type && { type: filters.type }),
      ...(filters.userType && { user_type: filters.userType }),
      ...(filters.severity && { severity: filters.severity }),
      ...(filters.search && { search: filters.search }),
      ...(filters.dateRange && {
        start_date: filters.dateRange.start,
        end_date: filters.dateRange.end,
      }),
    };

    try {
      const response = await apiClient.get<any>('/analytics/activity', params);
      
      // Mock response structure - replace with actual API response
      const data = response.data || {};
      return {
        activities: data.activities || [],
        total: data.total || 0,
        hasMore: data.has_more || false,
        nextCursor: data.next_cursor,
      };
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      throw new Error('Failed to load activity feed');
    }
  }

  /**
   * Get comprehensive user analytics (ROOT users only)
   */
  async getUserAnalytics(dateRange?: { start: string; end: string }): Promise<UserAnalyticsData> {
    const params: Record<string, string> = {};
    if (dateRange) {
      params.start_date = dateRange.start;
      params.end_date = dateRange.end;
    }

    try {
      const response = await apiClient.get<UserAnalyticsData>('/analytics/users', params);
      
      // For now, return mock data structure - replace with actual API response
      const defaultData: UserAnalyticsData = {
        metrics: {
          totalUsers: 0,
          activeUsers: 0,
          newUsersThisWeek: 0,
          userGrowthRate: 0,
          usersByType: { root: 0, admin: 0, consumer: 0 },
        },
        engagement: {
          dailyActiveUsers: [],
          avgSessionDuration: 0,
          mostActiveUsers: [],
        },
        security: {
          failedLoginAttempts: 0,
          suspiciousActivities: 0,
          securityEvents: [],
          recentSecurityAlerts: [],
        },
        system: {
          totalProjects: 0,
          totalGroups: 0,
          systemLoad: { cpu: 0, memory: 0, storage: 0 },
          apiResponseTimes: { avg: 0, p95: 0, p99: 0 },
          uptime: '0d 0h 0m',
        },
      };
      
      return response.data || defaultData;
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
      throw new Error('Failed to load user analytics');
    }
  }

  /**
   * Get project analytics (ADMIN users)
   */
  async getProjectAnalytics(dateRange?: { start: string; end: string }): Promise<ProjectAnalyticsData> {
    const params: Record<string, string> = {};
    if (dateRange) {
      params.start_date = dateRange.start;
      params.end_date = dateRange.end;
    }

    try {
      const response = await apiClient.get<ProjectAnalyticsData>('/analytics/projects', params);
      
      // For now, return mock data structure - replace with actual API response
      const defaultData: ProjectAnalyticsData = {
        projects: [],
        totalProjects: 0,
        avgHealthScore: 0,
        totalActivity: 0,
        engagement: {
          projectActivity: [],
          memberEngagement: [],
          popularActions: [],
        },
      };
      
      return response.data || defaultData;
    } catch (error) {
      console.error('Failed to fetch project analytics:', error);
      throw new Error('Failed to load project analytics');
    }
  }

  /**
   * Get analytics for a specific project
   */
  async getProjectAnalyticsById(
    projectId: string,
    dateRange?: { start: string; end: string }
  ): Promise<ProjectAnalyticsData> {
    const params: Record<string, string> = {};
    if (dateRange) {
      params.start_date = dateRange.start;
      params.end_date = dateRange.end;
    }

    try {
      const response = await apiClient.get<ProjectAnalyticsData>(`/analytics/projects/${projectId}`, params);
      return response.data as ProjectAnalyticsData;
    } catch (error) {
      console.error(`Failed to fetch analytics for project ${projectId}:`, error);
      throw new Error('Failed to load project analytics');
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(options: ExportOptions): Promise<ExportData> {
    try {
      const response = await apiClient.post<ExportData>('/analytics/export', options);
      return response.data as ExportData;
    } catch (error) {
      console.error('Failed to export analytics:', error);
      throw new Error('Failed to export analytics data');
    }
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      uptime: string;
      responseTime: number;
      errorRate: number;
      activeConnections: number;
    };
  }> {
    try {
      const response = await apiClient.get<{
        status: 'healthy' | 'warning' | 'critical';
        metrics: {
          uptime: string;
          responseTime: number;
          errorRate: number;
          activeConnections: number;
        };
      }>('/analytics/system/health');
      return response.data as any;
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      throw new Error('Failed to load system health data');
    }
  }

  /**
   * Get user activity timeline for a specific user (ROOT only)
   */
  async getUserActivityTimeline(
    userHash: string,
    dateRange?: { start: string; end: string }
  ): Promise<ActivityResponse> {
    const params: Record<string, string> = {};
    if (dateRange) {
      params.start_date = dateRange.start;
      params.end_date = dateRange.end;
    }

    try {
      const response = await apiClient.get<ActivityResponse>(`/analytics/users/${userHash}/activity`, params);
      return response.data as ActivityResponse;
    } catch (error) {
      console.error(`Failed to fetch activity for user ${userHash}:`, error);
      throw new Error('Failed to load user activity');
    }
  }

  /**
   * Get aggregated statistics for dashboard
   */
  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalProjects: number;
    recentActivity: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  }> {
    type DashboardStats = {
      totalUsers: number;
      totalProjects: number;
      recentActivity: number;
      systemHealth: 'healthy' | 'warning' | 'critical';
    };

    try {
      const response = await apiClient.get<DashboardStats>('/analytics/dashboard/stats');
      return response.data as DashboardStats;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Return fallback data
      return {
        totalUsers: 0,
        totalProjects: 0,
        recentActivity: 0,
        systemHealth: 'healthy',
      };
    }
  }
}

export const analyticsService = new AnalyticsService(); 