export { useAuth } from './useAuth';
export { useUsers } from './useUsers';
export { useProjects } from './useProjects';
export { useUserType } from './useUserType';
export { usePermissions } from './usePermissions';
export { useRoles } from './useRoles';
export { useGroups } from './useGroups';
export { useProjectGroups } from './useProjectGroups';
export { useToast } from './useToast';

// Dashboard hooks
export { default as useSystemStats } from './dashboard/useSystemStats';
export { default as useSystemHealth } from './dashboard/useSystemHealth';
export { default as useDashboardCache } from './dashboard/useDashboardCache';
export { useRecentActivity } from './dashboard/useRecentActivity';
export { default as useAdminStats } from './dashboard/useAdminStats';

// User Profile & Management hooks
export { default as useUserProfile } from './useUserProfile';
export { default as useUserActions } from './useUserActions';
export { default as useProjectMembers } from './useProjectMembers';
export { default as useGroupMembers } from './useGroupMembers';
export { useUsersByGroup } from './useUsersByGroup';

// Utility hooks
export { useOptimisticQuery, useOptimisticMutation } from './useOptimisticQuery';
export { useUsersOptimized } from './useUsersOptimized';
export { useDebounce, useDebouncedCallback } from './useDebounce';

// Admin Operations hooks
export { default as useAdminOperations } from './useAdminOperations';

// Global Roles & Permission Assignments hooks
export { useGlobalRoles } from './useGlobalRoles';
export { useGlobalPermissionGroups } from './useGlobalPermissionGroups';
export { usePermissionAssignments } from './usePermissionAssignments';
export { usePermissionManagement } from '@/contexts/PermissionManagementContext';

// Audit hooks
export {
  useActivityLogs,
  useActivityTypes,
  useSecurityEvents,
  useAuditStatistics,
} from './audit'; 