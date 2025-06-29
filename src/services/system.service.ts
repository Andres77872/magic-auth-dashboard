import { apiClient } from './api.client';
import type {
  SystemInfoResponse,
  SystemHealthResponse
} from '@/types/system.types';
import type { ApiResponse, PaginationParams } from '@/types/api.types';

class SystemService {
  // System Information
  async getSystemInfo(): Promise<SystemInfoResponse> {
    const response = await apiClient.get<SystemInfoResponse>('/system/info');
    return response as SystemInfoResponse;
  }

  // System Health
  async getSystemHealth(): Promise<SystemHealthResponse> {
    const response = await apiClient.get<SystemHealthResponse>('/system/health');
    return response as SystemHealthResponse;
  }

  // Admin Management (ROOT only)
  async getAdminUsers(params: PaginationParams = {}): Promise<ApiResponse<any[]>> {
    return await apiClient.get<any[]>('/system/admins', params as any);
  }

  async createAdminUser(adminData: any): Promise<ApiResponse<any>> {
    return await apiClient.post<any>('/system/admins', adminData);
  }

  async updateAdminUser(userHash: string, data: any): Promise<ApiResponse<any>> {
    return await apiClient.put<any>(`/system/admins/${userHash}`, data);
  }

  async deleteAdminUser(userHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/system/admins/${userHash}`);
  }

  // Audit Logs
  async getAuditLogs(params: PaginationParams = {}): Promise<ApiResponse<any[]>> {
    return await apiClient.get<any[]>('/system/audit-logs', params as any);
  }

  // System Settings
  async getSystemSettings(): Promise<ApiResponse<any>> {
    return await apiClient.get<any>('/system/settings');
  }

  async updateSystemSettings(settings: any): Promise<ApiResponse<any>> {
    return await apiClient.put<any>('/system/settings', settings);
  }

  // System Maintenance
  async performSystemBackup(): Promise<ApiResponse<{ backup_id: string; status: string }>> {
    return await apiClient.post<{ backup_id: string; status: string }>('/system/backup');
  }

  async getSystemMetrics(): Promise<ApiResponse<any>> {
    return await apiClient.get<any>('/system/metrics');
  }

  // Cache Management
  async clearSystemCache(): Promise<ApiResponse<void>> {
    return await apiClient.post<void>('/system/cache/clear');
  }

  async getCacheStatus(): Promise<ApiResponse<any>> {
    return await apiClient.get<any>('/system/cache/status');
  }

  // Session Management
  async getActiveSessions(): Promise<ApiResponse<any[]>> {
    return await apiClient.get<any[]>('/system/sessions');
  }

  async terminateSession(sessionId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/system/sessions/${sessionId}`);
  }

  async terminateAllSessions(): Promise<ApiResponse<{ terminated_count: number }>> {
    return await apiClient.post<{ terminated_count: number }>('/system/sessions/terminate-all');
  }
}

export const systemService = new SystemService();
export default systemService; 