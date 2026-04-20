import { apiClient } from './api.client';
import { API_CONFIG, STORAGE_KEYS } from '@/utils/constants';
import type {
  ActivityLog,
  ActivityLogParams,
  ActivityLogResponse,
  ActivityTypesResponse,
  ActivityFilters,
  SecurityEvent,
  SecurityEventParams,
  SecuritySummary,
  AuditStatistics,
  ExportParams,
  RawActivityLog,
  ActivityType,
  BackendSecurityEventsResponse,
  BackendSecurityEvent,
  BackendAuditStatisticsResponse,
} from '@/types/audit.types';

/**
 * Maps raw API activity log to domain model
 */
export function mapActivityResponse(raw: RawActivityLog): ActivityLog {
  return {
    id: raw.id,
    activityType: raw.activity_type as ActivityType,
    details: raw.details,
    createdAt: raw.created_at,
    user: raw.user
      ? {
          id: raw.user.id,
          username: raw.user.username,
          userHash: raw.user.user_hash,
        }
      : null,
    project: raw.project
      ? {
          id: raw.project.id,
          name: raw.project.name,
          hash: raw.project.hash,
        }
      : null,
    targetUser: raw.target_user
      ? {
          id: raw.target_user.id,
          username: raw.target_user.username,
          userHash: raw.target_user.user_hash,
        }
      : null,
    ipAddress: raw.ip_address,
    // Enriched fields from backend (using optional chaining since may not exist)
    severityLevel: raw?.severity_level,
    userAgent: raw?.user_agent,
    activityName: raw?.activity_name,
    activityCategory: raw?.activity_category,
    metadata: raw?.metadata,
  };
}

/**
 * Maps domain filters to API request parameters
 */
export function mapFiltersToParams(filters: ActivityFilters): ActivityLogParams {
  const params: ActivityLogParams = {};

  if (filters.activityType) {
    params.activity_type_filter = filters.activityType;
  }
  if (filters.userId) {
    params.user_id = filters.userId;
  }
  if (filters.projectId) {
    params.project_id = filters.projectId;
  }
  if (filters.days) {
    params.days = filters.days;
  }
  if (filters.search) {
    params.search = filters.search;
  }

  return params;
}


class AuditService {
  /**
   * Get activity logs with filtering and pagination
   */
  async getActivityLogs(
    params: ActivityLogParams = {}
  ): Promise<{
    activities: ActivityLog[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
      nextOffset?: number;
    };
    filters: ActivityFilters;
    generatedAt: string;
  }> {
    const cleanParams: Record<string, string | number> = {};

    if (params.limit !== undefined) cleanParams.limit = params.limit;
    if (params.offset !== undefined) cleanParams.offset = params.offset;
    if (params.activity_type_filter) cleanParams.activity_type_filter = params.activity_type_filter;
    if (params.user_id) cleanParams.user_id = params.user_id;
    if (params.project_id) cleanParams.project_id = params.project_id;
    if (params.days !== undefined) cleanParams.days = params.days;
    if (params.search) cleanParams.search = params.search;

    const response = await apiClient.get<ActivityLogResponse>('/admin/activity', cleanParams);
    const data = response as ActivityLogResponse;

    // Map raw activities to domain model
    const activities = (data.activities || []).map((raw) =>
      mapActivityResponse(raw as unknown as RawActivityLog)
    );

    return {
      activities,
      pagination: {
        total: data.pagination?.total || 0,
        limit: data.pagination?.limit || 50,
        offset: data.pagination?.offset || 0,
        hasMore: data.pagination?.has_more || false,
        nextOffset: data.pagination?.next_offset,
      },
      filters: {
        activityType: data.filters?.activity_type as ActivityType | undefined,
        userId: data.filters?.user_id || undefined,
        projectId: data.filters?.project_id || undefined,
        days: data.filters?.days,
      },
      generatedAt: data.generated_at || new Date().toISOString(),
    };
  }

  /**
   * Get available activity types
   */
  async getActivityTypes(): Promise<string[]> {
    const response = await apiClient.get<ActivityTypesResponse>('/admin/activity/types');
    const data = response as ActivityTypesResponse;
    return data.activity_types || [];
  }

  /**
   * Get a single activity by ID
   */
  async getActivityById(id: string): Promise<ActivityLog | null> {
    try {
      const response = await apiClient.get<RawActivityLog>(`/admin/activity/${id}`);
      const data = response as unknown as RawActivityLog;
      return mapActivityResponse(data);
    } catch {
      return null;
    }
  }


  /**
   * Get security events from backend endpoint
   */
  async getSecurityEvents(
    params: SecurityEventParams = {}
  ): Promise<{
    events: SecurityEvent[];
    summary: SecuritySummary;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    // Build query params for backend endpoint
    const queryParams: Record<string, string | number> = {
      limit: params.limit || 100,
      days: params.days || 7,
    };

    // Call real backend endpoint
    const response = await apiClient.get<BackendSecurityEventsResponse>(
      '/admin/audit/security-events',
      queryParams
    );
    const data = response.data as BackendSecurityEventsResponse;

    // Map backend events to frontend SecurityEvent format
    const events: SecurityEvent[] = data.events.map((event: BackendSecurityEvent) => {
      // Base SecurityEvent fields (extends ActivityLog)
      const baseEvent: SecurityEvent = {
        id: event.id,
        activityType: event.event_type as ActivityType,
        details: event.details || {},
        createdAt: event.timestamp,
        user: event.user_id
          ? {
              id: event.user_id,
              username: event.username || 'unknown',
              userHash: event.user_id, // Backend doesn't return user_hash here
            }
          : null,
        project: null, // Backend security events don't include project
        targetUser: null,
        ipAddress: event.client_ip || null,
        // Security-specific fields
        severity: event.severity,
        clientIp: event.client_ip || 'unknown',
        userAgent: 'unknown', // Not returned by backend security events endpoint
        responseStatus: event.response_status,
        errorCode: event.error_code,
        errorMessage: event.error_message,
      };
      return baseEvent;
    });

    // Map backend summary to frontend SecuritySummary format
    const summary: SecuritySummary = {
      totalEvents: data.summary.total,
      failedLogins: events.filter(
        (e) => e.activityType === 'user_login' && e.details?.success === false
      ).length,
      unauthorizedAttempts:
        (data.summary.by_severity['warning'] || 0) +
        (data.summary.by_severity['critical'] || 0),
      criticalEvents: data.summary.by_severity['critical'] || 0,
      lastEventTimestamp: events.length > 0 ? events[0].createdAt : null,
    };

    return {
      events,
      summary,
      pagination: {
        total: data.summary.total,
        limit: params.limit || 100,
        offset: params.offset || 0,
        hasMore: data.summary.total > (params.limit || 100),
      },
    };
  }

  /**
   * Get audit statistics from backend endpoint
   */
  async getAuditStatistics(days: number = 7): Promise<AuditStatistics> {
    // Call real backend endpoint
    const response = await apiClient.get<BackendAuditStatisticsResponse>(
      '/admin/audit/statistics',
      { days }
    );
    const data = response.data as BackendAuditStatisticsResponse;

    const totalRequests = data.overview.total_requests;
    const overallSuccessRate = Number(data.overview.success_rate);

    // Calculate per-status percentage since the API doesn't return it
    const totalStatusCount = data.status_distribution.reduce(
      (sum, item) => sum + item.count,
      0
    );

    return {
      overview: {
        totalRequests,
        successCount: Number(data.overview.successful_requests),
        failureCount: Number(data.overview.failed_requests),
        successRate: overallSuccessRate,
        avgDurationMs: data.overview.avg_duration_ms,
      },
      // API only returns request_count per method — no per-method success breakdown.
      // successRate falls back to the overall rate to avoid undefined/NaN.
      byMethod: data.by_method.map((item) => ({
        method: item.http_method,
        count: item.request_count,
        successRate: overallSuccessRate,
      })),
      topEndpoints: data.top_endpoints.map((item) => {
        const successCount = Number(item.success_count);
        const failureCount = Number(item.failure_count);
        const total = successCount + failureCount;
        const successRate = total > 0 ? (successCount / total) * 100 : 100;
        return {
          endpoint: item.endpoint_path,
          count: item.request_count,
          successRate,
          avgDurationMs: item.avg_duration_ms,
        };
      }),
      statusDistribution: data.status_distribution.map((item) => ({
        statusCode: item.response_status,
        count: item.count,
        percentage: totalStatusCount > 0 ? (item.count / totalStatusCount) * 100 : 0,
      })),
      generatedAt: data.generated_at,
    };
  }


  /**
   * Get activity for a specific user
   */
  async getUserActivity(
    userId: string,
    params: ActivityLogParams = {}
  ): Promise<{
    activities: ActivityLog[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    summary: {
      totalActions: number;
      mostCommonTypes: { type: ActivityType; count: number }[];
      lastActiveAt: string | null;
    };
  }> {
    const result = await this.getActivityLogs({
      ...params,
      user_id: userId,
    });

    // Calculate summary
    const typeCounts: Record<string, number> = {};
    result.activities.forEach((activity) => {
      typeCounts[activity.activityType] = (typeCounts[activity.activityType] || 0) + 1;
    });

    const mostCommonTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type: type as ActivityType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const lastActivity = result.activities.length > 0 ? result.activities[0] : null;

    return {
      activities: result.activities,
      pagination: result.pagination,
      summary: {
        totalActions: result.pagination.total,
        mostCommonTypes,
        lastActiveAt: lastActivity?.createdAt || null,
      },
    };
  }

  /**
   * Export activity logs via backend streaming endpoint
   */
  async exportActivityLogs(params: ExportParams): Promise<Blob> {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('Authentication required for export');
    }

    // Build request body for backend endpoint
    const requestBody = {
      source: 'activity_log',
      format: params.format,
      filters: {
        user_id: params.filters.userId,
        project_id: params.filters.projectId,
        days: params.filters.days || 30,
      },
    };

    // Use direct fetch to handle streaming response
    const url = `${API_CONFIG.BASE_URL}/admin/audit/export`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(errorData.message || `Export failed with status ${response.status}`);
    }

    // Return blob for download handling
    return response.blob();
  }
}

export const auditService = new AuditService();
export default auditService;
