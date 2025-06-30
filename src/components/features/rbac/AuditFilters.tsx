import React from 'react';

interface AuditFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export const AuditFilters: React.FC<AuditFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  return (
    <div className="audit-filters">
      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="action_type">Action Type</label>
          <select 
            id="action_type"
            value={filters.action_type || ''}
            onChange={(e) => onFiltersChange({ action_type: e.target.value })}
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="days">Time Period</label>
          <select 
            id="days"
            value={filters.days || 30}
            onChange={(e) => onFiltersChange({ days: parseInt(e.target.value) })}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="limit">Items per page</label>
          <select 
            id="limit"
            value={filters.limit || 50}
            onChange={(e) => onFiltersChange({ limit: parseInt(e.target.value) })}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  );
}; 