import { useState, useEffect, useCallback } from 'react';
import { globalRolesService } from '@/services';
import type {
  GlobalRole,
  GlobalPermissionGroup,
  GlobalPermission,
  CreateGlobalRoleRequest,
  UpdateGlobalRoleRequest,
  CreateGlobalPermissionGroupRequest,
  UpdateGlobalPermissionGroupRequest,
  CreateGlobalPermissionRequest,
  UpdateGlobalPermissionRequest
} from '@/types/global-roles.types';

interface UseGlobalRolesReturn {
  // Roles
  roles: GlobalRole[];
  currentRole: GlobalRole | null;
  loadingRoles: boolean;
  rolesError: string | null;
  
  // Permission Groups
  permissionGroups: GlobalPermissionGroup[];
  loadingGroups: boolean;
  groupsError: string | null;
  
  // Permissions
  permissions: GlobalPermission[];
  myPermissions: string[];
  loadingPermissions: boolean;
  permissionsError: string | null;
  
  // Role Management
  createRole: (data: CreateGlobalRoleRequest) => Promise<void>;
  updateRole: (roleHash: string, data: UpdateGlobalRoleRequest) => Promise<void>;
  deleteRole: (roleHash: string) => Promise<void>;
  getRole: (roleHash: string) => Promise<GlobalRole>;
  
  // Permission Group Management
  createPermissionGroup: (data: CreateGlobalPermissionGroupRequest) => Promise<void>;
  updatePermissionGroup: (groupHash: string, data: UpdateGlobalPermissionGroupRequest) => Promise<void>;
  deletePermissionGroup: (groupHash: string) => Promise<void>;
  getPermissionGroup: (groupHash: string) => Promise<GlobalPermissionGroup>;
  assignPermissionGroupToRole: (roleHash: string, groupHash: string) => Promise<void>;
  removePermissionGroupFromRole: (roleHash: string, groupHash: string) => Promise<void>;
  
  // Permission Management
  createPermission: (data: CreateGlobalPermissionRequest) => Promise<void>;
  updatePermission: (permissionHash: string, data: UpdateGlobalPermissionRequest) => Promise<void>;
  deletePermission: (permissionHash: string) => Promise<void>;
  checkPermission: (permissionName: string) => Promise<boolean>;
  
  // User Role Assignment
  assignRoleToUser: (userHash: string, roleHash: string) => Promise<void>;
  removeRoleFromUser: (userHash: string) => Promise<void>;
  getUserRole: (userHash: string) => Promise<GlobalRole>;
  getMyRole: () => Promise<GlobalRole>;
  
  // Refresh
  refreshRoles: () => Promise<void>;
  refreshPermissionGroups: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  refreshMyPermissions: () => Promise<void>;
}

export function useGlobalRoles(): UseGlobalRolesReturn {
  // State
  const [roles, setRoles] = useState<GlobalRole[]>([]);
  const [currentRole, setCurrentRole] = useState<GlobalRole | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  
  const [permissionGroups, setPermissionGroups] = useState<GlobalPermissionGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  
  const [permissions, setPermissions] = useState<GlobalPermission[]>([]);
  const [myPermissions, setMyPermissions] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  // Fetch Roles
  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    setRolesError(null);
    try {
      const response = await globalRolesService.getRoles();
      // API returns roles in response.roles, not response.data
      if (response.success) {
        const rolesData = (response as any).roles || response.data || [];
        setRoles(rolesData);
      }
    } catch (err) {
      setRolesError(err instanceof Error ? err.message : 'Failed to fetch roles');
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  // Fetch Permission Groups
  const fetchPermissionGroups = useCallback(async () => {
    setLoadingGroups(true);
    setGroupsError(null);
    try {
      const response = await globalRolesService.getPermissionGroups();
      // API returns permission_groups in response, not response.data
      if (response.success) {
        const groupsData = (response as any).permission_groups || response.data || [];
        setPermissionGroups(groupsData);
      }
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to fetch permission groups');
      console.error('Failed to fetch permission groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  // Fetch Permissions
  const fetchPermissions = useCallback(async () => {
    setLoadingPermissions(true);
    setPermissionsError(null);
    try {
      const response = await globalRolesService.getPermissions();
      // API returns permissions in response, not response.data
      if (response.success) {
        const permissionsData = (response as any).permissions || response.data || [];
        setPermissions(permissionsData);
      }
    } catch (err) {
      setPermissionsError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      console.error('Failed to fetch permissions:', err);
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  // Fetch My Permissions
  const fetchMyPermissions = useCallback(async () => {
    try {
      const response = await globalRolesService.getMyPermissions();
      // API returns permissions array directly
      if (response.success) {
        const perms = (response as any).permissions || response.data || [];
        setMyPermissions(perms);
      }
    } catch (err) {
      console.error('Failed to fetch my permissions:', err);
    }
  }, []);

  // Fetch My Role
  const fetchMyRole = useCallback(async () => {
    try {
      const response = await globalRolesService.getMyRole();
      // API returns role object directly
      if (response.success) {
        const roleData = (response as any).role || response.data || null;
        setCurrentRole(roleData);
      }
    } catch (err) {
      console.error('Failed to fetch my role:', err);
    }
  }, []);

  // Role Management
  const createRole = useCallback(async (data: CreateGlobalRoleRequest) => {
    setRolesError(null);
    try {
      await globalRolesService.createRole(data);
      await fetchRoles();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create role';
      setRolesError(error);
      throw new Error(error);
    }
  }, [fetchRoles]);

  const updateRole = useCallback(async (roleHash: string, data: UpdateGlobalRoleRequest) => {
    setRolesError(null);
    try {
      await globalRolesService.updateRole(roleHash, data);
      await fetchRoles();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update role';
      setRolesError(error);
      throw new Error(error);
    }
  }, [fetchRoles]);

  const deleteRole = useCallback(async (roleHash: string) => {
    setRolesError(null);
    try {
      await globalRolesService.deleteRole(roleHash);
      await fetchRoles();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete role';
      setRolesError(error);
      throw new Error(error);
    }
  }, [fetchRoles]);

  const getRole = useCallback(async (roleHash: string): Promise<GlobalRole> => {
    const response: any = await globalRolesService.getRole(roleHash);
    const roleData = response.role || response.data;
    if (!response.success || !roleData) {
      throw new Error('Failed to fetch role');
    }
    return roleData;
  }, []);

  // Permission Group Management
  const createPermissionGroup = useCallback(async (data: CreateGlobalPermissionGroupRequest) => {
    setGroupsError(null);
    try {
      await globalRolesService.createPermissionGroup(data);
      await fetchPermissionGroups();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create permission group';
      setGroupsError(error);
      throw new Error(error);
    }
  }, [fetchPermissionGroups]);

  const updatePermissionGroup = useCallback(async (groupHash: string, data: UpdateGlobalPermissionGroupRequest) => {
    setGroupsError(null);
    try {
      await globalRolesService.updatePermissionGroup(groupHash, data);
      await fetchPermissionGroups();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update permission group';
      setGroupsError(error);
      throw new Error(error);
    }
  }, [fetchPermissionGroups]);

  const deletePermissionGroup = useCallback(async (groupHash: string) => {
    setGroupsError(null);
    try {
      await globalRolesService.deletePermissionGroup(groupHash);
      await fetchPermissionGroups();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete permission group';
      setGroupsError(error);
      throw new Error(error);
    }
  }, [fetchPermissionGroups]);

  const getPermissionGroup = useCallback(async (groupHash: string): Promise<GlobalPermissionGroup> => {
    const response: any = await globalRolesService.getPermissionGroup(groupHash);
    const permissionGroupData = response.permission_group || response.data;
    if (!response.success || !permissionGroupData) {
      throw new Error('Failed to fetch permission group');
    }
    return permissionGroupData;
  }, []);

  const assignPermissionGroupToRole = useCallback(async (roleHash: string, groupHash: string) => {
    try {
      await globalRolesService.assignPermissionGroupToRole(roleHash, groupHash);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to assign permission group');
    }
  }, []);

  const removePermissionGroupFromRole = useCallback(async (roleHash: string, groupHash: string) => {
    try {
      await globalRolesService.removePermissionGroupFromRole(roleHash, groupHash);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove permission group from role');
    }
  }, []);

  // Permission Management
  const createPermission = useCallback(async (data: CreateGlobalPermissionRequest) => {
    setPermissionsError(null);
    try {
      await globalRolesService.createPermission(data);
      await fetchPermissions();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create permission';
      setPermissionsError(error);
      throw new Error(error);
    }
  }, [fetchPermissions]);

  const updatePermission = useCallback(async (permissionHash: string, data: UpdateGlobalPermissionRequest) => {
    setPermissionsError(null);
    try {
      await globalRolesService.updatePermission(permissionHash, data);
      await fetchPermissions();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update permission';
      setPermissionsError(error);
      throw new Error(error);
    }
  }, [fetchPermissions]);

  const deletePermission = useCallback(async (permissionHash: string) => {
    setPermissionsError(null);
    try {
      await globalRolesService.deletePermission(permissionHash);
      await fetchPermissions();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to delete permission';
      setPermissionsError(error);
      throw new Error(error);
    }
  }, [fetchPermissions]);

  const checkPermission = useCallback(async (permissionName: string): Promise<boolean> => {
    try {
      const response: any = await globalRolesService.checkPermission(permissionName);
      return response.has_permission ?? response.data?.has_permission ?? false;
    } catch (err) {
      return false;
    }
  }, []);

  // User Role Assignment
  const assignRoleToUser = useCallback(async (userHash: string, roleHash: string) => {
    try {
      await globalRolesService.assignRoleToUser(userHash, roleHash);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to assign role');
    }
  }, []);

  const removeRoleFromUser = useCallback(async (userHash: string) => {
    try {
      await globalRolesService.removeRoleFromUser(userHash);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove role from user');
    }
  }, []);

  const getUserRole = useCallback(async (userHash: string): Promise<GlobalRole> => {
    const response: any = await globalRolesService.getUserRole(userHash);
    const roleData = response.role || response.data;
    if (!response.success || !roleData) {
      throw new Error('Failed to fetch user role');
    }
    return roleData;
  }, []);

  const getMyRole = useCallback(async (): Promise<GlobalRole> => {
    const response: any = await globalRolesService.getMyRole();
    const roleData = response.role || response.data;
    if (!response.success || !roleData) {
      throw new Error('Failed to fetch my role');
    }
    setCurrentRole(roleData);
    return roleData;
  }, []);

  // Refresh functions
  const refreshRoles = useCallback(async () => {
    await fetchRoles();
  }, [fetchRoles]);

  const refreshPermissionGroups = useCallback(async () => {
    await fetchPermissionGroups();
  }, [fetchPermissionGroups]);

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  const refreshMyPermissions = useCallback(async () => {
    await fetchMyPermissions();
  }, [fetchMyPermissions]);

  // Initial load
  useEffect(() => {
    fetchRoles();
    fetchPermissionGroups();
    fetchPermissions();
    fetchMyPermissions();
    fetchMyRole();
  }, [fetchRoles, fetchPermissionGroups, fetchPermissions, fetchMyPermissions, fetchMyRole]);

  return {
    // Roles
    roles,
    currentRole,
    loadingRoles,
    rolesError,
    
    // Permission Groups
    permissionGroups,
    loadingGroups,
    groupsError,
    
    // Permissions
    permissions,
    myPermissions,
    loadingPermissions,
    permissionsError,
    
    // Role Management
    createRole,
    updateRole,
    deleteRole,
    getRole,
    
    // Permission Group Management
    createPermissionGroup,
    updatePermissionGroup,
    deletePermissionGroup,
    getPermissionGroup,
    assignPermissionGroupToRole,
    removePermissionGroupFromRole,
    
    // Permission Management
    createPermission,
    updatePermission,
    deletePermission,
    checkPermission,
    
    // User Role Assignment
    assignRoleToUser,
    removeRoleFromUser,
    getUserRole,
    getMyRole,
    
    // Refresh
    refreshRoles,
    refreshPermissionGroups,
    refreshPermissions,
    refreshMyPermissions,
  };
}

export default useGlobalRoles;
