import React from 'react';
import { Skeleton } from '../primitives';
import { cn } from '@/utils/component-utils';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = '',
  showHeader = true,
}: TableSkeletonProps): React.JSX.Element {
  return (
    <div className={cn('table-skeleton', className)} role="status" aria-label="Loading table data">
      <table className="table-skeleton__table">
        {showHeader && (
          <thead className="table-skeleton__header">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={`header-${index}`} className="table-skeleton__header-cell">
                  <Skeleton variant="text" width="80%" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="table-skeleton__body">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="table-skeleton__row">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={`cell-${rowIndex}-${colIndex}`} className="table-skeleton__cell">
                  <Skeleton variant="text" width="90%" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableSkeleton;
