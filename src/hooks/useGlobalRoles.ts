import { useState, useEffect, useCallback } from 'react';
import { globalRolesService } from '@/services';
import type {
  GlobalRole,
  GlobalPermissionGroup,
  GlobalPermission,
  CreateGlobalRoleRequest,
  UpdateGlobalRoleRequest,
  CreateGlobalPermissionGroupRequest,
  CreateGlobalPermissionRequest
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
  getPermissionGroup: (groupHash: string) => Promise<GlobalPermissionGroup>;
  assignPermissionGroupToRole: (roleHash: string, groupHash: string) => Promise<void>;
  
  // Permission Management
  createPermission: (data: CreateGlobalPermissionRequest) => Promise<void>;
  checkPermission: (permissionName: string) => Promise<boolean>;
  
  // User Role Assignment
  assignRoleToUser: (userHash: string, roleHash: string) => Promise<void>;
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
      if (response.success && response.data) {
        setRoles(response.data);
      }
    } catch (err) {
      setRolesError(err instanceof Error ? err.message : 'Failed to fetch roles');
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
      if (response.success && response.data) {
        setPermissionGroups(response.data);
      }
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : 'Failed to fetch permission groups');
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
      if (response.success && response.data) {
        setPermissions(response.data);
      }
    } catch (err) {
      setPermissionsError(err instanceof Error ? err.message : 'Failed to fetch permissions');
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  // Fetch My Permissions
  const fetchMyPermissions = useCallback(async () => {
    try {
      const response = await globalRolesService.getMyPermissions();
      if (response.success && response.data) {
        setMyPermissions(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch my permissions:', err);
    }
  }, []);

  // Fetch My Role
  const fetchMyRole = useCallback(async () => {
    try {
      const response = await globalRolesService.getMyRole();
      if (response.success && response.data) {
        setCurrentRole(response.data);
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
    const response = await globalRolesService.getRole(roleHash);
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch role');
    }
    return response.data;
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

  const getPermissionGroup = useCallback(async (groupHash: string): Promise<GlobalPermissionGroup> => {
    const response = await globalRolesService.getPermissionGroup(groupHash);
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch permission group');
    }
    return response.data;
  }, []);

  const assignPermissionGroupToRole = useCallback(async (roleHash: string, groupHash: string) => {
    try {
      await globalRolesService.assignPermissionGroupToRole(roleHash, groupHash);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to assign permission group');
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

  const checkPermission = useCallback(async (permissionName: string): Promise<boolean> => {
    try {
      const response = await globalRolesService.checkPermission(permissionName);
      return response.data?.has_permission ?? false;
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

  const getUserRole = useCallback(async (userHash: string): Promise<GlobalRole> => {
    const response = await globalRolesService.getUserRole(userHash);
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch user role');
    }
    return response.data;
  }, []);

  const getMyRole = useCallback(async (): Promise<GlobalRole> => {
    const response = await globalRolesService.getMyRole();
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch my role');
    }
    setCurrentRole(response.data);
    return response.data;
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
    getPermissionGroup,
    assignPermissionGroupToRole,
    
    // Permission Management
    createPermission,
    checkPermission,
    
    // User Role Assignment
    assignRoleToUser,
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
