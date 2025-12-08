/**
 * NotificationBell Component
 * 
 * Notification indicator in the header with dropdown panel.
 * Shows unread count badge when notifications are available.
 * 
 * @see docs/DESIGN_SYSTEM/DASHBOARD_PATTERNS.md
 */
import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  count?: number;
}

export function NotificationBell({ count = 0 }: NotificationBellProps): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'relative flex items-center justify-center w-10 h-10 rounded-lg',
            'bg-transparent border border-transparent cursor-pointer',
            'text-muted-foreground',
            'transition-all duration-200',
            'hover:bg-muted hover:border-border hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
          )}
          aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
        >
          <Bell size={20} />
          {count > 0 && (
            <span 
              className={cn(
                'absolute -top-0.5 -right-0.5',
                'flex items-center justify-center',
                'min-w-[18px] h-[18px] px-1',
                'bg-destructive text-destructive-foreground',
                'rounded-full text-[10px] font-bold leading-none',
                'ring-2 ring-card'
              )}
              aria-hidden="true"
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="m-0 text-sm font-semibold text-foreground">Notifications</h3>
          {count > 0 && (
            <span className="text-xs text-muted-foreground">{count} unread</span>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <BellOff size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">All caught up!</p>
              <p className="text-xs text-muted-foreground">No new notifications at this time</p>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell; 