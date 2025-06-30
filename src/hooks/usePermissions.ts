import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { permissionService } from '@/services/permission.service';
import type { Permission, CreatePermissionRequest } from '@/types/rbac.types';
import type { PermissionListParams, PermissionUpdateData } from '@/services/permission.service';
import { PERMISSIONS } from '@/utils/permissions';

interface UsePermissionsFilters {
  search?: string;
  category?: string;
}

interface UsePermissionsReturn {
  // RBAC Permission Management
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  categories: string[];
  createPermission: (permissionData: CreatePermissionRequest) => Promise<void>;
  updatePermission: (permissionId: number, data: PermissionUpdateData) => Promise<void>;
  deletePermission: (permissionId: number) => Promise<void>;
  refreshPermissions: () => Promise<void>;
  setFilters: (filters: UsePermissionsFilters) => void;
  filters: UsePermissionsFilters;
  
  // Auth-based Permission Checking (original functionality)
  hasPermission: (permission: string) => boolean;
  isRoot: boolean;
  isAdmin: boolean;
  isConsumer: boolean;
  canCreateUser: boolean;
  canCreateAdmin: boolean;
  canCreateRoot: boolean;
  canCreateProject: boolean;
  canViewSystemHealth: boolean;
  canManageSystem: boolean;
  isAuthenticated: boolean;
  userType: any;
}

// Enhanced usePermissions hook that supports both auth checks and RBAC management
export function usePermissions(projectHash?: string | null): UsePermissionsReturn {
  const { hasPermission, userType, isAuthenticated } = useAuth();
  
  // RBAC state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<UsePermissionsFilters>({});

  const fetchPermissions = useCallback(async () => {
    if (!projectHash) {
      setPermissions([]);
      setCategories([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: PermissionListParams = {
        search: filters.search,
        category: filters.category,
        limit: 100, // Get all permissions for now
      };

      const response = await permissionService.getPermissions(projectHash, params);
      
      if (response.success && response.permissions) {
        setPermissions(response.permissions);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(response.permissions.map(p => p.category))];
        setCategories(uniqueCategories);
      } else {
        setError(response.message || 'Failed to fetch permissions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [projectHash, filters.search, filters.category]);

  const createPermission = useCallback(async (permissionData: CreatePermissionRequest) => {
    if (!projectHash) return;

    try {
      setError(null);
      const response = await permissionService.createPermission(projectHash, permissionData);
      
      if (response.success) {
        await fetchPermissions(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to create permission');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create permission';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [projectHash, fetchPermissions]);

  const updatePermission = useCallback(async (permissionId: number, data: PermissionUpdateData) => {
    if (!projectHash) return;

    try {
      setError(null);
      const response = await permissionService.updatePermission(projectHash, permissionId, data);
      
      if (response.success) {
        await fetchPermissions(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to update permission');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update permission';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [projectHash, fetchPermissions]);

  const deletePermission = useCallback(async (permissionId: number) => {
    if (!projectHash) return;

    try {
      setError(null);
      const response = await permissionService.deletePermission(projectHash, permissionId);
      
      if (response.success) {
        await fetchPermissions(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to delete permission');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete permission';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [projectHash, fetchPermissions]);

  const setFilters = useCallback((newFilters: UsePermissionsFilters) => {
    setFiltersState(newFilters);
  }, []);

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    if (projectHash) {
      fetchPermissions();
    }
  }, [fetchPermissions]);

  return {
    // RBAC Permission Management
    permissions,
    loading,
    error,
    categories,
    createPermission,
    updatePermission,
    deletePermission,
    refreshPermissions,
    setFilters,
    filters,
    
    // Auth-based Permission Checking (original functionality)
    hasPermission,
    isRoot: userType === 'root',
    isAdmin: userType === 'admin' || userType === 'root',
    isConsumer: userType === 'consumer',
    canCreateUser: hasPermission(PERMISSIONS.CREATE_USER),
    canCreateAdmin: hasPermission(PERMISSIONS.CREATE_ADMIN),
    canCreateRoot: hasPermission(PERMISSIONS.CREATE_ROOT),
    canCreateProject: hasPermission(PERMISSIONS.CREATE_PROJECT),
    canViewSystemHealth: hasPermission(PERMISSIONS.VIEW_SYSTEM_HEALTH),
    canManageSystem: hasPermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS),
    isAuthenticated,
    userType,
  };
}

export default usePermissions; 