export { useAuth } from './useAuth';
export { useUsers } from './useUsers';
export { useProjects } from './useProjects';
export { useUserType } from './useUserType';
export { usePermissions } from './usePermissions';

export { useGroups } from './useGroups';
export { useProjectGroups } from './useProjectGroups';
export { useToast } from './useToast';
export { useApiKeys } from './useApiKeys';
export { useOAuthConnections } from './useOAuthConnections';
export { useEmailTemplates, useEmailTemplate } from './useEmailTemplates';
export { usePatreonStatus } from './usePatreonStatus';
export { usePatreonEntitlements } from './usePatreonEntitlements';
export { usePatreonEntitlement } from './usePatreonEntitlement';
export { usePatreonTierMap } from './usePatreonTierMap';
export { usePatreonSyncJobs } from './usePatreonSyncJobs';
export { usePatreonWebhooks } from './usePatreonWebhooks';
export { useResyncPatreon } from './useResyncPatreon';

// Dashboard hooks
export { default as useSystemStats } from './dashboard/useSystemStats';
export { default as useSystemHealth } from './dashboard/useSystemHealth';
export { default as useSystemCacheStats } from './dashboard/useSystemCacheStats';
export { default as useDashboardCache } from './dashboard/useDashboardCache';
export { useRecentActivity } from './dashboard/useRecentActivity';
export { default as useBillingMetrics } from './dashboard/useBillingMetrics';

// User Profile & Management hooks
export { default as useUserProfileDetails } from './useUserProfileDetails';
export { default as useUserActions } from './useUserActions';
export { default as useProjectDetails } from './useProjectDetails';
export { default as useGroupDetails } from './useGroupDetails';
export { default as useGroupMemberActions } from './useGroupMemberActions';
export { default as useProjectMembers } from './useProjectMembers';
export { default as useGroupMembers } from './useGroupMembers';
export { useUsersByGroup } from './useUsersByGroup';

// Utility hooks
export { useDebounce, useDebouncedCallback } from './useDebounce';

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

// Workflow hooks
export { useProjectWorkflow } from './useProjectWorkflow';
export { useUserGroupsWithAccess } from './useUserGroupsWithAccess';

// Navigation hooks
export { useBackNavigation } from './useBackNavigation';
