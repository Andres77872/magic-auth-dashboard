import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';

interface EntityGridProps<T> {
  items: T[];
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  renderGridItem: (item: T) => React.ReactNode;
  renderListItem?: (item: T) => React.ReactNode;
  getItemKey: (item: T) => string;
  gridClassName?: string;
  listClassName?: string;
  showViewToggle?: boolean;
}

export function EntityGrid<T>({
  items,
  viewMode = 'grid',
  onViewModeChange,
  renderGridItem,
  renderListItem,
  getItemKey,
  gridClassName,
  listClassName,
  showViewToggle = true
}: EntityGridProps<T>): React.JSX.Element {
  const renderItem = viewMode === 'list' && renderListItem ? renderListItem : renderGridItem;

  return (
    <div className="space-y-4">
      {showViewToggle && onViewModeChange && (
        <div className="flex justify-end">
          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onViewModeChange('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onViewModeChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <div
        className={cn(
          viewMode === 'grid'
            ? gridClassName || 'grid gap-3 md:grid-cols-2 lg:grid-cols-3'
            : listClassName || 'flex flex-col gap-2'
        )}
      >
        {items.map((item) => (
          <React.Fragment key={getItemKey(item)}>
            {renderItem(item)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default EntityGrid;
