import React from 'react';
import { 
  QuickActionsPanel, 
  SystemHealthPanel,
  RecentActivityFeed,
  StatisticsGrid
} from './components';
import { 
  PageContainer,
  PageHeader,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RefreshCw, LayoutDashboard, AlertCircle } from 'lucide-react';
import { useSystemStats, useSystemHealth, useUserType, useAuth } from '@/hooks';

export function DashboardOverview(): React.JSX.Element {
  const { user } = useAuth();
  const { stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useSystemStats();
  const { health, isLoading: healthLoading, error: healthError, refetch: refetchHealth } = useSystemHealth();
  const { isRoot, getUserTypeLabel, userType } = useUserType();

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userTypeStyles = {
    root: 'bg-destructive/10 text-destructive border-destructive/30',
    admin: 'bg-warning/10 text-warning border-warning/30',
    consumer: 'bg-primary/10 text-primary border-primary/30',
  };

  return (
    <PageContainer>
      <PageHeader
        title={user ? `${getGreeting()}, ${user.username}!` : 'Dashboard'}
        subtitle="Welcome back to the Magic Auth Admin Dashboard"
        icon={<LayoutDashboard size={32} />}
        badge={
          <Badge 
            variant="outline" 
            className={cn('px-2.5 py-0.5', userTypeStyles[userType as keyof typeof userTypeStyles])}
          >
            {getUserTypeLabel()}
          </Badge>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStats()}
            disabled={statsLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', statsLoading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      {/* Statistics Grid */}
      <div className="mt-6">
        <StatisticsGrid
          stats={stats}
          isLoading={statsLoading}
          error={statsError}
          onRetry={refetchStats}
        />
      </div>

      {/* Error State for failed data fetches */}
      {(statsError || healthError) && (
        <div className="mt-6 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1">Data Refresh Options</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Some dashboard data failed to load. You can manually refresh individual sections.
              </p>
              <div className="flex flex-wrap gap-3">
                {statsError && (
                  <Button 
                    onClick={refetchStats}
                    variant="outline"
                    size="sm"
                    disabled={statsLoading}
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-2', statsLoading && 'animate-spin')} />
                    {statsLoading ? 'Refreshing...' : 'Refresh Statistics'}
                  </Button>
                )}
                {healthError && isRoot && (
                  <Button 
                    onClick={refetchHealth}
                    variant="outline"
                    size="sm"
                    disabled={healthLoading}
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-2', healthLoading && 'animate-spin')} />
                    {healthLoading ? 'Checking...' : 'Refresh Health Status'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Panel */}
      <QuickActionsPanel />

      {/* Recent Activity Feed */}
      <RecentActivityFeed />

      {/* System Health Panel (ROOT only) */}
      {isRoot && (
        <SystemHealthPanel
          health={health}
          isLoading={healthLoading}
          error={healthError}
          onRefresh={refetchHealth}
        />
      )}
    </PageContainer>
  );
}

export default DashboardOverview;
