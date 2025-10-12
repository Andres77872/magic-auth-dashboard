import { useState, useEffect, useCallback } from 'react';
import { rbacService } from '@/services/rbac.service';
import type { Permission, Role } from '@/types/rbac.types';

export interface RBACHealthStatus {
  configured: boolean;
  rolesCount: number;
  permissionsCount: number;
  usersWithRoles: number;
  issues: string[];
}

// API Response from /rbac/projects/{project_hash}/summary
export interface RBACProjectSummary {
  success: boolean;
  project: {
    project_hash: string;
    project_name: string;
  };
  rbac_summary: {
    total_permissions: number;
    total_roles: number;
    total_user_assignments: number;
    permissions_by_category: Record<string, string[]>;
    roles_by_priority: Array<{
      group_name: string;
      priority: number;
      is_active: boolean;
    }>;
    active_roles: number;
    categories: string[];
  };
}

export interface AuditEntry {
  id: number;
  action_type: string;
  user_hash: string;
  username: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

export interface RBACInitConfig {
  create_default_permissions: boolean;
  create_default_roles: boolean;
  permission_categories?: string[];
  default_roles?: string[];
}

interface RBACState {
  summary: RBACProjectSummary | null;
  permissions: Permission[];
  roles: Role[];
  auditEntries: AuditEntry[];
  healthStatus: RBACHealthStatus | null;
  loading: boolean;
  error: string | null;
}

interface UseRBACReturn extends RBACState {
  initializeProjectRBAC: (config: RBACInitConfig) => Promise<RBACProjectSummary>;
  refreshRBACData: () => Promise<void>;
  switchProject: (projectHash: string) => void;
  currentProject: string | null;
}

export function useRBAC(initialProjectHash?: string | null): UseRBACReturn {
  const [currentProject, setCurrentProject] = useState<string | null>(initialProjectHash || null);
  const [state, setState] = useState<RBACState>({
    summary: null,
    permissions: [],
    roles: [],
    auditEntries: [],
    healthStatus: null,
    loading: false,
    error: null
  });

  const fetchRBACData = useCallback(async (projectHash: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Fetch real RBAC data from API
      const summaryResponse = await rbacService.getRBACSummary(projectHash);
      
      if (summaryResponse.success && summaryResponse.rbac_summary) {
        // Fetch permissions and roles in parallel
        const [permissionsResponse, rolesResponse] = await Promise.all([
          rbacService.getPermissions(projectHash),
          rbacService.getRoles(projectHash)
        ]);
        
        const permissions = (permissionsResponse as any).permissions || [];
        const roles = (rolesResponse as any).roles || [];
        
        // Build health status from summary data
        const healthStatus: RBACHealthStatus = {
          configured: true,
          rolesCount: summaryResponse.rbac_summary.total_roles,
          permissionsCount: summaryResponse.rbac_summary.total_permissions,
          usersWithRoles: summaryResponse.rbac_summary.total_user_assignments,
          issues: []
        };
        
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          summary: summaryResponse as RBACProjectSummary,
          healthStatus,
          permissions,
          roles
        }));
      } else {
        // RBAC not initialized - this is a normal state, not an error
        setState(prev => ({ 
          ...prev, 
          loading: false,
          summary: null,
          healthStatus: {
            configured: false,
            rolesCount: 0,
            permissionsCount: 0,
            usersWithRoles: 0,
            issues: ['RBAC system not initialized for this project']
          },
          permissions: [],
          roles: [],
          error: null
        }));
      }
    } catch (error) {
      // Only set error for unexpected failures
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch RBAC data';
      
      // Check if it's a 404 or "not found" type error (RBAC not initialized)
      if (errorMessage.toLowerCase().includes('not found') || 
          errorMessage.toLowerCase().includes('404') ||
          errorMessage.toLowerCase().includes('not initialized')) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          summary: null,
          healthStatus: {
            configured: false,
            rolesCount: 0,
            permissionsCount: 0,
            usersWithRoles: 0,
            issues: ['RBAC system not initialized for this project']
          },
          permissions: [],
          roles: [],
          error: null
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorMessage
        }));
      }
    }
  }, []);

  const initializeProjectRBAC = useCallback(async (config: RBACInitConfig): Promise<RBACProjectSummary> => {
    if (!currentProject) {
      throw new Error('No project selected');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Call the real initialization endpoint
      const response = await rbacService.initializeRBAC(
        currentProject, 
        config.create_default_permissions,
        config.create_default_roles
      );
      
      if (response.success) {
        // After successful initialization, fetch the updated summary
        await fetchRBACData(currentProject);
        
        // Return the initialized data
        return response as unknown as RBACProjectSummary;
      } else {
        throw new Error(response.message || 'Failed to initialize RBAC');
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize RBAC'
      }));
      throw error;
    }
  }, [currentProject, fetchRBACData]);

  const refreshRBACData = useCallback(async () => {
    if (currentProject) {
      await fetchRBACData(currentProject);
    }
  }, [currentProject, fetchRBACData]);

  const switchProject = useCallback((projectHash: string) => {
    setCurrentProject(projectHash);
  }, []);

  useEffect(() => {
    if (currentProject) {
      fetchRBACData(currentProject);
    }
  }, [currentProject, fetchRBACData]);

  return {
    ...state,
    initializeProjectRBAC,
    refreshRBACData,
    switchProject,
    currentProject
  };
} 