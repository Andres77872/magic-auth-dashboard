export interface PermissionGroupAssignment {
  group_hash: string;
  group_name: string;
  group_display_name?: string;
  group_category?: string;
  assigned_at: string;
  assigned_by?: string;
}

export interface UserGroupPermissionGroupsResponse {
  user_group: {
    hash: string;
    name: string;
  };
  permission_groups: PermissionGroupAssignment[];
  count: number;
}

export interface DirectPermissionAssignment {
  group_hash: string;
  group_name: string;
  group_display_name?: string;
  assigned_at: string;
  assigned_by?: string;
  notes?: string;
}

export interface UserDirectPermissionGroupsResponse {
  user: {
    hash: string;
    username: string;
  };
  direct_permission_groups: DirectPermissionAssignment[];
  count: number;
}

export interface PermissionSource {
  source_type: 'role' | 'user_group' | 'direct';
  role_name?: string;
  user_group_name?: string;
  permission_group_name: string;
  permissions_count: number;
  notes?: string;
}

export interface CatalogEntry {
  project_hash: string;
  project_name: string;
  permission_group_hash: string;
  permission_group_name: string;
  catalog_purpose?: string;
  notes?: string;
  added_at: string;
  added_by: string;
}
