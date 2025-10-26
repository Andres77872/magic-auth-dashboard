import React from 'react';
import { 
  WelcomeSection, 
  StatisticsGrid, 
  QuickActionsPanel, 
  SystemHealthPanel 
} from './components';
import { Button } from '@/components/common';
import { RefreshIcon } from '@/components/icons';
import { useSystemStats, useSystemHealth, useUserType, useAdminStats } from '@/hooks';

export function DashboardOverview(): React.JSX.Element {
  const { stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useSystemStats();
  const { health, isLoading: healthLoading, error: healthError, refetch: refetchHealth } = useSystemHealth();
  // NEW: Real admin statistics from API (replaces mock data)
  const { stats: adminStats, isLoading: adminLoading, error: adminError } = useAdminStats();
  const { isRoot } = useUserType();
  
  // Admin stats can be used for enhanced dashboard display:
  // - adminStats.totals.users, adminStats.totals.projects
  // - adminStats.user_breakdown (root/admin/consumer counts)
  // - adminStats.growth (7-day growth metrics)
  // - adminStats.system_health (database/redis health)

  return (
    <div className="dashboard-overview">
      {/* Welcome Section */}
      <WelcomeSection />

      {/* Statistics Grid */}
      <StatisticsGrid 
        stats={stats}
        isLoading={statsLoading}
        error={statsError}
      />
      {/* TODO: Update StatisticsGrid component to accept adminStats prop */}
      {/* This will enable showing: user breakdown, growth metrics, system health */}
      {adminStats && !adminLoading && !adminError && (
        <div className="admin-stats-preview" style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <h4>Admin Stats Available (Example):</h4>
          <p>Total Users: {adminStats.totals.users}</p>
          <p>Total Projects: {adminStats.totals.projects}</p>
          <p>Active Sessions: {adminStats.totals.active_sessions}</p>
          <p>Root Users: {adminStats.user_breakdown.root_users}</p>
          <p>Admin Users: {adminStats.user_breakdown.admin_users}</p>
          <p>Consumer Users: {adminStats.user_breakdown.consumer_users}</p>
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

      {/* Error Recovery Section */}
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
    </div>
  );
}

export default DashboardOverview; 