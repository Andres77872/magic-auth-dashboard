import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Input } from './Input';
import { SearchIcon } from '@/components/icons';

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
  debounceMs?: number;
  className?: string;
}

/**
 * Standardized search bar component with built-in debouncing
 * Use this instead of creating custom search inputs
 */
export function SearchBar({
  onSearch,
  placeholder = 'Search...',
  defaultValue = '',
  debounceMs = 300,
  className = '',
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

  return (
    <div className={`search-bar ${className}`.trim()}>
      <Input
        type="search"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        leftIcon={<SearchIcon size={18} aria-hidden="true" />}
        className="search-bar-input"
        aria-label={placeholder}
      />
      {searchValue && (
        <button
          type="button"
          onClick={handleClear}
          className="search-bar-clear"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default SearchBar;

