import React, { useState, memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import {
  LogIn,
  LogOut,
  UserPlus,
  UserMinus,
  UserCog,
  FolderPlus,
  FolderMinus,
  FolderCog,
  Users,
  Shield,
  ShieldOff,
  Layers,
  Settings,
  AlertTriangle,
  FileText,
  Globe,
  User,
  FolderKanban,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatRelativeTime, formatDateTime } from '@/utils/component-utils';
import type { ActivityLog, ActivityType } from '@/types/audit.types';

type ActivityConfig = { icon: React.ElementType; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'; label: string };

/**
 * Activity type configuration for icons and colors
 */
const ACTIVITY_TYPE_CONFIG: Record<
  ActivityType,
  { icon: React.ElementType; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'; label: string }
> = {
  // Authentication
  user_login: { icon: LogIn, variant: 'success', label: 'Login' },
  user_logout: { icon: LogOut, variant: 'secondary', label: 'Logout' },
  user_registration: { icon: UserPlus, variant: 'info', label: 'Registration' },
  // User Management
  user_update: { icon: UserCog, variant: 'primary', label: 'User Update' },
  user_status_change: { icon: UserCog, variant: 'warning', label: 'Status Change' },
  user_password_reset: { icon: Shield, variant: 'warning', label: 'Password Reset' },
  user_type_changed: { icon: UserCog, variant: 'warning', label: 'Type Changed' },
  // Project Management
  project_creation: { icon: FolderPlus, variant: 'success', label: 'Project Created' },
  project_update: { icon: FolderCog, variant: 'primary', label: 'Project Update' },
  project_delete: { icon: FolderMinus, variant: 'error', label: 'Project Deleted' },
  project_member_add: { icon: UserPlus, variant: 'info', label: 'Member Added' },
  project_member_remove: { icon: UserMinus, variant: 'warning', label: 'Member Removed' },
  project_ownership_transferred: { icon: FolderCog, variant: 'warning', label: 'Ownership Transferred' },
  project_archived: { icon: FolderMinus, variant: 'secondary', label: 'Project Archived' },
  project_unarchived: { icon: FolderPlus, variant: 'info', label: 'Project Unarchived' },
  // Group Management
  group_creation: { icon: Users, variant: 'success', label: 'Group Created' },
  group_update: { icon: Users, variant: 'primary', label: 'Group Update' },
  group_delete: { icon: Users, variant: 'error', label: 'Group Deleted' },
  user_group_assign: { icon: UserPlus, variant: 'info', label: 'Group Assigned' },
  user_group_remove: { icon: UserMinus, variant: 'warning', label: 'Group Removed' },
  // Permission Management
  permission_grant: { icon: Shield, variant: 'warning', label: 'Permission Granted' },
  permission_revoke: { icon: ShieldOff, variant: 'warning', label: 'Permission Revoked' },
  role_removed: { icon: ShieldOff, variant: 'warning', label: 'Role Removed' },
  // Bulk Operations
  bulk_role_assignment: { icon: Layers, variant: 'warning', label: 'Bulk Role Assignment' },
  bulk_group_assignment: { icon: Layers, variant: 'warning', label: 'Bulk Group Assignment' },
  bulk_user_update: { icon: Layers, variant: 'warning', label: 'Bulk User Update' },
  bulk_user_delete: { icon: Layers, variant: 'error', label: 'Bulk User Delete' },
  // System
  admin_action: { icon: Settings, variant: 'warning', label: 'Admin Action' },
  system_event: { icon: AlertTriangle, variant: 'info', label: 'System Event' },
};

export interface ActivityTableProps {
  activities: ActivityLog[];
  isLoading: boolean;
  onRowClick?: (activity: ActivityLog) => void;
  selectedId?: string;
  showUserColumn?: boolean;
  showProjectColumn?: boolean;
  emptyMessage?: string;
  className?: string;
}

interface ActivityCardProps {
  activity: ActivityLog;
  config: ActivityConfig;
  isSelected: boolean;
  onRowClick?: (activity: ActivityLog) => void;
  showUserColumn: boolean;
  showProjectColumn: boolean;
}

/**
 * ActivityCard - Mobile card layout for a single activity
 */
const ActivityCard = memo(function ActivityCard({
  activity,
  config,
  isSelected,
  onRowClick,
  showUserColumn,
  showProjectColumn,
}: ActivityCardProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = config.icon;

  const handleClick = useCallback(() => {
    onRowClick?.(activity);
  }, [onRowClick, activity]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRowClick(activity);
    }
  }, [onRowClick, activity]);

  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <Card
      className={cn(
        'transition-colors',
        onRowClick && 'cursor-pointer hover:bg-muted/50',
        isSelected && 'ring-2 ring-primary bg-muted/50'
      )}
      onClick={handleClick}
      role={onRowClick ? 'button' : undefined}
      tabIndex={onRowClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-selected={isSelected}
    >
      <CardContent className="p-4">
        {/* Header: Activity Type + Time */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge variant={config.variant} size="sm" className="gap-1">
            <IconComponent className="h-3 w-3" aria-hidden="true" />
            <span>{config.label}</span>
          </Badge>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(activity.createdAt)}
          </span>
        </div>

        {/* User Info */}
        {showUserColumn && (
          <div className="flex items-center gap-2 mb-2">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium truncate">
              {activity.user?.username || 'System'}
            </span>
            {activity.targetUser && (
              <>
                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-xs text-muted-foreground truncate">
                  {activity.targetUser.username}
                </span>
              </>
            )}
          </div>
        )}

        {/* Expandable Details */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between h-8 px-2 -mx-2 mt-1"
          onClick={handleToggleExpand}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Hide details' : 'Show details'}
        >
          <span className="text-xs text-muted-foreground">Details</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-2 text-sm">
            {/* Project */}
            {showProjectColumn && (
              <div className="flex items-center gap-2">
                <FolderKanban className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="text-muted-foreground">Project:</span>
                <span className="truncate">
                  {activity.project?.name || '—'}
                </span>
              </div>
            )}
            {/* IP Address */}
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">IP:</span>
              <span className="font-mono text-xs">
                {activity.ipAddress || '—'}
              </span>
            </div>
            {/* Full Timestamp */}
            <div className="text-xs text-muted-foreground">
              {formatDateTime(activity.createdAt)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
})

interface ActivityTableRowProps {
  activity: ActivityLog;
  config: ActivityConfig;
  isSelected: boolean;
  onRowClick?: (activity: ActivityLog) => void;
  showUserColumn: boolean;
  showProjectColumn: boolean;
  isTablet: boolean;
}

/**
 * ActivityTableRow - Tablet/Desktop row with expandable details for tablet
 */
const ActivityTableRow = memo(function ActivityTableRow({
  activity,
  config,
  isSelected,
  onRowClick,
  showUserColumn,
  showProjectColumn,
  isTablet,
}: ActivityTableRowProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = config.icon;

  const handleClick = useCallback(() => {
    onRowClick?.(activity);
  }, [onRowClick, activity]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRowClick(activity);
    }
  }, [onRowClick, activity]);

  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <>
      <TableRow
        onClick={handleClick}
        className={cn(
          onRowClick && 'cursor-pointer',
          isSelected && 'bg-muted/50'
        )}
        data-selected={isSelected}
        role={onRowClick ? 'button' : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        onKeyDown={handleKeyDown}
        aria-selected={isSelected}
      >
        {/* Activity Type */}
        <TableCell>
          <div className="flex items-center gap-2">
            <Badge variant={config.variant} size="sm" className="gap-1">
              <IconComponent className="h-3 w-3" aria-hidden="true" />
              <span>{config.label}</span>
            </Badge>
          </div>
        </TableCell>

        {/* User */}
        {showUserColumn && (
          <TableCell>
            {activity.user ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-sm">
                    <User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium truncate max-w-[100px]">
                      {activity.user.username}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{activity.user.username}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {activity.user.userHash.substring(0, 16)}...
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-sm text-muted-foreground">System</span>
            )}
            {activity.targetUser && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                  {activity.targetUser.username}
                </span>
              </div>
            )}
          </TableCell>
        )}

        {/* Project - Hidden on tablet */}
        {showProjectColumn && !isTablet && (
          <TableCell>
            {activity.project ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-sm">
                    <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate max-w-[100px]">
                      {activity.project.name}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{activity.project.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {activity.project.hash.substring(0, 16)}...
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </TableCell>
        )}

        {/* Time */}
        <TableCell>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-muted-foreground">
                {formatRelativeTime(activity.createdAt)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {formatDateTime(activity.createdAt)}
            </TooltipContent>
          </Tooltip>
        </TableCell>

        {/* IP Address - Hidden on tablet */}
        {!isTablet && (
          <TableCell>
            {activity.ipAddress ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="font-mono text-xs truncate max-w-[80px]">
                      {activity.ipAddress}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono">{activity.ipAddress}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </TableCell>
        )}

        {/* Expand Button - Only on tablet */}
        {isTablet && (
          <TableCell className="w-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleToggleExpand}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse row details' : 'Expand row details'}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </TableCell>
        )}
      </TableRow>

      {/* Expanded Row Details - Tablet only */}
      {isTablet && isExpanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={showUserColumn ? 4 : 3} className="py-3">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm pl-2">
              {/* Project */}
              {showProjectColumn && (
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="text-muted-foreground">Project:</span>
                  <span>{activity.project?.name || '—'}</span>
                </div>
              )}
              {/* IP Address */}
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="text-muted-foreground">IP:</span>
                <span className="font-mono text-xs">{activity.ipAddress || '—'}</span>
              </div>
              {/* Full Timestamp */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Time:</span>
                <span className="text-xs">{formatDateTime(activity.createdAt)}</span>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
})

// Pre-computed skeleton arrays to avoid recreation on each render
const SKELETON_ITEMS = Array.from({ length: 5 }, (_, i) => i);

// Default config for unknown activity types
const DEFAULT_CONFIG: ActivityConfig = { icon: FileText, variant: 'secondary', label: 'Unknown' };

// Helper to get activity config (pure function, no memoization needed)
const getActivityConfig = (type: ActivityType): ActivityConfig => {
  return ACTIVITY_TYPE_CONFIG[type] || { ...DEFAULT_CONFIG, label: type };
};

// Memoized skeleton components
const MobileLoadingSkeleton = memo(function MobileLoadingSkeleton() {
  return (
    <div className="space-y-3 md:hidden">
      {SKELETON_ITEMS.map((index) => (
        <Card key={`mobile-skeleton-${index}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-full mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

const TabletLoadingSkeleton = memo(function TabletLoadingSkeleton({ showUserColumn }: { showUserColumn: boolean }) {
  return (
    <div className="hidden md:block lg:hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Activity</TableHead>
            {showUserColumn && <TableHead className="w-[150px]">User</TableHead>}
            <TableHead className="w-[120px]">Time</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SKELETON_ITEMS.map((index) => (
            <TableRow key={`tablet-skeleton-${index}`}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </TableCell>
              {showUserColumn && (
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              )}
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

const DesktopLoadingSkeleton = memo(function DesktopLoadingSkeleton({ 
  showUserColumn, 
  showProjectColumn 
}: { 
  showUserColumn: boolean; 
  showProjectColumn: boolean;
}) {
  return (
    <div className="hidden lg:block rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Activity</TableHead>
            {showUserColumn && <TableHead className="w-[150px]">User</TableHead>}
            {showProjectColumn && <TableHead className="w-[150px]">Project</TableHead>}
            <TableHead className="w-[120px]">Time</TableHead>
            <TableHead className="w-[120px]">IP Address</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SKELETON_ITEMS.map((index) => (
            <TableRow key={`desktop-skeleton-${index}`}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </TableCell>
              {showUserColumn && (
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              )}
              {showProjectColumn && (
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              )}
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

/**
 * ActivityTable - Displays activity logs in a responsive format
 * - Mobile (<768px): Card layout with expandable details
 * - Tablet (768px-1023px): Table with collapsed columns and expandable rows
 * - Desktop (≥1024px): Full table layout with all columns visible
 * Requirements: 1.1, 1.2, 1.4, 9.1, 9.2, 9.3
 */
export const ActivityTable = memo(function ActivityTable({
  activities,
  isLoading,
  onRowClick,
  selectedId,
  showUserColumn = true,
  showProjectColumn = true,
  emptyMessage = 'No activities found',
  className,
}: ActivityTableProps): React.JSX.Element {
  // Memoize the activity configs to avoid recalculating on each render
  const activityConfigs = useMemo(() => {
    return activities.map(activity => ({
      activity,
      config: getActivityConfig(activity.activityType),
      isSelected: selectedId === activity.id,
    }));
  }, [activities, selectedId]);

  // Loading state - show responsive skeletons
  if (isLoading && activities.length === 0) {
    return (
      <div className={className}>
        <MobileLoadingSkeleton />
        <TabletLoadingSkeleton showUserColumn={showUserColumn} />
        <DesktopLoadingSkeleton showUserColumn={showUserColumn} showProjectColumn={showProjectColumn} />
      </div>
    );
  }

  // Empty state
  if (!isLoading && activities.length === 0) {
    return (
      <div className={cn('rounded-md border p-8', className)}>
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title={emptyMessage}
          description="Try adjusting your filters to find what you're looking for."
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={className}>
        {/* Mobile: Card Layout (<768px) */}
        <div className="space-y-3 md:hidden">
          {activityConfigs.map(({ activity, config, isSelected }) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              config={config}
              isSelected={isSelected}
              onRowClick={onRowClick}
              showUserColumn={showUserColumn}
              showProjectColumn={showProjectColumn}
            />
          ))}
        </div>

        {/* Tablet: Collapsed Table (768px-1023px) */}
        <div className="hidden md:block lg:hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Activity</TableHead>
                {showUserColumn && <TableHead className="w-[150px]">User</TableHead>}
                <TableHead className="w-[120px]">Time</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityConfigs.map(({ activity, config, isSelected }) => (
                <ActivityTableRow
                  key={activity.id}
                  activity={activity}
                  config={config}
                  isSelected={isSelected}
                  onRowClick={onRowClick}
                  showUserColumn={showUserColumn}
                  showProjectColumn={showProjectColumn}
                  isTablet={true}
                />
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Desktop: Full Table (≥1024px) */}
        <div className="hidden lg:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Activity</TableHead>
                {showUserColumn && <TableHead className="w-[150px]">User</TableHead>}
                {showProjectColumn && <TableHead className="w-[150px]">Project</TableHead>}
                <TableHead className="w-[120px]">Time</TableHead>
                <TableHead className="w-[120px]">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityConfigs.map(({ activity, config, isSelected }) => (
                <ActivityTableRow
                  key={activity.id}
                  activity={activity}
                  config={config}
                  isSelected={isSelected}
                  onRowClick={onRowClick}
                  showUserColumn={showUserColumn}
                  showProjectColumn={showProjectColumn}
                  isTablet={false}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
})

export default ActivityTable;
