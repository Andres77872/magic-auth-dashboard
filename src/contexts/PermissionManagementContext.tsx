import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { globalRolesService } from '@/services';
import type { GlobalPermissionGroup, GlobalPermission } from '@/types/global-roles.types';

interface PermissionManagementContextType {
  // Permission Groups
  permissionGroups: GlobalPermissionGroup[];
  permissionGroupsLoading: boolean;
  permissionGroupsError: string | null;
  refreshPermissionGroups: () => Promise<void>;
  
  // Permissions
  permissions: GlobalPermission[];
  permissionsLoading: boolean;
  permissionsError: string | null;
  refreshPermissions: () => Promise<void>;
  
  // Categories
  categories: string[];
}

const PermissionManagementContext = createContext<PermissionManagementContextType | undefined>(undefined);

export function PermissionManagementProvider({ children }: { children: React.ReactNode }) {
  // Permission Groups State
  const [permissionGroups, setPermissionGroups] = useState<GlobalPermissionGroup[]>([]);
  const [permissionGroupsLoading, setPermissionGroupsLoading] = useState(false);
  const [permissionGroupsError, setPermissionGroupsError] = useState<string | null>(null);

  // Permissions State
  const [permissions, setPermissions] = useState<GlobalPermission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  // Categories State
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch Permission Groups
  const fetchPermissionGroups = useCallback(async () => {
    setPermissionGroupsLoading(true);
    setPermissionGroupsError(null);
    try {
      const response: any = await globalRolesService.getPermissionGroups({});
      
      // API returns permission_groups key, not data
      const permissionGroupsData: GlobalPermissionGroup[] = response.permission_groups || response.data || [];
      
      if (response.success && permissionGroupsData.length >= 0) {
        setPermissionGroups(permissionGroupsData);
        
        // Extract unique categories
        const categories_list = permissionGroupsData
          .map(pg => pg.group_category)
          .filter((cat): cat is string => Boolean(cat));
        const uniqueCategories = Array.from(new Set(categories_list)).sort();
        setCategories(uniqueCategories);
      } else {
        throw new Error(response.message || 'Failed to fetch permission groups');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch permission groups';
      setPermissionGroupsError(errorMsg);
      console.error('Failed to fetch permission groups:', err);
    } finally {
      setPermissionGroupsLoading(false);
    }
  }, []);

  // Fetch Permissions
  const fetchPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    setPermissionsError(null);
    try {
      const response: any = await globalRolesService.getPermissions({});
      
      // API may return permissions key instead of data
      const permissionsData: GlobalPermission[] = response.permissions || response.data || [];
      
      if (response.success && permissionsData.length >= 0) {
        setPermissions(permissionsData);
      } else {
        throw new Error(response.message || 'Failed to fetch permissions');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch permissions';
      setPermissionsError(errorMsg);
      console.error('Failed to fetch permissions:', err);
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  // Refresh functions
  const refreshPermissionGroups = useCallback(async () => {
    await fetchPermissionGroups();
  }, [fetchPermissionGroups]);

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  // Initial load
  useEffect(() => {
    fetchPermissionGroups();
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load once on mount

  const value: PermissionManagementContextType = {
    permissionGroups,
    permissionGroupsLoading,
    permissionGroupsError,
    refreshPermissionGroups,
    permissions,
    permissionsLoading,
    permissionsError,
    refreshPermissions,
    categories,
  };

  return (
    <PermissionManagementContext.Provider value={value}>
      {children}
    </PermissionManagementContext.Provider>
  );
}

export function usePermissionManagement() {
  const context = useContext(PermissionManagementContext);
  if (context === undefined) {
    throw new Error('usePermissionManagement must be used within a PermissionManagementProvider');
  }
  return context;
}

export default PermissionManagementContext;

