import { useState, useEffect, useCallback } from 'react';
import { rbacService } from '@/services/rbac.service';
import type {
  UserEffectivePermissions,
  EffectivePermission,
  PermissionConflict
} from '@/types/rbac.types';

interface EffectivePermissionsState {
  userPermissions: Map<string, UserEffectivePermissions>; // userHash -> permissions
  permissionLookup: Map<string, Map<string, boolean>>; // userHash -> permissionName -> hasPermission
  conflictsByUser: Map<string, PermissionConflict[]>; // userHash -> conflicts
  inheritancePaths: Map<string, Map<string, string[]>>; // userHash -> permissionName -> path
  loading: boolean;
  error: string | null;
}

interface UseEffectivePermissionsOptions {
  projectHash: string;
  userHashes?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
  includeInheritancePaths?: boolean;
}

interface UseEffectivePermissionsReturn extends EffectivePermissionsState {
  // Permission Checking
  hasPermission: (userHash: string, permissionName: string) => boolean;
  getUserPermissions: (userHash: string) => EffectivePermission[];
  getUserConflicts: (userHash: string) => PermissionConflict[];
  getInheritancePath: (userHash: string, permissionName: string) => string[];
  
  // Simulation and Testing
  simulateAssignment: (userHash: string, roleIds: number[]) => Promise<{
    effective_permissions: EffectivePermission[];
    conflicts: PermissionConflict[];
    warnings: string[];
  }>;
  
  // Data Management
  refreshUserPermissions: (userHash: string) => Promise<void>;
  refreshAllPermissions: () => Promise<void>;
  addUser: (userHash: string) => Promise<void>;
  removeUser: (userHash: string) => void;
  
  // Analytics
  getPermissionCoverage: () => { total: number; covered: number; percentage: number };
  getConflictSummary: () => {
    totalConflicts: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    affectedUsers: number;
  };
  
  // Utilities
  compareUserPermissions: (userHash1: string, userHash2: string) => {
    common: string[];
    onlyUser1: string[];
    onlyUser2: string[];
  };
}

export function useEffectivePermissions({
  projectHash,
  userHashes = [],
  autoRefresh = false,
  refreshInterval = 30000,
  includeInheritancePaths = true
}: UseEffectivePermissionsOptions): UseEffectivePermissionsReturn {
  const [state, setState] = useState<EffectivePermissionsState>({
    userPermissions: new Map(),
    permissionLookup: new Map(),
    conflictsByUser: new Map(),
    inheritancePaths: new Map(),
    loading: false,
    error: null
  });

  // Permission calculation utilities
  const calculatePermissionLookup = useCallback((permissions: UserEffectivePermissions): Map<string, boolean> => {
    const lookup = new Map<string, boolean>();
    permissions.permissions.forEach(permission => {
      lookup.set(permission.permission_name, true);
    });
    return lookup;
  }, []);

  const calculateInheritancePaths = useCallback((permissions: UserEffectivePermissions): Map<string, string[]> => {
    const paths = new Map<string, string[]>();
    
    permissions.permissions.forEach(permission => {
      const path: string[] = [];
      
      switch (permission.granted_through) {
        case 'direct':
          path.push('Direct Assignment');
          break;
        case 'role':
          path.push(`Role: ${permission.source_name}`);
          break;
        case 'group':
          path.push(`Group: ${permission.source_name}`);
          break;
      }
      
      paths.set(permission.permission_name, path);
    });
    
    return paths;
  }, []);

  // Core data fetching
  const refreshUserPermissions = useCallback(async (userHash: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await rbacService.getUserEffectivePermissionsDetailed(userHash, projectHash);
      const permissions = result.data as UserEffectivePermissions;
      
      setState(prev => {
        const newUserPermissions = new Map(prev.userPermissions);
        const newPermissionLookup = new Map(prev.permissionLookup);
        const newConflictsByUser = new Map(prev.conflictsByUser);
        const newInheritancePaths = new Map(prev.inheritancePaths);
        
        newUserPermissions.set(userHash, permissions);
        newPermissionLookup.set(userHash, calculatePermissionLookup(permissions));
        newConflictsByUser.set(userHash, permissions.conflicts);
        
        if (includeInheritancePaths) {
          newInheritancePaths.set(userHash, calculateInheritancePaths(permissions));
        }
        
        return {
          ...prev,
          loading: false,
          userPermissions: newUserPermissions,
          permissionLookup: newPermissionLookup,
          conflictsByUser: newConflictsByUser,
          inheritancePaths: newInheritancePaths
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh user permissions';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, [projectHash, calculatePermissionLookup, calculateInheritancePaths, includeInheritancePaths]);

  const refreshAllPermissions = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const currentUsers = Array.from(state.userPermissions.keys());
      await Promise.all(currentUsers.map(userHash => refreshUserPermissions(userHash)));
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh permissions';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [state.userPermissions, refreshUserPermissions]);

  const addUser = useCallback(async (userHash: string): Promise<void> => {
    if (!state.userPermissions.has(userHash)) {
      await refreshUserPermissions(userHash);
    }
  }, [state.userPermissions, refreshUserPermissions]);

  const removeUser = useCallback((userHash: string): void => {
    setState(prev => {
      const newUserPermissions = new Map(prev.userPermissions);
      const newPermissionLookup = new Map(prev.permissionLookup);
      const newConflictsByUser = new Map(prev.conflictsByUser);
      const newInheritancePaths = new Map(prev.inheritancePaths);
      
      newUserPermissions.delete(userHash);
      newPermissionLookup.delete(userHash);
      newConflictsByUser.delete(userHash);
      newInheritancePaths.delete(userHash);
      
      return {
        ...prev,
        userPermissions: newUserPermissions,
        permissionLookup: newPermissionLookup,
        conflictsByUser: newConflictsByUser,
        inheritancePaths: newInheritancePaths
      };
    });
  }, []);

  // Permission checking methods
  const hasPermission = useCallback((userHash: string, permissionName: string): boolean => {
    const userLookup = state.permissionLookup.get(userHash);
    return userLookup?.get(permissionName) ?? false;
  }, [state.permissionLookup]);

  const getUserPermissions = useCallback((userHash: string): EffectivePermission[] => {
    const userPermissions = state.userPermissions.get(userHash);
    return userPermissions?.permissions || [];
  }, [state.userPermissions]);

  const getUserConflicts = useCallback((userHash: string): PermissionConflict[] => {
    return state.conflictsByUser.get(userHash) || [];
  }, [state.conflictsByUser]);

  const getInheritancePath = useCallback((userHash: string, permissionName: string): string[] => {
    const userPaths = state.inheritancePaths.get(userHash);
    return userPaths?.get(permissionName) || [];
  }, [state.inheritancePaths]);

  // Simulation and testing
  const simulateAssignment = useCallback(async (
    userHash: string, 
    roleIds: number[]
  ): Promise<{
    effective_permissions: EffectivePermission[];
    conflicts: PermissionConflict[];
    warnings: string[];
  }> => {
    try {
      const result = await rbacService.simulateAssignment(userHash, projectHash, roleIds);
      return result.data as {
        effective_permissions: EffectivePermission[];
        conflicts: PermissionConflict[];
        warnings: string[];
      };
    } catch (error) {
      throw error;
    }
  }, [projectHash]);

  // Analytics methods
  const getPermissionCoverage = useCallback(() => {
    const allPermissions = new Set<string>();
    const coveredPermissions = new Set<string>();
    
    state.userPermissions.forEach(userPermissions => {
      userPermissions.permissions.forEach(permission => {
        allPermissions.add(permission.permission_name);
        coveredPermissions.add(permission.permission_name);
      });
    });
    
    const total = allPermissions.size;
    const covered = coveredPermissions.size;
    const percentage = total > 0 ? (covered / total) * 100 : 0;
    
    return { total, covered, percentage };
  }, [state.userPermissions]);

  const getConflictSummary = useCallback(() => {
    let totalConflicts = 0;
    let highSeverity = 0;
    let mediumSeverity = 0;
    let lowSeverity = 0;
    let affectedUsers = 0;
    
    state.conflictsByUser.forEach((conflicts) => {
      if (conflicts.length > 0) {
        affectedUsers++;
        totalConflicts += conflicts.length;
        
        conflicts.forEach(conflict => {
          switch (conflict.severity) {
            case 'high':
              highSeverity++;
              break;
            case 'medium':
              mediumSeverity++;
              break;
            case 'low':
              lowSeverity++;
              break;
          }
        });
      }
    });
    
    return {
      totalConflicts,
      highSeverity,
      mediumSeverity,
      lowSeverity,
      affectedUsers
    };
  }, [state.conflictsByUser]);

  const compareUserPermissions = useCallback((userHash1: string, userHash2: string) => {
    const user1Permissions = new Set(getUserPermissions(userHash1).map(p => p.permission_name));
    const user2Permissions = new Set(getUserPermissions(userHash2).map(p => p.permission_name));
    
    const common: string[] = [];
    const onlyUser1: string[] = [];
    const onlyUser2: string[] = [];
    
    // Find common permissions
    user1Permissions.forEach(permission => {
      if (user2Permissions.has(permission)) {
        common.push(permission);
      } else {
        onlyUser1.push(permission);
      }
    });
    
    // Find permissions only in user2
    user2Permissions.forEach(permission => {
      if (!user1Permissions.has(permission)) {
        onlyUser2.push(permission);
      }
    });
    
    return { common, onlyUser1, onlyUser2 };
  }, [getUserPermissions]);

  // Initial data loading
  useEffect(() => {
    if (userHashes.length > 0) {
      Promise.all(userHashes.map(userHash => refreshUserPermissions(userHash)))
        .catch(error => {
          console.error('Failed to load initial user permissions:', error);
        });
    }
  }, [userHashes, refreshUserPermissions]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshAllPermissions();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshAllPermissions]);

  return {
    ...state,
    hasPermission,
    getUserPermissions,
    getUserConflicts,
    getInheritancePath,
    simulateAssignment,
    refreshUserPermissions,
    refreshAllPermissions,
    addUser,
    removeUser,
    getPermissionCoverage,
    getConflictSummary,
    compareUserPermissions
  };
} 