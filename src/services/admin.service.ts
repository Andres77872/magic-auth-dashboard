import { apiClient } from './api.client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';

class AdminService {
  // Dashboard Statistics
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return await apiClient.get<any>('/admin/dashboard/stats');
  }

  // Recent Activity
  async getRecentActivity(params: PaginationParams = {}): Promise<ApiResponse<any[]>> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    return await apiClient.get<any[]>('/admin/activity', cleanParams);
  }

  // User Statistics
  async getUserStatistics(): Promise<ApiResponse<any>> {
    return await apiClient.get<any>('/admin/users/statistics');
  }

  // Project Statistics
  async getProjectStatistics(): Promise<ApiResponse<any>> {
    return await apiClient.get<any>('/admin/projects/statistics');
  }

  // System Overview
  async getSystemOverview(): Promise<ApiResponse<any>> {
    return await apiClient.get<any>('/admin/system/overview');
  }

  // Admin Health Check
  async getAdminHealth(): Promise<ApiResponse<any>> {
    return await apiClient.get<any>('/admin/health');
  }

  // Get Activity Types
  async getActivityTypes(): Promise<ApiResponse<{ activity_types: string[] }>> {
    return await apiClient.get<{ activity_types: string[] }>('/admin/activity/types');
  }

  // Export Data
  async exportUsers(format: 'csv' | 'json' = 'csv'): Promise<ApiResponse<{ download_url: string }>> {
    return await apiClient.get<{ download_url: string }>(`/admin/export/users?format=${format}`);
  }

  async exportProjects(format: 'csv' | 'json' = 'csv'): Promise<ApiResponse<{ download_url: string }>> {
    return await apiClient.get<{ download_url: string }>(`/admin/export/projects?format=${format}`);
  }

  // Import Data
  async importUsers(file: File): Promise<ApiResponse<{ imported_count: number; errors: any[] }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    // Note: This would need a special method in ApiClient for FormData
    const response = await fetch(`${apiClient['baseURL']}/admin/import/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('magic_auth_token')}`,
      },
      body: formData,
    });
    
    return await response.json();
  }

  // Bulk Operations - uses form data per API spec
  async bulkUpdateUsers(
    userHashes: string[],
    options: {
      is_active?: boolean;
      user_type?: 'root' | 'admin' | 'consumer';
      force_password_reset?: boolean;
    }
  ): Promise<ApiResponse<{ updated_count: number; errors: any[] }>> {
    return await apiClient.postForm<{ updated_count: number; errors: any[] }>(
      '/admin/users/bulk-update',
      { user_hashes: userHashes, ...options }
    );
  }

  async bulkDeleteUsers(
    userHashes: string[],
    confirmDeletion: boolean = true
  ): Promise<ApiResponse<{ deleted_count: number }>> {
    return await apiClient.postForm<{ deleted_count: number }>(
      '/admin/users/bulk-delete',
      { user_hashes: userHashes, confirm_deletion: confirmDeletion }
    );
  }

  // Bulk Role Assignment - uses form data per API spec
  async bulkAssignRoles(
    assignmentsOrProjectHash: Array<{ user_hash: string; role_id: number; project_hash: string }> | string,
    userHashes?: string[],
    roleNames?: string[]
  ): Promise<ApiResponse<{ assigned_count: number; errors: any[] }>> {
    // If first parameter is an array, use the assignments format
    if (Array.isArray(assignmentsOrProjectHash)) {
      return await apiClient.postForm<{ assigned_count: number; errors: any[] }>(
        '/admin/bulk-assign-roles',
        { assignments: assignmentsOrProjectHash }
      );
    }
    // Otherwise, use the project-specific format
    return await apiClient.postForm<{ assigned_count: number; errors: any[] }>(
      `/admin/projects/${assignmentsOrProjectHash}/bulk-assign-roles`,
      { user_hashes: userHashes, role_names: roleNames }
    );
  }

  // Bulk Group Assignment
  async bulkAssignGroups(
    groupHash: string,
    userHashes: string[]
  ): Promise<ApiResponse<{ assigned_count: number; errors: any[] }>> {
    return await apiClient.post<{ assigned_count: number; errors: any[] }>(
      `/admin/user-groups/${groupHash}/members/bulk`,
      { user_hashes: userHashes }
    );
  }

  /**
   * Bulk assign multiple users to multiple groups - uses form data per API spec
   * POST /admin/user-groups/bulk-assign
   */
  async bulkAssignUsersToGroups(
    userHashes: string[],
    groupNames: string[]
  ): Promise<ApiResponse<{ assigned_count: number; errors: any[] }>> {
    return await apiClient.postForm<{ assigned_count: number; errors: any[] }>(
      '/admin/user-groups/bulk-assign',
      { user_hashes: userHashes, group_names: groupNames }
    );
  }
}

export const adminService = new AdminService();
export default adminService; 