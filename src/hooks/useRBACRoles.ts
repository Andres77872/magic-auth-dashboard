import { useState, useCallback } from 'react';
import { rbacService } from '@/services/rbac.service';
import type { Role, CreateRoleRequest, UpdateRoleRequest } from '@/types/rbac.types';

interface UseRBACRolesReturn {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  fetchRoles: (projectHash: string) => Promise<void>;
  createRole: (projectHash: string, data: CreateRoleRequest) => Promise<Role>;
  updateRole: (projectHash: string, roleId: number, data: UpdateRoleRequest) => Promise<Role>;
  deleteRole: (projectHash: string, roleId: number) => Promise<void>;
}

/**
 * @deprecated Use `useRoles` from '@/hooks/useRoles' instead.
 * This hook will be removed in a future version.
 * 
 * The useRoles hook provides the same functionality with correct
 * API field names (group_name) and additional features like role cloning.
 */
export function useRBACRoles(): UseRBACRolesReturn {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async (projectHash: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await rbacService.getRoles(projectHash);
      
      if (response.success && response.data) {
        const rolesList = Array.isArray(response.data) ? response.data : [];
        setRoles(rolesList);
      } else {
        setError(response.message || 'Failed to fetch roles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRole = useCallback(async (projectHash: string, data: CreateRoleRequest): Promise<Role> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await rbacService.createRole(projectHash, data);
      
      if (response.success && response.data) {
        const newRole = response.data as Role;
        setRoles(prev => [...prev, newRole]);
        return newRole;
      } else {
        throw new Error(response.message || 'Failed to create role');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateRole = useCallback(async (
    projectHash: string,
    roleId: number,
    data: UpdateRoleRequest
  ): Promise<Role> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await rbacService.updateRole(projectHash, roleId, data);
      
      if (response.success && response.data) {
        const updatedRole = response.data as Role;
        setRoles(prev => prev.map(r => 
          r.id === roleId ? updatedRole : r
        ));
        return updatedRole;
      } else {
        throw new Error(response.message || 'Failed to update role');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteRole = useCallback(async (projectHash: string, roleId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await rbacService.deleteRole(projectHash, roleId);
      
      if (response.success) {
        setRoles(prev => prev.filter(r => r.id !== roleId));
      } else {
        throw new Error(response.message || 'Failed to delete role');
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
    roles,
    isLoading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
}

export default useRBACRoles;
