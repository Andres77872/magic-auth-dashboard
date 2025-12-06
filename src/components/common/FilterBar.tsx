import React from 'react';
import { Button, Select } from '../primitives';
import { CloseIcon } from '@/components/icons';
import { cn } from '@/utils/component-utils';

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

export function FilterBar({
  filters,
  onClearAll,
  showClearButton = true,
  className = '',
}: FilterBarProps): React.JSX.Element {
  const hasActiveFilters = filters.some(filter => filter.value && filter.value !== '');

  return (
    <div className={cn('filter-bar', className)}>
      <div className="filter-bar__controls">
        {filters.map((filter) => (
          <div key={filter.key} className="filter-bar__item">
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
          className="filter-bar__clear"
        >
          <CloseIcon size={14} aria-hidden="true" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export default FilterBar;

