import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  TrendingUp, 
  AlertCircle, 
  ShieldAlert, 
  Clock,
  Server,
  RefreshCw,
  Activity
} from 'lucide-react';
import type { UserAnalyticsData, DateRange, DateRangePreset } from '@/types/analytics.types';

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: '7 Days' },
  { value: 'last30days', label: '30 Days' },
];

export function UserActivityAnalytics(): React.JSX.Element {
  const [data, setData] = useState<UserAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    preset: 'last30days',
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const analyticsData = await analyticsService.getUserAnalytics({
        start: dateRange.start,
        end: dateRange.end,
      });
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (preset: DateRangePreset) => {
    const today = new Date();
    let start: Date;

    switch (preset) {
      case 'today':
        start = new Date(today);
        break;
      case 'yesterday':
        start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last7days':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
      preset,
    });
  };

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Analytics</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground">Loading user analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <CardTitle>User Analytics Dashboard</CardTitle>
              <CardDescription>Comprehensive insights into user behavior and system usage</CardDescription>
            </div>
          </div>

          {/* Date range selector */}
          <div className="flex items-center gap-2">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant={dateRange.preset === preset.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleDateRangeChange(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Metrics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.metrics.totalUsers.toLocaleString()}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-success/5 border border-success/10">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Active Users</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.metrics.activeUsers.toLocaleString()}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-info/5 border border-info/10">
            <div className="flex items-center gap-3 mb-2">
              <UserPlus className="h-5 w-5 text-info" />
              <span className="text-sm text-muted-foreground">New This Week</span>
            </div>
            <p className="text-2xl font-bold text-foreground">+{data.metrics.newUsersThisWeek.toLocaleString()}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-warning/5 border border-warning/10">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-warning" />
              <span className="text-sm text-muted-foreground">Growth Rate</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.metrics.userGrowthRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Type Distribution */}
          <div className="p-4 rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">User Distribution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-destructive/5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-destructive" />
                  <span className="text-sm text-foreground">ROOT Users</span>
                </div>
                <Badge variant="outline" className="bg-destructive/10 text-destructive">
                  {data.metrics.usersByType.root}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-warning/5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-warning" />
                  <span className="text-sm text-foreground">ADMIN Users</span>
                </div>
                <Badge variant="outline" className="bg-warning/10 text-warning">
                  {data.metrics.usersByType.admin}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-primary/5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm text-foreground">CONSUMER Users</span>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {data.metrics.usersByType.consumer}
                </Badge>
              </div>
            </div>
          </div>

          {/* User Engagement */}
          <div className="p-4 rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">User Engagement</h3>
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30 mb-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Average Session Duration</p>
                <p className="text-lg font-semibold text-foreground">{Math.round(data.engagement.avgSessionDuration / 60)} minutes</p>
              </div>
            </div>

            <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">Most Active Users</h4>
            <div className="space-y-2">
              {data.engagement.mostActiveUsers.slice(0, 5).map((user) => (
                <div key={user.user_hash} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.activityCount} activities</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(user.lastActive).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Metrics */}
          <div className="p-4 rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">Security Overview</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-md bg-destructive/5 border border-destructive/10">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-lg font-bold text-foreground">{data.security.failedLoginAttempts}</span>
                </div>
                <p className="text-xs text-muted-foreground">Failed Logins</p>
              </div>
              <div className="p-3 rounded-md bg-warning/5 border border-warning/10">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="h-4 w-4 text-warning" />
                  <span className="text-lg font-bold text-foreground">{data.security.suspiciousActivities}</span>
                </div>
                <p className="text-xs text-muted-foreground">Suspicious Activities</p>
              </div>
            </div>

            {data.security.securityEvents.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">Security Events</h4>
                {data.security.securityEvents.map((event, index) => (
                  <div key={index} className={cn(
                    'flex items-center justify-between p-2 rounded-md border',
                    event.severity === 'high' && 'bg-destructive/5 border-destructive/20',
                    event.severity === 'medium' && 'bg-warning/5 border-warning/20',
                    event.severity === 'low' && 'bg-info/5 border-info/20'
                  )}>
                    <span className="text-sm text-foreground">{event.type}</span>
                    <Badge variant="outline" className="text-xs">
                      {event.count} occurrences
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Performance */}
          <div className="p-4 rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">System Performance</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-md bg-muted/30">
                <p className="text-lg font-bold text-foreground">{data.system.totalProjects.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/30">
                <p className="text-lg font-bold text-foreground">{data.system.totalGroups.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Groups</p>
              </div>
              <div className="text-center p-3 rounded-md bg-muted/30">
                <p className="text-lg font-bold text-foreground">{data.system.uptime}</p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
            </div>

            <h4 className="text-xs font-medium text-muted-foreground uppercase mb-3">API Performance</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Average Response</span>
                </div>
                <span className="text-sm font-medium text-foreground">{data.system.apiResponseTimes.avg}ms</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                <span className="text-sm text-muted-foreground">95th Percentile</span>
                <span className="text-sm font-medium text-foreground">{data.system.apiResponseTimes.p95}ms</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                <span className="text-sm text-muted-foreground">99th Percentile</span>
                <span className="text-sm font-medium text-foreground">{data.system.apiResponseTimes.p99}ms</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserActivityAnalytics;
