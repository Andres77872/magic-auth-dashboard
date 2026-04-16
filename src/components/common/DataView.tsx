import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { DataViewToolbar } from './DataViewToolbar';
import { DataViewTableView } from './DataViewTableView';
import { DataViewGridView } from './DataViewGridView';
import { DataViewBulkActionsBar } from './DataViewBulkActionsBar';
import type {
  DataViewProps,
  DataViewColumn,
  SortState,
} from './DataView.types';

// ============================================================================
// DATAVIEW COMPONENT
// ============================================================================

// Responsive breakpoint classes (kept inline for simplicity)
const RESPONSIVE_HIDE_CLASSES: Record<
  'sm' | 'md' | 'lg',
  { hideBelow: string; hideAbove: string }
> = {
  sm: { hideBelow: 'hidden sm:block', hideAbove: 'block sm:hidden' },
  md: { hideBelow: 'hidden md:block', hideAbove: 'block md:hidden' },
  lg: { hideBelow: 'hidden lg:block', hideAbove: 'block lg:hidden' },
};

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
  onRowClick,
  rowClassName,
  selectable = false,
  selectedItems: controlledSelectedItems,
  onSelectionChange,
  selectionKey,
  isItemSelectable,
  bulkActions,
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
  // ============================================================================
  // STATE
  // ============================================================================

  // Internal view mode state (used when not controlled)
  const [internalViewMode, setInternalViewMode] = useState<'table' | 'grid'>(
    defaultViewMode
  );

  // Internal search state (used when local search is enabled)
  const [internalSearchValue, setInternalSearchValue] = useState('');

  // Internal selection state (used when not controlled)
  const [internalSelectedItems, setInternalSelectedItems] = useState<T[]>([]);

  // Sort state for table
  const [sortState, setSortState] = useState<SortState<T>>({
    key: null,
    direction: 'asc',
  });

  // ============================================================================
  // CONTROLLED/UNCONTROLLED RESOLUTION
  // ============================================================================

  // Use controlled or internal view mode
  const currentViewMode = controlledViewMode ?? internalViewMode;

  // Use controlled or internal search value
  const currentSearchValue = controlledSearchValue ?? internalSearchValue;

  // Use controlled or internal selected items
  const currentSelectedItems = controlledSelectedItems ?? internalSelectedItems;

  // ============================================================================
  // ITEM IDENTIFICATION
  // ============================================================================

  const getItemId = useCallback(
    (item: T): string | number => {
      if (selectionKey && item[selectionKey] !== undefined) {
        return String(item[selectionKey]);
      }
      if (keyExtractor) {
        return keyExtractor(item);
      }
      if (
        'id' in item &&
        (typeof item.id === 'string' || typeof item.id === 'number')
      ) {
        return item.id;
      }
      // Fallback to index (not ideal)
      return data.indexOf(item);
    },
    [selectionKey, keyExtractor, data]
  );

  const getItemKey = useCallback(
    (item: T, index: number): string | number => {
      if (keyExtractor) {
        return keyExtractor(item);
      }
      if (
        'id' in item &&
        (typeof item.id === 'string' || typeof item.id === 'number')
      ) {
        return item.id;
      }
      return index;
    },
    [keyExtractor]
  );

  // ============================================================================
  // SELECTION LOGIC
  // ============================================================================

  const isItemSelected = useCallback(
    (item: T): boolean => {
      const itemId = getItemId(item);
      return currentSelectedItems.some(
        (selected) => getItemId(selected) === itemId
      );
    },
    [currentSelectedItems, getItemId]
  );

  const handleSelectionChange = useCallback(
    (items: T[]) => {
      if (onSelectionChange) {
        onSelectionChange(items);
      } else {
        setInternalSelectedItems(items);
      }
    },
    [onSelectionChange]
  );

  const toggleItemSelection = useCallback(
    (item: T) => {
      if (isItemSelectable && !isItemSelectable(item)) return;

      const itemId = getItemId(item);
      const isSelected = currentSelectedItems.some(
        (selected) => getItemId(selected) === itemId
      );

      if (isSelected) {
        handleSelectionChange(
          currentSelectedItems.filter(
            (selected) => getItemId(selected) !== itemId
          )
        );
      } else {
        handleSelectionChange([...currentSelectedItems, item]);
      }
    },
    [currentSelectedItems, getItemId, handleSelectionChange, isItemSelectable]
  );

  const clearSelection = useCallback(() => {
    handleSelectionChange([]);
  }, [handleSelectionChange]);

  // ============================================================================
  // LOCAL SEARCH FILTERING
  // ============================================================================

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

  // ============================================================================
  // SELECTION STATE DERIVATIONS (depend on displayData)
  // ============================================================================

  const selectAllItems = useCallback(() => {
    const selectableItems = isItemSelectable
      ? displayData.filter(isItemSelectable)
      : displayData;
    handleSelectionChange(selectableItems);
  }, [displayData, handleSelectionChange, isItemSelectable]);

  const areAllSelected = useMemo(() => {
    if (displayData.length === 0) return false;
    const selectableItems = isItemSelectable
      ? displayData.filter(isItemSelectable)
      : displayData;
    if (selectableItems.length === 0) return false;
    return selectableItems.every((item) => isItemSelected(item));
  }, [displayData, isItemSelectable, isItemSelected]);

  const areSomeSelected = useMemo(() => {
    return currentSelectedItems.length > 0 && !areAllSelected;
  }, [currentSelectedItems.length, areAllSelected]);

  // ============================================================================
  // SORT LOGIC
  // ============================================================================

  const handleSort = useCallback(
    (column: DataViewColumn<T>) => {
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
    },
    [sortState, isLoading, onSort]
  );

  // ============================================================================
  // VIEW MODE & SEARCH CHANGE HANDLERS
  // ============================================================================

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

  // ============================================================================
  // RENDER BULK ACTIONS BAR
  // ============================================================================

  const bulkActionsBar = (
    <DataViewBulkActionsBar
      selectable={selectable}
      selectedItems={currentSelectedItems}
      onClearSelection={clearSelection}
      bulkActions={bulkActions}
    />
  );

  // ============================================================================
  // RENDER TABLE VIEW
  // ============================================================================

  const renderTableView = () => (
    <DataViewTableView
      data={displayData}
      columns={columns}
      getItemKey={getItemKey}
      selectable={selectable}
      selectedItems={currentSelectedItems}
      areAllSelected={areAllSelected}
      areSomeSelected={areSomeSelected}
      isItemSelected={isItemSelected}
      isItemSelectable={isItemSelectable}
      onSelectAll={selectAllItems}
      onClearSelection={clearSelection}
      onToggleItemSelection={toggleItemSelection}
      bulkActions={bulkActionsBar}
      sortState={sortState}
      onSort={handleSort}
      isLoading={isLoading}
      skeletonRows={skeletonRows}
      emptyMessage={emptyMessage}
      emptyDescription={emptyDescription}
      emptyIcon={emptyIcon}
      emptyAction={emptyAction}
      stickyHeader={stickyHeader}
      maxHeight={maxHeight}
      caption={caption}
      rowClassName={rowClassName}
      onRowClick={onRowClick}
    />
  );

  // ============================================================================
  // RENDER GRID VIEW
  // ============================================================================

  const renderGridView = () => (
    <DataViewGridView
      data={displayData}
      getItemKey={getItemKey}
      renderCard={renderCard}
      gridColumns={gridColumns}
      isLoading={isLoading}
      skeletonRows={skeletonRows}
      emptyMessage={emptyMessage}
      emptyDescription={emptyDescription}
      emptyIcon={emptyIcon}
      emptyAction={emptyAction}
      caption={caption}
    />
  );

  // ============================================================================
  // RENDER RESPONSIVE VIEW (Cards on mobile, Table on desktop)
  // ============================================================================

  const renderResponsiveView = () => {
    if (!renderCard) {
      // Fallback to table if no card renderer
      return renderTableView();
    }

    const { hideBelow, hideAbove } =
      RESPONSIVE_HIDE_CLASSES[responsiveBreakpoint];

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

  const shouldShowToolbar =
    showToolbar ||
    showSearch ||
    showViewToggle ||
    toolbarActions ||
    toolbarFilters;
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

      <div
        id="data-view-content"
        role="tabpanel"
        aria-label={`${currentViewMode} view`}
      >
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

// Re-export types for backward compatibility with barrel exports
export type {
  DataViewProps,
  DataViewColumn,
  DataViewCardProps,
  GridColumnsConfig,
  BulkAction,
  SortState,
} from './DataView.types';
