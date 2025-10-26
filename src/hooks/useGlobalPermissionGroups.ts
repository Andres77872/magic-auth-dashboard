import { useState, useEffect, useCallback } from 'react';
import { globalRolesService } from '@/services';
import type { GlobalPermissionGroup, CreateGlobalPermissionGroupRequest } from '@/types/global-roles.types';
import type { PaginationParams } from '@/types/api.types';

interface UseGlobalPermissionGroupsReturn {
  permissionGroups: GlobalPermissionGroup[];
  loading: boolean;
  error: string | null;
  createPermissionGroup: (data: CreateGlobalPermissionGroupRequest) => Promise<GlobalPermissionGroup>;
  getPermissionGroup: (groupHash: string) => Promise<GlobalPermissionGroup>;
  refreshPermissionGroups: () => Promise<void>;
  categories: string[];
}

export function useGlobalPermissionGroups(params: { category?: string } & PaginationParams = {}): UseGlobalPermissionGroupsReturn {
  const [permissionGroups, setPermissionGroups] = useState<GlobalPermissionGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchPermissionGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await globalRolesService.getPermissionGroups(params);
      // API returns permission_groups key, not data
      const permissionGroupsData = response.permission_groups || response.data || [];
      
      if (response.success && permissionGroupsData.length >= 0) {
        setPermissionGroups(permissionGroupsData);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(
            permissionGroupsData
              .map((pg: GlobalPermissionGroup) => pg.group_category)
              .filter((cat: any): cat is string => Boolean(cat))
          )
        ).sort() as string[];
        setCategories(uniqueCategories);
      } else {
        throw new Error(response.message || 'Failed to fetch permission groups');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch permission groups';
      setError(errorMsg);
      console.error('Failed to fetch permission groups:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  const createPermissionGroup = useCallback(async (data: CreateGlobalPermissionGroupRequest): Promise<GlobalPermissionGroup> => {
    setError(null);
    try {
      const response: any = await globalRolesService.createPermissionGroup(data);
      const permissionGroupData = response.permission_group || response.data;
      
      if (!response.success || !permissionGroupData) {
        throw new Error(response.message || 'Failed to create permission group');
      }
      await fetchPermissionGroups();
      return permissionGroupData;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create permission group';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [fetchPermissionGroups]);

  const getPermissionGroup = useCallback(async (groupHash: string): Promise<GlobalPermissionGroup> => {
    try {
      const response: any = await globalRolesService.getPermissionGroup(groupHash);
      const permissionGroupData = response.permission_group || response.data;
      
      if (!response.success || !permissionGroupData) {
        throw new Error(response.message || 'Failed to fetch permission group');
      }
      return permissionGroupData;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch permission group';
      throw new Error(errorMsg);
    }
  }, []);

  const refreshPermissionGroups = useCallback(async () => {
    await fetchPermissionGroups();
  }, [fetchPermissionGroups]);

  useEffect(() => {
    fetchPermissionGroups();
  }, [fetchPermissionGroups]);

  return {
    permissionGroups,
    loading,
    error,
    createPermissionGroup,
    getPermissionGroup,
    refreshPermissionGroups,
    categories,
  };
}

export default useGlobalPermissionGroups;

