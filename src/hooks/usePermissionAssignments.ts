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
      const response = await permissionAssignmentsService.getMyPermissions();
      if (response.success && response.data) {
        setMyPermissions(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch my permissions:', err);
    }
  }, []);

  // Fetch My Permission Sources
  const fetchMyPermissionSources = useCallback(async () => {
    try {
      const response = await permissionAssignmentsService.getMyPermissionSources();
      if (response.success && response.data) {
        setMyPermissionSources(response.data);
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
    const response = await permissionAssignmentsService.getUserGroupPermissionGroups(groupHash);
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch user group permission groups');
    }
    return response.data;
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
    const response = await permissionAssignmentsService.getUserDirectPermissionGroups(userHash);
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch user direct permission groups');
    }
    return response.data;
  }, []);

  // Current User Functions
  const getMyPermissions = useCallback(async (): Promise<string[]> => {
    const response = await permissionAssignmentsService.getMyPermissions();
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch my permissions');
    }
    setMyPermissions(response.data);
    return response.data;
  }, []);

  const checkMyPermission = useCallback(async (permissionName: string): Promise<boolean> => {
    try {
      const response = await permissionAssignmentsService.checkMyPermission(permissionName);
      return response.data?.has_permission ?? false;
    } catch (err) {
      return false;
    }
  }, []);

  const getMyPermissionGroups = useCallback(async (): Promise<DirectPermissionAssignment[]> => {
    const response = await permissionAssignmentsService.getMyPermissionGroups();
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch my permission groups');
    }
    return response.data;
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
    const response = await permissionAssignmentsService.getProjectCatalogPermissionGroups(projectHash);
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch project catalog permission groups');
    }
    return response.data;
  }, []);

  const getPermissionGroupProjectCatalog = useCallback(async (permissionGroupHash: string): Promise<CatalogEntry[]> => {
    const response = await permissionAssignmentsService.getPermissionGroupProjectCatalog(permissionGroupHash);
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch permission group project catalog');
    }
    return response.data;
  }, []);

  // Usage Analytics Functions
  const getPermissionGroupUserGroups = useCallback(async (permissionGroupHash: string): Promise<any[]> => {
    const response = await permissionAssignmentsService.getPermissionGroupUserGroups(permissionGroupHash);
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch permission group user groups');
    }
    return response.data;
  }, []);

  const getPermissionGroupUsers = useCallback(async (permissionGroupHash: string): Promise<any[]> => {
    const response = await permissionAssignmentsService.getPermissionGroupUsers(permissionGroupHash);
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch permission group users');
    }
    return response.data;
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
