import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { useDebouncedCallback } from '@/hooks';

export interface FilterOption {
  value: string;
  label: string;
}

export interface EntityFilterConfig<T extends Record<string, any>> {
  searchPlaceholder?: string;
  filterOptions?: Array<{
    key: keyof T;
    label: string;
    options: FilterOption[];
  }>;
  sortOptions?: FilterOption[];
}

export interface EntityFilterProps<T extends Record<string, any>> {
  filters: T;
  onFiltersChange: (filters: Partial<T>) => void;
  onClear?: () => void;
  config: EntityFilterConfig<T>;
  className?: string;
}

export function EntityFilter<T extends Record<string, any>>({
  filters,
  onFiltersChange,
  onClear,
  config,
  className = '',
}: EntityFilterProps<T>): React.JSX.Element {
  const [searchValue, setSearchValue] = useState(
    (filters.search as string) || ''
  );

  const debouncedSearch = useDebouncedCallback((value: string) => {
    onFiltersChange({
      search: value.trim() || undefined,
      offset: 0,
    } as unknown as Partial<T>);
  }, 300);

  useEffect(() => {
    debouncedSearch(searchValue);
  }, [searchValue, debouncedSearch]);

  useEffect(() => {
    if (filters.search !== searchValue) {
      setSearchValue((filters.search as string) || '');
    }
  }, [filters.search]);

  const handleFilterChange = (key: keyof T, value: string) => {
    let parsedValue: unknown = value;
    if (value === 'true') parsedValue = true;
    if (value === 'false') parsedValue = false;
    if (value === '') parsedValue = undefined;

    onFiltersChange({
      [key]: parsedValue,
      offset: 0,
    } as unknown as Partial<T>);
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':');
    onFiltersChange({
      sort_by: sortBy,
      sort_order: sortOrder,
    } as unknown as Partial<T>);
  };

  const handleClearFilters = () => {
    setSearchValue('');
    if (onClear) {
      onClear();
    } else {
      const clearedFilters = Object.keys(filters).reduce((acc, key) => {
        return { ...acc, [key]: undefined };
      }, {} as Partial<T>);
      onFiltersChange(clearedFilters);
    }
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) =>
      key !== 'limit' &&
      key !== 'offset' &&
      key !== 'sort_by' &&
      key !== 'sort_order' &&
      value !== undefined &&
      value !== ''
  );

  const getActiveFilterTags = () => {
    const tags: Array<{ key: string; label: string; value: string }> = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (
        key !== 'limit' &&
        key !== 'offset' &&
        key !== 'sort_by' &&
        key !== 'sort_order' &&
        key !== 'search' &&
        value !== undefined &&
        value !== ''
      ) {
        const filterConfig = config.filterOptions?.find(
          (opt) => opt.key === key
        );
        if (filterConfig) {
          const option = filterConfig.options.find(
            (opt) => opt.value === String(value)
          );
          if (option) {
            tags.push({
              key,
              label: filterConfig.label,
              value: option.label,
            });
          }
        }
      }
    });

    return tags;
  };

  const activeTags = getActiveFilterTags();

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={config.searchPlaceholder || 'Search...'}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>

        {config.filterOptions?.map((filterOption) => (
          <Select
            key={String(filterOption.key)}
            value={filters[filterOption.key] ? String(filters[filterOption.key]) : undefined}
            onValueChange={(value) => handleFilterChange(filterOption.key, value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={filterOption.label} />
            </SelectTrigger>
            <SelectContent>
              {filterOption.options
                .filter((option) => option.value !== '')
                .map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ))}

        {config.sortOptions && (
          <Select
            value={`${filters.sort_by || 'created_at'}:${filters.sort_order || 'desc'}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {config.sortOptions
                .filter((option) => option.value !== '')
                .map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters} className="gap-1">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </Button>
        )}
      </div>

      {(searchValue || activeTags.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {searchValue && (
            <Badge variant="secondary" className="gap-1 pr-1">
              Search: "{searchValue}"
              <button
                type="button"
                onClick={() => setSearchValue('')}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}

          {activeTags.map((tag) => (
            <Badge key={tag.key} variant="secondary" className="gap-1 pr-1">
              {tag.label}: {tag.value}
              <button
                type="button"
                onClick={() => handleFilterChange(tag.key as keyof T, '')}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                aria-label={`Remove ${tag.label} filter`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

