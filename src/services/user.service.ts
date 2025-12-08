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
  AdminUserListResponse,
  UserSearchParams,
  UserSearchResponse,
  UpdateUserStatusResponse,
  ResetPasswordResponse,
  DeleteUserResponse,
  AdminProjectsResponse
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
    const response = await apiClient.postForm<RegisterResponse>('/auth/register', userData, true);
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

  // Update user details (Admin/Root) - uses form data per API spec
  // Note: user_type changes should use changeUserType method instead
  async updateUser(userHash: string, data: { username?: string; email?: string }): Promise<ApiResponse<User>> {
    return await apiClient.putForm<User>(`/users/${userHash}`, data);
  }

  // Delete user (soft-delete)
  async deleteUser(userHash: string): Promise<DeleteUserResponse> {
    const response = await apiClient.delete<DeleteUserResponse>(`/users/${userHash}`);
    return response as DeleteUserResponse;
  }

  // Search users by username or email
  async searchUsers(params: UserSearchParams): Promise<UserSearchResponse> {
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    const response = await apiClient.get<UserSearchResponse>('/users/search/query', cleanParams);
    return response as UserSearchResponse;
  }

  // Activate/Deactivate user - uses query param per API spec
  async toggleUserStatus(userHash: string, isActive: boolean): Promise<UpdateUserStatusResponse> {
    const response = await apiClient.put<UpdateUserStatusResponse>(
      `/users/${userHash}/status?is_active=${isActive}`
    );
    return response as UpdateUserStatusResponse;
  }

  // Reset user password (Admin) - returns temporary password
  async resetUserPassword(userHash: string): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<ResetPasswordResponse>(`/users/${userHash}/reset-password`);
    return response as ResetPasswordResponse;
  }

  // Change user type (ROOT only) - uses form data per API spec
  async changeUserType(userHash: string, newType: string): Promise<ApiResponse<User>> {
    return await apiClient.patchForm<User>(`/users/${userHash}/type`, { user_type: newType });
  }

  // Get user type information
  async getUserTypeInfo(userHash: string): Promise<ApiResponse<any>> {
    return await apiClient.get<any>(`/user-types/${userHash}/info`);
  }

  // Update user type with project assignment - uses form data per API spec
  async updateUserType(
    userHash: string,
    userType: string,
    assignedProjectId?: number
  ): Promise<ApiResponse<any>> {
    const data: Record<string, any> = { user_type: userType };
    if (assignedProjectId !== undefined) {
      data.assigned_project_id = assignedProjectId;
    }
    return await apiClient.putForm<any>(
      `/user-types/${userHash}/type`,
      data
    );
  }

  // Get admin user's assigned projects
  async getAdminProjects(userHash: string): Promise<AdminProjectsResponse> {
    const response = await apiClient.get<AdminProjectsResponse>(`/user-types/admin/${userHash}/projects`);
    return response as AdminProjectsResponse;
  }

  // Update admin user's projects (multi-project assignment) - uses form data per API spec
  async updateAdminProjects(
    userHash: string,
    projectIds: number[]
  ): Promise<ApiResponse<any>> {
    return await apiClient.putForm<any>(
      `/user-types/admin/${userHash}/projects`,
      { assigned_project_ids: projectIds }
    );
  }

  // Add admin to a project - uses form data per API spec
  async addAdminToProject(
    userHash: string,
    projectId: number
  ): Promise<ApiResponse<any>> {
    return await apiClient.postForm<any>(
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

  // Update admin user's single project (legacy endpoint) - uses form data
  async updateAdminProject(
    userHash: string,
    assignedProjectId: number
  ): Promise<ApiResponse<any>> {
    return await apiClient.putForm<any>(
      `/user-types/admin/${userHash}/project`,
      { assigned_project_id: assignedProjectId }
    );
  }
}

export const userService = new UserService();
export default userService; 