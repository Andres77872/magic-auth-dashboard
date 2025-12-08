/**
 * Audit hooks for the Audit Log Monitor feature
 * 
 * Requirements: 1.1
 */

export { useActivityLogs, type UseActivityLogsOptions, type UseActivityLogsReturn } from './useActivityLogs';
export { useActivityTypes, type UseActivityTypesReturn, clearActivityTypesCache } from './useActivityTypes';
export { useSecurityEvents, type UseSecurityEventsOptions, type UseSecurityEventsReturn } from './useSecurityEvents';
export { useAuditStatistics, type UseAuditStatisticsOptions, type UseAuditStatisticsReturn } from './useAuditStatistics';
