import React, { useState, useEffect } from 'react';
import { RefreshCw, XCircle, Clock, Activity, Database, HardDrive, Gauge } from 'lucide-react';
import { HealthIndicator } from './HealthIndicator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUserType } from '@/hooks';
import { systemService } from '@/services';
import type { SystemHealthData } from '@/types/dashboard.types';

interface CacheStats {
  total_keys: number;
  memory_used_mb: number;
  hit_rate: number;
  miss_rate: number;
}

interface SystemHealthPanelProps {
  health: SystemHealthData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function SystemHealthPanel({ 
  health, 
  isLoading, 
  error, 
  onRefresh 
}: SystemHealthPanelProps): React.JSX.Element {
  const { isRoot } = useUserType();
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [cacheLoading, setCacheLoading] = useState(false);

  // Fetch cache statistics
  useEffect(() => {
    if (!isRoot) return;

    const fetchCacheStats = async () => {
      setCacheLoading(true);
      try {
        const response = await systemService.getCacheStats();
        if (response.success && response.data) {
          setCacheStats(response.data.cache_statistics || response.data);
        }
      } catch {
        // Cache stats are optional, fail silently
      } finally {
        setCacheLoading(false);
      }
    };

    fetchCacheStats();
    const interval = setInterval(fetchCacheStats, 30000);
    return () => clearInterval(interval);
  }, [isRoot]);

  if (!isRoot) {
    return <></>;
  }

  const getStatusStyles = (status?: 'healthy' | 'warning' | 'critical' | 'degraded' | 'unhealthy') => {
    switch (status) {
      case 'healthy':
        return { bg: 'bg-success', text: 'text-success', badge: 'bg-success/10 text-success border-success/30' };
      case 'warning':
      case 'degraded':
        return { bg: 'bg-warning', text: 'text-warning', badge: 'bg-warning/10 text-warning border-warning/30' };
      case 'critical':
      case 'unhealthy':
        return { bg: 'bg-destructive', text: 'text-destructive', badge: 'bg-destructive/10 text-destructive border-destructive/30' };
      default:
        return { bg: 'bg-muted-foreground', text: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground' };
    }
  };

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
              <CardDescription>Real-time monitoring of system components</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Health Check Failed</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-4">{error}</p>
            <Button onClick={onRefresh} disabled={isLoading} variant="outline">
              <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              {isLoading ? 'Checking...' : 'Retry'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusStyles = getStatusStyles(health?.status);

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
              <CardDescription>Real-time monitoring of critical system components</CardDescription>
            </div>
          </div>
          <Button 
            onClick={onRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            {isLoading ? 'Checking...' : 'Refresh'}
          </Button>
        </div>

        {health && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className={cn('h-3 w-3 rounded-full animate-pulse', statusStyles.bg)} />
              <span className="text-sm text-foreground">System Status:</span>
              <Badge variant="outline" className={statusStyles.badge}>
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
            <HealthIndicator title="Database" component={health.components.database} />
            <HealthIndicator title="Redis Cache" component={health.components.redis} />
            <HealthIndicator title="Group System" component={health.components.group_system} />
          </div>
        ) : null}

        {/* Cache Statistics Panel */}
        {(cacheStats || cacheLoading) && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-4 w-4 text-info" />
              <h4 className="text-sm font-semibold text-foreground">Cache Performance</h4>
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
                    <span className="text-xs text-muted-foreground">Cached Keys</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{cacheStats.total_keys?.toLocaleString() || 0}</p>
                </div>

                {/* Memory Usage */}
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Memory Used</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{cacheStats.memory_used_mb?.toFixed(1) || 0} MB</p>
                </div>

                {/* Hit Rate */}
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Hit Rate</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-[10px]',
                        (cacheStats.hit_rate || 0) >= 0.8 && 'bg-success/10 text-success border-success/30',
                        (cacheStats.hit_rate || 0) >= 0.5 && (cacheStats.hit_rate || 0) < 0.8 && 'bg-warning/10 text-warning border-warning/30',
                        (cacheStats.hit_rate || 0) < 0.5 && 'bg-destructive/10 text-destructive border-destructive/30'
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
                      <span className="text-xs text-muted-foreground">Miss Rate</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-[10px]',
                        (cacheStats.miss_rate || 0) <= 0.2 && 'bg-success/10 text-success border-success/30',
                        (cacheStats.miss_rate || 0) > 0.2 && (cacheStats.miss_rate || 0) <= 0.5 && 'bg-warning/10 text-warning border-warning/30',
                        (cacheStats.miss_rate || 0) > 0.5 && 'bg-destructive/10 text-destructive border-destructive/30'
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
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground border-t border-border pt-4">
        <Clock className="h-3 w-3 mr-1" />
        Health auto-refreshes every 10 seconds, cache stats every 30 seconds
      </CardFooter>
    </Card>
  );
}

export default SystemHealthPanel; 