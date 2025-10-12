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

export interface HealthComponent {
  status: 'healthy' | 'warning' | 'critical' | 'unhealthy' | 'degraded';
  message?: string;
  response_time_ms?: number;
  additional_info?: string;
  connection_pool?: string;
  memory_usage?: string;
  active_sessions?: number;
}

export interface SystemHealthResponse extends ApiResponse {
  status: string;
  timestamp: string;
  components: Record<string, HealthComponent>;
} 