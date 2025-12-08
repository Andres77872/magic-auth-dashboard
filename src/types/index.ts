// Export all types
export * from './auth.types';
export * from './api.types';
export * from './user.types';
export * from './project.types';
export * from './rbac.types';
export * from './system.types';
export * from './group.types';
export * from './dashboard.types';
export * from './global-roles.types';
export * from './permission-assignments.types';

// Export analytics types but exclude ActivityFilters to avoid duplicate with audit.types
export {
  type Activity,
  type ActivityResponse,
  type UseRecentActivityOptions,
  type UseRecentActivityReturn,
  type UserActivityMetrics,
  type UserEngagementData,
  type SecurityMetrics,
  type SystemMetrics,
  type UserAnalyticsData,
  type ProjectMetrics,
  type ProjectEngagementData,
  type ProjectAnalyticsData,
  type ChartDataPoint,
  type ChartConfig,
  type ExportOptions,
  type ExportData,
  type DateRangePreset,
  type DateRange,
} from './analytics.types';

// Export all audit types (including ActivityFilters)
export * from './audit.types';

// Handle duplicate exports by re-exporting specific types with different names
export type { UserProfileExtendedResponse as UserProfileExtended } from './user.types';

// Re-export analytics ActivityFilters with a different name if needed elsewhere
export type { ActivityFilters as AnalyticsActivityFilters } from './analytics.types'; 