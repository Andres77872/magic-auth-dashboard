import React, { useState } from 'react';
import { Skeleton } from '../primitives';
import { EmptyState } from './EmptyState';
import { ChevronIcon, DocumentIcon } from '@/components/icons';
import { cn } from '@/utils/component-utils';

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  className?: string;
  maxHeight?: string;
  caption?: string;
  skeletonRows?: number;
}

type SortState<T> = {
  key: keyof T | null;
  direction: 'asc' | 'desc';
};

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onSort,
  isLoading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  emptyAction,
  className = '',
  maxHeight,
  caption,
  skeletonRows = 5,
}: TableProps<T>): React.JSX.Element {
  const [sortState, setSortState] = useState<SortState<T>>({
    key: null,
    direction: 'asc',
  });

  const handleSort = (column: TableColumn<T>) => {
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

  const getSortIcon = (column: TableColumn<T>) => {
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

  const tableClasses = cn('table-wrapper', className);

  return (
    <div className={tableClasses}>
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
            ) : data.length === 0 ? (
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
              data.map((row, index) => (
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
}

export default Table; 