/**
 * Data hooks for the audit log page. Each wraps one `auditService` call in
 * `useAsyncData`, so refreshes keep the previous rows on screen and stale
 * responses are ignored.
 */

import { useCallback } from 'react';
import { auditService } from '@/services/audit.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import type {
  ActivityDetail,
  ActivityFilters,
  ActivityLog,
  ApiAuditLog,
  ApiAuditLogParams,
  AuditStatistics,
  SecurityEventParams,
  SecurityEventsResult,
} from '@/types/audit.types';

interface ListState {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// --- activity log --------------------------------------------------------------------------

export interface UseActivityLogsOptions {
  filters?: ActivityFilters;
  limit?: number;
  offset?: number;
  /** Background refresh while the tab is visible. */
  pollIntervalMs?: number;
  enabled?: boolean;
}

export interface UseActivityLogsReturn extends ListState {
  activities: ActivityLog[];
  /** Backend count for the filters (search included). */
  total: number;
}

/** A page of `GET /admin/activity` for the given filters. */
export function useActivityLogs({
  filters = {},
  limit = 25,
  offset = 0,
  pollIntervalMs,
  enabled = true,
}: UseActivityLogsOptions = {}): UseActivityLogsReturn {
  const { activityType, userId, projectId, days, search } = filters;
  const fetcher = useCallback(
    () =>
      auditService.getActivityLogs({
        limit,
        offset,
        activity_type_filter: activityType,
        user_id: userId,
        project_id: projectId,
        days,
        search: search?.trim() || undefined,
      }),
    [limit, offset, activityType, userId, projectId, days, search]
  );
  const { data, ...state } = useAsyncData(fetcher, { enabled, pollIntervalMs });
  return {
    activities: data?.activities ?? [],
    total: data?.pagination.total ?? 0,
    ...stripUpdatedAt(state),
  };
}

export interface UseActivityTypesReturn {
  activityTypes: string[];
  isLoading: boolean;
  error: string | null;
}

/** Every activity type the server defines (`GET /admin/activity/types`). */
export function useActivityTypes(enabled = true): UseActivityTypesReturn {
  const fetcher = useCallback(() => auditService.getActivityTypes(), []);
  const { data, isLoading, error } = useAsyncData(fetcher, { enabled });
  return { activityTypes: data ?? [], isLoading, error };
}

export interface UseActivityDetailReturn {
  activity: ActivityDetail | null;
  isLoading: boolean;
  error: string | null;
}

/** One activity entry with severity, user agent and metadata. */
export function useActivityDetail(
  activityId: string | null
): UseActivityDetailReturn {
  const fetcher = useCallback(async (): Promise<ActivityDetail> => {
    if (!activityId) throw new Error('No activity selected.');
    return auditService.getActivityById(activityId);
  }, [activityId]);
  const { data, isLoading, error } = useAsyncData(fetcher, {
    enabled: Boolean(activityId),
  });
  return {
    activity: data && data.id === activityId ? data : null,
    isLoading,
    error,
  };
}

// --- API requests ---------------------------------------------------------------------------

export interface UseApiAuditLogsReturn extends ListState {
  logs: ApiAuditLog[];
  total: number;
}

/** A page of per-request API audit records (`GET /admin/audit/logs`). */
export function useApiAuditLogs(
  params: ApiAuditLogParams,
  enabled = true
): UseApiAuditLogsReturn {
  const {
    limit,
    offset,
    endpoint_path,
    http_method,
    status_code,
    is_success,
    security_event,
    days,
  } = params;
  const fetcher = useCallback(
    () =>
      auditService.getApiAuditLogs({
        limit,
        offset,
        endpoint_path: endpoint_path?.trim() || undefined,
        http_method,
        status_code,
        is_success,
        security_event,
        days,
      }),
    [
      limit,
      offset,
      endpoint_path,
      http_method,
      status_code,
      is_success,
      security_event,
      days,
    ]
  );
  const { data, ...state } = useAsyncData(fetcher, { enabled });
  return {
    logs: data?.logs ?? [],
    total: data?.pagination.total ?? 0,
    ...stripUpdatedAt(state),
  };
}

// --- security events and statistics ---------------------------------------------------------

export interface UseSecurityEventsReturn extends ListState {
  result: SecurityEventsResult | null;
}

/** Recent security events (`GET /admin/audit/security-events`; no offset paging). */
export function useSecurityEvents(
  params: SecurityEventParams,
  enabled = true
): UseSecurityEventsReturn {
  const { limit, days, severity, source } = params;
  const fetcher = useCallback(
    () => auditService.getSecurityEvents({ limit, days, severity, source }),
    [limit, days, severity, source]
  );
  const { data, ...state } = useAsyncData(fetcher, { enabled });
  return { result: data, ...stripUpdatedAt(state) };
}

export interface UseAuditStatisticsReturn extends ListState {
  statistics: AuditStatistics | null;
}

/** API traffic summary for the last `days` (`GET /admin/audit/statistics`). */
export function useAuditStatistics(
  days: number,
  enabled = true
): UseAuditStatisticsReturn {
  const fetcher = useCallback(
    () => auditService.getAuditStatistics(days),
    [days]
  );
  const { data, ...state } = useAsyncData(fetcher, { enabled });
  return { statistics: data, ...stripUpdatedAt(state) };
}

function stripUpdatedAt<T extends ListState & { updatedAt: Date | null }>(
  state: T
): ListState {
  return {
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    refetch: state.refetch,
  };
}
