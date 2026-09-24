import { apiClient } from './api.client';
import type {
  SystemInfoResponse,
  SystemHealthResponse,
} from '@/types/system.types';
import type {
  AdminDashboardStats,
  AdminUserStatistics,
  AdminUserStatisticsResponse,
} from '@/types/dashboard.types';
import type { ApiResponse } from '@/types/api.types';

/**
 * Platform statistics and system operations (api.auth `system.py` under
 * `/system` and `admin_dashboard.py` under `/admin`).
 */
class SystemService {
  /** GET /admin/dashboard/stats — bare object, no `success` envelope. */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const response = await apiClient.get<AdminDashboardStats>(
      '/admin/dashboard/stats'
    );
    const stats = response as unknown as AdminDashboardStats;
    if (!stats || typeof stats !== 'object' || !stats.totals) {
      throw new Error(
        'The dashboard statistics response was not in the expected format.'
      );
    }
    return stats;
  }

  /**
   * GET /admin/users/statistics — user growth and activity for the last `days`.
   * The backend reports query failures as `statistics.error`; surface those as errors.
   */
  async getUserStatistics(days = 30): Promise<AdminUserStatistics> {
    const response = (await apiClient.get<AdminUserStatisticsResponse>(
      '/admin/users/statistics',
      {
        days,
      }
    )) as unknown as AdminUserStatisticsResponse;
    const statistics = response?.statistics;
    if (!statistics || 'error' in statistics) {
      throw new Error(
        statistics && 'error' in statistics
          ? 'User statistics are unavailable right now.'
          : 'The user statistics response was not in the expected format.'
      );
    }
    return statistics;
  }

  /** GET /system/info */
  async getSystemInfo(): Promise<SystemInfoResponse> {
    return (await apiClient.get<SystemInfoResponse>(
      '/system/info'
    )) as SystemInfoResponse;
  }

  /** GET /system/health — any authenticated user. */
  async getSystemHealth(): Promise<SystemHealthResponse> {
    return (await apiClient.get<SystemHealthResponse>(
      '/system/health'
    )) as SystemHealthResponse;
  }

  /** GET /system/cache/stats */
  async getCacheStats(): Promise<ApiResponse<unknown>> {
    return await apiClient.get<unknown>('/system/cache/stats');
  }

  /** POST /system/cache/invalidate/user/{user_hash} */
  async invalidateUserCache(userHash: string): Promise<ApiResponse<void>> {
    return await apiClient.post<void>(
      `/system/cache/invalidate/user/${encodeURIComponent(userHash)}`
    );
  }
}

export const systemService = new SystemService();
export default systemService;
