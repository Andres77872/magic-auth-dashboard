import React, { memo, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Copy,
  Check,
  User,
  FolderKanban,
  Clock,
  Globe,
  ExternalLink,
  FileJson,
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
} from 'lucide-react';
import { formatDateTime } from '@/utils/component-utils';
import type { ActivityLog, ActivityType } from '@/types/audit.types';

type ActivityConfig = { icon: React.ElementType; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'; label: string };

/**
 * Activity type configuration for icons and colors
 */
const ACTIVITY_TYPE_CONFIG: Record<
  ActivityType,
  { icon: React.ElementType; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'; label: string }
> = {
  user_login: { icon: LogIn, variant: 'success', label: 'User Login' },
  user_logout: { icon: LogOut, variant: 'secondary', label: 'User Logout' },
  user_registration: { icon: UserPlus, variant: 'info', label: 'User Registration' },
  user_update: { icon: UserCog, variant: 'primary', label: 'User Update' },
  user_status_change: { icon: UserCog, variant: 'warning', label: 'User Status Change' },
  user_password_reset: { icon: Shield, variant: 'warning', label: 'Password Reset' },
  user_type_changed: { icon: UserCog, variant: 'warning', label: 'User Type Changed' },
  project_creation: { icon: FolderPlus, variant: 'success', label: 'Project Created' },
  project_update: { icon: FolderCog, variant: 'primary', label: 'Project Updated' },
  project_delete: { icon: FolderMinus, variant: 'error', label: 'Project Deleted' },
  project_member_add: { icon: UserPlus, variant: 'info', label: 'Project Member Added' },
  project_member_remove: { icon: UserMinus, variant: 'warning', label: 'Project Member Removed' },
  project_ownership_transferred: { icon: FolderCog, variant: 'warning', label: 'Ownership Transferred' },
  project_archived: { icon: FolderMinus, variant: 'secondary', label: 'Project Archived' },
  project_unarchived: { icon: FolderPlus, variant: 'info', label: 'Project Unarchived' },
  group_creation: { icon: Users, variant: 'success', label: 'Group Created' },
  group_update: { icon: Users, variant: 'primary', label: 'Group Updated' },
  group_delete: { icon: Users, variant: 'error', label: 'Group Deleted' },
  user_group_assign: { icon: UserPlus, variant: 'info', label: 'User Added to Group' },
  user_group_remove: { icon: UserMinus, variant: 'warning', label: 'User Removed from Group' },
  permission_grant: { icon: Shield, variant: 'warning', label: 'Permission Granted' },
  permission_revoke: { icon: ShieldOff, variant: 'warning', label: 'Permission Revoked' },
  role_removed: { icon: ShieldOff, variant: 'warning', label: 'Role Removed' },
  bulk_role_assignment: { icon: Layers, variant: 'warning', label: 'Bulk Role Assignment' },
  bulk_group_assignment: { icon: Layers, variant: 'warning', label: 'Bulk Group Assignment' },
  bulk_user_update: { icon: Layers, variant: 'warning', label: 'Bulk User Update' },
  bulk_user_delete: { icon: Layers, variant: 'error', label: 'Bulk User Delete' },
  admin_action: { icon: Settings, variant: 'warning', label: 'Admin Action' },
  system_event: { icon: AlertTriangle, variant: 'info', label: 'System Event' },
};

export interface ActivityDetailPanelProps {
  activity: ActivityLog | null;
  isOpen: boolean;
  onClose: () => void;
  onUserClick?: (userId: string) => void;
  onProjectClick?: (projectId: string) => void;
  className?: string;
}

/**
 * DetailRow - A row displaying a label and value
 */
const DetailRow = memo(function DetailRow({
  label,
  value,
  icon: Icon,
  monospace = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  monospace?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <div className={cn('flex items-center gap-2', monospace && 'font-mono text-sm')}>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />}
        <span className="break-all">{value}</span>
      </div>
    </div>
  );
})

/**
 * CopyButton - A button that copies text to clipboard
 */
const CopyButton = memo(function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [text]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 w-7 p-0"
          aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{copied ? 'Copied!' : 'Copy to clipboard'}</p>
      </TooltipContent>
    </Tooltip>
  );
})

// Default config for unknown activity types
const DEFAULT_DETAIL_CONFIG: ActivityConfig = { icon: FileText, variant: 'secondary', label: 'Unknown' };

// Helper to get activity config (pure function)
const getActivityConfig = (type: ActivityType): ActivityConfig => {
  return ACTIVITY_TYPE_CONFIG[type] || { ...DEFAULT_DETAIL_CONFIG, label: type };
};

/**
 * ActivityDetailPanel - Slide-out panel showing detailed activity information
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export const ActivityDetailPanel = memo(function ActivityDetailPanel({
  activity,
  isOpen,
  onClose,
  onUserClick,
  onProjectClick,
}: ActivityDetailPanelProps): React.JSX.Element {
  // Memoize the close handler
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) onClose();
  }, [onClose]);

  // Memoize the config based on activity type
  const config = useMemo(() => {
    if (!activity) return null;
    return getActivityConfig(activity.activityType);
  }, [activity?.activityType]);

  // Memoize click handlers
  const handleUserClick = useCallback(() => {
    if (activity?.user && onUserClick) {
      onUserClick(activity.user.id);
    }
  }, [activity?.user, onUserClick]);

  const handleTargetUserClick = useCallback(() => {
    if (activity?.targetUser && onUserClick) {
      onUserClick(activity.targetUser.id);
    }
  }, [activity?.targetUser, onUserClick]);

  const handleProjectClick = useCallback(() => {
    if (activity?.project && onProjectClick) {
      onProjectClick(activity.project.id);
    }
  }, [activity?.project, onProjectClick]);

  // Memoize the JSON details
  const detailsJson = useMemo(() => {
    if (!activity || Object.keys(activity.details).length === 0) return null;
    return JSON.stringify(activity.details, null, 2);
  }, [activity?.details]);

  if (!activity || !config) {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>Activity Details</SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No activity selected
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const IconComponent = config.icon;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-[540px] overflow-y-auto">
        <TooltipProvider>
          <SheetHeader>
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg',
                    config.variant === 'success' && 'bg-success/10',
                    config.variant === 'error' && 'bg-destructive/10',
                    config.variant === 'warning' && 'bg-warning/10',
                    config.variant === 'info' && 'bg-info/10',
                    config.variant === 'primary' && 'bg-primary/10',
                    config.variant === 'secondary' && 'bg-muted'
                  )}
                >
                  <IconComponent
                    className={cn(
                      'h-5 w-5',
                      config.variant === 'success' && 'text-success',
                      config.variant === 'error' && 'text-destructive',
                      config.variant === 'warning' && 'text-warning',
                      config.variant === 'info' && 'text-info',
                      config.variant === 'primary' && 'text-primary',
                      config.variant === 'secondary' && 'text-muted-foreground'
                    )}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <SheetTitle className="text-left">{config.label}</SheetTitle>
                  <SheetDescription className="text-left">
                    Activity details and metadata
                  </SheetDescription>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Activity ID */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                  Activity ID
                </span>
                <span className="font-mono text-sm">{activity.id}</span>
              </div>
              <CopyButton text={activity.id} />
            </div>

            {/* Timestamp */}
            <DetailRow
              label="Timestamp"
              value={formatDateTime(activity.createdAt)}
              icon={Clock}
            />

            {/* Activity Type Badge */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Activity Type
              </span>
              <Badge variant={config.variant} className="w-fit gap-1.5">
                <IconComponent className="h-3.5 w-3.5" aria-hidden="true" />
                {config.label}
              </Badge>
            </div>

            <Separator />

            {/* User Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">User Information</h4>

              {activity.user ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <DetailRow
                      label="Performed By"
                      value={activity.user.username}
                      icon={User}
                    />
                    {onUserClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUserClick}
                        className="gap-1"
                      >
                        View Profile
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                  <DetailRow
                    label="User Hash"
                    value={activity.user.userHash}
                    monospace
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">System action</p>
              )}

              {activity.targetUser && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Target User</h4>
                    <div className="flex items-center justify-between">
                      <DetailRow
                        label="Username"
                        value={activity.targetUser.username}
                        icon={User}
                      />
                      {onUserClick && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleTargetUserClick}
                          className="gap-1"
                        >
                          View Profile
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                    <DetailRow
                      label="User Hash"
                      value={activity.targetUser.userHash}
                      monospace
                    />
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Project Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Project Context</h4>

              {activity.project ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <DetailRow
                      label="Project Name"
                      value={activity.project.name}
                      icon={FolderKanban}
                    />
                    {onProjectClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleProjectClick}
                        className="gap-1"
                      >
                        View Project
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                  <DetailRow
                    label="Project Hash"
                    value={activity.project.hash}
                    monospace
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No project context</p>
              )}
            </div>

            <Separator />

            {/* IP Address */}
            <DetailRow
              label="IP Address"
              value={activity.ipAddress || 'Not recorded'}
              icon={Globe}
              monospace={!!activity.ipAddress}
            />

            <Separator />

            {/* Activity Details (JSON) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Additional Details
                </span>
              </div>
              {detailsJson ? (
                <pre className="p-3 bg-muted/50 rounded-lg text-xs font-mono overflow-x-auto max-h-[200px] overflow-y-auto">
                  {detailsJson}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No additional details</p>
              )}
            </div>
          </div>
        </TooltipProvider>
      </SheetContent>
    </Sheet>
  );
});

export default ActivityDetailPanel;
