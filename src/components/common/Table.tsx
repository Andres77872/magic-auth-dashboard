import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ChevronIcon } from '@/components/icons';

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
  className?: string;
  maxHeight?: string;
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
  className = '',
  maxHeight,
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
          <ChevronIcon size="small" direction="up" />
        ) : isActive && sortState.direction === 'desc' ? (
          <ChevronIcon size="small" direction="down" />
        ) : (
          <ChevronIcon size="small" direction="up" className="inactive-sort" />
        )}
      </span>
    );
  };

  const tableClasses = [
    'table-wrapper',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={tableClasses}>
      <div 
        className="table-container table-container-dynamic"
        style={{ '--dynamic-table-height': maxHeight } as React.CSSProperties}
      >
        <table className="table">
          <thead className="table-header">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={`table-header-cell ${column.sortable ? 'table-sortable' : ''} table-align-${column.align || 'left'} table-column-dynamic`}
                  style={{ '--dynamic-column-width': column.width } as React.CSSProperties}
                  onClick={() => handleSort(column)}
                >
                  <div className="table-header-content">
                    <span>{column.header}</span>
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading ? (
              <tr className="table-loading-row">
                <td colSpan={columns.length} className="table-loading-cell">
                  <LoadingSpinner size="md" message="Loading data..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  {emptyMessage}
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