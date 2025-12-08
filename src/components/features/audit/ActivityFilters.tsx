import React, { useMemo, useState, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  X,
  Search,
  Filter,
  Calendar,
  User,
  FolderKanban,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import type { ActivityFilters as ActivityFiltersType, ActivityType } from '@/types/audit.types';

/**
 * Date range presets
 */
const DATE_RANGE_OPTIONS = [
  { value: '1', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last year' },
];

/**
 * Activity type labels for display
 */
const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  user_login: 'Login',
  user_logout: 'Logout',
  user_registration: 'Registration',
  user_update: 'User Update',
  user_status_change: 'Status Change',
  user_password_reset: 'Password Reset',
  user_type_changed: 'Type Changed',
  project_creation: 'Project Created',
  project_update: 'Project Update',
  project_delete: 'Project Deleted',
  project_member_add: 'Member Added',
  project_member_remove: 'Member Removed',
  project_ownership_transferred: 'Ownership Transferred',
  project_archived: 'Project Archived',
  project_unarchived: 'Project Unarchived',
  group_creation: 'Group Created',
  group_update: 'Group Update',
  group_delete: 'Group Deleted',
  user_group_assign: 'Group Assigned',
  user_group_remove: 'Group Removed',
  permission_grant: 'Permission Granted',
  permission_revoke: 'Permission Revoked',
  role_removed: 'Role Removed',
  bulk_role_assignment: 'Bulk Role Assignment',
  bulk_group_assignment: 'Bulk Group Assignment',
  bulk_user_update: 'Bulk User Update',
  bulk_user_delete: 'Bulk User Delete',
  admin_action: 'Admin Action',
  system_event: 'System Event',
};

export interface ActivityFiltersProps {
  filters: ActivityFiltersType;
  onFiltersChange: (filters: ActivityFiltersType) => void;
  activityTypes: string[];
  isLoading?: boolean;
  showUserFilter?: boolean;
  showProjectFilter?: boolean;
  className?: string;
}

interface FilterControlsContentProps {
  filters: ActivityFiltersType;
  onFiltersChange: (filters: ActivityFiltersType) => void;
  activityTypes: string[];
  isLoading: boolean;
  showUserFilter: boolean;
  showProjectFilter: boolean;
  isMobile?: boolean;
}

/**
 * FilterControlsContent - Shared filter controls used in both desktop and mobile views
 */
const FilterControlsContent = memo(function FilterControlsContent({
  filters,
  onFiltersChange,
  activityTypes,
  isLoading,
  showUserFilter,
  showProjectFilter,
  isMobile = false,
}: FilterControlsContentProps): React.JSX.Element {
  const handleActivityTypeChange = useCallback((value: string) => {
    onFiltersChange({
      ...filters,
      activityType: value === 'all' ? undefined : (value as ActivityType),
    });
  }, [filters, onFiltersChange]);

  const handleDaysChange = useCallback((value: string) => {
    onFiltersChange({
      ...filters,
      days: value === 'all' ? undefined : parseInt(value, 10),
    });
  }, [filters, onFiltersChange]);

  const handleUserIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      userId: e.target.value || undefined,
    });
  }, [filters, onFiltersChange]);

  const handleProjectIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      projectId: e.target.value || undefined,
    });
  }, [filters, onFiltersChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: e.target.value || undefined,
    });
  }, [filters, onFiltersChange]);

  const containerClasses = isMobile
    ? 'flex flex-col gap-4'
    : 'flex flex-wrap items-center gap-2';

  const selectTriggerClasses = isMobile ? 'w-full' : 'w-[180px]';
  const dateSelectTriggerClasses = isMobile ? 'w-full' : 'w-[150px]';
  const inputClasses = isMobile ? 'w-full' : 'w-[150px]';
  const searchClasses = isMobile ? 'w-full' : 'flex-1 min-w-[200px] max-w-[300px]';

  return (
    <div className={containerClasses}>
      {/* Activity Type Filter */}
      <div className={isMobile ? 'space-y-1.5' : undefined}>
        {isMobile && (
          <label className="text-sm font-medium text-foreground">Activity Type</label>
        )}
        <Select
          value={filters.activityType || 'all'}
          onValueChange={handleActivityTypeChange}
          disabled={isLoading}
        >
          <SelectTrigger className={selectTriggerClasses} aria-label="Filter by activity type">
            <Activity className="h-4 w-4 mr-2 text-muted-foreground" aria-hidden="true" />
            <SelectValue placeholder="Activity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            {activityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {ACTIVITY_TYPE_LABELS[type] || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filter */}
      <div className={isMobile ? 'space-y-1.5' : undefined}>
        {isMobile && (
          <label className="text-sm font-medium text-foreground">Date Range</label>
        )}
        <Select
          value={filters.days?.toString() || 'all'}
          onValueChange={handleDaysChange}
          disabled={isLoading}
        >
          <SelectTrigger className={dateSelectTriggerClasses} aria-label="Filter by date range">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" aria-hidden="true" />
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            {DATE_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User Filter */}
      {showUserFilter && (
        <div className={isMobile ? 'space-y-1.5' : 'relative'}>
          {isMobile && (
            <label className="text-sm font-medium text-foreground">User ID</label>
          )}
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="User ID"
              value={filters.userId || ''}
              onChange={handleUserIdChange}
              disabled={isLoading}
              className={cn(inputClasses, 'pl-9')}
              aria-label="Filter by user ID"
            />
          </div>
        </div>
      )}

      {/* Project Filter */}
      {showProjectFilter && (
        <div className={isMobile ? 'space-y-1.5' : 'relative'}>
          {isMobile && (
            <label className="text-sm font-medium text-foreground">Project ID</label>
          )}
          <div className="relative">
            <FolderKanban
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="Project ID"
              value={filters.projectId || ''}
              onChange={handleProjectIdChange}
              disabled={isLoading}
              className={cn(inputClasses, 'pl-9')}
              aria-label="Filter by project ID"
            />
          </div>
        </div>
      )}

      {/* Search */}
      <div className={isMobile ? 'space-y-1.5' : cn('relative', searchClasses)}>
        {isMobile && (
          <label className="text-sm font-medium text-foreground">Search</label>
        )}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search activities..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            disabled={isLoading}
            className={cn(isMobile ? 'w-full' : '', 'pl-9')}
            aria-label="Search activities"
          />
        </div>
      </div>
    </div>
  );
})

interface ActiveFilterBadgeProps {
  label: string;
  value: string;
  onRemove: () => void;
}

/**
 * ActiveFilterBadge - Displays an active filter with remove button
 */
const ActiveFilterBadge = memo(function ActiveFilterBadge({
  label,
  value,
  onRemove,
}: ActiveFilterBadgeProps) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </Badge>
  );
})

/**
 * ActivityFilters - Filter controls for activity logs
 * - Mobile (<768px): Compact button that opens a slide-out filter panel
 * - Desktop (≥768px): Inline filter controls
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 9.4
 */
export const ActivityFilters = memo(function ActivityFilters({
  filters,
  onFiltersChange,
  activityTypes,
  isLoading = false,
  showUserFilter = true,
  showProjectFilter = true,
  className,
}: ActivityFiltersProps): React.JSX.Element {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Build active filters for display
  const activeFilters = useMemo(() => {
    const active: { key: keyof ActivityFiltersType; label: string; value: string }[] = [];

    if (filters.activityType) {
      active.push({
        key: 'activityType',
        label: 'Type',
        value: ACTIVITY_TYPE_LABELS[filters.activityType] || filters.activityType,
      });
    }
    if (filters.userId) {
      active.push({
        key: 'userId',
        label: 'User',
        value: filters.userId.substring(0, 8) + '...',
      });
    }
    if (filters.projectId) {
      active.push({
        key: 'projectId',
        label: 'Project',
        value: filters.projectId.substring(0, 8) + '...',
      });
    }
    if (filters.days) {
      const option = DATE_RANGE_OPTIONS.find((opt) => opt.value === String(filters.days));
      active.push({
        key: 'days',
        label: 'Period',
        value: option?.label || `${filters.days} days`,
      });
    }
    if (filters.search) {
      active.push({
        key: 'search',
        label: 'Search',
        value: filters.search.length > 15 ? filters.search.substring(0, 15) + '...' : filters.search,
      });
    }

    return active;
  }, [filters]);

  const hasActiveFilters = activeFilters.length > 0;

  const handleRemoveFilter = useCallback((key: keyof ActivityFiltersType) => {
    onFiltersChange({
      ...filters,
      [key]: undefined,
    });
  }, [filters, onFiltersChange]);

  const handleClearAll = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  const handleOpenMobileFilter = useCallback(() => {
    setIsMobileFilterOpen(true);
  }, []);

  const handleCloseMobileFilter = useCallback(() => {
    setIsMobileFilterOpen(false);
  }, []);

  const handleMobileSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: e.target.value || undefined,
    });
  }, [filters, onFiltersChange]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Mobile: Filter Button + Sheet (<768px) */}
      <div className="md:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenMobileFilter}
            className="gap-2"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {activeFilters.length}
              </Badge>
            )}
          </Button>

          {/* Quick search on mobile */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search..."
              value={filters.search || ''}
              onChange={handleMobileSearchChange}
              disabled={isLoading}
              className="pl-9"
              aria-label="Search activities"
            />
          </div>
        </div>

        {/* Mobile Filter Sheet */}
        <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <SheetContent side="left" className="w-[320px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>
                Filter activity logs by type, date, user, or project.
              </SheetDescription>
            </SheetHeader>

            <div className="py-6">
              <FilterControlsContent
                filters={filters}
                onFiltersChange={onFiltersChange}
                activityTypes={activityTypes}
                isLoading={isLoading}
                showUserFilter={showUserFilter}
                showProjectFilter={showProjectFilter}
                isMobile={true}
              />
            </div>

            <SheetFooter className="gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="flex-1"
                >
                  Clear All
                </Button>
              )}
              <Button
                onClick={handleCloseMobileFilter}
                className="flex-1"
              >
                Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Inline Filter Controls (≥768px) */}
      <div className="hidden md:block">
        <div className="flex flex-wrap items-center gap-2">
          <FilterControlsContent
            filters={filters}
            onFiltersChange={onFiltersChange}
            activityTypes={activityTypes}
            isLoading={isLoading}
            showUserFilter={showUserFilter}
            showProjectFilter={showProjectFilter}
            isMobile={false}
          />

          {/* Filter Icon Indicator */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Filter className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm">{activeFilters.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Badges (shown on both mobile and desktop) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <ActiveFilterBadge
              key={filter.key}
              label={filter.label}
              value={filter.value}
              onRemove={() => handleRemoveFilter(filter.key)}
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
});

export default ActivityFilters;
