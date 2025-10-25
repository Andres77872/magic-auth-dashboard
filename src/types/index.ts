// Export all types
export * from './auth.types';
export * from './api.types';
export * from './user.types';
export * from './project.types';
export * from './rbac.types';
export * from './system.types';
export * from './group.types';
export * from './dashboard.types';
export * from './analytics.types';
export * from './global-roles.types';
export * from './permission-assignments.types';

// Handle duplicate exports by re-exporting specific types with different names
export type { UserProfileExtendedResponse as UserProfileExtended } from './user.types'; 