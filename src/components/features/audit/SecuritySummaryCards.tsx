import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Clock,
} from 'lucide-react';
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

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  variant: 'default' | 'warning' | 'critical';
  showWarning?: boolean;
  warningMessage?: string;
  isLoading?: boolean;
}

/**
 * MetricCard - Individual metric display card
 */
function MetricCard({
  title,
  value,
  icon: Icon,
  variant,
  showWarning = false,
  warningMessage,
  isLoading = false,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        variant === 'warning' && 'border-warning/50 bg-warning/5',
        variant === 'critical' && 'border-destructive/50 bg-destructive/5'
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  'text-2xl font-bold',
                  variant === 'critical' && 'text-destructive',
                  variant === 'warning' && 'text-warning'
                )}
              >
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {showWarning && (
                <Badge variant="warning" size="sm" className="gap-1">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  Warning
                </Badge>
              )}
            </div>
            {warningMessage && (
              <p className="text-xs text-warning mt-1">{warningMessage}</p>
            )}
          </div>
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg',
              variant === 'default' && 'bg-muted',
              variant === 'warning' && 'bg-warning/10',
              variant === 'critical' && 'bg-destructive/10'
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                variant === 'default' && 'text-muted-foreground',
                variant === 'warning' && 'text-warning',
                variant === 'critical' && 'text-destructive'
              )}
              aria-hidden="true"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
      <MetricCard
        title="Failed Logins"
        value={failedLogins}
        icon={ShieldX}
        variant={showFailedLoginWarning ? 'warning' : 'default'}
        showWarning={showFailedLoginWarning}
        warningMessage={
          showFailedLoginWarning
            ? `High number of failed login attempts detected`
            : undefined
        }
        isLoading={isLoading}
      />

      {/* Unauthorized Attempts */}
      <MetricCard
        title="Unauthorized Attempts"
        value={unauthorizedAttempts}
        icon={ShieldAlert}
        variant={unauthorizedAttempts > 0 ? 'warning' : 'default'}
        isLoading={isLoading}
      />

      {/* Critical Events */}
      <MetricCard
        title="Critical Events"
        value={criticalEvents}
        icon={AlertTriangle}
        variant={criticalEvents > 0 ? 'critical' : 'default'}
        isLoading={isLoading}
      />

      {/* Last Security Event */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Last Security Event
                </p>
                <p className="text-lg font-semibold">
                  {lastSecurityEvent
                    ? formatRelativeTime(lastSecurityEvent)
                    : 'No events'}
                </p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SecuritySummaryCards;
