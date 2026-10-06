import type { UserType, User, UserIdentity } from './auth.types';
import type { BaseResponse, PaginationResponse } from './api.types';

/**
 * User management contracts (api.auth `users.py`, `user_types_auth.py`,
 * `bulk_operations.py`). The API has no admin endpoint for creating consumer
 * accounts: consumers sign up through a project's sign-in flow.
 */

export interface CreateRootUserRequest {
  username: string;
  password: string;
}

/** `assigned_project_ids` are INTERNAL project ids (not hashes) — at least one is required. */
export interface CreateAdminUserRequest {
  username: string;
  password: string;
  assigned_project_ids: string[];
}

export interface CreateRootUserResponse extends BaseResponse {
  user?: UserIdentity | null;
}

export interface CreateAdminUserResponse extends BaseResponse {
  user?:
    | (UserIdentity & {
        assigned_project_ids?: string[];
        assigned_projects?: Array<{
          project_id: string;
          project_hash: string;
          project_name: string;
        }>;
      })
    | null;
}

export interface UserListParams {
  limit?: number;
  offset?: number;
  search?: string;
  user_type_filter?: UserType;
  group_filter?: string;
  project_filter?: string;
  include_inactive?: boolean;
  include_group_info?: boolean;
  include_project_access?: boolean;
  sort_by?: 'username' | 'created_at' | 'email' | 'user_type' | 'last_login';
  sort_order?: 'asc' | 'desc';
}

/**
 * `GET /users/list`. `pagination.total` honours `user_type_filter` and
 * `include_inactive` only — it ignores `search`, group/project filters and
 * admin scoping.
 */
export interface UserListResponse extends BaseResponse {
  users: User[];
  pagination: PaginationResponse;
  filters?: {
    user_type_filter: string | null;
    group_filter: string | null;
    project_filter: string | null;
    search: string | null;
    include_inactive: boolean;
  };
}

export interface UserSearchParams {
  q: string;
  limit?: number;
  user_type_filter?: UserType;
}

export interface UserSearchResponse extends BaseResponse {
  users: User[];
  search_term: string;
  total_results: number;
  filters: {
    user_type_filter: string | null;
    limit: number;
  };
}

/** `PUT /users/{hash}` accepts a JSON or form username; type changes have their own route. */
export interface UpdateUserRequest {
  username?: string;
}

export interface UpdateUserResponse extends BaseResponse {
  user: Pick<User, 'user_hash' | 'username' | 'email' | 'user_type'>;
  updated_at?: string;
}

/** `PATCH /users/{hash}/type` (root only; promoting to admin assigns no project). */
export interface ChangeUserTypeResponse extends BaseResponse {
  user_hash: string;
  previous_type: UserType;
  new_type: UserType;
}

export interface UpdateUserStatusResponse extends BaseResponse {
  user_hash: string;
  is_active: boolean;
}

/** The reset enqueues an emailed link; no password is ever returned. */
export interface ResetPasswordResponse extends BaseResponse {
  user: {
    user_hash: string;
    username: string;
  };
  reset_data: {
    expires_at: string;
    delivery_status: string;
    has_delivery_target: boolean;
  };
  instructions: string;
}

export interface DeleteUserResponse extends BaseResponse {
  user_hash: string;
  username: string;
  deleted_at: string;
}

/** `DELETE /users/{hash}/hard` (root only, irreversible). */
export interface HardDeleteUserResponse extends BaseResponse {
  user_hash: string;
  username: string;
  removed?: {
    mode?: string;
    user_type?: string;
    emails_unlinked?: number;
  };
  deleted_at?: string;
}

/** `GET /users/{hash}/emails` */
export interface UserEmail {
  id: number | string;
  email_masked: string;
  status: string;
  is_primary: boolean;
  added_at?: string | null;
  activated_at?: string | null;
  removed_at?: string | null;
  last_activation_sent_at?: string | null;
}

export interface UserEmailsResponse extends BaseResponse {
  user_hash: string;
  emails: UserEmail[];
}

/** `POST /admin/users/bulk-update` / `bulk-delete` */
export interface BulkUserOperationResponse extends BaseResponse {
  summary: {
    total_requested: number;
    success_count: number;
    error_count: number;
  };
  results?: Array<{
    user_hash: string;
    status?: string;
    success?: boolean;
    message?: string;
  }>;
  errors?: string[];
}

// Admin project assignment (`/user-types/admin/{hash}/projects`) — keyed by internal project id.
export interface AdminAssignedProject {
  project_id: string;
  project_hash: string;
  project_name: string;
  project_description?: string | null;
  assigned_at?: string | null;
  assigned_by?: string | null;
}

export interface AdminProjectsResponse extends BaseResponse {
  user_hash: string;
  assigned_projects: AdminAssignedProject[];
}
