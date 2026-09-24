/**
 * Audit log types: the activity log (`/admin/activity*`, api.auth
 * `admin_dashboard.py`) and the per-request API audit log, security events,
 * statistics and exports (`/admin/audit/*`, `audit_logs.py`).
 *
 * `user.id`, `project.id` and `user_id`/`project_id` filters are INTERNAL ids:
 * valid as filter values, never as route parameters — link with hashes.
 */

/** Activity type code from api.auth's `ActivityType` enum (see `GET /admin/activity/types`). */
export type ActivityType = string;

export type SecuritySeverity = 'info' | 'warning' | 'critical';

export interface ActivityUser {
  /** Internal id (filter value only). */
  id: string;
  username: string;
  userHash: string;
}

export interface ActivityProject {
  /** Internal id (filter value only). */
  id: string;
  name: string;
  hash: string;
}

/** One activity-log entry as listed by `GET /admin/activity`. */
export interface ActivityLog {
  id: string;
  activityType: ActivityType;
  /** Free-form `details` column: an object, a JSON string or plain text. */
  details: unknown;
  createdAt: string;
  user: ActivityUser | null;
  project: ActivityProject | null;
  targetUser: ActivityUser | null;
  ipAddress: string | null;
}

/** `GET /admin/activity/{id}` adds severity, user agent, metadata and catalog fields. */
export interface ActivityDetail extends ActivityLog {
  severity: SecuritySeverity;
  userAgent: string | null;
  metadata: unknown;
  activityName: string | null;
  activityCategory: string | null;
  activityDescription: string | null;
}

/** Filters the activity log UI can apply. */
export interface ActivityFilters {
  activityType?: ActivityType;
  /** Internal user id of the acting user. */
  userId?: string;
  /** Internal project id. */
  projectId?: string;
  /** Look-back window, 1–365 (backend default 30). */
  days?: number;
  /** Free text across type, details and username (not applied to exports). */
  search?: string;
}

/** Query parameters of `GET /admin/activity`. */
export interface ActivityLogParams {
  limit?: number;
  offset?: number;
  activity_type_filter?: string;
  user_id?: string;
  project_id?: string;
  days?: number;
  search?: string;
}

export interface OffsetPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset?: number;
}

/** Normalised `GET /admin/activity` page. */
export interface ActivityLogPage {
  activities: ActivityLog[];
  pagination: OffsetPagination;
  filters: ActivityFilters;
  generatedAt: string;
}

// --- raw activity payloads ----------------------------------------------------------------

interface RawActivityRef {
  id: string;
  username: string;
  user_hash: string;
}

export interface RawActivityLog {
  id: string;
  activity_type: string;
  details: unknown;
  created_at: string;
  user: RawActivityRef | null;
  project: { id: string; name: string; hash: string } | null;
  target_user: RawActivityRef | null;
  ip_address: string | null;
}

export interface RawActivityDetail extends RawActivityLog {
  severity_level: SecuritySeverity | null;
  user_agent: string | null;
  metadata: unknown;
  activity_name: string | null;
  activity_category: string | null;
  activity_description: string | null;
}

export interface ActivityLogResponse {
  activities: RawActivityLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
    next_offset: number | null;
  };
  filters: {
    activity_type: string | null;
    user_id: string | null;
    project_id: string | null;
    days: number;
    search?: string | null;
  };
  generated_at: string;
}

export interface ActivityDetailResponse {
  activity: RawActivityDetail;
  generated_at: string;
}

export interface ActivityTypesResponse {
  activity_types: string[];
  generated_at: string;
}

// --- security events ------------------------------------------------------------------------

export type SecurityEventSource = 'api_audit' | 'activity_log';

export interface SecurityEventParams {
  /** 1–500; the cap applies per source and to the merged list. */
  limit?: number;
  days?: number;
  severity?: SecuritySeverity;
  source?: SecurityEventSource;
}

export interface SecurityEvent {
  id: string;
  source: SecurityEventSource;
  timestamp: string | null;
  severity: SecuritySeverity;
  eventType: string;
  /** Internal user id; there is no user hash on security events. */
  userId: string | null;
  username: string | null;
  clientIp: string | null;
  endpointPath: string | null;
  httpMethod: string | null;
  responseStatus: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  details: unknown;
  activityName: string | null;
}

/** Counts over the RETURNED events (after `limit`), not over the whole period. */
export interface SecuritySummary {
  total: number;
  bySource: Record<SecurityEventSource, number>;
  bySeverity: Record<SecuritySeverity, number>;
  periodHours: number;
}

export interface SecurityEventsResult {
  events: SecurityEvent[];
  summary: SecuritySummary;
  generatedAt: string;
}

export interface RawSecurityEvent {
  id: string;
  source: SecurityEventSource;
  timestamp: string | null;
  severity: SecuritySeverity;
  event_type: string | null;
  user_id?: string | null;
  username?: string | null;
  client_ip?: string | null;
  endpoint_path?: string | null;
  http_method?: string | null;
  response_status?: number | null;
  error_code?: string | null;
  error_message?: string | null;
  duration_ms?: number | null;
  details?: unknown;
  activity_name?: string | null;
}

export interface SecurityEventsResponse {
  events: RawSecurityEvent[];
  summary: {
    total: number;
    by_source: Partial<Record<SecurityEventSource, number>>;
    by_severity: Partial<Record<SecuritySeverity, number>>;
    period_hours: number;
  };
  generated_at: string;
}

// --- API request audit log ------------------------------------------------------------------

/** Query parameters of `GET /admin/audit/logs`. */
export interface ApiAuditLogParams {
  /** 1–1000. */
  limit?: number;
  offset?: number;
  /** Partial match. */
  endpoint_path?: string;
  http_method?: string;
  status_code?: number;
  is_success?: boolean;
  security_event?: boolean;
  days?: number;
}

/** One API request (request/response bodies are deliberately not mapped). */
export interface ApiAuditLog {
  id: string;
  requestId: string | null;
  httpMethod: string;
  endpointPath: string;
  routePattern: string | null;
  userType: string | null;
  username: string | null;
  userHash: string | null;
  projectName: string | null;
  projectHash: string | null;
  responseStatus: number | null;
  isSuccess: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  securityEvent: boolean;
  durationMs: number | null;
  requestTimestamp: string | null;
  clientIp: string | null;
  userAgent: string | null;
}

export interface ApiAuditLogPage {
  logs: ApiAuditLog[];
  pagination: OffsetPagination;
  generatedAt: string;
}

export interface RawApiAuditLog {
  id: string;
  request_id: string | null;
  http_method: string;
  endpoint_path: string;
  route_pattern: string | null;
  user_type: string | null;
  username: string | null;
  user_hash: string | null;
  project_name: string | null;
  project_hash: string | null;
  response_status: number | null;
  is_success: boolean | number | null;
  error_code: string | null;
  error_message: string | null;
  security_event: boolean | number | null;
  duration_ms: number | null;
  request_timestamp: string | null;
  client_ip: string | null;
  user_agent: string | null;
}

export interface ApiAuditLogResponse {
  logs: RawApiAuditLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
    next_offset: number | null;
  };
  generated_at: string;
}

// --- statistics -----------------------------------------------------------------------------

export interface AuditStatistics {
  overview: {
    totalRequests: number;
    successCount: number;
    failureCount: number;
    /** Percent, 0–100. */
    successRate: number;
    avgDurationMs: number;
    maxDurationMs: number;
  };
  byMethod: { method: string; count: number; avgDurationMs: number }[];
  topEndpoints: {
    endpoint: string;
    count: number;
    successCount: number;
    failureCount: number;
    /** Percent, 0–100; null when the endpoint has no counted outcomes. */
    successRate: number | null;
    avgDurationMs: number;
  }[];
  statusDistribution: {
    statusCode: number;
    count: number;
    percentage: number;
  }[];
  generatedAt: string;
}

type NumberLike = number | string;

export interface AuditStatisticsResponse {
  overview: Partial<{
    total_requests: NumberLike;
    successful_requests: NumberLike;
    failed_requests: NumberLike;
    success_rate: NumberLike;
    avg_duration_ms: NumberLike;
    max_duration_ms: NumberLike;
  }>;
  by_method: {
    http_method: string;
    request_count: NumberLike;
    avg_duration_ms: NumberLike;
  }[];
  top_endpoints: {
    endpoint_path: string;
    request_count: NumberLike;
    avg_duration_ms: NumberLike;
    success_count: NumberLike;
    failure_count: NumberLike;
  }[];
  status_distribution: { response_status: number; count: NumberLike }[];
  generated_at: string;
}

// --- export -----------------------------------------------------------------------------------

export type ExportFormat = 'csv' | 'json';

/** `POST /admin/audit/export` sources (`VALID_SOURCES`, audit_export.py:27). */
export type AuditExportSource = 'activity' | 'api_audit';

/** Export filters. Both sources: user_id, project_id (internal ids), days. */
export interface AuditExportFilters {
  user_id?: string;
  project_id?: string;
  days?: number;
  /** `activity` source only. */
  activity_type?: string;
  /** `api_audit` source only. */
  endpoint_path?: string;
  http_method?: string;
  status_code?: number;
  is_success?: boolean;
  security_event?: boolean;
}

export interface AuditExportRequest {
  source: AuditExportSource;
  format: ExportFormat;
  /** 1–10,000 (backend default 1,000). */
  limit: number;
  filters: AuditExportFilters;
}

/** Hard cap on exported rows; more matches than this are refused with 400. */
export const AUDIT_EXPORT_MAX_ROWS = 10_000;
