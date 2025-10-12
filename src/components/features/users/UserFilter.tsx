import React, { useState, useEffect, useCallback } from 'react';
import { Input, Select } from '@/components/common';
import { SearchIcon, CloseIcon } from '@/components/icons';

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
      const newFilters = { ...filters, search: searchValue || undefined };
      setFilters(newFilters);
      onFiltersChange(newFilters);
    }, 300);
  }, [onFiltersChange, filters]);

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
            leftIcon={<SearchIcon size={16} />}
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
              <CloseIcon size={16} />
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