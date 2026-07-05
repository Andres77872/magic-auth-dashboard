import { apiClient } from './api.client';
import type {
  SystemInfoResponse,
  SystemHealthResponse
} from '@/types/system.types';
import type { ApiResponse } from '@/types/api.types';

export interface DashboardStatsResponse {
  success: boolean;
  totals: {
    users: number;
    projects: number;
    user_groups: number;
    project_groups: number;
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
  groups_summary: {
    total_user_groups: number;
    total_project_groups: number;
    avg_users_per_group: number;
    avg_projects_per_group: number;
  };
  growth: {
    user_growth_7d: number;
    project_growth_7d: number;
  };
  system_health: {
    database: { status: string; latency_ms: number };
    redis: { status: string; latency_ms: number };
    overall_status: string;
  };
  generated_at: string;
}

/**
 * SystemService — thin wrapper over the API's system + admin-dashboard surface.
 * Every method here maps to a route that actually exists in the backend
 * (src/routes/system.py, prefix /system, and admin_dashboard.py, prefix /admin).
 */
class SystemService {
  // Admin Dashboard Stats — comprehensive statistics (GET /admin/dashboard/stats)
  async getDashboardStats(): Promise<DashboardStatsResponse | null> {
    try {
      const response = (await apiClient.get<DashboardStatsResponse>(
        '/admin/dashboard/stats'
      )) as unknown as { totals?: unknown; data?: { totals?: unknown } };
      // The response may come directly or wrapped in a data property
      if (response && (response.totals || response.data?.totals)) {
        return (response.data || response) as unknown as DashboardStatsResponse;
      }
      return null;
    } catch {
      return null;
    }
  }

  // System information (GET /system/info)
  async getSystemInfo(): Promise<SystemInfoResponse> {
    const response = await apiClient.get<SystemInfoResponse>('/system/info');
    return response as SystemInfoResponse;
  }

  // System health (GET /system/health)
  async getSystemHealth(): Promise<SystemHealthResponse> {
    const response = await apiClient.get<SystemHealthResponse>('/system/health');
    return response as SystemHealthResponse;
  }

  // Liveness probe (GET /system/ping)
  async pingSystem(): Promise<ApiResponse<unknown>> {
    return await apiClient.get<unknown>('/system/ping');
  }

  // Cache statistics (GET /system/cache/stats)
  async getCacheStats(): Promise<ApiResponse<unknown>> {
    return await apiClient.get<unknown>('/system/cache/stats');
  }

  // Clear the system cache (POST /system/cache/clear)
  async clearSystemCache(): Promise<ApiResponse<void>> {
    return await apiClient.post<void>('/system/cache/clear');
  }

  // Invalidate a single user's cache (POST /system/cache/invalidate/user/{user_hash})
  async invalidateUserCache(userHash: string): Promise<ApiResponse<void>> {
    return await apiClient.post<void>(
      `/system/cache/invalidate/user/${encodeURIComponent(userHash)}`
    );
  }

  // Invalidate a project's cache (POST /system/cache/invalidate/project/{project_id})
  async invalidateProjectCache(projectId: number): Promise<ApiResponse<void>> {
    return await apiClient.post<void>(
      `/system/cache/invalidate/project/${projectId}`
    );
  }
}

export const systemService = new SystemService();
export default systemService;
