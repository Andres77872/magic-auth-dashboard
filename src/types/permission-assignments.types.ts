export interface PermissionGroupAssignment {
  group_hash: string;
  group_name: string;
  permission_group_hash: string;
  permission_group_name: string;
  assigned_at: string;
  assigned_by: string;
}

export interface DirectPermissionAssignment {
  user_hash: string;
  username: string;
  permission_group_hash: string;
  permission_group_name: string;
  group_hash: string; // Alias for permission_group_hash
  group_name: string; // Alias for permission_group_name
  assigned_at: string;
  assigned_by: string;
  notes?: string;
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
