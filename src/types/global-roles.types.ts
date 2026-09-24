/**
 * Global roles, permission groups and permissions (api.auth `global_roles.py`,
 * mounted at `/roles`). Rows are `SELECT *` from the tables; identifiers are
 * opaque strings. A user holds at most one global role.
 */

export interface GlobalRole {
  id: string;
  role_hash: string;
  role_name: string;
  role_display_name: string;
  role_description?: string | null;
  /** 0–100 sort order (higher first). Ordering metadata only; it never affects permission resolution. */
  role_priority: number;
  is_system_role: boolean;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
}

export interface GlobalPermissionGroup {
  id: string;
  group_hash: string;
  group_name: string;
  group_display_name: string;
  group_description?: string | null;
  group_category: string;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GlobalPermission {
  id: string;
  permission_hash: string;
  permission_name: string;
  permission_display_name: string;
  permission_description?: string | null;
  permission_category: string;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

/** `GET /roles/roles/{hash}` */
export interface GlobalRoleDetails {
  role: GlobalRole;
  permission_groups: GlobalPermissionGroup[];
}

/** `GET /roles/permission-groups/{hash}` */
export interface GlobalPermissionGroupDetails {
  permission_group: GlobalPermissionGroup;
  permissions: GlobalPermission[];
}

/** `PUT /roles/users/{user_hash}/role` */
export interface GlobalRoleAssignment {
  user: { user_hash: string; username: string };
  role: { role_hash: string; role_name: string };
}

/** A role suggested for a project (`GET /roles/projects/{hash}/catalog/roles`). UI metadata only. */
export interface CatalogedRole {
  id: string;
  role_hash: string;
  role_name: string;
  role_display_name: string;
  role_description?: string | null;
  role_priority: number;
  is_system_role: boolean;
  catalog_purpose?: string | null;
  notes?: string | null;
  added_at?: string | null;
  added_by?: string | null;
  added_by_username?: string | null;
}

export interface CreateGlobalRoleRequest {
  role_name: string;
  role_display_name: string;
  role_description?: string;
  role_priority?: number;
}

export interface UpdateGlobalRoleRequest {
  role_display_name?: string;
  role_description?: string;
  role_priority?: number;
}

export interface CreateGlobalPermissionGroupRequest {
  group_name: string;
  group_display_name: string;
  group_description?: string;
  group_category?: string;
}

export interface UpdateGlobalPermissionGroupRequest {
  group_display_name?: string;
  group_description?: string;
  group_category?: string;
}

export interface CreateGlobalPermissionRequest {
  permission_name: string;
  permission_display_name: string;
  permission_description?: string;
  permission_category?: string;
}

export interface UpdateGlobalPermissionRequest {
  permission_display_name?: string;
  permission_description?: string;
  permission_category?: string;
}

export interface CatalogMetadata {
  catalog_purpose?: string;
  notes?: string;
}
