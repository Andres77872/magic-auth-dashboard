import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { StatCard } from '@/components/common';
import { formatRelativeTime } from '@/utils/component-utils';

/**
 * Threshold for failed login warning
 */
const FAILED_LOGIN_WARNING_THRESHOLD = 10;

export interface SecuritySummaryCardsProps {
  failedLogins: number;
  unauthorizedAttempts: number;
  criticalEvents: number;
  lastSecurityEvent?: string | null;
  isLoading?: boolean;
  className?: string;
}

/**
 * SecuritySummaryCards - Summary cards showing security metrics
 * Requirements: 3.2, 3.3
 */
export function SecuritySummaryCards({
  failedLogins,
  unauthorizedAttempts,
  criticalEvents,
  lastSecurityEvent,
  isLoading = false,
  className,
}: SecuritySummaryCardsProps): React.JSX.Element {
  const showFailedLoginWarning = failedLogins >= FAILED_LOGIN_WARNING_THRESHOLD;

  return (
    <div
      className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}
      role="region"
      aria-label="Security summary"
    >
      {/* Failed Logins */}
      <StatCard
        title="Failed Logins"
        value={failedLogins.toLocaleString()}
        icon={<ShieldX className="h-5 w-5" aria-hidden="true" />}
        variant={showFailedLoginWarning ? 'warning' : 'default'}
        gradient={showFailedLoginWarning}
        badge={
          showFailedLoginWarning ? (
            <Badge variant="warning" size="sm" className="gap-1">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              Warning
            </Badge>
          ) : undefined
        }
        subValue={
          showFailedLoginWarning
            ? 'High number of failed login attempts detected'
            : undefined
        }
        loading={isLoading}
      />

      {/* Unauthorized Attempts */}
      <StatCard
        title="Unauthorized Attempts"
        value={unauthorizedAttempts.toLocaleString()}
        icon={<ShieldAlert className="h-5 w-5" aria-hidden="true" />}
        variant={unauthorizedAttempts > 0 ? 'warning' : 'default'}
        gradient={unauthorizedAttempts > 0}
        loading={isLoading}
      />

      {/* Critical Events */}
      <StatCard
        title="Critical Events"
        value={criticalEvents.toLocaleString()}
        icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
        className={criticalEvents > 0 ? 'border-destructive/50 bg-destructive/5' : undefined}
        badge={
          criticalEvents > 0 ? (
            <Badge variant="destructive" size="sm">
              Alert
            </Badge>
          ) : undefined
        }
        loading={isLoading}
      />

      {/* Last Security Event */}
      <StatCard
        title="Last Security Event"
        value={
          lastSecurityEvent
            ? formatRelativeTime(lastSecurityEvent)
            : 'No events'
        }
        icon={<Clock className="h-5 w-5" aria-hidden="true" />}
        loading={isLoading}
      />
    </div>
  );
}

export default SecuritySummaryCards;
