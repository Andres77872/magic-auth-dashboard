import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  FolderKanban, 
  Users, 
  ShieldCheck, 
  Settings, 
  ChevronDown,
  ChevronUp,
  LogIn,
  LogOut,
  Trash2,
  Edit
} from 'lucide-react';
import type { Activity } from '@/types/analytics.types';

interface ActivityItemProps {
  activity: Activity;
}

const severityConfig = {
  info: {
    bg: 'bg-info/10',
    border: 'border-info/20',
    icon: 'text-info',
    badge: 'bg-info/10 text-info border-info/30',
  },
  warning: {
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    icon: 'text-warning',
    badge: 'bg-warning/10 text-warning border-warning/30',
  },
  critical: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
    icon: 'text-destructive',
    badge: 'bg-destructive/10 text-destructive border-destructive/30',
  },
};

const userTypeConfig = {
  root: 'bg-destructive/10 text-destructive border-destructive/30',
  admin: 'bg-warning/10 text-warning border-warning/30',
  consumer: 'bg-primary/10 text-primary border-primary/30',
};

export function ActivityItem({ activity }: ActivityItemProps): React.JSX.Element {
  const [showMetadata, setShowMetadata] = useState(false);
  const config = severityConfig[activity.severity] || severityConfig.info;

  const getActivityIcon = (type: Activity['type']) => {
    const iconProps = { size: 18, className: config.icon };
    
    const icons: Record<Activity['type'], React.ReactElement> = {
      'user_created': <User {...iconProps} />,
      'user_updated': <Edit {...iconProps} />,
      'user_deleted': <Trash2 {...iconProps} />,
      'login': <LogIn {...iconProps} />,
      'logout': <LogOut {...iconProps} />,
      'project_created': <FolderKanban {...iconProps} />,
      'project_updated': <FolderKanban {...iconProps} />,
      'project_deleted': <Trash2 {...iconProps} />,
      'group_created': <Users {...iconProps} />,
      'group_updated': <Users {...iconProps} />,
      'permission_changed': <ShieldCheck {...iconProps} />,
      'system_event': <Settings {...iconProps} />,
    };

    return icons[type] || icons.system_event;
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now.getTime() - time.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return time.toLocaleDateString();
    }
  };

  const hasMetadata = activity.metadata && Object.keys(activity.metadata).length > 0;

  return (
    <div className={cn(
      'relative flex gap-4 p-4 rounded-lg border transition-all',
      'hover:bg-muted/30',
      config.border
    )}>
      {/* Icon */}
      <div className={cn(
        'shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
        config.bg
      )}>
        {getActivityIcon(activity.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground line-clamp-1">
              {activity.title}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {activity.description}
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {formatRelativeTime(activity.timestamp)}
          </span>
        </div>

        {/* User & metadata section */}
        <div className="flex flex-wrap items-center gap-3">
          {/* User info */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                {activity.user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-foreground font-medium">
              {activity.user.username}
            </span>
            <Badge 
              variant="outline" 
              className={cn('text-[10px] px-1.5 py-0', userTypeConfig[activity.user.user_type as keyof typeof userTypeConfig])}
            >
              {activity.user.user_type.toUpperCase()}
            </Badge>
          </div>

          {/* Metadata toggle */}
          {hasMetadata && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetadata(!showMetadata)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {showMetadata ? (
                <>
                  <ChevronUp size={14} className="mr-1" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown size={14} className="mr-1" />
                  Show details
                </>
              )}
            </Button>
          )}
        </div>

        {/* Metadata details */}
        {showMetadata && hasMetadata && (
          <div className="mt-3 p-3 rounded-md bg-muted/50 border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(activity.metadata!).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-foreground font-medium ml-2 truncate max-w-[200px]">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityItem;
