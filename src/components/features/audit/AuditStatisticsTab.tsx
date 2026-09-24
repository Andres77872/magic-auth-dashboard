/**
 * API traffic statistics (`GET /admin/audit/statistics`): totals, success
 * rate, latency, method mix, busiest endpoints and status codes.
 */

import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Panel } from '@/components/common/Panel';
import { StatCard } from '@/components/common/StatCard';
import { TabNavigation } from '@/components/common/TabNavigation';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditStatistics } from '@/hooks/audit/useAuditData';
import {
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { RefreshButton } from './AuditFilterControls';
import { formatDuration, statusCodeVariant } from './audit-format';

export interface AuditStatisticsTabProps {
  className?: string;
}

const RANGES = [
  { id: '1', label: '24 hours' },
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
];

function successVariant(
  rate: number | null
): 'success' | 'warning' | 'destructive' | 'secondary' {
  if (rate === null) return 'secondary';
  if (rate >= 95) return 'success';
  if (rate >= 80) return 'warning';
  return 'destructive';
}

function ListSkeleton({ rows = 5 }: { rows?: number }): React.JSX.Element {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-5" />
      ))}
    </div>
  );
}

export function AuditStatisticsTab({
  className,
}: AuditStatisticsTabProps): React.JSX.Element {
  const [range, setRange] = useState('7');
  const { statistics, isLoading, isRefreshing, error, refetch } =
    useAuditStatistics(Number(range));
  const overview = statistics?.overview;
  const noTraffic =
    statistics !== null && statistics.overview.totalRequests === 0;

  if (error && !statistics && !isLoading) {
    return (
      <ErrorState
        title="Statistics could not be loaded"
        message={error}
        onRetry={() => void refetch()}
        isRetrying={isRefreshing}
      />
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabNavigation
          variant="segmented"
          size="sm"
          ariaLabel="Time range"
          activeTab={range}
          onChange={setRange}
          tabs={RANGES}
        />
        <div className="flex items-center gap-3">
          {statistics && (
            <span className="text-xs text-muted-foreground">
              Generated {formatRelativeTime(statistics.generatedAt)}
            </span>
          )}
          <RefreshButton
            onClick={() => void refetch()}
            refreshing={isRefreshing}
            label="Refresh statistics"
          />
        </div>
      </div>

      <section
        aria-label="Traffic totals"
        className="grid grid-cols-2 gap-3.5 xl:grid-cols-4"
      >
        <StatCard
          title="Requests"
          value={formatNumber(overview?.totalRequests)}
          loading={isLoading}
        />
        <StatCard
          title="Success rate"
          value={formatPercent(overview?.successRate)}
          loading={isLoading}
          variant={
            overview && overview.successRate < 95 ? 'warning' : 'success'
          }
          subValue={
            overview
              ? `${formatNumber(overview.successCount)} succeeded`
              : undefined
          }
        />
        <StatCard
          title="Failed"
          value={formatNumber(overview?.failureCount)}
          loading={isLoading}
          subValue="4xx and 5xx responses"
        />
        <StatCard
          title="Avg latency"
          value={formatDuration(overview?.avgDurationMs)}
          loading={isLoading}
          subValue={
            overview
              ? `Slowest ${formatDuration(overview.maxDurationMs)}`
              : undefined
          }
        />
      </section>

      {noTraffic ? (
        <Panel>
          <EmptyState
            icon={<BarChart3 />}
            title="No API traffic in this range"
            description="Requests are counted once clients call the API. Try a longer range."
            size="sm"
          />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="flex min-w-0 flex-col gap-6">
            <Panel title="Requests by method">
              {isLoading || !statistics ? (
                <ListSkeleton rows={4} />
              ) : (
                <ul className="m-0 list-none space-y-3 p-0">
                  {statistics.byMethod.map((method) => {
                    const share =
                      statistics.overview.totalRequests > 0
                        ? (method.count / statistics.overview.totalRequests) *
                          100
                        : 0;
                    return (
                      <li key={method.method} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-[13px]">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {method.method}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {formatNumber(method.count)} ·{' '}
                            {formatDuration(method.avgDurationMs)} avg
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.max(share, 1)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel title="Status codes">
              {isLoading || !statistics ? (
                <ListSkeleton rows={3} />
              ) : (
                <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-3">
                  {statistics.statusDistribution.map((status) => (
                    <li
                      key={status.statusCode}
                      className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <Badge
                        variant={statusCodeVariant(status.statusCode)}
                        size="sm"
                      >
                        {status.statusCode}
                      </Badge>
                      <span className="text-right text-xs tabular-nums text-muted-foreground">
                        <span className="block font-medium text-foreground">
                          {formatNumber(status.count)}
                        </span>
                        {formatPercent(status.percentage)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel
            title="Busiest endpoints"
            description="Top 20 by request count"
            padding="none"
          >
            {isLoading || !statistics ? (
              <div className="px-5 py-4">
                <ListSkeleton rows={8} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th scope="col" className="px-5 py-2 font-medium">
                        Endpoint
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-medium"
                      >
                        Requests
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-medium"
                      >
                        Success
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-2 text-right font-medium"
                      >
                        Avg latency
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {statistics.topEndpoints.map((endpoint) => (
                      <tr key={endpoint.endpoint}>
                        <td
                          className="max-w-[320px] truncate px-5 py-2 font-mono text-xs text-foreground"
                          title={endpoint.endpoint}
                        >
                          {endpoint.endpoint}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatNumber(endpoint.count)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Badge
                            variant={successVariant(endpoint.successRate)}
                            size="sm"
                          >
                            {formatPercent(endpoint.successRate)}
                          </Badge>
                        </td>
                        <td className="px-5 py-2 text-right tabular-nums text-muted-foreground">
                          {formatDuration(endpoint.avgDurationMs)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

export default AuditStatisticsTab;
