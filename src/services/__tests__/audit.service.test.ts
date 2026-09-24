import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditService } from '../audit.service';
import { asUtcTimestamp } from '@/utils/formatters';

const client = vi.hoisted(() => ({
  get: vi.fn(),
  postBlob: vi.fn(),
}));

vi.mock('../api.client', () => ({ apiClient: client }));

const rawActivity = {
  id: 'act-0123456789abcdef0123456789abcdef',
  activity_type: 'user_login',
  details: '{"message":"ok"}',
  created_at: '2026-03-01T10:00:00Z',
  user: {
    id: 'usr-internal-1',
    username: 'alice',
    user_hash: 'usr-hash-alice',
  },
  project: { id: 'proj-internal-1', name: 'Alpha', hash: 'proj-hash-alpha' },
  target_user: null,
  ip_address: '10.0.0.1',
};

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists activity with the backend parameter names and keeps the page shape', async () => {
    client.get.mockResolvedValue({
      activities: [rawActivity],
      pagination: {
        total: 120,
        limit: 25,
        offset: 25,
        has_more: true,
        next_offset: 50,
      },
      filters: {
        activity_type: 'user_login',
        user_id: null,
        project_id: null,
        days: 7,
        search: null,
      },
      generated_at: '2026-03-01T10:05:00Z',
    });

    const page = await auditService.getActivityLogs({
      limit: 25,
      offset: 25,
      activity_type_filter: 'user_login',
      days: 7,
      search: '',
    });

    expect(client.get).toHaveBeenCalledWith('/admin/activity', {
      limit: 25,
      offset: 25,
      activity_type_filter: 'user_login',
      days: 7,
    });
    expect(page.pagination).toEqual({
      total: 120,
      limit: 25,
      offset: 25,
      hasMore: true,
      nextOffset: 50,
    });
    expect(page.activities[0].user).toEqual({
      id: 'usr-internal-1',
      username: 'alice',
      userHash: 'usr-hash-alice',
    });
    expect(page.activities[0].project?.hash).toBe('proj-hash-alpha');
    expect(page.filters.activityType).toBe('user_login');
  });

  it('unwraps the {activity} envelope of the detail route', async () => {
    client.get.mockResolvedValue({
      activity: {
        ...rawActivity,
        severity_level: 'warning',
        user_agent: 'curl/8',
        metadata: { a: 1 },
        activity_name: 'User login',
        activity_category: 'auth',
        activity_description: 'A user signed in',
      },
      generated_at: '2026-03-01T10:05:00Z',
    });

    const detail = await auditService.getActivityById(rawActivity.id);

    expect(client.get.mock.calls[0][0]).toBe(
      `/admin/activity/${rawActivity.id}`
    );
    expect(detail.id).toBe(rawActivity.id);
    expect(detail.severity).toBe('warning');
    expect(detail.userAgent).toBe('curl/8');
    expect(detail.user?.userHash).toBe('usr-hash-alice');
  });

  it('propagates detail failures instead of swallowing them', async () => {
    client.get.mockRejectedValue(new Error('Activity log entry not found'));
    await expect(auditService.getActivityById('act-missing')).rejects.toThrow(
      'Activity log entry not found'
    );
  });

  it('exports with a valid source and drops empty filters but keeps false', async () => {
    client.postBlob.mockResolvedValue(new Blob(['id\n']));

    await auditService.exportAuditLogs({
      source: 'activity',
      format: 'csv',
      limit: 420,
      filters: { days: 7, activity_type: 'user_login', user_id: undefined },
    });
    await auditService.exportAuditLogs({
      source: 'api_audit',
      format: 'json',
      limit: 10,
      filters: { is_success: false, endpoint_path: '', days: 1 },
    });

    expect(client.postBlob).toHaveBeenNthCalledWith(1, '/admin/audit/export', {
      source: 'activity',
      format: 'csv',
      limit: 420,
      filters: { days: 7, activity_type: 'user_login' },
    });
    expect(client.postBlob).toHaveBeenNthCalledWith(2, '/admin/audit/export', {
      source: 'api_audit',
      format: 'json',
      limit: 10,
      filters: { is_success: false, days: 1 },
    });
  });

  it('reads security events without offset paging and normalises the summary', async () => {
    client.get.mockResolvedValue({
      events: [
        {
          id: 'aud-1',
          source: 'api_audit',
          timestamp: '2026-03-01T09:00:00',
          severity: 'critical',
          event_type: 'ACCESS_DENIED',
          user_id: 'usr-internal-1',
          username: 'alice',
          client_ip: '10.0.0.2',
          endpoint_path: '/admin/billing',
          http_method: 'GET',
          response_status: 403,
          error_code: 'AUTHZ_2001',
          error_message: 'Denied',
          duration_ms: 12,
        },
      ],
      summary: {
        total: 1,
        by_source: { api_audit: 1, activity_log: 0 },
        by_severity: { critical: 1 },
        period_hours: 168,
      },
      generated_at: '2026-03-01T10:00:00Z',
    });

    const result = await auditService.getSecurityEvents({
      limit: 100,
      days: 7,
      severity: 'critical',
    });

    expect(client.get).toHaveBeenCalledWith('/admin/audit/security-events', {
      limit: 100,
      days: 7,
      severity: 'critical',
    });
    expect(result.events[0].timestamp).toBe('2026-03-01T09:00:00Z');
    expect(result.summary.bySeverity).toEqual({
      critical: 1,
      warning: 0,
      info: 0,
    });
    expect(result.summary.periodHours).toBe(168);
  });

  it('maps API request logs, converting 0/1 flags to booleans', async () => {
    client.get.mockResolvedValue({
      logs: [
        {
          id: 'req-1',
          request_id: 'r-1',
          http_method: 'POST',
          endpoint_path: '/auth/login',
          route_pattern: '/auth/login',
          user_type: null,
          username: null,
          user_hash: null,
          project_name: null,
          project_hash: null,
          response_status: 401,
          is_success: 0,
          error_code: 'AUTH_1001',
          error_message: 'Bad credentials',
          security_event: 1,
          duration_ms: 30,
          request_timestamp: '2026-03-01T08:00:00',
          client_ip: '10.0.0.3',
          user_agent: 'curl/8',
        },
      ],
      pagination: {
        total: 1,
        limit: 25,
        offset: 0,
        has_more: false,
        next_offset: null,
      },
      generated_at: '2026-03-01T10:00:00Z',
    });

    const page = await auditService.getApiAuditLogs({
      limit: 25,
      offset: 0,
      is_success: false,
      days: 7,
    });

    expect(client.get).toHaveBeenCalledWith('/admin/audit/logs', {
      limit: 25,
      offset: 0,
      is_success: 'false',
      days: 7,
    });
    expect(page.logs[0]).toMatchObject({
      isSuccess: false,
      securityEvent: true,
      requestTimestamp: '2026-03-01T08:00:00Z',
    });
  });

  it('converts statistics numbers and leaves success rate empty without outcomes', async () => {
    client.get.mockResolvedValue({
      overview: {
        total_requests: 10,
        successful_requests: '8',
        failed_requests: '2',
        success_rate: 80,
        avg_duration_ms: 12.5,
        max_duration_ms: 90,
      },
      by_method: [
        { http_method: 'GET', request_count: 10, avg_duration_ms: 12.5 },
      ],
      top_endpoints: [
        {
          endpoint_path: '/a',
          request_count: 6,
          avg_duration_ms: 10,
          success_count: '6',
          failure_count: '0',
        },
        {
          endpoint_path: '/b',
          request_count: 4,
          avg_duration_ms: 15,
          success_count: 0,
          failure_count: 0,
        },
      ],
      status_distribution: [
        { response_status: 200, count: 8 },
        { response_status: 500, count: 2 },
      ],
      generated_at: '2026-03-01T10:00:00Z',
    });

    const stats = await auditService.getAuditStatistics(7);

    expect(stats.overview).toMatchObject({
      totalRequests: 10,
      successCount: 8,
      failureCount: 2,
      successRate: 80,
    });
    expect(stats.topEndpoints[0].successRate).toBe(100);
    expect(stats.topEndpoints[1].successRate).toBeNull();
    expect(stats.statusDistribution[0].percentage).toBe(80);
  });
});

describe('asUtcTimestamp', () => {
  it('appends Z to naive date-times only', () => {
    expect(asUtcTimestamp('2026-03-01T08:00:00')).toBe('2026-03-01T08:00:00Z');
    expect(asUtcTimestamp('2026-03-01 08:00:00.123')).toBe(
      '2026-03-01T08:00:00.123Z'
    );
    expect(asUtcTimestamp('2026-03-01T08:00:00Z')).toBe('2026-03-01T08:00:00Z');
    expect(asUtcTimestamp('2026-03-01T08:00:00+02:00')).toBe(
      '2026-03-01T08:00:00+02:00'
    );
    expect(asUtcTimestamp(null)).toBeNull();
  });
});
