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
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearchChange?.(e.target.value);
  };

  const handleClearSearch = (): void => {
    onSearchChange?.('');
  };

  const handleViewModeChange = (mode: 'table' | 'grid'): void => {
    onViewModeChange?.(mode);
  };

  if (!showSearch && !showViewToggle && !actions && !filters) {
    return <></>;
  }

  return (
    <div className={cn('pb-3', className)}>
      <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {showSearch && (
            <div className="relative w-full sm:w-72 lg:w-80">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={handleSearchChange}
                className="h-8 pl-9 pr-9 text-[13px]"
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
          {filters && (
            <div className="flex flex-wrap items-center gap-2">{filters}</div>
          )}
        </div>

        {/* Actions and view toggle */}
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          {actions && <div className="flex items-center gap-2">{actions}</div>}

          {showViewToggle && (
            <TooltipProvider delayDuration={300}>
              <div
                className="inline-flex items-center rounded-md border border-border bg-secondary p-[3px]"
                role="tablist"
                aria-label="View mode"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewModeChange('table')}
                      role="tab"
                      aria-selected={viewMode === 'table'}
                      aria-controls="data-view-content"
                      className={cn(
                        'h-7 gap-1.5 rounded-[4px] px-2.5 transition-colors',
                        viewMode === 'table'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground'
                      )}
                    >
                      <Table2 className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden text-[13px] sm:inline">
                        Table
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="sm:hidden">
                    Table view
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewModeChange('grid')}
                      role="tab"
                      aria-selected={viewMode === 'grid'}
                      aria-controls="data-view-content"
                      className={cn(
                        'h-7 gap-1.5 rounded-[4px] px-2.5 transition-colors',
                        viewMode === 'grid'
                          ? 'bg-card text-foreground shadow-sm'
                          : 'text-muted-foreground'
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden text-[13px] sm:inline">Grid</span>
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
    </div>
  );
}

export default DataViewToolbar;
