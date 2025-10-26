import React, { useState, useEffect } from 'react';
import { Input, Select, Button } from '@/components/common';
import { SearchIcon, CloseIcon } from '@/components/icons';
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

/**
 * Generic EntityFilter component for consistent filtering UI across the application
 * Follows Design System guidelines for spacing, icons, and interactions
 */
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

  // Debounced search handler (300ms delay per UX guidelines)
  const debouncedSearch = useDebouncedCallback((value: string) => {
    onFiltersChange({
      search: value.trim() || undefined,
      offset: 0, // Reset to first page on search
    } as unknown as Partial<T>);
  }, 300);

  // Handle search input changes
  useEffect(() => {
    debouncedSearch(searchValue);
  }, [searchValue, debouncedSearch]);

  // Sync with external filter changes
  useEffect(() => {
    if (filters.search !== searchValue) {
      setSearchValue((filters.search as string) || '');
    }
  }, [filters.search]);

  const handleFilterChange = (key: keyof T, value: string) => {
    // Parse boolean values from string
    let parsedValue: any = value;
    if (value === 'true') parsedValue = true;
    if (value === 'false') parsedValue = false;
    if (value === '') parsedValue = undefined;

    onFiltersChange({
      [key]: parsedValue,
      offset: 0, // Reset to first page on filter change
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
      // Default clear behavior - reset all filters
      const clearedFilters = Object.keys(filters).reduce((acc, key) => {
        return { ...acc, [key]: undefined };
      }, {} as Partial<T>);
      onFiltersChange(clearedFilters);
    }
  };

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) =>
      key !== 'limit' &&
      key !== 'offset' &&
      key !== 'sort_by' &&
      key !== 'sort_order' &&
      value !== undefined &&
      value !== ''
  );

  // Get active filter tags
  const getActiveFilterTags = () => {
    const tags: Array<{ key: string; label: string; value: any }> = [];

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
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Main filter row */}
      <div className="flex items-center gap-3">
        {/* Search input */}
        <div className="flex-1">
          <Input
            type="search"
            placeholder={config.searchPlaceholder || 'Search...'}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            leftIcon={<SearchIcon size={16} aria-hidden="true" />}
            className="w-full"
          />
        </div>

        {/* Filter dropdowns */}
        {config.filterOptions?.map((filterOption) => (
          <div key={String(filterOption.key)} className="w-48">
            <Select
              value={String(filters[filterOption.key] || '')}
              onChange={(value) => handleFilterChange(filterOption.key, value)}
              options={filterOption.options}
              placeholder={filterOption.label}
            />
          </div>
        ))}

        {/* Sort dropdown */}
        {config.sortOptions && (
          <div className="w-48">
            <Select
              value={`${filters.sort_by || 'created_at'}:${
                filters.sort_order || 'desc'
              }`}
              onChange={handleSortChange}
              options={config.sortOptions}
              placeholder="Sort by"
            />
          </div>
        )}

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="md"
            onClick={handleClearFilters}
            className="flex items-center gap-2"
          >
            <CloseIcon size={16} aria-hidden="true" />
            <span>Clear</span>
          </Button>
        )}
      </div>

      {/* Active filters tags */}
      {(searchValue || activeTags.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-secondary">Active filters:</span>

          {/* Search tag */}
          {searchValue && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-sm text-sm">
              Search: "{searchValue}"
              <button
                onClick={() => setSearchValue('')}
                className="ml-1 hover:text-primary"
                aria-label="Remove search filter"
              >
                ×
              </button>
            </span>
          )}

          {/* Filter tags */}
          {activeTags.map((tag) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-sm text-sm"
            >
              {tag.label}: {tag.value}
              <button
                onClick={() => handleFilterChange(tag.key as keyof T, '')}
                className="ml-1 hover:text-primary"
                aria-label={`Remove ${tag.label} filter`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

