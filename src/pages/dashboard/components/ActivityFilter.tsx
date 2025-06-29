import React, { useState, useCallback } from 'react';
import { Select, Input, Button } from '@/components/common';
import type { ActivityFilters } from './RecentActivityFeed';

interface ActivityFilterProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  showUserTypeFilter?: boolean;
}

const ACTIVITY_TYPES = [
  { value: '', label: 'All Activity Types' },
  { value: 'user_created', label: 'User Created' },
  { value: 'user_updated', label: 'User Updated' },
  { value: 'user_deleted', label: 'User Deleted' },
  { value: 'login', label: 'User Login' },
  { value: 'logout', label: 'User Logout' },
  { value: 'project_created', label: 'Project Created' },
  { value: 'project_updated', label: 'Project Updated' },
  { value: 'project_deleted', label: 'Project Deleted' },
  { value: 'group_created', label: 'Group Created' },
  { value: 'group_updated', label: 'Group Updated' },
  { value: 'permission_changed', label: 'Permission Changed' },
  { value: 'system_event', label: 'System Event' },
];

const USER_TYPES = [
  { value: '', label: 'All User Types' },
  { value: 'root', label: 'ROOT Users' },
  { value: 'admin', label: 'ADMIN Users' },
  { value: 'consumer', label: 'CONSUMER Users' },
];

const SEVERITY_LEVELS = [
  { value: '', label: 'All Severity Levels' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

const DATE_RANGES = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export function ActivityFilter({ 
  filters, 
  onFiltersChange, 
  showUserTypeFilter = false 
}: ActivityFilterProps): React.JSX.Element {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: '',
  });

  const handleFilterChange = useCallback((key: keyof ActivityFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    
    // Handle date range logic
    if (key === 'dateRange') {
      if (value === 'custom') {
        // Don't update filters yet, wait for custom date input
        return;
      } else if (value) {
        const now = new Date();
        let start: Date;
        
        switch (value) {
          case 'today':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'yesterday':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            now.setDate(now.getDate() - 1);
            break;
          case 'last7days':
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last30days':
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            start = new Date(0);
        }
        
        newFilters.dateRange = {
          start: start.toISOString(),
          end: now.toISOString(),
        };
      } else {
        delete newFilters.dateRange;
      }
    }
    
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleCustomDateRange = useCallback(() => {
    if (customDateRange.start && customDateRange.end) {
      const newFilters = {
        ...filters,
        dateRange: {
          start: new Date(customDateRange.start).toISOString(),
          end: new Date(customDateRange.end).toISOString(),
        },
      };
      onFiltersChange(newFilters);
    }
  }, [customDateRange, filters, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    setCustomDateRange({ start: '', end: '' });
    onFiltersChange({});
  }, [onFiltersChange]);

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && 
    (typeof value !== 'object' || Object.keys(value).length > 0)
  );

  return (
    <div className="activity-filter">
      <div className="filter-header">
        <div className="filter-controls-basic">
          <div className="filter-search">
            <Input
              placeholder="Search activities..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              }
            />
          </div>

          <Select
            options={ACTIVITY_TYPES}
            value={filters.type || ''}
            onChange={(value) => handleFilterChange('type', value)}
            placeholder="Filter by type"
          />

          <Select
            options={SEVERITY_LEVELS}
            value={filters.severity || ''}
            onChange={(value) => handleFilterChange('severity', value)}
            placeholder="Filter by severity"
          />
        </div>

        <div className="filter-actions">
          <button
            className="toggle-advanced-button"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Advanced
          </button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="small"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="filter-advanced">
          <div className="advanced-controls">
            {showUserTypeFilter && (
              <div className="filter-group">
                <label className="filter-label">User Type</label>
                <Select
                  options={USER_TYPES}
                  value={filters.userType || ''}
                  onChange={(value) => handleFilterChange('userType', value)}
                  placeholder="Filter by user type"
                />
              </div>
            )}

            <div className="filter-group">
              <label className="filter-label">Date Range</label>
              <Select
                options={DATE_RANGES}
                value={filters.dateRange ? 'custom' : ''}
                onChange={(value) => handleFilterChange('dateRange', value)}
                placeholder="Filter by date"
              />
            </div>
          </div>

          {/* Custom date range inputs */}
          <div className="custom-date-range">
            <div className="date-inputs">
              <div className="date-input-group">
                <label className="date-label">From</label>
                <input
                  type="datetime-local"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="date-input"
                />
              </div>
              <div className="date-input-group">
                <label className="date-label">To</label>
                <input
                  type="datetime-local"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="date-input"
                />
              </div>
              <Button
                variant="primary"
                size="small"
                onClick={handleCustomDateRange}
                disabled={!customDateRange.start || !customDateRange.end}
              >
                Apply
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="active-filters">
              <span className="active-filters-label">Active Filters:</span>
              <div className="filter-tags">
                {filters.type && (
                  <span className="filter-tag">
                    Type: {ACTIVITY_TYPES.find(t => t.value === filters.type)?.label}
                    <button onClick={() => handleFilterChange('type', '')}>×</button>
                  </span>
                )}
                {filters.userType && showUserTypeFilter && (
                  <span className="filter-tag">
                    User: {USER_TYPES.find(t => t.value === filters.userType)?.label}
                    <button onClick={() => handleFilterChange('userType', '')}>×</button>
                  </span>
                )}
                {filters.severity && (
                  <span className="filter-tag">
                    Severity: {SEVERITY_LEVELS.find(s => s.value === filters.severity)?.label}
                    <button onClick={() => handleFilterChange('severity', '')}>×</button>
                  </span>
                )}
                {filters.dateRange && (
                  <span className="filter-tag">
                    Date Range: Custom
                    <button onClick={() => handleFilterChange('dateRange', '')}>×</button>
                  </span>
                )}
                {filters.search && (
                  <span className="filter-tag">
                    Search: "{filters.search}"
                    <button onClick={() => handleFilterChange('search', '')}>×</button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ActivityFilter; 