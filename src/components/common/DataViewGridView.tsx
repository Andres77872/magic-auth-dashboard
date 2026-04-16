import React from 'react';
import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { EmptyState } from './EmptyState';
import type { GridColumnsConfig } from './DataView.types';
import {
  GRID_COLS_MOBILE,
  GRID_COLS_TABLET,
  GRID_COLS_DESKTOP,
} from './DataView.types';

export interface DataViewGridViewProps<T> {
  // Data
  data: T[];
  getItemKey: (item: T, index: number) => string | number;
  renderCard?: (item: T) => ReactNode;

  // Grid Layout
  gridColumns: {
    mobile?: GridColumnsConfig;
    tablet?: GridColumnsConfig;
    desktop?: GridColumnsConfig;
  };

  // Loading & Empty
  isLoading: boolean;
  skeletonRows: number;
  emptyMessage: string;
  emptyDescription: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;

  // Accessibility
  caption?: string;
}

export function DataViewGridView<T extends object>({
  data,
  getItemKey,
  renderCard,
  gridColumns,
  isLoading,
  skeletonRows,
  emptyMessage,
  emptyDescription,
  emptyIcon,
  emptyAction,
  caption,
}: DataViewGridViewProps<T>): React.JSX.Element {
  const getGridClasses = () => {
    const mobile = gridColumns.mobile ?? 1;
    const tablet = gridColumns.tablet ?? 2;
    const desktop = gridColumns.desktop ?? 3;

    return cn(
      'grid gap-4 md:gap-6',
      GRID_COLS_MOBILE[mobile],
      GRID_COLS_TABLET[tablet],
      GRID_COLS_DESKTOP[desktop]
    );
  };

  if (!renderCard) {
    return (
      <Card className="flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          Grid view requires a{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            renderCard
          </code>{' '}
          function
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div
        className={getGridClasses()}
        role="status"
        aria-label="Loading content"
      >
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

  if (data.length === 0) {
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
      className={getGridClasses()}
      role="list"
      aria-label={caption ?? 'Data grid'}
      id="data-view-content"
    >
      {data.map((item, index) => (
        <div key={getItemKey(item, index)} role="listitem">
          {renderCard(item)}
        </div>
      ))}
    </div>
  );
}

export default DataViewGridView;
