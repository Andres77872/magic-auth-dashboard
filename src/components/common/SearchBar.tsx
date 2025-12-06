import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input, Button } from '../primitives';
import { SearchIcon, CloseIcon } from '@/components/icons';
import { cn } from '@/utils/component-utils';

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
  debounceMs?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SearchBar({
  onSearch,
  placeholder = 'Search...',
  defaultValue = '',
  debounceMs = 300,
  className = '',
  size = 'md',
}: SearchBarProps): React.JSX.Element {
  const [searchValue, setSearchValue] = useState(defaultValue);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        onSearch(value);
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );

  useEffect(() => {
    debouncedSearch(searchValue);
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchValue, debouncedSearch]);

  const handleClear = () => {
    setSearchValue('');
    onSearch('');
  };

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <div className={cn('search-bar', `search-bar--${size}`, className)}>
      <Input
        type="search"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        leftIcon={<SearchIcon size={iconSize} aria-hidden="true" />}
        className="search-bar__input"
        aria-label={placeholder}
        size={size}
      />
      {searchValue && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="search-bar__clear"
          aria-label="Clear search"
        >
          <CloseIcon size={14} aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export default SearchBar;

