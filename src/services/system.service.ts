import { apiClient } from './api.client';
import type {
  PingResponse,
  SystemInfoResponse,
  SystemHealthResponse,
  CacheStatsResponse,
  InvalidateCacheResponse,
} from '@/types/system.types';
import type {
  AdminDashboardStats,
  AdminUserStatistics,
  AdminUserStatisticsResponse,
} from '@/types/dashboard.types';

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
    const stats = response;
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
    const response = await apiClient.get<AdminUserStatisticsResponse>(
      '/admin/users/statistics',
      {
        days,
      }
    );
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

  /**
   * GET /system/ping — public liveness probe. Needs no session and never
   * touches the database or Redis, so the signed-out overview page can use it.
   */
  async ping(): Promise<PingResponse> {
    const response = await apiClient.get<PingResponse>('/system/ping');
    if (response?.success !== true || typeof response.timestamp !== 'string') {
      throw new Error('The API ping response was not in the expected format.');
    }
    return response;
  }

  /** GET /system/info */
  async getSystemInfo(): Promise<SystemInfoResponse> {
    return apiClient.get<SystemInfoResponse>('/system/info');
  }

  /** GET /system/health — any authenticated user. */
  async getSystemHealth(): Promise<SystemHealthResponse> {
    return apiClient.get<SystemHealthResponse>('/system/health');
  }

  /** GET /system/cache/stats */
  async getCacheStats(): Promise<CacheStatsResponse> {
    return await apiClient.get<CacheStatsResponse>('/system/cache/stats');
  }

  /** POST /system/cache/invalidate/user/{user_hash} */
  async invalidateUserCache(
    userHash: string
  ): Promise<InvalidateCacheResponse> {
    return await apiClient.post<InvalidateCacheResponse>(
      `/system/cache/invalidate/user/${encodeURIComponent(userHash)}`
    );
  }
}

export const systemService = new SystemService();
export default systemService;
