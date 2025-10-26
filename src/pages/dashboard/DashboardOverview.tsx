import React from 'react';
import { 
  QuickActionsPanel, 
  SystemHealthPanel 
} from './components';
import { 
  PageContainer,
  PageHeader,
  StatsGrid,
  Button,
  Badge
} from '@/components/common';
import { RefreshIcon, DashboardIcon, UserIcon, ProjectIcon, GroupIcon } from '@/components/icons';
import { useSystemStats, useSystemHealth, useUserType, useAdminStats, useAuth } from '@/hooks';
import type { StatCardProps } from '@/components/common';

export function DashboardOverview(): React.JSX.Element {
  const { user } = useAuth();
  const { stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useSystemStats();
  const { health, isLoading: healthLoading, error: healthError, refetch: refetchHealth } = useSystemHealth();
  const { stats: adminStats } = useAdminStats();
  const { isRoot, getUserTypeLabel } = useUserType();

  // Generate stat cards for the stats grid
  const statCards: StatCardProps[] = React.useMemo(() => {
    if (!stats) return [];

    return [
      {
        title: 'Total Users',
        value: stats.totalUsers.toLocaleString(),
        icon: <UserIcon size={20} />,
        trend: adminStats?.growth?.user_growth_7d ? {
          value: adminStats.growth.user_growth_7d,
          label: 'vs last week'
        } : undefined,
      },
      {
        title: 'Active Projects',
        value: stats.activeProjects.toLocaleString(),
        icon: <ProjectIcon size={20} />,
        trend: adminStats?.growth?.project_growth_7d ? {
          value: adminStats.growth.project_growth_7d,
          label: 'vs last week'
        } : undefined,
      },
      {
        title: 'Active Sessions',
        value: stats.activeSessions.toLocaleString(),
        icon: <DashboardIcon size={20} />,
      },
      {
        title: 'User Groups',
        value: stats.userGroups.toLocaleString(),
        icon: <GroupIcon size={20} />,
      },
    ];
  }, [stats, adminStats]);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <PageContainer>
      <PageHeader
        title={user ? `${getGreeting()}, ${user.username}!` : 'Dashboard'}
        subtitle="Welcome back to the Magic Auth Admin Dashboard"
        icon={<DashboardIcon size={32} />}
        badge={
          <Badge variant="primary" size="md">
            {getUserTypeLabel()}
          </Badge>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={refetchStats}
              disabled={statsLoading}
              leftIcon={<RefreshIcon size={16} className={statsLoading ? 'spinning' : ''} />}
              aria-label="Refresh dashboard"
            >
              Refresh
            </Button>
          </>
        }
      />

      {/* Statistics Grid */}
      <StatsGrid
        stats={statCards}
        columns={4}
        loading={statsLoading}
      />

      {/* Error State */}
      {(statsError || healthError) && (
        <div className="error-recovery-section">
          <div className="error-recovery-panel">
            <h3>Data Refresh Options</h3>
            <p>Some dashboard data failed to load. You can manually refresh individual sections.</p>
            <div className="recovery-actions">
              {statsError && (
                <Button 
                  onClick={refetchStats}
                  variant="outline"
                  disabled={statsLoading}
                  leftIcon={<RefreshIcon size={16} aria-hidden="true" />}
                  aria-label="Refresh dashboard statistics"
                >
                  {statsLoading ? 'Refreshing...' : 'Refresh Statistics'}
                </Button>
              )}
              {healthError && isRoot && (
                <Button 
                  onClick={refetchHealth}
                  variant="outline"
                  disabled={healthLoading}
                  leftIcon={<RefreshIcon size={16} aria-hidden="true" />}
                  aria-label="Refresh system health status"
                >
                  {healthLoading ? 'Checking...' : 'Refresh Health Status'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Panel */}
      <QuickActionsPanel />

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