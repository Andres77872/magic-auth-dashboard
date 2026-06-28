import type { ApiResponse } from './api.types';

export interface SystemInfo {
  name: string;
  version: string;
  architecture: string;
  status: string;
}

export interface SystemStatistics {
  total_users: number;
  total_projects: number;
  total_user_groups: number;
  total_project_groups: number;
  authentication_type: string;
}

export interface SystemInfoResponse extends ApiResponse {
  system: SystemInfo;
  statistics: SystemStatistics;
  features: string[];
}

/**
 * Statuses reported by `GET /system/health`. The list is the union of every
 * status the API can return today; unknown/future values still type-check via
 * the `string` fallback on `HealthComponent.status` and degrade gracefully to a
 * neutral tone in the UI.
 */
export type HealthStatus =
  | 'healthy'
  | 'warning'
  | 'critical'
  | 'unhealthy'
  | 'degraded'
  | 'ready'
  | 'disabled'
  | 'not_ready'
  | 'retrying';

/**
 * A node in the health tree. The API returns heterogeneous components — some
 * flat (`{status, message}`), some deeply nested (patreon, billing). The index
 * signature keeps every nested object/array/scalar so nothing is dropped, while
 * the named fields stay for editor convenience.
 */
export interface HealthComponent {
  // `string & {}` keeps the `HealthStatus` literals for autocomplete while still
  // accepting any (unknown/future) status string the API may return.
  status?: HealthStatus | (string & {});
  message?: string;
  response_time_ms?: number;
  additional_info?: string;
  connection_pool?: string;
  memory_usage?: string;
  active_sessions?: number;
  last_check?: string;
  [key: string]: unknown;
}

export interface SystemHealthResponse extends ApiResponse {
  status: string;
  timestamp: string;
  components: Record<string, HealthComponent>;
} 