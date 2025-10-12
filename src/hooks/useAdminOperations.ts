import { useState, useCallback } from 'react';
import { adminService } from '@/services';
import type { PaginationParams } from '@/types/api.types';

interface ActivityParams extends PaginationParams {
  activity_type?: string;
  user_id?: number;
  project_id?: number;
  days?: number;
}

interface UseAdminOperationsReturn {
  isLoading: boolean;
  error: string | null;
  // Activity
  getRecentActivity: (params?: ActivityParams) => Promise<any[]>;
  getActivityTypes: () => Promise<string[]>;
  // Statistics
  getUserStatistics: () => Promise<any>;
  getProjectStatistics: () => Promise<any>;
  getSystemOverview: () => Promise<any>;
  getAdminHealth: () => Promise<any>;
  // Export/Import
  exportUsers: (format?: 'csv' | 'json') => Promise<{ download_url: string }>;
  exportProjects: (format?: 'csv' | 'json') => Promise<{ download_url: string }>;
  // Bulk Operations
  bulkUpdateUsers: (userHashes: string[], updates: any) => Promise<{ updated_count: number; errors: any[] }>;
  bulkDeleteUsers: (userHashes: string[]) => Promise<{ deleted_count: number }>;
  bulkAssignRoles: (assignments: Array<{ user_hash: string; role_id: number; project_hash: string }>) => Promise<{ assigned_count: number; errors: any[] }>;
  bulkAssignGroups: (groupHash: string, userHashes: string[]) => Promise<{ assigned_count: number; errors: any[] }>;
}

export function useAdminOperations(): UseAdminOperationsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecentActivity = useCallback(async (params: ActivityParams = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getRecentActivity(params);
      
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [];
      } else {
        throw new Error(response.message || 'Failed to fetch activity');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getActivityTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getActivityTypes();
      
      if (response.success && response.data) {
        return (response.data as any).activity_types || [];
      } else {
        throw new Error(response.message || 'Failed to fetch activity types');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getUserStatistics();
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch user statistics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProjectStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getProjectStatistics();
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch project statistics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSystemOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getSystemOverview();
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch system overview');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAdminHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.getAdminHealth();
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch admin health');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportUsers = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.exportUsers(format);
      
      if (response.success && response.data) {
        return response.data as { download_url: string };
      } else {
        throw new Error(response.message || 'Failed to export users');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportProjects = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.exportProjects(format);
      
      if (response.success && response.data) {
        return response.data as { download_url: string };
      } else {
        throw new Error(response.message || 'Failed to export projects');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkUpdateUsers = useCallback(async (userHashes: string[], updates: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.bulkUpdateUsers(userHashes, updates);
      
      if (response.success && response.data) {
        return response.data as { updated_count: number; errors: any[] };
      } else {
        throw new Error(response.message || 'Failed to bulk update users');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkDeleteUsers = useCallback(async (userHashes: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.bulkDeleteUsers(userHashes);
      
      if (response.success && response.data) {
        return response.data as { deleted_count: number };
      } else {
        throw new Error(response.message || 'Failed to bulk delete users');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkAssignRoles = useCallback(async (assignments: Array<{ user_hash: string; role_id: number; project_hash: string }>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.bulkAssignRoles(assignments);
      
      if (response.success && response.data) {
        return response.data as { assigned_count: number; errors: any[] };
      } else {
        throw new Error(response.message || 'Failed to bulk assign roles');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkAssignGroups = useCallback(async (groupHash: string, userHashes: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await adminService.bulkAssignGroups(groupHash, userHashes);
      
      if (response.success && response.data) {
        return response.data as { assigned_count: number; errors: any[] };
      } else {
        throw new Error(response.message || 'Failed to bulk assign groups');
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
    isLoading,
    error,
    getRecentActivity,
    getActivityTypes,
    getUserStatistics,
    getProjectStatistics,
    getSystemOverview,
    getAdminHealth,
    exportUsers,
    exportProjects,
    bulkUpdateUsers,
    bulkDeleteUsers,
    bulkAssignRoles,
    bulkAssignGroups,
  };
}

export default useAdminOperations;
