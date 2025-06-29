import type { ApiResponse } from './api.types';

export interface SystemInfo {
  version: string;
  environment: string;
  database_status: string;
  cache_status: string;
}

export interface SystemStatistics {
  total_users: number;
  total_projects: number;
  active_sessions: number;
  root_users: number;
  admin_users: number;
  consumer_users: number;
}

export interface SystemInfoResponse extends ApiResponse {
  system: SystemInfo;
  statistics: SystemStatistics;
  features: string[];
}

export interface HealthComponent {
  status: 'healthy' | 'warning' | 'error';
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