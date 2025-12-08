import React, { useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from './EmptyState';
import { DataViewToolbar } from './DataViewToolbar';

// ============================================================================
// TYPES
// ============================================================================

export interface DataViewColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => ReactNode;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
}

export interface DataViewCardProps<T> {
  item: T;
  actions?: ReactNode;
}

export type GridColumnsConfig = 1 | 2 | 3 | 4;

export interface DataViewProps<T> {
  // Data
  data: T[];
  columns: DataViewColumn<T>[];
  keyExtractor?: (item: T) => string | number;

  // View Mode
  viewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
  showViewToggle?: boolean;
  defaultViewMode?: 'table' | 'grid';

  // Grid View
  renderCard?: (item: T) => ReactNode;
  gridColumns?: {
    mobile?: GridColumnsConfig;
    tablet?: GridColumnsConfig;
    desktop?: GridColumnsConfig;
  };

  // Responsive behavior
  /** When true and renderCard is provided, shows cards on mobile and table on md+ screens */
  responsiveCardView?: boolean;
  /** Breakpoint for switching between card and table view (default: 'md') */
  responsiveBreakpoint?: 'sm' | 'md' | 'lg';

  // Search & Filter
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  enableLocalSearch?: boolean;
  searchKeys?: Array<keyof T>;

  // Toolbar
  showToolbar?: boolean;
  toolbarActions?: ReactNode;
  toolbarFilters?: ReactNode;

  // Table Behavior
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  stickyHeader?: boolean;

  // Loading & Empty States
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  skeletonRows?: number;

  // Styling
  className?: string;
  maxHeight?: string;
  caption?: string;
}

type SortState<T> = {
  key: keyof T | null;
  direction: 'asc' | 'desc';
};

// Grid column class mappings (static for Tailwind JIT)
const GRID_COLS_MOBILE: Record<GridColumnsConfig, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2',
  4: 'grid-cols-2',
};

const GRID_COLS_TABLET: Record<GridColumnsConfig, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2',
  4: 'sm:grid-cols-3',
};

const GRID_COLS_DESKTOP: Record<GridColumnsConfig, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

const ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

// ============================================================================
// DATAVIEW COMPONENT
// ============================================================================

// Responsive breakpoint classes
const RESPONSIVE_HIDE_CLASSES = {
  sm: { hideBelow: 'hidden sm:block', hideAbove: 'block sm:hidden' },
  md: { hideBelow: 'hidden md:block', hideAbove: 'block md:hidden' },
  lg: { hideBelow: 'hidden lg:block', hideAbove: 'block lg:hidden' },
} as const;

export function DataView<T extends object>({
  data,
  columns,
  keyExtractor,
  viewMode: controlledViewMode,
  onViewModeChange,
  showViewToggle = false,
  defaultViewMode = 'table',
  renderCard,
  gridColumns = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  responsiveCardView = false,
  responsiveBreakpoint = 'md',
  searchValue: controlledSearchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = false,
  enableLocalSearch = false,
  searchKeys = [],
  showToolbar = false,
  toolbarActions,
  toolbarFilters,
  onSort,
  stickyHeader = false,
  isLoading = false,
  emptyMessage = 'No data available',
  emptyDescription = '',
  emptyIcon,
  emptyAction,
  skeletonRows = 5,
  className = '',
  maxHeight,
  caption,
}: DataViewProps<T>): React.JSX.Element {
  // Internal view mode state (used when not controlled)
  const [internalViewMode, setInternalViewMode] = useState<'table' | 'grid'>(defaultViewMode);

  // Internal search state (used when local search is enabled)
  const [internalSearchValue, setInternalSearchValue] = useState('');

  // Use controlled or internal view mode
  const currentViewMode = controlledViewMode ?? internalViewMode;

  // Use controlled or internal search value
  const currentSearchValue = controlledSearchValue ?? internalSearchValue;

  // Sort state for table
  const [sortState, setSortState] = useState<SortState<T>>({
    key: null,
    direction: 'asc',
  });

  // Handle view mode change
  const handleViewModeChange = useCallback(
    (mode: 'table' | 'grid') => {
      if (onViewModeChange) {
        onViewModeChange(mode);
      } else {
        setInternalViewMode(mode);
      }
    },
    [onViewModeChange]
  );

  // Handle search change
  const handleSearchChange = useCallback(
    (value: string) => {
      if (onSearchChange) {
        onSearchChange(value);
      } else {
        setInternalSearchValue(value);
      }
    },
    [onSearchChange]
  );

  // Local search filtering
  const filteredData = useMemo(() => {
    if (!enableLocalSearch || !currentSearchValue.trim()) {
      return data;
    }

    const searchLower = currentSearchValue.toLowerCase().trim();

    return data.filter((item) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const value = item[key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchLower);
        });
      }

      return Object.values(item).some((value) => {
        if (value == null) return false;
        if (typeof value === 'string' || typeof value === 'number') {
          return String(value).toLowerCase().includes(searchLower);
        }
        return false;
      });
    });
  }, [data, enableLocalSearch, currentSearchValue, searchKeys]);

  const displayData = enableLocalSearch ? filteredData : data;

  // Handle sort
  const handleSort = useCallback(
    (column: DataViewColumn<T>) => {
      if (!column.sortable || isLoading) return;

      const newDirection =
        sortState.key === column.key && sortState.direction === 'asc' ? 'desc' : 'asc';

      setSortState({
        key: column.key,
        direction: newDirection,
      });

      onSort?.(column.key, newDirection);
    },
    [sortState, isLoading, onSort]
  );

  // Get item key
  const getItemKey = useCallback(
    (item: T, index: number): string | number => {
      if (keyExtractor) {
        return keyExtractor(item);
      }
      if ('id' in item && (typeof item.id === 'string' || typeof item.id === 'number')) {
        return item.id;
      }
      return index;
    },
    [keyExtractor]
  );

  // Get grid classes
  const getGridClasses = useMemo(() => {
    const mobile = gridColumns.mobile ?? 1;
    const tablet = gridColumns.tablet ?? 2;
    const desktop = gridColumns.desktop ?? 3;

    return cn(
      'grid gap-4 md:gap-6',
      GRID_COLS_MOBILE[mobile],
      GRID_COLS_TABLET[tablet],
      GRID_COLS_DESKTOP[desktop]
    );
  }, [gridColumns]);

  // Render sort icon
  const renderSortIcon = (column: DataViewColumn<T>) => {
    if (!column.sortable) return null;

    const isActive = sortState.key === column.key;

    if (!isActive) {
      return (
        <ChevronsUpDown
          className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/40"
          aria-hidden="true"
        />
      );
    }

    return sortState.direction === 'asc' ? (
      <ChevronUp className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
    ) : (
      <ChevronDown className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
    );
  };

  // ============================================================================
  // RENDER TABLE VIEW
  // ============================================================================
  const renderTableView = () => (
    <div className="w-full overflow-hidden rounded-lg border bg-card">
      <div
        className={cn('w-full overflow-auto', stickyHeader && 'max-h-[600px]')}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <Table aria-busy={isLoading || undefined}>
          {caption && <TableCaption className="sr-only">{caption}</TableCaption>}
          <TableHeader className={cn('bg-muted/40', stickyHeader && 'sticky top-0 z-10')}>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => {
                const isActive = sortState.key === column.key;
                const ariaSort = column.sortable
                  ? isActive
                    ? sortState.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                  : undefined;

                return (
                  <TableHead
                    key={column.key as string}
                    scope="col"
                    aria-sort={ariaSort as React.AriaAttributes['aria-sort']}
                    className={cn(
                      'whitespace-nowrap font-medium text-muted-foreground',
                      ALIGN_CLASSES[column.align ?? 'left'],
                      column.sortable && 'cursor-pointer select-none',
                      column.hideOnMobile && 'hidden md:table-cell'
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                    }}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className={cn(
                          'inline-flex items-center gap-0.5 rounded-sm px-1 -mx-1 py-0.5',
                          'transition-colors hover:text-foreground focus-visible:outline-none',
                          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          isActive && 'text-foreground'
                        )}
                        onClick={() => handleSort(column)}
                        aria-label={`Sort by ${column.header}, ${isActive ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'not sorted'}`}
                      >
                        {column.header}
                        {renderSortIcon(column)}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                  {columns.map((column, colIndex) => (
                    <TableCell
                      key={column.key as string}
                      className={cn(column.hideOnMobile && 'hidden md:table-cell')}
                    >
                      <Skeleton
                        className={cn(
                          'h-5',
                          colIndex === 0 ? 'w-3/4' : colIndex === columns.length - 1 ? 'w-16' : 'w-full'
                        )}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : displayData.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-32">
                  <EmptyState
                    icon={emptyIcon ?? <FileText className="h-10 w-10" />}
                    title={emptyMessage}
                    description={emptyDescription}
                    action={emptyAction}
                    size="sm"
                  />
                </TableCell>
              </TableRow>
            ) : (
              displayData.map((row, index) => (
                <TableRow key={getItemKey(row, index)} className="group">
                  {columns.map((column) => (
                    <TableCell
                      key={column.key as string}
                      className={cn(
                        ALIGN_CLASSES[column.align ?? 'left'],
                        column.hideOnMobile && 'hidden md:table-cell'
                      )}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER GRID VIEW
  // ============================================================================
  const renderGridView = () => {
    if (!renderCard) {
      return (
        <Card className="flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">
            Grid view requires a <code className="text-xs bg-muted px-1 py-0.5 rounded">renderCard</code> function
          </p>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <div className={getGridClasses} role="status" aria-label="Loading content">
          {Array.from({ length: skeletonRows }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-16 rounded-md" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              </div>
            </Card>
          ))}
          <span className="sr-only">Loading...</span>
        </div>
      );
    }

    if (displayData.length === 0) {
      return (
        <Card className="p-8 md:p-12">
          <EmptyState
            icon={emptyIcon ?? <FileText className="h-10 w-10" />}
            title={emptyMessage}
            description={emptyDescription}
            action={emptyAction}
          />
        </Card>
      );
    }

    return (
      <div
        className={getGridClasses}
        role="list"
        aria-label={caption ?? 'Data grid'}
        id="data-view-content"
      >
        {displayData.map((item, index) => (
          <div key={getItemKey(item, index)} role="listitem">
            {renderCard(item)}
          </div>
        ))}
      </div>
    );
  };

  // ============================================================================
  // RENDER RESPONSIVE VIEW (Cards on mobile, Table on desktop)
  // ============================================================================
  const renderResponsiveView = () => {
    if (!renderCard) {
      // Fallback to table if no card renderer
      return renderTableView();
    }

    const { hideBelow, hideAbove } = RESPONSIVE_HIDE_CLASSES[responsiveBreakpoint];

    return (
      <>
        {/* Mobile: Card View */}
        <div className={hideAbove} aria-label="Mobile card view">
          {renderGridView()}
        </div>

        {/* Desktop: Table View */}
        <div className={hideBelow} aria-label="Desktop table view">
          {renderTableView()}
        </div>
      </>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const shouldShowToolbar = showToolbar || showSearch || showViewToggle || toolbarActions || toolbarFilters;
  const useResponsiveView = responsiveCardView && renderCard;

  return (
    <div className={cn('w-full', className)}>
      {shouldShowToolbar && (
        <DataViewToolbar
          searchValue={currentSearchValue}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder}
          showSearch={showSearch}
          viewMode={currentViewMode}
          onViewModeChange={handleViewModeChange}
          showViewToggle={useResponsiveView ? false : showViewToggle}
          actions={toolbarActions}
          filters={toolbarFilters}
        />
      )}

      <div id="data-view-content" role="tabpanel" aria-label={`${currentViewMode} view`}>
        {useResponsiveView
          ? renderResponsiveView()
          : currentViewMode === 'table'
            ? renderTableView()
            : renderGridView()}
      </div>
    </div>
  );
}

export default DataView;
