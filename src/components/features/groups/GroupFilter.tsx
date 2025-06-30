import React, { useState, useCallback } from 'react';
import { Input, Button, Select } from '@/components/common';
import type { GroupListParams } from '@/types/group.types';

interface GroupFilterProps {
  filters: GroupListParams;
  onFiltersChange: (filters: Partial<GroupListParams>) => void;
  onClear: () => void;
}

// Debounce utility function
const debounce = (func: Function, delay: number) => {
  let timeoutId: number;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func.apply(null, args), delay);
  };
};

export const GroupFilter: React.FC<GroupFilterProps> = ({
  filters,
  onFiltersChange,
  onClear
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      onFiltersChange({ 
        search: term,
        offset: 0 // Reset to first page on search
      });
    }, 300),
    [onFiltersChange]
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const sortOptions = [
    { value: 'created_at:desc', label: 'Newest first' },
    { value: 'created_at:asc', label: 'Oldest first' },
    { value: 'group_name:asc', label: 'Name (A-Z)' },
    { value: 'group_name:desc', label: 'Name (Z-A)' },
    { value: 'member_count:desc', label: 'Most members' },
    { value: 'member_count:asc', label: 'Fewest members' }
  ];

  const currentSortValue = `${filters.sort_by}:${filters.sort_order}`;

  const hasActiveFilters = searchTerm.length > 0;

  return (
    <div className="group-filters" style={{ 
      marginBottom: '1.5rem',
      padding: '1rem',
      backgroundColor: 'var(--color-background-secondary)',
      borderRadius: '8px',
      border: '1px solid var(--color-border)'
    }}>
      <div className="filter-row" style={{ 
        display: 'flex', 
        gap: '1rem', 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <Input
            type="search"
            placeholder="Search groups by name or description..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div style={{ minWidth: '200px' }}>
          <Select
            value={currentSortValue}
            onChange={(value) => {
              const [sort_by, sort_order] = value.split(':');
              onFiltersChange({ sort_by, sort_order: sort_order as 'asc' | 'desc' });
            }}
            options={sortOptions}
            placeholder="Sort by"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={onClear}
          disabled={!hasActiveFilters}
          size="medium"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
}; 