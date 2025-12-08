import React from 'react';
import type { ReactNode } from 'react';
import { Search, LayoutGrid, Table2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface DataViewToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  viewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
  showViewToggle?: boolean;
  actions?: ReactNode;
  filters?: ReactNode;
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
  filters,
  className = '',
}: DataViewToolbarProps): React.JSX.Element {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
  };

  const handleClearSearch = () => {
    onSearchChange?.('');
  };

  const handleViewModeChange = (mode: 'table' | 'grid') => {
    onViewModeChange?.(mode);
  };

  if (!showSearch && !showViewToggle && !actions && !filters) {
    return <></>;
  }

  return (
    <div className={cn('space-y-3 pb-4', className)}>
      {/* Main toolbar row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        {showSearch && (
          <div className="relative w-full sm:max-w-xs lg:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearchChange}
              className="pl-9 pr-9"
              aria-label={searchPlaceholder}
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-transparent"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        )}

        {/* Actions and view toggle */}
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          {actions && <div className="flex items-center gap-2">{actions}</div>}

          {showViewToggle && (
            <TooltipProvider delayDuration={300}>
              <div
                className="inline-flex items-center rounded-lg border bg-muted/50 p-0.5"
                role="tablist"
                aria-label="View mode"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewModeChange('table')}
                      role="tab"
                      aria-selected={viewMode === 'table'}
                      aria-controls="data-view-content"
                      className={cn(
                        'h-8 gap-1.5 px-2.5 transition-all',
                        viewMode === 'table' && 'shadow-sm'
                      )}
                    >
                      <Table2 className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline text-sm">Table</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="sm:hidden">
                    Table view
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewModeChange('grid')}
                      role="tab"
                      aria-selected={viewMode === 'grid'}
                      aria-controls="data-view-content"
                      className={cn(
                        'h-8 gap-1.5 px-2.5 transition-all',
                        viewMode === 'grid' && 'shadow-sm'
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline text-sm">Grid</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="sm:hidden">
                    Grid view
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Filters row */}
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
    </div>
  );
}

export default DataViewToolbar;

