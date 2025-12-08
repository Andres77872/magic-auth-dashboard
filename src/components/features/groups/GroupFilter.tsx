import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <Input
          type="search"
          placeholder="Search groups by name or description..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          fullWidth
        />
      </div>
      
      <div className="w-full sm:w-48">
        <Select
          value={currentSortValue}
          onValueChange={(value) => {
            const [sort_by, sort_order] = value.split(':');
            onFiltersChange({ sort_by, sort_order: sort_order as 'asc' | 'desc' });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button
        variant="outline"
        onClick={onClear}
        disabled={!hasActiveFilters}
      >
        <X className="h-4 w-4" />
        Clear Filters
      </Button>
    </div>
  );
}; 