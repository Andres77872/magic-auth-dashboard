import { apiClient } from './api.client';
import { asUtcTimestamp } from '@/utils/formatters';
import { getJson, seg } from './request';
import type {
  ActivityDetail,
  ActivityDetailResponse,
  ActivityLog,
  ActivityLogPage,
  ActivityLogParams,
  ActivityLogResponse,
  ActivityTypesResponse,
  ApiAuditLog,
  ApiAuditLogPage,
  ApiAuditLogParams,
  ApiAuditLogResponse,
  AuditExportRequest,
  AuditStatistics,
  AuditStatisticsResponse,
  RawActivityDetail,
  RawActivityLog,
  RawApiAuditLog,
  RawSecurityEvent,
  SecurityEvent,
  SecurityEventParams,
  SecurityEventsResult,
  SecuritySeverity,
  SecurityEventsResponse,
} from '@/types/audit.types';

/**
 * Activity log (`/admin/activity*`) and API audit log (`/admin/audit/*`).
 * None of these routes has a `success` key: a resolved request is a success
 * and the transport throws for non-2xx responses.
 */

function toNumber(value: number | string | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBool(value: boolean | number | null | undefined): boolean {
  return value === true || value === 1;
}

const SEVERITIES: readonly SecuritySeverity[] = ['info', 'warning', 'critical'];

function toSeverity(value: string | null | undefined): SecuritySeverity {
  return SEVERITIES.includes(value as SecuritySeverity)
    ? (value as SecuritySeverity)
    : 'info';
}

function mapActivity(raw: RawActivityLog): ActivityLog {
  return {
    id: raw.id,
    activityType: raw.activity_type,
    details: raw.details,
    createdAt: asUtcTimestamp(raw.created_at) ?? raw.created_at,
    user: raw.user
      ? {
          id: raw.user.id,
          username: raw.user.username,
          userHash: raw.user.user_hash,
        }
      : null,
    project: raw.project
      ? { id: raw.project.id, name: raw.project.name, hash: raw.project.hash }
      : null,
    targetUser: raw.target_user
      ? {
          id: raw.target_user.id,
          username: raw.target_user.username,
          userHash: raw.target_user.user_hash,
        }
      : null,
    ipAddress: raw.ip_address,
  };
}

function mapActivityDetail(raw: RawActivityDetail): ActivityDetail {
  return {
    ...mapActivity(raw),
    severity: toSeverity(raw.severity_level),
    userAgent: raw.user_agent,
    metadata: raw.metadata,
    activityName: raw.activity_name,
    activityCategory: raw.activity_category,
    activityDescription: raw.activity_description,
  };
}

function mapSecurityEvent(raw: RawSecurityEvent): SecurityEvent {
  return {
    id: raw.id,
    source: raw.source,
    timestamp: asUtcTimestamp(raw.timestamp),
    severity: toSeverity(raw.severity),
    eventType: raw.event_type || 'unknown',
    userId: raw.user_id ?? null,
    username: raw.username ?? null,
    clientIp: raw.client_ip ?? null,
    endpointPath: raw.endpoint_path ?? null,
    httpMethod: raw.http_method ?? null,
    responseStatus: raw.response_status ?? null,
    errorCode: raw.error_code ?? null,
    errorMessage: raw.error_message ?? null,
    durationMs: raw.duration_ms ?? null,
    details: raw.details ?? null,
    activityName: raw.activity_name ?? null,
  };
}

function mapApiAuditLog(raw: RawApiAuditLog): ApiAuditLog {
  return {
    id: raw.id,
    requestId: raw.request_id,
    httpMethod: raw.http_method,
    endpointPath: raw.endpoint_path,
    routePattern: raw.route_pattern,
    userType: raw.user_type,
    username: raw.username,
    userHash: raw.user_hash,
    projectName: raw.project_name,
    projectHash: raw.project_hash,
    responseStatus: raw.response_status,
    isSuccess: toBool(raw.is_success),
    errorCode: raw.error_code,
    errorMessage: raw.error_message,
    securityEvent: toBool(raw.security_event),
    durationMs: raw.duration_ms,
    requestTimestamp: asUtcTimestamp(raw.request_timestamp),
    clientIp: raw.client_ip,
    userAgent: raw.user_agent,
  };
}

class AuditService {
  /**
   * `GET /admin/activity` — newest first, offset pagination. The activity
   * type filter is the `activity_type_filter` query parameter; `user_id` and
   * `project_id` take internal ids.
   */
  async getActivityLogs(
    params: ActivityLogParams = {}
  ): Promise<ActivityLogPage> {
    const data = await getJson<ActivityLogResponse>('/admin/activity', {
      ...params,
    });
    if (!Array.isArray(data.activities) || !data.pagination) {
      throw new Error(
        'The activity log response was not in the expected format.'
      );
    }
    return {
      activities: data.activities.map(mapActivity),
      pagination: {
        total: data.pagination.total,
        limit: data.pagination.limit,
        offset: data.pagination.offset,
        hasMore: data.pagination.has_more,
        nextOffset: data.pagination.next_offset ?? undefined,
      },
      filters: {
        activityType: data.filters?.activity_type ?? undefined,
        userId: data.filters?.user_id ?? undefined,
        projectId: data.filters?.project_id ?? undefined,
        days: data.filters?.days,
        search: data.filters?.search ?? undefined,
      },
      generatedAt: data.generated_at,
    };
  }

  /** `GET /admin/activity/types` — every activity type the server defines. */
  async getActivityTypes(): Promise<string[]> {
    const data = await getJson<ActivityTypesResponse>('/admin/activity/types');
    return data.activity_types;
  }

  /** `GET /admin/activity/{id}` — wrapped as `{activity, generated_at}`. */
  async getActivityById(id: string): Promise<ActivityDetail> {
    const data = await getJson<ActivityDetailResponse>(
      `/admin/activity/${seg(id)}`
    );
    if (!data.activity) throw new Error('Activity entry not found.');
    return mapActivityDetail(data.activity);
  }

  /**
   * `GET /admin/audit/security-events`. There is no offset: up to `limit`
   * events are read from each source, merged newest first and cut to
   * `limit`, and the summary counts only those returned events.
   */
  async getSecurityEvents(
    params: SecurityEventParams = {}
  ): Promise<SecurityEventsResult> {
    const data = await getJson<SecurityEventsResponse>(
      '/admin/audit/security-events',
      {
        limit: params.limit,
        days: params.days,
        severity: params.severity,
        source: params.source,
      }
    );
    if (!Array.isArray(data.events) || !data.summary) {
      throw new Error(
        'The security events response was not in the expected format.'
      );
    }
    return {
      events: data.events.map(mapSecurityEvent),
      summary: {
        total: data.summary.total,
        bySource: {
          api_audit: data.summary.by_source.api_audit ?? 0,
          activity_log: data.summary.by_source.activity_log ?? 0,
        },
        bySeverity: {
          critical: data.summary.by_severity.critical ?? 0,
          warning: data.summary.by_severity.warning ?? 0,
          info: data.summary.by_severity.info ?? 0,
        },
        periodHours: data.summary.period_hours,
      },
      generatedAt: data.generated_at,
    };
  }

  /** `GET /admin/audit/logs` — per-request API audit records (bodies are not mapped). */
  async getApiAuditLogs(
    params: ApiAuditLogParams = {}
  ): Promise<ApiAuditLogPage> {
    const data = await getJson<ApiAuditLogResponse>('/admin/audit/logs', {
      ...params,
    });
    if (!Array.isArray(data.logs) || !data.pagination) {
      throw new Error(
        'The API request log response was not in the expected format.'
      );
    }
    return {
      logs: data.logs.map(mapApiAuditLog),
      pagination: {
        total: data.pagination.total,
        limit: data.pagination.limit,
        offset: data.pagination.offset,
        hasMore: data.pagination.has_more,
        nextOffset: data.pagination.next_offset ?? undefined,
      },
      generatedAt: data.generated_at,
    };
  }

  /** `GET /admin/audit/statistics` — API audit traffic over the last `days`. */
  async getAuditStatistics(days = 7): Promise<AuditStatistics> {
    const data = await getJson<AuditStatisticsResponse>(
      '/admin/audit/statistics',
      { days }
    );
    if (!data.overview || !Array.isArray(data.by_method)) {
      throw new Error(
        'The audit statistics response was not in the expected format.'
      );
    }
    const statusTotal = data.status_distribution.reduce(
      (sum, item) => sum + toNumber(item.count),
      0
    );
    return {
      overview: {
        totalRequests: toNumber(data.overview.total_requests),
        successCount: toNumber(data.overview.successful_requests),
        failureCount: toNumber(data.overview.failed_requests),
        successRate: toNumber(data.overview.success_rate),
        avgDurationMs: toNumber(data.overview.avg_duration_ms),
        maxDurationMs: toNumber(data.overview.max_duration_ms),
      },
      byMethod: data.by_method.map((item) => ({
        method: item.http_method,
        count: toNumber(item.request_count),
        avgDurationMs: toNumber(item.avg_duration_ms),
      })),
      topEndpoints: data.top_endpoints.map((item) => {
        const successCount = toNumber(item.success_count);
        const failureCount = toNumber(item.failure_count);
        const counted = successCount + failureCount;
        return {
          endpoint: item.endpoint_path,
          count: toNumber(item.request_count),
          successCount,
          failureCount,
          successRate: counted > 0 ? (successCount / counted) * 100 : null,
          avgDurationMs: toNumber(item.avg_duration_ms),
        };
      }),
      statusDistribution: data.status_distribution.map((item) => ({
        statusCode: item.response_status,
        count: toNumber(item.count),
        percentage:
          statusTotal > 0 ? (toNumber(item.count) / statusTotal) * 100 : 0,
      })),
      generatedAt: data.generated_at,
    };
  }

  /**
   * `POST /admin/audit/export` (JSON) — streamed CSV or JSON file. Goes
   * through `postBlob` so it keeps the client's timeout and refresh handling.
   * The backend refuses (400) when more than 10,000 records match the filters.
   */
  async exportAuditLogs(request: AuditExportRequest): Promise<Blob> {
    const filters = Object.fromEntries(
      Object.entries(request.filters).filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
    );
    return apiClient.postBlob('/admin/audit/export', {
      source: request.source,
      format: request.format,
      limit: request.limit,
      filters,
    });
  }
}

export const auditService = new AuditService();
export default auditService;
