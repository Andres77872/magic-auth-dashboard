import React from 'react';
import { 
  WelcomeSection, 
  StatisticsGrid, 
  QuickActionsPanel, 
  SystemHealthPanel 
} from './components';
import { useSystemStats, useSystemHealth, useUserType } from '@/hooks';

export function DashboardOverview(): React.JSX.Element {
  const { stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useSystemStats();
  const { health, isLoading: healthLoading, error: healthError, refetch: refetchHealth } = useSystemHealth();
  const { isRoot } = useUserType();

  return (
    <main className="dashboard-overview" role="main">
      {/* Welcome Section */}
      <section className="dashboard-section welcome-section-container" aria-label="Welcome">
        <WelcomeSection />
      </section>

      {/* Statistics Grid */}
      <section className="dashboard-section statistics-section" aria-label="Statistics">
        <StatisticsGrid 
          stats={stats}
          isLoading={statsLoading}
          error={statsError}
        />
      </section>

      {/* Quick Actions Panel */}
      <section className="dashboard-section quick-actions-section" aria-label="Quick actions">
        <QuickActionsPanel />
      </section>

      {/* System Health Panel (ROOT only) */}
      {isRoot && (
        <section className="dashboard-section system-health-section" aria-label="System health">
          <SystemHealthPanel
            health={health}
            isLoading={healthLoading}
            error={healthError}
            onRefresh={refetchHealth}
          />
        </section>
      )}

      {/* Error Recovery Section */}
      {(statsError || healthError) && (
        <section className="dashboard-section error-recovery-section" aria-label="Error recovery">
          <div className="error-recovery-panel">
            <h3>Data Refresh Options</h3>
            <p>Some dashboard data failed to load. You can manually refresh individual sections.</p>
            <div className="recovery-actions">
              {statsError && (
                <button 
                  onClick={refetchStats}
                  className="btn btn-outline"
                  disabled={statsLoading}
                >
                  {statsLoading ? 'Refreshing...' : 'Refresh Statistics'}
                </button>
              )}
              {healthError && isRoot && (
                <button 
                  onClick={refetchHealth}
                  className="btn btn-outline"
                  disabled={healthLoading}
                >
                  {healthLoading ? 'Checking...' : 'Refresh Health Status'}
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default DashboardOverview; 