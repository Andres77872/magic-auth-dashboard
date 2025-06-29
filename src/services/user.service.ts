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
import type { User } from '@/types/auth.types';
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
    
    const response = await apiClient.get<UserListResponse>('/users', cleanParams);
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

  // Get user by hash
  async getUserByHash(userHash: string): Promise<ApiResponse<User>> {
    return await apiClient.get<User>(`/users/${userHash}`);
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
    return await apiClient.patch<User>(`/users/${userHash}/status`, { is_active: isActive });
  }

  // Reset user password
  async resetUserPassword(userHash: string): Promise<ApiResponse<{ new_password: string }>> {
    return await apiClient.post<{ new_password: string }>(`/users/${userHash}/reset-password`);
  }

  // Change user type (ROOT only)
  async changeUserType(userHash: string, newType: string): Promise<ApiResponse<User>> {
    return await apiClient.patch<User>(`/users/${userHash}/type`, { user_type: newType });
  }
}

export const userService = new UserService();
export default userService; 