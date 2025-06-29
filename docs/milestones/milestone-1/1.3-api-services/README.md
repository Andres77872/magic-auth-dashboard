# Milestone 1.3: API Service Layer

## Overview
**Duration**: Day 5-7  
**Goal**: Create a comprehensive API service layer using native fetch with proper error handling, token management, and service modules for all endpoints

## 📋 Tasks Checklist

### Step 1: Core API Client
- [ ] Create base fetch wrapper with interceptors
- [ ] Implement request/response handling
- [ ] Add error handling and retry logic
- [ ] Implement token management

### Step 2: Authentication Services
- [ ] Login and logout functionality
- [ ] Session validation and refresh
- [ ] User registration services

### Step 3: User Management Services
- [ ] User CRUD operations
- [ ] User type management (ROOT/ADMIN creation)
- [ ] User profile management

### Step 4: Project Management Services
- [ ] Project CRUD operations
- [ ] Project member management
- [ ] Project activity tracking

### Step 5: Group Management Services
- [ ] User group CRUD operations
- [ ] Group member assignment
- [ ] Group permission management

### Step 6: RBAC Services
- [ ] Permission management
- [ ] Role management
- [ ] Permission checking and assignment

### Step 7: System Services
- [ ] System health monitoring
- [ ] Admin management
- [ ] System information retrieval

---

## 🔧 Detailed Implementation Steps

### Step 1: Core API Client

Create `src/services/api.client.ts`:
```typescript
import { API_CONFIG, HTTP_STATUS, STORAGE_KEYS } from '@/utils/constants';
import { ApiResponse, HttpMethod } from '@/types/api.types';

interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number>;
  skipAuth?: boolean;
  retries?: number;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  private getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  private buildURL(endpoint: string, params?: Record<string, string | number>): string {
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    return url.toString();
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      throw new Error(`Unexpected response type: ${contentType}`);
    }

    const data = await response.json();

    if (!response.ok) {
      // Handle specific HTTP status codes
      switch (response.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          // Clear stored auth data on 401
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          window.location.href = '/login';
          break;
        case HTTP_STATUS.FORBIDDEN:
          throw new Error('Access denied. Insufficient permissions.');
        case HTTP_STATUS.NOT_FOUND:
          throw new Error('Resource not found.');
        case HTTP_STATUS.UNPROCESSABLE_ENTITY:
          // Return validation errors as-is
          return data;
        default:
          throw new Error(data.message || `HTTP Error: ${response.status}`);
      }
    }

    return data;
  }

  private async requestWithRetry<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const maxRetries = config.retries ?? API_CONFIG.RETRY_ATTEMPTS;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const url = this.buildURL(endpoint, config.params);
        const token = this.getAuthToken();
        
        const headers: Record<string, string> = {
          ...this.defaultHeaders,
          ...config.headers,
        };

        // Add auth header if token exists and auth is not skipped
        if (token && !config.skipAuth) {
          headers.Authorization = `Bearer ${token}`;
        }

        const requestInit: RequestInit = {
          method: config.method,
          headers,
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
        };

        // Add body for non-GET requests
        if (config.body && config.method !== HttpMethod.GET) {
          requestInit.body = JSON.stringify(config.body);
        }

        const response = await fetch(url, requestInit);
        return await this.handleResponse<T>(response);

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof Error) {
          const isRetryableError = 
            error.name === 'NetworkError' ||
            error.name === 'TimeoutError' ||
            error.message.includes('fetch');
            
          if (!isRetryableError || attempt === maxRetries) {
            throw error;
          }
        }

        // Wait before retrying
        if (attempt < maxRetries) {
          await this.sleep(API_CONFIG.RETRY_DELAY * Math.pow(2, attempt));
        }
      }
    }

    throw lastError!;
  }

  // Public HTTP methods
  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.GET,
      params,
    });
  }

  async post<T>(endpoint: string, data?: any, skipAuth = false): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.POST,
      body: data,
      skipAuth,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.PUT,
      body: data,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.DELETE,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.PATCH,
      body: data,
    });
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  clearAuthToken(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
```

### Step 2: Authentication Services

Create `src/services/auth.service.ts`:
```typescript
import { apiClient } from './api.client';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest,
  RegisterResponse,
  SessionValidationResponse,
  AvailabilityCheckRequest,
  AvailabilityCheckResponse 
} from '@/types/auth.types';
import { ApiResponse } from '@/types/api.types';

class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login', 
      credentials,
      true // Skip auth for login
    );
    
    if (response.success && response.session_token) {
      // Store token on successful login
      apiClient.setAuthToken(response.session_token);
    }
    
    return response;
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return await apiClient.post<RegisterResponse>(
      '/auth/register',
      userData,
      true // Skip auth for registration
    );
  }

  // Validate current session
  async validateSession(): Promise<SessionValidationResponse> {
    return await apiClient.get<SessionValidationResponse>('/auth/validate');
  }

  // Check username/email availability
  async checkAvailability(data: AvailabilityCheckRequest): Promise<AvailabilityCheckResponse> {
    return await apiClient.post<AvailabilityCheckResponse>(
      '/auth/check-availability',
      data,
      true // Skip auth
    );
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if it exists
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local auth data
      apiClient.clearAuthToken();
    }
  }

  // Refresh token (if needed)
  async refreshToken(): Promise<LoginResponse> {
    return await apiClient.post<LoginResponse>('/auth/refresh');
  }
}

export const authService = new AuthService();
export default authService;
```

### Step 3: User Management Services

Create `src/services/user.service.ts`:
```typescript
import { apiClient } from './api.client';
import {
  User,
  CreateRootUserRequest,
  CreateAdminUserRequest,
  UserCreationResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  UserListParams,
  UserListResponse,
  AdminUsersResponse
} from '@/types/user.types';
import { ApiResponse } from '@/types/api.types';

class UserService {
  // Get current user profile
  async getProfile(): Promise<ApiResponse<User>> {
    return await apiClient.get<User>('/users/profile');
  }

  // Update current user profile
  async updateProfile(data: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> {
    return await apiClient.put<UpdateUserProfileResponse>('/users/profile', data);
  }

  // Create ROOT user (ROOT only)
  async createRootUser(userData: CreateRootUserRequest): Promise<UserCreationResponse> {
    return await apiClient.post<UserCreationResponse>('/user-types/root', userData);
  }

  // Create ADMIN user (ROOT only)
  async createAdminUser(userData: CreateAdminUserRequest): Promise<UserCreationResponse> {
    return await apiClient.post<UserCreationResponse>('/user-types/admin', userData);
  }

  // Create CONSUMER user (via registration)
  async createConsumerUser(userData: RegisterRequest): Promise<RegisterResponse> {
    return await apiClient.post<RegisterResponse>('/auth/register', userData);
  }

  // List users with filtering
  async getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    return await apiClient.get<UserListResponse>('/users', params);
  }

  // List admin users (ROOT only)
  async getAdminUsers(params: { limit?: number; offset?: number } = {}): Promise<AdminUsersResponse> {
    return await apiClient.get<AdminUsersResponse>('/user-types/users/admin', params);
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
```

### Step 4: Project Management Services

Create `src/services/project.service.ts`:
```typescript
import { apiClient } from './api.client';
import {
  ProjectDetails,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectResponse,
  ProjectListParams,
  ProjectListResponse,
  ProjectMembersResponse,
  ProjectActivityResponse
} from '@/types/project.types';
import { ApiResponse, PaginationParams } from '@/types/api.types';

class ProjectService {
  // List projects
  async getProjects(params: ProjectListParams = {}): Promise<ProjectListResponse> {
    return await apiClient.get<ProjectListResponse>('/projects', params);
  }

  // Get project details
  async getProject(projectHash: string): Promise<ApiResponse<ProjectDetails>> {
    return await apiClient.get<ProjectDetails>(`/projects/${projectHash}`);
  }

  // Create new project
  async createProject(projectData: CreateProjectRequest): Promise<ProjectResponse> {
    return await apiClient.post<ProjectResponse>('/projects', projectData);
  }

  // Update project
  async updateProject(projectHash: string, data: UpdateProjectRequest): Promise<ProjectResponse> {
    return await apiClient.put<ProjectResponse>(`/projects/${projectHash}`, data);
  }

  // Delete project
  async deleteProject(projectHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/projects/${projectHash}`);
  }

  // Get project members
  async getProjectMembers(
    projectHash: string, 
    params: PaginationParams = {}
  ): Promise<ProjectMembersResponse> {
    return await apiClient.get<ProjectMembersResponse>(`/projects/${projectHash}/members`, params);
  }

  // Add member to project
  async addProjectMember(
    projectHash: string, 
    userHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.post<void>(`/projects/${projectHash}/members`, { user_hash: userHash });
  }

  // Remove member from project
  async removeProjectMember(
    projectHash: string, 
    userHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/projects/${projectHash}/members/${userHash}`);
  }

  // Get project activity
  async getProjectActivity(
    projectHash: string,
    params: PaginationParams = {}
  ): Promise<ProjectActivityResponse> {
    return await apiClient.get<ProjectActivityResponse>(`/projects/${projectHash}/activity`, params);
  }

  // Get project statistics
  async getProjectStats(projectHash: string): Promise<ApiResponse<any>> {
    return await apiClient.get<any>(`/projects/${projectHash}/stats`);
  }

  // Transfer project ownership
  async transferOwnership(
    projectHash: string, 
    newOwnerHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.patch<void>(`/projects/${projectHash}/owner`, { 
      new_owner_hash: newOwnerHash 
    });
  }

  // Archive/Unarchive project
  async toggleProjectArchive(
    projectHash: string, 
    archived: boolean
  ): Promise<ApiResponse<ProjectDetails>> {
    return await apiClient.patch<ProjectDetails>(`/projects/${projectHash}/archive`, { archived });
  }
}

export const projectService = new ProjectService();
export default projectService;
```

### Step 5: Group Management Services

Create `src/services/group.service.ts`:
```typescript
import { apiClient } from './api.client';
import {
  UserGroup,
  CreateGroupRequest,
  UpdateGroupRequest,
  GroupResponse,
  GroupMemberAssignmentRequest,
  GroupMemberAssignmentResponse,
  GroupListResponse,
  GroupMembersResponse
} from '@/types/group.types';
import { ApiResponse, PaginationParams } from '@/types/api.types';

class GroupService {
  // List user groups
  async getGroups(params: PaginationParams = {}): Promise<GroupListResponse> {
    return await apiClient.get<GroupListResponse>('/admin/user-groups', params);
  }

  // Get group details
  async getGroup(groupHash: string): Promise<ApiResponse<UserGroup>> {
    return await apiClient.get<UserGroup>(`/admin/user-groups/${groupHash}`);
  }

  // Create new group
  async createGroup(groupData: CreateGroupRequest): Promise<GroupResponse> {
    return await apiClient.post<GroupResponse>('/admin/user-groups', groupData);
  }

  // Update group
  async updateGroup(groupHash: string, data: UpdateGroupRequest): Promise<GroupResponse> {
    return await apiClient.put<GroupResponse>(`/admin/user-groups/${groupHash}`, data);
  }

  // Delete group
  async deleteGroup(groupHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/admin/user-groups/${groupHash}`);
  }

  // Get group members
  async getGroupMembers(
    groupHash: string,
    params: PaginationParams = {}
  ): Promise<GroupMembersResponse> {
    return await apiClient.get<GroupMembersResponse>(
      `/admin/user-groups/${groupHash}/members`, 
      params
    );
  }

  // Add user to group
  async addMemberToGroup(
    groupHash: string,
    memberData: GroupMemberAssignmentRequest
  ): Promise<GroupMemberAssignmentResponse> {
    return await apiClient.post<GroupMemberAssignmentResponse>(
      `/admin/user-groups/${groupHash}/members`,
      memberData
    );
  }

  // Remove user from group
  async removeMemberFromGroup(
    groupHash: string,
    userHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/admin/user-groups/${groupHash}/members/${userHash}`
    );
  }

  // Bulk add members to group
  async bulkAddMembers(
    groupHash: string,
    userHashes: string[]
  ): Promise<ApiResponse<{ added_count: number; errors: any[] }>> {
    return await apiClient.post<{ added_count: number; errors: any[] }>(
      `/admin/user-groups/${groupHash}/members/bulk`,
      { user_hashes: userHashes }
    );
  }

  // Get groups for a specific user
  async getUserGroups(userHash: string): Promise<ApiResponse<UserGroup[]>> {
    return await apiClient.get<UserGroup[]>(`/admin/users/${userHash}/groups`);
  }
}

export const groupService = new GroupService();
export default groupService;
```

### Step 6: RBAC Services

Create `src/services/rbac.service.ts`:
```typescript
import { apiClient } from './api.client';
import {
  Permission,
  Role,
  UserRoleAssignment,
  PermissionCheckRequest,
  PermissionCheckResponse,
  UserEffectivePermissionsResponse,
  CreatePermissionRequest,
  CreateRoleRequest,
  AssignRoleRequest,
  RoleAssignmentResponse,
  PermissionsListResponse,
  RolesListResponse
} from '@/types/rbac.types';
import { ApiResponse, PaginationParams } from '@/types/api.types';

class RBACService {
  // Permission Management
  async getPermissions(
    projectHash: string,
    params: PaginationParams = {}
  ): Promise<PermissionsListResponse> {
    return await apiClient.get<PermissionsListResponse>(
      `/rbac/projects/${projectHash}/permissions`,
      params
    );
  }

  async createPermission(
    projectHash: string,
    permissionData: CreatePermissionRequest
  ): Promise<ApiResponse<Permission>> {
    return await apiClient.post<Permission>(
      `/rbac/projects/${projectHash}/permissions`,
      permissionData
    );
  }

  async updatePermission(
    projectHash: string,
    permissionId: number,
    data: Partial<CreatePermissionRequest>
  ): Promise<ApiResponse<Permission>> {
    return await apiClient.put<Permission>(
      `/rbac/projects/${projectHash}/permissions/${permissionId}`,
      data
    );
  }

  async deletePermission(
    projectHash: string,
    permissionId: number
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/rbac/projects/${projectHash}/permissions/${permissionId}`
    );
  }

  // Role Management
  async getRoles(
    projectHash: string,
    params: PaginationParams = {}
  ): Promise<RolesListResponse> {
    return await apiClient.get<RolesListResponse>(
      `/rbac/projects/${projectHash}/roles`,
      params
    );
  }

  async createRole(
    projectHash: string,
    roleData: CreateRoleRequest
  ): Promise<ApiResponse<Role>> {
    return await apiClient.post<Role>(
      `/rbac/projects/${projectHash}/roles`,
      roleData
    );
  }

  async updateRole(
    projectHash: string,
    roleId: number,
    data: Partial<CreateRoleRequest>
  ): Promise<ApiResponse<Role>> {
    return await apiClient.put<Role>(
      `/rbac/projects/${projectHash}/roles/${roleId}`,
      data
    );
  }

  async deleteRole(
    projectHash: string,
    roleId: number
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/rbac/projects/${projectHash}/roles/${roleId}`
    );
  }

  // Role Assignments
  async assignUserToRole(
    userHash: string,
    projectHash: string,
    roleData: AssignRoleRequest
  ): Promise<RoleAssignmentResponse> {
    return await apiClient.post<RoleAssignmentResponse>(
      `/rbac/users/${userHash}/projects/${projectHash}/roles`,
      roleData
    );
  }

  async removeUserFromRole(
    userHash: string,
    projectHash: string,
    roleId: number
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/rbac/users/${userHash}/projects/${projectHash}/roles/${roleId}`
    );
  }

  // Permission Checking
  async getUserEffectivePermissions(
    userHash: string,
    projectHash: string
  ): Promise<UserEffectivePermissionsResponse> {
    return await apiClient.get<UserEffectivePermissionsResponse>(
      `/rbac/users/${userHash}/projects/${projectHash}/permissions`
    );
  }

  async checkUserPermission(
    userHash: string,
    projectHash: string,
    permissionName: string
  ): Promise<PermissionCheckResponse> {
    return await apiClient.get<PermissionCheckResponse>(
      `/rbac/users/${userHash}/projects/${projectHash}/check/${permissionName}`
    );
  }

  // Bulk Operations
  async bulkAssignRoles(
    projectHash: string,
    assignments: Array<{ user_hash: string; role_ids: number[] }>
  ): Promise<ApiResponse<{ success_count: number; errors: any[] }>> {
    return await apiClient.post<{ success_count: number; errors: any[] }>(
      `/rbac/projects/${projectHash}/bulk-assign`,
      { assignments }
    );
  }

  // Permission Matrix
  async getPermissionMatrix(projectHash: string): Promise<ApiResponse<any>> {
    return await apiClient.get<any>(`/rbac/projects/${projectHash}/matrix`);
  }

  // User Role History
  async getUserRoleHistory(
    userHash: string,
    projectHash: string
  ): Promise<ApiResponse<UserRoleAssignment[]>> {
    return await apiClient.get<UserRoleAssignment[]>(
      `/rbac/users/${userHash}/projects/${projectHash}/history`
    );
  }
}

export const rbacService = new RBACService();
export default rbacService;
```

### Step 7: System Services

Create `src/services/system.service.ts`:
```typescript
import { apiClient } from './api.client';
import {
  SystemInfoResponse,
  SystemHealthResponse,
  AdminUser,
  AuditLogResponse,
  SystemSettings
} from '@/types/system.types';
import { ApiResponse, PaginationParams } from '@/types/api.types';

class SystemService {
  // System Information
  async getSystemInfo(): Promise<SystemInfoResponse> {
    return await apiClient.get<SystemInfoResponse>('/system/info');
  }

  // System Health
  async getSystemHealth(): Promise<SystemHealthResponse> {
    return await apiClient.get<SystemHealthResponse>('/system/health');
  }

  // Admin Management (ROOT only)
  async getAdminUsers(params: PaginationParams = {}): Promise<ApiResponse<AdminUser[]>> {
    return await apiClient.get<AdminUser[]>('/system/admins', params);
  }

  async createAdminUser(adminData: any): Promise<ApiResponse<AdminUser>> {
    return await apiClient.post<AdminUser>('/system/admins', adminData);
  }

  async updateAdminUser(userHash: string, data: any): Promise<ApiResponse<AdminUser>> {
    return await apiClient.put<AdminUser>(`/system/admins/${userHash}`, data);
  }

  async deleteAdminUser(userHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/system/admins/${userHash}`);
  }

  // Audit Logs
  async getAuditLogs(params: PaginationParams = {}): Promise<AuditLogResponse> {
    return await apiClient.get<AuditLogResponse>('/system/audit-logs', params);
  }

  // System Settings
  async getSystemSettings(): Promise<ApiResponse<SystemSettings>> {
    return await apiClient.get<SystemSettings>('/system/settings');
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> {
    return await apiClient.put<SystemSettings>('/system/settings', settings);
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
```

### Step 8: Admin Services

Create `src/services/admin.service.ts`:
```typescript
import { apiClient } from './api.client';
import { ApiResponse, PaginationParams } from '@/types/api.types';

class AdminService {
  // Dashboard Statistics
  async getDashboardStats(): Promise<ApiResponse<any>> {
    return await apiClient.get<any>('/admin/dashboard/stats');
  }

  // Recent Activity
  async getRecentActivity(params: PaginationParams = {}): Promise<ApiResponse<any[]>> {
    return await apiClient.get<any[]>('/admin/activity', params);
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
    const response = await fetch(`${apiClient.baseURL}/admin/import/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('magic_auth_token')}`,
      },
      body: formData,
    });
    
    return await response.json();
  }

  // Bulk Operations
  async bulkUpdateUsers(
    userHashes: string[],
    updates: any
  ): Promise<ApiResponse<{ updated_count: number; errors: any[] }>> {
    return await apiClient.post<{ updated_count: number; errors: any[] }>(
      '/admin/users/bulk-update',
      { user_hashes: userHashes, updates }
    );
  }

  async bulkDeleteUsers(userHashes: string[]): Promise<ApiResponse<{ deleted_count: number }>> {
    return await apiClient.post<{ deleted_count: number }>(
      '/admin/users/bulk-delete',
      { user_hashes: userHashes }
    );
  }
}

export const adminService = new AdminService();
export default adminService;
```

### Step 9: Service Index File

Create `src/services/index.ts`:
```typescript
// Export all services
export { default as apiClient } from './api.client';
export { default as authService } from './auth.service';
export { default as userService } from './user.service';
export { default as projectService } from './project.service';
export { default as groupService } from './group.service';
export { default as rbacService } from './rbac.service';
export { default as systemService } from './system.service';
export { default as adminService } from './admin.service';

// Named exports
export {
  apiClient,
  authService,
  userService,
  projectService,
  groupService,
  rbacService,
  systemService,
  adminService,
};
```

### Step 10: Error Handling Utilities

Create `src/utils/error-handler.ts`:
```typescript
import { ApiResponse } from '@/types/api.types';
import { ERROR_MESSAGES } from './constants';

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status = 500, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function handleApiError(error: any): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error.name === 'TimeoutError') {
    return 'Request timed out. Please try again.';
  }

  return error.message || ERROR_MESSAGES.INTERNAL_ERROR;
}

export function isApiResponse<T>(response: any): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.success === 'boolean' &&
    typeof response.message === 'string'
  );
}

export function extractErrorMessage(response: ApiResponse<any>): string {
  if (response.success) {
    return '';
  }

  // Handle validation errors
  if (response.detail && Array.isArray(response.detail)) {
    return response.detail
      .map(err => `${err.loc.join('.')}: ${err.msg}`)
      .join(', ');
  }

  return response.message || ERROR_MESSAGES.INTERNAL_ERROR;
}
```

---

## 🧪 Testing & Verification

### Basic API Testing
Create a temporary test file to verify the API client:

```typescript
// src/test-api.ts (temporary)
import { authService, userService, systemService } from '@/services';

async function testApi() {
  try {
    // Test system info (public endpoint)
    const systemInfo = await systemService.getSystemInfo();
    console.log('System Info:', systemInfo);

    // Test authentication
    const loginResponse = await authService.login({
      username: 'test_admin',
      password: 'test_password'
    });
    console.log('Login successful:', loginResponse.success);

    // Test authenticated endpoint
    if (loginResponse.success) {
      const profile = await userService.getProfile();
      console.log('User profile:', profile);
    }

  } catch (error) {
    console.error('API test failed:', error);
  }
}

// Run test (remove this file after testing)
testApi();
```

### Error Handling Test
```typescript
// Test error scenarios
async function testErrorHandling() {
  try {
    // Test 404 error
    await userService.getUserByHash('nonexistent-hash');
  } catch (error) {
    console.log('404 Error handled:', error.message);
  }

  try {
    // Test unauthorized access
    await systemService.getSystemHealth(); // Without token
  } catch (error) {
    console.log('Auth Error handled:', error.message);
  }
}
```

### Network Retry Test
```typescript
// Test network retry functionality
async function testRetry() {
  // This will attempt retries on network failure
  try {
    const response = await systemService.getSystemInfo();
    console.log('Request successful or retries exhausted');
  } catch (error) {
    console.log('All retries failed:', error.message);
  }
}
```

---

## 📁 Files Created

### Core API Infrastructure
- `src/services/api.client.ts` - Native fetch wrapper with interceptors
- `src/services/index.ts` - Service exports

### Service Modules
- `src/services/auth.service.ts` - Authentication services
- `src/services/user.service.ts` - User management services
- `src/services/project.service.ts` - Project management services
- `src/services/group.service.ts` - Group management services
- `src/services/rbac.service.ts` - RBAC services
- `src/services/system.service.ts` - System services
- `src/services/admin.service.ts` - Admin services

### Utilities
- `src/utils/error-handler.ts` - Error handling utilities

---

## ✅ Completion Criteria

- [ ] Native fetch API client working with proper error handling
- [ ] All authentication endpoints integrated
- [ ] User management CRUD operations implemented
- [ ] Project management services complete
- [ ] Group management functionality working
- [ ] RBAC services with permission checking
- [ ] System health and admin services
- [ ] Token management and auto-refresh
- [ ] Request retry logic functioning
- [ ] Error handling for all scenarios
- [ ] TypeScript types properly implemented
- [ ] No compilation errors

## 🔍 Testing Checklist

- [ ] API client connects to backend successfully
- [ ] Authentication flow works (login/logout)
- [ ] Token storage and retrieval working
- [ ] Error handling displays appropriate messages
- [ ] Retry logic activates on network failures
- [ ] Request timeouts handled gracefully
- [ ] Unauthorized requests redirect to login
- [ ] All service methods return proper types
- [ ] Pagination parameters work correctly
- [ ] File upload functionality (if needed) works

## 🚀 Next Steps

After completing this milestone:
1. Proceed to **Milestone 2: Authentication & Route Guards**
2. Begin implementing React contexts and route protection
3. Create the login page and authentication flow
4. Test the complete authentication system

## 📝 Notes

- The API client uses native fetch with modern features like AbortSignal.timeout()
- Error handling includes automatic token cleanup on 401 responses
- Retry logic uses exponential backoff for network failures
- All services are strongly typed with TypeScript
- Token management is centralized in the API client
- Services can be easily mocked for testing 