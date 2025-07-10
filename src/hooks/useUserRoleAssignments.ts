import { useState, useEffect, useCallback } from 'react';
import { rbacService } from '@/services/rbac.service';
import type {
  UserRoleAssignment,
  UserEffectivePermissions,
  PermissionConflict,
  AssignmentValidationResult,
  BulkAssignmentRequest,
  BulkAssignmentResult,
  AssignmentHistory
} from '@/types/rbac.types';

interface UserRoleAssignmentState {
  assignments: Map<string, UserRoleAssignment[]>; // userHash -> assignments
  effectivePermissions: Map<string, UserEffectivePermissions>; // userHash -> permissions
  conflicts: PermissionConflict[];
  history: AssignmentHistory[];
  loading: boolean;
  error: string | null;
  validationResults: Map<string, AssignmentValidationResult>; // operationId -> results
}

interface UseUserRoleAssignmentsOptions {
  projectHash: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseUserRoleAssignmentsReturn extends UserRoleAssignmentState {
  // Assignment Operations
  assignUserToRole: (userHash: string, roleId: number, reason?: string) => Promise<UserRoleAssignment>;
  removeUserFromRole: (userHash: string, roleId: number) => Promise<void>;
  bulkAssignRoles: (assignments: BulkAssignmentRequest) => Promise<BulkAssignmentResult>;
  
  // Validation
  validateAssignment: (userHash: string, roleIds: number[]) => Promise<AssignmentValidationResult>;
  validateBulkAssignments: (assignments: Array<{ user_hash: string; role_ids: number[] }>) => Promise<AssignmentValidationResult>;
  
  // Data Fetching
  getUserAssignments: (userHash: string) => Promise<UserRoleAssignment[]>;
  getUserEffectivePermissions: (userHash: string) => Promise<UserEffectivePermissions>;
  refreshAssignments: (userHashes?: string[]) => Promise<void>;
  refreshHistory: () => Promise<void>;
  
  // Conflict Management
  detectConflicts: (userHash?: string) => Promise<PermissionConflict[]>;
  
  // Utilities
  getAssignmentsByUser: (userHash: string) => UserRoleAssignment[];
  getEffectivePermissionsByUser: (userHash: string) => UserEffectivePermissions | null;
  hasConflicts: (userHash?: string) => boolean;
  clearValidationResults: () => void;
}

export function useUserRoleAssignments({
  projectHash,
  autoRefresh = false,
  refreshInterval = 30000
}: UseUserRoleAssignmentsOptions): UseUserRoleAssignmentsReturn {
  const [state, setState] = useState<UserRoleAssignmentState>({
    assignments: new Map(),
    effectivePermissions: new Map(),
    conflicts: [],
    history: [],
    loading: false,
    error: null,
    validationResults: new Map()
  });

  // Assignment Operations
  const assignUserToRole = useCallback(async (
    userHash: string, 
    roleId: number, 
    reason?: string
  ): Promise<UserRoleAssignment> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await rbacService.assignUserToRoleEnhanced(userHash, projectHash, roleId, reason);
      const assignment = result.data as UserRoleAssignment;
      
      setState(prev => {
        const newAssignments = new Map(prev.assignments);
        const userAssignments = newAssignments.get(userHash) || [];
        newAssignments.set(userHash, [...userAssignments, assignment]);
        
        return {
          ...prev,
          loading: false,
          assignments: newAssignments
        };
      });
      
      // Refresh effective permissions for this user
      await getUserEffectivePermissions(userHash);
      
      return assignment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign role';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [projectHash]);

  const removeUserFromRole = useCallback(async (userHash: string, roleId: number): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await rbacService.removeUserFromRole(userHash, projectHash, roleId);
      
      setState(prev => {
        const newAssignments = new Map(prev.assignments);
        const userAssignments = newAssignments.get(userHash) || [];
        const filteredAssignments = userAssignments.filter(a => a.role_id !== roleId);
        newAssignments.set(userHash, filteredAssignments);
        
        return {
          ...prev,
          loading: false,
          assignments: newAssignments
        };
      });
      
      // Refresh effective permissions for this user
      await getUserEffectivePermissions(userHash);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove role';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [projectHash]);

  const bulkAssignRoles = useCallback(async (
    assignments: BulkAssignmentRequest
  ): Promise<BulkAssignmentResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await rbacService.bulkAssignRolesEnhanced(projectHash, assignments);
      const bulkResult = result.data as BulkAssignmentResult;
      
      // Update assignments for all affected users
      setState(prev => {
        const newAssignments = new Map(prev.assignments);
        
        bulkResult.assignments.forEach(assignment => {
          const userAssignments = newAssignments.get(assignment.user_hash) || [];
          const existingIndex = userAssignments.findIndex(a => 
            a.role_id === assignment.role_id && a.user_hash === assignment.user_hash
          );
          
          if (existingIndex >= 0) {
            userAssignments[existingIndex] = assignment;
          } else {
            userAssignments.push(assignment);
          }
          
          newAssignments.set(assignment.user_hash, userAssignments);
        });
        
        return {
          ...prev,
          loading: false,
          assignments: newAssignments
        };
      });
      
      // Refresh effective permissions for all affected users
      const affectedUsers = [...new Set(bulkResult.assignments.map(a => a.user_hash))];
      await Promise.all(affectedUsers.map(userHash => getUserEffectivePermissions(userHash)));
      
      return bulkResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform bulk assignment';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [projectHash]);

  // Validation Methods
  const validateAssignment = useCallback(async (
    userHash: string, 
    roleIds: number[]
  ): Promise<AssignmentValidationResult> => {
    try {
      const result = await rbacService.validateAssignments(projectHash, [{ user_hash: userHash, role_ids: roleIds }]);
      const validation = result.data as AssignmentValidationResult;
      
      setState(prev => {
        const newValidationResults = new Map(prev.validationResults);
        newValidationResults.set(`${userHash}-${roleIds.join(',')}`, validation);
        return { ...prev, validationResults: newValidationResults };
      });
      
      return validation;
    } catch (error) {
      throw error;
    }
  }, [projectHash]);

  const validateBulkAssignments = useCallback(async (
    assignments: Array<{ user_hash: string; role_ids: number[] }>
  ): Promise<AssignmentValidationResult> => {
    try {
      const result = await rbacService.validateAssignments(projectHash, assignments);
      const validation = result.data as AssignmentValidationResult;
      
      const operationId = `bulk-${Date.now()}`;
      setState(prev => {
        const newValidationResults = new Map(prev.validationResults);
        newValidationResults.set(operationId, validation);
        return { ...prev, validationResults: newValidationResults };
      });
      
      return validation;
    } catch (error) {
      throw error;
    }
  }, [projectHash]);

  // Data Fetching Methods
  const getUserAssignments = useCallback(async (userHash: string): Promise<UserRoleAssignment[]> => {
    try {
      const result = await rbacService.getUserRoles(userHash, projectHash);
      const assignments = result.data as UserRoleAssignment[];
      
      setState(prev => {
        const newAssignments = new Map(prev.assignments);
        newAssignments.set(userHash, assignments);
        return { ...prev, assignments: newAssignments };
      });
      
      return assignments;
    } catch (error) {
      throw error;
    }
  }, [projectHash]);

  const getUserEffectivePermissions = useCallback(async (userHash: string): Promise<UserEffectivePermissions> => {
    try {
      const result = await rbacService.getUserEffectivePermissionsDetailed(userHash, projectHash);
      const permissions = result.data as UserEffectivePermissions;
      
      setState(prev => {
        const newEffectivePermissions = new Map(prev.effectivePermissions);
        newEffectivePermissions.set(userHash, permissions);
        return { ...prev, effectivePermissions: newEffectivePermissions };
      });
      
      return permissions;
    } catch (error) {
      throw error;
    }
  }, [projectHash]);

  const refreshAssignments = useCallback(async (userHashes?: string[]): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      if (userHashes) {
        await Promise.all(userHashes.map(userHash => getUserAssignments(userHash)));
      } else {
        // Refresh all currently loaded users
        const currentUsers = Array.from(state.assignments.keys());
        await Promise.all(currentUsers.map(userHash => getUserAssignments(userHash)));
      }
      
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh assignments';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [state.assignments]);

  const refreshHistory = useCallback(async (): Promise<void> => {
    try {
      const result = await rbacService.getAssignmentHistory(projectHash, { limit: 100 });
      const history = result.data as AssignmentHistory[];
      
      setState(prev => ({ ...prev, history }));
    } catch (error) {
      // History refresh failure shouldn't be critical
      console.warn('Failed to refresh assignment history:', error);
    }
  }, [projectHash]);

  // Conflict Management
  const detectConflicts = useCallback(async (userHash?: string): Promise<PermissionConflict[]> => {
    try {
      const result = await rbacService.detectPermissionConflicts(projectHash, userHash);
      const conflicts = result.data as PermissionConflict[];
      
      setState(prev => ({ ...prev, conflicts }));
      return conflicts;
    } catch (error) {
      throw error;
    }
  }, [projectHash]);

  // Utility Methods
  const getAssignmentsByUser = useCallback((userHash: string): UserRoleAssignment[] => {
    return state.assignments.get(userHash) || [];
  }, [state.assignments]);

  const getEffectivePermissionsByUser = useCallback((userHash: string): UserEffectivePermissions | null => {
    return state.effectivePermissions.get(userHash) || null;
  }, [state.effectivePermissions]);

  const hasConflicts = useCallback((userHash?: string): boolean => {
    if (userHash) {
      return state.conflicts.some(conflict => {
        const userPermissions = state.effectivePermissions.get(userHash);
        return userPermissions?.conflicts.includes(conflict);
      });
    }
    return state.conflicts.length > 0;
  }, [state.conflicts, state.effectivePermissions]);

  const clearValidationResults = useCallback((): void => {
    setState(prev => ({ ...prev, validationResults: new Map() }));
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshAssignments();
        refreshHistory();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshAssignments, refreshHistory]);

  // Initial data loading
  useEffect(() => {
    refreshHistory();
    detectConflicts();
  }, [projectHash]);

  return {
    ...state,
    assignUserToRole,
    removeUserFromRole,
    bulkAssignRoles,
    validateAssignment,
    validateBulkAssignments,
    getUserAssignments,
    getUserEffectivePermissions,
    refreshAssignments,
    refreshHistory,
    detectConflicts,
    getAssignmentsByUser,
    getEffectivePermissionsByUser,
    hasConflicts,
    clearValidationResults
  };
} 