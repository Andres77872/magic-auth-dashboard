import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

export interface AuditStatsCardsProps {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDurationMs: number;
  isLoading?: boolean;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  iconColor?: string;
  progress?: number;
  progressColor?: string;
  isLoading?: boolean;
}

/**
 * StatCard - Individual statistics display card
 */
function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  progress,
  progressColor,
  isLoading = false,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              {progress !== undefined && <Skeleton className="h-2 w-full mt-2" />}
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold truncate">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subValue && (
              <p className="text-xs text-muted-foreground">{subValue}</p>
            )}
            {progress !== undefined && (
              <Progress
                value={progress}
                className={cn('h-1.5 mt-2', progressColor)}
              />
            )}
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted flex-shrink-0 ml-4">
            <Icon className={cn('h-5 w-5', iconColor)} aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * AuditStatsCards - Statistics cards showing audit metrics
 * Requirements: 5.1
 */
export function AuditStatsCards({
  totalRequests,
  successCount,
  failureCount,
  successRate,
  avgDurationMs,
  isLoading = false,
  className,
}: AuditStatsCardsProps): React.JSX.Element {
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div
      className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}
      role="region"
      aria-label="Audit statistics"
    >
      {/* Total Requests */}
      <StatCard
        title="Total Requests"
        value={totalRequests}
        icon={Activity}
        iconColor="text-primary"
        isLoading={isLoading}
      />

      {/* Success Rate */}
      <StatCard
        title="Success Rate"
        value={`${successRate.toFixed(1)}%`}
        subValue={`${successCount.toLocaleString()} successful`}
        icon={CheckCircle}
        iconColor="text-success"
        progress={successRate}
        progressColor="[&>div]:bg-success"
        isLoading={isLoading}
      />

      {/* Failure Count */}
      <StatCard
        title="Failed Requests"
        value={failureCount}
        subValue={`${((failureCount / totalRequests) * 100 || 0).toFixed(1)}% of total`}
        icon={XCircle}
        iconColor={failureCount > 0 ? 'text-destructive' : 'text-muted-foreground'}
        isLoading={isLoading}
      />

      {/* Average Response Time */}
      <StatCard
        title="Avg. Response Time"
        value={formatDuration(avgDurationMs)}
        icon={Clock}
        iconColor="text-info"
        isLoading={isLoading}
      />
    </div>
  );
}

export default AuditStatsCards;
