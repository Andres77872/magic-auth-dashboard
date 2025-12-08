import type { ApiResponse, PaginationResponse } from './api.types';

/**
 * Activity type categories for audit logging
 */
export type ActivityType =
  // Authentication
  | 'user_login'
  | 'user_logout'
  | 'user_registration'
  // User Management
  | 'user_update'
  | 'user_status_change'
  | 'user_password_reset'
  | 'user_type_changed'
  // Project Management
  | 'project_creation'
  | 'project_update'
  | 'project_delete'
  | 'project_member_add'
  | 'project_member_remove'
  | 'project_ownership_transferred'
  | 'project_archived'
  | 'project_unarchived'
  // Group Management
  | 'group_creation'
  | 'group_update'
  | 'group_delete'
  | 'user_group_assign'
  | 'user_group_remove'
  // Permission Management
  | 'permission_grant'
  | 'permission_revoke'
  | 'role_removed'
  // Bulk Operations
  | 'bulk_role_assignment'
  | 'bulk_group_assignment'
  | 'bulk_user_update'
  | 'bulk_user_delete'
  // System
  | 'admin_action'
  | 'system_event';

/**
 * All available activity types as a constant array
 */
export const ACTIVITY_TYPES: ActivityType[] = [
  'user_login',
  'user_logout',
  'user_registration',
  'user_update',
  'user_status_change',
  'user_password_reset',
  'user_type_changed',
  'project_creation',
  'project_update',
  'project_delete',
  'project_member_add',
  'project_member_remove',
  'project_ownership_transferred',
  'project_archived',
  'project_unarchived',
  'group_creation',
  'group_update',
  'group_delete',
  'user_group_assign',
  'user_group_remove',
  'permission_grant',
  'permission_revoke',
  'role_removed',
  'bulk_role_assignment',
  'bulk_group_assignment',
  'bulk_user_update',
  'bulk_user_delete',
  'admin_action',
  'system_event',
];


/**
 * User reference in activity logs
 */
export interface ActivityUser {
  id: string;
  username: string;
  userHash: string;
}

/**
 * Project reference in activity logs
 */
export interface ActivityProject {
  id: string;
  name: string;
  hash: string;
}

/**
 * Activity log entry
 */
export interface ActivityLog {
  id: string;
  activityType: ActivityType;
  details: Record<string, unknown>;
  createdAt: string;
  user: ActivityUser | null;
  project: ActivityProject | null;
  targetUser: ActivityUser | null;
  ipAddress: string | null;
}

/**
 * Security event severity levels
 */
export type SecuritySeverity = 'info' | 'warning' | 'critical';

/**
 * Security event extends activity log with security-specific fields
 */
export interface SecurityEvent extends ActivityLog {
  severity: SecuritySeverity;
  clientIp: string;
  userAgent: string;
  responseStatus?: number;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Security summary statistics
 */
export interface SecuritySummary {
  totalEvents: number;
  failedLogins: number;
  unauthorizedAttempts: number;
  criticalEvents: number;
  lastEventTimestamp: string | null;
}

/**
 * Audit statistics overview
 */
export interface AuditStatisticsOverview {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDurationMs: number;
}

/**
 * Statistics by HTTP method
 */
export interface MethodStatistics {
  method: string;
  count: number;
  successRate: number;
}

/**
 * Top endpoint statistics
 */
export interface EndpointStatistics {
  endpoint: string;
  count: number;
  successRate: number;
  avgDurationMs: number;
}

/**
 * Status code distribution
 */
export interface StatusDistribution {
  statusCode: number;
  count: number;
  percentage: number;
}

/**
 * Complete audit statistics
 */
export interface AuditStatistics {
  overview: AuditStatisticsOverview;
  byMethod: MethodStatistics[];
  topEndpoints: EndpointStatistics[];
  statusDistribution: StatusDistribution[];
  generatedAt: string;
}


/**
 * Activity log filter parameters
 */
export interface ActivityFilters {
  activityType?: ActivityType;
  userId?: string;
  projectId?: string;
  days?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

/**
 * Pagination info for activity logs
 */
export interface ActivityPaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset?: number;
  currentPage: number;
  totalPages: number;
}

/**
 * API request parameters for activity logs
 */
export interface ActivityLogParams {
  limit?: number;
  offset?: number;
  activity_type_filter?: string;
  user_id?: string;
  project_id?: string;
  days?: number;
}

/**
 * API response for activity logs
 */
export interface ActivityLogResponse extends ApiResponse {
  activities: ActivityLog[];
  pagination: PaginationResponse & {
    next_offset?: number;
  };
  filters: {
    activity_type: string | null;
    user_id: string | null;
    project_id: string | null;
    days: number;
  };
  generated_at: string;
}

/**
 * API response for activity types
 */
export interface ActivityTypesResponse extends ApiResponse {
  activity_types: string[];
  generated_at: string;
}

/**
 * Security event parameters
 */
export interface SecurityEventParams {
  limit?: number;
  offset?: number;
  days?: number;
}

/**
 * Security event response
 */
export interface SecurityEventResponse extends ApiResponse {
  events: SecurityEvent[];
  summary: SecuritySummary;
  pagination: PaginationResponse;
}

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'json';

/**
 * Export parameters
 */
export interface ExportParams {
  format: ExportFormat;
  filters: ActivityFilters;
}

/**
 * Raw API activity log entry (snake_case from API)
 */
export interface RawActivityLog {
  id: string;
  activity_type: string;
  details: Record<string, unknown>;
  created_at: string;
  user: {
    id: string;
    username: string;
    user_hash: string;
  } | null;
  project: {
    id: string;
    name: string;
    hash: string;
  } | null;
  target_user: {
    id: string;
    username: string;
    user_hash: string;
  } | null;
  ip_address: string | null;
}
