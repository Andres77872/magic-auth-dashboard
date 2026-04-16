import React from 'react';
import type { ReactNode, AriaAttributes } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { DataViewColumn, SortState } from './DataView.types';
import { ALIGN_CLASSES } from './DataView.types';

export interface DataViewTableViewProps<T> {
  // Data
  data: T[];
  columns: DataViewColumn<T>[];
  getItemKey: (item: T, index: number) => string | number;

  // Selection
  selectable: boolean;
  selectedItems: T[];
  areAllSelected: boolean;
  areSomeSelected: boolean;
  isItemSelected: (item: T) => boolean;
  isItemSelectable?: (item: T) => boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onToggleItemSelection: (item: T) => void;
  bulkActions?: ReactNode; // Rendered bulk actions bar (passed from parent)

  // Sort
  sortState: SortState<T>;
  onSort: (column: DataViewColumn<T>) => void;

  // Loading & Empty
  isLoading: boolean;
  skeletonRows: number;
  emptyMessage: string;
  emptyDescription: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;

  // Styling & Behavior
  stickyHeader: boolean;
  maxHeight?: string;
  caption?: string;
  rowClassName?: (item: T) => string;
  onRowClick?: (item: T) => void;
}

export function DataViewTableView<T extends object>({
  data,
  columns,
  getItemKey,
  selectable,
  selectedItems,
  areAllSelected,
  areSomeSelected,
  isItemSelected,
  isItemSelectable,
  onSelectAll,
  onClearSelection,
  onToggleItemSelection,
  bulkActions,
  sortState,
  onSort,
  isLoading,
  skeletonRows,
  emptyMessage,
  emptyDescription,
  emptyIcon,
  emptyAction,
  stickyHeader,
  maxHeight,
  caption,
  rowClassName,
  onRowClick,
}: DataViewTableViewProps<T>): React.JSX.Element {
  const totalColumns = selectable ? columns.length + 1 : columns.length;

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

  const renderBulkActionsBar = () => {
    if (!selectable || selectedItems.length === 0) return null;
    return bulkActions;
  };

  return (
    <div className="space-y-0">
      {renderBulkActionsBar()}
      <div className="w-full overflow-hidden rounded-lg border bg-card">
        <div
          className={cn(
            'w-full overflow-auto',
            stickyHeader && 'max-h-[600px]'
          )}
          style={maxHeight ? { maxHeight } : undefined}
        >
          <Table aria-busy={isLoading || undefined}>
            {caption && (
              <TableCaption className="sr-only">{caption}</TableCaption>
            )}
            <TableHeader
              className={cn('bg-muted/40', stickyHeader && 'sticky top-0 z-10')}
            >
              <TableRow className="hover:bg-transparent">
                {/* Selection checkbox header */}
                {selectable && (
                  <TableHead className="w-[40px] px-2">
                    <Checkbox
                      checked={areAllSelected}
                      ref={(el) => {
                        if (el) {
                          (
                            el as HTMLButtonElement & {
                              indeterminate?: boolean;
                            }
                          ).indeterminate = areSomeSelected;
                        }
                      }}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectAll();
                        } else {
                          onClearSelection();
                        }
                      }}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
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
                      aria-sort={ariaSort as AriaAttributes['aria-sort']}
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
                          onClick={() => onSort(column)}
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
                  <TableRow
                    key={`skeleton-${index}`}
                    className="hover:bg-transparent"
                  >
                    {selectable && (
                      <TableCell className="w-[40px] px-2">
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                    )}
                    {columns.map((column, colIndex) => (
                      <TableCell
                        key={column.key as string}
                        className={cn(
                          column.hideOnMobile && 'hidden md:table-cell'
                        )}
                      >
                        <Skeleton
                          className={cn(
                            'h-5',
                            colIndex === 0
                              ? 'w-3/4'
                              : colIndex === columns.length - 1
                                ? 'w-16'
                                : 'w-full'
                          )}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={totalColumns} className="h-32">
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
                data.map((row, index) => {
                  const isSelected = selectable && isItemSelected(row);
                  const canSelect = !isItemSelectable || isItemSelectable(row);
                  const customRowClass = rowClassName?.(row) ?? '';

                  return (
                    <TableRow
                      key={getItemKey(row, index)}
                      className={cn(
                        'group transition-colors',
                        isSelected && 'bg-primary/5',
                        onRowClick && 'cursor-pointer hover:bg-muted/50',
                        customRowClass
                      )}
                      onClick={(e) => {
                        // Don't trigger row click if clicking on checkbox or actions
                        if (
                          (e.target as HTMLElement).closest(
                            '[data-no-row-click]'
                          )
                        )
                          return;
                        onRowClick?.(row);
                      }}
                      data-selected={isSelected || undefined}
                    >
                      {/* Selection checkbox cell */}
                      {selectable && (
                        <TableCell className="w-[40px] px-2" data-no-row-click>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onToggleItemSelection(row)}
                            disabled={!canSelect}
                            aria-label={`Select row ${index + 1}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      )}
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default DataViewTableView;
