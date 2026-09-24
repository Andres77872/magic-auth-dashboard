/**
 * Permission-group assignments (api.auth `permission_assignments.py`, mounted
 * at `/permissions`). These responses carry no `success` envelope. Row shapes
 * follow the stored procedures in `06_permission_assignments.sql`.
 *
 * Only the global role feeds a consumer's access token; user-group and direct
 * assignments count in `/permissions/users/me/*` and the permission-sources view.
 */

/** A permission group assigned to a user group, or directly to a user (with `notes`). */
export interface AssignedPermissionGroup {
  id: string;
  group_hash: string;
  group_name: string;
  group_display_name: string;
  group_description?: string | null;
  group_category: string;
  assigned_at?: string | null;
  assigned_by?: string | null;
  notes?: string | null;
}

/** A user group holding a permission group. */
export interface PermissionGroupUserGroup {
  id: string;
  group_hash: string;
  group_name: string;
  group_description?: string | null;
  assigned_at?: string | null;
  assigned_by?: string | null;
}

/** A user holding a permission group by direct assignment. */
export interface PermissionGroupDirectUser {
  id: string;
  user_hash: string;
  username: string;
  email?: string | null;
  user_type: string;
  role_id?: string | null;
  assigned_at?: string | null;
  assigned_by?: string | null;
  notes?: string | null;
}

/** A permission group suggested for a project. UI metadata only — never used for authorization. */
export interface CatalogedPermissionGroup {
  id: string;
  group_hash: string;
  group_name: string;
  group_display_name: string;
  group_description?: string | null;
  group_category: string;
  catalog_purpose?: string | null;
  notes?: string | null;
  added_at?: string | null;
  added_by?: string | null;
}

/** A project that lists a permission group in its catalog. */
export interface PermissionGroupCatalogProject {
  id: string;
  project_hash: string;
  project_name: string;
  project_description?: string | null;
  catalog_purpose?: string | null;
  notes?: string | null;
  added_at?: string | null;
  added_by?: string | null;
}

export type PermissionSourceType = 'role' | 'user_group' | 'direct';

/** One way the current user receives a permission group. */
export interface PermissionSource {
  source_type: PermissionSourceType;
  /** Role name, user-group name, or "Direct Assignment". */
  source_name: string;
  permission_group_name: string;
  permission_group_hash: string;
  notes?: string | null;
}

/** `GET /permissions/users/me/permission-sources` */
export interface PermissionSources {
  sources: {
    from_role: PermissionSource[];
    from_user_groups: PermissionSource[];
    from_direct_assignment: PermissionSource[];
  };
  summary: {
    role_count: number;
    user_group_count: number;
    direct_count: number;
    total_permission_groups: number;
  };
}

/** `POST /permissions/admin/user-groups/{hash}/permission-groups/bulk` */
export interface BulkPermissionGroupAssignResult {
  results: Array<{
    permission_group_hash: string;
    permission_group_name?: string;
    success: boolean;
    error?: string;
  }>;
  success_count: number;
  total_count: number;
}
