import React from 'react';
import { Button } from './Button';
import { Select } from './Select';

export interface FilterOption {
  value: string;
  label: string;
}

export interface Filter {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export interface FilterBarProps {
  filters: Filter[];
  onClearAll?: () => void;
  showClearButton?: boolean;
  className?: string;
}

/**
 * Standardized filter bar component for consistent filtering UI
 * Use this instead of creating custom filter layouts
 */
export function FilterBar({
  filters,
  onClearAll,
  showClearButton = true,
  className = '',
}: FilterBarProps): React.JSX.Element {
  const hasActiveFilters = filters.some(filter => filter.value && filter.value !== '');

  return (
    <div className={`filter-bar ${className}`.trim()}>
      <div className="filter-bar-controls">
        {filters.map((filter) => (
          <div key={filter.key} className="filter-bar-item">
            <Select
              value={filter.value}
              onChange={filter.onChange}
              options={filter.options}
              placeholder={filter.label}
              aria-label={filter.label}
            />
          </div>
        ))}
      </div>
      {showClearButton && hasActiveFilters && onClearAll && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="filter-bar-clear"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export default FilterBar;

