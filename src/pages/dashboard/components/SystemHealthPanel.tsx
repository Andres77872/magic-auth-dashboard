import React from 'react';
import {
  RefreshCw,
  XCircle,
  Clock,
  Activity,
  Database,
  HardDrive,
  Gauge,
} from 'lucide-react';
import { HealthIndicator } from './HealthIndicator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { statusTone, toneClasses, type StatusTone } from '@/lib/status-tone';
import { useSystemCacheStats, useUserType } from '@/hooks';
import type { SystemHealthData } from '@/types/dashboard.types';
import {
  EmailPipelineSection,
  PatreonHealthSection,
  BillingHealthSection,
  UnknownComponentsSection,
} from './health';

interface SystemHealthPanelProps {
  health: SystemHealthData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

// Solid dot color per tone (toneClasses gives a faint /10 fill, too light for the
// pulsing status dot).
const TONE_DOT: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  muted: 'bg-muted-foreground',
};

// Core infra checks keep the existing compact HealthIndicator cards.
const CORE_KEYS = ['database', 'redis', 'group_system'];
// The API duplicates billing's children at the top level; hide the duplicates
// since the same data already appears nested under `billing`.
const IGNORED_DUPLICATE_KEYS = ['billing_provider_stripe', 'billing_webhooks', 'billing_sync'];
// Keys already surfaced by a curated section (so UnknownComponentsSection skips them).
const HANDLED_KEYS = [
  ...CORE_KEYS,
  'email_provider',
  'email_outbox',
  'email_worker',
  'patreon',
  'billing',
  ...IGNORED_DUPLICATE_KEYS,
];

export function SystemHealthPanel({
  health,
  isLoading,
  error,
  onRefresh,
}: SystemHealthPanelProps): React.JSX.Element {
  const { isRoot } = useUserType();
  const { cacheStats, isLoading: cacheLoading } = useSystemCacheStats(isRoot);

  if (!isRoot) {
    return <></>;
  }

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (error) {
    return (
      <Card className="mt-6 border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle>System Health Monitor</CardTitle>
              <CardDescription>
                Real-time monitoring of system components
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground">
              Health Check Failed
            </h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">{error}</p>
            <Button onClick={onRefresh} disabled={isLoading} variant="outline">
              <RefreshCw
                className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')}
              />
              {isLoading ? 'Checking...' : 'Retry'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rollupTone = statusTone(health?.status);

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle>System Health Monitor</CardTitle>
              <CardDescription>
                Real-time monitoring of critical system components
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')}
            />
            {isLoading ? 'Checking...' : 'Refresh'}
          </Button>
        </div>

        {health && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-3 w-3 rounded-full animate-pulse motion-reduce:animate-none',
                  TONE_DOT[rollupTone]
                )}
                aria-hidden="true"
              />
              <span className="text-sm text-foreground">System Status:</span>
              <Badge variant="outline" className={toneClasses(rollupTone)}>
                {health.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              Last updated: {formatTimestamp(health.timestamp)}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Component Health Indicators */}
        {isLoading && !health ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : health ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {health.components.database && (
              <HealthIndicator
                title="Database"
                component={health.components.database}
              />
            )}
            {health.components.redis && (
              <HealthIndicator
                title="Redis Cache"
                component={health.components.redis}
              />
            )}
            {health.components.group_system && (
              <HealthIndicator
                title="Group System"
                component={health.components.group_system}
              />
            )}
          </div>
        ) : null}

        {/* Cache Statistics Panel */}
        {(cacheStats || cacheLoading) && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-4 w-4 text-info" />
              <h4 className="text-sm font-semibold text-foreground">
                Cache Performance
              </h4>
            </div>

            {cacheLoading && !cacheStats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : cacheStats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Keys */}
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Cached Keys
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {cacheStats.total_keys?.toLocaleString() || 0}
                  </p>
                </div>

                {/* Memory Usage */}
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Memory Used
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {cacheStats.memory_used_mb?.toFixed(1) || 0} MB
                  </p>
                </div>

                {/* Hit Rate */}
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Hit Rate
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        (cacheStats.hit_rate || 0) >= 0.8 &&
                          'bg-success/10 text-success border-success/30',
                        (cacheStats.hit_rate || 0) >= 0.5 &&
                          (cacheStats.hit_rate || 0) < 0.8 &&
                          'bg-warning/10 text-warning border-warning/30',
                        (cacheStats.hit_rate || 0) < 0.5 &&
                          'bg-destructive/10 text-destructive border-destructive/30'
                      )}
                    >
                      {((cacheStats.hit_rate || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress
                    value={(cacheStats.hit_rate || 0) * 100}
                    className="h-2"
                  />
                </div>

                {/* Miss Rate */}
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Miss Rate
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        (cacheStats.miss_rate || 0) <= 0.2 &&
                          'bg-success/10 text-success border-success/30',
                        (cacheStats.miss_rate || 0) > 0.2 &&
                          (cacheStats.miss_rate || 0) <= 0.5 &&
                          'bg-warning/10 text-warning border-warning/30',
                        (cacheStats.miss_rate || 0) > 0.5 &&
                          'bg-destructive/10 text-destructive border-destructive/30'
                      )}
                    >
                      {((cacheStats.miss_rate || 0) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress
                    value={(cacheStats.miss_rate || 0) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Subsystem health sections */}
        {health && (
          <>
            <EmailPipelineSection components={health.components} />
            <PatreonHealthSection data={health.components.patreon} />
            <BillingHealthSection data={health.components.billing} />
            <UnknownComponentsSection
              components={health.components}
              handledKeys={HANDLED_KEYS}
            />
          </>
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground border-t border-border pt-4">
        <Clock className="h-3 w-3 mr-1" />
        Health auto-refreshes every 10 seconds, cache stats every 30 seconds
      </CardFooter>
    </Card>
  );
}

export default SystemHealthPanel;
