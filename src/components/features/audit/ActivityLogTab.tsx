import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/common/Pagination';
import { ActivityTable } from './ActivityTable';
import { ActivityFilters } from './ActivityFilters';
import { ActivityDetailPanel } from './ActivityDetailPanel';
import { useActivityLogs } from '@/hooks/audit/useActivityLogs';
import { useActivityTypes } from '@/hooks/audit/useActivityTypes';
import {
  RefreshCw,
  Pause,
  Play,
  Timer,
} from 'lucide-react';
import type { ActivityLog, ActivityFilters as ActivityFiltersType } from '@/types/audit.types';

export interface ActivityLogTabProps {
  onActivitySelect?: (activity: ActivityLog) => void;
  initialFilters?: ActivityFiltersType;
  onUserClick?: (userId: string) => void;
  onProjectClick?: (projectId: string) => void;
  className?: string;
}

/**
 * ActivityLogTab - Main activity log view with filtering and pagination
 * Requirements: 1.1, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5
 */
export const ActivityLogTab = memo(function ActivityLogTab({
  onActivitySelect,
  initialFilters = {},
  onUserClick,
  onProjectClick,
  className,
}: ActivityLogTabProps): React.JSX.Element {
  // State
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [pageSize, setPageSize] = useState(50);

  // Hooks
  const {
    activities,
    pagination,
    isLoading,
    error,
    refetch,
    setFilters,
    filters,
    isAutoRefreshing,
    setAutoRefresh,
    secondsUntilRefresh,
  } = useActivityLogs({
    filters: initialFilters,
    limit: pageSize,
    autoRefresh: false,
    refreshInterval: 30000,
  });

  const { activityTypes, isLoading: isLoadingTypes } = useActivityTypes();

  // Memoize the selected activity ID to prevent unnecessary re-renders
  const selectedId = useMemo(() => selectedActivity?.id, [selectedActivity?.id]);

  // Pause auto-refresh when detail panel is open
  useEffect(() => {
    if (isDetailPanelOpen && isAutoRefreshing) {
      setAutoRefresh(false);
    }
  }, [isDetailPanelOpen, isAutoRefreshing, setAutoRefresh]);

  // Handle row click
  const handleRowClick = useCallback(
    (activity: ActivityLog) => {
      setSelectedActivity(activity);
      setIsDetailPanelOpen(true);
      onActivitySelect?.(activity);
    },
    [onActivitySelect]
  );

  // Handle detail panel close
  const handleDetailPanelClose = useCallback(() => {
    setIsDetailPanelOpen(false);
  }, []);

  // Handle filters change
  const handleFiltersChange = useCallback(
    (newFilters: ActivityFiltersType) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (_page: number) => {
      // Note: This would need enhancement in the hook to support offset-based pagination
      // For now, we trigger a refetch which will reset to page 1
      refetch();
    },
    [refetch]
  );

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      refetch();
    },
    [refetch]
  );

  // Memoized handler for select onChange
  const handlePageSizeSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      handlePageSizeChange(Number(e.target.value));
    },
    [handlePageSizeChange]
  );

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(!isAutoRefreshing);
  }, [isAutoRefreshing, setAutoRefresh]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters and Actions Row */}
      <div className="flex flex-col gap-3 md:gap-4">
        {/* Mobile: Filters row + Actions row stacked */}
        {/* Desktop: Side by side */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <ActivityFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            activityTypes={activityTypes}
            isLoading={isLoading || isLoadingTypes}
            className="flex-1"
          />

          {/* Actions - Always visible */}
          <div className="flex items-center justify-end gap-2 flex-shrink-0">
            {/* Auto-refresh Controls */}
            <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={isAutoRefreshing ? 'primary' : 'ghost'}
              size="sm"
              onClick={toggleAutoRefresh}
              className="h-7 gap-1"
              aria-label={isAutoRefreshing ? 'Pause auto-refresh' : 'Enable auto-refresh'}
            >
                {isAutoRefreshing ? (
                  <>
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only sm:inline">Auto</span>
                  </>
                )}
              </Button>
              {isAutoRefreshing && (
                <Badge variant="secondary" className="gap-1 h-7">
                  <Timer className="h-3 w-3" aria-hidden="true" />
                  <span className="tabular-nums">{secondsUntilRefresh}s</span>
                </Badge>
              )}
            </div>

            {/* Manual Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-1"
              aria-label="Refresh activities"
            >
              <RefreshCw
                className={cn('h-4 w-4', isLoading && 'animate-spin')}
                aria-hidden="true"
              />
              <span className="sr-only sm:not-sr-only sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
          role="alert"
        >
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Activity Table */}
      <ActivityTable
        activities={activities}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        selectedId={selectedId}
        emptyMessage="No activities found matching your filters"
      />

      {/* Pagination */}
      {!isLoading && activities.length > 0 && (
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Mobile: Stacked layout */}
          {/* Desktop: Side by side */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Items info - Always visible */}
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              <span className="sm:hidden">
                {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
              </span>
              <span className="hidden sm:inline">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {pagination.offset + 1}
                </span>
                {' '}-{' '}
                <span className="font-medium text-foreground">
                  {Math.min(pagination.offset + pagination.limit, pagination.total)}
                </span>
                {' '}of{' '}
                <span className="font-medium text-foreground">{pagination.total.toLocaleString()}</span>
                {' '}activities
              </span>
            </div>

            {/* Pagination controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              {/* Page Size Selector - Hidden on very small screens */}
              <div className="hidden xs:flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Per page:</span>
                <select
                  value={pageSize}
                  onChange={handlePageSizeSelectChange}
                  className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Items per page"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page Navigation */}
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pageSize}
                onPageChange={handlePageChange}
                itemLabelSingular="activity"
                itemLabelPlural="activities"
              />
            </div>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      <ActivityDetailPanel
        activity={selectedActivity}
        isOpen={isDetailPanelOpen}
        onClose={handleDetailPanelClose}
        onUserClick={onUserClick}
        onProjectClick={onProjectClick}
      />
    </div>
  );
});

export default ActivityLogTab;
