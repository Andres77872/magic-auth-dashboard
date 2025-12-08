import React, { useState, useEffect } from 'react';
import { ProjectAnalyticsCard } from './ProjectAnalyticsCard';
import { analyticsService } from '@/services/analytics.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FolderKanban, ShieldCheck, Activity, AlertCircle, RefreshCw, FolderPlus } from 'lucide-react';
import type { ProjectAnalyticsData, DateRange, DateRangePreset } from '@/types/analytics.types';

const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: '7 Days' },
  { value: 'last30days', label: '30 Days' },
];

export function ProjectAnalyticsDashboard(): React.JSX.Element {
  const [data, setData] = useState<ProjectAnalyticsData | null>(null);
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
      const analyticsData = await analyticsService.getProjectAnalytics({
        start: dateRange.start,
        end: dateRange.end,
      });
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project analytics');
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

  const handleProjectClick = (projectId: string) => {
    console.log('Project clicked:', projectId);
  };

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Project Analytics</h3>
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
            <p className="text-sm text-muted-foreground">Loading project analytics...</p>
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
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle>Project Analytics</CardTitle>
              <CardDescription>Monitor project health, activity, and member engagement</CardDescription>
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
        {/* Overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-3 mb-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Projects</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.totalProjects}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-success/5 border border-success/10">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Avg Health Score</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.avgHealthScore.toFixed(1)}%</p>
          </div>
          
          <div className="p-4 rounded-lg bg-info/5 border border-info/10">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-5 w-5 text-info" />
              <span className="text-sm text-muted-foreground">Total Activities</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.totalActivity.toLocaleString()}</p>
          </div>
        </div>

        {/* Engagement insights */}
        {data.engagement && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Actions */}
            <div className="p-4 rounded-lg border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-4">Popular Actions</h3>
              <div className="space-y-2">
                {data.engagement.popularActions.slice(0, 5).map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                    <span className="text-sm text-foreground">{action.action}</span>
                    <Badge variant="outline">{action.count} times</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Member Engagement */}
            <div className="p-4 rounded-lg border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-4">Most Active Members</h3>
              <div className="space-y-2">
                {data.engagement.memberEngagement.slice(0, 5).map((member) => (
                  <div key={member.user_hash} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                          {member.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.username}</p>
                        <p className="text-xs text-muted-foreground">{member.activityCount} activities</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(member.lastActive).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Project Details</h3>
            <Badge variant="secondary">
              {data.projects.length} project{data.projects.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {data.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.projects.map((project) => (
                <ProjectAnalyticsCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">No Projects Found</h4>
              <p className="text-sm text-muted-foreground">You don't have access to any projects yet.</p>
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        {data.engagement && data.engagement.projectActivity.length > 0 && (
          <div className="p-4 rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">Activity Timeline</h3>
            <div className="flex items-end gap-1 h-32">
              {data.engagement.projectActivity.map((day, index) => {
                const maxCount = Math.max(...data.engagement!.projectActivity.map(d => d.activityCount));
                const height = maxCount > 0 ? (day.activityCount / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.activityCount}
                    </span>
                    <div className="w-full flex-1 flex items-end">
                      <div 
                        className="w-full bg-primary/70 hover:bg-primary rounded-t transition-all"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${new Date(day.date).toLocaleDateString()}: ${day.activityCount} activities`}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground rotate-45 origin-left whitespace-nowrap">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProjectAnalyticsDashboard;
