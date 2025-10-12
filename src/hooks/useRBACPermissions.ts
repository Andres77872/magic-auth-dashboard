import { useState, useCallback } from 'react';
import { rbacService } from '@/services/rbac.service';
import type { Permission } from '@/types/rbac.types';

interface CreatePermissionData {
  permission_name: string;
  description: string;
  category?: string;
}

interface UseRBACPermissionsReturn {
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
  fetchPermissions: (projectHash: string) => Promise<void>;
  createPermission: (projectHash: string, data: CreatePermissionData) => Promise<Permission>;
  updatePermission: (projectHash: string, permissionId: number, data: Partial<CreatePermissionData>) => Promise<Permission>;
  deletePermission: (projectHash: string, permissionId: number) => Promise<void>;
}

export function useRBACPermissions(): UseRBACPermissionsReturn {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async (projectHash: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await rbacService.getPermissions(projectHash);
      
      if (response.success) {
        const perms = (response as any).permissions || [];
        setPermissions(perms);
      } else {
        setError(response.message || 'Failed to fetch permissions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPermission = useCallback(async (projectHash: string, data: CreatePermissionData): Promise<Permission> => {
    setIsLoading(true);
    setError(null);

    try {
      const permissionData = {
        permission_name: data.permission_name,
        description: data.description,
        category: data.category || 'general'
      };
      
      const response = await rbacService.createPermission(projectHash, permissionData);
      
      if (response.success && response.data) {
        const newPermission = response.data as Permission;
        setPermissions(prev => [...prev, newPermission]);
        return newPermission;
      } else {
        throw new Error(response.message || 'Failed to create permission');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePermission = useCallback(async (
    projectHash: string,
    permissionId: number,
    data: Partial<CreatePermissionData>
  ): Promise<Permission> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await rbacService.updatePermission(projectHash, permissionId, data);
      
      if (response.success && response.data) {
        const updatedPermission = response.data as Permission;
        setPermissions(prev => prev.map(p => 
          p.id === permissionId ? updatedPermission : p
        ));
        return updatedPermission;
      } else {
        throw new Error(response.message || 'Failed to update permission');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePermission = useCallback(async (projectHash: string, permissionId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await rbacService.deletePermission(projectHash, permissionId);
      
      if (response.success) {
        setPermissions(prev => prev.filter(p => p.id !== permissionId));
      } else {
        throw new Error(response.message || 'Failed to delete permission');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    permissions,
    isLoading,
    error,
    fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
  };
}

export default useRBACPermissions;
