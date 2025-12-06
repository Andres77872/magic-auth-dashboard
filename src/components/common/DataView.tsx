import React, { useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Skeleton } from '../primitives';
import { EmptyState } from './EmptyState';
import { DataViewToolbar } from './DataViewToolbar';
import { ChevronIcon, DocumentIcon } from '@/components/icons';

// ============================================================================
// TYPES
// ============================================================================

export interface DataViewColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataViewCardProps<T> {
  item: T;
  actions?: ReactNode;
}

export interface DataViewProps<T> {
  // Data
  data: T[];
  columns: DataViewColumn<T>[];
  
  // View Mode
  viewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
  showViewToggle?: boolean;
  defaultViewMode?: 'table' | 'grid';
  
  // Grid View
  renderCard?: (item: T) => ReactNode;
  gridColumns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  
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
  
  // Table Behavior
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  
  // Loading & Empty States
  isLoading?: boolean;
  emptyMessage?: string;
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

// ============================================================================
// DATAVIEW COMPONENT
// ============================================================================

export function DataView<T extends Record<string, any>>({
  data,
  columns,
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
  searchValue: controlledSearchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  showSearch = false,
  enableLocalSearch = false,
  searchKeys = [],
  showToolbar = false,
  toolbarActions,
  onSort,
  isLoading = false,
  emptyMessage = 'No data available',
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
  const handleViewModeChange = (mode: 'table' | 'grid') => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    if (onSearchChange) {
      // If parent provides handler, use it (controlled)
      onSearchChange(value);
    } else {
      // Otherwise update internal state (uncontrolled)
      setInternalSearchValue(value);
    }
  }, [onSearchChange]);

  // Local search filtering
  const filteredData = useMemo(() => {
    if (!enableLocalSearch || !currentSearchValue.trim()) {
      return data;
    }

    const searchLower = currentSearchValue.toLowerCase().trim();
    
    return data.filter((item) => {
      // If specific search keys provided, only search those
      if (searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const value = item[key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchLower);
        });
      }
      
      // Otherwise search all string/number fields
      return Object.values(item).some((value) => {
        if (value == null) return false;
        if (typeof value === 'string' || typeof value === 'number') {
          return String(value).toLowerCase().includes(searchLower);
        }
        return false;
      });
    });
  }, [data, enableLocalSearch, currentSearchValue, searchKeys]);

  // Use filtered data if local search is enabled
  const displayData = enableLocalSearch ? filteredData : data;

  // Handle sort
  const handleSort = (column: DataViewColumn<T>) => {
    if (!column.sortable || isLoading) return;

    const newDirection = 
      sortState.key === column.key && sortState.direction === 'asc' 
        ? 'desc' 
        : 'asc';

    setSortState({
      key: column.key,
      direction: newDirection,
    });

    onSort?.(column.key, newDirection);
  };

  const getSortIcon = (column: DataViewColumn<T>) => {
    if (!column.sortable) return null;

    const isActive = sortState.key === column.key;
    
    return (
      <span className={`table-sort-icon ${isActive ? 'table-sort-active' : ''}`}>
        {isActive && sortState.direction === 'asc' ? (
          <ChevronIcon size="sm" direction="up" />
        ) : isActive && sortState.direction === 'desc' ? (
          <ChevronIcon size="sm" direction="down" />
        ) : (
          <ChevronIcon size="sm" direction="up" className="inactive-sort" />
        )}
      </span>
    );
  };

  // Grid columns CSS class
  const gridColsClass = `data-view-grid-cols-${gridColumns.mobile} md:data-view-grid-cols-${gridColumns.tablet} lg:data-view-grid-cols-${gridColumns.desktop}`;

  // Container classes
  const containerClasses = [
    'data-view-container',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // ============================================================================
  // RENDER TABLE VIEW
  // ============================================================================
  const renderTableView = () => (
    <div className="table-wrapper">
      <div 
        className="table-container table-container-dynamic"
        style={{ '--dynamic-table-height': maxHeight } as React.CSSProperties}
      >
        <table className="table" aria-busy={isLoading || undefined}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="table-header">
            <tr>
              {columns.map((column) => {
                const isActive = sortState.key === column.key;
                const ariaSort = column.sortable
                  ? isActive
                    ? (sortState.direction === 'asc' ? 'ascending' : 'descending')
                    : 'none'
                  : undefined;
                return (
                  <th
                    key={column.key as string}
                    scope="col"
                    role={column.sortable ? 'columnheader' : undefined}
                    aria-sort={ariaSort as React.AriaAttributes['aria-sort']}
                    className={`table-header-cell ${column.sortable ? 'table-sortable' : ''} table-align-${column.align || 'left'} table-column-dynamic`}
                    style={{ '--dynamic-column-width': column.width } as React.CSSProperties}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className="table-header-button"
                        onClick={() => handleSort(column)}
                        aria-label={`Sort by ${column.header}`}
                        aria-pressed={isActive}
                      >
                        <span>{column.header}</span>
                        {getSortIcon(column)}
                      </button>
                    ) : (
                      <div className="table-header-content">
                        <span>{column.header}</span>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="table-row">
                  {columns.map((column) => (
                    <td key={column.key as string} className="table-cell">
                      <Skeleton variant="text" />
                    </td>
                  ))}
                </tr>
              ))
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  <EmptyState
                    icon={emptyIcon || <DocumentIcon size={32} />}
                    title={emptyMessage}
                    description=""
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              displayData.map((row, index) => (
                <tr key={index} className="table-row">
                  {columns.map((column) => (
                    <td
                      key={column.key as string}
                      className={`table-cell table-align-${column.align || 'left'}`}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '')
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER GRID VIEW
  // ============================================================================
  const renderGridView = () => {
    if (!renderCard) {
      return (
        <div className="data-view-error">
          <p>Grid view requires a renderCard function</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className={`data-view-grid ${gridColsClass}`}>
          {Array.from({ length: skeletonRows }).map((_, index) => (
            <div key={`skeleton-${index}`} className="data-view-grid-item">
              <Skeleton variant="card" />
            </div>
          ))}
        </div>
      );
    }

    if (displayData.length === 0) {
      return (
        <div className="data-view-empty">
          <EmptyState
            icon={emptyIcon || <DocumentIcon size={32} />}
            title={emptyMessage}
            description=""
            action={emptyAction}
          />
        </div>
      );
    }

    return (
      <div className={`data-view-grid ${gridColsClass}`}>
        {displayData.map((item, index) => (
          <div key={index} className="data-view-grid-item">
            {renderCard(item)}
          </div>
        ))}
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  // Determine if toolbar should be shown
  const shouldShowToolbar = showToolbar || showSearch || showViewToggle || toolbarActions;
  
  return (
    <div className={containerClasses}>
      {/* Unified Toolbar */}
      {shouldShowToolbar && (
        <DataViewToolbar
          searchValue={currentSearchValue}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder}
          showSearch={showSearch}
          viewMode={currentViewMode}
          onViewModeChange={handleViewModeChange}
          showViewToggle={showViewToggle}
          actions={toolbarActions}
        />
      )}

      {/* Content Area */}
      <div className="data-view-content">
        {currentViewMode === 'table' ? renderTableView() : renderGridView()}
      </div>
    </div>
  );
}

export default DataView;

