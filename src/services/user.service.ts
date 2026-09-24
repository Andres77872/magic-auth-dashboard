import {
  deleteJson,
  getJson,
  patchFormJson,
  postFormJson,
  putFormJson,
  putJson,
  seg,
} from './request';
import type {
  AdminProjectsResponse,
  BulkUserOperationResponse,
  ChangeUserTypeResponse,
  CreateAdminUserRequest,
  CreateAdminUserResponse,
  CreateRootUserRequest,
  CreateRootUserResponse,
  DeleteUserResponse,
  HardDeleteUserResponse,
  ResetPasswordResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UpdateUserStatusResponse,
  UserEmailsResponse,
  UserListParams,
  UserListResponse,
  UserSearchParams,
  UserSearchResponse,
} from '@/types/user.types';
import type { User, UserProfileResponse, UserType } from '@/types/auth.types';
import type { ApiResponse } from '@/types/api.types';

/**
 * User management (`/users/*`, `/user-types/*`, `/admin/users/*`). All writes
 * are Form encoded except where noted.
 *
 * There is intentionally no "create consumer" method: the only consumer
 * sign-up route is the public `POST /auth/register`, which signs the new user
 * in and would replace the operator's session cookies.
 */
class UserService {
  // Directory ---------------------------------------------------------------

  async getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    return await getJson<UserListResponse>('/users/list', { ...params });
  }

  async searchUsers(params: UserSearchParams): Promise<UserSearchResponse> {
    return await getJson<UserSearchResponse>('/users/search/query', {
      ...params,
    });
  }

  /**
   * `GET /users/{hash}`. Group hierarchy adds `projects_count` to groups;
   * permission details add `effective_permissions`/`access_groups` to projects.
   */
  async getUserByHash(
    userHash: string,
    options: {
      include_group_hierarchy?: boolean;
      include_permission_details?: boolean;
    } = {}
  ): Promise<UserProfileResponse> {
    return await getJson<UserProfileResponse>(
      `/users/${seg(userHash)}`,
      options
    );
  }

  /**
   * `GET /users/profile` — the caller's own account. The response is flat
   * (account fields at the top level, not under `user`).
   */
  async getMyProfile(): Promise<User> {
    const res = await getJson<Partial<User> & { success?: boolean }>(
      '/users/profile'
    );
    if (!res.user_hash || !res.username || !res.user_type) {
      throw new Error('Your profile could not be read from the response.');
    }
    return {
      user_hash: res.user_hash,
      username: res.username,
      email: res.email ?? '',
      user_type: res.user_type,
      user_type_info: res.user_type_info,
      created_at: res.created_at ?? '',
      updated_at: res.updated_at ?? null,
      last_login: res.last_login ?? null,
      is_active: res.is_active ?? true,
      groups: res.groups ?? [],
      projects: res.projects ?? [],
    };
  }

  async getUserEmails(userHash: string): Promise<UserEmailsResponse> {
    return await getJson<UserEmailsResponse>(`/users/${seg(userHash)}/emails`);
  }

  // Creation (root only) ----------------------------------------------------

  async createRootUser(
    data: CreateRootUserRequest
  ): Promise<CreateRootUserResponse> {
    return await postFormJson<CreateRootUserResponse>('/user-types/root', {
      ...data,
      email: data.email?.trim() || undefined,
    });
  }

  /** Requires internal project ids, which no list endpoint exposes yet. */
  async createAdminUser(
    data: CreateAdminUserRequest
  ): Promise<CreateAdminUserResponse> {
    return await postFormJson<CreateAdminUserResponse>('/user-types/admin', {
      ...data,
      email: data.email?.trim() || undefined,
    });
  }

  // Account changes ---------------------------------------------------------

  async updateUser(
    userHash: string,
    data: UpdateUserRequest
  ): Promise<UpdateUserResponse> {
    return await putFormJson<UpdateUserResponse>(
      `/users/${seg(userHash)}`,
      data
    );
  }

  /** Root only. Promoting to admin assigns no project — add them to a project's admins separately. */
  async changeUserType(
    userHash: string,
    userType: UserType
  ): Promise<ChangeUserTypeResponse> {
    return await patchFormJson<ChangeUserTypeResponse>(
      `/users/${seg(userHash)}/type`,
      { user_type: userType }
    );
  }

  /**
   * `PUT /users/{hash}/status?is_active=` (query only, no body). Deactivation
   * signs the user out everywhere. The backend cannot reactivate yet: inactive
   * users are "not found" by this route.
   */
  async setUserActive(
    userHash: string,
    isActive: boolean
  ): Promise<UpdateUserStatusResponse> {
    return await putJson<UpdateUserStatusResponse>(
      `/users/${seg(userHash)}/status?is_active=${isActive ? 'true' : 'false'}`
    );
  }

  /** Emails the user a reset link; never returns a password. */
  async resetUserPassword(userHash: string): Promise<ResetPasswordResponse> {
    return await postFormJson<ResetPasswordResponse>(
      `/users/${seg(userHash)}/reset-password`
    );
  }

  /** Soft delete: deactivates the account and its group memberships. */
  async deleteUser(userHash: string): Promise<DeleteUserResponse> {
    return await deleteJson<DeleteUserResponse>(`/users/${seg(userHash)}`);
  }

  /** Root only. Permanent and irreversible. */
  async hardDeleteUser(userHash: string): Promise<HardDeleteUserResponse> {
    return await deleteJson<HardDeleteUserResponse>(
      `/users/${seg(userHash)}/hard`
    );
  }

  // Bulk operations ---------------------------------------------------------

  /** Deactivate up to 100 users at once. */
  async bulkDeactivateUsers(
    userHashes: string[]
  ): Promise<BulkUserOperationResponse> {
    return await postFormJson<BulkUserOperationResponse>(
      '/admin/users/bulk-update',
      {
        user_hashes: userHashes,
        is_active: false,
      }
    );
  }

  /** Soft-delete up to 50 users at once. */
  async bulkDeleteUsers(
    userHashes: string[]
  ): Promise<BulkUserOperationResponse> {
    return await postFormJson<BulkUserOperationResponse>(
      '/admin/users/bulk-delete',
      {
        user_hashes: userHashes,
        confirm_deletion: true,
      }
    );
  }

  // Admin project assignment (keyed by internal project id) -----------------

  async getAdminProjects(userHash: string): Promise<AdminProjectsResponse> {
    return await getJson<AdminProjectsResponse>(
      `/user-types/admin/${seg(userHash)}/projects`
    );
  }

  async removeAdminFromProject(
    userHash: string,
    projectId: string
  ): Promise<ApiResponse<void>> {
    return await deleteJson<ApiResponse<void>>(
      `/user-types/admin/${seg(userHash)}/projects/${seg(projectId)}`
    );
  }
}

export const userService = new UserService();
export default userService;
