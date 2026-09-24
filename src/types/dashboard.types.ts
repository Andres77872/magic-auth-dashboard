import type { HealthComponent, HealthStatus } from './system.types';

/** Component check inside `GET /admin/dashboard/stats` → `system_health`. */
export interface DashboardHealthCheck {
  status: string;
  message?: string | null;
  timestamp?: string | null;
}

/**
 * `GET /admin/dashboard/stats` (api.auth `admin_dashboard.py`). Returned as a
 * bare object — there is no `success` envelope. Counts are platform-wide even
 * for admin callers. `growth` values are 7-day counts, not percentages.
 */
export interface AdminDashboardStats {
  totals: {
    /** Active users only. */
    users: number;
    /** Excludes archived projects. */
    projects: number;
    user_groups: number;
    project_groups: number;
    /** Live access-token sessions in Redis (each lives ~15 minutes). */
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
    database: DashboardHealthCheck;
    redis: DashboardHealthCheck;
    overall_status: 'healthy' | 'degraded' | (string & {});
  };
  generated_at: string;
}

/** `GET /admin/users/statistics?days=N` → `statistics` (success branch). */
export interface AdminUserStatistics {
  total_users: number;
  /** GROUP BY result — a key is absent when its count is zero. */
  user_types: Partial<Record<'root' | 'admin' | 'consumer', number>>;
  new_users: number;
  active_users: number;
  growth_rate: number;
  date_range_days: number;
  activity_rate: number;
}

export interface AdminUserStatisticsResponse {
  success: boolean;
  /** The backend returns `{error}` here when the query fails. */
  statistics: AdminUserStatistics | { error: string };
  generated_at?: string;
}

export interface SystemHealthData {
  status: HealthStatus | (string & {});
  timestamp: string;
  // Open-ended set of components (database, redis, email_*, patreon, billing, …).
  components: Record<string, HealthComponent>;
}
