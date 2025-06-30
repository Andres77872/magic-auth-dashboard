import { useState, useEffect, useCallback } from 'react';
import { roleService } from '@/services/role.service';
import type { Role } from '@/types/rbac.types';
import type { RoleListParams, CreateRoleData, RoleUpdateData } from '@/services/role.service';

interface UseRolesFilters {
  search?: string;
}

interface UseRolesReturn {
  roles: Role[];
  loading: boolean;
  error: string | null;
  createRole: (roleData: CreateRoleData) => Promise<void>;
  updateRole: (roleId: number, data: RoleUpdateData) => Promise<void>;
  deleteRole: (roleId: number) => Promise<void>;
  cloneRole: (roleId: number, newName: string) => Promise<void>;
  refreshRoles: () => Promise<void>;
  setFilters: (filters: UseRolesFilters) => void;
  filters: UseRolesFilters;
}

export function useRoles(projectHash: string | null): UseRolesReturn {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<UseRolesFilters>({});

  const fetchRoles = useCallback(async () => {
    if (!projectHash) {
      setRoles([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: RoleListParams = {
        search: filters.search,
        limit: 100, // Get all roles for now
      };

      const response = await roleService.getRoles(projectHash, params);
      
      if (response.success && response.roles) {
        setRoles(response.roles);
      } else {
        setError(response.message || 'Failed to fetch roles');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [projectHash, filters.search]);

  const createRole = useCallback(async (roleData: CreateRoleData) => {
    if (!projectHash) return;

    try {
      setError(null);
      const response = await roleService.createRole(projectHash, roleData);
      
      if (response.success) {
        await fetchRoles(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to create role');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [projectHash, fetchRoles]);

  const updateRole = useCallback(async (roleId: number, data: RoleUpdateData) => {
    if (!projectHash) return;

    try {
      setError(null);
      const response = await roleService.updateRole(projectHash, roleId, data);
      
      if (response.success) {
        await fetchRoles(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to update role');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [projectHash, fetchRoles]);

  const deleteRole = useCallback(async (roleId: number) => {
    if (!projectHash) return;

    try {
      setError(null);
      const response = await roleService.deleteRole(projectHash, roleId);
      
      if (response.success) {
        await fetchRoles(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to delete role');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [projectHash, fetchRoles]);

  const cloneRole = useCallback(async (roleId: number, newName: string) => {
    if (!projectHash) return;

    try {
      setError(null);
      const response = await roleService.cloneRole(projectHash, roleId, newName);
      
      if (response.success) {
        await fetchRoles(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to clone role');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clone role';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [projectHash, fetchRoles]);

  const setFilters = useCallback((newFilters: UseRolesFilters) => {
    setFiltersState(newFilters);
  }, []);

  const refreshRoles = useCallback(async () => {
    await fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    cloneRole,
    refreshRoles,
    setFilters,
    filters,
  };
} 