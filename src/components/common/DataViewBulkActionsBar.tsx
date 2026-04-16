import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BulkAction } from './DataView.types';

export interface DataViewBulkActionsBarProps<T> {
  /** Whether selection is enabled */
  selectable: boolean;
  /** Currently selected items */
  selectedItems: T[];
  /** Callback to clear selection */
  onClearSelection: () => void;
  /** Bulk action buttons */
  bulkActions?: BulkAction<T>[];
}

export function DataViewBulkActionsBar<T extends object>({
  selectable,
  selectedItems,
  onClearSelection,
  bulkActions,
}: DataViewBulkActionsBarProps<T>): React.JSX.Element | null {
  if (!selectable || selectedItems.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-primary/5 border border-primary/20 rounded-lg mb-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {selectedItems.length} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-7 px-2 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>
      {bulkActions && bulkActions.length > 0 && (
        <div className="flex items-center gap-2">
          {bulkActions.map((action) => (
            <Button
              key={action.key}
              variant={
                action.variant === 'destructive' ? 'destructive' : 'secondary'
              }
              size="sm"
              onClick={() => action.onExecute(selectedItems)}
              disabled={action.isDisabled?.(selectedItems)}
              className="h-7"
            >
              {action.icon}
              <span className="ml-1">{action.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DataViewBulkActionsBar;
