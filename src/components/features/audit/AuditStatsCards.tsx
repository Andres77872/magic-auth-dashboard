import React from 'react';
import { cn } from '@/lib/utils';
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { StatCard } from '@/components/common';

export interface AuditStatsCardsProps {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDurationMs: number;
  isLoading?: boolean;
  className?: string;
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
        value={totalRequests.toLocaleString()}
        icon={<Activity className="h-5 w-5" aria-hidden="true" />}
        loading={isLoading}
      />

      {/* Success Rate */}
      <StatCard
        title="Success Rate"
        value={`${successRate.toFixed(1)}%`}
        subValue={`${successCount.toLocaleString()} successful`}
        icon={<CheckCircle className="h-5 w-5" aria-hidden="true" />}
        progress={{ value: successRate, color: 'success' }}
        variant="success"
        loading={isLoading}
      />

      {/* Failure Count */}
      <StatCard
        title="Failed Requests"
        value={failureCount.toLocaleString()}
        subValue={`${((failureCount / totalRequests) * 100 || 0).toFixed(1)}% of total`}
        icon={<XCircle className="h-5 w-5" aria-hidden="true" />}
        variant={failureCount > 0 ? 'warning' : 'default'}
        loading={isLoading}
      />

      {/* Average Response Time */}
      <StatCard
        title="Avg. Response Time"
        value={formatDuration(avgDurationMs)}
        icon={<Clock className="h-5 w-5" aria-hidden="true" />}
        loading={isLoading}
      />
    </div>
  );
}

export default AuditStatsCards;
