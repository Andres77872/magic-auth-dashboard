import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X, Calendar } from 'lucide-react';
import type { ActivityFilters } from '@/types/analytics.types';
// Note: Using analytics.types ActivityFilters here for dashboard filtering

interface ActivityFilterProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  showUserTypeFilter?: boolean;
}

const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Activity Types' },
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
  { value: 'all', label: 'All User Types' },
  { value: 'root', label: 'ROOT Users' },
  { value: 'admin', label: 'ADMIN Users' },
  { value: 'consumer', label: 'CONSUMER Users' },
];

const SEVERITY_LEVELS = [
  { value: 'all', label: 'All Severity' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
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
    const newFilters = { ...filters };
    
    if (value === 'all' || value === '') {
      delete newFilters[key];
    } else if (key === 'dateRange') {
      if (value === 'custom') {
        return;
      }
      
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
      newFilters[key] = value;
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

  const removeFilter = useCallback((key: keyof ActivityFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && 
    (typeof value !== 'object' || Object.keys(value).length > 0)
  );

  const activeFilterCount = Object.keys(filters).filter(key => filters[key as keyof ActivityFilters]).length;

  return (
    <div className="space-y-4 mb-6">
      {/* Main filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Activity type filter */}
        <Select
          value={filters.type || 'all'}
          onValueChange={(value) => handleFilterChange('type', value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Severity filter */}
        <Select
          value={filters.severity || 'all'}
          onValueChange={(value) => handleFilterChange('severity', value)}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            {SEVERITY_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced toggle */}
        <Button
          variant={showAdvanced ? 'secondary' : 'outline'}
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <SlidersHorizontal size={16} />
          Advanced
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClearFilters} className="gap-2 text-muted-foreground">
            <X size={16} />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User type filter */}
            {showUserTypeFilter && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">User Type</label>
                <Select
                  value={filters.userType || 'all'}
                  onValueChange={(value) => handleFilterChange('userType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by user type" />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date range filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Date Range</label>
              <Select
                value={filters.dateRange ? 'custom' : 'all'}
                onValueChange={(value) => handleFilterChange('dateRange', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom date range inputs */}
          <div className="flex flex-wrap items-end gap-4 pt-2 border-t border-border">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar size={14} />
                From
              </label>
              <Input
                type="datetime-local"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-[200px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar size={14} />
                To
              </label>
              <Input
                type="datetime-local"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-[200px]"
              />
            </div>
            <Button
              onClick={handleCustomDateRange}
              disabled={!customDateRange.start || !customDateRange.end}
            >
              Apply Range
            </Button>
          </div>
        </div>
      )}

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.type && (
            <Badge variant="secondary" className="gap-1">
              Type: {ACTIVITY_TYPES.find(t => t.value === filters.type)?.label}
              <button onClick={() => removeFilter('type')} className="ml-1 hover:text-destructive">
                <X size={12} />
              </button>
            </Badge>
          )}
          {filters.userType && showUserTypeFilter && (
            <Badge variant="secondary" className="gap-1">
              User: {USER_TYPES.find(t => t.value === filters.userType)?.label}
              <button onClick={() => removeFilter('userType')} className="ml-1 hover:text-destructive">
                <X size={12} />
              </button>
            </Badge>
          )}
          {filters.severity && (
            <Badge variant="secondary" className="gap-1">
              Severity: {SEVERITY_LEVELS.find(s => s.value === filters.severity)?.label}
              <button onClick={() => removeFilter('severity')} className="ml-1 hover:text-destructive">
                <X size={12} />
              </button>
            </Badge>
          )}
          {filters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              Date Range: Custom
              <button onClick={() => removeFilter('dateRange')} className="ml-1 hover:text-destructive">
                <X size={12} />
              </button>
            </Badge>
          )}
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: "{filters.search}"
              <button onClick={() => removeFilter('search')} className="ml-1 hover:text-destructive">
                <X size={12} />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export default ActivityFilter;
