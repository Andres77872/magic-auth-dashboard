import React from 'react';
import type { ReactNode } from 'react';
import { Input, Button } from '../primitives';
import { SearchIcon } from '@/components/icons';
import { cn } from '@/utils/component-utils';

export interface DataViewToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  viewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
  showViewToggle?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function DataViewToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = true,
  viewMode = 'table',
  onViewModeChange,
  showViewToggle = true,
  actions,
  className = '',
}: DataViewToolbarProps): React.JSX.Element {
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
  };

  const handleViewModeChange = (mode: 'table' | 'grid') => {
    onViewModeChange?.(mode);
  };

  if (!showSearch && !showViewToggle && !actions) {
    return <></>;
  }

  return (
    <div className={cn('data-view-toolbar', className)}>
      {showSearch && (
        <div className="data-view-toolbar__search">
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
            leftIcon={<SearchIcon size={16} aria-hidden="true" />}
            className="data-view-toolbar__search-input"
            aria-label={searchPlaceholder}
          />
        </div>
      )}

      <div className="data-view-toolbar__actions">
        {actions && (
          <div className="data-view-toolbar__custom-actions">
            {actions}
          </div>
        )}

        {showViewToggle && (
          <div className="data-view-toolbar__toggle" role="group" aria-label="View mode">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('table')}
              aria-pressed={viewMode === 'table'}
              className="data-view-toolbar__toggle-btn"
            >
              Table
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
              aria-pressed={viewMode === 'grid'}
              className="data-view-toolbar__toggle-btn"
            >
              Grid
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataViewToolbar;

