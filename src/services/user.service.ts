import { apiClient } from './api.client';
import type {
  CreateRootUserRequest,
  CreateAdminUserRequest,
  CreateRootUserResponse,
  CreateAdminUserResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserListParams,
  UserListResponse,
  AdminUserListResponse
} from '@/types/user.types';
import type { User, UserProfileResponse } from '@/types/auth.types';
import type { ApiResponse } from '@/types/api.types';
import type { RegisterRequest, RegisterResponse } from '@/types/auth.types';

class UserService {
  // Get current user profile
  async getProfile(): Promise<ApiResponse<User>> {
    return await apiClient.get<User>('/users/profile');
  }

  // Update current user profile
  async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const response = await apiClient.put<UpdateProfileResponse>('/users/profile', data);
    return response as UpdateProfileResponse;
  }

  // Get user access summary
  async getUserAccessSummary(): Promise<ApiResponse<any>> {
    return await apiClient.get<any>('/users/access-summary');
  }

  // Create ROOT user (ROOT only)
  async createRootUser(userData: CreateRootUserRequest): Promise<CreateRootUserResponse> {
    const response = await apiClient.post<CreateRootUserResponse>('/user-types/root', userData);
    return response as CreateRootUserResponse;
  }

  // Create ADMIN user (ROOT only)
  async createAdminUser(userData: CreateAdminUserRequest): Promise<CreateAdminUserResponse> {
    const response = await apiClient.post<CreateAdminUserResponse>('/user-types/admin', userData);
    return response as CreateAdminUserResponse;
  }

  // Create CONSUMER user (via registration)
  async createConsumerUser(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', userData);
    return response as RegisterResponse;
  }

  // List users with filtering
  async getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    const response = await apiClient.get<UserListResponse>('/users/list', cleanParams);
    return response as UserListResponse;
  }

  // List admin users (ROOT only)
  async getAdminUsers(params: { limit?: number; offset?: number } = {}): Promise<AdminUserListResponse> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    const response = await apiClient.get<AdminUserListResponse>('/user-types/users/admin', cleanParams);
    return response as AdminUserListResponse;
  }

  // Get user by hash - Updated to handle new API response structure
  async getUserByHash(userHash: string): Promise<UserProfileResponse> {
    const response = await apiClient.get<UserProfileResponse>(`/users/${userHash}`);
    return response as UserProfileResponse;
  }

  // Update user
  async updateUser(userHash: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return await apiClient.put<User>(`/users/${userHash}`, data);
  }

  // Delete user
  async deleteUser(userHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/users/${userHash}`);
  }

  // Activate/Deactivate user
  async toggleUserStatus(userHash: string, isActive: boolean): Promise<ApiResponse<User>> {
    return await apiClient.put<User>(`/users/${userHash}/status`, { is_active: isActive });
  }

  // Reset user password
  async resetUserPassword(userHash: string): Promise<ApiResponse<{ new_password: string }>> {
    return await apiClient.post<{ new_password: string }>(`/users/${userHash}/reset-password`);
  }

  // Change user type (ROOT only)
  async changeUserType(userHash: string, newType: string): Promise<ApiResponse<User>> {
    return await apiClient.patch<User>(`/users/${userHash}/type`, { user_type: newType });
  }

  // Get user type information
  async getUserTypeInfo(userHash: string): Promise<ApiResponse<any>> {
    return await apiClient.get<any>(`/user-types/${userHash}/info`);
  }

  // Update user type with project assignment
  async updateUserType(
    userHash: string,
    userType: string,
    assignedProjectId?: number
  ): Promise<ApiResponse<any>> {
    return await apiClient.put<any>(
      `/user-types/${userHash}/type`,
      { user_type: userType, assigned_project_id: assignedProjectId }
    );
  }

  // Get admin user's assigned projects
  async getAdminProjects(userHash: string): Promise<ApiResponse<any>> {
    return await apiClient.get<any>(`/user-types/admin/${userHash}/projects`);
  }

  // Update admin user's projects (multi-project assignment)
  async updateAdminProjects(
    userHash: string,
    projectIds: number[]
  ): Promise<ApiResponse<any>> {
    return await apiClient.put<any>(
      `/user-types/admin/${userHash}/projects`,
      { assigned_project_ids: projectIds }
    );
  }

  // Add admin to a project
  async addAdminToProject(
    userHash: string,
    projectId: number
  ): Promise<ApiResponse<any>> {
    return await apiClient.post<any>(
      `/user-types/admin/${userHash}/projects/add`,
      { project_id: projectId }
    );
  }

  // Remove admin from a project
  async removeAdminFromProject(
    userHash: string,
    projectId: number
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/user-types/admin/${userHash}/projects/${projectId}`
    );
  }

  // Get user type statistics
  async getUserTypeStats(): Promise<ApiResponse<any>> {
    return await apiClient.get<any>('/user-types/stats');
  }

  // List users by type (ROOT, ADMIN, CONSUMER)
  async getUsersByType(
    userType: 'root' | 'admin' | 'consumer',
    params: { limit?: number; offset?: number } = {}
  ): Promise<ApiResponse<any[]>> {
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    return await apiClient.get<any[]>(
      `/user-types/users/${userType}`,
      cleanParams
    );
  }

  // Update admin user's single project (legacy endpoint)
  async updateAdminProject(
    userHash: string,
    assignedProjectId: number
  ): Promise<ApiResponse<any>> {
    return await apiClient.put<any>(
      `/user-types/admin/${userHash}/project`,
      { assigned_project_id: assignedProjectId }
    );
  }
}

export const userService = new UserService();
export default userService; 