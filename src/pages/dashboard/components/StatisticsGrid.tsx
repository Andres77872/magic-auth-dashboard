import React from 'react';
import { StatCard } from './StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { BarChart3, AlertCircle, RefreshCw, TrendingUp, Users, Shield, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardStats, StatCardData } from '@/types/dashboard.types';

interface StatisticsGridProps {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function StatisticsGrid({ stats, isLoading, error, onRetry }: StatisticsGridProps): React.JSX.Element {
  const { isRoot } = useUserType();

  const getGrowthType = (value: number): 'increase' | 'decrease' | 'neutral' => {
    if (value > 0) return 'increase';
    if (value < 0) return 'decrease';
    return 'neutral';
  };

  const generateStatCards = (): StatCardData[] => {
    if (!stats) return [];

    const cards: StatCardData[] = [
      {
        title: 'Total Users',
        value: stats.totalUsers.toLocaleString(),
        icon: 'users',
        color: 'primary',
        clickable: true,
        href: ROUTES.USERS,
        change: {
          value: stats.userGrowthPercent || stats.newUsersWeek,
          type: getGrowthType(stats.userGrowthPercent || stats.newUsersWeek),
        },
      },
      {
        title: 'Active Projects',
        value: stats.activeProjects.toLocaleString(),
        icon: 'projects',
        color: 'success',
        clickable: true,
        href: ROUTES.PROJECTS,
        change: {
          value: stats.projectGrowthPercent || stats.newProjectsWeek,
          type: getGrowthType(stats.projectGrowthPercent || stats.newProjectsWeek),
        },
      },
      {
        title: 'Active Sessions',
        value: stats.activeSessions.toLocaleString(),
        icon: 'sessions',
        color: 'info',
        clickable: false,
      },
      {
        title: 'User Groups',
        value: stats.userGroups.toLocaleString(),
        icon: 'groups',
        color: 'warning',
        clickable: true,
        href: ROUTES.GROUPS,
      },
    ];

    // Add ROOT-only admin statistics
    if (isRoot) {
      cards.push(
        {
          title: 'Admin Users',
          value: stats.adminUsers.toLocaleString(),
          icon: 'users',
          color: 'warning',
          clickable: true,
          href: ROUTES.SYSTEM_ADMINS,
        }
      );
    }

    return cards;
  };

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Statistics</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">{error}</p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const statCards = generateStatCards();

  // Loading state with placeholder cards
  if (isLoading && statCards.length === 0) {
    return (
      <section aria-labelledby="statistics-title">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="statistics-title" className="text-lg font-semibold text-foreground">System Overview</h2>
            <p className="text-sm text-muted-foreground">Real-time statistics and key metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <StatCard
              key={`loading-${index}`}
              data={{
                title: '',
                value: '',
                icon: 'users',
                color: 'primary',
                clickable: false,
              }}
              isLoading={true}
            />
          ))}
        </div>
      </section>
    );
  }

  // Calculate user type percentages for the breakdown
  const getUserTypePercentage = (count: number): number => {
    if (!stats || stats.totalUsers === 0) return 0;
    return Math.round((count / stats.totalUsers) * 100);
  };

  return (
    <section aria-labelledby="statistics-title" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 id="statistics-title" className="text-lg font-semibold text-foreground">System Overview</h2>
            <p className="text-sm text-muted-foreground">Real-time statistics and key metrics</p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((cardData, index) => (
          <StatCard
            key={`stat-${index}`}
            data={cardData}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* User Breakdown & Growth Metrics (ROOT only) */}
      {isRoot && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* User Type Breakdown */}
          <Card className="border-l-4 border-l-primary-500">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary-600" />
                <h3 className="text-sm font-semibold text-foreground">User Type Distribution</h3>
              </div>
              
              <div className="space-y-4">
                {/* Root Users */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                      <Crown className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Root Users</p>
                      <p className="text-xs text-muted-foreground">Full system access</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{stats.rootUsers}</p>
                    <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">
                      {getUserTypePercentage(stats.rootUsers)}%
                    </Badge>
                  </div>
                </div>

                {/* Admin Users */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Admin Users</p>
                      <p className="text-xs text-muted-foreground">Project managers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{stats.adminUsers}</p>
                    <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30">
                      {getUserTypePercentage(stats.adminUsers)}%
                    </Badge>
                  </div>
                </div>

                {/* Consumer Users */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Consumer Users</p>
                      <p className="text-xs text-muted-foreground">Regular users</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{stats.consumerUsers.toLocaleString()}</p>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                      {getUserTypePercentage(stats.consumerUsers)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Growth & Activity Metrics */}
          <Card className="border-l-4 border-l-success">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-success" />
                <h3 className="text-sm font-semibold text-foreground">7-Day Activity Summary</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                  <p className="text-xs text-muted-foreground mb-1">New Users</p>
                  <p className="text-2xl font-bold text-success">+{stats.newUsersWeek}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">New Projects</p>
                  <p className="text-2xl font-bold text-primary">+{stats.newProjectsWeek}</p>
                </div>
                <div className="p-3 rounded-lg bg-info/5 border border-info/20">
                  <p className="text-xs text-muted-foreground mb-1">Activities</p>
                  <p className="text-2xl font-bold text-info">{stats.activitiesWeek.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                  <p className="text-xs text-muted-foreground mb-1">Avg Users/Group</p>
                  <p className="text-2xl font-bold text-warning">{stats.avgUsersPerGroup.toFixed(1)}</p>
                </div>
              </div>

              {/* System Health Badge */}
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">System Health</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'capitalize',
                    stats.systemHealthStatus === 'healthy' && 'bg-success/10 text-success border-success/30',
                    stats.systemHealthStatus === 'warning' && 'bg-warning/10 text-warning border-warning/30',
                    stats.systemHealthStatus === 'critical' && 'bg-destructive/10 text-destructive border-destructive/30'
                  )}
                >
                  {stats.systemHealthStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

export default StatisticsGrid;
