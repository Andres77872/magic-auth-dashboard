import React, { useState, useEffect, useCallback } from 'react';
import { Input, Select } from '@/components/common';

interface UserFilterProps {
  onFiltersChange: (filters: UserFilters) => void;
  initialFilters?: UserFilters;
}

export interface UserFilters {
  search?: string;
  userType?: string;
  isActive?: boolean;
}

const USER_TYPE_OPTIONS = [
  { value: '', label: 'All User Types' },
  { value: 'root', label: 'ROOT Users' },
  { value: 'admin', label: 'ADMIN Users' },
  { value: 'consumer', label: 'CONSUMER Users' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export function UserFilter({ onFiltersChange, initialFilters = {} }: UserFilterProps): React.JSX.Element {
  const [filters, setFilters] = useState<UserFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search || '');

  // Debounce search input
  const debounceTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback((searchValue: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setFilters(prev => {
        const newFilters = { ...prev, search: searchValue || undefined };
        onFiltersChange(newFilters);
        return newFilters;
      });
    }, 300);
  }, [onFiltersChange]);

  useEffect(() => {
    debouncedSearch(searchInput);
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchInput, debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleUserTypeChange = (value: string) => {
    const newFilters = { ...filters, userType: value || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleStatusChange = (value: string) => {
    const isActive = value === '' ? undefined : value === 'true';
    const newFilters = { ...filters, isActive };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    setFilters(clearedFilters);
    setSearchInput('');
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== ''
  );

  return (
    <div className="user-filter">
      <div className="filter-row">
        <div className="filter-search">
          <Input
            placeholder="Search by username or email..."
            value={searchInput}
            onChange={handleSearchChange}
            leftIcon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            }
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <Select
            options={USER_TYPE_OPTIONS}
            value={filters.userType || ''}
            onChange={handleUserTypeChange}
            placeholder="Filter by user type"
            className="user-type-filter"
          />

          <Select
            options={STATUS_OPTIONS}
            value={filters.isActive === undefined ? '' : String(filters.isActive)}
            onChange={handleStatusChange}
            placeholder="Filter by status"
            className="status-filter"
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="clear-filters-btn"
              title="Clear all filters"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="active-filters">
          <span className="active-filters-label">Active filters:</span>
          <div className="filter-tags">
            {filters.search && (
              <span className="filter-tag">
                Search: "{filters.search}"
                <button
                  onClick={() => {
                    setSearchInput('');
                    const newFilters = { ...filters, search: undefined };
                    setFilters(newFilters);
                    onFiltersChange(newFilters);
                  }}
                  className="remove-filter"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.userType && (
              <span className="filter-tag">
                Type: {USER_TYPE_OPTIONS.find(opt => opt.value === filters.userType)?.label}
                <button
                  onClick={() => handleUserTypeChange('')}
                  className="remove-filter"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.isActive !== undefined && (
              <span className="filter-tag">
                Status: {filters.isActive ? 'Active' : 'Inactive'}
                <button
                  onClick={() => handleStatusChange('')}
                  className="remove-filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserFilter; 