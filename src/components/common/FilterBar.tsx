import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const hasActiveFilters = filters.some(
    (filter) => filter.value && filter.value !== ''
  );

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={filter.value || undefined}
            onValueChange={filter.onChange}
          >
            <SelectTrigger className="w-[180px]" aria-label={filter.label}>
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options
                .filter((option) => option.value !== '')
                .map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ))}
      </div>
      {showClearButton && hasActiveFilters && onClearAll && (
        <Button variant="outline" size="sm" onClick={onClearAll} className="gap-1">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export default FilterBar;

