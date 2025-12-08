import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditStatsCards } from './AuditStatsCards';
import { useAuditStatistics } from '@/hooks/audit/useAuditStatistics';
import { RefreshCw, Calendar } from 'lucide-react';

/**
 * Date range options for statistics
 */
const DATE_RANGE_OPTIONS = [
  { value: '1', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

export interface AuditStatisticsTabProps {
  dateRange?: {
    start: string;
    end: string;
  };
  className?: string;
}

/**
 * AuditStatisticsTab - Aggregate audit statistics and analytics
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function AuditStatisticsTab({
  className,
}: AuditStatisticsTabProps): React.JSX.Element {
  const [days, setDays] = React.useState(7);
  const { statistics, isLoading, error, refetch } = useAuditStatistics({ days });

  // Handle date range change
  const handleDaysChange = useCallback((value: string) => {
    setDays(parseInt(value, 10));
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Get status code badge variant
  const getStatusCodeVariant = (statusCode: number): 'success' | 'warning' | 'error' | 'secondary' => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    if (statusCode >= 500) return 'error';
    return 'secondary';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Audit Statistics</h3>
          <p className="text-sm text-muted-foreground">
            System activity overview and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={handleDaysChange}>
            <SelectTrigger className="w-[150px]" aria-label="Select time period">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-1"
            aria-label="Refresh statistics"
          >
            <RefreshCw
              className={cn('h-4 w-4', isLoading && 'animate-spin')}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div
          className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
          role="alert"
        >
          <p className="text-sm text-destructive font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Overview Stats Cards */}
      <AuditStatsCards
        totalRequests={statistics?.overview.totalRequests || 0}
        successCount={statistics?.overview.successCount || 0}
        failureCount={statistics?.overview.failureCount || 0}
        successRate={statistics?.overview.successRate || 0}
        avgDurationMs={statistics?.overview.avgDurationMs || 0}
        isLoading={isLoading}
      />

      {/* Method Breakdown and Top Endpoints Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requests by Method</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : statistics?.byMethod && statistics.byMethod.length > 0 ? (
              <div className="space-y-4">
                {statistics.byMethod.map((method) => {
                  const percentage = statistics.overview.totalRequests > 0
                    ? (method.count / statistics.overview.totalRequests) * 100
                    : 0;
                  
                  return (
                    <div key={method.method} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" size="sm">
                            {method.method}
                          </Badge>
                          <span className="text-muted-foreground">
                            {method.count.toLocaleString()} requests
                          </span>
                        </div>
                        <span className="font-medium">
                          {method.successRate.toFixed(1)}% success
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No method data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Activity Types</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : statistics?.topEndpoints && statistics.topEndpoints.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity Type</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Success Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statistics.topEndpoints.map((endpoint) => (
                    <TableRow key={endpoint.endpoint}>
                      <TableCell className="font-medium">
                        {endpoint.endpoint.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-right">
                        {endpoint.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={endpoint.successRate >= 95 ? 'success' : endpoint.successRate >= 80 ? 'warning' : 'error'}
                          size="sm"
                        >
                          {endpoint.successRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No endpoint data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Code Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Code Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 flex-1" />
              ))}
            </div>
          ) : statistics?.statusDistribution && statistics.statusDistribution.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {statistics.statusDistribution.map((status) => (
                <div
                  key={status.statusCode}
                  className={cn(
                    'p-4 rounded-lg border text-center',
                    status.statusCode >= 200 && status.statusCode < 300 && 'bg-success/5 border-success/20',
                    status.statusCode >= 400 && status.statusCode < 500 && 'bg-warning/5 border-warning/20',
                    status.statusCode >= 500 && 'bg-destructive/5 border-destructive/20'
                  )}
                >
                  <Badge
                    variant={getStatusCodeVariant(status.statusCode)}
                    className="mb-2"
                  >
                    {status.statusCode}
                  </Badge>
                  <p className="text-2xl font-bold">{status.count.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {status.percentage.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No status distribution data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Generation timestamp */}
      {statistics?.generatedAt && (
        <p className="text-xs text-muted-foreground text-right">
          Statistics generated at {new Date(statistics.generatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default AuditStatisticsTab;
