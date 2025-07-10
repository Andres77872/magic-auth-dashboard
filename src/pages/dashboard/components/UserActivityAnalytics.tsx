import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics.service';
import { LoadingSpinner } from '@/components/common';
import type { UserAnalyticsData, DateRange, DateRangePreset } from '@/types/analytics.types';

export function UserActivityAnalytics(): React.JSX.Element {
  const [data, setData] = useState<UserAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0], // today
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
      <div className="analytics-error">
        <div className="error-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <h3>Failed to Load Analytics</h3>
          <p>{error}</p>
          <button onClick={fetchAnalytics} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="analytics-loading">
        <LoadingSpinner size="lg" message="Loading user analytics..." />
      </div>
    );
  }

  return (
    <div className="user-analytics">
      <div className="analytics-header">
        <div className="header-content">
          <h2>User Analytics Dashboard</h2>
          <p>Comprehensive insights into user behavior and system usage</p>
        </div>

        <div className="date-range-selector">
          <div className="date-presets">
            {(['today', 'yesterday', 'last7days', 'last30days'] as DateRangePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => handleDateRangeChange(preset)}
                className={`preset-button ${dateRange.preset === preset ? 'active' : ''}`}
              >
                {preset === 'today' && 'Today'}
                {preset === 'yesterday' && 'Yesterday'}
                {preset === 'last7days' && 'Last 7 Days'}
                {preset === 'last30days' && 'Last 30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* User Metrics Overview */}
        <section className="metrics-overview">
          <h3>User Metrics</h3>
          <div className="metrics-cards">
            <div className="metric-card">
              <div className="metric-value">{data.metrics.totalUsers.toLocaleString()}</div>
              <div className="metric-label">Total Users</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{data.metrics.activeUsers.toLocaleString()}</div>
              <div className="metric-label">Active Users</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">+{data.metrics.newUsersThisWeek.toLocaleString()}</div>
              <div className="metric-label">New This Week</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{data.metrics.userGrowthRate.toFixed(1)}%</div>
              <div className="metric-label">Growth Rate</div>
            </div>
          </div>
        </section>

        {/* User Type Distribution */}
        <section className="user-types">
          <h3>User Distribution</h3>
          <div className="user-type-chart">
            <div className="user-type-item">
              <div className="type-indicator root"></div>
              <span className="type-label">ROOT Users</span>
              <span className="type-count">{data.metrics.usersByType.root}</span>
            </div>
            <div className="user-type-item">
              <div className="type-indicator admin"></div>
              <span className="type-label">ADMIN Users</span>
              <span className="type-count">{data.metrics.usersByType.admin}</span>
            </div>
            <div className="user-type-item">
              <div className="type-indicator consumer"></div>
              <span className="type-label">CONSUMER Users</span>
              <span className="type-count">{data.metrics.usersByType.consumer}</span>
            </div>
          </div>
        </section>

        {/* User Engagement */}
        <section className="engagement-section">
          <h3>User Engagement</h3>
          <div className="engagement-stats">
            <div className="stat-item">
              <div className="stat-label">Average Session Duration</div>
              <div className="stat-value">{Math.round(data.engagement.avgSessionDuration / 60)} minutes</div>
            </div>
          </div>

          <div className="most-active-users">
            <h4>Most Active Users</h4>
            <div className="active-users-list">
              {data.engagement.mostActiveUsers.slice(0, 5).map((user) => (
                <div key={user.user_hash} className="active-user-item">
                  <div className="analytics-user-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.username}</div>
                    <div className="user-activity">{user.activityCount} activities</div>
                  </div>
                  <div className="last-active">
                    {new Date(user.lastActive).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Metrics */}
        <section className="security-section">
          <h3>Security Overview</h3>
          <div className="security-alerts">
            <div className="alert-summary">
              <div className="alert-item failed-logins">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span className="alert-count">{data.security.failedLoginAttempts}</span>
                <span className="alert-label">Failed Logins</span>
              </div>
              <div className="alert-item suspicious">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M12 8v4"/>
                  <circle cx="12" cy="16" r="1"/>
                </svg>
                <span className="alert-count">{data.security.suspiciousActivities}</span>
                <span className="alert-label">Suspicious Activities</span>
              </div>
            </div>

            {data.security.securityEvents.length > 0 && (
              <div className="security-events">
                <h4>Security Events</h4>
                <div className="events-list">
                  {data.security.securityEvents.map((event, index) => (
                    <div key={index} className={`event-item severity-${event.severity}`}>
                      <div className="event-type">{event.type}</div>
                      <div className="event-count">{event.count} occurrences</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* System Metrics */}
        <section className="system-section">
          <h3>System Performance</h3>
          <div className="system-stats">
            <div className="system-stat">
              <div className="stat-label">Total Projects</div>
              <div className="stat-value">{data.system.totalProjects.toLocaleString()}</div>
            </div>
            <div className="system-stat">
              <div className="stat-label">Total Groups</div>
              <div className="stat-value">{data.system.totalGroups.toLocaleString()}</div>
            </div>
            <div className="system-stat">
              <div className="stat-label">System Uptime</div>
              <div className="stat-value">{data.system.uptime}</div>
            </div>
          </div>

          <div className="performance-metrics">
            <h4>API Performance</h4>
            <div className="perf-stats">
              <div className="perf-item">
                <div className="perf-label">Average Response Time</div>
                <div className="perf-value">{data.system.apiResponseTimes.avg}ms</div>
              </div>
              <div className="perf-item">
                <div className="perf-label">95th Percentile</div>
                <div className="perf-value">{data.system.apiResponseTimes.p95}ms</div>
              </div>
              <div className="perf-item">
                <div className="perf-label">99th Percentile</div>
                <div className="perf-value">{data.system.apiResponseTimes.p99}ms</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default UserActivityAnalytics; 