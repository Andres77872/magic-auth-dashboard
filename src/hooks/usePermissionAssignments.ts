import { useState, useEffect, useCallback } from 'react';
import { permissionAssignmentsService } from '@/services';
import type {
  PermissionGroupAssignment,
  DirectPermissionAssignment,
  PermissionSource,
  CatalogEntry
} from '@/types/permission-assignments.types';

interface UsePermissionAssignmentsReturn {
  // State
  userGroupAssignments: PermissionGroupAssignment[];
  directAssignments: DirectPermissionAssignment[];
  myPermissions: string[];
  myPermissionSources: {
    from_role: PermissionSource[];
    from_user_groups: PermissionSource[];
    from_direct_assignment: PermissionSource[];
  } | null;
  loading: boolean;
  error: string | null;
  
  // User Group Assignment Functions
  assignPermissionGroupToUserGroup: (groupHash: string, permissionGroupHash: string) => Promise<void>;
  removePermissionGroupFromUserGroup: (groupHash: string, permissionGroupHash: string) => Promise<void>;
  getUserGroupPermissionGroups: (groupHash: string) => Promise<PermissionGroupAssignment[]>;
  bulkAssignPermissionGroupsToUserGroup: (groupHash: string, permissionGroupHashes: string[]) => Promise<void>;
  
  // Direct User Assignment Functions
  assignPermissionGroupToUser: (userHash: string, permissionGroupHash: string, notes?: string) => Promise<void>;
  removePermissionGroupFromUser: (userHash: string, permissionGroupHash: string) => Promise<void>;
  getUserDirectPermissionGroups: (userHash: string) => Promise<DirectPermissionAssignment[]>;
  
  // Current User Functions
  getMyPermissions: () => Promise<string[]>;
  checkMyPermission: (permissionName: string) => Promise<boolean>;
  getMyPermissionGroups: () => Promise<DirectPermissionAssignment[]>;
  getMyPermissionSources: () => Promise<void>;
  
  // Project Catalog Functions
  addPermissionGroupToProjectCatalog: (projectHash: string, permissionGroupHash: string, metadata?: any) => Promise<void>;
  removePermissionGroupFromProjectCatalog: (projectHash: string, permissionGroupHash: string) => Promise<void>;
  getProjectCatalogPermissionGroups: (projectHash: string) => Promise<CatalogEntry[]>;
  getPermissionGroupProjectCatalog: (permissionGroupHash: string) => Promise<CatalogEntry[]>;
  
  // Usage Analytics Functions
  getPermissionGroupUserGroups: (permissionGroupHash: string) => Promise<any[]>;
  getPermissionGroupUsers: (permissionGroupHash: string) => Promise<any[]>;
  
  // Refresh
  refreshMyPermissions: () => Promise<void>;
  refreshMyPermissionSources: () => Promise<void>;
}

export function usePermissionAssignments(): UsePermissionAssignmentsReturn {
  // State
  const [userGroupAssignments, _setUserGroupAssignments] = useState<PermissionGroupAssignment[]>([]);
  const [directAssignments, _setDirectAssignments] = useState<DirectPermissionAssignment[]>([]);
  const [myPermissions, setMyPermissions] = useState<string[]>([]);
  const [myPermissionSources, setMyPermissionSources] = useState<{
    from_role: PermissionSource[];
    from_user_groups: PermissionSource[];
    from_direct_assignment: PermissionSource[];
  } | null>(null);
  const [loading, _setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch My Permissions
  const fetchMyPermissions = useCallback(async () => {
    try {
      const response: any = await permissionAssignmentsService.getMyPermissions();
      // API returns permissions array in response
      const perms = response.permissions || response.data || [];
      if (response.success !== false) {
        setMyPermissions(perms);
      }
    } catch (err) {
      console.error('Failed to fetch my permissions:', err);
    }
  }, []);

  // Fetch My Permission Sources
  const fetchMyPermissionSources = useCallback(async () => {
    try {
      const response: any = await permissionAssignmentsService.getMyPermissionSources();
      // API returns sources object in response
      const sources = response.sources || response.data?.sources || null;
      if (response.success !== false && sources) {
        setMyPermissionSources(sources);
      }
    } catch (err) {
      console.error('Failed to fetch my permission sources:', err);
    }
  }, []);

  // User Group Assignment Functions
  const assignPermissionGroupToUserGroup = useCallback(async (groupHash: string, permissionGroupHash: string) => {
    setError(null);
    try {
      await permissionAssignmentsService.assignPermissionGroupToUserGroup(groupHash, permissionGroupHash);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to assign permission group';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const removePermissionGroupFromUserGroup = useCallback(async (groupHash: string, permissionGroupHash: string) => {
    setError(null);
    try {
      await permissionAssignmentsService.removePermissionGroupFromUserGroup(groupHash, permissionGroupHash);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove permission group';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const getUserGroupPermissionGroups = useCallback(async (groupHash: string): Promise<PermissionGroupAssignment[]> => {
    const response: any = await permissionAssignmentsService.getUserGroupPermissionGroups(groupHash);
    // API returns permission_groups array in response
    const groups = response.permission_groups || response.data?.permission_groups || [];
    if (response.success === false) {
      throw new Error('Failed to fetch user group permission groups');
    }
    return groups;
  }, []);

  const bulkAssignPermissionGroupsToUserGroup = useCallback(async (groupHash: string, permissionGroupHashes: string[]) => {
    setError(null);
    try {
      await permissionAssignmentsService.bulkAssignPermissionGroupsToUserGroup(groupHash, permissionGroupHashes);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to bulk assign permission groups';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  // Direct User Assignment Functions
  const assignPermissionGroupToUser = useCallback(async (userHash: string, permissionGroupHash: string, notes?: string) => {
    setError(null);
    try {
      await permissionAssignmentsService.assignPermissionGroupToUser(userHash, permissionGroupHash, notes);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to assign permission group to user';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const removePermissionGroupFromUser = useCallback(async (userHash: string, permissionGroupHash: string) => {
    setError(null);
    try {
      await permissionAssignmentsService.removePermissionGroupFromUser(userHash, permissionGroupHash);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove permission group from user';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const getUserDirectPermissionGroups = useCallback(async (userHash: string): Promise<DirectPermissionAssignment[]> => {
    const response: any = await permissionAssignmentsService.getUserDirectPermissionGroups(userHash);
    // API returns direct_permission_groups array in response
    const groups = response.direct_permission_groups || response.data?.direct_permission_groups || [];
    if (response.success === false) {
      throw new Error('Failed to fetch user direct permission groups');
    }
    return groups;
  }, []);

  // Current User Functions
  const getMyPermissions = useCallback(async (): Promise<string[]> => {
    const response: any = await permissionAssignmentsService.getMyPermissions();
    const perms = response.permissions || response.data || [];
    if (response.success === false) {
      throw new Error('Failed to fetch my permissions');
    }
    setMyPermissions(perms);
    return perms;
  }, []);

  const checkMyPermission = useCallback(async (permissionName: string): Promise<boolean> => {
    try {
      const response: any = await permissionAssignmentsService.checkMyPermission(permissionName);
      return response.has_permission ?? response.data?.has_permission ?? false;
    } catch (err) {
      return false;
    }
  }, []);

  const getMyPermissionGroups = useCallback(async (): Promise<DirectPermissionAssignment[]> => {
    const response: any = await permissionAssignmentsService.getMyPermissionGroups();
    const groups = response.direct_permission_groups || response.data?.direct_permission_groups || [];
    if (response.success === false) {
      throw new Error('Failed to fetch my permission groups');
    }
    return groups;
  }, []);

  const getMyPermissionSources = useCallback(async () => {
    await fetchMyPermissionSources();
  }, [fetchMyPermissionSources]);

  // Project Catalog Functions
  const addPermissionGroupToProjectCatalog = useCallback(async (
    projectHash: string,
    permissionGroupHash: string,
    metadata?: any
  ) => {
    setError(null);
    try {
      await permissionAssignmentsService.addPermissionGroupToProjectCatalog(projectHash, permissionGroupHash, metadata);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add to project catalog';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const removePermissionGroupFromProjectCatalog = useCallback(async (projectHash: string, permissionGroupHash: string) => {
    setError(null);
    try {
      await permissionAssignmentsService.removePermissionGroupFromProjectCatalog(projectHash, permissionGroupHash);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove from project catalog';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const getProjectCatalogPermissionGroups = useCallback(async (projectHash: string): Promise<CatalogEntry[]> => {
    const response: any = await permissionAssignmentsService.getProjectCatalogPermissionGroups(projectHash);
    const catalog = response.catalog || response.permission_groups || response.data || [];
    if (response.success === false) {
      throw new Error('Failed to fetch project catalog permission groups');
    }
    return catalog;
  }, []);

  const getPermissionGroupProjectCatalog = useCallback(async (permissionGroupHash: string): Promise<CatalogEntry[]> => {
    const response: any = await permissionAssignmentsService.getPermissionGroupProjectCatalog(permissionGroupHash);
    const catalog = response.catalog || response.projects || response.data || [];
    if (response.success === false) {
      throw new Error('Failed to fetch permission group project catalog');
    }
    return catalog;
  }, []);

  // Usage Analytics Functions
  const getPermissionGroupUserGroups = useCallback(async (permissionGroupHash: string): Promise<any[]> => {
    const response: any = await permissionAssignmentsService.getPermissionGroupUserGroups(permissionGroupHash);
    const userGroups = response.user_groups || response.data || [];
    if (response.success === false) {
      throw new Error('Failed to fetch permission group user groups');
    }
    return userGroups;
  }, []);

  const getPermissionGroupUsers = useCallback(async (permissionGroupHash: string): Promise<any[]> => {
    const response: any = await permissionAssignmentsService.getPermissionGroupUsers(permissionGroupHash);
    const users = response.users || response.data || [];
    if (response.success === false) {
      throw new Error('Failed to fetch permission group users');
    }
    return users;
  }, []);

  // Refresh functions
  const refreshMyPermissions = useCallback(async () => {
    await fetchMyPermissions();
  }, [fetchMyPermissions]);

  const refreshMyPermissionSources = useCallback(async () => {
    await fetchMyPermissionSources();
  }, [fetchMyPermissionSources]);

  // Initial load
  useEffect(() => {
    fetchMyPermissions();
    fetchMyPermissionSources();
  }, [fetchMyPermissions, fetchMyPermissionSources]);

  return {
    // State
    userGroupAssignments,
    directAssignments,
    myPermissions,
    myPermissionSources,
    loading,
    error,
    
    // User Group Assignment Functions
    assignPermissionGroupToUserGroup,
    removePermissionGroupFromUserGroup,
    getUserGroupPermissionGroups,
    bulkAssignPermissionGroupsToUserGroup,
    
    // Direct User Assignment Functions
    assignPermissionGroupToUser,
    removePermissionGroupFromUser,
    getUserDirectPermissionGroups,
    
    // Current User Functions
    getMyPermissions,
    checkMyPermission,
    getMyPermissionGroups,
    getMyPermissionSources,
    
    // Project Catalog Functions
    addPermissionGroupToProjectCatalog,
    removePermissionGroupFromProjectCatalog,
    getProjectCatalogPermissionGroups,
    getPermissionGroupProjectCatalog,
    
    // Usage Analytics Functions
    getPermissionGroupUserGroups,
    getPermissionGroupUsers,
    
    // Refresh
    refreshMyPermissions,
    refreshMyPermissionSources,
  };
}

export default usePermissionAssignments;
