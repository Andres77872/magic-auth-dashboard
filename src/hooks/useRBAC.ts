import { useState, useEffect, useCallback } from 'react';
// import { rbacService } from '@/services/rbac.service';
import type { Permission, Role } from '@/types/rbac.types';

export interface RBACHealthStatus {
  configured: boolean;
  rolesCount: number;
  permissionsCount: number;
  usersWithRoles: number;
  issues: string[];
}

export interface RBACProjectSummary {
  project: {
    project_hash: string;
    project_name: string;
  };
  statistics: {
    total_permissions: number;
    total_roles: number;
    total_assignments: number;
    permission_categories: string[];
  };
  health: RBACHealthStatus;
  recent_activity: any[];
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
      // In a real implementation, you would call the actual API endpoints
      // For now, we'll simulate the response structure
      const mockSummary: RBACProjectSummary = {
        project: {
          project_hash: projectHash,
          project_name: 'Current Project'
        },
        statistics: {
          total_permissions: 0,
          total_roles: 0,
          total_assignments: 0,
          permission_categories: []
        },
        health: {
          configured: false,
          rolesCount: 0,
          permissionsCount: 0,
          usersWithRoles: 0,
          issues: []
        },
        recent_activity: []
      };

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        summary: mockSummary,
        healthStatus: mockSummary.health
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch RBAC data'
      }));
    }
  }, []);

  const initializeProjectRBAC = useCallback(async (config: RBACInitConfig): Promise<RBACProjectSummary> => {
    if (!currentProject) {
      throw new Error('No project selected');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // TODO: Implement the actual initialization endpoint when available
      // const response = await rbacService.initializeProjectRBAC(currentProject, config);
      
      // For now, return a mock response
      const mockSummary: RBACProjectSummary = {
        project: {
          project_hash: currentProject,
          project_name: 'Current Project'
        },
        statistics: {
          total_permissions: config.create_default_permissions ? 10 : 0,
          total_roles: config.create_default_roles ? 4 : 0,
          total_assignments: 0,
          permission_categories: config.permission_categories || ['general', 'admin', 'user']
        },
        health: {
          configured: true,
          rolesCount: config.create_default_roles ? 4 : 0,
          permissionsCount: config.create_default_permissions ? 10 : 0,
          usersWithRoles: 0,
          issues: []
        },
        recent_activity: []
      };

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        summary: mockSummary,
        healthStatus: mockSummary.health
      }));
      
      return mockSummary;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize RBAC'
      }));
      throw error;
    }
  }, [currentProject]);

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