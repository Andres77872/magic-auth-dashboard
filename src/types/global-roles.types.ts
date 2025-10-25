export interface GlobalRole {
  id: number;
  role_hash: string;
  role_name: string;
  role_display_name: string;
  role_description?: string;
  role_priority: number;
  is_system_role: boolean;
  created_at: string;
}

export interface GlobalPermissionGroup {
  id: number;
  group_hash: string;
  group_name: string;
  group_display_name: string;
  group_description?: string;
  group_category: string;
  created_at: string;
}

export interface GlobalPermission {
  id: number;
  permission_hash: string;
  permission_name: string;
  permission_display_name: string;
  permission_description?: string;
  permission_category: string;
  created_at: string;
}

export interface GlobalRoleAssignment {
  user_hash: string;
  username: string;
  role_hash: string;
  role_name: string;
  assigned_at: string;
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

export interface CreateGlobalPermissionRequest {
  permission_name: string;
  permission_display_name: string;
  permission_description?: string;
  permission_category?: string;
}
