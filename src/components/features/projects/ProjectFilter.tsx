import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface ProjectFilterProps {
  filters: {
    search?: string;
  };
  onFilterChange: (filters: { search?: string }) => void;
}

export const ProjectFilter: React.FC<ProjectFilterProps> = ({
  filters,
  onFilterChange,
}) => {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange({
        ...filters,
        search: searchValue.trim() || undefined,
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue, onFilterChange]);

  // Update local state when external filters change
  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchValue('');
  };

  return (
    <div>
      <Input
        type="text"
        placeholder="Search projects by name or description..."
        value={searchValue}
        onChange={handleSearchChange}
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={
          searchValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )
        }
        fullWidth
      />
    </div>
  );
}; 