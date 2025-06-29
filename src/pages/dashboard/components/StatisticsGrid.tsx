import React from 'react';
import { StatCard } from './StatCard';
import { useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import type { DashboardStats, StatCardData } from '@/types/dashboard.types';

interface StatisticsGridProps {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
}

export function StatisticsGrid({ stats, isLoading, error }: StatisticsGridProps): React.JSX.Element {
  const { isRoot } = useUserType();

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
          value: 12, // This would come from API or calculation
          type: 'increase',
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
          value: 8,
          type: 'increase',
        },
      },
      {
        title: 'Active Sessions',
        value: stats.activeSessions.toLocaleString(),
        icon: 'sessions',
        color: 'info',
        clickable: false,
        change: {
          value: -3,
          type: 'decrease',
        },
      },
      {
        title: 'User Groups',
        value: stats.userGroups.toLocaleString(),
        icon: 'groups',
        color: 'warning',
        clickable: true,
        href: ROUTES.GROUPS,
        change: {
          value: 0,
          type: 'neutral',
        },
      },
    ];

    // Add ROOT-only statistics
    if (isRoot && stats.rootUsers !== undefined) {
      cards.push(
        {
          title: 'Admin Users',
          value: (stats.adminUsers || 0).toLocaleString(),
          icon: 'users',
          color: 'warning',
          clickable: true,
          href: ROUTES.SYSTEM_ADMINS,
        },
        {
          title: 'System Version',
          value: stats.systemVersion,
          icon: 'sessions',
          color: 'info',
          clickable: false,
        }
      );
    }

    return cards;
  };

  if (error) {
    return (
      <div className="statistics-grid-error">
        <div className="error-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <h3>Failed to Load Statistics</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statCards = generateStatCards();

  return (
    <div className="statistics-grid">
      <div className="statistics-header">
        <h2>System Overview</h2>
        <p>Real-time statistics and key metrics</p>
      </div>

      <div className="statistics-cards">
        {statCards.map((cardData, index) => (
          <StatCard
            key={`stat-${index}`}
            data={cardData}
            isLoading={isLoading}
          />
        ))}
      </div>

      {isLoading && statCards.length === 0 && (
        <div className="statistics-loading">
          <div className="loading-cards">
            {[...Array(4)].map((_, index) => (
              <div key={`loading-${index}`} className="stat-card-skeleton">
                <div className="skeleton-header">
                  <div className="skeleton-icon"></div>
                  <div className="skeleton-title"></div>
                </div>
                <div className="skeleton-content">
                  <div className="skeleton-value"></div>
                  <div className="skeleton-change"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatisticsGrid; 